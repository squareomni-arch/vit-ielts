/**
 * Shared Database Types — IELTS Prediction
 *
 * TypeScript types matching Supabase PostgreSQL tables.
 * All properties use snake_case to match Supabase response format.
 *
 * @see supabase/migrations/001_initial_schema.sql
 * @see NEW_CODEBASE_ANALYSIS.md §5.1
 */

// ============================================================================
// Enums & Constants
// ============================================================================

export type QuizType = "practice" | "exam";
export type SkillType = "reading" | "listening";
export type QuestionType = "radio" | "select" | "fillup" | "checkbox" | "matching" | "matrix";
export type MatchingLayoutType = "standard" | "summary" | "heading";
export type ContentStatus = "draft" | "published";
export type OrderStatus = "pending" | "completed" | "cancelled";
export type PackageType = "combo" | "single";
export type CouponType = "percent" | "fixed";

// ============================================================================
// Quiz-related types (quiz → passage → question)
// ============================================================================

export type Quiz = {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    type: QuizType;
    skill: SkillType;
    time_minutes: number;
    pro_user_only: boolean;
    score_type: string | null;
    featured_image: string | null;
    audio_url: string | null;
    pdf_url: string | null;
    tests_taken: number;
    source: string | null;
    year: string | null;
    quarter: string | null;
    part: string | null;
    question_form: string | null;
    status: ContentStatus;
    votes: VoteEntry[];
    views: number;
    published_at: string | null;
    created_at: string;
};

export type Passage = {
    id: string;
    quiz_id: string;
    title: string | null;
    content: string | null;
    sort_order: number;
    audio_start: number | null;
    audio_end: number | null;
};

/** JSONB sub-types for question data fields */
export type RadioSelectOption = { option_text: string };
export type RadioSelectQuestion = {
    question: string;
    correct: string;
    options: RadioSelectOption[];
};
export type CheckboxOption = { option_text: string; correct: boolean };
export type MatchingItem = { questionPart: string; correctAnswer: string };
export type AnswerOption = { option_text: string };
export type MatchingQuestionData = {
    layout_type: MatchingLayoutType;
    matching_items: MatchingItem[];
    answer_options: AnswerOption[];
    summary_text: string | null;
};
export type MatrixCategory = { category_letter: string; category_text: string };
export type MatrixItem = { item_text: string; correct_category_letter: string };
export type MatrixQuestionData = {
    matrix_categories: MatrixCategory[];
    matrix_items: MatrixItem[];
};
export type Explanation = { content: string };

export type Question = {
    id: string;
    passage_id: string;
    type: QuestionType;
    title: string | null;
    question_text: string | null;
    instructions: string | null;
    question_form: string | null;
    list_of_questions: RadioSelectQuestion[] | null;
    list_of_options: CheckboxOption[] | null;
    matching_question: MatchingQuestionData | null;
    matrix_question: MatrixQuestionData | null;
    explanations: Explanation[] | null;
    sort_order: number;
};

/** Quiz with nested passages and questions (for getQuizBySlug) */
export type PassageWithQuestions = Passage & { questions: Question[] };
export type QuizWithPassages = Quiz & { passages: PassageWithQuestions[] };

// ============================================================================
// Votes (shared JSONB structure for posts, quizzes, sample_essays)
// ============================================================================

export type VoteEntry = {
    user_id: string;
    rate: number;
};

// ============================================================================
// Users
// ============================================================================

export type User = {
    id: string;
    email: string;
    name: string | null;
    avatar_url: string | null;
    is_pro: boolean;
    pro_expiration_date: string | null;
    pro_skills: string[] | null;  // null = all skills (combo), ['listening'] or ['reading'] = single
    target_score: TargetScore;
    gender: string | null;
    date_of_birth: string | null;
    phone_number: string | null;
    roles: string[];
    devices: Record<string, { device_id: string }>;
    created_at: string;
};

export type TargetScore = {
    reading?: number;
    listening?: number;
    speaking?: number;
    writing?: number;
    exam_date?: string;
};

// ============================================================================
// Test Results
// ============================================================================

export type TestResult = {
    id: string;
    user_id: string;
    quiz_id: string;
    answers: { answers: unknown[] } | null;
    test_part: number[] | null;
    time_left: string | null;
    test_time: number | null;
    test_mode: string | null;
    score: number | null;
    status: ContentStatus;
    submitted_at: string | null;
    created_at: string;
};

// ============================================================================
// Mock Tests & Collections
// ============================================================================

export type PracticeTestEntry = {
    reading_test_id: string;
    listening_test_id: string;
};

export type MockTest = {
    id: string;
    title: string;
    slug: string | null;
    practice_tests: PracticeTestEntry[];
    created_at: string;
};

export type MockTestCollection = {
    id: string;
    title: string;
    slug: string | null;
    mock_test_ids: string[];
    featured_image: string | null;
    created_at: string;
};

// ============================================================================
// Orders
// ============================================================================

export type Order = {
    id: string;
    order_id: string;
    user_id: string | null;
    package_type: PackageType | null;
    duration: number;
    skill_type: string | null;
    amount: number;
    original_amount: number | null;
    discount_amount: number;
    coupon_id: string | null;
    coupon_code: string | null;
    status: OrderStatus;
    payment_method: string | null;
    transfer_content: string | null;
    affiliate_ref: string | null;
    created_at: string;
};

