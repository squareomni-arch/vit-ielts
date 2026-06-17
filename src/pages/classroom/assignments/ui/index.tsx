import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  Checkbox,
  DatePicker,
  Empty,
  Input,
  Modal,
  Popconfirm,
  Select,
  message,
} from "antd";
import dayjs, { Dayjs } from "dayjs";
import { createClient } from "~supabase/client";
import { getQuizzes } from "~services/quiz";
import { createAssignments, deleteAssignment } from "~services/classroom";
import type { AssignmentWithStats } from "~services/types/classroom";
import type { Quiz } from "~services/types/database";
import { AppShell } from "@/widgets/layouts";
import { ROUTES } from "@/shared/routes";

type StudentLite = { id: string; name: string | null; email: string };

type Props = {
  classroom: { id: string; name: string };
  assignments: AssignmentWithStats[];
  students: StudentLite[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SKILL_LABELS: Record<string, string> = {
  reading: "Reading",
  listening: "Listening",
  writing: "Writing",
  speaking: "Speaking",
};

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

// ─── Assignment row (list view) ───────────────────────────────────────────────

const AssignmentRow = ({
  a,
  onDelete,
  classroomId,
}: {
  a: AssignmentWithStats;
  onDelete: (id: string) => void;
  classroomId: string;
}) => {
  const ratio = a.target_count ? Math.round((a.submitted_count / a.target_count) * 100) : 0;
  const overdue = a.due_at && dayjs(a.due_at).isBefore(dayjs());
  const isOpen = !overdue;

  return (
    <div className="rounded-[20px] border border-[#e7e9e4] bg-white p-5 shadow-[0_2px_4px_0_rgba(0,0,0,0.04)]">
      {/* skill pill + status badge */}
      <div className="mb-3 flex items-center gap-2">
        {a.quiz_skill ? (
          <span className={skillPillCls(a.quiz_skill)}>
            {SKILL_LABELS[a.quiz_skill] ?? a.quiz_skill}
          </span>
        ) : null}
        {isOpen ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f2fadd] px-2.5 py-0.5 text-[12px] font-bold text-[#219653]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#219653]" />
            Open
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-0.5 text-[12px] font-bold text-[#6a7282]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#6a7282]" />
            Closed
          </span>
        )}
        {!a.assigned_to_all ? (
          <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[12px] font-medium text-amber-600">
            Selected students only
          </span>
        ) : null}
      </div>

      {/* title + actions */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Link
            href={ROUTES.CLASSROOM.ASSIGNMENT_DETAIL(classroomId, a.id)}
            className="block truncate font-display font-bold text-[18px] text-[#191d24] hover:text-[#b3e653] transition-colors"
          >
            {a.quiz_title}
          </Link>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-[13px] text-[#6a7282]">
            {a.due_at ? (
              <span className={overdue ? "text-[#e54552]" : ""}>
                <span className="material-symbols-rounded text-[14px] align-middle">schedule</span>{" "}
                Due {dayjs(a.due_at).format("DD/MM/YYYY HH:mm")}
              </span>
            ) : (
              <span>No due date</span>
            )}
            {a.note ? <span className="truncate">· {a.note}</span> : null}
          </div>
        </div>

        {/* action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={ROUTES.CLASSROOM.ASSIGNMENT_DETAIL(classroomId, a.id)}
            className="rounded-full border border-[#e7e9e4] bg-white px-4 py-2 text-[13px] font-bold text-[#191d24] hover:bg-[#f6f7f4] transition-colors"
          >
            View results
          </Link>
          <Popconfirm
            title="Delete this assignment?"
            onConfirm={() => onDelete(a.id)}
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <button className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e7e9e4] bg-white text-[#6a7282] hover:bg-gray-50 hover:text-[#e54552] transition-colors">
              <span className="material-symbols-rounded text-[18px]">delete</span>
            </button>
          </Popconfirm>
        </div>
      </div>

      {/* progress bar */}
      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between text-[12px] text-[#6a7282]">
          <span>{a.submitted_count}/{a.target_count} submitted</span>
          <span className="font-medium text-[#191d24]">{ratio}%</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-[#e7e9e4]">
          <div
            className="h-1.5 rounded-full bg-[#b3e653] transition-all"
            style={{ width: `${ratio}%` }}
          />
        </div>
      </div>
    </div>
  );
};

// ─── Modal close button ────────────────────────────────────────────────────────

const ModalClose = ({ onClose }: { onClose: () => void }) => (
  <button
    onClick={onClose}
    className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f3f4f6] text-[#6a7282] transition hover:bg-[#e5e7eb]"
    aria-label="Close"
  >
    <span className="material-symbols-rounded text-[18px]">close</span>
  </button>
);

// ─── Skill tab bar (step 1 modal) ─────────────────────────────────────────────

const SKILLS = ["Reading", "Listening", "Writing", "Speaking"] as const;
type Skill = (typeof SKILLS)[number];

// ─── Page ─────────────────────────────────────────────────────────────────────

export const PageClassroomAssignments = ({ classroom, assignments, students }: Props) => {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [submitting, setSubmitting] = useState(false);

  // Step 1 — quiz picker
  const [search, setSearch] = useState("");
  const [activeSkill, setActiveSkill] = useState<Skill>("Reading");
  const [assignFilter, setAssignFilter] = useState<"all" | "not_assigned" | "assigned">("all");
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);
  const [selectedQuizzes, setSelectedQuizzes] = useState<Quiz[]>([]);

  // Step 2 — config
  const [dueAt, setDueAt] = useState<Dayjs | null>(null);
  const [note, setNote] = useState("");
  const [audience, setAudience] = useState<"all" | "subset">("all");
  const [subset, setSubset] = useState<string[]>([]);

  const selectedIds = new Set(selectedQuizzes.map((q) => q.id));
  const assignedIds = new Set(assignments.map((a) => a.quiz_id));

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoadingQuizzes(true);
    getQuizzes(supabase, {
      search: search || undefined,
      page: 1,
      pageSize: 30,
    })
      .then((res) => {
        if (active) setQuizzes(res.data);
      })
      .catch(() => active && setQuizzes([]))
      .finally(() => active && setLoadingQuizzes(false));
    return () => {
      active = false;
    };
  }, [open, search, supabase]);

  const resetModal = () => {
    setOpen(false);
    setStep(1);
    setSearch("");
    setSelectedQuizzes([]);
    setDueAt(null);
    setNote("");
    setAudience("all");
    setSubset([]);
    setActiveSkill("Reading");
    setAssignFilter("all");
  };

  const toggleQuiz = (q: Quiz) => {
    setSelectedQuizzes((prev) =>
      prev.some((x) => x.id === q.id) ? prev.filter((x) => x.id !== q.id) : [...prev, q]
    );
  };

  const handleAssign = async () => {
    setSubmitting(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("You need to sign in.");
      await createAssignments(supabase, {
        classroomId: classroom.id,
        quizIds: selectedQuizzes.map((q) => q.id),
        dueAt: dueAt ? dueAt.toISOString() : null,
        note: note.trim() || null,
        studentIds: audience === "subset" ? subset : null,
        createdBy: user.id,
      });
      // Notify assigned students (fire-and-forget; non-blocking).
      void fetch("/api/classroom/notify-assignment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classroomId: classroom.id,
          studentIds: audience === "subset" ? subset : null,
          count: selectedQuizzes.length,
        }),
      }).catch(() => {});
      message.success(`Assigned ${selectedQuizzes.length} test${selectedQuizzes.length !== 1 ? "s" : ""} to students`);
      resetModal();
      router.replace(router.asPath, undefined, { scroll: false });
    } catch (e) {
      message.error(e instanceof Error ? e.message : "Failed to assign tests.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAssignment(supabase, id);
      message.success("Assignment deleted");
      router.replace(router.asPath, undefined, { scroll: false });
    } catch {
      message.error("Failed to delete assignment.");
    }
  };

  // Filtered quiz list for step 1
  const filteredQuizzes = quizzes.filter((q) => {
    const skillMatch = q.skill?.toLowerCase() === activeSkill.toLowerCase();
    if (!skillMatch) return false;
    if (assignFilter === "assigned") return assignedIds.has(q.id);
    if (assignFilter === "not_assigned") return !assignedIds.has(q.id);
    return true;
  });

  return (
    <div className="space-y-[28px]">
      {/* Page header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display font-bold text-[26px] tracking-[-0.52px] text-[#191d24] leading-none">
            Assignments
          </h1>
          <p className="mt-[6px] font-inter font-normal text-[15px] text-[#6a7282]">
            Class: {classroom.name}
          </p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-[#b3e653] px-[22px] py-[11px] text-[14px] font-bold font-inter text-[#191d24] hover:bg-[#9ad534] transition-colors"
        >
          <span className="material-symbols-rounded text-[18px]">add</span>
          Assign tests
        </button>
      </div>

      {/* Back link */}
      <Link
        href={ROUTES.CLASSROOM.DETAIL(classroom.id)}
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#6a7282] hover:text-[#191d24] transition-colors"
      >
        <span className="material-symbols-rounded text-[16px]">arrow_back</span>
        Back to class
      </Link>

      {/* Assignment list */}
      {assignments.length === 0 ? (
        <div className="rounded-[20px] border border-dashed border-[#e7e9e4] bg-white p-10 flex flex-col items-center text-center gap-4">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#f6f7f4]">
            <span className="material-symbols-rounded text-[32px] text-[#6a7282]">assignment</span>
          </span>
          <p className="font-display font-bold text-[18px] text-[#191d24]">No assignments yet</p>
          <p className="font-inter text-[14px] text-[#6a7282] max-w-[320px]">
            Assign tests to students to track their progress and results.
          </p>
          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-[#b3e653] px-[22px] py-[11px] text-[14px] font-bold font-inter text-[#191d24] hover:bg-[#9ad534] transition-colors"
          >
            <span className="material-symbols-rounded text-[18px]">add</span>
            Assign your first test
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {assignments.map((a) => (
            <AssignmentRow key={a.id} a={a} onDelete={handleDelete} classroomId={classroom.id} />
          ))}
        </div>
      )}

      {/* ── 2-step assign modal ── */}
      <Modal
        open={open}
        onCancel={() => !submitting && resetModal()}
        width={580}
        footer={null}
        closable={false}
        centered
        styles={{ content: { borderRadius: 16, padding: 28 } }}
        destroyOnClose
      >
        {step === 1 ? (
          /* ── Step 1: Select assignment ── */
          <div className="flex flex-col gap-0">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-rounded text-[22px] text-[#219653]">
                  assignment
                </span>
                <h3 className="font-display font-bold text-[20px] text-[#191d24]">
                  Select assignment
                </h3>
              </div>
              <ModalClose onClose={resetModal} />
            </div>

            {/* Skill tabs */}
            <div className="flex border-b border-[#e7e9e4] mb-4">
              {SKILLS.map((skill) => (
                <button
                  key={skill}
                  onClick={() => setActiveSkill(skill)}
                  className={`px-4 py-2.5 text-[14px] font-medium transition-colors whitespace-nowrap ${
                    activeSkill === skill
                      ? "border-b-2 border-[#191d24] text-[#191d24] font-bold -mb-px"
                      : "text-[#6a7282] hover:text-[#191d24]"
                  }`}
                >
                  {skill}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <span className="material-symbols-rounded absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[#9ca3af]">
                search
              </span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search assignments..."
                className="w-full rounded-[11px] border border-[#e7e9e4] py-2.5 pl-9 pr-4 text-[14px] text-[#191d24] placeholder:text-[#9ca3af] outline-none focus:border-[#b3e653] transition"
              />
            </div>

            {/* Filter pills */}
            <div className="flex gap-2 mb-4">
              {(
                [
                  { key: "all", label: "All" },
                  { key: "not_assigned", label: "Not assigned" },
                  { key: "assigned", label: "Assigned" },
                ] as const
              ).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setAssignFilter(key)}
                  className={`rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors ${
                    assignFilter === key
                      ? "bg-[#b3e653] text-[#191d24] font-bold"
                      : "border border-[#e7e9e4] bg-white text-[#6a7282] hover:bg-[#f6f7f4]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Quiz list */}
            <div className="max-h-[320px] overflow-y-auto -mx-1 px-1 space-y-0">
              {loadingQuizzes ? (
                <p className="py-8 text-center text-[14px] text-[#6a7282]">Loading…</p>
              ) : filteredQuizzes.length === 0 ? (
                <p className="py-8 text-center text-[14px] text-[#6a7282]">No assignments found.</p>
              ) : (
                filteredQuizzes.map((q) => {
                  const isChecked = selectedIds.has(q.id);
                  const isAssigned = assignedIds.has(q.id);
                  return (
                    <label
                      key={q.id}
                      className={`flex cursor-pointer items-center gap-3 rounded-[11px] border px-4 py-3 mb-2 transition-colors ${
                        isChecked
                          ? "border-[#b3e653] bg-[#f2fadd]"
                          : "border-[#e7e9e4] bg-white hover:bg-[#f6f7f4]"
                      }`}
                    >
                      <Checkbox
                        checked={isChecked}
                        onChange={() => toggleQuiz(q)}
                        className="shrink-0"
                      />
                      <span className="min-w-0 flex-1 truncate text-[14px] font-medium text-[#191d24]">
                        {q.title}
                      </span>
                      {isAssigned ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#f2fadd] px-2 py-0.5 text-[11px] font-bold text-[#219653] shrink-0">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#219653]" />
                          Assigned
                        </span>
                      ) : null}
                    </label>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="mt-5 flex items-center justify-between border-t border-[#e7e9e4] pt-4">
              <span className="text-[14px] text-[#6a7282]">
                {selectedQuizzes.length} selected
              </span>
              <button
                disabled={selectedQuizzes.length === 0}
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-2 rounded-full bg-[#b3e653] px-6 py-2.5 text-[14px] font-bold text-[#191d24] hover:bg-[#9ad534] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Continue →
              </button>
            </div>
          </div>
        ) : (
          /* ── Step 2: Configure assignment ── */
          <div className="flex flex-col gap-0">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-rounded text-[22px] text-[#219653]">
                  assignment
                </span>
                <h3 className="font-display font-bold text-[20px] text-[#191d24]">
                  Configure assignment ({selectedQuizzes.length} items)
                </h3>
              </div>
              <ModalClose onClose={resetModal} />
            </div>

            {/* Selected quizzes */}
            <div className="mb-5">
              <p className="mb-2 text-[13px] font-medium text-[#6a7282]">
                Selected ({selectedQuizzes.length})
              </p>
              <div className="space-y-2">
                {selectedQuizzes.map((q) => (
                  <div
                    key={q.id}
                    className="flex items-center justify-between rounded-[11px] border border-[#b3e653] bg-[#f2fadd] px-4 py-2.5"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {q.skill ? (
                        <span className={skillPillCls(q.skill)}>
                          {SKILL_LABELS[q.skill] ?? q.skill}
                        </span>
                      ) : null}
                      <span className="truncate text-[14px] font-medium text-[#191d24]">
                        {q.title}
                      </span>
                    </div>
                    <button
                      onClick={() => toggleQuiz(q)}
                      className="ml-2 text-[#6a7282] hover:text-[#e54552] transition-colors"
                    >
                      <span className="material-symbols-rounded text-[18px]">close</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Assign to */}
            <div className="mb-4">
              <div className="mb-2 flex items-center justify-between">
                <label className="text-[14px] font-bold text-[#191d24]">Assign to</label>
                <button
                  onClick={() => {
                    if (audience === "all") {
                      setAudience("subset");
                      setSubset(students.map((s) => s.id));
                    } else {
                      setAudience("all");
                      setSubset([]);
                    }
                  }}
                  className="flex items-center gap-1.5 text-[13px] font-medium text-[#6a7282] hover:text-[#191d24] transition-colors"
                >
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full transition-colors ${
                      audience === "all"
                        ? "bg-[#b3e653]"
                        : "border-2 border-[#e7e9e4]"
                    }`}
                  >
                    {audience === "all" && (
                      <span className="material-symbols-rounded text-[14px] text-[#191d24]">
                        check
                      </span>
                    )}
                  </span>
                  Select all ({students.length} students)
                </button>
              </div>

              {audience === "all" ? (
                <div className="flex flex-wrap gap-2">
                  {students.slice(0, 5).map((s) => (
                    <span
                      key={s.id}
                      className="rounded-full bg-[#f2fadd] px-3 py-1 text-[13px] font-medium text-[#219653]"
                    >
                      {s.name || s.email}
                    </span>
                  ))}
                  {students.length > 5 ? (
                    <span className="rounded-full bg-[#f6f7f4] px-3 py-1 text-[13px] font-medium text-[#6a7282]">
                      +{students.length - 5} more
                    </span>
                  ) : null}
                </div>
              ) : (
                <Select
                  mode="multiple"
                  className="w-full"
                  placeholder="Select students…"
                  value={subset}
                  onChange={setSubset}
                  optionFilterProp="label"
                  options={students.map((s) => ({
                    value: s.id,
                    label: s.name || s.email,
                  }))}
                />
              )}
            </div>

            {/* Note */}
            <div className="mb-4">
              <label className="mb-2 block text-[14px] font-bold text-[#191d24]">
                Note (optional)
              </label>
              <Input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Submit before Friday"
                className="rounded-[11px]"
                maxLength={500}
              />
            </div>

            {/* Due date */}
            <div className="mb-5">
              <label className="mb-2 block text-[14px] font-bold text-[#191d24]">
                Due date (optional)
              </label>
              <DatePicker
                showTime={{ defaultValue: dayjs("23:59", "HH:mm"), format: "HH:mm" }}
                format="DD / MM / YYYY"
                className="w-full rounded-[11px]"
                value={dueAt}
                onChange={(v) => setDueAt(v)}
                placeholder="dd / mm / yyyy"
              />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-[#e7e9e4] pt-4">
              <button
                onClick={() => setStep(1)}
                className="rounded-full border border-[#e7e9e4] bg-white px-5 py-2.5 text-[14px] font-bold text-[#191d24] hover:bg-[#f6f7f4] transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={handleAssign}
                disabled={submitting || (audience === "subset" && subset.length === 0)}
                className="rounded-full bg-[#b3e653] px-6 py-2.5 text-[14px] font-bold text-[#191d24] hover:bg-[#9ad534] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {submitting
                  ? "Assigning…"
                  : `Assign ${selectedQuizzes.length} items (${
                      audience === "all" ? students.length : subset.length
                    } students)`}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

PageClassroomAssignments.Layout = AppShell;
