import { Container } from "@/shared/ui";
import { Button } from "@/shared/ui/ds";
import Image from "next/image";
import type { HeroBannerConfig } from "./types";

// ─── Default Data ─────────────────────────────────────────────────────────────
const DEFAULTS: HeroBannerConfig = {
  title: {
    line1: "IELTS Prediction Test",
    line2: "Thi",
    highlight: "Thử Như Thật",
  },
  subtitle:
    "Thi thử như thật với giao diện 1:1 và kho đề sát thực tế. Bứt phá band điểm cùng hệ thống giải thích chi tiết.",
  checklist: [
    "Giao diện thi máy",
    "Cập nhật xu hướng đề",
    "Chấm chữa chi tiết, tối ưu thời gian",
  ],
  cta: { text: "Khám phá ngay", link: "/ielts-practice-library" },
  images: {
    screen: "/assets/figma/icons/screen 1.png",
    mascot: "/assets/figma/icons/like 1.png",
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export type HeroBannerProps = {
  config?: HeroBannerConfig;
};

export const HeroBanner = ({ config }: HeroBannerProps) => {
  const c = { ...DEFAULTS, ...config };

  return (
    <section
      data-section="hero-banner"
      className="relative w-full overflow-hidden bg-white min-h-[700px] flex items-center pt-24 pb-12 lg:pt-32 lg:pb-20"
      style={{
        backgroundImage:
          "linear-gradient(rgba(217,74,86,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(217,74,86,0.07) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
        backgroundPosition: "center top",
      }}
    >
      <Container className="relative z-10 w-full">
        {/* Layout 2 cột: Cột trái (Text) và Cột phải (Hình ảnh) */}
        <div className="flex flex-col lg:flex-row items-center lg:justify-center justify-between gap-12 lg:gap-20 w-full">

          {/* CỘT TRÁI: Cụm Text & CTA */}
          <div className="flex flex-col items-start z-20 w-full lg:max-w-max gap-8">
            {/* Title */}
            <h1 className="text-[40px] leading-[1.2] sm:text-[48px] lg:text-[56px] font-bold tracking-tight text-[var(--color-default)]">
              <span className="block whitespace-nowrap">{c.title.line1}</span>
              <span className="block">
                {c.title.line2}{" "}
                <span className="text-primary-500">{c.title.highlight}</span>
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-gray-400 leading-[1.6] max-w-[600px] lg:max-w-max">
              {c.subtitle}
            </p>

            {/* Checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 w-full text-base sm:text-lg text-[var(--color-default)] font-semibold">
              {c.checklist.map((item, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 whitespace-nowrap ${
                    i === c.checklist.length - 1 && c.checklist.length % 2 !== 0
                      ? "sm:col-span-2"
                      : ""
                  }`}
                >
                  <CheckCircleIcon />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <div>
              <Button
                variant="primary"
                size="lg"
                href={c.cta.link}
                className="!rounded-full px-8 py-3 h-auto text-[18px] font-bold shadow-lg shadow-primary-500/20"
              >
                {c.cta.text}
              </Button>
            </div>
          </div>

          {/* CỘT PHẢI: Mascots */}
          <div className="relative w-full max-w-[800px] h-[400px] sm:h-[500px] lg:h-[673px] flex items-center justify-center lg:justify-end shrink-0">

            {/* Máy tính (Screen) */}
            <div className="absolute top-0 right-0 w-[90%] h-[70%] sm:w-[80%] sm:h-[80%] lg:w-[800px] lg:min-h-[673px] lg:h-[673px] z-10 transition-transform duration-700 hover:scale-105">
              <Image
                src={c.images.screen}
                alt="IELTS Interface Screen"
                fill
                className="object-contain object-center"
                priority
              />
            </div>

            {/* Mascot */}
            <div className="absolute bottom-0 left-0 sm:left-[5%] lg:-left-[10%] w-[200px] h-[260px] sm:w-[280px] sm:h-[350px] lg:w-[320px] lg:h-[400px] z-20 animate-float">
              <Image
                src={c.images.mascot}
                alt="IELTS Mascot"
                fill
                className="object-contain drop-shadow-2xl"
              />
            </div>

          </div>

        </div>
      </Container>
    </section>
  );
};

// ─── SVG ──────────────────────────────────────────────────────────────────────
const CheckCircleIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
    <circle cx="12" cy="12" r="12" fill="#27AE60" />
    <path d="M7.5 12.5L10.5 15.5L16.5 9" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
