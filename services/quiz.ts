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
import { QUIZ_LIST_COLUMNS } from "./lib/columns";
import type {
    Quiz,
    QuizWithPassages,
    QuizFilters,
    PaginatedResponse,
    PassageWithQuestions,
    Passage,
    Question,
    SkillType,
} from "./types/database";
let localQuizzesCache: any[] | null = null;

function getLocalQuizzes(): any[] {
    if (localQuizzesCache) return localQuizzesCache;
    if (typeof window === "undefined") {
        try {
            const fs = eval("require")("fs");
            const path = eval("require")("path");
            const filePath = path.join(process.cwd(), "data", "exported-quizzes.json");
            if (fs.existsSync(filePath)) {
                const rawData = fs.readFileSync(filePath, "utf-8");
                localQuizzesCache = JSON.parse(rawData);
                return localQuizzesCache || [];
            }
        } catch (err) {
            console.error("Failed to load local quizzes:", err);
        }
    }
    return [];
}

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
    if (process.env.NEXT_PUBLIC_MOCK_DB === "true" && typeof window === "undefined") {
        const localQuizzes = getLocalQuizzes();
        const quiz = (localQuizzes as any[]).find(
            (q) => q.slug === slug && q.status === "published"
        );
        if (!quiz) return null;

        const data = JSON.parse(JSON.stringify(quiz));
        if (data.passages) {
            data.passages.sort(
                (a: any, b: any) => a.sort_order - b.sort_order
            );
            data.passages.forEach((p: any) =>
                p.questions?.sort(
                    (a: any, b: any) => a.sort_order - b.sort_order
                )
            );
        }
        return data as QuizWithPassages;
    }

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
 * Lấy quiz theo slug cho chế độ Preview (admin).
 * Giống getQuizBySlug nhưng KHÔNG lọc theo status,
 * cho phép xem quiz ở trạng thái draft.
 *
 * @param supabase - Supabase client instance
 * @param slug - Quiz slug (unique)
 * @returns Quiz with nested passages/questions hoặc null
 */
export async function getQuizBySlugPreview(
    supabase: SupabaseClient,
    slug: string
): Promise<QuizWithPassages | null> {
    if (process.env.NEXT_PUBLIC_MOCK_DB === "true" && typeof window === "undefined") {
        const localQuizzes = getLocalQuizzes();
        const quiz = (localQuizzes as any[]).find(
            (q) => q.slug === slug
        );
        if (!quiz) return null;

        const data = JSON.parse(JSON.stringify(quiz));
        if (data.passages) {
            data.passages.sort(
                (a: any, b: any) => a.sort_order - b.sort_order
            );
            data.passages.forEach((p: any) =>
                p.questions?.sort(
                    (a: any, b: any) => a.sort_order - b.sort_order
                )
            );
        }
        return data as QuizWithPassages;
    }

    const { data, error } = await supabase
        .from("quizzes")
        .select(`*, passages(*, questions(*))`)
        .eq("slug", slug)
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
    if (process.env.NEXT_PUBLIC_MOCK_DB === "true" && typeof window === "undefined") {
        const localQuizzes = getLocalQuizzes();
        const page = filters.page || 1;
        const pageSize = Math.min(filters.pageSize || 12, 100);

        let list = (localQuizzes as any[]).filter((q) => q.status === "published");

        if (filters.skill) {
            list = list.filter((q) => q.skill === filters.skill);
        }
        if (filters.type) {
            if (filters.type === "exam" as any) {
                list = list.filter((q) => ["academic", "general"].includes(q.type));
            } else {
                list = list.filter((q) => q.type === filters.type);
            }
        }
        if (filters.year) {
            list = list.filter((q) => q.year === filters.year);
        }
        if (filters.source) {
            list = list.filter((q) => q.source === filters.source);
        }
        if (filters.quarter) {
            list = list.filter((q) => q.quarter === filters.quarter);
        }
        if (filters.part) {
            const num = parseInt(filters.part, 10);
            if (!isNaN(num) && num >= 1) {
                const variants = [
                    String(num),
                    `passage${num}`, `passage ${num}`, `passage-${num}`,
                    `task${num}`, `task ${num}`, `task-${num}`,
                    `part${num}`, `part ${num}`, `part-${num}`,
                ];
                list = list.filter((q) => {
                    if (num === 1 && (q.part === null || q.part === "0")) return true;
                    return variants.some((v) => q.part?.toLowerCase() === v.toLowerCase());
                });
            } else {
                list = list.filter((q) => q.part?.toLowerCase() === filters.part.toLowerCase());
            }
        }
        if (filters.questionForm) {
            const searchForm = filters.questionForm.toLowerCase();
            list = list.filter((q) => q.question_form?.toLowerCase().includes(searchForm));
        }
        if (filters.search) {
            const searchTitle = filters.search.toLowerCase();
            list = list.filter((q) => q.title?.toLowerCase().includes(searchTitle));
        }

        list.sort((a, b) => {
            const aPub = a.published_at ? new Date(a.published_at).getTime() : 0;
            const bPub = b.published_at ? new Date(b.published_at).getTime() : 0;
            if (bPub !== aPub) return bPub - aPub;
            return b.id.localeCompare(a.id);
        });

        const count = list.length;
        const paginatedList = list.slice((page - 1) * pageSize, page * pageSize).map((q) => {
            const { passages, ...rest } = q;
            return rest as Quiz;
        });

        return {
            data: paginatedList,
            count,
            page,
            pageSize,
            totalPages: Math.ceil(count / pageSize),
        };
    }

    const page = filters.page || 1;
    const pageSize = Math.min(filters.pageSize || 12, 100);

    let query = supabase
        .from("quizzes")
        .select(QUIZ_LIST_COLUMNS, { count: "exact" })
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
    if (filters.part) {
        // Listing cards show "Part N" via normalizeSectionBadge, which accepts
        // many CMS shapes: bare digits, "passage1", "task-2", or null (which
        // falls back to Part 1). The filter must match all of those, otherwise
        // a Part-1 card whose DB value is "passage1" or null disappears when
        // the user ticks the Part 1 checkbox.
        const num = parseInt(filters.part, 10);
        if (!isNaN(num) && num >= 1) {
            const variants = [
                String(num),
                `passage${num}`, `passage ${num}`, `passage-${num}`,
                `task${num}`, `task ${num}`, `task-${num}`,
                `part${num}`, `part ${num}`, `part-${num}`,
            ];
            const conditions = variants.map((v) => `part.ilike.${v}`);
            if (num === 1) {
                // Default fallback: missing/empty part renders as Part 1.
                conditions.push("part.is.null", "part.eq.0");
            }
            query = query.or(conditions.join(","));
        } else {
            query = query.eq("part", filters.part);
        }
    }
    if (filters.questionForm) {
        query = query.ilike("question_form", `%${sanitizeFilterValue(filters.questionForm)}%`);
    }
    if (filters.search) {
        query = query.ilike("title", `%${sanitizeFilterValue(filters.search)}%`);
    }

    // Pagination + ordering.
    // The secondary `id` sort is critical: many quizzes share the same
    // `published_at` (or it's NULL for drafts pulled in by edge cases) and
    // without a stable tiebreaker Postgres returns each tied group in
    // arbitrary order per request, which makes the same quiz show up on
    // both page 1 and page 2 of the library listing.
    query = query
        .range((page - 1) * pageSize, page * pageSize - 1)
        .order("published_at", { ascending: false, nullsFirst: false })
        .order("id", { ascending: false });

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
    if (process.env.NEXT_PUBLIC_MOCK_DB === "true" && typeof window === "undefined") {
        const localQuizzes = getLocalQuizzes();
        const yearsSet = new Set<string>();
        const sourcesSet = new Set<string>();
        const partsSet = new Set<string>();
        const quartersSet = new Set<string>();

        (localQuizzes as any[]).forEach((q) => {
            if (q.status === "published") {
                if (q.year) yearsSet.add(q.year);
                if (q.source) sourcesSet.add(q.source);
                if (q.part) partsSet.add(q.part);
                if (q.quarter) quartersSet.add(q.quarter);
            }
        });

        return {
            years: Array.from(yearsSet).sort(),
            sources: Array.from(sourcesSet).sort(),
            parts: Array.from(partsSet).sort(),
            quarters: Array.from(quartersSet).sort(),
        };
    }

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
        // RPC not deployed — fall through
    }

    // RPC not available — return empty rather than fetching all rows client-side
    return { years: [], sources: [], parts: [], quarters: [] };
}

