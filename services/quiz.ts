/**
 * Quiz Service — IELTS Prediction
 *
 * Replaces WPGraphQL quiz queries + bp_quiz_creator filters.
 * All functions receive SupabaseClient as first param for flexibility
 * across browser, SSR, and API route contexts.
 *
 * @origin bp_quiz_creator/index.php L192–440 (filters + CRUD)
 * @see LEGACY_CODEBASE_DOCS.md §3.1 (Data Model)
 * @see NEW_CODEBASE_ANALYSIS.md §6.1 (Quiz Service)
 */

import { SupabaseClient } from "@supabase/supabase-js";
import { sanitizeFilterValue } from "./lib/sanitize";
import type {
    Quiz,
    QuizWithPassages,
    QuizFilters,
    PaginatedResponse,
    PassageWithQuestions,
    Passage,
    Question,
} from "./types/database";

// ============================================================================
// Public Read Functions
// ============================================================================

/**
 * Lấy quiz theo slug, kèm nested passages + questions (sorted by sort_order).
 * Chỉ trả về quiz có status = 'published'.
 *
 * @param supabase - Supabase client instance
 * @param slug - Quiz slug (unique)
 * @returns Quiz with nested passages/questions hoặc null
 */
export async function getQuizBySlug(
    supabase: SupabaseClient,
    slug: string
): Promise<QuizWithPassages | null> {
    const { data, error } = await supabase
        .from("quizzes")
        .select(`*, passages(*, questions(*))`)
        .eq("slug", slug)
        .eq("status", "published")
        .single();

    if (error) {
        if (error.code === "PGRST116") return null; // Not found
        throw error;
    }

    // Sort passages + questions by sort_order
    if (data?.passages) {
        data.passages.sort(
            (a: Passage, b: Passage) => a.sort_order - b.sort_order
        );
        data.passages.forEach((p: PassageWithQuestions) =>
            p.questions?.sort(
                (a: Question, b: Question) => a.sort_order - b.sort_order
            )
        );
    }

    return data as QuizWithPassages;
}

/**
 * Lấy danh sách quiz với bộ lọc đa dạng + phân trang.
 *
 * Filters: skill, type, year, source, quarter, part, questionForm (ilike), search (title ilike).
 *
 * @origin bp_quiz_creator/index.php L192–440 (filter logic)
 *
 * @param supabase - Supabase client instance
 * @param filters - Bộ lọc quiz
 * @returns Paginated list of quizzes (without nested questions for performance)
 */
export async function getQuizzes(
    supabase: SupabaseClient,
    filters: QuizFilters = {}
): Promise<PaginatedResponse<Quiz>> {
    const page = filters.page || 1;
    const pageSize = Math.min(filters.pageSize || 12, 100);

    let query = supabase
        .from("quizzes")
        .select(
            "id, title, slug, excerpt, type, skill, time_minutes, pro_user_only, featured_image, tests_taken, source, year, quarter, part, question_form, status, views, published_at, created_at",
            { count: "exact" }
        )
        .eq("status", "published");

    // Apply filters
    if (filters.skill) query = query.eq("skill", filters.skill);
    if (filters.type) {
        if (filters.type === "exam" as any) {
            query = query.in("type", ["academic", "general"]);
        } else {
            query = query.eq("type", filters.type);
        }
    }
    if (filters.year) query = query.eq("year", filters.year);
    if (filters.source) query = query.eq("source", filters.source);
    if (filters.quarter) query = query.eq("quarter", filters.quarter);
    if (filters.part) query = query.eq("part", filters.part);
    if (filters.questionForm) {
        query = query.ilike("question_form", `%${sanitizeFilterValue(filters.questionForm)}%`);
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
        data: (data ?? []) as Quiz[],
        count: totalCount,
        page,
        pageSize,
        totalPages: Math.ceil(totalCount / pageSize),
    };
}

/**
 * Lấy các giá trị distinct cho filter dropdowns.
 * Trả về danh sách years, sources, parts, quarters có trong quizzes published.
 *
 * @param supabase - Supabase client instance
 * @returns Object chứa mảng unique values cho mỗi filter field
 */
