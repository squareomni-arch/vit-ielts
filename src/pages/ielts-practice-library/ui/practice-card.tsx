import { MouseEvent, useMemo } from "react";
import { useAuth } from "@/appx/providers";
import { IPracticeTest } from "@/entities/practice-test";
import { ROUTES } from "@/shared/routes";
import { useProContentModal } from "@/shared/ui/pro-content";
import { TestCard } from "@/shared/ui/ds";

type PracticeCardProps = {
  item: IPracticeTest;
  priority?: boolean;
};

const PART_META = {
  listening: [
    { slug: "0", label: "Part 1" },
    { slug: "1", label: "Part 2" },
    { slug: "2", label: "Part 3" },
    { slug: "3", label: "Part 4" },
  ],
  reading: [
    { slug: "0", label: "Passage 1" },
    { slug: "1", label: "Passage 2" },
    { slug: "2", label: "Passage 3" },
  ],
} as const;

export const PracticeCard = ({ item, priority = false }: PracticeCardProps) => {
  const openProContentModal = useProContentModal((state) => state.open);
  const { currentUser } = useAuth();

  const skill = item.quizFields.skill[0] === "listening" ? "listening" : "reading";
  const partMeta = useMemo(() => {
    const group = PART_META[skill];
    const match = group.find((entry) => entry.slug === String(item.quizFields.part ?? "0"));
    return match ?? group[0];
  }, [item.quizFields.part, skill]);

  const requiresUpgrade = item.quizFields.proUserOnly && !currentUser?.userData.isPro;
  const detailHref = ROUTES.PRACTICE.SINGLE(item.slug);
  const actionHref = currentUser
    ? ROUTES.TAKE_THE_TEST(item.slug)
    : ROUTES.LOGIN(ROUTES.TAKE_THE_TEST(item.slug));

  const handleProtectedAction = (event?: MouseEvent<any>) => {
    if (!requiresUpgrade) return;
    
    event?.preventDefault();
    if (!currentUser) {
      window.location.href = ROUTES.LOGIN(detailHref);
      return;
    }
    openProContentModal();
  };

  return (
    <TestCard
      image={item.featuredImage?.node.sourceUrl}
      title={item.title}
      skill={skill}
      part={partMeta.label}
      attempts={item.quizFields.testsTaken || 0}
      isPro={item.quizFields.proUserOnly}
      isLocked={requiresUpgrade}
      score={"9,0"}
      href={requiresUpgrade ? undefined : actionHref}
      onClick={requiresUpgrade ? handleProtectedAction : undefined}
    />
  );
};
