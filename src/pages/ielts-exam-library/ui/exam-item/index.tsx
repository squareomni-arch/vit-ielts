import Link from "next/link";
import Image from "next/image";
import { ROUTES } from "@/shared/routes";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Skeleton } from "antd";
import { IExamCollection } from "../../api";
import ExamModeModal from "../exam-mode-modal";
import { useAuth } from "@/appx/providers";
import { useProContentModal } from "@/shared/ui/pro-content";
import { LinkButton } from "@/shared/ui";
import { createClient } from "~supabase/client";

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
  const [loading, setLoading] = useState(true);
  const [publishedResults, setPublishedResults] = useState<TestResultRow[]>([]);

  // Fetch test results for this quiz from Supabase
  useEffect(() => {
    if (!currentUser?.id) {
      setLoading(false);
      return;
    }

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
      } finally {
        setLoading(false);
      }
    };

    fetchTestResults();
  }, [item.id, currentUser?.id]);

  const data = useMemo(() => ({
    publishedResults: { nodes: publishedResults },
  }), [publishedResults]);

  // const isInProgress = useMemo(
  //   () => data && data.testResults.nodes.length > 0,
  //   [data]
  // );

  // const questionCount = useMemo(() => {
  //   const total = item.quizFields.passages.reduce(
  //     (prev, curr) =>
  //       prev + (_.sum(curr.questions.map((q) => q.explanations.length)) || 0),
  //     0
  //   );

  //   // const answers = JSON.parse(
  //   //   data?.testResults.nodes[0]?.testResultFields.answers || '{"answers":[]}'
  //   // ).answers;

  //   // const filled = answers.length;

  //   // return isInProgress ? `${filled}/${total}` : total;
  //   return total;
  // }, [item.quizFields.passages]);

  const isDone = useMemo(
    () => data && data.publishedResults.nodes.length > 0,
    [data]
  );

  const itemLink = useMemo(() => {
    if (!data) return "#";
    if (isDone && data?.publishedResults) {
      return ROUTES.TEST_RESULT(data?.publishedResults.nodes[0].id);
    } else {
      return ROUTES.TAKE_THE_TEST(item.slug);
    }
  }, [data, isDone, item.slug]);

  const handleOpen = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      // Nếu chưa đăng nhập, navigate về login
      if (!currentUser) {
        window.location.href = ROUTES.LOGIN(itemLink);
        return;
      }
      // Nếu đã đăng nhập nhưng không phải pro, hiện modal
      if (!currentUser.userData.isPro) {
        openProContentModal();
      }
    },
    [openProContentModal, currentUser, itemLink]
  );

  return (
    <div className="space-y-3 h-full flex flex-col relative">
      <Link
        href={currentUser ? itemLink : ROUTES.LOGIN(itemLink)}
        title={item.title}
        className="block"
        {...(item.quizFields.proUserOnly &&
          !currentUser?.userData.isPro && {
            onClick: handleOpen,
          })}
      >
        {/* <div className="absolute top-3 left-3 z-10">
          <div
            className={twMerge(
              "bg-white rounded py-0.5 px-1.5 font-semibold text-neutral-500 shadow"
              // isInProgress && "text-green-600"
            )}
          >
            {loading ? (
              <Skeleton paragraph={false} active title={{ width: 100 }} />
            ) : (
              <>{questionCount} questions</>
            )}
          </div>
        </div> */}
        {item.quizFields.proUserOnly && (
          <div className="absolute top-3 right-3 z-10">
            <div
              className={
                "rounded py-0.5 px-1.5 font-semibold text-white shadow bg-primary"
              }
            >
              PRO
            </div>
          </div>
        )}
        <div className="relative overflow-hidden aspect-[3/2] bg-gray-200 rounded-lg">
          <Image
            src={item.featuredImage || "https://placehold.co/600x400"}
            alt={item.title}
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      </Link>
      <div className="space-y-1">
        <Link
          href={currentUser ? itemLink : ROUTES.LOGIN(itemLink)}
          title={item.title}
          className="block"
          {...(item.quizFields.proUserOnly &&
            !currentUser?.userData.isPro && {
              onClick: handleOpen,
            })}
        >
          <h4 className="text-base sm:text-xl hover:underline font-semibold">
            {item.title}
          </h4>
        </Link>
        <p className="text-gray-500">
          {item.quizFields.testsTaken || 0} attempts
        </p>
      </div>
      <div className="mt-auto">
        {loading ? (
          <Skeleton.Button active />
        ) : (
          <>
            {!currentUser ? (
              <Link
                href={ROUTES.LOGIN(ROUTES.EXAM.ARCHIVE)}
                passHref
                title={item.title}
                legacyBehavior
              >
                <LinkButton size="large">
                  <span className="material-symbols-rounded text-primary!">
                    play_circle
                  </span>
                  <span className="font-semibold">Take the Test</span>
                </LinkButton>
              </Link>
            ) : item.quizFields.proUserOnly && currentUser.userData.isPro ? (
              <Button onClick={() => setIsModalOpen(true)} size="large">
                <span className="material-symbols-rounded text-primary!">
                  play_circle
                </span>
                <span className="font-semibold">Take the Test</span>
              </Button>
            ) : item.quizFields.proUserOnly ? (
              <Button size="large" onClick={openProContentModal}>
                <span className="material-symbols-rounded text-primary!">
                  play_circle
                </span>
                <span className="font-semibold">Take the Test</span>
              </Button>
            ) : (
              <Button onClick={() => setIsModalOpen(true)} size="large">
                <span className="material-symbols-rounded text-primary!">
                  play_circle
                </span>
                <span className="font-semibold">Take the Test</span>
              </Button>
            )}
          </>
        )}
      </div>
      <ExamModeModal
        navigateLink={ROUTES.TAKE_THE_TEST(item.slug)}
        quiz={item}
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};
