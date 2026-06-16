type AdminGlassCardProps = {
  children: React.ReactNode;
  title?: React.ReactNode;
  extra?: React.ReactNode;
  interactive?: boolean;
  className?: string;
  style?: React.CSSProperties;
};

export const AdminGlassCard = ({
  children,
  title,
  extra,
  interactive = false,
  className = "",
  style,
}: AdminGlassCardProps) => {
  return (
    <div
      className={`admin-glass-card ${interactive ? "interactive" : ""} ${className}`}
      style={style}
    >
      {(title || extra) && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
            paddingBottom: 12,
            borderBottom: "1px solid var(--admin-border)",
          }}
        >
          {title && (
            <h3
              style={{
                margin: 0,
                fontSize: 16,
                fontWeight: 600,
                color: "var(--admin-text-primary)",
              }}
            >
              {title}
            </h3>
          )}
          {extra && <div>{extra}</div>}
        </div>
      )}
      {children}
    </div>
  );
};
