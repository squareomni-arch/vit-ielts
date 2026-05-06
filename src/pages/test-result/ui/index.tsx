import { Container } from "@/shared/ui";
import { HeroBanner, Button } from "@/shared/ui/ds";
import Image from "next/image";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import { useMemo, useState } from "react";
import { useRouter } from "next/router";

import { SEOHeader } from "@/widgets";
import { useAuth } from "@/appx/providers";
import ExamModeModal from "@/pages/ielts-exam-library/ui/exam-mode-modal";
import { ROUTES } from "@/shared/routes";
import { useProContentModal } from "@/shared/ui/pro-content";
import { calculateScore } from "@/shared/lib";
import {
  resolveContentImage,
  useContentImageFallback,
} from "@/shared/lib/content-image";
import {
  formatBandScore,
  formatResultLabel,
  getQuizScoreType,
} from "@/shared/lib/test-result-display";

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

  const [isModalOpen, setIsModalOpen] = useState(false);

  const numericScore = useMemo(() => {
    // Prefer live scoreData (recomputed each load) over potentially stale saved score
    // to ensure that scoring fixes are reflected without requiring resubmission.
    const liveScore = Number(scoreData.score);
    if (Number.isFinite(liveScore) && liveScore > 0) return liveScore;
    const savedScore = Number(testResult.testResultFields.score);
    if (Number.isFinite(savedScore)) return savedScore;
    return 0;
  }, [scoreData.score, testResult.testResultFields.score]);

  const timeSpent = useMemo(() => {
    const total = dayjs.duration({
      minutes: testResult.testResultFields.testTime,
    });

    // Parse the saved timeLeft. dayjs may serialize a negative countdown as
    // "-1:16" (minutes negative, seconds positive in absolute), which would
    // otherwise sum to -44s. Treat the seconds as same-sign as the minutes
    // when minutes < 0 so "-1:16" means "1m 16s past the limit".
    const tlRaw = testResult.testResultFields.timeLeft || "0:0";
    const [mPart, sPart] = tlRaw.split(":");
    const mNum = Number(mPart) || 0;
    const sNum = Math.abs(Number(sPart) || 0);
    const remainingSecs = mNum < 0 ? mNum * 60 - sNum : mNum * 60 + sNum;

    const totalSecs = total.asSeconds();
    const percent =
      totalSecs > 0
        ? Math.round(
            (Math.max(0, totalSecs - remainingSecs) / totalSecs) * 100,
          )
        : 0;

    // Show the final timer value with its sign. Negative => the user went
    // past the time limit by that amount (e.g. "-1:16" = 1:16 over).
    const sign = remainingSecs < 0 ? "-" : "";
    const absSecs = Math.abs(remainingSecs);
    const displayMinutes = Math.floor(absSecs / 60);
    const displaySeconds = absSecs % 60;
    const formattedTime = `${sign}${displayMinutes}:${String(displaySeconds).padStart(2, "0")}`;

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

  const skill = useMemo(() => post.quizFields.skill[0], [post.quizFields.skill]);
  const quizType = useMemo(
    () => post.quizFields.type?.[0] ?? "practice",
    [post.quizFields.type],
  );
  const scoreType = useMemo(
    () => getQuizScoreType(post.quizFields.scoreType),
    [post.quizFields.scoreType],
  );

  const getEncouragementMessage = () => {
    if (scoreData.correctAns === 0) {
      return "Oops! bạn chưa làm đúng câu nào, cố gắng lần sau nha.";
    }

    return "Chúc mừng! Bạn đã hoàn thành bài test, cùng kiểm tra kết quả nhé!";
  };

  const isBandResult =
    scoreType === "band" ||
    quizType === "exam" ||
    quizType === "academic" ||
    quizType === "general";

  const displayScoreStr =
    formatResultLabel({
      quizType,
      scoreType,
      storedScore: testResult.testResultFields.score,
      scoreResult: scoreData,
      answers: testResult.testResultFields.answers,
    }) ??
    (isBandResult
      ? (formatBandScore(numericScore) ?? numericScore.toFixed(1))
      : `${scoreData.correctAns}/${scoreData.total_questions}`);

  const scoreLabel = isBandResult ? "Band Score" : "Câu đúng";

  // Keep these hooks referenced; behavior stays unchanged from the existing page.
  void user;
  void currentUser;
  void openProContentModal;

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

      {/* Main Page Layout Wrapper */}
      <div className="bg-[#f8f9fb] min-h-screen mb-[50px] px-6">
        <Container className="space-y-6 md:space-y-8 pb-12 pt-8 max-w-[1360px]">
        
        {/* Banner Section */}
        <div className="flex flex-col md:flex-row w-full rounded-[24px] overflow-hidden shadow-sm h-auto md:h-[250px]">
          {/* Thumbnail */}
          <div className="w-full md:w-1/2 h-[150px] md:h-full relative shrink-0">
            <Image
              src={resolveContentImage(post.featuredImage?.node.sourceUrl, fallbackImage)}
              alt={post.featuredImage?.node.altText || post.title}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          {/* Text Area */}
          <div className="w-full md:w-1/2 p-5 md:p-8 flex flex-col justify-center text-white bg-primary-500 space-y-3 shrink-0 h-auto md:h-full">
            <h1 className="text-xl md:text-2xl font-bold leading-tight"> {post.title} </h1>
            <div className="flex flex-col space-y-1.5 text-white/90 font-medium text-sm">
              <p className="flex items-center space-x-2">
                <span className="material-symbols-rounded text-[18px]">calendar_today</span>
                <span>Published on: {dayjs(post.date).format("DD/MM/YYYY")}</span>
              </p>
              <p className="flex items-center space-x-2">
                <span className="material-symbols-rounded text-[18px] filled">bolt</span>
                <span>Tests taken: {post.quizFields.testsTaken || 0}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Row 2: Mascot Box & Quick Stats Box */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Mascot Box */}
          <div className="flex-1 bg-white rounded-[24px] shadow-sm border-b-[4px] border-primary-500 p-5 md:p-6 flex flex-col md:flex-row items-center justify-between gap-4 relative overflow-hidden">
            <div className="flex-1 space-y-4 relative z-10">
              <h2 className="text-sm md:text-base font-bold text-[#2D3142] max-w-[450px]">
                {getEncouragementMessage()}
              </h2>
              <div className="flex flex-wrap items-center gap-4">
                {/* Custom Score Circle */}
                <div className="relative w-24 h-24 flex items-center justify-center bg-white rounded-full border-[6px] border-[#4CAF50] shadow-sm">
                  <span className="text-xl font-black text-[#4CAF50]">
                    {displayScoreStr}
                  </span>
                </div>
                
                <Button
                  variant="primary"
                  size="lg"
                  className="rounded-full px-8 shadow-lg shadow-primary-500/20"
                  leftIcon={<span className="material-symbols-rounded">search</span>}
                  onClick={() => router.push(ROUTES.TEST_RESULT_EXPLANATION(testResult.id))}
                >
                  Xem giải thích
                </Button>
              </div>
            </div>
            
            {/* Mascot Image */}
            <div className="w-32 h-32 md:w-44 md:h-[200px] relative shrink-0 z-0 hidden sm:block self-end -mb-5 md:-mb-6">
              <Image 
                src={scoreData.correctAns === 0 ? "/assets/figma/icons/fail.png" : "/assets/figma/icons/pass.png"}
                alt="IELTS Prediction Mascot Status" 
                fill 
                className="object-contain object-bottom" 
              />
            </div>
          </div>

          {/* Correct/Wrong/Skip Stats Box */}
          <div className="w-full lg:w-[40%] bg-white rounded-[24px] shadow-sm border-b-[4px] border-primary-500 p-5 md:p-6 flex items-center justify-evenly">
            {/* Correct */}
            <div className="flex flex-col justify-center items-center space-y-2 md:space-y-3">
              <div className="w-16 h-16 md:w-[70px] md:h-[70px] rounded-full bg-[#1B8C40] flex items-center justify-center text-white shadow-sm shrink-0">
                <Image src="/assets/figma/icons/check.svg" alt="Correct" width={32} height={32} className="w-[28px] h-[28px] md:w-[32px] md:h-[32px] brightness-0 invert" />
              </div>
              <div className="text-center space-y-0.5">
                <p className="font-bold text-[#1B8C40] text-sm md:text-base">Đúng</p>
                <p className="font-black text-[#2D3142] text-lg md:text-xl">{scoreData.correctAns}</p>
              </div>
            </div>
            {/* Wrong */}
            <div className="flex flex-col justify-center items-center space-y-2 md:space-y-3">
              <div className="w-16 h-16 md:w-[70px] md:h-[70px] rounded-full bg-primary-500 flex items-center justify-center text-white shadow-sm shrink-0">
                <Image src="/assets/figma/icons/Cross.svg" alt="Wrong" width={32} height={32} className="w-[28px] h-[28px] md:w-[32px] md:h-[32px]" />
              </div>
              <div className="text-center space-y-0.5">
                <p className="font-bold text-primary-500 text-sm md:text-base">Sai</p>
                <p className="font-black text-[#2D3142] text-lg md:text-xl">{scoreData.incorrect}</p>
              </div>
            </div>
            {/* Skipped */}
            <div className="flex flex-col justify-center items-center space-y-2 md:space-y-3">
              <div className="w-16 h-16 md:w-[70px] md:h-[70px] rounded-full bg-[#F2994A] flex items-center justify-center text-white shadow-sm shrink-0">
                <Image src="/assets/figma/icons/skip.svg" alt="Skipped" width={32} height={32} className="w-[28px] h-[28px] md:w-[32px] md:h-[32px] ml-0.5" />
              </div>
              <div className="text-center space-y-0.5">
                <p className="font-bold text-[#F2994A] text-sm md:text-base">Bỏ qua</p>
                <p className="font-black text-[#2D3142] text-lg md:text-xl">{scoreData.missed}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Row 3: 3 Metric Cards Bottom */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Skill */}
          <div className="bg-white rounded-[24px] p-6 shadow-sm flex flex-col space-y-3">
            <h3 className="text-lg font-black text-[#2D3142] pb-3 border-b border-gray-200">Kĩ năng</h3>
            <div className="flex items-center space-x-4 pt-1">
              <div className="w-[70px] h-[70px] rounded-full bg-[#EAEEF6] flex items-center justify-center shrink-0">
                <Image src={skill === "listening" ? "/assets/figma/icons/listen 1.svg" : "/assets/figma/icons/reading-book 1.svg"} alt={skill} width={32} height={32} className="w-[32px] h-[32px]" />
              </div>
              <div>
                <p className="text-base font-extrabold text-[#2D3142] capitalize">{skill === "listening" ? "Nghe" : skill === "reading" ? "Đọc" : skill}</p>
                <p className="text-sm text-gray-500 font-medium">{displayScoreStr}</p>
              </div>
            </div>
          </div>

          {/* Result Score */}
          <div className="bg-white rounded-[24px] p-6 shadow-sm flex flex-col space-y-3">
            <h3 className="text-lg font-black text-[#2D3142] pb-3 border-b border-gray-200">Kết quả</h3>
            <div className="flex items-center space-x-4 pt-1">
              <div className="w-[70px] h-[70px] rounded-full bg-[#EAEEF6] flex items-center justify-center shrink-0">
                <Image src="/assets/figma/icons/check.svg" alt="Kết quả" width={32} height={32} className="w-[32px] h-[32px]" />
              </div>
              <div>
                <p className="text-base font-extrabold text-[#2D3142]">{scoreLabel}</p>
                <p className="text-sm text-gray-500 font-medium">{displayScoreStr}</p>
              </div>
            </div>
          </div>

          {/* Time Spent */}
          <div className="bg-white rounded-[24px] p-6 shadow-sm flex flex-col space-y-3">
            <h3 className="text-lg font-black text-[#2D3142] pb-3 border-b border-gray-200">Thời gian</h3>
            <div className="flex items-center space-x-4 pt-1">
              <div className="w-[70px] h-[70px] rounded-full bg-[#EAEEF6] flex items-center justify-center shrink-0">
                <Image src="/assets/figma/icons/count.svg" alt="Thời gian" width={32} height={32} className="w-[32px] h-[32px]" />
              </div>
              <div>
                <p className="text-base font-extrabold text-[#2D3142]">{timeSpent.spent}</p>
                <p className="text-sm text-gray-500 font-medium">({timeSpent.totalTime})</p>
              </div>
            </div>
          </div>
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