export async function getQuizFilterOptions(supabase: SupabaseClient): Promise<{
    years: string[];
    sources: string[];
    parts: string[];
    quarters: string[];
}> {
    // Try RPC first (efficient DISTINCT at database level)
    try {
        const { data: rpcData, error: rpcError } = await supabase.rpc("get_quiz_filter_options");
        if (!rpcError && rpcData) {
            const row = Array.isArray(rpcData) ? rpcData[0] : rpcData;
            if (row) {
                return {
                    years: (row.years as string[]) || [],
                    sources: (row.sources as string[]) || [],
                    parts: (row.parts as string[]) || [],
                    quarters: (row.quarters as string[]) || [],
                };
            }
        }
    } catch {
        // RPC not deployed yet — fall through to legacy query
    }

    // Fallback: fetch all published quizzes and deduplicate client-side
    const { data, error } = await supabase
        .from("quizzes")
        .select("year, source, part, quarter")
        .eq("status", "published");

    if (error) throw error;

    const rows = data ?? [];
    const unique = (arr: (string | null)[]) =>
        [...new Set(arr.filter((v): v is string => v != null))].sort();

    return {
        years: unique(rows.map((r) => r.year)),
        sources: unique(rows.map((r) => r.source)),
        parts: unique(rows.map((r) => r.part)),
        quarters: unique(rows.map((r) => r.quarter)),
    };
}

/**
 * Tìm quiz tương tự dựa trên metadata (cùng source, year, quarter, skill).
 * Loại trừ quiz hiện tại, giới hạn 6 kết quả.
 *
 * @origin bp_quiz_creator/index.php (related quizzes logic)
 *
 * @param supabase - Supabase client instance
 * @param quizId - ID quiz hiện tại (để loại trừ)
 * @returns Mảng quiz tương tự
 */
export async function getRelatedQuizzes(
    supabase: SupabaseClient,
    quizId: string
): Promise<Quiz[]> {
    // Step 1: Get current quiz metadata
    const { data: currentQuiz, error: quizError } = await supabase
        .from("quizzes")
        .select("source, year, quarter, skill")
        .eq("id", quizId)
        .single();

    if (quizError || !currentQuiz) return [];

    // Step 2: Find quizzes with same metadata
    let query = supabase
        .from("quizzes")
        .select(
            "id, title, slug, excerpt, type, skill, time_minutes, pro_user_only, featured_image, tests_taken, source, year, quarter, part, question_form, status, views, published_at, created_at"
        )
        .eq("status", "published")
        .neq("id", quizId)
        .eq("skill", currentQuiz.skill)
        .limit(6);

    // Prioritize same source, year, quarter (best match)
    if (currentQuiz.source) query = query.eq("source", currentQuiz.source);
    if (currentQuiz.year) query = query.eq("year", currentQuiz.year);

    const { data, error } = await query;

    if (error) throw error;

    // If not enough results, fallback: same skill only (already filtered above, returns fewer results)
    return (data ?? []) as Quiz[];
}

// ============================================================================
// Admin CRUD Functions
// ============================================================================

/** Input type for creating a new quiz with nested passages + questions */
type CreateQuizInput = Omit<Quiz, "id" | "created_at" | "votes"> & {
    passages: Array<
        Omit<Passage, "id" | "quiz_id"> & {
            questions: Omit<Question, "id" | "passage_id">[];
        }
    >;
};

/**
 * Admin: Tạo quiz mới kèm passages + questions.
 * Insert quiz → insert passages → insert questions (sequential, cascade-linked).
 *
 * @param supabase - Supabase client instance (cần admin/service_role cho write)
 * @param input - Quiz data kèm nested passages/questions
 * @returns Quiz vừa tạo (with id)
 */
