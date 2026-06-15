// file: index.tsx

import Head from "next/head";
import { Button, ConfigProvider, Splitter, Collapse, Tooltip, Modal } from "antd";
import { IPracticeSingle, ITestResult } from "../../api";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";
import Image from "next/image";
import { QuestionRender } from "@/shared/ui/exam";
import { FormProvider, useForm } from "react-hook-form";
import _ from "lodash";
import parse, { HTMLReactParserOptions, domToReact } from "html-react-parser";
import dynamic from "next/dynamic";
const Plyr = dynamic(() => import("plyr-react"), { ssr: false });
import "plyr-react/plyr.css";
import AudioPlayer from "@/pages/take-the-test/ui/audio-player";
import { TextSelectionWrapper, TextSelectionProvider } from "@/shared/ui/text-selection";
import { Checkbox as AntCheckbox } from "antd";
import { normalizeParseResult, SafeRender } from "@/shared/lib/html-normalize";
import { countQuestion } from "@/shared/lib";
import { calculateScore as computeScoreDetails } from "@/shared/lib/calculateScore";
import { calculateStartIndexForAllQuestions } from "@/shared/lib/calculateStartIndex";
import { ExamContext, useExamContext } from "@/pages/take-the-test/context";
import Notepad from "@/pages/take-the-test/ui/notepad";
import { Container } from "@/shared/ui";
import Link from "next/link";
import { ROUTES } from "@/shared/routes";
import { QuestionExplanation } from "@/shared/ui/exam/question-render/ui";

