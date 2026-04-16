import Link from 'next/link';

type BreadcrumbItem = {
  label: string;
  href?: string;
};

export type HeroBannerProps = {
  title: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  className?: string;
};

export const HeroBanner = ({ title, breadcrumbs = [], className = '' }: HeroBannerProps) => {
  return (
    <section className={`relative w-full overflow-x-hidden bg-white ${className}`}>
      {/* 1. Background sọc đỏ kẻ ô ly. Nền trắng. */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: "linear-gradient(rgba(217,74,86,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(217,74,86,0.07) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          backgroundPosition: "center top",
        }}
      />

      <div className="relative z-10 flex flex-col items-center justify-center px-4 pb-16 w-full hero-banner-inner">
        {/* 2. Title */}
        <h1
          className="font-['Noto_Sans'] font-bold text-[32px] sm:text-[48px] md:text-[56px] lg:text-[64px] leading-normal text-center text-[#374151] w-full"
          style={{ textShadow: "0 4px 8px rgba(0, 0, 0, 0.15), 0 1px 3px rgba(0, 0, 0, 0.30)" }}
        >
          {title}
        </h1>

        {/* 3. Breadcrumb text */}
        {breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="flex flex-row items-center justify-center gap-4 sm:gap-5 mt-3 sm:mt-3 flex-wrap">
            {breadcrumbs.map((item, index) => (
              <span key={index} className="flex items-center gap-4 sm:gap-5">
                {index > 0 && (
                  <span className="font-['Inter'] font-medium text-[14px] sm:text-[16px] leading-normal text-[#374151] select-none">
                    /
                  </span>
                )}
                {item.href ? (
                  <Link href={item.href} className="font-['Inter'] font-medium text-[14px] sm:text-[16px] leading-normal text-[#374151] hover:text-[#D94A56] transition-colors duration-200">
                    {item.label}
                  </Link>
                ) : (
                  <span className="font-['Inter'] font-medium text-[14px] sm:text-[16px] leading-normal text-[#374151]">
                    {item.label}
                  </span>
                )}
              </span>
            ))}
          </nav>
        )}
      </div>

      {/* 4. Line đỏ: height 10px */}
      <div className="w-full h-[10px] bg-[#D94A56] relative z-20" />
    </section>
  );
};
