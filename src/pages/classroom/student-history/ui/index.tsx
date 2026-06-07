import { useState } from "react";
import Link from "next/link";
import { Avatar } from "antd";
import dayjs from "dayjs";
import { ClassroomLayout } from "@/widgets/layouts";
import type { StudentHistory } from "~services/classroom";
import { ROUTES } from "@/shared/routes";

type Props = { classroomId: string; history: StudentHistory };

const tints = ["#D94A56", "#2563EB", "#7C3AED", "#0EA5E9", "#16A34A", "#EA580C"];
const tintFor = (k: string) => tints[[...k].reduce((a, c) => a + c.charCodeAt(0), 0) % tints.length];
const skillPill: Record<string, string> = {
  reading: "bg-blue-50 text-blue-600",
  listening: "bg-purple-50 text-purple-600",
  writing: "bg-green-50 text-green-600",
  speaking: "bg-amber-50 text-amber-600",
};
const ROW_GRID = "grid grid-cols-[1fr_120px_110px_120px_170px_100px] items-center gap-3";

export const PageStudentHistory = ({ classroomId, history }: Props) => {
  const { student, attempts } = history;
  const [skill, setSkill] = useState<"all" | "reading" | "listening" | "writing">("all");

  const filtered = attempts.filter((a) => (skill === "all" ? true : a.quiz_skill === skill));

  return (
    <div className="space-y-5">
      <Link
        href={ROUTES.CLASSROOM.TRACKING(classroomId)}
        className="inline-flex items-center gap-1 text-sm text-[#6A7282] hover:text-[#D94A56]"
      >
        <span className="material-symbols-rounded text-[18px]">chevron_left</span>
        Quay lại báo cáo lớp
      </Link>

      {/* Student header */}
      <div className="rounded-[13px] border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <Avatar
              size={56}
              style={{ background: tintFor(student?.id || "x") }}
              src={student?.avatar_url || undefined}
            >
              {(student?.name || student?.email || "?").charAt(0).toUpperCase()}
            </Avatar>
            <div>
              <h2 className="text-2xl font-extrabold text-[#191D24]">
                {student?.name || student?.email || "Học sinh"}
              </h2>
              <p className="mt-0.5 text-sm text-[#6A7282]">
                Học viên · Lớp {history.classroom_name} · {student?.email}
              </p>
              <div className="mt-6 flex flex-wrap gap-8">
                <Stat icon="assignment" tint="#2563EB" value={String(attempts.length)} label="Bài đã làm" />
                <Stat
                  icon="grade"
                  tint="#D94A56"
                  value={history.avg_band != null ? String(history.avg_band) : "—"}
                  label="Band trung bình"
                />
                <Stat
                  icon="schedule"
                  tint="#16A34A"
                  value={history.avg_duration_min != null ? `${history.avg_duration_min} Phút` : "—"}
                  label="Thời gian trung bình"
                />
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#16A34A]">
              <span className="h-2 w-2 rounded-full bg-[#16A34A]" /> Đang hoạt động
            </div>
            {history.joined_at ? (
              <div className="mt-1 text-[13px] text-[#6A7282]">
                Tham gia từ {dayjs(history.joined_at).format("DD/MM/YYYY")}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Attempts table */}
      <div className="rounded-[13px] border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-bold text-[#191D24]">Tất cả bài đã làm</h3>
          <div className="flex gap-2">
            {(
              [
                ["all", "Tất cả"],
                ["reading", "Reading"],
                ["listening", "Listening"],
                ["writing", "Writing"],
              ] as const
            ).map(([k, label]) => (
              <button
                key={k}
                onClick={() => setSkill(k)}
                className={`rounded-full px-4 py-1.5 text-[13px] font-bold ${
                  skill === k ? "bg-[#D94A56] text-white" : "border border-[#E5E7EB] text-[#6A7282]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {attempts.length === 0 ? (
          <p className="py-10 text-center text-[#6A7282]">Học sinh chưa nộp bài nào trong lớp.</p>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[780px]">
              <div className={`${ROW_GRID} border-b border-[#E5E7EB] px-2 pb-3 text-[11px] font-bold uppercase tracking-[0.06em] text-[#9CA3AF]`}>
                <span>Tên bài</span>
                <span>Kỹ năng</span>
                <span>Band / Điểm</span>
                <span>Thời gian</span>
                <span>Ngày nộp</span>
                <span />
              </div>
              {filtered.map((a) => (
                <div key={a.test_result_id} className={`${ROW_GRID} border-b border-[#F3F4F6] px-2 py-4 last:border-0`}>
                  <div className="min-w-0 pr-3">
                    <div className="text-[15px] font-bold leading-snug text-[#191D24]">
                      {a.quiz_title || "Đề không khả dụng"}
                    </div>
                    {a.quiz_source ? (
                      <div className="text-[13px] text-[#6A7282]">{a.quiz_source}</div>
                    ) : null}
                  </div>
                  <div>
                    {a.quiz_skill ? (
                      <span
                        className={`rounded-full px-3 py-1 text-[13px] font-medium capitalize ${
                          skillPill[a.quiz_skill] ?? "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {a.quiz_skill}
                      </span>
                    ) : null}
                  </div>
                  <div>
                    {a.score != null ? (
                      <span className="text-[15px] font-bold text-[#D94A56]">{a.score}</span>
                    ) : (
                      <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[13px] font-medium text-[#6A7282]">
                        Chờ chấm
                      </span>
                    )}
                  </div>
                  <div className="text-[14px] text-[#191D24]">
                    {a.duration_min != null ? `${a.duration_min} phút` : "—"}
                  </div>
                  <div className="text-[14px] text-[#6A7282]">
                    {a.submitted_at ? dayjs(a.submitted_at).format("DD/MM/YYYY HH:mm") : "—"}
                  </div>
                  <div className="text-right">
                    <Link
                      href={ROUTES.TEST_RESULT(a.test_result_id)}
                      className="whitespace-nowrap rounded-[8px] border border-[#E5E7EB] px-3 py-1.5 text-[13px] font-semibold text-[#374151] hover:bg-gray-50"
                    >
                      Xem lại
                    </Link>
                  </div>
                </div>
              ))}
              {filtered.length === 0 ? (
                <p className="py-8 text-center text-[14px] text-[#6A7282]">
                  Không có bài làm phù hợp.
                </p>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Stat = ({
  icon,
  tint,
  value,
  label,
}: {
  icon: string;
  tint: string;
  value: string;
  label: string;
}) => (
  <div className="flex items-center gap-2.5">
    <span
      className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[10px]"
      style={{ background: `${tint}1A` }}
    >
      <span className="material-symbols-rounded text-[20px] leading-none" style={{ color: tint }}>
        {icon}
      </span>
    </span>
    <div>
      <div className="text-[22px] font-extrabold leading-none" style={{ color: tint }}>
        {value}
      </div>
      <div className="mt-1 text-[12px] text-[#6A7282]">{label}</div>
    </div>
  </div>
);

PageStudentHistory.Layout = ClassroomLayout;
