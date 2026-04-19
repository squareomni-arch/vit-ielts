import {
  ChooseComputerWritingIcon,
  ChooseIdeaWritingIcon,
  ChooseSettingsWritingIcon,
} from "@/shared/ui/icons";
import { Checkbox, Modal, Select } from "antd";
import { Button } from "@/shared/ui/ds/atoms/button/button";
import { IExamCollection } from "../../api";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useRouter } from "next/router";
import _ from "lodash";
import { toast } from "react-toastify";
import { countQuestion } from "@/shared/lib";

type FormValues = {
  testPart: number[];
  testTime: number;
  quizId: string;
  testMode: "simulation" | "practice";
};

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
    },
  });
  const [loading, setLoading] = useState(false);

  // Lazy-fetch full quiz summary (with question counts) when modal opens
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
            // Update form defaults with resolved passages
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

  // Use resolved quiz data if available, otherwise fall back to listing data
  const activeQuiz = resolvedQuiz || quiz;

  const testPart = watch("testPart");

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
    const options: { label: string; value: number }[] = [];
    (activeQuiz.quizFields?.passages || []).forEach((passage: any, idx: number) => {
      options.push({
        label: `${activeQuiz.quizFields.skill?.[0] === "reading" ? "Passage" : "Part"
          } ${idx + 1}`,
        value: idx,
      });
    });

    return options;
  }, [activeQuiz.quizFields?.passages, activeQuiz.quizFields?.skill]);

  const fullTestInfo = useMemo(() => {
    if (summaryLoading) return `${activeQuiz.quizFields.time} minutes - loading...`;
    const totalQues = (activeQuiz.quizFields?.passages || []).reduce((acc: number, passage: any) => {
      if (passage.questionCount !== undefined) {
        return acc + passage.questionCount;
      }
      return acc + countQuestion(passage);
    }, 0);

    return `${activeQuiz.quizFields.time} minutes - ${partOptions.length} parts - ${totalQues} questions`;
  }, [partOptions.length, activeQuiz.quizFields?.passages, activeQuiz.quizFields?.time, summaryLoading]);

  const testPartWatcher = useWatch({
    control,
    name: "testPart",
  });

  const isCheckedAll = testPartWatcher.length === partOptions.length;

  const indeterminate =
    testPartWatcher.length > 0 && testPartWatcher.length < partOptions.length;

  const handleCheckAll = () => {
    if (isCheckedAll) {
      setValue("testPart", []);
    } else {
      setValue(
        "testPart",
        partOptions.map((option) => option.value)
      );
    }
  };

  const timeOptions = useMemo(() => {
    const otps = Array.from({ length: 11 }, (_, i) => ({
      label: i === 0 ? "No limit" : `${i * 5 + 10} minutes`,
      value: i === 0 ? -1 : i * 5 + 10,
    }));

    const isQuizTimeExist = otps.some(
      (option) => option.value == quiz.quizFields.time
    );

    if (!isQuizTimeExist) {
      otps.unshift({
        label: `${quiz.quizFields.time} minutes`,
        value: quiz.quizFields.time,
      });
    }

    return otps;
  }, [quiz.quizFields.time]);

  return (
    <Modal
      width={960}
      open={open}
      onCancel={onClose}
      classNames={{
        content: "!rounded-3xl !p-0 overflow-hidden",
        wrapper: "",
      }}
      footer={null}
      closeIcon={
        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-gray-500 hover:text-gray-700">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </span>
      }
    >
      <form onSubmit={onSubmit}>
        {/* Header */}
        <div className="px-8 pt-8 pb-5 text-center">
          <h3 className="text-3xl md:text-4xl font-extrabold text-primary font-nunito">
            Choose a mode
          </h3>
          <p className="text-gray-500 mt-1.5 text-sm">
            Select the best option for your study session
          </p>
        </div>

        {/* Cards */}
        <div className="px-6 pb-8 gap-4 block md:flex items-stretch">
          {/* Practice card */}
          <div className="basis-1/2 mb-4 md:mb-0">
            <div className="border border-gray-200 rounded-2xl p-6 h-full flex flex-col gap-5 bg-white hover:border-primary/40 hover:shadow-lg transition-all duration-200">
              {/* Icon + title */}
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/8 flex items-center justify-center">
                  <ChooseSettingsWritingIcon width={36} height={36} />
                </div>
                <h4 className="text-xl font-bold text-[#191d24] font-nunito">
                  Practice mode
                </h4>
              </div>

              {/* Description */}
              <div className="flex items-start gap-3 bg-gray-50 rounded-xl p-3">
                <ChooseIdeaWritingIcon width={28} height={28} className="shrink-0 mt-0.5" />
                <p className="text-gray-600 text-sm leading-relaxed">
                  Practice mode is suitable for improving accuracy and time spent on each part.
                </p>
              </div>

              {/* Part selector */}
              <div className="space-y-2">
                <p className="font-semibold text-[#191d24] text-sm">
                  1. Choose part/task(s) you want to practice:
                </p>
                <div className="flex flex-col gap-1 pl-1">
                  <Checkbox
                    indeterminate={indeterminate}
                    onChange={handleCheckAll}
                    checked={isCheckedAll}
                    className="font-medium"
                  >
                    Full Test
                  </Checkbox>
                  <Controller
                    control={control}
                    name="testPart"
                    render={({ field: { onChange, value } }) => (
                      <Checkbox.Group
                        options={partOptions}
                        onChange={onChange}
                        value={value}
                        className="flex flex-col gap-0.5 pl-0"
                      />
                    )}
                  />
                </div>
              </div>

              {/* Time selector */}
              <div className="space-y-2">
                <p className="font-semibold text-[#191d24] text-sm">
                  2. Choose a time limit:
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
                    />
                  )}
                />
              </div>

              {/* CTA */}
              <div className="mt-auto pt-2">
                <Controller
                  control={control}
                  name="testMode"
                  render={({ field: { onChange } }) => (
                    <Button
                      variant="secondary"
                      size="md"
                      fullWidth
                      loading={loading || isSubmitted || isSubmitting}
                      type="submit"
                      onClick={() => onChange("practice")}
                    >
                      Start Now
                    </Button>
                  )}
                />
              </div>
            </div>
          </div>

          {/* Simulation card */}
          <div className="basis-1/2">
            <div className="border-2 border-primary/30 rounded-2xl p-6 h-full flex flex-col gap-5 bg-gradient-to-b from-primary/[3%] to-white hover:border-primary/60 hover:shadow-lg transition-all duration-200 relative overflow-hidden">
              {/* Badge */}
              <div className="absolute top-4 right-4">
                <span className="text-xs font-bold bg-primary text-white px-2.5 py-1 rounded-full">
                  Recommended
                </span>
              </div>

              {/* Icon + title */}
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <ChooseComputerWritingIcon width={36} height={36} />
                </div>
                <h4 className="text-xl font-bold text-[#191d24] font-nunito">
                  Simulation test mode
                </h4>
              </div>

              {/* Description */}
              <div className="flex items-start gap-3 bg-primary/5 rounded-xl p-3">
                <ChooseIdeaWritingIcon width={28} height={28} className="shrink-0 mt-0.5" />
                <p className="text-gray-600 text-sm leading-relaxed">
                  Simulation test mode is the best option to experience the real IELTS on computer.
                </p>
              </div>

              {/* Test info */}
              <div className="space-y-2">
                <p className="font-semibold text-[#191d24] text-sm">Test information</p>
                <div className="bg-white border border-gray-100 rounded-xl p-3">
                  <div className="flex items-center gap-2 text-gray-700 text-sm">
                    <span className="material-symbols-rounded text-primary text-[18px]">info</span>
                    Full tasks ({fullTestInfo})
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="mt-auto pt-2">
                <Controller
                  control={control}
                  name="testMode"
                  render={({ field: { onChange } }) => (
                    <Button
                      variant="primary"
                      size="md"
                      fullWidth
                      loading={loading || isSubmitted || isSubmitting}
                      type="submit"
                      onClick={() => onChange("simulation")}
                    >
                      Start Now
                    </Button>
                  )}
                />
              </div>
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
}

export default ExamModeModal;
