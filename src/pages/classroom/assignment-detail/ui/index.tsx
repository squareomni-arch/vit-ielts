import Link from "next/link";
import { Avatar } from "antd";
import dayjs from "dayjs";
import { ClassroomLayout } from "@/widgets/layouts";
import type { AssignmentDetail } from "~services/types/classroom";
import { ROUTES } from "@/shared/routes";

type Props = { detail: AssignmentDetail };

const tints = ["#D94A56", "#2563EB", "#7C3AED", "#0EA5E9", "#16A34A", "#EA580C"];
const tintFor = (k: string) => tints[[...k].reduce((a, c) => a + c.charCodeAt(0), 0) % tints.length];
const skillPill: Record<string, string> = {
  reading: "bg-blue-50 text-blue-600",
  listening: "bg-purple-50 text-purple-600",
  writing: "bg-green-50 text-green-600",
  speaking: "bg-amber-50 text-amber-600",
};

const StatCard = ({
  icon,
  label,
  value,
  tint,
}: {
  icon: string;
  label: string;
  value: string;
  tint: string;
}) => (
  <div className="flex items-center gap-[14px] rounded-[13px] border border-[#E5E7EB] bg-white px-5 py-[18px] shadow-[0_2px_6px_0_rgba(0,0,0,0.04)]">
    <span
      className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[10px]"
      style={{ background: `${tint}1A` }}
    >
      <span className="material-symbols-rounded text-[22px] leading-none" style={{ color: tint }}>
        {icon}
      </span>
    </span>
    <div className="flex flex-col gap-1">
      <span className="text-[13px] font-medium text-[#6A7282]">{label}</span>
      <span className="text-[28px] font-bold leading-none text-[#191D24]">{value}</span>
    </div>
  </div>
);

const ROW_GRID = "grid grid-cols-[1fr_130px_120px_160px_140px] items-center gap-3";

