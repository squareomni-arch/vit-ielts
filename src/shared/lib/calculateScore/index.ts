// file: src/shared/lib/calculateScore/index.ts

import { IPracticeSingle, IQuestion } from "@/pages/test-result/api"; // Đảm bảo đường dẫn import đúng
import { roundIELTSScore } from "../ielts-round";
import { lookupBandScore, isFullTestType } from "~services/lib/band-score-table";

// Định nghĩa kiểu dữ liệu cho câu trả lời của người dùng
type AnswerType = string | number | number[] | object | null | undefined;
type AnswersArray = AnswerType[];

// Định nghĩa cấu trúc trả về của hàm
interface QuestionDetail {
  correct: boolean;
  userAnswer: string | null; // Text câu trả lời của user
  answer: string; // Text câu trả lời đúng
}

interface PassageScoreDetails {
  questions: number; // Tổng số câu hỏi con trong passage
  questionRange: string; // VD: "Question 1 to 3"
  details: QuestionDetail[]; // Chi tiết từng câu hỏi con
}

export interface ScoreResult {
  score: string; // Điểm cuối cùng (làm tròn 0.5)
  details: Record<string, PassageScoreDetails>; // Chi tiết theo từng passage
  correctAns: number; // Tổng số câu trả lời đúng
  correctPercent: number; // Tỷ lệ đúng (%)
  incorrect: number; // Tổng số câu trả lời sai
  missed: number; // Tổng số câu bỏ lỡ
  total_questions: number; // Tổng số câu hỏi con
}

// Hàm phụ để trích xuất từ trong dấu ngoặc nhọn {}
const extractWords = (text: string): string[] => {
  if (!text) return [];
  // Regex này lấy nội dung bên trong dấu {}
  const regex = /\{(.*?)\}/g;
  let matches;
  const results: string[] = [];
  // Lặp qua tất cả các kết quả khớp
  while ((matches = regex.exec(text)) !== null) {
    // matches[1] là nội dung bên trong dấu ngoặc
    results.push(matches[1].trim());
  }
  return results;
};

