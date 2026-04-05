import { Container } from "@/shared/ui";
import { Avatar, Breadcrumb, Button, Progress } from "antd";
import Link from "next/link";
import { IPracticeSingle, ITestResult, IUser } from "../api";
import Image from "next/image";
import dayjs from "dayjs";
import { useMemo, useState } from "react"; // [ĐÃ SỬA] Import useState
import duration from "dayjs/plugin/duration";
import { calculateScore } from "@/shared/lib";
import { BandScore } from "@/widgets/blocks/band-score";
import AnswerKeys from "./answer-keys";
import { SEOHeader } from "@/widgets";
import ReviewExplanation from "./review-explanation";
import ExamModeModal from "@/pages/ielts-exam-library/ui/exam-mode-modal";
import { ROUTES } from "@/shared/routes";
import { useAuth } from "@/appx/providers";
import { useProContentModal } from "@/shared/ui/pro-content";
dayjs.extend(duration);

export function PageTestResult({
  post,
  testResult,
  user,
  scoreData,
}: {
  post: IPracticeSingle;
  testResult: ITestResult;
  user: IUser;
  scoreData: ReturnType<typeof calculateScore>;
}) {
  const { currentUser } = useAuth();
  const openProContentModal = useProContentModal((state) => state.open);

  // [ĐÃ SỬA] Thêm state để giữ điểm từ BandScore
  const [bandScore, setBandScore] = useState<number | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);

  // --- Tính toán thời gian (Giữ nguyên logic gốc) ---
  const timeSpent = useMemo(() => {
    const total = dayjs.duration({
      minutes: testResult.testResultFields.testTime,
    });

    const [minutes, seconds] = testResult.testResultFields.timeLeft
      .split(":")
      .map(Number);
    const remainingDuration = dayjs.duration({ minutes, seconds });
    // Handle potential negative duration if timeLeft > testTime somehow
    const spentSeconTotal = Math.max(0, total.asSeconds() - remainingDuration.asSeconds());
    const spentDuration = dayjs.duration(spentSeconTotal, 'seconds');

    const percent = total.asSeconds() > 0
      ? Math.round((spentSeconTotal / total.asSeconds()) * 100)
      : 0;

    const formattedTime = `${Math.floor(spentDuration.asMinutes())}:${String(
      spentDuration.seconds()
    ).padStart(2, "0")}`;

    const totalTime = `${Number(total.minutes()) + total.hours() * 60}:${String(
      total.seconds()
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

  // --- [ĐÃ SỬA] Tính toán điểm % ---
  const scorePercent = useMemo(() => {
    // [ĐÃ SỬA] Ưu tiên dùng điểm từ bandScore nếu có, nếu không thì dùng scoreData.score
    const scoreToUse = bandScore !== null ? bandScore : Number(scoreData.score);
    return Math.round((scoreToUse / 9) * 100);
  }, [scoreData.score, bandScore]); // [ĐÃ SỬA] Thêm dependency

  // --- Lấy skill (Giữ nguyên logic gốc) ---
  const skill = useMemo(() => {
    return post.quizFields.skill[0];
  }, [post.quizFields.skill]);

  // --- Lấy số câu đúng (Để truyền vào Bancore) ---
  const correctAnswers = Number(scoreData?.correctAns ?? 0);

  const getEncouragementMessage = (percent: number) => {
    if (percent === 0) return "Oops! bạn chưa làm đúng câu nào, cố gắng lần sau nha.";
    if (percent < 50) return "Bạn cần cố gắng hơn nữa nhé!";
    if (percent < 80) return "Làm khá tốt! Tiếp tục phát huy nha.";
    return "Tuyệt vời! Kết quả rất xuất sắc.";
  };

  return (
    <>
      <SEOHeader fullHead="" title={"Test Result | IELTS Exam Library"} />

      {/* === SECTION: Page Banner (Hero) === */}
      <section
        data-section="test-result-banner"
        className="w-full py-10 lg:py-12 relative overflow-hidden"
        style={{
          background: "#F4F6FA",
          backgroundImage:
            "linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      >
        {/* Red accent line at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-primary-500" />

        <Container>
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#2D3142] mb-3">
              Results
            </h1>
            {/* Breadcrumb */}
            <nav aria-label="Breadcrumb">
              <ol className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <li>
                  <Link href={ROUTES.HOME} className="hover:text-primary-500 transition-colors">
                    Trang chủ
                  </Link>
                </li>
                <span className="text-gray-400">/</span>
                <li>
                  <Link href={ROUTES.TAKE_THE_TEST(post.slug)} className="hover:text-primary-500 transition-colors">
                    {post.title}
                  </Link>
                </li>
                <span className="text-gray-400">/</span>
                <li className="text-gray-700 font-medium">Test Result</li>
              </ol>
            </nav>
          </div>
        </Container>
      </section>

      {/* Main Page Layout Wrapper */}
      <div className="bg-[#f8f9fb] min-h-screen">
        <Container className="space-y-6 md:space-y-8 pb-12 pt-8 max-w-7xl">
        
        {/* Banner Section */}
        <div className="flex flex-col md:flex-row bg-primary-500 rounded-[24px] overflow-hidden shadow-sm">
          <div className="w-full md:w-[45%] h-[200px] md:h-auto md:aspect-[2/1] relative">
            <Image
              src={post.featuredImage?.node.sourceUrl || "https://placehold.co/600x400"}
              alt={post.featuredImage?.node.altText || post.title}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          <div className="w-full md:w-[55%] p-6 md:p-10 flex flex-col justify-center text-white space-y-4 md:space-y-6">
            <h1 className="text-2xl md:text-[32px] font-bold leading-tight"> {post.title} </h1>
            <div className="flex flex-col space-y-2 text-white/90 font-medium">
              <p className="flex items-center space-x-3">
                <span className="material-symbols-rounded text-[20px]">calendar_today</span>
                <span>Published on: {dayjs(post.date).format("DD/MM/YYYY")}</span>
              </p>
              <p className="flex items-center space-x-3">
                <span className="material-symbols-rounded text-[20px] filled">bolt</span>
                <span>Tests taken: {post.quizFields.testsTaken || 0}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Row 2: Mascot Box & Quick Stats Box */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Mascot Box */}
          <div className="flex-1 bg-white rounded-[24px] shadow-sm border-b-[6px] border-primary-500 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
            <div className="flex-1 space-y-6 relative z-10">
              <h2 className="text-lg md:text-xl font-bold text-[#2D3142]">
                {getEncouragementMessage(scorePercent)}
              </h2>
              <div className="flex flex-wrap items-center gap-6">
                {/* Custom Score Circle */}
                <div className="relative w-32 h-32 flex items-center justify-center bg-white rounded-full border-[8px] border-[#4CAF50] shadow-sm">
                  <span className="text-2xl font-black text-[#4CAF50]">
                    {scoreData.correctAns}/{scoreData.total_questions}
                  </span>
                </div>
                
                <Button 
                  size="large" 
                  className="bg-primary-500! text-white! hover:bg-primary-400! border-none rounded-full px-6 font-semibold shadow-md"
                  onClick={() => {
                    const el = document.getElementById("explanation-section");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  Xem giải thích
                </Button>
              </div>
            </div>
            
            {/* Mascot Image */}
            <div className="w-40 h-40 md:w-56 md:h-56 relative shrink-0 z-0 hidden sm:block">
              <Image 
                src="/intro-mascot.png" 
                alt="IELTS Prediction Mascot" 
                fill 
                className="object-contain object-bottom" 
              />
            </div>
          </div>

          {/* Correct/Wrong/Skip Stats Box */}
          <div className="w-full lg:w-[40%] bg-white rounded-[24px] shadow-sm border-b-[6px] border-primary-500 p-6 md:p-8 flex items-center justify-evenly">
            {/* Correct */}
            <div className="flex flex-col items-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-[#1B8C40] flex items-center justify-center text-white shadow-sm">
                <span className="material-symbols-rounded text-3xl font-bold">check</span>
              </div>
              <div className="text-center">
                <p className="font-bold text-[#1B8C40] text-lg">Đúng</p>
                <p className="font-black text-[#2D3142] text-xl">{scoreData.correctAns}</p>
              </div>
            </div>
            {/* Wrong */}
            <div className="flex flex-col items-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-primary-500 flex items-center justify-center text-white shadow-sm">
                <span className="material-symbols-rounded text-3xl font-bold">close</span>
              </div>
              <div className="text-center">
                <p className="font-bold text-primary-500 text-lg">Sai</p>
                <p className="font-black text-[#2D3142] text-xl">{scoreData.total_questions - scoreData.correctAns - (scoreData as any).skipped || Math.max(0, scoreData.total_questions - scoreData.correctAns)}</p>
              </div>
            </div>
            {/* Skipped */}
            <div className="flex flex-col items-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-[#F2994A] flex items-center justify-center text-white shadow-sm">
                <span className="material-symbols-rounded text-3xl font-bold">skip_next</span>
              </div>
              <div className="text-center">
                <p className="font-bold text-[#F2994A] text-lg">Bỏ qua</p>
                <p className="font-black text-[#2D3142] text-xl">{(scoreData as any).skipped || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Row 3: 3 Metric Cards Bottom */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Skill */}
          <div className="bg-white rounded-[24px] p-8 shadow-sm flex flex-col space-y-4">
            <h3 className="text-2xl font-black text-[#2D3142] pb-4 border-b border-gray-200">Kĩ năng</h3>
            <div className="flex items-center space-x-6 pt-2">
              <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-700">
                <span className="material-symbols-rounded text-3xl">headphones</span>
              </div>
              <div>
                <p className="text-xl font-extrabold text-[#2D3142] capitalize">{skill === "listening" ? "Nghe" : skill === "reading" ? "Đọc" : skill}</p>
                <p className="text-gray-500 font-medium">{scoreData.correctAns}/{scoreData.total_questions}</p>
              </div>
            </div>
          </div>

          {/* Result Score */}
          <div className="bg-white rounded-[24px] p-8 shadow-sm flex flex-col space-y-4">
            <h3 className="text-2xl font-black text-[#2D3142] pb-4 border-b border-gray-200">Kết quả</h3>
            <div className="flex items-center space-x-6 pt-2">
              <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-700">
                <span className="material-symbols-rounded text-3xl">check</span>
              </div>
              <div>
                <p className="text-xl font-extrabold text-[#2D3142]">Câu đúng</p>
                <p className="text-gray-500 font-medium">{scoreData.correctAns}/{scoreData.total_questions}</p>
              </div>
            </div>
          </div>

          {/* Time Spent */}
          <div className="bg-white rounded-[24px] p-8 shadow-sm flex flex-col space-y-4">
            <h3 className="text-2xl font-black text-[#2D3142] pb-4 border-b border-gray-200">Thời gian</h3>
            <div className="flex items-center space-x-6 pt-2">
              <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-700">
                <span className="material-symbols-rounded text-3xl">schedule</span>
              </div>
              <div>
                <p className="text-xl font-extrabold text-[#2D3142]">{timeSpent.spent}</p>
                <p className="text-gray-500 font-medium">({timeSpent.totalTime})</p>
              </div>
            </div>
          </div>
        </div>

        {/* Hidden BandScore component for legacy calculate score trigger */}
        <div className="hidden">
           <BandScore correctAnswersCount={correctAnswers} onScoreCalculated={setBandScore} />
        </div>

        <div className="bg-white p-6 md:p-10 rounded-[24px] shadow-sm">
          <AnswerKeys data={scoreData} skill={skill as "listening" | "reading"} />
        </div>
      </Container>
      
      {/* Explanation Section */}
      <Container id="explanation-section" className="max-w-7xl mb-12">
        <div className="bg-primary-500 p-4 md:p-6 rounded-t-[24px] space-y-3">
          <h3 className="text-xl md:text-2xl font-bold text-white flex items-center space-x-2">
            <span className="material-symbols-rounded text-3xl!" aria-hidden> library_books </span>
            <span>Explanation</span>
          </h3>
        </div>
        <div className="bg-white p-6 md:p-8 rounded-b-[24px] shadow-sm border border-t-0 border-gray-200">
          <ReviewExplanation quiz={post} testResult={testResult} />
        </div>
      </Container>
      </div>
      {/* Giữ nguyên ExamModeModal */}
      <ExamModeModal
        navigateLink={ROUTES.TAKE_THE_TEST(post.slug)}
        quiz={post as any}
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}