import { Tooltip } from "antd";
import type { WeekRow } from "../hooks/useStreakData";
import styles from "./streak-calendar.module.css";

type Props = {
  weeks: WeekRow[];
  currentMonth: { year: number; month: number };
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  loading: boolean;
};

const DAY_HEADERS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

const MONTH_NAMES = [
  "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4",
  "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8",
  "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12",
];

export const StreakCalendar = ({
  weeks,
  currentMonth,
  onPrevMonth,
  onNextMonth,
  onToday,
  loading,
}: Props) => {
  const monthLabel = `${MONTH_NAMES[currentMonth.month - 1]} / ${currentMonth.year}`;

  return (
    <div>
      {/* Header: month name + navigation */}
      <div className={styles.calendarHeader}>
        <div className={styles.calendarTitle}>{monthLabel}</div>
        <div className={styles.calendarNav}>
          <button
            className={styles.navBtn}
            onClick={onPrevMonth}
            title="Tháng trước"
          >
            ‹
          </button>
          <button
            className={`${styles.navBtn} ${styles.todayBtn}`}
            onClick={onToday}
          >
            Hôm nay
          </button>
          <button
            className={styles.navBtn}
            onClick={onNextMonth}
            title="Tháng sau"
          >
            ›
          </button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className={styles.calendarGrid}>
        {/* Day of week headers */}
        {DAY_HEADERS.map((day) => (
          <div key={day} className={styles.dayHeader}>
            {day}
          </div>
        ))}

        {/* Calendar cells */}
        {weeks.map((week, weekIdx) =>
          week.map((day) => {
            const intensityClass =
              styles[`intensity${day.isCurrentMonth ? day.intensity : 0}` as keyof typeof styles];

            const tooltipContent = day.activity
              ? `${day.activity.reading} Reading, ${day.activity.listening} Listening`
              : null;

            const cell = (
              <div
                key={day.date}
                className={`
                  ${styles.dayCell}
                  ${day.isCurrentMonth ? styles.dayCurrentMonth : styles.dayOtherMonth}
                  ${intensityClass}
                  ${day.isToday ? styles.dayToday : ""}
                `}
                style={{ animationDelay: `${(weekIdx * 7 + week.indexOf(day)) * 0.02}s` }}
              >
                {day.dayOfMonth}
              </div>
            );

            if (tooltipContent && day.isCurrentMonth) {
              return (
                <Tooltip key={day.date} title={tooltipContent} placement="top">
                  {cell}
                </Tooltip>
              );
            }

            return cell;
          })
        )}
      </div>

      {/* Legend */}
      <div className={styles.legend}>
        <span>Ít</span>
        <div
          className={styles.legendBox}
          style={{ background: "var(--streak-0)" }}
        />
        <div
          className={styles.legendBox}
          style={{ background: "var(--streak-1)" }}
        />
        <div
          className={styles.legendBox}
          style={{ background: "var(--streak-2)" }}
        />
        <div
          className={styles.legendBox}
          style={{ background: "var(--streak-3)" }}
        />
        <span>Nhiều</span>
      </div>
    </div>
  );
};
