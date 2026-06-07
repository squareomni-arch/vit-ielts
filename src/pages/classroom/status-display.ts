import type { SubmissionStatus } from "~services/types/classroom";

/** Vietnamese label + antd Tag color for each derived submission status. */
export const STATUS_META: Record<
  SubmissionStatus,
  { label: string; color: string }
> = {
  submitted: { label: "Đã nộp", color: "green" },
  late: { label: "Nộp muộn", color: "orange" },
  overdue: { label: "Quá hạn", color: "red" },
  pending: { label: "Chưa nộp", color: "default" },
};
