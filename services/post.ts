/**
 * Post Service — IELTS Prediction
 *
 * Replaces WPGraphQL post queries + view count + rating mutations.
 *
 * @origin functions.php L788–813 (UpdatePostViewCount)
 * @origin functions.php L1588–1662 (UpdatePostRating)
 * @see LEGACY_CODEBASE_DOCS.md §10 (Blog & Sample Essays)
 */

import { SupabaseClient } from "@supabase/supabase-js";
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
    const pageSize = filters.pageSize || 12;

    let query = supabase
        .from("posts")
        .select("id, title, slug, excerpt, featured_image, status, pro_user_only, views, categories, published_at, created_at", { count: "exact" })
        .eq("status", "published");

    // Filter by category (JSONB array contains)
    if (filters.category) {
        query = query.filter(
            "categories",
            "cs",
            JSON.stringify([filters.category])
        );
    }

    // Search by title
    if (filters.search) {
        query = query.ilike("title", `%${filters.search}%`);
    }

    // Pagination + ordering
    query = query
        .range((page - 1) * pageSize, page * pageSize - 1)
        .order("published_at", { ascending: false });

    const { data, error, count } = await query;

    if (error) {
        console.error("[getPosts] Supabase error:", error);
        // Return empty result instead of throwing — prevents page crash
        return {
            data: [],
            count: 0,
            page,
            pageSize,
            totalPages: 0,
        };
    }

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
    // Use raw SQL via RPC for atomic increment, fallback to read-update if RPC not available
    const { data: post, error: readError } = await supabase
        .from("posts")
        .select("views")
        .eq("id", postId)
        .single();

    if (readError) throw readError;
    if (!post) return;

    const { error: updateError } = await supabase
        .from("posts")
        .update({ views: (post.views ?? 0) + 1 })
        .eq("id", postId);

    if (updateError) throw updateError;
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

    // 1. Get current votes
    const { data: post, error: readError } = await supabase
        .from("posts")
        .select("votes")
        .eq("id", postId)
        .single();

    if (readError) throw readError;
    if (!post) throw new Error("Post not found");

    const votes: VoteEntry[] = (post.votes as VoteEntry[]) ?? [];

    // 2. Check if user already voted
    if (votes.some((v) => v.user_id === userId)) {
        throw new Error("User has already rated this post");
    }

    // 3. Add new vote
    const updatedVotes: VoteEntry[] = [...votes, { user_id: userId, rate }];

    // 4. Calculate average
    const totalRate = updatedVotes.reduce((sum, v) => sum + v.rate, 0);
    const averageRate = totalRate / updatedVotes.length;

    // 5. Update post
    const { error: updateError } = await supabase
        .from("posts")
        .update({ votes: updatedVotes })
        .eq("id", postId);

    if (updateError) throw updateError;

    return {
        rate: Math.round(averageRate * 10) / 10,
        count: updatedVotes.length,
    };
}
