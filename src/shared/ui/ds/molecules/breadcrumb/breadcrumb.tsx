
export type BreadcrumbItem = { label: string; href?: string };

export type BreadcrumbProps = {
  items: BreadcrumbItem[];
  className?: string;
};

export const Breadcrumb = ({ items, className = '' }: BreadcrumbProps) => (
  <nav className={`breadcrumb ${className}`} aria-label="Breadcrumb">
    {items.map((item, i) => (
      <span key={i} className="breadcrumb__item">
        {i > 0 && <span className="breadcrumb__sep">/</span>}
        {item.href && i < items.length - 1 ? (
          <a href={item.href} className="breadcrumb__link">{item.label}</a>
        ) : (
          <span className="breadcrumb__current">{item.label}</span>
        )}
      </span>
    ))}
  </nav>
);
