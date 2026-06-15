import { createServerSupabase } from "./server";
import { GetServerSidePropsContext } from "next";
import { MasterData } from "@/appx/providers";
import { parseRoles } from "~lib/parseRoles";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * SSR master data fetcher — replaces withMasterData.tsx
 *
 * Runs on EVERY page, so it's the hottest query path. Two load optimizations
 * (added after a bot crawl melted Supabase by triggering per-page auth + DB
 * calls):
 *
 *  1. Global data (site_settings, menus, hasBlogPosts) is identical for every
 *     visitor, so it's cached in-process for GLOBAL_TTL_MS. On a cache hit a
 *     page makes ZERO global DB queries. On refresh failure we serve the last
 *     good value (resilient during Supabase blips).
 *
 *  2. Auth is resolved WITHOUT a network call to `/auth/v1/user`:
 *     - Anonymous requests (no Supabase auth cookie) skip auth entirely — so a
 *       bot/crawler triggers no GoTrue calls at all.
 *     - Authenticated requests use getSession() (decodes the cookie the
 *       middleware already refreshed) instead of getUser() (which hit
 *       /auth/v1/user on every single page and was the source of the storm).
 *
 * @origin src/shared/hoc/withMasterData.tsx
 */

type GlobalData = {
    settingsMap: Record<string, unknown>;
    menuData: Record<string, unknown[]>;
    hasBlogPosts: boolean;
};

const GLOBAL_TTL_MS = 60_000;
let globalCache: { data: GlobalData; expires: number } | null = null;

async function getGlobalData(supabase: SupabaseClient): Promise<GlobalData> {
    const now = Date.now();
    if (globalCache && globalCache.expires > now) {
        return globalCache.data;
    }

    const [settingsResult, menusResult, blogResult] = await Promise.all([
        supabase.from("site_settings").select("key, value"),
        supabase.from("menus").select("location, items"),
        // Cheap existence check: is there ≥1 published "Blog" post? (drives the
        // Blog menu visibility)
        supabase
            .from("posts")
            .select("id")
            .filter("categories", "cs", JSON.stringify(["Blog"]))
            .eq("status", "published")
            .limit(1),
    ]);

    // If any global query failed, don't poison the cache — serve the last good
    // value if we have one, otherwise fall through with whatever came back.
    const anyError = settingsResult.error || menusResult.error || blogResult.error;
    if (anyError && globalCache) {
        return globalCache.data;
    }

    const data: GlobalData = {
        settingsMap: Object.fromEntries(
            (settingsResult.data ?? []).map((s) => [s.key, s.value])
        ),
        menuData: Object.fromEntries(
            (menusResult.data ?? []).map((m) => [m.location, m.items ?? []])
        ),
        hasBlogPosts: (blogResult.data?.length ?? 0) > 0,
    };

    if (!anyError) {
        globalCache = { data, expires: now + GLOBAL_TTL_MS };
    }
    return data;
}

/** True when the request carries a Supabase auth cookie (sb-*-auth-token). */
function hasSupabaseAuthCookie(context: GetServerSidePropsContext): boolean {
    return Object.keys(context.req.cookies ?? {}).some(
        (name) => name.startsWith("sb-") && name.includes("-auth-token")
    );
}

export async function getMasterData(context: GetServerSidePropsContext): Promise<{
    props: { masterData: MasterData };
}> {
    const supabase = createServerSupabase(context);

    // Resolve auth WITHOUT a /auth/v1/user network call. Anonymous traffic
    // (the bulk, incl. bots) skips auth completely.
    const authPromise = hasSupabaseAuthCookie(context)
        ? supabase.auth.getSession().then((r) => r.data.session?.user ?? null).catch(() => null)
        : Promise.resolve(null);

    const [user, global] = await Promise.all([authPromise, getGlobalData(supabase)]);

    // Fetch user profile only when signed in.
    let viewer: MasterData["viewer"] | null = null;
    if (user) {
        const { data: profile } = await supabase
            .from("users")
            .select("name, roles, avatar_url, is_pro, pro_expiration_date, pro_skills")
            .eq("id", user.id)
            .single();

        if (profile) {
            viewer = {
                id: user.id,
                name: profile.name ?? "",
                roles: {
                    nodes: parseRoles(profile.roles).map(
                        (name: string) => ({ name })
                    ),
                },
                userData: {
                    avatar: profile.avatar_url
                        ? {
                            node: {
                                mediaDetails: {
                                    sizes: [{ sourceUrl: profile.avatar_url, width: "96" }],
                                },
                                srcSet: profile.avatar_url,
                            },
                        }
                        : null,
                    isPro:
                        Boolean(profile.is_pro) &&
                        (profile.pro_expiration_date
                            ? new Date(profile.pro_expiration_date) > new Date()
                            : false),
                    proExpirationDate: profile.pro_expiration_date ?? null,
                    proSkills: profile.pro_skills ?? null,
                },
            };
        }
    }

    const settingsMap = global.settingsMap;
    const menuData = global.menuData;

    // Map site_settings to legacy MasterData shape
    // TODO(migration): Flatten this structure when frontend pages are migrated
    const generalSettings = (settingsMap["general_settings"] as Record<string, unknown>) ?? {};

    return {
        props: {
            masterData: {
                websiteOptions: {
                    websiteOptionsFields: {
                        generalSettings: {
                            favicon: {
                                node: {
                                    sourceUrl: (generalSettings.favicon as string) ?? "",
                                },
                            },
                            logo: {
                                node: {
                                    sourceUrl: (generalSettings.logo as string) ?? "",
                                },
                            },
                            defaultContentImage: {
                                node: {
                                    sourceUrl:
                                        (generalSettings.defaultContentImage as string) ??
                                        (generalSettings.default_content_image as string) ??
                                        "/assets/figma/icons/logo.png",
                                },
                            },
                            facebook: (generalSettings.facebook as string) ?? "",
                            email: (generalSettings.email as string) ?? "",
                            zalo: (generalSettings.zalo as string) ?? "",
                            phoneNumber: (generalSettings.phoneNumber as string) ?? "",
                            preventCopy: Boolean(generalSettings.preventCopy),
                            buyProLink: (generalSettings.buyProLink as string) ?? "",
                            bannerTestResult: generalSettings.bannerTestResult
                                ? {
                                    node: {
                                        sourceUrl: generalSettings.bannerTestResult as string,
                                    },
                                }
                                : null,
                        },
                    },
                },
                allSettings: {
                    generalSettingsTitle:
                        (settingsMap["site_title"] as string) ?? "Vit IELTS",
                },
                menuData: menuData as MasterData["menuData"],
                viewer: viewer ?? null,
                hasBlogPosts: global.hasBlogPosts,
            },
        },
    };
}
