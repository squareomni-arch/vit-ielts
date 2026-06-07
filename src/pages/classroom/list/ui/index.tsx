import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Dropdown, Modal, message } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import { createClient } from "~supabase/client";
import { useAuth } from "@/appx/providers";
import { ClassroomLayout } from "@/widgets/layouts";
import { ClassroomQrScanner } from "../../qr-scanner";
import { createClassroom, joinClassroomByCode } from "~services/classroom";
import type {
  ClassroomSummary,
  TeacherDashboardStats,
  StudentDashboardStats,
} from "~services/types/classroom";
import { ROUTES } from "@/shared/routes";

type Props = {
  isTeacher: boolean;
  classrooms: ClassroomSummary[];
  stats: TeacherDashboardStats | null;
  studentStats: StudentDashboardStats | null;
};

const TINTS = ["#D94A56", "#2563EB", "#7C3AED", "#0EA5E9", "#16A34A", "#EA580C"];
const tintFor = (k: string) => TINTS[[...k].reduce((a, c) => a + c.charCodeAt(0), 0) % TINTS.length];
const initials = (name: string) => name.trim().charAt(0).toUpperCase() || "L";

const fieldBase =
  "w-full rounded-[11px] border px-4 py-3 text-[15px] text-[#191D24] placeholder:text-[#9CA3AF] outline-none transition focus:border-[#D94A56]";
const labelCls = "mb-2 block text-[15px] font-bold text-[#191D24]";
const ROW_GRID = "grid grid-cols-[1fr_120px_110px_180px_150px] items-center gap-2";

