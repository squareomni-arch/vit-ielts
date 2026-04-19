/**
 * Sample Essay Service — IELTS Prediction
 *
 * Replaces WPGraphQL sample essay queries + filter logic.
 * Supports 12 filter parameters matching the WordPress taxonomy/meta_query system.
 *
 * @origin functions.php L550–671 (graphql_post_object_connection_query_args filter)
 * @see LEGACY_CODEBASE_DOCS.md §10 (Blog & Sample Essays)
 */

import { SupabaseClient } from "@supabase/supabase-js";
import { sanitizeFilterValue } from "./lib/sanitize";
import type {
    SampleEssay,
    SampleEssayFilters,
    PaginatedResponse,
} from "./types/database";

// ============================================================================
// Public Read Functions
// ============================================================================

/** meta — pass essay.skill/source/year from the caller to skip an extra round trip. */
type EssayMeta = { skill: string | null; source?: string | null; year?: string | null };

export async function getRelatedSampleEssays(
    supabase: SupabaseClient,
    essayId: string,
    meta?: EssayMeta
): Promise<SampleEssay[]> {
    let current: EssayMeta | null = meta ?? null;

    if (!current) {
        const { data, error } = await supabase
            .from("sample_essays")
            .select("skill, source, year")
            .eq("id", essayId)
            .single();

        if (error || !data) return [];
        current = data as EssayMeta;
    }

    if (!current.skill) return [];

    // tìm bài cùng skill + source + year (best match)
    let query = supabase
        .from("sample_essays")
        .select("id, title, slug, excerpt, skill, featured_image, pro_user_only, published_at, created_at")
        .eq("status", "published")
        .neq("id", essayId)
        .eq("skill", current.skill)
        .limit(8);

    if (current.source) query = query.eq("source", current.source);
    if (current.year) query = query.eq("year", current.year);

    const { data, error: relErr } = await query.order("created_at", { ascending: false });

    if (relErr) return [];

    // Fallback: nếu không đủ, lấy thêm cùng skill
    if ((data ?? []).length >= 4) return data as SampleEssay[];

    const existingIds = new Set((data ?? []).map((e: any) => e.id));
    existingIds.add(essayId);

    const { data: fallback } = await supabase
        .from("sample_essays")
        .select("id, title, slug, excerpt, skill, featured_image, pro_user_only, published_at, created_at")
        .eq("status", "published")
        .eq("skill", current.skill)
        .not("id", "in", `(${[...existingIds].join(",")})`)
        .limit(8 - (data ?? []).length)
        .order("created_at", { ascending: false });

    return [...(data ?? []), ...(fallback ?? [])] as SampleEssay[];
}

/**
 * Lấy bài mẫu theo slug.
 * Chỉ trả về bài có status = 'published'.
 *
 * @param supabase - Supabase client instance
 * @param slug - Sample essay slug (unique)
 * @returns SampleEssay hoặc null nếu không tìm thấy
 */
export async function getSampleEssayBySlug(
    supabase: SupabaseClient,
    slug: string
): Promise<SampleEssay | null> {
    const { data, error } = await supabase
        .from("sample_essays")
        .select("*")
        .eq("slug", slug)
        .eq("status", "published")
        .single();

    if (error) {
        if (error.code === "PGRST116") return null; // Not found
        throw error;
    }

    return data as SampleEssay;
}

/**
 * Lấy danh sách bài mẫu với 12 filter params + phân trang.
 *
 * Filter mapping từ WordPress:
 *   - skill → tax_query (taxonomy=sample-essay-type) → eq("skill", ...)
 *   - part → meta_query (key=part) → eq("part", ...)
 *   - questionType → meta_query LIKE (key=question_type) → ilike("question_type", ...)
 *   - quarter → meta_query (key=quarter) → eq("quarter", ...)
 *   - year → tax_query (taxonomy=annual_period) → eq("year", ...)
 *   - source → tax_query (taxonomy=sample-source) → eq("source", ...)
 *   - topic → meta_query LIKE (key=topic) → ilike("topic", ...)
 *   - task → meta_query (key=task) → eq("task", ...)
 *   - passage → meta_query (key=passage) → eq("passage", ...)
 *   - search → s parameter → ilike("title", ...)
 *
 * @origin functions.php L550–671 (filter logic)
 *
 * @param supabase - Supabase client instance
 * @param filters - Bộ lọc sample essay (12 params)
 * @returns Paginated list of sample essays
 */
export async function getSampleEssays(
    supabase: SupabaseClient,
    filters: SampleEssayFilters = {}
): Promise<PaginatedResponse<SampleEssay>> {
    const page = filters.page || 1;
    const pageSize = Math.min(filters.pageSize || 12, 100);

    let query = supabase
        .from("sample_essays")
        .select("id, title, slug, excerpt, skill, part, question_type, quarter, year, source, topic, task, passage, featured_image, status, pro_user_only, views, published_at, created_at", { count: "exact" })
        .eq("status", "published");

    // Exact match filters
    if (filters.skill) query = query.eq("skill", filters.skill);
    if (filters.part) query = query.eq("part", filters.part);
    if (filters.quarter) query = query.eq("quarter", filters.quarter);
    if (filters.year) query = query.eq("year", filters.year);
    if (filters.source) query = query.eq("source", filters.source);
    if (filters.task) query = query.eq("task", filters.task);
    if (filters.passage) query = query.eq("passage", filters.passage);

    // LIKE match filters (partial match — mirrors WordPress meta_query LIKE)
    if (filters.questionType) {
        query = query.ilike("question_type", `%${sanitizeFilterValue(filters.questionType)}%`);
    }
    if (filters.topic) {
        query = query.ilike("topic", `%${sanitizeFilterValue(filters.topic)}%`);
    }

    // Search by title
    if (filters.search) {
        query = query.ilike("title", `%${sanitizeFilterValue(filters.search)}%`);
    }

    // Pagination + ordering
    query = query
        .range((page - 1) * pageSize, page * pageSize - 1)
        .order("created_at", { ascending: false });

    const { data, error, count } = await query;

    if (error) throw error;

    const totalCount = count ?? 0;

    return {
        data: (data ?? []) as SampleEssay[],
        count: totalCount,
        page,
        pageSize,
        totalPages: Math.ceil(totalCount / pageSize),
    };
}