// Helper function để đếm số câu hỏi con từ một question
// Sử dụng cùng logic với countQuestion để đảm bảo nhất quán
const countSubQuestions = (question: any, passageContent?: string): number => {
  if (!question) return 1;

  const questionType = question.type?.[0];

  // Matching với layoutType = "heading": đếm gaps trong passage_content
  if (questionType === "matching" && question.matchingQuestion) {
    const layoutType = String(question.matchingQuestion.layoutType).trim().toLowerCase();
    if (layoutType === "heading") {
      // Heading layout: đếm số {...} trong nội dung passage
      const content = passageContent || "";
      const gapCount = (content.match(/\{(.*?)\}/g) || []).length;
      if (gapCount > 0) return gapCount;
      // Fallback nếu không có passageContent: thử summaryText / matchingItems
      const summaryText = question.matchingQuestion.summaryText || "";
      if (summaryText && /\{(.*?)\}/.test(summaryText)) {
        const gapCount = (summaryText.match(/\{(.*?)\}/g) || []).length;
        return gapCount > 0 ? gapCount : 1;
      }
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

function ReviewHeader({
  quiz,
  testResult,
}: {
  quiz: IPracticeSingle;
  testResult: ITestResult;
}) {
  const { isNotesViewOpen, setIsNotesViewOpen, selectedTextSize, setSelectedTextSize } =
    useExamContext();
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [optionsView, setOptionsView] = useState("main");

  const textSizes = [
    { key: "Regular", name: "Regular" },
    { key: "large", name: "Large" },
    { key: "xlarge", name: "Extra Large" },
  ];

  return (
    <>
      <header className="py-2 bg-white shadow z-20 mb-[20px] px-[16px] shrink-0">
        <Container className="max-w-none">
          <div className="flex items-center">
            <div className="md:w-1/3">
              <div className="flex">
                <div
                  title="Home"
                  className="h-10 md:h-12 aspect-[750/449] relative duration-300 flex-shrink-0"
                >
                  <Link href="/">
                    <Image
                      min-width="160px"
                      sizes="100%"
                      alt="logo"
                      src="/assets/logos/logo-on-bright.svg"
                      priority
                      fill
                      className="object-contain"
                    />
                  </Link>
                </div>
                <div className="title-wrap ml-[15px]">
                  <h2 className="font-bold text-base line-clamp-1">{quiz.title}</h2>
                  <div className="flex items-center">
                    <span className="font-medium text-sm text-gray-500">Review Mode</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="md:w-2/3">
              <div className="flex items-center justify-end md:gap-4 gap-2">
                <div className="flex items-center gap-3 md:gap-6">
                  <Link
                    href={(() => {
                      const skill = quiz.quizFields.skill?.[0];
                      const type = quiz.quizFields.type?.[0];
                      if (type === "prediction") return ROUTES.PREDICTION.ARCHIVE;
                      if (type === "exam") return ROUTES.EXAM.ARCHIVE;
                      if (skill === "reading") return ROUTES.PRACTICE.ARCHIVE_READING;
                      if (skill === "listening") return ROUTES.PRACTICE.ARCHIVE_LISTENING;
                      return ROUTES.HOME;
                    })()}
                    className="flex flex-col md:flex-row items-center gap-1 text-[#222] hover:text-[#d94a56] font-medium transition-colors"
                  >
                    <span className="material-symbols-rounded !font-bold !block text-[20px] md:text-[24px]">
                      arrow_back
                    </span>
                    <span className="hidden lg:inline text-sm whitespace-nowrap">
                      Go back
                    </span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      window.location.href = `${ROUTES.TAKE_THE_TEST(quiz.slug)}?retake=true`;
                    }}
                    className="flex flex-col md:flex-row items-center gap-1 text-[#222] hover:text-[#d94a56] font-medium transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-rounded !font-bold !block text-[20px] md:text-[24px]">
                      refresh
                    </span>
                    <span className="hidden lg:inline text-sm whitespace-nowrap">
                      Retry
                    </span>
                  </button>
                </div>

                <div className="w-[1px] h-[24px] bg-gray-300 hidden md:block mx-2"></div>
                <Image
                  width={28}
                  height={24}
                  sizes="100%"
                  alt="wifi"
                  src="/wifi.png"
                  priority
                />

                <Tooltip title="Open Notes" className="hidden md:block">
                  <Button
                    className="p-[0] border-[0] shadow-[0]"
                    onClick={() => setIsNotesViewOpen((prev) => !prev)}
                  >
                    <span className="material-symbols-rounded bold block! text-[24px]! text-[#222]">
                      assignment
                    </span>
                  </Button>
                </Tooltip>

                <Button
                  className="p-[0] border-[0] shadow-[0]"
                  onClick={() => setIsOptionsOpen(true)}
                >
                  <div className="hambuger">
                    <div className="bar"></div>
                    <div className="bar"></div>
                    <div className="bar"></div>
                  </div>
                </Button>

                <Link
                  href={ROUTES.TEST_RESULT(testResult.id)}
                  className="hidden md:flex items-center justify-center w-10 h-10 rounded-full text-[#222] hover:bg-gray-100 transition-all"
                  title="Continue"
                >
                  <span className="material-symbols-rounded text-[26px]">
                    arrow_forward
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </header>

      <Modal
        open={isOptionsOpen}
        onCancel={() => {
          setIsOptionsOpen(false);
          setTimeout(() => setOptionsView("main"), 200);
        }}
        footer={null}
        closable={true}
        closeIcon={
          <Image
            width={18}
            height={18}
            sizes="100%"
            alt="close"
            src="/bold-close.png"
            className="mr-[35px] mt-[5px]"
            priority
          />
        }
        width="100%"
        wrapClassName="fullscreen-modal"
        title={
          optionsView === "main" ? (
            <h3 className="text-[27px] font-[500] text-center mt-[-2px]">Options</h3>
          ) : (
            <div className="relative flex justify-center items-center h-full ml-[-16px] mt-[-5px]">
              <button
                onClick={() => setOptionsView("main")}
                className="absolute left-0 flex gap-[10px] items-center text-gray-600 hover:text-black cursor-pointer"
              >
                <Image
                  width={17}
                  height={25}
                  sizes="100%"
                  src="/bold-arrow.png"
                  alt="icon"
                  className="mt-[-3px] option-icon"
                  priority
                />
                <span className="font-[500] text-[27px] text-[#000] popup-title">Options</span>
              </button>
              <h3 className="text-[27px] font-[500] text-center popup-title">Text size</h3>
            </div>
          )
        }
        transitionName=""
        maskTransitionName=""
      >
        <div className="max-w-[700px] mx-auto mt-4">
          {optionsView === "main" && (
            <div className="tool-group">
              <div
                className="tool-box cursor-pointer popup-bar-item"
                onClick={() => setOptionsView("textSize")}
              >
                <div className="flex items-center gap-[25px]">
                  <Image
                    width={28}
                    height={24}
                    className="icon-left"
                    sizes="100%"
                    alt="text size"
                    src="/text-size-icon.png"
                    priority
                  />
                  <div className="title">Text size</div>
                </div>
                <Image
                  width={28}
                  height={24}
                  className="icon-right"
                  sizes="100%"
                  alt="arrow"
                  src="/arrow-right.png"
                  priority
                />
              </div>
            </div>
          )}
          {optionsView === "textSize" && (
            <div className="border border-[#c5c5c5] rounded-[4px] overflow-hidden mt-[30px]">
              {textSizes.map((size) => (
                <button
                  key={size.key}
                  onClick={() => setSelectedTextSize(size.key)}
                  className="w-full flex items-center text-left px-[36px] py-[27px] border-b border-gray-300 last:border-b-0 hover:bg-gray-100 transition-colors"
                >
                  <span
                    className={`material-symbols-rounded check-size xbold mr-[25px] transition-opacity ${
                      selectedTextSize === size.key ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    check
                  </span>
                  <span className="text-[18px] size-text">{size.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}

function ReviewExplanation({
  quiz,
  testResult,
  fullPage = false,
}: {
  quiz: IPracticeSingle;
  testResult: ITestResult;
  fullPage?: boolean;
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
    
    // Tính original startIndex cho tất cả questions (từ tất cả passages).
    // Phải honor start_question_number — take-the-test lưu answers ở slot
    // (start - 1), nên originalIndex của câu đầu tiên của một passage có
    // start_question_number=27 là 26, không phải 0. Nếu không reset, lookup
    // form value của câu đó sẽ trả về ô rỗng (mảng mappedAnswers chỉ có
    // entries ở 0..N-1) và mọi đáp án trong review hiện ra "missed".
    const originalStartIndexMap = new Map<string, number>();
    let originalCurrentIndex = 0;

    if (quiz?.quizFields?.passages) {
      quiz.quizFields.passages.forEach((passage: any, passageIndex: number) => {
        if (passage && passage.questions) {
          const explicitStart = (passage as any).start_question_number;
          if (explicitStart && !isNaN(Number(explicitStart))) {
            originalCurrentIndex = Number(explicitStart) - 1;
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

            originalCurrentIndex += numberOfSubQuestions;
          });
        }
      });
    }

    // Tạo mapping từ original index sang new index (chỉ cho passages đã chọn).
    // newIndex cũng phải honor start_question_number cho khớp với newPost —
    // matching/select/fillup component đọc form value tại question.startIndex
    // (= offset), nên mảng mappedAnswers cần có entries tại các slot đó.
    const indexMapping = new Map<number, number>();
    let newIndex = 0;

    quiz.quizFields.passages.forEach((passage: any, passageIndex: number) => {
      if (!testParts.includes(passageIndex)) return;

      if (passage && passage.questions) {
        const explicitStart = (passage as any).start_question_number;
        if (explicitStart && !isNaN(Number(explicitStart))) {
          newIndex = Number(explicitStart) - 1;
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
          const originalStartIndex = originalStartIndexMap.get(key);

          if (originalStartIndex === undefined) {
            console.warn(`[Mapping] Could not find originalStartIndex for key: ${key}, passageIndex: ${passageIndex}, questionIndex: ${questionIndex}`);
            return;
          }

          // Map từng sub-question
          for (let i = 0; i < numberOfSubQuestions; i++) {
            indexMapping.set(originalStartIndex + i, newIndex + i);
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
      }
    });

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

  const ref = useRef<HTMLDivElement>(null);

  // State for review mode notes/highlights (mirrors ExamContext)
  const [isNotesViewOpen, setIsNotesViewOpen] = useState(false);
  const [savedPassageData, setSavedPassageData] = useState<Record<number, { notes: any[]; highlights: any[] }>>({});
  const [selectedTextSize, setSelectedTextSize] = useState("Regular");

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
      <div className="mb-[-15px] flex flex-row gap-2 leading-[20px] border text-center border-dashed border-red-500 bg-red-50 p-2 py-[1px] rounded-md prose prose-sm max-w-none">
        <div className="text-red-500 line-through font-bold">
          <TextSelectionWrapper>
            {normalizeParseResult(parse(cleanedUserAnswer))}
          </TextSelectionWrapper>
        </div>
        <div className="text-green-600 font-bold">
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
                    rowBgClass = "bg-[#d9ead3] text-green-600 font-semibold";
                    icon = (
                      <span className="material-symbols-rounded text-green-600 ml-auto">
                        check_circle
                      </span>
                    );
                  } else {
                    rowBgClass = "bg-[#dbe5fa] text-red-600 font-semibold";
                    icon = (
                      <span className="material-symbols-rounded text-red-600 ml-auto">
                        cancel
                      </span>
                    );
                  }
              } else {
                if (isCorrectOption) {
                  textClass = "text-green-600 font-semibold";
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
          <QuestionExplanation content={explanationText} />
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

      // Honor admin-configured start_question_number for practice extracts
      // (e.g. a single-passage Passage 3 quiz that should number 27–40, not
      // 1–14). Mirrors the take-the-test footer logic so question numbering
      // and form-value lookups line up between modes.
      const explicitStart = (clonedPassage as any).start_question_number;
      if (explicitStart && !isNaN(Number(explicitStart))) {
        currentIndex = Number(explicitStart) - 1;
      }

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

        currentIndex += numberOfSubQuestions;
      });
      
      return clonedPassage;
    });
    
    rawPost.quizFields.passages = filteredPassages;

    return rawPost;
  }, [quiz, testResult.testResultFields.testPart]);
  // ▲▲▲ KẾT THÚC newPost ▲▲▲

  const [currentPassageIndex, setCurrentPassageIndex] = useState(0);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);

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
    if (!fullPage) return;
    const html = document.documentElement;
    // Reset ONLY the text-size-* classes — never wipe the whole className.
    // `frontend-site` (added by App in appx/index.tsx) is what scopes every
    // global/Tailwind rule (see postcss-custom-prefix.js); clearing it strips
    // all styling from this page (serif fonts, oversized logo, native inputs).
    const clearTextSize = () =>
      Array.from(html.classList)
        .filter((cls) => cls.startsWith("text-size-"))
        .forEach((cls) => html.classList.remove(cls));
    clearTextSize();
    html.classList.add("frontend-site");
    html.classList.add(`text-size-${selectedTextSize}`);
    return () => {
      clearTextSize();
    };
  }, [selectedTextSize, fullPage]);

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
            __html: (currentPassage.passage_content || '').replace(/&nbsp;|\u00A0/g, ' '),
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
                reactChildren = normalizeParseResult(reactChildren);
                if (reactChildren && typeof reactChildren === 'object' && !React.isValidElement(reactChildren) && !Array.isArray(reactChildren)) {
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
              const normalized = normalizeParseResult(reactChildren);
              if (normalized && typeof normalized === 'object' && !React.isValidElement(normalized) && !Array.isArray(normalized)) {
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

      const parsedResult = parse((currentPassage.passage_content || '').replace(/&nbsp;|\u00A0/g, ' '), parserOptions);
      const normalized = normalizeParseResult(parsedResult);
      
      // Đảm bảo kết quả cuối cùng luôn là React element hoặc array hợp lệ
      // Nếu vẫn là object, wrap trong div
      if (normalized && typeof normalized === 'object' && !React.isValidElement(normalized) && !Array.isArray(normalized)) {
        return <div>{normalized}</div>;
      }
      
      // Nếu là array, đảm bảo tất cả phần tử đều hợp lệ
      if (Array.isArray(normalized)) {
        const invalidItems = normalized.filter(item => 
          item && typeof item === 'object' && !React.isValidElement(item) && !Array.isArray(item)
        );
        if (invalidItems.length > 0) {
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
            __html: (currentPassage.passage_content || '').replace(/&nbsp;|\u00A0/g, ' '),
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

  const parseMaxOptionsFromText = (text: string | undefined | null): number => {
    if (!text) return 1;
    const lowerText = text.toLowerCase();
    if (lowerText.includes("two") || lowerText.includes("2")) return 2;
    if (lowerText.includes("three") || lowerText.includes("3")) return 3;
    if (lowerText.includes("four") || lowerText.includes("4")) return 4;
    if (lowerText.includes("five") || lowerText.includes("5")) return 5;
    return 1;
  };

  const handleScrollToQuestion = (index: number) => {
    setActiveQuestionIndex(index);
    let element = document.getElementById(`#question-no-${index + 1}`);
    let targetQuestion: any = null;
    let elementToScrollTo: HTMLElement | null = null;

    for (const p of (newPost?.quizFields?.passages ?? [])) {
      if (!p.questions) continue;
      for (const q of p.questions) {
        if (q.startIndex !== undefined) {
          const questionType = q.type?.[0];
          let questionCount;

          const isHeading = questionType === 'matching' &&
            String(q.matchingQuestion?.layoutType).trim().toLowerCase() === 'heading';

          if (isHeading && p.passage_content) {
            let gapCount = 0;
            (p.passage_content || "").replace(/\{(.*?)\}/g, () => { gapCount++; return ''; });
            questionCount = gapCount > 0 ? gapCount : 1;
          } else {
            const isCheckbox = questionType === 'checkbox';

            if (isCheckbox) {
              const textToParse = `${q.instructions || ""} ${q.question || ""} ${q.title || ""}`;
              questionCount = parseMaxOptionsFromText(textToParse);
            } else {
              questionCount = countQuestion({ questions: [q] });
            }
          }

          if (isNaN(questionCount) || questionCount < 1) {
            questionCount = 1;
          }

          if (index >= q.startIndex && index < q.startIndex + questionCount) {
            targetQuestion = q;
            break;
          }
        }
      }
      if (targetQuestion) break;
    }

    if (!element && targetQuestion) {
      const qElementId = `#question-no-${(targetQuestion.startIndex ?? 0) + 1}`;
      element = document.getElementById(qElementId);
    }

    document.querySelectorAll('.active-quizz').forEach(el => {
      el.classList.remove('active-quizz');
    });

    const targetTypes = ["fillup", "radio", "select", "checkbox"];
    const currentType = targetQuestion?.type?.[0];

    if (currentType && targetTypes.includes(currentType) && targetQuestion && targetQuestion.startIndex !== undefined) {
      const relativeIndex = index - targetQuestion.startIndex;

      if (currentType === 'fillup') {
        const inputElement = document.getElementById(`#question-no-${index + 1}`);
        if (inputElement) {
          inputElement.classList.add('active-quizz');
          elementToScrollTo = inputElement;
        }
      } else if (currentType === 'radio' || currentType === 'checkbox') {
        if (element) {
          const allWrappers = element.querySelectorAll('.ant-checkbox-wrapper, .ant-radio-wrapper');
          if (allWrappers && allWrappers.length > relativeIndex) {
            const subQuestionElement = allWrappers[relativeIndex];
            if (subQuestionElement) {
              subQuestionElement.classList.add('active-quizz');
              elementToScrollTo = subQuestionElement as HTMLElement;
            }
          }
        }
      } else if (currentType === 'select') {
        if (element) {
          const allSubQuestions = element.querySelectorAll('[id^="#question-no-"]');
          if (allSubQuestions.length > relativeIndex) {
            const selectWrapper = allSubQuestions[relativeIndex];
            const titleElement = selectWrapper.previousElementSibling;
            if (titleElement && (titleElement.tagName === 'P' || titleElement.tagName === 'DIV')) {
              titleElement.classList.add('active-quizz');
              elementToScrollTo = titleElement as HTMLElement;
            } else {
              elementToScrollTo = selectWrapper as HTMLElement;
            }
          }
        }
      }
    }

    if (elementToScrollTo) {
      elementToScrollTo.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    } else {
      element?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  };

  // Per-passage audio segmentation in Review Mode: when the user switches
  // passages, the player seeks to that passage's audio_start and pauses at
  // audio_end (configured by admin in PassageEditor). Falsy/missing values
  // fall back to playing the full file.
  const passageAudioStart = useMemo(() => {
    const raw = (currentPassage as any)?.audio_start;
    if (raw === null || raw === undefined || raw === "") return undefined;
    const n = Number(raw);
    return Number.isFinite(n) ? n : undefined;
  }, [currentPassage]);

  const passageAudioEnd = useMemo(() => {
    // 1) Honor an explicit audio_end if admin set one.
    const raw = (currentPassage as any)?.audio_end;
    if (raw !== null && raw !== undefined && raw !== "") {
      const n = Number(raw);
      if (Number.isFinite(n)) return n;
    }
    // 2) Fall back to the next passage's audio_start. Listening admins
    // typically only configure audio_start for each part — without this
    // derivation a Part 1 review would keep playing past 6:29 into Part 2
    // and the student hears the wrong section.
    const passages = newPost?.quizFields?.passages ?? [];
    for (let i = currentPassageIndex + 1; i < passages.length; i++) {
      const nextStart = (passages[i] as any)?.audio_start;
      if (nextStart !== null && nextStart !== undefined && nextStart !== "") {
        const n = Number(nextStart);
        if (Number.isFinite(n)) return n;
      }
    }
    // 3) No cap available — play to the end of the file.
    return undefined;
  }, [currentPassage, currentPassageIndex, newPost]);

  const PlyrComponent = useMemo(() => {
    if (!quiz.quizFields.audio) return null;
    return (
      <AudioPlayer
        audioUrl={quiz.quizFields.audio!.node.mediaItemUrl}
        isReady={false}
        audioStart={passageAudioStart}
        audioEnd={passageAudioEnd}
      />
    );
  }, [quiz.quizFields.audio, passageAudioStart, passageAudioEnd]);

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
    const validExplanations = normalizeParseResult(parsedExplanations);


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
        <h3 className="text-xl font-bold text-primary md:px-4">
          Explanations
        </h3>
        <div className="space-y-2 px-4">
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
          <div className={twMerge("p-6 pb-[120px] space-y-6 bg-white")}>
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
                  // (debug logging removed)
                  void question;
                  void index;
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
          const computedStyle = window.getComputedStyle(parent);
          if (computedStyle.overflow === 'hidden' || computedStyle.overflowY === 'hidden' || computedStyle.overflowX === 'hidden') {
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
          const computedStyle = window.getComputedStyle(panel);
          if (computedStyle.overflow === 'hidden' || computedStyle.overflowY === 'hidden') {
            panel.style.overflow = 'visible';
            panel.style.overflowY = 'visible';
          }
          // Fix tất cả children của panel
          const panelChildren = panel.querySelectorAll('*');
          panelChildren.forEach((child: any) => {
            if (child && child !== panel.querySelector('.plyr') && !child.closest('.plyr')) {
              const childStyle = window.getComputedStyle(child);
              if (childStyle.overflow === 'hidden' && child !== panel.querySelector('.plyr__menu')) {
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
        const computedStyle = window.getComputedStyle(splitter);
        if (computedStyle.overflow === 'hidden') {
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

  const passages = newPost?.quizFields?.passages ?? [];
  const passageLabel = isReading ? "Passage" : "Part";

  // Build per-slot status: 'correct' | 'incorrect' | 'unanswered'.
  // Review-mode footer cần phân biệt câu đúng (xanh) / sai (đỏ) / chưa làm (xám)
  // — không phải chỉ "đã trả lời". Dùng client-side calculateScore để chấm từng
  // sub-question rồi flatten về slot index.
  const slotStatus = useMemo(() => {
    const passages = newPost?.quizFields?.passages ?? [];
    let totalSlots = 0;
    passages.forEach((p: any) => {
      (p.questions ?? []).forEach((q: any) => {
        totalSlots += countQuestion({
          questions: [q],
          passage_content: p.passage_content,
        } as any);
      });
    });
    const status: Array<"correct" | "incorrect" | "unanswered"> = new Array(
      totalSlots,
    ).fill("unanswered");

    if (totalSlots === 0) return status;

    // Parse testPart cho calculateScore (dùng original passages).
    let testParts: number[] = [];
    try {
      testParts = JSON.parse(testResult.testResultFields.testPart || "[]");
      if (!Array.isArray(testParts) || testParts.length === 0) {
        testParts = Array.from(
          { length: quiz.quizFields.passages.length },
          (_, index) => index,
        );
      }
    } catch {
      testParts = Array.from(
        { length: quiz.quizFields.passages.length },
        (_, index) => index,
      );
    }

    let scoreDetails: Record<string, { details: Array<{ correct: boolean; userAnswer: string | null }> }>;
    try {
      const result = computeScoreDetails(
        parsedAnswers as any,
        quiz as any,
        testParts,
      );
      scoreDetails = result?.details ?? {};
    } catch (err) {
      console.warn("[slotStatus] computeScoreDetails failed", err);
      return status;
    }

    // newPost passages đã filter & gán originalPartIndex → map sang scoreDetails.
    let cursor = 0;
    passages.forEach((p: any) => {
      const originalIdx = (p as any).originalPartIndex ?? (p as any).partIndex ?? 0;
      const passageDetails = scoreDetails[String(originalIdx)]?.details ?? [];
      const passageSlotCount = (p.questions ?? []).reduce(
        (acc: number, q: any) =>
          acc +
          countQuestion({
            questions: [q],
            passage_content: p.passage_content,
          } as any),
        0,
      );

      for (let i = 0; i < passageSlotCount; i++) {
        const detail = passageDetails[i];
        if (!detail) continue;
        if (detail.correct) {
          status[cursor + i] = "correct";
        } else if (
          detail.userAnswer !== null &&
          detail.userAnswer !== undefined &&
          String(detail.userAnswer).trim() !== ""
        ) {
          status[cursor + i] = "incorrect";
        }
      }

      cursor += passageSlotCount;
    });

    return status;
  }, [newPost, parsedAnswers, quiz, testResult.testResultFields.testPart]);

  // Compute per-passage question info for the footer (mirrors take-the-test footer logic)
  const passagesFooterInfo = useMemo(() => {
    return (newPost?.quizFields?.passages ?? []).map((passage: any, idx: number) => {
      const questionIndices: number[] = [];
      const displayNumbers: number[] = [];

      // Compute startIndex for each question in this passage.
      // QUAN TRỌNG: phải truyền passage_content để countQuestion có thể đếm gaps
      // cho matching/heading, nếu không nó sẽ fallback về 1 và toàn bộ câu sau lệch.
      let runningIdx = 0;
      // Display numbering follows take-the-test footer: it's a separate
      // counter that resets to (start_question_number - 1) only when a
      // passage explicitly sets it, and otherwise continues across passages.
      let displayIdx = 0;
      (newPost?.quizFields?.passages ?? []).forEach((p: any, pIdx: number) => {
        const explicitStart = (p as any).start_question_number;
        if (explicitStart && !isNaN(Number(explicitStart))) {
          displayIdx = Number(explicitStart) - 1;
        }
        (p.questions ?? []).forEach((q: any) => {
          const count = countQuestion({
            questions: [q],
            passage_content: p.passage_content,
          } as any);
          if (pIdx === idx) {
            for (let i = 0; i < count; i++) {
              questionIndices.push(runningIdx + i);
              displayNumbers.push(displayIdx + i + 1);
            }
          }
          runningIdx += count;
          displayIdx += count;
        });
      });

      // "answered" trong review mode = số câu đã làm (đúng + sai) — dùng để hiển thị "X of Y".
      const answeredCount = questionIndices.filter(
        (qi) => slotStatus[qi] !== "unanswered",
      ).length;

      return {
        questions: questionIndices,
        displayNumbers,
        total: questionIndices.length,
        answered: answeredCount,
      };
    });
  }, [newPost, slotStatus]);

  const passageInfo = useMemo(() => {
    if (
      !currentPassage ||
      !currentPassage.questions ||
      currentPassage.questions.length === 0
    ) {
      return { partLabel: "", partNumber: 0, questionRange: "", customTitle: "" };
    }
    const partLabel =
      quiz.quizFields.skill[0] === "reading" ? "Passage" : "Part";
    const originalPartIndex = (currentPassage as any).originalPartIndex;
    const partNumber = (originalPartIndex !== undefined ? originalPartIndex : (currentPassage as any).partIndex) + 1;
    // Honor the admin-configured start_question_number for practice extracts
    // (e.g. a single Passage 3 quiz starts at question 27, not 1).
    const explicitStart = (currentPassage as any).start_question_number;
    const startQuestion = explicitStart && !isNaN(Number(explicitStart))
      ? Number(explicitStart)
      : (currentPassage.questions[0]?.startIndex ?? 0) + 1;
    let questionCountInPassage = 0;
    currentPassage.questions.forEach((q:any) => questionCountInPassage += countSubQuestions(q, (currentPassage as any).passage_content));
    const endQuestion = startQuestion + questionCountInPassage - 1;
    const questionRange =
      questionCountInPassage <= 1
        ? `${startQuestion}`
        : `${startQuestion}-${endQuestion}`;
    // Practice quizzes are single-passage extracts (e.g. just Passage 3 of an
    // IELTS test), so the quiz's passages array has length 1 and partIndex is
    // always 0 — that would render "Passage 1" no matter which passage the
    // admin picked. Fall back to the per-passage title (admin types e.g.
    // "Passage 3" when creating it), matching the take-the-test display.
    const isPractice = quiz.quizFields.type?.[0] === "practice";
    const customTitle = isPractice ? ((currentPassage as any).title ?? "") : "";
    return { partLabel, partNumber, questionRange, customTitle };
  }, [currentPassage, quiz.quizFields.skill, quiz.quizFields.type]);

  // Minimal ExamContext value for review mode (enables TextSelectionProvider + Notepad)
  const reviewExamContextValue = useMemo(() => ({
    post: quiz as any,
    testID: testResult.id,
    part: {
      current: currentPassageIndex,
      total: (newPost?.quizFields?.passages ?? []).length,
      setCurrent: setCurrentPassageIndex,
    },
    isFormDisabled: true,
    setFormDisabled: () => {},
    isReady: true,
    setIsReady: () => {},
    testResult: testResult.testResultFields,
    timer: undefined,
    setTimer: () => {},
    handleSubmitAnswer: () => {},
    isNotesViewOpen,
    setIsNotesViewOpen,
    selectedTextSize,
    setSelectedTextSize,
    activeQuestionIndex,
    setActiveQuestionIndex,
    items: { available: [] as any[] },
    setItems: () => {},
    activeId: null,
    overId: null,
    answerOptions: [],
    startIndex: 0,
    getQuestionStartIndex: () => 0,
    savedPassageData,
    setSavedPassageData,
  }), [currentPassageIndex, isNotesViewOpen, savedPassageData, selectedTextSize, quiz, testResult, newPost, setCurrentPassageIndex]);

  const splitter = (
    <Splitter
      className={fullPage ? "flex-1 min-h-0" : "h-[600px] border-t"}
    >
        {/* PANEL 1 (BÊN TRÁI) */}
        <Splitter.Panel
          min="40%"
          max="60%"
          className="relative overflow-y-auto"
        >
          {/* 1a. NẾU LÀ READING: Hiển thị Passage */}
          {isReading && (
            <TextSelectionWrapper>
              <div className="prose-sm max-w-none p-[16px] pt-[30px] pb-[120px] bg-white h-full overflow-y-auto text-[#000] break-words [overflow-wrap:anywhere] [&_*]:[overflow-wrap:anywhere]">
                <SafeRender name="processedPassageComponent">
                  {processedPassageComponent}
                </SafeRender>
              </div>
            </TextSelectionWrapper>
          )}

          {/* 1b. NẾU LÀ LISTENING: Hiển thị Câu hỏi (ẩn explanation bằng CSS) */}
          {isListening && (
            <div className="overflow-y-auto h-full relative">
              <style>{`
                #left-question-panel .ant-collapse,
                #left-question-panel [data-question-explanation="true"] {
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
            <div className={`overflow-y-auto ${fullPage ? "h-full" : "h-[calc(600px-50px)]"}`}>
              <TextSelectionWrapper>
                {QuestionsPanelContent}
              </TextSelectionWrapper>
            </div>
          )}

          {/* 2b. NẾU LÀ LISTENING: Hiển thị Audio & Explanations */}
          {isListening && (
            <div className={`${fullPage ? "h-full" : "h-[calc(600px-50px)]"} relative flex flex-col`} style={{ overflow: 'visible' }}>
              {/* Audio player - không scroll, overflow visible để menu settings không bị che */}
              <div ref={ref} className="p-4 md:p-12 flex-shrink-0" style={{ overflow: 'visible', position: 'relative', zIndex: 100 }}>
                <div style={{ overflow: 'visible', position: 'relative', zIndex: 100 }}>
                  {PlyrComponent}
                </div>
              </div>
              {/* Explanations - scrollable */}
              <div className="flex-1 overflow-y-auto min-h-0" style={{ overflowX: 'visible' }}>
                <TextSelectionWrapper>
                  <div className="ex-right">{ExplanationsPanelContent}</div>
                </TextSelectionWrapper>
              </div>
            </div>
          )}

          {/* Footer (only when NOT fullPage — fullPage footer is rendered outside Splitter) */}
          {!fullPage && (
            <div className="absolute bottom-0 left-0 right-0 bg-gray-100 flex justify-between items-center px-4 py-2 border-t">
              <p className="font-semibold text-[#374151] line-clamp-1">
                {currentPassage.title}
              </p>
              <div className="flex items-center gap-2">
                <Button type="primary" disabled={!hasPrevPassage} onClick={handlePrevPassage}>
                  <span className="material-symbols-rounded">chevron_left</span>
                  <span>Previous</span>
                </Button>
                <Button type="primary" disabled={!hasNextPassage} onClick={handleNextPassage}>
                  <span>Next</span>
                  <span className="material-symbols-rounded">chevron_right</span>
                </Button>
              </div>
            </div>
          )}
        </Splitter.Panel>
      </Splitter>
  );

  if (fullPage) {
    return (
      <ExamContext.Provider value={reviewExamContextValue as any}>
        <TextSelectionProvider key={currentPassageIndex}>
          <div className="flex flex-col h-full overflow-hidden" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
            <ReviewHeader quiz={quiz} testResult={testResult} />

            <div id="iel-test-result-explanation" className="flex flex-grow min-h-0 overflow-hidden">
              {/* Main content: splitter + footer */}
              <div className="flex flex-col flex-1 min-w-0 min-h-0 overflow-hidden" style={{ transition: "none" }}>
                
                <div className="border border-[#d5d5d5] rounded-[4px] flex-shrink-0 m-[16px] bg-[#f1f2ec]">
                  <div className="p-[16px]">
                    <div className="font-bold text-gray-800 text-base md:text-lg leading-tight">
                      {passageInfo.customTitle || `${passageInfo.partLabel} ${passageInfo.partNumber}`}
                    </div>
                    <div className="text-[#000] text-base">
                      Read the text and answer questions {passageInfo.questionRange}
                    </div>
                  </div>
                </div>

                {splitter}

                {/* Full-width footer — identical to take-the-test footer (no submit button) */}
                <footer className="shrink-0 bg-white flex items-center w-full p-[12px] pr-[0] pt-[0]">
                  <div className="flex justify-between items-center h-full flex-grow mr-[110px]">
                    {passages.map((passage: any, idx: number) => {
                      const isCurrent = idx === currentPassageIndex;
                      const info = passagesFooterInfo[idx] ?? { questions: [], total: 0, answered: 0 };
                      const isPracticeFooter = quiz.quizFields.type?.[0] === "practice";
                      const passageDisplayLabel =
                        (isPracticeFooter && passage.title) ||
                        `${passageLabel} ${((passage.originalPartIndex ?? idx) as number) + 1}`;
                      return (
                        <div
                          key={idx}
                          onClick={() => setCurrentPassageIndex(idx)}
                          className="h-full flex items-center cursor-pointer w-full"
                        >
                          {isCurrent ? (
                            <div className="justify-center w-full">
                              <div className="flex items-center gap-[5px] h-full">
                                <div className="flex items-center border-t-[3px] border-gray-200 pt-2">
                                  <span className="font-semibold text-[16px] text-[#000] whitespace-nowrap pl-[20px] pr-[30px]">
                                    {passageDisplayLabel}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 overflow-x-auto py-1">
                                  {info.questions.map((qi: number, localIdx: number) => {
                                    const status = slotStatus[qi];
                                    const barClass =
                                      status === "correct"
                                        ? "bg-green-700"
                                        : status === "incorrect"
                                          ? "bg-red-500"
                                          : "bg-gray-200";
                                    const displayNum = info.displayNumbers?.[localIdx] ?? qi + 1;
                                    // Absolute index lines up with q.startIndex now that newPost
                                    // honors start_question_number — pass it to scroll/active so
                                    // a click on "27" actually targets the question with
                                    // startIndex=26 and lights it up.
                                    const absoluteIdx = displayNum - 1;
                                    return (
                                      <div key={qi} className="flex flex-col items-center gap-2 flex-shrink-0">
                                        <div className={twMerge("w-full h-[3px] rounded-sm", barClass)} />
                                        <span
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleScrollToQuestion(absoluteIdx);
                                          }}
                                          className={twMerge(
                                            "text-[#000] p-1 pb-[2px] flex items-center leading-[16px]! justify-center text-[16px] border-2 border-transparent rounded cursor-pointer",
                                            activeQuestionIndex === absoluteIdx && "font-semibold border-2 border-[#418FC6]"
                                          )}
                                        >
                                          {displayNum}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                                  </div>
                                </div>
                          ) : (
                            <div className="flex items-center gap-3 h-full w-full justify-center pt-[10px]">
                              <span className="pl-[20px] text-[16px] text-gray-700 whitespace-nowrap">
                                {passageDisplayLabel}
                              </span>
                              <span className="text-[16px] text-gray-500 whitespace-nowrap">
                                {info.answered} of {info.total}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Prev / Next arrow buttons — identical to take-the-test */}
                  <div className="relative h-full flex items-center flex-shrink-0">
                    <div className="absolute bottom-[70px] right-[35px] mb-1 flex gap-1">
                      <button
                        type="button"
                        onClick={handlePrevPassage}
                        disabled={!hasPrevPassage}
                        className="flex items-center justify-center w-[55px] h-[55px] bg-gray-800 disabled:cursor-not-allowed transition-colors rounded-[0] disabled:bg-[#dddddd]!"
                      >
                        <Image width={23} height={26} sizes="100%" alt="prev" src="/bold-al.png" priority />
                      </button>
                      <button
                        type="button"
                        onClick={handleNextPassage}
                        disabled={!hasNextPassage}
                        className="bg-[#000]! flex items-center justify-center w-[55px] h-[55px] disabled:cursor-not-allowed transition-colors rounded-[0] disabled:bg-[#dddddd]!"
                      >
                        <Image width={23} height={26} sizes="100%" alt="next" src="/bold-ar.png" priority />
                      </button>
                    </div>
                  </div>
                </footer>
              </div>

              {/* Notepad sidebar — full overlay on mobile, side panel on md+. */}
              {isNotesViewOpen && (
                <div
                  className="fixed inset-0 z-50 md:static md:w-3/12 md:max-w-[410px] md:shrink-0 md:z-auto"
                  style={{ transition: "none" }}
                >
                  <Notepad />
                </div>
              )}
            </div>
          </div>
        </TextSelectionProvider>
      </ExamContext.Provider>
    );
  }

  return (
    <>
      {/* See take-the-test: in-browser auto-translation mutates React-managed
          DOM and triggers "insertBefore on Node" / removeChild crashes. The
          review screen renders the same passages/questions, so disable it here
          too. */}
      <Head>
        <meta name="google" content="notranslate" />
      </Head>
      <div
        id="iel-test-result-explanation"
        translate="no"
        className="notranslate"
        style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
      >
        {splitter}
      </div>
    </>
  );
}

export default ReviewExplanation;
