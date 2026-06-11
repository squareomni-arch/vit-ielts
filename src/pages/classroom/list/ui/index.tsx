import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { twMerge } from "tailwind-merge";
import { Dropdown, Modal, message } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import { createClient } from "~supabase/client";
import { useAuth } from "@/appx/providers";
import { AppShell } from "@/widgets/layouts";
import { ClassroomQrScanner } from "../../qr-scanner";
import { createClassroom, joinClassroomByCode } from "~services/classroom";
import type {
  ClassroomSummary,
  TeacherDashboardStats,
  StudentDashboardStats,
} from "~services/types/classroom";
import { ROUTES } from "@/shared/routes";

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = {
  isTeacher: boolean;
  classrooms: ClassroomSummary[];
  stats: TeacherDashboardStats | null;
  studentStats: StudentDashboardStats | null;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TINTS = ["#D94A56", "#2563EB", "#7C3AED", "#0EA5E9", "#16A34A", "#EA580C"];
const tintFor = (k: string) =>
  TINTS[[...k].reduce((a, c) => a + c.charCodeAt(0), 0) % TINTS.length];
const avatarInitials = (name: string) =>
  name.trim().toUpperCase().split(/\s+/).slice(0, 2).map((w) => w[0]).join("") || "LC";

// Pastel background from a hex tint: e.g. #D94A56 → "#D94A5626"
const pastelBg = (tint: string) => `${tint}26`;

const fieldBase =
  "w-full rounded-[11px] border px-4 py-3 text-[15px] text-[#191D24] placeholder:text-[#9CA3AF] outline-none transition focus:border-[#b3e653]";
const labelCls = "mb-2 block text-[15px] font-bold text-[#191D24]";

// ─── Modal header ─────────────────────────────────────────────────────────────

const ModalHeader = ({ title, onClose }: { title: string; onClose: () => void }) => (
  <div className="flex items-start justify-between">
    <h3 className="text-[22px] font-bold text-[#191D24]">{title}</h3>
    <button
      onClick={onClose}
      className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F3F4F6] text-[#6A7282] transition hover:bg-[#E5E7EB]"
      aria-label="Đóng"
    >
      <CloseOutlined />
    </button>
  </div>
);

// ─── Student class card (unchanged — student branch) ─────────────────────────
// Matches Figma node 3733:936

const ClassCard = ({ c }: { c: ClassroomSummary }) => {
  const tint = tintFor(c.id);
  const bg = pastelBg(tint);
  const inits = avatarInitials(c.name);
  const href = ROUTES.CLASSROOM.DETAIL(c.id);

  const isActive = c.status === "active";

  return (
    <div className="bg-white border border-[#e7e9e4] rounded-[20px] p-[20px] flex flex-col gap-[14px] shadow-[0_2px_4px_0_rgba(0,0,0,0.04)] w-full sm:w-[350px] shrink-0">
      {/* Header: avatar + name + subtitle */}
      <div className="flex gap-[12px] items-center h-[44px]">
        {c.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={c.image_url}
            alt=""
            className="h-[44px] w-[44px] rounded-[12px] object-cover shrink-0"
          />
        ) : (
          <div
            className="h-[44px] w-[44px] rounded-[12px] flex items-center justify-center shrink-0"
            style={{ background: bg }}
          >
            <span
              className="font-inter font-bold text-[15px] leading-none"
              style={{ color: tint }}
            >
              {inits}
            </span>
          </div>
        )}
        <div className="flex flex-col gap-[2px] min-w-0">
          <p className="font-inter font-bold text-[15px] text-[#191d24] leading-normal truncate">
            {c.name}
          </p>
          <p className="font-inter font-normal text-[12px] text-[#6a7282] leading-normal truncate">
            {c.description || `Mã: ${c.invite_code}`}
          </p>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-[rgba(25,29,36,0.06)] w-full" />

      {/* Stats row: student count + assignment count */}
      <div className="flex items-center gap-[16px]">
        <div className="flex items-center gap-[5px]">
          <span className="material-symbols-rounded text-[15px] text-[#6a7282]">person</span>
          <span className="font-inter font-medium text-[12px] text-[#6a7282]">
            {c.student_count} học sinh
          </span>
        </div>
        <div className="flex items-center gap-[5px]">
          <span className="material-symbols-rounded text-[15px] text-[#6a7282]">assignment</span>
          <span className="font-inter font-medium text-[12px] text-[#6a7282]">
            {c.assignment_count} bài giao
          </span>
        </div>
      </div>

      {/* Footer: status badge + Open → */}
      <div className="flex items-center justify-between">
        {isActive ? (
          <div className="flex gap-[6px] items-center justify-center px-[10px] py-[5px] rounded-[100px] bg-[#f2fadd]">
            <div className="w-[6px] h-[6px] rounded-full bg-[#219653] shrink-0" />
            <span className="font-inter font-bold text-[12px] text-[#219653] whitespace-nowrap">
              Đang hoạt động
            </span>
          </div>
        ) : (
          <div className="flex gap-[6px] items-center justify-center px-[10px] py-[5px] rounded-[100px] bg-[rgba(25,29,36,0.06)]">
            <div className="w-[6px] h-[6px] rounded-full bg-[#6a7282] shrink-0" />
            <span className="font-inter font-bold text-[12px] text-[#6a7282] whitespace-nowrap">
              Đã đóng
            </span>
          </div>
        )}
        <Link
          href={href}
          className="font-inter font-bold text-[13px] text-[#5b8a00] hover:text-[#9ad534] whitespace-nowrap transition-colors"
        >
          Open →
        </Link>
      </div>
    </div>
  );
};

