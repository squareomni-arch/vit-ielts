import { createServerSupabase } from "./server";
import { GetServerSidePropsContext } from "next";
import { MasterData } from "@/appx/providers";
import { parseRoles } from "~lib/parseRoles";

/**
 * SSR master data fetcher — replaces withMasterData.tsx
 *
 * Queries Supabase for:
 * - Current user session + profile
 * - Site settings (websiteOptions, allSettings)
 * - Menu data
 *
 * Returns MasterData shape compatible with existing AppProvider consumers.
 *
 * @origin src/shared/hoc/withMasterData.tsx
 */
export async function getMasterData(context: GetServerSidePropsContext): Promise<{
    props: { masterData: MasterData };
}> {
    const supabase = createServerSupabase(context);

    // Parallel queries for performance
    const [userResult, settingsResult, menusResult] = await Promise.all([
        supabase.auth.getUser(),
        supabase.from("site_settings").select("key, value"),
        supabase.from("menus").select("location, items"),
    ]);

    const user = userResult.data?.user ?? null;
    const settings = settingsResult.data ?? [];
    const menus = menusResult.data ?? [];

    // Fetch user profile if signed in
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

    // Build settings map: key → value
    const settingsMap = Object.fromEntries(
        settings.map((s) => [s.key, s.value])
    );

    // Build menu map: location → items
    const menuData = Object.fromEntries(
        menus.map((m) => [m.location, m.items ?? []])
    );

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
                        (settingsMap["site_title"] as string) ?? "IELTS Prediction",
                },
                menuData,
                viewer: viewer ?? null,
            },
        },
    };
}
