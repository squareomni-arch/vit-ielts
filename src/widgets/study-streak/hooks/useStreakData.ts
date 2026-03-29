import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/appx/providers";
import {
  fetchStreakSummary,
  fetchMonthlyActivities,
  type StreakSummary,
  type DailyActivity,
} from "../api";

export type CalendarDay = {
  date: string; // YYYY-MM-DD
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  activity: DailyActivity | null;
  intensity: 0 | 1 | 2 | 3; // 0=none, 1=light, 2=medium, 3=heavy
};

export type WeekRow = CalendarDay[];

export function useStreakData() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<StreakSummary>({
    currentStreak: 0,
    longestStreak: 0,
    totalDays: 0,
    monthDays: 0,
  });
  const [activities, setActivities] = useState<DailyActivity[]>([]);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  });

  const fetchData = useCallback(async () => {
    if (!currentUser?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [summaryData, monthData] = await Promise.all([
        fetchStreakSummary(currentUser.id),
        fetchMonthlyActivities(
          currentUser.id,
          currentMonth.year,
          currentMonth.month
        ),
      ]);
      setSummary(summaryData);
      setActivities(monthData);
    } catch (error) {
      console.error("Error fetching streak data:", error);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id, currentMonth.year, currentMonth.month]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Build calendar grid
  const calendarWeeks = buildCalendarGrid(
    currentMonth.year,
    currentMonth.month,
    activities
  );

  // Skill totals for the current month
  const skillTotals = activities.reduce(
    (acc, day) => ({
      reading: acc.reading + day.reading,
      listening: acc.listening + day.listening,
      total: acc.total + day.total,
    }),
    { reading: 0, listening: 0, total: 0 }
  );

  const goToPrevMonth = useCallback(() => {
    setCurrentMonth((prev) => {
      if (prev.month === 1) {
        return { year: prev.year - 1, month: 12 };
      }
      return { year: prev.year, month: prev.month - 1 };
    });
  }, []);

  const goToNextMonth = useCallback(() => {
    setCurrentMonth((prev) => {
      if (prev.month === 12) {
        return { year: prev.year + 1, month: 1 };
      }
      return { year: prev.year, month: prev.month + 1 };
    });
  }, []);

  const goToCurrentMonth = useCallback(() => {
    const now = new Date();
    setCurrentMonth({ year: now.getFullYear(), month: now.getMonth() + 1 });
  }, []);

  return {
    loading,
    summary,
    activities,
    calendarWeeks,
    currentMonth,
    skillTotals,
    goToPrevMonth,
    goToNextMonth,
    goToCurrentMonth,
    refetch: fetchData,
  };
}

// ============================================================================
// Helpers
// ============================================================================

function getIntensity(total: number): 0 | 1 | 2 | 3 {
  if (total === 0) return 0;
  if (total === 1) return 1;
  if (total <= 3) return 2;
  return 3;
}

function buildCalendarGrid(
  year: number,
  month: number,
  activities: DailyActivity[]
): WeekRow[] {
  const activityMap = new Map(activities.map((a) => [a.date, a]));

  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const daysInMonth = lastDay.getDate();

  // Monday=0, Sunday=6 (ISO style)
  let startDow = firstDay.getDay() - 1;
  if (startDow < 0) startDow = 6;

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(
    today.getMonth() + 1
  ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const weeks: WeekRow[] = [];
  let currentWeek: CalendarDay[] = [];

  // Fill leading days from previous month
  const prevMonth = new Date(year, month - 1, 0);
  const prevMonthDays = prevMonth.getDate();
  for (let i = startDow - 1; i >= 0; i--) {
    const d = prevMonthDays - i;
    const prevM = month - 1 === 0 ? 12 : month - 1;
    const prevY = month - 1 === 0 ? year - 1 : year;
    const dateStr = `${prevY}-${String(prevM).padStart(2, "0")}-${String(
      d
    ).padStart(2, "0")}`;
    currentWeek.push({
      date: dateStr,
      dayOfMonth: d,
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
      activity: activityMap.get(dateStr) || null,
      intensity: 0,
    });
  }

  // Fill current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(
      d
    ).padStart(2, "0")}`;
    const activity = activityMap.get(dateStr) || null;

    currentWeek.push({
      date: dateStr,
      dayOfMonth: d,
      isCurrentMonth: true,
      isToday: dateStr === todayStr,
      activity,
      intensity: getIntensity(activity?.total ?? 0),
    });

    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  // Fill trailing days from next month
  if (currentWeek.length > 0) {
    let nextD = 1;
    while (currentWeek.length < 7) {
      const nextM = month + 1 > 12 ? 1 : month + 1;
      const nextY = month + 1 > 12 ? year + 1 : year;
      const dateStr = `${nextY}-${String(nextM).padStart(2, "0")}-${String(
        nextD
      ).padStart(2, "0")}`;
      currentWeek.push({
        date: dateStr,
        dayOfMonth: nextD,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        activity: null,
        intensity: 0,
      });
      nextD++;
    }
    weeks.push(currentWeek);
  }

  return weeks;
}
