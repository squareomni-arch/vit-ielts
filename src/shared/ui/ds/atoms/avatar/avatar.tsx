
/**
 * Design System Avatar
 *
 * @figma IELTS Prediction Test — Dashboard, Result page
 */

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type AvatarProps = {
  src?: string | null;
  alt?: string;
  name?: string;
  fallback?: string;
  size?: AvatarSize;
  className?: string;
  status?: boolean;
  bg?: string;
  textColor?: string;
};

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export const Avatar = ({
  src,
  alt = '',
  name = '',
  fallback,
  size = 'md',
  className = '',
  status = false,
  bg,
  textColor,
}: AvatarProps) => {
  const classNames = [
    'avatar',
    `avatar--${size}`,
    className,
  ].filter(Boolean).join(' ');

  const style: React.CSSProperties = {};
  if (bg) style.background = bg;
  if (textColor) style.color = textColor;

  const displayName = name || fallback || '';
  const inner = src ? (
    <img src={src} alt={alt || displayName} className="avatar__img" />
  ) : (
    <span className="avatar__initials">{displayName ? getInitials(displayName) : '?'}</span>
  );

  return (
    <div className={classNames} style={Object.keys(style).length ? style : undefined}>
      {inner}
      {status && <span className="avatar__status" />}
    </div>
  );
};
