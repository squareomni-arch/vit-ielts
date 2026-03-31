
export type StatCardProps = {
  icon?: React.ReactNode;
  value: string | number;
  label: string;
  trend?: { value: string; positive: boolean };
  className?: string;
};

export const StatCard = ({ icon, value, label, trend, className = '' }: StatCardProps) => (
  <div className={`stat-card ${className}`}>
    {icon && <div className="stat-card__icon">{icon}</div>}
    <div className="stat-card__content">
      <span className="stat-card__value">{value}</span>
      <span className="stat-card__label">{label}</span>
    </div>
    {trend && (
      <span className={`stat-card__trend ${trend.positive ? 'stat-card__trend--up' : 'stat-card__trend--down'}`}>
        {trend.positive ? '↑' : '↓'} {trend.value}
      </span>
    )}
  </div>
);
