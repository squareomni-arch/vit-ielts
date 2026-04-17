import { ROUTES } from "@/shared/routes";
import { TestCard } from "@/shared/ui/ds";
import { normalizeSectionBadge } from "@/shared/lib/quiz-part";

export const SingleItem = ({ post, skill }: { post: any; skill: string }) => {
  const getFieldInfo = () => {
    switch (skill) {
      case "speaking": {
        const speakingPart = post.speakingSampleEssayFields?.part?.[0] || "1";
        return normalizeSectionBadge("speaking", speakingPart);
      }
      case "writing": {
        const task = post.writingSampleEssayFields?.task?.[0] || "1";
        return normalizeSectionBadge("writing", task);
      }
      default:
        return { label: "", colorIndex: 1 as const };
    }
  };

  const { label } = getFieldInfo();

  // Original vertical card layout for all skills (including Writing and Speaking on home page)
  return (
    <TestCard
      image={post.featuredImage?.node?.sourceUrl || post.featured_image}
      title={post.title}
      skill={skill as 'reading' | 'listening' | 'speaking' | 'writing'}
      part={label}
      isPro={post.pro_user_only || post.proUserOnly || post.postMeta?.proUserOnly || false}
      href={ROUTES.SAMPLE_ESSAY.SINGLE(post.slug)}
      isLocked={post.pro_user_only || post.proUserOnly || post.postMeta?.proUserOnly || false}
      actionText="Xem thêm"
    />
  );
};
