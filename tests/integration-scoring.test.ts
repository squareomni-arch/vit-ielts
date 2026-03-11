/**
 * Integration Tests — End-to-end Scoring
 *
 * Tests the complete flow: build quiz data → calculateScore → verify band score.
 * These tests use realistic quiz structures with mixed question types.
 * Pure function tests — no mocks needed.
 *
 * @see services/scoring.ts
 */

import { describe, it, expect } from "vitest";
import { calculateScore } from "../services/scoring";
import type { QuizWithPassages, QuizQuestion, QuizPassage } from "../services/types/quiz";
import {
  radioQuestion,
  selectQuestion,
  fillupQuestion,
  checkboxQuestion,
  matchingStandardQuestion,
  matrixQuestion,
  radioAnswersAllCorrect,
  selectAnswersAllCorrect,
  fillupAnswersAllCorrect,
  checkboxAnswerCorrect,
  matchingStdAnswerCorrect,
  matrixAnswerCorrect,
  mixedQuiz,
  mixedAnswersAllCorrect,
} from "./fixtures/quiz-data";

// ============================================================================
// Helpers
// ============================================================================

function buildQuiz(passages: QuizPassage[]): QuizWithPassages {
  return { id: "integration-quiz", title: "Integration Test Quiz", passages };
}

function buildPassage(
  questions: QuizQuestion[],
  sortOrder: number,
  content = "<p>passage</p>"
): QuizPassage {
  return {
    id: `passage-int-${sortOrder}`,
    title: `Passage ${sortOrder + 1}`,
    content,
    sort_order: sortOrder,
    questions,
  };
}

// ============================================================================
// Integration Tests
// ============================================================================

describe("Integration: Full quiz scoring", () => {
  it("scores a complete Reading quiz with radio + fillup + matching", () => {
    const quiz = buildQuiz([
      // Passage 1: radio (3 sub-questions) + fillup (3 blanks)
      buildPassage([radioQuestion, fillupQuestion], 0),
      // Passage 2: matching standard (4 items)
      buildPassage([matchingStandardQuestion], 1),
    ]);

    // All correct answers (flat array):
    // radio: 3 slots + fillup: 3 slots + matching: 1 slot = 7 answer slots
    // Total questions: radio (3) + fillup (3) + matching (4) = 10
    const answers = [
      // radio
      ...radioAnswersAllCorrect,     // "0", "2", "1"
      // fillup
      ...fillupAnswersAllCorrect,    // "london", "Paris", "NYC"
      // matching
      matchingStdAnswerCorrect,       // { "0": "0", "1": "1", "2": "2", "3": "3" }
    ];

    const score = calculateScore(answers, quiz, [0, 1]);

    // 10/10 correct → (10/10) × 9 = 9.0
    expect(score).toBe(9);
  });

  it("scores a quiz with all 6 question types mixed", () => {
    // Using the mixedQuiz from fixtures
    const score = calculateScore(mixedAnswersAllCorrect, mixedQuiz, [0, 1, 2]);

    // All correct → 9.0
    expect(score).toBe(9);
  });

  it("scores a quiz with specific testPart selection", () => {
    const quiz = buildQuiz([
      buildPassage([radioQuestion], 0),          // Passage 0: 3 questions
      buildPassage([fillupQuestion], 1),          // Passage 1: 3 questions
      buildPassage([matchingStandardQuestion], 2), // Passage 2: 4 questions
    ]);

    // Select only passages 0 and 2 (skip passage 1)
    // Total questions in selection: 3 + 4 = 7
    const answers = [
      // Passage 0 — radio (all correct)
      ...radioAnswersAllCorrect,
      // Passage 2 — matching (all correct)
      matchingStdAnswerCorrect,
    ];

    const score = calculateScore(answers, quiz, [0, 2]);

    // 7/7 correct → 9.0
    expect(score).toBe(9);
  });

  it("produces correct band score for realistic 40-question exam", () => {
    // Build a larger quiz simulating a real IELTS exam (~40 questions)
    // We'll use radio questions with 10 sub-questions each across 4 passages
    const makeRadioQuestion = (count: number, sortOrder: number): QuizQuestion => ({
      id: `q-large-${sortOrder}`,
      type: "radio",
      title: `Questions ${sortOrder * count + 1}-${(sortOrder + 1) * count}`,
      sort_order: sortOrder,
      list_of_questions: Array.from({ length: count }, (_, i) => ({
        question: `Question ${sortOrder * count + i + 1}`,
        correct: "0",
        options: [
          { option_text: "Correct" },
          { option_text: "Wrong A" },
          { option_text: "Wrong B" },
          { option_text: "Wrong C" },
        ],
      })),
    });

    const quiz = buildQuiz([
      buildPassage([makeRadioQuestion(10, 0)], 0), // 10 questions
      buildPassage([makeRadioQuestion(10, 1)], 1), // 10 questions
      buildPassage([makeRadioQuestion(10, 2)], 2), // 10 questions
      buildPassage([makeRadioQuestion(10, 3)], 3), // 10 questions
    ]);
    // Total: 40 questions

    // Case 1: 30/40 correct → (30/40) × 9 = 6.75 → round(13.5)/2 = 7.0
    const answers30 = [
      ...Array(10).fill("0"), // passage 0: all correct
      ...Array(10).fill("0"), // passage 1: all correct
      ...Array(10).fill("0"), // passage 2: all correct
      ...Array(10).fill("1"), // passage 3: all wrong
    ];
    const score30 = calculateScore(answers30, quiz, [0, 1, 2, 3]);
    expect(score30).toBe(7); // round(6.75 × 2) / 2 = 14/2 = 7.0

    // Case 2: 40/40 correct → 9.0
    const answers40 = Array(40).fill("0");
    const score40 = calculateScore(answers40, quiz, [0, 1, 2, 3]);
    expect(score40).toBe(9);

    // Case 3: 20/40 correct → (20/40) × 9 = 4.5
    const answers20 = [
      ...Array(10).fill("0"), // passage 0: all correct
      ...Array(10).fill("0"), // passage 1: all correct
      ...Array(10).fill("1"), // passage 2: all wrong
      ...Array(10).fill("1"), // passage 3: all wrong
    ];
    const score20 = calculateScore(answers20, quiz, [0, 1, 2, 3]);
    expect(score20).toBe(4.5);

    // Case 4: 0/40 → 0
    const answers0 = Array(40).fill("1");
    const score0 = calculateScore(answers0, quiz, [0, 1, 2, 3]);
    expect(score0).toBe(0);
  });
});
