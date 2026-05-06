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
import { lookupBandScore, isFullTestType } from "./lib/band-score-table";

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
    if (!text) return [];
    const regex = /\{(.*?)\}/g;
    let match: RegExpExecArray | null;
    const results: string[] = [];
    while ((match = regex.exec(text)) !== null) {
        results.push(match[1].trim());
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
function scoreRadio(
    question: ScoringQuestion,
    answers: UserAnswer[],
    answerIndex: number,
): { correct: number; total: number; nextIndex: number } {
    const subQuestions = question.list_of_questions ?? [];
    let correct = 0;
    let idx = answerIndex;

    for (const subQ of subQuestions) {
        const userAnswer = answers[idx];
        const correctFlag = subQ.correct ?? 0;

        if (userAnswer != null && String(userAnswer) === String(correctFlag)) {
            correct++;
        }
        idx++;
    }

    return { correct, total: subQuestions.length, nextIndex: idx };
}

function scoreSelect(
    question: ScoringQuestion,
    answers: UserAnswer[],
    answerIndex: number,
): { correct: number; total: number; nextIndex: number } {
    const correctAnswersFromText = extractWords(question.question_text || "");
    const optionsList = question.list_of_options || [];
    let correct = 0;
    let idx = answerIndex;

    const totalFromText = correctAnswersFromText.length;

    if (totalFromText === 0 && question.list_of_questions && question.list_of_questions.length > 0) {
        // FALLBACK: Use list_of_questions exactly like Radio
        const subQuestions = question.list_of_questions;
        for (const subQ of subQuestions) {
            const userAnswer = answers[idx];
            const correctFlag = subQ.correct ?? 0;
            if (userAnswer != null && String(userAnswer) === String(correctFlag)) {
                correct++;
            }
            idx++;
        }
        return { correct, total: subQuestions.length, nextIndex: idx };
    }

    correctAnswersFromText.forEach(correctAnswerText => {
        const userAnswerIndex = answers[idx] as number;
        const opt = optionsList[userAnswerIndex] as Record<string, unknown> | undefined;
        // DB lưu list_of_options[i].option (camelCase rút gọn); test fixtures dùng option_text.
        const userAnswerText =
            (opt?.option_text as string | undefined) ??
            (opt?.option as string | undefined) ??
            null;

        if (userAnswerText?.trim().toLowerCase() === correctAnswerText.trim().toLowerCase()) {
            correct++;
        }
        idx++;
    });

    return { correct, total: totalFromText, nextIndex: idx };
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
    let correct = 0;
    let idx = answerIndex;

    const correctAnswersFromText = extractWords(question.question_text || "");
    
    if (correctAnswersFromText.length > 0) {
        const total = correctAnswersFromText.length;
        correctAnswersFromText.forEach(correctWordWithOptions => {
            const possibleCorrectAnswers = correctWordWithOptions.split("|").map(w => w.trim().toLowerCase());
            const userAnswerRaw = answers[idx];
            const userAnswer = String(userAnswerRaw ?? "").trim().toLowerCase();
            
            if (userAnswer !== "" && possibleCorrectAnswers.includes(userAnswer)) {
                correct++;
            }
            idx++;
        });
        return { correct, total, nextIndex: idx };
    } else {
        const explanations = question.explanations ?? [];
        const total = explanations.length;
        for (const explanation of explanations) {
            const userAnswerRaw = answers[idx];
            const userAnswer = String(userAnswerRaw ?? "").trim().toLowerCase();
            const possibleCorrectAnswers = (explanation.content ?? "").split("/").map((w) => w.trim().toLowerCase());

            if (userAnswer !== "" && possibleCorrectAnswers.includes(userAnswer)) {
                correct++;
            }
            idx++;
        }
        return { correct, total, nextIndex: idx };
    }
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

    let correct = 0;

    if (total === 1) {
        const userChoiceIndex = userIndices.length > 0 ? userIndices[0] : undefined;
        const correctChoiceIndex = correctIndices.length > 0 ? correctIndices[0] : undefined;
        if (userChoiceIndex !== undefined && userChoiceIndex === correctChoiceIndex) {
            correct = 1;
        }
    } else {
        userIndices.forEach((userChoiceIndex) => {
            if (correctIndices.includes(userChoiceIndex)) {
                correct++;
            }
        });
        // Cap correct at total just in case
        correct = Math.min(correct, total);
    }

    return {
        correct,
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
    const matchingData = question.matching_question as Record<string, unknown> | undefined;
    if (!matchingData) {
        return { correct: 0, total: 0, nextIndex: answerIndex + 1 };
    }

    // DB lưu JSONB dạng camelCase; test fixtures dùng snake_case — đọc cả hai.
    const layoutType = String(
        (matchingData.layout_type ?? matchingData.layoutType ?? "standard"),
    ).trim().toLowerCase();
    const answerOptions = (matchingData.answer_options ?? matchingData.answerOptions ?? []) as Array<Record<string, unknown>>;
    const getOptionText = (idx: number): string =>
        String(answerOptions[idx]?.option_text ?? answerOptions[idx]?.optionText ?? "");

    const userAnswerObj: Record<string, string> =
        typeof answers[answerIndex] === "object" && answers[answerIndex] !== null
            ? (answers[answerIndex] as Record<string, string>)
            : {};

    let correct = 0;
    let total = 0;

    if (layoutType === "standard") {
        // Standard: compare user-selected option text vs correctAnswer
        // @origin functions.php L1280–1310
        const matchingItems = (matchingData.matching_items ?? matchingData.matchingItems ?? []) as Array<Record<string, unknown>>;
        total = matchingItems.length;

        matchingItems.forEach((item, index) => {
            const userOptionIndex = userAnswerObj[String(index)];
            if (userOptionIndex == null) return;

            const optIdx = Number(userOptionIndex);
            const userText = getOptionText(optIdx);
            const rawCorrect = String(item.correctAnswer ?? item.correct_answer ?? "").trim();

            // If correctAnswer is just a letter (A-Z), treat it as an option index reference
            const letterMatch = /^[A-Z]$/i.test(rawCorrect);
            const correctOptionIdx = letterMatch
                ? rawCorrect.toUpperCase().charCodeAt(0) - 65
                : -1;

            if (
                (correctOptionIdx >= 0 && optIdx === correctOptionIdx) ||
                userText.trim().toLowerCase() === rawCorrect.toLowerCase()
            ) {
                correct++;
            }
        });
    } else if (layoutType === "summary") {
        // Summary: extract correct answers from summary_text via {}, compare with user selection
        // @origin functions.php L1312–1350
        const summaryText = String(matchingData.summary_text ?? matchingData.summaryText ?? "");
        const correctAnswers = extractWords(summaryText);
        total = correctAnswers.length;

        correctAnswers.forEach((correctText, gapIndex) => {
            const rawUserChoice = userAnswerObj[String(gapIndex)];
            if (rawUserChoice == null || rawUserChoice === "") return;

            // userAnswerObj entries are normally "option-<start>-<idx>" strings
            // dropped by the take-the-test DnD layer, but legacy / cross-mode
            // payloads can hand us a raw number index. Coerce to string before
            // .split() so submit doesn't crash with "split is not a function".
            const asString = String(rawUserChoice);
            const parts = asString.split("-");
            const optIdx = parseInt(parts[parts.length - 1], 10);
            if (isNaN(optIdx)) return;

            const userText = getOptionText(optIdx);
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
            const rawUserChoice = userAnswerObj[String(gapIndex)];
            if (rawUserChoice == null || rawUserChoice === "") return;

            const asString = String(rawUserChoice);
            const parts = asString.split("-");
            const optIdx = parseInt(parts[parts.length - 1], 10);
            if (isNaN(optIdx)) return;

            const userText = getOptionText(optIdx);
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
    const matrixData = question.matrix_question as Record<string, unknown> | undefined;
    if (!matrixData) {
        return { correct: 0, total: 0, nextIndex: answerIndex + 1 };
    }

    // DB lưu JSONB dạng camelCase; test fixtures dùng snake_case — đọc cả hai.
    const matrixItems = (matrixData.matrix_items ?? matrixData.matrixItems ?? []) as Array<Record<string, unknown>>;
    const categories = (matrixData.matrix_categories ?? matrixData.matrixCategories ?? []) as Array<Record<string, unknown>>;
    const userAnswerObj: Record<string, string> =
        typeof answers[answerIndex] === "object" && answers[answerIndex] !== null
            ? (answers[answerIndex] as Record<string, string>)
            : {};

    let correct = 0;
    const total = matrixItems.length;

    matrixItems.forEach((item, rowIndex) => {
        const userCategoryRaw = userAnswerObj[String(rowIndex)];
        if (userCategoryRaw == null) return;

        // User answer can be either:
        //  - "cat-0-1" → last part is the category index (legacy id format), OR
        //  - a direct letter like "A" / "B" (current client behavior, see calculateScore)
        const userCategoryStr = String(userCategoryRaw).trim();
        let userLetter = "";
        if (userCategoryStr.includes("-")) {
            const parts = userCategoryStr.split("-");
            const catIdx = parseInt(parts[parts.length - 1], 10);
            if (!isNaN(catIdx)) {
                userLetter = String(
                    categories[catIdx]?.category_letter ?? categories[catIdx]?.categoryLetter ?? "",
                ).trim().toLowerCase();
            }
        } else {
            userLetter = userCategoryStr.toLowerCase();
        }

        const correctLetter = String(
            item.correct_category_letter ?? item.correctCategoryLetter ?? "",
        ).trim().toLowerCase();

        if (userLetter !== "" && userLetter === correctLetter) {
            correct++;
        }
    });

    return { correct, total, nextIndex: answerIndex + 1 };
}

/**
 * Ước lượng tổng số sub-question slot mà UI sẽ render khi padded mode.
 * Dùng để phát hiện answers array là "padded" hay "packed" (test fixtures).
 */
function estimateSubSlotCount(questions: ScoringQuestion[]): number {
    let count = 0;
    for (const q of questions) {
        switch (q.type) {
            case "radio": {
                count += (q.list_of_questions ?? []).length || 1;
                break;
            }
            case "select": {
                const braces = extractWords(q.question_text || "").length;
                count += braces || (q.list_of_questions ?? []).length || 1;
                break;
            }
            case "fillup": {
                const braces = extractWords(q.question_text || "").length;
                count += braces || (q.explanations ?? []).length || 1;
                break;
            }
            case "checkbox": {
                const corr = (q.list_of_options ?? []).filter((o) => o.correct).length;
                count += corr || 1;
                break;
            }
            case "matrix": {
                const md = q.matrix_question as Record<string, unknown> | undefined;
                const items =
                    (md?.matrix_items as unknown[] | undefined) ??
                    (md?.matrixItems as unknown[] | undefined) ??
                    [];
                count += items.length || 1;
                break;
            }
            case "matching": {
                const md = q.matching_question as Record<string, unknown> | undefined;
                const layout = String(
                    (md?.layout_type ?? md?.layoutType ?? "standard") as string,
                ).toLowerCase();
                if (layout === "summary") {
                    const text = String(
                        (md?.summary_text ?? md?.summaryText ?? "") as string,
                    );
                    count += extractWords(text).length || 1;
                } else if (layout === "heading") {
                    count +=
                        extractWords(q.associated_passage_content ?? "").length || 1;
                } else {
                    const items =
                        (md?.matching_items as unknown[] | undefined) ??
                        (md?.matchingItems as unknown[] | undefined) ??
                        [];
                    count += items.length || 1;
                }
                break;
            }
            default:
                count += 1;
                break;
        }
    }
    return count;
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

    // UI lưu answers theo dạng "padded": mỗi sub-question chiếm 1 slot, riêng
    // matrix/matching/checkbox có dữ liệu ở slot đầu + (total-1) slot null.
    // Test fixtures (legacy) lưu "packed": mỗi câu chiếm đúng 1 slot.
    // Chọn mode bằng "khoảng cách": answers.length nào gần hơn — questionCount
    // (packed) hay expectedSubSlots (padded). Tolerant với trailing nulls bị drop.
    const expectedSubSlots = estimateSubSlotCount(allQuestions);
    const questionCount = allQuestions.length;
    const distToPacked = Math.abs(safeAnswers.length - questionCount);
    const distToPadded = Math.abs(safeAnswers.length - expectedSubSlots);
    const padded = expectedSubSlots > 0 && distToPadded < distToPacked;

    for (const question of allQuestions) {
        const qType = question.type;
        let result: { correct: number; total: number; nextIndex: number };

        switch (qType) {
            case "radio":
                result = scoreRadio(question, safeAnswers, answerIndex);
                break;

            case "select":
                result = scoreSelect(question, safeAnswers, answerIndex);
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

        // matrix/matching/checkbox chỉ chiếm 1 slot trong "packed",
        // hoặc total slots trong "padded" — handler trả nextIndex theo packed mode,
        // ở đây override theo mode thực tế của answers.
        const isMultiSubGrouped =
            qType === "matrix" || qType === "matching" || qType === "checkbox";
        if (padded && isMultiSubGrouped) {
            answerIndex += Math.max(result.total, 1);
        } else {
            answerIndex = result.nextIndex;
        }
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
    let roundedScore = Math.round(rawScore * 2) / 2;

    // Use official IELTS band score lookup for full tests (40 questions)
    // Academic/General/Exam types use the conversion table.
    // Practice tests (or partial tests) use the linear fallback.
    if (isFullTestType(quiz.type) && totalQuestions === 40) {
        roundedScore = lookupBandScore(totalCorrect, quiz.skill, quiz.type);
    }

    return {
        score: roundedScore,
        totalCorrect,
        totalQuestions,
        unanswered,
    };
}
