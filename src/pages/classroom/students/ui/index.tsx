import dayjs from "dayjs";
import { AppShell } from "@/widgets/layouts";
import type { AssignmentDetail, AssignmentResultRow, AssignmentWithStats, SubmissionStatus } from "~services/types/classroom";

// ─── Types ────────────────────────────────────────────────────────────────────

export type PageClassroomStudentsProps = {
  /** The "most active" class name, e.g. "IELTS May" — derived from classroomName */
  classroomName: string;
  /** Latest assignment for the class (or null if none) */
  detail: AssignmentDetail | null;
  /** All assignments for the class (for future tab nav; unused visually today) */
  assignments: AssignmentWithStats[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const AVATAR_TINTS = [
  "#D94A56", "#2563EB", "#7C3AED", "#0EA5E9",
  "#16A34A", "#EA580C", "#0891B2", "#9333EA",
];

function tintFor(key: string): string {
  const code = [...key].reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_TINTS[code % AVATAR_TINTS.length];
}

function initials(name: string | null | undefined, email: string): string {
  const src = name?.trim() || email;
  return src
    .toUpperCase()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("") || "?";
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface StatCardProps {
  iconMaterial: string;
  iconColor: string;
  iconBg: string;
  label: string;
  value: string;
  sub: string;
}

function StatCard({ iconMaterial, iconColor, iconBg, label, value, sub }: StatCardProps) {
  return (
    <div className="flex items-center gap-4 rounded-[16px] border border-[#E5E6E8] bg-white px-5 py-[18px] shadow-[0_2px_4px_0_rgba(0,0,0,0.04)]">
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[11px]"
        style={{ background: iconBg }}
      >
        <span
          className="material-symbols-rounded text-[22px] leading-none"
          style={{ color: iconColor }}
        >
          {iconMaterial}
        </span>
      </span>
      <div className="min-w-0">
        <p className="font-inter text-[11px] font-semibold uppercase tracking-[0.06em] text-[#6A7282]">
          {label}
        </p>
        <p className="font-display text-[28px] font-bold leading-tight text-[#191D24]">
          {value}
        </p>
        <p className="font-inter text-[13px] text-[#6A7282]">{sub}</p>
      </div>
    </div>
  );
}

function BandBadge({ score }: { score: number | null }) {
  if (score == null) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-bold bg-[#F3F4F6] text-[#9CA3AF]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#D1D5DB]" />
        —
      </span>
    );
  }
  // Band colour tiers: ≥7.5 green, ≥6 amber, <6 red
  const isHigh = score >= 7.5;
  const isMid = score >= 6 && score < 7.5;
  if (isHigh) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F2FADD] px-2.5 py-1 text-[12px] font-bold text-[#219653]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#219653]" />
        Band {score}
      </span>
    );
  }
  if (isMid) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[12px] font-bold text-amber-600">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
        Band {score}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-[12px] font-bold text-[#D94A56]">
      <span className="h-1.5 w-1.5 rounded-full bg-[#D94A56]" />
      Band {score}
    </span>
  );
}

function StatusPill({ status }: { status: SubmissionStatus }) {
  if (status === "submitted" || status === "late") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F2FADD] px-2.5 py-1 text-[12px] font-bold text-[#219653]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#219653]" />
        Submitted
      </span>
    );
  }
  if (status === "overdue") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-[12px] font-bold text-[#D94A56]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#D94A56]" />
        Overdue
      </span>
    );
  }
  // pending
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[12px] font-bold text-amber-600">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
      Pending
    </span>
  );
}

// ─── Export CSV helper ────────────────────────────────────────────────────────

