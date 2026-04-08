import { NavLink } from "react-router-dom";

const navItems = [
  { label: "Dashboard", to: "/dashboard" },
  { label: "Live Attendance", to: "/live-attendance" },
  { label: "Add Student", to: "/students/add" },
  { label: "Attendance Logs", to: "/attendance" },
];

function Sidebar({ onLogout }) {
  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <span className="sidebar__eyebrow">Admin Panel</span>
        <h1>FaceTrack</h1>
        <p>Real-time face recognition attendance</p>
      </div>

      <nav className="sidebar__nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              isActive ? "sidebar__link sidebar__link--active" : "sidebar__link"
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <button type="button" className="sidebar__logout" onClick={onLogout}>
        Logout
      </button>
    </aside>
  );
}

export default Sidebar;
