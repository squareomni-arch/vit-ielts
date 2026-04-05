// === SECTION: Dashboard Stats Cards ===
// Figma: 3 horizontal stat cards — orange, blue, green
// Geometric: desktop 3-col grid, gap ~24px; mobile 1-col stacked
//   Each card: icon circle (left) + label + value (right)
//   Colors: Orange #FC945A, Blue #2F80ED, Green #27AE60

type StatItem = {
  icon: React.ReactNode;
  label: string;
  value: string;
  bgColor: string;
  iconBgColor: string;
};

const ClockIcon = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="2" />
    <path
      d="M12 7v5l3 3"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const TestIcon = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <rect x="4" y="3" width="16" height="18" rx="2" stroke="white" strokeWidth="2" />
    <path
      d="M8 8h8M8 12h8M8 16h5"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path d="M17 14l1.5 1.5L21 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const TrophyIcon = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M8 21h8M12 17v4M7 3H5a2 2 0 00-2 2v2a4 4 0 004 4h.2A5 5 0 0012 17a5 5 0 004.8-6H17a4 4 0 004-4V5a2 2 0 00-2-2h-2M7 3h10"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

type DashboardStatsProps = {
  totalTime?: string;
  totalTests?: number;
  totalScore?: number | string;
};

export const DashboardStats = ({
  totalTime = "0 Giờ 0 Phút",
  totalTests = 0,
  totalScore = 0,
}: DashboardStatsProps) => {
  const stats: StatItem[] = [
    {
      icon: <ClockIcon />,
      label: "Tổng thời gian làm test",
      value: totalTime,
      bgColor: "#FC945A",
      iconBgColor: "#F2994A",
    },
    {
      icon: <TestIcon />,
      label: "Số bài test đã hoàn thành",
      value: String(totalTests),
      bgColor: "#2F80ED",
      iconBgColor: "#2F80ED",
    },
    {
      icon: <TrophyIcon />,
      label: "Số điểm đã đạt được",
      value: String(totalScore),
      bgColor: "#27AE60",
      iconBgColor: "#219653",
    },
  ];

  return (
    <div
      data-section="dashboard-stats"
      className="grid grid-cols-1 sm:grid-cols-3 gap-4"
    >
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="flex items-center gap-4 rounded-xl px-5 py-4"
          style={{ backgroundColor: stat.bgColor }}
        >
          {/* Icon circle */}
          <div
            className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "rgba(0,0,0,0.12)" }}
          >
            {stat.icon}
          </div>
          {/* Text */}
          <div className="min-w-0">
            <p className="text-white text-sm font-medium leading-snug">
              {stat.label}
            </p>
            <p className="text-white text-lg font-bold leading-tight mt-0.5">
              {stat.value}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};