// ========================================================================
// === HÀM XỬ LÝ CHO CÂU HỎI MATCHING (Giữ nguyên V9) ===
// ========================================================================
const processMatchingQuestion = (
  question: IQuestion,
  answers: AnswersArray,
  answerIndex: number,
  passageContent?: string
): { details: QuestionDetail[]; correct: number; incorrect: number; total: number; questionIndex: number } => {
  const details: QuestionDetail[] = [];
  let correct = 0, incorrect = 0;

  const matchingData = question.matchingQuestion;
  if (!matchingData) {
    console.error(`>>> [Matching] Lỗi: Không tìm thấy matchingQuestion data tại answerIndex ${answerIndex}`);
    return { details, correct, incorrect, total: 1, questionIndex: answerIndex + 1 };
  }

  const layoutType = String(matchingData.layoutType || 'standard').trim().toLowerCase();
  const answerOptions = matchingData.answerOptions || [];
  const userAnswerObject = (typeof answers[answerIndex] === 'object' && answers[answerIndex] !== null)
    ? (answers[answerIndex] as { [key: string]: any })
    : {};

  // --- LOGIC CHO SUMMARY ---
  if (layoutType === 'summary') {
    const correctAnswersFromText = extractWords(matchingData.summaryText || '');
    const total = correctAnswersFromText.length;
    correctAnswersFromText.forEach((correctAnswerText, gapIndex) => {
      // userAnswerObject[gapIndex] is normally an "option-<start>-<idx>" string
      // dropped by the take-the-test DnD layer, but legacy / saved-from-other-
      // mode payloads can hand us a raw number (the option index) or even a
      // letter like "A". Coerce to string before .split() and fall back to
      // numeric / letter resolution so submit doesn't crash.
      const rawUserChoice = userAnswerObject[gapIndex];
      let userAnswerText: string | null = null;
      if (rawUserChoice !== null && rawUserChoice !== undefined && rawUserChoice !== "") {
        const asString = String(rawUserChoice);
        const parts = asString.split('-');
        const optionIndexStr = parts[parts.length - 1];
        const numericIndex = optionIndexStr ? parseInt(optionIndexStr, 10) : NaN;
        if (Number.isFinite(numericIndex)) {
          userAnswerText = answerOptions[numericIndex]?.optionText ?? null;
        } else if (/^[A-Z]$/i.test(asString)) {
          // Letter (e.g. "A") — translate via charCodeAt
          userAnswerText =
            answerOptions[asString.toUpperCase().charCodeAt(0) - 65]?.optionText ?? null;
        }
      }
      const isCorrect = userAnswerText?.trim().toLowerCase() === correctAnswerText.trim().toLowerCase();
      if (isCorrect) correct++;
      else if (userAnswerText !== null) incorrect++;
      details.push({ correct: isCorrect, userAnswer: userAnswerText, answer: correctAnswerText });
    });
    return { details, correct, incorrect, total, questionIndex: answerIndex + 1 };
  }
  // --- LOGIC CHO HEADING ---
  else if (layoutType === 'heading') {
    const correctAnswersFromText = extractWords(passageContent || '');
    const total = correctAnswersFromText.length;
    correctAnswersFromText.forEach((correctAnswerText, gapIndex) => {
      // userAnswerObject[gapIndex] is normally an "option-<start>-<idx>" string
      // dropped by the take-the-test DnD layer, but legacy / saved-from-other-
      // mode payloads can hand us a raw number (the option index) or even a
      // letter like "A". Coerce to string before .split() and fall back to
      // numeric / letter resolution so submit doesn't crash.
      const rawUserChoice = userAnswerObject[gapIndex];
      let userAnswerText: string | null = null;
      if (rawUserChoice !== null && rawUserChoice !== undefined && rawUserChoice !== "") {
        const asString = String(rawUserChoice);
        const parts = asString.split('-');
        const optionIndexStr = parts[parts.length - 1];
        const numericIndex = optionIndexStr ? parseInt(optionIndexStr, 10) : NaN;
        if (Number.isFinite(numericIndex)) {
          userAnswerText = answerOptions[numericIndex]?.optionText ?? null;
        } else if (/^[A-Z]$/i.test(asString)) {
          // Letter (e.g. "A") — translate via charCodeAt
          userAnswerText =
            answerOptions[asString.toUpperCase().charCodeAt(0) - 65]?.optionText ?? null;
        }
      }
      const isCorrect = userAnswerText?.trim().toLowerCase() === correctAnswerText.trim().toLowerCase();
      if (isCorrect) correct++;
      else if (userAnswerText !== null) incorrect++;
      details.push({ correct: isCorrect, userAnswer: userAnswerText, answer: correctAnswerText });
    });
    return { details, correct, incorrect, total, questionIndex: answerIndex + 1 };
  }
  // --- LOGIC CHO STANDARD (Mặc định) ---
  else {
    const matchingItems = matchingData.matchingItems || [];
    const total = matchingItems.length;
    matchingItems.forEach((item, index) => {
      const userChoiceIndex = userAnswerObject[index] as number;
      const userAnswerText = (userChoiceIndex !== undefined && userChoiceIndex !== null && answerOptions[userChoiceIndex])
        ? answerOptions[userChoiceIndex].optionText
        : null;

      // Resolve correctAnswer: if stored as a single letter (A-Z), treat it as an option index reference
      const rawCorrect = (item.correctAnswer || '').trim();
      const letterMatch = /^[A-Z]$/i.test(rawCorrect);
      const correctOptionIndex = letterMatch
        ? rawCorrect.toUpperCase().charCodeAt(0) - 65
        : answerOptions.findIndex(
            (o: any) => (o.optionText || '').trim().toLowerCase() === rawCorrect.toLowerCase()
          );
      const correctAnswerText =
        correctOptionIndex >= 0 && correctOptionIndex < answerOptions.length
          ? answerOptions[correctOptionIndex]?.optionText || rawCorrect
          : rawCorrect;

      const isCorrect =
        userAnswerText !== null &&
        (Number(userChoiceIndex) === correctOptionIndex ||
          userAnswerText.trim().toLowerCase() === correctAnswerText.trim().toLowerCase());

      if (isCorrect) correct++;
      else if (userAnswerText !== null) incorrect++;
      details.push({ correct: isCorrect, userAnswer: userAnswerText, answer: correctAnswerText });
    });
    return { details, correct, incorrect, total, questionIndex: answerIndex + 1 };
  }
};

