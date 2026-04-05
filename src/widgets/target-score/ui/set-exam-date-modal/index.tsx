import { DatePicker, Modal } from "antd";
import React, { ComponentProps, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useWidgetContext } from "../../context";
import { useAuth } from "@/appx/providers";
import dayjs, { Dayjs } from "dayjs";
import { createClient } from "~supabase/client";

type FormData = {
  examDate: Dayjs;
};

export const SetExamDateModal = ({
  ...props
}: ComponentProps<typeof Modal>) => {
  const {
    targetScore: { examDate },
    refetch,
  } = useWidgetContext();
  const { currentUser } = useAuth();
  const { control, getValues, reset } = useForm<FormData>();
  const [loading, setLoading] = useState(false);

  // When modal opens, pre-fill with existing exam date
  useEffect(() => {
    if (props.open) {
      reset({
        examDate: examDate ? dayjs(examDate) : undefined,
      });
    }
  }, [props.open, reset, examDate]);

  const handleOk = async (e: React.MouseEvent<HTMLButtonElement>) => {
    setLoading(true);
    try {
      const selectedDate = getValues("examDate");
      if (!selectedDate) return;

      // exam_date lives inside target_score JSONB — use postgres jsonb merge
      const ISODate = selectedDate.toISOString();
      const supabase = createClient();

      // Fetch current target_score first, then merge exam_date into it
      const { data: userData } = await supabase
        .from("users")
        .select("target_score")
        .eq("id", currentUser!.id)
        .single();

      const currentTs = (userData?.target_score as any) || {};
      const updatedTs = { ...currentTs, exam_date: ISODate };

      const { error } = await supabase
        .from("users")
        .update({ target_score: updatedTs })
        .eq("id", currentUser!.id);

      if (error) {
        console.error("Error updating exam date:", error);
        return;
      }

      await refetch();
      props.onOk?.(e);
    } catch (error) {
      console.error("Error updating exam date:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      {...props}
      onOk={handleOk}
      confirmLoading={loading || props.confirmLoading}
    >
      <div className="space-y-4 py-4">
        <h2 className="text-center text-xl md:text-3xl font-bold font-nunito">
          Exam Date
        </h2>
        <form className="flex -m-2 flex-wrap">
          <div className="p-2 w-full space-y-1">
            <Controller
              name="examDate"
              control={control}
              render={({ field }) => (
                <DatePicker
                  format={"DD/MM/YYYY"}
                  className="w-full"
                  minDate={dayjs()}
                  size="large"
                  {...field}
                />
              )}
            />
          </div>
        </form>
      </div>
    </Modal>
  );
};
