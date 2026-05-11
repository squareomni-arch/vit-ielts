import { calculateScore, type ScoreResult } from "./calculateScore";

type StoredAnswersPayload = {
  answers: unknown[];
  totalCorrect?: number | null;
  totalQuestions?: number | null;
};

type RawQuizQuestion = {
  type?: string | [string, string] | null;
  question_text?: string | null;
  list_of_questions?: unknown;
  list_of_options?: unknown;
  explanations?: unknown;
  matching_question?: unknown;
  matrix_question?: unknown;
  sort_order?: number | null;
};

type RawQuizPassage = {
  content?: string | null;
  questions?: RawQuizQuestion[] | null;
  sort_order?: number | null;
};

type RawQuizLike = {
  type?: string | null;
  passages?: RawQuizPassage[] | null;
};

const FULL_TEST_TYPES = new Set(["exam", "academic", "general"]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const tryParseJson = (value: unknown): unknown => {
  if (typeof value !== "string") {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const parseMaybeJson = <T,>(value: unknown): T | null => {
  const parsed = tryParseJson(value);
  return isRecord(parsed) || Array.isArray(parsed) ? (parsed as T) : null;
};

const normalizeQuestionOptionList = (value: unknown) => {
  const parsed = parseMaybeJson<Array<Record<string, unknown>>>(value);

  if (!Array.isArray(parsed)) {
    return undefined;
  }

  return parsed.map((option) => ({
    option: String(option.option_text ?? option.option ?? ""),
    correct:
      typeof option.correct === "boolean" ? option.correct : undefined,
  }));
};

const normalizeQuestionList = (value: unknown) => {
  const parsed = parseMaybeJson<Array<Record<string, unknown>>>(value);

  if (!Array.isArray(parsed)) {
    return undefined;
  }

  return parsed.map((question) => ({
    question: String(question.question ?? ""),
    correct:
      question.correct != null
        ? typeof question.correct === "string"
          ? parseInt(question.correct, 10) || 0
          : Number(question.correct)
        : 0,
    options: Array.isArray(question.options)
      ? question.options.map((option) => ({
          content: String(
            (option as Record<string, unknown>).option_text ??
              (option as Record<string, unknown>).content ??
              "",
          ),
        }))
      : [],
  }));
};

const normalizeExplanations = (value: unknown) => {
  const parsed = parseMaybeJson<Array<Record<string, unknown>>>(value);

  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed.map((explanation) => ({
    content: String(explanation.content ?? ""),
  }));
};

const normalizeMatchingQuestion = (value: unknown) => {
  const parsed = parseMaybeJson<Record<string, unknown>>(value);

  if (!parsed) {
    return undefined;
  }

  const matchingItems = Array.isArray(parsed.matching_items)
    ? parsed.matching_items
    : Array.isArray(parsed.matchingItems)
      ? parsed.matchingItems
      : [];

  const answerOptions = Array.isArray(parsed.answer_options)
    ? parsed.answer_options
    : Array.isArray(parsed.answerOptions)
      ? parsed.answerOptions
      : [];

  return {
    layoutType: String(parsed.layout_type ?? parsed.layoutType ?? ""),
    summaryText: String(parsed.summary_text ?? parsed.summaryText ?? ""),
    optionsTitle: String(parsed.options_title ?? parsed.optionsTitle ?? ""),
    matchingItems: matchingItems.map((item) => ({
      questionPart: String(
        (item as Record<string, unknown>).questionPart ??
          (item as Record<string, unknown>).question_part ??
          "",
      ),
      correctAnswer: String(
        (item as Record<string, unknown>).correctAnswer ??
          (item as Record<string, unknown>).correct_answer ??
          "",
      ),
    })),
    answerOptions: answerOptions.map((option) => ({
      optionText: String(
        (option as Record<string, unknown>).option_text ??
          (option as Record<string, unknown>).optionText ??
          "",
      ),
    })),
  };
};

const normalizeMatrixQuestion = (value: unknown) => {
  const parsed = parseMaybeJson<Record<string, unknown>>(value);

  if (!parsed) {
    return undefined;
  }

  const matrixCategories = Array.isArray(parsed.matrix_categories)
    ? parsed.matrix_categories
    : Array.isArray(parsed.matrixCategories)
      ? parsed.matrixCategories
      : [];

  const matrixItems = Array.isArray(parsed.matrix_items)
    ? parsed.matrix_items
    : Array.isArray(parsed.matrixItems)
      ? parsed.matrixItems
      : [];

  return {
    matrixCategories: matrixCategories.map((category) => ({
      categoryLetter: String(
        (category as Record<string, unknown>).category_letter ??
          (category as Record<string, unknown>).categoryLetter ??
          "",
      ),
      categoryText: String(
        (category as Record<string, unknown>).category_text ??
          (category as Record<string, unknown>).categoryText ??
          "",
      ),
    })),
    matrixItems: matrixItems.map((item) => ({
      itemText: String(
        (item as Record<string, unknown>).item_text ??
          (item as Record<string, unknown>).itemText ??
          "",
      ),
      correctCategoryLetter: String(
        (item as Record<string, unknown>).correct_category_letter ??
          (item as Record<string, unknown>).correctCategoryLetter ??
          "",
      ),
    })),
    layoutType: String(parsed.layout_type ?? parsed.layoutType ?? "standard"),
    legendTitle: String(parsed.legend_title ?? parsed.legendTitle ?? ""),
  };
};

export const normalizeStoredAnswers = (value: unknown): StoredAnswersPayload => {
  const parsed = tryParseJson(value);

  if (Array.isArray(parsed)) {
    return { answers: parsed };
  }

  if (!isRecord(parsed)) {
    return { answers: [] };
  }

  const nested = parsed.answers;

  if (Array.isArray(nested)) {
    return {
      answers: nested,
      totalCorrect:
        typeof parsed.totalCorrect === "number" ? parsed.totalCorrect : null,
      totalQuestions:
        typeof parsed.totalQuestions === "number" ? parsed.totalQuestions : null,
    };
  }

  if (nested !== undefined) {
    const normalizedNested = normalizeStoredAnswers(nested);

    return {
      answers: normalizedNested.answers,
      totalCorrect:
        typeof parsed.totalCorrect === "number"
          ? parsed.totalCorrect
          : normalizedNested.totalCorrect ?? null,
      totalQuestions:
        typeof parsed.totalQuestions === "number"
          ? parsed.totalQuestions
          : normalizedNested.totalQuestions ?? null,
    };
  }

  return {
    answers: [],
    totalCorrect:
      typeof parsed.totalCorrect === "number" ? parsed.totalCorrect : null,
    totalQuestions:
      typeof parsed.totalQuestions === "number" ? parsed.totalQuestions : null,
  };
};

export const normalizeTestPart = (
  value: unknown,
  passageCount: number,
): number[] => {
  const parsed = tryParseJson(value);
  const fallback = Array.from({ length: passageCount }, (_, index) => index);

  if (parsed === "all" || parsed == null) {
    return fallback;
  }

  if (!Array.isArray(parsed)) {
    return fallback;
  }

  const normalized = parsed
    .map((item) => Number(item))
    .filter((item) => Number.isInteger(item) && item >= 0 && item < passageCount);

  return normalized.length > 0 ? normalized : fallback;
};

export const getQuizType = (value: unknown): string | undefined => {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value) && typeof value[0] === "string") {
    return value[0];
  }

  if (!isRecord(value)) {
    return undefined;
  }

  if (isRecord(value.quizFields)) {
    return getQuizType(value.quizFields.type);
  }

  return undefined;
};

export const getQuizScoreType = (value: unknown): string | undefined => {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value) && typeof value[0] === "string") {
    return value[0];
  }

  if (!isRecord(value)) {
    return undefined;
  }

  if (isRecord(value.quizFields)) {
    return getQuizScoreType(value.quizFields.scoreType);
  }

  return undefined;
};

