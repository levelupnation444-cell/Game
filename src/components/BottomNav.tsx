import React from "react";
import { useWebHaptics } from "web-haptics/react";

interface BottomNavProps {
  currentTab: string;
  setTab: (tab: string) => void;
  onLogout: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, setTab, onLogout }) => {
  const { trigger } = useWebHaptics();

  const handleTab = (tab: string) => {
    try { trigger("selection"); } catch {}
    if (navigator.vibrate) navigator.vibrate(10);
    setTab(tab);
  };

  const handleLogout = () => {
    try { trigger("selection"); } catch {}
    if (navigator.vibrate) navigator.vibrate(10);
    onLogout();
  };

  return (
    <nav className="bottom-nav">
      <button
        onClick={() => handleTab("daily")}
        className={`nav-item ${currentTab === "daily" ? "active" : ""}`}
      >
        <span className="nav-icon">🛡️</span>
        <span>Daily</span>
      </button>
      <button
        onClick={() => handleTab("leaderboard")}
        className={`nav-item ${currentTab === "leaderboard" ? "active" : ""}`}
      >
        <span className="nav-icon">🏆</span>
        <span>Leaderboard</span>
      </button>
      <button
        onClick={() => handleTab("profile")}
        className={`nav-item ${currentTab === "profile" ? "active" : ""}`}
      >
        <span className="nav-icon">👤</span>
        <span>Profile</span>
      </button>
      <button
        onClick={handleLogout}
        className="nav-item"
        style={{ opacity: 0.7 }}
      >
        <span className="nav-icon">🚪</span>
        <span>Logout</span>
      </button>
    </nav>
  );
};