// ========================================================================
// === HÀM XỬ LÝ CHO CÂU HỎI MATRIX (LOGIC V10 - SỬA LỖI MISSED) ===
// ========================================================================
const processMatrixQuestion = (
  question: IQuestion,
  answers: AnswersArray,
  answerIndex: number
): { details: QuestionDetail[]; correct: number; incorrect: number; total: number; questionIndex: number } => {
  const details: QuestionDetail[] = [];
  let correct = 0;
  let incorrect = 0;

  const matrixData = question.matrixQuestion;
  if (!matrixData || !Array.isArray(matrixData.matrixItems)) {
    console.error(`>>> [Matrix] Lỗi: Không tìm thấy matrixItems data tại answerIndex ${answerIndex}`);
    return { details, correct, incorrect, total: 1, questionIndex: answerIndex + 1 };
  }

  const matrixRows = matrixData.matrixItems; // Các dòng (câu hỏi)
  const answerOptions = matrixData.matrixCategories || []; // Các cột (A, B, C...)
  const userAnswerObject = (typeof answers[answerIndex] === 'object' && answers[answerIndex] !== null)
    ? (answers[answerIndex] as { [key: string]: any })
    : {}; // { 0: "B", 1: "A", ... }
  const total = matrixRows.length; // Tổng số câu hỏi con

  matrixRows.forEach((row, rowIndex) => {
    // Lấy đáp án đúng (chữ cái)
    const correctAnswerLetter = (row.correctCategoryLetter || '').trim().toLowerCase();

    // Lấy chữ cái user chọn (vd: "A", "B") từ object { 0: "A", 1: "B" }
    const userAnswerLetterRaw = userAnswerObject[rowIndex] as string | null;
    const userAnswerLetter = (userAnswerLetterRaw || '').trim().toLowerCase(); // vd: "a"

    let userAnswerFullText: string | null = null;
    let correctAnswerFullText: string | null = null;

    // Tìm text đầy đủ của câu trả lời user
    if (userAnswerLetter) {
      const userOption = answerOptions.find((opt: any) => opt.categoryLetter.trim().toLowerCase() === userAnswerLetter);
      userAnswerFullText = userOption ? userOption.categoryText : userAnswerLetter.toUpperCase();
    }

    // Tìm text đầy đủ của đáp án đúng
    const correctOption = answerOptions.find((opt: any) => opt.categoryLetter.trim().toLowerCase() === correctAnswerLetter);
    correctAnswerFullText = correctOption ? correctOption.categoryText : correctAnswerLetter.toUpperCase();

    // So sánh chữ cái
    const isCorrect = userAnswerLetter === correctAnswerLetter && correctAnswerLetter !== '';

    if (isCorrect) {
      correct++;
    } else if (userAnswerLetter) { // Chỉ tính sai nếu user CÓ chọn
      incorrect++;
    }

    details.push({
      correct: isCorrect,
      userAnswer: userAnswerFullText, // Hiển thị text đầy đủ
      answer: correctAnswerFullText // Hiển thị text đầy đủ
    });
  });

  return {
    details,
    correct,
    incorrect,
    total,
    questionIndex: answerIndex + 1 // Tăng index lên 1 cho cả nhóm matrix
  };
};

// ========================================================================
// === HÀM XỬ LÝ CHO CÂU HỎI RADIO (Giữ nguyên V9) ===
// ========================================================================
const processRadioQuestion = (
  question: IQuestion,
  answers: AnswersArray,
  questionIndex: number
): { details: QuestionDetail[]; correct: number; incorrect: number; total: number; questionIndex: number } => {
  const details: QuestionDetail[] = [];
  let correctCount = 0, incorrectCount = 0;
  const subQuestions = question.list_of_questions || [];
  const total = subQuestions.length;
  let currentAnswerIndex = questionIndex;

  subQuestions.forEach(subQ => {
    if (currentAnswerIndex >= answers.length) {
      // console.warn(`>>> [Radio] Cảnh báo: Thiếu câu trả lời cho sub-question tại index ${currentAnswerIndex}`);
      details.push({ correct: false, userAnswer: null, answer: subQ.options?.[subQ.correct ?? 0]?.content ?? 'N/A' });
      currentAnswerIndex++;
      return;
    }

    const userAnswer = answers[currentAnswerIndex] as number;
    const correctAnswer = subQ.correct ?? 0;
    const isCorrect = userAnswer === correctAnswer;

    if (isCorrect) correctCount++;
    else if (userAnswer !== undefined && userAnswer !== null) incorrectCount++;

    details.push({
      correct: isCorrect,
      userAnswer: subQ.options?.[userAnswer]?.content ?? null,
      answer: subQ.options?.[correctAnswer]?.content ?? 'N/A',
    });
    currentAnswerIndex++;
  });
  return { details, correct: correctCount, incorrect: incorrectCount, total, questionIndex: currentAnswerIndex };
};

