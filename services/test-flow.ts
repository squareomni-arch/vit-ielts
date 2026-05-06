/**
 * Test Flow Service — IELTS Prediction
 *
 * Handles the full test-taking lifecycle:
 * - takeTheTest: Start or resume a test (draft management)
 * - saveTestResult: Save draft answers
 * - submitTestResult: Submit + score calculation + publish
 * - getTestResult: View a single test result
 * - getUserTestHistory: Paginated history for a user
 * - getTestResultsByQuiz: Admin — all results for a quiz
 *
 * Replaces WordPress GraphQL mutations:
 * - TakeTheTest (functions.php L1471–1586)
 * - SaveTestResult (functions.php L815–866)
 * - SubmitTestResult (functions.php L939–1011)
 *
 * @see LEGACY_CODEBASE_DOCS.md#3-quiz--test-system (sections 3.2–3.4)
 * @see NEW_CODEBASE_ANALYSIS.md#6-service-functions (section 6.2)
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { isAdminRole } from "~lib/parseRoles";
import type {
    TestResult,
    PaginatedResponse,
    SkillType,
} from "./types/database";
import type { QuizWithPassages as QuizForScoring } from "./types/quiz";
import { calculateScore } from "./scoring";
import { TEST_RESULT_COLUMNS, TEST_RESULT_SUMMARY_COLUMNS } from "./lib/columns";

// ============================================================================
// Custom Error Classes
// ============================================================================

export class NotAuthenticatedError extends Error {
    constructor() {
        super("Bạn cần đăng nhập để thực hiện thao tác này.");
        this.name = "NotAuthenticatedError";
    }
}

export class ProAccessError extends Error {
    constructor() {
        super("This test is only available for PRO users.");
        this.name = "ProAccessError";
    }
}

export class TestNotFoundError extends Error {
    constructor() {
        super("Test result not found or you don't have access.");
        this.name = "TestNotFoundError";
    }
}

// ============================================================================
// Param & Result Types
// ============================================================================

export type TakeTheTestParams = {
    quizId: string;
    testPart: number[];
    testTime: number;
    testMode: string;
    retake: boolean;
};

export type TestHistoryFilters = {
    quizId?: string;
    skill?: SkillType;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    pageSize?: number;
};

/** Test result joined with quiz metadata for display */
export type TestResultWithQuiz = TestResult & {
    quizzes: {
        id: string;
        title: string;
        slug: string;
        skill: string;
        type: string;
        time_minutes: number;
        featured_image: string | null;
    };
};

// ============================================================================
// Helpers
// ============================================================================

/**
 * Get the currently authenticated user ID, or throw NotAuthenticatedError.
 */
async function requireAuth(supabase: SupabaseClient): Promise<string> {
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new NotAuthenticatedError();
    return user.id;
}

/**
 * Convert Supabase quiz response (with nested passages → questions)
 * to the QuizForScoring shape expected by calculateScore().
 *
 * The scoring engine uses types from `types/quiz.ts` which have optional
 * fields, while Supabase returns nullable fields from `types/database.ts`.
 * We sort passages and questions by sort_order, then cast to the scoring type.
 */
function toQuizForScoring(
    quizRow: Record<string, unknown>,
): QuizForScoring {
    const passages = (quizRow.passages as Array<Record<string, unknown>>) ?? [];

    // Sort passages and their nested questions by sort_order
    const sortedPassages = passages
        .sort((a, b) => ((a.sort_order as number) ?? 0) - ((b.sort_order as number) ?? 0))
        .map((p) => {
            const questions = (p.questions as Array<Record<string, unknown>>) ?? [];
            return {
                ...p,
                questions: questions.sort(
                    (a, b) => ((a.sort_order as number) ?? 0) - ((b.sort_order as number) ?? 0),
                ),
            };
        });

    return {
        id: quizRow.id,
        title: quizRow.title,
        skill: quizRow.skill,
        type: quizRow.type,
        passages: sortedPassages,
    } as unknown as QuizForScoring;
}

