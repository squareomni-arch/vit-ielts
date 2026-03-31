
/**
 * Design System Tag — Filter/category tags
 *
 * @figma IELTS Prediction Test — Tests Page filter chips
 */

export type TagVariant = 'filled' | 'outlined';

export type TagProps = {
  variant?: TagVariant;
  color?: 'default' | 'primary' | 'reading' | 'listening' | 'speaking' | 'writing';
  active?: boolean;
  removable?: boolean;
  onRemove?: () => void;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
};

export const Tag = ({
  variant = 'filled',
  color = 'default',
  active = false,
  removable = false,
  onRemove,
  onClick,
  children,
  className = '',
}: TagProps) => {
  const classNames = [
    'tag',
    `tag--${variant}`,
    `tag--${color}`,
    active && 'tag--active',
    onClick && 'tag--clickable',
    className,
  ].filter(Boolean).join(' ');

  return (
    <span className={classNames} onClick={onClick}>
      <span className="tag__label">{children}</span>
      {removable && (
        <button
          type="button"
          className="tag__remove"
          onClick={(e) => { e.stopPropagation(); onRemove?.(); }}
          aria-label="Remove tag"
        >
          ×
        </button>
      )}
    </span>
  );
};
