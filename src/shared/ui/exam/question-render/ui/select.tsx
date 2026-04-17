import { IPracticeSingle } from "@/pages/ielts-practice-single/api";
import parse, {
  DOMNode,
  domToReact,
  Element,
  HTMLReactParserOptions,
} from "html-react-parser";
import { Fragment, JSX, useMemo, useState } from "react";
import { Collapse, Select as SelectAnt, theme } from "antd";
import _ from "lodash";
import { Controller, useFormContext } from "react-hook-form";
import { AnswerFormValues, useExamContext } from "@/pages/take-the-test/context";
import { randomUUID } from "@/shared/lib";
import { TextSelectionWrapper } from "@/shared/ui/text-selection";
import { twMerge } from "tailwind-merge";

export const Select = ({
  question,
  startIndex = 0,
  readOnly = false,
}: {
  question: IPracticeSingle["quizFields"]["passages"][number]["questions"][number];
  startIndex?: number;
  readOnly?: boolean;
} & React.HTMLAttributes<HTMLDivElement>) => {
  const methods = useFormContext<AnswerFormValues>();
  const { token } = theme.useToken();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  
  // 1. LẤY HÀM TÌM KIẾM TỪ CONTEXT
  const { setActiveQuestionIndex, getQuestionStartIndex } = useExamContext();

  // 2. TÍNH TOÁN INDEX THỰC TẾ (GLOBAL INDEX)
  const realStartIndex = useMemo(() => {
    // QUAN TRỌNG: Trong review mode (readOnly), propStartIndex đã được tính đúng từ newPost
    // Nên LUÔN LUÔN dùng propStartIndex khi readOnly mode để đảm bảo khớp với answers array
    if (readOnly) {
      const finalStartIndex = (question.startIndex !== undefined && question.startIndex >= 0) 
        ? question.startIndex 
        : startIndex;
      
      return finalStartIndex;
    }

    // Gọi hàm lookup từ Context (chỉ khi không phải readOnly)
    const contextIndex = getQuestionStartIndex(question);

    // Nếu Context tìm thấy (>0) thì dùng, ngược lại dùng prop (fallback)
    if (contextIndex > 0) return contextIndex;
    
    // Fallback về prop startIndex nếu context trả về 0
    return startIndex; 
  }, [question, getQuestionStartIndex, startIndex, readOnly]);

  const questionData = useMemo(() => {
    let newContent = question.question || "";
    const questions: {
      id: string;
      answers: string[];
    }[] = [];
    const regex = /\{(.*?)\}/g;
    let match: RegExpExecArray | null,
      i = 0;

    while ((match = regex.exec(question.question || "")) !== null) {
      if (match[1].trim() !== "") {
        const uniqueId = randomUUID();

        questions.push({
          id: uniqueId,
          answers: match[1].split("|").map((a) => a.trim()),
        });

        newContent = newContent.replace(
          match[0],
          `<span data-input-id="${uniqueId}" data-index="${i++}"></span>`
        );
      }
    }

    return {
      content: newContent,
      questions,
    };
  }, [question.question]);

  const options: HTMLReactParserOptions = useMemo(() => ({
    replace(domNode) {
      if ((domNode as Element).attribs) {
        const allowedTags = [
          "p",
          "span",
          "b",
        ] as (keyof JSX.IntrinsicElements)[];

        const { children, tagName } = domNode as Element;
        const Component = allowedTags.includes(
          tagName as keyof JSX.IntrinsicElements
        )
          ? "div"
          : (tagName as keyof JSX.IntrinsicElements);

        const isContainSelect = children.some((child) =>
          _.has((child as Element).attribs, "data-input-id")
        );

        if (isContainSelect) {
          return (
            <Component>
              {children.map((child, index) => {
                const childElement = child as Element;

                // Case 1: Nếu là node SELECT (ô chọn)
                if (_.has(childElement.attribs, "data-input-id")) {
                  // Sử dụng realStartIndex thay vì startIndex
                  const relativeIndex = Number(childElement.attribs["data-index"]);
                  const questionIndex = relativeIndex + 1 + realStartIndex; // Index hiển thị (1-based)
                  const absoluteIndex = questionIndex - 1; // Index lưu data (0-based)
                  
                  const fieldName = `answers.${absoluteIndex}`;
                  const inputId = `#question-no-${questionIndex}`;

                  return (
                    <div
                      key={index}
                      className="inline-flex items-stretch gap-1"
                      id={inputId}
                    >
                      <span // Nhãn Q.X
                        style={{ fontSize: token.fontSize }}
                        className="bg-black/2 px-[11px] border border-[#d9d9d9] flex items-center leading-none rounded-sm"
                      >
                        {`Q.${questionIndex}`}
                      </span>
                      {methods ? (
                        <Controller
                          // 3. QUAN TRỌNG: Key để fix lỗi Ghosting
                          key={absoluteIndex}
                          
                          control={methods.control}
                          name={fieldName as `answers.${number}`}
                          render={({ field }) => (
                            <SelectAnt
                              disabled={readOnly}
                              tagRender={(props) => <div>{props.value}</div>}
                              size="small"
                              placeholder="--"
                              options={(question.list_of_options || [])
                                .filter((o) => o.option !== "")
                                .map((o, i) => ({
                                  label: o.option,
                                  value: i,
                                }))}
                              {...field}
                              value={field.value !== null && field.value !== undefined && field.value !== "" ? field.value : undefined}
                              onFocus={() => {
                                if (!readOnly) {
                                  setActiveIndex(questionIndex); 
                                  setActiveQuestionIndex(absoluteIndex); // Update active state
                                }
                              }}
                              onBlur={() => setActiveIndex(null)}
                            />
                          )}
                        />
                      ) : (
                        <SelectAnt
                          disabled={readOnly}
                          tagRender={(props) => <div>{props.value}</div>}
                          size="small"
                          options={(question.list_of_options || [])
                            .filter((o) => o.option !== "")
                            .map((o, i) => ({
                              label: o.option,
                              value: i,
                            }))}
                          onFocus={() => {
                            if (!readOnly) {
                              setActiveIndex(questionIndex);
                              setActiveQuestionIndex(absoluteIndex);
                            }
                          }}
                          onBlur={() => setActiveIndex(null)}
                        />
                      )}
                    </div>
                  );
                }

                // Case 2: Nếu là node TEXT (tiêu đề)
                else {
                  let questionIndexForThisText: number | null = null;
                  const nextSibling = children[index + 1] as Element;

                  if (nextSibling && _.has(nextSibling.attribs, "data-input-id")) {
                    // Cập nhật logic highlight text dùng realStartIndex
                    questionIndexForThisText =
                      Number(nextSibling.attribs["data-index"]) + 1 + realStartIndex;
                  }

                  const isTextActive = activeIndex === questionIndexForThisText;

                  return (
                    <p
                      className={twMerge("inline", isTextActive && "active-quizz")}
                      key={index}
                    >
                      {domToReact([child as DOMNode])}
                    </p>
                  );
                }
              })}
            </Component>
          );
        }
      }
    },
    // Thêm realStartIndex vào dependency array
  }), [methods, readOnly, realStartIndex, token.fontSize, question.list_of_options, activeIndex, setActiveQuestionIndex]);

  const numberOfGaps = questionData.questions.length;
  const subQuestions = question.list_of_questions || [];
  const useSubQuestions = numberOfGaps === 0 && subQuestions.length > 0;
  
  // Tính toán hiển thị range câu hỏi
  const displayStart = realStartIndex + 1;
  const displayEnd = realStartIndex + (useSubQuestions ? subQuestions.length : numberOfGaps);
  const questionRange = (useSubQuestions ? subQuestions.length : numberOfGaps) > 1 
    ? ` - ${displayEnd}` 
    : ``;

  return (
    <div className="space-y-4" id={`question-block-${realStartIndex + 1}`}>
      <h3 className="text-lg font-bold">
        Question {displayStart}{questionRange}
      </h3>
      
      <div className="leading-[2] prose prose-sm max-w-none">
        <TextSelectionWrapper>
          {parse(questionData.content, options)}
        </TextSelectionWrapper>
      </div>

      {useSubQuestions && subQuestions.map((subQ, index) => {
        const questionIndex = realStartIndex + index;
        const correctAnswerIndex = subQ.correct ?? 0;
        const fieldName = `answers.${questionIndex}`;
        const inputId = `#question-no-${questionIndex + 1}`;

        return (
          <div
            key={questionIndex}
            className="space-y-2 pb-[10px]"
            id={inputId}
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
              
              <div className="ml-2 inline-block">
                <Controller
                  key={questionIndex}
                  control={methods.control}
                  name={fieldName as `answers.${number}`}
                  render={({ field }) => {
                    const userAnswerIndex = field.value;
                    const userDidAnswer = userAnswerIndex !== null && userAnswerIndex !== undefined && userAnswerIndex !== "";
                    const isUserCorrect = userDidAnswer && Number(userAnswerIndex) === correctAnswerIndex;
                    
                    const dropdownValue = readOnly ? (userDidAnswer ? Number(userAnswerIndex) : undefined) : (field.value !== "" && field.value !== null && field.value !== undefined ? Number(field.value) : undefined);
                    
                    return (
                      <span className="inline-flex items-center gap-2">
                        <SelectAnt
                          {...field}
                          value={dropdownValue}
                          disabled={readOnly}
                          tagRender={(props) => <div>{props.value}</div>}
                          size="small"
                          placeholder="--"
                          style={{ minWidth: 120 }}
                          className={readOnly ? (isUserCorrect ? "[&_.ant-select-selector]:bg-[#d9ead3] [&_.ant-select-selector]:!text-green-600" : (userDidAnswer ? "[&_.ant-select-selector]:bg-[#374151]/10 [&_.ant-select-selector]:!text-[#374151]" : "")) : ""}
                          options={(subQ.options || [])
                            .map((o, i) => ({
                              label: parse(o.content || ""),
                              value: i,
                            }))}
                          onFocus={() => {
                            if (!readOnly) {
                              setActiveIndex(index); 
                              setActiveQuestionIndex(questionIndex);
                            }
                          }}
                          onBlur={() => setActiveIndex(null)}
                          onChange={(val) => {
                            field.onChange(val);
                            if (!readOnly) {
                               setActiveIndex(index);
                               setActiveQuestionIndex(questionIndex);
                            }
                          }}
                        />
                        {readOnly && (
                          <>
                           {isUserCorrect ? (
                             <span className="material-symbols-rounded text-green-600 text-lg">check_circle</span>
                           ) : userDidAnswer ? (
                             <span className="material-symbols-rounded text-[#374151] text-lg">cancel</span>
                           ) : null}
                           {readOnly && !isUserCorrect && (
                             <span className="text-green-600 font-semibold ml-2">({subQ.options?.[correctAnswerIndex]?.content?.replace(/<[^>]+>/g, '')})</span>
                           )}
                          </>
                        )}
                      </span>
                    )
                  }}
                />
              </div>
            </div>
          </div>
        );
      })}

      {readOnly && !useSubQuestions && (
        <div className="space-y-4">
          {(question.explanations || []).map((explanation, index) => (
            <Fragment key={index}>
              <p className="space-x-1">
                <span className="font-semibold">
                  Q.{realStartIndex + index + 1}
                </span>
                <span>Answer:</span>
                <span className="text-[#374151] font-semibold opacity-80">
                  {questionData.questions[index]?.answers?.join(", ")}
                </span>
              </p>
              <Collapse
                size="small"
                items={[
                  {
                    key: "1",
                    label: "Explanation",
                    children: (
                      <div className="prose">
                        {parse(explanation.content || "")}
                      </div>
                    ),
                  },
                ]}
              />
            </Fragment>
          ))}
        </div>
      )}
      {readOnly && useSubQuestions && question.explanations && question.explanations.length > 0 && (
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