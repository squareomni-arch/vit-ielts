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
    <TestCard
      image={post.featuredImage?.node.sourceUrl}
      title={post.title}
      skill={skill as 'reading' | 'listening' | 'speaking' | 'writing'}
      part={topicTypeName}
      isPro={post.postMeta.proUserOnly}
      href={ROUTES.SAMPLE_ESSAY.SINGLE(post.slug)}
      isLocked={post.postMeta.proUserOnly} // Assuming locked if pro only, though typically useAuth is needed
    />
  );
};
