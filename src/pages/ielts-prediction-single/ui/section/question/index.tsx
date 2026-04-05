import { IPracticeSingle } from "@/pages/ielts-practice-single/api";
import { QuestionRender } from "@/shared/ui/exam";

function Question({
  passage,
}: {
  passage: IPracticeSingle["quizFields"]["passages"][number];
}) {
  return (
    <section className="space-y-6">
      <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold">
        ❓ List of questions
      </h2>
      <div className="space-y-6">
        {(Array.isArray(passage.questions) ? passage.questions : []).map((question, index) => (
          <div key={index}>
            <QuestionRender
              question={question}
              startIndex={question.startIndex}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

export default Question;