export const PageAssignmentDetail = ({ detail }: Props) => {
  const exportCsv = () => {
    const header = ["Học sinh", "Email", "Thời gian làm (phút)", "Band", "Ngày nộp", "Trạng thái"];
    const lines = detail.rows.map((r) =>
      [
        r.name || "",
        r.email,
        r.duration_min ?? "",
        r.score ?? "",
        r.submitted_at ? dayjs(r.submitted_at).format("DD/MM/YYYY HH:mm") : "",
        r.status === "pending" || r.status === "overdue" ? "Chưa nộp" : "Đã nộp",
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    );
    const csv = [header.map((h) => `"${h}"`).join(","), ...lines].join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${detail.quiz_title}-ket-qua.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <Link
        href={`${ROUTES.CLASSROOM.DETAIL(detail.classroom_id)}?tab=assignments`}
        className="inline-flex items-center gap-1 text-sm text-[#6A7282] hover:text-[#D94A56]"
      >
        <span className="material-symbols-rounded text-[18px]">arrow_back</span>
        Quay lại danh sách bài giao
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold text-[#191D24]">
            {detail.classroom_name} — Kết quả làm bài
          </h2>
          <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-[#6A7282]">
            <span className="h-2 w-2 rounded-full bg-[#16A34A]" />
            Điểm số cập nhật tự động khi học sinh nộp bài
          </p>
        </div>
        <Link href={`${ROUTES.CLASSROOM.DETAIL(detail.classroom_id)}?tab=assignments`}>
          <button className="rounded-[10px] bg-[#D94A56] px-5 py-2.5 text-[15px] font-bold text-white shadow-[0_4px_12px_0_rgba(217,74,87,0.25)] hover:bg-[#c8404b]">
            + Giao bài mới
          </button>
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon="group" label="Tổng học sinh" value={String(detail.total)} tint="#F59E0B" />
        <StatCard icon="task_alt" label="Đã nộp" value={String(detail.submitted)} tint="#16A34A" />
        <StatCard icon="grade" label="Điểm trung bình" value={detail.avg_band != null ? String(detail.avg_band) : "—"} tint="#2563EB" />
        <StatCard icon="percent" label="Tỷ lệ nộp" value={`${detail.submit_rate}%`} tint="#8B5CF6" />
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-2 rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-700">
        <span className="material-symbols-rounded text-[18px]">info</span>
        <span>
          Điểm số Reading &amp; Listening được đồng bộ tự động ngay khi học sinh nhấn &quot;Nộp
          bài&quot;. Cột kết quả sẽ cập nhật theo thời gian thực.
        </span>
      </div>

      {/* Results table */}
      <div className="rounded-[13px] border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-[#191D24]">
              Danh sách bài giao · {detail.quiz_title}
            </h3>
            {detail.quiz_skill ? (
              <span
                className={`rounded-full px-2.5 py-0.5 text-[12px] font-medium capitalize ${
                  skillPill[detail.quiz_skill] ?? "bg-gray-100 text-gray-600"
                }`}
              >
                {detail.quiz_skill}
              </span>
            ) : null}
          </div>
          <span className="inline-flex items-center gap-1 text-[13px] font-medium text-[#16A34A]">
            <span className="material-symbols-rounded text-[16px]">autorenew</span>
            Tự động cập nhật
          </span>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[760px]">
            <div className={`${ROW_GRID} border-b border-[#E5E7EB] px-2 pb-3 text-[11px] font-bold uppercase tracking-[0.06em] text-[#9CA3AF]`}>
              <span>Học sinh</span>
              <span>Thời gian làm</span>
              <span>Band / Điểm</span>
              <span>Ngày nộp</span>
              <span>Trạng thái</span>
            </div>
            {detail.rows.map((r) => {
              const done = r.status === "submitted" || r.status === "late";
              return (
                <div key={r.student_id} className={`${ROW_GRID} border-b border-[#F3F4F6] px-2 py-4 last:border-0`}>
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar size="small" style={{ background: tintFor(r.student_id) }} src={r.avatar_url || undefined}>
                      {(r.name || r.email || "?").charAt(0).toUpperCase()}
                    </Avatar>
                    <div className="min-w-0">
                      <div className="truncate font-bold text-[#191D24]">{r.name || r.email}</div>
                      <Link
                        href={ROUTES.CLASSROOM.STUDENT_HISTORY(detail.classroom_id, r.student_id)}
                        className="text-[12px] font-medium text-[#D94A56] hover:underline"
                      >
                        Xem lịch sử làm bài →
                      </Link>
                    </div>
                  </div>
                  <div className="text-[14px] text-[#191D24]">
                    {r.duration_min != null ? `${r.duration_min} phút` : "—"}
                  </div>
                  <div className="text-[15px] font-bold" style={{ color: r.score != null ? "#D94A56" : "#C7CBD1" }}>
                    {r.score != null ? r.score : "—"}
                  </div>
                  <div className="text-[14px] text-[#6A7282]">
                    {r.submitted_at ? dayjs(r.submitted_at).format("DD/MM HH:mm") : "Chưa nộp"}
                  </div>
                  <div>
                    {done ? (
                      <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#16A34A]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#16A34A]" /> Đã nộp
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#D94A56]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#D94A56]" /> Chưa nộp
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            {detail.rows.length === 0 ? (
              <p className="px-2 py-8 text-center text-[14px] text-[#6A7282]">
                Chưa có học sinh nào trong nhóm được giao.
              </p>
            ) : null}
          </div>
        </div>

        {/* Footer summary */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#F3F4F6] pt-4 text-[13px] text-[#6A7282]">
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <span>
              {detail.submitted}/{detail.total} học sinh đã nộp
            </span>
            <span>Band trung bình: {detail.avg_band ?? "—"}</span>
            <span>Cao nhất: {detail.high_band != null ? `Band ${detail.high_band}` : "—"}</span>
            <span>Thấp nhất: {detail.low_band != null ? `Band ${detail.low_band}` : "—"}</span>
          </div>
          <button
            onClick={exportCsv}
            disabled={detail.rows.length === 0}
            className="inline-flex items-center gap-2 rounded-[10px] border border-[#E5E7EB] px-4 py-2 text-[14px] font-semibold text-[#374151] hover:bg-gray-50 disabled:opacity-50"
          >
            <span className="material-symbols-rounded text-[18px]">download</span>
            Xuất báo cáo
          </button>
        </div>
      </div>
    </div>
  );
};

PageAssignmentDetail.Layout = ClassroomLayout;
