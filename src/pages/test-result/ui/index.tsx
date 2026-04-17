import { Container } from "@/shared/ui";
import { HeroBanner } from "@/shared/ui/ds";
import { Button } from "antd";
import Image from "next/image";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import { useMemo, useState } from "react";
import { useRouter } from "next/router";

import { SEOHeader } from "@/widgets";
import { BandScore } from "@/widgets/blocks/band-score";
import { useAuth } from "@/appx/providers";
import ExamModeModal from "@/pages/ielts-exam-library/ui/exam-mode-modal";
import { ROUTES } from "@/shared/routes";
import { useProContentModal } from "@/shared/ui/pro-content";
import { calculateScore } from "@/shared/lib";
import {
  resolveContentImage,
  useContentImageFallback,
} from "@/shared/lib/content-image";

import type { IPracticeSingle, ITestResult, IUser } from "../api";
import AnswerKeys from "./answer-keys";

dayjs.extend(duration);

type PageTestResultProps = {
  post: IPracticeSingle;
  testResult: ITestResult;
  user: IUser;
  scoreData: ReturnType<typeof calculateScore>;
};

export function PageTestResult({
  post,
  testResult,
  user,
  scoreData,
}: PageTestResultProps) {
  const router = useRouter();
  const fallbackImage = useContentImageFallback();
  const { currentUser } = useAuth();
  const openProContentModal = useProContentModal((state) => state.open);

  const [bandScore, setBandScore] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const numericScore = useMemo(() => {
    const parsedScore = Number(scoreData.score);
    return Number.isFinite(parsedScore) ? parsedScore : 0;
  }, [scoreData.score]);

  const timeSpent = useMemo(() => {
    const total = dayjs.duration({
      minutes: testResult.testResultFields.testTime,
    });

    const [minutes, seconds] = testResult.testResultFields.timeLeft
      .split(":")
      .map(Number);

    const remainingDuration = dayjs.duration({ minutes, seconds });
    const spentSecondsTotal = Math.max(
      0,
      total.asSeconds() - remainingDuration.asSeconds(),
    );
    const spentDuration = dayjs.duration(spentSecondsTotal, "seconds");

    const percent =
      total.asSeconds() > 0
        ? Math.round((spentSecondsTotal / total.asSeconds()) * 100)
        : 0;

    const formattedTime = `${Math.floor(spentDuration.asMinutes())}:${String(
      spentDuration.seconds(),
    ).padStart(2, "0")}`;

    const totalTime = `${Number(total.minutes()) + total.hours() * 60}:${String(
      total.seconds(),
    ).padStart(2, "0")}`;

    return {
      totalTime,
      spent: formattedTime,
      percent,
    };
  }, [
    testResult.testResultFields.testTime,
    testResult.testResultFields.timeLeft,
  ]);

  const scorePercent = useMemo(() => {
    const scoreToUse = bandScore !== null ? bandScore : numericScore;
    return Math.round((scoreToUse / 9) * 100);
  }, [bandScore, numericScore]);

  const skill = useMemo(() => post.quizFields.skill[0], [post.quizFields.skill]);
  const correctAnswers = Number(scoreData?.correctAns ?? 0);

  const getEncouragementMessage = () => {
    if (scoreData.correctAns === 0) {
      return "Oops! bạn chưa làm đúng câu nào, cố gắng lần sau nha.";
    }

    return "Chúc mừng! Bạn đã hoàn thành bài test, cùng kiểm tra kết quả nhé!";
  };

  const isMockTest =
    post.quizFields.type?.[0] === "exam" ||
    post.quizFields.type?.[0] === "academic" ||
    post.quizFields.type?.[0] === "general";

  const displayScoreStr = isMockTest
    ? bandScore !== null
      ? bandScore.toFixed(1)
      : numericScore.toFixed(1)
    : `${scoreData.correctAns}/${scoreData.total_questions}`;

  const scoreLabel = isMockTest ? "Band Score" : "Câu đúng";

  // Keep these hooks referenced; behavior stays unchanged from the existing page.
  void user;
  void currentUser;
  void openProContentModal;
  void scorePercent;

  return (
    <>
      <SEOHeader fullHead="" title="Test Result | IELTS Exam Library" />

      <HeroBanner
        title="Results"
        breadcrumbs={[
          { label: "Trang chủ", href: ROUTES.HOME },
          { label: post.title, href: ROUTES.TAKE_THE_TEST(post.slug) },
          { label: "Test Result" },
        ]}
      />

      <div className="bg-[#f8f9fb] min-h-screen mb-[50px]">
        <Container className="space-y-6 md:space-y-8 pb-12 pt-8 max-w-[1360px]">
          <div className="flex flex-col md:flex-row w-full rounded-[24px] overflow-hidden shadow-sm h-auto md:h-[261px]">
            <div className="w-full md:w-1/2 h-[200px] md:h-full relative shrink-0">
              <Image
                src={resolveContentImage(
                  post.featuredImage?.node.sourceUrl,
                  fallbackImage,
                )}
                alt={post.featuredImage?.node.altText || post.title}
                fill
                className="object-cover"
                unoptimized
              />
            </div>

            <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col justify-center text-white bg-primary-500 space-y-4 md:space-y-6 shrink-0 h-auto md:h-full">
              <h1 className="text-2xl md:text-[32px] font-bold leading-tight">
                {post.title}
              </h1>
              <div className="flex flex-col space-y-2 text-white/90 font-medium">
                <p className="flex items-center space-x-3">
                  <span className="material-symbols-rounded text-[20px]">
                    calendar_today
                  </span>
                  <span>Published on: {dayjs(post.date).format("DD/MM/YYYY")}</span>
                </p>
                <p className="flex items-center space-x-3">
                  <span className="material-symbols-rounded text-[20px] filled">
                    bolt
                  </span>
                  <span>Tests taken: {post.quizFields.testsTaken || 0}</span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 bg-white rounded-[24px] shadow-sm border-b-[6px] border-primary-500 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
              <div className="flex-1 space-y-6 relative z-10">
                <h2 className="text-lg md:text-base font-bold text-[#2D3142] max-w-[450px]">
                  {getEncouragementMessage()}
                </h2>

                <div className="flex flex-wrap items-center gap-6">
                  <div className="relative w-32 h-32 flex items-center justify-center bg-white rounded-full border-[8px] border-[#4CAF50] shadow-sm">
                    <span className="text-2xl font-black text-[#4CAF50]">
                      {displayScoreStr}
                    </span>
                  </div>

                  <Button
                    size="large"
                    className="bg-primary-500! text-white! hover:bg-primary-400! border-none rounded-full px-6 font-semibold shadow-md"
                    onClick={() =>
                      router.push(ROUTES.TEST_RESULT_EXPLANATION(testResult.id))
                    }
                  >
                    Xem giải thích
                  </Button>
                </div>
              </div>

              <div className="w-40 h-40 md:w-56 md:h-[260px] relative shrink-0 z-0 hidden sm:block self-end -mb-6 md:-mb-8">
                <Image
                  src={
                    scoreData.correctAns === 0
                      ? "/assets/figma/icons/fail.png"
                      : "/assets/figma/icons/pass.png"
                  }
                  alt="IELTS Prediction Mascot Status"
                  fill
                  className="object-contain object-bottom"
                />
              </div>
            </div>

            <div className="w-full lg:w-[40%] bg-white rounded-[24px] shadow-sm border-b-[6px] border-primary-500 p-6 md:p-10 flex items-center justify-evenly">
              <div className="flex flex-col justify-center items-center space-y-4 md:space-y-6">
                <div className="w-20 h-20 md:w-[110px] md:h-[110px] rounded-full bg-[#1B8C40] flex items-center justify-center text-white shadow-sm shrink-0">
                  <Image
                    src="/assets/figma/icons/check.svg"
                    alt="Correct"
                    width={50}
                    height={50}
                    className="w-[40px] h-[40px] md:w-[50px] md:h-[50px] brightness-0 invert"
                  />
                </div>
                <div className="text-center space-y-1 md:space-y-2">
                  <p className="font-bold text-[#1B8C40] text-lg md:text-[22px]">
                    Đúng
                  </p>
                  <p className="font-black text-[#2D3142] text-xl md:text-[28px]">
                    {scoreData.correctAns}
                  </p>
                </div>
              </div>

              <div className="flex flex-col justify-center items-center space-y-4 md:space-y-6">
                <div className="w-20 h-20 md:w-[110px] md:h-[110px] rounded-full bg-primary-500 flex items-center justify-center text-white shadow-sm shrink-0">
                  <Image
                    src="/assets/figma/icons/Cross.svg"
                    alt="Wrong"
                    width={50}
                    height={50}
                    className="w-[40px] h-[40px] md:w-[50px] md:h-[50px]"
                  />
                </div>
                <div className="text-center space-y-1 md:space-y-2">
                  <p className="font-bold text-primary-500 text-lg md:text-[22px]">
                    Sai
                  </p>
                  <p className="font-black text-[#2D3142] text-xl md:text-[28px]">
                    {scoreData.incorrect}
                  </p>
                </div>
              </div>

              <div className="flex flex-col justify-center items-center space-y-4 md:space-y-6">
                <div className="w-20 h-20 md:w-[110px] md:h-[110px] rounded-full bg-[#F2994A] flex items-center justify-center text-white shadow-sm shrink-0">
                  <Image
                    src="/assets/figma/icons/skip.svg"
                    alt="Skipped"
                    width={50}
                    height={50}
                    className="w-[40px] h-[40px] md:w-[50px] md:h-[50px] ml-1 md:ml-1.5"
                  />
                </div>
                <div className="text-center space-y-1 md:space-y-2">
                  <p className="font-bold text-[#F2994A] text-lg md:text-[22px]">
                    Bỏ qua
                  </p>
                  <p className="font-black text-[#2D3142] text-xl md:text-[28px]">
                    {scoreData.missed}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-[24px] p-8 shadow-sm flex flex-col space-y-4">
              <h3 className="text-2xl font-black text-[#2D3142] pb-4 border-b border-gray-200">
                Kỹ năng
              </h3>
              <div className="flex items-center space-x-6 pt-2">
                <div className="w-[120px] h-[120px] rounded-full bg-[#EAEEF6] flex items-center justify-center shrink-0">
                  <Image
                    src={
                      skill === "listening"
                        ? "/assets/figma/icons/listen 1.svg"
                        : "/assets/figma/icons/reading-book 1.svg"
                    }
                    alt={skill}
                    width={60}
                    height={60}
                    className="w-[60px] h-[60px]"
                  />
                </div>
                <div>
                  <p className="text-xl font-extrabold text-[#2D3142] capitalize">
                    {skill === "listening"
                      ? "Nghe"
                      : skill === "reading"
                        ? "Đọc"
                        : skill}
                  </p>
                  <p className="text-gray-500 font-medium">{displayScoreStr}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[24px] p-8 shadow-sm flex flex-col space-y-4">
              <h3 className="text-2xl font-black text-[#2D3142] pb-4 border-b border-gray-200">
                Kết quả
              </h3>
              <div className="flex items-center space-x-6 pt-2">
                <div className="w-[120px] h-[120px] rounded-full bg-[#EAEEF6] flex items-center justify-center shrink-0">
                  <Image
                    src="/assets/figma/icons/check.svg"
                    alt="Kết quả"
                    width={60}
                    height={60}
                    className="w-[60px] h-[60px]"
                  />
                </div>
                <div>
                  <p className="text-xl font-extrabold text-[#2D3142]">
                    {scoreLabel}
                  </p>
                  <p className="text-gray-500 font-medium">{displayScoreStr}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[24px] p-8 shadow-sm flex flex-col space-y-4">
              <h3 className="text-2xl font-black text-[#2D3142] pb-4 border-b border-gray-200">
                Thời gian
              </h3>
              <div className="flex items-center space-x-6 pt-2">
                <div className="w-[120px] h-[120px] rounded-full bg-[#EAEEF6] flex items-center justify-center shrink-0">
                  <Image
                    src="/assets/figma/icons/count.svg"
                    alt="Thời gian"
                    width={60}
                    height={60}
                    className="w-[60px] h-[60px]"
                  />
                </div>
                <div>
                  <p className="text-xl font-extrabold text-[#2D3142]">
                    {timeSpent.spent}
                  </p>
                  <p className="text-gray-500 font-medium">
                    ({timeSpent.totalTime})
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="hidden">
            <BandScore
              correctAnswersCount={correctAnswers}
              onScoreCalculated={setBandScore}
            />
          </div>

          <div className="bg-white p-6 md:p-10 rounded-[24px] shadow-sm">
            <AnswerKeys data={scoreData} skill={skill as "listening" | "reading"} />
          </div>
        </Container>
      </div>

      <ExamModeModal
        navigateLink={ROUTES.TAKE_THE_TEST(post.slug)}
        quiz={post as any}
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
