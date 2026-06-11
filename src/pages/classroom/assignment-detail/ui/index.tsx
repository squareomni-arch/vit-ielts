import Link from "next/link";
import dayjs from "dayjs";
import { AppShell } from "@/widgets/layouts";
import type { AssignmentDetail } from "~services/types/classroom";
import { ROUTES } from "@/shared/routes";

type Props = { detail: AssignmentDetail };

// ─── Helpers ──────────────────────────────────────────────────────────────────

const tints = ["#D94A56", "#2563EB", "#7C3AED", "#0EA5E9", "#16A34A", "#EA580C"];
const tintFor = (k: string) =>
  tints[[...k].reduce((a, c) => a + c.charCodeAt(0), 0) % tints.length];

const avatarInitials = (name: string) =>
  name
    .trim()
    .toUpperCase()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("") || "?";

const SKILL_PILL: Record<string, string> = {
  reading: "bg-blue-50 text-blue-600",
  listening: "bg-purple-50 text-purple-600",
  writing: "bg-green-50 text-green-600",
  speaking: "bg-amber-50 text-amber-600",
};

const skillPillCls = (skill: string) =>
  `rounded-full px-2.5 py-0.5 text-[12px] font-medium capitalize ${
    SKILL_PILL[skill] ?? "bg-gray-100 text-gray-600"
  }`;

// ─── Stat card ─────────────────────────────────────────────────────────────────

type StatCardProps = {
  icon: string;
  label: string;
  value: string;
  iconColor: string;
  iconBg: string;
};

const StatCard = ({ icon, label, value, iconColor, iconBg }: StatCardProps) => (
  <div className="flex items-center gap-4 rounded-[16px] border border-[#e7e9e4] bg-white px-5 py-[18px] shadow-[0_2px_4px_0_rgba(0,0,0,0.04)]">
    <span
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[11px]"
      style={{ background: iconBg }}
    >
      <span
        className="material-symbols-rounded text-[22px] leading-none"
        style={{ color: iconColor }}
      >
        {icon}
      </span>
    </span>
    <div>
      <p className="text-[13px] font-medium text-[#6a7282]">{label}</p>
      <p className="text-[28px] font-bold leading-tight text-[#191d24]">{value}</p>
    </div>
  </div>
);

// ─── Status badge ──────────────────────────────────────────────────────────────

const StatusBadge = ({ status }: { status: string }) => {
  if (status === "submitted" || status === "late") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f2fadd] px-2.5 py-1 text-[12px] font-bold text-[#219653]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#219653]" />
        Submitted
      </span>
    );
  }
  if (status === "pending_grade") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[12px] font-bold text-amber-600">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
        Pending grade
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-[12px] font-bold text-[#6a7282]">
      <span className="h-1.5 w-1.5 rounded-full bg-[#9ca3af]" />
      Not submitted
    </span>
  );
};

// ─── Score badge ───────────────────────────────────────────────────────────────

const ScoreBadge = ({ score }: { score: number | null }) => {
  if (score == null)
    return <span className="text-[15px] text-[#9ca3af]">—</span>;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f2fadd] px-2.5 py-1 text-[13px] font-bold text-[#219653]">
      <span className="h-1.5 w-1.5 rounded-full bg-[#219653]" />
      Band {score}
    </span>
  );
};

// ─── Table column widths ───────────────────────────────────────────────────────

const COL = "grid grid-cols-[1fr_150px_130px_100px_140px_120px] items-center gap-3";

// ─── Page ─────────────────────────────────────────────────────────────────────