export async function createQuiz(
    supabase: SupabaseClient,
    input: CreateQuizInput
): Promise<QuizWithPassages> {
    const { passages: passagesInput, ...quizData } = input;

    // 1. Insert quiz
    const { data: quiz, error: quizError } = await supabase
        .from("quizzes")
        .insert(quizData)
        .select()
        .single();

    if (quizError) throw quizError;

    // 2. Insert passages
    const passagesWithQuizId = passagesInput.map((p, index) => ({
        quiz_id: quiz.id,
        title: p.title,
        content: p.content,
        sort_order: p.sort_order ?? index,
        audio_start: p.audio_start,
        audio_end: p.audio_end,
    }));

    const { data: passages, error: passageError } = await supabase
        .from("passages")
        .insert(passagesWithQuizId)
        .select();

    if (passageError) throw passageError;

    // 3. Insert questions for each passage
    const allQuestions = passagesInput.flatMap((p, pIndex) =>
        (Array.isArray(p.questions) ? p.questions : []).map((q, qIndex) => ({
            passage_id: passages[pIndex].id,
            type: q.type,
            title: q.title,
            question_text: q.question_text,
            instructions: q.instructions,
            question_form: q.question_form,
            list_of_questions: q.list_of_questions,
            list_of_options: q.list_of_options,
            matching_question: q.matching_question,
            matrix_question: q.matrix_question,
            explanations: q.explanations,
            sort_order: q.sort_order ?? qIndex,
        }))
    );

    if (allQuestions.length > 0) {
        const { error: questionError } = await supabase
            .from("questions")
            .insert(allQuestions);

        if (questionError) throw questionError;
    }

    // 4. Return created quiz with passages
    const { data: createdQuiz, error: fetchError } = await supabase
        .from("quizzes")
        .select(`*, passages(*, questions(*))`)
        .eq("id", quiz.id)
        .single();

    if (fetchError) throw fetchError;

    return createdQuiz as QuizWithPassages;
}

/** Input type for updating an existing quiz */
type UpdateQuizInput = Partial<
    Omit<Quiz, "id" | "created_at" | "votes">
> & {
    passages?: Array<
        Partial<Omit<Passage, "quiz_id">> & {
            id?: string;
            questions?: Array<Partial<Omit<Question, "passage_id">> & { id?: string }>;
        }
    >;
};

/**
 * Admin: Cập nhật quiz + optionally upsert passages/questions.
 * Strategy: Delete old passages/questions, re-insert new ones (simpler than diff-based update).
 *
 * @param supabase - Supabase client instance (cần admin/service_role cho write)
 * @param id - Quiz ID to update
 * @param input - Partial quiz data + optional passages/questions
 * @returns Updated quiz
 */
export async function updateQuiz(
    supabase: SupabaseClient,
    id: string,
    input: UpdateQuizInput
): Promise<QuizWithPassages | null> {
    const { passages: passagesInput, ...quizData } = input;

    // 1. Update quiz metadata fields (if any)
    if (Object.keys(quizData).length > 0) {
        const { error } = await supabase.from("quizzes").update(quizData).eq("id", id);
        if (error) throw error;
    }

    // 2. Replace passages + questions atomically via RPC
    //    The RPC wraps DELETE + INSERT in a single Postgres transaction,
    //    so partial failures roll back and no data is lost.
    if (passagesInput) {
        if (passagesInput.length === 0) {
            throw new Error("Cannot update quiz with empty passages array. To delete all passages, omit the passages field.");
        }

        // Build JSONB payload for the RPC
        const passagesJsonb = passagesInput.map((p, index) => ({
            title: p.title ?? null,
            content: p.content ?? null,
            sort_order: p.sort_order ?? index,
            audio_start: p.audio_start ?? null,
            audio_end: p.audio_end ?? null,
            questions: (p.questions ?? []).map((q, qIndex) => ({
                type: q.type,
                title: q.title ?? null,
                question_text: q.question_text ?? null,
                instructions: q.instructions ?? null,
                question_form: q.question_form ?? null,
                list_of_questions: q.list_of_questions ?? null,
                list_of_options: q.list_of_options ?? null,
                matching_question: q.matching_question ?? null,
                matrix_question: q.matrix_question ?? null,
                explanations: q.explanations ?? null,
                sort_order: q.sort_order ?? qIndex,
            })),
        }));

        const { error: rpcError } = await supabase.rpc("update_quiz_passages", {
            p_quiz_id: id,
            p_passages: passagesJsonb,
        });

        if (rpcError) {
            throw new Error(
                `Transactional passage update failed for quiz "${id}": ${rpcError.message}`
            );
        }
    }

    // 3. Return updated quiz
    const { data: updatedQuiz } = await supabase
        .from("quizzes")
        .select("slug")
        .eq("id", id)
        .single();

    if (!updatedQuiz) return null;

    return getQuizBySlug(supabase, updatedQuiz.slug);
}

/**
 * Admin: Xóa quiz. CASCADE tự động xóa passages + questions.
 *
 * @param supabase - Supabase client instance (cần admin/service_role cho write)
 * @param id - Quiz ID to delete
 */
export async function deleteQuiz(
    supabase: SupabaseClient,
    id: string
): Promise<void> {
    const { error } = await supabase.from("quizzes").delete().eq("id", id);

    if (error) throw error;
}