// ============================================================================
// Coupons
// ============================================================================

export type Coupon = {
    id: string;
    code: string;
    type: CouponType | null;
    value: number;
    max_uses: number | null;
    current_uses: number;
    is_active: boolean;
    expires_at: string | null;
    created_at: string;
};

// ============================================================================
// Posts (Blog)
// ============================================================================

export type Post = {
    id: string;
    title: string;
    slug: string;
    content: string | null;
    excerpt: string | null;
    featured_image: string | null;
    status: string;
    pro_user_only: boolean;
    views: number;
    votes: VoteEntry[];
    seo: Record<string, unknown>;
    categories: string[];
    published_at: string | null;
    created_at: string;
};

// ============================================================================
// Sample Essays
// ============================================================================

export type SampleEssay = {
    id: string;
    title: string;
    slug: string;
    content: string | null;
    excerpt: string | null;
    skill: string | null;
    part: string | null;
    question_type: string | null;
    quarter: string | null;
    year: string | null;
    source: string | null;
    topic: string | null;
    task: string | null;
    passage: string | null;
    featured_image: string | null;
    status: string;
    pro_user_only: boolean;
    views: number;
    votes: VoteEntry[];
    seo: Record<string, unknown>;
    published_at: string | null;
    created_at: string;
};

// ============================================================================
// Affiliates
// ============================================================================

export type Affiliate = {
    id: string;
    user_id: string | null;
    custom_link: string | null;
    status: string;
    commission_rate: number;
    created_at: string;
};

export type AffiliateLink = {
    id: string;
    affiliate_id: string | null;
    custom_link: string;
    created_at: string;
};

export type AffiliateVisit = {
    id: string;
    affiliate_id: string | null;
    link_id: string | null;
    ip: string | null;
    user_agent: string | null;
    converted: boolean;
    order_id: string | null;
    created_at: string;
};

export type Commission = {
    id: string;
    affiliate_id: string | null;
    order_id: string | null;
    amount: number | null;
    commission_rate: number | null;
    commission_amount: number | null;
    status: string;
    created_at: string;
};

// ============================================================================
// CMS Configs, Site Settings, Menus
// ============================================================================

export type CmsConfig = {
    id: string;
    section_name: string;
    data: Record<string, unknown>;
    updated_at: string;
};

export type SiteSetting = {
    id: string;
    key: string;
    value: Record<string, unknown>;
    updated_at: string;
};

export type Menu = {
    id: string;
    location: string;
    items: MenuItem[];
    updated_at: string;
};

export type MenuItem = {
    id: string;
    label: string;
    url: string;
    children?: MenuItem[];
};

// ============================================================================
// Filter & Pagination helpers
// ============================================================================

export type QuizFilters = {
    skill?: SkillType;
    type?: QuizType;
    year?: string;
    source?: string;
    quarter?: string;
    part?: string;
    questionForm?: string;
    search?: string;
    page?: number;
    pageSize?: number;
};

export type PostFilters = {
    category?: string;
    search?: string;
    page?: number;
    pageSize?: number;
};

export type SampleEssayFilters = {
    skill?: string;
    part?: string;
    questionType?: string;
    quarter?: string;
    year?: string;
    source?: string;
    topic?: string;
    task?: string;
    passage?: string;
    search?: string;
    page?: number;
    pageSize?: number;
};

export type ExamCollectionFilters = {
    type?: string;
    search?: string;
    questionForm?: string;
    page?: number;
    pageSize?: number;
};

/** Quiz summary for display in collection listings */
export type ExamCollectionItem = {
    id: string;
    title: string;
    slug: string;
    skill: SkillType;
    featured_image: string | null;
    pro_user_only: boolean;
    tests_taken: number;
    time_minutes: number;
    question_form: string | null;
    source: string | null;
    year: string | null;
};

/** Single collection with nested reading/listening quiz arrays */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type CollectionWithExams<T = any> = {
    id: string;
    title: string;
    slug: string | null;
    featured_image: string | null;
    exams: T[];
};

/** Grouped exam collection response */
export type ExamCollectionResponse = {
    data: {
        reading: CollectionWithExams[];
        listening: CollectionWithExams[];
    };
    pageInfo: {
        total: number;
        currentPage: number;
        totalPages: number;
        pageSize: number;
    };
};

export type PaginatedResponse<T> = {
    data: T[];
    count: number;
    page: number;
    pageSize: number;
    totalPages: number;
};

// ============================================================================
// Typed Supabase Client
// ============================================================================

/**
 * Typed Supabase client — provides compile-time query validation.
 *
 * Usage: Replace bare `SupabaseClient` imports with `TypedSupabaseClient`
 * in service functions for better type safety on `.from()` table names
 * and `.select()` column names.
 *
 * Progressive adoption: Services can switch one at a time. Both
 * `SupabaseClient` and `TypedSupabaseClient` are runtime-compatible.
 *
 * @example
 *   import type { TypedSupabaseClient } from "~services/types/database";
 *
 *   export async function getUser(supabase: TypedSupabaseClient, id: string) {
 *     const { data } = await supabase.from("users").select("*").eq("id", id).single();
 *     // `data` is now typed based on the `users` table definition
 *   }
 */
export type { SupabaseClient as TypedSupabaseClient } from "@supabase/supabase-js";
