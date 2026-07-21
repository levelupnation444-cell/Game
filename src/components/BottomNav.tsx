import React from "react";
import { useWebHaptics } from "web-haptics/react";
import { useTiks } from "../hooks/useTiks";

interface BottomNavProps {
  currentTab: string;
  setTab: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, setTab }) => {
  const { trigger } = useWebHaptics();
  const { play } = useTiks();

  const handleTab = (tab: string) => {
    try { trigger("selection"); } catch {}
    if (navigator.vibrate) navigator.vibrate(10);
    play("click");
    setTab(tab);
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
        onClick={() => handleTab("health")}
        className={`nav-item ${currentTab === "health" ? "active" : ""}`}
      >
        <span className="nav-icon">🍎</span>
        <span>Health</span>
      </button>
      <button
        onClick={() => handleTab("leaderboard")}
        className={`nav-item ${currentTab === "leaderboard" ? "active" : ""}`}
      >
        <span className="nav-icon">🏆</span>
        <span>Ranks</span>
      </button>
      <button
        onClick={() => handleTab("coach")}
        className={`nav-item ${currentTab === "coach" ? "active" : ""}`}
      >
        <span className="nav-icon">🥊</span>
        <span>Coach</span>
      </button>
    </nav>
  );
};
