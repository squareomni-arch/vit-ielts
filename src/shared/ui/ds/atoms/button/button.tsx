
/**
 * Button — Design System Button
 *
 * @figma IELTS Prediction Test — "BUTTONS" node 1076-2183
 *
 * Variants (matching Figma button groups):
 *   primary      — Button1: Solid #D94A56, white text, glow on hover
 *   secondary    — Button2: White bg, red border → fills red on hover
 *   outlined     — Button4: White bg, dark border, fills red on hover
 *   ghost        — Button3: Transparent, dark text, light bg on hover
 *   accent       — Similar to secondary/outlined
 *   link         — Text only, brand color underline on hover
 *   danger       — Error red bg
 *   icon-circle  — Button-Next/Prev: Circle icon button, brand red
 */

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outlined'
  | 'ghost'
  | 'accent'
  | 'link'
  | 'danger'
  | 'icon-circle';

export type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  /** For icon-circle and icon-circle-outline variants — renders as the only content */
  icon?: React.ReactNode;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  children?: React.ReactNode;
  className?: string;
  /** Render as <a> tag */
  href?: string;
  'aria-label'?: string;
};

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
  const classNames = [
    'btn',
    `btn--${variant}`,
    `btn--${size}`,
    fullWidth && 'btn--full',
    loading && 'btn--loading',
    className,
  ].filter(Boolean).join(' ');

  const isIconOnly = variant === 'icon-circle' && !children;

  const content = (
    <>
      {loading && <span className="btn__spinner" aria-hidden="true" />}
      {!loading && leftIcon && (
        <span className="btn__icon btn__icon--left" aria-hidden="true">{leftIcon}</span>
      )}
      {!loading && isIconOnly && icon && (
        <span className="btn__icon" aria-hidden="true">{icon}</span>
      )}
      {!loading && !isIconOnly && children && (
        <span className="btn__label">{children}</span>
      )}
      {!loading && !isIconOnly && icon && !leftIcon && !rightIcon && (
        <span className="btn__icon" aria-hidden="true">{icon}</span>
      )}
      {!loading && rightIcon && (
        <span className="btn__icon btn__icon--right" aria-hidden="true">{rightIcon}</span>
      )}
    </>
  );

  if (href && !disabled) {
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
      disabled={disabled || loading}
      onClick={onClick}
      aria-label={ariaLabel}
      aria-busy={loading}
    >
      {content}
    </button>
  );
};
