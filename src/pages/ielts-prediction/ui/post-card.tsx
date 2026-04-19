import { resolveContentImage, useContentImageFallback } from "@/shared/lib/content-image";
import Image from "next/image";
import Link from "next/link";
import { ProBadge } from "@/shared/ui/pro-badge";

export type PostCardProps = {
  image?: string;
  title: string;
  date?: string;
  isPro?: boolean;
  href?: string;
};

export const PostCard = ({ image, title, date, isPro, href }: PostCardProps) => {
  const fallbackImage = useContentImageFallback();
  const imageSrc = resolveContentImage(image, fallbackImage);
  const isLogoFallback = !image && imageSrc.includes("logo.png");

  return (
    <Link
      href={href || "#"}
      className="group flex flex-col bg-white rounded-[30px] shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-transform duration-350 ease-[var(--ease-slide)] hover:-translate-y-3.5 w-full cursor-pointer overflow-hidden"
    >
      {/* Image */}
      <div className="relative h-[200px] shrink-0 overflow-hidden bg-secondary-50 rounded-t-[30px] rounded-b-[15px]">
        {isLogoFallback && (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_var(--color-secondary-200),_white_55%,_var(--color-primary-50))]" />
        )}
        <Image
          src={imageSrc}
          alt={title}
          fill
          className={`${
            isLogoFallback
              ? "object-contain p-12 opacity-30 mix-blend-multiply"
              : "object-cover"
          } transition-transform duration-500 group-hover:scale-105`}
          loading="lazy"
          unoptimized
        />

        {/* PRO badge */}
        {isPro && (
          <ProBadge className="absolute top-3 right-3 shadow-sm" />
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col justify-between px-4 py-4 sm:px-5">
        {/* Title */}
        <h3
          className="text-[16px] font-bold text-[#202020] leading-snug line-clamp-2 group-hover:text-primary-500 transition-colors mb-6 mt-3"
          title={title}
        >
          {title}
        </h3>

        {/* Footer: brand (left) + date (right) */}
        <div className="flex items-center justify-between gap-2">
          {/* Brand */}
          <div className="flex items-center gap-[6px] min-w-0">
            <Image
              src="/red-logo.png"
              alt="IELTS Prediction"
              width={100}
              height={18}
              className="h-[18px] w-auto shrink-0"
            />
            <span className="text-[14px] font-semibold text-primary-500 truncate">
              IELTS Prediction
            </span>
          </div>

          {/* Date */}
          {date && (
            <div className="flex items-center gap-[5px] shrink-0">
              <span className="material-symbols-rounded text-[12px] text-[#9CA3AF]">
                calendar_today
              </span>
              <span className="text-[14px] text-[#6A7282]">{date}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};
