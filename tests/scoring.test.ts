/**
 * Scoring Engine Tests
 *
 * Tests for calculateScore() — pure function, no mocks needed.
 * Covers all 6 question types + edge cases + band score rounding.
 *
 * @see services/scoring.ts
 */

import { describe, it, expect } from "vitest";
import { calculateScore } from "../services/scoring";
import {
  // Radio
  radioQuiz,
  radioAnswersAllCorrect,
  radioAnswersPartial,
  radioAnswersAllWrong,
  // Select
  selectQuiz,
  selectAnswersAllCorrect,
  selectAnswersAllWrong,
  // Fillup
  fillupQuiz,
  fillupAnswersAllCorrect,
  fillupAnswersPartial,
  fillupAnswersAllWrong,
  // Checkbox
  checkboxQuiz,
  checkboxAnswerCorrect,
  checkboxAnswerPartial,
  checkboxAnswerCorrectUnsorted,
  checkboxAnswerWrong,
  // Matching — Standard
  matchingStandardQuiz,
  matchingStdAnswerCorrect,
  matchingStdAnswerPartial,
  // Matching — Summary
  matchingSummaryQuiz,
  matchingSumAnswerCorrect,
  matchingSumAnswerPartial,
  // Matching — Heading
  matchingHeadingQuiz,
  matchingHeadingAnswerCorrect,
  matchingHeadingAnswerPartial,
  // Matrix
  matrixQuiz,
  matrixAnswerCorrect,
  matrixAnswerPartial,
  // Mixed
  mixedQuiz,
  mixedAnswersAllCorrect,
  mixedQuizTotalQuestions,
} from "./fixtures/quiz-data";

// ============================================================================
// Radio / Select
// ============================================================================

describe("Scoring Engine — Radio", () => {
  const testPart = [0]; // select first passage

  it("scores all correct answers → 9.0", () => {
    const score = calculateScore(radioAnswersAllCorrect, radioQuiz, testPart);
    expect(score).toBe(9);
  });

  it("scores partial correct answers", () => {
    // 1/3 correct → (1/3) * 9 = 3.0
    const score = calculateScore(radioAnswersPartial, radioQuiz, testPart);
    expect(score).toBe(3);
  });

  it("scores all wrong answers → 0", () => {
    const score = calculateScore(radioAnswersAllWrong, radioQuiz, testPart);
    expect(score).toBe(0);
  });

  it("handles null/undefined answers → 0", () => {
    const score = calculateScore([null, undefined, null], radioQuiz, testPart);
    expect(score).toBe(0);
  });
});

describe("Scoring Engine — Select", () => {
  const testPart = [0];

  it("scores all correct answers → 9.0", () => {
    const score = calculateScore(selectAnswersAllCorrect, selectQuiz, testPart);
    expect(score).toBe(9);
  });

  it("scores all wrong answers → 0", () => {
    const score = calculateScore(selectAnswersAllWrong, selectQuiz, testPart);
    expect(score).toBe(0);
  });
});

// ============================================================================
// Fillup
// ============================================================================

describe("Scoring Engine — Fillup", () => {
  const testPart = [0];

  it("scores exact match (case-insensitive) → 9.0", () => {
    const score = calculateScore(fillupAnswersAllCorrect, fillupQuiz, testPart);
    expect(score).toBe(9);
  });

  it("accepts alternate answers via '/' separator", () => {
    // "Paris / paris / PARIS" — user answers "Paris" → correct
    // "New York / NYC" — user answers "NYC" → correct
    const score = calculateScore(["london", "paris", "nyc"], fillupQuiz, testPart);
    expect(score).toBe(9);
  });

  it("scores partial correct answers", () => {
    // 2/3 correct → (2/3) * 9 = 6.0
    const score = calculateScore(fillupAnswersPartial, fillupQuiz, testPart);
    expect(score).toBe(6);
  });

  it("rejects wrong answers → 0", () => {
    const score = calculateScore(fillupAnswersAllWrong, fillupQuiz, testPart);
    expect(score).toBe(0);
  });

  it("handles empty string answers → 0", () => {
    const score = calculateScore(["", "", ""], fillupQuiz, testPart);
    expect(score).toBe(0);
  });
});

