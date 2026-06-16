import { Modal, Select } from "antd";
import { IExamCollection } from "../../api";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import { countQuestion } from "@/shared/lib";

type FormValues = {
  testPart: number[];
  testTime: number;
  quizId: string;
  testMode: "simulation" | "practice";
};

function PracticeGlyph() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="1" y="4" width="22" height="16" rx="3" stroke="#5281F9" strokeWidth="2" />
      <rect x="5" y="9" width="12" height="2" rx="1" fill="#5281F9" />
      <rect x="5" y="13" width="12" height="2" rx="1" fill="#5281F9" />
    </svg>
  );
}

function SimulationGlyph() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="1" y="2" width="22" height="15" rx="3" stroke="#5A7A16" strokeWidth="2" />
      <rect x="8" y="20" width="8" height="2" rx="1" fill="#5A7A16" />
      <rect x="11" y="17" width="2" height="3" fill="#5A7A16" />
    </svg>
  );
}

function Radio({ selected }: { selected: boolean }) {
  return (
    <span className="relative inline-block size-[22px] shrink-0">
      {/* Empty ring */}
      <svg
        width="22"
        height="22"
        viewBox="0 0 22 22"
        fill="none"
        aria-hidden="true"
        className="absolute inset-0 transition-opacity duration-200 ease-out"
        style={{ opacity: selected ? 0 : 1 }}
      >
        <circle cx="11" cy="11" r="10" stroke="#E5E6E8" strokeWidth="1.5" />
      </svg>
      {/* Selected — dark ring + green dot, scales/fades in */}
      <svg
        width="22"
        height="22"
        viewBox="0 0 22 22"
        fill="none"
        aria-hidden="true"
        className="absolute inset-0 transition-all duration-200 ease-out"
        style={{
          opacity: selected ? 1 : 0,
          transform: selected ? "scale(1)" : "scale(0.6)",
          transformOrigin: "center",
        }}
      >
        <circle cx="11" cy="11" r="11" fill="#191D24" />
        <circle cx="11" cy="11" r="5.5" fill="#b3e653" />
      </svg>
    </span>
  );
}