// ========================================================================
// === HÀM XỬ LÝ CHO CÂU HỎI SELECT (Giữ nguyên V9) ===
// ========================================================================
const processSelectQuestion = (
  question: IQuestion,
  answers: AnswersArray,
  questionIndex: number
): { details: QuestionDetail[]; correct: number; incorrect: number; total: number; questionIndex: number } => {
  const details: QuestionDetail[] = [];
  let correctCount = 0, incorrectCount = 0;
  let currentAnswerIndex = questionIndex;
  const correctAnswersFromText = extractWords(question.question || '');
  const total = correctAnswersFromText.length;
  const optionsList = question.list_of_options || [];

  if (total === 0 && question.list_of_questions && question.list_of_questions.length > 0) {
    // FALLBACK: Use list_of_questions exactly like Radio
    const subQuestions = question.list_of_questions;
    subQuestions.forEach(subQ => {
      if (currentAnswerIndex >= answers.length) {
        // console.warn(`>>> [Select] Cảnh báo: Thiếu câu trả lời cho sub-question tại index ${currentAnswerIndex}`);
        details.push({ correct: false, userAnswer: null, answer: subQ.options?.[subQ.correct ?? 0]?.content ?? 'N/A' });
        currentAnswerIndex++;
        return;
      }

      const userAnswer = answers[currentAnswerIndex] as number;
      const correctAnswer = subQ.correct ?? 0;
      const isCorrect = userAnswer === correctAnswer;

      if (isCorrect) correctCount++;
      else if (userAnswer !== undefined && userAnswer !== null) incorrectCount++;

      details.push({
        correct: isCorrect,
        userAnswer: subQ.options?.[userAnswer]?.content ?? null,
        answer: subQ.options?.[correctAnswer]?.content ?? 'N/A',
      });
      currentAnswerIndex++;
    });
    return { details, correct: correctCount, incorrect: incorrectCount, total: subQuestions.length, questionIndex: currentAnswerIndex };
  } else if (total === 0) {
    // console.warn(`>>> [Select] Cảnh báo: Không tìm thấy đáp án đúng dạng {} trong text câu hỏi.`);
  }

  correctAnswersFromText.forEach(correctAnswerText => {
    if (currentAnswerIndex >= answers.length) {
      // console.warn(`>>> [Select] Cảnh báo: Thiếu câu trả lời cho select tại index ${currentAnswerIndex}`);
      details.push({ correct: false, userAnswer: null, answer: correctAnswerText });
      currentAnswerIndex++;
      return;
    }

    const userAnswerIndex = answers[currentAnswerIndex] as number;
    const userAnswerText = optionsList[userAnswerIndex]?.option ?? null;
    const isCorrect = userAnswerText?.trim().toLowerCase() === correctAnswerText.trim().toLowerCase();

    if (isCorrect) correctCount++;
    else if (userAnswerText !== null) incorrectCount++;

    details.push({ correct: isCorrect, userAnswer: userAnswerText, answer: correctAnswerText });
    currentAnswerIndex++;
  });
  return { details, correct: correctCount, incorrect: incorrectCount, total, questionIndex: currentAnswerIndex };
};

