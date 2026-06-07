import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  Button,
  DatePicker,
  Dropdown,
  Modal,
  Popconfirm,
  Tag,
  TimePicker,
  message,
} from "antd";
import dayjs, { Dayjs } from "dayjs";
import { createClient } from "~supabase/client";
import { ClassroomLayout } from "@/widgets/layouts";
import { getQuizzes } from "~services/quiz";
import {
  addMemberByEmail,
  createAssignments,
  deleteAssignment,
  deleteClassroom,
  regenerateInviteCode,
  removeMember,
} from "~services/classroom";
import type {
  AssignmentWithStats,
  Classroom,
  ClassroomMemberWithUser,
  ClassroomRole,
} from "~services/types/classroom";
import type { Quiz } from "~services/types/database";
import { ROUTES } from "@/shared/routes";
import { QRCodeCanvas } from "qrcode.react";

type Props = {
  classroom: Classroom;
  members: ClassroomMemberWithUser[];
  assignments: AssignmentWithStats[];
  viewerRole: ClassroomRole;
  isOwner: boolean;
};

// avatar tints for member rows (matches Figma colored initials)
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

// ── stat card — exact Figma tokens (44px icon box, 28px value, tint bg) ──
const STAT_TINTS: Record<string, [string, string]> = {
  students: ["#FEF4E2", "#F59E0B"],
  assignments: ["#E8EFFE", "#3B82F6"],
  completed: ["#E5F8EC", "#22C55E"],
  rate: ["#F1EAFC", "#8B5CF6"],
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
  kind: keyof typeof STAT_TINTS;
}) => {
  const [bg, fg] = STAT_TINTS[kind];
  return (
    <div className="flex items-center gap-[14px] rounded-[13px] border border-[#E5E7EB] bg-white px-5 py-[18px] shadow-[0_2px_6px_0_rgba(0,0,0,0.04)]">
      <span
        className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[10px]"
        style={{ background: bg }}
      >
        <span className="material-symbols-rounded text-[22px] leading-none" style={{ color: fg }}>
          {icon}
        </span>
      </span>
      <div className="flex flex-col gap-1">
        <span className="text-[13px] font-medium text-[#6A7282]">{label}</span>
        <span className="text-[28px] font-bold leading-none text-[#191D24]">{value}</span>
      </div>
    </div>
  );
};

