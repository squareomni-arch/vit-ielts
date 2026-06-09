
/**
 * Select — Design System custom dropdown
 *
 * @figma VIT IELTS — "Controls & navigation" node 3651:161
 *
 * Default: 1px border #D9DBE0
 * Open/focused: 2px border #B3E653
 * Selected option row: bg-[#ebf7d4] with check mark
 */

import { useState, useRef, useEffect } from 'react';
import { twMerge } from 'tailwind-merge';

export type SelectOption = {
  value: string;
  label: string;
};

export type SelectProps = {
  label?: string;
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
};

function CaretDownIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M8 12L16 20L24 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M7.25 17.55L12.88 23.18L25.75 10.32" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export const Select = ({
  label,
  options,
  value,
  onChange,
  placeholder = 'Select…',
  className,
}: SelectProps) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = options.find(o => o.value === value);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (option: SelectOption) => {
    onChange?.(option.value);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className={twMerge('flex flex-col gap-[6px] items-start relative', className)}>
      {label && (
        <span className="text-[12px] font-semibold font-inter text-[#6a7282] leading-[17px] whitespace-nowrap">
          {label}
        </span>
      )}

      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={twMerge(
          'flex items-center justify-between h-[44px] w-[280px]',
          'bg-white rounded-[10px] px-[14px] pr-[12px]',
          'text-[14px] font-medium font-inter text-[#6a7282] leading-[20px] whitespace-nowrap',
          'transition-[border] duration-150',
          open
            ? 'border-2 border-[#b3e653]'
            : 'border border-[#d9dbe0]',
        )}
      >
        <span>{selected ? selected.label : placeholder}</span>
        <span className={twMerge('text-[#6a7282] transition-transform duration-150', open ? 'rotate-180' : '')}>
          <CaretDownIcon />
        </span>
      </button>

      {/* Dropdown menu */}
      {open && (
        <div className="absolute top-full mt-1 left-0 z-50 w-[280px] bg-white border border-[#d9dbe0] rounded-[10px] shadow-[0px_10px_28px_0px_rgba(15,23,41,0.12)] py-[6px]">
          {options.map(opt => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelect(opt)}
                className={twMerge(
                  'flex items-center justify-between w-full px-[14px] pr-[12px] py-[9px]',
                  'text-[14px] font-inter text-[#191d24] leading-[20px] whitespace-nowrap',
                  isSelected ? 'bg-[#ebf7d4] font-semibold' : 'font-medium hover:bg-[#f4f5f7]',
                )}
              >
                <span>{opt.label}</span>
                {isSelected && (
                  <span className="text-[#b3e653]">
                    <CheckIcon />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