// ========================================================================
// === HÀM XỬ LÝ CHO CÂU HỎI FILLUP (ĐÃ SỬA LỖI CRASH .TRIM) ===
// ========================================================================
const processFillupQuestion = (
  question: IQuestion,
  answers: AnswersArray,
  questionIndex: number
): { details: QuestionDetail[]; correct: number; incorrect: number; total: number; questionIndex: number } => {
  const details: QuestionDetail[] = [];
  let correctCount = 0, incorrectCount = 0;
  let currentAnswerIndex = questionIndex;

  const correctAnswersFromText = extractWords(question.question || '');

  if (correctAnswersFromText.length > 0) {
    const total = correctAnswersFromText.length;
    correctAnswersFromText.forEach(correctWordWithOptions => {
      if (currentAnswerIndex >= answers.length) {
        // console.warn(`>>> [Fillup-Text] Cảnh báo: Thiếu câu trả lời cho fillup tại index ${currentAnswerIndex}`);
        details.push({ correct: false, userAnswer: null, answer: correctWordWithOptions.replace(/\|/g, ' / ') });
        currentAnswerIndex++;
        return;
      }
      const possibleCorrectAnswers = correctWordWithOptions.split("|").map(w => w.trim().toLowerCase());

      // ▼▼▼ [FIX] Ép kiểu String() trước khi trim() để tránh crash nếu user nhập số
      const userAnswerRaw = answers[currentAnswerIndex];
      const userAnswer = String(userAnswerRaw ?? "").trim().toLowerCase();
      // ▲▲▲ [END FIX]

      const isCorrect = userAnswer !== '' && possibleCorrectAnswers.includes(userAnswer);

      if (isCorrect) correctCount++;
      else if (userAnswer !== '') incorrectCount++;

      details.push({
        correct: isCorrect,
        userAnswer: String(userAnswerRaw ?? ""), // Hiển thị nguyên gốc
        answer: correctWordWithOptions.replace(/\|/g, ' / '),
      });
      currentAnswerIndex++;
    });
    return { details, correct: correctCount, incorrect: incorrectCount, total, questionIndex: currentAnswerIndex };

  } else {
    const correctAnswersFromExplanations = question.explanations || [];
    const total = correctAnswersFromExplanations.length;

    if (total === 0) {
      // console.warn(`>>> [Fillup-Exp] Cảnh báo: Không tìm thấy đáp án đúng trong explanations.`);
    }

    correctAnswersFromExplanations.forEach(exp => {
      if (currentAnswerIndex >= answers.length) {
        // console.warn(`>>> [Fillup-Exp] Cảnh báo: Thiếu câu trả lời cho fillup tại index ${currentAnswerIndex}`);
        details.push({ correct: false, userAnswer: null, answer: exp.content });
        currentAnswerIndex++;
        return;
      }
      
      // ▼▼▼ [FIX] Ép kiểu String() trước khi trim()
      const userAnswerRaw = answers[currentAnswerIndex];
      const userAnswer = String(userAnswerRaw ?? "").trim().toLowerCase();
      // ▲▲▲ [END FIX]

      const possibleCorrectAnswers = (exp.content || '').split("/").map(w => w.trim().toLowerCase());
      const isCorrect = userAnswer !== '' && possibleCorrectAnswers.includes(userAnswer);

      if (isCorrect) correctCount++;
      else if (userAnswer !== '') incorrectCount++;

      details.push({
        correct: isCorrect,
        userAnswer: String(userAnswerRaw ?? ""),
        answer: exp.content,
      });
      currentAnswerIndex++;
    });
    return { details, correct: correctCount, incorrect: incorrectCount, total, questionIndex: currentAnswerIndex };
  }
};

