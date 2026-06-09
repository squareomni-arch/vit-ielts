
/**
 * Pagination — Page navigation control
 *
 * @figma VIT IELTS — "Controls & navigation" node 3651:161
 *
 * Active page: bg-[#b3e653] + Bold Ink/900 text
 * Default page: white bg + 1px border #D9DBE0 + Medium #2E3640 text
 * Prev/Next: white bg + 1px border #D9DBE0 + caret icon
 */

import { twMerge } from 'tailwind-merge';

export type PaginationProps = {
  /** Total number of pages */
  total: number;
  /** Current page (1-based) */
  page: number;
  onChange?: (page: number) => void;
  className?: string;
};

function CaretLeftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M20 26L10 16L20 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CaretRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M12 6L22 16L12 26" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const PAGE_BTN =
  'flex items-center justify-center w-[38px] h-[38px] rounded-[10px] shrink-0 transition-colors duration-150';

const DEFAULT_BTN = twMerge(
  PAGE_BTN,
  'bg-white border border-[#d9dbe0] text-[#2e3640] hover:border-[#b3e653] hover:text-[#191d24]',
);

const ACTIVE_BTN = twMerge(
  PAGE_BTN,
  'bg-[#b3e653] text-[#191d24] font-bold',
);

export const Pagination = ({ total, page, onChange, className }: PaginationProps) => {
  const canPrev = page > 1;
  const canNext = page < total;

  return (
    <div className={twMerge('flex gap-2 items-center', className)}>
      {/* Prev */}
      <button
        type="button"
        disabled={!canPrev}
        onClick={() => canPrev && onChange?.(page - 1)}
        aria-label="Previous page"
        className={twMerge(DEFAULT_BTN, 'text-[#6a7282]', !canPrev && 'opacity-40 cursor-not-allowed pointer-events-none')}
      >
        <CaretLeftIcon />
      </button>

      {/* Page numbers */}
      {Array.from({ length: total }, (_, i) => i + 1).map(p => (
        <button
          key={p}
          type="button"
          onClick={() => onChange?.(p)}
          aria-label={`Page ${p}`}
          aria-current={p === page ? 'page' : undefined}
          className={p === page ? ACTIVE_BTN : DEFAULT_BTN}
        >
          <span className={twMerge('text-[14px] font-inter leading-[20px]', p === page ? 'font-bold' : 'font-medium')}>
            {p}
          </span>
        </button>
      ))}

      {/* Next */}
      <button
        type="button"
        disabled={!canNext}
        onClick={() => canNext && onChange?.(page + 1)}
        aria-label="Next page"
        className={twMerge(DEFAULT_BTN, 'text-[#6a7282]', !canNext && 'opacity-40 cursor-not-allowed pointer-events-none')}
      >
        <CaretRightIcon />
      </button>
    </div>
  );
};
