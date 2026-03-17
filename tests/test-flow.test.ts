/**
 * Test Flow Service Tests
 *
 * Tests for the test-taking lifecycle: start, save, submit.
 * Uses mock Supabase client.
 *
 * @see services/test-flow.ts
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  takeTheTest,
  saveTestResult,
  submitTestResult,
  NotAuthenticatedError,
  ProAccessError,
  TestNotFoundError,
} from "../services/test-flow";
import { createMockSupabase } from "./fixtures/supabase-mock";
import {
  radioQuestion,
  radioAnswersAllCorrect,
} from "./fixtures/quiz-data";

// ============================================================================
// Fixtures
// ============================================================================

const freeQuiz = {
  id: "quiz-free-001",
  title: "Free Quiz",
  slug: "free-quiz",
  pro_user_only: false,
  status: "published",
  skill: "reading",
  type: "practice",
  time_minutes: 60,
  passages: [
    {
      id: "p-001",
      quiz_id: "quiz-free-001",
      title: "Passage 1",
      content: "<p>Content</p>",
      sort_order: 0,
      questions: [radioQuestion],
    },
  ],
};

const proQuiz = {
  id: "quiz-pro-001",
  title: "Pro Quiz",
  slug: "pro-quiz",
  pro_user_only: true,
  status: "published",
  skill: "reading",
  type: "exam",
  time_minutes: 60,
};

const proUser = {
  id: "user-001",
  is_pro: true,
  pro_expiration_date: new Date(Date.now() + 86400000 * 30).toISOString(), // 30 days from now
  pro_skills: null, // combo = all skills
};

const freeUser = {
  id: "user-001",
  is_pro: false,
  pro_expiration_date: null,
  pro_skills: null,
};

const listeningOnlyUser = {
  id: "user-001",
  is_pro: true,
  pro_expiration_date: new Date(Date.now() + 86400000 * 30).toISOString(),
  pro_skills: ["listening"], // single listening package
};

const readingListeningUser = {
  id: "user-001",
  is_pro: true,
  pro_expiration_date: new Date(Date.now() + 86400000 * 30).toISOString(),
  pro_skills: ["reading", "listening"], // merged singles
};

const proReadingQuiz = {
  id: "quiz-pro-reading",
  title: "Pro Reading Quiz",
  slug: "pro-reading",
  pro_user_only: true,
  status: "published",
  skill: "reading",
  type: "exam",
  time_minutes: 60,
};

const proListeningQuiz = {
  id: "quiz-pro-listening",
  title: "Pro Listening Quiz",
  slug: "pro-listening",
  pro_user_only: true,
  status: "published",
  skill: "listening",
  type: "exam",
  time_minutes: 60,
};

const draftTestResult = {
  id: "test-draft-001",
  user_id: "user-001",
  quiz_id: "quiz-free-001",
  test_part: [0],
  test_time: 60,
  test_mode: "practice",
  status: "draft",
  answers: null,
  score: null,
  time_left: null,
  submitted_at: null,
  created_at: "2024-01-01",
};

// ============================================================================
// takeTheTest
// ============================================================================

describe("Test Flow — takeTheTest()", () => {
  it("creates new draft test result", async () => {
    const supabase = createMockSupabase(
      {
        quizzes: [freeQuiz],
        test_results: [], // no existing draft
        users: [freeUser],
      },
      "user-001"
    );

    const result = await takeTheTest(supabase as any, {
      quizId: "quiz-free-001",
      testPart: [0],
      testTime: 60,
      testMode: "practice",
      retake: false,
    });

    expect(result).toBeDefined();
    expect(result.quiz_id).toBe("quiz-free-001");
    expect(result.status).toBe("draft");

    // Verify RPC was called for incrementing tests_taken
    expect(supabase.rpc).toHaveBeenCalledWith("increment_tests_taken", {
      p_quiz_id: "quiz-free-001",
    });
  });

  it("resumes existing draft when retake=false", async () => {
    const supabase = createMockSupabase(
      {
        quizzes: [freeQuiz],
        test_results: [draftTestResult],
        users: [freeUser],
      },
      "user-001"
    );

    const result = await takeTheTest(supabase as any, {
      quizId: "quiz-free-001",
      testPart: [0],
      testTime: 60,
      testMode: "practice",
      retake: false,
    });

    expect(result).toBeDefined();
    expect(result.id).toBe("test-draft-001"); // Same draft ID
    // RPC should NOT be called (no new test created)
    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it("deletes old draft when retake=true", async () => {
    const supabase = createMockSupabase(
      {
        quizzes: [freeQuiz],
        test_results: [draftTestResult],
        users: [freeUser],
      },
      "user-001"
    );

    const result = await takeTheTest(supabase as any, {
      quizId: "quiz-free-001",
      testPart: [0],
      testTime: 60,
      testMode: "practice",
      retake: true,
    });

    expect(result).toBeDefined();
    expect(result.status).toBe("draft");
    // Should have deleted old draft
    expect(supabase._tracking.deletedTables).toContain("test_results");
    // And created a new one
    expect(supabase._tracking.insertedRows["test_results"]).toBeDefined();
    // Increment RPC should be called
    expect(supabase.rpc).toHaveBeenCalledWith("increment_tests_taken", {
      p_quiz_id: "quiz-free-001",
    });
  });

  it("throws NotAuthenticatedError when not logged in", async () => {
    const supabase = createMockSupabase(
      { quizzes: [freeQuiz] },
      null // not authenticated
    );

    await expect(
      takeTheTest(supabase as any, {
        quizId: "quiz-free-001",
        testPart: [0],
        testTime: 60,
        testMode: "practice",
        retake: false,
      })
    ).rejects.toThrow(NotAuthenticatedError);
  });

  it("throws ProAccessError for pro-only quiz when user is not pro", async () => {
    const supabase = createMockSupabase(
      {
        quizzes: [proQuiz],
        users: [freeUser],
      },
      "user-001"
    );

    await expect(
      takeTheTest(supabase as any, {
        quizId: "quiz-pro-001",
        testPart: [0],
        testTime: 60,
        testMode: "practice",
        retake: false,
      })
    ).rejects.toThrow(ProAccessError);
  });

  it("allows pro-only quiz when user is pro", async () => {
    const supabase = createMockSupabase(
      {
        quizzes: [proQuiz],
        users: [proUser],
        test_results: [],
      },
      "user-001"
    );

    const result = await takeTheTest(supabase as any, {
      quizId: "quiz-pro-001",
      testPart: [0],
      testTime: 60,
      testMode: "practice",
      retake: false,
    });

    expect(result).toBeDefined();
    expect(result.status).toBe("draft");
  });

  it("throws ProAccessError for single-listening user accessing reading quiz", async () => {
    const supabase = createMockSupabase(
      {
        quizzes: [proReadingQuiz],
        users: [listeningOnlyUser],
      },
      "user-001"
    );

    await expect(
      takeTheTest(supabase as any, {
        quizId: "quiz-pro-reading",
        testPart: [0],
        testTime: 60,
        testMode: "practice",
        retake: false,
      })
    ).rejects.toThrow(ProAccessError);
  });

  it("allows single-listening user to access listening quiz", async () => {
    const supabase = createMockSupabase(
      {
        quizzes: [proListeningQuiz],
        users: [listeningOnlyUser],
        test_results: [],
      },
      "user-001"
    );

    const result = await takeTheTest(supabase as any, {
      quizId: "quiz-pro-listening",
      testPart: [0],
      testTime: 60,
      testMode: "practice",
      retake: false,
    });

    expect(result).toBeDefined();
    expect(result.status).toBe("draft");
  });

  it("allows combo user (pro_skills=null) to access any quiz", async () => {
    const supabase = createMockSupabase(
      {
        quizzes: [proReadingQuiz],
        users: [proUser], // proUser has pro_skills: null (combo)
        test_results: [],
      },
      "user-001"
    );

    const result = await takeTheTest(supabase as any, {
      quizId: "quiz-pro-reading",
      testPart: [0],
      testTime: 60,
      testMode: "practice",
      retake: false,
    });

    expect(result).toBeDefined();
    expect(result.status).toBe("draft");
  });
});

// ============================================================================
// saveTestResult
// ============================================================================

describe("Test Flow — saveTestResult()", () => {
  it("updates answers and time_left for draft", async () => {
    const supabase = createMockSupabase(
      {
        test_results: [draftTestResult],
      },
      "user-001"
    );

    // Should not throw
    await saveTestResult(
      supabase as any,
      "test-draft-001",
      { answers: ["0", "1", "2"] },
      "25:30"
    );

    // Verify update was called
    expect(supabase._tracking.updatedData["test_results"]).toBeDefined();
    expect(supabase._tracking.updatedData["test_results"][0]).toMatchObject({
      answers: { answers: ["0", "1", "2"] },
      time_left: "25:30",
    });
  });

  it("throws NotAuthenticatedError when not logged in", async () => {
    const supabase = createMockSupabase(
      { test_results: [draftTestResult] },
      null
    );

    await expect(
      saveTestResult(supabase as any, "test-draft-001", { answers: [] }, "00:00")
    ).rejects.toThrow(NotAuthenticatedError);
  });
});

// ============================================================================
// submitTestResult
// ============================================================================

describe("Test Flow — submitTestResult()", () => {
  it("calculates score and publishes result", async () => {
    const supabase = createMockSupabase(
      {
        test_results: [draftTestResult],
        quizzes: [freeQuiz],
      },
      "user-001"
    );

    const result = await submitTestResult(
      supabase as any,
      "test-draft-001",
      { answers: radioAnswersAllCorrect },
      "05:30"
    );

    expect(result).toBeDefined();
    // Verify the update included a score and published status
    const updates = supabase._tracking.updatedData["test_results"];
    expect(updates).toBeDefined();
    expect(updates[0]).toMatchObject({
      status: "published",
    });
    // Score should have been calculated
    expect(updates[0]).toHaveProperty("score");
    expect(typeof (updates[0] as any).score).toBe("number");
  });

  it("sets submitted_at timestamp", async () => {
    const supabase = createMockSupabase(
      {
        test_results: [draftTestResult],
        quizzes: [freeQuiz],
      },
      "user-001"
    );

    await submitTestResult(
      supabase as any,
      "test-draft-001",
      { answers: radioAnswersAllCorrect },
      "05:30"
    );

    const updates = supabase._tracking.updatedData["test_results"];
    expect(updates[0]).toHaveProperty("submitted_at");
    expect(typeof (updates[0] as any).submitted_at).toBe("string");
  });

  it("throws NotAuthenticatedError for unauthenticated user", async () => {
    const supabase = createMockSupabase(
      { test_results: [draftTestResult], quizzes: [freeQuiz] },
      null
    );

    await expect(
      submitTestResult(supabase as any, "test-draft-001", { answers: [] }, "00:00")
    ).rejects.toThrow(NotAuthenticatedError);
  });

  it("throws TestNotFoundError for invalid test id", async () => {
    const supabase = createMockSupabase(
      {
        test_results: [], // no test results
        quizzes: [freeQuiz],
      },
      "user-001"
    );

    await expect(
      submitTestResult(supabase as any, "non-existent", { answers: [] }, "00:00")
    ).rejects.toThrow(TestNotFoundError);
  });
});