// ─── Teacher class card — Figma node 3756-544 ────────────────────────────────
// Card: white bg, rounded-[16px], border hairline, shadow-sm
// Header: rounded avatar (pastel initials or image) + class name + description/subtitle + ⋮ menu
// Student count row with group icon
// Progress bar row (label + %, green fill track) — backend gap: no progress field; defaults to 0
// Footer: status badge + "Manage →" link

const TeacherClassCard = ({ c }: { c: ClassroomSummary }) => {
  const tint = tintFor(c.id);
  const bg = pastelBg(tint);
  const inits = avatarInitials(c.name);
  const href = ROUTES.CLASSROOM.DETAIL(c.id);

  const isActive = c.status === "active";

  // Progress: no field in ClassroomSummary — show 0% as placeholder (backend gap)
  const progress = 0;

  return (
    <div className="bg-white border border-[#e5e6e8] rounded-[16px] p-5 flex flex-col gap-0 shadow-[0_1px_3px_0_rgba(25,29,36,0.06)]">
      {/* Header row: avatar group + name/subtitle + ⋮ */}
      <div className="flex items-start justify-between gap-3 pb-[14px]">
        <div className="flex items-center gap-3 min-w-0">
          {c.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={c.image_url}
              alt=""
              className="h-[44px] w-[44px] rounded-[12px] object-cover shrink-0"
            />
          ) : (
            <div
              className="h-[44px] w-[44px] rounded-[12px] flex items-center justify-center shrink-0"
              style={{ background: bg }}
            >
              <span
                className="font-inter font-bold text-[14px] leading-none"
                style={{ color: tint }}
              >
                {inits}
              </span>
            </div>
          )}
          <div className="flex flex-col gap-[2px] min-w-0">
            <p className="font-inter font-bold text-[15px] leading-[1.3] text-ink-900 truncate">
              {c.name}
            </p>
            <p className="font-inter font-normal text-[13px] leading-normal text-ink-muted truncate">
              {c.description || `Mã: ${c.invite_code}`}
            </p>
          </div>
        </div>

        {/* ⋮ dropdown */}
        <Dropdown
          trigger={["click"]}
          menu={{
            items: [
              {
                key: "manage",
                label: <Link href={ROUTES.CLASSROOM.DETAIL(c.id)}>Quản lý lớp</Link>,
              },
              {
                key: "assign",
                label: (
                  <Link href={`${ROUTES.CLASSROOM.DETAIL(c.id)}?tab=assignments`}>Giao bài</Link>
                ),
              },
              {
                key: "report",
                label: <Link href={ROUTES.CLASSROOM.TRACKING(c.id)}>Báo cáo</Link>,
              },
            ],
          }}
        >
          <button
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] text-ink-muted hover:bg-[#f6f7f4] transition-colors"
            aria-label="Thêm hành động"
          >
            <span className="material-symbols-rounded text-[20px]">more_vert</span>
          </button>
        </Dropdown>
      </div>

      {/* Student count row */}
      <div className="flex items-center gap-[6px] pb-[14px]">
        <span className="material-symbols-rounded text-[16px] text-ink-muted">group</span>
        <span className="font-inter font-medium text-[13px] text-ink-muted">
          {c.student_count} students
        </span>
      </div>

      {/* Progress row */}
      <div className="flex flex-col gap-[8px] pb-[16px]">
        <div className="flex items-center justify-between">
          <span className="font-inter font-normal text-[13px] text-ink-muted">Progress</span>
          <span className="font-inter font-semibold text-[13px] text-ink-900">
            {progress}%
          </span>
        </div>
        {/* Track */}
        <div className="h-[6px] w-full rounded-full bg-[#e5e6e8] overflow-hidden">
          <div
            className="h-full rounded-full bg-brand transition-[width]"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Footer: status badge + Manage → */}
      <div className="flex items-center justify-between pt-[2px] border-t border-[#f0f1f3]">
        {isActive ? (
          <div className="flex items-center gap-[6px] rounded-full bg-brand-tint px-[10px] py-[5px]">
            <div className="h-[6px] w-[6px] rounded-full bg-[#219653] shrink-0" />
            <span className="font-inter font-semibold text-[12px] text-[#219653] whitespace-nowrap">
              Active
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-[6px] rounded-full bg-[rgba(25,29,36,0.06)] px-[10px] py-[5px]">
            <div className="h-[6px] w-[6px] rounded-full bg-ink-muted shrink-0" />
            <span className="font-inter font-semibold text-[12px] text-ink-muted whitespace-nowrap">
              Starting soon
            </span>
          </div>
        )}
        <Link
          href={href}
          className="font-inter font-bold text-[13px] text-[#5b8a00] hover:text-[#9ad534] whitespace-nowrap transition-colors"
        >
          Manage →
        </Link>
      </div>
    </div>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export const PageClassroomList = ({ isTeacher, classrooms, stats, studentStats }: Props) => {
  const router = useRouter();
  const { currentUser } = useAuth();
  const supabase = useMemo(() => createClient(), []);

  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [createName, setCreateName] = useState("");
  const [createDesc, setCreateDesc] = useState("");
  const [createErr, setCreateErr] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joinErr, setJoinErr] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);

  const counts = useMemo(() => {
    const managed = classrooms.filter((c) => c.viewer_role === "teacher");
    const joined = classrooms.filter((c) => c.viewer_role === "student");
    return { managed: managed.length, joined: joined.length, total: classrooms.length };
  }, [classrooms]);

  useEffect(() => {
    if (router.query.join_error) {
      message.error("Mã mời không hợp lệ hoặc lớp đã đóng.");
      router.replace(ROUTES.CLASSROOM.LIST, undefined, { shallow: true });
    } else if (router.query.join_pending) {
      message.success("Đã gửi yêu cầu vào lớp. Vui lòng chờ giáo viên duyệt.");
      router.replace(ROUTES.CLASSROOM.LIST, undefined, { shallow: true });
    }
  }, [router.query.join_error, router.query.join_pending, router]);

  const closeCreate = () => {
    if (submitting) return;
    setCreateOpen(false);
    setCreateName("");
    setCreateDesc("");
    setCreateErr(false);
  };
  const closeJoin = () => {
    if (submitting) return;
    setJoinOpen(false);
    setJoinCode("");
    setJoinErr(false);
  };

  const handleCreate = async () => {
    if (!createName.trim()) {
      setCreateErr(true);
      return;
    }
    setSubmitting(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Bạn cần đăng nhập.");
      const classroom = await createClassroom(supabase, {
        name: createName.trim(),
        description: createDesc.trim() || null,
        ownerId: user.id,
      });
      message.success("Đã tạo lớp thành công!");
      router.push(ROUTES.CLASSROOM.DETAIL(classroom.id));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      message.error(
        msg.includes("CLASS_LIMIT_REACHED")
          ? "Bạn đã đạt giới hạn 10 lớp học."
          : "Không tạo được lớp."
      );
      setSubmitting(false);
    }
  };

  const joinWithCode = useCallback(
    async (raw: string) => {
      const trimmed = raw.trim();
      const code = trimmed.includes("/join/")
        ? trimmed.split("/join/")[1].split(/[?/]/)[0]
        : trimmed;
      const role: "teacher" | "student" = /[?&]role=teacher\b/i.test(trimmed)
        ? "teacher"
        : "student";
      if (!code) {
        setJoinErr(true);
        return;
      }
      setSubmitting(true);
      try {
        const result = await joinClassroomByCode(supabase, code, role);
        if (result.status === "pending") {
          message.success(
            `Đã gửi yêu cầu vào lớp ${result.name}. Vui lòng chờ giáo viên duyệt.`
          );
          setSubmitting(false);
          setJoinOpen(false);
          setJoinCode("");
          setScanOpen(false);
          return;
        }
        message.success(`Đã tham gia lớp ${result.name}!`);
        router.push(ROUTES.CLASSROOM.DETAIL(result.id));
      } catch (e) {
        const msg = e instanceof Error ? e.message : "";
        message.error(
          msg.includes("CLASS_NOT_FOUND")
            ? "Mã mời không hợp lệ hoặc lớp đã đóng."
            : "Không tham gia được lớp."
        );
        setSubmitting(false);
      }
    },
    [supabase, router]
  );

  const handleJoin = () => {
    if (!joinCode.trim()) {
      setJoinErr(true);
      return;
    }
    void joinWithCode(joinCode);
  };

  const closeScan = useCallback(() => setScanOpen(false), []);
  const handleScan = useCallback(
    (text: string) => {
      setScanOpen(false);
      setJoinOpen(false);
      void joinWithCode(text);
    },
    [joinWithCode]
  );

  // ── Split classrooms by role ─────────────────────────────────────────────
  const studentClasses = classrooms.filter((c) => c.viewer_role === "student");
  const teacherClasses = classrooms.filter((c) => c.viewer_role === "teacher");

  // Subtitle line
  const subtitle = isTeacher
    ? `You're managing ${counts.managed} class${counts.managed !== 1 ? "es" : ""}.`
    : `You're enrolled in ${counts.joined} class${counts.joined !== 1 ? "es" : ""}.`;

  return (
    <div className="space-y-[28px]">

      {/* ── Top bar: heading + subtitle — Figma 3756:241 "Greeting" ── */}
      <div data-section="classroom-top-bar">
        <h1 className="font-display font-bold text-[26px] tracking-[-0.52px] text-ink-900 leading-none">
          {isTeacher ? "Class management" : "My classes"}
        </h1>
        <p className="mt-[6px] font-inter font-normal text-[15px] text-ink-muted">
          {isTeacher ? "Manage the classes you teach or join." : subtitle}
        </p>
      </div>

      {/* ── Teacher view — Figma 3756-239 ── */}
      {isTeacher && (
        <>
          {/* Section header: "My Classes" badge + action buttons — Figma 3756:528 "hr" */}
          <div data-section="teacher-section-header" className="flex items-center justify-between gap-3 flex-wrap">
            {/* Left: heading + count badge */}
            <div className="flex items-center gap-[10px]">
              <h2 className="font-display font-bold text-[22px] tracking-[-0.4px] text-ink-900 leading-none">
                My Classes
              </h2>
              <div className="flex items-center gap-[6px] rounded-full bg-brand-tint px-[10px] py-[4px]">
                <div className="h-[6px] w-[6px] rounded-full bg-brand shrink-0" />
                <span className="font-inter font-semibold text-[12px] text-[#5b8a00] whitespace-nowrap">
                  {counts.managed} {counts.managed === 1 ? "class" : "classes"}
                </span>
              </div>
            </div>

            {/* Right: action buttons — Figma 3756:534 "ha" */}
            <div className="flex items-center gap-[10px]">
              <button
                onClick={() => setCreateOpen(true)}
                className="inline-flex items-center gap-[8px] rounded-full bg-brand px-[20px] py-[10px] font-inter font-bold text-[14px] text-ink-900 hover:bg-brand-hover transition-colors"
              >
                <span className="material-symbols-rounded text-[18px] leading-none">add</span>
                Create class
              </button>
              <button
                onClick={() => setJoinOpen(true)}
                className="inline-flex items-center gap-[8px] rounded-full border border-[#e5e6e8] bg-white px-[20px] py-[10px] font-inter font-bold text-[14px] text-ink-900 hover:bg-[#f6f7f4] transition-colors"
              >
                <span className="material-symbols-rounded text-[18px] leading-none">link</span>
                Join with code
              </button>
            </div>
          </div>

          {/* Teacher class card grid — Figma 3756:543 "grid" */}
          <section data-section="teacher-classes">
            {teacherClasses.length === 0 ? (
              <div className="bg-white border border-[#e5e6e8] rounded-[20px] p-[40px] flex flex-col items-center text-center gap-4">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#f6f7f4]">
                  <span className="material-symbols-rounded text-[32px] text-ink-muted">school</span>
                </span>
                <p className="font-display font-bold text-[18px] text-ink-900">
                  No classes yet
                </p>
                <p className="font-inter font-normal text-[14px] text-ink-muted max-w-[360px]">
                  Create your first class to start managing students and assignments.
                </p>
                <button
                  onClick={() => setCreateOpen(true)}
                  className="inline-flex items-center gap-2 rounded-full bg-brand px-[22px] py-[11px] text-[14px] font-bold font-inter text-ink-900 hover:bg-brand-hover transition-colors"
                >
                  <span className="material-symbols-rounded text-[18px]">add</span>
                  Create class
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {teacherClasses.map((c) => (
                  <TeacherClassCard key={c.id} c={c} />
                ))}
              </div>
            )}
          </section>

          {/* Teacher also enrolled as student in some classes */}
          {studentClasses.length > 0 && (
            <section data-section="teacher-student-classes">
              <p className="font-display font-bold text-[20px] text-ink-900 leading-normal mb-[16px]">
                Lớp bạn đang học
              </p>
              <div className="flex flex-wrap gap-[20px] items-start">
                {studentClasses.map((c) => (
                  <ClassCard key={c.id} c={c} />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* ── Student branch — DO NOT MODIFY ── */}
      {!isTeacher && (
        <>
          {/* Student stat cards */}
          {studentStats ? (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <div className="flex items-center gap-[14px] rounded-[13px] border border-[#e7e9e4] bg-white px-5 py-[18px] shadow-[0_2px_4px_0_rgba(0,0,0,0.04)]">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px]" style={{ background: "#2563EB1A" }}>
                  <span className="material-symbols-rounded text-[22px] leading-none" style={{ color: "#2563EB" }}>school</span>
                </span>
                <div className="flex flex-col gap-1">
                  <span className="text-[13px] font-medium text-[#6a7282]">Số lớp tham gia</span>
                  <span className="text-[28px] font-bold leading-none text-[#191d24]">{studentStats.joined_class_count}</span>
                </div>
              </div>
              <div className="flex items-center gap-[14px] rounded-[13px] border border-[#e7e9e4] bg-white px-5 py-[18px] shadow-[0_2px_4px_0_rgba(0,0,0,0.04)]">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px]" style={{ background: "#D94A561A" }}>
                  <span className="material-symbols-rounded text-[22px] leading-none" style={{ color: "#D94A56" }}>assignment</span>
                </span>
                <div className="flex flex-col gap-1">
                  <span className="text-[13px] font-medium text-[#6a7282]">Bài tập cần làm</span>
                  <span className="text-[28px] font-bold leading-none text-[#191d24]">{studentStats.pending_count}</span>
                </div>
              </div>
              <div className="flex items-center gap-[14px] rounded-[13px] border border-[#e7e9e4] bg-white px-5 py-[18px] shadow-[0_2px_4px_0_rgba(0,0,0,0.04)]">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px]" style={{ background: "#16A34A1A" }}>
                  <span className="material-symbols-rounded text-[22px] leading-none" style={{ color: "#16A34A" }}>task_alt</span>
                </span>
                <div className="flex flex-col gap-1">
                  <span className="text-[13px] font-medium text-[#6a7282]">Đã hoàn thành</span>
                  <span className="text-[28px] font-bold leading-none text-[#191d24]">{studentStats.submitted_count}</span>
                </div>
              </div>
              <div className="flex items-center gap-[14px] rounded-[13px] border border-[#e7e9e4] bg-white px-5 py-[18px] shadow-[0_2px_4px_0_rgba(0,0,0,0.04)]">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px]" style={{ background: "#EA580C1A" }}>
                  <span className="material-symbols-rounded text-[22px] leading-none" style={{ color: "#EA580C" }}>grade</span>
                </span>
                <div className="flex flex-col gap-1">
                  <span className="text-[13px] font-medium text-[#6a7282]">Điểm trung bình</span>
                  <span className="text-[28px] font-bold leading-none text-[#191d24]">{studentStats.avg_band != null ? studentStats.avg_band : "—"}</span>
                </div>
              </div>
            </div>
          ) : null}

          {/* Student action buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setCreateOpen(true)}
              className="inline-flex items-center gap-2 rounded-full bg-[#b3e653] px-[22px] py-[11px] text-[14px] font-bold font-inter text-[#191d24] hover:bg-[#9ad534] transition-colors"
            >
              <span className="material-symbols-rounded text-[18px]">add</span>
              Tạo lớp mới
            </button>
            <button
              onClick={() => setJoinOpen(true)}
              className="inline-flex items-center gap-2 rounded-full border-[1.5px] border-[rgba(25,29,36,0.1)] bg-white px-[22px] py-[11px] text-[14px] font-bold font-inter text-[#191d24] hover:bg-[#f6f7f4] transition-colors"
            >
              <span className="material-symbols-rounded text-[18px]">link</span>
              Tham gia bằng mã / link mời
            </button>
          </div>

          {/* Student class cards */}
          <section data-section="student-classes">
            <div className="flex items-center justify-between mb-[16px]">
              <p className="font-display font-bold text-[20px] text-[#191d24] leading-normal whitespace-nowrap">
                Your classes
              </p>
            </div>

            {studentClasses.length === 0 ? (
              <div className="bg-white border border-[#e7e9e4] rounded-[20px] p-[40px] flex flex-col items-center text-center gap-4">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#f6f7f4]">
                  <span className="material-symbols-rounded text-[32px] text-[#6a7282]">school</span>
                </span>
                <p className="font-display font-bold text-[18px] text-[#191d24]">
                  Chưa có lớp học nào
                </p>
                <p className="font-inter font-normal text-[14px] text-[#6a7282] max-w-[360px]">
                  Tham gia lớp bằng mã mời hoặc link từ giáo viên để bắt đầu.
                </p>
                <button
                  onClick={() => setJoinOpen(true)}
                  className="inline-flex items-center gap-2 rounded-full border-[1.5px] border-[rgba(25,29,36,0.1)] bg-white px-[22px] py-[11px] text-[14px] font-bold font-inter text-[#191d24] hover:bg-[#f6f7f4] transition-colors"
                >
                  <span className="material-symbols-rounded text-[18px]">link</span>
                  Tham gia lớp
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-[20px] items-start">
                {studentClasses.map((c) => (
                  <ClassCard key={c.id} c={c} />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {/* ── Create class modal ── */}
      <Modal
        open={createOpen}
        onCancel={closeCreate}
        footer={null}
        closable={false}
        width={520}
        centered
        styles={{ content: { borderRadius: 16, padding: 32 } }}
        destroyOnClose
      >
        <ModalHeader title="Tạo lớp học mới" onClose={closeCreate} />
        <div className="mt-6 space-y-5">
          <div>
            <label className={labelCls}>
              Tên lớp học <span className="text-[#D94A56]">*</span>
            </label>
            <input
              value={createName}
              maxLength={120}
              onChange={(e) => {
                setCreateName(e.target.value);
                if (createErr) setCreateErr(false);
              }}
              placeholder="VD: IELTS Academic 7.5+ – Lớp tối thứ 3, 5"
              className={twMerge(fieldBase, createErr ? "border-[#D94A56]" : "border-[#E5E7EB]")}
            />
            {createErr ? (
              <p className="mt-1 text-[13px] text-[#D94A56]">Vui lòng nhập tên lớp.</p>
            ) : null}
          </div>
          <div>
            <label className={labelCls}>Mô tả lớp</label>
            <textarea
              value={createDesc}
              maxLength={200}
              rows={4}
              onChange={(e) => setCreateDesc(e.target.value)}
              placeholder="Mô tả ngắn về mục tiêu, lịch học, đối tượng…"
              className={twMerge(fieldBase, "resize-none border-[#E5E7EB]")}
            />
            <p className="mt-2 text-[13px] text-[#6A7282]">Tối đa 200 ký tự</p>
          </div>
        </div>
        <div className="mt-8 flex justify-end gap-3">
          <button
            onClick={closeCreate}
            className="rounded-full border border-[#e7e9e4] bg-white px-6 py-2.5 text-[14px] font-bold text-[#374151] hover:bg-[#f6f7f4]"
          >
            Huỷ
          </button>
          <button
            onClick={handleCreate}
            disabled={submitting}
            className="rounded-full bg-[#b3e653] px-7 py-2.5 text-[14px] font-bold text-[#191d24] hover:bg-[#9ad534] disabled:opacity-60 transition-colors"
          >
            {submitting ? "Đang tạo…" : "Tạo lớp"}
          </button>
        </div>
      </Modal>

      {/* ── Join class modal ── */}
      <Modal
        open={joinOpen}
        onCancel={closeJoin}
        footer={null}
        closable={false}
        width={520}
        centered
        styles={{ content: { borderRadius: 16, padding: 32 } }}
        destroyOnClose
      >
        <ModalHeader title="Tham gia lớp" onClose={closeJoin} />
        <p className="mt-3 text-[15px] text-[#6A7282]">
          Nhập mã mời hoặc dán link mời bạn nhận được từ giáo viên.
        </p>
        <div className="mt-5">
          <label className={labelCls}>Mã mời hoặc link</label>
          <input
            value={joinCode}
            onChange={(e) => {
              setJoinCode(e.target.value);
              if (joinErr) setJoinErr(false);
            }}
            placeholder="VD: ABC123 hoặc https://…"
            className={twMerge(fieldBase, joinErr ? "border-[#D94A56]" : "border-[#E5E7EB]")}
          />
          {joinErr ? (
            <p className="mt-1 text-[13px] text-[#D94A56]">Vui lòng nhập mã mời.</p>
          ) : null}
        </div>

        <div className="my-5 flex items-center gap-4">
          <span className="h-px flex-1 bg-[#e7e9e4]" />
          <span className="text-[14px] text-[#6A7282]">hoặc</span>
          <span className="h-px flex-1 bg-[#e7e9e4]" />
        </div>

        <button
          onClick={() => setScanOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-[#f6f7f4] py-3.5 text-[14px] font-bold font-inter text-[#191d24] hover:bg-[#e8ebe2] transition-colors"
        >
          <span className="material-symbols-rounded text-[20px]">qr_code_2</span>
          Quét QR code mời
        </button>

        <div className="mt-8 flex justify-end gap-3">
          <button
            onClick={closeJoin}
            className="rounded-full border border-[#e7e9e4] bg-white px-6 py-2.5 text-[14px] font-bold text-[#374151] hover:bg-[#f6f7f4]"
          >
            Huỷ
          </button>
          <button
            onClick={handleJoin}
            disabled={submitting}
            className="rounded-full bg-[#b3e653] px-7 py-2.5 text-[14px] font-bold text-[#191d24] hover:bg-[#9ad534] disabled:opacity-60 transition-colors"
          >
            {submitting ? "Đang tham gia…" : "Tham gia"}
          </button>
        </div>
      </Modal>

      <ClassroomQrScanner open={scanOpen} onClose={closeScan} onResult={handleScan} />
    </div>
  );
};

PageClassroomList.Layout = AppShell;
