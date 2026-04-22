import { useFormContext, Controller } from "react-hook-form";
import { useEffect, useMemo, useState } from "react";
import parse, { DOMNode, Element } from "html-react-parser"; // [SỬA] Import thêm DOMNode
// import { Collapse } from "antd"; // Removed for QuestionExplanation
import { twMerge } from "tailwind-merge";
import { IPracticeSingle } from "@/pages/ielts-practice-single/api";
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
import { SortableContext, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useExamContext } from "@/pages/take-the-test/context";
import { TextSelectionWrapper } from "@/shared/ui/text-selection";
import React from "react"; // [SỬA] Import React
import { QuestionExplanation } from "./question-explanation";

type AnswerFormValues = { answers: (string | number[] | object)[] };
type IQuestion =
  IPracticeSingle["quizFields"]["passages"][number]["questions"][number] & {
    question?: string;
    matchingQuestion?: {
      layoutType?: "standard" | "summary" | "heading" | string[]; // Có thể là mảng
      matchingItems?: { questionPart: string; correctAnswer: string }[];
      summaryText?: string;
      answerOptions?: { optionText: string }[];
    };
    startIndex?: number;
  };

// ==================================================================
// == COMPONENT CON (DÙNG CHUNG)
// ==================================================================

export const DraggableOption = ({
  id,
  content,
  isOverlay = false,
  isDropped = false,
  className = "",
  bold = true,
}: {
  id: UniqueIdentifier;
  content: string;
  isOverlay?: boolean;
  isDropped?: boolean;
  className?: string;
  bold?: boolean;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });
  const style = {
    transform: CSS.Translate.toString(transform),
    // transition,
    opacity: isDragging && !isOverlay ? 0.3 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={twMerge(
        "block rounded-sm touch-none select-none",
        "text-sm",
        bold ? "font-bold" : "font-normal",
        isDropped ? "bg-transparent" : "bg-white",
        isOverlay
          ? "cursor-grabbing border-2 border-blue-500 shadow-md px-3 py-0.5 w-max whitespace-nowrap"
          : "cursor-grab w-fit max-w-full whitespace-nowrap",
        !isDropped && "px-3 py-0.5 shadow-sm", // Removed border border-gray-200
        isDragging && "opacity-30",
        className
      )}
    >
      <TextSelectionWrapper>{parse(content || "")}</TextSelectionWrapper>
    </div>
  );
};

