/**
 * Exam Collection Service — IELTS Prediction
 *
 * Replaces exam_collections_resolve() — nested 3-level query
 * (Collection → MockTest → PracticeTest/Quiz) via Supabase.
 *
 * @origin functions.php L1819–1993 (exam_collections_resolve)
 * @see LEGACY_CODEBASE_DOCS.md §5 (Exam Collections)
 * @see NEW_CODEBASE_ANALYSIS.md §2.2 (Logic mapping)
 */

import { SupabaseClient } from "@supabase/supabase-js";
import { sanitizeFilterValue } from "./lib/sanitize";
import { readConfig } from "./cms-config";
import type {
    MockTest,
    MockTestCollection,
    ExamCollectionFilters,
    ExamCollectionItem,
    CollectionWithExams,
    ExamCollectionResponse,
    SkillType,
} from "./types/database";

// ============================================================================
// Constants
// ============================================================================

/** Select columns for quiz summary — includes passages+questions for modal UI */
const QUIZ_SUMMARY_SELECT =
    "id, title, slug, skill, type, score_type, featured_image, pro_user_only, tests_taken, time_minutes, question_form, source, year, passages(id, sort_order, questions(id, type, question_text, list_of_questions, list_of_options, matching_question, matrix_question, explanations, sort_order))";

/**
 * Lightweight select for card-level listing — no heavy question JSONB.
 * Passages are fetched with count only (via count aggregation).
 * Full data is deferred to getQuizSummary() when user opens the modal.
 */
const QUIZ_LISTING_SELECT =
    "id, title, slug, skill, type, score_type, featured_image, pro_user_only, tests_taken, time_minutes, question_form, source, year, passages(id, sort_order)";

// ============================================================================
// Internal Types (shapes returned by QUIZ_SUMMARY_SELECT)
// ============================================================================

type QuestionSummary = {
    id: string;
    explanations: { content: string }[] | null;
    sort_order: number;
};

type PassageSummary = {
    id: string;
    sort_order: number;
    questions: any[];
};

/** Shape returned by Supabase for QUIZ_SUMMARY_SELECT */
type QuizSummaryRow = ExamCollectionItem & {
    type: string;
    score_type: string | null;
    passages: PassageSummary[];
};

/** Shape returned by toExamItemWithQuizFields — used in collection exams arrays */
type MappedExamItem = {
    id: string;
    title: string;
    slug: string;
    featuredImage: string | null;
    link: string;
    quizFields: {
        proUserOnly: boolean;
        testsTaken: number;
        skill: [string, string];
        type: [string, string];
        scoreType: string | null;
        time: number;
        passages: any[];
    };
};

// ============================================================================
// Public Functions
// ============================================================================

/**
 * Lấy danh sách exam collections với filters + pagination.
 * Logic nested: Collection → MockTest → PracticeTest → Quiz (reading/listening).
 *
 * Thay thế exam_collections_resolve() từ functions.php L1819–1993.
 *
 * @param supabase - Supabase client instance
 * @param filters - Bộ lọc: type, search, questionForm, page, pageSize
 * @returns ExamCollectionResponse grouped by reading/listening + pageInfo
 *
 * @origin functions.php L1819–1993
 */
