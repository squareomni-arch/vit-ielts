import Image from "next/image";

export type CTABannerProps = {
  /** Main heading text */
  title: string;
  /** Supporting description */
  subtitle?: string;
  /** Button label */
  ctaText?: string;
  /** Button destination URL */
  ctaHref?: string;
  /** Click handler (if no href) */
  onCtaClick?: () => void;
  /** Mascot image path */
  mascotSrc?: string;
  /** Additional CSS class on outermost element */
  className?: string;
};

export const CTABanner = ({
  title,
  subtitle,
  ctaText = 'Nâng cấp Premium',
  ctaHref,
  onCtaClick,
  mascotSrc = '/assets/figma/icons/mascot.png',
  className = '',
}: CTABannerProps) => {
  const buttonContent = (
    <span className="font-noto-sans font-bold text-[#D94A56] text-sm min-[1025px]:text-[1.25cqi] whitespace-nowrap">
      {ctaText}
    </span>
  );

  const buttonClass = "inline-flex items-center justify-center px-6 py-3 !rounded-[50px] bg-white border-none cursor-pointer no-underline transition-all duration-150 ease-out hover:bg-[#F8F9FA] hover:shadow-[0_4px_6px_rgba(0,0,0,0.07)] hover:-translate-y-[1px] active:scale-[0.98]";

  return (
    <section className={`relative w-full overflow-visible flex justify-center px-4 sm:px-0 ${className}`.trim()}>
      {/* Red shape wrapper */}
      <div className="@container relative w-full max-w-[1360px] bg-[#D94A56] rounded-3xl min-[1025px]:rounded-[999px] py-8 min-[600px]:py-10 overflow-visible">
        {/* Dot pattern overlay */}
        <div
          className="absolute inset-0 rounded-3xl min-[1025px]:rounded-[999px] pointer-events-none z-[1]"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(255, 255, 255, 0.25) 4px, transparent 4.5px)",
            backgroundSize: "24px 24px"
          }}
        />

        {/* Layout wrapper:
            <600px: flex-col (text top, mascot bottom)
            600–1024px: flex-row (text left, mascot right)
            ≥1025px: flex-row with cqi + absolute mascot
        */}
        <div className="relative z-[2] flex flex-col min-[600px]:flex-row min-[600px]:items-center min-[600px]:justify-between w-full h-full">
          {/* Text content group */}
          <div className="flex flex-col justify-center items-start gap-4 min-[1025px]:gap-[2cqi] px-6 pt-2 pb-4 min-[600px]:py-0 min-[1025px]:px-0 min-[1025px]:ml-[12.625cqi] min-[1025px]:max-w-[55%]">
            <div className="flex flex-col gap-2">
              <h2 className="font-noto-sans font-extrabold text-white text-xl sm:text-2xl min-[1025px]:text-[2.875cqi] leading-tight min-[1025px]:leading-[1.37] m-0">
                {title}
              </h2>
              {subtitle && (
                <p className="font-noto-sans font-medium text-white text-sm min-[1025px]:text-[1.25cqi] leading-relaxed min-[1025px]:leading-[1.35] m-0">
                  {subtitle}
                </p>
              )}
            </div>

            {/* Button */}
            {ctaHref ? (
              <a href={ctaHref} className={buttonClass}>
                {buttonContent}
              </a>
            ) : (
              <button type="button" onClick={onCtaClick} className={buttonClass}>
                {buttonContent}
              </button>
            )}
          </div>

          {/* Mascot area */}
          {mascotSrc && (
            <>
              {/* Mobile + Tablet mascot (≤1024px) — in flow */}
              <div className="min-[1025px]:hidden flex justify-end items-end pr-6 min-[600px]:pr-8">
                <Image
                  src={mascotSrc}
                  alt="IELTS Prediction Mascot"
                  className="object-contain drop-shadow-[4px_0px_4px_rgba(0,0,0,0.25)]"
                  width={220}
                  height={220}
                  unoptimized
                />
              </div>
              {/* Desktop mascot (≥1025px) — absolute overflow */}
              <div className="hidden min-[1025px]:block absolute right-[5cqi] bottom-[-25%] w-[32cqi] h-[32cqi] z-[3] pointer-events-none">
                <Image
                  src={mascotSrc}
                  alt="IELTS Prediction Mascot"
                  className="absolute bottom-0 left-1/2 w-[30cqi] min-h-[350px] h-auto object-cover drop-shadow-[4px_0px_4px_rgba(0,0,0,0.25)] pointer-events-auto origin-bottom transition-transform duration-500 ease-out hover:scale-[1.1] hover:rotate-4 hover:drop-shadow-[6px_4px_8px_rgba(0,0,0,0.2)] -translate-x-1/2"
                  width={450}
                  height={380}
                  unoptimized
                />
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
};
