
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
  size?: AvatarSize;
  className?: string;
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
  size = 'md',
  className = '',
}: AvatarProps) => {
  const classNames = [
    'avatar',
    `avatar--${size}`,
    className,
  ].filter(Boolean).join(' ');

  if (src) {
    return (
      <div className={classNames}>
        <img src={src} alt={alt || name} className="avatar__img" />
      </div>
    );
  }

  return (
    <div className={classNames}>
      <span className="avatar__initials">{name ? getInitials(name) : '?'}</span>
    </div>
  );
};
