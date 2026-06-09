
/**
 * Checkbox — Figma node 3219:3305 (checked) / 3219:3306 (unchecked)
 *
 * 16×16px, 5px radius
 * Unchecked : border 1.5px rgba(25,29,36,.1)
 * Checked   : bg #B3E653, ✓ in Ink/900
 * Hover     : darker border (unchecked) / #9AD534 bg (checked)
 */

import { twMerge } from 'tailwind-merge';

export type CheckboxProps = {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
};

export const Checkbox = ({
  checked = false,
  onChange,
  disabled = false,
  className = '',
  'aria-label': ariaLabel,
}: CheckboxProps) => {
  return (
    <button
      role="checkbox"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      type="button"
      onClick={() => !disabled && onChange?.(!checked)}
      className={twMerge(
        'inline-flex items-center justify-center',
        'w-4 h-4 rounded-[5px] border-[1.5px]',
        'transition-colors duration-150 shrink-0',
        checked
          ? 'bg-[#b3e653] border-[#b3e653] hover:bg-[#9ad534] hover:border-[#9ad534]'
          : 'bg-transparent border-[rgba(25,29,36,0.1)] hover:border-[rgba(25,29,36,0.3)]',
        disabled && 'opacity-50 cursor-not-allowed',
        className,
      )}
    >
      {checked && (
        <span className="text-[#191d24] text-[10px] font-bold leading-none select-none">✓</span>
      )}
    </button>
  );
};
