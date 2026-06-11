import Link from "next/link";
import { AppShell } from "@/widgets/layouts";
import { useAuth } from "@/appx/providers";
import { ROUTES } from "@/shared/routes";
import type {
  ClassroomSummary,
  TeacherDashboardStats,
} from "~services/types/classroom";

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = {
  classrooms: ClassroomSummary[];
  stats: TeacherDashboardStats | null;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TINTS = ["#D94A56", "#2563EB", "#7C3AED", "#0EA5E9", "#16A34A", "#EA580C"];
const tintFor = (k: string) =>
  TINTS[[...k].reduce((a, c) => a + c.charCodeAt(0), 0) % TINTS.length];
const avatarInitials = (name: string) =>
  name
    .trim()
    .toUpperCase()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("") || "LC";

// ─── Stat Card ───────────────────────────────────────────────────────────────

type StatCardProps = {
  icon: string;
  label: string;
  value: number | string;
  subtext?: string;
  tint: string;
};

const StatCard = ({ icon, label, value, subtext, tint }: StatCardProps) => (
  <div className="flex items-center gap-[14px] rounded-[16px] border border-[#e7e9e4] bg-white px-5 py-[18px] shadow-[0_2px_4px_0_rgba(0,0,0,0.04)]">
    <span
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px]"
      style={{ background: `${tint}1A` }}
    >
      <span
        className="material-symbols-rounded text-[22px] leading-none"
        style={{ color: tint }}
      >
        {icon}
      </span>
    </span>
    <div className="flex flex-col gap-1 min-w-0">
      <span className="text-[13px] font-medium text-[#6a7282]">{label}</span>
      <div className="flex items-baseline gap-[6px]">
        <span className="text-[28px] font-bold leading-none text-[#191d24]">{value}</span>
        {subtext && (
          <span className="text-[12px] font-medium text-[#b3e653]">{subtext}</span>
        )}
      </div>
    </div>
  </div>
);

// ─── Progress Bar ─────────────────────────────────────────────────────────────

const ProgressBar = ({ value }: { value: number }) => {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className="flex items-center gap-[8px]">
      <div className="h-[6px] flex-1 rounded-full bg-[#F3F4F6]">
        <div
          className="h-full rounded-full bg-[#b3e653]"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[12px] font-medium text-[#6a7282] w-[34px] text-right">
        {pct}%
      </span>
    </div>
  );
};

// ─── Class Avatar ─────────────────────────────────────────────────────────────

const ClassAvatar = ({ c }: { c: ClassroomSummary }) => {
  const tint = tintFor(c.id);
  const inits = avatarInitials(c.name);
  if (c.image_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={c.image_url}
        alt=""
        className="h-9 w-9 rounded-[10px] object-cover shrink-0"
      />
    );
  }
  return (
    <span
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] text-[13px] font-bold leading-none"
      style={{ background: `${tint}1A`, color: tint }}
    >
      {inits}
    </span>
  );
};

// ─── My Classes Table Row ─────────────────────────────────────────────────────

const TABLE_GRID =
  "grid grid-cols-[1fr_100px_200px_90px_100px] items-center gap-3";