// ============================================================================
// 1. takeTheTest
// ============================================================================

/**
 * Start or resume a test.
 *
 * Logic:
 * 1. Check authentication
 * 2. Check Pro access (quiz.pro_user_only vs user.is_pro + expiration)
 * 3. Find existing draft (user_id + quiz_id + status=draft)
 * 4. If draft exists + !retake → return draft (resume)
 * 5. If retake → delete old draft
 * 6. Create new test_result (status=draft)
 * 7. Increment quiz.tests_taken via RPC
 *
 * @origin functions.php L1471–1586
 * @see LEGACY_CODEBASE_DOCS.md#32-luồng-bắt-đầu-làm-bài-takethetest
 */
export async function takeTheTest(
    supabase: SupabaseClient,
    params: TakeTheTestParams,
): Promise<TestResult> {
    const userId = await requireAuth(supabase);

    // Step 1: Check Pro access
    const { data: quiz, error: quizError } = await supabase
        .from("quizzes")
        .select("pro_user_only, skill")
        .eq("id", params.quizId)
        .single();

    if (quizError || !quiz) {
        throw new Error("Quiz not found.");
    }

    if (quiz.pro_user_only) {
        const { data: profile } = await supabase
            .from("users")
            .select("is_pro, pro_expiration_date, pro_skills, roles")
            .eq("id", userId)
            .single();

        const isAdmin = isAdminRole(profile?.roles);
        
        const isPro = isAdmin || (
            profile?.is_pro &&
            profile.pro_expiration_date &&
            new Date(profile.pro_expiration_date) > new Date()
        );

        if (!isPro) {
            throw new ProAccessError();
        }

        // Skill-level check: pro_skills = null means all skills (combo)
        // If pro_skills is an array, user must have access to this quiz's skill
        if (
            !isAdmin &&
            profile?.pro_skills !== null &&
            Array.isArray(profile?.pro_skills) &&
            !profile?.pro_skills.includes(quiz.skill)
        ) {
            throw new ProAccessError();
        }
    }

    // Step 2: Check existing draft
    const { data: existingDraft } = await supabase
        .from("test_results")
        .select(TEST_RESULT_COLUMNS)
        .eq("user_id", userId)
        .eq("quiz_id", params.quizId)
        .eq("status", "draft")
        .maybeSingle();

    // Resume existing draft. If admin has since changed the quiz's time
    // setting and the user hasn't started answering yet, refresh test_time
    // and clear the saved time_left so the timer reflects the new config —
    // otherwise an admin who tweaks the time can't see the change without
    // hitting "Retake".
    if (existingDraft && !params.retake) {
        const draftAnswers = (existingDraft as { answers?: { answers?: unknown[] } }).answers;
        const hasAnswers = Boolean(
            draftAnswers?.answers?.some?.(
                (a) => a !== null && a !== undefined && a !== ""
            )
        );

        if (
            !hasAnswers &&
            params.testTime != null &&
            existingDraft.test_time !== params.testTime
        ) {
            const { data: refreshed } = await supabase
                .from("test_results")
                .update({ test_time: params.testTime, time_left: null })
                .eq("id", existingDraft.id)
                .select()
                .single();
            return (refreshed ?? existingDraft) as TestResult;
        }
        return existingDraft as TestResult;
    }

    // Delete old draft before retake
    if (existingDraft && params.retake) {
        await supabase
            .from("test_results")
            .delete()
            .eq("id", existingDraft.id);
    }

    // Step 3: Create new test result (draft)
    const { data: newResult, error: insertError } = await supabase
        .from("test_results")
        .insert({
            user_id: userId,
            quiz_id: params.quizId,
            test_part: params.testPart,
            test_time: params.testTime,
            test_mode: params.testMode,
            status: "draft",
        })
        .select()
        .single();

    if (insertError || !newResult) {
        throw new Error(`Failed to create test result: ${insertError?.message ?? "unknown"}`);
    }

    // Step 4: Increment tests_taken counter via RPC
    await supabase.rpc("increment_tests_taken", {
        p_quiz_id: params.quizId,
    });

    return newResult as TestResult;
}

