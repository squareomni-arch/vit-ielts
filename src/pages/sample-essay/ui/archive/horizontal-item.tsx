import { SampleEssayProps } from "../..";
import { ROUTES } from "@/shared/routes";
import { normalizeSectionBadge } from "@/shared/lib/quiz-part";
import {
  resolveContentImage,
  useContentImageFallback,
} from "@/shared/lib/content-image";
import Image from "next/image";
import { ProBadge } from "@/shared/ui/pro-badge";

export const HorizontalItem = ({
  post: { node: post },
  skill,
}: {
  post: SampleEssayProps["sampleEssays"]["edges"][number];
  skill: "speaking" | "writing";
}) => {
  const fallbackImage = useContentImageFallback();
  const imageSrc = resolveContentImage(
    post.featured_image || post.featuredImage?.node?.sourceUrl,
    fallbackImage,
  );

  const quarter = post.quarter || post.sampleEssayFields?.quarter?.[1] || "";
  const year =
    post.year ||
    new Date(post.date || post.created_at || Date.now()).getFullYear();

  const partBadge = normalizeSectionBadge(
    skill,
    skill === "writing"
      ? post.writingSampleEssayFields?.task?.[0] || post.task
      : post.speakingSampleEssayFields?.part?.[0] || post.part,
  ).label;

  const metaParts: string[] = [];
  if (quarter && year) metaParts.push(`Quý ${quarter} T1-T4 ${year}`);
  if (partBadge) metaParts.push(partBadge);
  const metaText = metaParts.join(" . ");

  const isPro = post.pro_user_only ?? post.postMeta?.proUserOnly ?? false;

  return (
    <a
      href={ROUTES.SAMPLE_ESSAY.SINGLE(post.slug)}
      className="group flex flex-col sm:flex-row sm:items-center bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.07)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.12)] transition-shadow overflow-hidden"
    >
      {/* Image */}
      <div className="relative w-full h-[200px] sm:w-[390px] sm:h-[240px] shrink-0 rounded-t-xl sm:rounded-l-xl sm:rounded-tr-none overflow-hidden bg-gray-100">
        {isPro && (
          <ProBadge className="absolute top-2 right-2 z-10 shadow-sm" />
        )}
        <Image
          src={imageSrc}
          alt={post.title}
          fill
          className="object-cover"
          unoptimized
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 px-4 py-6 sm:p-0 sm:px-4 sm:pr-4">
        {metaText && (
          <p className="text-sm text-gray-700 mb-1 truncate">{metaText}</p>
        )}
        <h3 className="font-bold text-[#202020] text-[20px] leading-snug line-clamp-2 mb-3 group-hover:text-primary-500 transition-colors">
          {post.title}
        </h3>
        <p className="text-sm text-gray-400 line-clamp-1">{post.title}</p>
      </div>
    </a>
  );
};
