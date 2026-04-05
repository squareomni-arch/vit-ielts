import { TargetScore, PracticeHistory } from "@/widgets";
import { StudyStreak } from "@/widgets/study-streak";
import { MyProfileLayout } from "@/widgets/layouts";
import { DashboardStats } from "./dashboard-stats";

export const PageDashboard = () => {
  return (
    <div className="space-y-6" data-section="dashboard-main">

      {/* === SECTION: Target Score + Exam Schedule === */}
      {/* Geometric: full-width card, 2-col on wide screens (TargetScore handles internally) */}
      <TargetScore />

      {/* === SECTION: Statistics Row === */}
      {/* Geometric: 3 cards, each ~1/3 parent, gap 24px → grid-cols-3 sm, stack mobile */}
      <DashboardStats />

      {/* === SECTION: Practice History Table === */}
      {/* Full width, tabs + table */}
      <section data-section="dashboard-practice-history">
        <PracticeHistory />
      </section>

      {/* === SECTION: Study Streak Calendar === */}
      {/* Full width, expandable calendar */}
      <section data-section="dashboard-streak">
        <h2 className="text-xl lg:text-2xl font-bold text-[#2D3142] mb-4">
          Biểu đồ chăm chỉ
        </h2>
        <StudyStreak />
      </section>

    </div>
  );
};

PageDashboard.Layout = MyProfileLayout;
