import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { useAuth } from "../context/AuthContext";
import { useSocketContext } from "../context/SocketContext";

const pageMeta = {
  "/dashboard": {
    title: "Dashboard Overview",
    subtitle: "Track total students and daily attendance in one place.",
  },
  "/live-attendance": {
    title: "Live Attendance",
    subtitle: "Stream webcam frames and recognize faces in real time.",
  },
  "/students/add": {
    title: "Register Student",
    subtitle: "Capture a face and push it to the registration API.",
  },
  "/attendance": {
    title: "Attendance Logs",
    subtitle: "Filter, search, and export attendance records.",
  },
};

function DashboardLayout() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { isConnected } = useSocketContext();
  const meta = pageMeta[location.pathname] || pageMeta["/dashboard"];

  const handleLogout = () => {
    signOut();
    navigate("/login");
  };

  return (
    <div className="app-shell">
      <Sidebar onLogout={handleLogout} />
      <main className="app-content">
        <Topbar title={meta.title} subtitle={meta.subtitle} socketStatus={isConnected} />
        <Outlet />
      </main>
    </div>
  );
}

export default DashboardLayout;