export const PageAssignmentDetail = ({ detail }: Props) => {
  const isOpen = !detail.due_at || dayjs(detail.due_at).isAfter(dayjs());

  const pendingGradeCount = detail.rows.filter((r) => {
    // Writing/speaking need manual grading; approximate by "submitted but no score"
    return (r.status === "submitted" || r.status === "late") && r.score == null;
  }).length;

  const avgTimeMin =
    detail.rows.length > 0
      ? Math.round(
          detail.rows
            .filter((r) => r.duration_min != null)
            .reduce((sum, r) => sum + (r.duration_min ?? 0), 0) /
            Math.max(
              1,
              detail.rows.filter((r) => r.duration_min != null).length
            )
        )
      : null;

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
    <div className="space-y-[24px]">
      {/* ── Top bar ── */}
      <div>
        <h1 className="font-display font-bold text-[26px] tracking-[-0.52px] text-[#191d24] leading-none">
          Assignment
        </h1>
        <p className="mt-[6px] font-inter font-normal text-[15px] text-[#6a7282]">
          Submissions and results for this assignment.
        </p>
      </div>

      {/* ── Back link ── */}
      <Link
        href={`${ROUTES.CLASSROOM.DETAIL(detail.classroom_id)}?tab=assignments`}
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#6a7282] hover:text-[#191d24] transition-colors"
      >
        <span className="material-symbols-rounded text-[16px]">arrow_back</span>
        Back to assignments
      </Link>

      {/* ── Assignment header card ── */}
      <div className="rounded-[20px] border border-[#e7e9e4] bg-white px-6 py-5 shadow-[0_2px_4px_0_rgba(0,0,0,0.04)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          {/* Left: skill, status, title, meta */}
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-center gap-2">
              {detail.quiz_skill ? (
                <span className={skillPillCls(detail.quiz_skill)}>
                  {detail.quiz_skill.charAt(0).toUpperCase() + detail.quiz_skill.slice(1)}
                </span>
              ) : null}
              {isOpen ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f2fadd] px-2.5 py-0.5 text-[12px] font-bold text-[#219653]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#219653]" />
                  Open
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-0.5 text-[12px] font-bold text-[#6a7282]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#9ca3af]" />
                  Closed
                </span>
              )}
            </div>
            <h2 className="font-display font-bold text-[22px] text-[#191d24] truncate">
              {detail.quiz_title}
            </h2>
            <p className="mt-1 text-[13px] text-[#6a7282]">
              {detail.classroom_name}
              {detail.due_at
                ? ` · Due ${dayjs(detail.due_at).format("DD/MM/YYYY HH:mm")}`
                : ""}
            </p>
          </div>

          {/* Right: Edit + Close buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button className="inline-flex items-center gap-1.5 rounded-full border border-[#e7e9e4] bg-white px-4 py-2.5 text-[14px] font-bold text-[#191d24] hover:bg-[#f6f7f4] transition-colors">
              <span className="material-symbols-rounded text-[16px]">edit</span>
              Edit
            </button>
            <button className="rounded-full border border-[#e7e9e4] bg-white px-4 py-2.5 text-[14px] font-bold text-[#191d24] hover:bg-[#f6f7f4] transition-colors">
              Close assignment
            </button>
          </div>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon="check_circle"
          label="Submitted"
          value={`${detail.submitted} / ${detail.total}`}
          iconColor="#219653"
          iconBg="rgba(33,150,83,0.10)"
        />
        <StatCard
          icon="trending_up"
          label="Avg band"
          value={detail.avg_band != null ? String(detail.avg_band) : "—"}
          iconColor="#8b5cf6"
          iconBg="rgba(139,92,246,0.10)"
        />
        <StatCard
          icon="timer"
          label="Avg time"
          value={avgTimeMin != null ? `${avgTimeMin} min` : "—"}
          iconColor="#0ea5e9"
          iconBg="rgba(14,165,233,0.10)"
        />
        <StatCard
          icon="warning"
          label="Pending grade"
          value={String(pendingGradeCount)}
          iconColor="#ea580c"
          iconBg="rgba(234,88,12,0.10)"
        />

      </div>

      {/* ── Submissions table ── */}
      <div className="rounded-[20px] border border-[#e7e9e4] bg-white shadow-[0_2px_4px_0_rgba(0,0,0,0.04)] overflow-hidden">
        {/* Table header */}
        <div className="border-b border-[#e7e9e4] px-6 py-4">
          <h3 className="font-display font-bold text-[16px] text-[#191d24]">Submissions</h3>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[860px]">
            {/* Column headers */}
            <div
              className={`${COL} border-b border-[#e7e9e4] bg-[#fafafa] px-6 py-3 text-[11px] font-bold uppercase tracking-[0.06em] text-[#9ca3af]`}
            >
              <span>Student</span>
              <span>Status</span>
              <span>Score</span>
              <span>Time</span>
              <span>Submitted</span>
              <span />
            </div>

            {/* Rows */}
            {detail.rows.length === 0 ? (
              <p className="px-6 py-10 text-center text-[14px] text-[#6a7282]">
                No students in this assignment yet.
              </p>
            ) : (
              detail.rows.map((r) => {
                const initials = avatarInitials(r.name || r.email || "?");
                const tint = tintFor(r.student_id);
                const done = r.status === "submitted" || r.status === "late";
                const needsGrade = done && r.score == null;
                const notSubmitted =
                  r.status === "pending" || r.status === "overdue";

                return (
                  <div
                    key={r.student_id}
                    className={`${COL} border-b border-[#f3f4f6] px-6 py-4 last:border-0`}
                  >
                    {/* Student cell */}
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[13px] font-bold"
                        style={{ background: `${tint}1A`, color: tint }}
                      >
                        {initials}
                      </span>
                      <span className="truncate text-[14px] font-semibold text-[#191d24]">
                        {r.name || r.email}
                      </span>
                    </div>

                    {/* Status */}
                    <div>
                      <StatusBadge status={r.status} />
                    </div>

                    {/* Score */}
                    <div>
                      <ScoreBadge score={r.score} />
                    </div>

                    {/* Time */}
                    <span className="text-[14px] text-[#6a7282]">
                      {r.duration_min != null ? `${r.duration_min} min` : "—"}
                    </span>

                    {/* Submitted at */}
                    <span className="text-[14px] text-[#6a7282]">
                      {r.submitted_at
                        ? dayjs(r.submitted_at).format("DD/MM HH:mm")
                        : "—"}
                    </span>

                    {/* Action */}
                    <div className="flex justify-end">
                      {needsGrade ? (
                        r.test_result_id ? (
                          <Link
                            href={ROUTES.TEST_RESULT(r.test_result_id)}
                            className="rounded-full bg-[#b3e653] px-4 py-1.5 text-[13px] font-bold text-[#191d24] hover:bg-[#9ad534] transition-colors"
                          >
                            Grade
                          </Link>
                        ) : (
                          <span className="rounded-full bg-[#f2fadd] px-4 py-1.5 text-[13px] font-bold text-[#219653] opacity-50 cursor-not-allowed">
                            Grade
                          </span>
                        )
                      ) : done ? (
                        r.test_result_id ? (
                          <Link
                            href={ROUTES.TEST_RESULT(r.test_result_id)}
                            className="text-[13px] font-bold text-[#5281f9] hover:underline"
                          >
                            View
                          </Link>
                        ) : (
                          <Link
                            href={ROUTES.CLASSROOM.STUDENT_HISTORY(
                              detail.classroom_id,
                              r.student_id
                            )}
                            className="text-[13px] font-bold text-[#5281f9] hover:underline"
                          >
                            View
                          </Link>
                        )
                      ) : notSubmitted ? (
                        <button className="rounded-full border border-[#e7e9e4] bg-white px-4 py-1.5 text-[13px] font-bold text-[#6a7282] hover:bg-[#f6f7f4] transition-colors">
                          Remind
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Table footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e7e9e4] bg-[#fafafa] px-6 py-4 text-[13px] text-[#6a7282]">
          <div className="flex flex-wrap gap-x-5 gap-y-1">
            <span>
              {detail.submitted}/{detail.total} submitted
            </span>
            <span>Avg band: {detail.avg_band ?? "—"}</span>
            {detail.high_band != null && (
              <span>Highest: Band {detail.high_band}</span>
            )}
            {detail.low_band != null && (
              <span>Lowest: Band {detail.low_band}</span>
            )}
          </div>
          <button
            onClick={exportCsv}
            disabled={detail.rows.length === 0}
            className="inline-flex items-center gap-2 rounded-full border border-[#e7e9e4] bg-white px-4 py-2 text-[13px] font-semibold text-[#374151] hover:bg-[#f6f7f4] disabled:opacity-50 transition-colors"
          >
            <span className="material-symbols-rounded text-[16px]">download</span>
            Export report
          </button>
        </div>
      </div>
    </div>
  );
};

PageAssignmentDetail.Layout = AppShell;
