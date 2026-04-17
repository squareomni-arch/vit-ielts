import { SampleEssayProps } from "../..";
import { ROUTES } from "@/shared/routes";
import { TestCard } from "@/shared/ui/ds";
import { normalizeSectionBadge } from "@/shared/lib/quiz-part";

export const HorizontalItem = ({
  post: { node: post },
  skill,
}: {
  post: SampleEssayProps["sampleEssays"]["edges"][number];
  skill: "speaking" | "writing";
}) => {
  return (
    <TestCard
      image={post.featured_image || post.featuredImage?.node?.sourceUrl}
      title={post.title}
      skill={skill as 'reading' | 'listening' | 'speaking' | 'writing'}
      part={normalizeSectionBadge(skill, skill === 'writing' ? post.writingSampleEssayFields?.task?.[0] || post.task : post.speakingSampleEssayFields?.part?.[0] || post.part).label}
      isPro={post.pro_user_only || post.proUserOnly || post.postMeta?.proUserOnly || false}
      href={ROUTES.SAMPLE_ESSAY.SINGLE(post.slug)}
      isLocked={post.pro_user_only || post.proUserOnly || post.postMeta?.proUserOnly || false}
      actionText="Xem thêm"
    />
  );
};
