import { WidgetContextProvider } from "./context";
import { DetailScore, ExamDate } from "./ui";

// === Figma: My IELTS score target + Exam schedule ===
// Geometric: Desktop = 2-col equal (each ~50%), gap 24px; Mobile = stacked
// Each section is a white card with header + content
// DetailScore card: minimal-height ~200px
// ExamDate card: minimal-height ~200px

export const TargetScore = () => {
  return (
    <WidgetContextProvider>
      <div
        className="grid grid-cols-1 lg:grid-cols-2 gap-5"
        data-section="target-score"
      >
        {/* My IELTS score target card */}
        <div
          className="bg-white rounded-xl overflow-hidden"
          style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
        >
          <DetailScore />
        </div>

        {/* Exam schedule card */}
        <div
          className="bg-white rounded-xl overflow-hidden"
          style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
        >
          <ExamDate />
        </div>
      </div>
    </WidgetContextProvider>
  );
};
