import { useEffect, useState } from "react";
import { exportAttendance, fetchAttendance } from "../api/attendance";
import AttendanceTable from "../components/AttendanceTable";

function downloadCsv(rows) {
  const header = ["Name", "Date", "Time", "Confidence", "Status"];
  const lines = rows.map((row) =>
    [row.name, row.date, row.time, row.confidence, row.status]
      .map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`)
      .join(",")
  );

  const csv = [header.join(","), ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "attendance-records.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function AttendancePage() {
  const [filters, setFilters] = useState({ date: "", search: "" });
  const [records, setRecords] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const loadAttendance = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await fetchAttendance(filters);
      setRecords(data);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendance();
  }, []);

  const rowCountLabel = `${records.length} record${records.length === 1 ? "" : "s"}`;

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  };

  const handleExport = async () => {
    try {
      const data = await exportAttendance(filters);
      downloadCsv(data.rows);
    } catch (exportError) {
      setError(exportError.message);
    }
  };

  return (
    <div className="page-grid">
      <section className="panel">
        <div className="panel__header">
          <h3>Filters</h3>
          <span>{rowCountLabel}</span>
        </div>
        <div className="filters">
          <label>
            Date
            <input type="date" name="date" value={filters.date} onChange={handleFilterChange} />
          </label>
          <label>
            Search by Name
            <input
              type="text"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Search student"
            />
          </label>
          <div className="filters__actions">
            <button type="button" className="button button--primary" onClick={loadAttendance} disabled={loading}>
              {loading ? "Loading..." : "Apply Filters"}
            </button>
            <button type="button" className="button button--secondary" onClick={handleExport}>
              Export CSV
            </button>
          </div>
        </div>
        {error ? <div className="alert alert--danger">{error}</div> : null}
      </section>

      <AttendanceTable rows={records} />
    </div>
  );
}

export default AttendancePage;
