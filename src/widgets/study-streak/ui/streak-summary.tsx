import Image from "next/image";
import type { StreakSummary } from "../api";
import styles from "./streak-calendar.module.css";

type Props = {
  summary: StreakSummary;
  loading: boolean;
};

const STATS = [
  { key: "currentStreak" as const, iconSrc: "/assets/figma/icons/Aim.svg", label: "Streak hiện tại", bgColor: "#FC945A" },
  { key: "longestStreak" as const, iconSrc: "/assets/figma/icons/Goal.svg", label: "Streak dài nhất", bgColor: "#2F80ED" },
  { key: "totalDays" as const, iconSrc: "/assets/figma/icons/calendar-days 1.svg", label: "Tổng ngày", bgColor: "#27AE60" },
  { key: "monthDays" as const, iconSrc: "/assets/figma/icons/all.svg", label: "Tháng này", bgColor: "#8B5CF6" },
];

export const StreakSummaryCards = ({ summary, loading }: Props) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6">
      {STATS.map((stat) => (
        <div
          key={stat.key}
          className="flex items-stretch rounded-[36px] overflow-hidden max-w-full"
          style={{
             backgroundColor: stat.bgColor,
             border: `5px solid ${stat.bgColor}`,
          }}
        >
          {/* Icon block */}
          <div
            className="flex-shrink-0 flex items-center justify-center p-[20px] aspect-square w-[76px] h-[76px]"
          >
            <Image 
              src={stat.iconSrc} 
              alt={stat.label} 
              width={36} 
              height={36} 
              className="w-full h-full object-contain brightness-0 invert" 
            />
          </div>
          {/* Text block */}
          <div 
            className="flex flex-col justify-center px-4 py-2 min-w-0 flex-1 bg-white rounded-r-[31px]"
          >
            <p className="text-[#2D3142] font-semibold text-[13px] xl:text-[14px] whitespace-nowrap overflow-hidden text-ellipsis line-clamp-1">
              {stat.label}
            </p>
            <p className="text-2xl mt-0.5" style={{ color: stat.bgColor }}>
              {loading ? "—" : summary[stat.key]}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};
