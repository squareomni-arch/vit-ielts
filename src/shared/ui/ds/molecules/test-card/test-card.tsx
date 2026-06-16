import { PartTag } from '../../atoms/part-tag';
import { ProBadge } from '../../../pro-badge';
import { resolveContentImage, useContentImageFallback } from '@/shared/lib/content-image';
import { getMediaImage } from '@/shared/lib/media-image';

export type TestCardProps = {
  image?: string;
  title: string;
  subtitle?: string;
  skill?: 'reading' | 'listening' | 'speaking' | 'writing';
  author?: string;
  authorAvatar?: string;
  date?: string;
  views?: number;
  attempts?: number;
  part?: 1 | 2 | 3 | 4 | 5 | string;
  isPro?: boolean;
  isLocked?: boolean;
  score?: string | number;
  scoreClassName?: string;
  actionText?: string;
  href?: string;
  onClick?: (e: React.MouseEvent) => void;
  onScoreClick?: (e: React.MouseEvent) => void;
  className?: string;
};

const formatViews = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n));

export const TestCard = ({
  image,
  title,
  subtitle,
  skill,
  author,
  authorAvatar,
  date,
  views,
  attempts,
  part,
  isPro,
  isLocked,
  score,
  scoreClassName,
  actionText = "Start test",
  href,
  onClick,
  onScoreClick,
  className = '',
}: TestCardProps) => {
  const fallbackImage = useContentImageFallback();
  const imageSrc = resolveContentImage(image, fallbackImage);
  const isLogoFallback = !image && imageSrc.includes('logo.png');

  const Tag = href ? 'a' : 'div';
  const linkProps = href ? { href } : {};

  return (
    <Tag
      {...linkProps}
      onClick={onClick}
      className={`group flex flex-col bg-white rounded-[30px] outline-none shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-transform duration-350 ease-[var(--ease-slide)] hover:-translate-y-3.5 w-full h-full min-h-[400px] ${className} ${!href ? 'cursor-default' : 'cursor-pointer'}`}
    >
      {/* Upper Image Section — Figma spec: 356×220 */}
      <div className="relative h-[220px] shrink-0 overflow-hidden bg-secondary-50 rounded-t-[30px] rounded-b-[15px]">
        {/* Maintain nice gradient background if falling back to transparent logo */}
        {isLogoFallback && (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_var(--color-secondary-200),_white_55%,_var(--color-primary-50))]" />
        )}
        <img
          src={isLogoFallback ? imageSrc : getMediaImage(imageSrc, { width: 356, height: 220, resize: 'cover' })}
          alt={title}
          className={`absolute inset-0 w-full h-full ${isLogoFallback ? 'object-contain p-12 opacity-30 mix-blend-multiply' : 'object-cover'}`}
          loading="lazy"
        />

        {/* Overlays: Part tag (left), PRO tag (right) */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start gap-2">
          <div className="flex flex-wrap gap-2">
            {part && (
              <PartTag part={parseInt(String(part).replace(/\D/g, '')) as 1 | 2 | 3 | 4 | 5 || 1}>
                {part}
              </PartTag>
            )}
          </div>
          {isPro && (
            <ProBadge className="shadow-sm border border-white/20" />
          )}
        </div>
      </div>

      {/* Body Section */}
      <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
        <div className="space-y-[8px] mb-4">
          <h3 className="text-[17px] font-bold text-[#202020] leading-snug mb-3 group-hover:text-primary-500 transition-colors line-clamp-2">
            {title}
          </h3>
          {(subtitle || attempts !== undefined) && (
            <p className="font-['Noto_Sans'] text-[14px] font-normal leading-normal text-[#6A7282]">
              {attempts !== undefined ? `${attempts} attempts` : subtitle}
            </p>
          )}
        </div>

        {/* Action Row — shown when actionText or score is provided */}
        {(actionText || score !== undefined) && (
          <div className="mt-auto flex items-end justify-between gap-3">
            {actionText && (
              <div className="relative flex h-[49px] flex-1 min-w-0 max-w-[170px] items-center gap-[10px] px-4 rounded-[25px] border border-[rgba(128,128,128,0.55)] bg-white overflow-hidden transition-[border-color] duration-300 hover:border-[var(--color-primary-450)] pointer-events-auto group/btn">
                {/* Left-to-right fill overlay */}
                <div className="absolute inset-0 translate-x-[-100%] group-hover/btn:translate-x-0 transition-transform duration-300 ease-out bg-[var(--color-primary-450)] rounded-[25px]" />
                {/* Icon */}
                <div className="relative z-10 flex-shrink-0 text-[var(--color-primary-500)] group-hover/btn:text-white transition-colors duration-300">
                  {isLocked ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M18 8H6C4.89543 8 4 8.89543 4 10V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V10C20 8.89543 19.1046 8 18 8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M7 8V6C7 4.67392 7.52678 3.40215 8.46447 2.46447C9.40215 1.52678 10.6739 1 12 1C13.3261 1 14.5979 1.52678 15.5355 2.46447C16.4732 3.40215 17 4.67392 17 6V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                      <path d="M10 8L16 12L10 16V8Z" fill="currentColor" />
                    </svg>
                  )}
                </div>
                {/* Label */}
                <span className="relative z-10 font-['Noto_Sans'] text-[15px] font-bold text-[#242938] group-hover/btn:text-white transition-colors duration-300 truncate">{actionText}</span>
              </div>
            )}

            {score !== undefined && (
              <div
                className={`flex h-[60px] w-[60px] flex-col items-center justify-center p-[10px] rounded-full border border-[rgba(128,128,128,0.55)] bg-white flex-shrink-0 ${onScoreClick ? 'cursor-pointer hover:border-primary-500 hover:text-primary-500 transition-colors' : ''}`}
                onClick={(e) => {
                  if (onScoreClick) {
                    e.preventDefault();
                    e.stopPropagation();
                    onScoreClick(e);
                  }
                }}
              >
                <span className={`${scoreClassName ?? "text-primary-500"} font-['Noto_Sans'] text-[18px] font-bold leading-none`}>
                  {score}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Meta Row — shown when actionText is absent AND author/date are provided (blog card mode) */}
        {!actionText && score === undefined && (author || date) && (
          <div className="mt-auto flex items-center justify-between gap-2 pt-3 border-t border-[rgba(0,0,0,0.07)]">
            {author && (
              <div className="flex items-center gap-2 min-w-0">
                {authorAvatar ? (
                  <img
                    src={authorAvatar}
                    alt={author}
                    className="w-5 h-5 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <img
                    src="/assets/figma/icons/logo.png"
                    alt="logo"
                    className="w-5 h-5 object-contain flex-shrink-0"
                  />
                )}
                <span className="font-['Noto_Sans'] text-[13px] font-semibold text-[#2D3142] truncate">{author}</span>
              </div>
            )}
            {date && (
              <div className="flex items-center gap-1 flex-shrink-0">
                <span className="material-symbols-rounded text-[#6A7282]" style={{ fontSize: '15px' }}>calendar_month</span>
                <span className="font-['Noto_Sans'] text-[13px] text-[#6A7282]">{date}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </Tag>
  );
};
