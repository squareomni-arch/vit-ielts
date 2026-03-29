type IconColorVariant = "blue" | "amber" | "green" | "purple" | "brand" | "cyan";

type AdminStatCardProps = {
  icon: React.ReactNode;
  iconColor?: IconColorVariant;
  label: string;
  value: string | number;
  trend?: { value: string; direction: "up" | "down" };
};

export const AdminStatCard = ({
  icon,
  iconColor = "blue",
  label,
  value,
  trend,
}: AdminStatCardProps) => {
  return (
    <div className="admin-stat-card">
      <div className={`admin-stat-card-icon ${iconColor}`}>{icon}</div>
      <div className="admin-stat-card-body">
        <div className="admin-stat-card-label">{label}</div>
        <div className="admin-stat-card-value">{value}</div>
        {trend && (
          <div className={`admin-stat-card-trend ${trend.direction}`}>
            {trend.direction === "up" ? "↑" : "↓"} {trend.value}
          </div>
        )}
      </div>
    </div>
  );
};
