import { MouseEvent, useMemo } from "react";
import { useAuth } from "@/appx/providers";
import { IPracticeTest, useLatestTestScore } from "@/entities/practice-test";
import { ROUTES } from "@/shared/routes";
import { useProContentModal } from "@/shared/ui/pro-content";
import { TestCardWithScore } from "@/entities/practice-test";
import { normalizeSectionBadge } from "@/shared/lib/quiz-part";

type PracticeCardProps = {
  item: IPracticeTest;
  priority?: boolean;
};


export const PracticeCard = ({ item, priority = false }: PracticeCardProps) => {
  const openProContentModal = useProContentModal((state) => state.open);
  const { currentUser } = useAuth();

  const skill = item.quizFields.skill[0] === "listening" ? "listening" : "reading";
  const partMeta = useMemo(() => {
    if (item.quizFields.type[0] === "academic") return null;
    return normalizeSectionBadge(skill, item.quizFields.part);
  }, [item.quizFields.part, item.quizFields.type, skill]);

  const isProtected = item.quizFields.proUserOnly;
  const requiresLogin = !currentUser;
  const requiresUpgrade = isProtected && !currentUser?.userData.isPro;
  const isLocked = requiresUpgrade;
  const needsIntercept = requiresLogin || requiresUpgrade;
  
  // detailHref: trang giới thiệu/detail bài luyện tập
  const detailHref = ROUTES.PREDICTION.SINGLE(item.slug);

  const handleProtectedAction = (event?: MouseEvent<any>) => {
    if (!needsIntercept) return;
    event?.preventDefault();
    if (requiresLogin) {
      window.location.href = ROUTES.LOGIN(detailHref);
      return;
    }
    if (requiresUpgrade) {
      openProContentModal();
    }
  };

  return (
    <TestCardWithScore
      quizId={item.id}
      image={item.featuredImage?.node.sourceUrl}
      title={item.title}
      skill={skill}
      part={partMeta?.label}
      attempts={item.quizFields.testsTaken || 0}
      isPro={isProtected}
      isLocked={isLocked}
      // Card luôn link đến trang detail — từ đó user mới nhấn "Làm bài"
      href={needsIntercept ? undefined : detailHref}
      onClick={needsIntercept ? handleProtectedAction : undefined}
    />
  );
};