export async function getExamCollections(
    supabase: SupabaseClient,
    filters: ExamCollectionFilters = {}
): Promise<ExamCollectionResponse> {
    const page = filters.page || 1;
    const pageSize = Math.min(filters.pageSize || 10, 100);

    // -----------------------------------------------------------------------
    // Step 1: Query quizzes matching filters (type != 'practice')
    // Origin: WP_Query post_type=quiz, meta_query type != practice
    // -----------------------------------------------------------------------
    let quizQuery = supabase
        .from("quizzes")
        .select("id")
        .eq("status", "published")
        .neq("type", "practice");

    if (filters.type) {
        quizQuery = quizQuery.eq("type", filters.type);
    }
    if (filters.search) {
        quizQuery = quizQuery.ilike("title", `%${sanitizeFilterValue(filters.search)}%`);
    }
    if (filters.questionForm) {
        // questionForm is comma-separated in DB; use ilike for partial match
        quizQuery = quizQuery.ilike(
            "question_form",
            `%${sanitizeFilterValue(filters.questionForm)}%`
        );
    }

    const { data: matchedQuizzes, error: quizError } = await quizQuery;
    if (quizError) throw quizError;

    const matchedQuizIds = (matchedQuizzes ?? []).map((q) => q.id as string);

    // No matching quizzes → empty response
    if (matchedQuizIds.length === 0) {
        return buildEmptyResponse(page, pageSize);
    }

    // -----------------------------------------------------------------------
    // Step 2: Find mock_tests containing those quizzes (DB-side JSONB filter)
    // Uses RPC to avoid loading ALL mock_tests into memory
    // Origin: WP_Query post_type=mock_test, meta_query OR practice_test_$_reading/listening
    // -----------------------------------------------------------------------
    const { data: filteredMockTests, error: mockError } = await supabase
        .rpc("get_mock_tests_by_quiz_ids", { p_quiz_ids: matchedQuizIds });

    if (mockError) throw mockError;

    const filteredMockTestIds = (filteredMockTests ?? []).map((mt: MockTest) => mt.id);

    if (filteredMockTestIds.length === 0) {
        return buildEmptyResponse(page, pageSize);
    }

    // -----------------------------------------------------------------------
    // Step 3: Find collections containing those mock_tests (DB-side array overlap)
    // Uses .overlaps() instead of loading ALL collections into memory
    // Origin: WP_Query post_type=mock-test-collection, meta_query LIKE mock_test_id
    // -----------------------------------------------------------------------
    const { data: matchedCollections, error: collError } = await supabase
        .from("mock_test_collections")
        .select("id, title, slug, mock_test_ids, featured_image, created_at")
        .overlaps("mock_test_ids", filteredMockTestIds);

    if (collError) throw collError;

    // -----------------------------------------------------------------------
    // Step 3.5: Apply Global Sort Order if exists
    // -----------------------------------------------------------------------
    let sortedCollections = [...(matchedCollections || [])];
    try {
        const orderConfig = await readConfig<{ collection_ids: string[] }>(
            supabase,
            "library/mock-collections-order"
        );
        const globalOrderIds = orderConfig?.collection_ids;
        
        if (globalOrderIds && Array.isArray(globalOrderIds) && globalOrderIds.length > 0) {
            sortedCollections.sort((a, b) => {
                const idxA = globalOrderIds.indexOf(a.id);
                const idxB = globalOrderIds.indexOf(b.id);
                
                // Nếu không có trong danh sách order, đẩy xuống dưới, xếp theo created_at
                if (idxA === -1 && idxB === -1) {
                   return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                }
                if (idxA === -1) return 1;
                if (idxB === -1) return -1;
                
                return idxA - idxB;
            });
        }
    } catch {
        // silent fallback to default sort
    }

    // -----------------------------------------------------------------------
    // Step 4: Paginate collections
    // -----------------------------------------------------------------------
    const total = sortedCollections.length;
    const totalPages = Math.ceil(total / pageSize);
    const startIndex = (page - 1) * pageSize;
    const paginatedCollections = sortedCollections.slice(
        startIndex,
        startIndex + pageSize
    );

    // -----------------------------------------------------------------------
    // Step 5: Resolve nested structure — collect all quiz IDs to batch-fetch
    // -----------------------------------------------------------------------
    const allQuizIdsToFetch = new Set<string>();
    const mockTestMap = new Map<string, MockTest>();

    for (const mt of filteredMockTests) {
        mockTestMap.set(mt.id, mt);
    }

    for (const coll of paginatedCollections) {
        for (const mtId of coll.mock_test_ids) {
            const mt = mockTestMap.get(mtId);
            if (!mt) continue;
            for (const pt of mt.practice_tests) {
                if (pt.reading_test_id) allQuizIdsToFetch.add(pt.reading_test_id);
                if (pt.listening_test_id) allQuizIdsToFetch.add(pt.listening_test_id);
            }
        }
    }

    // Batch-fetch quiz summaries
    const quizMap = new Map<string, QuizSummaryRow>();
    // Filter out any null/undefined values that may have slipped in
    const validQuizIds = [...allQuizIdsToFetch].filter(id => id && id !== 'null');

    if (validQuizIds.length > 0) {
        const { data: quizDetails, error: detailError } = await supabase
            .from("quizzes")
            .select(QUIZ_LISTING_SELECT)
            .in("id", validQuizIds);

        if (detailError) throw detailError;

        for (const q of quizDetails ?? []) {
            quizMap.set(q.id, q as QuizSummaryRow);
        }
    }

    // -----------------------------------------------------------------------
    // Step 6: Build nested response grouped by reading / listening
    // Origin: Loop through collections → mock_tests → practice_tests → group by skill
    // -----------------------------------------------------------------------
    const readingCollections: CollectionWithExams<MappedExamItem>[] = [];
    const listeningCollections: CollectionWithExams<MappedExamItem>[] = [];

    for (const coll of paginatedCollections) {
        const readingExams: MappedExamItem[] = [];
        const listeningExams: MappedExamItem[] = [];

        for (const mtId of coll.mock_test_ids) {
            const mt = mockTestMap.get(mtId);
            if (!mt) continue;

            for (const pt of mt.practice_tests) {
                const readingQuiz = quizMap.get(pt.reading_test_id);
                if (readingQuiz && !readingExams.some((e) => e.id === readingQuiz.id)) {
                    readingExams.push(toExamItemListing(readingQuiz));
                }

                const listeningQuiz = quizMap.get(pt.listening_test_id);
                if (listeningQuiz && !listeningExams.some((e) => e.id === listeningQuiz.id)) {
                    listeningExams.push(toExamItemListing(listeningQuiz));
                }
            }
        }

        const collectionBase = {
            id: coll.id,
            title: coll.title,
            slug: coll.slug,
            featured_image: coll.featured_image,
        };

        if (readingExams.length > 0) {
            readingCollections.push({ ...collectionBase, exams: readingExams });
        }
        if (listeningExams.length > 0) {
            listeningCollections.push({ ...collectionBase, exams: listeningExams });
        }
    }

    return {
        data: {
            reading: readingCollections,
            listening: listeningCollections,
        },
        pageInfo: {
            total,
            currentPage: page,
            totalPages,
            pageSize,
        },
    };
}

