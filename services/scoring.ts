/**
 * IELTS Scoring Engine — Server-side implementation.
 *
 * Tính điểm IELTS dựa trên câu trả lời của user.
 * Port 1:1 từ PHP `calculate_score()`.
 *
 * @origin functions.php L1014–1452
 * @see LEGACY_CODEBASE_DOCS.md#4-scoring-engine
 */

import type { QuizWithPassages, QuizQuestion } from "./types/quiz";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** User answer can be a string, number, array of indices, object map, or null/undefined */
type UserAnswer = string | number | number[] | Record<string, string> | null | undefined;

/** Rich result from the scoring engine */
export type ScoreResult = {
    /** Band score from 0.0 to 9.0 (step 0.5) */
    score: number;
    /** Number of correctly answered sub-questions */
    totalCorrect: number;
    /** Total number of scored sub-questions */
    totalQuestions: number;
    /** Number of questions with no answer provided */
    unanswered: number;
};

/** Internal question representation with associated passage content for heading layout */
type ScoringQuestion = QuizQuestion & {
    associated_passage_content?: string;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Extract content enclosed in curly braces `{...}` from text.
 * Used for summary/heading matching and fillup question parsing.
 *
 * @origin functions.php L1456–1469
 */
function extractWords(text: string): string[] {
    const regex = /\{(.*?)\}/g;
    const results: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
        if (match[1].trim() !== "") {
            results.push(match[1].trim().replace(/\s*\|\s*/g, "|"));
        }
    }
    return results;
}

// ---------------------------------------------------------------------------
// Per-type scoring handlers
// ---------------------------------------------------------------------------

/**
 * Score radio / select questions.
 * Each sub-question in `list_of_questions` is scored independently:
 * compare `(string)user_answer == (string)correct`.
 *
 * @origin functions.php L1060–1105 (radio), L1106–1145 (select — same logic)
 */
function scoreRadioOrSelect(
    question: ScoringQuestion,
    answers: UserAnswer[],
    answerIndex: number,
): { correct: number; total: number; nextIndex: number } {
    const subQuestions = question.list_of_questions ?? [];
    let correct = 0;
    let idx = answerIndex;

    for (const subQ of subQuestions) {
        const userAnswer = answers[idx];
        const correctFlag = subQ.correct;

        // PHP: (string)$user_answer == (string)$correct_flag
        if (userAnswer != null && String(userAnswer) === String(correctFlag)) {
            correct++;
        }
        idx++;
    }

    return { correct, total: subQuestions.length, nextIndex: idx };
}

/**
 * Score fillup (fill-in-the-blank) questions.
 * Compare user text (case-insensitive) against correct answers,
 * supporting "/" separator for multiple accepted answers.
 *
 * @origin functions.php L1147–1200
 */
function scoreFillup(
    question: ScoringQuestion,
    answers: UserAnswer[],
    answerIndex: number,
): { correct: number; total: number; nextIndex: number } {
    const explanations = question.explanations ?? [];
    let correct = 0;
    let idx = answerIndex;

    for (const explanation of explanations) {
        const userAnswer = answers[idx];
        const userStr = String(userAnswer ?? "").trim().toLowerCase();

        // PHP: split("/", $correct) → array of accepted answers
        const correctAnswers = (explanation.content ?? "")
            .split("/")
            .map((w) => w.trim().toLowerCase());

        if (userStr !== "" && correctAnswers.includes(userStr)) {
            correct++;
        }
        idx++;
    }

    return { correct, total: explanations.length, nextIndex: idx };
}

/**
 * Score checkbox questions.
 * All-or-nothing: user must select exactly the correct set of indices.
 *
 * @origin functions.php L1202–1260
 */
function scoreCheckbox(
    question: ScoringQuestion,
    answers: UserAnswer[],
    answerIndex: number,
): { correct: number; total: number; nextIndex: number } {
    const options = question.list_of_options ?? [];

    // Build sorted array of correct indices
    const correctIndices = options
        .map((opt, i) => (opt.correct ? i : -1))
        .filter((i) => i !== -1)
        .sort((a, b) => a - b);

    const total = correctIndices.length || 1;

    // Get user answer (array of selected indices), sort for comparison
    const rawAnswer = answers[answerIndex];
    const userIndices = Array.isArray(rawAnswer)
        ? rawAnswer.map(Number).sort((a, b) => a - b)
        : [];

    // PHP: sort($user) == sort($correct) → all-or-nothing
    const isCorrect =
        userIndices.length === correctIndices.length &&
        userIndices.every((val, i) => val === correctIndices[i]);

    return {
        correct: isCorrect ? correctIndices.length : 0,
        total,
        nextIndex: answerIndex + 1,
    };
}

