// file: .../pages/take-the-test/ui/index.tsx (FULL CODE ĐÃ SỬA)

import { BlankLayout } from "@/widgets/layouts";
import Header from "./header";
import { Splitter, notification } from "antd";
import {
  AnswerFormValues,
  ExamContext,
  ExamProvider,
  useExamContext,
} from "../context";

import {
  QuestionRender,
  DraggableOption,
  SummaryDroppableSlot,
} from "@/shared/ui/exam";

import { IPracticeSingle } from "@/pages/ielts-practice-single/api";
import { useEffect, useMemo, useState, useRef } from "react";
import _ from "lodash";
import Footer from "./footer";
import { FormProvider, useForm, useFormContext } from "react-hook-form";
import { twMerge } from "tailwind-merge";
import { ITestResult } from "../api";
import dayjs from "dayjs";
import { TextSelectionProvider, TextSelectionWrapper } from "@/shared/ui";
import Notepad from "./notepad";
import parse from "html-react-parser";
import { countQuestion } from "@/shared/lib";

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  UniqueIdentifier,
  rectIntersection,
  DragOverEvent,
} from "@dnd-kit/core";
import { SortableContext } from "@dnd-kit/sortable";
import { useCallback } from "react";

// ==================================================================
// COMPONENT RENDER PASSAGE CHO 'HEADING'
// ==================================================================
function PassageRenderer({ passageContent }: { passageContent: string }) {
  // @ts-ignore
  const {
    items,
    overId,
    activeQuestionIndex,
    setActiveQuestionIndex,
    answerOptions,
    startIndex,
  } = useExamContext();

  const { processedText, totalGaps } = useMemo(() => {
    let gapCount = 0;
    const textToRender = (passageContent || "").replace(
      /\{(.*?)\}/g,
      (match, answer) => {
        const currentGapIndex = gapCount;
        gapCount++;
        return `<span data-gap-index="${currentGapIndex}"></span>`;
      }
    );
    return { processedText: textToRender, totalGaps: gapCount };
  }, [passageContent]);

  if (!items || !answerOptions || totalGaps === 0) {
    return (
      <TextSelectionWrapper>{parse(passageContent || "")}</TextSelectionWrapper>
    );
  }

  const parserOptions = {
    replace: (domNode: any) => {
      if (
        domNode.name === "span" &&
        domNode.attribs &&
        domNode.attribs["data-gap-index"] !== undefined
      ) {
        const gapIndex = parseInt(domNode.attribs["data-gap-index"], 10);
        if (isNaN(gapIndex)) return;

        const containerId = `gap-${gapIndex}`;
        const questionNumber = (startIndex ?? 0) + gapIndex + 1;
        const questionAbsoluteIndex = (startIndex ?? 0) + gapIndex;

        return (
          <SortableContext items={items[containerId] || []} id={containerId}>
            <SummaryDroppableSlot
              id={containerId}
              isOver={overId === containerId}
              questionNumber={questionNumber}
              onClick={() => setActiveQuestionIndex(questionAbsoluteIndex)}
              isSelected={activeQuestionIndex === questionAbsoluteIndex}
            >
              {(items[containerId] || []).map((optionId: UniqueIdentifier) => {
                const optionIndex = parseInt(String(optionId).split("-")[2]);
                if (isNaN(optionIndex)) return null;
                // @ts-ignore
                const option = answerOptions[optionIndex];
                if (!option) return null;
                return (
                  <DraggableOption
                    key={optionId}
                    id={optionId}
                    content={option.optionText}
                    isDropped
                    className="px-1"
                  />
                );
              })}
            </SummaryDroppableSlot>
          </SortableContext>
        );
      }
    },
  };

  return (
    <TextSelectionWrapper>
      {parse(processedText, parserOptions)}
    </TextSelectionWrapper>
  );
}

const findContainer = (
  items: Record<string, UniqueIdentifier[]>,
  id: UniqueIdentifier
) => {
  if (!id) return undefined;
  if (id in items) return id as string;
  return Object.keys(items).find((key) => items[key].includes(id));
};

