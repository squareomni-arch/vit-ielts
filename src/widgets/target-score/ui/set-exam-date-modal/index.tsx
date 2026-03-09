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
  const { control, getValues, reset, setValue } = useForm<FormData>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    reset();
  }, [props.open, reset]);

  const handleOk = async (e: React.MouseEvent<HTMLButtonElement>) => {
    setLoading(true);
    try {
      const ISODate = getValues("examDate").add(1, "day").toISOString();
      const supabase = createClient();
      await supabase
        .from("users")
        .update({ exam_date: ISODate })
        .eq("id", currentUser!.id);

      await refetch();
      props.onOk?.(e);
    } catch (error) {
      console.error("Error updating exam date:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (examDate) {
      setValue("examDate", dayjs(examDate));
    }
  }, [props.open, setValue, examDate]);

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