const ClassTableRow = ({ c }: { c: ClassroomSummary }) => {
  const isActive = c.status === "active";
  return (
    <div
      className={`${TABLE_GRID} border-b border-[#F3F4F6] px-4 py-[14px] last:border-0`}
    >
      {/* Name + schedule placeholder */}
      <div className="flex items-center gap-3 min-w-0">
        <ClassAvatar c={c} />
        <div className="min-w-0">
          <p className="font-inter font-bold text-[14px] text-[#191d24] truncate">
            {c.name}
          </p>
          <p className="font-inter text-[12px] text-[#6a7282] truncate">
            {c.description || `Mã: ${c.invite_code}`}
          </p>
        </div>
      </div>

      {/* Students */}
      <div className="flex items-center gap-[5px]">
        <span className="material-symbols-rounded text-[15px] text-[#6a7282]">
          group
        </span>
        <span className="font-inter font-semibold text-[14px] text-[#191d24]">
          {c.student_count}
        </span>
      </div>

      {/* Progress bar — avg_progress not per-class; show neutral 0 */}
      <ProgressBar value={0} />

      {/* Status */}
      {isActive ? (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f2fadd] px-3 py-1 text-[12px] font-medium text-[#219653] whitespace-nowrap">
          <span className="h-1.5 w-1.5 rounded-full bg-[#219653]" />
          Active
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(25,29,36,0.06)] px-3 py-1 text-[12px] font-medium text-[#6a7282] whitespace-nowrap">
          <span className="h-1.5 w-1.5 rounded-full bg-[#6a7282]" />
          Closed
        </span>
      )}

      {/* Manage link */}
      <Link
        href={ROUTES.CLASSROOM.DETAIL(c.id)}
        className="font-inter font-bold text-[13px] text-[#5b8a00] hover:text-[#9ad534] transition-colors whitespace-nowrap text-right"
      >
        Manage
      </Link>
    </div>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export const PageClassroomOverview = ({ classrooms, stats }: Props) => {
  const { currentUser } = useAuth();

  const teacherClasses = classrooms.filter((c) => c.viewer_role === "teacher");

  // "Most active class" = teacher-owned class with the most students
  const mostActiveClass =
    teacherClasses.length > 0
      ? teacherClasses.reduce((best, c) =>
          c.student_count > best.student_count ? c : best
        )
      : null;

  const displayName = currentUser?.name || "Teacher";

  const managedCount = stats?.managed_class_count ?? teacherClasses.length;
  const totalStudents = stats?.total_students ?? 0;
  const avgProgress = stats?.avg_progress ?? 0;

  // Preview up to 5 teacher classes; link to full list for the rest
  const previewClasses = teacherClasses.slice(0, 5);

  return (
    <div className="space-y-[28px]">

      {/* ── Top bar: greeting + search strip ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display font-bold text-[26px] tracking-[-0.52px] text-[#191d24] leading-tight">
            Welcome back, {displayName} 👋
          </h1>
          <p className="mt-[6px] font-inter font-normal text-[15px] text-[#6a7282]">
            {managedCount > 0
              ? `You have ${managedCount} active class${managedCount !== 1 ? "es" : ""} to manage.`
              : "No active classes yet — create one to get started."}
          </p>
        </div>
      </div>

      {/* ── 4 Stat Cards ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon="menu_book"
          label="Classes managed"
          value={managedCount}
          tint="#5281F9"
        />
        <StatCard
          icon="group"
          label="Total students"
          value={totalStudents}
          tint="#16A34A"
        />
        {/* Pending grading: no service — graceful 0 */}
        <StatCard
          icon="assignment_late"
          label="Pending grading"
          value={0}
          tint="#F59E0B"
        />
        <StatCard
          icon="trending_up"
          label="Completion rate"
          value={`${Math.round(avgProgress)}%`}
          tint="#7C3AED"
        />
      </div>

      {/* ── Most Active Class banner ── */}
      {mostActiveClass && (
        <div className="rounded-[20px] bg-[#191d24] px-8 py-7 flex items-center justify-between gap-6">
          <div>
            <p className="font-inter font-bold text-[11px] uppercase tracking-[0.08em] text-[#b3e653] mb-[10px]">
              Most active class
            </p>
            <h2 className="font-display font-bold text-[22px] text-white leading-tight mb-[8px]">
              {mostActiveClass.name}
            </h2>
            <p className="font-inter text-[14px] text-[rgba(255,255,255,0.55)]">
              {mostActiveClass.student_count} student{mostActiveClass.student_count !== 1 ? "s" : ""}
              {" · "}
              {mostActiveClass.assignment_count} assignment{mostActiveClass.assignment_count !== 1 ? "s" : ""}
            </p>
          </div>
          <Link
            href={ROUTES.CLASSROOM.DETAIL(mostActiveClass.id)}
            className="inline-flex items-center gap-2 shrink-0 rounded-full bg-[#b3e653] px-[22px] py-[11px] text-[14px] font-bold font-inter text-[#191d24] hover:bg-[#9ad534] transition-colors"
          >
            <span className="material-symbols-rounded text-[18px]">school</span>
            Manage class
          </Link>
        </div>
      )}

      {/* ── My Classes table ── */}
      <div className="rounded-[20px] border border-[#e7e9e4] bg-white shadow-[0_2px_4px_0_rgba(0,0,0,0.04)]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-[10px]">
            <h3 className="font-display font-bold text-[18px] text-[#191d24]">
              My Classes
            </h3>
            {teacherClasses.length > 0 && (
              <span className="rounded-full bg-[#f2fadd] px-2.5 py-0.5 text-[12px] font-medium text-[#5b8a00]">
                {teacherClasses.length} class{teacherClasses.length !== 1 ? "es" : ""}
              </span>
            )}
          </div>
          {teacherClasses.length > 5 && (
            <Link
              href={ROUTES.CLASSROOM.LIST}
              className="font-inter font-bold text-[13px] text-[#5b8a00] hover:text-[#9ad534] transition-colors"
            >
              View all →
            </Link>
          )}
        </div>

        {teacherClasses.length === 0 ? (
          <div className="flex flex-col items-center py-14 text-center px-5">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#f6f7f4]">
              <span className="material-symbols-rounded text-[32px] text-[#6a7282]">
                school
              </span>
            </span>
            <p className="mt-4 font-display font-bold text-[17px] text-[#191d24]">
              No classes yet
            </p>
            <p className="mt-1 font-inter text-[14px] text-[#6a7282] max-w-[340px]">
              Create your first class to start managing students.
            </p>
            <Link
              href={ROUTES.CLASSROOM.LIST}
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#b3e653] px-[22px] py-[11px] text-[14px] font-bold font-inter text-[#191d24] hover:bg-[#9ad534] transition-colors"
            >
              <span className="material-symbols-rounded text-[18px]">add</span>
              Create class
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto pb-2">
            <div className="min-w-[680px]">
              {/* Column headers */}
              <div
                className={`${TABLE_GRID} border-b border-[#e7e9e4] px-4 pb-3 text-[11px] font-bold uppercase tracking-[0.06em] text-[#9CA3AF]`}
              >
                <span>Class</span>
                <span>Students</span>
                <span>Progress</span>
                <span>Status</span>
                <span />
              </div>

              {previewClasses.map((c) => (
                <ClassTableRow key={c.id} c={c} />
              ))}

              {teacherClasses.length > 5 && (
                <div className="px-4 py-3 text-center">
                  <Link
                    href={ROUTES.CLASSROOM.LIST}
                    className="font-inter text-[13px] font-semibold text-[#5b8a00] hover:text-[#9ad534] transition-colors"
                  >
                    View all {teacherClasses.length} classes →
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Recent Student Activity ── */}
      {/* No service exists for this data — graceful empty state */}
      <div className="rounded-[20px] border border-[#e7e9e4] bg-white shadow-[0_2px_4px_0_rgba(0,0,0,0.04)]">
        <div className="px-5 pt-5 pb-3">
          <h3 className="font-display font-bold text-[18px] text-[#191d24]">
            Recent student activity
          </h3>
        </div>

        {/* Column headers */}
        <div className="grid grid-cols-[1fr_1fr_120px_100px] border-b border-[#e7e9e4] px-4 pb-3 text-[11px] font-bold uppercase tracking-[0.06em] text-[#9CA3AF]">
          <span>Student</span>
          <span>Assignment</span>
          <span>Result</span>
          <span>Submitted</span>
        </div>

        {/* Empty state — no activity service */}
        <div className="flex flex-col items-center py-12 text-center px-5">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f6f7f4]">
            <span className="material-symbols-rounded text-[28px] text-[#6a7282]">
              notifications_none
            </span>
          </span>
          <p className="mt-3 font-inter font-medium text-[15px] text-[#6a7282]">
            Chưa có hoạt động
          </p>
          <p className="mt-1 font-inter text-[13px] text-[#9ca3af]">
            Hoạt động gần đây của học sinh sẽ hiển thị ở đây.
          </p>
        </div>
      </div>
    </div>
  );
};

PageClassroomOverview.Layout = AppShell;
