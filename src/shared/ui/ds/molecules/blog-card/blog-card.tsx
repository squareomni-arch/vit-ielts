
import { resolveContentImage, useContentImageFallback } from "@/shared/lib/content-image";
import { ProBadge } from "@/shared/ui/pro-badge";

/**
 * Design System Blog Card
 *
 * @figma IELTS Prediction Test — "BlogCell" + Blog page cards
 */

export type BlogCardProps = {
  image?: string;
  title: string;
  excerpt?: string;
  category?: string;
  date?: string;
  readTime?: string;
  author?: string;
  /** Hiển thị badge PRO overlay nếu bài viết chỉ dành cho PRO user */
  isPro?: boolean;
  href?: string;
  onClick?: () => void;
  className?: string;
};

export const BlogCard = ({
  image,
  title,
  excerpt,
  category,
  date,
  readTime,
  author,
  isPro = false,
  href,
  onClick,
  className = '',
}: BlogCardProps) => {
  const fallbackImage = useContentImageFallback();
  const Tag = href ? 'a' : 'div';
  const linkProps = href ? { href } : {};
  const imageSrc = resolveContentImage(image, fallbackImage);

  return (
    <Tag {...linkProps} className={`blog-card ${className}`} onClick={onClick}>
      <div className="blog-card__image-wrapper">
        <img src={imageSrc} alt={title} className="blog-card__image" loading="lazy" />
        {isPro && (
          <ProBadge className="absolute top-2 right-2 z-10" />
        )}
      </div>
      <div className="blog-card__body">
        <div className="flex items-center gap-2 flex-wrap">
          {category && <span className="blog-card__category">{category}</span>}
          {isPro && <ProBadge variant="primary" className="shrink-0" />}
        </div>
        <h3 className="blog-card__title">{title}</h3>
        {excerpt && <p className="blog-card__excerpt">{excerpt}</p>}
        <div className="blog-card__meta">
          {author && <span>{author}</span>}
          {date && <span>{date}</span>}
          {readTime && <span>{readTime}</span>}
        </div>
      </div>
    </Tag>
  );
};
