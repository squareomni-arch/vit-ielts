import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import dayjs from "dayjs";
import { ClassroomLayout } from "@/widgets/layouts";
import type { StudentAssignmentView } from "~services/types/classroom";
import { ROUTES } from "@/shared/routes";

type Props = { assignments: StudentAssignmentView[] };

const skillTint: Record<string, [string, string]> = {
  reading: ["#E8EFFE", "#2563EB"],
  listening: ["#F1EAFC", "#7C3AED"],
  writing: ["#E5F8EC", "#16A34A"],
  speaking: ["#FEF4E2", "#F59E0B"],
};
const skillPill: Record<string, string> = {
  reading: "bg-blue-50 text-blue-600",
  listening: "bg-purple-50 text-purple-600",
  writing: "bg-green-50 text-green-600",
  speaking: "bg-amber-50 text-amber-600",
};

const dueState = (a: StudentAssignmentView) => {
  if (a.status === "submitted" || a.status === "late")
    return { label: "Đã nộp", color: "#16A34A" };
  if (a.status === "overdue") return { label: "Quá hạn", color: "#D94A56" };
  if (a.in_progress) return { label: "Đang làm", color: "#2563EB" };
  if (!a.due_at) return { label: "Không có hạn", color: "#6A7282" };
  const days = dayjs(a.due_at).diff(dayjs(), "day");
  if (days <= 1) return { label: "Sắp đến hạn", color: "#F59E0B" };
  return { label: `Còn ${days} ngày`, color: "#16A34A" };
};

const Card = ({ a }: { a: StudentAssignmentView }) => {
  const [bg, fg] = skillTint[a.quiz_skill] ?? ["#F3F4F6", "#6A7282"];
  const ds = dueState(a);
  const done = a.status === "submitted" || a.status === "late";
  const overdue = a.status === "overdue";
  return (
    <div
      className={`flex flex-wrap items-center gap-4 rounded-[13px] border bg-white p-5 shadow-sm ${
        overdue ? "border-[#F3C6CA]" : "border-gray-100"
      }`}
    >
      <span
        className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-[12px]"
        style={{ background: bg }}
      >
        <span className="material-symbols-rounded text-[20px] leading-none" style={{ color: fg }}>
          assignment
        </span>
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[15px] font-bold text-[#191D24]">{a.quiz_title}</span>
          {a.quiz_skill ? (
            <span
              className={`rounded-full px-2.5 py-0.5 text-[12px] font-medium capitalize ${
                skillPill[a.quiz_skill] ?? "bg-gray-100 text-gray-600"
              }`}
            >
              {a.quiz_skill}
            </span>
          ) : null}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-[13px] text-[#6A7282]">
          <span className="inline-flex items-center gap-1">
            <span className="material-symbols-rounded text-[12px]">event</span>
            {a.due_at ? `Hạn: ${dayjs(a.due_at).format("DD/MM/YYYY HH:mm")}` : "Không có thời hạn nộp"}
          </span>
          {a.due_at || a.status !== "pending" ? (
            <span className="font-semibold" style={{ color: ds.color }}>
              {ds.label}
            </span>
          ) : null}
        </div>
        {a.note ? (
          <div className="mt-1 inline-flex items-center gap-1 text-[13px] text-[#6A7282]">
            <span className="material-symbols-rounded text-[12px]">schedule</span>
            {a.note}
          </div>
        ) : null}
      </div>
      {done ? (
        <Link
          href={a.test_result_id ? ROUTES.TEST_RESULT(a.test_result_id) : ROUTES.CLASSROOM.MY_ASSIGNMENT(a.assignment_id)}
          className="inline-flex items-center gap-1 whitespace-nowrap rounded-[10px] bg-[#16A34A] px-5 py-2.5 text-[14px] font-bold text-white hover:bg-[#138a3e]"
        >
          Xem kết quả →
        </Link>
      ) : (
        <Link
          href={ROUTES.CLASSROOM.MY_ASSIGNMENT(a.assignment_id)}
          className="inline-flex items-center gap-1 whitespace-nowrap rounded-[10px] bg-[#D94A56] px-5 py-2.5 text-[14px] font-bold text-white shadow-[0_4px_12px_0_rgba(217,74,87,0.25)] hover:bg-[#c8404b]"
        >
          {overdue ? "Nộp muộn →" : a.in_progress ? "Tiếp tục làm →" : "Bắt đầu làm →"}
        </Link>
      )}
    </div>
  );
};

export const PageMyAssignments = ({ assignments: all }: Props) => {
  const router = useRouter();
  const [filter, setFilter] = useState<
    "all" | "new" | "in_progress" | "submitted" | "overdue"
  >("all");

  const classId = typeof router.query.class === "string" ? router.query.class : null;
  const assignments = useMemo(
    () => (classId ? all.filter((a) => a.classroom_id === classId) : all),
    [all, classId]
  );

  const className = useMemo(() => {
    const names = [...new Set(assignments.map((a) => a.classroom_name).filter(Boolean))];
    return names.length === 1 ? names[0] : null;
  }, [assignments]);

  const filtered = assignments.filter((a) => {
    if (filter === "all") return true;
    if (filter === "new") return a.status === "pending" && !a.in_progress;
    if (filter === "in_progress")
      return a.in_progress && a.status !== "submitted" && a.status !== "late";
    if (filter === "submitted") return a.status === "submitted" || a.status === "late";
    return a.status === "overdue";
  });

  const pills = [
    ["all", `Tất cả (${assignments.length})`],
    ["new", "Mới"],
    ["in_progress", "Đang làm"],
    ["submitted", "Đã nộp"],
    ["overdue", "Quá hạn"],
  ] as const;

  return (
    <div className="space-y-5">
      <div>
        {classId ? (
          <Link
            href={ROUTES.CLASSROOM.MY_ASSIGNMENTS}
            className="mb-1 inline-flex items-center gap-1 text-sm text-[#6A7282] hover:text-[#D94A56]"
          >
            <span className="material-symbols-rounded text-[18px]">chevron_left</span>
            Tất cả lớp
          </Link>
        ) : null}
        <h2 className="text-2xl font-extrabold text-[#191D24]">Danh sách bài tập</h2>
        <p className="mt-2 text-sm text-[#6A7282]">
          {assignments.length} bài{className ? ` trong lớp ${className}` : ""}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {pills.map(([k, label]) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            className={`rounded-full px-4 py-1.5 text-[13px] font-bold ${
              filter === k ? "bg-[#D94A56] text-white" : "border border-[#E5E7EB] text-[#6A7282]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {assignments.length === 0 ? (
        <div className="flex flex-col items-center rounded-[13px] border border-gray-100 bg-white py-16 text-center shadow-sm">
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-[#FCE8EA]">
            <span className="material-symbols-rounded !text-[36px] leading-none text-[#D94A56]">
              assignment
            </span>
          </span>
          <p className="mt-5 text-xl font-bold text-[#191D24]">Chưa có bài tập nào</p>
          <Link
            href={ROUTES.CLASSROOM.LIST}
            className="mt-1 text-[14px] font-medium text-[#D94A56] hover:underline"
          >
            Tham gia một lớp để bắt đầu →
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <p className="py-10 text-center text-[#6A7282]">Không có bài tập phù hợp.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((a) => (
            <Card key={a.assignment_id} a={a} />
          ))}
        </div>
      )}
    </div>
  );
};

PageMyAssignments.Layout = ClassroomLayout;
