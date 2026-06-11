import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { DatePicker, Dropdown, Modal, Tag, TimePicker, message } from "antd";
import dayjs, { Dayjs } from "dayjs";
import { createClient } from "~supabase/client";
import { AppShell } from "@/widgets/layouts";
import { getQuizzes } from "~services/quiz";
import {
  addMemberByEmail,
  createAssignments,
  deleteAssignment,
  updateAssignmentDueAt,
  deleteClassroom,
  regenerateInviteCode,
  updateClassroom,
  removeMember,
  updateMemberDisplayName,
  approveJoinRequest,
  rejectJoinRequest,
} from "~services/classroom";
import type {
  AssignmentWithStats,
  Classroom,
  ClassroomMemberWithUser,
  ClassroomRole,
  StudentAssignmentView,
} from "~services/types/classroom";
import type { Quiz } from "~services/types/database";
import { ROUTES } from "@/shared/routes";
import { QRCodeCanvas } from "qrcode.react";

type Props = {
  classroom: Classroom;
  members: ClassroomMemberWithUser[];
  assignments: AssignmentWithStats[];
  studentAssignments: StudentAssignmentView[];
  joinRequests: ClassroomMemberWithUser[];
  viewerRole: ClassroomRole;
  isOwner: boolean;
  viewerId: string;
};

// ── Avatar tints for member rows ──────────────────────────────────────────────
const AVATAR_TINTS: [string, string][] = [
  ["#F6CDD0", "#D94A56"],
  ["#E0EBFF", "#2A5BB1"],
  ["#E5F8EC", "#16A34A"],
  ["#F1EAFC", "#7C3AED"],
  ["#FEF4E2", "#B45309"],
];
const tintFor = (key: string) =>
  AVATAR_TINTS[[...key].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_TINTS.length];
const initial = (name: string | null, email: string) =>
  (name || email || "?").trim().charAt(0).toUpperCase();
const classInitials = (name: string) => {
  const t = (name || "").trim();
  return (
    (t.charAt(0).toUpperCase() + (t.split(/\s+/)[1]?.charAt(0).toUpperCase() ?? "")) || "L"
  );
};

// ── Stat card ─────────────────────────────────────────────────────────────────
const STAT_ICONS: Record<string, [string, string]> = {
  students:    ["#F2FADD", "#5B8A00"],
  assignments: ["#EEF3FF", "#5281F9"],
  completed:   ["#E5F8EC", "#16A34A"],
  rate:        ["#F1EAFC", "#8B5CF6"],
};

const StatCard = ({
  icon,
  label,
  value,
  kind,
}: {
  icon: string;
  label: string;
  value: string | number;
  kind: keyof typeof STAT_ICONS;
}) => {
  const [bg, fg] = STAT_ICONS[kind];
  return (
    <div className="flex items-center gap-[14px] rounded-[16px] border border-[#E5E6E8] bg-white px-5 py-[18px] shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
      <span
        className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[10px]"
        style={{ background: bg }}
      >
        <span className="material-symbols-rounded text-[22px] leading-none" style={{ color: fg }}>
          {icon}
        </span>
      </span>
      <div className="flex flex-col gap-0.5">
        <span className="text-[13px] font-medium text-[#6A7282]">{label}</span>
        <span className="text-[26px] font-bold leading-none text-[#191D24]">{value}</span>
      </div>
    </div>
  );
};