/**
 * Lấy chi tiết 1 collection theo ID, fully resolved nested structure.
 *
 * @param supabase - Supabase client instance
 * @param collectionId - UUID of the collection
 * @returns CollectionWithExams with all reading + listening quizzes, or null
 */
export async function getCollectionDetail(
    supabase: SupabaseClient,
    collectionId: string
): Promise<{ collection: CollectionWithExams<MappedExamItem>; reading: MappedExamItem[]; listening: MappedExamItem[] } | null> {
    // 1. Fetch collection
    const { data: collection, error: collError } = await supabase
        .from("mock_test_collections")
        .select("id, title, slug, mock_test_ids, featured_image, created_at")
        .eq("id", collectionId)
        .maybeSingle();

    if (collError) throw collError;
    if (!collection) return null;

    // 2. Fetch referenced mock_tests
    const { data: mockTests, error: mtError } = await supabase
        .from("mock_tests")
        .select("id, title, slug, practice_tests, created_at")
        .in("id", collection.mock_test_ids);

    if (mtError) throw mtError;

    // 3. Collect all quiz IDs
    const allQuizIds = new Set<string>();
    for (const mt of mockTests ?? []) {
        for (const pt of (mt as MockTest).practice_tests) {
            if (pt.reading_test_id) allQuizIds.add(pt.reading_test_id);
            if (pt.listening_test_id) allQuizIds.add(pt.listening_test_id);
        }
    }

    // 4. Batch-fetch quiz summaries
    const quizMap = new Map<string, QuizSummaryRow>();
    const validQuizIds = [...allQuizIds];
    if (validQuizIds.length > 0) {
        const { data: quizDetails, error: qError } = await supabase
            .from("quizzes")
            .select(QUIZ_SUMMARY_SELECT)
            .in("id", validQuizIds);

        if (qError) throw qError;
        for (const q of quizDetails ?? []) {
            quizMap.set(q.id, q as QuizSummaryRow);
        }
    }

    // 5. Build reading / listening arrays
    const readingExams: MappedExamItem[] = [];
    const listeningExams: MappedExamItem[] = [];
    const allExams: MappedExamItem[] = [];

    for (const mt of mockTests ?? []) {
        for (const pt of (mt as MockTest).practice_tests) {
            const readingQuiz = quizMap.get(pt.reading_test_id);
            if (readingQuiz && !readingExams.some((e) => e.id === readingQuiz.id)) {
                const mapped = toExamItemWithQuizFields(readingQuiz);
                readingExams.push(mapped);
                allExams.push(mapped);
            }

            const listeningQuiz = quizMap.get(pt.listening_test_id);
            if (listeningQuiz && !listeningExams.some((e) => e.id === listeningQuiz.id)) {
                const mapped = toExamItemWithQuizFields(listeningQuiz);
                listeningExams.push(mapped);
                allExams.push(mapped);
            }
        }
    }

    return {
        collection: {
            id: collection.id,
            title: collection.title,
            slug: collection.slug,
            featured_image: collection.featured_image,
            exams: allExams,
        },
        reading: readingExams,
        listening: listeningExams,
    };
}

