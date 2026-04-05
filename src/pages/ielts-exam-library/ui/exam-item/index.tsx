import Image from "next/image";
import { ROUTES } from "@/shared/routes";
import { useCallback, useEffect, useMemo, useState } from "react";
import { IExamCollection } from "../../api";
import ExamModeModal from "../exam-mode-modal";
import { useAuth } from "@/appx/providers";
import { useProContentModal } from "@/shared/ui/pro-content";
import { createClient } from "~supabase/client";
import Link from "next/link";

interface TestResultRow {
  id: string;
  status: string;
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
  const [publishedResults, setPublishedResults] = useState<TestResultRow[]>([]);

  const quizFields = item.quizFields;

  // Fetch user's published results for this quiz
  useEffect(() => {
    if (!currentUser?.id) return;

    const fetchTestResults = async () => {
      try {
        const supabase = createClient();
        const { data: results } = await supabase
          .from("test_results")
          .select("id, status")
          .eq("quiz_id", item.id)
          .eq("user_id", currentUser.id)
          .eq("status", "published")
          .order("created_at", { ascending: false })
          .limit(5);

        setPublishedResults(results || []);
      } catch (error) {
        console.error("Error fetching test results:", error);
      }
    };

    fetchTestResults();
  }, [item.id, currentUser?.id]);

  const latestResultId = publishedResults[0]?.id ?? null;
  const isDone = latestResultId !== null;

  const isProtected = quizFields.proUserOnly && !currentUser?.userData.isPro;

  // Handle card click: open mode modal if allowed
  const handleCardClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();

      // Not logged in → redirect to login
      if (!currentUser) {
        const loginTarget = ROUTES.TAKE_THE_TEST(item.slug);
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
        className="group flex flex-col bg-white rounded-[30px] shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-transform duration-350 ease-[var(--ease-slide)] hover:-translate-y-3.5 cursor-pointer w-full"
      >
        {/* Image */}
        <div className="relative h-[220px] shrink-0 overflow-hidden bg-secondary-50 rounded-t-[30px] rounded-b-[15px]">
          {item.featuredImage ? (
            <Image
              src={item.featuredImage}
              alt={item.title}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_var(--color-secondary-200),_white_55%,_var(--color-primary-50))]" />
          )}

          {/* PRO Badge */}
          {quizFields.proUserOnly && (
            <div className="absolute top-4 right-4 z-10">
              <span className="rounded-[8px] bg-primary-500 px-3 py-[6px] text-[13px] font-bold uppercase tracking-wide text-white shadow-sm">
                PRO
              </span>
            </div>
          )}

          {/* "Đã làm" badge */}
          {isDone && !isProtected && (
            <div className="absolute top-4 left-4 z-10">
              <span className="rounded-[8px] bg-emerald-500 px-3 py-[6px] text-[12px] font-bold uppercase tracking-wide text-white shadow-sm flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Đã làm
              </span>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
          <div className="space-y-2 mb-4">
            <h3
              className="text-[17px] font-bold text-[#202020] leading-snug truncate group-hover:text-primary-500 transition-colors"
              title={item.title}
            >
              {item.title}
            </h3>
            <p className="font-noto-sans text-[14px] text-[#6A7282]">
              {quizFields.testsTaken?.toLocaleString() ?? 0} attempts
            </p>
          </div>

          <div className="mt-auto flex items-center justify-between gap-3">
            {/* CTA button */}
            <div className="relative flex h-[49px] flex-1 max-w-[190px] items-center gap-[10px] px-4 rounded-[25px] border border-[rgba(128,128,128,0.55)] bg-white overflow-hidden transition-[border-color] duration-300 hover:border-[var(--color-primary-450)] group/btn">
              <div className="absolute inset-0 translate-x-[-100%] group-hover/btn:translate-x-0 transition-transform duration-300 ease-out bg-[var(--color-primary-450)] rounded-[25px]" />
              <div className="relative z-10 flex-shrink-0 text-[var(--color-primary-500)] group-hover/btn:text-white transition-colors duration-300">
                {isProtected ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M18 8H6C4.89543 8 4 8.89543 4 10V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V10C20 8.89543 19.1046 8 18 8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M7 8V6C7 4.67392 7.52678 3.40215 8.46447 2.46447C9.40215 1.52678 10.6739 1 12 1C13.3261 1 14.5979 1.52678 15.5355 2.46447C16.4732 3.40215 17 4.67392 17 6V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                    <path d="M10 8L16 12L10 16V8Z" fill="currentColor" />
                  </svg>
                )}
              </div>
              <span className="relative z-10 font-noto-sans text-[15px] font-bold text-[#242938] group-hover/btn:text-white transition-colors duration-300 truncate">
                {isDone ? "Làm lại" : "Làm Bài Thi"}
              </span>
            </div>

            {/* "Xem kết quả cũ" link — chỉ hiện khi đã làm */}
            {isDone && latestResultId && !isProtected && (
              <Link
                href={ROUTES.TEST_RESULT(latestResultId)}
                onClick={(e) => e.stopPropagation()}
                className="shrink-0 flex items-center gap-1 text-[13px] font-semibold text-[#6A7282] hover:text-primary-500 transition-colors underline-offset-2 hover:underline"
                title="Xem kết quả lần thi trước"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" stroke="currentColor" strokeWidth="2" />
                </svg>
                Kết quả cũ
              </Link>
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
    </>
  );
};
