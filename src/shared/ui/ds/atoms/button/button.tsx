
/**
 * Button — Design System Button (Tailwind-only)
 *
 * @figma Vit IELTS — "Buttons & controls" node 3034-224
 *
 * Variants (Figma-canonical):
 *   primary      — #B3E653 lime green, Ink/900 text, drop-shadow; hover #9AD534
 *   dark         — #191D24 bg, white text; hover #31384D
 *   outlined     — Figma "Ghost": white bg, 1.5px border rgba(25,29,36,.1), Ink text
 *   ghost        — Transparent bg, Ink text, hover bg black/10
 *   icon-circle  — 48px circle, white bg/border; hover #B3E653
 *
 * Utility variants (kept for backward compat, not in Figma DS):
 *   secondary    — white bg, brand border, fills on hover
 *   accent       — brand outlined → fills on hover
 *   link         — text-only
 *   danger       — error red
 *   white        — for use on dark/colored backgrounds
 */

import { useState } from "react";
import { twMerge } from "tailwind-merge";

export type ButtonVariant =
  | 'primary'
  | 'dark'
  | 'secondary'
  | 'outlined'
  | 'ghost'
  | 'accent'
  | 'link'
  | 'danger'
  | 'icon-circle'
  | 'white';

export type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  /** For icon-circle variant — renders as the only content */
  icon?: React.ReactNode;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void | Promise<void> | any;
  children?: React.ReactNode;
  className?: string;
  /** Render as <a> tag */
  href?: string;
  'aria-label'?: string;
};

/* ═══════════════════════════════════════════════════════════════
   Variant classes — values from Figma node 3034:224
   ═══════════════════════════════════════════════════════════════ */
const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  /* Figma: Primary / Default — #B3E653, Ink/900 text, shadow 0 12 13 rgba(25,29,36,.42)
     Figma: Primary / Hover   — #9AD534, no shadow */
  primary: [
    'bg-[#b3e653] text-[#191d24]',
    'hover:bg-[#9ad534]',
  ].join(' '),

  /* Figma: Dark / Default — #191D24, white text
     Figma: Dark / Hover   — #31384D */
  dark: [
    'bg-[#191d24] text-white border-transparent',
    'hover:bg-[#31384d]',
  ].join(' '),

  /* Figma: Ghost / Default — white bg, 1.5px border rgba(25,29,36,.1), Ink/900 text
     (kept as "outlined" key for backward compat) */
  outlined: [
    'bg-white text-[#191d24] border-[1.5px] border-[rgba(25,29,36,0.1)]',
    'hover:border-[rgba(25,29,36,0.2)] hover:shadow-[0_2px_8px_rgba(25,29,36,0.08)]',
  ].join(' '),

  /* Transparent ghost — utility, not in Figma DS spec */
  ghost: [
    'bg-transparent text-[#191d24] border-transparent',
    'hover:bg-black/10',
  ].join(' '),

  /* Utility: brand-colored outlined — not in Figma DS */
  accent: [
    'bg-white text-[#b3e653] border-[#b3e653]',
    'hover:bg-[#b3e653] hover:text-[#191d24]',
    'hover:shadow-[0_4px_16px_rgba(179,230,83,0.4)]',
  ].join(' '),

  /* Utility: text-only link */
  link: [
    'bg-transparent text-[#b3e653] border-transparent',
    '!p-0 !min-h-0 !rounded-none',
    'hover:text-[#9ad534] hover:underline',
  ].join(' '),

  /* Utility: destructive action */
  danger: [
    'bg-[#e54552] text-white border-transparent',
    'hover:bg-[#c93340]',
  ].join(' '),

  /* Figma: Icon button — 48×48 circle, white bg, 1.5px border rgba(25,29,36,.1)
     Figma: Icon button Hover — #B3E653 fill
     ⚠️ NO position:absolute — consumer decides layout via className */
  'icon-circle': [
    '!p-0 !rounded-full',
    'bg-white border-[1.5px] border-[rgba(25,29,36,0.1)] text-[#191d24]',
    'hover:bg-[#b3e653] hover:border-[#b3e653]',
  ].join(' '),

  /* Utility: for use on dark/colored backgrounds */
  white: [
    'bg-white text-[#191d24] border-white',
    'hover:bg-[#b3e653] hover:border-[#b3e653]',
    'disabled:bg-white/50 disabled:text-[#191d24]/50',
  ].join(' '),

  /* Utility: kept for backward compat */
  secondary: [
    'bg-white text-[#b3e653] border-[#b3e653]',
    'hover:bg-[#b3e653] hover:text-[#191d24] hover:border-[#b3e653]',
    'hover:shadow-[0_4px_16px_rgba(179,230,83,0.35)]',
  ].join(' '),
};

