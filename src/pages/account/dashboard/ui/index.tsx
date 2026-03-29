import { TargetScore, PracticeHistory } from "@/widgets";
import { StudyStreak } from "@/widgets/study-streak";
import { MyProfileLayout } from "@/widgets/layouts";

export const PageDashboard = () => {
  return (
    <div className="space-y-6">
      {/* Target Score and Exam Date */}
      <TargetScore />

      {/* Study Streak Calendar */}
      <section className="mt-8">
        <h5 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-5">
          Biểu đồ chăm chỉ
        </h5>
        <StudyStreak />
      </section>

      {/* Practice History Section */}
      <section className="mt-8">
        <h5 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-5">
          Practice History
        </h5>
        <PracticeHistory />
      </section>
    </div>
  );
};

PageDashboard.Layout = MyProfileLayout;
