import { IPracticeSingle } from "@/pages/ielts-practice-single/api";
import { AnswerFormValues, useExamContext } from "@/pages/take-the-test/context";
import { randomUUID } from "@/shared/lib";
import { TextSelectionWrapper } from "@/shared/ui/text-selection";
import { Collapse, Input } from "antd";
import parse, { Element, HTMLReactParserOptions } from "html-react-parser";
import React, { Fragment, useMemo } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { twMerge } from "tailwind-merge";
import { countQuestion } from "@/shared/lib";
import { normalizeParseResult, SafeRender } from "@/shared/lib/html-normalize";

// --- HÀM CHUẨN HÓA CHUỖI ---
const normalizeString = (str: string | undefined | null) => {
  if (!str) return "";
  return str.toLowerCase().replace(/[^a-z0-9]/g, "");
};

export const Fillup = ({
  question,
  startIndex: propStartIndex = 0,
  readOnly = false,
}: {
  question: IPracticeSingle["quizFields"]["passages"][number]["questions"][number];
  startIndex?: number;
  readOnly?: boolean;
}) => {
  const methods = useFormContext<AnswerFormValues>();
  const { activeQuestionIndex, setActiveQuestionIndex, getQuestionStartIndex, post } = useExamContext();

  // ▼▼▼ LOGIC TÌM INDEX MẠNH MẼ (ROBUST SCAN) ▼▼▼
  const realStartIndex = useMemo(() => {
    // QUAN TRỌNG: Trong review mode (readOnly), propStartIndex đã được tính đúng từ newPost
    // Nên LUÔN LUÔN dùng propStartIndex khi readOnly mode để đảm bảo khớp với answers array
    // Nếu question có startIndex property, ưu tiên dùng nó (đã được tính đúng từ newPost)
    if (readOnly) {
      const finalStartIndex = (question.startIndex !== undefined && question.startIndex >= 0)
        ? question.startIndex
        : propStartIndex;

      return finalStartIndex;
    }

    // 1. Nếu không có dữ liệu, dùng prop
    if (!post?.quizFields?.passages) return propStartIndex;

    // 2. Thử lấy nhanh từ Context Map (Nếu có ID khớp)
    const contextIndex = getQuestionStartIndex(question);
    if (contextIndex > 0) return contextIndex;

    // 3. Nếu Context trả về 0 (có thể sai), chạy vòng lặp tìm kiếm thủ công dựa trên Nội dung
    // Đây là chốt chặn cuối cùng để đảm bảo không bao giờ bị fallback về 0 sai lệch
    const targetContent = normalizeString(question.question).substring(0, 100); // Lấy 100 ký tự đầu làm chữ ký
    const targetTitle = normalizeString(question.title);

    let currentCount = 0;
    for (const passage of post.quizFields.passages) {
      for (const q of passage.questions) {
        // So sánh nội dung
        const currentContent = normalizeString(q.question).substring(0, 100);
        const currentTitle = normalizeString(q.title);

        // Fillup thường nhận diện bằng nội dung câu hỏi (chứa gap)
        const isContentMatch = targetContent && currentContent && targetContent === currentContent;
        const isTitleMatch = targetTitle && currentTitle && targetTitle === currentTitle;

        // Nếu tìm thấy khớp -> Trả về index hiện tại ngay
        if (isContentMatch || (isTitleMatch && q.type?.[0] === 'fillup')) {
          return currentCount;
        }

        // Logic cộng dồn index (PHẢI GIỐNG HỆT CONTEXT)
        let qCount = 1;
        const qType = q.type?.[0];
        if (qType === 'matching' && String((q as any).matchingQuestion?.layoutType).trim().toLowerCase() === 'heading') {
          let gapCount = 0;
          (passage.passage_content || "").replace(/\{(.*?)\}/g, () => { gapCount++; return ''; });
          qCount = gapCount > 0 ? gapCount : 1;
        } else if (qType === 'checkbox') {
          // @ts-ignore
          qCount = Number(q.optionChoose) || 1;
        } else {
          // countQuestion nhận một Passage, nhưng ở đây ta chỉ có question
          // Tạo một passage tạm với question này
          const tempPassage = {
            title: "",
            passage_content: "",
            questions: [q],
          } as any;
          qCount = countQuestion(tempPassage);
        }
        if (isNaN(qCount) || qCount < 1) qCount = 1;
        currentCount += qCount;
      }
    }

    // Nếu không tìm thấy, dùng contextIndex (dù là 0) hoặc prop
    return contextIndex || propStartIndex;
  }, [question, getQuestionStartIndex, propStartIndex, post, readOnly]);
  // ▲▲▲ KẾT THÚC LOGIC ▲▲▲

  const questionData = useMemo(() => {
    const questions: {
      id: string;
      answers: string;
    }[] = [];
    const regex = /\{(.*?)\}/g;

    let m: RegExpExecArray | null;
    while ((m = regex.exec(question.question || "")) !== null) {
      if (m[1].trim() !== "") {
        questions.push({
          id: randomUUID(),
          answers: m[1].trim(),
        });
      }
    }

    let i = 0;
    const newContent = (question.question || "").replace(
      regex,
      (match, innerContent) => {
        if (innerContent.trim() !== "") {
          const uniqueId = questions[i]?.id;
          if (!uniqueId) return match;
          const dataIndex = i++;
          return `<span data-input-id="${uniqueId}" data-index="${dataIndex}"></span>`;
        }
        return match;
      }
    );

    return {
      content: newContent,
      questions,
    };
  }, [question.question]);

  const options: HTMLReactParserOptions = useMemo(
    () => ({
      replace(domNode) {
        if ((domNode as Element).attribs) {
          const { attribs } = domNode as Element;

          if (!attribs["data-input-id"]) {
            return;
          }

          const gapOffset = Number(attribs["data-index"]);
          const absoluteIndex = realStartIndex + gapOffset;
          const displayIndex = absoluteIndex + 1;


          return methods ? (
            <Controller
              key={absoluteIndex} // Fix Ghosting
              control={methods.control}
              name={`answers.${absoluteIndex}`}
              render={({ field }) => {
                const isActive = activeQuestionIndex === absoluteIndex;

                // === LOGIC REVIEW ===
                if (readOnly) {
                  // Xử lý field.value: chỉ chấp nhận string hoặc number, bỏ qua object/array
                  let userAnswerValue: string = "";
                  if (field.value !== null && field.value !== undefined) {
                    // Không check field.value !== "" vì có thể là số 0 hoặc giá trị hợp lệ khác
                    if (typeof field.value === 'string') {
                      userAnswerValue = field.value.trim();
                    } else if (typeof field.value === 'number') {
                      userAnswerValue = String(field.value).trim();
                    } else if (Array.isArray(field.value) && field.value.length > 0) {
                      // Nếu là array, lấy phần tử đầu tiên nếu là string/number
                      const firstValue = field.value[0];
                      if (typeof firstValue === 'string') {
                        userAnswerValue = firstValue.trim();
                      } else if (typeof firstValue === 'number') {
                        userAnswerValue = String(firstValue).trim();
                      }
                    }
                    // Bỏ qua object với numeric keys (có thể là từ matching/checkbox question)
                  }

                  const correctAnswerString = questionData.questions[gapOffset]?.answers || "";
                  const possibleCorrectAnswers = correctAnswerString.split("|").map((w) => w.trim().toLowerCase());
                  const displayCorrectAnswer = correctAnswerString.split("|")[0] || "";
                  const isCorrect = userAnswerValue !== "" && possibleCorrectAnswers.includes(userAnswerValue.toLowerCase());

                  if (isCorrect) {
                    return <span id={`#question-no-${displayIndex}`} className="ml-[5px] align-middle border border-[#000] px-[10px] py-[5px] rounded-[3px] text-green-600 font-semibold ml-[5px] align-middle">{userAnswerValue}</span>;
                  } else if (userAnswerValue !== "") {
                    return (
                      <span id={`#question-no-${displayIndex}`} className="ml-[5px] align-middle border border-[#374151]/30 px-[10px] py-[5px] rounded-[3px] bg-[#374151]/5">
                        <span className="text-[#374151] line-through mr-1 opacity-70">{userAnswerValue}</span>
                        <span className="text-green-600 font-semibold">{displayCorrectAnswer}</span>
                      </span>
                    );
                  } else {
                    return (
                      <span id={`#question-no-${displayIndex}`} className="ml-[5px] align-middle border border-[#374151]/20 px-[10px] py-[5px] rounded-[3px] bg-gray-50">
                        <span className="text-[#374151]/60 font-semibold">{displayCorrectAnswer}</span>
                      </span>
                    );
                  }
                }

                // === LOGIC LÀM BÀI ===
                return (
                  <Input
                    autoComplete="off"
                    disabled={readOnly}
                    id={`#question-no-${displayIndex}`}
                    size="small"
                    placeholder={displayIndex.toString()}
                    className={twMerge(
                      "w-24 text-center align-middle border-[#000] min-w-[133px] ml-[5px] rounded-[3px] placeholder-bold text-[16px] max-h-[22px]",
                      isActive && "active-quizz"
                    )}
                    {...field}
                    value={field.value?.toString() || ""}
                    onFocus={() => {
                      if (setActiveQuestionIndex) {
                        setActiveQuestionIndex(absoluteIndex);
                      }
                    }}
                  />
                );
              }}
            />
          ) : (
            <Input
              autoComplete="off"
              disabled={readOnly}
              id={`question-no-${displayIndex}`}
              size="small"
              placeholder={displayIndex.toString()}
              className="w-24 text-center align-middle"
            />
          );
        }
      },
    }),
    [
      methods,
      readOnly,
      realStartIndex,
      activeQuestionIndex,
      setActiveQuestionIndex,
      questionData.questions,
    ]
  );

  const parsedContent = useMemo(() => {
    const result = parse(questionData.content, options);
    return result;
  }, [options, questionData.content]);

  const content = useMemo(() => {
    const normalized = normalizeParseResult(parsedContent);
    return normalized;
  }, [parsedContent]);

  const numberOfGaps = questionData.questions.length;
  const displayStart = realStartIndex + 1;
  const displayEnd = realStartIndex + numberOfGaps;

  const questionRange = numberOfGaps > 1 ? `${displayStart} - ${displayEnd}` : `${displayStart}`;

  return (
    <div className="space-y-6" id={`question-block-${realStartIndex + 1}`}>
      <p className="text-lg font-bold">Questions {questionRange}</p>
      <div className="leading-[2] prose prose-sm max-w-none">
        <TextSelectionWrapper>
          <SafeRender name="fillup-content">
            {content}
          </SafeRender>
        </TextSelectionWrapper>
      </div>

      {readOnly && (
        <div className="space-y-4">
          {question.explanations?.[0]?.content && (
            <Collapse
              size="small"
              items={[
                {
                  key: "1",
                  label: "Explanation",
                  children: (
                    <div className="prose">
                      <TextSelectionWrapper>
                        <SafeRender name="fillup-explanation">
                          {normalizeParseResult(parse(question.explanations[0].content || ""))}
                        </SafeRender>
                      </TextSelectionWrapper>
                    </div>
                  ),
                },
              ]}
            />
          )}
        </div>
      )}
    </div>
  );
};