/**
 * Score matching questions (3 layouts: standard, summary, heading).
 *
 * @origin functions.php L1262–1380
 */
function scoreMatching(
    question: ScoringQuestion,
    answers: UserAnswer[],
    answerIndex: number,
): { correct: number; total: number; nextIndex: number } {
    const matchingData = question.matching_question;
    if (!matchingData) {
        return { correct: 0, total: 0, nextIndex: answerIndex + 1 };
    }

    const layoutType = (matchingData.layout_type ?? "standard").trim().toLowerCase();
    const answerOptions = matchingData.answer_options ?? [];
    const userAnswerObj: Record<string, string> =
        typeof answers[answerIndex] === "object" && answers[answerIndex] !== null
            ? (answers[answerIndex] as Record<string, string>)
            : {};

    let correct = 0;
    let total = 0;

    if (layoutType === "standard") {
        // Standard: compare user-selected option text vs correctAnswer
        // @origin functions.php L1280–1310
        const matchingItems = matchingData.matching_items ?? [];
        total = matchingItems.length;

        matchingItems.forEach((item, index) => {
            const userOptionIndex = userAnswerObj[String(index)];
            if (userOptionIndex == null) return;

            const optIdx = Number(userOptionIndex);
            const userText = answerOptions[optIdx]?.option_text ?? "";
            const correctText = item.correctAnswer ?? "";

            if (userText.trim().toLowerCase() === correctText.trim().toLowerCase()) {
                correct++;
            }
        });
    } else if (layoutType === "summary") {
        // Summary: extract correct answers from summary_text via {}, compare with user selection
        // @origin functions.php L1312–1350
        const correctAnswers = extractWords(matchingData.summary_text ?? "");
        total = correctAnswers.length;

        correctAnswers.forEach((correctText, gapIndex) => {
            const userOptionId = userAnswerObj[String(gapIndex)];
            if (userOptionId == null) return;

            // User answer format: "option-0-2" → last part is the option index
            const parts = userOptionId.split("-");
            const optIdx = parseInt(parts[parts.length - 1], 10);
            if (isNaN(optIdx)) return;

            const userText = answerOptions[optIdx]?.option_text ?? "";
            if (userText.trim().toLowerCase() === correctText.trim().toLowerCase()) {
                correct++;
            }
        });
    } else if (layoutType === "heading") {
        // Heading: same as summary but uses associated_passage_content instead of summary_text
        // @origin functions.php L1352–1380
        const correctAnswers = extractWords(question.associated_passage_content ?? "");
        total = correctAnswers.length;

        correctAnswers.forEach((correctText, gapIndex) => {
            const userOptionId = userAnswerObj[String(gapIndex)];
            if (userOptionId == null) return;

            const parts = userOptionId.split("-");
            const optIdx = parseInt(parts[parts.length - 1], 10);
            if (isNaN(optIdx)) return;

            const userText = answerOptions[optIdx]?.option_text ?? "";
            if (userText.trim().toLowerCase() === correctText.trim().toLowerCase()) {
                correct++;
            }
        });
    }

    return { correct, total, nextIndex: answerIndex + 1 };
}

/**
 * Score matrix questions.
 * Compare user-selected category letter vs correct_category_letter.
 *
 * @origin functions.php L1382–1430
 */
function scoreMatrix(
    question: ScoringQuestion,
    answers: UserAnswer[],
    answerIndex: number,
): { correct: number; total: number; nextIndex: number } {
    const matrixData = question.matrix_question;
    if (!matrixData) {
        return { correct: 0, total: 0, nextIndex: answerIndex + 1 };
    }

    const matrixItems = matrixData.matrix_items ?? [];
    const categories = matrixData.matrix_categories ?? [];
    const userAnswerObj: Record<string, string> =
        typeof answers[answerIndex] === "object" && answers[answerIndex] !== null
            ? (answers[answerIndex] as Record<string, string>)
            : {};

    let correct = 0;
    const total = matrixItems.length;

    matrixItems.forEach((item, rowIndex) => {
        const userCategoryId = userAnswerObj[String(rowIndex)];
        if (userCategoryId == null) return;

        // User answer format: "cat-0-1" → last part is the category index
        const parts = userCategoryId.split("-");
        const catIdx = parseInt(parts[parts.length - 1], 10);
        if (isNaN(catIdx)) return;

        const userLetter = (categories[catIdx]?.category_letter ?? "").trim().toLowerCase();
        const correctLetter = (item.correct_category_letter ?? "").trim().toLowerCase();

        if (userLetter !== "" && userLetter === correctLetter) {
            correct++;
        }
    });

    return { correct, total, nextIndex: answerIndex + 1 };
}