export const isFullTestQuizType = (quizType: string | null | undefined) =>
  quizType != null && FULL_TEST_TYPES.has(quizType);

const isBandScoreDisplay = ({
  quizType,
}: {
  quizType: string | null | undefined;
  scoreType?: string | null;
}) => isFullTestQuizType(quizType);

export const getResultToneClassName = (
  quizType: string | null | undefined,
  scoreType?: string | null,
) =>
  isBandScoreDisplay({ quizType, scoreType })
    ? "text-[var(--color-primary-500)]"
    : "text-[var(--color-success)]";

export const formatBandScore = (score: unknown) => {
  const numericScore =
    typeof score === "number" ? score : Number.parseFloat(String(score ?? ""));

  if (!Number.isFinite(numericScore)) {
    return undefined;
  }

  return numericScore.toFixed(1);
};

export const formatResultLabel = ({
  quizType,
  scoreType,
  storedScore,
  scoreResult,
  answers,
}: {
  quizType: string | null | undefined;
  scoreType?: string | null;
  storedScore?: number | null;
  scoreResult?: ScoreResult | null;
  answers?: unknown;
}) => {
  if (isBandScoreDisplay({ quizType, scoreType })) {
    // Prefer the live recalculated score over a stored 0 — older test
    // results were submitted with the broken practice-quiz scoring (every
    // answer counted as missed) and saved score=0 to DB. Falling back to
    // storedScore here would override the corrected client-side score.
    const liveScore = Number(scoreResult?.score);
    const liveValid = Number.isFinite(liveScore) && liveScore > 0;
    return formatBandScore(liveValid ? liveScore : storedScore);
  }

  const normalizedAnswers = normalizeStoredAnswers(answers);
  const correct =
    scoreResult?.correctAns ?? normalizedAnswers.totalCorrect ?? null;
  const total =
    scoreResult?.total_questions ?? normalizedAnswers.totalQuestions ?? null;

  if (correct == null || total == null || total <= 0) {
    return undefined;
  }

  return `${correct}/${total}`;
};