// ============================================================================
// 2. saveTestResult
// ============================================================================

/**
 * Save draft answers (auto-save while user is taking the test).
 *
 * @origin functions.php L815–866
 * @see LEGACY_CODEBASE_DOCS.md#33-luồng-lưu-nháp-savetestresult
 */
export async function saveTestResult(
    supabase: SupabaseClient,
    testId: string,
    answers: { answers: unknown[] },
    timeLeft: string,
): Promise<void> {
    const userId = await requireAuth(supabase);

    // Update only if draft belongs to current user
    const { error, count } = await supabase
        .from("test_results")
        .update({ answers, time_left: timeLeft })
        .eq("id", testId)
        .eq("user_id", userId)
        .eq("status", "draft");

    if (error) {
        throw new Error(`Failed to save test result: ${error.message}`);
    }

    if (count === 0) {
        throw new TestNotFoundError();
    }
}

// ============================================================================
// 3. submitTestResult
// ============================================================================

/**
 * Submit a test: calculate score and publish.
 *
 * Logic:
 * 1. Check authentication
 * 2. Get test_result + quiz data (with passages + questions)
 * 3. Call calculateScore() from scoring engine
 * 4. Update: answers, time_left, score, status="published", submitted_at
 *
 * @origin functions.php L939–1011
 * @see LEGACY_CODEBASE_DOCS.md#34-luồng-nộp-bài-submittestresult
 */
export async function submitTestResult(
    supabase: SupabaseClient,
    testId: string,
    answers: { answers: unknown[] },
    timeLeft: string,
): Promise<TestResult> {
    const userId = await requireAuth(supabase);

    // Get test result to retrieve quiz_id and test_part
    const { data: testResult, error: testError } = await supabase
        .from("test_results")
        .select("id, quiz_id, test_part")
        .eq("id", testId)
        .eq("user_id", userId)
        .single();

    if (testError || !testResult) {
        throw new TestNotFoundError();
    }

    // Get quiz with nested passages + questions for scoring
    const { data: quizData, error: quizError } = await supabase
        .from("quizzes")
        .select(`*, passages(*, questions(*))`)
        .eq("id", testResult.quiz_id)
        .single();

    if (quizError || !quizData) {
        throw new Error("Quiz not found for scoring.");
    }

    // Convert to scoring engine format and calculate score
    const quizForScoring = toQuizForScoring(quizData);
    const scoreResult = calculateScore(
        answers.answers as Parameters<typeof calculateScore>[0],
        quizForScoring,
        testResult.test_part as number[],
    );
    const score = scoreResult.score;

    // Embed score breakdown into answers JSONB for display purposes.
    // Avoids DB schema changes while enabling "X/Y câu đúng" format for Practice Tests.
    const answersWithBreakdown = {
        ...answers,
        totalCorrect: scoreResult.totalCorrect,
        totalQuestions: scoreResult.totalQuestions,
    };

    // Update test result: publish with score
    const { data: updatedResult, error: updateError } = await supabase
        .from("test_results")
        .update({
            answers: answersWithBreakdown,
            time_left: timeLeft,
            score,
            status: "published",
            submitted_at: new Date().toISOString(),
        })
        .eq("id", testId)
        .eq("user_id", userId)
        .select()
        .single();

    if (updateError || !updatedResult) {
        throw new Error(`Failed to submit test result: ${updateError?.message ?? "unknown"}`);
    }

    return updatedResult as TestResult;
}

// ============================================================================
// 4. getTestResult
// ============================================================================

/**
 * Get a single test result with quiz metadata.
 * Used for displaying test answers and reviewing results.
 */
export async function getTestResult(
    supabase: SupabaseClient,
    testId: string,
): Promise<TestResultWithQuiz | null> {
    const { data, error } = await supabase
        .from("test_results")
        .select(
            `*,
            quizzes (
                id, title, slug, skill, type, time_minutes, featured_image
            )`,
        )
        .eq("id", testId)
        .maybeSingle();

    if (error) throw error;
    return data as TestResultWithQuiz | null;
}

