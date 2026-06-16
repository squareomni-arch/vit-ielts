import Image from "next/image";
import Link from "next/link";
import type { HeroBannerConfig } from "./types";
import { ROUTES } from "@/shared/routes";

// ─── Default Data ─────────────────────────────────────────────────────────────
const DEFAULTS: HeroBannerConfig = {
  title: {
    line1: "Hit your Band 8.0",
    line2: "with confidence.",
    highlight: "",
  },
  subtitle:
    "Personalised IELTS practice for Listening, Reading, Writing & Speaking — with real mock tests, instant scoring and feedback from expert teachers.",
  checklist: [],
  cta: { text: "Take a free mock test", link: ROUTES.EXAM.ARCHIVE },
  images: {
    screen: "/assets/figma/hero-mascot.png",
    mascot: "/assets/figma/hero-mascot.png",
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export type HeroBannerProps = {
  config?: HeroBannerConfig;
  totalTests?: number;
};

export const HeroBanner = ({ config, totalTests }: HeroBannerProps) => {
  // Per design decision (2026-06-09): the new Figma landing copy + mascot are the
  // canonical hero content — the legacy CMS "home/hero-banner" config held old-site
  // text/images, so heading/subtitle/mascot are no longer driven by it. Admin may
  // still override the primary CTA link.
  let ctaLink = config?.cta?.link || DEFAULTS.cta.link;
  if (
    typeof ctaLink === "string" &&
    (ctaLink === "https://www.vitieltstest.com/ielts-exam-library" ||
      ctaLink === "https://vitieltstest.com/ielts-exam-library" ||
      ctaLink.includes("vitieltstest.com/ielts-exam-library"))
  ) {
    ctaLink = ROUTES.EXAM.ARCHIVE;
  }

  const c: HeroBannerConfig = {
    ...DEFAULTS,
    cta: {
      text: DEFAULTS.cta.text,
      link: ctaLink,
    },
  };

  return (
    <section data-section="hero-banner" className="w-full">
      {/* White rounded card — Figma: bg-white rounded-[50px] shadow, px-64px py-56px */}
      <div className="bg-white rounded-[24px] sm:rounded-[36px] lg:rounded-[50px] shadow-[0px_4px_20px_0px_rgba(0,0,0,0.1)] overflow-hidden">
        <div className="flex flex-col lg:flex-row items-center gap-12 px-8 sm:px-12 lg:px-16 py-12 lg:py-14 relative min-h-[440px]">

          {/* ── Left: text content ── */}
          <div className="flex flex-col items-start w-full lg:w-auto flex-1 min-w-0 relative z-10">

            {/* Social-proof pill — Figma: bg-white border shadow rounded-full px-14px py-8px gap-8px */}
            <div className="inline-flex items-center gap-2 bg-white border border-[rgba(25,29,36,0.1)] shadow-[0px_2px_6px_0px_rgba(25,29,36,0.1)] rounded-full px-[14px] py-2 mb-[18px]">
              {/* Green dot — Figma: Ellipse 8px filled #b3e653 */}
              <div className="w-2 h-2 rounded-full bg-[#b3e653] shrink-0" />
              <span className="font-inter font-bold text-[12px] text-[#191d24] tracking-[0.96px] uppercase whitespace-nowrap">
                LOVED BY 28,000+ STUDENTS
              </span>
            </div>

            {/* H1 — Figma: Display/L 60px Be Vietnam Pro Bold lh-1.04 tracking-[-1.8px] w-560px */}
            <h1 className="font-display font-bold text-[48px] sm:text-[56px] lg:text-[60px] leading-[1.04] tracking-[-1.8px] text-[#191d24] mb-4 max-w-[560px]">
              <span className="block">{c.title.line1}</span>
              <span className="block">{c.title.line2}</span>
            </h1>

            {/* Subtitle — Figma: Body/L 18px Inter Regular lh-1.5 w-470px #6a7282 */}
            <p className="font-inter font-normal text-[18px] leading-[1.5] text-[#6a7282] max-w-[700px] mb-7">
              {c.subtitle}
            </p>

            {/* CTA buttons — Figma: gap-14px */}
            <div className="flex flex-wrap items-center gap-[14px] mb-[30px]">
              {/* Primary: bg-[#b3e653] rounded-full px-26 py-15 */}
              <Link
                href={c.cta.link}
                className="inline-flex items-center gap-2 bg-[#b3e653] hover:bg-[#9ad534] text-[#191d24] font-inter font-bold text-[14px] leading-[1.2] px-[26px] py-[15px] rounded-full transition-colors duration-200 whitespace-nowrap"
              >
                {c.cta.text}
              </Link>
              {/* Secondary: white border */}
              <Link
                href={ROUTES.PRACTICE.ARCHIVE_LISTENING}
                className="inline-flex items-center gap-2 bg-white hover:bg-[#f6f7f4] border-[1.5px] border-[rgba(25,29,36,0.1)] text-[#191d24] font-inter font-bold text-[14px] leading-[1.2] px-[26px] py-[15px] rounded-full transition-colors duration-200 whitespace-nowrap"
              >
                Browse courses
              </Link>
            </div>

            {/* Stats row — Figma: gap-34px, each col gap-2px. On mobile wrap +
                tighter gap so the three stats stay within the card padding. */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 sm:gap-[34px]">
              <div className="flex flex-col gap-[2px] whitespace-nowrap">
                <span className="font-display font-bold text-[24px] leading-[1.2] tracking-[-0.24px] text-[#191d24]">+1.5</span>
                <span className="font-inter font-normal text-[14px] leading-[1.4] text-[#6a7282]">avg. band uplift</span>
              </div>
              <div className="flex flex-col gap-[2px] whitespace-nowrap">
                <span className="font-display font-bold text-[24px] leading-[1.2] tracking-[-0.24px] text-[#191d24]">
                  {totalTests && totalTests > 0 ? `${totalTests}+` : "920+"}
                </span>
                <span className="font-inter font-normal text-[14px] leading-[1.4] text-[#6a7282]">practice tests</span>
              </div>
              <div className="flex flex-col gap-[2px]">
                {/* Star row — Figma: gap-5px, star icon ~25px */}
                <div className="flex items-center gap-[5px]">
                  <span className="font-display font-bold text-[24px] leading-[1.2] tracking-[-0.24px] text-[#191d24] whitespace-nowrap">4.9</span>
                  <span className="text-[#b3e653] text-[22px] leading-none">★</span>
                </div>
                <span className="font-inter font-normal text-[14px] leading-[1.4] text-[#6a7282] whitespace-nowrap">student rating</span>
              </div>
            </div>
          </div>

          {/* ── Right: HeroArt — Figma: 381×440px, 3 ellipses + mascot ── */}
          <div className="relative shrink-0 w-full lg:w-[381px] h-[280px] sm:h-[360px] lg:h-[440px]" style={{ position: 'relative' }}>
            {/* Large green ellipse — Figma: 357.887px, left-22.94px top-0 */}
            <div
              className="absolute rounded-full pointer-events-none"
              style={{
                width: 358,
                height: 358,
                top: 0,
                left: 23,
                background: "#b3e653",
              }}
            />
            {/* Small green ellipse bottom-left — Figma: 122.684px, left-0.45px top-239.49px */}
            <div
              className="absolute rounded-full pointer-events-none"
              style={{
                width: 123,
                height: 123,
                top: 239,
                left: 0,
                background: "#b3e653",
              }}
            />
            {/* Small green ellipse top-right — Figma: 122.684px, left-304.17px top-0 */}
            <div
              className="absolute rounded-full pointer-events-none"
              style={{
                width: 123,
                height: 123,
                top: 0,
                left: 304,
                background: "#b3e653",
              }}
            />
            {/* Mascot image — Figma: absolute 360×422px at left-0.45 top-28.44 */}
            <div className="absolute z-10 inset-0" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
              <Image
                src={c.images.mascot}
                alt="IELTS Mascot"
                fill
                className="object-contain object-center"
                priority
              />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
