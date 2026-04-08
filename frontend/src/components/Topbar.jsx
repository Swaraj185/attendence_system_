import { useTheme } from "../context/ThemeContext";

function Topbar({ title, subtitle, socketStatus }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="topbar">
      <div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>

      <div className="topbar__actions">
        <span className={socketStatus ? "badge badge--success" : "badge badge--danger"}>
          {socketStatus ? "Socket Online" : "Socket Offline"}
        </span>
        <button type="button" className="theme-toggle" onClick={toggleTheme}>
          {theme === "dark" ? "Light Mode" : "Dark Mode"}
        </button>
      </div>
    </header>
  );
}

export default Topbar;
