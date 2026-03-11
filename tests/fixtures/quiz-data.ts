/**
 * Test Fixtures — Quiz data mẫu cho tất cả 6 loại câu hỏi
 *
 * Mỗi fixture là một QuizWithPassages hoàn chỉnh, sẵn sàng dùng cho calculateScore().
 */

import type { QuizWithPassages, QuizPassage, QuizQuestion } from "../../services/types/quiz";

// ============================================================================
// Helper: build quiz wrapper
// ============================================================================

function buildQuiz(passages: QuizPassage[]): QuizWithPassages {
  return {
    id: "quiz-test-001",
    title: "Test Quiz",
    passages,
  };
}

function buildPassage(
  questions: QuizQuestion[],
  overrides: Partial<QuizPassage> = {}
): QuizPassage {
  return {
    id: overrides.id ?? "passage-001",
    title: overrides.title ?? "Test Passage",
    content: overrides.content ?? "<p>Some passage content</p>",
    sort_order: overrides.sort_order ?? 0,
    questions,
  };
}

// ============================================================================
// 1. RADIO — 3 sub-questions, 4 options each
// ============================================================================

export const radioQuestion: QuizQuestion = {
  id: "q-radio-001",
  type: "radio",
  title: "Questions 1-3",
  sort_order: 0,
  list_of_questions: [
    {
      question: "What is the capital of England?",
      correct: "0", // London (index 0)
      options: [
        { option_text: "London" },
        { option_text: "Paris" },
        { option_text: "Berlin" },
        { option_text: "Madrid" },
      ],
    },
    {
      question: "What is the capital of France?",
      correct: "2", // Paris (index 2)
      options: [
        { option_text: "London" },
        { option_text: "Berlin" },
        { option_text: "Paris" },
        { option_text: "Rome" },
      ],
    },
    {
      question: "What is the capital of Germany?",
      correct: "1", // Berlin (index 1)
      options: [
        { option_text: "Vienna" },
        { option_text: "Berlin" },
        { option_text: "Zurich" },
        { option_text: "Munich" },
      ],
    },
  ],
};

/** Answers: all correct → "0", "2", "1" */
export const radioAnswersAllCorrect = ["0", "2", "1"];
/** Answers: 1 correct (first only) */
export const radioAnswersPartial = ["0", "0", "0"];
/** Answers: all wrong */
export const radioAnswersAllWrong = ["3", "3", "3"];

export const radioQuiz = buildQuiz([buildPassage([radioQuestion])]);

// ============================================================================
// 2. SELECT — 2 sub-questions (same structure as radio)
// ============================================================================

export const selectQuestion: QuizQuestion = {
  id: "q-select-001",
  type: "select",
  title: "Questions 4-5",
  sort_order: 0,
  list_of_questions: [
    {
      question: "Choose the largest ocean",
      correct: "1", // Pacific (index 1)
      options: [
        { option_text: "Atlantic" },
        { option_text: "Pacific" },
        { option_text: "Indian" },
      ],
    },
    {
      question: "Choose the longest river",
      correct: "0", // Nile (index 0)
      options: [
        { option_text: "Nile" },
        { option_text: "Amazon" },
        { option_text: "Yangtze" },
      ],
    },
  ],
};

export const selectAnswersAllCorrect = ["1", "0"];
export const selectAnswersAllWrong = ["0", "1"];

export const selectQuiz = buildQuiz([buildPassage([selectQuestion])]);

// ============================================================================
// 3. FILLUP — 3 blanks with "/" separator for alternates
// ============================================================================

export const fillupQuestion: QuizQuestion = {
  id: "q-fillup-001",
  type: "fillup",
  title: "Questions 6-8",
  sort_order: 0,
  explanations: [
    { content: "London" },
    { content: "Paris / paris / PARIS" },
    { content: "New York / NYC" },
  ],
};

/** Answers: all correct (various cases) */
export const fillupAnswersAllCorrect = ["london", "Paris", "NYC"];
/** Answers: 2 correct */
export const fillupAnswersPartial = ["London", "Berlin", "New York"];
/** Answers: all wrong */
export const fillupAnswersAllWrong = ["Tokyo", "Beijing", "Moscow"];

export const fillupQuiz = buildQuiz([buildPassage([fillupQuestion])]);

