import { useMemo, useState } from "react";
import { SetExamDateModal } from "../set-exam-date-modal";
import { useWidgetContext } from "../../context";
import dayjs from "dayjs";

export const ExamDate = () => {
  const {
    targetScore: { examDate },
    loading,
    refetch,
  } = useWidgetContext();
  const [isSetExamDateDialogOpen, setIsSetExamDateDialogOpen] = useState(false);

  const parseDate = (date: string | null) => {
    const pad = (n: number) => ("0" + n).slice(-2);

    if (date) {
      const dayjsInstance = dayjs(date);
      const day = pad(dayjsInstance.date());
      const month = pad(dayjsInstance.month() + 1);
      const year = dayjsInstance.year();

      return `${day}/${month}/${year}`;
    }

    return "_ / _ / _";
  };

  const daysLeft = useMemo(() => {
    if (!examDate) return null;
    const days = dayjs(examDate).diff(dayjs(), "day");
    const sign = days >= 0 ? "" : "-";
    return `${sign}${Math.abs(days)} days left`;
  }, [examDate]);

  return (
    <div className="bg-white rounded-lg shadow-sm md:min-h-[200px]">
      <SetExamDateModal
        open={isSetExamDateDialogOpen}
        onCancel={() => setIsSetExamDateDialogOpen(false)}
        onOk={() => {
          setIsSetExamDateDialogOpen(false);
          refetch();
        }}
      />
      {/* Header */}
      <div className="py-3 px-4 flex items-center gap-2 border-b border-gray-200">
        <span className="material-symbols-rounded text-xl text-gray-700">
          calendar_month
        </span>
        <h3 className="font-bold text-base text-gray-900">Exam schedule</h3>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex flex-wrap gap-3">
          {/* Exam Date Card */}
          <div className="w-full md:w-[calc(50%-0.75rem)]">
            <button
              onClick={() => setIsSetExamDateDialogOpen(true)}
              className="w-full bg-white rounded-lg border border-gray-200 p-4 flex flex-col space-y-2 hover:border-gray-300 transition-colors cursor-pointer text-left"
            >
              <p className="text-xs font-medium text-gray-600">Exam date</p>
              <div className="flex justify-between items-center">
                <p className="text-3xl font-bold text-gray-900">
                  {loading ? parseDate(null) : parseDate(examDate)}
                </p>
                <span className="material-symbols-rounded text-gray-600 text-xl">
                  edit
                </span>
              </div>
            </button>
          </div>

          {/* Days Remaining Card */}
          <div className="w-full md:w-[calc(50%-0.75rem)]">
            <div className="w-full bg-white rounded-lg border border-gray-200 p-4 flex flex-col space-y-2">
              <p className="text-xs font-medium text-gray-600">
                Days remaining
              </p>
              <p className="text-3xl font-bold text-gray-900">
                {loading ? "_" : daysLeft || "_"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
