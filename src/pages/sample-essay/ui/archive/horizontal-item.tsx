import Image from "next/image";
import { SampleEssayProps } from "../..";
import { ROUTES } from "@/shared/routes";
import { TestCard } from "@/shared/ui/ds";

export const HorizontalItem = ({
  post: { node: post },
  skill,
}: {
  post: SampleEssayProps["sampleEssays"]["edges"][number];
  skill: "writing" | "speaking";
}) => {
  const quarter = post.quarter || post.sampleEssayFields?.quarter?.[1] || "";
  const year = post.year || new Date(post.date || post.created_at || Date.now()).getFullYear();

  const getListItems = () => {
    switch (skill) {
      case "speaking":
        return (
          post.question_type ? post.question_type.split(',') : (post.speakingSampleEssayFields?.questionType?.map((item: string) => item) || [])
        );
      case "writing":
        return (
          post.topic ? post.topic.split(',') : (post.writingSampleEssayFields?.topic?.map((item: string) => item) || [])
        );
      default:
        return [];
    }
  };

  const listItems = getListItems();

  let topicTypeName = "";
  let description = post.title;

  if (skill === "writing") {
    const topicType = listItems[0] || post.task || "";
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
    const part = post.part || post.speakingSampleEssayFields?.part?.[1] || "Part";
    topicTypeName = `Part ${part.replace('Part ', '')}`;
    if (topicTypeName === "Part ") {
        topicTypeName = "Part";
    }

    // Build description for speaking
    let topicName = "";
    if (post.title.includes("Topic")) {
      const topicMatch = post.title.match(/Topic\s+(.+?)(\s+&|$)/);
      topicName = topicMatch ? topicMatch[1].trim() : "";
    }

    description = topicName
      ? `[Quý ${quarter}/${year}] Đề thi thật IELTS Speaking ${topicTypeName} - Chủ đề ${topicName} kèm bài mẫu band 8.5+, dàn ý chi tiết, từ vựng và bài tập ôn luyện.`
      : post.title;
  }

  return (
    <TestCard
      image={post.featured_image || post.featuredImage?.node?.sourceUrl}
      title={post.title}
      skill={skill as 'reading' | 'listening' | 'speaking' | 'writing'}
      part={topicTypeName}
      isPro={post.pro_user_only ?? post.postMeta?.proUserOnly ?? false}
      href={ROUTES.SAMPLE_ESSAY.SINGLE(post.slug)}
      isLocked={post.pro_user_only ?? post.postMeta?.proUserOnly ?? false}
    />
  );
};