// ---------------------------------------------------------------------------
// Main scoring function
// ---------------------------------------------------------------------------

/**
 * Tính điểm IELTS dựa trên câu trả lời của user.
 *
 * @param answers - Mảng phẳng câu trả lời (mỗi phần tử là 1 question group)
 * @param quiz - Quiz object kèm passages + questions (nested)
 * @param testPart - Mảng indices passages được chọn [0, 1, 2]
 * @returns Score từ 0.0 đến 9.0 (bước 0.5)
 *
 * @origin functions.php L1014–1452
 * @see LEGACY_CODEBASE_DOCS.md#4-scoring-engine
 */
export function calculateScore(
    answers: UserAnswer[] | null | undefined,
    quiz: QuizWithPassages | null | undefined,
    testPart: number[] | null | undefined,
): ScoreResult {
    const EMPTY_RESULT: ScoreResult = { score: 0, totalCorrect: 0, totalQuestions: 0, unanswered: 0 };

    // Guard: invalid input → score 0
    const safeAnswers: UserAnswer[] = Array.isArray(answers) ? answers : [];
    const safeTestPart: number[] = Array.isArray(testPart) ? testPart : [];

    if (!quiz?.passages) {
        return EMPTY_RESULT;
    }

    // Step 1: Filter passages by testPart indices
    // @origin functions.php L1020–1035
    const selectedPassages = quiz.passages.filter((_, index) =>
        safeTestPart.includes(index),
    );

    // Step 2: Flatten questions across passages, attach associated_passage_content
    // @origin functions.php L1037–1055
    const allQuestions: ScoringQuestion[] = [];
    for (const passage of selectedPassages) {
        for (const question of passage.questions ?? []) {
            allQuestions.push({
                ...question,
                associated_passage_content: passage.content,
            });
        }
    }

    // Step 3: Score each question
    // @origin functions.php L1057–1440
    let totalCorrect = 0;
    let totalQuestions = 0;
    let answerIndex = 0;

    for (const question of allQuestions) {
        const qType = question.type;
        let result: { correct: number; total: number; nextIndex: number };

        switch (qType) {
            case "radio":
            case "select":
                result = scoreRadioOrSelect(question, safeAnswers, answerIndex);
                break;

            case "fillup":
                result = scoreFillup(question, safeAnswers, answerIndex);
                break;

            case "checkbox":
                result = scoreCheckbox(question, safeAnswers, answerIndex);
                break;

            case "matching":
                result = scoreMatching(question, safeAnswers, answerIndex);
                break;

            case "matrix":
                result = scoreMatrix(question, safeAnswers, answerIndex);
                break;

            default:
                // Unknown question type — skip with 0 score
                result = { correct: 0, total: 0, nextIndex: answerIndex + 1 };
                break;
        }

        totalCorrect += result.correct;
        totalQuestions += result.total;
        answerIndex = result.nextIndex;
    }

    // Step 4: Count unanswered questions
    let unanswered = 0;
    let checkIdx = 0;
    for (const question of allQuestions) {
        const subCount = (question.list_of_questions ?? []).length || 1;
        for (let i = 0; i < subCount; i++) {
            const ans = safeAnswers[checkIdx + i];
            if (ans === null || ans === undefined || ans === "") {
                unanswered++;
            }
        }
        checkIdx += subCount;
    }

    // Step 5: Calculate final score
    // Round score to nearest 0.5: round(raw * 2) / 2
    // @origin functions.php L1442–1452
    if (totalQuestions === 0) {
        return EMPTY_RESULT;
    }

    const rawScore = (totalCorrect / totalQuestions) * 9;
    const roundedScore = Math.round(rawScore * 2) / 2;

    return {
        score: roundedScore,
        totalCorrect,
        totalQuestions,
        unanswered,
    };
}
