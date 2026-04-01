import Link from "next/link";
import type { ExamLibraryHeroConfig, BreadcrumbItem } from "../types";

/**
 * ExamLibraryHeroBanner — Hero section for IELTS exam library pages
 *
 * @figma IELTS Prediction — Exam Library Hero Banner
 * Centered layout with decorative SVG rose-petal curves background,
 * large heading with text-shadow, multi-level breadcrumb, and red accent bar.
 * Tailwind-only — NO custom CSS classes, NO <style jsx>
 */

interface ExamLibraryHeroBannerProps {
  config: ExamLibraryHeroConfig;
}

export const ExamLibraryHeroBanner = ({
  config,
}: ExamLibraryHeroBannerProps) => {
  // Build breadcrumb items from config
  const breadcrumbItems: BreadcrumbItem[] = config.breadcrumb.items?.length
    ? config.breadcrumb.items
    : [
        { label: config.breadcrumb.homeLabel, href: "/" },
        { label: config.breadcrumb.currentLabel },
      ];

  return (
    <section
      data-section="exam-library-hero-banner"
      className="relative w-full overflow-hidden bg-white"
    >
      {/* ── BG: Decorative SVG concentric curves ── */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <svg
          width="2592"
          height="2004"
          viewBox="0 0 2592 2004"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-[2592px] h-[2004px] max-w-none shrink-0"
          style={{ transform: "translateY(-35%)" }}
          aria-hidden="true"
        >
          {/* Concentric oval/petal shapes radiating outward */}
          {[0.15, 0.25, 0.35, 0.45, 0.55, 0.65, 0.75, 0.85, 0.95].map(
            (scale, i) => (
              <ellipse
                key={i}
                cx="1296"
                cy="1002"
                rx={600 * scale + 200}
                ry={500 * scale + 150}
                stroke="rgba(246, 205, 208, 0.3)"
                strokeWidth="1"
                fill="none"
                transform={`rotate(${i * 5} 1296 1002)`}
              />
            )
          )}
          {/* Additional petal curves for richness */}
          {[0.2, 0.4, 0.6, 0.8, 1.0].map((scale, i) => (
            <ellipse
              key={`inner-${i}`}
              cx="1296"
              cy="1002"
              rx={400 * scale + 100}
              ry={350 * scale + 80}
              stroke="rgba(246, 205, 208, 0.2)"
              strokeWidth="1"
              fill="none"
              transform={`rotate(${-i * 8 + 10} 1296 1002)`}
            />
          ))}
        </svg>
      </div>

      {/* ── Bottom gradient fade ── */}
      <div
        className="absolute bottom-[10px] left-0 right-0 h-[179px] pointer-events-none z-[1]"
        style={{
          background:
            "linear-gradient(0deg, #FFFFFF 0%, rgba(255, 255, 255, 0) 100%)",
        }}
      />

      {/* ── Content: Heading + Breadcrumb ── */}
      <div className="relative z-[2] flex flex-col items-center justify-center min-h-[350px] sm:min-h-[380px] md:min-h-[419px] px-4 pt-8 pb-16">
        {/* Heading */}
        <h1
          className="font-['Noto_Sans'] font-bold text-[32px] sm:text-[48px] md:text-[56px] lg:text-[64px] leading-[1.36] text-center text-[#374151] max-w-[900px]"
          style={{
            textShadow:
              "0px 4px 8px rgba(0, 0, 0, 0.15), 0px 1px 3px rgba(0, 0, 0, 0.3)",
          }}
        >
          {config.title}
        </h1>

        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="flex flex-row items-center justify-center gap-4 sm:gap-5 mt-6 sm:mt-8 flex-wrap"
        >
          {breadcrumbItems.map((item, index) => (
            <span key={index} className="flex items-center gap-4 sm:gap-5">
              {index > 0 && (
                <span className="font-['Inter'] font-medium text-[14px] sm:text-[16px] leading-[19px] text-[#374151] select-none">
                  /
                </span>
              )}
              {item.href ? (
                <Link
                  href={item.href}
                  className="font-['Inter'] font-medium text-[14px] sm:text-[16px] leading-[19px] text-[#374151] hover:text-[#D94A56] transition-colors duration-200"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="font-['Inter'] font-medium text-[14px] sm:text-[16px] leading-[19px] text-[#191D24]">
                  {item.label}
                </span>
              )}
            </span>
          ))}
        </nav>
      </div>

      {/* ── Hero Section Footer: Red accent bar ── */}
      <div className="w-full h-[10px] bg-[#D94A56] relative z-[3]" />
    </section>
  );
};
