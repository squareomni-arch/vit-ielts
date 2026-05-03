import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Button, Modal } from "antd";
import { useFormContext, useWatch } from "react-hook-form";
import { twMerge } from "tailwind-merge";

import { countQuestion } from "@/shared/lib";
import { AnswerFormValues, useExamContext } from "../../context";
import AudioPlayer from "../audio-player";

// ▼▼▼ HÀM HELPER (TỪ CHECKBOX.TSX) - GIỮ NGUYÊN ▼▼▼
const parseMaxOptionsFromText = (text: string | undefined | null): number => {
  if (!text) return 1;
  const lowerText = text.toLowerCase();
  if (lowerText.includes("two") || lowerText.includes("2")) return 2;
  if (lowerText.includes("three") || lowerText.includes("3")) return 3;
  if (lowerText.includes("four") || lowerText.includes("4")) return 4;
  if (lowerText.includes("five") || lowerText.includes("5")) return 5;
  return 1;
};
// ▲▲▲ KẾT THÚC HÀM HELPER ▲▲▲

function Footer() {
  const [confirmSubmitModal, setConfirmSubmitModal] = useState(false);

  const {
    post,
    part,
    isReady,
    setIsReady,
    handleSubmitAnswer,
    activeQuestionIndex,
    setActiveQuestionIndex,
    testResult,
  } = useExamContext();

  const {
    control,
    handleSubmit,
    formState: { isSubmitting, isSubmitted },
  } = useFormContext<AnswerFormValues>();

  const answered = useWatch({
    control,
  });

  const isReadingTest = useMemo(
    () => post.quizFields.skill[0] === "reading",
    [post.quizFields.skill]
  );

  useEffect(() => {
    if (isReadingTest) {
      setIsReady(true);
    }
  }, [isReadingTest, setIsReady]);

  const { passagesInfo, answeredMap } = useMemo(() => {
    const localAnsweredMap = new Map<number, boolean>();
    const localAnswers = answered.answers || [];
    let absoluteQuestionIndex = 0;

    const info = post.quizFields.passages.map((passage, passageIndex) => {
      // If passage has a custom start number, reset the absolute index
      const explicitStart = (passage as any).start_question_number;
      if (explicitStart && !isNaN(Number(explicitStart))) {
        absoluteQuestionIndex = Number(explicitStart) - 1;
      }
      let passageStartIndex = absoluteQuestionIndex;
      const passageQuestionIndices: number[] = [];
      const passageQuestionGroups: number[][] = [];
      let totalPassageQuestions = 0;
      // Use originalPartIndex if available (for filtered passages), otherwise use passageIndex
      const originalPartIndex = (passage as any).originalPartIndex;
      const displayPartIndex = originalPartIndex !== undefined ? originalPartIndex : passageIndex;

      passage.questions.forEach(q => {
        if (!q) return;
        q.startIndex = absoluteQuestionIndex;

        const questionType = q.type?.[0];
        const questionCount = (countQuestion({ 
          questions: [q],
          passage_content: passage.passage_content 
        } as any) || 1);

        // ▼▼▼ SỬA LOGIC HIGHLIGHT CHO CHECKBOX TẠI ĐÂY ▼▼▼
        if (questionType === 'matching' || questionType === 'matrix') {
          // Logic cũ của bạn cho matching/matrix
          const answerGroup = localAnswers[q.startIndex];
          if (typeof answerGroup === 'object' && answerGroup !== null) {
            for (let i = 0; i < questionCount; i++) {
              const subAnswer = (answerGroup as any)[i];
              if (subAnswer !== undefined && subAnswer !== null && String(subAnswer).trim() !== '') {
                localAnsweredMap.set(q.startIndex + i, true);
              }
            }
          }
        } else if (questionType === 'checkbox') {
          // Logic MỚI cho checkbox
          const answerArray = localAnswers[q.startIndex];
          if (Array.isArray(answerArray) && answerArray.length > 0) {
            // Nếu mảng là [0, 1] (chọn 2) -> answeredCount = 2
            const answeredCount = answerArray.length;

            // Lặp và highlight 2 item (0 và 1)
            for (let i = 0; i < answeredCount; i++) {
              if (i < questionCount) { // Đảm bảo không vượt quá
                localAnsweredMap.set(q.startIndex + i, true);
              }
            }
          }
        } else {
          // Logic cũ của bạn cho các loại khác (radio, fillup)
          for (let i = 0; i < questionCount; i++) {
            const answer = localAnswers[q.startIndex + i];
            if (answer !== undefined && answer !== null && String(answer).trim() !== '') {
              localAnsweredMap.set(q.startIndex + i, true);
            }
          }
        }
        // ▲▲▲ KẾT THÚC SỬA LOGIC HIGHLIGHT ▲▲▲

        const group: number[] = [];
        for (let i = 0; i < questionCount; i++) {
          passageQuestionIndices.push(absoluteQuestionIndex + i);
          group.push(absoluteQuestionIndex + i);
        }
        
        if (questionType === 'checkbox') {
          // Chỉ group border lại liền nhau nếu là dạng checkbox
          passageQuestionGroups.push(group);
        } else {
          // Các dạng khác tách rời nhau ra thành từng group riêng biệt
          for (let i = 0; i < questionCount; i++) {
            passageQuestionGroups.push([absoluteQuestionIndex + i]);
          }
        }

        totalPassageQuestions += questionCount;
        absoluteQuestionIndex += questionCount;
      });

      const answeredCount = passageQuestionIndices.filter(idx => localAnsweredMap.has(idx)).length;

      const isPractice = post?.quizFields?.type?.[0] === "practice";
      const customTitle = (isPractice && passage.title) ? passage.title : null;

      return {
        partIndex: passageIndex, // Use filtered index for navigation
        displayPartIndex: displayPartIndex, // Use original index for display
        totalQuestions: totalPassageQuestions,
        answeredCount,
        startIndex: passageStartIndex,
        questions: passageQuestionIndices,
        questionGroups: passageQuestionGroups,
        customTitle,
      };
    });

    return {
      passagesInfo: info,
      answeredMap: localAnsweredMap,
    };
  }, [answered.answers, post.quizFields.passages]);

  // Logic `handleFocusIn`
  useEffect(() => {
    const handleFocusIn = (event: FocusEvent) => {
      const target = event.target as HTMLElement & { name?: string };
      let questionIndex: number | null = null;
      let questionElementId: string | null = null;

      if (target.name && target.name.startsWith('answers.')) {
        const parts = target.name.split('.');
        if (parts.length >= 2) {
          const index = parseInt(parts[1], 10);
          if (!isNaN(index)) {
            questionIndex = index;
            if (parts.length === 3) {
              const subIndex = parseInt(parts[2], 10);
              if (!isNaN(subIndex)) {
                questionIndex += subIndex;
              }
            }
          }
        }
      }

      if (questionIndex === null) {
        const closestQuestionElement = target.closest('[id^="#question-no-"]');
        if (closestQuestionElement) {
          const id = closestQuestionElement.id;
          questionElementId = id; // Lưu ID, ví dụ: "#question-no-3"
          const parts = id.split('-');
          const indexStr = parts[parts.length - 1];
          const parsedIndex = parseInt(indexStr, 10);

          if (!isNaN(parsedIndex)) {
            questionIndex = parsedIndex - 1; // Đây là startIndex (ví dụ: 2)
          }
        }
      }

      if (questionIndex !== null && !isNaN(questionIndex)) {

        // ▼▼▼ BẮT ĐẦU LOGIC SỬA LỖI MỚI ▼▼▼
        // Tìm đối tượng question tương ứng với startIndex
        let targetQuestion: (typeof post.quizFields.passages[0]['questions'][0]) | null | undefined = null;
        for (const p of post.quizFields.passages) {
          targetQuestion = p.questions.find(q => q.startIndex === questionIndex);
          if (targetQuestion) break;
        }

        // Nếu đúng là checkbox VÀ chúng ta đã tìm thấy ID cha
        if (targetQuestion && targetQuestion.type?.[0] === 'checkbox' && questionElementId) {
          const questionElement = document.getElementById(questionElementId);

          // Tìm 'wrapper' của AntD checkbox mà người dùng vừa click
          // Dùng .ant-checkbox-wrapper vì nó bao cả input và label
          const clickedWrapper = target.closest('.ant-checkbox-wrapper');

          if (questionElement && clickedWrapper) {
            // Lấy TẤT CẢ các wrapper trong khối câu hỏi đó
            const allWrappers = Array.from(questionElement.querySelectorAll('.ant-checkbox-wrapper'));

            // Tìm vị trí (index) của wrapper vừa click
            const optionIndex = allWrappers.indexOf(clickedWrapper); // 0, 1, 2, 3...

            if (optionIndex > -1) {
              // Cần biết câu này là "Choose TWO" hay "Choose THREE"
              const textToParse = `${targetQuestion.instructions || ""} ${targetQuestion.question || ""} ${targetQuestion.title || ""}`;
              const maxOptions = parseMaxOptionsFromText(textToParse); // Ví dụ: 3

              if (optionIndex < maxOptions) {
                // Nếu click option 0 -> 2 + 0 = 2 (Câu 3)
                // Nếu click option 1 -> 2 + 1 = 3 (Câu 4)
                // Nếu click option 2 -> 2 + 2 = 4 (Câu 5)
                questionIndex = questionIndex + optionIndex;
              } else {
                // Nếu click option "thừa" (ví dụ option 4, 5)
                // Gán nó vào câu hỏi cuối cùng của nhóm (câu 5)
                questionIndex = questionIndex + maxOptions - 1; // 2 + 3 - 1 = 4
              }
            }
            // Nếu không tìm thấy clickedWrapper (ví dụ click vào div bọc ngoài)
            // thì questionIndex vẫn giữ nguyên là startIndex (ví dụ: 2)
            // -> Vẫn active câu 3, đây là hành vi đúng.
          }
        }
        // ▲▲▲ KẾT THÚC LOGIC SỬA LỖI MỚI ▲▲▲

        // Cập nhật Part và Active Index (như cũ)
        const targetPart = passagesInfo.find(
          p =>
            questionIndex! >= p.startIndex && // Dùng ! vì đã check null
            questionIndex! < p.startIndex + p.totalQuestions
        );
        if (targetPart && targetPart.partIndex !== part.current) {
          part.setCurrent(targetPart.partIndex);
        }
        if (questionIndex !== activeQuestionIndex) {
          setActiveQuestionIndex(questionIndex);
        }
      }
    };

    document.addEventListener('focusin', handleFocusIn, true);
    return () => {
      document.removeEventListener('focusin', handleFocusIn, true);
    };
    // Thay đổi phụ thuộc: thêm 'post' để đọc question type
  }, [passagesInfo, part, setActiveQuestionIndex, activeQuestionIndex, post]);

  // Logic `handleScrollToQuestion` (Phần này đã đúng, không cần sửa)
  const handleScrollToQuestion = (index: number) => {
    setActiveQuestionIndex(index);
    let element = document.getElementById(`#question-no-${index + 1}`);
    let targetQuestion: (typeof post.quizFields.passages[0]['questions'][0]) | null = null;
    let elementToScrollTo: HTMLElement | null = null;

    for (const p of post.quizFields.passages) {
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
          // ▼▼▼ SỬA LOGIC HIGHLIGHT CHO CHECKBOX (Dùng .ant-checkbox-wrapper) ▼▼▼
          const allWrappers = element.querySelectorAll('.ant-checkbox-wrapper');
          if (allWrappers && allWrappers.length > relativeIndex) {
            const subQuestionElement = allWrappers[relativeIndex];
            if (subQuestionElement) {
              subQuestionElement.classList.add('active-quizz');
              elementToScrollTo = subQuestionElement as HTMLElement;
            }
          }
          // ▲▲▲ KẾT THÚC SỬA LOGIC HIGHLIGHT ▲▲▲
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

  // Phần còn lại của file (useEffect, totalQuestions, Plyr, JSX...) giữ nguyên
  useEffect(() => {
    const currentPassageInfo = passagesInfo.find(
      info => info.partIndex === part.current
    );
    if (
      currentPassageInfo &&
      currentPassageInfo.totalQuestions > 0
    ) {
      if (
        activeQuestionIndex < currentPassageInfo.startIndex ||
        activeQuestionIndex >=
        currentPassageInfo.startIndex + currentPassageInfo.totalQuestions
      ) {
        setActiveQuestionIndex(currentPassageInfo.startIndex);
      }
    }
  }, [
    part.current,
    passagesInfo,
    activeQuestionIndex,
    setActiveQuestionIndex,
  ]);

  const totalQuestions = useMemo(
    () => passagesInfo.reduce((acc, info) => acc + info.totalQuestions, 0),
    [passagesInfo]
  );

  const handleNextQuestion = () => {
    const newIndex = activeQuestionIndex + 1;
    if (newIndex >= totalQuestions) return;

    const targetPart = passagesInfo.find(
      p =>
        newIndex >= p.startIndex &&
        newIndex < p.startIndex + p.totalQuestions
    );
    if (targetPart) {
      if (targetPart.partIndex !== part.current) {
        part.setCurrent(targetPart.partIndex);
      }
      handleScrollToQuestion(newIndex);
    }
  };

  const handlePrevQuestion = () => {
    const newIndex = activeQuestionIndex - 1;
    if (newIndex < 0) return;

    const targetPart = passagesInfo.find(
      p =>
        newIndex >= p.startIndex &&
        newIndex < p.startIndex + p.totalQuestions
    );
    if (targetPart) {
      if (targetPart.partIndex !== part.current) {
        part.setCurrent(targetPart.partIndex);
      }
      handleScrollToQuestion(newIndex);
    }
  };

  return (
    <>
      <footer className="fixed bottom-0 left-0 right-0 z-50 bg-white">
        {post.quizFields.skill[0] === "listening" && post.quizFields.audio && (() => {
          // Honor per-passage audio_start / audio_end so a single-passage
          // practice quiz doesn't replay the whole 30-minute test file. The
          // values come through SSR as strings (or null); coerce to numbers
          // and pass undefined when missing so AudioPlayer can fall back to
          // "play full file".
          const currentPassage = post.quizFields.passages?.[part.current];
          const rawStart = (currentPassage as any)?.audio_start;
          const rawEnd = (currentPassage as any)?.audio_end;
          const audioStart =
            rawStart === null || rawStart === undefined || rawStart === ""
              ? undefined
              : Number(rawStart);
          const audioEnd =
            rawEnd === null || rawEnd === undefined || rawEnd === ""
              ? undefined
              : Number(rawEnd);
          return (
            <div className={testResult.testMode === "simulation" ? "invisible h-0 overflow-hidden" : ""}>
              <AudioPlayer
                key="listening-audio-player"
                audioUrl={post.quizFields.audio.node.mediaItemUrl}
                isReady={isReady}
                audioStart={Number.isFinite(audioStart) ? audioStart : undefined}
                audioEnd={Number.isFinite(audioEnd) ? audioEnd : undefined}
              />
            </div>
          );
        })()}
        <div className="flex items-center w-full p-[12px] pr-[0] pt-[0]">
          <div className="flex justify-between items-center h-full flex-grow mr-10">
            {passagesInfo.map(info => {
              const isCurrent = info.partIndex === part.current;
              return (
                <div
                  key={info.partIndex}
                  onClick={() => part.setCurrent(info.partIndex)}
                  className="h-full flex items-center cursor-pointer w-full"
                >
                  {isCurrent ? (
                    <div className="justify-center w-full">
                      <div className="flex items-center gap-[5px] h-full">
                        <div className={twMerge("flex items-center border-t-[3px] pt-2 mt-[-1px]", info.totalQuestions > 0 && info.answeredCount === info.totalQuestions ? "border-green-700" : "border-gray-200")}>
                          <span className="font-semibold text-[16px] text-[#000] whitespace-nowrap pl-[20px] pr-[30px] flex items-center gap-1.5">
                            {info.totalQuestions > 0 && info.answeredCount === info.totalQuestions && (
                              <span className="text-green-700 material-symbols-rounded text-[18px] leading-none bold">check</span>
                            )}
                            {info.customTitle || (isReadingTest ? "Passage" : "Part") + " " + ((info.displayPartIndex !== undefined ? info.displayPartIndex : info.partIndex) + 1)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 overflow-x-auto py-1">
                          {info.questionGroups.map((group, groupIdx) => (
                            <div key={`group-${groupIdx}`} className="flex flex-col gap-2 flex-shrink-0">
                              <div className="flex w-full gap-0 h-[3px]">
                                {group.map(questionIndex => (
                                  <div
                                    key={questionIndex}
                                    className={twMerge(
                                      "flex-1 h-full",
                                      answeredMap.has(questionIndex)
                                        ? "bg-green-700"
                                        : "bg-gray-200"
                                    )}
                                  />
                                ))}
                              </div>
                              <div className="flex justify-center gap-1 w-full">
                                {group.length > 1 ? (
                                  <span
                                    key={`label-range-${group[0]}`}
                                    onClick={e => {
                                      e.stopPropagation();
                                      handleScrollToQuestion(group[0]);
                                    }}
                                    className={twMerge(
                                      "text-[#000] p-1 pb-[2px] flex items-center leading-[16px]! justify-center text-[16px] border-2 border-transparent rounded cursor-pointer whitespace-nowrap",
                                      group.includes(activeQuestionIndex) &&
                                      "font-semibold border-2 border-[#418FC6]"
                                    )}
                                  >
                                    {group[0] + 1}-{group[group.length - 1] + 1}
                                  </span>
                                ) : (
                                  group.map(questionIndex => (
                                    <span
                                      key={`label-${questionIndex}`}
                                      onClick={e => {
                                        e.stopPropagation();
                                        handleScrollToQuestion(questionIndex);
                                      }}
                                      className={twMerge(
                                        "text-[#000] p-1 pb-[2px] flex items-center leading-[16px]! justify-center text-[16px] border-2 border-transparent rounded cursor-pointer",
                                        activeQuestionIndex === questionIndex &&
                                        "font-semibold border-2 border-[#418FC6]"
                                      )}
                                    >
                                      {questionIndex + 1}
                                    </span>
                                  ))
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className={twMerge(
                      "flex items-center gap-3 h-full w-full justify-center pt-2 mt-[-1px] border-t-[3px]",
                      info.totalQuestions > 0 && info.answeredCount === info.totalQuestions ? "border-green-700" : "border-transparent"
                    )}>
                      <span className="pl-[20px] text-[16px] text-gray-700 whitespace-nowrap flex items-center gap-1.5">
                        {info.totalQuestions > 0 && info.answeredCount === info.totalQuestions && (
                          <span className="text-green-700 material-symbols-rounded text-[18px] leading-none bold">check</span>
                        )}
                        {info.customTitle || (isReadingTest ? "Passage" : "Part") + " " + ((info.displayPartIndex !== undefined ? info.displayPartIndex : info.partIndex) + 1)}
                      </span>
                      <span className="text-[16px] text-gray-500 whitespace-nowrap">
                        {info.answeredCount} of {info.totalQuestions}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="relative h-full flex items-center flex-shrink-0">
            <div className="absolute bottom-[70px] right-[35px] mb-1 flex gap-1">
              <button
                type="button"
                onClick={handlePrevQuestion}
                disabled={activeQuestionIndex === 0}
                className="flex items-center justify-center w-[55px] h-[55px] rounded bg-gray-800 disabled:cursor-not-allowed transition-colors rounded-[0] disabled:bg-[#dddddd]!"
              >
                <Image
                  width={23}
                  height={26}
                  sizes="100%"
                  alt="logo"
                  src="/bold-al.png"
                  priority
                />
              </button>
              <button
                type="button"
                onClick={handleNextQuestion}
                disabled={activeQuestionIndex >= totalQuestions - 1}
                className="bg-[#000]! flex items-center justify-center w-[55px] h-[55px] rounded bg-gray-800 disabled:cursor-not-allowed transition-colors rounded-[0] disabled:bg-[#dddddd]!"
              >
                <Image
                  width={23}
                  height={26}
                  sizes="100%"
                  alt="logo"
                  src="/bold-ar.png"
                  priority
                />
              </button>
            </div>
            <Button
              type="primary"
              size="large"
              className={twMerge(
                "w-[80px] h-[53px] mb-[-12px] rounded-[0]! transition-colors",
                totalQuestions > 0 && answeredMap.size === totalQuestions
                  ? "bg-[#262626] text-[#fff] hover:bg-[#404040]"
                  : "bg-[#efefef] text-[#535353] hover:text-[#fff] hover:bg-[#262626]"
              )}
              onClick={() => setConfirmSubmitModal(true)}
              loading={isSubmitting || isSubmitted}
              disabled={totalQuestions === 0}
            >
              <span className="material-symbols-rounded check-size xxbold transition-opacity opacity-100 flex items-center justify-center">
                check
              </span>
            </Button>
          </div>
        </div>
      </footer>

      <Modal
        title="Submit ?"
        open={confirmSubmitModal}
        okText="Submit and Review Answers"
        onOk={handleSubmit(handleSubmitAnswer)}
        onCancel={() => setConfirmSubmitModal(false)}
        okButtonProps={{
          loading: isSubmitting || isSubmitted,
        }}
      >
        <p>Are you sure you want to submit?</p>
      </Modal>

      {!isReadingTest && !isReady && (
        <div className="fixed inset-0 bg-black/70 z-[1001] flex flex-col items-center justify-center text-white p-8 text-center">
          <Image
            width={108}
            height={89}
            sizes="100%"
            alt="logo"
            src="/headphone.png"
            className="mb-[30px]"
            priority
          />
          <p className="text-[16px] mb-4">
            You will be listening to an audio clip during this test. You will
            not be permitted to pause or rewind the audio while answering the
            questions.
          </p>
          <p className="mb-6 text-[16px]">
            To continue, click Play.
          </p>
          <button
            onClick={() => setIsReady(true)}
            className="flex items-center justify-center gap-2 w-[96px] h-[47px] bg-[#000] text-[#fff] rounded-[3px]! hover:bg-[#404040] transition-colors"
          >
            <div className="w-[26px] h-[26px] bg-[#fff] rounded-[50px] flex items-center justify-center cursor-pointer">
              <Image
                width={10}
                height={12}
                sizes="100%"
                alt="logo"
                src="/play-icon.png"
                className="fill-dark mr-[-1px]"
                priority
              />
            </div>
            Play
          </button>
        </div>
      )}
    </>
  );
}

export default Footer;