// ========================================================================
// === HÀM XỬ LÝ CHO CÂU HỎI CHECKBOX (Giữ nguyên V9) ===
// ========================================================================
const processCheckboxQuestion = (
  question: IQuestion,
  answers: AnswersArray,
  answerIndex: number
): { details: QuestionDetail[]; correct: number; incorrect: number; total: number; questionIndex: number } => {
  const details: QuestionDetail[] = [];
  if (answerIndex >= answers.length) {
    // console.warn(`>>> [Checkbox] Cảnh báo: Thiếu câu trả lời cho checkbox tại answerIndex ${answerIndex}`);
    const correctOptions = question.list_of_options?.filter(opt => opt.correct) || [];
    const total = correctOptions.length || 1;
    details.push({
      correct: false,
      userAnswer: null,
      answer: correctOptions.map(opt => opt.option).join(', ')
    });
    return { details, correct: 0, incorrect: 0, total, questionIndex: answerIndex + 1 };
  }

  const rawAnswer = answers[answerIndex];
  const userAnswer = (Array.isArray(rawAnswer) ? rawAnswer.map(Number).sort((a, b) => a - b) : []);
  const correctAnswersIndices = question.list_of_options
    ?.map((opt, idx) => (opt.correct ? idx : -1))
    .filter((idx) => idx !== -1)
    .sort((a, b) => a - b) || [];

  const total = correctAnswersIndices.length || 1;
  const allOptions = question.list_of_options || [];
  const getOptionText = (index: number): string | null => allOptions[index]?.option || null;

  let correctCount = 0;
  let incorrectCount = 0;

  if (total === 1) {
    const userChoiceIndex = userAnswer.length > 0 ? userAnswer[0] : undefined;
    const correctChoiceIndex = correctAnswersIndices.length > 0 ? correctAnswersIndices[0] : undefined;
    const isSingleCorrect = userChoiceIndex !== undefined && userChoiceIndex === correctChoiceIndex;

    if (isSingleCorrect) {
      correctCount = 1;
    } else if (userChoiceIndex !== undefined) {
      incorrectCount = 1;
    }

    details.push({
      correct: isSingleCorrect,
      userAnswer: userChoiceIndex !== undefined ? getOptionText(userChoiceIndex) : null,
      answer: correctChoiceIndex !== undefined ? getOptionText(correctChoiceIndex) ?? "N/A" : "N/A",
    });

  } else {
    const missedCorrectChoices = correctAnswersIndices.filter(idx => !userAnswer.includes(idx));
    const missedCorrectText = missedCorrectChoices.map(getOptionText).filter(Boolean) as string[];

    userAnswer.forEach(userChoiceIndex => {
      const isThisChoiceCorrect = correctAnswersIndices.includes(userChoiceIndex);
      const userText = getOptionText(userChoiceIndex);

      if (isThisChoiceCorrect) {
        correctCount++;
      } else {
        incorrectCount++;
      }

      details.push({
        correct: isThisChoiceCorrect,
        userAnswer: userText,
        answer: isThisChoiceCorrect ? (userText ?? 'N/A') : missedCorrectText.join(', '),
      });
    });

    // Pad with one "missed" detail per remaining correct slot so the answer
    // keys grid still renders one row per question (Q11, Q12, …) instead of
    // collapsing the whole multi-select question down to the items the user
    // actually clicked. Without this, a "Choose two letters" question that
    // the user skipped contributes 0 detail rows, hiding the questions from
    // the result page even though the score totals already counted them.
    const remainingSlots = total - userAnswer.length;
    for (let i = 0; i < remainingSlots; i++) {
      const correctIdx = correctAnswersIndices[userAnswer.length + i];
      const correctText =
        correctIdx !== undefined ? getOptionText(correctIdx) ?? "N/A" : "N/A";
      details.push({
        correct: false,
        userAnswer: null,
        answer: correctText,
      });
    }
  }

  return {
    details,
    correct: correctCount,
    incorrect: incorrectCount,
    total,
    questionIndex: answerIndex + 1
  };
};

