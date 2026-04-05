import Image from "next/image";
import Link from "next/link";
import { twMerge } from "tailwind-merge";

export interface CategoryCardProps {
  title: string;
  icon: string;
  bg: string;
  color: string;
  href?: string;
  className?: string;
}

export const CategoryCard = ({
  title,
  icon,
  bg,
  color,
  href = "#",
  className,
}: CategoryCardProps) => {
  return (
    <Link
      href={href}
      className={twMerge(
        "group relative w-full aspect-[496/320] overflow-hidden rounded-[20px] shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between p-6 lg:p-[30px] isolate outline-none",
        className
      )}
      style={{
        // 100% foolproof fix for Safari/Chromium overflow-hidden corner glitch during scale transform
        WebkitMaskImage: "-webkit-radial-gradient(white, black)",
        transform: "translateZ(0)",
      }}
    >
      {/* Background Full Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src={bg}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
      </div>

      {/* Colored Gradient Layer */}
      <div
        className={twMerge(
          "absolute inset-0 z-0 bg-gradient-to-r mix-blend-normal opacity-80 transition-opacity duration-500 ease-in-out group-hover:opacity-0",
          color
        )}
      />

      {/* Dark Gradient Overlay for Hover */}
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 transition-opacity duration-500 ease-in-out group-hover:opacity-100 pointer-events-none" />

      {/* Flex Layer (replaces absolute offsets) */}
      <div className="relative z-10 flex flex-col h-full justify-between items-start pointer-events-none w-full">
        {/* Icon Image */}
        <div className="w-full flex justify-end">
          <div className="w-[36.5%] max-w-[181px] aspect-square relative transition-transform duration-500 ease-in-out origin-center group-hover:scale-[1.25] group-hover:opacity-20">
            <Image
              src={icon}
              alt={title}
              fill
              className="object-contain brightness-0 invert drop-shadow-sm transition-opacity duration-500"
            />
          </div>
        </div>

        {/* Title */}
        <h3 className="text-white text-2xl md:text-[28px] font-bold drop-shadow-sm w-[75%] md:w-[65%] leading-tight transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:-translate-y-[54px]">
          {title}
        </h3>
      </div>

      {/* Bottom White Bar (Slides IN on hover) */}
      <div className="absolute -bottom-[2px] left-0 right-0 h-[56px] pb-[2px] bg-white translate-y-[100%] transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:translate-y-0 flex items-center justify-end px-6 lg:px-[30px] z-10 pointer-events-none">
        <span className="text-gray-900 font-bold text-sm md:text-[16px]">
          Xem thêm
        </span>
      </div>
    </Link>
  );
};
