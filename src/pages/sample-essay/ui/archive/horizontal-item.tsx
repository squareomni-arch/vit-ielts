import Image from "next/image";
import { SampleEssayProps } from "../..";
import { ROUTES } from "@/shared/routes";
import { ProLink } from "@/shared/ui";

export const HorizontalItem = ({
  post: { node: post },
  skill,
}: {
  post: SampleEssayProps["sampleEssays"]["edges"][number];
  skill: "writing" | "speaking";
}) => {
  const quarter = post.sampleEssayFields?.quarter?.[1] || "";
  const year = new Date(post.date).getFullYear();

  const getListItems = () => {
    switch (skill) {
      case "speaking":
        return (
          post.speakingSampleEssayFields?.questionType?.map((item: string) => item) ||
          []
        );
      case "writing":
        return post.writingSampleEssayFields?.topic?.map((item: string) => item) || [];
      default:
        return [];
    }
  };

  const listItems = getListItems();

  let topicTypeName = "";
  let description = post.title;

  if (skill === "writing") {
    const topicType = listItems[0] || "";
    const topicTypeMap: Record<string, string> = {
      LINE: "Line Graph",
      BAR: "Bar Chart",
      PIE: "Pie Chart",
      TABLE: "Table",
      MIXED: "Mixed Graph",
      MAP: "Map",
      PROCESS: "Process",
    };
    topicTypeName = topicTypeMap[topicType] || topicType;

    // Extract topic name from title
    let topicName = "";
    if (post.title.includes("Topic")) {
      const topicMatch = post.title.match(/Topic\s+(.+?)(\s+&|$)/);
      topicName = topicMatch ? topicMatch[1].trim() : "";
    }

    // Build description
    description = topicName
      ? `[Quý ${quarter}/${year}] Đề thi thật IELTS Writing Task 1 - Dạng ${topicTypeName}, chủ đề ${topicName} kèm bài mẫu band 8.5+, dàn ý chi tiết, từ vựng và bài tập ôn luyện.`
      : post.title;
  } else if (skill === "speaking") {
    const part = post.speakingSampleEssayFields?.part?.[1] || "Part";
    topicTypeName = part;

    // Build description for speaking
    let topicName = "";
    if (post.title.includes("Topic")) {
      const topicMatch = post.title.match(/Topic\s+(.+?)(\s+&|$)/);
      topicName = topicMatch ? topicMatch[1].trim() : "";
    }

    description = topicName
      ? `[Quý ${quarter}/${year}] Đề thi thật IELTS Speaking ${part} - Chủ đề ${topicName} kèm bài mẫu band 8.5+, dàn ý chi tiết, từ vựng và bài tập ôn luyện.`
      : post.title;
  }

  return (
    <article className="bg-white">
      <ProLink
        title={post.title}
        isPro={post.postMeta.proUserOnly}
        href={ROUTES.SAMPLE_ESSAY.SINGLE(post.slug)}
        className="flex gap-4 py-3 text-left"
      >
        {/* Thumbnail - Left */}
        <div className="w-65 h-40 shrink-0 rounded overflow-hidden relative bg-gray-100">
          {post.postMeta.proUserOnly && (
            <div className="absolute top-1 right-1 z-10">
              <div className="rounded py-0.5 px-1.5 text-xs font-semibold text-white shadow bg-primary">
                PRO
              </div>
            </div>
          )}
          <Image
            src={
              post.featuredImage?.node.sourceUrl ||
              "https://placehold.co/600x400"
            }
            alt={post.featuredImage?.node.altText || post.title}
            fill
            className="object-cover"
            unoptimized
          />
        </div>

        {/* Content - Right */}
        <div className="flex-1 min-w-0 space-y-2 text-left">
          {/* Metadata */}
          <div className="text-[14px] text-gray-500 text-left">
            {quarter} {year} • {topicTypeName}
          </div>

          {/* Title */}
          <h4 className="text-base md:text-xl font-bold text-gray-900 leading-tight text-left">
            {post.title}
          </h4>

          {/* Description */}
          <p className="text-sm text-gray-600 leading-relaxed text-left">
            {description}
          </p>
        </div>
      </ProLink>
    </article>
  );
};
