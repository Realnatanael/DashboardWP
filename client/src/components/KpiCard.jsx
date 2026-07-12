export default function KpiCard({ label, value, sub, trend, variant = 'default', icon }) {
  return (
    <div className={`kpi-card kpi-card--${variant}`}>
      <div className="kpi-card__header">
        {icon && <span className="kpi-card__icon">{icon}</span>}
        <span className="kpi-card__label">{label}</span>
      </div>
      <div className="kpi-card__value">{value}</div>
      {sub && <div className="kpi-card__sub">{sub}</div>}
      {trend !== undefined && (
        <div className={`kpi-card__trend ${trend >= 0 ? 'positive' : 'negative'}`}>
          {trend >= 0 ? '▲' : '▼'} {Math.abs(trend).toFixed(1)}%
        </div>
      )}
    </div>
  );
}
