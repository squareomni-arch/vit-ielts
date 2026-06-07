import { useEffect, useState } from "react";
import Link from "next/link";
import { Modal } from "antd";
import dayjs from "dayjs";
import { ClassroomLayout } from "@/widgets/layouts";
import type { StudentAssignmentDetail } from "~services/types/classroom";
import { ROUTES } from "@/shared/routes";

type Props = { assignment: StudentAssignmentDetail };

const skillPill: Record<string, string> = {
  reading: "bg-blue-50 text-blue-600",
  listening: "bg-purple-50 text-purple-600",
  writing: "bg-green-50 text-green-600",
  speaking: "bg-amber-50 text-amber-600",
};

const statusPill: Record<string, string> = {
  submitted: "bg-green-50 text-green-600",
  late: "bg-amber-50 text-amber-600",
  overdue: "bg-red-50 text-[#D94A56]",
  pending: "bg-gray-100 text-gray-600",
};
const statusLabel: Record<string, string> = {
  submitted: "Đã nộp",
  late: "Nộp muộn",
  overdue: "Quá hạn",
  pending: "Chưa nộp",
};

const typeLabel: Record<string, string> = {
  practice: "Luyện tập",
  exam: "Dự đoán",
};

const INSTRUCTIONS = [
  "Bài thi sẽ mở trong tab mới — không đóng tab trước khi hoàn thành và nộp bài.",
  "Đảm bảo kết nối mạng ổn định trong suốt quá trình làm bài.",
  "Điểm Reading & Listening được chấm và đồng bộ về lớp ngay khi bạn nhấn \"Nộp bài\".",
  "Bạn có thể nộp sau hạn, nhưng bài sẽ được đánh dấu là nộp muộn.",
];

const InfoBox = ({
  icon,
  tint,
  label,
  value,
}: {
  icon: string;
  tint: string;
  label: string;
  value: string;
}) => (
  <div className="flex items-center gap-3 rounded-[12px] p-4" style={{ background: `${tint}12` }}>
    <span
      className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[10px]"
      style={{ background: `${tint}22` }}
    >
      <span className="material-symbols-rounded text-[20px] leading-none" style={{ color: tint }}>
        {icon}
      </span>
    </span>
    <div className="min-w-0">
      <div className="text-[12px] text-[#6A7282]">{label}</div>
      <div className="truncate text-[15px] font-bold text-[#191D24]">{value}</div>
    </div>
  </div>
);

