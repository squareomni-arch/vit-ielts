import { Container } from "@/shared/ui";
import Image from "next/image";
import Link from "next/link";
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
        <div className="text-center space-y-4 mb-14">
          {/* Badge */}
          <div className="flex justify-center">
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold tracking-wider text-[#D94A56] bg-[#D94A56]/15 uppercase">
              PREMIUM
            </span>
          </div>

          {/* Main Heading */}
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-gray-800">
            Khám Phá Kho Đề <span className="text-[#D94A56]">Dự Đoán</span>
          </h2>
        </div>

        {/* Category Cards Grid 
            Grid gap is exactly 40px (gap-10) on larger screens.
        */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-[40px]">
          {PREDEFINED_CARDS.map((item, index) => (
            <Link
              key={index}
              href={"#"} // TODO: Map to actual routes if needed
              className="group relative w-full aspect-[496/320] overflow-hidden rounded-[20px] shadow-sm hover:shadow-xl transition-all duration-300 block bg-gray-900"
            >
              {/* Background Full Image */}
              <div className="absolute inset-0">
                <Image
                  src={item.bg}
                  alt={item.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>

              {/* Colored Gradient Layer (Fades OUT on hover) */}
              <div className={`absolute inset-0 bg-gradient-to-r ${item.color} mix-blend-normal opacity-80 transition-opacity duration-500 ease-in-out group-hover:opacity-0`} />

              {/* Dark Gradient Overlay for Hover (Fades IN on hover for text readability) */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 transition-opacity duration-500 ease-in-out group-hover:opacity-100 pointer-events-none" />

              {/* Icon Layer */}
              <div className="absolute right-[30px] top-[28px] w-[36.5%] max-w-[181px] aspect-square transition-transform duration-500 ease-in-out origin-center group-hover:scale-[1.25] group-hover:opacity-20 z-10 pointer-events-none">
                <Image
                  src={item.icon}
                  alt={item.title}
                  fill
                  className="object-contain brightness-0 invert drop-shadow-sm transition-opacity duration-500" 
                />
              </div>

              {/* Title Layer */}
              <div className="absolute left-[30px] bottom-[28px] z-20 transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:-translate-y-[54px] pointer-events-none">
                <h3 className="text-white text-2xl md:text-[28px] font-bold drop-shadow-sm w-[75%] md:w-[65%] leading-tight">
                  {item.title}
                </h3>
              </div>

              {/* Bottom White Bar (Slides IN on hover) */}
              <div className="absolute bottom-0 left-0 right-0 h-[54px] bg-white translate-y-full transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:translate-y-0 flex items-center justify-end px-[30px] z-10 pointer-events-none">
                <span className="text-gray-900 font-bold text-sm md:text-[16px]">
                  Xem thêm
                </span>
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </div>
  );
};
