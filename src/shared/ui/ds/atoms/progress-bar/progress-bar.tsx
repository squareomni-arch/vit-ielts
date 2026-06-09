
/**
 * ProgressBar — Linear progress indicator
 *
 * @figma VIT IELTS — "Controls & navigation" node 3651:161
 *
 * Dark variant (default): track bg-[#40454f], for dark backgrounds
 * Light variant: track bg-[#e5e6e8], for light/white backgrounds
 */

import { twMerge } from 'tailwind-merge';

export type ProgressBarVariant = 'dark' | 'light';

export type ProgressBarProps = {
  /** 0–100 */
  value: number;
  label?: string;
  showValue?: boolean;
  variant?: ProgressBarVariant;
  /** Explicit width; defaults to 100% of container */
  width?: number;
  className?: string;
};

export const ProgressBar = ({
  value,
  label,
  showValue = true,
  variant = 'dark',
  width,
  className,
}: ProgressBarProps) => {
  const clamped = Math.min(100, Math.max(0, value));
  const hasHeader = label || showValue;

  return (
    <div
      className={twMerge('flex flex-col gap-2', className)}
      style={width ? { width } : undefined}
    >
      {hasHeader && (
        <div className="flex items-center justify-between">
          {label && (
            <span className="text-[13px] font-semibold font-inter leading-[18px] text-white">
              {label}
            </span>
          )}
          {showValue && (
            <span className="text-[13px] font-semibold font-inter leading-[18px] text-[#b3e653]">
              {clamped}%
            </span>
          )}
        </div>
      )}
      <div
        className={twMerge(
          'h-[10px] rounded-full overflow-hidden',
          variant === 'dark' ? 'bg-[#40454f]' : 'bg-[#e5e6e8]',
        )}
      >
        <div
          className="h-full bg-[#b3e653] rounded-full transition-[width] duration-300"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
};
