import Link from "next/link";
import { ROUTES } from "@/shared/routes";
import { ScrollFadeIn } from "@/shared/lib/use-scroll-fade-in";

export const CtaBanner = () => (
  <ScrollFadeIn
    data-section="cta-banner"
    className="w-full bg-surface-app pb-10"
  >
    <div className="relative bg-brand rounded-[24px] sm:rounded-[32px] lg:rounded-[40px] mt-14 px-6 py-12 sm:p-[60px] flex flex-col items-center text-center overflow-hidden">
      {/* Polka-dot pattern overlay */}
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage: "url('/assets/pattern-polka-dots.svg')",
          backgroundSize: "44px 44px",
          backgroundPosition: "top left",
        }}
      />

      {/* Title */}
      <h2 className="relative font-display font-bold text-[32px] sm:text-[38px] leading-[1.1] tracking-[-0.95px] text-ink-900 text-center">
        Your target band is closer than you think.
      </h2>

      <div className="h-[14px] shrink-0" />

      {/* Subtitle */}
      <p className="relative font-inter font-normal text-[18px] leading-[1.5] text-ink-700 text-center">
        Create a free account and take your first full mock test today — no card required.
      </p>

      <div className="h-[28px] shrink-0" />

      {/* CTAs */}
      <div className="relative flex flex-wrap items-center justify-center gap-[14px]">
        <Link
          href={ROUTES.REGISTER}
          className="inline-flex items-center gap-2 bg-ink-900 hover:bg-[#374151] text-white font-inter font-bold text-[14px] leading-[1.2] px-[26px] py-[15px] rounded-full transition-colors duration-200 whitespace-nowrap"
        >
          Get started free
        </Link>
        <Link
          href={ROUTES.SUBSCRIPTION}
          className="inline-flex items-center gap-2 bg-white hover:bg-surface-app border-[1.5px] border-border-subtle/10 text-ink-900 font-inter font-bold text-[14px] leading-[1.2] px-[26px] py-[15px] rounded-full transition-colors duration-200 whitespace-nowrap"
        >
          Talk to a teacher
        </Link>
      </div>
    </div>
  </ScrollFadeIn>
);
