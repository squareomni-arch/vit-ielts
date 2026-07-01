import Image from "next/image";
import { ROUTES } from "@/shared/routes";
import { getQuizThumbnail } from "@/shared/lib/content-image";
import { useCallback, useState } from "react";
import { IExamCollection } from "../../api";
import ExamModeModal from "../exam-mode-modal";
import { useAuth } from "@/appx/providers";
import { useProContentModal } from "@/shared/ui/pro-content";
import { ProBadge } from "@/shared/ui/pro-badge";
import { useBatchResults } from "../batch-results-context";
import { formatBandScore } from "@/shared/lib/test-result-display";
import { TestHistoryModal } from "@/entities/practice-test/ui/test-history-modal";

interface TestResultRow {
  id: string;
  status: string;
  score: number | null;
  answers: { answers: unknown[]; totalCorrect?: number; totalQuestions?: number } | null;
}

export const ExamItem = ({
  item,
}: {
  item: IExamCollection["data"][
    | "listening"
    | "reading"][number]["exams"][number];
}) => {
  const { currentUser } = useAuth();
  const openProContentModal = useProContentModal((state) => state.open);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const quizFields = item.quizFields;

  // Use batch context instead of per-item Supabase query
  const publishedResults = useBatchResults(item.id);

  const latestResult = publishedResults[0] ?? null;
  const latestResultId = latestResult?.id;
  const latestScoreRaw = latestResult?.score;
  const isDone = latestResultId != null;

  // Determine display format based on scoreType
  const scoreType = quizFields.scoreType ?? null;
  const isBandScore = !scoreType || scoreType === "band";

  // Parse breakdown from answers JSONB (stored since submit flow update)
  const totalCorrect = latestResult?.answers?.totalCorrect ?? null;
  const totalQuestions = latestResult?.answers?.totalQuestions ?? null;

  const formattedScore = (() => {
    if (latestScoreRaw == null) return undefined;
    if (isBandScore) {
      // Band score: dùng formatBandScore để "7" không thành "7.0"
      return formatBandScore(latestScoreRaw) ?? `${latestScoreRaw}`;
    }
    // Practice test: "32/40" nếu có breakdown
    if (totalCorrect != null && totalQuestions != null) {
      return `${totalCorrect}/${totalQuestions}`;
    }
    // Fallback cho kết quả cũ không có breakdown
    return formatBandScore(latestScoreRaw) ?? `${latestScoreRaw}`;
  })();

  const isProtected = quizFields.proUserOnly && !currentUser?.userData?.isPro;

  // Handle card click: open mode modal if allowed
  const handleCardClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();

      // Not logged in → redirect to exam detail page (with autoStart to open modal after login)
      if (!currentUser) {
        const loginTarget = ROUTES.EXAM.SINGLE(item.slug) + "?autoStart=true";
        window.location.href = ROUTES.LOGIN(loginTarget);
        return;
      }

      // Protected but not pro → open upgrade modal
      if (isProtected) {
        openProContentModal();
        return;
      }

      // Open exam mode modal (choose parts / mode → start test)
      setIsModalOpen(true);
    },
    [currentUser, isProtected, item.slug, openProContentModal]
  );

  return (
    <>
      {/* Card */}
      <a
        href="#"
        onClick={handleCardClick}
        onMouseEnter={() => {
          // Prefetch summary data (question counts) when hovering to make the modal feel instant
          fetch(`/api/test-flow/summary?quizId=${item.id}`).catch(() => {});
        }}
        className="group flex flex-col bg-white rounded-[30px] shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-transform duration-350 ease-[var(--ease-slide)] hover:-translate-y-3.5 cursor-pointer w-full h-full"
      >
        {/* Image */}
        <div className="relative h-[220px] shrink-0 overflow-hidden bg-secondary-50 rounded-t-[30px] rounded-b-[15px]">
          <Image
            src={getQuizThumbnail(item.id)}
            alt={item.title}
            fill
            className="object-cover"
            unoptimized
          />

          {/* PRO / Free Tier Badge */}
          <div className="absolute top-4 right-4 z-10">
            {quizFields.proUserOnly ? (
              <ProBadge className="shadow-sm" />
            ) : (
              <span className="inline-flex shrink-0 select-none items-center justify-center rounded-[5px] h-[22px] w-[42px] text-[10px] leading-none font-noto-sans font-bold uppercase tracking-widest bg-red-600 text-white shadow-sm">
                Free
              </span>
            )}
          </div>

          {/* "Đã làm" badge */}
          {isDone && !isProtected && (
            <div className="absolute top-4 left-4 z-10">
              <span className="rounded-[8px] bg-emerald-500 px-3 py-[6px] text-[12px] font-bold uppercase tracking-wide text-white shadow-sm flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Done
              </span>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
          <div className="space-y-2 mb-4">
            <h3
              className="text-[17px] font-bold text-ink-900 leading-snug truncate group-hover:text-brand transition-colors"
              title={item.title}
            >
              {item.title}
            </h3>
            <p className="font-noto-sans text-[14px] text-ink-muted">
              {(quizFields.testsTaken ?? 0).toLocaleString()} attempts
              {quizFields.time != null && quizFields.time > 0 && (
                <> · {quizFields.time} min</>
              )}
            </p>
          </div>

          <div className="mt-auto flex items-center justify-between gap-3">
            {/* CTA button — dark filled pill per Figma */}
            <div className="flex h-[49px] flex-1 max-w-[170px] items-center gap-[10px] px-4 rounded-[40px] bg-ink-700 hover:bg-ink-900 transition-colors duration-200 cursor-pointer">
              {/* Icon container: white circle with icon inside */}
              <div className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-full bg-white">
                {isProtected ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M18 8H6C4.89543 8 4 8.89543 4 10V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V10C20 8.89543 19.1046 8 18 8Z" stroke="#242938" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M7 8V6C7 4.67392 7.52678 3.40215 8.46447 2.46447C9.40215 1.52678 10.6739 1 12 1C13.3261 1 14.5979 1.52678 15.5355 2.46447C16.4732 3.40215 17 4.67392 17 6V8" stroke="#242938" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M8 5L19 12L8 19V5Z" fill="#242938" />
                  </svg>
                )}
              </div>
              <span className="font-noto-sans text-[15px] font-bold text-white truncate">
                {isDone ? "Retake" : "Start"}
              </span>
            </div>

            {/* Circular Score — click mở History Modal; green ring + green number per Figma */}
            {isDone && latestResultId && !isProtected && formattedScore !== undefined && (
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsHistoryOpen(true); }}
                className="flex h-[60px] w-[60px] flex-col items-center justify-center rounded-full border-2 border-brand bg-white flex-shrink-0 cursor-pointer hover:bg-brand/10 transition-colors"
                title="View attempt history"
              >
                <span
                  className={`text-brand font-noto-sans font-bold leading-none ${
                    !isBandScore && totalQuestions != null
                      ? "text-[13px]"
                      : "text-[18px]"
                  }`}
                >
                  {formattedScore}
                </span>
              </button>
            )}
          </div>
        </div>
      </a>

      {/* ExamModeModal — mở khi click card */}
      <ExamModeModal
        navigateLink={ROUTES.TAKE_THE_TEST(item.slug)}
        quiz={item}
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      {/* History Modal — mở khi click điểm */}
      <TestHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        quizId={item.id}
        title={item.title}
      />
    </>
  );
};