// ========================================================================
// === HÀM TÍNH ĐIỂM CHÍNH (Giữ nguyên V9) ===
// ========================================================================
export const calculateScore = (
  userAnswersRaw: AnswersArray | undefined | null,
  quizData: IPracticeSingle | undefined | null,
  testPart: number[] | undefined | null
): ScoreResult => {

  const answers = Array.isArray(userAnswersRaw) ? userAnswersRaw : [];
  if (!quizData?.quizFields?.passages) {
    console.error(">>> Lỗi calculateScore: Dữ liệu quizData hoặc passages không hợp lệ.");
    return { score: "0.0", details: {}, correctAns: 0, correctPercent: 0, incorrect: 0, missed: 0, total_questions: 0 };
  }
  const validTestPart = Array.isArray(testPart) ? testPart : [];

  // `totalQuestions` doubles as the answer-array offset *and* the running
  // question number for "Question X to Y" range labels. For practice quizzes
  // that inherit a `start_question_number` from the parent full test
  // (Passage 3 → 27..40), it gets shifted to 26 before that passage so the
  // scorer reads answers from the right slots.
  //
  // `totalScored` tracks the actual count of scored questions, independent
  // of any offset, so the band-score math and the returned `total_questions`
  // stay correct (14 for a 14-question practice quiz, not 40).
  let totalQuestions = 0;
  let totalScored = 0;
  let correctCount = 0;
  let incorrectCount = 0;
  const details: Record<string, PassageScoreDetails> = {};

  let answerIndex = 0;

  const passagesToScore = quizData.quizFields.passages.filter((_, index) => validTestPart.includes(index));

  passagesToScore.forEach((passage, passageIndexInFiltered) => {
    const passageDetails: QuestionDetail[] = [];
    let passageTotalQuestions = 0;
    const originalPassageIndex = quizData.quizFields.passages.findIndex(p => p === passage);

    const explicitStart = (passage as { start_question_number?: number | string | null })
      .start_question_number;
    const explicitStartNumber =
      explicitStart != null && !isNaN(Number(explicitStart))
        ? Number(explicitStart)
        : null;
    if (explicitStartNumber !== null && explicitStartNumber > 0) {
      totalQuestions = explicitStartNumber - 1;
    }

    const startQuestionIndex = totalQuestions + 1;

    (passage.questions || []).forEach(question => {
      let result: { details: QuestionDetail[]; correct: number; incorrect: number; total: number; questionIndex: number };
      let questionType: string | undefined = undefined;

      if (typeof question.type === 'string') {
        questionType = question.type;
      } else if (Array.isArray(question.type) && question.type.length > 0) {
        questionType = question.type[0];
      } else {
        console.error(`>>> Lỗi calculateScore: Không xác định được loại câu hỏi tại passage index ${originalPassageIndex}`);
        return;
      }

      answerIndex = totalQuestions;

      switch (questionType) {
        case "matching": result = processMatchingQuestion(question, answers, answerIndex, passage.passage_content); break;
        case "matrix": result = processMatrixQuestion(question, answers, answerIndex); break;
        case "checkbox": result = processCheckboxQuestion(question, answers, answerIndex); break;

        case "radio": result = processRadioQuestion(question, answers, answerIndex); break;
        case "select": result = processSelectQuestion(question, answers, answerIndex); break;
        case "fillup": result = processFillupQuestion(question, answers, answerIndex); break;

        default:
          console.warn(`>>> Cảnh báo calculateScore: Loại câu hỏi '${questionType}' chưa được hỗ trợ.`);
          result = { details: [], correct: 0, incorrect: 0, total: 1, questionIndex: answerIndex + 1 };
          break;
      }

      correctCount += result.correct;
      incorrectCount += result.incorrect;
      passageTotalQuestions += result.total;
      passageDetails.push(...result.details);

      if (questionType === 'radio' || questionType === 'select' || questionType === 'fillup') {
        const delta = result.questionIndex - totalQuestions;
        totalQuestions = result.questionIndex;
        totalScored += delta;
      } else {
        totalQuestions += result.total;
        totalScored += result.total;
      }

    }); // Kết thúc lặp qua questions

    const endQuestionIndex = totalQuestions;

    details[originalPassageIndex] = {
      questions: passageTotalQuestions,
      questionRange: passageTotalQuestions > 0 ? `Question ${startQuestionIndex} to ${endQuestionIndex}` : "No questions",
      details: passageDetails,
    };
  }); // Kết thúc lặp qua passages

  const scoreValue = totalScored > 0 ? (correctCount / totalScored) * 9 : 0;
  let roundedScore = roundIELTSScore(scoreValue).toFixed(1);

  // Use official IELTS band score lookup for full tests (40 questions)
  const quizType = Array.isArray(quizData.quizFields.type) ? quizData.quizFields.type[0] : quizData.quizFields.type;
  const skill = Array.isArray(quizData.quizFields.skill) ? quizData.quizFields.skill[0] : quizData.quizFields.skill;

  if (isFullTestType(quizType) && totalScored === 40) {
    const bandScore = lookupBandScore(correctCount, skill, quizType);
    roundedScore = bandScore.toFixed(1);
  }

  const missedCount = totalScored - correctCount - incorrectCount;



  const finalResult: ScoreResult = {
    score: roundedScore,
    details,
    correctAns: correctCount,
    correctPercent: totalScored > 0 ? Math.round((correctCount / totalScored) * 100) : 0,
    incorrect: incorrectCount,
    missed: missedCount < 0 ? 0 : missedCount,
    total_questions: totalScored,
  };

  return finalResult;
};