// ============================================================================
// 4. CHECKBOX — 6 options, correct: indices 1, 3, 5 (all-or-nothing)
// ============================================================================

export const checkboxQuestion: QuizQuestion = {
  id: "q-checkbox-001",
  type: "checkbox",
  title: "Question 9",
  sort_order: 0,
  list_of_options: [
    { option_text: "Option A", correct: false },
    { option_text: "Option B", correct: true },
    { option_text: "Option C", correct: false },
    { option_text: "Option D", correct: true },
    { option_text: "Option E", correct: false },
    { option_text: "Option F", correct: true },
  ],
};

/** All correct: [1, 3, 5] */
export const checkboxAnswerCorrect = [1, 3, 5];
/** Partial (missing one) — scores 0 (all-or-nothing) */
export const checkboxAnswerPartial = [1, 3];
/** Wrong order but correct set — should still score correctly */
export const checkboxAnswerCorrectUnsorted = [5, 1, 3];
/** All wrong */
export const checkboxAnswerWrong = [0, 2, 4];

export const checkboxQuiz = buildQuiz([buildPassage([checkboxQuestion])]);

// ============================================================================
// 5. MATCHING — Standard Layout (4 items)
// ============================================================================

export const matchingStandardQuestion: QuizQuestion = {
  id: "q-matching-std-001",
  type: "matching",
  title: "Questions 10-13",
  sort_order: 0,
  matching_question: {
    layout_type: "standard",
    matching_items: [
      { questionPart: "Capital of Japan", correctAnswer: "Tokyo" },
      { questionPart: "Capital of Italy", correctAnswer: "Rome" },
      { questionPart: "Capital of Spain", correctAnswer: "Madrid" },
      { questionPart: "Capital of Brazil", correctAnswer: "Brasilia" },
    ],
    answer_options: [
      { option_text: "Tokyo" },    // 0
      { option_text: "Rome" },     // 1
      { option_text: "Madrid" },   // 2
      { option_text: "Brasilia" }, // 3
      { option_text: "Lisbon" },   // 4 (distractor)
    ],
  },
};

/** All correct: {0: "0", 1: "1", 2: "2", 3: "3"} */
export const matchingStdAnswerCorrect: Record<string, string> = {
  "0": "0", // Tokyo
  "1": "1", // Rome
  "2": "2", // Madrid
  "3": "3", // Brasilia
};
/** Partial: 2/4 correct */
export const matchingStdAnswerPartial: Record<string, string> = {
  "0": "0", // Tokyo ✓
  "1": "2", // ✗
  "2": "1", // ✗
  "3": "3", // Brasilia ✓
};

export const matchingStandardQuiz = buildQuiz([
  buildPassage([matchingStandardQuestion]),
]);

// ============================================================================
// 6. MATCHING — Summary Layout (gaps in summary_text)
// ============================================================================

export const matchingSummaryQuestion: QuizQuestion = {
  id: "q-matching-sum-001",
  type: "matching",
  title: "Questions 14-16",
  sort_order: 0,
  matching_question: {
    layout_type: "summary",
    matching_items: [],
    answer_options: [
      { option_text: "carbon dioxide" }, // 0
      { option_text: "oxygen" },         // 1
      { option_text: "nitrogen" },       // 2
      { option_text: "methane" },        // 3
    ],
    summary_text:
      "Plants absorb {carbon dioxide} from the air and release {oxygen}. The atmosphere is mostly composed of {nitrogen}.",
  },
};

/** All correct: user picks option indices that match gap answers */
export const matchingSumAnswerCorrect: Record<string, string> = {
  "0": "option-0-0", // carbon dioxide (index 0)
  "1": "option-1-1", // oxygen (index 1)
  "2": "option-2-2", // nitrogen (index 2)
};
/** Partial: 1/3 */
export const matchingSumAnswerPartial: Record<string, string> = {
  "0": "option-0-0", // carbon dioxide ✓
  "1": "option-1-3", // methane ✗
  "2": "option-2-3", // methane ✗
};

export const matchingSummaryQuiz = buildQuiz([
  buildPassage([matchingSummaryQuestion]),
]);

// ============================================================================
// 7. MATCHING — Heading Layout (gaps in passage content)
// ============================================================================

