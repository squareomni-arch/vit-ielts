/**
 * CMS Config Service — Read/write CMS configurations
 *
 * Thay thế lib/server/admin-config-helper.ts (253 dòng → ~60 dòng)
 * Dùng bảng `cms_configs` thay cho filesystem + Vercel KV
 *
 * @see LEGACY_CODEBASE_DOCS.md#8-admin-cms
 * @see NEW_CODEBASE_ANALYSIS.md#6-3-cms-config-service
 */

import { SupabaseClient } from "@supabase/supabase-js";
import { validateCmsConfig } from "./cms-schemas";

/**
 * Đọc config từ bảng cms_configs
 *
 * @param supabase - Supabase client (browser, SSR, hoặc admin)
 * @param sectionName - Tên section (vd: "home/hero-banner", "subscription/course-packages")
 * @returns Config data typed as T, hoặc null nếu không tìm thấy
 */
export async function readConfig<T>(
    supabase: SupabaseClient,
    sectionName: string,
): Promise<T | null> {
    const { data, error } = await supabase
        .from("cms_configs")
        .select("data")
        .eq("section_name", sectionName)
        .maybeSingle();

    if (error) throw error;
    return (data?.data as T) ?? null;
}

/**
 * Đọc config với fallback mặc định nếu chưa tồn tại
 */
export async function readConfigOrDefault<T>(
    supabase: SupabaseClient,
    sectionName: string,
    defaultConfig: T,
): Promise<T> {
    const config = await readConfig<T>(supabase, sectionName);
    return config ?? defaultConfig;
}

/**
 * Ghi config vào bảng cms_configs (upsert)
 * Nếu section đã tồn tại → update, chưa tồn tại → insert
 *
 * @param supabase - Supabase client (thường dùng admin vì cần write access)
 * @param sectionName - Tên section
 * @param config - Config data
 */
export async function writeConfig<T>(
    supabase: SupabaseClient,
    sectionName: string,
    config: T,
): Promise<void> {
    const { error } = await supabase
        .from("cms_configs")
        .upsert(
            {
                section_name: sectionName,
                data: config,
                updated_at: new Date().toISOString(),
            },
            { onConflict: "section_name" },
        );

    if (error) throw error;
}

/**
 * Ghi config với Zod validation trước khi lưu.
 * Throws ZodError nếu data không hợp lệ.
 *
 * @param supabase - Supabase client
 * @param sectionName - Tên section (phải khớp key trong CMS_SECTION_SCHEMAS)
 * @param config - Config data
 */
export async function writeConfigValidated<T>(
    supabase: SupabaseClient,
    sectionName: string,
    config: T,
): Promise<void> {
    validateCmsConfig(sectionName, config);
    return writeConfig(supabase, sectionName, config);
}

/**
 * Liệt kê tất cả CMS config sections đã lưu
 */
export async function listConfigSections(
    supabase: SupabaseClient,
): Promise<{ section_name: string; updated_at: string }[]> {
    const { data, error } = await supabase
        .from("cms_configs")
        .select("section_name, updated_at")
        .order("section_name");

    if (error) throw error;
    return data ?? [];
}