// ============================================================================
// Internal Helpers — Listing (lightweight, no question data)
// ============================================================================

import { countQuestion } from "@/shared/lib/countQuestion";

/**
 * Map flat Supabase ExamCollectionItem → legacy shape with quizFields.
 * This ensures UI components can access quiz.quizFields.time etc. consistently.
 * Passages are mapped with questions containing explanations for question counting.
 */
/**
 * Lightweight mapper for card listings — no question data, no countQuestion().
 * Passages are mapped with sort_order only; questionCount is NOT available.
 * Use getQuizSummary() for the full data when the user opens the modal.
 */
function toExamItemListing(item: QuizSummaryRow): MappedExamItem {
    const passages = (item.passages ?? [])
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
        .map((p) => ({
            id: p.id,
            sort_order: p.sort_order,
            questions: [],
        } as any));

    return {
        id: item.id,
        title: item.title,
        slug: item.slug,
        featuredImage: item.featured_image,
        link: `/ielts-practice-library/${item.slug}`,
        quizFields: {
            proUserOnly: item.pro_user_only,
            testsTaken: item.tests_taken,
            skill: [item.skill, item.skill],
            type: [item.type ?? "exam", item.type ?? "exam"],
            scoreType: item.score_type ?? null,
            time: item.time_minutes,
            passages,
        },
    };
}

// ============================================================================
// Internal Helpers — Full (with question data, for modal)
// ============================================================================

export function toExamItemWithQuizFields(item: QuizSummaryRow): MappedExamItem {
    // Sort and map passages + questions to legacy shape expected by ExamModeModal
    const passages = (item.passages ?? [])
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
        .map((p) => {
            const tempPassage = {
                questions: (p.questions ?? [])
                    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
                    .map((q: any) => ({
                        ...q,
                        type: q.type ? [q.type] : undefined,
                        question: q.question_text,
                        matchingQuestion: q.matching_question ? {
                            layoutType: q.matching_question.layout_type,
                            summaryText: q.matching_question.summary_text,
                            matchingItems: q.matching_question.matching_items,
                        } : undefined,
                        matrixQuestion: q.matrix_question ? {
                            matrixItems: q.matrix_question.matrix_items,
                        } : undefined,
                        explanations: Array.isArray(q.explanations) ? q.explanations : [],
                    }))
            };
            const cnt = countQuestion(tempPassage);

            return {
                id: p.id,
                sort_order: p.sort_order,
                questionCount: cnt,
                questions: [], // clear heavy data to prevent UI payload bloat
            } as any;
        });


    return {
        id: item.id,
        title: item.title,
        slug: item.slug,
        featuredImage: item.featured_image,
        link: `/ielts-practice-library/${item.slug}`,
        quizFields: {
            proUserOnly: item.pro_user_only,
            testsTaken: item.tests_taken,
            skill: [item.skill, item.skill],
            type: [item.type ?? "exam", item.type ?? "exam"],
            scoreType: item.score_type ?? null,
            time: item.time_minutes,
            passages,
        },
    };
}

