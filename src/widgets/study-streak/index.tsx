import { Card, Segmented, Spin } from "antd";
import { useState } from "react";
import { useStreakData } from "./hooks/useStreakData";
import {
  StreakSummaryCards,
  StreakCalendar,
  WeeklyStats,
  SkillBreakdown,
} from "./ui";
import styles from "./ui/streak-calendar.module.css";

type ViewMode = "calendar" | "weekly";

export const StudyStreak = () => {
  const [viewMode, setViewMode] = useState<ViewMode>("calendar");

  const {
    loading,
    summary,
    activities,
    calendarWeeks,
    currentMonth,
    skillTotals,
    goToPrevMonth,
    goToNextMonth,
    goToCurrentMonth,
  } = useStreakData();

  return (
    <div className={styles.streakRoot}>
      {/* Summary stat cards */}
      <StreakSummaryCards summary={summary} loading={loading} />

      <Card>
        {/* View toggle */}
        <div className={styles.viewToggle}>
          <Segmented
            value={viewMode}
            onChange={(val) => setViewMode(val as ViewMode)}
            options={[
              { label: "📅 Lịch tháng", value: "calendar" },
              { label: "📊 Theo tuần", value: "weekly" },
            ]}
            size="large"
          />
        </div>

        {/* Skill breakdown bar */}
        <div style={{ marginBottom: 20 }}>
          <SkillBreakdown skillTotals={skillTotals} />
        </div>

        {/* Main content */}
        <Spin spinning={loading}>
          {viewMode === "calendar" ? (
            <StreakCalendar
              weeks={calendarWeeks}
              currentMonth={currentMonth}
              onPrevMonth={goToPrevMonth}
              onNextMonth={goToNextMonth}
              onToday={goToCurrentMonth}
              loading={loading}
            />
          ) : (
            <WeeklyStats
              weeks={calendarWeeks}
              activities={activities}
              currentMonth={currentMonth}
            />
          )}
        </Spin>
      </Card>
    </div>
  );
};
