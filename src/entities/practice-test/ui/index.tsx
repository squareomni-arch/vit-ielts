import Link from "next/link";
import { IPracticeTest } from "../api";
import Image from "next/image";
import { ROUTES } from "@/shared/routes";
import { LinkButton } from "@/shared/ui";
// import _ from "lodash";
import { useCallback, useMemo } from "react";
import { Button } from "antd";
// import { twMerge } from "tailwind-merge";
import { useAuth } from "@/appx/providers";
import { useProContentModal } from "@/shared/ui/pro-content";
import { resolveContentImage, useContentImageFallback } from "@/shared/lib/content-image";

const PART_COLORS = [
  "rgb(255, 164, 27)", // Part 1 / Task 1 / Passage 1
  "rgb(86, 95, 204)", // Part 2 / Task 2 / Passage 2
  "rgb(184, 143, 217)", // Part 3
  "rgb(100, 200, 150)", // Part 4 (for listening)
];

const FILTER_CONFIGS = {
  listeningParts: [
    { slug: "0", name: "Part 1" },
    { slug: "1", name: "Part 2" },
    { slug: "2", name: "Part 3" },
    { slug: "3", name: "Part 4" },
  ],
  readingPassages: [
    { slug: "0", name: "Passage 1" },
    { slug: "1", name: "Passage 2" },
    { slug: "2", name: "Passage 3" },
  ],
};

export const PracticeTestItem = ({ item }: { item: IPracticeTest }) => {
  const fallbackImage = useContentImageFallback();
  const openProContentModal = useProContentModal((state) => state.open);
  const { currentUser } = useAuth();
  // const [getData, { data, loading }] = useLazyQuery<ITestResultResponses>(
  //   GET_TEST_RESULT,
  //   {
  //     variables: {
  //       quizId: item.id,
  //       authorId: currentUser?.id,
  //     },
  //     context: {
  //       authRequired: true,
  //     },
  //   }
  // );

  // useEffect(() => {
  //   if (currentUser) {
  //     getData();
  //   }
  // }, [currentUser, getData]);

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

  //   const answers = JSON.parse(
  //     data?.testResults.nodes[0]?.testResultFields.answers || '{"answers":[]}'
  //   ).answers;

  //   const filled = answers.length;

  //   return isInProgress ? `${filled}/${total}` : total;
  // }, [data?.testResults.nodes, isInProgress, item.quizFields.passages]);

  const getFieldInfo = useCallback(() => {
    const passage = item.quizFields.part || ["0"];
    const passageIndex = (
      item.quizFields.skill[0] === "listening"
        ? FILTER_CONFIGS.listeningParts
        : FILTER_CONFIGS.readingPassages
    ).findIndex((p) => p.slug === passage[0]);

    return {
      label: (item.quizFields.skill[0] === "listening"
        ? FILTER_CONFIGS.listeningParts
        : FILTER_CONFIGS.readingPassages)[passageIndex >= 0 ? passageIndex : 0]
        .name,
      colorIndex: passageIndex >= 0 ? passageIndex : 0,
    };
  }, [item]);

  const handleOpen = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      // Nếu chưa đăng nhập, navigate về login
      if (!currentUser) {
        window.location.href = ROUTES.LOGIN(ROUTES.PRACTICE.SINGLE(item.slug));
        return;
      }
      // Nếu đã đăng nhập nhưng không phải pro, hiện modal
      if (!currentUser.userData.isPro) {
        openProContentModal();
      }
    },
    [openProContentModal, currentUser, item.slug]
  );

  const { label, colorIndex } = useMemo(getFieldInfo, [getFieldInfo]);

  return (
    <div className="space-y-3 h-full flex flex-col relative">
      <Link
        href={ROUTES.PRACTICE.SINGLE(item.slug)}
        title={item.title}
        className="block"
        {...(item.quizFields.proUserOnly &&
          !currentUser?.userData?.isPro && {
            onClick: handleOpen,
          })}
      >
        {/* <div className="absolute top-3 left-3 z-10">
          <div
            className={twMerge(
              "bg-white rounded py-0.5 px-1.5 font-semibold text-neutral-500 shadow",
              isInProgress && "text-green-600"
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
          {label && (
            <span
              className="absolute bottom-0 z-10 px-2 text-xs font-nunito font-bold py-1 text-white rounded-r-full"
              style={{
                backgroundColor: PART_COLORS[colorIndex],
              }}
            >
              {label}
            </span>
          )}
          <Image
            src={resolveContentImage(item.featuredImage?.node.sourceUrl, fallbackImage)}
            alt={item.featuredImage?.node.altText || item.title}
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      </Link>
      <div className="space-y-1">
        <Link
          href={ROUTES.PRACTICE.SINGLE(item.slug)}
          title={item.title}
          className="block"
          {...(item.quizFields.proUserOnly &&
            !currentUser?.userData?.isPro && {
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
        {/* {loading ? (
          <Skeleton.Button active />
        ) : (
          <> */}
        {item.quizFields.proUserOnly && !currentUser?.userData?.isPro ? (
          <>
            <Button size="large" onClick={handleOpen}>
              <span className="material-symbols-rounded text-primary!">
                play_circle
              </span>
              <span className="font-semibold">Start test</span>
            </Button>
          </>
        ) : (
          <Link
            href={
              currentUser
                ? ROUTES.TAKE_THE_TEST(item.slug)
                : ROUTES.LOGIN(ROUTES.TAKE_THE_TEST(item.slug))
            }
            passHref
            title={item.title}
            legacyBehavior
          >
            <LinkButton size="large">
              <span className="material-symbols-rounded text-primary!">
                play_circle
              </span>
              <span className="font-semibold">Start test</span>
            </LinkButton>
          </Link>
        )}
        {/* </>
        )} */}
      </div>
    </div>
  );
};
