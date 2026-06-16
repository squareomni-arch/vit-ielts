import { Anchor, ConfigProvider } from "antd";
import { IPracticeSingle } from "../../api";

function RightInteractionSidebar({ post }: { post: IPracticeSingle }) {
  const anchorItems = post.quizFields.passages
    .map((_, index) => [
      {
        key: `passage-${index + 1}`,
        href: `#passage-${index + 1}`,
        title: (
          <span className="font-medium">
            {post.quizFields.skill[0] === "listening"
              ? "Listening"
              : "📖 Reading passage"}
          </span>
        ),
      },
      {
        key: `question-${index + 1}`,
        href: `#question-${index + 1}`,
        title: <span className="font-medium">❓ List of questions</span>,
      },
      {
        key: `answer-${index + 1}`,
        href: `#answer-${index + 1}`,
        title: <span className="font-medium">✅ Answers</span>,
      },
    ])
    .flatMap((item, index) => [
      post.quizFields.passages.length > 1 && {
        key: `part-${index + 1}`,
        href: `#part-${index + 1}`,
        title: (
          <span className="font-medium text-base text-default">{`Part ${
            index + 1
          }`}</span>
        ),
      },
      ...item,
    ])
    .filter((item) => !!item);

  const Content = () => (
    <div className="space-y-2">
      <h3 className="font-semibold text-base">Table of contents</h3>
      <ConfigProvider
        theme={{
          token: {
            colorText: "#6a7282",
          },
        }}
      >
        <Anchor
          targetOffset={80}
          affix={false}
          items={[
            ...anchorItems,
            {
              key: "download-pdf",
              href: "#download-pdf",
              title: "📥 Download PDF",
            },
          ]}
        />
      </ConfigProvider>
    </div>
  );

  return (
    <>
      <div className="sticky top-8 pb-4 hidden md:block">
        <Content />
      </div>
      <div className="md:hidden p-4 rounded border border-gray-200">
        <Content />
      </div>
    </>
  );
}

export default RightInteractionSidebar;
