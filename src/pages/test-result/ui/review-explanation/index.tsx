// file: index.tsx

import { Button, ConfigProvider, Splitter, Collapse } from "antd";
import { IPracticeSingle, ITestResult } from "../../api";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";
import { QuestionRender } from "@/shared/ui/exam";
import { FormProvider, useForm } from "react-hook-form";
import _ from "lodash";
import parse, { HTMLReactParserOptions, domToReact } from "html-react-parser";
import dynamic from "next/dynamic";
const Plyr = dynamic(() => import("plyr-react"), { ssr: false });
import "plyr-react/plyr.css";
import { TextSelectionWrapper } from "@/shared/ui/text-selection";
import { Checkbox as AntCheckbox } from "antd";
import { normalizeParseResult, SafeRender } from "@/shared/lib/html-normalize";
import { countQuestion } from "@/shared/lib";
import { calculateStartIndexForAllQuestions } from "@/shared/lib/calculateStartIndex";

// Helper function để đếm số câu hỏi con từ một question
// Sử dụng cùng logic với countQuestion để đảm bảo nhất quán
const countSubQuestions = (question: any): number => {
  if (!question) return 1;
  
  const questionType = question.type?.[0];
  
  // Matching với layoutType = "heading": đếm gaps trong passage_content
  if (questionType === "matching" && question.matchingQuestion) {
    const layoutType = String(question.matchingQuestion.layoutType).trim().toLowerCase();
    if (layoutType === "heading") {
      // Note: passage_content không có trong question object, cần lấy từ passage
      // Nhưng ở đây chúng ta không có passage, nên dùng logic khác
      const summaryText = question.matchingQuestion.summaryText || "";
      if (summaryText && /\{(.*?)\}/.test(summaryText)) {
        const gapCount = (summaryText.match(/\{(.*?)\}/g) || []).length;
        return gapCount > 0 ? gapCount : 1;
      }
      // Fallback: đếm matchingItems nếu có
      if (question.matchingQuestion.matchingItems?.length > 0) {
        return question.matchingQuestion.matchingItems.length;
      }
    } else if (layoutType === "summary") {
      const summaryText = question.matchingQuestion.summaryText || "";
      if (summaryText && /\{(.*?)\}/.test(summaryText)) {
        const gapCount = (summaryText.match(/\{(.*?)\}/g) || []).length;
        return gapCount > 0 ? gapCount : 1;
      }
    } else if (layoutType === "standard" && question.matchingQuestion.matchingItems?.length > 0) {
      return question.matchingQuestion.matchingItems.length;
    }
  }
  
  // Matrix: đếm số items
  if (questionType === "matrix" && question.matrixQuestion?.matrixItems) {
    return question.matrixQuestion.matrixItems.length;
  }
  
  // Fillup: đếm số gaps trong question text
  const textWithGaps = question.question || "";
  if (textWithGaps && /\{(.*?)\}/.test(textWithGaps)) {
    const gapCount = (textWithGaps.match(/\{(.*?)\}/g) || []).length;
    if (gapCount > 0) {
      return gapCount;
    }
  }
  
  // List of questions
  if (question.list_of_questions && question.list_of_questions.length > 0) {
    return question.list_of_questions.length;
  }
  
  // Checkbox: đếm số đáp án đúng
  if (questionType === "checkbox") {
    const correctCount = question.list_of_options?.reduce(
      (acc: number, option: any) => (option.correct ? acc + 1 : acc), 0
    ) || 0;
    return correctCount > 0 ? correctCount : 1;
  }
  
  // Explanations
  if (question.explanations && question.explanations.length > 1) {
    return question.explanations.length;
  }
  
  // Mặc định là 1 câu hỏi
  return 1;
};

type AnswerFormValues = {
  answers: (string | number[] | object)[];
};

