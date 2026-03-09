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
    const spentSecondsTotal = Math.max(0, total.asSeconds() - remainingDuration.asSeconds());
    const spentDuration = dayjs.duration(spentSecondsTotal, 'seconds');

    const percent = total.asSeconds() > 0
      ? Math.round((spentSecondsTotal / total.asSeconds()) * 100)
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

  // --- Lấy số câu đúng (Để truyền vào BandScore) ---
  const correctAnswers = Number(scoreData?.correctAns ?? 0);

  return (
    <>
      <Container className="space-y-12 pb-5">
        <SEOHeader fullHead="" title={"Test Result | IELTS Exam Library"} />
        {/* Phần Breadcrumb và thông tin bài test (Giữ nguyên) */}
        <div className="space-y-2">
          <div className="pt-5 pb-3">
            <Breadcrumb
              items={[
                { title: <Link href="/">Home</Link>, },
                { title: post.title, },
                { title: "Test Result", },
              ]}
            />
          </div>
          <div className="flex -m-2 flex-wrap">
            <div className="w-full sm:w-2/12 p-2">
              <div className="relative aspect-square rounded-lg overflow-hidden max-w-44 md:max-w-none mx-auto shadow">
                <Image
                  src={post.featuredImage?.node.sourceUrl || "https://placehold.co/600x400"}
                  alt={post.featuredImage?.node.altText || post.title}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            </div>
            <div className="w-full sm:w-10/12 p-2 space-y-2 text-center sm:text-left">
              <h1 className="text-2xl md:text-3xl font-bold text-red-800"> {post.title} </h1>
              <p className="flex justify-center sm:justify-start items-center space-x-1">
                <span className="material-symbols-rounded">calendar_today</span>
                <span>Published on:</span>
                <span className="font-semibold"> {dayjs(post.date).format("DD/MM/YYYY")} </span>
              </p>
              <p className="flex justify-center sm:justify-start items-center space-x-1">
                <span className="material-symbols-rounded">bolt</span>
                <span>Tests taken:</span>
                <span className="font-semibold"> {post.quizFields.testsTaken || 0} </span>
              </p>
              <Button
                size="large"
                onClick={() => {
                  // Nếu chưa đăng nhập, navigate về login
                  if (!currentUser) {
                    window.location.href = ROUTES.LOGIN(ROUTES.TAKE_THE_TEST(post.slug));
                    return;
                  }
                  // Nếu là pro content và user không phải pro, hiện modal
                  if (post.quizFields.proUserOnly && !currentUser.userData.isPro) {
                    openProContentModal();
                    return;
                  }
                  // Ngược lại, mở modal chọn chế độ
                  setIsModalOpen(true);
                }}
              >
                <span className="material-symbols-rounded text-primary!"> play_circle </span>
                <span className="font-semibold">Take the Test</span>
              </Button>
            </div>
          </div>
        </div>
        {/* Phần hiển thị điểm (Giữ nguyên) */}
        <div className="space-y-6">
          <div className="flex flex-col items-center space-y-3">
            <Avatar
              className={"bg-yellow-300! text-black!"}
              src={user?.userData?.avatar?.node?.mediaDetails?.sizes?.[0]?.sourceUrl}
              alt={user.name}
              size={96}
            >
              {user.name.at(0)}
            </Avatar>
            <h3 className="text-lg font-semibold">{user.name}</h3>
          </div>
          <div className="space-y-6 max-w-screen-md mx-auto">
            <h3 className="text-center text-2xl md:text-3xl font-bold text-primary"> Your score is: </h3>
            <div className="flex justify-evenly items-center flex-wrap gap-y-4">
              <Progress
                className="order-1 sm:order-none"
                type="circle"
                percent={scoreData.correctPercent}
                size={150}
                strokeColor={"#00a63e"}
                format={() => (
                  <div className="text-sm">
                    <span className="material-symbols-rounded text-green-600!"> check_circle </span>
                    <p className="font-bold text-gray-600">Correct Answers</p>
                    <p className="text-green-600 font-semibold"> {scoreData.correctAns}/{scoreData.total_questions} </p>
                  </div>
                )}
              />
              <Progress
                className="order-3 sm:order-none"
                type="circle"
                percent={scorePercent} // [ĐÃ SỬA] Dùng scorePercent đã được cập nhật
                size={150}

                strokeColor={"#00a63e"}
                format={() => (
                  // [ĐÃ SỬA] Hiển thị điểm từ state `bandScore`, dùng scoreData.score làm fallback
                  <span className="font-bold text-green-600! text-5xl">
                    {(bandScore !== null ? bandScore : Number(scoreData.score)).toFixed(1)}
                  </span>
                )}
              />
              <Progress
                className="order-2 sm:order-none"
                type="circle"
                percent={timeSpent.percent}
                size={150}
                strokeColor={"#00a63e"}
                format={() => (
                  <div className="text-sm">
                    <span className="material-symbols-rounded text-green-600! filled"> timer </span>
                    <p className="font-bold text-gray-600">Time Spent</p>
                    <p className="text-green-600 font-semibold"> {timeSpent.spent} </p>
                    <p className="text-gray-500">({timeSpent.totalTime})</p>
                  </div>
                )}
              />
            </div>

            {/* ▼▼▼ [ĐÃ SỬA] Truyền cả 2 prop vào BandScore ▼▼▼ */}
            <BandScore
              correctAnswersCount={correctAnswers}
              onScoreCalculated={setBandScore} // [MỚI] Thêm callback
            />
            {/* ▲▲▲ [KẾT THÚC SỬA ĐỔI] ▲▲▲ */}

            {/* Giữ nguyên AnswerKeys */}
            <AnswerKeys data={scoreData} skill={skill as "listening" | "reading"} />
          </div>
        </div>
      </Container>
      {/* GiDùngữ nguyên ReviewExplanation */}
      <Container className="max-w-screen-2xl my-12">
        <div className="bg-primary p-6 rounded-3xl space-y-3">
          <h3 className="text-2xl md:text-3xl font-bold text-white flex items-center space-x-2">
            <span className="material-symbols-rounded text-4xl!" aria-hidden> map </span>
            <span>Explanation</span>
          </h3>
          <div className="bg-white rounded-xl ">
            <ReviewExplanation quiz={post} testResult={testResult} />
          </div>
        </div>
      </Container>
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