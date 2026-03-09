// file: .../shared/ui/exam/index.tsx (File QuestionRender của bạn)

import React from 'react';
import { IPracticeSingle } from '@/pages/ielts-practice-single/api';

// IMPORT TỪNG FILE COMPONENT CON (Giữ nguyên cấu trúc của bạn)
import { Checkbox } from "./ui/checkbox";
import { Fillup } from "./ui/fillup";
import { Radio } from "./ui/radio";
import { Select } from "./ui/select";
import { MatchingQuestion } from "./ui/matching-question";
import { MatrixQuestion } from './ui/matrix-question';

// Giả sử type IQuestion nằm ở đây
// (Nếu không, hãy đổi path về đúng vị trí file types của bạn)
type IQuestion = IPracticeSingle["quizFields"]["passages"][number]["questions"][number] & {
  startIndex?: number;
};

interface QuestionRenderProps {
  question: IQuestion;
  startIndex?: number;
  readOnly?: boolean;
}

export function QuestionRender({ question, startIndex = 0, readOnly = false }: QuestionRenderProps) {

  // Sửa lại logic lấy type một chút để an toàn hơn
  const questionType = (Array.isArray(question?.type) && question.type.length > 0)
    ? question.type[0]
    : question?.type; // Fallback nếu nó là string

  // QUAN TRỌNG: Trong review mode (readOnly), ưu tiên dùng question.startIndex nếu có
  // Vì question.startIndex đã được tính đúng từ newPost trong ReviewExplanation
  const finalStartIndex = (readOnly && question.startIndex !== undefined && question.startIndex >= 0)
    ? question.startIndex
    : startIndex;

  switch (questionType) {
    case 'radio':
      return <Radio question={question as any} startIndex={finalStartIndex} readOnly={readOnly} />;

    case 'checkbox':
      return <Checkbox question={question as any} startIndex={finalStartIndex} readOnly={readOnly} />;

    case 'select':
      return <Select question={question as any} startIndex={finalStartIndex} readOnly={readOnly} />;

    case 'fillup':
      return <Fillup question={question as any} startIndex={finalStartIndex} readOnly={readOnly} />;

    case 'matching': // Đảm bảo type trong ACF của bạn là 'matching'
      return <MatchingQuestion question={question as any} startIndex={finalStartIndex} readOnly={readOnly} />;

    case 'matrix':
      return <MatrixQuestion question={question as any} startIndex={finalStartIndex} readOnly={readOnly} />;

    default:
      return (
        <div className="p-4 border border-red-200 bg-red-50 text-red-700 rounded-md">
          Lỗi: Không tìm thấy component cho loại câu hỏi "{questionType}".
        </div>
      );
  }
}

// ▼▼▼ [SỬA LỖI Ở ĐÂY] ▼▼▼
// Thêm dòng này để export các component DND (DraggableOption, SummaryDroppableSlot)
// ra "cửa chính", cho phép PageTakeTheTestWrapper import chúng.
export * from './ui/matching-question';
// ▲▲▲ HẾT PHẦN SỬA LỖI ▲▲▲