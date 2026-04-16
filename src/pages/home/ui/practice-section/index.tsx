
import { useCallback, useRef, useState } from "react";
import { Container } from "@/shared/ui";
import { TestCardWithScore } from "@/entities/practice-test";
import { Splide, SplideSlide, SplideTrack } from "@splidejs/react-splide";
import "@splidejs/react-splide/css/core";
import type { Splide as SplideType } from "@splidejs/splide";
import Link from "next/link";
import type { Quiz } from "~services/types/database";
import { ROUTES } from "@/shared/routes";
import { normalizeSectionBadge } from "@/shared/lib/quiz-part";
import { ScrollFadeIn } from "@/shared/lib/use-scroll-fade-in";
import ExamModeModal from "@/pages/ielts-exam-library/ui/exam-mode-modal";
import { useAuth } from "@/appx/providers";
import { useProContentModal } from "@/shared/ui/pro-content";
import { createClient } from "~supabase/client";
import { getQuizSummary } from "~services/exam-collection";
import { toast } from "react-toastify";

export type PracticeSectionProps = {
  title?: string;
  viewMoreLink?: string;
  items?: Quiz[];
  getItemHref?: (item: any) => string;
  actionText?: string;
  hideAttempts?: boolean;
  useExamModal?: boolean;
};

