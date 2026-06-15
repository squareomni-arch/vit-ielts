import { useAuth } from "@/appx/providers";
import { ROUTES } from "@/shared/routes";
import { useProContentModal } from "@/shared/ui/pro-content";
import { SEOHeader } from "@/widgets";
import { AppShell } from "@/widgets/layouts";
import { decode } from "html-entities";
import Image from "next/image";
import Link from "next/link";
import { IPracticeSingle } from "@/pages/ielts-practice-single/api";
import { PracticeHistoryWidget } from "@/pages/ielts-practice-single/ui/practice-history";
import { normalizeSectionBadge } from "@/shared/lib/quiz-part";
import { TestCardWithScore } from "@/entities/practice-test";
import ExamModeModal from "@/pages/ielts-exam-library/ui/exam-mode-modal";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export function PageIELTSExamSingle({ post, isPreview: isPreviewProp }: { post: IPracticeSingle; isPreview?: boolean }) {
  const { currentUser } = useAuth();
  const openProContentModal = useProContentModal((state) => state.open);
  const router = useRouter();
  const isPreview = isPreviewProp || router.query.preview === "true";

  const [isModalOpen, setIsModalOpen] = useState(false);

  const requiresUpgrade =
    !isPreview && post.quizFields.proUserOnly && !currentUser?.userData?.isPro;

  // Auto-open modal when ?autoStart=true (after login redirect)
  useEffect(() => {
    if (router.query.autoStart === "true" && (currentUser || isPreview) && !requiresUpgrade) {
      setIsModalOpen(true);
      // Clean up URL without reloading
      const { autoStart, ...rest } = router.query;
      router.replace(
        { pathname: router.pathname, query: rest },
        undefined,
        { shallow: true }
      );
    }
  }, [router.query.autoStart, currentUser, requiresUpgrade, isPreview]);

  const handleStartExam = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!currentUser && !isPreview) {
      window.location.href = ROUTES.LOGIN(
        ROUTES.EXAM.SINGLE(post.slug) + "?autoStart=true"
      );
      return;
    }
    if (requiresUpgrade) {
      openProContentModal();
      return;
    }
    setIsModalOpen(true);
  };

  const skill = post.quizFields.skill[0];
  const examType = post.quizFields.type[0];
  const capitalizedSkill = skill === "listening" ? "LISTENING" : "READING";
  const capitalizedType = examType === "academic" ? "ACADEMIC" : examType === "general" ? "GENERAL" : examType.toUpperCase();

  // Compute backed stats
  const passageCount = post.quizFields.passages?.length ?? 0;
  const questionCount = post.quizFields.passages?.reduce(
    (acc, p) => acc + (p.questions?.length ?? 0),
    0
  ) ?? 0;
  const timeMinutes = post.quizFields.time;

  // Static prose copy (acceptable UI copy — no backing field)
  const isReading = skill === "reading";
  const whatToExpectText = isReading
    ? "This test mirrors the official IELTS Academic Reading paper exactly — same structure, timing and difficulty curve. You'll read passages of increasing difficulty and answer questions across a range of task types, from True/False/Not Given to matching headings and sentence completion."
    : "This test mirrors the official IELTS Listening paper exactly — same structure, timing and difficulty curve. You'll listen to four recordings and answer 40 questions across a range of task types.";

  const beforeYouBeginText =
    "Find a quiet space where you won't be interrupted for the full duration, and treat it like the real exam — the closer your conditions, the more useful your band score will be. You can flag questions and come back to them, and review all your answers before you submit.";

  // Test format checklist — derived from passages if available, else static
  const formatItems: string[] = isReading
    ? [
        ...(post.quizFields.passages ?? []).map(
          (p, i) => `Passage ${i + 1}${p.title ? ` — ${p.title}` : ""}`
        ),
        timeMinutes ? `${timeMinutes} minutes total · no extra transfer time` : "60 minutes total · no extra transfer time",
        "Auto-marked the moment you submit",
      ]
    : [
        "Part 1 — conversation between two speakers",
        "Part 2 — monologue on everyday topic",
        "Part 3 — conversation between multiple speakers",
        "Part 4 — academic lecture or monologue",
        timeMinutes ? `${timeMinutes} minutes total · no extra transfer time` : "30 minutes + 10 minutes transfer",
        "Auto-marked the moment you submit",
      ];

  const relatedLabel = isReading ? "Other reading tests" : "Other listening tests";
  const relatedQuizzes = post.relatedPracticeQuizzes ?? [];

  return (
    <>
      <SEOHeader
        fullHead={post.seo?.fullHead}
        title={post.seo?.title}
        description={post.excerpt}
        image={post.featuredImage?.node.sourceUrl}
      />

      {/* ── Back link ── */}
      <div className="mb-6">
        <Link
          href={ROUTES.EXAM.ARCHIVE}
          className="inline-flex items-center gap-1.5 text-body-s font-semibold text-brand-hover hover:underline"
        >
          <span className="material-symbols-rounded text-[16px] leading-none">arrow_back</span>
          Back to mock tests
        </Link>
      </div>

      {/* ── Skill · Type chip ── */}
      <div className="mb-4">
        <span className="inline-flex items-center px-3 py-1 rounded-full bg-brand-tint text-brand-hover text-eyebrow font-display tracking-[0.08em]">
          {capitalizedSkill} · {capitalizedType}
        </span>
      </div>

      {/* ── H1 + subtitle ── */}
      <h1 className="text-heading-1 font-display font-bold text-ink-900 leading-tight mb-3">
        {decode(post.title)}
      </h1>
      {post.excerpt && (
        <div
          className="text-body-m text-ink-muted mb-6 max-w-2xl"
          dangerouslySetInnerHTML={{ __html: post.excerpt }}
        />
      )}

      {/* ── Stat bar ── */}
      <div className="bg-surface-card rounded-2xl border border-border-hairline shadow-primary px-6 py-5 flex flex-wrap items-center gap-6 mb-8">
        {/* Stats */}
        <div className="flex items-center gap-8 flex-1 flex-wrap">
          {passageCount > 0 && (
            <div className="flex flex-col">
              <span className="text-title-m font-display font-bold text-ink-900">{passageCount}</span>
              <span className="text-body-s text-ink-muted">Passages</span>
            </div>
          )}
          {questionCount > 0 && (
            <div className="flex flex-col">
              <span className="text-title-m font-display font-bold text-ink-900">{questionCount}</span>
              <span className="text-body-s text-ink-muted">Questions</span>
            </div>
          )}
          {timeMinutes > 0 && (
            <div className="flex flex-col">
              <span className="text-title-m font-display font-bold text-ink-900">{timeMinutes} min</span>
              <span className="text-body-s text-ink-muted">Time limit</span>
            </div>
          )}
          {/* Band range: no backing field — hidden per rules */}
        </div>

        {/* Start test button */}
        <button
          onClick={handleStartExam}
          className="shrink-0 inline-flex items-center gap-2 bg-brand hover:bg-brand-hover active:bg-brand-hover text-ink-900 font-display font-semibold text-body-m px-6 py-3 rounded-full transition-colors"
        >
          Start test
        </button>
      </div>

      {/* ── Media / preview area ── */}
      <div className="relative rounded-2xl overflow-hidden mb-8 aspect-[21/9] bg-gradient-to-br from-accent-blue to-brand flex items-center justify-center">
        {post.featuredImage?.node.sourceUrl ? (
          <Image
            src={post.featuredImage.node.sourceUrl}
            alt={post.featuredImage.node.altText || post.title}
            fill
            className="object-cover"
            unoptimized
          />
        ) : null}
        {/* Play overlay */}
        <button
          onClick={handleStartExam}
          aria-label="Start test"
          className="relative z-10 w-20 h-20 rounded-full bg-surface-card/90 hover:bg-surface-card flex items-center justify-center shadow-primary transition-colors"
        >
          <span className="material-symbols-rounded text-[36px] text-ink-900 ml-1">play_arrow</span>
        </button>
      </div>

      {/* ── Body prose ── */}
      <div className="space-y-8 mb-10">
        {/* What to expect */}
        <div>
          <h2 className="text-heading-2 font-display font-bold text-ink-900 mb-3">What to expect</h2>
          <p className="text-body-m text-ink-body leading-relaxed">{whatToExpectText}</p>
        </div>

        {/* Test format checklist */}
        <div>
          <h2 className="text-heading-2 font-display font-bold text-ink-900 mb-4">Test format</h2>
          <ul className="space-y-3">
            {formatItems.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-body-m text-ink-body">
                <span className="material-symbols-rounded text-[20px] text-brand-hover mt-0.5 shrink-0">check</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Before you begin */}
        <div>
          <h2 className="text-heading-2 font-display font-bold text-ink-900 mb-3">Before you begin</h2>
          <p className="text-body-m text-ink-body leading-relaxed">{beforeYouBeginText}</p>
        </div>
      </div>

      {/* ── Test history ── */}
      <div className="bg-surface-card rounded-2xl border border-border-hairline shadow-primary p-6 mb-8">
        <div className="flex items-center gap-2 mb-5">
          <span className="material-symbols-rounded text-[20px] text-ink-700">history</span>
          <h3 className="text-title-m font-display font-bold text-ink-900">Your attempt history</h3>
        </div>
        <PracticeHistoryWidget post={post} />
      </div>

      {/* ── PDF download ── */}
      {post.quizFields.pdf?.node?.mediaItemUrl && (
        <div className="bg-surface-card rounded-2xl border-2 border-brand p-6 mb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-rounded text-brand-hover text-[28px]">picture_as_pdf</span>
            <h3 className="text-title-m font-display font-bold text-ink-900">Download PDF</h3>
          </div>
          <p className="text-body-s text-ink-body mb-4">
            Download a printable copy of {post.title}.
          </p>
          <a
            href={post.quizFields.pdf.node.mediaItemUrl}
            target="_blank"
            rel="noreferrer"
            className="flex justify-between items-center bg-brand-tint hover:bg-brand-surface rounded-xl p-4 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <span className="bg-brand-hover text-ink-900 text-[10px] font-bold px-2 py-1 rounded font-display">PDF</span>
              <span className="text-body-s font-semibold text-ink-900">{post.title}</span>
            </div>
            <span className="material-symbols-rounded text-ink-muted group-hover:text-brand-hover transition-colors">download</span>
          </a>
        </div>
      )}

      {/* ── Green CTA card ── */}
      <div className="bg-brand rounded-2xl p-8 mb-12 flex flex-col gap-4">
        <div>
          <h2 className="text-heading-2 font-display font-bold text-ink-900 mb-1">Ready to test yourself?</h2>
          <p className="text-body-m text-ink-700">
            {timeMinutes > 0
              ? `Give yourself ${timeMinutes} uninterrupted minutes. You've got this.`
              : "Give yourself the full time. You've got this."}
          </p>
        </div>
        <button
          onClick={handleStartExam}
          className="self-start inline-flex items-center gap-2 bg-ink-900 hover:bg-ink-700 text-surface-card font-display font-semibold text-body-m px-6 py-3 rounded-full transition-colors"
        >
          Start test now
        </button>
      </div>

      {/* ── Related tests grid ── */}
      {relatedQuizzes.length > 0 && (
        <div className="mb-8">
          <h2 className="text-heading-2 font-display font-bold text-ink-900 mb-6">{relatedLabel}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {relatedQuizzes.slice(0, 3).map((quiz, i) => (
              <TestCardWithScore
                key={quiz.id ?? i}
                quizId={(quiz as any).id ?? quiz.slug}
                title={quiz.title}
                image={quiz.featuredImage || undefined}
                skill={skill}
                part={normalizeSectionBadge(skill, i + 1).label}
                attempts={post.quizFields.testsTaken}
                isPro={post.quizFields.proUserOnly}
                href={ROUTES.EXAM.SINGLE(quiz.slug)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ExamModeModal — opened on "Start test" / autoStart */}
      <ExamModeModal
        navigateLink={ROUTES.TAKE_THE_TEST(post.slug) + (router.query.preview === "true" ? "?preview=true" : "")}
        quiz={post as any}
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}

PageIELTSExamSingle.Layout = AppShell;
