import { IPracticeSingle } from "@/pages/ielts-practice-single/api";
import { useFormContext, Controller } from "react-hook-form";
import parse from "html-react-parser";
// import { Collapse } from "antd"; // Removed for QuestionExplanation
import { twMerge } from "tailwind-merge";
import { useExamContext } from "@/pages/take-the-test/context";
import { TextSelectionWrapper } from "@/shared/ui/text-selection";
import { useMemo } from "react";
import { countQuestion } from "@/shared/lib";
import { QuestionExplanation } from "./question-explanation";

type IMatrixCategory = {
  categoryLetter: string;
  categoryText: string;
};
type IMatrixItem = {
  itemText: string;
  correctCategoryLetter: string;
};
type IQuestion =
  IPracticeSingle["quizFields"]["passages"][number]["questions"][number] & {
    matrixQuestion?: {
      matrixCategories: IMatrixCategory[];
      matrixItems: IMatrixItem[];
      layoutType?: "standard" | "simple";
      legendTitle?: string;
    };
  };

const normalizeString = (str: string | undefined | null) => {
  if (!str) return "";
  return str.toLowerCase().replace(/[^a-z0-9]/g, "");
};

export const MatrixQuestion = ({
  question,
  startIndex: propStartIndex = 0,
  readOnly = false,
}: {
  question: IQuestion;
  startIndex?: number;
  readOnly?: boolean;
}) => {
  const { control, getValues } = useFormContext();
  const { activeQuestionIndex, setActiveQuestionIndex, post } = useExamContext();

  const realStartIndex = useMemo(() => {
    // QUAN TRỌNG: Ưu tiên dùng propStartIndex nếu có giá trị hợp lệ (>= 0)
    // Điều này đảm bảo đồng bộ với PageTakeTheTestWrapper nơi startIndex đã được tính toán chính xác
    if (typeof propStartIndex === "number" && propStartIndex >= 0) {
      return propStartIndex;
    }

    if (readOnly) {
      const finalStartIndex = (question.startIndex !== undefined && question.startIndex >= 0)
        ? question.startIndex
        : propStartIndex;
      return finalStartIndex;
    }

    if (!post?.quizFields?.passages) return propStartIndex;
    const targetTitle = normalizeString(question.title);
    const targetFirstItem = normalizeString(question.matrixQuestion?.matrixItems?.[0]?.itemText);
    let currentCount = 0;
    for (const passage of post.quizFields.passages) {
      for (const q of passage.questions) {
        const currentTitle = normalizeString(q.title);
        const currentFirstItem = normalizeString(q.matrixQuestion?.matrixItems?.[0]?.itemText);
        const isTitleMatch = targetTitle && currentTitle && targetTitle === currentTitle;
        const isItemMatch = targetFirstItem && currentFirstItem && targetFirstItem === currentFirstItem;
        if (isTitleMatch || isItemMatch) return currentCount;

        const qCount = countQuestion({ 
          questions: [q],
          passage_content: passage.passage_content 
        } as any) || 1;
        currentCount += qCount;
      }
    }
    return propStartIndex;
  }, [post, question, propStartIndex, readOnly]);

  const matrixData = question.matrixQuestion;

  if (!matrixData || !matrixData.matrixItems?.length || !matrixData.matrixCategories?.length) {
    return <div className="p-4 border border-red-200 bg-red-50 rounded-md">Dữ liệu không hợp lệ.</div>;
  }

  const { matrixItems, matrixCategories, layoutType: propLayoutType, legendTitle: propLegendTitle } = matrixData;
  const rawLayout = propLayoutType ? String(propLayoutType).trim().toLowerCase() : "";
  const layoutType = rawLayout === "simple" ? "simple" : "standard";
  const legendTitle = propLegendTitle || "First invented or used by";
  const userAnswers = getValues(`answers.${realStartIndex}`) as { [key: number]: string } | undefined;

  const CategoryListJSX = (
    <div className="max-w-xs border border-black text-base text-black">
      <div className="p-2 font-bold border-b border-black">
        <TextSelectionWrapper>{legendTitle}</TextSelectionWrapper>
      </div>
      <div>
        {matrixCategories.map((category) => (
          <div key={category.categoryLetter} className="flex border-b border-black last:border-b-0">
            <span className="w-16 p-2 text-center font-bold border-r border-black">{category.categoryLetter}</span>
            <span className="p-2 flex-1"><TextSelectionWrapper>{parse(category.categoryText || "")}</TextSelectionWrapper></span>
          </div>
        ))}
      </div>
    </div>
  );

  const StaticQuestionGridJSX = (
    <div className={twMerge("border overflow-x-auto matrixboard", readOnly ? "px-2 py-4" : "px-[16px] py-[36px]")}>
      <table className={twMerge("w-full border-collapse text-black", readOnly ? "text-[14px]" : "text-[15px] min-w-max")}>
        <thead>
          <tr>
            <th className={twMerge("border-b-2 border-black", readOnly ? "w-[30px]" : "w-[50px]")}></th>
            <th className={twMerge("border-b-2 border-black", readOnly ? "min-w-[80px]" : "min-w-[120px]")}></th>
            {matrixCategories.map((cat, index) => (
              <th key={cat.categoryLetter} className={twMerge("text-center font-bold border-b-2 border-black", readOnly ? "w-[30px] p-1 text-sm" : "w-[50px] p-2", index > 0 && "border-l border-black", index === 0 && "border-l-2 border-black")}>
                {cat.categoryLetter}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrixItems.map((item, itemIndex) => {
            const absoluteIndex = realStartIndex + itemIndex;
            const correctAnswer = item.correctCategoryLetter;
            const userAnswer = userAnswers ? userAnswers[itemIndex] : undefined;
            const userDidAnswer = userAnswer !== undefined && userAnswer !== null;

            return (
              <tr key={itemIndex} className="border-b last:border-b-0" id={`#question-no-${absoluteIndex + 1}`}>
                <td className={twMerge("text-center align-middle font-bold pr-[0]", readOnly ? "p-1 text-[14px]" : "p-2 text-[16px]")}>
                  <div className="h-[34px] w-7 flex items-center justify-center rounded-sm mx-auto">{absoluteIndex + 1}</div>
                </td>
                <td className={twMerge("align-middle pl-[0] break-words", readOnly ? "p-1 text-[14px]" : "p-3 text-[16px]")}>
                  <TextSelectionWrapper>{parse(item.itemText || "")}</TextSelectionWrapper>
                </td>
                {matrixCategories.map((category, index) => {
                  const currentLetter = category.categoryLetter;
                  const isCorrectAnswer = currentLetter === correctAnswer;
                  const isUserAnswer = currentLetter === userAnswer;
                  const isUserCorrect = userDidAnswer && isUserAnswer && isCorrectAnswer;

                  let cellContent = null;
                  let cellBgClass = "";

                  if (isCorrectAnswer) {
                    if (!userDidAnswer) {
                      cellContent = <span className="material-symbols-rounded text-gray-500">check_circle</span>;
                      cellBgClass = "bg-gray-100";
                    } else {
                      cellContent = <span className="material-symbols-rounded text-green-500">check_circle</span>;
                      cellBgClass = "bg-green-100";
                    }
                  } else if (isUserAnswer) {
                    cellContent = <span className="material-symbols-rounded text-red-500">cancel</span>;
                    cellBgClass = "bg-red-100";
                  }

                  return (
                    <td key={category.categoryLetter} className={twMerge("text-center align-middle h-[42px]", readOnly ? "p-0" : "p-2", index > 0 && "border-l", index === 0 && "border-l-2 border-black", cellBgClass)}>
                      {cellContent}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  /* ... inside MatrixQuestion ... */
  const isListening = post?.quizFields?.skill?.[0] === "listening";
  const contentToCheck = question.question || question.instructions || "";
  const hasMedia = /<img|<video|<canvas/i.test(contentToCheck);

  // Content 1: Title & Instructions (contains media)
  const InstructionsContent = (
    <div className="heading-group space-y-2">
    <h3 className="text-lg font-bold">
      {(post?.quizFields?.type?.[0] === "practice" && question.title) 
        ? question.title 
        : (question.title || `Questions ${realStartIndex + 1}–${realStartIndex + matrixItems.length}`)}
    </h3>
      <div className="leading-[2] prose prose-sm max-w-none text-black">
        {parse(contentToCheck || "")}
      </div>
    </div>
  );

  // Content 2: Matrix Table & Categories
  const MatrixTableContent = (
    <>
      {!readOnly && (
        <>
          <Controller
            key={realStartIndex}
            name={`answers.${realStartIndex}`}
            control={control}
            defaultValue={{}}
            render={({ field }) => {
              const handleAnswerChange = (itemIndex: number, categoryLetter: string) => {
                const currentAnswers = field.value || {};
                const newAnswers = { ...currentAnswers, [itemIndex]: categoryLetter };
                field.onChange(newAnswers);
              };

              return (
                <div className="border px-[16px] py-[36px] max-w-[900] matrixboard">
                  <table className="w-full border-collapse text-black text-[15px]">
                    <thead>
                      <tr>
                        <th className="w-[50px] border-b-2 border-black"></th>
                        <th className="border-b-2 border-black min-w-[120px]"></th>
                        {matrixCategories.map((cat, index) => (
                          <th key={cat.categoryLetter} className={twMerge("w-[50px] p-2 text-center font-bold border-b-2 border-black", index > 0 && "border-l border-black", index === 0 && "border-l-2 border-black")}>
                            {cat.categoryLetter}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {matrixItems.map((item, itemIndex) => {
                        const absoluteIndex = realStartIndex + itemIndex;
                        const isActive = activeQuestionIndex === absoluteIndex;
                        return (
                          <tr key={itemIndex} className="border-b last:border-b-0" id={`#question-no-${absoluteIndex + 1}`}>
                            <td className="p-2 text-center align-middle font-bold text-[16px] pr-[0]">
                              <div className={twMerge("h-[34px] w-7 flex items-center justify-center rounded-sm mx-auto", isActive && "border-[2px] border-[#418ec8]")}>
                                {absoluteIndex + 1}
                              </div>
                            </td>
                            <td className="p-3 align-middle text-[16px] pl-[0] break-words">
                              <TextSelectionWrapper>{parse(item.itemText || "")}</TextSelectionWrapper>
                            </td>
                            {matrixCategories.map((category, index) => {
                              const isChecked = field.value?.[itemIndex] === category.categoryLetter;
                              return (
                                <td key={category.categoryLetter} className={twMerge("p-2 text-center align-middle", isChecked && "bg-[#bbd8f0]", index > 0 && "border-l", index === 0 && "border-l-2 border-black")}>
                                  <label className="group relative flex justify-center items-center cursor-pointer h-full w-full">
                                    <input
                                      type="radio"
                                      className="sr-only"
                                      name={`q-${realStartIndex}-matrix-item-${itemIndex}`}
                                      value={category.categoryLetter}
                                      checked={isChecked}
                                      onChange={() => handleAnswerChange(itemIndex, category.categoryLetter)}
                                      onClick={() => setActiveQuestionIndex(absoluteIndex)}
                                    />
                                    <div className="w-[13px] h-[13px] border-[1px] border-gray-700 rounded-full flex items-center justify-center group-has-[:checked]:border-blue-600">
                                      <div className="w-[7px] h-[7px] bg-blue-600 rounded-full opacity-0 group-has-[:checked]:opacity-100"></div>
                                    </div>
                                  </label>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            }}
          />
          {layoutType === "standard" && CategoryListJSX}
        </>
      )}

      {readOnly && (
        <div className="space-y-6">
          {StaticQuestionGridJSX}
          {layoutType === "standard" && CategoryListJSX}
            <QuestionExplanation 
              content={question.explanations?.[0]?.content}
              label="Explanation"
            />
        </div>
      )}
    </>
  );

  // ... (inside MatrixQuestion)

  if (isListening && hasMedia) {
    // 1. Instructions Text with Media Removed
    const InstructionsTextOnly = (
      <div className="heading-group space-y-2 mb-4">
        <h3 className="text-lg font-bold">
          {(post?.quizFields?.type?.[0] === "practice" && question.title) 
            ? question.title 
            : (question.title || `Questions ${realStartIndex + 1}–${realStartIndex + matrixItems.length}`)}
        </h3>
        <div className="leading-[2] prose prose-sm max-w-none text-black">
          {parse(contentToCheck || "", {
            replace: (domNode: any) => {
              if (domNode.name === 'img' || domNode.name === 'video' || domNode.name === 'canvas' || domNode.name === 'figure') {
                return <></>;
              }
            }
          })}
        </div>
      </div>
    );

    // 2. Extracted Media Only
    const mediaMatches = contentToCheck.match(/<img[^>]*>|<video[^>]*>.*?<\/video>|<canvas[^>]*>.*?<\/canvas>|<figure[^>]*>.*?<\/figure>/g) || [];
    const MediaOnly = (
      <div className="flex flex-col gap-4">
        {mediaMatches.map((mediaHtml, idx) => (
          <div key={idx}>{parse(mediaHtml)}</div>
        ))}
      </div>
    );

    return (
      <div id={`question-block-${realStartIndex + 1}`}>
        {/* Row 1: Text Instructions */}
        {InstructionsTextOnly}

        {/* Row 2: Media + Table Side-by-Side */}
        <div className={twMerge(
          "flex items-start",
          readOnly ? "flex-row flex-nowrap gap-4 w-full" : "flex-col lg:flex-row gap-8"
        )}>
          <div className={twMerge(
            readOnly ? "w-[40%] shrink-0 [&_img]:max-w-full [&_img]:h-auto [&_img]:object-contain" : "w-fit max-w-[50%] shrink-0"
          )}>
            {MediaOnly}
          </div>
          <div className="flex-1 min-w-0 w-full">
            {MatrixTableContent}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" id={`question-block-${realStartIndex + 1}`}>
      {InstructionsContent}
      {MatrixTableContent}
    </div>
  );
};