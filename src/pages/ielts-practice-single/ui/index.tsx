import { useAuth } from "@/appx/providers";
import { ROUTES } from "@/shared/routes";
import { useProContentModal } from "@/shared/ui/pro-content";
import { SEOHeader } from "@/widgets";
import { AppShell } from "@/widgets/layouts";
import { TestCardWithScore } from "@/entities/practice-test";
import { decode } from "html-entities";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { IPracticeSingle } from "../api";
import { PracticeHistoryWidget } from "./practice-history";
import { normalizeSectionBadge } from "@/shared/lib/quiz-part";
import { useState } from "react";
import {
  resolveContentImage,
  useContentImageFallback,
} from "@/shared/lib/content-image";

export function PageIELTSPracticeSingle({ post, isPreview: isPreviewProp }: { post: IPracticeSingle; isPreview?: boolean }) {
  const { currentUser } = useAuth();
  const openProContentModal = useProContentModal((state) => state.open);
  const { query } = useRouter();
  const fallbackImage = useContentImageFallback();
  const isPreview = isPreviewProp || query.preview === "true";
  const previewSuffix = isPreview ? "?preview=true" : "";

  const actionHref = (currentUser || isPreview)
    ? ROUTES.TAKE_THE_TEST(post.slug) + previewSuffix
    : ROUTES.LOGIN(ROUTES.TAKE_THE_TEST(post.slug) + previewSuffix);

  const requiresUpgrade =
    !isPreview && post.quizFields.proUserOnly && !currentUser?.userData?.isPro;

  const handleStartPractice = (e: React.MouseEvent) => {
    if (requiresUpgrade) {
      e.preventDefault();
      if (!currentUser) {
        window.location.href = ROUTES.LOGIN(ROUTES.PRACTICE.SINGLE(post.slug));
        return;
      }
      openProContentModal();
    }
  };

  const [copied, setCopied] = useState(false);
  const handleCopyLink = () => {
    const url = window.location.href;
    const onSuccess = () => { setCopied(true); setTimeout(() => setCopied(false), 2000); };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).then(onSuccess).catch(() => fallbackCopy(url, onSuccess));
    } else {
      fallbackCopy(url, onSuccess);
    }
  };
  const fallbackCopy = (url: string, onSuccess: () => void) => {
    const ta = document.createElement("textarea");
    ta.value = url;
    ta.style.cssText = "position:fixed;opacity:0";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    onSuccess();
  };
  const handleShare = () =>
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`,
      "_blank",
    );

  const skill = post.quizFields.skill[0];
  const examType = post.quizFields.type[0];
  const capitalizedSkill = skill === "listening" ? "LISTENING" : "READING";
  const capitalizedType =
    examType === "academic" ? "ACADEMIC"
    : examType === "general" ? "GENERAL"
    : "PRACTICE";

  const passageCount = post.quizFields.passages?.length ?? 0;
  const questionCount = post.quizFields.passages?.reduce(
    (acc, p) => acc + (p.questions?.length ?? 0), 0
  ) ?? 0;
  const timeMinutes = post.quizFields.time;
  const isReading = skill === "reading";

  const whatToExpectText = isReading
    ? "This reading practice targets a single passage from an official-style IELTS Academic paper — same question types, same difficulty, instant band score the moment you finish."
    : "This listening practice covers one section from an official-style IELTS paper — same audio quality, same question types, auto-marked the moment you submit.";

  const beforeYouBeginText =
    "Find a quiet space and treat this like the real exam. You can flag questions and come back to them, and review all your answers before submitting.";

  const formatItems: string[] = isReading
    ? [
        ...(post.quizFields.passages ?? []).map(
          (p, i) => `Passage ${i + 1}${p.title ? ` — ${p.title}` : ""}`
        ),
        timeMinutes ? `${timeMinutes} minutes total · no extra transfer time` : "60 minutes total",
        "Auto-marked the moment you submit",
      ]
    : [
        ...(post.quizFields.passages ?? []).map(
          (p, i) => `Section ${i + 1}${p.title ? ` — ${p.title}` : ""}`
        ),
        timeMinutes ? `${timeMinutes} minutes total` : "30 minutes + 10 minutes transfer",
        "Auto-marked the moment you submit",
      ];

  const relatedQuizzes = post.relatedPracticeQuizzes ?? [];
  const relatedLabel = isReading ? "Other reading tests" : "Other listening tests";

  return (
    <>
      <SEOHeader
        fullHead={post.seo?.fullHead}
        title={post.seo?.title}
        description={post.excerpt}
        image={post.featuredImage?.node.sourceUrl}
      />

      {/* Back link */}
      <div className="mb-6">
        <Link
          href={ROUTES.EXAM.ARCHIVE}
          className="inline-flex items-center gap-1.5 text-body-s font-semibold text-brand-hover hover:underline no-underline"
        >
          <span className="material-symbols-rounded text-[16px] leading-none">arrow_back</span>
          Back to mock tests
        </Link>
      </div>

      {/* Skill · Type chip */}
      <div className="mb-4">
        <span className="inline-flex items-center px-3 py-1 rounded-full bg-brand-tint text-brand-hover text-eyebrow font-display tracking-[0.08em]">
          {capitalizedSkill} · {capitalizedType}
        </span>
      </div>

      {/* Title + subtitle */}
      <h1 className="text-heading-1 font-display font-bold text-ink-900 leading-tight mb-3">
        {decode(post.title)}
      </h1>
      {post.excerpt && (
        <div
          className="text-body-m text-ink-muted mb-6 max-w-2xl"
          dangerouslySetInnerHTML={{ __html: post.excerpt }}
        />
      )}

      {/* Stats bar */}
      <div className="bg-surface-card rounded-2xl border border-border-hairline shadow-primary px-6 py-5 flex flex-wrap items-center gap-6 mb-8">
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
        </div>
        <a
          href={requiresUpgrade ? undefined : actionHref}
          onClick={requiresUpgrade ? handleStartPractice : undefined}
          className="shrink-0 inline-flex items-center gap-2 bg-brand hover:bg-brand-hover active:bg-brand-hover text-ink-900 font-display font-semibold text-body-m px-6 py-3 rounded-full transition-colors cursor-pointer no-underline"
        >
          Start test
        </a>
      </div>

      {/* Media / preview area */}
      <div className="relative rounded-2xl overflow-hidden mb-8 aspect-[21/9] flex items-center justify-center"
           style={{ background: isReading ? 'linear-gradient(135deg, #5281F9 0%, #B3E653 100%)' : 'linear-gradient(135deg, #5281F9 0%, #7CA1FF 100%)' }}>
        {post.featuredImage?.node.sourceUrl ? (
          <Image
            src={resolveContentImage(post.featuredImage.node.sourceUrl, fallbackImage)}
            alt={post.featuredImage.node.altText || post.title}
            fill
            className="object-cover"
            unoptimized
          />
        ) : null}
        <a
          href={requiresUpgrade ? undefined : actionHref}
          onClick={requiresUpgrade ? handleStartPractice : undefined}
          aria-label="Start practice test"
          className="relative z-10 w-20 h-20 rounded-full bg-surface-card/90 hover:bg-surface-card flex items-center justify-center shadow-primary transition-colors no-underline cursor-pointer"
        >
          <span className="material-symbols-rounded text-[36px] text-ink-900 ml-1">play_arrow</span>
        </a>
      </div>

      {/* Body prose */}
      <div className="space-y-8 mb-10">
        <div>
          <h2 className="text-heading-2 font-display font-bold text-ink-900 mb-3">What to expect</h2>
          <p className="text-body-m text-ink-body leading-relaxed">{whatToExpectText}</p>
        </div>
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
        <div>
          <h2 className="text-heading-2 font-display font-bold text-ink-900 mb-3">Before you begin</h2>
          <p className="text-body-m text-ink-body leading-relaxed">{beforeYouBeginText}</p>
        </div>
      </div>

      {/* Practice history */}
      <div className="bg-surface-card rounded-2xl border border-border-hairline shadow-primary p-6 mb-8">
        <div className="flex items-center gap-2 mb-5">
          <span className="material-symbols-rounded text-[20px] text-ink-700">history</span>
          <h3 className="text-title-m font-display font-bold text-ink-900">Your attempt history</h3>
        </div>
        <PracticeHistoryWidget post={post} />
      </div>

      {/* PDF download */}
      {post.quizFields.pdf?.node?.mediaItemUrl && (
        <div className="bg-surface-card rounded-2xl border-2 border-brand p-6 mb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-rounded text-brand-hover text-[28px]">picture_as_pdf</span>
            <h3 className="text-title-m font-display font-bold text-ink-900">Download PDF</h3>
          </div>
          <p className="text-body-s text-ink-body mb-4">Download a printable copy of {post.title}.</p>
          <a
            href={post.quizFields.pdf.node.mediaItemUrl}
            target="_blank"
            rel="noreferrer"
            className="flex justify-between items-center bg-brand-tint hover:bg-brand-surface rounded-xl p-4 transition-colors group no-underline"
          >
            <div className="flex items-center gap-3">
              <span className="bg-brand-hover text-ink-900 text-[10px] font-bold px-2 py-1 rounded font-display">PDF</span>
              <span className="text-body-s font-semibold text-ink-900">{post.title}</span>
            </div>
            <span className="material-symbols-rounded text-ink-muted group-hover:text-brand-hover transition-colors">download</span>
          </a>
        </div>
      )}

      {/* Green CTA */}
      <div className="bg-brand rounded-2xl p-8 mb-12 flex flex-col gap-4">
        <div>
          <h2 className="text-heading-2 font-display font-bold text-ink-900 mb-1">Ready to test yourself?</h2>
          <p className="text-body-m text-ink-700">
            {timeMinutes > 0
              ? `Give yourself ${timeMinutes} uninterrupted minutes. You've got this.`
              : "Give yourself the full time. You've got this."}
          </p>
        </div>
        <a
          href={requiresUpgrade ? undefined : actionHref}
          onClick={requiresUpgrade ? handleStartPractice : undefined}
          className="self-start inline-flex items-center gap-2 bg-ink-900 hover:bg-ink-700 text-surface-card font-display font-semibold text-body-m px-6 py-3 rounded-full transition-colors cursor-pointer no-underline"
        >
          Start test now
        </a>
      </div>

      {/* Related practice tests */}
      {relatedQuizzes.length > 0 && (
        <div className="mb-8">
          <h2 className="text-heading-2 font-display font-bold text-ink-900 mb-6">{relatedLabel}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {relatedQuizzes.slice(0, 3).map((quiz, i) => (
              <TestCardWithScore
                key={quiz.id ?? i}
                quizId={quiz.id ?? String(i)}
                title={quiz.title}
                image={quiz.featuredImage || undefined}
                skill={skill}
                part={normalizeSectionBadge(skill, i + 1).label}
                attempts={post.quizFields.testsTaken}
                isPro={post.quizFields.proUserOnly}
                href={ROUTES.PRACTICE.SINGLE(quiz.slug)}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
}

PageIELTSPracticeSingle.Layout = AppShell;
