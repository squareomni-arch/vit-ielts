import { Modal, Select } from "antd";
import React, { ComponentProps, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useWidgetContext } from "../../context";
import { useAuth } from "@/appx/providers";
import { createClient } from "~supabase/client";

type FormData = {
  reading: number;
  listening: number;
  speaking: number;
  writing: number;
};

export const SetTargetScoreModal = ({
  ...props
}: ComponentProps<typeof Modal>) => {
  const { targetScore, refetch } = useWidgetContext();
  const { currentUser } = useAuth();
  const [overallScore, setOverallScore] = useState<string>();
  const { control, watch, reset, getValues } = useForm<FormData>({
    defaultValues: {
      listening: 7.0,
      reading: 7.0,
      speaking: 7.0,
      writing: 7.0,
    },
  });
  const [loading, setLoading] = useState(false);

  const scoreOptions = Array.from({ length: 17 }, (_, i) => {
    const value = (i + 2) * 0.5;
    return {
      value,
      label: value.toFixed(1),
    };
  });

  const values = watch();

  useEffect(() => {
    const { reading, listening, speaking, writing } = values;
    if (reading && listening && speaking && writing) {
      const overall = (Number(reading) + Number(listening) + Number(speaking) + Number(writing)) / 4;
      setOverallScore(overall.toFixed(1));
    } else {
      setOverallScore("0.0");
    }
  }, [values]);

  const handleOk = async (e: React.MouseEvent<HTMLButtonElement>) => {
    setLoading(true);
    try {
      const currentValues = getValues();
      const payload = {
        listening: currentValues.listening != null ? Number(currentValues.listening) : 7.0,
        reading: currentValues.reading != null ? Number(currentValues.reading) : 7.0,
        speaking: currentValues.speaking != null ? Number(currentValues.speaking) : 7.0,
        writing: currentValues.writing != null ? Number(currentValues.writing) : 7.0,
      };

      const supabase = createClient();
      const { error } = await supabase
        .from("users")
        .update({ target_score: payload })
        .eq("id", currentUser!.id);

      if (error) {
        console.error("Supabase update error:", error);
        Modal.error({
          title: "Update Failed",
          content: error.message || "Could not update target score.",
        });
        return;
      }

      await refetch();
      props.onOk?.(e);
    } catch (error) {
      console.error("Error updating target score:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (props.open) {
      reset({
        listening: targetScore.listening != null ? Number(targetScore.listening) : 7.0,
        reading: targetScore.reading != null ? Number(targetScore.reading) : 7.0,
        speaking: targetScore.speaking != null ? Number(targetScore.speaking) : 7.0,
        writing: targetScore.writing != null ? Number(targetScore.writing) : 7.0,
      });
    }
  }, [props.open, reset, targetScore]);

  return (
    <Modal
      {...props}
      onOk={handleOk}
      confirmLoading={loading || props.confirmLoading}
    >
      <div className="space-y-4 py-4">
        <h2 className="text-center text-xl md:text-3xl font-bold font-nunito">
          Desired IELTS score
        </h2>
        <form className="flex -m-2 flex-wrap">
          <div className="p-2 w-1/2 space-y-1">
            <label htmlFor="reading" className="font-medium block">
              Reading
            </label>
            <Controller
              name="reading"
              control={control}
              render={({ field }) => (
                <Select
                  style={{ width: "100%" }}
                  {...field}
                  options={scoreOptions}
                />
              )}
            />
          </div>
          <div className="p-2 w-1/2 space-y-1">
            <label htmlFor="listening" className="font-medium block">
              Listening
            </label>
            <Controller
              name="listening"
              control={control}
              render={({ field }) => (
                <Select
                  style={{ width: "100%" }}
                  {...field}
                  options={scoreOptions}
                />
              )}
            />
          </div>
          <div className="p-2 w-1/2 space-y-1">
            <label htmlFor="writing" className="font-medium block">
              Writing
            </label>
            <Controller
              name="writing"
              control={control}
              render={({ field }) => (
                <Select
                  style={{ width: "100%" }}
                  {...field}
                  options={scoreOptions}
                />
              )}
            />
          </div>
          <div className="p-2 w-1/2 space-y-1">
            <label htmlFor="speaking" className="font-medium block">
              Speaking
            </label>
            <Controller
              name="speaking"
              control={control}
              render={({ field }) => (
                <Select
                  style={{ width: "100%" }}
                  {...field}
                  options={scoreOptions}
                />
              )}
            />
          </div>
          <div className="p-2 w-full">
            <div className="border-b border-neutral-200"></div>
          </div>
        </form>
        <div className="text-xl font-bold font-nunito pt-4 text-neutral-500 flex justify-between items-center">
          <p>Overall Score:</p>
          <p className="text-2xl text-primary">{overallScore}/9.0</p>
        </div>
      </div>
    </Modal>
  );
};
