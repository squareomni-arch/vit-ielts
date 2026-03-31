
/**
 * Design System Badge
 *
 * @figma IELTS Prediction Test — "BlogTag" + skill indicators
 */

export type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info' | 'reading' | 'listening' | 'speaking' | 'writing';
export type BadgeSize = 'sm' | 'md';

export type BadgeProps = {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children: React.ReactNode;
  className?: string;
};

export const Badge = ({
  variant = 'default',
  size = 'sm',
  children,
  className = '',
}: BadgeProps) => {
  const classNames = [
    'badge',
    `badge--${variant}`,
    `badge--${size}`,
    className,
  ].filter(Boolean).join(' ');

  return <span className={classNames}>{children}</span>;
};
