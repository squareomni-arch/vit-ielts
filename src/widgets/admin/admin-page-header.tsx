type AdminPageHeaderProps = {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
};

export const AdminPageHeader = ({
  icon,
  title,
  subtitle,
  badge,
  actions,
}: AdminPageHeaderProps) => {
  return (
    <div className="admin-page-header admin-animate-in">
      <div>
        <h1 className="admin-page-title">
          {icon && <span className="admin-page-title-icon">{icon}</span>}
          {title}
          {badge && <span>{badge}</span>}
        </h1>
        {subtitle && (
          <p
            style={{
              margin: "4px 0 0",
              fontSize: 13,
              color: "var(--admin-text-muted)",
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="admin-page-actions">{actions}</div>}
    </div>
  );
};
