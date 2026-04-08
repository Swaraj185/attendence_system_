function StatusPill({ status }) {
  const normalized = status?.toLowerCase?.() || "unknown";
  const className =
    normalized === "recognized" || normalized === "present"
      ? "status-pill status-pill--success"
      : normalized === "error"
        ? "status-pill status-pill--warning"
        : "status-pill status-pill--danger";

  return <span className={className}>{status}</span>;
}

export default StatusPill;
