import { useMemo, useState } from "react";
import type { DailyActivity } from "../api";
import type { WeekRow } from "../hooks/useStreakData";
import styles from "./streak-calendar.module.css";

type Props = {
  weeks: WeekRow[];
  activities: DailyActivity[];
  currentMonth: { year: number; month: number };
};

export const WeeklyStats = ({ weeks, activities, currentMonth }: Props) => {
  const [selectedWeek, setSelectedWeek] = useState(0);

  // Build activity map for quick lookup
  const activityMap = useMemo(
    () => new Map(activities.map((a) => [a.date, a])),
    [activities]
  );

  // Only show weeks that belong to the current month
  const currentMonthWeeks = useMemo(() => {
    return weeks.map((week, idx) => ({
      index: idx,
      days: week.filter((d) => d.isCurrentMonth),
    })).filter((w) => w.days.length > 0);
  }, [weeks]);

  // Ensure selected week is valid
  const safeSelectedWeek = Math.min(selectedWeek, currentMonthWeeks.length - 1);
  const activeWeek = currentMonthWeeks[safeSelectedWeek];

  // Calculate week totals
  const weekTotals = useMemo(() => {
    if (!activeWeek) return { reading: 0, listening: 0, total: 0 };
    return activeWeek.days.reduce(
      (acc, day) => {
        const a = activityMap.get(day.date);
        return {
          reading: acc.reading + (a?.reading ?? 0),
          listening: acc.listening + (a?.listening ?? 0),
          total: acc.total + (a?.total ?? 0),
        };
      },
      { reading: 0, listening: 0, total: 0 }
    );
  }, [activeWeek, activityMap]);

  if (currentMonthWeeks.length === 0) {
    return <div style={{ color: "#9ca3af", textAlign: "center", padding: 24 }}>Không có dữ liệu</div>;
  }

  return (
    <div>
      {/* Week selector */}
      <div className={styles.weekSelector}>
        {currentMonthWeeks.map((week, idx) => (
          <button
            key={idx}
            className={`${styles.weekBtn} ${idx === safeSelectedWeek ? styles.weekBtnActive : ""}`}
            onClick={() => setSelectedWeek(idx)}
          >
            Tuần {idx + 1}
          </button>
        ))}
      </div>

      {/* Stats table */}
      <table className={styles.statsTable}>
        <thead>
          <tr>
            <th>Ngày</th>
            <th>📖 Reading</th>
            <th>🎧 Listening</th>
          </tr>
        </thead>
        <tbody>
          {activeWeek?.days.map((day) => {
            const a = activityMap.get(day.date);
            const dateLabel = `${day.dayOfMonth}/${String(currentMonth.month).padStart(2, "0")}`;
            return (
              <tr key={day.date}>
                <td>{dateLabel}</td>
                <td className={!a?.reading ? styles.noActivity : ""}>
                  {a?.reading || "—"}
                </td>
                <td className={!a?.listening ? styles.noActivity : ""}>
                  {a?.listening || "—"}
                </td>
              </tr>
            );
          })}
          {/* Totals row */}
          <tr>
            <td>Tổng</td>
            <td>{weekTotals.reading}</td>
            <td>{weekTotals.listening}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};
