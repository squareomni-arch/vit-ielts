import { IPracticeSingle } from "@/pages/ielts-practice-single/api";

function Passage({
  passage,
  quizSkill,
}: {
  passage: IPracticeSingle["quizFields"]["passages"][number];
  quizSkill: IPracticeSingle["quizFields"]["skill"][0];
}) {
  return (
    <section>
      <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold mb-[15px]">
        {quizSkill === "listening" ? "Listening" : "📖 Reading passage"}
      </h2>
      <div
        className="prose max-w-none prose-sm sm:prose-base"
        dangerouslySetInnerHTML={{ __html: passage.passage_content }}
      ></div>
    </section>
  );
}

export default Passage;