/** meta — pass quiz.skill/source/year from the caller to skip an extra round trip. */
export async function getRelatedQuizzes(
    supabase: SupabaseClient,
    quizId: string,
    meta?: { skill: SkillType; source?: string | null; year?: string | null }
): Promise<Quiz[]> {
    if (process.env.NEXT_PUBLIC_MOCK_DB === "true" && typeof window === "undefined") {
        const localQuizzes = getLocalQuizzes();
        let currentMeta = meta;
        if (!currentMeta) {
            const current = (localQuizzes as any[]).find(q => q.id === quizId);
            if (!current) return [];
            currentMeta = { skill: current.skill, source: current.source, year: current.year };
        }

        let list = (localQuizzes as any[]).filter(
            (q) => q.status === "published" && q.id !== quizId && q.skill === currentMeta?.skill
        );

        if (currentMeta?.source) {
            list = list.filter((q) => q.source === currentMeta.source);
        }
        if (currentMeta?.year) {
            list = list.filter((q) => q.year === currentMeta.year);
        }

        return list.slice(0, 8).map((q) => {
            const { passages, ...rest } = q;
            return rest as Quiz;
        });
    }

    let currentMeta = meta;

    if (!currentMeta) {
        const { data: current, error } = await supabase
            .from("quizzes")
            .select("skill, source, year")
            .eq("id", quizId)
            .single();

        if (error || !current) return [];
        currentMeta = current as { skill: SkillType; source?: string | null; year?: string | null };
    }

    let query = supabase
        .from("quizzes")
        .select(QUIZ_LIST_COLUMNS)
        .eq("status", "published")
        .neq("id", quizId)
        .eq("skill", currentMeta.skill)
        .limit(8);

    if (currentMeta.source) query = query.eq("source", currentMeta.source);
    if (currentMeta.year) query = query.eq("year", currentMeta.year);

    const { data, error } = await query;

    if (error) throw error;

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
        start_question_number: p.start_question_number,
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

    // 1. Update quiz metadata fields (if any).
    //
    // When status transitions to "published" we also want to stamp
    // `published_at` so the listing's "Newest" sort puts the freshly-
    // published quiz at the top. The admin status quick-toggle only sends
    // `{ status }` and otherwise the column would stay NULL — that's how
    // [COM] MUFS ended up nowhere near the top of the library listing
    // even though admin had just flipped it to published.
    if (
        (quizData as Record<string, unknown>).status === "published" &&
        !("published_at" in (quizData as Record<string, unknown>))
    ) {
        const { data: existing } = await supabase
            .from("quizzes")
            .select("published_at")
            .eq("id", id)
            .maybeSingle();
        if (!existing?.published_at) {
            (quizData as Record<string, unknown>).published_at = new Date().toISOString();
        }
    }

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
            start_question_number: p.start_question_number ?? null,
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