export const toLegacyQuizForScore = (
  quiz: RawQuizLike,
): Parameters<typeof calculateScore>[1] => {
  const passages = Array.isArray(quiz.passages) ? [...quiz.passages] : [];

  return {
    quizFields: {
      type: [String(quiz.type ?? "practice"), String(quiz.type ?? "practice")],
      passages: passages
        .sort((left, right) => (left.sort_order ?? 0) - (right.sort_order ?? 0))
        .map((passage) => ({
          passage_content: String(passage.content ?? ""),
          // calculateScore reads start_question_number off each passage to
          // shift the running answer index (e.g. Passage 3 practice → 27..40).
          // Forward it untouched; the scorer accepts number | string | null.
          start_question_number: (passage as { start_question_number?: unknown })
            .start_question_number ?? null,
          questions: (Array.isArray(passage.questions) ? [...passage.questions] : [])
            .sort((left, right) => (left.sort_order ?? 0) - (right.sort_order ?? 0))
            .map((question) => ({
              type: [
                String(
                  Array.isArray(question.type)
                    ? question.type[0]
                    : question.type ?? "fillup",
                ),
                String(
                  Array.isArray(question.type)
                    ? question.type[1] ?? question.type[0]
                    : question.type ?? "fillup",
                ),
              ],
              question: String(question.question_text ?? ""),
              list_of_questions: normalizeQuestionList(question.list_of_questions),
              list_of_options: normalizeQuestionOptionList(question.list_of_options),
              explanations: normalizeExplanations(question.explanations),
              matchingQuestion: normalizeMatchingQuestion(
                question.matching_question,
              ),
              matrixQuestion: normalizeMatrixQuestion(question.matrix_question),
            })),
        })),
    },
  } as Parameters<typeof calculateScore>[1];
};

export const calculateStoredScoreResult = ({
  quiz,
  answers,
  testPart,
}: {
  quiz: Parameters<typeof calculateScore>[1] | null | undefined;
  answers: unknown;
  testPart: unknown;
}) => {
  if (!quiz?.quizFields?.passages?.length) {
    return null;
  }

  const normalizedAnswers = normalizeStoredAnswers(answers);
  const normalizedTestPart = normalizeTestPart(
    testPart,
    quiz.quizFields.passages.length,
  );

  return calculateScore(normalizedAnswers.answers, quiz, normalizedTestPart);
};
