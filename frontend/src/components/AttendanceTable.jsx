import StatusPill from "./StatusPill";

function AttendanceTable({ rows }) {
  return (
    <div className="table-wrapper panel">
      <div className="panel__header">
        <h3>Attendance Records</h3>
      </div>
      <table className="attendance-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Date</th>
            <th>Time</th>
            <th>Confidence</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.length ? (
            rows.map((row, index) => (
              <tr key={`${row.name}-${row.date}-${row.time}-${index}`}>
                <td>{row.name}</td>
                <td>{row.date}</td>
                <td>{row.time}</td>
                <td>{(row.confidence * 100).toFixed(2)}%</td>
                <td>
                  <StatusPill status={row.status} />
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" className="empty-state">
                No attendance records found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default AttendanceTable;
