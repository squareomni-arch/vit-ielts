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

    // Split the search input into words so "test 28" matches "Cam 19 Test 28"
    // even if the words appear non-contiguously. Each word must match SOMEWHERE
    // (mock_test title, collection title, or contained quiz title) for the
    // mock_test to qualify.
    const searchWords = filters.search
        ? filters.search
              .split(/\s+/)
              .map((w) => sanitizeFilterValue(w))
              .filter((w) => w.length > 0)
        : [];

    // -----------------------------------------------------------------------
    // Step 1: Query quizzes matching `type` + `questionForm`. The `search`
    // filter is applied separately below — searching only quiz.title misses
    // the case where the user types "28" looking for the mock test "Test 28"
    // (whose name lives on mock_tests.title, not on the inner quizzes).
    //
    // When a `parts` filter is active we also fetch passage ids so we can
    // count them in JS and discard quizzes whose passage count is not in the
    // requested set. The passages relation is small (≤4 rows per quiz) so
    // the extra data is negligible.
    // -----------------------------------------------------------------------
    const selectColumns =
        filters.parts && filters.parts.length > 0
            ? "id, passages(id)"
            : "id";

    let quizQuery = supabase
        .from("quizzes")
        .select(selectColumns)
        .eq("status", "published")
        .neq("type", "practice");

    if (filters.type) {
        quizQuery = quizQuery.eq("type", filters.type);
    }
    if (filters.questionForm) {
        // Support comma-separated list of question-form slugs.
        // Each slug is matched with ilike (partial) against the DB column,
        // which itself stores a comma-separated list of canonical slugs.
        // Multiple slugs use OR logic: a quiz qualifies if it contains ANY.
        const forms = filters.questionForm
            .split(",")
            .map((f) => sanitizeFilterValue(f.trim()))
            .filter((f) => f.length > 0);

        if (forms.length === 1) {
            // Single value — simple ilike (backward-compatible)
            quizQuery = quizQuery.ilike("question_form", `%${forms[0]}%`);
        } else if (forms.length > 1) {
            // Multiple values — Supabase .or() with ilike filters
            const orFilter = forms
                .map((f) => `question_form.ilike.%${f}%`)
                .join(",");
            quizQuery = quizQuery.or(orFilter);
        }
    }
    if (filters.subscription === "pro") {
        quizQuery = quizQuery.eq("pro_user_only", true);
    } else if (filters.subscription === "free") {
        quizQuery = quizQuery.eq("pro_user_only", false);
    }

    const { data: matchedQuizzes, error: quizError } = await quizQuery;
    if (quizError) throw quizError;

    // Apply parts filter in JS: keep only quizzes whose passage count is in
    // the requested set. When parts is empty/undefined this is a no-op.
    const partsSet =
        filters.parts && filters.parts.length > 0
            ? new Set(filters.parts)
            : null;

    const matchedQuizIds = (matchedQuizzes ?? [])
        .filter((q: any) => {
            if (!partsSet) return true;
            const count = Array.isArray(q.passages) ? q.passages.length : 0;
            return partsSet.has(count);
        })
        .map((q: any) => q.id as string);

    // No matching quizzes (after type/questionForm) → empty response
    if (matchedQuizIds.length === 0) {
        return buildEmptyResponse(page, pageSize);
    }

    // -----------------------------------------------------------------------
    // Step 2: Find mock_tests containing those quizzes.
    //
    // Originally this called the `get_mock_tests_by_quiz_ids` RPC, which casts
    // every reading_test_id / listening_test_id to UUID inside its WHERE
    // clause. If any practice_tests entry has an empty-string id, the cast
    // throws "invalid input syntax for type uuid" and the whole call fails
    // — so a single malformed entry takes down the entire library page.
    //
    // The mock_tests table is small (a handful of rows), so we do the
    // containment filter in JS instead. Empty / null ids simply don't match
    // and the page keeps working.
    // -----------------------------------------------------------------------
    const { data: allMockTests, error: mockError } = await supabase
        .from("mock_tests")
        .select("id, title, slug, practice_tests, created_at");

    if (mockError) throw mockError;

    const matchedQuizIdSet = new Set(matchedQuizIds);
    const filteredMockTests: MockTest[] = ((allMockTests ?? []) as MockTest[]).filter((mt) =>
        Array.isArray(mt.practice_tests) &&
        mt.practice_tests.some(
            (pt) =>
                (pt?.reading_test_id && matchedQuizIdSet.has(pt.reading_test_id)) ||
                (pt?.listening_test_id && matchedQuizIdSet.has(pt.listening_test_id))
        )
    );

    let filteredMockTestIds = filteredMockTests.map((mt) => mt.id);

    if (filteredMockTestIds.length === 0) {
        return buildEmptyResponse(page, pageSize);
    }

    // -----------------------------------------------------------------------
    // Step 2.5: Apply the `search` filter across three title sources so the
    // user can find a test by typing what they actually see on screen:
    //   • mock_tests.title — e.g. "Cam 19 Test 3"
    //   • mock_test_collections.title — e.g. "[PREMIUM] Bộ Đề Thi Máy 2026"
    //   • quizzes.title — e.g. "Reading Passage 1: ..."
    // For a mock_test to qualify, EVERY word in the search must hit at least
    // one of those sources (so "test 28" finds "Cam 19 Test 28" even though
    // the title doesn't contain the substring "test 28" verbatim).
    // -----------------------------------------------------------------------
    if (searchWords.length > 0) {
        const idsPerWord: Set<string>[] = [];

        for (const word of searchWords) {
            const pattern = `%${word}%`;
            const wordMtIds = new Set<string>();

            const [mtByTitle, collByTitle, quizByTitle] = await Promise.all([
                supabase.from("mock_tests").select("id").ilike("title", pattern),
                supabase
                    .from("mock_test_collections")
                    .select("mock_test_ids")
                    .ilike("title", pattern),
                supabase
                    .from("quizzes")
                    .select("id")
                    .eq("status", "published")
                    .neq("type", "practice")
                    .ilike("title", pattern)
                    .in("id", matchedQuizIds),
            ]);

            for (const row of mtByTitle.data ?? []) {
                if (row.id) wordMtIds.add(row.id as string);
            }
            for (const row of collByTitle.data ?? []) {
                for (const id of (row as any).mock_test_ids ?? []) {
                    if (id) wordMtIds.add(id as string);
                }
            }
            const matchingQuizIds = (quizByTitle.data ?? []).map(
                (q) => q.id as string
            );
            if (matchingQuizIds.length > 0) {
                // JS filter (same reasoning as Step 2 — avoid the RPC's
                // strict UUID cast on potentially dirty practice_tests).
                const matchingQuizIdSet = new Set(matchingQuizIds);
                for (const mt of filteredMockTests) {
                    const has = mt.practice_tests?.some(
                        (pt) =>
                            (pt?.reading_test_id &&
                                matchingQuizIdSet.has(pt.reading_test_id)) ||
                            (pt?.listening_test_id &&
                                matchingQuizIdSet.has(pt.listening_test_id))
                    );
                    if (has) wordMtIds.add(mt.id);
                }
            }

            // Range expansion: if the word is purely numeric, also match
            // titles that describe a range and contain the number — e.g.
            // "(Test 21-40)" should match the search "28" because 28 falls
            // inside [21, 40]. Without this, users searching by test number
            // get nothing because individual tests aren't stored as their
            // own row; they're entries inside a mock_test's practice_tests
            // JSONB.
            const wordNumber = /^\d+$/.test(word) ? parseInt(word, 10) : null;
            if (wordNumber !== null) {
                const [allMt, allColl] = await Promise.all([
                    supabase.from("mock_tests").select("id, title"),
                    supabase
                        .from("mock_test_collections")
                        .select("mock_test_ids, title"),
                ]);
                const rangeRegex = /(\d+)\s*[-–—]\s*(\d+)/g;
                const numberInAnyRange = (title: string): boolean => {
                    for (const m of title.matchAll(rangeRegex)) {
                        const lo = Math.min(parseInt(m[1], 10), parseInt(m[2], 10));
                        const hi = Math.max(parseInt(m[1], 10), parseInt(m[2], 10));
                        if (wordNumber >= lo && wordNumber <= hi) return true;
                    }
                    return false;
                };
                for (const mt of allMt.data ?? []) {
                    if (numberInAnyRange(String((mt as any).title || ""))) {
                        wordMtIds.add(mt.id as string);
                    }
                }
                for (const coll of allColl.data ?? []) {
                    if (numberInAnyRange(String((coll as any).title || ""))) {
                        for (const id of (coll as any).mock_test_ids ?? []) {
                            if (id) wordMtIds.add(id as string);
                        }
                    }
                }
            }

            idsPerWord.push(wordMtIds);
        }

        // Intersect across all words: every word must match somewhere.
        const qualifyingMtIds = idsPerWord.reduce(
            (acc, set) => new Set([...acc].filter((id) => set.has(id))),
            idsPerWord[0]
        );

        // Intersect with the type/questionForm-filtered mock_test set so the
        // search respects the other filters (user picked academic+listening).
        filteredMockTestIds = filteredMockTestIds.filter((id) =>
            qualifyingMtIds.has(id)
        );

        if (filteredMockTestIds.length === 0) {
            return buildEmptyResponse(page, pageSize);
        }
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
