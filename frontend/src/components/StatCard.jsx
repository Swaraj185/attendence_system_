function StatCard({ title, value, accent }) {
  return (
    <article className={`stat-card stat-card--${accent}`}>
      <span>{title}</span>
      <strong>{value}</strong>
    </article>
  );
}

export default StatCard;
