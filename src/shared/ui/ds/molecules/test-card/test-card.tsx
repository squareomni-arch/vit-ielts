import { Badge } from '../../atoms/badge';

/**
 * Design System Test Card
 *
 * @figma IELTS Prediction Test — "HoverBox1/2" + Library cards
 */

export type TestCardProps = {
  image?: string;
  title: string;
  subtitle?: string;
  skill?: 'reading' | 'listening' | 'speaking' | 'writing';
  author?: string;
  authorAvatar?: string;
  views?: number;
  href?: string;
  onClick?: () => void;
  className?: string;
};

const formatViews = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n));

export const TestCard = ({
  image,
  title,
  subtitle,
  skill,
  author,
  authorAvatar,
  views,
  href,
  onClick,
  className = '',
}: TestCardProps) => {
  const Tag = href ? 'a' : 'div';
  const linkProps = href ? { href } : {};

  return (
    <Tag {...linkProps} className={`test-card ${className}`} onClick={onClick}>
      <div className="test-card__image-wrapper">
        {image ? (
          <img src={image} alt={title} className="test-card__image" loading="lazy" />
        ) : (
          <div className="test-card__image-placeholder" />
        )}
        {skill && (
          <Badge variant={skill} size="sm" className="test-card__skill-badge">
            {skill.charAt(0).toUpperCase() + skill.slice(1)}
          </Badge>
        )}
      </div>
      <div className="test-card__body">
        <h3 className="test-card__title">{title}</h3>
        {subtitle && <p className="test-card__subtitle">{subtitle}</p>}
        <div className="test-card__meta">
          {author && (
            <div className="test-card__author">
              {authorAvatar && <img src={authorAvatar} alt={author} className="test-card__author-avatar" />}
              <span className="test-card__author-name">{author}</span>
            </div>
          )}
          {views !== undefined && (
            <span className="test-card__views">👁 {formatViews(views)}</span>
          )}
        </div>
      </div>
    </Tag>
  );
};