// Hàm helper để loại bỏ thẻ span với class fill-history-correct
const removeFillHistoryCorrectTags = (text: string | undefined): string => {
  if (!text) return "";
  let cleanedText = String(text);
  // Loại bỏ các thẻ span với class fill-history-correct, chỉ giữ lại nội dung bên trong
  // Xử lý cả trường hợp class có nhiều giá trị hoặc không có dấu ngoặc kép
  cleanedText = cleanedText.replace(
    /<span[^>]*class\s*=\s*["']?[^"'>]*fill-history-correct[^"'>]*["']?[^>]*>(.*?)<\/span>/gi,
    "$1"
  );
  // Xử lý thêm trường hợp nested spans (chạy 2 lần để xử lý spans lồng nhau)
  cleanedText = cleanedText.replace(
    /<span[^>]*class\s*=\s*["']?[^"'>]*fill-history-correct[^"'>]*["']?[^>]*>(.*?)<\/span>/gi,
    "$1"
  );
  return cleanedText;
};

function ReviewExplanation({
  quiz,
  testResult,
}: {
  quiz: IPracticeSingle;
  testResult: ITestResult;
}) {
  // Parse answers từ JSON string và debug
  const parsedAnswers = useMemo(() => {
    try {
      const rawAnswers = testResult.testResultFields.answers || '{"answers":[]}';
      
      const parsed = JSON.parse(rawAnswers) as {
        answers: (string | number[] | object | null | undefined)[];
      };
      
      // Map answers, chỉ convert null/undefined thành "", giữ nguyên các giá trị khác
      let mapped = (parsed.answers || []).map((a) => {
        if (a === null || a === undefined) {
          return "";
        }
        return a;
      });
      
      return mapped;
    } catch (error) {
      console.error("[ReviewExplanation] Error parsing answers:", error);
      return [];
    }
  }, [testResult.testResultFields.answers, quiz]);

  // Map answers từ original index (từ tất cả passages) sang filtered index (từ 0)
  // Answers được lưu với original index từ tất cả passages
  const mappedAnswers = useMemo(() => {
    // Parse testPart để biết passages nào được chọn
    let testParts: number[] = [];
    try {
      testParts = JSON.parse(testResult.testResultFields.testPart || "[]");
      if (!Array.isArray(testParts) || testParts.length === 0) {
        testParts = Array.from(
          { length: quiz.quizFields.passages.length },
          (_, index) => index
        );
      }
    } catch (error) {
      testParts = Array.from(
        { length: quiz.quizFields.passages.length },
        (_, index) => index
      );
    }
    
    // Tính original startIndex cho tất cả questions (từ tất cả passages)
    const originalStartIndexMap = new Map<string, number>();
    let originalCurrentIndex = 0;
    
    if (quiz?.quizFields?.passages) {
      quiz.quizFields.passages.forEach((passage: any, passageIndex: number) => {
        if (passage && passage.questions) {
          // Debug logging cho Passage 2 để xem tất cả questions
          if (passageIndex === 1) {
            console.log(`[Mapping] Passage 2 has ${passage.questions.length} questions`);
          }
          
          passage.questions.forEach((question: any, questionIndex: number) => {
            const questionType = question.type?.[0];
            let numberOfSubQuestions = 1;
            
            if (questionType === 'matching' && String(question.matchingQuestion?.layoutType).trim().toLowerCase() === 'heading') {
              let gapCount = 0;
              (passage.passage_content || "").replace(/\{(.*?)\}/g, () => { gapCount++; return ''; });
              numberOfSubQuestions = gapCount > 0 ? gapCount : 1;
            } else if (questionType === 'checkbox') {
              // Dùng countQuestion để đảm bảo nhất quán với logic đếm số options có correct: true
              numberOfSubQuestions = countQuestion({ questions: [question] } as any);
            } else {
              numberOfSubQuestions = countQuestion({ questions: [question] } as any);
            }
            
            if (isNaN(numberOfSubQuestions) || numberOfSubQuestions < 1) {
              numberOfSubQuestions = 1;
            }
            
            const key = question.id || `passage-${passageIndex}-question-${questionIndex}`;
            originalStartIndexMap.set(key, originalCurrentIndex);
            
            // Debug logging cho tất cả questions trong Passage 2
            if (passageIndex === 1) {
              console.log(`[Mapping] Passage 2 question ${questionIndex}:`, {
                questionType,
                originalStartIndex: originalCurrentIndex,
                numberOfSubQuestions,
                questionTitle: question.title?.substring(0, 50),
                key,
              });
            }
            
            originalCurrentIndex += numberOfSubQuestions;
          });
        }
      });
    }
    
    // Tạo mapping từ original index sang new index (chỉ cho passages đã chọn)
    const indexMapping = new Map<number, number>();
    let newIndex = 0;
    
    quiz.quizFields.passages.forEach((passage: any, passageIndex: number) => {
      if (!testParts.includes(passageIndex)) return;
      
      if (passage && passage.questions) {
        passage.questions.forEach((question: any, questionIndex: number) => {
          const questionType = question.type?.[0];
          let numberOfSubQuestions = 1;
          
          if (questionType === 'matching' && String(question.matchingQuestion?.layoutType).trim().toLowerCase() === 'heading') {
            let gapCount = 0;
            (passage.passage_content || "").replace(/\{(.*?)\}/g, () => { gapCount++; return ''; });
            numberOfSubQuestions = gapCount > 0 ? gapCount : 1;
          } else if (questionType === 'checkbox') {
            // Dùng countQuestion để đảm bảo nhất quán với logic đếm số options có correct: true
            numberOfSubQuestions = countQuestion({ questions: [question] } as any);
          } else {
            numberOfSubQuestions = countQuestion({ questions: [question] } as any);
          }
          
          if (isNaN(numberOfSubQuestions) || numberOfSubQuestions < 1) {
            numberOfSubQuestions = 1;
          }
          
          const key = question.id || `passage-${passageIndex}-question-${questionIndex}`;
          const originalStartIndex = originalStartIndexMap.get(key);
          
          if (originalStartIndex === undefined) {
            console.warn(`[Mapping] Could not find originalStartIndex for key: ${key}, passageIndex: ${passageIndex}, questionIndex: ${questionIndex}`);
            return;
          }
          
          // Debug logging cho Passage 2 fillup
          if (passageIndex === 1 && (questionType === 'fillup' || questionType === 'select')) {
            console.log(`[Mapping] Mapping Passage 2 ${questionType}:`, {
              passageIndex,
              questionIndex,
              key,
              originalStartIndex,
              newStartIndex: newIndex,
              numberOfSubQuestions,
              questionTitle: question.title?.substring(0, 50),
              countQuestionResult: countQuestion({ questions: [question] } as any),
            });
          }
          
          // Map từng sub-question
          for (let i = 0; i < numberOfSubQuestions; i++) {
            indexMapping.set(originalStartIndex + i, newIndex + i);
            
            // Debug logging cho Passage 2 fillup mapping
            if (passageIndex === 1 && (questionType === 'fillup' || questionType === 'select') && i < 5) {
              console.log(`[Mapping] Mapping sub-question ${i}:`, {
                originalIndex: originalStartIndex + i,
                newIndex: newIndex + i,
                originalValue: parsedAnswers[originalStartIndex + i],
              });
            }
          }
          
          newIndex += numberOfSubQuestions;
        });
      }
    });
    
    // Remap answers array
    const maxNewIndex = Math.max(...Array.from(indexMapping.values()), -1);
    if (maxNewIndex < 0) {
      return parsedAnswers; // Fallback nếu không có mapping
    }
    
    const remappedAnswers = new Array(maxNewIndex + 1).fill("");
    
    indexMapping.forEach((newIdx, originalIdx) => {
      if (originalIdx >= 0 && originalIdx < parsedAnswers.length) {
        remappedAnswers[newIdx] = parsedAnswers[originalIdx];
        
        // Debug logging cho Passage 2 fillup answers (index 20-25 trong original)
        if (originalIdx >= 20 && originalIdx <= 25) {
          console.log(`[Mapping] Remapping answer:`, {
            originalIdx,
            newIdx,
            originalValue: parsedAnswers[originalIdx],
            newValue: remappedAnswers[newIdx],
            originalValueType: typeof parsedAnswers[originalIdx],
            isEmpty: parsedAnswers[originalIdx] === "" || parsedAnswers[originalIdx] === null || parsedAnswers[originalIdx] === undefined,
          });
        }
      }
    });
    
    // Debug logging tổng hợp cho Passage 2 fillup
    const passage2FillupMappings = Array.from(indexMapping.entries()).filter(([orig, _]) => orig >= 20 && orig <= 25);
    if (passage2FillupMappings.length > 0) {
      console.log(`[Mapping] Passage 2 fillup mappings (original 20-25):`, {
        mappings: passage2FillupMappings,
        remappedAnswersAtNewIndex: remappedAnswers.slice(passage2FillupMappings[0]?.[1] || 0, (passage2FillupMappings[passage2FillupMappings.length - 1]?.[1] || 0) + 1),
        originalAnswersAt20to25: parsedAnswers.slice(20, 26),
        newStartIndex: passage2FillupMappings[0]?.[1],
        newEndIndex: passage2FillupMappings[passage2FillupMappings.length - 1]?.[1],
      });
    }
    
    return remappedAnswers;
  }, [parsedAnswers, quiz, testResult.testResultFields.testPart]);

  const methods = useForm<AnswerFormValues>({
    defaultValues: {
      answers: mappedAnswers,
    },
  });

  // Reset form values khi mappedAnswers thay đổi để đảm bảo form có dữ liệu mới nhất
  useEffect(() => {
    if (mappedAnswers.length > 0) {
      methods.reset({
        answers: mappedAnswers,
      });
    }
  }, [mappedAnswers, methods]);

  const [isMobileView, setIsMobileView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // ▼▼▼ HeadingAnswerBlock ▼▼▼
  const HeadingAnswerBlock = ({
    userAnswer,
    correctAnswer,
  }: {
    userAnswer: string | undefined;
    correctAnswer: string;
  }) => {
    // Loại bỏ thẻ span trước khi so sánh và hiển thị
    const cleanedUserAnswer = removeFillHistoryCorrectTags(userAnswer);
    const cleanedCorrectAnswer = removeFillHistoryCorrectTags(correctAnswer);

    const isCorrect =
      cleanedUserAnswer &&
      cleanedCorrectAnswer &&
      cleanedUserAnswer.trim().toLowerCase() ===
        cleanedCorrectAnswer.trim().toLowerCase();
    const isNoAnswer = !cleanedUserAnswer || cleanedUserAnswer.trim() === "";

    if (isCorrect) {
      return (
        <div className="mb-[-15px] border border-dashed border-green-600 leading-[22px] text-[17px] font-bold text-center bg-green-50 text-green-600 p-2 py-[1px] rounded-md prose prose-sm max-w-none">
          <TextSelectionWrapper>
            {normalizeParseResult(parse(cleanedCorrectAnswer))}
          </TextSelectionWrapper>
        </div>
      );
    }
    if (isNoAnswer) {
      return (
        <div className="mb-[-15px] text-[17px] leading-[22px] font-bold border border-dashed border-gray-400 text-center bg-gray-100 text-gray-500 p-2 py-[1px] rounded-md prose prose-sm max-w-none">
          <TextSelectionWrapper>
            {normalizeParseResult(parse(cleanedCorrectAnswer))}
          </TextSelectionWrapper>
        </div>
      );
    }
    return (
      <div className="mb-[-15px] flex flex-row gap-2 leading-[20px] border text-center border-dashed border-red-500 bg-red-50 text-red-700 p-2 py-[1px] rounded-md prose prose-sm max-w-none">
        <div className="line-through">
          <TextSelectionWrapper>
            {normalizeParseResult(parse(cleanedUserAnswer))}
          </TextSelectionWrapper>
        </div>
        <div className="text-green-600">
          <TextSelectionWrapper>
            {normalizeParseResult(parse(cleanedCorrectAnswer))}
          </TextSelectionWrapper>
        </div>
      </div>
    );
  };
  // ▲▲▲ KẾT THÚC HeadingAnswerBlock ▲▲▲

  // ▼▼▼ CheckboxReviewBlock ▼▼▼
  const CheckboxReviewBlock = ({
    question,
    startIndex,
  }: {
    question: any;
    startIndex: number;
  }) => {
    // Lấy đáp án người dùng đã chọn
    const rawUserAnswer = methods.getValues(`answers.${startIndex}`);
    const userAnswers = Array.isArray(rawUserAnswer)
      ? rawUserAnswer.map((val) => Number(val)).filter((val) => !isNaN(val))
      : [];

    const subQuestionCount =
      question.list_of_options?.reduce(
        (acc: number, option: any) => (option.correct ? acc + 1 : acc),
        0
      ) || 1;

    const explanationText = question.explanations?.[0]?.content || null;

    const correctOptionIndices = useMemo(() => {
      return (question.list_of_options || [])
        .map((opt: any, index: number) => (opt.correct ? index : -1))
        .filter((index: number) => index !== -1);
    }, [question.list_of_options]);

    return (
      <div id={`#question-no-${startIndex + 1}`} className="space-y-4">
        <h3 className="text-lg font-bold">
          Questions {startIndex + 1}
          {subQuestionCount > 1 && `–${startIndex + subQuestionCount}`}
        </h3>
        <div className="leading-[2] prose prose-sm max-w-none">
          {normalizeParseResult(parse(question.question || question.instructions || ""))}
        </div>
        <div className="flex flex-col space-y-1">
          {(question.list_of_options || []).map(
            (option: any, index: number) => {
              const isUserSelected = userAnswers.includes(index);
              const isCorrectOption = correctOptionIndices.includes(index);

              let rowBgClass = "";
              let rowBorderClass = "border-transparent";
              let textClass = "";
              let icon = null;

              if (isUserSelected) {
                if (isCorrectOption) {
                  rowBgClass = "bg-green-100 text-green-600";
                  rowBorderClass = "border-green-300";
                  icon = (
                    <span className="material-symbols-rounded text-green-600 ml-auto">
                      check_circle
                    </span>
                  );
                } else {
                  rowBgClass = "rounded bg-[#d3e3fd] text-red-500";
                  rowBorderClass = "border-red-300";
                  icon = (
                    <span className="material-symbols-rounded text-red-600 ml-auto">
                      cancel
                    </span>
                  );
                }
              } else {
                if (isCorrectOption) {
                  textClass = "text-green-600";
                }
              }

              return (
                <div
                  key={index}
                  className={twMerge(
                    "flex items-center px-[15px] py-[3px] rounded",
                    rowBgClass,
                    rowBorderClass
                  )}
                >
                  <AntCheckbox
                    checked={isUserSelected}
                    disabled
                    className="mr-2 pointer-events-none"
                  />
                  <span className={twMerge("flex-grow", textClass)}>
                    <TextSelectionWrapper>
                      {normalizeParseResult(parse(option.option))}
                    </TextSelectionWrapper>
                  </span>
                  {icon}
                </div>
              );
            }
          )}
        </div>
        {explanationText && (
          <Collapse
            className="mt-4"
            items={[
              {
                key: "1",
                label: "Explanation",
                children: (
                  <div className="prose prose-sm max-w-none">
                    {normalizeParseResult(parse(explanationText))}
                  </div>
                ),
              },
            ]}
          />
        )}
      </div>
    );
  };
  // ▲▲▲ KẾT THÚC CheckboxReviewBlock ▲▲▲

  const newPost = useMemo(() => {
    const rawPost = JSON.parse(JSON.stringify(quiz));

    // BƯỚC 1: Parse testPart và filter passages TRƯỚC KHI tính startIndex
    let testParts: number[] = [];
    try {
      testParts = JSON.parse(testResult.testResultFields.testPart || "[]");
      if (!Array.isArray(testParts)) {
        testParts = [];
      }
    } catch (error) {
      console.error("Error parsing testPart:", error);
      testParts = [];
    }
    
    // Validate testParts - fallback to all passages if empty
    if (testParts.length === 0) {
      testParts = Array.from(
        { length: rawPost.quizFields.passages.length },
        (_, index) => index
      );
    }
    
    // Filter passages based on selected parts and preserve original index mapping
    const filteredPassagesWithOriginalIndex: Array<{ passage: any; originalIndex: number }> = [];
    rawPost.quizFields.passages.forEach((passage: any, originalIndex: number) => {
      if (testParts.includes(originalIndex)) {
        filteredPassagesWithOriginalIndex.push({ passage, originalIndex });
      }
    });
    
    // BƯỚC 2: Tính lại startIndex từ 0 sau khi filter (QUAN TRỌNG!)
    // Điều này đảm bảo startIndex khớp với answers array đã được lưu khi làm bài
    // (vì trong take-the-test, startIndex cũng được tính lại từ 0 sau khi filter)
    let currentIndex = 0;
    const filteredPassages = filteredPassagesWithOriginalIndex.map(({ passage, originalIndex }, newIndex) => {
      // Deep clone passage để tránh mutate original
      const clonedPassage = JSON.parse(JSON.stringify(passage));
      
      _.set(clonedPassage, "partIndex", newIndex);
      // Preserve originalPartIndex for display purposes
      _.set(clonedPassage, "originalPartIndex", originalIndex);
      
      clonedPassage.questions.forEach((question: any, questionIndex: number) => {
        const questionType = question.type?.[0];
        let numberOfSubQuestions = 1;

        // Xử lý matching với layoutType = 'heading' - đếm gaps trong passage_content
        if (questionType === 'matching' && String(question.matchingQuestion?.layoutType).trim().toLowerCase() === 'heading') {
          let gapCount = 0;
          (clonedPassage.passage_content || "").replace(/\{(.*?)\}/g, () => { gapCount++; return ''; });
          numberOfSubQuestions = gapCount > 0 ? gapCount : 1;
        } else if (questionType === 'checkbox') {
          // Dùng countQuestion để đảm bảo nhất quán với logic đếm số options có correct: true
          numberOfSubQuestions = countQuestion({ questions: [question] } as any);
        } else {
          // Dùng countQuestion cho các loại câu hỏi khác
          numberOfSubQuestions = countQuestion({ questions: [question] } as any);
        }

        if (isNaN(numberOfSubQuestions) || numberOfSubQuestions < 1) {
          numberOfSubQuestions = 1;
        }

        // Tính lại startIndex từ 0 - QUAN TRỌNG: Override startIndex cũ
        _.set(
          clonedPassage,
          `questions.${questionIndex}.startIndex`,
          currentIndex
        );

        // Debug logging cho Passage 2 fillup/select
        if (originalIndex === 1 && (questionType === 'fillup' || questionType === 'select')) {
          console.log(`[newPost] Setting startIndex for Passage 2 ${questionType}:`, {
            passageIndex: originalIndex,
            newPassageIndex: newIndex,
            questionIndex,
            startIndex: currentIndex,
            numberOfSubQuestions,
            questionTitle: question.title?.substring(0, 50),
          });
        }

        currentIndex += numberOfSubQuestions;
      });
      
      return clonedPassage;
    });
    
    rawPost.quizFields.passages = filteredPassages;

    return rawPost;
  }, [quiz, testResult.testResultFields.testPart]);
  // ▲▲▲ KẾT THÚC newPost ▲▲▲

  const [currentPassageIndex, setCurrentPassageIndex] = useState(0);

  const currentPassage = useMemo(() => {
    if (!newPost?.quizFields?.passages || !Array.isArray(newPost.quizFields.passages)) {
      return undefined;
    }
    if (currentPassageIndex < 0 || currentPassageIndex >= newPost.quizFields.passages.length) {
      return undefined;
    }
    return newPost.quizFields.passages[currentPassageIndex];
  }, [newPost, currentPassageIndex]);

  // Validate và reset currentPassageIndex nếu cần
  useEffect(() => {
    if (!newPost?.quizFields?.passages || !Array.isArray(newPost.quizFields.passages)) {
      setCurrentPassageIndex(0);
      return;
    }
    if (currentPassageIndex < 0 || currentPassageIndex >= newPost.quizFields.passages.length) {
      setCurrentPassageIndex(0);
    }
  }, [newPost, currentPassageIndex]);

  // Reset currentPassageIndex khi newPost thay đổi (khi quiz hoặc testResult thay đổi)
  useEffect(() => {
    setCurrentPassageIndex(0);
  }, [quiz.id, testResult.id]);

  // Debug: Log để so sánh answers array với startIndex được tính
  useEffect(() => {
    
    // Tính tổng số câu hỏi từ newPost để so sánh
    // Validation: Check if total questions match answers length
    if (newPost?.quizFields?.passages) {
      let totalQuestions = 0;
      newPost.quizFields.passages.forEach((passage: any) => {
        if (passage.questions) {
          passage.questions.forEach((question: any) => {
            const subQuestions = countSubQuestions(question);
            totalQuestions += subQuestions;
          });
        }
      });
      if (totalQuestions > mappedAnswers.length) {
        console.warn(`[ReviewExplanation] WARNING: Total questions (${totalQuestions}) > Mapped answers length (${mappedAnswers.length})`);
      }
    }
  }, [mappedAnswers, newPost, countSubQuestions]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // ▼▼▼ LOGIC processedPassageComponent (ĐÃ SỬA LỖI STYLE) ▼▼▼
  const processedPassageComponent = useMemo(() => {
    if (!currentPassage?.passage_content) return null;

    const headingQuestion = currentPassage.questions.find((q: any) => {
      if (q.type?.[0] !== "matching") return false;
      const layoutValue = q.matchingQuestion?.layoutType;
      const layout = Array.isArray(layoutValue)
        ? layoutValue[0]
        : String(layoutValue || "")
            .trim()
            .toLowerCase();
      return layout === "heading";
    });

    if (!headingQuestion) {
      return (
        <div
          dangerouslySetInnerHTML={{
            __html: currentPassage.passage_content,
          }}
        />
      );
    }

    try {
      const startIndex = headingQuestion.startIndex || 0;
      const answerOptions =
        headingQuestion.matchingQuestion?.answerOptions || [];
      const userAnswers = methods.getValues(`answers.${startIndex}`) as
        | { [key: string]: number | string }
        | undefined;
      let headingIndex = -1;

      const parserOptions: HTMLReactParserOptions = {
        replace: (domNode: any): any => {
          if (domNode.type === "tag" && domNode.name === "p") {
            const firstChild = domNode.children?.[0];

            if (
              firstChild &&
              firstChild.type === "text" &&
              firstChild.data.startsWith("{")
            ) {
              headingIndex++;
              const currentItemIndex = headingIndex;

              let correctAnswerText = "";
              const match = firstChild.data.match(/\{(.*?)\}/);
              if (match && match[1]) {
                correctAnswerText = match[1];
              }

              let userAnswerText: string | undefined = undefined;
              if (userAnswers && userAnswers[currentItemIndex] !== undefined) {
                const savedValue = userAnswers[currentItemIndex];

                if (typeof savedValue === "number") {
                  const optionIndex = savedValue;
                  userAnswerText = answerOptions[optionIndex]?.optionText;
                } else if (
                  typeof savedValue === "string" &&
                  savedValue.startsWith("option-")
                ) {
                  try {
                    const optionIndex = parseInt(savedValue.split("-")[2]);
                    userAnswerText = answerOptions[optionIndex]?.optionText;
                  } catch (e) {
                    userAnswerText = undefined;
                  }
                }
              }

              firstChild.data = firstChild.data.replace(/\{(.*?)\}/, "");

              // --- SỬA LỖI STYLE Ở ĐÂY ---
              // Tách bỏ 'style' ra khỏi attributes để tránh lỗi React khi render
              const { style, ...restAttribs } = domNode.attribs || {};

              // Đảm bảo children là array trước khi truyền vào domToReact
              const childrenArray = Array.isArray(domNode.children)
                ? domNode.children
                : domNode.children
                ? Object.values(domNode.children)
                : [];

              // Đảm bảo domToReact trả về React element hợp lệ
              let reactChildren: any;
              try {
                reactChildren = domToReact(childrenArray, parserOptions);
                console.log('[parserOptions.replace] domToReact result type:', typeof reactChildren, 'Is array:', Array.isArray(reactChildren), 'Is valid element:', React.isValidElement(reactChildren), reactChildren);
                
                // Normalize kết quả để đảm bảo không có object với numeric keys
                reactChildren = normalizeParseResult(reactChildren);
                console.log('[parserOptions.replace] Normalized reactChildren type:', typeof reactChildren, 'Is array:', Array.isArray(reactChildren), 'Is valid element:', React.isValidElement(reactChildren), reactChildren);
                
                // Kiểm tra lại sau khi normalize
                if (reactChildren && typeof reactChildren === 'object' && !React.isValidElement(reactChildren) && !Array.isArray(reactChildren)) {
                  console.error('[parserOptions.replace] reactChildren is still an object after normalize:', reactChildren);
                  reactChildren = <>{reactChildren}</>;
                }
              } catch (error) {
                console.error("Error in domToReact:", error);
                // Fallback: render children trực tiếp bằng dangerouslySetInnerHTML
                reactChildren = null;
              }
              
              // Nếu reactChildren là null hoặc undefined, fallback về dangerouslySetInnerHTML
              if (!reactChildren && domNode.children) {
                const fallbackHtml = Array.isArray(domNode.children)
                  ? domNode.children.map((child: any) => child.data || child.children || '').join('')
                  : Object.values(domNode.children).map((child: any) => child.data || child.children || '').join('');
                return (
                  <>
                    <HeadingAnswerBlock
                      userAnswer={userAnswerText}
                      correctAnswer={correctAnswerText}
                    />
                    <p {...restAttribs} dangerouslySetInnerHTML={{ __html: fallbackHtml }} />
                  </>
                );
              }

              // Đảm bảo reactChildren được normalize trước khi render
              const normalizedChildren = normalizeParseResult(reactChildren);
              
              return (
                <>
                  <HeadingAnswerBlock
                    userAnswer={userAnswerText}
                    correctAnswer={correctAnswerText}
                  />
                  {/* Sử dụng restAttribs thay vì domNode.attribs */}
                  <p {...restAttribs}>
                    <SafeRender name="normalizedChildren">
                      {normalizedChildren}
                    </SafeRender>
                  </p>
                </>
              );
            }
          }
          // Đảm bảo không return object trực tiếp
          // Nếu domNode có children, convert thành React element
          if (domNode.children && (Array.isArray(domNode.children) || Object.keys(domNode.children).length > 0)) {
            const childrenArray = Array.isArray(domNode.children)
              ? domNode.children
              : Object.values(domNode.children);
            try {
              const reactChildren = domToReact(childrenArray, parserOptions);
              console.log('[parserOptions.replace fallback] domToReact result type:', typeof reactChildren, 'Is array:', Array.isArray(reactChildren), 'Is valid element:', React.isValidElement(reactChildren), reactChildren);
              
              // Normalize kết quả để đảm bảo không có object với numeric keys
              const normalized = normalizeParseResult(reactChildren);
              console.log('[parserOptions.replace fallback] Normalized result type:', typeof normalized, 'Is array:', Array.isArray(normalized), 'Is valid element:', React.isValidElement(normalized), normalized);
              
              // Kiểm tra lại sau khi normalize
              if (normalized && typeof normalized === 'object' && !React.isValidElement(normalized) && !Array.isArray(normalized)) {
                console.error('[parserOptions.replace fallback] Normalized result is still an object:', normalized);
                return <>{normalized}</>;
              }
              
              return normalized;
            } catch (error) {
              console.error("Error converting domNode to React element:", error);
            }
          }
          // Fallback: return undefined để parse() tự xử lý
          return undefined;
        },
      };

      const parsedResult = parse(currentPassage.passage_content, parserOptions);
      console.log('[processedPassageComponent] Parsed result type:', typeof parsedResult, 'Is array:', Array.isArray(parsedResult), 'Is valid element:', React.isValidElement(parsedResult), parsedResult);
      
      const normalized = normalizeParseResult(parsedResult);
      console.log('[processedPassageComponent] Normalized result type:', typeof normalized, 'Is array:', Array.isArray(normalized), 'Is valid element:', React.isValidElement(normalized), normalized);
      
      // Đảm bảo kết quả cuối cùng luôn là React element hoặc array hợp lệ
      // Nếu vẫn là object, wrap trong div
      if (normalized && typeof normalized === 'object' && !React.isValidElement(normalized) && !Array.isArray(normalized)) {
        console.error('[processedPassageComponent] Normalized result is still an object, wrapping in div:', normalized);
        return <div>{normalized}</div>;
      }
      
      // Nếu là array, đảm bảo tất cả phần tử đều hợp lệ
      if (Array.isArray(normalized)) {
        const invalidItems = normalized.filter(item => 
          item && typeof item === 'object' && !React.isValidElement(item) && !Array.isArray(item)
        );
        if (invalidItems.length > 0) {
          console.error('[processedPassageComponent] Array contains invalid items:', invalidItems);
          return <div>{normalized.map((item, idx) => {
            if (item && typeof item === 'object' && !React.isValidElement(item) && !Array.isArray(item)) {
              return <React.Fragment key={idx}>{item}</React.Fragment>;
            }
            return item;
          })}</div>;
        }
      }
      
      return normalized;
    } catch (error) {
      console.error("Error processing heading passage:", error);
      return (
        <div
          dangerouslySetInnerHTML={{
            __html: currentPassage.passage_content,
          }}
        />
      );
    }
  }, [currentPassage, methods]);
  // ▲▲▲ KẾT THÚC 'processedPassageComponent' ▲▲▲

  const hasPrevPassage = useMemo(
    () => {
      if (!newPost?.quizFields?.passages || !Array.isArray(newPost.quizFields.passages)) {
        return false;
      }
      return currentPassageIndex > 0;
    },
    [currentPassageIndex, newPost]
  );
  const hasNextPassage = useMemo(
    () => {
      if (!newPost?.quizFields?.passages || !Array.isArray(newPost.quizFields.passages)) {
        return false;
      }
      return currentPassageIndex < newPost.quizFields.passages.length - 1;
    },
    [currentPassageIndex, newPost]
  );

  const handlePrevPassage = () => {
    if (hasPrevPassage && currentPassageIndex > 0) {
      setCurrentPassageIndex(currentPassageIndex - 1);
    }
  };
  const handleNextPassage = () => {
    if (hasNextPassage && newPost?.quizFields?.passages && Array.isArray(newPost.quizFields.passages)) {
      const nextIndex = currentPassageIndex + 1;
      if (nextIndex < newPost.quizFields.passages.length) {
        setCurrentPassageIndex(nextIndex);
      }
    }
  };

  const PlyrComponent = useMemo(() => {
    if (!quiz.quizFields.audio) return null;
    return (
      <Plyr
        source={{
          type: "audio",
          sources: [
            {
              src: quiz.quizFields.audio!.node.mediaItemUrl,
              type: "audio/mp3",
            },
          ],
        }}
      />
    );
  }, [quiz.quizFields.audio]);

  // ▼▼▼ ExplanationsPanelContent ▼▼▼
  const ExplanationsPanelContent = useMemo(() => {
    if (!currentPassage || !currentPassage.questions) {
      return (
        <div className="p-4 md:px-0 text-gray-500">No passage/questions</div>
      );
    }

    const allHtml: string[] = [];
    let hasAnyExplanation = false;

    currentPassage.questions.forEach((q: any, questionIndex: number) => {
      if (Array.isArray(q.explanations) && q.explanations.length > 0) {
        let subQuestionCount = 1;
        const questionType = q.type?.[0];
        let isFillup = false;

        const questionText = q.question || q.instructions || "";
        let gapCount = 0;
        const gapMatches = questionText.match(/\{(.*?)\}/g);
        if (gapMatches) {
          gapCount = gapMatches.length;
        }

        if (gapCount > 0) {
          subQuestionCount = gapCount;
          if (q.explanations.length > 1) {
            isFillup = true;
          } else {
            isFillup = false;
          }
        } else if (q.list_of_questions && q.list_of_questions.length > 0) {
          subQuestionCount = q.list_of_questions.length;
        } else if (questionType === "checkbox") {
          subQuestionCount =
            q.list_of_options?.reduce(
              (acc: number, option: any) => (option.correct ? acc + 1 : acc),
              0
            ) || 1;
          // Với checkbox có nhiều đáp án đúng, mỗi explanation tương ứng với một câu hỏi
          if (q.explanations.length > 1) {
            isFillup = true;
          }
        } else if (q.explanations.length > 1) {
          subQuestionCount = q.explanations.length;
          isFillup = true;
        }

        const contentHtml = q.explanations
          .map((exp: any, index: number) => {
            let text = exp?.content;
            if (text && String(text).trim() !== "") {
              hasAnyExplanation = true;

              // Loại bỏ các thẻ span với class fill-history-correct, chỉ giữ lại nội dung bên trong
              // Xử lý cả trường hợp class có nhiều giá trị hoặc không có dấu ngoặc kép
              text = String(text).replace(
                /<span[^>]*class\s*=\s*["']?[^"'>]*fill-history-correct[^"'>]*["']?[^>]*>(.*?)<\/span>/gi,
                "$1"
              );
              // Xử lý thêm trường hợp nested spans
              text = String(text).replace(
                /<span[^>]*class\s*=\s*["']?[^"'>]*fill-history-correct[^"'>]*["']?[^>]*>(.*?)<\/span>/gi,
                "$1"
              );

              let resultHtml = "";
              // Với checkbox có nhiều đáp án đúng, mỗi explanation tương ứng với một câu hỏi
              // Tính số câu hỏi dựa trên startIndex và index của explanation
              if (
                isFillup ||
                (questionType === "checkbox" && q.explanations.length > 1)
              ) {
                const questionNumber = q.startIndex + 1 + index;
                resultHtml = `<p><b>Q.${questionNumber}:</b> ${text}</p>`;
              } else {
                resultHtml = `<p>${text}</p>`;
              }

              return resultHtml;
            }
            return null;
          })
          .filter(Boolean)
          .join("");

        if (contentHtml) {
          allHtml.push(contentHtml);
        }
      }
    });

    if (!hasAnyExplanation) {
      return (
        <div className="text-gray-500">
          No explanations available for this part.
        </div>
      );
    }

    const explanationsHtml = allHtml.join('<hr class="my-3"/>');
    const parsedExplanations = parse(explanationsHtml);
    console.log('[ExplanationsPanelContent] Parsed result type:', typeof parsedExplanations, 'Is array:', Array.isArray(parsedExplanations), 'Is valid element:', React.isValidElement(parsedExplanations), parsedExplanations);
    
    const validExplanations = normalizeParseResult(parsedExplanations);
    console.log('[ExplanationsPanelContent] Normalized result type:', typeof validExplanations, 'Is array:', Array.isArray(validExplanations), 'Is valid element:', React.isValidElement(validExplanations), validExplanations);
    
    // Đảm bảo kết quả cuối cùng luôn là React element hoặc array hợp lệ
    let finalExplanations = validExplanations;
    if (validExplanations && typeof validExplanations === 'object' && !React.isValidElement(validExplanations) && !Array.isArray(validExplanations)) {
      console.error('[ExplanationsPanelContent] Normalized result is still an object, wrapping in div:', validExplanations);
      finalExplanations = <div>{validExplanations}</div>;
    }
    
    // Nếu là array, đảm bảo tất cả phần tử đều hợp lệ
    if (Array.isArray(finalExplanations)) {
      const invalidItems = finalExplanations.filter(item => 
        item && typeof item === 'object' && !React.isValidElement(item) && !Array.isArray(item)
      );
      if (invalidItems.length > 0) {
        console.error('[ExplanationsPanelContent] Array contains invalid items:', invalidItems);
        finalExplanations = <div>{finalExplanations.map((item, idx) => {
          if (item && typeof item === 'object' && !React.isValidElement(item) && !Array.isArray(item)) {
            return <React.Fragment key={idx}>{item}</React.Fragment>;
          }
          return item;
        })}</div>;
      }
    }

    return (
      <div className="">
        <h3 className="text-xl font-bold text-primary md:px-12">
          Explanations
        </h3>
        <div className="space-y-2 px-1">
          <div className="prose prose-sm max-w-none">
            <SafeRender name="finalExplanations">
              {finalExplanations}
            </SafeRender>
          </div>
        </div>
      </div>
    );
  }, [currentPassage]);
  // ▲▲▲ KẾT THÚC ExplanationsPanelContent ▲▲▲

  // ▼▼▼ QuestionsPanelContent ▼▼▼
  const QuestionsPanelContent = useMemo(() => {
    if (!currentPassage || !currentPassage.questions) {
      return (
        <div className="p-4 md:p-12 text-gray-500">No questions available</div>
      );
    }
    return (
      <ConfigProvider>
        <FormProvider {...methods}>
          <div className={twMerge("p-4 md:p-12 space-y-6 bg-white")}>
            {currentPassage.questions &&
              currentPassage.questions.map((question: any, index: number) => {
                const questionType = question.type?.[0];
                if (questionType === "checkbox") {
                  return (
                    <CheckboxReviewBlock
                      key={`${currentPassageIndex}-${index}-review`}
                      question={question}
                      startIndex={question.startIndex}
                    />
                  );
                }
                // Debug: Log để kiểm tra question.startIndex và mappedAnswers cho fillup
                if (question.type?.[0] === 'fillup') {
                  const fillupStartIndex = question.startIndex || 0;
                  const numberOfGaps = countQuestion({ questions: [question] } as any);
                  const fillupAnswers = mappedAnswers.slice(fillupStartIndex, fillupStartIndex + numberOfGaps);
                  
                  // Debug chi tiết hơn cho Passage 2
                  if (currentPassageIndex === 1) {
                    console.log(`[QuestionsPanelContent] Rendering fillup question (Passage ${currentPassageIndex + 1}):`, {
                      passageIndex: currentPassageIndex,
                      questionIndex: index,
                      questionStartIndex: question.startIndex,
                      numberOfGaps,
                      fillupAnswers: fillupAnswers,
                      fillupAnswersLength: fillupAnswers.length,
                      mappedAnswersLength: mappedAnswers.length,
                      questionTitle: question.title?.substring(0, 50),
                      mappedAnswersAtStartIndex: mappedAnswers.slice(fillupStartIndex, fillupStartIndex + numberOfGaps + 2), // Lấy thêm 2 để debug
                      mappedAnswersAt20to25: mappedAnswers.slice(20, 26), // Debug index 20-25
                    });
                  } else {
                    console.log(`[QuestionsPanelContent] Rendering fillup question (Passage ${currentPassageIndex + 1}):`, {
                      passageIndex: currentPassageIndex,
                      questionIndex: index,
                      questionStartIndex: question.startIndex,
                      numberOfGaps,
                      fillupAnswers: fillupAnswers,
                      fillupAnswersLength: fillupAnswers.length,
                      mappedAnswersLength: mappedAnswers.length,
                      questionTitle: question.title?.substring(0, 50),
                    });
                  }
                }
                
                return (
                  <QuestionRender
                    key={`${currentPassageIndex}-${index}`}
                    question={question}
                    startIndex={question.startIndex}
                    readOnly
                  />
                );
              })}
          </div>
        </FormProvider>
      </ConfigProvider>
    );
  }, [methods, currentPassage, currentPassageIndex]);
  // ▲▲▲ KẾT THÚC QuestionsPanelContent ▲▲▲

  if (!currentPassage) {
    return <div>Loading review...</div>;
  }

  const isReading = quiz.quizFields.skill[0] === "reading";
  const isListening = quiz.quizFields.skill[0] === "listening";

  // Effect để fix menu settings bị clip khi Plyr được render
  useEffect(() => {
    if (!isListening) return;
    
    const fixPlyrMenu = () => {
      // Tìm tất cả menu của Plyr và đảm bảo chúng không bị clip
      const plyrMenus = document.querySelectorAll('.plyr__menu');
      plyrMenus.forEach((menu: any) => {
        if (menu) {
          menu.style.overflow = 'visible';
          menu.style.zIndex = '10000';
          menu.style.position = 'absolute';
          menu.style.clip = 'unset';
          menu.style.clipPath = 'none';
          menu.style.maxHeight = 'none';
          menu.style.height = 'auto';
        }
      });
      
      // Đảm bảo container không clip
      const plyrContainers = document.querySelectorAll('.plyr__menu__container');
      plyrContainers.forEach((container: any) => {
        if (container) {
          container.style.overflow = 'visible';
          container.style.zIndex = '10000';
          container.style.clip = 'unset';
          container.style.clipPath = 'none';
          container.style.maxHeight = 'none';
        }
      });
      
      // Đảm bảo settings button container không clip
      const settingsButtons = document.querySelectorAll('[data-plyr="settings"]');
      settingsButtons.forEach((button: any) => {
        if (button) {
          button.style.overflow = 'visible';
          button.style.zIndex = '10000';
          button.style.clip = 'unset';
          button.style.clipPath = 'none';
        }
      });
      
      // Đảm bảo tất cả parent containers không clip
      const allParents = document.querySelectorAll('.plyr, .plyr__controls, .plyr__controls__item');
      allParents.forEach((parent: any) => {
        if (parent) {
          const computetyle = window.getComputetyle(parent);
          if (computetyle.overflow === 'hidden' || computetyle.overflowY === 'hidden' || computetyle.overflowX === 'hidden') {
            parent.style.overflow = 'visible';
            parent.style.overflowY = 'visible';
            parent.style.overflowX = 'visible';
          }
        }
      });
      
      // Tìm và fix Splitter.Panel nếu có
      const splitterPanels = document.querySelectorAll('.ant-split-panel');
      splitterPanels.forEach((panel: any) => {
        if (panel && panel.querySelector('.plyr')) {
          const computetyle = window.getComputetyle(panel);
          if (computetyle.overflow === 'hidden' || computetyle.overflowY === 'hidden') {
            panel.style.overflow = 'visible';
            panel.style.overflowY = 'visible';
          }
          // Fix tất cả children của panel
          const panelChildren = panel.querySelectorAll('*');
          panelChildren.forEach((child: any) => {
            if (child && child !== panel.querySelector('.plyr') && !child.closest('.plyr')) {
              const chiltyle = window.getComputetyle(child);
              if (chiltyle.overflow === 'hidden' && child !== panel.querySelector('.plyr__menu')) {
                // Chỉ fix nếu không phải là explanations scrollable area
                if (!child.classList.contains('ex-right') && !child.closest('.ex-right')) {
                  // Không làm gì, giữ nguyên overflow cho explanations
                }
              }
            }
          });
        }
      });
      
      // Fix Splitter container
      const splitter = document.querySelector('.ant-split') as HTMLElement;
      if (splitter) {
        const computetyle = window.getComputetyle(splitter);
        if (computetyle.overflow === 'hidden') {
          splitter.style.overflow = 'visible';
        }
      }
    };
    
    // Fix ngay khi component mount
    const timer = setTimeout(fixPlyrMenu, 100);
    
    // Fix khi menu mở (observe mutations) - chạy liên tục
    const observer = new MutationObserver(() => {
      fixPlyrMenu();
    });
    const plyrElement = document.querySelector('.plyr');
    if (plyrElement) {
      observer.observe(plyrElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'style']
      });
    }
    
    // Fix khi click vào settings button
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('[data-plyr="settings"]') || target.closest('.plyr__menu')) {
        setTimeout(fixPlyrMenu, 10);
      }
    };
    document.addEventListener('click', handleClick, true);
    
    // Fix khi hover vào settings button
    const handleMouseEnter = () => {
      setTimeout(fixPlyrMenu, 10);
    };
    const settingsButton = document.querySelector('[data-plyr="settings"]');
    if (settingsButton) {
      settingsButton.addEventListener('mouseenter', handleMouseEnter);
    }
    
    return () => {
      clearTimeout(timer);
      observer.disconnect();
      document.removeEventListener('click', handleClick, true);
      if (settingsButton) {
        settingsButton.removeEventListener('mouseenter', handleMouseEnter);
      }
    };
  }, [isListening, PlyrComponent]);

  return (
    <>
      <Splitter
        layout={isMobileView ? "vertical" : undefined}
        className="h-[600px] border-t"
      >
        {/* PANEL 1 (BÊN TRÁI) */}
        <Splitter.Panel
          min="40%"
          max="60%"
          className="relative overflow-y-auto"
        >
          {/* 1a. NẾU LÀ READING: Hiển thị Passage */}
          {isReading && (
            <div className="prose prose-sm max-w-none p-4 md:p-12 bg-white">
              <h2 className="text-[#374151] text-2xl font-bold">
                {currentPassage.title}
              </h2>
              <SafeRender name="processedPassageComponent">
                {processedPassageComponent}
              </SafeRender>
            </div>
          )}

          {/* 1b. NẾU LÀ LISTENING: Hiển thị Câu hỏi (ẩn explanation bằng CSS) */}
          {isListening && (
            <div className="overflow-y-auto h-full relative">
              <style>{`
                #left-question-panel .ant-collapse {
                    display: none !important;
                }
              `}</style>
              <div id="left-question-panel">{QuestionsPanelContent}</div>
            </div>
          )}
        </Splitter.Panel>

        {/* PANEL 2 (BÊN PHẢI) */}
        <Splitter.Panel className="relative" style={{ overflow: 'visible' }}>
          {/* 2a. NẾU LÀ READING: Hiển thị Câu hỏi */}
          {isReading && (
            <div className="overflow-y-auto h-[calc(600px-50px)]">
              {QuestionsPanelContent}
            </div>
          )}

          {/* 2b. NẾU LÀ LISTENING: Hiển thị Audio & Explanations */}
          {isListening && (
            <div className="h-[calc(600px-50px)] relative flex flex-col" style={{ overflow: 'visible' }}>
              {/* Audio player - không scroll, overflow visible để menu settings không bị che */}
              <div ref={ref} className="p-4 md:p-12 flex-shrink-0" style={{ overflow: 'visible', position: 'relative', zIndex: 100 }}>
                <div style={{ overflow: 'visible', position: 'relative', zIndex: 100 }}>
                  {PlyrComponent}
                </div>
              </div>
              {/* Explanations - scrollable */}
              <div className="flex-1 overflow-y-auto min-h-0" style={{ overflowX: 'visible' }}>
                <div className="ex-right">{ExplanationsPanelContent}</div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="absolute bottom-0 left-0 right-0 bg-gray-100 flex justify-between items-center px-4 py-2 border-t">
            <p className="font-semibold text-[#374151] line-clamp-1">
              {currentPassage.title}
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="primary"
                disabled={!hasPrevPassage}
                onClick={handlePrevPassage}
              >
                <span className="material-symbols-rounded">chevron_left</span>
                <span>Previous</span>
              </Button>
              <Button
                type="primary"
                disabled={!hasNextPassage}
                onClick={handleNextPassage}
              >
                <span>Next</span>
                <span className="material-symbols-rounded">chevron_right</span>
              </Button>
            </div>
          </div>
        </Splitter.Panel>
      </Splitter>
    </>
  );
}

export default ReviewExplanation;
