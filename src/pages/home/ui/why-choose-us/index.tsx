import Image from "next/image";
import type { WhyChooseUsConfig } from "./types";

// ─── Default Data ─────────────────────────────────────────────────────────────
const DEFAULTS: WhyChooseUsConfig = {
  badge: "Tại sao chọn chúng tôi?",
  title: "Luyện thi IELTS Trên Giao Diện Thi Thật",
  description:
    "IPT cung cấp bộ đề thi thật tập trung vào các dạng câu hỏi xuất hiện thường xuyên, chủ đề lặp lại và cấu trúc đề được ghi nhận từ thí sinh thi gần đây, giúp người học luyện tập hiệu quả, tránh học lan man và tiết kiệm thời gian ôn tập.",
  stats: [
    { icon: "/assets/figma/icons/LovedbyStudents.svg", number: "5,000+", label: "HỌC VIÊN YÊU THÍCH", bgColor: "#D94A56" },
    { icon: "/assets/figma/icons/Aim.svg", number: "1,000+", label: "HỌC VIÊN ĐẠT AIM", bgColor: "#219653" },
    { icon: "/assets/figma/icons/Legit.svg", number: "20+", label: "ĐỀ THI THẬT", bgColor: "#5281F9" },
    { icon: "/assets/figma/icons/Goal.svg", number: "100+", label: "HỌC VIÊN ĐẠT 8.0", bgColor: "#FC945A" },
  ],
};

// ─── StatCard ─────────────────────────────────────────────────────────────────

const StatCard = ({
  icon,
  number,
  label,
  bgColor,
  className = "",
}: {
  icon: string;
  number: string;
  label: string;
  bgColor: string;
  className?: string;
}) => (
  <div className={`group relative w-full sm:w-[350px] h-[200px] rounded-[100px] overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.06)] bg-white flex items-center transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(0,0,0,0.12)] border border-gray-50/50 cursor-default ${className}`}>

    {/* Sweep Background */}
    <div
      className="absolute inset-0 w-full h-full origin-left scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100 z-0"
      style={{ backgroundColor: bgColor }}
    />

    {/* Icon Container */}
    <div className="absolute left-[-24px] top-1/2 -translate-y-1/2 w-[178px] h-[178px] shrink-0 z-10 transition-all duration-300 group-hover:brightness-0 group-hover:invert">
      <Image src={icon} alt={label} fill className="object-contain" unoptimized />
    </div>

    {/* Text Container */}
    <div className="flex flex-col items-center justify-center flex-1 pl-[135px] pr-8 relative z-10">
      <div className="text-[36px] font-extrabold text-[#111827] group-hover:text-white transition-colors duration-300 leading-none mb-3">
        {number}
      </div>
      <div className="text-[15px] font-semibold text-gray-700 group-hover:text-white/90 transition-colors duration-300 uppercase text-center leading-snug max-w-[140px]">
        {label}
      </div>
    </div>
  </div>
);

// ─── Component ────────────────────────────────────────────────────────────────

interface WhyChooseUsProps {
  config?: WhyChooseUsConfig;
}

export const WhyChooseUs = ({ config }: WhyChooseUsProps) => {
  const c = { ...DEFAULTS, ...config };
  const stats = c.stats?.length ? c.stats : DEFAULTS.stats;

  // Split stats: first 2 = left, last 2 = right
  const leftStats = stats.slice(0, 2);
  const rightStats = stats.slice(2, 4);

  return (
    <div data-section="why-choose-us" className="bg-white py-16 lg:py-24 overflow-hidden">
      <div className="max-w-[1492px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 xl:gap-16">

          {/* ── Left Column: 2 Cards ── */}
          <div className="flex flex-col gap-6 lg:gap-8 w-full lg:w-auto items-center">
            {leftStats.map((stat, i) => (
              <StatCard
                key={i}
                icon={stat.icon}
                number={stat.number}
                label={stat.label}
                bgColor={stat.bgColor}
                className={i === 1 ? "lg:translate-x-[39px]" : ""}
              />
            ))}
          </div>

          {/* ── Center Column: Content ── */}
          <div className="flex-1 flex flex-col items-center text-center max-w-2xl mx-auto order-first lg:order-none mb-8 lg:mb-0">
            {/* Badge */}
            <div className="inline-flex items-center justify-center px-6 py-2 bg-[#C3D4FF] text-[#5281F9] text-sm font-bold rounded-[60px] mb-8 uppercase tracking-wide">
              {c.badge}
            </div>

            {/* Title */}
            <h2 className="text-[32px] sm:text-[40px] font-extrabold text-[#1E293B] leading-tight mb-6">
              {c.title}
            </h2>

            {/* Description */}
            <p className="text-[#64748B] text-base md:text-lg leading-relaxed max-w-xl mx-auto font-noto-sans font-medium">
              {c.description}
            </p>
          </div>

          {/* ── Right Column: 2 Cards ── */}
          <div className="flex flex-col gap-6 lg:gap-8 w-full lg:w-auto items-center">
            {rightStats.map((stat, i) => (
              <StatCard
                key={i}
                icon={stat.icon}
                number={stat.number}
                label={stat.label}
                bgColor={stat.bgColor}
                className={i === 1 ? "lg:-translate-x-[39px]" : ""}
              />
            ))}
          </div>

        </div>
      </div>
    </div>
  );
};