const useCountdown = (target: string | null) => {
  const [text, setText] = useState<string | null>(null);
  useEffect(() => {
    if (!target) {
      setText("Không có hạn nộp");
      return;
    }
    const tick = () => {
      const diff = dayjs(target).diff(dayjs());
      if (diff <= 0) {
        setText("Đã quá hạn nộp");
        return;
      }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setText(d > 0 ? `${d} ngày ${h} giờ ${m} phút` : `${h} giờ ${m} phút ${s} giây`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);
  return text;
};

export const PageMyAssignmentDetail = ({ assignment: a }: Props) => {
  const submitted = a.status === "submitted" || a.status === "late";
  const overdue = a.status === "overdue";
  const countdown = useCountdown(a.due_at);
  const expired = overdue || (a.due_at ? dayjs(a.due_at).isBefore(dayjs()) : false);
  const locked = a.requires_pro && !a.has_access;
  const [proOpen, setProOpen] = useState(false);

  return (
    <div className="space-y-5">
      <Link
        href={ROUTES.CLASSROOM.MY_ASSIGNMENTS}
        className="inline-flex items-center gap-1 text-sm text-[#6A7282] hover:text-[#D94A56]"
      >
        <span className="material-symbols-rounded text-[18px]">chevron_left</span>
        Quay lại danh sách bài tập
      </Link>

      <div className="rounded-[13px] border border-gray-100 bg-white p-6 shadow-sm">
        {/* header */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {a.quiz_skill ? (
              <span
                className={`rounded-full px-3 py-1 text-[13px] font-medium capitalize ${
                  skillPill[a.quiz_skill] ?? "bg-gray-100 text-gray-600"
                }`}
              >
                {a.quiz_skill}
                {a.quiz_type ? ` · ${typeLabel[a.quiz_type] ?? a.quiz_type}` : ""}
              </span>
            ) : null}
          </div>
          <span
            className={`rounded-full px-3 py-1 text-[13px] font-semibold ${
              statusPill[a.status] ?? "bg-gray-100 text-gray-600"
            }`}
          >
            {statusLabel[a.status]}
          </span>
        </div>

        <h1 className="mt-3 text-2xl font-extrabold text-[#191D24]">{a.quiz_title}</h1>
        <p className="mt-1 text-sm text-[#6A7282]">
          Lớp: {a.classroom_name}
          {a.teacher_name ? ` · Giáo viên: ${a.teacher_name}` : ""}
        </p>

        {/* info boxes */}
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <InfoBox
            icon="event"
            tint="#D94A56"
            label="Hạn nộp"
            value={a.due_at ? dayjs(a.due_at).format("DD/MM/YYYY HH:mm") : "Không thời hạn"}
          />
          <InfoBox
            icon="schedule"
            tint="#2563EB"
            label="Thời gian làm bài"
            value={a.quiz_time_minutes != null ? `${a.quiz_time_minutes} phút` : "—"}
          />
          <InfoBox
            icon="quiz"
            tint="#16A34A"
            label="Số câu hỏi"
            value={a.question_count != null && a.question_count > 0 ? `${a.question_count} câu` : "—"}
          />
        </div>

        {/* teacher note */}
        {a.note ? (
          <div className="mt-5 rounded-[12px] border border-[#F3C6CA] bg-[#FFF7F8] p-4">
            <div className="flex items-center gap-1.5 text-[13px] font-bold text-[#D94A56]">
              <span className="material-symbols-rounded text-[18px]">campaign</span>
              Lời dặn của giáo viên
            </div>
            <p className="mt-1.5 whitespace-pre-line text-[14px] text-[#374151]">{a.note}</p>
          </div>
        ) : null}

        {/* instructions */}
        <div className="mt-5">
          <h3 className="text-[15px] font-bold text-[#191D24]">Hướng dẫn làm bài</h3>
          <ul className="mt-2 space-y-2">
            {INSTRUCTIONS.map((t, i) => (
              <li key={i} className="flex items-start gap-2 text-[14px] text-[#6A7282]">
                <span className="material-symbols-rounded mt-0.5 text-[18px] text-[#16A34A]">
                  check_circle
                </span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* countdown + CTA */}
        {submitted ? (
          <div className="mt-6 flex flex-wrap items-center gap-3 rounded-[12px] bg-[#E5F8EC] p-4">
            <span className="material-symbols-rounded text-[24px] text-[#16A34A]">
              task_alt
            </span>
            <div className="flex-1">
              <div className="text-[15px] font-bold text-[#16A34A]">Bạn đã nộp bài này</div>
              <div className="text-[13px] text-[#6A7282]">
                {a.submitted_at ? `Nộp lúc ${dayjs(a.submitted_at).format("DD/MM/YYYY HH:mm")}` : ""}
                {a.score != null ? ` · Band ${a.score}` : ""}
              </div>
            </div>
            {a.test_result_id ? (
              <Link
                href={ROUTES.TEST_RESULT(a.test_result_id)}
                className="whitespace-nowrap rounded-[10px] bg-[#16A34A] px-5 py-2.5 text-[14px] font-bold text-white hover:bg-[#138a3e]"
              >
                Xem kết quả →
              </Link>
            ) : null}
          </div>
        ) : (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-[12px] border border-gray-100 bg-[#F8F9FB] p-4">
            <div>
              <div className="text-[12px] text-[#6A7282]">Thời gian còn lại</div>
              <div
                className={`text-[18px] font-extrabold ${
                  expired ? "text-[#D94A56]" : "text-[#191D24]"
                }`}
              >
                {countdown ?? "…"}
              </div>
              {locked ? (
                <p className="mt-2 flex items-center gap-1.5 text-[13px] text-[#B45309]">
                  <span className="material-symbols-rounded text-[16px]">workspace_premium</span>
                  Bài tập này thuộc nội dung Pro — cần nâng cấp tài khoản để làm.
                </p>
              ) : null}
            </div>
            {locked ? (
              <button
                onClick={() => setProOpen(true)}
                className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-[10px] bg-[#F59E0B] px-6 py-3 text-[15px] font-bold text-white shadow-[0_4px_12px_0_rgba(245,158,11,0.25)] hover:bg-[#e08e08]"
              >
                <span className="material-symbols-rounded text-[20px]">lock</span>
                Nâng cấp để làm bài
              </button>
            ) : (
              <a
                href={ROUTES.TAKE_THE_TEST(a.quiz_slug)}
                target="_blank"
                rel="noopener noreferrer"
                translate="no"
                className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-[10px] bg-[#D94A56] px-6 py-3 text-[15px] font-bold text-white shadow-[0_4px_12px_0_rgba(217,74,87,0.25)] hover:bg-[#c8404b]"
              >
                <span className="material-symbols-rounded text-[20px]">play_arrow</span>
                {expired ? "Làm bài & nộp muộn" : "Bắt đầu làm bài ngay"}
              </a>
            )}
          </div>
        )}
      </div>

      {/* Pro upgrade modal */}
      <Modal
        open={proOpen}
        onCancel={() => setProOpen(false)}
        footer={null}
        closable={false}
        width={440}
        centered
        styles={{ content: { borderRadius: 16, padding: 28 } }}
      >
        <div className="text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#FEF4E2]">
            <span className="material-symbols-rounded !text-[34px] leading-none text-[#F59E0B]">
              workspace_premium
            </span>
          </span>
          <h3 className="mt-4 text-[20px] font-bold text-[#191D24]">Nội dung dành cho tài khoản Pro</h3>
          <p className="mt-2 text-[14px] text-[#6A7282]">
            Bài tập <span className="font-semibold text-[#191D24]">{a.quiz_title}</span> thuộc gói Pro.
            Hãy nâng cấp tài khoản để có thể làm bài và xem kết quả.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Link
              href={ROUTES.SUBSCRIPTION}
              className="inline-flex items-center justify-center gap-1.5 rounded-[10px] bg-[#D94A56] px-6 py-3 text-[15px] font-bold text-white shadow-[0_4px_12px_0_rgba(217,74,87,0.25)] hover:bg-[#c8404b]"
            >
              <span className="material-symbols-rounded text-[20px]">workspace_premium</span>
              Nâng cấp ngay
            </Link>
            <button
              onClick={() => setProOpen(false)}
              className="rounded-[10px] px-6 py-2.5 text-[14px] font-semibold text-[#6A7282] hover:bg-gray-50"
            >
              Để sau
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

PageMyAssignmentDetail.Layout = ClassroomLayout;
