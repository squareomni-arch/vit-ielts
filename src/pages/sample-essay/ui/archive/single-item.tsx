import Image from "next/image";
import { SampleEssayProps } from "../..";
import _ from "lodash";
import { ROUTES } from "@/shared/routes";
import { ProLink } from "@/shared/ui";

const PART_COLORS = [
  "rgb(255, 164, 27)", // Part 1 / Task 1 / Passage 1
  "rgb(86, 95, 204)", // Part 2 / Task 2 / Passage 2
  "rgb(184, 143, 217)", // Part 3
  "rgb(100, 200, 150)", // Part 4 (for listening)
];

const FILTER_CONFIGS = {
  speakingParts: [
    { slug: "part-1", name: "Part 1" },
    { slug: "part-2", name: "Part 2" },
    { slug: "part-3", name: "Part 3" },
  ],
  writingTasks: [
    { slug: "task-1", name: "Task 1" },
    { slug: "task-2", name: "Task 2" },
  ],
  listeningParts: [
    { slug: "part-1", name: "Part 1" },
    { slug: "part-2", name: "Part 2" },
    { slug: "part-3", name: "Part 3" },
    { slug: "part-4", name: "Part 4" },
  ],
  readingPassages: [
    { slug: "passage-1", name: "Passage 1" },
    { slug: "passage-2", name: "Passage 2" },
    { slug: "passage-3", name: "Passage 3" },
  ],
};

export const DefaultView = ({
  post: { node: post },
  skill,
}: {
  post: SampleEssayProps["sampleEssays"]["edges"][number];
  skill: SampleEssayProps["skill"];
}) => {
  const getFieldInfo = () => {
    switch (skill) {
      case "speaking":
        const speakingPart = post.speakingSampleEssayFields?.part || [
          "part-1",
          "Part 1",
        ];
        const speakingIndex = FILTER_CONFIGS.speakingParts.findIndex(
          (p) => p.slug === speakingPart[0]
        );
        return {
          label: speakingPart[1],
          colorIndex: speakingIndex >= 0 ? speakingIndex : 0,
        };
      case "writing":
        const task = post.writingSampleEssayFields?.task || [
          "task-1",
          "Task 1",
        ];
        const taskIndex = FILTER_CONFIGS.writingTasks.findIndex(
          (t) => t.slug === task[0]
        );
        return {
          label: task[1],
          colorIndex: taskIndex >= 0 ? taskIndex : 0,
        };
      default:
        return { label: "", colorIndex: 0 };
    }
  };

  const getListItems = () => {
    switch (skill) {
      case "speaking":
        return (
          post.speakingSampleEssayFields?.questionType?.map((item) => item) ||
          []
        );
      case "writing":
        return post.writingSampleEssayFields?.topic?.map((item) => item) || [];
      default:
        return [];
    }
  };

  const { label, colorIndex } = getFieldInfo();
  const listItems = getListItems();

  // Original vertical card layout for all skills (including Writing and Speaking on home page)
  return (
    <article className="rounded-lg shadow overflow-hidden h-full group relative">
      <ProLink
        title={post.title}
        isPro={post.postMeta?.proUserOnly ?? false}
        href={ROUTES.SAMPLE_ESSAY.SINGLE(post.slug)}
        className="text-left"
      >
        <div className="aspect-3/2 overflow-hidden relative block">
          {post.postMeta?.proUserOnly && (
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
          {label && (
            <span
              className="absolute bottom-0 left-0 z-10 px-2 text-xs font-nunito font-bold py-1 text-white rounded-r-full"
              style={{
                backgroundColor: PART_COLORS[colorIndex],
              }}
            >
              {label}
            </span>
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
        <div className="p-3 space-y-2">
          <h4 className="md:line-clamp-1 md:text-base font-bold font-nunito">
            {post.title}
          </h4>
          <ul className="text-xs list-disc pl-4">
            {listItems.slice(0, 3).map((item, index) => (
              <li key={index}>{_.capitalize(item)}</li>
            ))}
          </ul>
        </div>
        <div className="absolute inset-0 bg-white z-10 group-hover:opacity-100 opacity-0 duration-200 p-4 space-y-2">
          <h4 className="text-base font-bold font-nunito">{post.title}</h4>
          <ul className="text-xs list-disc pl-4">
            {listItems.map((item, index) => (
              <li key={index}>{_.capitalize(item)}</li>
            ))}
          </ul>
        </div>
      </ProLink>
    </article>
  );
};