// ============================================================================
// Checkbox
// ============================================================================

describe("Scoring Engine — Checkbox", () => {
  const testPart = [0];

  it("scores all-or-nothing: all correct indices → full score", () => {
    const score = calculateScore([checkboxAnswerCorrect], checkboxQuiz, testPart);
    expect(score).toBe(9);
  });

  it("scores all-or-nothing: partial selection → 0", () => {
    // [1, 3] instead of [1, 3, 5] → all-or-nothing = 0
    const score = calculateScore([checkboxAnswerPartial], checkboxQuiz, testPart);
    expect(score).toBe(0);
  });

  it("scores unsorted answer that has correct set → full score", () => {
    // [5, 1, 3] → sorted = [1, 3, 5] → matches
    const score = calculateScore([checkboxAnswerCorrectUnsorted], checkboxQuiz, testPart);
    expect(score).toBe(9);
  });

  it("scores all wrong indices → 0", () => {
    const score = calculateScore([checkboxAnswerWrong], checkboxQuiz, testPart);
    expect(score).toBe(0);
  });

  it("handles empty array → 0", () => {
    const score = calculateScore([[]], checkboxQuiz, testPart);
    expect(score).toBe(0);
  });
});

// ============================================================================
// Matching — Standard
// ============================================================================

describe("Scoring Engine — Matching (Standard)", () => {
  const testPart = [0];

  it("scores all correct option selections → 9.0", () => {
    const score = calculateScore([matchingStdAnswerCorrect], matchingStandardQuiz, testPart);
    expect(score).toBe(9);
  });

  it("scores partial correct matches", () => {
    // 2/4 correct → (2/4)*9 = 4.5
    const score = calculateScore([matchingStdAnswerPartial], matchingStandardQuiz, testPart);
    expect(score).toBe(4.5);
  });

  it("handles empty object answer → 0", () => {
    const score = calculateScore([{}], matchingStandardQuiz, testPart);
    expect(score).toBe(0);
  });
});

// ============================================================================
// Matching — Summary
// ============================================================================

describe("Scoring Engine — Matching (Summary)", () => {
  const testPart = [0];

  it("extracts gaps from summary_text and scores all correct", () => {
    const score = calculateScore([matchingSumAnswerCorrect], matchingSummaryQuiz, testPart);
    expect(score).toBe(9);
  });

  it("scores partial correct gap fills", () => {
    // 1/3 correct → (1/3)*9 = 3.0
    const score = calculateScore([matchingSumAnswerPartial], matchingSummaryQuiz, testPart);
    expect(score).toBe(3);
  });

  it("handles no user answers → 0", () => {
    const score = calculateScore([{}], matchingSummaryQuiz, testPart);
    expect(score).toBe(0);
  });
});

// ============================================================================
// Matching — Heading
// ============================================================================

describe("Scoring Engine — Matching (Heading)", () => {
  const testPart = [0];

  it("extracts gaps from passage content and scores correct", () => {
    const score = calculateScore([matchingHeadingAnswerCorrect], matchingHeadingQuiz, testPart);
    expect(score).toBe(9);
  });

  it("scores partial correct heading matches", () => {
    // 1/2 correct → (1/2)*9 = 4.5
    const score = calculateScore([matchingHeadingAnswerPartial], matchingHeadingQuiz, testPart);
    expect(score).toBe(4.5);
  });
});

// ============================================================================
// Matrix
// ============================================================================

