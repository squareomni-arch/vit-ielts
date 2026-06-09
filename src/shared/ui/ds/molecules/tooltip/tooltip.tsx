import React from 'react';

export type TooltipPlacement = 'top' | 'bottom';

export type TooltipProps = {
  content: React.ReactNode;
  children: React.ReactNode;
  placement?: TooltipPlacement;
  forceOpen?: boolean;
  className?: string;
};

export const Tooltip = ({
  content,
  children,
  placement = 'top',
  forceOpen = false,
  className = '',
}: TooltipProps) => {
  const isTop = placement === 'top';

  return (
    <div className={`relative inline-flex flex-col items-center group ${className}`}>
      {/* Bubble — top */}
      {isTop && (
        <div
          className={[
            'absolute bottom-full mb-1 flex flex-col items-center pointer-events-none whitespace-nowrap transition-opacity duration-150',
            forceOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
          ].join(' ')}
        >
          <div className="bg-[var(--color-ink-900)] text-white text-[13px] font-medium font-inter leading-[18px] px-[13px] py-[9px] rounded-[9px]">
            {content}
          </div>
          {/* Arrow pointing down */}
          <div
            className="w-0 h-0"
            style={{
              borderLeft: '7px solid transparent',
              borderRight: '7px solid transparent',
              borderTop: '7px solid var(--color-ink-900)',
            }}
          />
        </div>
      )}

      {/* Target */}
      {children}

      {/* Bubble — bottom */}
      {!isTop && (
        <div
          className={[
            'absolute top-full mt-1 flex flex-col items-center pointer-events-none whitespace-nowrap transition-opacity duration-150',
            forceOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
          ].join(' ')}
        >
          {/* Arrow pointing up */}
          <div
            className="w-0 h-0"
            style={{
              borderLeft: '7px solid transparent',
              borderRight: '7px solid transparent',
              borderBottom: '7px solid var(--color-ink-900)',
            }}
          />
          <div className="bg-[var(--color-ink-900)] text-white text-[13px] font-medium font-inter leading-[18px] px-[13px] py-[9px] rounded-[9px]">
            {content}
          </div>
        </div>
      )}
    </div>
  );
};