export const StandardDroppableSlot = ({
  id,
  children,
  isOver,
  isSelected,
  onClick,
  className,
  hitAreaOffset = 0,
}: {
  id: UniqueIdentifier;
  children: React.ReactNode;
  isOver: boolean;
  isSelected: boolean;
  onClick: () => void;
  className?: string;
  hitAreaOffset?: number;
}) => {
  const { setNodeRef } = useSortable({ id, disabled: true });

  const visualClasses = twMerge(
    "droppable-slot-mq outline-none max-w-[520px] px-[10px] border border-dashed rounded-md flex items-center relative transition-colors min-h-[27px] text-[14px] text-[#000] cursor-pointer",
    isOver ? "active-slot" : "border-[#c5c5c5]",
    className
  );

  if (hitAreaOffset > 0) {
    return (
      <div
        ref={setNodeRef}
        style={{ padding: hitAreaOffset, margin: -hitAreaOffset }}
        className="inline-flex"
      >
        <div
          onClick={onClick}
          tabIndex={0}
          className={visualClasses}
        >
          {children}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      onClick={onClick}
      tabIndex={0}
      className={visualClasses}
    >
      {children}
    </div>
  );
};

export const SummaryDroppableSlot = ({
  id,
  children,
  isOver,
  questionNumber,
  onClick,
  isSelected,
}: {
  id: UniqueIdentifier;
  children: React.ReactNode;
  isOver: boolean;
  questionNumber: number;
  onClick: () => void;
  isSelected: boolean;
}) => {
  const { setNodeRef } = useSortable({ id, disabled: true });
  const hasChildren =
    children && Array.isArray(children) && children.length > 0;

  return (
    <span
      ref={setNodeRef}
      onClick={onClick}
      tabIndex={0}
      data-droppable-id={id}
      className={twMerge(
        "min-w-[96px] max-w-fit inline-block align-baseline min-h-[27px] px-2 py-0.5 leading-[20px] whitespace-nowrap",
        "border border-dashed rounded-sm outline-none",
        "text-center relative transition-colors cursor-pointer",
        isSelected || isOver ? "active-slot" : "border-gray-400",
        isOver && !isSelected && "bg-blue-50"
      )}
    >
      {hasChildren ? (
        children
      ) : (
        <span className="font-bold text-[#000] select-none pointer-events-none">
          {questionNumber}
        </span>
      )}
    </span>
  );
};

export const HeadingDroppableSlot = ({
  id,
  children,
  isOver,
  questionNumber,
  onClick,
  isSelected,
}: {
  id: UniqueIdentifier;
  children: React.ReactNode;
  isOver: boolean;
  questionNumber: number;
  onClick: () => void;
  isSelected: boolean;
}) => {
  const { setNodeRef } = useSortable({ id, disabled: true });
  const hasChildren =
    children && Array.isArray(children) && children.length > 0;

  return (
    <span
      ref={setNodeRef}
      onClick={onClick}
      tabIndex={0}
      data-droppable-id={id}
      className={twMerge(
        "inline-flex items-center justify-center",
        "w-full max-w-[550px] min-h-[27px] px-[10px] py-0.5 align-baseline",
        "border border-dashed rounded-md outline-none",
        "relative transition-colors cursor-pointer",
        isSelected || isOver ? "active-slot" : "border-gray-400",
        isOver && !isSelected && "bg-blue-50"
      )}
    >
      {hasChildren ? (
        children
      ) : (
        <span className="font-bold text-[#000] select-none pointer-events-none">
          {questionNumber}
        </span>
      )}
    </span>
  );
};

// ==================================================================
// == COMPONENT CHÍNH
// ==================================================================
export function MatchingQuestion({
  question,
  startIndex = 0,
  readOnly = false,
}: {
  question: IQuestion;
  startIndex?: number;
  readOnly?: boolean;
}) {
  const matchingData = question.matchingQuestion;
  if (!matchingData || !matchingData.layoutType) {
    return null;
  }

  const methods = useFormContext<AnswerFormValues>();
  const { activeQuestionIndex, setActiveQuestionIndex, post } = useExamContext();
  const { answerOptions = [] } = matchingData;

  const allOptionIds = useMemo(
    () => answerOptions.map((_, i) => `option-${startIndex}-${i}`),
    [answerOptions, startIndex]
  );

  // FIX: Xử lý `layoutType` có thể là mảng hoặc string
  const layoutValue = matchingData.layoutType;
  const layout = Array.isArray(layoutValue)
    ? layoutValue[0]
    : String(layoutValue || "")
      .trim()
      .toLowerCase();

  const isReading = post?.quizFields?.skill?.[0] === "reading";
  const shouldBeBold = layout === "heading" && isReading;

  const findContainer = (
    items: Record<string, UniqueIdentifier[]>,
    id: UniqueIdentifier
  ) => {
    if (!id) return undefined;
    if (id in items) return id as string;
    return Object.keys(items).find((key) => items[key].includes(id));
  };

  // ================== LAYOUT: 'summary' ==================
  if (layout === "summary") {
    const { processedText, correctAnswers, totalGaps } = useMemo(() => {
      const answers: string[] = [];
      const summaryText = matchingData.summaryText || "";
      let gapCount = 0;
      const textToRender = summaryText.replace(
        /\{(.*?)\}/g,
        (match, answer) => {
          answers.push(answer.trim());
          const currentGapIndex = gapCount;
          gapCount++;
          return `<span data-gap-index="${currentGapIndex}"></span>`;
        }
      );
      return {
        processedText: textToRender,
        correctAnswers: answers,
        totalGaps: gapCount,
      };
    }, [matchingData.summaryText]);

    if (
      !matchingData.summaryText ||
      answerOptions.length === 0 ||
      totalGaps === 0
    ) {
      return (
        <div className="p-4 border-red-200 bg-red-50 rounded-md">
          Dữ liệu Matching (Summary) không hợp lệ.
        </div>
      );
    }

    const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
    const [overId, setOverId] = useState<UniqueIdentifier | null>(null);
    const sensors = useSensors(
      useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
      useSensor(KeyboardSensor)
    );
    const handleDragStart = (event: DragStartEvent) => {
      setActiveId(event.active.id);
      setOverId(null);
    };
    const handleDragOver = (event: DragOverEvent) => {
      setOverId(event.over?.id ?? null);
    };

    return (
      <div className="space-y-6" id={`question-block-${startIndex + 1}`}>
        <div className="heading-group space-y-2">
          <h3 className="text-lg font-bold">
            {(post?.quizFields?.type?.[0] === "practice" && question.title) 
              ? question.title 
              : `Questions ${startIndex + 1}–${startIndex + totalGaps}`}
          </h3>
          <div className="text-[16px] leading-[2] prose prose-sm max-w-none text-[#000]">
            {parse(
              question.instructions ||
              "Complete the summary using the list of words. Choose the correct answer and move it into the gap."
            )}
          </div>
        </div>

        <Controller
          control={methods.control}
          name={`answers.${startIndex}`}
          defaultValue={{}}
          render={({ field }) => {
            // --- [LOGIC MỚI CHO READONLY SUMMARY] ---
            if (readOnly) {
              // === CHẾ ĐỘ READONLY ===
              const userAnswers =
                typeof field.value === "object" && field.value !== null
                  ? (field.value as { [key: number]: string })
                  : {};

              const readOnlyParserOptions = {
                replace: (domNode: DOMNode) => {
                  const element = domNode as Element;
                  if (
                    element.name === "span" &&
                    element.attribs &&
                    element.attribs["data-gap-index"] !== undefined
                  ) {
                    const gapIndex = parseInt(
                      element.attribs["data-gap-index"],
                      10
                    );
                    if (isNaN(gapIndex)) return;

                    // 1. Lấy text câu trả lời
                    const userAnswerOptionId = userAnswers[gapIndex];
                    const userAnswerOptionIndex = userAnswerOptionId
                      ? parseInt(String(userAnswerOptionId).split("-")[2])
                      : -1;
                    const userAnswerText =
                      userAnswerOptionIndex !== -1 &&
                        answerOptions[userAnswerOptionIndex]
                        ? answerOptions[userAnswerOptionIndex].optionText
                        : undefined;
                    const correctAnswerText = correctAnswers[gapIndex];

                    // 2. Xác định trạng thái
                    const userDidAnswer = userAnswerText !== undefined;
                    const isCorrect =
                      userDidAnswer &&
                      userAnswerText.trim().toLowerCase() ===
                      correctAnswerText.trim().toLowerCase();

                    let content: React.ReactNode;
                    let boxClasses = "border-gray-200"; // Changed diff: Lighter border

                    if (isCorrect) {
                      // 1. Correct: Green text
                      content = (
                        <span className="text-green-700 font-bold">
                          {userAnswerText}
                        </span>
                      );
                      boxClasses = "border-green-500 bg-green-50";
                    } else if (userDidAnswer) {
                      // 2. Incorrect: Red text (strikethrough) + Green text
                      content = (
                        <>
                          <span className="text-[#374151] line-through mr-1 font-bold opacity-70">
                            {userAnswerText}
                          </span>
                          <span className="text-green-700 font-bold">
                            {correctAnswerText}
                          </span>
                        </>
                      );
                      boxClasses = "border-[#374151]/30 bg-[#374151]/5";
                    } else {
                      // 3. Missed: Gray text
                      content = (
                        <span className="text-[#374151]/60 font-bold">
                          {correctAnswerText}
                        </span>
                      );
                      boxClasses = "border-[#374151]/20 bg-gray-50"; // Changed diff: Lighter border
                    }

                    // 4. Return component with dashed border AND BACKGROUND COLOR
                    return (
                      <span
                        className={twMerge(
                          "inline-block border border-dashed px-2 py-0.5 align-baseline min-w-[80px] text-center rounded-sm",
                          shouldBeBold ? "font-bold" : "font-normal",
                          boxClasses
                        )}
                      >
                        {content}
                      </span>
                    );
                  }
                },
              };

              return (
                <>
                  {/* 1. Hiển thị danh sách Options */}
                  <div className="flex flex-col items-start gap-2 mb-4">
                    {answerOptions.map((option, index) => (
                      <div
                        key={index}
                        className="border rounded-md px-3 py-0.5 bg-gray-50 text-[#000] text-sm"
                      >
                        <TextSelectionWrapper>
                          {parse(option.optionText || "")}
                        </TextSelectionWrapper>
                      </div>
                    ))}
                  </div>

                  {/* 2. Hiển thị đoạn văn với kết quả inline */}
                  <div className="prose-base text-black leading-relaxed">
                    <TextSelectionWrapper>
                      {parse(processedText, readOnlyParserOptions)}
                    </TextSelectionWrapper>
                  </div>

                  {/* 3. Hiển thị Explanation */}
                    {question.explanations?.[0]?.content && (
                      <div className="mt-6">
                        <QuestionExplanation 
                          content={question.explanations?.[0]?.content}
                        />
                      </div>
                    )}
                </>
              );
            }
            // === HẾT CHẾ ĐỘ READONLY ===

            // === CHẾ ĐỘ LÀM BÀI (Tương tác - Giữ nguyên) ===
            const [items, setItems] = useState<
              Record<string, UniqueIdentifier[]>
            >({});
            useEffect(() => {
              /* ... init items ... */
              const formAnswers =
                typeof field.value === "object" && field.value !== null
                  ? (field.value as any)
                  : {};
              const newItems: Record<string, UniqueIdentifier[]> = {
                available: [],
              };
              for (let i = 0; i < totalGaps; i++) {
                newItems[`gap-${i}`] = [];
              }
              answerOptions.forEach((_, optionIndex) => {
                const optionId = `option-${startIndex}-${optionIndex}`;
                let isDroppedIntoGap = false;
                for (const gapKey in formAnswers) {
                  if (formAnswers[gapKey] === optionId) {
                    if (newItems[`gap-${gapKey}`]) {
                      newItems[`gap-${gapKey}`].push(optionId);
                      isDroppedIntoGap = true;
                    }
                    break;
                  }
                }
                if (!isDroppedIntoGap) {
                  newItems["available"].push(optionId);
                }
              });
              setItems(newItems);
            }, [field.value, totalGaps, answerOptions, startIndex]);

            const handleDragEnd = (event: DragEndEvent) => {
              /* ... handle drag end ... */
              setActiveId(null);
              setOverId(null);
              const { active, over } = event;
              const activeContainer = findContainer(items, active.id);
              let overContainerId: string | undefined;
              if (over) {
                overContainerId =
                  over.id in items
                    ? (over.id as string)
                    : findContainer(items, over.id);
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
                if (newItems[overContainerId]) {
                  newItems[overContainerId] = [active.id];
                } else {
                  if (!newItems["available"]) newItems["available"] = [];
                  if (!newItems["available"].includes(active.id))
                    newItems["available"].push(active.id);
                }
              } else {
                if (!newItems["available"]) newItems["available"] = [];
                if (!newItems["available"].includes(active.id)) {
                  newItems["available"].push(active.id);
                }
              }
              setItems(newItems);
              const currentFormAnswers =
                typeof field.value === "object" && field.value !== null
                  ? { ...(field.value as any) }
                  : {};
              let updatedFormAnswers = { ...currentFormAnswers };
              Object.keys(updatedFormAnswers).forEach((key) => {
                if (updatedFormAnswers[key] === active.id) {
                  delete updatedFormAnswers[key];
                }
              });
              if (String(overContainerId).startsWith("gap-")) {
                const gapIndex = String(overContainerId).split("-")[1];
                if (
                  gapIndex &&
                  !isNaN(parseInt(gapIndex, 10)) &&
                  parseInt(gapIndex, 10) < totalGaps
                ) {
                  updatedFormAnswers[gapIndex] = active.id;
                  const absoluteIndex = startIndex + parseInt(gapIndex, 10);
                  if (!isNaN(absoluteIndex))
                    setActiveQuestionIndex(absoluteIndex);
                }
              }
              field.onChange(updatedFormAnswers);
            };

            const parserOptions = {
              replace: (domNode: DOMNode) => {
                const element = domNode as Element;
                if (
                  element.name === "span" &&
                  element.attribs &&
                  element.attribs["data-gap-index"] !== undefined
                ) {
                  const gapIndex = parseInt(
                    element.attribs["data-gap-index"],
                    10
                  );
                  if (isNaN(gapIndex)) return;
                  const containerId = `gap-${gapIndex}`;
                  const questionNumber = startIndex + gapIndex + 1;
                  const questionAbsoluteIndex = startIndex + gapIndex;
                  return (
                    <SortableContext
                      items={items[containerId] || []}
                      id={containerId}
                    >
                      <SummaryDroppableSlot
                        id={containerId}
                        isOver={overId === containerId}
                        questionNumber={questionNumber}
                        onClick={() =>
                          setActiveQuestionIndex(questionAbsoluteIndex)
                        }
                        isSelected={
                          activeQuestionIndex === questionAbsoluteIndex
                        }
                      >
                        {(items[containerId] || []).map((optionId) => {
                          const optionIndex = parseInt(
                            String(optionId).split("-")[2]
                          );
                          if (
                            isNaN(optionIndex) ||
                            optionIndex < 0 ||
                            optionIndex >= answerOptions.length
                          )
                            return null;
                          return (
                            <DraggableOption
                              key={optionId}
                              id={optionId}
                              content={answerOptions[optionIndex].optionText}
                              isDropped
                              bold={shouldBeBold}
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
              <DndContext
                sensors={sensors}
                collisionDetection={rectIntersection}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
              >
                {/* --- LAYOUT LOGIC --- */}
                {(() => {
                  const isListening = post?.quizFields?.skill?.[0] === "listening";

                  const TextContent = (
                    <div className="prose-base w-fit max-w-full text-black leading-relaxed">
                      <TextSelectionWrapper>
                        {parse(processedText, parserOptions)}
                      </TextSelectionWrapper>
                    </div>
                  );

                  const OptionsContent = !readOnly && (
                    <div
                      className={twMerge(
                        "scale-100 origin-top-left",
                        isListening ? "mt-0" : "mt-[60px] border-gray-200"
                      )}
                    >
                      <SortableContext items={allOptionIds} id="available">
                        <div className="flex flex-col items-start gap-3">
                          {allOptionIds.map((id, optionIndex) => {
                            const optionText = answerOptions[optionIndex]?.optionText;
                            if (!optionText) return null;

                            const isAvailable = (items["available"] || []).includes(id);

                            if (isAvailable) {
                              return (
                                <DraggableOption
                                  key={id}
                                  id={id}
                                  content={optionText}
                                  isDropped={false}
                                  bold={shouldBeBold}
                                  className="block rounded-md px-4 py-2 bg-white text-[#000] text-center shadow-sm border border-gray-200 w-fit max-w-full"
                                />
                              );
                            } else {
                              return (
                                <div
                                  key={`placeholder-${id}`}
                                  className="block rounded-sm bg-white px-3 py-0.5 w-fit"
                                >
                                  <div className={twMerge("invisible text-sm", shouldBeBold ? "font-bold" : "font-normal")}>
                                    <TextSelectionWrapper>
                                      {parse(optionText || "")}
                                    </TextSelectionWrapper>
                                  </div>
                                </div>
                              );
                            }
                          })}
                        </div>
                      </SortableContext>
                    </div>
                  );

                  if (isListening) {
                    return (
                      <div className="flex flex-row gap-8 items-start">
                        <div className="shrink-0">
                          {TextContent}
                        </div>
                        <div className="shrink-0">
                          <p className="text-[16px] font-bold mb-4">List of options</p>
                          {OptionsContent}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div>
                      {TextContent}
                      {OptionsContent}
                    </div>
                  );
                })()}

                <DragOverlay>
                  {activeId ? (
                    <DraggableOption
                      id={activeId as UniqueIdentifier}
                      content={
                        answerOptions[parseInt(String(activeId).split("-")[2])]
                          ?.optionText || ""
                      }
                      isOverlay
                      isDropped={false}
                      bold={shouldBeBold}
                    />
                  ) : null}
                </DragOverlay>
              </DndContext>
            );
          }}
        />
      </div>
    );
  } else if (layout === "heading") {
    // ... (Code 'heading' không thay đổi) ...
    const { items } = useExamContext();
    if (!items && !readOnly) {
      return (
        <div className="p-4 border-red-200 bg-red-50 rounded-md">
          Lỗi: Context chưa cung cấp `items`.
        </div>
      );
    }
    if (answerOptions.length === 0) {
      return (
        <div className="p-4 border-red-200 bg-red-50 rounded-md">
          Lỗi: Thiếu "Answer Options".
        </div>
      );
    }

    return (
      <div className="space-y-6" id={`question-block-${startIndex + 1}`}>
        <div className="heading-group">
          <h3 className="text-lg font-bold">
            {(post?.quizFields?.type?.[0] === "practice" && question.title) 
              ? question.title 
              : (question.title || "Questions")}
          </h3>
          <div className="text-[16px] leading-[2] prose prose-sm max-w-none text-[#000]">
            {parse(
              question.instructions ||
              "Choose the correct heading for each section."
            )}
          </div>
        </div>
        {!readOnly && (
          <div className="pt-3">
            {/* Sử dụng `allOptionIds` ổn định cho SortableContext
             */}
            <SortableContext items={allOptionIds} id="available">
              <div className="flex flex-col items-start gap-2">
                {/* Lặp qua `allOptionIds` ổn định
                 */}
                {allOptionIds.map((id, optionIndex) => {
                  const optionText = answerOptions[optionIndex]?.optionText;
                  if (!optionText) return null; // An toàn

                  // Kiểm tra xem ID này có "available" không
                  const isAvailable = (items?.["available"] || []).includes(id);

                  if (isAvailable) {
                    // CÓ: Render DraggableOption
                    return (
                      <DraggableOption
                        key={id}
                        id={id}
                        content={optionText}
                        isDropped={false}
                        bold={shouldBeBold}
                      />
                    );
                  } else {
                    // KHÔNG: Render Placeholder
                    return (
                      <div
                        key={`placeholder-${id}`}
                        // Style giống hệt DraggableOption
                        className="block rounded-sm  px-3 py-0.5 w-fit"
                      >
                        {/* Nội dung tàng hình để giữ chiều cao */}
                        <div className={twMerge("invisible text-sm", shouldBeBold ? "font-bold" : "font-normal")}>
                          <TextSelectionWrapper>
                            {parse(optionText || "")}
                          </TextSelectionWrapper>
                        </div>
                      </div>
                    );
                  }
                })}
              </div>
            </SortableContext>
          </div>
        )}
        {readOnly && (
          <div className="mt-6 space-y-4">
            <div className="pt-3 heading-list">
              <h4 className="text-[16px] font-bold mb-4">List of Headings</h4>
              <div className="flex flex-col items-start gap-3 prose prose-sm max-w-none w-full">
                {answerOptions.map((option, index) => (
                  <div
                    key={`heading-opt-${index}`}
                    className={twMerge("block rounded-sm border border-gray-200 px-3 py-0 text-[17px] text-[#000]", shouldBeBold ? "font-bold" : "font-normal")}
                  >
                    <TextSelectionWrapper>
                      {parse(option.optionText || "")}
                    </TextSelectionWrapper>
                  </div>
                ))}
              </div>
            </div>
            {question.explanations?.[0]?.content && (
              <div className="mt-2">
                <QuestionExplanation 
                  content={question.explanations?.[0]?.content}
                />
              </div>
            )}
          </div>
        )}
      </div>
    );

    // ================== LAYOUT: 'standard' ==================
  } else {
    const itemsToMatch = matchingData.matchingItems || [];
    if (
      !itemsToMatch ||
      itemsToMatch.length === 0 ||
      !answerOptions ||
      answerOptions.length === 0
    ) {
      return (
        <div className="p-4 border-red-200 bg-red-50 rounded-md">
          Dữ liệu Matching (Standard) không hợp lệ.
        </div>
      );
    }
    const standardQuestionCount = itemsToMatch.length;
    const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
    const [overId, setOverId] = useState<UniqueIdentifier | null>(null);
    const sensors = useSensors(
      useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
      useSensor(KeyboardSensor)
    );
    const handleDragStart = (event: DragStartEvent) => {
      setActiveId(event.active.id);
      setOverId(null);
    };
    const handleDragOver = (event: DragOverEvent) => {
      setOverId(event.over?.id ?? null);
    };



    return (
      <div className="space-y-6" id={`question-block-${startIndex + 1}`}>
        <div className="heading-group space-y-2">
          <h3 className="text-lg font-bold">
            {(post?.quizFields?.type?.[0] === "practice" && question.title) 
              ? question.title 
              : (question.title || `Questions ${startIndex + 1}–${startIndex + (itemsToMatch?.length || 0)}`)}
          </h3>
          <div className="text-[16px] leading-[2] prose prose-sm max-w-none text-[#000]">
            {parse(
              question.instructions ||
              "Complete each sentence with the correct ending. Choose the correct answer and move it into the gap."
            )}
          </div>
        </div>
        <Controller
          control={methods.control}
          name={`answers.${startIndex}`}
          defaultValue={{}}
          render={({ field }) => {
            const [items, setItems] = useState<
              Record<string, UniqueIdentifier[]>
            >({});
            useEffect(() => {
              /* ... init items ... */
              const matchedAnswers: { [key: number]: number } =
                typeof field.value === "object" && field.value !== null
                  ? (field.value as any)
                  : {};
              const newItems: Record<string, UniqueIdentifier[]> = {
                available: [],
              };
              itemsToMatch.forEach((_, index) => {
                newItems[`item-${index}`] = [];
              });
              const allOptionIds = answerOptions.map(
                (_, i) => `option-${startIndex}-${i}`
              );
              allOptionIds.forEach((id) => {
                const optionIndex = parseInt(id.split("-")[2]);
                const containerIndexStr = Object.keys(matchedAnswers).find(
                  (key) => matchedAnswers[parseInt(key)] === optionIndex
                );
                if (containerIndexStr !== undefined) {
                  const containerIndex = parseInt(containerIndexStr, 10);
                  if (
                    !isNaN(containerIndex) &&
                    newItems[`item-${containerIndex}`]
                  ) {
                    newItems[`item-${containerIndex}`] = [id];
                  } else {
                    newItems["available"].push(id);
                  }
                } else {
                  newItems["available"].push(id);
                }
              });
              setItems(newItems);
            }, [field.value, itemsToMatch, answerOptions, startIndex]);

            const handleDragEnd = (event: DragEndEvent) => {
              /* ... handle drag end ... */
              setActiveId(null);
              setOverId(null);
              const { active, over } = event;
              if (!over) {
                return;
              }
              const activeContainer = findContainer(items, active.id);
              const overContainerId =
                over.id in items
                  ? (over.id as string)
                  : findContainer(items, over.id);

              if (
                !activeContainer ||
                !overContainerId ||
                activeContainer === overContainerId
              )
                return;

              // --- 1. Cập nhật State Local (UI) ---
              const newItems = { ...items };

              // Xóa item khỏi container cũ
              if (newItems[activeContainer]) {
                newItems[activeContainer] = newItems[activeContainer].filter(
                  (id) => id !== active.id
                );
              }

              // Xử lý container đích
              if (String(overContainerId).startsWith("item-")) {
                // Nếu slot đã có item, đẩy item cũ về available
                if (
                  newItems[overContainerId] &&
                  newItems[overContainerId].length > 0
                ) {
                  const existingItemId = newItems[overContainerId][0];
                  newItems[overContainerId] = []; // Xóa item cũ khỏi slot

                  if (!newItems["available"]) newItems["available"] = [];
                  if (!newItems["available"].includes(existingItemId)) {
                    newItems["available"].push(existingItemId);
                  }
                }
                // Đặt item mới vào slot
                newItems[overContainerId] = [active.id];
              } else {
                // Nếu drop về available (hoặc container khác không phải slot)
                if (!newItems["available"]) newItems["available"] = [];
                if (!newItems["available"].includes(active.id)) {
                  newItems["available"].push(active.id);
                }
              }
              setItems(newItems);

              // --- 2. Cập nhật Form Data ---
              const newAnswers =
                typeof field.value === "object" && field.value !== null
                  ? { ...(field.value as { [key: number]: number }) }
                  : {};
              const activeOptionIndex = parseInt(
                active.id.toString().split("-")[2]
              );

              // Remove current active option from any answer
              Object.keys(newAnswers).forEach((keyStr) => {
                if (newAnswers[parseInt(keyStr)] === activeOptionIndex)
                  delete newAnswers[parseInt(keyStr)];
              });

              if (String(overContainerId).startsWith("item-")) {
                const targetSlot = parseInt(
                  String(overContainerId).split("-")[1]
                );

                if (!isNaN(targetSlot) && targetSlot < standardQuestionCount) {
                  if (
                    items[overContainerId] &&
                    items[overContainerId].length > 0
                  ) {
                    const oldItemId = items[overContainerId][0];
                    const oldOptionIndex = parseInt(
                      oldItemId.toString().split("-")[2]
                    );
                    Object.keys(newAnswers).forEach((keyStr) => {
                      if (newAnswers[parseInt(keyStr)] === oldOptionIndex)
                        delete newAnswers[parseInt(keyStr)];
                    });
                  }
                  newAnswers[targetSlot] = activeOptionIndex;
                  const absoluteIndex = startIndex + targetSlot;
                  if (!isNaN(absoluteIndex))
                    setActiveQuestionIndex(absoluteIndex);
                }
              }
              field.onChange(newAnswers);
            };

            // === [LOGIC MỚI] ===
            // === LIST LAYOUT ===
            if (layout === "list") {
              if (readOnly) {
                // === READONLY MODE FOR LIST LAYOUT ===
                return (
                  <div className="space-y-6">
                    <div className="flex flex-col gap-8">
                      {/* Left Column: Questions with visual results */}
                      <div className="space-y-4">
                        <h4 className="text-[16px] font-bold mb-4 invisible hidden md:block">
                          placeholder
                        </h4>
                        {itemsToMatch.map((item, itemIndex) => {
                          const questionAbsoluteIndex = startIndex + itemIndex;

                          const userAnswers =
                            typeof field.value === "object" &&
                              field.value !== null
                              ? (field.value as { [key: number]: number })
                              : {};
                          const userAnswerOptionIndex = userAnswers
                            ? userAnswers[itemIndex]
                            : undefined;
                          const userAnswerText =
                            userAnswerOptionIndex !== undefined
                              ? answerOptions[userAnswerOptionIndex]?.optionText
                              : undefined;
                          const correctAnswerText = item.correctAnswer;

                          const userDidAnswer = userAnswerText !== undefined;
                          const isCorrect =
                            userDidAnswer &&
                            userAnswerText.trim().toLowerCase() ===
                            correctAnswerText.trim().toLowerCase();

                          return (
                            <div
                              key={`result-list-${itemIndex}`}
                              className="flex items-center justify-start gap-4"
                              id={`#question-no-${questionAbsoluteIndex + 1}`}
                            >
                              <div className="text-[16px] text-[#000]">
                                <TextSelectionWrapper>
                                  {parse(item.questionPart || "")}
                                </TextSelectionWrapper>
                              </div>

                              <div
                                className={twMerge(
                                  "droppable-slot-mq outline-none min-w-[60px] px-[10px] border border-dashed rounded-md flex items-center justify-center relative transition-colors min-h-[36px] text-[14px] text-[#000]",
                                  isCorrect
                                    ? "border-green-500 bg-green-50"
                                    : !userDidAnswer
                                      ? "border-gray-400 bg-gray-50"
                                      : "border-red-500 bg-red-50",
                                  shouldBeBold ? "font-bold" : "font-normal"
                                )}
                              >
                                {isCorrect && (
                                  <span className="text-green-700 text-center">
                                    {userAnswerText}
                                  </span>
                                )}
                                {!isCorrect && userDidAnswer && (
                                  <span className="flex-grow text-center">
                                    <span className="text-red-500 line-through mr-2">
                                      {userAnswerText}
                                    </span>
                                    <span className="text-green-700">
                                      {correctAnswerText}
                                    </span>
                                  </span>
                                )}
                                {!userDidAnswer && (
                                  <span className="text-gray-500 text-center">
                                    {correctAnswerText}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Right Column: Options List (Static) */}
                      <div>
                        <h4 className="text-[16px] font-bold mb-4">
                          List of options
                        </h4>
                        <div className="flex flex-col items-start gap-3">
                          {answerOptions.map((option, index) => (
                            <div
                              key={`list-opt-readonly-${index}`}
                              className={twMerge("block rounded-md px-4 py-2 bg-white text-[#000] text-center", shouldBeBold ? "font-bold" : "font-normal")}
                            >
                              <TextSelectionWrapper>
                                {parse(option.optionText || "")}
                              </TextSelectionWrapper>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Explanation Section */}
                    {question.explanations?.[0]?.content && (
                      <div className="mt-4">
                        <QuestionExplanation 
                          content={question.explanations?.[0]?.content}
                        />
                      </div>
                    )}
                  </div>
                );
              }

              // === INTERACTIVE MODE FOR LIST LAYOUT ===
              return (
                <DndContext
                  sensors={sensors}
                  collisionDetection={rectIntersection}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDragEnd={handleDragEnd}
                >
                  <div className="flex flex-col gap-8">
                    {/* Left Column: Questions */}
                    <div className="space-y-6">
                      <h4 className="text-[16px] font-bold mb-4 invisible hidden md:block">
                        placeholder
                      </h4>
                      {itemsToMatch.map((item, itemIndex) => {
                        const containerId = `item-${itemIndex}`;
                        const questionAbsoluteIndex = startIndex + itemIndex;
                        return (
                          <div
                            key={containerId}
                            className="flex items-center justify-start gap-4 flex-col lg:flex-row w-full"
                            id={`#question-no-${questionAbsoluteIndex + 1}`}
                          >
                            <div className="text-[16px] text-[#000]">
                              <TextSelectionWrapper>
                                {parse(item.questionPart || "")}
                              </TextSelectionWrapper>
                            </div>

                            <SortableContext
                              items={items[containerId] || []}
                              id={containerId}
                            >
                              <StandardDroppableSlot
                                id={containerId}
                                isOver={
                                  overId === containerId ||
                                  (overId
                                    ? findContainer(items, overId) ===
                                    containerId
                                    : false)
                                }
                                isSelected={
                                  activeQuestionIndex === questionAbsoluteIndex
                                }
                                onClick={() =>
                                  setActiveQuestionIndex(questionAbsoluteIndex)
                                }
                                className="min-w-[120px] w-auto justify-center"
                                hitAreaOffset={3} // Expand hit area by 3px
                              >
                                {(items[containerId] || []).map((id) => {
                                  const optionIndex = parseInt(
                                    id.toString().split("-")[2]
                                  );
                                  if (
                                    isNaN(optionIndex) ||
                                    optionIndex < 0 ||
                                    optionIndex >= answerOptions.length
                                  )
                                    return null;
                                  return (
                                    <DraggableOption
                                      key={id}
                                      id={id}
                                      content={
                                        answerOptions[optionIndex].optionText
                                      }
                                      bold={shouldBeBold}
                                      className="text-[#000] text-center"
                                    />
                                  );
                                })}
                                {(!items[containerId] ||
                                  items[containerId].length === 0) && (
                                    <span className={twMerge("text-[16px] text-[#000] pointer-events-none", shouldBeBold ? "font-bold" : "font-normal")}>
                                      {questionAbsoluteIndex + 1}
                                    </span>
                                  )}
                              </StandardDroppableSlot>
                            </SortableContext>
                          </div>
                        );
                      })}
                    </div>

                    {/* Right Column: Options */}
                    <div>
                      <h4 className="text-[16px] font-bold mb-4">
                        List of options
                      </h4>
                      <SortableContext
                        items={items["available"] || []}
                        id="available"
                      >
                        <div className="flex flex-col items-start gap-3">
                          {(items["available"] || []).map((id) => {
                            const optionIndex = parseInt(
                              String(id).split("-")[2]
                            );
                            const optionText =
                              answerOptions[optionIndex]?.optionText;
                            if (!optionText) return null;

                            return (
                              <DraggableOption
                                key={id}
                                id={id}
                                content={optionText}
                                isDropped={false}
                                bold={shouldBeBold}
                                className="block rounded-md px-4 py-2 bg-white text-[#000] text-center shadow-sm border border-gray-200 w-fit max-w-full"
                              />
                            );
                          })}
                        </div>
                      </SortableContext>
                    </div>
                  </div>

                  <DragOverlay>
                    {activeId ? (
                      <DraggableOption
                        id={activeId}
                        content={
                          answerOptions[
                            parseInt(String(activeId).split("-")[2])
                          ]?.optionText || ""
                        }
                        isOverlay
                        isDropped={false}
                        className="block rounded-md border border-gray-200 px-4 py-2 bg-white text-[#000] shadow-lg text-center cursor-grabbing z-50"
                      />
                    ) : null}
                  </DragOverlay>
                </DndContext>
              );
            }

            // === STANDARD LAYOUT (Fallback) ===
            if (readOnly) {
              return (
                <div className="space-y-6">
                  {/* 1. List of questions with inline results */}
                  <div className="space-y-4">
                    {itemsToMatch.map((item, itemIndex) => {
                      const questionAbsoluteIndex = startIndex + itemIndex;

                      const userAnswers =
                        typeof field.value === "object" && field.value !== null
                          ? (field.value as { [key: number]: number })
                          : {};
                      const userAnswerOptionIndex = userAnswers
                        ? userAnswers[itemIndex]
                        : undefined;
                      const userAnswerText =
                        userAnswerOptionIndex !== undefined
                          ? answerOptions[userAnswerOptionIndex]?.optionText
                          : undefined;
                      const correctAnswerText = item.correctAnswer;

                      const userDidAnswer = userAnswerText !== undefined;
                      const isCorrect =
                        userDidAnswer &&
                        userAnswerText.trim().toLowerCase() ===
                        correctAnswerText.trim().toLowerCase();

                      return (
                        <div
                          key={`result-standard-${itemIndex}`}
                          className="space-y-2"
                          id={`#question-no-${questionAbsoluteIndex + 1}`}
                        >
                          <div className="text-[16px] mb-[2px]">
                            <TextSelectionWrapper>
                              {parse(item.questionPart || "")}
                            </TextSelectionWrapper>
                          </div>

                          <div
                            className={twMerge(
                              "droppable-slot-mq outline-none max-w-[520px] px-[10px] border border-dashed rounded-md flex items-center relative transition-colors min-h-[27px] text-[14px] text-[#000]",
                              isCorrect
                                ? "border-green-500 bg-green-50"
                                : !userDidAnswer
                                  ? "border-gray-200 bg-gray-50"
                                  : "border-red-500 bg-red-50"
                            )}
                          >
                            {isCorrect && (
                              <span className="text-green-700 font-bold">
                                {userAnswerText}
                              </span>
                            )}
                            {!isCorrect && userDidAnswer && (
                              <span className="flex-grow">
                                <span className="text-red-500 line-through mr-2 font-bold">
                                  {userAnswerText}
                                </span>
                                <span className="text-green-700 font-bold">
                                  {correctAnswerText}
                                </span>
                              </span>
                            )}
                            {!userDidAnswer && (
                              <span className="text-gray-500 font-bold">
                                {correctAnswerText}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* 2. List of Answer Options (readOnly) */}
                  <div className="pt-3">
                    <h4 className="text-[16px] font-bold mb-4">
                      Answer Options
                    </h4>
                    <div className="flex flex-col items-start gap-3 prose prose-sm max-w-none w-full">
                      {answerOptions.map((option, index) => (
                        <div
                          key={`sa-opt-${index}`}
                          className={twMerge("block rounded-sm border border-gray-200 px-3 py-0.5 bg-gray-50 text-[#000]", shouldBeBold ? "font-bold" : "font-normal")}
                        >
                          <TextSelectionWrapper>
                            {parse(option.optionText || "")}
                          </TextSelectionWrapper>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 3. Explanation */}
                  {question.explanations?.[0]?.content && (
                    <div className="mt-2">
                      <QuestionExplanation 
                        content={question.explanations?.[0]?.content}
                      />
                    </div>
                  )}
                </div>
              );
            }

            // === STANDARD LAYOUT INTERACTIVE ===
            return (
              <DndContext
                sensors={sensors}
                collisionDetection={rectIntersection}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
              >
                <div className="flex flex-col gap-5">
                  <div className="space-y-4">
                    {itemsToMatch.map((item, itemIndex) => {
                      const containerId = `item-${itemIndex}`;
                      const questionAbsoluteIndex = startIndex + itemIndex;
                      return (
                        <div
                          key={containerId}
                          className="space-y-2"
                          id={`#question-no-${questionAbsoluteIndex + 1}`}
                        >
                          <div className="text-[16px] mb-[2px]">
                            <TextSelectionWrapper>
                              {parse(item.questionPart || "")}
                            </TextSelectionWrapper>
                          </div>
                          <SortableContext
                            items={items[containerId] || []}
                            id={containerId}
                          >
                            <StandardDroppableSlot
                              id={containerId}
                              isOver={
                                overId === containerId ||
                                (overId
                                  ? findContainer(items, overId) === containerId
                                  : false)
                              }
                              isSelected={
                                activeQuestionIndex === questionAbsoluteIndex
                              }
                              onClick={() =>
                                setActiveQuestionIndex(questionAbsoluteIndex)
                              }
                            >
                              {(items[containerId] || []).map((id) => {
                                const optionIndex = parseInt(
                                  id.toString().split("-")[2]
                                );
                                if (
                                  isNaN(optionIndex) ||
                                  optionIndex < 0 ||
                                  optionIndex >= answerOptions.length
                                )
                                  return null;
                                return (
                                  <DraggableOption
                                    key={id}
                                    id={id}
                                    content={
                                      answerOptions[optionIndex].optionText
                                    }
                                    isDropped
                                    bold={shouldBeBold}
                                  />
                                );
                              })}
                              {(!items[containerId] ||
                                items[containerId].length === 0) && (
                                  <span className={twMerge("absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[16px] text-[#000] pointer-events-none", shouldBeBold ? "font-bold" : "font-normal")}>
                                    {questionAbsoluteIndex + 1}
                                  </span>
                                )}
                            </StandardDroppableSlot>
                          </SortableContext>
                        </div>
                      );
                    })}
                  </div>

                  {!readOnly && (
                    <div className="pt-3">
                      <SortableContext items={allOptionIds} id="available">
                        <div className="flex flex-col items-start gap-2">
                          {allOptionIds.map((id, optionIndex) => {
                            const optionText =
                              answerOptions[optionIndex]?.optionText;
                            if (!optionText) return null;

                            const isAvailable = (
                              items["available"] || []
                            ).includes(id);

                            if (isAvailable) {
                              return (
                                <DraggableOption
                                  key={id}
                                  id={id}
                                  content={optionText}
                                  isDropped={false}
                                  bold={shouldBeBold}
                                />
                              );
                            } else {
                              return (
                                <div
                                  key={`placeholder-${id}`}
                                  className="block rounded-sm bg-white px-3 py-0.5 w-fit"
                                >
                                  <div className={twMerge("invisible text-sm", shouldBeBold ? "font-bold" : "font-normal")}>
                                    <TextSelectionWrapper>
                                      {parse(optionText || "")}
                                    </TextSelectionWrapper>
                                  </div>
                                </div>
                              );
                            }
                          })}
                        </div>
                      </SortableContext>
                    </div>
                  )}
                </div>

                <DragOverlay>
                  {activeId ? (
                    <DraggableOption
                      id={activeId}
                      content={
                        answerOptions[parseInt(String(activeId).split("-")[2])]
                          ?.optionText || ""
                      }
                      isOverlay
                      isDropped={false}
                    />
                  ) : null}
                </DragOverlay>
              </DndContext>
            );
          }}
        />
      </div>
    );
  }
}
