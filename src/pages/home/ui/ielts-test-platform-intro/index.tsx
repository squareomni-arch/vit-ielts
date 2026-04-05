import { Container } from "@/shared/ui";
import Image from "next/image";
import Link from "next/link";
import { CategoryCard } from "@/shared/ui/ds";
import type { TestPlatformIntroConfig } from "./types";

interface IeltsTestPlatformIntroProps {
  config: TestPlatformIntroConfig;
}

const PREDEFINED_CARDS = [
  {
    title: "IELTS Full Test",
    icon: "/assets/figma/icons/book (1) 1.svg",
    bg: "/assets/figma/icons/Background-1.png",
    color: "from-rose-600 to-rose-500", // Red
  },
  {
    title: "Listening Practice",
    icon: "/assets/figma/icons/listen 1.svg",
    bg: "/assets/figma/icons/Background-2.png",
    color: "from-emerald-600 to-emerald-500", // Green
  },
  {
    title: "Reading Practice",
    icon: "/assets/figma/icons/reading-book 1.svg",
    bg: "/assets/figma/icons/Background-3.png",
    color: "from-orange-600 to-orange-400", // Orange
  },
  {
    title: "Sample Writing",
    icon: "/assets/figma/icons/copywriting (1) 1.svg",
    bg: "/assets/figma/icons/Background-4.png",
    color: "from-indigo-400 to-indigo-300", // Light Blue
  },
  {
    title: "Sample Speaking",
    icon: "/assets/figma/icons/speaking 1.svg",
    bg: "/assets/figma/icons/Background-5.png",
    color: "from-amber-500 to-yellow-400", // Yellow
  },
  {
    title: "IELTS Prediction",
    icon: "/assets/figma/icons/search 1.svg",
    bg: "/assets/figma/icons/Background-6.png",
    color: "from-blue-600 to-blue-500", // Blue
  },
];

export const IeltsTestPlatformIntro = ({ config }: IeltsTestPlatformIntroProps) => {
  return (
    <div data-section="platform-intro" className="relative py-16 md:py-24 bg-[#FEF6F5]">
      <Container className="relative z-10">
        <div className="text-center mb-14 flex flex-col items-center gap-4">
          {/* Badge */}
          <span className="inline-block px-[20px] py-[12px] rounded-full text-xs font-bold tracking-wider text-[#D94A56] bg-[#D94A56]/15 uppercase">
            PREMIUM
          </span>

          {/* Main Heading */}
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-gray-800">
            Khám Phá Kho Đề <span className="text-[#D94A56]">Dự Đoán</span>
          </h2>
        </div>

        {/* Category Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-10">
          {PREDEFINED_CARDS.map((item, index) => (
            <CategoryCard
              key={index}
              title={item.title}
              icon={item.icon}
              bg={item.bg}
              color={item.color}
              href="#"
            />
          ))}
        </div>
      </Container>
    </div>
  );
};
