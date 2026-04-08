import { useEffect, useState } from "react";
import { fetchDashboardStats } from "../api/attendance";
import StatCard from "../components/StatCard";

function DashboardPage() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    presentToday: 0,
    absentToday: 0,
    date: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await fetchDashboardStats();
        setStats(data);
      } catch (loadError) {
        setError(loadError.message);
      }
    }

    loadStats();
  }, []);

  return (
    <div className="page-grid">
      <section className="stats-grid">
        <StatCard title="Total Students" value={stats.totalStudents} accent="primary" />
        <StatCard title="Present Today" value={stats.presentToday} accent="success" />
        <StatCard title="Absent Today" value={stats.absentToday} accent="danger" />
      </section>

      <section className="panel hero-panel">
        <div className="panel__header">
          <h3>Daily Snapshot</h3>
        </div>
        <p>
          Attendance for <strong>{stats.date || "today"}</strong> updates automatically whenever a
          face is recognized through the live feed.
        </p>
        {error ? <div className="alert alert--danger">{error}</div> : null}
      </section>
    </div>
  );
}

export default DashboardPage;