/* ═══ Size classes — Figma: px-[26px] py-[15px] for md ═══ */
const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'h-9 px-[18px] text-sm',               /* ~36px */
  md: 'py-[15px] px-[26px] text-sm',          /* Figma: px-26 py-15 */
  lg: 'py-[18px] px-[32px] text-sm',
};

/* ═══ Icon-circle sizes — Figma default = 48px ═══ */
const ICON_CIRCLE_SIZE: Record<ButtonSize, string> = {
  sm: 'w-9 h-9',    /* 36px */
  md: 'w-12 h-12',  /* 48px — Figma */
  lg: 'w-14 h-14',  /* 56px */
};

/* ═══ Icon sizing per context ═══ */
const ICON_SIZE: Record<string, string> = {
  sm:            '[&>svg]:w-4 [&>svg]:h-4 [&>img]:w-4 [&>img]:h-4',
  md:            '[&>svg]:w-5 [&>svg]:h-5 [&>img]:w-5 [&>img]:h-5',
  lg:            '[&>svg]:w-6 [&>svg]:h-6 [&>img]:w-6 [&>img]:h-6',
  'icon-circle': '[&>svg]:w-5 [&>svg]:h-5 [&>img]:w-5 [&>img]:h-5',
};

/* ═══ Component ═══ */
export const Button = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  icon,
  type = 'button',
  disabled = false,
  onClick,
  children,
  className = '',
  href,
  'aria-label': ariaLabel,
}: ButtonProps) => {
  const [internalLoading, setInternalLoading] = useState(false);
  const activeLoading = loading || internalLoading;
  const isIconOnly = variant === 'icon-circle' && !children;

  const classNames = twMerge(
    // Base — Figma: Inter Bold, gap 8px, radius 100px
    'inline-flex items-center justify-center gap-2',
    'border border-transparent rounded-[100px]',
    'font-bold font-inter cursor-pointer whitespace-nowrap select-none',
    'transition-[background,color,border-color,box-shadow,transform] duration-[180ms]',
    'active:enabled:scale-[0.96]',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
    // Size
    variant === 'icon-circle'
      ? ICON_CIRCLE_SIZE[size]
      : SIZE_CLASSES[size],
    // Variant
    VARIANT_CLASSES[variant],
    // Modifiers
    fullWidth && 'w-full',
    activeLoading && 'pointer-events-none',
    className,
  );

  // Icon wrapper classes
  const iconSizeKey = variant === 'icon-circle' ? 'icon-circle' : size;
  const iconClasses = `flex items-center justify-center shrink-0 leading-none ${ICON_SIZE[iconSizeKey]}`;

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || activeLoading) {
      e.preventDefault();
      return;
    }
    if (onClick) {
      const result = onClick(e);
      if (result instanceof Promise) {
        setInternalLoading(true);
        try {
          await result;
        } finally {
          setInternalLoading(false);
        }
      }
    }
  };

  const content = (
    <>
      {/* Spinner */}
      {activeLoading && (
        <span
          className="w-[18px] h-[18px] border-2 border-current border-r-transparent rounded-full animate-[spin_0.65s_linear_infinite] shrink-0"
          aria-hidden="true"
        />
      )}
      {/* Left icon */}
      {!activeLoading && leftIcon && (
        <span className={iconClasses} aria-hidden="true">{leftIcon}</span>
      )}
      {/* Icon-only mode (icon-circle without children) */}
      {!activeLoading && isIconOnly && icon && (
        <span className={iconClasses} aria-hidden="true">{icon}</span>
      )}
      {/* Label text */}
      {!isIconOnly && children && (
        <span className={twMerge("inline-flex items-center", activeLoading && "opacity-70")}>{children}</span>
      )}
      {/* Icon alongside text (non icon-only) */}
      {!activeLoading && !isIconOnly && icon && !leftIcon && !rightIcon && (
        <span className={iconClasses} aria-hidden="true">{icon}</span>
      )}
      {/* Right icon */}
      {!activeLoading && rightIcon && (
        <span className={iconClasses} aria-hidden="true">{rightIcon}</span>
      )}
    </>
  );

  if (href && !disabled && !activeLoading) {
    return (
      <a href={href} className={classNames} aria-label={ariaLabel}>
        {content}
      </a>
    );
  }

  return (
    <button
      type={type}
      className={classNames}
      disabled={disabled || activeLoading}
      onClick={handleClick}
      aria-label={ariaLabel}
      aria-busy={activeLoading}
    >
      {content}
    </button>
  );
};