export const matchingHeadingQuestion: QuizQuestion = {
  id: "q-matching-head-001",
  type: "matching",
  title: "Questions 17-18",
  sort_order: 0,
  matching_question: {
    layout_type: "heading",
    matching_items: [],
    answer_options: [
      { option_text: "Introduction" },  // 0
      { option_text: "Conclusion" },    // 1
      { option_text: "Method" },        // 2
      { option_text: "Results" },       // 3
    ],
  },
};

/** Passage content contains {gaps} for heading layout */
const headingPassageContent =
  "<p>{Introduction}</p><p>This study examines...</p><p>{Method}</p><p>We collected data...</p>";

export const matchingHeadingAnswerCorrect: Record<string, string> = {
  "0": "option-0-0", // Introduction (index 0)
  "1": "option-1-2", // Method (index 2)
};
export const matchingHeadingAnswerPartial: Record<string, string> = {
  "0": "option-0-0", // ✓
  "1": "option-1-1", // Conclusion ✗
};

export const matchingHeadingQuiz = buildQuiz([
  buildPassage([matchingHeadingQuestion], {
    content: headingPassageContent,
  }),
]);

// ============================================================================
// 8. MATRIX — 3 categories, 4 items
// ============================================================================

export const matrixQuestion: QuizQuestion = {
  id: "q-matrix-001",
  type: "matrix",
  title: "Questions 19-22",
  sort_order: 0,
  matrix_question: {
    matrix_categories: [
      { category_letter: "A", category_text: "Mammals" },
      { category_letter: "B", category_text: "Reptiles" },
      { category_letter: "C", category_text: "Birds" },
    ],
    matrix_items: [
      { item_text: "Dog", correct_category_letter: "A" },
      { item_text: "Snake", correct_category_letter: "B" },
      { item_text: "Eagle", correct_category_letter: "C" },
      { item_text: "Cat", correct_category_letter: "A" },
    ],
  },
};

/** All correct: {0: "cat-0-0", 1: "cat-1-1", 2: "cat-2-2", 3: "cat-3-0"} */
export const matrixAnswerCorrect: Record<string, string> = {
  "0": "cat-0-0", // A → Mammals
  "1": "cat-1-1", // B → Reptiles
  "2": "cat-2-2", // C → Birds
  "3": "cat-3-0", // A → Mammals
};
/** Partial: 2/4 */
export const matrixAnswerPartial: Record<string, string> = {
  "0": "cat-0-0", // ✓
  "1": "cat-1-2", // ✗ (picked Birds instead of Reptiles)
  "2": "cat-2-2", // ✓
  "3": "cat-3-1", // ✗ (picked Reptiles instead of Mammals)
};

export const matrixQuiz = buildQuiz([buildPassage([matrixQuestion])]);

// ============================================================================
// 9. MIXED QUIZ — All 6 types in one quiz (3 passages)
// ============================================================================

export const mixedQuiz = buildQuiz([
  buildPassage([radioQuestion, fillupQuestion], {
    id: "passage-mixed-1",
    sort_order: 0,
  }),
  buildPassage([checkboxQuestion, matchingStandardQuestion], {
    id: "passage-mixed-2",
    sort_order: 1,
  }),
  buildPassage([selectQuestion, matrixQuestion], {
    id: "passage-mixed-3",
    sort_order: 2,
  }),
]);

/**
 * All-correct answers for the mixed quiz (flat array):
 * Passage 1: radio (3 slots) + fillup (3 slots) = 6
 * Passage 2: checkbox (1 slot) + matching-std (1 slot) = 2
 * Passage 3: select (2 slots) + matrix (1 slot) = 3
 * Total: 11 slots
 */
export const mixedAnswersAllCorrect = [
  // Passage 1 — radio
  "0", "2", "1",
  // Passage 1 — fillup
  "London", "Paris", "New York",
  // Passage 2 — checkbox
  [1, 3, 5],
  // Passage 2 — matching standard
  matchingStdAnswerCorrect,
  // Passage 3 — select
  "1", "0",
  // Passage 3 — matrix
  matrixAnswerCorrect,
];

/**
 * Total questions in the mixed quiz:
 * radio: 3, fillup: 3, checkbox: 3 (correct count), matching: 4, select: 2, matrix: 4
 * Total: 19
 */
export const mixedQuizTotalQuestions = 19;