export const PracticeSection = ({
  title = "IELTS Online Test",
  viewMoreLink = "#",
  items = [],
  getItemHref,
  actionText,
  hideAttempts = false,
  useExamModal = false,
}: PracticeSectionProps) => {
  const { currentUser } = useAuth();
  const openProContentModal = useProContentModal((state) => state.open);
  const splideRef = useRef<{ splide: SplideType } | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<any>(null);
  const [loadingQuiz, setLoadingQuiz] = useState(false);

  const handlePrev = () => splideRef.current?.splide?.go("<");
  const handleNext = () => splideRef.current?.splide?.go(">");

  const handleCardClick = useCallback(
    async (quiz: Quiz) => {
      // Only use modal if explicitly enabled
      if (!useExamModal) return;

      // Not logged in → redirect to exam detail page (with autoStart to open modal after login)
      if (!currentUser) {
        const loginTarget = ROUTES.EXAM.SINGLE(quiz.slug) + "?autoStart=true";
        window.location.href = ROUTES.LOGIN(loginTarget);
        return;
      }

      // Protected but not pro → open upgrade modal
      const isProtected = quiz.pro_user_only && !currentUser.userData.isPro;
      if (isProtected) {
        openProContentModal();
        return;
      }

      // Fetch full quiz summary (with passages) for the modal
      setLoadingQuiz(true);
      try {
        const response = await fetch(`/api/test-flow/summary?quizId=${quiz.id}`);
        const result = await response.json();
        
        if (response.ok && result.success && result.data) {
          setSelectedQuiz(result.data);
          setIsModalOpen(true);
        } else {
          toast.error("Không thể tải thông tin bài thi");
        }
      } catch (error) {
        console.error("Error fetching quiz summary:", error);
        toast.error("Có lỗi xảy ra khi tải thông tin bài thi");
      } finally {
        setLoadingQuiz(false);
      }
    },
    [currentUser, getItemHref, openProContentModal]
  );

  if (items.length === 0) return null;

  return (
    <ScrollFadeIn data-section="practice-carousel" className="bg-white">
      <Container>
        {/* Header */}
        <div className="flex flex-col items-start gap-2 sm:flex-row sm:justify-between sm:items-end mb-8 pl-1 pr-1">
          <h2 className="text-[28px] md:text-[32px] font-bold text-[#2D3142]">{title}</h2>
          <Link
            href={viewMoreLink}
            className="text-gray-900 font-bold text-[15px] hover:text-[#D94A56] flex items-center gap-1 transition-colors"
          >
            Xem thêm
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              className="text-current"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </Link>
        </div>

        {/* Carousel wrapper: arrows are absolute outside the track */}
        <div className="relative">
          {/* Prev arrow */}
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous"
            className="hidden sm:flex absolute left-0 -translate-x-1/2 top-[35%] -translate-y-1/2 z-10 shrink-0 items-center justify-center w-9 h-9 rounded-full bg-[#d94a56] hover:bg-[#ea8d95] shadow-lg transition-colors"
          >
            <img
              src="/assets/figma/icons/Arrow1.svg"
              alt=""
              className="w-3 h-3 [filter:brightness(0)_invert(1)]"
              style={{ transform: "rotate(180deg)" }}
            />
          </button>

          {/* Splide carousel — pt on each slide matches card lift distance (14px) */}
          <div className={loadingQuiz ? "opacity-50 pointer-events-none transition-opacity" : ""}>
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
                {items.map((quiz) => {
                  let partLabel = "Part 1";
                  if (quiz.type === 'exam') {
                    partLabel = "Trọn bộ";
                  } else {
                    const skillSource = Array.isArray(quiz.skill) ? quiz.skill[0] : quiz.skill;
                    const skillValue = typeof skillSource === 'string' ? skillSource.toLowerCase() : 'listening';
                    const rawPart = quiz.part || (quiz as any).task;
                    partLabel = normalizeSectionBadge(skillValue, rawPart).label;
                  }

                  // For exam cards, the default href should be the exam detail page, not practice single
                  const defaultHref = useExamModal ? ROUTES.EXAM.SINGLE(quiz.slug) : ROUTES.PRACTICE.SINGLE(quiz.slug);
                  const href = getItemHref ? getItemHref(quiz) : defaultHref;

                  const isProtected = quiz.pro_user_only;
                  const requiresLogin = !currentUser;
                  const requiresUpgrade = isProtected && !currentUser?.userData.isPro;
                  const isLocked = requiresUpgrade; // Only lock icon for PRO content

                  // For exam cards (useExamModal), delegate login/pro checks to handleCardClick
                  // which uses ROUTES.TAKE_THE_TEST as redirect — no detail page exists for exams.
                  // For non-exam cards, intercept here with the correct detail href.
                  const needsIntercept = !useExamModal && (requiresLogin || requiresUpgrade);

                  const handleLocalClick = (e?: any) => {
                    if (useExamModal) {
                      // Exam cards: always go through handleCardClick (has its own login/pro checks)
                      e?.preventDefault();
                      handleCardClick(quiz);
                      return;
                    }
                    if (needsIntercept) {
                      e?.preventDefault();
                      if (requiresLogin) {
                        window.location.href = ROUTES.LOGIN(href);
                        return;
                      }
                      if (requiresUpgrade) {
                        openProContentModal();
                        return;
                      }
                    } else if (!getItemHref) {
                      e?.preventDefault();
                      handleCardClick(quiz);
                    }
                  };

                  return (
                    <SplideSlide key={quiz.id} className="pb-8 pt-[14px] px-1">
                      <TestCardWithScore
                        quizId={quiz.id}
                        title={quiz.title}
                        image={quiz.featured_image ?? undefined}
                        skill={quiz.skill as any}
                        part={partLabel}
                        attempts={hideAttempts ? undefined : (quiz.tests_taken || (quiz as any).views || 0)}
                        isPro={isProtected}
                        actionText={actionText}
                        href={needsIntercept ? undefined : href}
                        onClick={(e) => handleLocalClick(e)}
                        isLocked={isLocked}
                      />
                    </SplideSlide>
                  );
                })}
              </SplideTrack>
            </Splide>
          </div>

          {/* Next arrow */}
          <button
            type="button"
            onClick={handleNext}
            aria-label="Next"
            className="hidden sm:flex absolute right-0 translate-x-1/2 top-[35%] -translate-y-1/2 z-10 shrink-0 items-center justify-center w-9 h-9 rounded-full bg-[#d94a56] hover:bg-[#ea8d95] shadow-lg transition-colors"
          >
            <img
              src="/assets/figma/icons/Arrow1.svg"
              alt=""
              className="w-3 h-3 [filter:brightness(0)_invert(1)]"
            />
          </button>
        </div>
      </Container>

      {/* ExamModeModal */}
      {selectedQuiz && (
        <ExamModeModal
          quiz={selectedQuiz}
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          navigateLink={ROUTES.TAKE_THE_TEST(selectedQuiz.slug)}
        />
      )}
    </ScrollFadeIn>
  );
};
