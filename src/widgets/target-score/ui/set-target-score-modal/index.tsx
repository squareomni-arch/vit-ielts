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
  const { control, watch, reset, setValue } = useForm<FormData>();
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
    const overall = (reading + listening + speaking + writing) / 4;
    setOverallScore(overall.toFixed(1));
  }, [values]);

  useEffect(() => {
    reset();
  }, [props.open, reset]);

  const handleOk = async (e: React.MouseEvent<HTMLButtonElement>) => {
    setLoading(true);
    try {
      const supabase = createClient();
      await supabase
        .from("users")
        .update({
          target_score: {
            listening: values.listening,
            reading: values.reading,
            speaking: values.speaking,
            writing: values.writing,
          },
        })
        .eq("id", currentUser!.id);

      await refetch();
      props.onOk?.(e);
    } catch (error) {
      console.error("Error updating target score:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setValue("listening", targetScore.listening || 7);
    setValue("reading", targetScore.reading || 7);
    setValue("speaking", targetScore.speaking || 7);
    setValue("writing", targetScore.writing || 7);
  }, [props.open, setValue, targetScore]);

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
