import { AppShell } from "@/widgets/layouts";
import type { ProgressOverview } from "~services/progress";

// ─── Skill display config ─────────────────────────────────────────────────────

const SKILL_COLOR: Record<string, string> = {
  listening: "#5281f9",
  reading: "#b3e653",
  writing: "#fc945a",
  speaking: "#7c6ef9",
};

const SKILL_LABEL: Record<string, string> = {
  listening: "Listening",
  reading: "Reading",
  writing: "Writing",
  speaking: "Speaking",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatCard = ({
  icon,
  iconBg,
  iconColor,
  value,
  label,
}: {
  icon: string;
  iconBg: string;
  iconColor: string;
  value: string;
  label: string;
}) => (
  <div className="flex-1 min-w-0 bg-white border border-[rgba(25,29,36,0.1)] rounded-[24px] p-[22px] flex flex-col gap-[10px]">
    <div
      className="flex items-center justify-center rounded-[12px] shrink-0 w-[42px] h-[42px]"
      style={{ background: iconBg }}
    >
      <span
        className="material-symbols-rounded text-[22px] leading-none"
        style={{ color: iconColor }}
      >
        {icon}
      </span>
    </div>
    <div className="flex flex-col gap-[2px]">
      <p className="font-display font-bold text-[24px] text-[#191d24] leading-none">{value}</p>
      <p className="font-inter font-normal text-[13px] text-[#6a7282] leading-normal">{label}</p>
    </div>
  </div>
);

const SkillBar = ({
  name,
  score,
  color,
}: {
  name: string;
  score: number;
  color: string;
}) => {
  const filled = Math.round((score / 9) * 100);
  const remaining = 100 - filled;
  return (
    <div className="flex flex-col gap-[8px] w-full">
      <div className="flex items-center justify-between w-full">
        <span className="font-inter font-semibold text-[15px] text-[#191d24]">{name}</span>
        <span className="font-inter font-bold text-[14px] text-[#191d24]">{score}</span>
      </div>
      <div className="bg-[#e5ebe0] flex h-[10px] items-center overflow-hidden rounded-full w-full">
        <div
          className="h-full rounded-full shrink-0"
          style={{ width: `${filled}%`, background: color }}
        />
        <div className="h-full" style={{ width: `${remaining}%` }} />
      </div>
    </div>
  );
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface PageMyProgressProps {
  progressOverview: ProgressOverview;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export const PageMyProgress = ({ progressOverview }: PageMyProgressProps) => {
  const { latestBand, totalTests, skillAverages, recentResults, bandTrend } =
    progressOverview;

  // ── Stat cards: only show cards backed by real data ──────────────────────
  const bandValue = latestBand !== null ? String(latestBand) : "—";
  const testsValue = String(totalTests);

  // ── Band trend chart ──────────────────────────────────────────────────────
  // Normalise bar heights to a 46–154px range (as in Figma).
  const MIN_H = 46;
  const MAX_H = 154;
  const maxBand = bandTrend.length > 0 ? Math.max(...bandTrend.map((t) => t.band)) : 9;
  const minBand = bandTrend.length > 0 ? Math.min(...bandTrend.map((t) => t.band)) : 0;
  const bandRange = maxBand - minBand || 1;

  const trendBars = bandTrend.map((t, i) => {
    const ratio = (t.band - minBand) / bandRange;
    const h = Math.round(MIN_H + ratio * (MAX_H - MIN_H));
    // The last bar(s) are "active" (green)
    const active = i >= bandTrend.length - 2;
    return { label: `W${i + 1}`, height: h, active, band: t.band };
  });

  // ── Skill bars: only render skills that have real results ────────────────
  const skillBars = skillAverages.map((s) => ({
    name: SKILL_LABEL[s.skill] ?? s.skill,
    score: s.average ?? 0,
    color: SKILL_COLOR[s.skill] ?? "#b3e653",
  }));

  return (
    <div className="space-y-[28px]">

      {/* ── Top bar ── */}
      <div>
        <h1 className="font-display font-bold text-[26px] tracking-[-0.52px] text-[#191d24] leading-none">
          My Progress
        </h1>
        <p className="mt-[6px] font-inter font-normal text-[15px] text-[#6a7282]">
          Track your bands, skills and study habits over time.
        </p>
      </div>

      {/* ── Stat cards row ── */}
      <div className="flex gap-[20px] items-stretch">
        <StatCard
          icon="trophy"
          iconBg="rgba(179,230,83,0.16)"
          iconColor="#b3e653"
          value={bandValue}
          label="Overall band"
        />
        <StatCard
          icon="assignment"
          iconBg="rgba(82,129,249,0.16)"
          iconColor="#5281f9"
          value={testsValue}
          label="Tests taken"
        />
      </div>

      {/* ── Analytics row: Band trend + By skill ── */}
      <div className="flex gap-[20px] items-stretch">

        {/* Band trend */}
        <div className="flex-1 min-w-0 bg-white border border-[rgba(25,29,36,0.1)] rounded-[24px] p-[26px] flex flex-col gap-[6px]">
          <p className="font-display font-bold text-[18px] text-[#191d24] leading-none whitespace-nowrap">
            Band trend
          </p>
          <p className="font-inter font-normal text-[13px] text-[#6a7282] whitespace-nowrap">
            Estimated band over the last 8 weeks
          </p>
          {trendBars.length > 0 ? (
            <div className="flex gap-[16px] items-end pt-[24px]">
              {trendBars.map(({ label, height, active, band }) => (
                <div
                  key={label}
                  className="flex-1 min-w-0 flex flex-col gap-[8px] items-center justify-end"
                  title={`Band ${band}`}
                >
                  <div
                    className="rounded-[8px] w-[40px] shrink-0"
                    style={{
                      height: `${height}px`,
                      background: active ? "#b3e653" : "#d9e0cf",
                    }}
                  />
                  <p className="font-inter font-medium text-[11px] text-[#6a7282] whitespace-nowrap">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="pt-[24px] font-inter text-[13px] text-[#6a7282]">
              No data yet — submit a test to see your trend.
            </p>
          )}
        </div>

        {/* By skill — only render when there is at least one skill result */}
        {skillBars.length > 0 && (
          <div className="bg-white border border-[rgba(25,29,36,0.1)] rounded-[24px] p-[26px] flex flex-col gap-[16px] shrink-0 w-[380px]">
            <p className="font-display font-bold text-[18px] text-[#191d24] leading-none whitespace-nowrap">
              By skill
            </p>
            {skillBars.map((skill) => (
              <SkillBar
                key={skill.name}
                name={skill.name}
                score={skill.score}
                color={skill.color}
              />
            ))}
          </div>
        )}

      </div>

      {/* ── Recent tests ── */}
      {recentResults.length > 0 && (
        <div className="bg-white border border-[rgba(25,29,36,0.1)] rounded-[24px] p-[26px]">
          {/* Header */}
          <div className="flex items-center justify-between pb-[8px]">
            <p className="font-display font-bold text-[18px] text-[#191d24] whitespace-nowrap">
              Recent tests
            </p>
          </div>

          {/* Rows */}
          {recentResults.map(({ id, title, meta, bandLabel }, idx) => {
            const isLast = idx === recentResults.length - 1;
            return (
              <div
                key={id}
                className={`flex items-center justify-between py-[14px] ${
                  isLast ? "" : "border-b border-[rgba(25,29,36,0.1)]"
                }`}
              >
                <div className="flex-1 min-w-0 flex flex-col gap-[2px]">
                  <p className="font-inter font-semibold text-[15px] text-[#191d24] whitespace-nowrap">
                    {title}
                  </p>
                  <p className="font-inter font-normal text-[13px] text-[#6a7282] whitespace-nowrap">
                    {meta}
                  </p>
                </div>
                <div className="bg-[#b3e653] flex items-center justify-center px-[14px] py-[6px] rounded-full shrink-0">
                  <p className="font-inter font-bold text-[13px] text-[#191d24] whitespace-nowrap">
                    {bandLabel}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};

PageMyProgress.Layout = AppShell;
