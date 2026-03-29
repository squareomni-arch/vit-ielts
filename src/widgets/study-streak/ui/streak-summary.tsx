import type { StreakSummary } from "../api";
import styles from "./streak-calendar.module.css";

type Props = {
  summary: StreakSummary;
  loading: boolean;
};

const STATS = [
  { key: "currentStreak" as const, icon: "🔥", label: "Streak hiện tại" },
  { key: "longestStreak" as const, icon: "🏆", label: "Streak dài nhất" },
  { key: "totalDays" as const, icon: "📅", label: "Tổng ngày luyện" },
  { key: "monthDays" as const, icon: "📊", label: "Tháng này" },
];

export const StreakSummaryCards = ({ summary, loading }: Props) => {
  return (
    <div className={styles.summaryGrid}>
      {STATS.map((stat) => (
        <div key={stat.key} className={styles.statCard}>
          <div className={styles.statIcon}>{stat.icon}</div>
          <div className={styles.statValue}>
            {loading ? "—" : summary[stat.key]}
          </div>
          <div className={styles.statLabel}>{stat.label}</div>
        </div>
      ))}
    </div>
  );
};