describe("Scoring Engine — Matrix", () => {
  const testPart = [0];

  it("scores correct category assignments → 9.0", () => {
    const score = calculateScore([matrixAnswerCorrect], matrixQuiz, testPart);
    expect(score).toBe(9);
  });

  it("scores partial correct assignments", () => {
    // 2/4 correct → (2/4)*9 = 4.5
    const score = calculateScore([matrixAnswerPartial], matrixQuiz, testPart);
    expect(score).toBe(4.5);
  });

  it("handles missing user answers → 0", () => {
    const score = calculateScore([{}], matrixQuiz, testPart);
    expect(score).toBe(0);
  });
});

// ============================================================================
// Band Score Calculation
// ============================================================================

describe("Scoring Engine — Band Score Rounding", () => {
  it("returns 9.0 for perfect score", () => {
    const score = calculateScore(radioAnswersAllCorrect, radioQuiz, [0]);
    expect(score).toBe(9.0);
  });

  it("returns 0.0 for zero correct", () => {
    const score = calculateScore(radioAnswersAllWrong, radioQuiz, [0]);
    expect(score).toBe(0.0);
  });

  it("rounds to nearest 0.5 (down)", () => {
    // 1/3 = 0.333... × 9 = 3.0 → round(6)/2 = 3.0
    const score = calculateScore(radioAnswersPartial, radioQuiz, [0]);
    expect(score % 0.5).toBe(0); // always multiple of 0.5
  });

  it("produces band score in 0-9 range", () => {
    const score = calculateScore(mixedAnswersAllCorrect, mixedQuiz, [0, 1, 2]);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(9);
  });

  it("band score is always a multiple of 0.5", () => {
    const score = calculateScore(fillupAnswersPartial, fillupQuiz, [0]);
    expect(score % 0.5).toBe(0);
  });
});

// ============================================================================
// testPart Filtering
// ============================================================================

describe("Scoring Engine — testPart Filtering", () => {
  it("scores only selected passages", () => {
    // Mixed quiz has 3 passages. Select only passage 0 (radio + fillup)
    // radio: 3 correct, fillup: 3 correct → 6/6 = 9.0
    const score = calculateScore(radioAnswersAllCorrect.concat(fillupAnswersAllCorrect), mixedQuiz, [0]);
    expect(score).toBe(9);
  });

  it("handles empty testPart → 0", () => {
    const score = calculateScore(radioAnswersAllCorrect, radioQuiz, []);
    expect(score).toBe(0);
  });

  it("skips unselected passages", () => {
    // Select passage 2 only (select + matrix)
    // Need to provide answers for passage 2's questions
    const answers = [selectAnswersAllCorrect[0], selectAnswersAllCorrect[1], matrixAnswerCorrect];
    const score = calculateScore(answers, mixedQuiz, [2]);
    // select: 2/2 correct, matrix: 4/4 correct → 6/6 → 9.0
    expect(score).toBe(9);
  });
});

// ============================================================================
// Edge Cases
// ============================================================================

describe("Scoring Engine — Edge Cases", () => {
  it("returns 0 for null quiz", () => {
    const score = calculateScore(["1", "2"], null, [0]);
    expect(score).toBe(0);
  });

  it("returns 0 for undefined quiz", () => {
    const score = calculateScore(["1"], undefined, [0]);
    expect(score).toBe(0);
  });

  it("returns 0 for null answers", () => {
    const score = calculateScore(null, radioQuiz, [0]);
    expect(score).toBe(0);
  });

  it("returns 0 for undefined answers", () => {
    const score = calculateScore(undefined, radioQuiz, [0]);
    expect(score).toBe(0);
  });

  it("handles mixed question types in one quiz", () => {
    // mixedQuiz: all 6 types, all correct → perfect score
    const score = calculateScore(mixedAnswersAllCorrect, mixedQuiz, [0, 1, 2]);
    expect(score).toBe(9);
  });

  it("handles quiz with no passages", () => {
    const emptyQuiz = { id: "empty", title: "Empty", passages: [] };
    const score = calculateScore([], emptyQuiz, [0]);
    expect(score).toBe(0);
  });
});