// ── Member row ────────────────────────────────────────────────────────────────
const MemberRow = ({
  m,
  isClassOwner,
  isCurrentUser,
  canManage,
  historyHref,
  onRemove,
  onRename,
}: {
  m: ClassroomMemberWithUser;
  isClassOwner: boolean;
  isCurrentUser: boolean;
  canManage: boolean;
  historyHref?: string | null;
  onRemove: (m: ClassroomMemberWithUser) => void;
  onRename: (m: ClassroomMemberWithUser) => void;
}) => {
  const [bg, fg] = tintFor(m.user_id);
  const name = m.display_name || m.name || m.email || "Thành viên";
  const canRemove = canManage && !isClassOwner && !isCurrentUser;
  const showMenu = canManage && !isCurrentUser;
  return (
    <div className="flex items-center gap-3 px-5 py-3.5">
      {m.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={m.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover flex-shrink-0" />
      ) : (
        <span
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-[15px] font-bold"
          style={{ background: bg, color: fg }}
        >
          {initial(m.display_name || m.name, m.email)}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5 text-[14px] font-semibold text-[#191D24]">
          {historyHref ? (
            <Link href={historyHref} className="truncate hover:text-[#B3E653] transition-colors">
              {name}
            </Link>
          ) : (
            <span className="truncate">{name}</span>
          )}
          {isCurrentUser ? <span className="font-normal text-[#6A7282] text-[13px]">(Bạn)</span> : null}
          <span
            className={`inline-flex h-[18px] items-center rounded-full px-2 text-[10px] font-bold uppercase tracking-widest ${
              m.is_pro
                ? "bg-[#191D24] text-[#B3E653]"
                : "bg-[#F3F4F6] text-[#6A7282]"
            }`}
          >
            {m.is_pro ? "PRO" : "FREE"}
          </span>
        </div>
        <div className="truncate text-[12px] text-[#6A7282]">{m.email || "—"}</div>
      </div>
      <span className="inline-flex h-6 items-center gap-1.5 rounded-full bg-[#E5F8EC] px-2.5 text-[12px] font-medium text-[#16A34A] whitespace-nowrap">
        <span className="h-1.5 w-1.5 rounded-full bg-[#16A34A] flex-shrink-0" />
        Joined
      </span>
      {showMenu ? (
        <Dropdown
          trigger={["click"]}
          menu={{
            items: [
              { key: "rename", label: "Sửa tên" },
              ...(canRemove
                ? [
                    { type: "divider" as const },
                    { key: "remove", label: "Xóa khỏi lớp", danger: true },
                  ]
                : []),
            ],
            onClick: ({ key }) => {
              if (key === "rename") onRename(m);
              else if (key === "remove") onRemove(m);
            },
          }}
        >
          <button className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[8px] text-[#6A7282] hover:bg-[#F3F4F6] transition-colors">
            <span className="material-symbols-rounded text-[20px]">more_vert</span>
          </button>
        </Dropdown>
      ) : (
        <span className="w-8 flex-shrink-0" />
      )}
    </div>
  );
};

// ── Skill pill colors ─────────────────────────────────────────────────────────
const SKILL_PILL: Record<string, string> = {
  reading:   "bg-blue-50 text-blue-600",
  listening: "bg-purple-50 text-purple-600",
  writing:   "bg-green-50 text-green-600",
  speaking:  "bg-amber-50 text-amber-600",
};
const ASSIGN_GRID =
  "grid grid-cols-[1fr_104px_96px_150px_144px_130px] items-center gap-3";

// ── Assignment row (teacher) ──────────────────────────────────────────────────
const AssignmentRow = ({
  a,
  studentTotal,
  classroomId,
  onDelete,
  onEditDue,
}: {
  a: AssignmentWithStats;
  studentTotal: number;
  classroomId: string;
  onDelete: (id: string) => void;
  onEditDue: (a: AssignmentWithStats) => void;
}) => {
  const ratio = a.target_count ? Math.round((a.submitted_count / a.target_count) * 100) : 0;
  let dueLabel = "";
  let dueColor = "#6A7282";
  if (a.due_at) {
    const d = dayjs(a.due_at);
    if (d.isBefore(dayjs())) {
      dueLabel = "Quá hạn";
      dueColor = "#E54552";
    } else {
      const days = d.diff(dayjs(), "day");
      if (days <= 1) {
        dueLabel = "Sắp đến hạn";
        dueColor = "#F59E0B";
      } else {
        dueLabel = `Còn ${days} ngày`;
        dueColor = "#16A34A";
      }
    }
  }
  return (
    <div className={`${ASSIGN_GRID} border-b border-[#F3F4F6] px-5 py-4 last:border-0`}>
      <div className="min-w-0 pr-3">
        <div className="text-[14px] font-semibold leading-snug text-[#191D24]">
          {a.quiz_title || "Đề không khả dụng"}
        </div>
        {a.quiz_source || a.note ? (
          <div className="text-[12px] text-[#6A7282]">{a.quiz_source || a.note}</div>
        ) : null}
      </div>
      <div>
        {a.quiz_skill ? (
          <span
            className={`rounded-full px-2.5 py-0.5 text-[12px] font-medium capitalize ${
              SKILL_PILL[a.quiz_skill] ?? "bg-gray-100 text-gray-600"
            }`}
          >
            {a.quiz_skill}
          </span>
        ) : null}
      </div>
      <div className="text-[14px] font-semibold text-[#191D24]">
        {a.target_count}/{studentTotal}
      </div>
      <div className="pr-4">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#F3F4F6]">
          <div className="h-full rounded-full bg-[#B3E653]" style={{ width: `${ratio}%` }} />
        </div>
        <div className="mt-1 text-[12px] text-[#6A7282]">
          {a.submitted_count}/{a.target_count} hoàn thành
        </div>
      </div>
      <div>
        <div className="text-[13px] text-[#191D24]">
          {a.due_at ? dayjs(a.due_at).format("DD/MM HH:mm") : "Không có hạn"}
        </div>
        {a.due_at ? (
          <div className="text-[12px] font-semibold" style={{ color: dueColor }}>
            {dueLabel}
          </div>
        ) : null}
      </div>
      <div className="flex items-center justify-end gap-1">
        <Link
          href={ROUTES.CLASSROOM.ASSIGNMENT_DETAIL(classroomId, a.id)}
          className="whitespace-nowrap rounded-[8px] border border-[#E5E6E8] px-3 py-1.5 text-[12px] font-semibold text-[#374151] hover:bg-[#F3F4F6] transition-colors"
        >
          Chi tiết
        </Link>
        <Dropdown
          trigger={["click"]}
          menu={{
            items: [
              { key: "due", label: "Đổi hạn nộp" },
              { key: "report", label: <Link href={ROUTES.CLASSROOM.TRACKING(classroomId)}>Báo cáo</Link> },
              { type: "divider" },
              { key: "delete", label: "Xóa bài giao", danger: true },
            ],
            onClick: ({ key }) => {
              if (key === "delete") onDelete(a.id);
              else if (key === "due") onEditDue(a);
            },
          }}
        >
          <button className="flex h-8 w-8 items-center justify-center rounded-[8px] text-[#6A7282] hover:bg-[#F3F4F6] transition-colors">
            <span className="material-symbols-rounded text-[20px]">more_vert</span>
          </button>
        </Dropdown>
      </div>
    </div>
  );
};

// ── Join requests list ────────────────────────────────────────────────────────
const JoinRequestsList = ({
  requests,
  onApprove,
  onReject,
}: {
  requests: ClassroomMemberWithUser[];
  onApprove: (userId: string) => void;
  onReject: (r: ClassroomMemberWithUser) => void;
}) => {
  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#F2FADD]">
          <span className="material-symbols-rounded !text-[32px] leading-none text-[#5B8A00]">
            group_add
          </span>
        </span>
        <p className="mt-4 text-[16px] font-bold text-[#191D24]">Chưa có yêu cầu nào</p>
        <p className="mt-1 text-[13px] text-[#6A7282]">
          Học sinh tham gia bằng mã/link sẽ xuất hiện ở đây để bạn duyệt.
        </p>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      {requests.map((r) => {
        const [bg, fg] = tintFor(r.user_id);
        const name = r.name || r.email || "Học sinh";
        return (
          <div
            key={r.id}
            className="flex flex-wrap items-center gap-4 rounded-[14px] border border-[#E5E6E8] bg-white p-4"
          >
            {r.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={r.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover flex-shrink-0" />
            ) : (
              <span
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-[14px] font-bold"
                style={{ background: bg, color: fg }}
              >
                {initial(r.name, r.email)}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[14px] font-bold text-[#191D24]">{name}</span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                    r.role === "teacher"
                      ? "bg-[#EEF2FF] text-[#4F46E5]"
                      : "bg-blue-50 text-blue-600"
                  }`}
                >
                  {r.role === "teacher" ? "Giáo viên" : "Học sinh"}
                </span>
              </div>
              <div className="text-[13px] text-[#6A7282]">{r.email || "—"}</div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onReject(r)}
                className="rounded-[10px] border border-[#E5E6E8] px-4 py-2 text-[13px] font-semibold text-[#6A7282] hover:bg-[#F3F4F6] transition-colors"
              >
                Từ chối
              </button>
              <button
                onClick={() => onApprove(r.user_id)}
                className="rounded-[10px] bg-[#B3E653] px-5 py-2 text-[13px] font-bold text-[#191D24] hover:bg-[#9AD534] transition-colors"
              >
                Chấp nhận
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ── Student assignment list ───────────────────────────────────────────────────
const STUDENT_ASSIGN_GRID = "grid grid-cols-[1fr_104px_160px_120px_150px] items-center gap-3";

const studentStatusMeta = (a: StudentAssignmentView) => {
  if (a.status === "submitted" || a.status === "late")
    return { label: "Đã nộp", cls: "bg-green-50 text-green-600" };
  if (a.status === "overdue") return { label: "Quá hạn", cls: "bg-red-50 text-[#E54552]" };
  if (a.in_progress) return { label: "Đang làm", cls: "bg-blue-50 text-blue-600" };
  return { label: "Chưa làm", cls: "bg-gray-100 text-gray-600" };
};

const StudentAssignmentList = ({ items }: { items: StudentAssignmentView[] }) => {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#F2FADD]">
          <span className="material-symbols-rounded !text-[32px] leading-none text-[#5B8A00]">
            assignment
          </span>
        </span>
        <p className="mt-4 text-[16px] font-bold text-[#191D24]">Chưa có bài giao nào</p>
        <p className="mt-1 text-[13px] text-[#6A7282]">
          Giáo viên chưa giao bài tập nào cho bạn trong lớp này.
        </p>
      </div>
    );
  }
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[720px] overflow-hidden rounded-[14px] border border-[#E5E6E8]">
        <div
          className={`${STUDENT_ASSIGN_GRID} bg-[#FAFAFA] px-5 py-3 text-[11px] font-bold uppercase tracking-[0.06em] text-[#6A7282]`}
        >
          <span>Tên bài</span>
          <span>Kỹ năng</span>
          <span>Hạn nộp</span>
          <span>Trạng thái</span>
          <span />
        </div>
        {items.map((a) => {
          const meta = studentStatusMeta(a);
          const done = a.status === "submitted" || a.status === "late";
          return (
            <div
              key={a.assignment_id}
              className={`${STUDENT_ASSIGN_GRID} border-t border-[#F3F4F6] px-5 py-4`}
            >
              <span className="truncate text-[14px] font-semibold text-[#191D24]">
                {a.quiz_title || "Đề không khả dụng"}
              </span>
              <span>
                {a.quiz_skill ? (
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[12px] font-medium capitalize ${
                      SKILL_PILL[a.quiz_skill] ?? "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {a.quiz_skill}
                  </span>
                ) : null}
              </span>
              <span className="text-[13px] text-[#6A7282]">
                {a.due_at ? dayjs(a.due_at).format("DD/MM/YYYY HH:mm") : "Không thời hạn"}
              </span>
              <span>
                <span className={`rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${meta.cls}`}>
                  {meta.label}
                </span>
              </span>
              <span className="flex justify-end">
                {done ? (
                  <Link
                    href={
                      a.test_result_id
                        ? ROUTES.TEST_RESULT(a.test_result_id)
                        : ROUTES.CLASSROOM.MY_ASSIGNMENT(a.assignment_id)
                    }
                    className="inline-flex items-center gap-1 whitespace-nowrap rounded-[10px] bg-[#16A34A] px-4 py-2 text-[12px] font-bold text-white hover:bg-[#138a3e] transition-colors"
                  >
                    Xem kết quả →
                  </Link>
                ) : (
                  <Link
                    href={ROUTES.CLASSROOM.MY_ASSIGNMENT(a.assignment_id)}
                    className="inline-flex items-center gap-1 whitespace-nowrap rounded-[10px] bg-[#B3E653] px-4 py-2 text-[12px] font-bold text-[#191D24] hover:bg-[#9AD534] transition-colors"
                  >
                    {a.status === "overdue"
                      ? "Nộp muộn →"
                      : a.in_progress
                        ? "Tiếp tục làm →"
                        : "Bắt đầu làm →"}
                  </Link>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── Invite info modal (Add student / Add teacher) ─────────────────────────────
const InviteModal = ({
  open,
  role,
  inviteLink,
  classCode,
  onCopy,
  copied,
  onClose,
}: {
  open: boolean;
  role: ClassroomRole | null;
  inviteLink: string;
  classCode: string;
  onCopy: (text: string, key: string) => void;
  copied: string | null;
  onClose: () => void;
}) => (
  <Modal
    open={open}
    onCancel={onClose}
    footer={null}
    closable={false}
    width={480}
    centered
    styles={{ content: { borderRadius: 20, padding: 0 } }}
    destroyOnClose
  >
    <div className="px-7 py-6">
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F2FADD]">
            <span className="material-symbols-rounded text-[22px] text-[#5B8A00]">person_add</span>
          </span>
          <h3 className="text-[20px] font-bold text-[#191D24]">
            {role === "teacher" ? "Add teacher" : "Add student"}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F3F4F6] text-[#6A7282] hover:bg-[#E5E6E8] transition-colors"
          aria-label="Đóng"
        >
          <span className="material-symbols-rounded text-[18px]">close</span>
        </button>
      </div>

      <p className="text-[14px] text-[#6A7282] mb-5">
        Share the class code or invite link below. When they enter the code,
        they&apos;ll join as a {role === "teacher" ? "Teacher" : "Student"}.
      </p>

      {/* Invite link */}
      <div className="mb-4">
        <label className="mb-2 block text-[13px] font-bold text-[#191D24]">Invite link</label>
        <div className="flex items-center gap-2 rounded-[11px] border border-[#E5E6E8] bg-[#FAFAFA] px-4 py-3">
          <span className="flex-1 truncate text-[13px] text-[#6A7282]">{inviteLink}</span>
          <button
            onClick={() => onCopy(inviteLink, `invite-${role}`)}
            className="flex items-center gap-1.5 rounded-[8px] border border-[#E5E6E8] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#374151] hover:bg-[#F3F4F6] transition-colors whitespace-nowrap"
          >
            <span className="material-symbols-rounded text-[14px]">
              {copied === `invite-${role}` ? "check" : "content_copy"}
            </span>
            Copy
          </button>
        </div>
      </div>

      {/* Divider */}
      <div className="relative my-4 flex items-center">
        <div className="flex-1 border-t border-[#E5E6E8]" />
        <span className="mx-3 text-[12px] font-medium text-[#6A7282]">OR</span>
        <div className="flex-1 border-t border-[#E5E6E8]" />
      </div>

      {/* Class code */}
      <div className="mb-5">
        <label className="mb-2 block text-[13px] font-bold text-[#191D24]">Class code</label>
        <div className="flex items-center gap-2 rounded-[11px] border border-[#E5E6E8] bg-[#FAFAFA] px-4 py-3">
          <span className="flex-1 text-[20px] font-bold tracking-[0.2em] text-[#191D24]">
            {classCode}
          </span>
          <button
            onClick={() => onCopy(classCode, `code-${role}`)}
            className="flex items-center gap-1.5 rounded-[8px] border border-[#E5E6E8] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#374151] hover:bg-[#F3F4F6] transition-colors whitespace-nowrap"
          >
            <span className="material-symbols-rounded text-[14px]">
              {copied === `code-${role}` ? "check" : "content_copy"}
            </span>
            Copy
          </button>
        </div>
        <p className="mt-1.5 text-[12px] text-[#6A7282]">
          Invitees enter this on the &quot;Join class&quot; page.
        </p>
      </div>

      {/* Role description */}
      <div className="mb-6 flex items-start gap-3 rounded-[12px] bg-[#F5F6F7] px-4 py-3">
        <span className="material-symbols-rounded mt-0.5 text-[18px] text-[#6A7282] flex-shrink-0">
          {role === "teacher" ? "school" : "person"}
        </span>
        <div>
          <p className="text-[13px] font-bold text-[#191D24]">
            Role: {role === "teacher" ? "Teacher" : "Student"}
          </p>
          <p className="text-[12px] text-[#6A7282]">
            {role === "teacher"
              ? "Can manage the class, assign work and view scores."
              : "Can view assignments, submit work and see their own scores."}
          </p>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={onClose}
          className="rounded-full bg-[#B3E653] px-7 py-2.5 text-[14px] font-bold text-[#191D24] hover:bg-[#9AD534] transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  </Modal>
);

// ── Main page component ───────────────────────────────────────────────────────
export const PageClassroomDetail = ({
  classroom: initialClassroom,
  members,
  assignments,
  studentAssignments,
  joinRequests,
  viewerRole,
  isOwner,
  viewerId,
}: Props) => {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const isTeacher = viewerRole === "teacher";

  const [classroom, setClassroom] = useState(initialClassroom);
  const [copied, setCopied] = useState<string | null>(null);
  const [qrOpen, setQrOpen] = useState(false);

  const downloadQr = () => {
    const canvas = document.querySelector<HTMLCanvasElement>("#classroom-qr-canvas");
    if (!canvas) return;
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `qr-lop-${classroom.invite_code}.png`;
    link.click();
  };

  const [activeTab, setActiveTab] = useState<"members" | "assignments" | "requests">(
    router.query.tab === "assignments"
      ? "assignments"
      : router.query.tab === "requests"
        ? "requests"
        : "members"
  );
  const [memberFilter, setMemberFilter] = useState<"teacher" | "student">("student");
  const [assignFilter, setAssignFilter] = useState<"all" | "open" | "expired">("all");

  const teachers = members.filter((m) => m.role === "teacher");
  const students = members.filter((m) => m.role === "student");

  const completed = assignments.filter(
    (a) => a.target_count > 0 && a.submitted_count >= a.target_count
  ).length;
  const totalTargets = assignments.reduce((s, a) => s + a.target_count, 0);
  const totalSubmitted = assignments.reduce((s, a) => s + a.submitted_count, 0);
  const submitRate = totalTargets ? Math.round((totalSubmitted / totalTargets) * 100) : 0;

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const studentLink = `${origin}${ROUTES.CLASSROOM.JOIN(classroom.invite_code)}?role=student`;
  const teacherLink = `${origin}${ROUTES.CLASSROOM.JOIN(classroom.invite_code)}?role=teacher`;

  // Invite modal (replaces separate add-by-email modal)
  const [inviteOpen, setInviteOpen] = useState<null | ClassroomRole>(null);

  // Legacy add-by-email state (kept for service calls, modal hidden behind invite flow)
  const [addEmail, setAddEmail] = useState("");
  const [addErr, setAddErr] = useState("");
  const [adding, setAdding] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteStep, setDeleteStep] = useState<1 | 2>(1);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

  const [giaoOpen, setGiaoOpen] = useState(false);
  const [giaoStep, setGiaoStep] = useState<1 | 2>(1);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);
  const [selectedQuizzes, setSelectedQuizzes] = useState<Quiz[]>([]);
  const [dueDate, setDueDate] = useState<Dayjs | null>(null);
  const [dueTime, setDueTime] = useState<Dayjs | null>(null);
  const [note, setNote] = useState("");
  const [audience, setAudience] = useState<"all" | "subset">("all");
  const [subset, setSubset] = useState<string[]>([]);
  const [giaoSkill, setGiaoSkill] = useState<"reading" | "listening" | "writing" | "speaking">("reading");
  const [giaoFilter, setGiaoFilter] = useState<"all" | "unassigned" | "assigned">("all");
  const [showAllChips, setShowAllChips] = useState(false);

  const assignedQuizIds = useMemo(
    () => new Set(assignments.map((a) => a.quiz_id)),
    [assignments]
  );
  const selectedIds = new Set(selectedQuizzes.map((q) => q.id));

  useEffect(() => {
    if (!giaoOpen) return;
    if (giaoSkill === "writing" || giaoSkill === "speaking") {
      setQuizzes([]);
      setLoadingQuizzes(false);
      return;
    }
    let active = true;
    setLoadingQuizzes(true);
    getQuizzes(supabase, {
      skill: giaoSkill,
      search: search || undefined,
      page: 1,
      pageSize: 100,
    })
      .then((res) => active && setQuizzes(res.data))
      .catch(() => active && setQuizzes([]))
      .finally(() => active && setLoadingQuizzes(false));
    return () => {
      active = false;
    };
  }, [giaoOpen, giaoSkill, search, supabase]);

  const refresh = () => router.replace(router.asPath, undefined, { scroll: false });

  const copy = (text: string, key: string) => {
    const done = () => {
      setCopied(key);
      message.success("Đã sao chép");
      setTimeout(() => setCopied(null), 2000);
    };
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).then(done).catch(done);
    else done();
  };

  const closeAdd = () => {
    if (adding) return;
    setInviteOpen(null);
    setAddEmail("");
    setAddErr("");
  };

  const handleAdd = async () => {
    const email = addEmail.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setAddErr("Vui lòng nhập email hợp lệ.");
      return;
    }
    setAdding(true);
    try {
      await addMemberByEmail(supabase, classroom.id, email, inviteOpen!);
      message.success("Đã thêm thành viên");
      setInviteOpen(null);
      setAddEmail("");
      setAddErr("");
      refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      message.error(
        msg.includes("USER_NOT_FOUND")
          ? "Không tìm thấy người dùng với email này."
          : msg.includes("STUDENT_LIMIT_REACHED")
            ? "Lớp đã đạt giới hạn 50 học viên."
            : "Không thêm được thành viên."
      );
    } finally {
      setAdding(false);
    }
  };
  // handleAdd/addEmail/addErr remain available for future direct-email-add UI

  const [confirmRemove, setConfirmRemove] = useState<ClassroomMemberWithUser | null>(null);
  const [confirmReject, setConfirmReject] = useState<ClassroomMemberWithUser | null>(null);
  const [renameMember, setRenameMember] = useState<ClassroomMemberWithUser | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const openRename = (m: ClassroomMemberWithUser) => {
    setRenameMember(m);
    setRenameValue(m.display_name || m.name || "");
  };

  const handleSaveRename = async () => {
    if (!renameMember) return;
    setSubmitting(true);
    try {
      await updateMemberDisplayName(
        supabase,
        classroom.id,
        renameMember.user_id,
        renameValue.trim() || null
      );
      message.success("Đã cập nhật tên trong lớp");
      setRenameMember(null);
      refresh();
    } catch {
      message.error("Không cập nhật được tên.");
    } finally {
      setSubmitting(false);
    }
  };

  const doRemove = async (m: ClassroomMemberWithUser) => {
    setConfirmRemove(null);
    try {
      await removeMember(supabase, classroom.id, m.user_id);
      message.success("Đã xóa thành viên");
      refresh();
    } catch {
      message.error("Không xóa được thành viên.");
    }
  };

  const handleRegenerate = async () => {
    try {
      const code = await regenerateInviteCode(supabase, classroom.id);
      setClassroom({ ...classroom, invite_code: code });
      message.success("Đã đổi mã mời");
    } catch {
      message.error("Không đổi được mã mời.");
    }
  };

  // Edit class info modal
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editSchedule, setEditSchedule] = useState("");
  const [editImage, setEditImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const openEdit = () => {
    setEditName(classroom.name);
    setEditDesc(classroom.description || "");
    setEditSchedule("");
    setEditImage(classroom.image_url ?? null);
    setEditOpen(true);
  };

  const handlePickImage = async (file: File | null) => {
    if (!file) return;
    setUploadingImage(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/classroom/upload-image", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok || !data.path) throw new Error(data.message || "Upload thất bại");
      setEditImage(data.path);
    } catch (e) {
      message.error(e instanceof Error ? e.message : "Không tải được ảnh.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editName.trim()) {
      message.error("Vui lòng nhập tên lớp.");
      return;
    }
    setSubmitting(true);
    try {
      const updated = await updateClassroom(supabase, classroom.id, {
        name: editName.trim(),
        description: editDesc.trim() || null,
        image_url: editImage,
      });
      setClassroom(updated);
      message.success("Đã cập nhật thông tin lớp");
      setEditOpen(false);
    } catch {
      message.error("Không cập nhật được thông tin lớp.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteClassroom(supabase, classroom.id);
      message.success("Đã xóa lớp");
      router.push(ROUTES.CLASSROOM.LIST);
    } catch {
      message.error("Không xóa được lớp.");
      setDeleting(false);
    }
  };

  const closeDelete = () => {
    if (deleting) return;
    setDeleteOpen(false);
    setDeleteStep(1);
    setDeleteConfirm("");
  };

  const resetGiao = () => {
    setGiaoOpen(false);
    setGiaoStep(1);
    setSearch("");
    setSelectedQuizzes([]);
    setDueDate(null);
    setDueTime(null);
    setNote("");
    setAudience("all");
    setSubset([]);
    setGiaoSkill("reading");
    setGiaoFilter("all");
    setShowAllChips(false);
  };

  const toggleQuiz = (q: Quiz) =>
    setSelectedQuizzes((prev) =>
      prev.some((x) => x.id === q.id) ? prev.filter((x) => x.id !== q.id) : [...prev, q]
    );

  const handleAssign = async () => {
    setSubmitting(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Bạn cần đăng nhập.");
      const due = dueDate
        ? dueDate
            .hour(dueTime ? dueTime.hour() : 23)
            .minute(dueTime ? dueTime.minute() : 59)
            .second(0)
        : null;
      await createAssignments(supabase, {
        classroomId: classroom.id,
        quizIds: selectedQuizzes.map((q) => q.id),
        dueAt: due ? due.toISOString() : null,
        note: note.trim() || null,
        studentIds: audience === "subset" ? subset : null,
        createdBy: user.id,
      });
      message.success(`Đã giao ${selectedQuizzes.length} đề cho học sinh`);
      resetGiao();
      refresh();
    } catch (e) {
      message.error(e instanceof Error ? e.message : "Không giao được bài.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    try {
      await deleteAssignment(supabase, id);
      message.success("Đã xóa bài giao");
      refresh();
    } catch {
      message.error("Không xóa được bài giao.");
    }
  };

  const handleApprove = async (userId: string) => {
    try {
      await approveJoinRequest(supabase, classroom.id, userId);
      message.success("Đã duyệt học sinh vào lớp");
      refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      message.error(
        msg.includes("STUDENT_LIMIT_REACHED")
          ? "Lớp đã đạt giới hạn 50 học viên."
          : "Không duyệt được yêu cầu."
      );
    }
  };

  const doReject = async (userId: string) => {
    setConfirmReject(null);
    try {
      await rejectJoinRequest(supabase, classroom.id, userId);
      message.success("Đã từ chối yêu cầu");
      refresh();
    } catch {
      message.error("Không từ chối được yêu cầu.");
    }
  };

  const [dueEdit, setDueEdit] = useState<AssignmentWithStats | null>(null);
  const [editDate, setEditDate] = useState<Dayjs | null>(null);
  const [editTime, setEditTime] = useState<Dayjs | null>(null);

  const openEditDue = (a: AssignmentWithStats) => {
    setDueEdit(a);
    setEditDate(a.due_at ? dayjs(a.due_at) : null);
    setEditTime(a.due_at ? dayjs(a.due_at) : null);
  };

  const handleSaveDue = async () => {
    if (!dueEdit) return;
    setSubmitting(true);
    try {
      const due = editDate
        ? editDate
            .hour(editTime ? editTime.hour() : 23)
            .minute(editTime ? editTime.minute() : 59)
            .second(0)
        : null;
      await updateAssignmentDueAt(supabase, dueEdit.id, due ? due.toISOString() : null);
      message.success("Đã cập nhật hạn nộp");
      setDueEdit(null);
      refresh();
    } catch {
      message.error("Không cập nhật được hạn nộp.");
    } finally {
      setSubmitting(false);
    }
  };

  const shownMembers = memberFilter === "teacher" ? teachers : students;

  // Subtitle line under class name (mirrors Figma "Academic prep class · Evening · Tue, Thu")
  const subtitleParts = [classroom.description].filter(Boolean);

  return (
    <div className="flex flex-col gap-5">
      {/* ── Back link ── */}
      <Link
        href={ROUTES.CLASSROOM.LIST}
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#6A7282] hover:text-[#191D24] transition-colors"
      >
        <span className="material-symbols-rounded text-[16px]">arrow_back</span>
        Back to class list
      </Link>

      {/* ── Class hero header ── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-bold leading-tight text-[#191D24] font-display">
            {classroom.name}
          </h1>
          {subtitleParts.length > 0 && (
            <p className="mt-1 text-[13px] text-[#6A7282]">{subtitleParts.join(" · ")}</p>
          )}
        </div>

        {isTeacher ? (
          <div className="flex items-center gap-2">
            {/* Invite code chip */}
            <div className="flex items-center gap-2 rounded-[10px] border border-[#E5E6E8] bg-white px-3.5 py-2">
              <span className="text-[13px] text-[#6A7282]">Invite code:</span>
              <span className="text-[15px] font-bold tracking-[0.15em] text-[#191D24]">
                {classroom.invite_code}
              </span>
              <button
                onClick={() => copy(classroom.invite_code, "code")}
                className="ml-0.5 text-[#9CA3AF] hover:text-[#5B8A00] transition-colors"
                title="Sao chép mã"
              >
                <span className="material-symbols-rounded text-[16px]">
                  {copied === "code" ? "check" : "content_copy"}
                </span>
              </button>
            </div>
            <Dropdown
              trigger={["click"]}
              menu={{
                items: [
                  { key: "qr", label: "Mã QR lớp học" },
                  { type: "divider" },
                  { key: "s", label: "Sao chép link mời học sinh" },
                  { key: "t", label: "Sao chép link mời giáo viên" },
                  { type: "divider" },
                  { key: "r", label: "Đổi mã mời" },
                  { key: "edit", label: "Sửa thông tin lớp" },
                ],
                onClick: ({ key }) => {
                  if (key === "edit") openEdit();
                  else if (key === "qr") setQrOpen(true);
                  else if (key === "s") copy(studentLink, "s");
                  else if (key === "t") copy(teacherLink, "t");
                  else if (key === "r") handleRegenerate();
                },
              }}
            >
              <button className="flex h-9 w-9 items-center justify-center rounded-[8px] border border-[#E5E6E8] bg-white text-[#6A7282] hover:bg-[#F3F4F6] transition-colors">
                <span className="material-symbols-rounded text-[18px]">settings</span>
              </button>
            </Dropdown>
          </div>
        ) : null}
      </div>

      {/* ── Metrics row (teacher) ── */}
      {isTeacher ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard kind="students"    icon="group"       label="Students"         value={students.length} />
          <StatCard kind="assignments" icon="menu_book"   label="Assignments"      value={assignments.length} />
          <StatCard kind="completed"   icon="task_alt"    label="Completed"        value={completed} />
          <StatCard kind="rate"        icon="trending_up" label="Submission rate"  value={`${submitRate}%`} />
        </div>
      ) : null}

      {/* ── Tab card ── */}
      <div className="overflow-hidden rounded-[20px] border border-[#E5E6E8] bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
        {/* Tab bar */}
        <div className="flex flex-wrap gap-1 px-5 pt-4 border-b border-[#E5E6E8]">
          {(
            [
              {
                key: "members",
                icon: "group",
                label: "Members",
                count: members.length,
              },
              {
                key: "assignments",
                icon: "menu_book",
                label: "Assignments",
                count: isTeacher ? assignments.length : studentAssignments.length,
              },
              ...(isTeacher
                ? [{
                    key: "requests",
                    icon: "person_add",
                    label: "Yêu cầu vào lớp",
                    count: joinRequests.length,
                  }]
                : []),
            ] as { key: "members" | "assignments" | "requests"; icon: string; label: string; count: number }[]
          ).map((t) => {
            const on = activeTab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`-mb-px flex items-center gap-2 px-4 pb-3.5 pt-2.5 text-[14px] transition-colors ${
                  on
                    ? "border-b-2 border-[#191D24] font-bold text-[#191D24]"
                    : "border-b-2 border-transparent font-medium text-[#6A7282] hover:text-[#191D24]"
                }`}
              >
                <span className="material-symbols-rounded text-[18px]">{t.icon}</span>
                {t.label}
                <span
                  className={`rounded-[6px] px-1.5 py-0.5 text-[11px] font-bold ${
                    on ? "bg-[#B3E653] text-[#191D24]" : "bg-[#F3F4F6] text-[#6A7282]"
                  }`}
                >
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div className="flex flex-col gap-4 p-5">
          {activeTab === "members" ? (
            <>
              {/* Sub-filter + action buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 rounded-full border border-[#E5E6E8] bg-[#F5F6F7] p-1">
                  <button
                    onClick={() => setMemberFilter("teacher")}
                    className={`rounded-full px-4 py-1.5 text-[13px] font-bold transition-all ${
                      memberFilter === "teacher"
                        ? "bg-white text-[#191D24] shadow-[0_1px_2px_0_rgba(0,0,0,0.08)]"
                        : "text-[#6A7282]"
                    }`}
                  >
                    Teachers ({teachers.length})
                  </button>
                  <button
                    onClick={() => setMemberFilter("student")}
                    className={`rounded-full px-4 py-1.5 text-[13px] font-bold transition-all ${
                      memberFilter === "student"
                        ? "bg-[#B3E653] text-[#191D24] shadow-[0_1px_2px_0_rgba(0,0,0,0.08)]"
                        : "text-[#6A7282]"
                    }`}
                  >
                    Students ({students.length})
                  </button>
                </div>

                {isTeacher ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setInviteOpen("teacher")}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[#E5E6E8] bg-white px-4 py-2 text-[13px] font-semibold text-[#191D24] hover:bg-[#F3F4F6] transition-colors"
                    >
                      <span className="material-symbols-rounded text-[16px]">person_add</span>
                      Add teacher
                    </button>
                    <button
                      onClick={() => setInviteOpen("student")}
                      className="inline-flex items-center gap-1.5 rounded-full bg-[#B3E653] px-4 py-2 text-[13px] font-bold text-[#191D24] hover:bg-[#9AD534] transition-colors"
                    >
                      <span className="material-symbols-rounded text-[16px]">add</span>
                      Add student
                    </button>
                  </div>
                ) : null}
              </div>

              {shownMembers.length === 0 ? (
                <div className="flex flex-col items-center py-16 text-center">
                  <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#F2FADD]">
                    <span className="material-symbols-rounded !text-[32px] leading-none text-[#5B8A00]">
                      group_add
                    </span>
                  </span>
                  <p className="mt-4 text-[16px] font-bold text-[#191D24]">No members yet</p>
                  <p className="mt-1 text-[13px] text-[#6A7282] max-w-[300px]">
                    Share the invite code or use &quot;Add student&quot; to invite learners.
                  </p>
                  {isTeacher && (
                    <button
                      onClick={() => setInviteOpen("student")}
                      className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-[#B3E653] px-5 py-2.5 text-[13px] font-bold text-[#191D24] hover:bg-[#9AD534] transition-colors"
                    >
                      <span className="material-symbols-rounded text-[16px]">add</span>
                      Add student
                    </button>
                  )}
                </div>
              ) : (
                <div className="overflow-hidden rounded-[14px] border border-[#E5E6E8]">
                  <div className="flex items-center justify-between bg-[#FAFAFA] px-5 py-3 border-b border-[#F3F4F6]">
                    <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#6A7282]">
                      INFO
                    </span>
                    <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#6A7282]">
                      ACTIONS
                    </span>
                  </div>
                  <div className="divide-y divide-[#F3F4F6]">
                    {shownMembers.map((m) => (
                      <MemberRow
                        key={m.id}
                        m={m}
                        isClassOwner={m.user_id === classroom.owner_id}
                        isCurrentUser={m.user_id === viewerId}
                        canManage={isTeacher}
                        historyHref={
                          isTeacher && m.role === "student"
                            ? ROUTES.CLASSROOM.STUDENT_HISTORY(classroom.id, m.user_id)
                            : null
                        }
                        onRemove={setConfirmRemove}
                        onRename={openRename}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : activeTab === "requests" ? (
            <JoinRequestsList
              requests={joinRequests}
              onApprove={handleApprove}
              onReject={setConfirmReject}
            />
          ) : !isTeacher ? (
            <StudentAssignmentList items={studentAssignments} />
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 rounded-full border border-[#E5E6E8] bg-[#F5F6F7] p-1">
                  {(
                    [
                      ["all", "Tất cả"],
                      ["open", "Đang mở"],
                      ["expired", "Đã hết hạn"],
                    ] as const
                  ).map(([k, label]) => (
                    <button
                      key={k}
                      onClick={() => setAssignFilter(k)}
                      className={`rounded-full px-4 py-1.5 text-[13px] font-bold transition-all ${
                        assignFilter === k
                          ? "bg-white text-[#191D24] shadow-[0_1px_2px_0_rgba(0,0,0,0.08)]"
                          : "text-[#6A7282]"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setGiaoOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#B3E653] px-4 py-2 text-[13px] font-bold text-[#191D24] hover:bg-[#9AD534] transition-colors"
                >
                  <span className="material-symbols-rounded text-[16px]">add</span>
                  Giao bài
                </button>
              </div>

              {assignments.length === 0 ? (
                <div className="flex flex-col items-center py-16 text-center">
                  <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#F2FADD]">
                    <span className="material-symbols-rounded !text-[32px] leading-none text-[#5B8A00]">
                      assignment
                    </span>
                  </span>
                  <p className="mt-4 text-[16px] font-bold text-[#191D24]">Chưa giao bài nào</p>
                  <p className="mt-1 text-[13px] text-[#6A7282]">
                    Nhấn &quot;Giao bài&quot; để giao đề cho học sinh
                  </p>
                </div>
              ) : (
                (() => {
                  const filtered = assignments.filter((a) =>
                    assignFilter === "all"
                      ? true
                      : assignFilter === "open"
                        ? !a.due_at || dayjs(a.due_at).isAfter(dayjs())
                        : !!a.due_at && dayjs(a.due_at).isBefore(dayjs())
                  );
                  return (
                    <div className="overflow-x-auto">
                      <div className="min-w-[820px] overflow-hidden rounded-[14px] border border-[#E5E6E8]">
                        <div
                          className={`${ASSIGN_GRID} bg-[#FAFAFA] px-5 py-3 text-[11px] font-bold uppercase tracking-[0.06em] text-[#6A7282] border-b border-[#F3F4F6]`}
                        >
                          <span>Tên bài</span>
                          <span>Kỹ năng</span>
                          <span>Giao cho</span>
                          <span>Tiến độ</span>
                          <span>Hạn nộp</span>
                          <span />
                        </div>
                        {filtered.length === 0 ? (
                          <p className="px-5 py-8 text-center text-[13px] text-[#6A7282]">
                            Không có bài giao phù hợp.
                          </p>
                        ) : (
                          filtered.map((a) => (
                            <AssignmentRow
                              key={a.id}
                              a={a}
                              studentTotal={students.length}
                              classroomId={classroom.id}
                              onDelete={handleDeleteAssignment}
                              onEditDue={openEditDue}
                            />
                          ))
                        )}
                      </div>
                    </div>
                  );
                })()
              )}
            </>
          )}
        </div>

        {/* Delete class footer */}
        {isOwner ? (
          <div className="flex justify-end border-t border-[#F3F4F6] px-5 py-4">
            <button
              onClick={() => setDeleteOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#E54552] px-4 py-2 text-[13px] font-semibold text-[#E54552] hover:bg-[#FEF2F2] transition-colors"
            >
              <span className="material-symbols-rounded text-[16px]">delete</span>
              Xóa lớp
            </button>
          </div>
        ) : null}
      </div>

      {/* ── Invite modal (Add student / Add teacher) ── */}
      <InviteModal
        open={inviteOpen !== null}
        role={inviteOpen}
        inviteLink={inviteOpen === "teacher" ? teacherLink : studentLink}
        classCode={classroom.invite_code}
        onCopy={copy}
        copied={copied}
        onClose={closeAdd}
      />

      {/* ── Edit class info modal ── */}
      <Modal
        open={editOpen}
        onCancel={() => setEditOpen(false)}
        footer={null}
        closable={false}
        width={480}
        centered
        styles={{ content: { borderRadius: 20, padding: 0 } }}
      >
        <div className="px-7 py-6">
          <div className="mb-5 flex items-start justify-between">
            <h3 className="text-[20px] font-bold text-[#191D24]">Edit class</h3>
            <button
              onClick={() => setEditOpen(false)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F3F4F6] text-[#6A7282] hover:bg-[#E5E6E8] transition-colors"
              aria-label="Đóng"
            >
              <span className="material-symbols-rounded text-[18px]">close</span>
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-[13px] font-bold text-[#191D24]">
                Class name
              </label>
              <input
                value={editName}
                maxLength={120}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="e.g. IELTS Academic 7.5+"
                className="w-full rounded-[11px] border border-[#E5E6E8] px-4 py-3 text-[14px] text-[#191D24] placeholder:text-[#9CA3AF] outline-none focus:border-[#B3E653] transition-colors"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-bold text-[#191D24]">
                Description
              </label>
              <textarea
                value={editDesc}
                maxLength={280}
                rows={3}
                onChange={(e) => setEditDesc(e.target.value)}
                placeholder="Academic prep class targeting band 7.5+."
                className="w-full resize-none rounded-[11px] border border-[#E5E6E8] px-4 py-3 text-[14px] text-[#191D24] placeholder:text-[#9CA3AF] outline-none focus:border-[#B3E653] transition-colors"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-bold text-[#191D24]">
                Schedule
              </label>
              <input
                value={editSchedule}
                maxLength={80}
                onChange={(e) => setEditSchedule(e.target.value)}
                placeholder="Evening · Tue, Thu"
                className="w-full rounded-[11px] border border-[#E5E6E8] px-4 py-3 text-[14px] text-[#191D24] placeholder:text-[#9CA3AF] outline-none focus:border-[#B3E653] transition-colors"
              />
            </div>

            {/* Image upload */}
            <div>
              <label className="mb-1.5 block text-[13px] font-bold text-[#191D24]">Class image</label>
              <div className="flex items-center gap-4">
                <span
                  className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-[12px] border border-[#E5E6E8] text-[18px] font-bold"
                  style={{ background: "#E0EBFF", color: "#2A5BB1" }}
                >
                  {editImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={editImage} alt="" className="h-full w-full object-cover" />
                  ) : (
                    classInitials(editName)
                  )}
                </span>
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer rounded-[10px] border border-[#E5E6E8] px-3.5 py-2 text-[12px] font-semibold text-[#374151] hover:bg-[#F3F4F6] transition-colors">
                    {uploadingImage ? "Đang tải…" : editImage ? "Đổi ảnh" : "Tải ảnh lên"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handlePickImage(e.target.files?.[0] ?? null)}
                    />
                  </label>
                  {editImage ? (
                    <button
                      onClick={() => setEditImage(null)}
                      className="rounded-[10px] px-3 py-2 text-[12px] font-semibold text-[#6A7282] hover:bg-[#F3F4F6] transition-colors"
                    >
                      Xóa ảnh
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={() => setEditOpen(false)}
              className="rounded-full border border-[#E5E6E8] bg-white px-6 py-2.5 text-[13px] font-semibold text-[#374151] hover:bg-[#F3F4F6] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEdit}
              disabled={submitting || uploadingImage}
              className="rounded-full bg-[#B3E653] px-7 py-2.5 text-[13px] font-bold text-[#191D24] hover:bg-[#9AD534] transition-colors disabled:opacity-60"
            >
              {submitting ? "Đang lưu…" : "Save changes"}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Delete class modal (2 steps) ── */}
      <Modal
        open={deleteOpen}
        onCancel={closeDelete}
        footer={null}
        closable={false}
        width={560}
        centered
        styles={{ content: { borderRadius: 20, padding: 0 } }}
        destroyOnClose
      >
        {deleteStep === 1 ? (
          /* Step 1 — overview */
          <div className="px-7 py-6">
            <div className="mb-5 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FFF3E0]">
                  <span className="material-symbols-rounded text-[22px] text-[#F59E0B]">warning</span>
                </span>
                <h3 className="text-[20px] font-bold text-[#191D24]">Delete class</h3>
              </div>
              <button
                onClick={closeDelete}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F3F4F6] text-[#6A7282] hover:bg-[#E5E6E8] transition-colors"
                aria-label="Đóng"
              >
                <span className="material-symbols-rounded text-[18px]">close</span>
              </button>
            </div>

            <p className="mb-4 text-[15px] font-semibold text-[#191D24]">
              You&apos;re about to delete the class &quot;{classroom.name}&quot;?
            </p>

            <div className="mb-4 rounded-[12px] border border-[#FECACA] bg-[#FFF5F5] px-4 py-3.5">
              <div className="flex items-center gap-2 text-[14px] font-bold text-[#E54552]">
                <span className="material-symbols-rounded text-[18px]">warning</span>
                This action CANNOT be undone
              </div>
              <p className="mt-1 pl-7 text-[13px] text-[#6A7282]">
                All assignments, scores, and data for {students.length} students in this class will be deleted.
              </p>
            </div>

            <div className="mb-6 grid grid-cols-3 gap-3">
              {[
                { val: students.length, label: "Students" },
                { val: assignments.length, label: "Assignments" },
                { val: completed, label: "Graded" },
              ].map(({ val, label }) => (
                <div
                  key={label}
                  className="rounded-[12px] border border-[#E5E6E8] bg-[#FAFAFA] px-4 py-3.5"
                >
                  <div className="text-[24px] font-extrabold text-[#191D24]">
                    {String(val).padStart(2, "0")}
                  </div>
                  <div className="text-[12px] text-[#6A7282]">{label}</div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={closeDelete}
                className="rounded-full border border-[#E5E6E8] bg-white px-6 py-2.5 text-[13px] font-semibold text-[#374151] hover:bg-[#F3F4F6] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setDeleteStep(2)}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#E54552] px-6 py-2.5 text-[13px] font-bold text-white hover:bg-[#c73d47] transition-colors"
              >
                Continue deleting →
              </button>
            </div>
          </div>
        ) : (
          /* Step 2 — final confirmation */
          <div className="px-7 py-6">
            <div className="mb-5 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FFF5F5]">
                  <span className="material-symbols-rounded text-[22px] text-[#E54552]">warning</span>
                </span>
                <h3 className="text-[20px] font-bold text-[#191D24]">Final confirmation</h3>
              </div>
              <button
                onClick={closeDelete}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F3F4F6] text-[#6A7282] hover:bg-[#E5E6E8] transition-colors"
                aria-label="Đóng"
              >
                <span className="material-symbols-rounded text-[18px]">close</span>
              </button>
            </div>

            <p className="mb-4 text-[14px] text-[#6A7282]">
              This permanently deletes &quot;{classroom.name}&quot; and all of its assignments, scores and data.
              This cannot be undone.
            </p>

            <div className="mb-5 rounded-[12px] border border-[#FECACA] bg-[#FFF5F5] px-4 py-3 text-[13px] font-semibold text-[#E54552]">
              <span className="material-symbols-rounded mr-2 text-[16px] align-middle">warning</span>
              There is no way to recover this class.
            </div>

            <div className="mb-5">
              <label className="mb-2 block text-[14px] font-bold text-[#191D24]">
                Type the class name to confirm
              </label>
              <div className="relative">
                <input
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  placeholder={classroom.name}
                  className={`w-full rounded-[11px] border px-4 py-3 pr-10 text-[14px] text-[#191D24] placeholder:text-[#9CA3AF] outline-none transition-colors ${
                    deleteConfirm.trim() === classroom.name.trim() && deleteConfirm
                      ? "border-[#16A34A] focus:border-[#16A34A]"
                      : "border-[#E5E6E8] focus:border-[#E54552]"
                  }`}
                />
                {deleteConfirm.trim() === classroom.name.trim() && deleteConfirm ? (
                  <span className="material-symbols-rounded absolute right-3 top-1/2 -translate-y-1/2 text-[18px] text-[#16A34A]">
                    check
                  </span>
                ) : null}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={closeDelete}
                className="rounded-full border border-[#E5E6E8] bg-white px-6 py-2.5 text-[13px] font-semibold text-[#374151] hover:bg-[#F3F4F6] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting || deleteConfirm.trim() !== classroom.name.trim()}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#E54552] px-6 py-2.5 text-[13px] font-bold text-white hover:bg-[#c73d47] transition-colors disabled:opacity-50"
              >
                <span className="material-symbols-rounded text-[16px]">delete</span>
                {deleting ? "Đang xóa…" : "Delete permanently"}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Assign quiz modal (2 steps) ── */}
      <Modal
        open={giaoOpen}
        onCancel={() => !submitting && resetGiao()}
        width={680}
        footer={null}
        closable={false}
        centered
        styles={{ content: { borderRadius: 20, padding: 0 } }}
        destroyOnClose
      >
        <div className="flex items-center justify-between border-b border-[#F3F4F6] px-7 py-5">
          <div className="flex items-center gap-3">
            <span className="material-symbols-rounded text-[24px] text-[#5B8A00]">
              {giaoStep === 1 ? "assignment_add" : "assignment_turned_in"}
            </span>
            <h3 className="text-[20px] font-bold text-[#191D24]">
              {giaoStep === 1
                ? "Chọn bài giao"
                : `Cấu hình bài giao (${selectedQuizzes.length} mục)`}
            </h3>
          </div>
          <button
            onClick={() => !submitting && resetGiao()}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F3F4F6] text-[#6A7282] hover:bg-[#E5E6E8] transition-colors"
            aria-label="Đóng"
          >
            <span className="material-symbols-rounded text-[18px]">close</span>
          </button>
        </div>

        <div className="px-7 py-5">
          {giaoStep === 1 ? (
            <>
              {/* Skill tabs */}
              <div className="mb-5 flex gap-1 rounded-[12px] bg-[#F3F4F6] p-1">
                {(
                  [
                    ["reading", "Reading"],
                    ["listening", "Listening"],
                    ["writing", "Writing"],
                    ["speaking", "Speaking"],
                  ] as const
                ).map(([k, label]) => (
                  <button
                    key={k}
                    onClick={() => setGiaoSkill(k)}
                    className={`flex-1 rounded-[9px] py-2 text-[13px] font-semibold transition-all ${
                      giaoSkill === k
                        ? "bg-white text-[#191D24] shadow-sm"
                        : "text-[#6A7282]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="relative mb-4">
                <span className="material-symbols-rounded absolute left-3.5 top-1/2 -translate-y-1/2 text-[18px] text-[#9CA3AF]">
                  search
                </span>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm kiếm đề thi..."
                  className="w-full rounded-[11px] border border-[#E5E6E8] py-2.5 pl-10 pr-4 text-[14px] text-[#191D24] placeholder:text-[#9CA3AF] outline-none focus:border-[#B3E653] transition-colors"
                />
              </div>

              {/* Filter pills */}
              <div className="mb-3 flex gap-2">
                {(
                  [
                    ["all", "Tất cả"],
                    ["unassigned", "Chưa giao"],
                    ["assigned", "Đã giao"],
                  ] as const
                ).map(([k, label]) => (
                  <button
                    key={k}
                    onClick={() => setGiaoFilter(k)}
                    className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${
                      giaoFilter === k
                        ? "bg-[#F2FADD] text-[#5B8A00]"
                        : "text-[#6A7282] hover:bg-[#F3F4F6]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Quiz list */}
              <div className="max-h-[340px] space-y-2 overflow-y-auto pr-1">
                {loadingQuizzes ? (
                  <p className="py-8 text-center text-[13px] text-[#6A7282]">Đang tải đề…</p>
                ) : (
                  (() => {
                    const list = quizzes.filter((q) =>
                      giaoFilter === "all"
                        ? true
                        : giaoFilter === "assigned"
                          ? assignedQuizIds.has(q.id)
                          : !assignedQuizIds.has(q.id)
                    );
                    if (list.length === 0)
                      return (
                        <p className="py-8 text-center text-[13px] text-[#6A7282]">
                          Không tìm thấy đề thi.
                        </p>
                      );
                    return list.map((q) => {
                      const sel = selectedIds.has(q.id);
                      const assigned = assignedQuizIds.has(q.id);
                      return (
                        <button
                          key={q.id}
                          onClick={() => toggleQuiz(q)}
                          className={`flex w-full items-center gap-3 rounded-[12px] border px-4 py-3 text-left transition-colors ${
                            sel
                              ? "border-[#B3E653] bg-[#F2FADD]"
                              : "border-[#E5E6E8] hover:border-[#B3E653]/60"
                          }`}
                        >
                          <span
                            className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-[5px] border-2 transition-colors ${
                              sel ? "border-[#5B8A00] bg-[#B3E653]" : "border-[#D1D5DB]"
                            }`}
                          >
                            {sel ? (
                              <span className="material-symbols-rounded text-[14px] leading-none text-[#191D24]">
                                check
                              </span>
                            ) : null}
                          </span>
                          <span className="flex-1 truncate text-[14px] font-semibold text-[#191D24]">
                            {q.title}
                          </span>
                          {assigned ? (
                            <span className="flex-shrink-0 text-[11px] font-bold uppercase tracking-wide text-[#9CA3AF]">
                              Đã giao
                            </span>
                          ) : null}
                        </button>
                      );
                    });
                  })()
                )}
              </div>

              <div className="mt-5 flex items-center justify-between">
                <span className="text-[13px] text-[#6A7282]">
                  Đã chọn {selectedQuizzes.length} đề
                </span>
                <button
                  onClick={() => setGiaoStep(2)}
                  disabled={selectedQuizzes.length === 0}
                  className="rounded-full bg-[#B3E653] px-6 py-2.5 text-[13px] font-bold text-[#191D24] hover:bg-[#9AD534] transition-colors disabled:opacity-50"
                >
                  Tiếp tục →
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="mb-2 text-[13px] font-bold text-[#6A7282]">
                Đã chọn ({selectedQuizzes.length})
              </p>
              <div className="space-y-2">
                {selectedQuizzes.map((q) => (
                  <div
                    key={q.id}
                    className="flex items-center gap-3 rounded-[10px] bg-[#F5F6F7] px-3 py-2.5"
                  >
                    <span className="flex-shrink-0 rounded-full border border-blue-300 px-2 py-0.5 text-[11px] font-medium capitalize text-blue-500">
                      {q.skill}
                    </span>
                    <span className="flex-1 truncate text-[14px] font-semibold text-[#191D24]">
                      {q.title}
                    </span>
                    <button
                      onClick={() => toggleQuiz(q)}
                      className="flex h-6 w-6 items-center justify-center rounded-full text-[#6A7282] hover:bg-white transition-colors"
                      aria-label="Bỏ chọn"
                    >
                      <span className="material-symbols-rounded text-[16px]">close</span>
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex items-center justify-between">
                <label className="text-[14px] font-bold text-[#191D24]">Giao cho:</label>
                <button
                  onClick={() => setAudience(audience === "all" ? "subset" : "all")}
                  className="flex items-center gap-2"
                >
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-[5px] border-2 transition-colors ${
                      audience === "all"
                        ? "border-[#5B8A00] bg-[#B3E653]"
                        : "border-[#D1D5DB]"
                    }`}
                  >
                    {audience === "all" ? (
                      <span className="material-symbols-rounded text-[14px] leading-none text-[#191D24]">
                        check
                      </span>
                    ) : null}
                  </span>
                  <span className="text-[13px] text-[#191D24]">
                    Chọn tất cả ({students.length} HS)
                  </span>
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {(showAllChips ? students : students.slice(0, 5)).map((s) => {
                  const sel = audience === "all" || subset.includes(s.user_id);
                  return (
                    <button
                      key={s.user_id}
                      onClick={() => {
                        if (audience === "all") return;
                        setSubset((prev) =>
                          prev.includes(s.user_id)
                            ? prev.filter((x) => x !== s.user_id)
                            : [...prev, s.user_id]
                        );
                      }}
                      className={`rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${
                        sel
                          ? "border-[#B3E653] bg-[#F2FADD] text-[#5B8A00]"
                          : "border-[#E5E6E8] text-[#6A7282]"
                      } ${audience === "all" ? "cursor-default" : ""}`}
                    >
                      {s.name || s.email}
                    </button>
                  );
                })}
                {!showAllChips && students.length > 5 ? (
                  <button
                    onClick={() => setShowAllChips(true)}
                    className="rounded-full bg-[#F3F4F6] px-3.5 py-1.5 text-[13px] font-medium text-[#6A7282] hover:bg-[#E5E6E8] transition-colors"
                  >
                    + {students.length - 5} khác
                  </button>
                ) : null}
                {students.length === 0 ? (
                  <span className="text-[13px] text-[#6A7282]">Chưa có học sinh trong lớp.</span>
                ) : null}
              </div>

              <div className="mt-5">
                <label className="mb-2 block text-[14px] font-bold text-[#191D24]">
                  Ghi chú (tùy chọn)
                </label>
                <textarea
                  value={note}
                  maxLength={500}
                  rows={3}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="VD: Nộp lúc 23:00 Thứ 6"
                  className="w-full resize-none rounded-[11px] border border-[#E5E6E8] px-4 py-3 text-[14px] text-[#191D24] placeholder:text-[#9CA3AF] outline-none focus:border-[#B3E653] transition-colors"
                />
              </div>

              <div className="mt-5">
                <label className="mb-2 block text-[14px] font-bold text-[#191D24]">
                  Hạn nộp (tùy chọn)
                </label>
                <div className="flex gap-3">
                  <DatePicker
                    className="flex-1"
                    size="large"
                    format="DD/MM/YYYY"
                    placeholder="DD/MM/YYYY (gõ hoặc chọn)"
                    value={dueDate}
                    onChange={(v) => setDueDate(v)}
                  />
                  <TimePicker
                    className="w-40"
                    size="large"
                    format="HH:mm"
                    placeholder="--:--"
                    value={dueTime}
                    onChange={(v) => setDueTime(v)}
                  />
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <button
                  onClick={() => setGiaoStep(1)}
                  className="rounded-full border border-[#E5E6E8] px-5 py-2.5 text-[13px] font-semibold text-[#374151] hover:bg-[#F3F4F6] transition-colors"
                >
                  ← Quay lại
                </button>
                <button
                  onClick={handleAssign}
                  disabled={submitting || (audience === "subset" && subset.length === 0)}
                  className="rounded-full bg-[#B3E653] px-6 py-2.5 text-[13px] font-bold text-[#191D24] hover:bg-[#9AD534] transition-colors disabled:opacity-50"
                >
                  {submitting
                    ? "Đang giao…"
                    : `Giao ${selectedQuizzes.length} mục (${
                        audience === "all" ? students.length : subset.length
                      } HS)`}
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* ── QR code modal ── */}
      <Modal
        open={qrOpen}
        onCancel={() => setQrOpen(false)}
        footer={null}
        closable={false}
        width={420}
        centered
        styles={{ content: { borderRadius: 20, padding: 28 } }}
        destroyOnClose
      >
        <div className="mb-4 flex items-start justify-between">
          <h3 className="text-[18px] font-bold text-[#191D24]">Mã QR lớp học</h3>
          <button
            onClick={() => setQrOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F3F4F6] text-[#6A7282] hover:bg-[#E5E6E8] transition-colors"
            aria-label="Đóng"
          >
            <span className="material-symbols-rounded text-[18px]">close</span>
          </button>
        </div>
        <div className="flex flex-col items-center">
          <div className="rounded-[14px] border border-[#E5E6E8] p-4">
            <QRCodeCanvas
              id="classroom-qr-canvas"
              value={studentLink}
              size={220}
              includeMargin
              level="M"
            />
          </div>
          <p className="mt-4 text-[12px] text-[#6A7282]">Mã mời</p>
          <p className="text-[20px] font-bold tracking-[0.15em] text-[#191D24]">
            {classroom.invite_code}
          </p>
          <p className="mt-2 text-center text-[12px] text-[#6A7282]">
            Học sinh quét mã này để vào lớp.
          </p>
          <div className="mt-5 flex w-full gap-3">
            <button
              onClick={() => copy(studentLink, "qr")}
              className="flex-1 rounded-full border border-[#E5E6E8] py-2.5 text-[13px] font-semibold text-[#374151] hover:bg-[#F3F4F6] transition-colors"
            >
              {copied === "qr" ? "Đã sao chép link" : "Sao chép link"}
            </button>
            <button
              onClick={downloadQr}
              className="flex-1 rounded-full bg-[#B3E653] py-2.5 text-[13px] font-bold text-[#191D24] hover:bg-[#9AD534] transition-colors"
            >
              Tải mã QR
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Edit due-date modal ── */}
      <Modal
        open={!!dueEdit}
        onCancel={() => setDueEdit(null)}
        footer={null}
        closable={false}
        width={460}
        centered
        styles={{ content: { borderRadius: 20, padding: 28 } }}
        destroyOnClose
      >
        <div className="mb-4 flex items-start justify-between">
          <h3 className="text-[18px] font-bold text-[#191D24]">Đổi hạn nộp</h3>
          <button
            onClick={() => setDueEdit(null)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F3F4F6] text-[#6A7282] hover:bg-[#E5E6E8] transition-colors"
            aria-label="Đóng"
          >
            <span className="material-symbols-rounded text-[18px]">close</span>
          </button>
        </div>
        <p className="mb-4 text-[13px] text-[#6A7282]">{dueEdit?.quiz_title || "Bài giao"}</p>
        <div className="flex flex-wrap gap-3">
          <div className="flex-1">
            <label className="mb-1.5 block text-[12px] font-bold text-[#191D24]">Ngày</label>
            <DatePicker
              value={editDate}
              onChange={setEditDate}
              format="DD/MM/YYYY"
              placeholder="Chọn ngày"
              className="w-full"
            />
          </div>
          <div className="flex-1">
            <label className="mb-1.5 block text-[12px] font-bold text-[#191D24]">Giờ</label>
            <TimePicker
              value={editTime}
              onChange={setEditTime}
              format="HH:mm"
              placeholder="23:59"
              className="w-full"
            />
          </div>
        </div>
        <p className="mt-2 text-[12px] text-[#6A7282]">
          Để trống ngày = không có hạn nộp. Bỏ trống giờ sẽ mặc định 23:59.
        </p>
        <div className="mt-6 flex justify-between gap-3">
          <button
            onClick={() => {
              setEditDate(null);
              setEditTime(null);
            }}
            className="rounded-full border border-[#E5E6E8] px-4 py-2.5 text-[13px] font-semibold text-[#6A7282] hover:bg-[#F3F4F6] transition-colors"
          >
            Xóa hạn
          </button>
          <div className="flex gap-3">
            <button
              onClick={() => setDueEdit(null)}
              className="rounded-full border border-[#E5E6E8] px-5 py-2.5 text-[13px] font-semibold text-[#374151] hover:bg-[#F3F4F6] transition-colors"
            >
              Huỷ
            </button>
            <button
              onClick={handleSaveDue}
              disabled={submitting}
              className="rounded-full bg-[#B3E653] px-6 py-2.5 text-[13px] font-bold text-[#191D24] hover:bg-[#9AD534] transition-colors disabled:opacity-60"
            >
              {submitting ? "Đang lưu…" : "Lưu"}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Remove member confirm ── */}
      <Modal
        open={!!confirmRemove}
        onCancel={() => setConfirmRemove(null)}
        footer={null}
        closable={false}
        width={420}
        centered
        styles={{ content: { borderRadius: 20, padding: 28 } }}
      >
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FFF5F5]">
              <span className="material-symbols-rounded text-[20px] text-[#E54552]">delete</span>
            </span>
            <h3 className="text-[18px] font-bold text-[#191D24]">Remove student?</h3>
          </div>
          <button
            onClick={() => setConfirmRemove(null)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F3F4F6] text-[#6A7282] hover:bg-[#E5E6E8] transition-colors"
            aria-label="Đóng"
          >
            <span className="material-symbols-rounded text-[18px]">close</span>
          </button>
        </div>
        <p className="text-[14px] text-[#6A7282]">
          <span className="font-semibold text-[#191D24]">
            {confirmRemove?.display_name || confirmRemove?.name || confirmRemove?.email || "Thành viên này"}
          </span>{" "}
          will lose access to &quot;{classroom.name}&quot; and their progress in this class.
          This can&apos;t be undone.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={() => setConfirmRemove(null)}
            className="rounded-full border border-[#E5E6E8] px-5 py-2.5 text-[13px] font-semibold text-[#374151] hover:bg-[#F3F4F6] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => confirmRemove && doRemove(confirmRemove)}
            className="rounded-full bg-[#E54552] px-6 py-2.5 text-[13px] font-bold text-white hover:bg-[#c73d47] transition-colors"
          >
            Remove student
          </button>
        </div>
      </Modal>

      {/* ── Reject join request confirm ── */}
      <Modal
        open={!!confirmReject}
        onCancel={() => setConfirmReject(null)}
        footer={null}
        closable={false}
        width={420}
        centered
        styles={{ content: { borderRadius: 20, padding: 28 } }}
      >
        <h3 className="text-[18px] font-bold text-[#191D24]">Từ chối yêu cầu vào lớp?</h3>
        <p className="mt-2 text-[13px] text-[#6A7282]">
          Từ chối yêu cầu của{" "}
          <span className="font-semibold text-[#191D24]">
            {confirmReject?.name || confirmReject?.email || "người này"}
          </span>
          ? Họ sẽ cần gửi lại yêu cầu nếu muốn tham gia.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={() => setConfirmReject(null)}
            className="rounded-full border border-[#E5E6E8] px-5 py-2.5 text-[13px] font-semibold text-[#374151] hover:bg-[#F3F4F6] transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={() => confirmReject && doReject(confirmReject.user_id)}
            className="rounded-full bg-[#E54552] px-6 py-2.5 text-[13px] font-bold text-white hover:bg-[#c73d47] transition-colors"
          >
            Từ chối
          </button>
        </div>
      </Modal>

      {/* ── Rename member ── */}
      <Modal
        open={!!renameMember}
        onCancel={() => setRenameMember(null)}
        footer={null}
        closable={false}
        width={440}
        centered
        styles={{ content: { borderRadius: 20, padding: 28 } }}
      >
        <div className="mb-4 flex items-start justify-between">
          <h3 className="text-[18px] font-bold text-[#191D24]">Sửa tên trong lớp</h3>
          <button
            onClick={() => setRenameMember(null)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F3F4F6] text-[#6A7282] hover:bg-[#E5E6E8] transition-colors"
            aria-label="Đóng"
          >
            <span className="material-symbols-rounded text-[18px]">close</span>
          </button>
        </div>
        <p className="text-[13px] text-[#6A7282]">
          Tên này chỉ hiển thị trong lớp, không đổi tên tài khoản của thành viên.
        </p>
        <div className="mt-5">
          <label className="mb-1.5 block text-[12px] font-bold text-[#191D24]">Tên hiển thị</label>
          <input
            value={renameValue}
            maxLength={120}
            onChange={(e) => setRenameValue(e.target.value)}
            placeholder={renameMember?.name || "Nhập tên hiển thị"}
            className="w-full rounded-[11px] border border-[#E5E6E8] px-4 py-3 text-[14px] text-[#191D24] outline-none focus:border-[#B3E653] transition-colors"
          />
          <p className="mt-1.5 text-[12px] text-[#6A7282]">
            Để trống để dùng lại tên tài khoản ({renameMember?.name || renameMember?.email || "—"}).
          </p>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={() => setRenameMember(null)}
            className="rounded-full border border-[#E5E6E8] px-5 py-2.5 text-[13px] font-semibold text-[#374151] hover:bg-[#F3F4F6] transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleSaveRename}
            disabled={submitting}
            className="rounded-full bg-[#B3E653] px-6 py-2.5 text-[13px] font-bold text-[#191D24] hover:bg-[#9AD534] transition-colors disabled:opacity-60"
          >
            {submitting ? "Đang lưu…" : "Lưu"}
          </button>
        </div>
      </Modal>
    </div>
  );
};

PageClassroomDetail.Layout = AppShell;
