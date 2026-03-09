// file: src/shared/lib/countQuestion/index.ts

import { IPracticeSingle } from "@/pages/ielts-practice-single/api";
import { IQuestion } from "@/shared/types/exam";

// Hàm con để đếm số câu hỏi trong một object question DUY NHẤT
const countSubQuestions = (question: IQuestion): number => {
    if (!question) return 0;

    const questionType = question.type?.[0];

    // 1. Ưu tiên xử lý loại "matching" trước
    if (questionType === "matching" && question.matchingQuestion) {
        const layoutType = String(question.matchingQuestion.layoutType).trim().toLowerCase();

        // A. Nếu là dạng "summary", đếm số ô trống trong summaryText
        if (layoutType === 'summary') {
            const summaryText = question.matchingQuestion.summaryText || "";
            if (summaryText && /\{(.*?)\}/.test(summaryText)) {
                const gapCount = (summaryText.match(/\{(.*?)\}/g) || []).length;
                return gapCount > 0 ? gapCount : 1;
            }
        }

        // B. Nếu là dạng "standard" hoặc "list", đếm số item cần nối
        if ((layoutType === 'standard' || layoutType === 'list') && (question.matchingQuestion.matchingItems?.length ?? 0) > 0) {
            return question.matchingQuestion.matchingItems!.length;
        }
    }

    // ▼▼▼ BẮT ĐẦU CẬP NHẬT ▼▼▼
    // 2. Xử lý loại "matrix"
    if (questionType === "matrix" && question.matrixQuestion?.matrixItems) {
        return question.matrixQuestion.matrixItems.length;
    }
    // ▲▲▲ KẾT THÚC CẬP NHẬT ▲▲▲

    // 3. Xử lý các dạng Fillup khác (không nằm trong matching)
    const textWithGaps = question.question || "";
    if (textWithGaps && /\{(.*?)\}/.test(textWithGaps)) {
        const gapCount = (textWithGaps.match(/\{(.*?)\}/g) || []).length;
        if (gapCount > 0) {
            return gapCount;
        }
    }

    // 4. Dạng có danh sách câu hỏi con
    if (question.list_of_questions && question.list_of_questions.length > 0) {
        return question.list_of_questions.length;
    }

    // 5. Dạng Checkbox
    if (questionType === "checkbox") {
        const correctCount = question.list_of_options?.reduce(
            (acc: number, option: any) => (option.correct ? acc + 1 : acc), 0
        ) || 0;
        return correctCount > 0 ? correctCount : 1;
    }

    // 6. Fallback dựa vào số lượng giải thích
    if (question.explanations && question.explanations.length > 1) {
        return question.explanations.length;
    }

    // 7. Mặc định là 1 câu hỏi
    return 1;
};

type Passage = IPracticeSingle['quizFields']['passages'][number];

// Hàm chính để export
// Hỗ trợ cả Passage và { questions: [...] } để tương thích với PageTakeTheTestWrapper
export function countQuestion(passage: Passage | { questions: IQuestion[] }): number {
    if (!passage) return 0;

    // Xử lý cả hai trường hợp: Passage hoặc { questions: [...] }
    const questions = 'questions' in passage ? passage.questions : (passage as Passage).questions;

    if (!questions || questions.length === 0) {
        return 0;
    }
    return questions.reduce((total: number, q: any) => total + countSubQuestions(q), 0);
}