const StatCard = ({
  icon,
  label,
  value,
  tint,
}: {
  icon: string;
  label: string;
  value: number | string;
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

const BannerStat = ({ label, value }: { label: string; value: number | string }) => (
  <div className="min-w-[150px] rounded-[13px] bg-white/10 px-6 py-4 text-center">
    <div className="text-[11px] uppercase tracking-wide text-white/80">{label}</div>
    <div className="mt-1 text-[36px] font-bold leading-none">{value}</div>
  </div>
);

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

const ClassRow = ({ c, showRoleBadge }: { c: ClassroomSummary; showRoleBadge: boolean }) => {
  const tint = tintFor(c.id);
  const isStudent = c.viewer_role === "student";
  // Students go to their assignments view; teachers go to the management page.
  const primaryHref = isStudent
    ? `${ROUTES.CLASSROOM.MY_ASSIGNMENTS}?class=${c.id}`
    : ROUTES.CLASSROOM.DETAIL(c.id);
  return (
    <div className={`${ROW_GRID} border-b border-[#F3F4F6] px-2 py-4 last:border-0`}>
      <div className="flex min-w-0 items-center gap-3">
        <span
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-base font-bold"
          style={{ background: `${tint}1A`, color: tint }}
        >
          {initials(c.name)}
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Link
              href={primaryHref}
              className="truncate font-bold text-[#191D24] hover:text-[#D94A56]"
            >
              {c.name}
            </Link>
            {showRoleBadge && c.viewer_role === "student" ? (
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-600">
                Học sinh
              </span>
            ) : null}
          </div>
          <div className="truncate text-[13px] text-[#6A7282]">
            {c.description || `Mã ${c.invite_code}`}
          </div>
        </div>
      </div>

      <span className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-[#191D24]">
        <span className="material-symbols-rounded text-[18px] text-[#6A7282]">person</span>
        {c.student_count}
      </span>

      <span className="text-[15px] font-semibold text-[#191D24]">{c.assignment_count}</span>

      <span>
        {c.status === "active" ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E5F8EC] px-3 py-1 text-[13px] font-medium text-[#16A34A]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#16A34A]" /> Đang hoạt động
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-[13px] font-medium text-[#6A7282]">
            Đã đóng
          </span>
        )}
      </span>

      <div className="flex items-center justify-end gap-1">
        {isStudent ? (
          <Link
            href={primaryHref}
            className="inline-flex items-center gap-1 rounded-[8px] bg-[#D94A56] px-4 py-2 text-[14px] font-semibold text-white hover:bg-[#c8404b]"
          >
            Vào lớp →
          </Link>
        ) : (
          <Link
            href={ROUTES.CLASSROOM.DETAIL(c.id)}
            className="rounded-[8px] bg-[#F3F4F6] px-4 py-2 text-[14px] font-semibold text-[#374151] hover:bg-[#E5E7EB]"
          >
            Quản lý
          </Link>
        )}
        {c.viewer_role === "teacher" ? (
          <Dropdown
            trigger={["click"]}
            menu={{
              items: [
                { key: "manage", label: <Link href={ROUTES.CLASSROOM.DETAIL(c.id)}>Quản lý lớp</Link> },
                {
                  key: "assign",
                  label: <Link href={`${ROUTES.CLASSROOM.DETAIL(c.id)}?tab=assignments`}>Giao bài</Link>,
                },
                { key: "report", label: <Link href={ROUTES.CLASSROOM.TRACKING(c.id)}>Báo cáo</Link> },
              ],
            }}
          >
            <button className="flex h-9 w-9 items-center justify-center rounded-[8px] text-[#6A7282] hover:bg-gray-100">
              <span className="material-symbols-rounded text-[20px]">more_vert</span>
            </button>
          </Dropdown>
        ) : null}
      </div>
    </div>
  );
};

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
    return {
      managed: managed.length,
      joined: joined.length,
      total: classrooms.length,
    };
  }, [classrooms]);

  useEffect(() => {
    if (router.query.join_error) {
      message.error("Mã mời không hợp lệ hoặc lớp đã đóng.");
      router.replace(ROUTES.CLASSROOM.LIST, undefined, { shallow: true });
    }
  }, [router.query.join_error, router]);

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
      message.error(e instanceof Error ? e.message : "Không tạo được lớp.");
      setSubmitting(false);
    }
  };

  const joinWithCode = useCallback(
    async (raw: string) => {
      const trimmed = raw.trim();
      const code = trimmed.includes("/join/")
        ? trimmed.split("/join/")[1].split(/[?/]/)[0]
        : trimmed;
      if (!code) {
        setJoinErr(true);
        return;
      }
      setSubmitting(true);
      try {
        const classroom = await joinClassroomByCode(supabase, code, "student");
        message.success(`Đã tham gia lớp ${classroom.name}!`);
        router.push(ROUTES.CLASSROOM.DETAIL(classroom.id));
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

  const name = currentUser?.name || "bạn";

  return (
    <div className="space-y-7">
      {/* Welcome banner */}
      <div className="flex flex-col gap-4 rounded-[13px] bg-[#334155] px-8 py-[35px] text-white sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-xl">
          <h2 className="text-xl font-extrabold sm:text-2xl">Chào mừng trở lại, {name}!</h2>
          <p className="mt-1 text-sm text-white/70">
            {isTeacher
              ? "Quản lý các lớp bạn đang dạy, giao bài và theo dõi tiến độ học viên ngay tại đây."
              : studentStats && studentStats.pending_count > 0
                ? `Bạn có ${studentStats.pending_count} bài tập cần hoàn thành trong ${studentStats.joined_class_count} lớp đang tham gia.`
                : "Theo dõi các lớp bạn tham gia và bài tập được giao."}
          </p>
        </div>
        {isTeacher && stats ? (
          <div className="flex gap-4">
            <BannerStat label="Học sinh hoạt động" value={stats.active_students} />
            <BannerStat label="Tiến độ trung bình" value={`${stats.avg_progress}%`} />
          </div>
        ) : !isTeacher && studentStats ? (
          <div className="flex gap-4">
            <BannerStat label="Bài tập cần làm" value={studentStats.pending_count} />
            <BannerStat label="Đã hoàn thành" value={studentStats.submitted_count} />
          </div>
        ) : null}
      </div>

      {/* Stat cards */}
      {isTeacher && stats ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard icon="menu_book" label="Số lớp quản lý" value={counts.managed} tint="#D94A56" />
          <StatCard icon="school" label="Số lớp tham gia" value={counts.joined} tint="#2563EB" />
          <StatCard icon="group" label="Tổng số học sinh" value={stats.total_students} tint="#16A34A" />
          <StatCard icon="podcasts" label="Tổng số lớp" value={counts.total} tint="#EA580C" />
        </div>
      ) : !isTeacher && studentStats ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard icon="school" label="Số lớp tham gia" value={studentStats.joined_class_count} tint="#2563EB" />
          <StatCard icon="assignment" label="Bài tập cần làm" value={studentStats.pending_count} tint="#D94A56" />
          <StatCard icon="task_alt" label="Đã hoàn thành" value={studentStats.submitted_count} tint="#16A34A" />
          <StatCard
            icon="grade"
            label="Điểm trung bình"
            value={studentStats.avg_band != null ? studentStats.avg_band : "—"}
            tint="#EA580C"
          />
        </div>
      ) : null}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        {isTeacher ? (
          <button
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 rounded-[10px] bg-[#D94A56] px-6 py-3 text-[15px] font-bold text-white shadow-[0_4px_12px_0_rgba(217,74,87,0.25)] hover:bg-[#c8404b]"
          >
            <span className="material-symbols-rounded text-[20px]">add</span>
            Tạo lớp mới
          </button>
        ) : null}
        <button
          onClick={() => setJoinOpen(true)}
          className="inline-flex items-center gap-2 rounded-[10px] border-[1.5px] border-[#D94A56] bg-white px-6 py-3 text-[15px] font-bold text-[#D94A56] hover:bg-[#FCE8EA]"
        >
          <span className="material-symbols-rounded text-[20px]">link</span>
          Tham gia bằng mã / link mời
        </button>
      </div>

      {/* Class list */}
      <div className="rounded-[13px] border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <h3 className="text-lg font-bold text-[#2D3142]">Danh sách lớp học</h3>
            <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-[#6A7282]">
              {classrooms.length} Lớp
            </span>
          </div>
          {classrooms.length > 0 ? (
            <span className="text-sm font-medium text-[#D94A56]">Xem tất cả →</span>
          ) : null}
        </div>

        {classrooms.length === 0 ? (
          <div className="flex flex-col items-center py-14 text-center">
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
              <span className="material-symbols-rounded text-[40px] leading-none text-gray-400">
                school
              </span>
            </span>
            <p className="mt-5 text-xl font-bold text-[#2D3142]">Chưa có lớp học nào</p>
            <p className="mt-1 text-sm text-[#6A7282]">
              tạo lớp mới hoặc tham gia bằng mã mời để bắt đầu
            </p>
            <div className="mt-6 flex gap-3">
              {isTeacher ? (
                <button
                  onClick={() => setCreateOpen(true)}
                  className="rounded-[10px] bg-[#D94A56] px-6 py-2.5 text-[15px] font-bold text-white shadow-[0_4px_12px_0_rgba(217,74,87,0.25)] hover:bg-[#c8404b]"
                >
                  Tạo lớp ngay
                </button>
              ) : null}
              <button
                onClick={() => setJoinOpen(true)}
                className="rounded-[10px] border-[1.5px] border-[#D94A56] bg-white px-6 py-2.5 text-[15px] font-bold text-[#D94A56] hover:bg-[#FCE8EA]"
              >
                Tham gia lớp
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[760px]">
              <div
                className={`${ROW_GRID} border-b border-[#E5E7EB] px-2 pb-3 text-[11px] font-bold uppercase tracking-[0.06em] text-[#9CA3AF]`}
              >
                <span>Tên lớp</span>
                <span>Học sinh</span>
                <span>Bài giao</span>
                <span>Trạng thái</span>
                <span />
              </div>
              {classrooms.map((c) => (
                <ClassRow key={c.id} c={c} showRoleBadge={isTeacher} />
              ))}
            </div>
          </div>
        )}
      </div>

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
              className={`${fieldBase} ${createErr ? "border-[#D94A56]" : "border-[#E5E7EB]"}`}
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
              className={`${fieldBase} resize-none border-[#E5E7EB]`}
            />
            <p className="mt-2 text-[13px] text-[#6A7282]">Tối đa 200 ký tự</p>
          </div>
        </div>
        <div className="mt-8 flex justify-end gap-3">
          <button
            onClick={closeCreate}
            className="rounded-[10px] border border-[#E5E7EB] bg-white px-6 py-2.5 text-[15px] font-bold text-[#374151] hover:bg-gray-50"
          >
            Huỷ
          </button>
          <button
            onClick={handleCreate}
            disabled={submitting}
            className="rounded-[10px] bg-[#D94A56] px-7 py-2.5 text-[15px] font-bold text-white shadow-[0_4px_12px_0_rgba(217,74,87,0.25)] hover:bg-[#c8404b] disabled:opacity-60"
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
            className={`${fieldBase} ${joinErr ? "border-[#D94A56]" : "border-[#E5E7EB]"}`}
          />
          {joinErr ? (
            <p className="mt-1 text-[13px] text-[#D94A56]">Vui lòng nhập mã mời.</p>
          ) : null}
        </div>

        <div className="my-5 flex items-center gap-4">
          <span className="h-px flex-1 bg-[#E5E7EB]" />
          <span className="text-[14px] text-[#6A7282]">hoặc</span>
          <span className="h-px flex-1 bg-[#E5E7EB]" />
        </div>

        <button
          onClick={() => setScanOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-[11px] bg-[#FCE8EA] py-3.5 text-[15px] font-bold text-[#D94A56] hover:bg-[#FBD9DE]"
        >
          <span className="material-symbols-rounded text-[20px]">qr_code_2</span>
          Quét QR code mời
        </button>

        <div className="mt-8 flex justify-end gap-3">
          <button
            onClick={closeJoin}
            className="rounded-[10px] border border-[#E5E7EB] bg-white px-6 py-2.5 text-[15px] font-bold text-[#374151] hover:bg-gray-50"
          >
            Huỷ
          </button>
          <button
            onClick={handleJoin}
            disabled={submitting}
            className="rounded-[10px] bg-[#D94A56] px-7 py-2.5 text-[15px] font-bold text-white shadow-[0_4px_12px_0_rgba(217,74,87,0.25)] hover:bg-[#c8404b] disabled:opacity-60"
          >
            {submitting ? "Đang tham gia…" : "Tham gia"}
          </button>
        </div>
      </Modal>

      <ClassroomQrScanner open={scanOpen} onClose={closeScan} onResult={handleScan} />
    </div>
  );
};

PageClassroomList.Layout = ClassroomLayout;