// ==================================================================
// COMPONENT WRAPPER
// ==================================================================
export function PageTakeTheTestWrapper({
  post,
  testID,
  testResult: { testResultFields },
}: {
  post: IPracticeSingle;
  testID: string;
  testResult: ITestResult;
}) {
  const methods = useForm<AnswerFormValues>({
    defaultValues: {
      answers: (
        JSON.parse(testResultFields.answers || '{"answers":[]}') as {
          answers: (string | number[] | object | null)[];
        }
      ).answers.map((a) => (a !== null && a !== undefined && a !== "") ? a : null),
    },
  });

  const newPost = useMemo(() => {
    const rawPost = JSON.parse(JSON.stringify(post));

    _.set(rawPost, "quizFields.time", testResultFields.testTime);
    let parts: number[] = [];

    try {
      parts = JSON.parse(testResultFields.testPart || "[]");
    } catch (error) {
      console.error("Failed to parse testPart:", testResultFields.testPart, error);
    }

    // Validate parts array
    if (!Array.isArray(parts) || parts.length === 0) {
      console.warn("Invalid testPart, using all passages:", testResultFields.testPart);
      // Fallback to all passages if testPart is invalid
      parts = Array.from(
        { length: rawPost.quizFields.passages.length },
        (_, index) => index
      );
    }


    // Filter passages based on selected parts and preserve original index
    const filteredPassagesWithOriginalIndex: Array<{ passage: any; originalIndex: number }> = [];
    rawPost.quizFields.passages.forEach((passage: any, originalIndex: number) => {
      if (parts.includes(originalIndex)) {
        filteredPassagesWithOriginalIndex.push({ passage, originalIndex });
      }
    });


    // Ensure at least one passage exists
    if (filteredPassagesWithOriginalIndex.length === 0) {
      console.error("No passages found after filtering. Parts:", parts, "Total passages:", rawPost.quizFields.passages.length);
      // Fallback to first passage if no passages match
      if (rawPost.quizFields.passages.length > 0) {
        filteredPassagesWithOriginalIndex.push({
          passage: rawPost.quizFields.passages[0],
          originalIndex: 0
        });
      }
    }

    // Reset partIndex and recalculate startIndex after filtering
    // Also preserve originalPartIndex for display purposes
    let currentIndex = 0;
    const filteredPassages = filteredPassagesWithOriginalIndex.map(({ passage, originalIndex }, newIndex) => {
      _.set(passage, "partIndex", newIndex);
      _.set(passage, "originalPartIndex", originalIndex); // Preserve original index for display

      // If passage has a custom start_question_number, reset currentIndex
      const explicitStart = (passage as any).start_question_number;
      if (explicitStart && !isNaN(Number(explicitStart))) {
        currentIndex = Number(explicitStart) - 1;
      }

      passage.questions.forEach((question: any, questionIndex: number) => {
        _.set(
          passage,
          `questions.${questionIndex}.startIndex`,
          currentIndex
        );

        const numberOfSubQuestions = countQuestion({ 
          questions: [question],
          passage_content: passage.passage_content
        } as any);
        currentIndex += numberOfSubQuestions;
      });

      return passage;
    });

    const newPostData = {
      ...rawPost,
      quizFields: {
        ...rawPost.quizFields,
        passages: filteredPassages,
      },
    };
    return newPostData;
  }, [post, testResultFields.testPart, testResultFields.testTime]);

  return (
    <ExamProvider post={newPost} testID={testID} testResult={testResultFields}>
      <FormProvider {...methods}>
        <PageTakeTheTest />
      </FormProvider>
    </ExamProvider>
  );
}

PageTakeTheTestWrapper.Layout = BlankLayout;