const MemberRow = ({
  m,
  isClassOwner,
  canManage,
  historyHref,
  onRemove,
}: {
  m: ClassroomMemberWithUser;
  isClassOwner: boolean;
  canManage: boolean;
  historyHref?: string | null;
  onRemove: (m: ClassroomMemberWithUser) => void;
}) => {
  const [bg, fg] = tintFor(m.user_id);
  const name = m.name || m.email || "Thành viên";
  return (
    <div className="flex items-center gap-[10px] px-5 py-4">
      {m.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={m.avatar_url} alt="" className="h-12 w-12 rounded-full object-cover" />
      ) : (
        <span
          className="flex h-12 w-12 items-center justify-center rounded-full text-base font-bold"
          style={{ background: bg, color: fg }}
        >
          {initial(m.name, m.email)}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className="truncate text-[15px] font-bold text-[#191D24]">
          {historyHref ? (
            <Link href={historyHref} className="hover:text-[#D94A56]">
              {name}
            </Link>
          ) : (
            name
          )}
          {isClassOwner ? <span className="ml-1 font-normal text-[#6A7282]">(Bạn)</span> : null}
        </div>
        <div className="truncate text-[13px] text-[#6A7282]">{m.email || "—"}</div>
      </div>
      <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-[#E5F8EC] px-2 text-[13px] font-medium text-[#16A34A]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#16A34A]" /> Đã tham gia
      </span>
      {canManage && !isClassOwner ? (
        <Popconfirm
          title="Xóa thành viên khỏi lớp?"
          onConfirm={() => onRemove(m)}
          okText="Xóa"
          cancelText="Hủy"
          okButtonProps={{ danger: true }}
        >
          <button className="inline-flex items-center gap-2 rounded-[8px] border border-[#E5E7EB] px-3.5 py-1 text-[14px] font-semibold text-[#374151] hover:bg-gray-50">
            <span className="material-symbols-rounded text-[18px]">delete</span>
            Xóa
          </button>
        </Popconfirm>
      ) : (
        <span className="w-7" />
      )}
    </div>
  );
};

const SKILL_PILL: Record<string, string> = {
  reading: "bg-blue-50 text-blue-600",
  listening: "bg-purple-50 text-purple-600",
  writing: "bg-green-50 text-green-600",
  speaking: "bg-amber-50 text-amber-600",
};
const ASSIGN_GRID =
  "grid grid-cols-[1fr_104px_96px_150px_144px_130px] items-center gap-3";

const AssignmentRow = ({
  a,
  studentTotal,
  classroomId,
  onDelete,
}: {
  a: AssignmentWithStats;
  studentTotal: number;
  classroomId: string;
  onDelete: (id: string) => void;
}) => {
  const ratio = a.target_count ? Math.round((a.submitted_count / a.target_count) * 100) : 0;
  let dueLabel = "";
  let dueColor = "#6A7282";
  if (a.due_at) {
    const d = dayjs(a.due_at);
    if (d.isBefore(dayjs())) {
      dueLabel = "Quá hạn";
      dueColor = "#D94A56";
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
        <div className="text-[15px] font-bold leading-snug text-[#191D24]">
          {a.quiz_title || "Đề không khả dụng"}
        </div>
        {a.quiz_source || a.note ? (
          <div className="text-[13px] text-[#6A7282]">{a.quiz_source || a.note}</div>
        ) : null}
      </div>
      <div>
        {a.quiz_skill ? (
          <span
            className={`rounded-full px-3 py-1 text-[13px] font-medium capitalize ${
              SKILL_PILL[a.quiz_skill] ?? "bg-gray-100 text-gray-600"
            }`}
          >
            {a.quiz_skill}
          </span>
        ) : null}
      </div>
      <div className="text-[15px] font-semibold text-[#191D24]">
        {a.target_count}/{studentTotal}
      </div>
      <div className="pr-4">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#F3F4F6]">
          <div className="h-full rounded-full bg-[#D94A56]" style={{ width: `${ratio}%` }} />
        </div>
        <div className="mt-1 text-[13px] text-[#6A7282]">
          {a.submitted_count}/{a.target_count} hoàn thành
        </div>
      </div>
      <div>
        <div className="text-[14px] text-[#191D24]">
          {a.due_at ? dayjs(a.due_at).format("DD/MM HH:mm") : "Không có hạn"}
        </div>
        {a.due_at ? (
          <div className="text-[13px] font-semibold" style={{ color: dueColor }}>
            {dueLabel}
          </div>
        ) : null}
      </div>
      <div className="flex items-center justify-end gap-1">
        <Link
          href={ROUTES.CLASSROOM.ASSIGNMENT_DETAIL(classroomId, a.id)}
          className="whitespace-nowrap rounded-[8px] border border-[#E5E7EB] px-3 py-1.5 text-[13px] font-semibold text-[#374151] hover:bg-gray-50"
        >
          Chi tiết
        </Link>
        <Dropdown
          trigger={["click"]}
          menu={{
            items: [
              { key: "report", label: <Link href={ROUTES.CLASSROOM.TRACKING(classroomId)}>Báo cáo</Link> },
              { type: "divider" },
              { key: "delete", label: "Xóa bài giao", danger: true },
            ],
            onClick: ({ key }) => {
              if (key === "delete") onDelete(a.id);
            },
          }}
        >
          <button className="flex h-8 w-8 items-center justify-center rounded-[8px] text-[#6A7282] hover:bg-gray-100">
            <span className="material-symbols-rounded text-[20px]">more_vert</span>
          </button>
        </Dropdown>
      </div>
    </div>
  );
};

export const PageClassroomDetail = ({
  classroom: initialClassroom,
  members,
  assignments,
  viewerRole,
  isOwner,
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
  const [activeTab, setActiveTab] = useState<"members" | "assignments">(
    router.query.tab === "assignments" ? "assignments" : "members"
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

  const [addOpen, setAddOpen] = useState<null | ClassroomRole>(null);
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
    // Only reading/listening quizzes exist in the system.
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
    setAddOpen(null);
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
      await addMemberByEmail(supabase, classroom.id, email, addOpen!);
      message.success("Đã thêm thành viên");
      setAddOpen(null);
      setAddEmail("");
      setAddErr("");
      refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      message.error(
        msg.includes("USER_NOT_FOUND")
          ? "Không tìm thấy người dùng với email này."
          : "Không thêm được thành viên."
      );
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (m: ClassroomMemberWithUser) => {
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

  const shownMembers = memberFilter === "teacher" ? teachers : students;

  return (
    <div className="flex flex-col gap-5">
      <Link
        href={ROUTES.CLASSROOM.LIST}
        className="inline-flex items-center gap-2 text-[14px] font-medium text-[#6A7282] hover:text-[#D94A56]"
      >
        <span className="material-symbols-rounded text-[18px]">arrow_back</span>
        Quay lại danh sách lớp
      </Link>

      {/* ── Class header card ── */}
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-[13px] border border-[#E5E7EB] bg-white p-6 shadow-[0_2px_8px_0_rgba(0,0,0,0.04)]">
        <div className="flex items-start gap-4">
          <span
            className="flex h-14 w-14 items-center justify-center rounded-[13px] border text-[20px] font-bold"
            style={{ background: "#E0EBFF", borderColor: "#C6D7F5", color: "#2A5BB1" }}
          >
            {classroom.name.trim().charAt(0).toUpperCase()}
            {classroom.name.trim().split(/\s+/)[1]?.charAt(0).toUpperCase() ?? ""}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[24px] font-bold leading-9 text-[#181C23]">{classroom.name}</h2>
              {classroom.status === "closed" ? <Tag>Đã đóng</Tag> : null}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-4 text-[13px] text-[#594141]">
              {classroom.description ? (
                <span className="inline-flex items-center gap-1.5">
                  <span className="material-symbols-rounded text-[15px]">schedule</span>
                  {classroom.description}
                </span>
              ) : null}
              <span className="inline-flex items-center gap-1.5">
                <span className="material-symbols-rounded text-[15px]">person</span>
                {students.length} Học viên
              </span>
            </div>
          </div>
        </div>

        {isTeacher ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-[11px] border border-[#E5E7EB] px-3.5 py-2 shadow-[0_1px_2px_0_rgba(0,0,0,0.03)]">
              <span className="text-[14px] text-[#6A7282]">Mã mời:</span>
              <span className="text-[16px] font-bold tracking-[0.15em] text-[#D94A56]">
                {classroom.invite_code}
              </span>
              <button
                onClick={() => copy(classroom.invite_code, "code")}
                className="ml-0.5 text-[#9CA3AF] hover:text-[#D94A56]"
                title="Sao chép mã"
              >
                <span className="material-symbols-rounded text-[18px]">
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
                ],
                onClick: ({ key }) => {
                  if (key === "qr") setQrOpen(true);
                  else if (key === "s") copy(studentLink, "s");
                  else if (key === "t") copy(teacherLink, "t");
                  else if (key === "r") handleRegenerate();
                },
              }}
            >
              <button className="flex h-10 w-10 items-center justify-center rounded-[6px] border border-[#E5E7EB] text-[#6A7282] hover:bg-gray-50">
                <span className="material-symbols-rounded text-[20px]">settings</span>
              </button>
            </Dropdown>
          </div>
        ) : (
          <Link href={ROUTES.CLASSROOM.MY_ASSIGNMENTS}>
            <Button type="primary">Bài tập của tôi</Button>
          </Link>
        )}
      </div>

      {/* ── Metrics (teacher) ── */}
      {isTeacher ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard kind="students" icon="group" label="Học sinh" value={students.length} />
          <StatCard kind="assignments" icon="assignment" label="Bài đã giao" value={assignments.length} />
          <StatCard kind="completed" icon="task_alt" label="Hoàn thành" value={completed} />
          <StatCard kind="rate" icon="trending_up" label="Tỷ lệ nộp" value={`${submitRate}%`} />
        </div>
      ) : null}

      {/* ── Tab card ── */}
      <div className="overflow-hidden rounded-[16px] border border-[#E5E7EB] bg-white shadow-[0_2px_8px_0_rgba(0,0,0,0.04)]">
        {isTeacher ? (
          <div className="flex gap-1 px-6 pt-4">
            {([
              { key: "members", label: "Thành viên", count: members.length },
              { key: "assignments", label: "Bài giao", count: assignments.length },
            ] as const).map((t) => {
              const on = activeTab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className={`-mb-px flex items-center gap-2.5 px-4 pb-4 pt-3 text-[15px] ${
                    on
                      ? "border-b-[3px] border-[#D94A56] font-bold text-[#D94A56]"
                      : "border-b-[3px] border-transparent font-medium text-[#6A7282]"
                  }`}
                >
                  {t.label}
                  <span
                    className={`rounded-[8px] px-2 py-0.5 text-[12px] font-bold ${
                      on ? "bg-[#FCE8EA] text-[#D94A56]" : "bg-[#F3F4F6] text-[#6A7282]"
                    }`}
                  >
                    {t.count}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="px-6 pt-5 text-[15px] font-bold text-[#191D24]">Thành viên</div>
        )}
        <div className="border-t border-[#E5E7EB]" />

        <div className="flex flex-col gap-4 p-6">
          {activeTab === "members" || !isTeacher ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex gap-2.5">
                  <button
                    onClick={() => setMemberFilter("teacher")}
                    className={`rounded-[30px] px-3.5 py-2 text-[13px] font-bold ${
                      memberFilter === "teacher"
                        ? "bg-[#D94A56] text-white"
                        : "border border-[#E5E7EB] text-[#6A7282]"
                    }`}
                  >
                    Giáo Viên ({teachers.length})
                  </button>
                  <button
                    onClick={() => setMemberFilter("student")}
                    className={`rounded-[30px] px-3.5 py-2 text-[13px] font-bold ${
                      memberFilter === "student"
                        ? "bg-[#D94A56] text-white"
                        : "border border-[#E5E7EB] text-[#6A7282]"
                    }`}
                  >
                    Học Sinh ({students.length})
                  </button>
                </div>
                {isTeacher ? (
                  <div className="flex gap-2.5">
                    <button
                      onClick={() => setAddOpen("teacher")}
                      className="inline-flex items-center gap-2 rounded-[10px] border-[1.5px] border-[#D94A56] py-2 pl-5 pr-[22px] text-[14px] font-bold text-[#D94A56] hover:bg-[#FCE8EA]"
                    >
                      <span className="material-symbols-rounded text-[18px]">person_add</span>
                      Thêm GV
                    </button>
                    <button
                      onClick={() => setAddOpen("student")}
                      className="inline-flex items-center gap-2 rounded-[10px] bg-[#D94A56] py-2 pl-5 pr-[22px] text-[14px] font-bold text-white shadow-[0_4px_12px_0_rgba(217,74,87,0.25)] hover:bg-[#c8404b]"
                    >
                      <span className="material-symbols-rounded text-[18px]">person_add</span>
                      Thêm HS
                    </button>
                  </div>
                ) : null}
              </div>

              {shownMembers.length === 0 ? (
                <div className="flex flex-col items-center py-16 text-center">
                  <span className="flex h-20 w-20 items-center justify-center rounded-full bg-[#FCE8EA]">
                    <span className="material-symbols-rounded !text-[36px] leading-none text-[#D94A56]">
                      group_add
                    </span>
                  </span>
                  <p className="mt-5 text-xl font-bold text-[#191D24]">
                    {memberFilter === "student" ? "Chưa có học sinh nào" : "Chưa có thành viên nào"}
                  </p>
                  <p className="mt-1 text-[14px] text-[#6A7282]">
                    {memberFilter === "student"
                      ? 'Sử dụng mã mời hoặc nút "Thêm HS" để mời học viên'
                      : 'Sử dụng mã mời hoặc nút "Thêm GV" để mời giáo viên'}
                  </p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-[10px] border border-[#E5E7EB]">
                  <div className="flex items-center justify-between bg-[#FAFAFA] px-5 py-3">
                    <span className="text-[11px] font-bold uppercase tracking-[0.09em] text-[#6A7282]">
                      Thông tin
                    </span>
                    <span className="text-[11px] font-bold uppercase tracking-[0.09em] text-[#6A7282]">
                      Tùy chọn
                    </span>
                  </div>
                  <div className="divide-y divide-[#F3F4F6]">
                    {shownMembers.map((m) => (
                      <MemberRow
                        key={m.id}
                        m={m}
                        isClassOwner={m.user_id === classroom.owner_id}
                        canManage={isTeacher}
                        historyHref={
                          isTeacher && m.role === "student"
                            ? ROUTES.CLASSROOM.STUDENT_HISTORY(classroom.id, m.user_id)
                            : null
                        }
                        onRemove={handleRemove}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
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
                      className={`rounded-full px-4 py-2 text-[13px] font-bold ${
                        assignFilter === k
                          ? "bg-[#D94A56] text-white"
                          : "border border-[#E5E7EB] text-[#6A7282]"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setGiaoOpen(true)}
                  className="inline-flex items-center gap-2 rounded-[10px] bg-[#D94A56] px-5 py-2.5 text-[14px] font-bold text-white shadow-[0_4px_12px_0_rgba(217,74,87,0.25)] hover:bg-[#c8404b]"
                >
                  <span className="material-symbols-rounded text-[18px]">add</span>
                  Giao bài
                </button>
              </div>

              {assignments.length === 0 ? (
                <div className="flex flex-col items-center py-16 text-center">
                  <span className="flex h-20 w-20 items-center justify-center rounded-full bg-[#FCE8EA]">
                    <span className="material-symbols-rounded !text-[36px] leading-none text-[#D94A56]">
                      assignment
                    </span>
                  </span>
                  <p className="mt-5 text-xl font-bold text-[#191D24]">Chưa giao bài nào</p>
                  <p className="mt-1 text-[14px] text-[#6A7282]">
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
                      <div className="min-w-[820px] overflow-hidden rounded-[12px] border border-[#E5E7EB]">
                        <div
                          className={`${ASSIGN_GRID} bg-[#FAFAFA] px-5 py-3 text-[11px] font-bold uppercase tracking-[0.06em] text-[#9CA3AF]`}
                        >
                          <span>Tên bài</span>
                          <span>Kỹ năng</span>
                          <span>Giao cho</span>
                          <span>Tiến độ</span>
                          <span>Hạn nộp</span>
                          <span />
                        </div>
                        {filtered.length === 0 ? (
                          <p className="px-5 py-8 text-center text-[14px] text-[#6A7282]">
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

        {isOwner ? (
          <div className="flex justify-end border-t border-[#F3F4F6] px-6 py-4">
            <button
              onClick={() => setDeleteOpen(true)}
              className="inline-flex items-center gap-2 rounded-[10px] border-[1.5px] border-[#D94A56] px-5 py-2 text-[14px] font-bold text-[#D94A56] hover:bg-[#FCE8EA]"
            >
              <span className="material-symbols-rounded text-[18px]">delete</span>
              Xóa lớp
            </button>
          </div>
        ) : null}
      </div>

      {/* ── Add member modal ── */}
      <Modal
        open={addOpen !== null}
        onCancel={closeAdd}
        footer={null}
        closable={false}
        width={520}
        centered
        styles={{ content: { borderRadius: 16, padding: 28 } }}
        destroyOnClose
      >
        <div className="flex items-start justify-between">
          <h3 className="text-[22px] font-bold text-[#191D24]">
            {addOpen === "teacher" ? "Thêm giáo viên" : "Thêm học sinh"}
          </h3>
          <button
            onClick={closeAdd}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F3F4F6] text-[#6A7282] hover:bg-[#E5E7EB]"
            aria-label="Đóng"
          >
            <span className="material-symbols-rounded text-[18px]">close</span>
          </button>
        </div>
        <p className="mt-3 text-[15px] text-[#6A7282]">
          Nhập email tài khoản đã đăng ký. Hoặc chia sẻ mã / link mời để họ tự tham gia.
        </p>
        <div className="mt-5">
          <label className="mb-2 block text-[15px] font-bold text-[#191D24]">Email</label>
          <input
            value={addEmail}
            onChange={(e) => {
              setAddEmail(e.target.value);
              if (addErr) setAddErr("");
            }}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="vd: hocsinh@email.com"
            className={`w-full rounded-[11px] border px-4 py-3 text-[15px] text-[#191D24] placeholder:text-[#9CA3AF] outline-none transition focus:border-[#D94A56] ${
              addErr ? "border-[#D94A56]" : "border-[#E5E7EB]"
            }`}
          />
          {addErr ? <p className="mt-1 text-[13px] text-[#D94A56]">{addErr}</p> : null}
        </div>
        <div className="mt-8 flex justify-end gap-3">
          <button
            onClick={closeAdd}
            className="rounded-[10px] border border-[#E5E7EB] bg-white px-6 py-2.5 text-[15px] font-bold text-[#374151] hover:bg-gray-50"
          >
            Hủy
          </button>
          <button
            onClick={handleAdd}
            disabled={adding}
            className="rounded-[10px] bg-[#D94A56] px-7 py-2.5 text-[15px] font-bold text-white shadow-[0_4px_12px_0_rgba(217,74,87,0.25)] hover:bg-[#c8404b] disabled:opacity-60"
          >
            {adding ? "Đang thêm…" : "Thêm"}
          </button>
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
        styles={{ content: { borderRadius: 16, padding: 0 } }}
        destroyOnClose
      >
        <div className="flex items-center justify-between border-b border-[#F3F4F6] px-7 py-5">
          <div className="flex items-center gap-3">
            <span
              className="material-symbols-rounded text-[26px]"
              style={{ color: deleteStep === 1 ? "#EA580C" : "#D94A56" }}
            >
              {deleteStep === 1 ? "warning" : "delete"}
            </span>
            <h3 className="text-[22px] font-bold text-[#191D24]">
              {deleteStep === 1 ? "Xác nhận xóa lớp" : "Bước cuối · Xác nhận xóa"}
            </h3>
          </div>
          <button
            onClick={closeDelete}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F3F4F6] text-[#6A7282] hover:bg-[#E5E7EB]"
            aria-label="Đóng"
          >
            <span className="material-symbols-rounded text-[18px]">close</span>
          </button>
        </div>

        <div className="px-7 py-5">
          {deleteStep === 1 ? (
            <>
              <p className="text-[16px] font-bold text-[#191D24]">
                Bạn sắp xóa lớp “{classroom.name}”?
              </p>
              <div className="mt-4 rounded-[12px] border border-[#FDBA74] bg-[#FFF7ED] px-4 py-3.5">
                <div className="flex items-center gap-2 text-[15px] font-bold text-[#EA580C]">
                  <span className="material-symbols-rounded text-[20px]">warning</span>
                  Hành động này KHÔNG THỂ HOÀN TÁC
                </div>
                <p className="mt-1 pl-7 text-[14px] text-[#6A7282]">
                  Toàn bộ bài giao, điểm số, và dữ liệu của {students.length} học sinh trong lớp sẽ bị xóa
                </p>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="rounded-[12px] border border-[#F3F4F6] bg-[#FAFAFA] px-4 py-3.5">
                  <div className="text-[24px] font-extrabold text-[#191D24]">{students.length}</div>
                  <div className="text-[13px] text-[#6A7282]">Học sinh</div>
                </div>
                <div className="rounded-[12px] border border-[#F3F4F6] bg-[#FAFAFA] px-4 py-3.5">
                  <div className="text-[24px] font-extrabold text-[#191D24]">{assignments.length}</div>
                  <div className="text-[13px] text-[#6A7282]">Bài giao</div>
                </div>
                <div className="rounded-[12px] border border-[#F3F4F6] bg-[#FAFAFA] px-4 py-3.5">
                  <div className="text-[24px] font-extrabold text-[#191D24]">{completed}</div>
                  <div className="text-[13px] text-[#6A7282]">Hoàn thành</div>
                </div>
              </div>
            </>
          ) : (
            <>
              <span className="inline-block rounded-[8px] border border-[#D94A56] px-3 py-1 text-[12px] font-bold uppercase tracking-wide text-[#D94A56]">
                Bước cuối · 2/2
              </span>
              <p className="mt-3 text-[15px] text-[#374151]">
                Để xác nhận xóa, hãy nhập chính xác tên lớp dưới đây:
              </p>
              <div className="mt-4 flex items-center gap-3">
                <span className="text-[14px] text-[#6A7282]">Tên lớp:</span>
                <span className="rounded-[8px] bg-[#FCE8EA] px-3 py-1.5 text-[15px] font-bold text-[#D94A56]">
                  {classroom.name}
                </span>
              </div>
              <label className="mb-2 mt-4 block text-[15px] font-bold text-[#191D24]">
                Nhập tên lớp để xác nhận <span className="text-[#D94A56]">*</span>
              </label>
              <div className="relative">
                <input
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  placeholder="Nhập tên lớp để xác nhận"
                  className={`w-full rounded-[11px] border px-4 py-3 pr-10 text-[15px] text-[#191D24] placeholder:text-[#9CA3AF] outline-none transition ${
                    deleteConfirm.trim() === classroom.name.trim() && deleteConfirm
                      ? "border-[#16A34A]"
                      : "border-[#E5E7EB] focus:border-[#D94A56]"
                  }`}
                />
                {deleteConfirm.trim() === classroom.name.trim() && deleteConfirm ? (
                  <span className="material-symbols-rounded absolute right-3 top-1/2 -translate-y-1/2 text-[20px] text-[#16A34A]">
                    check
                  </span>
                ) : null}
              </div>
              {deleteConfirm.trim() === classroom.name.trim() && deleteConfirm ? (
                <p className="mt-1.5 flex items-center gap-1 text-[14px] font-medium text-[#16A34A]">
                  <span className="material-symbols-rounded text-[16px]">check</span>
                  Tên lớp khớp. Bạn có thể tiếp tục.
                </p>
              ) : null}
            </>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-[#F3F4F6] px-7 py-4">
          <button
            onClick={closeDelete}
            className="rounded-[10px] border border-[#E5E7EB] bg-white px-6 py-2.5 text-[15px] font-bold text-[#374151] hover:bg-gray-50"
          >
            Huỷ
          </button>
          {deleteStep === 1 ? (
            <button
              onClick={() => setDeleteStep(2)}
              className="rounded-[10px] bg-[#D94A56] px-6 py-2.5 text-[15px] font-bold text-white shadow-[0_4px_12px_0_rgba(217,74,87,0.25)] hover:bg-[#c8404b]"
            >
              Tiếp tục xóa →
            </button>
          ) : (
            <button
              onClick={handleDelete}
              disabled={deleting || deleteConfirm.trim() !== classroom.name.trim()}
              className="inline-flex items-center gap-2 rounded-[10px] bg-[#D94A56] px-6 py-2.5 text-[15px] font-bold text-white shadow-[0_4px_12px_0_rgba(217,74,87,0.25)] hover:bg-[#c8404b] disabled:opacity-50"
            >
              <span className="material-symbols-rounded text-[18px]">delete</span>
              {deleting ? "Đang xóa…" : "Xóa vĩnh viễn"}
            </button>
          )}
        </div>
      </Modal>

      {/* ── Giao bài modal (2 steps) ── */}
      <Modal
        open={giaoOpen}
        onCancel={() => !submitting && resetGiao()}
        width={680}
        footer={null}
        closable={false}
        centered
        styles={{ content: { borderRadius: 16, padding: 0 } }}
        destroyOnClose
      >
        <div className="flex items-center justify-between border-b border-[#F3F4F6] px-7 py-5">
          <div className="flex items-center gap-3">
            <span className="material-symbols-rounded text-[26px] text-[#D94A56]">
              {giaoStep === 1 ? "assignment_add" : "assignment_turned_in"}
            </span>
            <h3 className="text-[22px] font-bold text-[#191D24]">
              {giaoStep === 1
                ? "Chọn bài giao"
                : `Cấu hình bài giao (${selectedQuizzes.length} mục)`}
            </h3>
          </div>
          <button
            onClick={() => !submitting && resetGiao()}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F3F4F6] text-[#6A7282] hover:bg-[#E5E7EB]"
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
                    className={`flex-1 rounded-[9px] py-2 text-[14px] font-semibold ${
                      giaoSkill === k ? "bg-white text-[#D94A56] shadow-sm" : "text-[#6A7282]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="relative mb-5">
                <span className="material-symbols-rounded absolute left-3.5 top-1/2 -translate-y-1/2 text-[20px] text-[#9CA3AF]">
                  search
                </span>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm kiếm đề thi..."
                  className="w-full rounded-[11px] border-[2px] border-[#D94A56] py-2 pl-11 pr-4 text-[15px] text-[#191D24] placeholder:text-[#9CA3AF] outline-none"
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
                    className={`rounded-full px-4 py-1.5 text-[14px] font-semibold ${
                      giaoFilter === k ? "bg-[#FCE8EA] text-[#D94A56]" : "text-[#6A7282] hover:bg-gray-50"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* List */}
              <div className="max-h-[340px] space-y-2.5 overflow-y-auto pr-1">
                {loadingQuizzes ? (
                  <p className="py-8 text-center text-[#6A7282]">Đang tải đề…</p>
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
                      return <p className="py-8 text-center text-[#6A7282]">Không tìm thấy đề thi.</p>;
                    return list.map((q) => {
                      const sel = selectedIds.has(q.id);
                      const assigned = assignedQuizIds.has(q.id);
                      return (
                        <button
                          key={q.id}
                          onClick={() => toggleQuiz(q)}
                          className={`flex w-full items-center gap-3 rounded-[12px] border px-4 py-3.5 text-left transition ${
                            sel ? "border-[#D94A56] bg-[#FCE8EA]" : "border-[#E5E7EB] hover:border-[#D94A56]/40"
                          }`}
                        >
                          <span
                            className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-[7px] border-2 ${
                              sel ? "border-[#D94A56] bg-[#D94A56] text-white" : "border-[#D1D5DB]"
                            }`}
                          >
                            {sel ? (
                              <span className="material-symbols-rounded text-[16px] leading-none">check</span>
                            ) : null}
                          </span>
                          <span className="flex-1 truncate text-[15px] font-bold text-[#191D24]">
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

              {/* Footer */}
              <div className="mt-5 flex items-center justify-between">
                <span className="text-[14px] text-[#6A7282]">Đã chọn {selectedQuizzes.length} đề</span>
                <button
                  onClick={() => setGiaoStep(2)}
                  disabled={selectedQuizzes.length === 0}
                  className="rounded-[10px] bg-[#D94A56] px-6 py-2.5 text-[15px] font-bold text-white shadow-[0_4px_12px_0_rgba(217,74,87,0.25)] hover:bg-[#c8404b] disabled:opacity-50"
                >
                  Tiếp tục →
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Selected list */}
              <p className="mb-2 text-[14px] font-bold text-[#6A7282]">
                Đã chọn ({selectedQuizzes.length})
              </p>
              <div className="space-y-2">
                {selectedQuizzes.map((q) => (
                  <div
                    key={q.id}
                    className="flex items-center gap-3 rounded-[10px] bg-[#F3F4F6] px-3 py-2.5"
                  >
                    <span className="flex-shrink-0 rounded-full border border-blue-400 px-2 py-0.5 text-[12px] font-medium capitalize text-blue-500">
                      {q.skill}
                    </span>
                    <span className="flex-1 truncate text-[15px] font-bold text-[#191D24]">
                      {q.title}
                    </span>
                    <button
                      onClick={() => toggleQuiz(q)}
                      className="flex h-7 w-7 items-center justify-center rounded-full text-[#D94A56] hover:bg-white"
                      aria-label="Bỏ chọn"
                    >
                      <span className="material-symbols-rounded text-[18px]">close</span>
                    </button>
                  </div>
                ))}
              </div>

              {/* Giao cho */}
              <div className="mt-5 flex items-center justify-between">
                <label className="text-[15px] font-bold text-[#191D24]">Giao cho:</label>
                <button
                  onClick={() => setAudience(audience === "all" ? "subset" : "all")}
                  className="flex items-center gap-2"
                >
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-[7px] border-2 ${
                      audience === "all" ? "border-[#D94A56] bg-[#D94A56] text-white" : "border-[#D1D5DB]"
                    }`}
                  >
                    {audience === "all" ? (
                      <span className="material-symbols-rounded text-[16px] leading-none">check</span>
                    ) : null}
                  </span>
                  <span className="text-[14px] text-[#191D24]">
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
                      className={`rounded-full border px-3.5 py-1.5 text-[14px] font-semibold ${
                        sel ? "border-[#D94A56] text-[#D94A56]" : "border-[#E5E7EB] text-[#6A7282]"
                      } ${audience === "all" ? "cursor-default" : ""}`}
                    >
                      {s.name || s.email}
                    </button>
                  );
                })}
                {!showAllChips && students.length > 5 ? (
                  <button
                    onClick={() => setShowAllChips(true)}
                    className="rounded-full bg-[#F3F4F6] px-3.5 py-1.5 text-[14px] font-medium text-[#6A7282]"
                  >
                    + {students.length - 5} khác
                  </button>
                ) : null}
                {students.length === 0 ? (
                  <span className="text-[14px] text-[#6A7282]">Chưa có học sinh trong lớp.</span>
                ) : null}
              </div>

              {/* Note */}
              <div className="mt-5">
                <label className="mb-2 block text-[15px] font-bold text-[#191D24]">
                  Ghi chú (tùy chọn)
                </label>
                <textarea
                  value={note}
                  maxLength={500}
                  rows={3}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="VD: Nộp lúc 23:00 Thứ 6"
                  className="w-full resize-none rounded-[11px] border border-[#E5E7EB] px-4 py-3 text-[15px] text-[#191D24] placeholder:text-[#9CA3AF] outline-none focus:border-[#D94A56]"
                />
              </div>

              {/* Due date + time */}
              <div className="mt-5">
                <label className="mb-2 block text-[15px] font-bold text-[#191D24]">
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

              {/* Footer */}
              <div className="mt-6 flex items-center justify-between">
                <button
                  onClick={() => setGiaoStep(1)}
                  className="rounded-[10px] border border-[#E5E7EB] px-5 py-2.5 text-[15px] font-bold text-[#374151] hover:bg-gray-50"
                >
                  ← Quay lại
                </button>
                <button
                  onClick={handleAssign}
                  disabled={submitting || (audience === "subset" && subset.length === 0)}
                  className="rounded-[10px] bg-[#D94A56] px-6 py-2.5 text-[15px] font-bold text-white shadow-[0_4px_12px_0_rgba(217,74,87,0.25)] hover:bg-[#c8404b] disabled:opacity-50"
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
        styles={{ content: { borderRadius: 16, padding: 28 } }}
        destroyOnClose
      >
        <div className="mb-4 flex items-start justify-between">
          <h3 className="text-[20px] font-bold text-[#191D24]">Mã QR lớp học</h3>
          <button
            onClick={() => setQrOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F3F4F6] text-[#6A7282] hover:bg-[#E5E7EB]"
            aria-label="Đóng"
          >
            <span className="material-symbols-rounded text-[18px]">close</span>
          </button>
        </div>
        <div className="flex flex-col items-center">
          <div className="rounded-[14px] border border-[#E5E7EB] p-4">
            <QRCodeCanvas
              id="classroom-qr-canvas"
              value={studentLink}
              size={220}
              includeMargin
              level="M"
            />
          </div>
          <p className="mt-4 text-[13px] text-[#6A7282]">Mã mời</p>
          <p className="text-[20px] font-bold tracking-[0.15em] text-[#D94A56]">
            {classroom.invite_code}
          </p>
          <p className="mt-2 text-center text-[13px] text-[#6A7282]">
            Học sinh quét mã này để vào lớp.
          </p>
          <div className="mt-5 flex w-full gap-3">
            <button
              onClick={() => copy(studentLink, "qr")}
              className="flex-1 rounded-[10px] border border-[#E5E7EB] py-2.5 text-[14px] font-bold text-[#374151] hover:bg-gray-50"
            >
              {copied === "qr" ? "Đã sao chép link" : "Sao chép link"}
            </button>
            <button
              onClick={downloadQr}
              className="flex-1 rounded-[10px] bg-[#D94A56] py-2.5 text-[14px] font-bold text-white shadow-[0_4px_12px_0_rgba(217,74,87,0.25)] hover:bg-[#c8404b]"
            >
              Tải mã QR
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

PageClassroomDetail.Layout = ClassroomLayout;
