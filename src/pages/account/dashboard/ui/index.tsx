// === PAGE: Student Dashboard ===
// Figma node 3346:162 "Main" — Dashboard Logged in (redesign)
// Sections: greeting, stat cards, resume banner, my classes, homework due,
// recommended tests, weekly activity + weekly goal
import Link from "next/link";
import dayjs from "dayjs";
import { useMemo, useRef } from "react";
import { AppShell } from "@/widgets/layouts";
import { DashboardStats } from "./dashboard-stats";
import { useWidgetContext, WidgetContextProvider } from "@/widgets/target-score/context";
import { useStreakData } from "@/widgets/study-streak/hooks/useStreakData";
import { useAuth } from "@/appx/providers";
import { roundIELTSScore } from "@/shared/lib/ielts-round";
import { ROUTES } from "@/shared/routes";
import { TestCard } from "@/shared/ui/ds/molecules/test-card/test-card";
import type { ClassroomSummary, StudentAssignmentView } from "~services/types/classroom";
import type { Quiz } from "~services/types/database";
import { Splide, SplideSlide, SplideTrack } from "@splidejs/react-splide";
import "@splidejs/react-splide/css/core";
import type { Splide as SplideType } from "@splidejs/splide";

// ─── Skill config (matches my-assignments page) ──────────────────────────────
const SKILL_CONFIG: Record<string, { chipBg: string; icon: string; color: string }> = {
  reading: { chipBg: "#eef3ff", icon: "menu_book", color: "#5281f9" },
  listening: { chipBg: "#fff6df", icon: "headphones", color: "#b7791f" },
  writing: { chipBg: "#e6f9ec", icon: "edit_note", color: "#219653" },
  speaking: { chipBg: "#f3e8ff", icon: "record_voice_over", color: "#7c3aed" },
};

const STATUS_BADGE: Record<string, { bg: string; dot: string; text: string; label: string }> = {
  new: { bg: "#eef3ff", dot: "#5281f9", text: "#5281f9", label: "New" },
  in_progress: { bg: "#fef4e2", dot: "#fc945a", text: "#fc945a", label: "In progress" },
  submitted: { bg: "#e6f9ec", dot: "#219653", text: "#219653", label: "Done" },
  overdue: { bg: "#fdecee", dot: "#e54552", text: "#e54552", label: "Overdue" },
};

type DisplayStatus = "new" | "in_progress" | "submitted" | "overdue";

function resolveDisplayStatus(a: StudentAssignmentView): DisplayStatus {
  if (a.status === "overdue") return "overdue";
  if (a.status === "submitted" || a.status === "late") return "submitted";
  if (a.in_progress) return "in_progress";
  return "new";
}

// Avatar tints cycle for class cards — Figma: green / blue / orange slots
const CLASS_TINTS = [
  { bg: "rgba(179,230,83,0.16)", text: "#191d24" },
  { bg: "rgba(82,129,249,0.16)", text: "#5281f9" },
  { bg: "rgba(252,148,89,0.16)", text: "#fc945a" },
];

const classInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

// ─── Section header (shared) ──────────────────────────────────────────────────
const SectionHeader = ({
  title,
  linkText,
  href,
}: {
  title: string;
  linkText?: string;
  href?: string;
}) => (
  <div className="flex items-baseline justify-between gap-3 mb-5">
    <div className="flex items-baseline gap-3">
      <h2 className="font-display font-bold text-[20px] text-[#191d24]">{title}</h2>
      {linkText && href && (
        <Link
          href={href}
          className="font-inter font-semibold text-[14px] text-[#9ad534] hover:text-[#191d24] transition-colors"
        >
          {linkText} →
        </Link>
      )}
    </div>
  </div>
);

// ─── Resume banner — Figma node 3336:1814 ─────────────────────────────────────
const ResumeBanner = ({ assignment }: { assignment: StudentAssignmentView }) => (
  <section
    data-section="dashboard-resume"
    className="relative overflow-hidden bg-[#191d24] rounded-[24px] px-6 sm:px-8 py-6 flex flex-col sm:flex-row sm:items-center gap-5"
  >
    {/* Subtle grid pattern overlay */}
    <div
      className="absolute inset-0 opacity-[0.06] pointer-events-none"
      style={{
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
        backgroundSize: "32px 32px",
      }}
    />
    <div className="relative flex-1 min-w-0">
      <p className="font-inter font-bold text-[12px] tracking-[1.5px] uppercase text-[#b3e653]">
        Continue where you left off
      </p>
      <h2 className="mt-2 font-display font-bold text-[22px] text-white truncate">
        {assignment.quiz_title}
      </h2>
      <p className="mt-1.5 font-inter text-[14px] text-[rgba(255,255,255,0.65)] capitalize">
        {assignment.classroom_name} · {assignment.quiz_skill}
      </p>
    </div>
    <Link
      href={ROUTES.TAKE_THE_TEST(assignment.quiz_slug)}
      className="relative shrink-0 inline-flex items-center gap-2 bg-[#b3e653] hover:bg-[#9ad534] transition-colors rounded-full px-7 h-[48px] font-inter font-bold text-[14px] text-[#191d24]"
    >
      <span className="material-symbols-rounded text-[20px] leading-none">play_circle</span>
      Resume
    </Link>
  </section>
);

