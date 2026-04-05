import { useMemo, useState } from "react";
import { useWidgetContext } from "../../context";
import { SetTargetScoreModal } from "@/widgets/target-score/ui";
import _ from "lodash";

export const DetailScore = () => {
  const [isSetTargetScoreDialogOpen, setIsSetTargetScoreDialogOpen] =
    useState(false);
  const { targetScore, loading, refetch } = useWidgetContext();

  const overallScore = useMemo(() => {
    if (
      targetScore.listening == null ||
      targetScore.reading == null ||
      targetScore.speaking == null ||
      targetScore.writing == null
    ) {
      return "_";
    }

    return (
      (Number(targetScore.listening) +
        Number(targetScore.reading) +
        Number(targetScore.speaking) +
        Number(targetScore.writing)) /
      4
    ).toFixed(1);
  }, [targetScore]);

  return (
    <div className="bg-white rounded-lg shadow-sm md:min-h-[200px]">
      <SetTargetScoreModal
        open={isSetTargetScoreDialogOpen}
        onCancel={() => setIsSetTargetScoreDialogOpen(false)}
        onOk={() => {
          setIsSetTargetScoreDialogOpen(false);
          refetch();
        }}
      />
      {/* Header */}
      <div className="py-3 px-4 flex items-center gap-2 border-b border-gray-200">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={20}
          height={20}
          viewBox="0 0 16 16"
          fill="none"
          className="text-gray-700"
        >
          <path
            d="M11.3346 8C11.3346 9.84095 9.84225 11.3333 8.0013 11.3333C6.16035 11.3333 4.66797 9.84095 4.66797 8C4.66797 6.15906 6.16035 4.66667 8.0013 4.66667"
            stroke="currentColor"
            strokeLinecap="round"
          />
          <path
            d="M9.33398 1.46669C8.90317 1.37924 8.45727 1.33334 8.00065 1.33334C4.31875 1.33334 1.33398 4.3181 1.33398 8C1.33398 11.6819 4.31875 14.6667 8.00065 14.6667C11.6825 14.6667 14.6673 11.6819 14.6673 8C14.6673 7.54338 14.6214 7.09748 14.534 6.66667"
            stroke="currentColor"
            strokeLinecap="round"
          />
          <path
            d="M11.0688 4.93125L8 8M11.0688 4.93125L10.8521 4.10086C10.688 3.47181 10.9126 2.7461 11.4324 2.2263L12.1987 1.46004C12.4027 1.25601 12.7186 1.30646 12.783 1.55338L13.1273 2.87275L14.4466 3.21699C14.6935 3.28141 14.744 3.59728 14.54 3.80131L13.7737 4.56757C13.2539 5.08737 12.5282 5.31204 11.8991 5.14791L11.0688 4.93125Z"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <h3 className="font-bold text-base text-gray-900">
          My IELTS score target
        </h3>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex flex-wrap gap-2">
          {/* Overall Score Card */}
          <div className="w-full md:w-[calc(20%-0.4rem)]">
            <button
              type="button"
              onClick={() => setIsSetTargetScoreDialogOpen(true)}
              className="w-full bg-red-50 rounded-lg p-4 flex flex-col space-y-2 hover:bg-red-100 transition-colors cursor-pointer text-left whitespace-nowrap"
              style={{
                backgroundColor: "rgba(217, 74, 86, 0.1)",
              }}
            >
              <p className="text-xs font-medium text-gray-600">Overall score</p>
              <div className="flex justify-between items-center">
                <p className="text-4xl font-bold" style={{ color: "#d94a56" }}>
                  {loading ? "_" : overallScore}
                </p>
                <span className="material-symbols-rounded text-gray-600 text-xl">
                  edit
                </span>
              </div>
            </button>
          </div>

          {/* Section Cards */}
          {["Listening", "Reading", "speaking", "Writing"].map(
            (item, index) => (
              <div key={index} className="w-full md:w-[calc(20%-0.4rem)]">
                <button
                  onClick={() => setIsSetTargetScoreDialogOpen(true)}
                  className="w-full bg-white rounded-lg border border-gray-200 p-4 flex flex-col space-y-2 hover:border-gray-300 transition-colors cursor-pointer text-left"
                >
                  <p className="text-xs font-medium text-gray-600">
                    {_.capitalize(item)}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {loading
                      ? "_"
                      : targetScore[item.toLowerCase() as keyof typeof targetScore] != null
                        ? Number(targetScore[item.toLowerCase() as keyof typeof targetScore]).toFixed(1)
                        : "_"}
                  </p>
                </button>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};
