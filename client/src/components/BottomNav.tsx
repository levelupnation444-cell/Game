import React from "react";

interface BottomNavProps {
  currentTab: string;
  setTab: (tab: string) => void;
  onLogout: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, setTab, onLogout }) => {
  return (
    <nav className="bottom-nav">
      <button
        onClick={() => setTab("daily")}
        className={`nav-item ${currentTab === "daily" ? "active" : ""}`}
      >
        <span className="nav-icon">🛡️</span>
        <span>Daily</span>
      </button>
      <button
        onClick={() => setTab("leaderboard")}
        className={`nav-item ${currentTab === "leaderboard" ? "active" : ""}`}
      >
        <span className="nav-icon">🏆</span>
        <span>Leaderboard</span>
      </button>
      <button
        onClick={() => setTab("profile")}
        className={`nav-item ${currentTab === "profile" ? "active" : ""}`}
      >
        <span className="nav-icon">👤</span>
        <span>Profile</span>
      </button>
      <button
        onClick={onLogout}
        className="nav-item"
        style={{ opacity: 0.7 }}
      >
        <span className="nav-icon">🚪</span>
        <span>Logout</span>
      </button>
    </nav>
  );
};