/**
 * Lấy chi tiết tóm tắt của 1 quiz (bao gồm passages/questions count) để hiển thị Modal.
 *
 * @param supabase - Supabase client instance
 * @param quizId - ID của quiz
 * @returns MappedExamItem hoặc null
 */
export async function getQuizSummary(
    supabase: SupabaseClient,
    quizId: string
): Promise<MappedExamItem | null> {
    const { data, error } = await supabase
        .from("quizzes")
        .select(QUIZ_SUMMARY_SELECT)
        .eq("id", quizId)
        .single();

    if (error) {
        console.error(`[getQuizSummary] Error fetching quiz ${quizId}:`, error);
        return null;
    }

    return toExamItemWithQuizFields(data as QuizSummaryRow);
}

/** Build empty response with correct pagination shape */
function buildEmptyResponse(
    page: number,
    pageSize: number
): ExamCollectionResponse {
    return {
        data: { reading: [], listening: [] },
        pageInfo: { total: 0, currentPage: page, totalPages: 0, pageSize },
    };
}

/**
 * Lấy danh sách collections theo IDs cụ thể (admin đã chọn hiển thị trang chủ).
 * Giữ nguyên thứ tự IDs admin chọn.
 *
 * @param supabase - Supabase client instance
 * @param collectionIds - Mảng UUID của các collections muốn hiển thị
 * @returns ExamCollectionResponse grouped by reading/listening
 */
export async function getExamCollectionsByIds(
    supabase: SupabaseClient,
    collectionIds: string[]
): Promise<ExamCollectionResponse> {
    if (!collectionIds || collectionIds.length === 0) {
        return buildEmptyResponse(1, collectionIds.length);
    }

    // Áp dụng Global Order cho danh sách truyền vào
    try {
        const orderConfig = await readConfig<{ collection_ids: string[] }>(
            supabase,
            "library/mock-collections-order"
        );
        const globalOrderIds = orderConfig?.collection_ids;
        if (globalOrderIds && Array.isArray(globalOrderIds) && globalOrderIds.length > 0) {
            collectionIds.sort((a, b) => {
                const idxA = globalOrderIds.indexOf(a);
                const idxB = globalOrderIds.indexOf(b);
                if (idxA === -1 && idxB === -1) return 0;
                if (idxA === -1) return 1;
                if (idxB === -1) return -1;
                return idxA - idxB;
            });
        }
    } catch {
        // silent
    }

    // Fetch tất cả details song song
    const results = await Promise.allSettled(
        collectionIds.map((id) => getCollectionDetail(supabase, id))
    );

    const readingCollections: CollectionWithExams[] = [];
    const listeningCollections: CollectionWithExams[] = [];

    for (const result of results) {
        if (result.status !== "fulfilled" || !result.value) continue;
        const { collection, reading, listening } = result.value;

        if (reading.length > 0) {
            readingCollections.push({ ...collection, exams: reading });
        }
        if (listening.length > 0) {
            listeningCollections.push({ ...collection, exams: listening });
        }
    }

    return {
        data: {
            reading: readingCollections,
            listening: listeningCollections,
        },
        pageInfo: {
            total: collectionIds.length,
            currentPage: 1,
            totalPages: 1,
            pageSize: collectionIds.length,
        },
    };
}