// ─── My classes — Figma node 3729:818 ─────────────────────────────────────────
const MyClasses = ({
  classrooms,
  assignments,
}: {
  classrooms: ClassroomSummary[];
  assignments: StudentAssignmentView[];
}) => {
  const cards = classrooms.slice(0, 3).map((c, i) => {
    const classAssignments = assignments.filter((a) => a.classroom_id === c.id);
    const doneCount = classAssignments.filter(
      (a) => a.status === "submitted" || a.status === "late"
    ).length;
    const dueCount = classAssignments.filter(
      (a) => a.status === "pending" || a.status === "overdue"
    ).length;
    const progress =
      classAssignments.length > 0
        ? Math.round((doneCount / classAssignments.length) * 100)
        : 0;
    return { classroom: c, dueCount, progress, hasAssignments: classAssignments.length > 0, tint: CLASS_TINTS[i % CLASS_TINTS.length] };
  });

  return (
    <section data-section="dashboard-classes">
      <SectionHeader title="My classes" linkText="View all" href={ROUTES.CLASSROOM.LIST} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {cards.map(({ classroom, dueCount, progress, hasAssignments, tint }) => (
          <div
            key={classroom.id}
            className="bg-white border border-[rgba(25,29,36,0.1)] rounded-[20px] shadow-[0px_6px_18px_0px_rgba(0,0,0,0.05)] p-5 flex flex-col gap-4"
          >
            {/* Header: avatar + name */}
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="size-[44px] rounded-[12px] flex items-center justify-center shrink-0 font-inter font-bold text-[14px]"
                style={{ backgroundColor: tint.bg, color: tint.text }}
              >
                {classInitials(classroom.name)}
              </div>
              <div className="min-w-0">
                <p className="font-inter font-bold text-[15px] text-[#191d24] truncate">
                  {classroom.name}
                </p>
                <p className="font-inter text-[12px] text-[#6a7282] truncate">
                  {classroom.student_count} member{classroom.student_count !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
            {/* Progress */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-inter text-[12px] text-[#6a7282]">Progress</span>
                <span className="font-inter font-semibold text-[12px] text-[#191d24]">
                  {progress}%
                </span>
              </div>
              <div className="h-[6px] rounded-full bg-[#eef0eb] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#b3e653]"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            {/* Footer: due badge + open link */}
            <div className="flex items-center justify-between">
              {dueCount > 0 ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[rgba(179,230,83,0.18)] text-[12px] font-semibold text-[#5b7e1c]">
                  <span className="size-[6px] rounded-full bg-[#9ad534]" />
                  {dueCount} due
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#eef3ff] text-[12px] font-semibold text-[#5281f9]">
                  <span className="size-[6px] rounded-full bg-[#5281f9]" />
                  {hasAssignments ? "Done" : "New"}
                </span>
              )}
              <Link
                href={ROUTES.CLASSROOM.DETAIL(classroom.id)}
                className="font-inter font-semibold text-[13px] text-[#191d24] hover:text-[#9ad534] transition-colors"
              >
                Open →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

// ─── Homework due — Figma node 3729:877 ───────────────────────────────────────
const STATUS_PRIORITY: Record<DisplayStatus, number> = {
  in_progress: 0,
  new: 1,
  overdue: 2,
  submitted: 3,
};

const HomeworkRow = ({ a }: { a: StudentAssignmentView }) => {
  const skill = a.quiz_skill?.toLowerCase() ?? "reading";
  const sc = SKILL_CONFIG[skill] ?? SKILL_CONFIG.reading;
  const ds = resolveDisplayStatus(a);
  const bc = STATUS_BADGE[ds];

  const metaText = (() => {
    if (ds === "submitted") {
      return a.score != null ? `Submitted · Band ${a.score}` : "Submitted";
    }
    if (!a.due_at) return "No deadline";
    const due = dayjs(a.due_at);
    const now = dayjs();
    if (ds === "overdue") {
      const n = now.diff(due, "day");
      return `Overdue ${n} day${n !== 1 ? "s" : ""}`;
    }
    const n = due.diff(now, "day");
    return `Due in ${n} day${n !== 1 ? "s" : ""}`;
  })();

  return (
    <div className="flex items-center gap-4 px-5 py-4">
      {/* Skill chip */}
      <div
        className="size-[44px] rounded-[12px] flex items-center justify-center shrink-0"
        style={{ background: sc.chipBg }}
      >
        <span
          className="material-symbols-rounded text-[20px] leading-none"
          style={{ color: sc.color }}
        >
          {sc.icon}
        </span>
      </div>
      {/* Title + class · skill */}
      <div className="flex-1 min-w-0">
        <p className="font-inter font-bold text-[14px] text-[#191d24] truncate">
          {a.quiz_title}
        </p>
        <p className="mt-0.5 font-inter text-[12px] text-[#6a7282] truncate capitalize">
          {a.classroom_name} · {a.quiz_skill}
        </p>
      </div>
      {/* Meta + badge + action */}
      <span
        className={`hidden md:block shrink-0 font-inter text-[13px] ${
          ds === "overdue" ? "text-[#e54552] font-semibold" : "text-[#6a7282]"
        }`}
      >
        {metaText}
      </span>
      <span
        className="hidden sm:inline-flex shrink-0 items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-semibold"
        style={{ background: bc.bg, color: bc.text }}
      >
        <span className="size-[6px] rounded-full" style={{ background: bc.dot }} />
        {bc.label}
      </span>
      {ds === "submitted" ? (
        a.test_result_id ? (
          <Link
            href={ROUTES.TEST_RESULT(a.test_result_id)}
            className="shrink-0 font-inter font-semibold text-[13px] text-[#191d24] border border-[#e7e9e4] rounded-full px-4 py-1.5 hover:bg-[#f6f7f4] transition-colors whitespace-nowrap"
          >
            View
          </Link>
        ) : null
      ) : ds === "overdue" ? (
        <Link
          href={ROUTES.CLASSROOM.MY_ASSIGNMENT(a.assignment_id)}
          className="shrink-0 font-inter font-semibold text-[13px] border border-[#e54552] text-[#e54552] rounded-full px-4 py-1.5 hover:bg-[#fdecee] transition-colors whitespace-nowrap"
        >
          Submit late
        </Link>
      ) : (
        <Link
          href={ROUTES.CLASSROOM.MY_ASSIGNMENT(a.assignment_id)}
          className="shrink-0 inline-flex items-center gap-1.5 font-inter font-bold text-[13px] text-[#191d24] bg-[#b3e653] hover:bg-[#9ad534] rounded-full px-4 py-1.5 transition-colors whitespace-nowrap"
        >
          <span className="material-symbols-rounded text-[16px] leading-none">play_circle</span>
          {ds === "in_progress" ? "Continue" : "Start"}
        </Link>
      )}
    </div>
  );
};

const HomeworkDue = ({ assignments }: { assignments: StudentAssignmentView[] }) => {
  const rows = [...assignments]
    .sort(
      (x, y) => STATUS_PRIORITY[resolveDisplayStatus(x)] - STATUS_PRIORITY[resolveDisplayStatus(y)]
    )
    .slice(0, 3);

  return (
    <section data-section="dashboard-homework">
      <SectionHeader title="Homework due" linkText="See all" href={ROUTES.CLASSROOM.MY_ASSIGNMENTS} />
      <div className="bg-white border border-[rgba(25,29,36,0.1)] rounded-[20px] shadow-[0px_6px_18px_0px_rgba(0,0,0,0.05)] divide-y divide-[#f0f1ee] overflow-hidden">
        {rows.map((a) => (
          <HomeworkRow key={a.assignment_id} a={a} />
        ))}
      </div>
    </section>
  );
};

// ─── Recommended for you — Figma node 3346:167 ────────────────────────────────
const quizHref = (q: Quiz) =>
  q.type === "academic" || q.type === "general"
    ? ROUTES.EXAM.SINGLE(q.slug)
    : ROUTES.PRACTICE.SINGLE(q.slug);

const Recommended = ({ quizzes }: { quizzes: Quiz[] }) => {
  const splideRef = useRef<{ splide: SplideType } | null>(null);

  const handlePrev = () => splideRef.current?.splide?.go("<");
  const handleNext = () => splideRef.current?.splide?.go(">");

  return (
    <section data-section="dashboard-recommended">
      <div className="flex items-baseline justify-between gap-3 mb-5">
        <div className="flex items-baseline gap-3">
          <h2 className="font-display font-bold text-[20px] text-[#191d24]">Recommended for you</h2>
          <Link
            href={ROUTES.EXAM.ARCHIVE}
            className="font-inter font-semibold text-[14px] text-[#9ad534] hover:text-[#191d24] transition-colors"
          >
            View all →
          </Link>
        </div>
        {/* Navigation buttons */}
        {quizzes.length > 1 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous slide"
              className="flex items-center justify-center w-8 h-8 rounded-full border border-[rgba(25,29,36,0.1)] hover:bg-[#eef3ff] text-[#6a7282] hover:text-[#191d24] transition-colors cursor-pointer"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next slide"
              className="flex items-center justify-center w-8 h-8 rounded-full border border-[rgba(25,29,36,0.1)] hover:bg-[#eef3ff] text-[#6a7282] hover:text-[#191d24] transition-colors cursor-pointer"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        )}
      </div>

      <div className="relative">
        <Splide
          ref={splideRef as any}
          hasTrack={false}
          options={{
            type: "slide",
            perPage: 4,
            perMove: 1,
            gap: "24px",
            pagination: false,
            arrows: false,
            breakpoints: {
              1280: { perPage: 3 },
              1024: { perPage: 2, gap: "20px" },
              768: { perPage: 2, gap: "16px" },
              480: { perPage: 1, gap: "16px" },
            },
          }}
        >
          <SplideTrack>
            {quizzes.map((q) => (
              <SplideSlide key={q.id} className="pb-8 pt-[14px] px-1">
                <TestCard
                  image={q.featured_image ?? undefined}
                  title={q.title}
                  skill={q.skill as "reading" | "listening" | "speaking" | "writing"}
                  attempts={q.tests_taken}
                  part={q.part ?? undefined}
                  isPro={q.pro_user_only}
                  actionText="Start test"
                  href={quizHref(q)}
                />
              </SplideSlide>
            ))}
          </SplideTrack>
        </Splide>
      </div>
    </section>
  );
};

// ─── Weekly activity + goal — Figma node 3346:170 ─────────────────────────────
const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

const Insights = () => {
  const { activities } = useStreakData();

  // Current week (Mon → Sun), minutes practised per day
  const week = useMemo(() => {
    const monday = dayjs().startOf("week").add(1, "day"); // dayjs week starts Sunday
    return DAY_LABELS.map((label, i) => {
      const date = monday.add(i, "day").format("YYYY-MM-DD");
      const found = activities.find((a) => a.date === date);
      return { label, date, minutes: found?.total ?? 0 };
    });
  }, [activities]);

  const max = Math.max(...week.map((d) => d.minutes), 1);
  const activeDays = week.filter((d) => d.minutes > 0).length;
  const pct = Math.round((activeDays / 7) * 100);
  const ringCircumference = 2 * Math.PI * 42;

  return (
    <section
      data-section="dashboard-insights"
      className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5"
    >
      {/* Weekly activity bar chart */}
      <div className="bg-white border border-[rgba(25,29,36,0.1)] rounded-[20px] shadow-[0px_6px_18px_0px_rgba(0,0,0,0.05)] p-7">
        <h3 className="font-display font-bold text-[18px] text-[#191d24]">Weekly activity</h3>
        <p className="mt-1 font-inter text-[13px] text-[#6a7282]">Minutes practised per day</p>
        <div className="mt-6 grid grid-cols-7 gap-3 items-end h-[170px]">
          {week.map((d, i) => {
            const isPeak = d.minutes > 0 && d.minutes === max;
            const height = d.minutes > 0 ? Math.max((d.minutes / max) * 100, 12) : 6;
            return (
              <div key={`${d.label}-${i}`} className="flex flex-col items-center gap-2 h-full justify-end">
                <div
                  className={`w-full rounded-[10px] transition-all ${
                    isPeak ? "bg-[#b3e653]" : "bg-[#e6edd9]"
                  }`}
                  style={{ height: `${height}%` }}
                  title={`${d.minutes} min`}
                />
                <span className="font-inter text-[12px] text-[#6a7282]">{d.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* This week's goal */}
      <div className="bg-white border border-[rgba(25,29,36,0.1)] rounded-[20px] shadow-[0px_6px_18px_0px_rgba(0,0,0,0.05)] p-7 flex flex-col">
        <h3 className="font-display font-bold text-[18px] text-[#191d24]">This week&apos;s goal</h3>
        <div className="flex items-center gap-6 mt-6 flex-1">
          {/* Progress ring */}
          <div className="relative size-[130px] shrink-0">
            <svg viewBox="0 0 100 100" className="size-full -rotate-90">
              <circle cx="50" cy="50" r="42" fill="none" stroke="#eef0eb" strokeWidth="10" />
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="#b3e653"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={ringCircumference}
                strokeDashoffset={ringCircumference * (1 - pct / 100)}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center font-display font-bold text-[24px] text-[#191d24]">
              {pct}%
            </span>
          </div>
          <div className="min-w-0">
            <p className="font-inter font-bold text-[15px] text-[#191d24]">
              {activeDays} of 7 days active
            </p>
            <p className="mt-2 font-inter text-[13px] text-[#6a7282] leading-relaxed">
              {activeDays >= 7
                ? "Perfect week — every day counts. Keep it up!"
                : "One more practice session to push your weekly streak. You've got this!"}
            </p>
          </div>
        </div>
        <Link
          href={ROUTES.EXAM.ARCHIVE}
          className="mt-6 inline-flex items-center justify-center h-[48px] rounded-full bg-[#191d24] hover:bg-[#242938] transition-colors font-inter font-bold text-[14px] text-white"
        >
          Start next test
        </Link>
      </div>
    </section>
  );
};

// ─── Page ──────────────────────────────────────────────────────────────────────
type Props = {
  classrooms?: ClassroomSummary[];
  assignments?: StudentAssignmentView[];
  recommended?: Quiz[];
};

const DashboardInner = ({ classrooms = [], assignments = [], recommended = [] }: Props) => {
  const { targetScore, loading: targetLoading } = useWidgetContext();
  const { summary } = useStreakData();
  const { currentUser } = useAuth();

  const firstName = useMemo(() => {
    const name = currentUser?.name || "";
    return name.split(" ").at(-1) || "there";
  }, [currentUser]);

  const currentBand = useMemo(() => {
    if (
      targetScore.listening == null ||
      targetScore.reading == null ||
      targetScore.speaking == null ||
      targetScore.writing == null
    ) {
      return null;
    }
    const avg =
      (Number(targetScore.listening) +
        Number(targetScore.reading) +
        Number(targetScore.speaking) +
        Number(targetScore.writing)) /
      4;
    return roundIELTSScore(avg).toFixed(1);
  }, [targetScore]);

  const resumeAssignment = useMemo(
    () => assignments.find((a) => resolveDisplayStatus(a) === "in_progress"),
    [assignments]
  );

  return (
    <div className="space-y-8" data-section="dashboard-main">
      {/* === SECTION: Greeting Top Bar === */}
      {/* Figma node 3346:163 "Top Bar" */}
      <section data-section="dashboard-greeting">
        <h1 className="font-display font-bold text-[26px] tracking-[-0.52px] text-[#191d24] leading-none">
          Welcome back, {firstName}
        </h1>
        {summary.currentStreak > 0 && (
          <p className="mt-1.5 font-inter font-normal text-[15px] text-[#6a7282]">
            {`You're on a ${summary.currentStreak}-day streak — keep it going.`}
          </p>
        )}
      </section>

      {/* === SECTION: Statistics Row === */}
      {/* Figma node 3346:166 "Stat Cards" — 4 cards */}
      <DashboardStats
        currentBand={targetLoading ? null : currentBand}
        studyStreakDays={summary.currentStreak}
      />

      {/* === SECTION: Continue where you left off === */}
      {/* Figma node 3336:1814 — shown only when an attempt is in progress */}
      {resumeAssignment && <ResumeBanner assignment={resumeAssignment} />}

      {/* === SECTION: My classes === */}
      {/* Figma node 3729:818 */}
      {classrooms.length > 0 && (
        <MyClasses classrooms={classrooms} assignments={assignments} />
      )}

      {/* === SECTION: Homework due === */}
      {/* Figma node 3729:877 */}
      {assignments.length > 0 && <HomeworkDue assignments={assignments} />}

      {/* === SECTION: Recommended for you === */}
      {/* Figma node 3346:167 */}
      {recommended.length > 0 && <Recommended quizzes={recommended} />}

      {/* === SECTION: Weekly activity + This week's goal === */}
      {/* Figma node 3346:170 */}
      <Insights />
    </div>
  );
};

export const PageDashboard = (props: Props) => {
  return (
    <WidgetContextProvider>
      <DashboardInner {...props} />
    </WidgetContextProvider>
  );
};

PageDashboard.Layout = AppShell;