// ============================================================================
// 5. getUserTestHistory
// ============================================================================

/**
 * Get paginated test history for a user.
 * Only returns published (submitted) results.
 *
 * @param supabase - Supabase client instance
 * @param userId - User ID to query history for
 * @param filters - Optional filters: quizId, skill, dateRange, pagination
 * @returns Paginated list of test results with quiz metadata
 */
export async function getUserTestHistory(
    supabase: SupabaseClient,
    userId: string,
    filters: TestHistoryFilters = {},
): Promise<PaginatedResponse<TestResultWithQuiz>> {
    const page = filters.page ?? 1;
    const pageSize = Math.min(filters.pageSize ?? 10, 100);

    // PostgREST can't filter parent rows by embedded table conditions,
    // so resolve published quiz IDs upfront and use .in() on the main query.
    let publishedQuizzesQuery = supabase
        .from("quizzes")
        .select("id")
        .eq("status", "published");

    if (filters.skill) {
        publishedQuizzesQuery = publishedQuizzesQuery.eq("skill", filters.skill) as typeof publishedQuizzesQuery;
    }

    const { data: matchingQuizzes } = await publishedQuizzesQuery;
    const publishedQuizIds = (matchingQuizzes ?? []).map((q) => q.id);

    if (publishedQuizIds.length === 0) {
        return { data: [], count: 0, page, pageSize, totalPages: 0 };
    }

    let query = supabase
        .from("test_results")
        .select(
            `*,
            quizzes (
                id, title, slug, skill, type, time_minutes, featured_image
            )`,
            { count: "exact" },
        )
        .eq("user_id", userId)
        .eq("status", "published")
        .in("quiz_id", publishedQuizIds);

    // Apply filters
    if (filters.quizId) {
        query = query.eq("quiz_id", filters.quizId);
    }

    if (filters.dateFrom) {
        query = query.gte("submitted_at", filters.dateFrom);
    }

    if (filters.dateTo) {
        query = query.lte("submitted_at", filters.dateTo);
    }

    // Pagination + ordering (newest first)
    query = query
        .order("submitted_at", { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    const totalCount = count ?? 0;

    return {
        data: (data ?? []) as TestResultWithQuiz[],
        count: totalCount,
        page,
        pageSize,
        totalPages: Math.ceil(totalCount / pageSize),
    };
}

// ============================================================================
// 6. getTestResultsByQuiz
// ============================================================================

/**
 * Admin: get all published test results for a specific quiz.
 * Returns results with user info for admin review.
 *
 * @param supabase - Supabase client (should be admin/service_role for full access)
 * @param quizId - Quiz ID to query results for
 * @returns Array of test results for the given quiz
 */
export async function getTestResultsByQuiz(
    supabase: SupabaseClient,
    quizId: string,
): Promise<TestResult[]> {
    const { data, error } = await supabase
        .from("test_results")
        .select(TEST_RESULT_SUMMARY_COLUMNS)
        .eq("quiz_id", quizId)
        .eq("status", "published")
        .order("submitted_at", { ascending: false });

    if (error) throw error;
    return (data ?? []) as TestResult[];
}

// ============================================================================
// 7. cleanupOldTestResults
// ============================================================================

/**
 * Delete old test results to free storage.
 * - Published results older than 6 months (from submitted_at)
 * - Abandoned drafts older than 30 days (from created_at)
 *
 * Uses a PostgreSQL RPC function for atomic batch deletion.
 *
 * @param supabase - Supabase admin client (service_role, bypass RLS)
 * @returns Number of deleted rows
 * @see supabase/migrations/004_cleanup_test_results.sql
 */
export async function cleanupOldTestResults(
    supabase: SupabaseClient,
): Promise<number> {
    const { data, error } = await supabase.rpc("cleanup_old_test_results");

    if (error) {
        throw new Error(`Failed to cleanup old test results: ${error.message}`);
    }

    return (data as number) ?? 0;
}