// ==================================================================
// COMPONENT PAGE CHÍNH (ĐÃ SỬA KEY)
// ==================================================================
export function PageTakeTheTest() {
  const examContext = useExamContext();
  const {
    part,
    post,
    isFormDisabled,
    testID,
    isReady,
    setFormDisabled,
    handleSubmitAnswer,
    isNotesViewOpen,
    setIsNotesViewOpen,
    timer,
    selectedTextSize,
    getQuestionStartIndex,
    ...restOfContext
  } = examContext;

  const {
    handleSubmit,
    getValues,
    setValue,
    formState: { isSubmitting, isSubmitted },
  } = useFormContext<AnswerFormValues>();

  const [isMobileView, setIsMobileView] = useState(false);
  const questionPanelRef = useRef<HTMLDivElement>(null);
  // Once we've warned the user about a dead session we stop spamming the
  // toast — they've already been told.
  const sessionWarnedRef = useRef(false);

  // Auto-save draft via API route
  const saveDraftFn = useCallback(async (params: {
    answers: string;
    testId: string;
    timeLeft: string;
  }) => {
    const response = await fetch("/api/test-flow/save-draft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        testId: params.testId,
        answers: params.answers,
        timeLeft: params.timeLeft,
      }),
    });
    if (!response.ok) {
      // 401 = the server-side Supabase session is gone. Surface this
      // immediately — silently retrying every 60s lets students keep
      // typing into a void. The AuthProvider listener will redirect on
      // SIGNED_OUT, but we warn here in case the browser client still
      // thinks it's authenticated.
      if (response.status === 401 && !sessionWarnedRef.current) {
        sessionWarnedRef.current = true;
        notification.warning({
          message: "Phiên đăng nhập đã hết hạn",
          description:
            "Bài làm chưa được lưu. Vui lòng đăng nhập lại trong tab mới để tiếp tục lưu nháp.",
          placement: "topRight",
          duration: 0,
        });
      }
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || "Save draft failed");
    }
  }, []);

  const currentPassage = useMemo(
    () =>
      post.quizFields.passages.find(
        (p) => (p as any).partIndex === part.current
      ),
    [part, post.quizFields.passages]
  );

  const passageInfo = useMemo(() => {
    if (
      !currentPassage ||
      !currentPassage.questions ||
      currentPassage.questions.length === 0
    ) {
      return { partLabel: "", partNumber: 0, questionRange: "", customTitle: "" };
    }

    const isPractice = post.quizFields.type?.[0] === "practice";

    const partLabel =
      post.quizFields.skill[0] === "reading" ? "Passage" : "Part";
    // Use originalPartIndex if available (for filtered passages), otherwise use partIndex
    const originalPartIndex = (currentPassage as any).originalPartIndex;
    const partNumber = (originalPartIndex !== undefined ? originalPartIndex : (currentPassage as any).partIndex) + 1;
    
    // Fallback to auto-calculated startIndex if start_question_number is not provided
    const explicitStart = (currentPassage as any).start_question_number;
    const startQuestion = explicitStart ? explicitStart : (currentPassage.questions[0]?.startIndex ?? 0) + 1;
    
    const questionCountInPassage = countQuestion(currentPassage);
    const endQuestion = startQuestion + questionCountInPassage - 1;
    const questionRange =
      questionCountInPassage <= 1
        ? `${startQuestion}`
        : `${startQuestion}-${endQuestion}`;

    return { 
      partLabel, 
      partNumber, 
      questionRange, 
      customTitle: isPractice ? currentPassage.title : "" 
    };
  }, [currentPassage, post.quizFields.skill, post.quizFields.type]);

  useEffect(() => {
    document.documentElement.style.overflowY = "hidden";
    document.body.style.overflowY = "hidden";
    return () => {
      document.documentElement.style.overflowY = "";
      document.body.style.overflowY = "";
    };
  }, []);

  const headingQuestion = useMemo(
    () =>
      currentPassage?.questions.find(
        (q: any) =>
          String(q.matchingQuestion?.layoutType).trim().toLowerCase() ===
          "heading"
      ),
    [currentPassage]
  );

  const { answerOptions, startIndex, totalGaps, correctAnswers } =
    useMemo(() => {
      if (!headingQuestion || !currentPassage) {
        return {
          answerOptions: [],
          startIndex: 0,
          totalGaps: 0,
          correctAnswers: [],
        };
      }

      const options = headingQuestion.matchingQuestion?.answerOptions || [];
      const sIndex = getQuestionStartIndex(headingQuestion);

      let gapCount = 0;
      const answers: string[] = [];
      (currentPassage.passage_content || "").replace(
        /\{(.*?)\}/g,
        (match, answer) => {
          answers.push(answer.trim());
          gapCount++;
          return "";
        }
      );

      return {
        answerOptions: options,
        startIndex: sIndex,
        totalGaps: gapCount,
        correctAnswers: answers,
      };
    }, [headingQuestion, currentPassage]);

  const [items, setItems] = useState<Record<string, UniqueIdentifier[]>>({
    available: [],
  });
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [overId, setOverId] = useState<UniqueIdentifier | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  useEffect(() => {
    if (!headingQuestion) {
      setItems({ available: [] });
      return;
    }

    const formAnswers = (getValues(`answers.${startIndex}`) || {}) as {
      [key: number]: string;
    };
    const newItems: Record<string, UniqueIdentifier[]> = { available: [] };
    for (let i = 0; i < totalGaps; i++) {
      newItems[`gap-${i}`] = [];
    }

    const droppedOptionIds = new Set<string>();

    if (formAnswers && typeof formAnswers === "object") {
      for (const gapKey in formAnswers) {
        const optionId = formAnswers[gapKey];
        if (optionId) {
          const gapIndex = parseInt(gapKey, 10);
          if (!isNaN(gapIndex) && newItems[`gap-${gapIndex}`]) {
            newItems[`gap-${gapIndex}`] = [optionId];
            droppedOptionIds.add(optionId);
          }
        }
      }
    }

    answerOptions.forEach((_, optionIndex) => {
      const optionId = `option-${startIndex}-${optionIndex}`;
      if (!droppedOptionIds.has(optionId)) {
        newItems["available"].push(optionId);
      }
    });

    setItems(newItems);
  }, [headingQuestion, totalGaps, answerOptions, startIndex, getValues]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id);
    setOverId(null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    setOverId(event.over?.id ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    setOverId(null);
    const { active, over } = event;

    const activeContainer = findContainer(items, active.id);
    let overContainerId: string | undefined;

    if (over) {
      overContainerId =
        over.id in items ? (over.id as string) : findContainer(items, over.id);
    } else {
      if (activeContainer && activeContainer !== "available") {
        overContainerId = "available";
      } else {
        return;
      }
    }

    if (
      !activeContainer ||
      !overContainerId ||
      activeContainer === overContainerId
    ) {
      return;
    }

    const newItems = { ...items };
    newItems[activeContainer] = newItems[activeContainer].filter(
      (id) => id !== active.id
    );

    if (
      String(overContainerId).startsWith("gap-") &&
      newItems[overContainerId]?.length > 0
    ) {
      const existingItemId = newItems[overContainerId][0];
      newItems[overContainerId] = [];
      if (!newItems["available"]) newItems["available"] = [];
      newItems["available"].push(existingItemId);
    }

    if (String(overContainerId).startsWith("gap-")) {
      newItems[overContainerId] = [active.id];
    } else {
      if (!newItems["available"]) newItems["available"] = [];
      if (!newItems["available"].includes(active.id)) {
        newItems["available"].push(active.id);
      }
    }
    setItems(newItems);

    const currentFormAnswers = (getValues(`answers.${startIndex}`) || {}) as {
      [key: number]: string;
    };
    let updatedFormAnswers = { ...currentFormAnswers };

    Object.keys(updatedFormAnswers).forEach((key) => {
      if (updatedFormAnswers[key as any] === active.id) {
        delete updatedFormAnswers[key as any];
      }
    });

    if (String(overContainerId).startsWith("gap-")) {
      const gapIndex = String(overContainerId).split("-")[1];
      if (gapIndex && !isNaN(parseInt(gapIndex, 10))) {
        updatedFormAnswers[gapIndex as unknown as number] = active.id as string;
        restOfContext.setActiveQuestionIndex(
          startIndex + parseInt(gapIndex, 10)
        );
      }
    }

    setValue(`answers.${startIndex}`, updatedFormAnswers, {
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  const newContextValue = {
    ...restOfContext,
    part,
    post,
    isFormDisabled,
    testID,
    isReady,
    setFormDisabled,
    handleSubmitAnswer,
    isNotesViewOpen,
    setIsNotesViewOpen,
    timer,
    selectedTextSize,
    items,
    setItems,
    overId,
    activeId,
    answerOptions,
    startIndex,
    getQuestionStartIndex,
  };

  if (!currentPassage) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading passage or passage not found...
      </div>
    );
  }

  useEffect(() => {
    document.documentElement.className = "";
    document.documentElement.classList.add(`text-size-${selectedTextSize}`);
  }, [selectedTextSize]);

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

  useEffect(() => {
    if (!isReady || isSubmitting || isSubmitted) return;
    const interval = setInterval(() => {
      if (isSubmitting || isSubmitted) return;

      saveDraftFn({
        answers: JSON.stringify(getValues()),
        testId: testID,
        timeLeft:
          timer?.format("mm:ss") ||
          dayjs(post.quizFields.time, "mm").format("mm:ss"),
      }).catch((err) => {
        console.warn("Auto-save silently failed", err);
      });
    }, 60000);
    return () => clearInterval(interval);
  }, [
    getValues,
    isReady,
    post.quizFields.time,
    saveDraftFn,
    testID,
    timer,
    isSubmitting,
    isSubmitted,
  ]);

  useEffect(() => {
    if (isSubmitted || isSubmitting) setFormDisabled(true);
  }, [isSubmitted, isSubmitting, setFormDisabled]);

  useEffect(() => {
    if (isMobileView && setIsNotesViewOpen && isNotesViewOpen) {
      setIsNotesViewOpen(false);
    }
  }, [isMobileView, isNotesViewOpen, setIsNotesViewOpen]);

  useEffect(() => {
    if (questionPanelRef.current) {
      questionPanelRef.current.scrollTop = 0;
    }
  }, [currentPassage]);

  return (
    <>
      {/* Render AudioPlayer outside TextSelectionProvider to prevent unmounting */}
      <form onSubmit={handleSubmit(handleSubmitAnswer)}>
        {/* flex ROW: left column + notepad sidebar side by side */}
        <div className="flex h-screen">
          {/* 🔥 TextSelectionProvider wraps left column + Notepad for full-height sidebar */}
          <TextSelectionProvider key={part.current}>
            {/* Left column: header + passage info + splitter */}
            <div
              className="flex flex-col flex-1 min-w-0 h-full overflow-hidden"
              style={{ transition: "none" }}
            >
              <Header post={post} />

              <main id="iel-take-test-main" className="shrink grow overflow-hidden flex flex-col pb-[60px]">
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

                <ExamContext.Provider value={newContextValue}>
                  <DndContext
                    sensors={sensors}
                    collisionDetection={rectIntersection}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                  >
                    <div className="flex h-full flex-grow min-h-0">
                      <Splitter layout={isMobileView ? "vertical" : undefined}>
                        {post.quizFields.skill[0] === "reading" && (
                          <Splitter.Panel min="20%" max="80%">
                            <div className="prose-sm max-w-none p-[16px] pt-[30px] pb-[120px] bg-white h-full overflow-y-auto text-[#000]">
                              {headingQuestion ? (
                                <PassageRenderer
                                  passageContent={currentPassage.passage_content}
                                />
                              ) : (
                                <TextSelectionWrapper>
                                  {parse(currentPassage.passage_content)}
                                </TextSelectionWrapper>
                              )}
                            </div>
                          </Splitter.Panel>
                        )}

                        {post.quizFields.skill[0] === "listening" && (
                          <Splitter.Panel className="hidden"></Splitter.Panel>
                        )}

                        <Splitter.Panel
                          className={
                            post.quizFields.skill[0] === "listening"
                              ? "basis-100"
                              : ""
                          }
                        >
                          <div
                            ref={questionPanelRef}
                            className={twMerge(
                              "h-full overflow-y-auto",
                              post.quizFields.skill[0] === "listening" &&
                              "mx-auto bg-white listening-board"
                            )}
                          >
                            <TextSelectionWrapper>
                              <div className="p-6 pb-[120px] space-y-6">
                                {(currentPassage?.questions || []).map(
                                  (question, index) => {
                                    const isHeadingQ =
                                      String(question.matchingQuestion?.layoutType)
                                        .trim()
                                        .toLowerCase() === "heading";
                                    const QuestionComponent = (
                                      <QuestionRender
                                        question={question}
                                        // @ts-ignore
                                        startIndex={question.startIndex}
                                      />
                                    );
                                    return isHeadingQ ? (
                                      <div key={index}> {QuestionComponent} </div>
                                    ) : (
                                      <fieldset key={index} disabled={isFormDisabled}>
                                        {" "}
                                        {QuestionComponent}{" "}
                                      </fieldset>
                                    );
                                  }
                                )}
                              </div>
                            </TextSelectionWrapper>
                          </div>
                        </Splitter.Panel>
                      </Splitter>
                    </div>

                    <DragOverlay>
                      {activeId ? (
                        <DraggableOption
                          id={activeId}
                          // @ts-ignore
                          content={
                            answerOptions[parseInt(String(activeId).split("-")[2])]
                              ?.optionText || ""
                          }
                          isOverlay
                        />
                      ) : null}
                    </DragOverlay>
                  </DndContext>
                </ExamContext.Provider>
              </main>
            </div>

            {/* Notepad sidebar — full height from header to footer.
                On mobile, render as a full-screen overlay since the layout
                cannot fit a side-by-side panel. */}
            {isNotesViewOpen && (
              <div
                className="fixed inset-0 z-50 md:static md:w-3/12 md:max-w-[410px] md:shrink-0 md:z-auto"
                style={{ transition: "none" }}
              >
                <Notepad />
              </div>
            )}
          </TextSelectionProvider>

          {/* Footer is outside TextSelectionProvider so AudioPlayer won't unmount */}
          <Footer />
        </div>
      </form>
    </>
  );
}