function CheckmarkSmall() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M2.5 7L5.5 10L11.5 4" stroke="#b3e653" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronDown() {
  return (
    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden="true">
      <path d="M1 1L5 5L9 1" stroke="#6A7282" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ExamModeModal({
  quiz,
  open,
  onClose,
  navigateLink,
}: {
  quiz: Omit<
    IExamCollection["data"]["listening" | "reading"][number]["exams"][number],
    "featuredImage"
  >;
  open: boolean;
  onClose: () => void;
  navigateLink: string;
}) {
  const router = useRouter();

  const {
    control,
    setValue,
    handleSubmit,
    watch,
    formState: { isSubmitting, isSubmitted },
  } = useForm<FormValues>({
    defaultValues: {
      testPart: (quiz.quizFields?.passages || []).map((_: any, idx: number) => idx),
      testTime: Number(quiz.quizFields.time),
      quizId: quiz.id,
      testMode: "simulation",
    },
  });

  const [loading, setLoading] = useState(false);
  const [resolvedQuiz, setResolvedQuiz] = useState<typeof quiz | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  useEffect(() => {
    if (!open || resolvedQuiz) return;
    let cancelled = false;

    const fetchSummary = async () => {
      setSummaryLoading(true);
      try {
        const res = await fetch(`/api/test-flow/summary?quizId=${quiz.id}`);
        if (res.ok) {
          const json = await res.json();
          if (!cancelled && json.success && json.data) {
            setResolvedQuiz(json.data);
            const passageCount = json.data.quizFields?.passages?.length || 0;
            setValue("testPart", Array.from({ length: passageCount }, (_, i) => i));
          }
        }
      } catch {
        // Silently fail — modal still works with listing data
      } finally {
        if (!cancelled) setSummaryLoading(false);
      }
    };

    fetchSummary();
    return () => { cancelled = true; };
  }, [open, quiz.id, resolvedQuiz, setValue]);

  const activeQuiz = resolvedQuiz || quiz;

  const testPart = watch("testPart");
  const testMode = useWatch({ control, name: "testMode" });
  const testPartWatcher = useWatch({ control, name: "testPart" });

  useEffect(() => {
    if (testPart.length === 0) {
      setValue("testPart", [0]);
    }
  }, [testPart, setValue]);

  const onSubmit = handleSubmit(async (data) => {
    setLoading(true);
    try {
      const response = await fetch("/api/test-flow/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quizId: data.quizId,
          testPart: data.testPart,
          testTime: data.testTime,
          testMode: data.testMode,
          retake: true,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to start test");
      }

      const testId = result.data?.id;
      const separator = navigateLink.includes("?") ? "&" : "?";
      if (testId) {
        router.push(`${navigateLink}${separator}testId=${testId}`);
      } else {
        router.push(navigateLink);
      }
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  });

  const partOptions = useMemo(() => {
    return (activeQuiz.quizFields?.passages || []).map((passage: any, idx: number) => ({
      label: `${activeQuiz.quizFields.skill?.[0] === "reading" ? "Passage" : "Part"} ${idx + 1}`,
      value: idx,
    }));
  }, [activeQuiz.quizFields?.passages, activeQuiz.quizFields?.skill]);

  const isCheckedAll = testPartWatcher.length === partOptions.length;

  const handleCheckAll = () => {
    if (isCheckedAll) {
      setValue("testPart", []);
    } else {
      setValue("testPart", partOptions.map((o) => o.value));
    }
  };

  const togglePart = (value: number) => {
    const current = testPartWatcher;
    if (current.includes(value)) {
      const next = current.filter((v) => v !== value);
      // Prevent empty selection — keep the clicked passage selected
      setValue("testPart", next.length === 0 ? [value] : next);
    } else {
      setValue("testPart", [...current, value]);
    }
  };

  const timeOptions = useMemo(() => {
    const otps = Array.from({ length: 11 }, (_, i) => ({
      label: i === 0 ? "No limit" : `${i * 5 + 10} minutes`,
      value: i === 0 ? -1 : i * 5 + 10,
    }));
    const isQuizTimeExist = otps.some((o) => o.value == quiz.quizFields.time);
    if (!isQuizTimeExist) {
      otps.unshift({ label: `${quiz.quizFields.time} minutes`, value: quiz.quizFields.time });
    }
    return otps;
  }, [quiz.quizFields.time]);

  const totalQuestions = useMemo(() => {
    return (activeQuiz.quizFields?.passages || []).reduce((acc: number, passage: any) => {
      if (passage.questionCount !== undefined) return acc + passage.questionCount;
      return acc + countQuestion(passage);
    }, 0);
  }, [activeQuiz.quizFields?.passages]);

  const isActionLoading = loading || isSubmitting || isSubmitted;

  return (
    <Modal
      width={640}
      open={open}
      onCancel={onClose}
      classNames={{
        content: "!rounded-[28px] !p-0 overflow-hidden !shadow-[0px_28px_64px_-16px_rgba(15,23,10,0.22)]",
      }}
      footer={null}
      closeIcon={null}
    >
      <form onSubmit={onSubmit}>
        <div className="p-[36px] flex flex-col gap-6 relative">

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute top-5 right-5 w-9 h-9 rounded-full bg-[#f6f7f4] hover:bg-[#e5e6e8] flex items-center justify-center transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M1 1L13 13M13 1L1 13" stroke="#6A7282" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>

          {/* Header */}
          <div className="flex flex-col gap-[6px] pr-12">
            <h3 className="font-[family-name:var(--font-be-vietnam-pro)] font-bold text-[28px] leading-normal text-[#191d24]">
              Choose a mode
            </h3>
            <p className="text-[#6a7282] text-[15px] leading-[22px]">
              Select how you want to take this session.
            </p>
          </div>

          {/* Mode cards */}
          <div className="flex flex-col sm:flex-row gap-[14px]">

            {/* Practice card */}
            <button
              type="button"
              onClick={() => setValue("testMode", "practice")}
              className={[
                "flex-1 flex flex-col gap-3 p-4 rounded-[18px] text-left cursor-pointer border-2 transition-colors duration-200 ease-out",
                testMode === "practice"
                  ? "bg-[#f2fadd] border-[#b3e653]"
                  : "bg-white border-[#e5e6e8] hover:border-[#b3e653]/60",
              ].join(" ")}
            >
              <div className="flex items-center w-full">
                <div className="w-11 h-11 rounded-[12px] bg-[#e8effe] flex items-center justify-center shrink-0">
                  <PracticeGlyph />
                </div>
                <div className="flex-1" />
                <Radio selected={testMode === "practice"} />
              </div>
              <p className="font-semibold text-[17px] text-[#191d24] leading-normal">Practice</p>
              <p className="text-[#6a7282] text-[13px] leading-[18px]">
                Focus on accuracy and timing, part by part.
              </p>
            </button>

            {/* Simulation card */}
            <button
              type="button"
              onClick={() => setValue("testMode", "simulation")}
              className={[
                "flex-1 flex flex-col gap-3 p-4 rounded-[18px] text-left cursor-pointer border-2 transition-colors duration-200 ease-out",
                testMode === "simulation"
                  ? "bg-[#f2fadd] border-[#b3e653]"
                  : "bg-white border-[#e5e6e8] hover:border-[#b3e653]/60",
              ].join(" ")}
            >
              <div className="flex items-center w-full">
                <div className="w-11 h-11 rounded-[12px] bg-[#e9f6d4] flex items-center justify-center shrink-0">
                  <SimulationGlyph />
                </div>
                <div className="flex-1" />
                <Radio selected={testMode === "simulation"} />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-[17px] text-[#191d24] leading-normal">Simulation</p>
                <span className="bg-[#b3e653] px-[10px] py-[4px] rounded-full text-[11px] font-semibold text-[#191d24] tracking-[0.11px]">
                  Recommended
                </span>
              </div>
              <p className="text-[#6a7282] text-[13px] leading-[18px]">
                The real IELTS-on-computer experience.
              </p>
            </button>
          </div>

          {/* Config panel — both contents stacked in one grid cell so the panel
              always sizes to the tallest mode → no height jump when switching */}
          <div className="bg-[#f6f7f4] rounded-[18px] p-[18px] grid">

            {/* Simulation content */}
            <div
              aria-hidden={testMode !== "simulation"}
              className={[
                "[grid-area:1/1] flex flex-col gap-[14px] transition-opacity duration-200 ease-out",
                testMode === "simulation" ? "opacity-100" : "opacity-0 pointer-events-none",
              ].join(" ")}
            >
              <p className="text-[11px] font-semibold text-[#6a7282] tracking-[0.66px] uppercase">
                What&#39;s included
              </p>
              <div className="flex flex-wrap gap-2">
                <div className="bg-white border border-[#e5e6e8] rounded-full px-[14px] py-[8px]">
                  <span className="text-[13px] font-medium text-[#2e3640]">
                    {activeQuiz.quizFields.time} minutes
                  </span>
                </div>
                <div className="bg-white border border-[#e5e6e8] rounded-full px-[14px] py-[8px]">
                  <span className="text-[13px] font-medium text-[#2e3640]">
                    {partOptions.length} {partOptions.length === 1 ? "part" : "parts"}
                  </span>
                </div>
                <div className="bg-white border border-[#e5e6e8] rounded-full px-[14px] py-[8px]">
                  <span className="text-[13px] font-medium text-[#2e3640]">
                    {summaryLoading ? "…" : `${totalQuestions} questions`}
                  </span>
                </div>
              </div>
              <p className="text-[13px] text-[#2e3640] leading-[20px]">
                Timed, full-length and scored exactly like exam day — no pausing between parts.
              </p>
            </div>

            {/* Practice content */}
            <div
              aria-hidden={testMode !== "practice"}
              className={[
                "[grid-area:1/1] flex flex-col gap-[14px] transition-opacity duration-200 ease-out",
                testMode === "practice" ? "opacity-100" : "opacity-0 pointer-events-none",
              ].join(" ")}
            >
              <p className="text-[11px] font-semibold text-[#6a7282] tracking-[0.66px] uppercase">
                Parts to practice
              </p>
              <div className="flex flex-wrap gap-2">
                {/* Full Test chip — always reserve icon space to keep width stable */}
                <button
                  type="button"
                  onClick={handleCheckAll}
                  className={[
                    "flex items-center gap-[6px] px-[14px] py-[9px] rounded-full text-[13px] font-semibold border-[1.5px] transition-colors",
                    isCheckedAll
                      ? "bg-[#191d24] border-[#191d24] text-white"
                      : "bg-white border-[#e5e6e8] text-[#2e3640] hover:border-[#c0c2c5]",
                  ].join(" ")}
                >
                  <span className={isCheckedAll ? "visible" : "invisible"} aria-hidden="true">
                    <CheckmarkSmall />
                  </span>
                  Full Test
                </button>
                {/* Individual passage chips — selected = in testPartWatcher (synced with Full Test) */}
                {partOptions.map((opt) => {
                  const isSelected = testPartWatcher.includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => togglePart(opt.value)}
                      className={[
                        "flex items-center gap-[6px] px-[14px] py-[9px] rounded-full text-[13px] font-semibold border-[1.5px] transition-colors",
                        isSelected
                          ? "bg-[#191d24] border-[#191d24] text-white"
                          : "bg-white border-[#e5e6e8] text-[#2e3640] hover:border-[#c0c2c5]",
                      ].join(" ")}
                    >
                      <span className={isSelected ? "visible" : "invisible"} aria-hidden="true">
                        <CheckmarkSmall />
                      </span>
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-[11px] font-semibold text-[#6a7282] tracking-[0.66px] uppercase">
                  Time limit
                </p>
                <Controller
                  control={control}
                  name="testTime"
                  render={({ field: { onChange, value } }) => (
                    <Select
                      className="w-full"
                      onChange={onChange}
                      value={value}
                      options={timeOptions}
                      suffixIcon={<ChevronDown />}
                      popupClassName="exam-mode-modal-time-popup"
                    />
                  )}
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 bg-white border-[1.5px] border-[#e5e6e8] rounded-full px-[22px] py-[14px] text-[15px] font-semibold text-[#2e3640] hover:border-[#c0c2c5] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isActionLoading}
              className="flex-1 flex items-center justify-center gap-2 bg-[#b3e653] hover:bg-[#9ad534] active:scale-[0.98] rounded-full px-[22px] py-[15px] text-[15px] font-bold text-[#191d24] transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed disabled:pointer-events-none"
            >
              {isActionLoading && (
                <span className="w-[18px] h-[18px] border-2 border-[#191d24] border-r-transparent rounded-full animate-spin shrink-0" aria-hidden="true" />
              )}
              Start now
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

export default ExamModeModal;
