import styles from "./streak-calendar.module.css";

type Props = {
  skillTotals: {
    reading: number;
    listening: number;
    total: number;
  };
};

export const SkillBreakdown = ({ skillTotals }: Props) => {
  const total = skillTotals.total || 1; // Avoid division by zero
  const readingPct = Math.round((skillTotals.reading / total) * 100);
  const listeningPct = 100 - readingPct;

  return (
    <div>
      {/* Stacked progress bar */}
      <div className={styles.skillBar}>
        {skillTotals.reading > 0 && (
          <div
            className={`${styles.skillSegment} ${styles.skillReading}`}
            style={{ width: `${readingPct}%` }}
          />
        )}
        {skillTotals.listening > 0 && (
          <div
            className={`${styles.skillSegment} ${styles.skillListening}`}
            style={{ width: `${listeningPct}%` }}
          />
        )}
      </div>

      {/* Skill legend */}
      <div className={styles.skillLegend}>
        <div className={styles.skillItem}>
          <div className={`${styles.skillDot} ${styles.skillReading}`} />
          <span>
            Reading ({skillTotals.reading} bài — {readingPct}%)
          </span>
        </div>
        <div className={styles.skillItem}>
          <div className={`${styles.skillDot} ${styles.skillListening}`} />
          <span>
            Listening ({skillTotals.listening} bài — {skillTotals.total > 0 ? listeningPct : 0}
            %)
          </span>
        </div>
      </div>
    </div>
  );
};
