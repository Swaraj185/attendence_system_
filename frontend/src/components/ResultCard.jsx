import StatusPill from "./StatusPill";

function ResultCard({ result, error, isScanning, onStart }) {
  return (
    <section className="panel result-card">
      <div className="panel__header">
        <h3>Recognition Result</h3>
      </div>

      {error ? <div className="alert alert--danger">{error}</div> : null}

      <div className="result-grid">
        <div>
          <span>Name</span>
          <strong>{result?.name || "-"}</strong>
        </div>
        <div>
          <span>Confidence</span>
          <strong>{typeof result?.confidence === "number" ? `${result.confidence.toFixed(2)}%` : "0%"}</strong>
        </div>
        <div>
          <span>Status</span>
          <StatusPill status={result?.status || "Not Detected"} />
        </div>
        <div>
          <span>Attendance</span>
          <strong>{result?.attendanceSaved ? "Attendance Marked" : "No new entry"}</strong>
        </div>
      </div>

      {!isScanning ? (
        <button type="button" className="button button--secondary result-card__action" onClick={onStart}>
          Start
        </button>
      ) : null}
    </section>
  );
}

export default ResultCard;
