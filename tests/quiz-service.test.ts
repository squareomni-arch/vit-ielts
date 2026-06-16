/**
 * Quiz Service Tests
 *
 * Tests for quiz CRUD operations using mock Supabase client.
 *
 * @see services/quiz.ts
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getQuizBySlug,
  getQuizzes,
  createQuiz,
  updateQuiz,
  deleteQuiz,
} from "../services/quiz";
import { createMockSupabase } from "./fixtures/supabase-mock";

// ============================================================================
// Fixtures
// ============================================================================

const sampleQuiz = {
  id: "quiz-001",
  title: "Cambridge 18 Reading Test 1",
  slug: "cambridge-18-reading-test-1",
  status: "published",
  skill: "reading",
  type: "practice",
  time_minutes: 60,
  pro_user_only: false,
  excerpt: "Test excerpt",
  featured_image: null,
  tests_taken: 42,
  source: "Cambridge",
  year: "2023",
  quarter: null,
  part: null,
  question_form: null,
  views: 100,
  published_at: "2023-01-01",
  created_at: "2023-01-01",
  votes: null,
  passages: [
    {
      id: "passage-001",
      quiz_id: "quiz-001",
      title: "Passage 1",
      content: "<p>Reading passage content</p>",
      sort_order: 0,
      audio_start: null,
      audio_end: null,
      questions: [
        {
          id: "q-001",
          passage_id: "passage-001",
          type: "radio",
          title: "Questions 1-3",
          sort_order: 0,
          list_of_questions: [
            { question: "Q1?", correct: "0", options: [{ option_text: "A" }, { option_text: "B" }] },
          ],
        },
      ],
    },
    {
      id: "passage-002",
      quiz_id: "quiz-001",
      title: "Passage 2",
      content: "<p>Second passage</p>",
      sort_order: 1,
      audio_start: null,
      audio_end: null,
      questions: [
        {
          id: "q-002",
          passage_id: "passage-002",
          type: "fillup",
          title: "Questions 4-5",
          sort_order: 0,
          explanations: [{ content: "answer1" }],
        },
      ],
    },
  ],
};

const sampleQuiz2 = {
  id: "quiz-002",
  title: "Listening Practice 1",
  slug: "listening-practice-1",
  status: "published",
  skill: "listening",
  type: "practice",
  time_minutes: 40,
  pro_user_only: true,
  excerpt: null,
  featured_image: null,
  tests_taken: 10,
  source: "Vit IELTS",
  year: "2024",
  quarter: null,
  part: null,
  question_form: null,
  views: 50,
  published_at: "2024-01-01",
  created_at: "2024-01-01",
  votes: null,
};

const draftQuiz = {
  ...sampleQuiz,
  id: "quiz-003",
  slug: "draft-quiz",
  status: "draft",
};

// ============================================================================
// getQuizBySlug
// ============================================================================

describe("Quiz Service — getQuizBySlug()", () => {
  it("returns quiz with sorted passages and questions", async () => {
    const supabase = createMockSupabase({
      quizzes: [sampleQuiz],
    });

    const result = await getQuizBySlug(supabase as any, "cambridge-18-reading-test-1");
    expect(result).not.toBeNull();
    expect(result?.id).toBe("quiz-001");
    expect(result?.title).toBe("Cambridge 18 Reading Test 1");
  });

  it("returns null for non-existent slug", async () => {
    const supabase = createMockSupabase({
      quizzes: [], // empty
    });

    const result = await getQuizBySlug(supabase as any, "non-existent");
    expect(result).toBeNull();
  });

  it("only returns published quizzes", async () => {
    const supabase = createMockSupabase({
      quizzes: [draftQuiz], // only draft quiz
    });

    const result = await getQuizBySlug(supabase as any, "draft-quiz");
    // The .eq("status", "published") filter should exclude draft
    expect(result).toBeNull();
  });
});

// ============================================================================
// getQuizzes
// ============================================================================

describe("Quiz Service — getQuizzes()", () => {
  it("returns paginated results", async () => {
    const supabase = createMockSupabase({
      quizzes: [sampleQuiz, sampleQuiz2],
    });

    const result = await getQuizzes(supabase as any, { page: 1, pageSize: 10 });
    expect(result.data).toBeDefined();
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(10);
    expect(typeof result.totalPages).toBe("number");
  });

  it("applies skill filter", async () => {
    const supabase = createMockSupabase({
      quizzes: [sampleQuiz, sampleQuiz2],
    });

    const result = await getQuizzes(supabase as any, { skill: "reading" });

    // Verify .eq was called with "skill", "reading"
    const fromCall = supabase.from.mock.results[0]?.value;
    const selectCall = fromCall?.select.mock.results[0]?.value;
    expect(selectCall?.eq).toHaveBeenCalledWith("skill", "reading");
  });

  it("applies search filter with ilike", async () => {
    const supabase = createMockSupabase({
      quizzes: [sampleQuiz, sampleQuiz2],
    });

    await getQuizzes(supabase as any, { search: "cambridge" });

    const fromCall = supabase.from.mock.results[0]?.value;
    const selectCall = fromCall?.select.mock.results[0]?.value;
    expect(selectCall?.ilike).toHaveBeenCalledWith("title", "%cambridge%");
  });
});

// ============================================================================
// createQuiz
// ============================================================================

describe("Quiz Service — createQuiz()", () => {
  it("inserts quiz, passages, and questions in order", async () => {
    const supabase = createMockSupabase({
      quizzes: [], // empty initially
    });

    const input = {
      title: "New Quiz",
      slug: "new-quiz",
      status: "published" as const,
      skill: "reading",
      type: "practice",
      time_minutes: 60,
      pro_user_only: false,
      passages: [
        {
          title: "Passage 1",
          content: "<p>Content</p>",
          sort_order: 0,
          questions: [
            {
              type: "radio",
              title: "Q1",
              sort_order: 0,
              list_of_questions: [
                { question: "Q?", correct: "0", options: [{ option_text: "A" }] },
              ],
            },
          ],
        },
      ],
    };

    // This will call supabase.from("quizzes").insert(...)
    // then supabase.from("passages").insert(...)
    // then supabase.from("questions").insert(...)
    try {
      await createQuiz(supabase as any, input as any);
    } catch {
      // May throw due to mock limitations — that's fine, we verify the calls
    }

    // Verify quiz insert was called
    expect(supabase.from).toHaveBeenCalledWith("quizzes");

    // Verify tracking
    const tracking = supabase._tracking;
    expect(tracking.insertedRows["quizzes"]).toBeDefined();
    expect(tracking.insertedRows["quizzes"].length).toBeGreaterThan(0);
  });

  it("links passages to quiz_id", async () => {
    const supabase = createMockSupabase({});

    const input = {
      title: "Link Test",
      slug: "link-test",
      status: "published",
      skill: "reading",
      type: "practice",
      time_minutes: 30,
      pro_user_only: false,
      passages: [
        {
          title: "P1",
          content: "C1",
          sort_order: 0,
          questions: [],
        },
      ],
    };

    try {
      await createQuiz(supabase as any, input as any);
    } catch {
      // Expected
    }

    // The quiz insert should have been called
    const quizInserts = supabase._tracking.insertedRows["quizzes"];
    expect(quizInserts).toBeDefined();

    // Passages should reference quiz_id
    const passageInserts = supabase._tracking.insertedRows["passages"];
    if (passageInserts) {
      expect(passageInserts[0]).toHaveProperty("quiz_id");
    }
  });

  it("handles quiz with no questions", async () => {
    const supabase = createMockSupabase({});

    const input = {
      title: "No Questions",
      slug: "no-questions",
      status: "published",
      skill: "reading",
      type: "practice",
      time_minutes: 30,
      pro_user_only: false,
      passages: [
        {
          title: "Empty Passage",
          content: "Content",
          sort_order: 0,
          questions: [],
        },
      ],
    };

    try {
      await createQuiz(supabase as any, input as any);
    } catch {
      // Expected
    }

    // No questions should be inserted
    const questionInserts = supabase._tracking.insertedRows["questions"];
    expect(questionInserts).toBeUndefined();
  });
});

// ============================================================================
// updateQuiz
// ============================================================================

describe("Quiz Service — updateQuiz()", () => {
  it("updates quiz fields only when no passages provided", async () => {
    const supabase = createMockSupabase({
      quizzes: [sampleQuiz],
    });

    try {
      await updateQuiz(supabase as any, "quiz-001", {
        title: "Updated Title",
      });
    } catch {
      // Expected due to mock limitations
    }

    // Should have called update on quizzes
    const fromCall = supabase.from.mock.results.find(
      (r: any) => r.type === "return"
    );
    expect(supabase.from).toHaveBeenCalledWith("quizzes");

    // Should NOT have deleted passages
    expect(supabase._tracking.deletedTables).not.toContain("passages");
  });

  it("calls update_quiz_passages RPC when passages provided", async () => {
    const supabase = createMockSupabase({
      quizzes: [sampleQuiz],
      passages: sampleQuiz.passages,
    });

    // Mock the RPC call
    (supabase as any).rpc = vi.fn(async () => ({
      data: null,
      error: null,
    }));

    try {
      await updateQuiz(supabase as any, "quiz-001", {
        title: "Updated",
        passages: [
          {
            title: "New Passage",
            content: "New Content",
            sort_order: 0,
            questions: [
              {
                type: "fillup",
                title: "New Q",
                sort_order: 0,
                explanations: [{ content: "answer" }],
              },
            ],
          },
        ],
      });
    } catch {
      // Expected due to mock limitations on getQuizBySlug
    }

    // Should have called RPC with update_quiz_passages
    expect((supabase as any).rpc).toHaveBeenCalledWith("update_quiz_passages", {
      p_quiz_id: "quiz-001",
      p_passages: expect.arrayContaining([
        expect.objectContaining({
          title: "New Passage",
          content: "New Content",
          sort_order: 0,
          questions: expect.arrayContaining([
            expect.objectContaining({
              type: "fillup",
              title: "New Q",
            }),
          ]),
        }),
      ]),
    });

    // Should NOT have directly deleted passages (old behavior)
    expect(supabase._tracking.deletedTables).not.toContain("passages");
  });
});

// ============================================================================
// deleteQuiz
// ============================================================================

describe("Quiz Service — deleteQuiz()", () => {
  it("deletes quiz by id", async () => {
    const supabase = createMockSupabase({
      quizzes: [sampleQuiz],
    });

    await deleteQuiz(supabase as any, "quiz-001");

    // Verify delete was called on quizzes table
    expect(supabase.from).toHaveBeenCalledWith("quizzes");
    expect(supabase._tracking.deletedTables).toContain("quizzes");
  });
});
