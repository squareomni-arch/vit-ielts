
/**
 * CourseCard — Figma node 3035:304 (Default) / 3035:320 (Hover)
 * Test/course card with gradient image area, part tag, PRO badge,
 * "Start test" pill button, and ScoreRing.
 * Hover: green border + shadow, green button, filled score ring.
 */

import { useState } from 'react';
import { twMerge } from 'tailwind-merge';

export type CourseCardProps = {
  title?: string;
  meta?: string;
  passagePart?: string;
  isPro?: boolean;
  score?: string;
  actionText?: string;
  /** Inline gradient CSS or image URL for the card header */
  imageBg?: string;
  /** Force the hover visual state (for static preview/storybook display) */
  forceHover?: boolean;
  href?: string;
  onClick?: () => void;
  className?: string;
};

export const CourseCard = ({
  title = 'Cambridge 18 — Reading Test 1',
  meta = '1,195 attempts · 60 min',
  passagePart = 'Passage 1',
  isPro = true,
  score = '8.5',
  actionText = 'Start test',
  imageBg = 'linear-gradient(128deg, #5281F9 14%, #7CA1FF 86%)',
  forceHover = false,
  href,
  onClick,
  className = '',
}: CourseCardProps) => {
  const [_hovered, setHovered] = useState(false);
  const hovered = forceHover || _hovered;
  const Tag = href ? 'a' : 'div';

  return (
    <Tag
      href={href}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={twMerge(
        'flex flex-col w-[300px] rounded-[32px] overflow-hidden',
        'border transition-all duration-300',
        href || onClick ? 'cursor-pointer' : 'cursor-default',
        className,
      )}
      style={{
        borderColor: hovered ? '#9ad534' : 'transparent',
        boxShadow: hovered
          ? '0px 10px 20px 0px rgba(0,0,0,0.1)'
          : '0px 4px 4px rgba(0,0,0,0.1)',
      }}
    >
      {/* ── Image / gradient area ── */}
      <div
        className="h-[180px] shrink-0 flex items-start justify-between p-4"
        style={{ background: imageBg }}
      >
        {/* Part tag */}
        <div className="bg-[#fc945a] flex items-center px-3 py-1.5 rounded-full shrink-0">
          <span className="font-inter font-bold text-[12px] text-white leading-[1.2]">
            {passagePart}
          </span>
        </div>

        {/* PRO badge */}
        {isPro && (
          <div className="bg-[#b3e653] flex items-center px-[11px] py-1.5 rounded-[8px] shrink-0">
            <span className="font-inter font-bold text-[12px] text-[#191d24] leading-[1.2]">
              PRO
            </span>
          </div>
        )}
      </div>

      {/* ── Body ── */}
      <div className="bg-white border-t-2 border-[#9ad534] flex flex-col gap-[6px] h-[170px] p-[20px] shrink-0">
        {/* Title + meta */}
        <div className="flex flex-col gap-[6px] flex-1">
          <p className="font-display font-bold text-[19px] leading-[1.3] text-[#191d24] line-clamp-2">
            {title}
          </p>
          <p className="font-inter text-[14px] leading-[1.4] text-[#6a7282]">
            {meta}
          </p>
        </div>

        {/* Action row */}
        <div className="flex items-center justify-between mt-auto shrink-0">
          {/* Start test button */}
          <div
            className="flex items-center gap-[6px] px-[18px] py-[11px] rounded-full transition-colors duration-300 shrink-0"
            style={{ background: hovered ? '#9ad534' : '#191d24' }}
          >
            <img
              src="/assets/icons/PlayCircle.svg"
              width={24}
              height={24}
              alt=""
              className="shrink-0"
            />
            <span className="font-inter font-bold text-[14px] text-white leading-[1.2]">
              {actionText}
            </span>
          </div>

          {/* Score ring */}
          <div
            className="flex items-center justify-center rounded-full w-[54px] h-[54px] transition-all duration-300 shrink-0"
            style={{
              background: hovered ? '#b3e653' : 'white',
              border: hovered ? 'none' : '2.5px solid #b3e653',
            }}
          >
            <span
              className="font-inter text-[16px] leading-[1.5] transition-colors duration-300"
              style={{
                fontWeight: hovered ? 900 : 700,
                color: hovered ? 'white' : '#191d24',
              }}
            >
              {score}
            </span>
          </div>
        </div>
      </div>
    </Tag>
  );
};
