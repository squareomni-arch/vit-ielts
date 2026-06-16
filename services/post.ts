/**
 * Post Service — Vit IELTS
 *
 * Replaces WPGraphQL post queries + view count + rating mutations.
 *
 * @origin functions.php L788–813 (UpdatePostViewCount)
 * @origin functions.php L1588–1662 (UpdatePostRating)
 * @see LEGACY_CODEBASE_DOCS.md §10 (Blog & Sample Essays)
 */

import { SupabaseClient } from "@supabase/supabase-js";
import { sanitizeFilterValue } from "./lib/sanitize";
import type {
    Post,
    PostFilters,
    PaginatedResponse,
    VoteEntry,
} from "./types/database";

// ============================================================================
// Public Read Functions
// ============================================================================

/**
 * Lấy bài viết theo slug.
 * Chỉ trả về bài có status = 'published'.
 *
 * @param supabase - Supabase client instance
 * @param slug - Post slug (unique)
 * @returns Post hoặc null nếu không tìm thấy
 */
export async function getPostBySlug(
    supabase: SupabaseClient,
    slug: string
): Promise<Post | null> {
    const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("slug", slug)
        .eq("status", "published")
        .single();

    if (error) {
        if (error.code === "PGRST116") return null; // Not found
        throw error;
    }

    return data as Post;
}

/**
 * Lấy danh sách bài viết với filters + phân trang.
 *
 * @param supabase - Supabase client instance
 * @param filters - Bộ lọc: category, search, page, pageSize
 * @returns Paginated list of posts
 */
export async function getPosts(
    supabase: SupabaseClient,
    filters: PostFilters = {}
): Promise<PaginatedResponse<Post>> {
    const page = filters.page || 1;
    const pageSize = Math.min(filters.pageSize || 12, 100);

    let query = supabase
        .from("posts")
        .select("id, title, slug, excerpt, featured_image, status, pro_user_only, views, categories, skill, tags, is_featured, published_at, created_at", { count: "exact" })
        .eq("status", "published");

    // Filter by category (JSONB array contains)
    if (filters.category) {
        query = query.filter(
            "categories",
            "cs",
            JSON.stringify([filters.category])
        );
    }

    // Filter by skill (listening/reading/writing/speaking)
    if (filters.skill) {
        query = query.eq("skill", filters.skill);
    }

    // Filter by tag (JSONB array contains)
    if (filters.tag) {
        query = query.filter("tags", "cs", JSON.stringify([filters.tag]));
    }

    // Featured only
    if (filters.featured) {
        query = query.eq("is_featured", true);
    }

    if (filters.search) {
        query = query.ilike("title", `%${sanitizeFilterValue(filters.search)}%`);
    }

    // Pagination + ordering
    query = query
        .range((page - 1) * pageSize, page * pageSize - 1)
        .order("published_at", { ascending: false });

    const { data, error, count } = await query;

    if (error) throw error;

    const totalCount = count ?? 0;

    return {
        data: (data ?? []) as Post[],
        count: totalCount,
        page,
        pageSize,
        totalPages: Math.ceil(totalCount / pageSize),
    };
}


// ============================================================================
// Interaction Functions
// ============================================================================

/**
 * Tăng lượt xem bài viết (atomic increment).
 *
 * @origin functions.php L788–813 (UpdatePostViewCount mutation)
 *
 * @param supabase - Supabase client instance
 * @param postId - Post ID
 */
export async function incrementViews(
    supabase: SupabaseClient,
    postId: string
): Promise<void> {
    // Atomic increment via Postgres RPC (prevents lost updates under concurrency)
    const { error } = await supabase.rpc("increment_post_views", {
        p_post_id: postId,
    });

    if (error) throw error;
}

/**
 * Đánh giá bài viết (1–5 sao). Mỗi user chỉ được vote 1 lần.
 * Lưu vote vào JSONB array `votes` trên post.
 *
 * @origin functions.php L1588–1662 (UpdatePostRating mutation)
 *
 * @param supabase - Supabase client instance
 * @param postId - Post ID
 * @param userId - User ID (auth.uid())
 * @param rate - Rating value (1–5)
 * @returns Updated rating { rate: average, count: total votes }
 */
export async function ratePost(
    supabase: SupabaseClient,
    postId: string,
    userId: string,
    rate: number
): Promise<{ rate: number; count: number }> {
    // Validate rate
    if (rate < 1 || rate > 5) {
        throw new Error("Rating must be between 1 and 5");
    }

    // Atomic: check duplicate + append vote + calculate average in one Postgres call
    // Prevents lost votes under concurrent requests
    const { data, error } = await supabase.rpc("append_post_vote", {
        p_post_id: postId,
        p_user_id: userId,
        p_rate: rate,
    });

    if (error) {
        // RPC raises exceptions for "already rated" and "not found"
        throw new Error(error.message);
    }

    const result = Array.isArray(data) ? data[0] : data;

    return {
        rate: Number(result?.avg_rate ?? 0),
        count: Number(result?.vote_count ?? 0),
    };
}
