import parse from "html-react-parser";
import { Radio as AntRadio, Collapse, Space } from "antd";
import { Controller, useFormContext } from "react-hook-form";
import { TextSelectionWrapper } from "@/shared/ui/text-selection";
import { IQuestion, AnswerFormValues } from "@/shared/types/exam";
import { useState, useMemo } from "react";
import { twMerge } from "tailwind-merge";
// 1. IMPORT CONTEXT
import { useExamContext } from "@/pages/take-the-test/context";

export const Radio = ({
  question,
  startIndex: propStartIndex = 0,
  readOnly = false,
}: {
  question: IQuestion;
  startIndex?: number;
  readOnly?: boolean;
}) => {
  const methods = useFormContext<AnswerFormValues>();
  const subQuestions = question.list_of_questions || [];

  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // 2. LẤY HÀM TÌM KIẾM TỪ CONTEXT
  const { setActiveQuestionIndex, getQuestionStartIndex } = useExamContext();

  // 3. TÍNH TOÁN INDEX THỰC TẾ (GLOBAL INDEX)
  const realStartIndex = useMemo(() => {
    // QUAN TRỌNG: Trong review mode (readOnly), propStartIndex đã được tính đúng từ newPost
    // Nên LUÔN LUÔN dùng propStartIndex hoặc question.startIndex khi readOnly mode
    if (readOnly) {
      const finalStartIndex = (question.startIndex !== undefined && question.startIndex >= 0) 
        ? question.startIndex 
        : propStartIndex;
      return finalStartIndex;
    }

    // Gọi hàm lookup từ Context (chỉ khi không phải readOnly)
    const contextIndex = getQuestionStartIndex(question);

    // Nếu Context tìm thấy (>0) thì dùng, ngược lại dùng prop (fallback)
    if (contextIndex > 0) return contextIndex;
    
    // Nếu context trả về 0, ưu tiên dùng nó nếu tin tưởng ContextMap
    return contextIndex; 
  }, [question, getQuestionStartIndex, propStartIndex, readOnly]);

  // Hiển thị dải câu hỏi (VD: Questions 10 - 12)
  const displayStart = realStartIndex + 1;
  const displayEnd = realStartIndex + subQuestions.length;
  const questionRange = subQuestions.length > 1
    ? ` - ${displayEnd}`
    : ``;

  return (
    <div className="space-y-4" id={`question-block-${realStartIndex + 1}`}>
      <h3 className="text-lg font-bold">
        Questions {displayStart}{questionRange}
      </h3>

      <div className="leading-[2] prose prose-sm max-w-none">
        <TextSelectionWrapper>
          {parse(question.question || question.instructions || "")}
        </TextSelectionWrapper>
      </div>

      {subQuestions.map((subQ, index) => {
        // 4. TÍNH INDEX TUYỆT ĐỐI CHO TỪNG CÂU HỎI CON
        const questionIndex = realStartIndex + index;
        const correctAnswerIndex = subQ.correct ?? 0;

        return (
          <div
            // 5. QUAN TRỌNG: Dùng Global Index làm Key để fix lỗi Ghosting
            key={questionIndex}
            className="space-y-2 pb-[10px]"
            id={`#question-no-${questionIndex + 1}`}
          >
            <div
              className={twMerge(
                "flex items-center text-[16px]",
                activeIndex === index && "active-quizz"
              )}
            >
              <span className="w-[28px] h-[27px] flex items-center justify-center stt mr-[5px] font-bold">
                {questionIndex + 1}
              </span>
              <TextSelectionWrapper>{parse(subQ.question || "")}</TextSelectionWrapper>
            </div>

            <Controller
              control={methods.control}
              name={`answers.${questionIndex}`} // Bind đúng vào answers.26, answers.27...
              render={({ field }) => {
                const userAnswerIndex = field.value;
                const userDidAnswer =
                  userAnswerIndex !== null && userAnswerIndex !== undefined && userAnswerIndex !== "";
                const isUserCorrect =
                  userDidAnswer && Number(userAnswerIndex) === correctAnswerIndex;

                const groupValue = readOnly ? correctAnswerIndex : (userDidAnswer ? Number(userAnswerIndex) : undefined);

                return (
                  <AntRadio.Group
                    {...field}
                    value={groupValue}
                    disabled={readOnly}
                    className="pl-8"
                    onFocus={() => {
                      if (!readOnly) {
                        setActiveIndex(index);
                        // Cập nhật Active Question cho Footer
                        setActiveQuestionIndex(questionIndex);
                      }
                    }}
                    onChange={(e) => {
                      field.onChange(e);
                      if (!readOnly) {
                         setActiveIndex(index);
                         setActiveQuestionIndex(questionIndex);
                      }
                    }}
                  >
                    <Space direction="vertical" className="w-full">
                      {subQ.options?.map((option, optIndex) => {
                        let optionBgClass = "";
                        let optionTextClass = "";
                        let suffix = null;

                        if (readOnly) {
                          if (isUserCorrect && optIndex === correctAnswerIndex) {
                            optionBgClass = "bg-[#d9ead3] text-green-600 font-semibold";
                            suffix = (
                              <span className="material-symbols-rounded text-green-600 ml-auto">
                                check_circle
                              </span>
                            );
                          } else if (!isUserCorrect && userDidAnswer) {
                            if (optIndex === Number(userAnswerIndex)) {
                              optionBgClass = "bg-[#374151]/10 text-[#374151] font-semibold";
                              suffix = (
                                <span className="material-symbols-rounded text-[#374151] ml-auto">cancel</span>
                              );
                            } else if (optIndex === correctAnswerIndex) {
                              optionTextClass = "text-green-600 font-semibold";
                            }
                          } else if (!userDidAnswer) {
                            if (optIndex === correctAnswerIndex) {
                              optionBgClass = "bg-[#374151]/5 text-[#374151]/70 font-semibold";
                            }
                          }
                        } else {
                          const isSelected = userDidAnswer && Number(field.value) === optIndex;
                          optionBgClass = isSelected
                            ? "bg-[#bbd8f0]"
                            : "hover:bg-[#e4e4e4]";
                        }

                        return (
                          <AntRadio
                            key={optIndex}
                            value={optIndex}
                            className={twMerge(
                              "text-[16px] p-[15px] py-[3px] w-full rounded",
                              optionBgClass
                            )}
                          >
                            <div className="flex items-center w-full justify-between">
                              <span
                                className={twMerge(
                                  "flex-grow",
                                  optionTextClass
                                )}
                              >
                                <TextSelectionWrapper>
                                  {parse(option.content || "")}
                                </TextSelectionWrapper>
                              </span>
                              {suffix}
                            </div>
                          </AntRadio>
                        );
                      })}
                    </Space>
                  </AntRadio.Group>
                );
              }}
            />
          </div>
        );
      })}

      {readOnly && question.explanations && question.explanations.length > 0 && (
        <Collapse
          size="small"
          items={question.explanations.map((exp, index) => ({
            key: index,
            label: `Explanation`,
            children: (
              <div className="prose prose-sm max-w-none">
                {parse(exp.content || "")}
              </div>
            ),
          }))}
        />
      )}
    </div>
  );
};