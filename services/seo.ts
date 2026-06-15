/**
 * SEO & Redirects Service
 *
 * Manages SEO global config and URL redirect rules.
 * SEO config is stored in cms_configs with section_name = "seo/global".
 * Redirects are stored in their own `redirects` table.
 */

import { SupabaseClient } from "@supabase/supabase-js";
import { readConfigOrDefault, writeConfig } from "./cms-config";
import { sanitizeFilterValue } from "./lib/sanitize";

// ─── Types ─────────────────────────────────────────────────────────────────

export type SeoGlobalConfig = {
    siteTitle: string;
    titleSuffix: string;
    defaultDescription: string;
    ogImage: string;
    robotsTxt: string;
    googleVerification: string;
    bingVerification: string;
};

export type RedirectRule = {
    id: string;
    source_path: string;
    target_path: string;
    status_code: number;
    is_active: boolean;
    hits: number;
    created_at: string;
    updated_at: string;
};

const DEFAULT_SEO_CONFIG: SeoGlobalConfig = {
    siteTitle: "Vit IELTS",
    titleSuffix: " | Vit IELTS",
    defaultDescription: "Practice IELTS Reading & Listening with realistic tests and instant scoring",
    ogImage: "/img/og-default.png",
    robotsTxt: "User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\nSitemap: https://vitielts.com/sitemap.xml",
    googleVerification: "",
    bingVerification: "",
};

// ─── SEO Config ────────────────────────────────────────────────────────────

export async function getSeoConfig(supabase: SupabaseClient): Promise<SeoGlobalConfig> {
    return readConfigOrDefault<SeoGlobalConfig>(supabase, "seo/global", DEFAULT_SEO_CONFIG);
}

export async function saveSeoConfig(supabase: SupabaseClient, config: SeoGlobalConfig): Promise<void> {
    return writeConfig(supabase, "seo/global", config);
}

// ─── Redirects ─────────────────────────────────────────────────────────────

export async function getRedirects(
    supabase: SupabaseClient,
    options: {
        search?: string;
        isActive?: boolean;
        page?: number;
        pageSize?: number;
    } = {},
): Promise<{ data: RedirectRule[]; count: number }> {
    const page = options.page || 1;
    const size = options.pageSize || 50;

    let query = supabase
        .from("redirects")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false });

    if (options.isActive !== undefined) {
        query = query.eq("is_active", options.isActive);
    }
    if (options.search) {
        const s = sanitizeFilterValue(options.search);
        if (s) {
            query = query.or(
                `source_path.ilike.%${s}%,target_path.ilike.%${s}%`,
            );
        }
    }

    query = query.range((page - 1) * size, page * size - 1);

    const { data, error, count } = await query;
    if (error) throw error;

    return { data: (data ?? []) as RedirectRule[], count: count ?? 0 };
}

export async function createRedirect(
    supabase: SupabaseClient,
    redirect: Pick<RedirectRule, "source_path" | "target_path" | "status_code">,
): Promise<RedirectRule> {
    const { data, error } = await supabase
        .from("redirects")
        .insert({
            source_path: redirect.source_path,
            target_path: redirect.target_path,
            status_code: redirect.status_code || 301,
        })
        .select()
        .single();

    if (error) throw error;
    return data as RedirectRule;
}

export async function updateRedirect(
    supabase: SupabaseClient,
    id: string,
    updates: Partial<Pick<RedirectRule, "source_path" | "target_path" | "status_code" | "is_active">>,
): Promise<void> {
    const { error } = await supabase
        .from("redirects")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id);

    if (error) throw error;
}

export async function deleteRedirect(
    supabase: SupabaseClient,
    id: string,
): Promise<void> {
    const { error } = await supabase
        .from("redirects")
        .delete()
        .eq("id", id);

    if (error) throw error;
}

/**
 * Get all active redirects (for middleware)
 * Cached at the edge — returns a flat map for O(1) lookups
 */
export async function getActiveRedirectMap(
    supabase: SupabaseClient,
): Promise<Map<string, { target: string; status: number }>> {
    const { data, error } = await supabase
        .from("redirects")
        .select("source_path, target_path, status_code")
        .eq("is_active", true);

    if (error) throw error;

    const map = new Map<string, { target: string; status: number }>();
    (data ?? []).forEach((r: { source_path: string; target_path: string; status_code: number }) => {
        map.set(r.source_path, { target: r.target_path, status: r.status_code });
    });

    return map;
}
