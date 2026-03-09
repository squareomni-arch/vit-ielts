import {
  ChooseComputerWritingIcon,
  ChooseIdeaWritingIcon,
  ChooseSettingsWritingIcon,
} from "@/shared/ui/icons";
import { Button, Checkbox, Modal, Select } from "antd";
import { IExamCollection } from "../../api";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useRouter } from "next/router";
import _ from "lodash";
import { toast } from "react-toastify";

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
      testPart: quiz.quizFields.passages.map((_, idx) => idx),
      testTime: Number(quiz.quizFields.time),
      quizId: quiz.id,
    },
  });
  const [loading, setLoading] = useState(false);

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
      if (testId) {
        router.push(`${navigateLink}?testId=${testId}`);
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
    quiz.quizFields.passages.forEach((passage, idx) => {
      // const questions = passage.questions.reduce((acc, question) => {
      //   return acc + question.explanations.length;
      // }, 0);

      options.push({
        label: `${
          quiz.quizFields.skill[0] === "reading" ? "Passage" : "Part"
        } ${idx + 1}`,
        value: idx,
      });
    });

    return options;
  }, [quiz.quizFields.passages, quiz.quizFields.skill]);

  const fullTestInfo = useMemo(() => {
    const totalQues = quiz.quizFields.passages.reduce((acc, passage) => {
      return (
        acc +
        passage.questions.reduce((acc, question) => {
          return acc + question.explanations.length;
        }, 0)
      );
    }, 0);

    return `${quiz.quizFields.time} minutes - ${partOptions.length} parts - ${totalQues} questions`;
  }, [partOptions.length, quiz.quizFields.passages, quiz.quizFields.time]);

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
      width={1000}
      open={open}
      onCancel={onClose}
      classNames={{
        content: "bg-gray-50",
      }}
      footer={null}
    >
      <form onSubmit={onSubmit} className="pt-4">
        <h3 className="text-2xl md:text-4xl text-center font-extrabold text-primary font-nunito mb-4">
          Choose a mode
        </h3>
        <div className="gap-x-8 space-y-4 block md:flex items-stretch md:space-y-0">
          <div className="basis-1/2">
            <div className="bg-white rounded-lg py-4 shadow space-y-4 px-6 h-full flex flex-col">
              <div className="text-center space-y-2">
                <ChooseSettingsWritingIcon
                  width={50}
                  height={50}
                  className="mx-auto"
                />
                <h4 className="text-xl md:text-3xl text-blue-950 font-semibold">
                  Practice mode
                </h4>
              </div>
              <div className="flex items-center gap-2">
                <ChooseIdeaWritingIcon
                  width={40}
                  height={40}
                  className="shrink-0"
                />
                <p className="leading-snug">
                  Practice mode is suitable for improving accuracy and time
                  spent on each part.
                </p>
              </div>
              <div className="space-y-2">
                <p className="font-semibold text-blue-950">
                  1. Choose part/task(s) you want to practice:
                </p>
                <div className="flex flex-col">
                  <Checkbox
                    indeterminate={indeterminate}
                    onChange={handleCheckAll}
                    checked={isCheckedAll}
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
                        className="flex flex-col gap-0.5"
                      />
                    )}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <p className="font-semibold text-blue-950">
                  2. Choose a time limit:
                </p>
                <div className="flex flex-col">
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
              </div>
              <div className="text-center mt-auto">
                <Controller
                  control={control}
                  name="testMode"
                  render={({ field: { onChange } }) => (
                    <Button
                      loading={loading || isSubmitted || isSubmitting}
                      type="primary"
                      htmlType="submit"
                      value={"practice"}
                      onClick={() => onChange("practice")}
                    >
                      Start Now
                    </Button>
                  )}
                />
              </div>
            </div>
          </div>
          <div className="basis-1/2">
            <div className="bg-white rounded-lg py-4 shadow space-y-4 px-6 h-full flex flex-col">
              <div className="text-center space-y-2">
                <ChooseComputerWritingIcon
                  width={50}
                  height={50}
                  className="mx-auto"
                />
                <h4 className="text-xl md:text-3xl text-blue-950 font-semibold">
                  Simulation test mode
                </h4>
              </div>
              <div className="flex items-center gap-2">
                <ChooseIdeaWritingIcon
                  width={40}
                  height={40}
                  className="shrink-0"
                />
                <p className="leading-snug">
                  Simulation test mode is the best option to experience the real
                  IELTS on computer.
                </p>
              </div>
              <div className="space-y-2">
                <p className="font-semibold text-blue-950">Test information</p>
                <p>Full tasks ({fullTestInfo})</p>
              </div>
              <div className="text-center mt-auto">
                <Controller
                  control={control}
                  name="testMode"
                  render={({ field: { onChange } }) => (
                    <Button
                      loading={loading || isSubmitted || isSubmitting}
                      type="primary"
                      htmlType="submit"
                      value={"simulation"}
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
