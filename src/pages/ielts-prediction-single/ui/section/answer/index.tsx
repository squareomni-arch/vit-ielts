import { IPracticeSingle } from "@/pages/ielts-practice-single/api";
import { extractWords } from "@/shared/lib";
import { Button } from "antd";
import { useMemo } from "react";

function Answer({
  passage,
}: {
  passage: IPracticeSingle["quizFields"]["passages"][number];
}) {
  const question = useMemo(() => passage.questions?.[0], [passage.questions]);

  if (!question) {
    return (
      <section className="space-y-6">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold">
          🔥 Answers & Explanations
        </h2>
        <p className="text-gray-400 italic">No questions available.</p>
      </section>
    );
  }

  const answer = useMemo(() => {
    switch (question.type[0]) {
      case "fillup":
        const words = extractWords(question.question || "");
        return words[0];
      case "radio":
        return question.list_of_questions?.[0].options[
          question.list_of_questions[0].correct
        ]?.content;
      case "checkbox":
        return (question.list_of_options || [])
          .filter((o) => o.correct)
          .map((_, i) => i + 1)
          .join(", ");
      case "select":
        const swords = extractWords(question.question || "");
        return swords[0];
      default:
        return "Unknown";
    }
  }, [question]);

  return (
    <section className="space-y-6">
      <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold">
        🔥 Answers & Explanations
      </h2>
      <div className="space-y-2">
        <div>
          <span className="w-7 h-7 bg-green-600 inline-flex items-center text-xs leading-none justify-center text-white rounded-full mr-2">
            {(question.startIndex || 0) + 1}
          </span>
          <p className="inline">{answer}</p>
        </div>
        <p className="text-base font-semibold">Explanation</p>
        {question.explanations?.[0]?.content ? (
          <div
            className="prose prose-sm"
            dangerouslySetInnerHTML={{ __html: question.explanations[0].content }}
          />
        ) : (
          <p className="text-gray-400 italic">No explanation available.</p>
        )}
      </div>
      <Button href="#download-pdf" variant="filled" color="primary" block>
        <span>View Full Answers & Explanations</span>
        <span className="material-symbols-rounded">chevron_right</span>
      </Button>
    </section>
  );
}

export default Answer;
