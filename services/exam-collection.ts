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

/** Select columns for quiz summary (lightweight, no nested data) */
const QUIZ_SUMMARY_SELECT =
    "id, title, slug, skill, featured_image, pro_user_only, tests_taken, time_minutes, question_form, source, year";

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
    const pageSize = filters.pageSize || 10;

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
        quizQuery = quizQuery.ilike("title", `%${filters.search}%`);
    }
    if (filters.questionForm) {
        // questionForm is comma-separated in DB; use ilike for partial match
        quizQuery = quizQuery.ilike(
            "question_form",
            `%${filters.questionForm}%`
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
    // Step 2: Find mock_tests containing those quizzes in practice_tests JSONB
    // Origin: WP_Query post_type=mock_test, meta_query OR practice_test_$_reading/listening
    // -----------------------------------------------------------------------
    const { data: allMockTests, error: mockError } = await supabase
        .from("mock_tests")
        .select("id, title, slug, practice_tests, created_at");

    if (mockError) throw mockError;

    // Filter mock_tests whose practice_tests reference any matched quiz
    const matchedQuizIdSet = new Set(matchedQuizIds);
    const filteredMockTests = (allMockTests ?? []).filter((mt: MockTest) =>
        mt.practice_tests.some(
            (pt) =>
                matchedQuizIdSet.has(pt.reading_test_id) ||
                matchedQuizIdSet.has(pt.listening_test_id)
        )
    );

    const filteredMockTestIds = new Set(filteredMockTests.map((mt) => mt.id));

    if (filteredMockTestIds.size === 0) {
        return buildEmptyResponse(page, pageSize);
    }

    // -----------------------------------------------------------------------
    // Step 3: Find collections containing those mock_tests (mock_test_ids overlap)
    // Origin: WP_Query post_type=mock-test-collection, meta_query LIKE mock_test_id
    // -----------------------------------------------------------------------
    const { data: allCollections, error: collError } = await supabase
        .from("mock_test_collections")
        .select("id, title, slug, mock_test_ids, featured_image, created_at");

    if (collError) throw collError;

    // Filter collections whose mock_test_ids array contains any matched mock_test
    const matchedCollections = (allCollections ?? []).filter(
        (c: MockTestCollection) =>
            c.mock_test_ids.some((mtId) => filteredMockTestIds.has(mtId))
    );

    // -----------------------------------------------------------------------
    // Step 4: Paginate collections
    // -----------------------------------------------------------------------
    const total = matchedCollections.length;
    const totalPages = Math.ceil(total / pageSize);
    const startIndex = (page - 1) * pageSize;
    const paginatedCollections = matchedCollections.slice(
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
    const quizMap = new Map<string, ExamCollectionItem>();
    // Filter out any null/undefined values that may have slipped in
    const validQuizIds = [...allQuizIdsToFetch].filter(id => id && id !== 'null');

    if (validQuizIds.length > 0) {
        const { data: quizDetails, error: detailError } = await supabase
            .from("quizzes")
            .select(QUIZ_SUMMARY_SELECT)
            .in("id", validQuizIds);

        if (detailError) throw detailError;

        for (const q of quizDetails ?? []) {
            quizMap.set(q.id, q as ExamCollectionItem);
        }
    }

    // -----------------------------------------------------------------------
    // Step 6: Build nested response grouped by reading / listening
    // Origin: Lặp qua collections → mock_tests → practice_tests → group by skill
    // -----------------------------------------------------------------------
    const readingCollections: CollectionWithExams[] = [];
    const listeningCollections: CollectionWithExams[] = [];

    for (const coll of paginatedCollections) {
        const readingExams: any[] = [];
        const listeningExams: any[] = [];

        for (const mtId of coll.mock_test_ids) {
            const mt = mockTestMap.get(mtId);
            if (!mt) continue;

            for (const pt of mt.practice_tests) {
                const readingQuiz = quizMap.get(pt.reading_test_id);
                if (readingQuiz && !readingExams.some((e) => e.id === readingQuiz.id)) {
                    readingExams.push(toExamItemWithQuizFields(readingQuiz));
                }

                const listeningQuiz = quizMap.get(pt.listening_test_id);
                if (listeningQuiz && !listeningExams.some((e) => e.id === listeningQuiz.id)) {
                    listeningExams.push(toExamItemWithQuizFields(listeningQuiz));
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
): Promise<{ collection: CollectionWithExams; reading: ExamCollectionItem[]; listening: ExamCollectionItem[] } | null> {
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
            allQuizIds.add(pt.reading_test_id);
            allQuizIds.add(pt.listening_test_id);
        }
    }

    // 4. Batch-fetch quiz summaries
    const quizMap = new Map<string, ExamCollectionItem>();
    if (allQuizIds.size > 0) {
        const { data: quizDetails, error: qError } = await supabase
            .from("quizzes")
            .select(QUIZ_SUMMARY_SELECT)
            .in("id", [...allQuizIds]);

        if (qError) throw qError;
        for (const q of quizDetails ?? []) {
            quizMap.set(q.id, q as ExamCollectionItem);
        }
    }

    // 5. Build reading / listening arrays
    const readingExams: any[] = [];
    const listeningExams: any[] = [];
    const allExams: any[] = [];

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
// Internal Helpers
// ============================================================================

/**
 * Map flat Supabase ExamCollectionItem → legacy shape with quizFields.
 * This ensures UI components can access quiz.quizFields.time etc. consistently.
 */
function toExamItemWithQuizFields(item: ExamCollectionItem) {
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
            type: ["exam", "exam"],
            time: item.time_minutes,
            passages: [],
        },
    };
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