function exportScoresCsv(quizTitle: string, rows: AssignmentResultRow[]) {
  const header = ["Student", "Email", "Time (min)", "Band", "Submitted", "Status"];
  const lines = rows.map((r) =>
    [
      r.name || "",
      r.email,
      r.duration_min ?? "",
      r.score ?? "",
      r.submitted_at ? dayjs(r.submitted_at).format("DD/MM/YYYY HH:mm") : "",
      r.status === "submitted" || r.status === "late" ? "Submitted" : "Pending",
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(",")
  );
  const csv = [header.map((h) => `"${h}"`).join(","), ...lines].join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${quizTitle}-scores.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Column grid class ────────────────────────────────────────────────────────
// STUDENT | TIME SPENT | CORRECT | BAND SCORE | SUBMITTED | STATUS
const COL = "grid grid-cols-[1fr_120px_100px_130px_140px_120px] items-center";

// ─── Page ─────────────────────────────────────────────────────────────────────

export function PageClassroomStudents({
  classroomName,
  detail,
}: PageClassroomStudentsProps) {
  const hasData = detail !== null && detail.rows.length > 0;

  // Stat values
  const totalStudents = detail?.total ?? 0;
  const submitted = detail?.submitted ?? 0;
  const avgBand = detail?.avg_band;
  const submitRate = detail?.submit_rate ?? 0;
  const notSubmitted = totalStudents - submitted;

  const exportDisabled = !detail || detail.rows.length === 0;

  return (
    <div className="space-y-[24px]">
      {/* ── Top bar ── */}
      <div>
        <h1 className="font-display font-bold text-[26px] tracking-[-0.52px] text-[#191D24] leading-none">
          Class tracking
        </h1>
        <p className="mt-[6px] font-inter font-normal text-[15px] text-[#6A7282]">
          Scores sync automatically from completed attempts.
        </p>
      </div>

      {/* ── Sub-heading row ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-[20px] tracking-[-0.4px] text-[#191D24]">
            {classroomName ? `${classroomName} — Results` : "Results"}
          </h2>
          <p className="mt-1 font-inter text-[13px] text-[#6A7282]">
            Reading &amp; Listening scores update the moment students submit.
          </p>
        </div>
        {/* Auto-synced + Sync now chips */}
        <div className="flex shrink-0 items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E5E6E8] bg-white px-3 py-1.5 text-[13px] font-semibold text-[#219653]">
            <span className="material-symbols-rounded text-[14px]">sync</span>
            Auto-synced
          </span>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-full border border-[#E5E6E8] bg-white px-4 py-2 text-[13px] font-semibold text-[#191D24] hover:bg-[#F6F7F4] transition-colors"
          >
            <span className="material-symbols-rounded text-[14px]">sync</span>
            Sync now
          </button>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          iconMaterial="group"
          iconColor="#219653"
          iconBg="rgba(33,150,83,0.10)"
          label="Total students"
          value={String(totalStudents)}
          sub="In class"
        />
        <StatCard
          iconMaterial="check_circle"
          iconColor="#219653"
          iconBg="rgba(33,150,83,0.10)"
          label="Submitted"
          value={String(submitted)}
          sub={totalStudents > 0 ? `${submitRate}% rate` : "0% rate"}
        />
        <StatCard
          iconMaterial="bar_chart"
          iconColor="#7C6EF9"
          iconBg="rgba(124,110,249,0.10)"
          label="Avg band"
          value={avgBand != null ? String(avgBand) : "—"}
          sub="Reading &amp; Listening"
        />
        <StatCard
          iconMaterial="percent"
          iconColor="#FC945A"
          iconBg="rgba(252,148,90,0.10)"
          label="Submission rate"
          value={`${submitRate}%`}
          sub={notSubmitted > 0 ? `${notSubmitted} not submitted` : "All submitted"}
        />
      </div>

      {/* ── Info banner ── */}
      <div className="flex items-center gap-3 rounded-[12px] border border-[#E5E6E8] bg-[#F2FADD] px-4 py-3">
        <span className="material-symbols-rounded text-[16px] text-[#219653]">check_circle</span>
        <p className="font-inter text-[13px] text-[#219653]">
          Reading &amp; Listening are graded and synced automatically. Writing &amp; Speaking need manual review.
        </p>
      </div>

      {/* ── Results table ── */}
      <div className="rounded-[20px] border border-[#E5E6E8] bg-white shadow-[0_2px_4px_0_rgba(0,0,0,0.04)] overflow-hidden">
        {/* Table caption header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E6E8] px-6 py-4">
          <div className="flex items-center gap-3">
            <h3 className="font-display font-bold text-[15px] text-[#191D24] uppercase tracking-[0.04em]">
              {detail?.quiz_title || "No assignment"}
            </h3>
            {detail?.quiz_skill ? (
              <span
                className={`rounded-full px-2.5 py-0.5 text-[12px] font-semibold capitalize ${
                  detail.quiz_skill === "reading"
                    ? "bg-blue-50 text-blue-600"
                    : detail.quiz_skill === "listening"
                    ? "bg-purple-50 text-purple-600"
                    : detail.quiz_skill === "writing"
                    ? "bg-green-50 text-green-600"
                    : "bg-amber-50 text-amber-600"
                }`}
              >
                {detail.quiz_skill.charAt(0).toUpperCase() + detail.quiz_skill.slice(1)}
              </span>
            ) : null}
          </div>
          <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#219653]">
            <span className="material-symbols-rounded text-[14px]">sync</span>
            Auto-sync on
          </span>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[860px]">
            {/* Column headers */}
            <div
              className={`${COL} border-b border-[#E5E6E8] bg-[#FAFAFA] px-6 py-3 text-[11px] font-bold uppercase tracking-[0.06em] text-[#9CA3AF] gap-3`}
            >
              <span>Student</span>
              <span>Time spent</span>
              <span>Correct</span>
              <span>Band score</span>
              <span>Submitted</span>
              <span>Status</span>
            </div>

            {/* Rows */}
            {!hasData ? (
              <div className="px-6 py-14 text-center">
                <span className="material-symbols-rounded mb-3 block text-[36px] text-[#D1D5DB]">
                  group
                </span>
                <p className="font-inter text-[14px] text-[#6A7282]">
                  {detail === null
                    ? "No assignments found for this class."
                    : "No students have been assigned yet."}
                </p>
              </div>
            ) : (
              detail.rows.map((row) => {
                const init = initials(row.name, row.email);
                const tint = tintFor(row.student_id);
                const isSubmitted =
                  row.status === "submitted" || row.status === "late";

                return (
                  <div
                    key={row.student_id}
                    className={`${COL} border-b border-[#F3F4F6] px-6 py-4 last:border-0 gap-3`}
                  >
                    {/* Student */}
                    <div className="flex items-center gap-3 min-w-0">
                      {row.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={row.avatar_url}
                          alt={row.name || row.email}
                          className="h-9 w-9 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <span
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[13px] font-bold"
                          style={{ background: `${tint}1A`, color: tint }}
                        >
                          {init}
                        </span>
                      )}
                      <span className="truncate font-inter text-[14px] font-semibold text-[#191D24]">
                        {row.name || row.email}
                      </span>
                    </div>

                    {/* Time spent — duration_min from service */}
                    <span className="font-inter text-[14px] text-[#6A7282]">
                      {row.duration_min != null ? `${row.duration_min} min` : "—"}
                    </span>

                    {/* Correct — no per-question correct count in AssignmentResultRow → placeholder */}
                    <span className="font-inter text-[14px] text-[#6A7282]">
                      {isSubmitted ? "—/40" : "—/40"}
                    </span>

                    {/* Band score */}
                    <div>
                      <BandBadge score={row.score} />
                    </div>

                    {/* Submitted timestamp */}
                    <span className="font-inter text-[14px] text-[#6A7282]">
                      {row.submitted_at
                        ? dayjs(row.submitted_at).format("DD/MM HH:mm")
                        : "—"}
                    </span>

                    {/* Status */}
                    <div>
                      <StatusPill status={row.status} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer summary + Export */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E5E6E8] bg-[#FAFAFA] px-6 py-4">
          <p className="font-inter text-[13px] text-[#6A7282]">
            {detail ? (
              <>
                {detail.submitted}/{detail.total} submitted
                {avgBand != null && (
                  <> &middot; Avg band {avgBand}</>
                )}
                {detail.high_band != null && (
                  <> &middot; Highest {detail.high_band}</>
                )}
                {detail.low_band != null && (
                  <> &middot; Lowest {detail.low_band}</>
                )}
              </>
            ) : (
              "No data"
            )}
          </p>
          <button
            type="button"
            disabled={exportDisabled}
            onClick={() => {
              if (detail) exportScoresCsv(detail.quiz_title, detail.rows);
            }}
            className="inline-flex items-center gap-2 rounded-full border border-[#E5E6E8] bg-white px-4 py-2 font-inter text-[13px] font-semibold text-[#374151] hover:bg-[#F6F7F4] disabled:opacity-50 transition-colors"
          >
            <span className="material-symbols-rounded text-[16px]">download</span>
            Export scores
          </button>
        </div>
      </div>
    </div>
  );
}

PageClassroomStudents.Layout = AppShell;
