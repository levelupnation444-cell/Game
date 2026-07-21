import React from "react";
import { Habit } from "../api";

interface HabitRowProps {
  habit: Habit;
  checked: boolean;
  onToggle: () => void;
}

export const HabitRow: React.FC<HabitRowProps> = ({ habit, checked, onToggle }) => {
  return (
    <div
      onClick={onToggle}
      className={`habit-row ${checked ? "checked" : ""}`}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "14px",
        background: checked ? "rgba(0, 0, 0, 0.25)" : "rgba(22, 27, 46, 0.4)",
        borderRadius: "12px",
        padding: "12px 16px",
        cursor: "pointer",
        border: checked ? "1px solid var(--blue-soft)" : "1px solid rgba(255,255,255,0.03)",
        transition: "all 0.2s ease",
        opacity: checked ? 0.6 : 1,
      }}
    >
      <div
        className="habit-icon"
        style={{
          width: "36px",
          height: "36px",
          borderRadius: "10px",
          background: checked ? "var(--blue-soft)" : "rgba(255,255,255,0.03)",
          border: `1px solid ${checked ? "var(--blue-line)" : "rgba(255,255,255,0.08)"}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "18px",
          transition: "all 0.2s ease"
        }}
      >
        <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%" }}>
          {habit.emoji}
        </span>
      </div>

      <div
        className="habit-label"
        style={{
          flex: 1,
          color: "var(--head)",
          fontSize: "15px",
          fontWeight: "600",
          textDecoration: checked ? "line-through" : "none",
          transition: "all 0.2s ease"
        }}
      >
        {habit.label}
      </div>

      <div
        className="habit-check"
        style={{
          width: "24px",
          height: "24px",
          borderRadius: "8px",
          border: checked ? "none" : "2px solid var(--blue-line)",
          background: checked ? "var(--blue)" : "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          fontSize: "12px",
          fontWeight: "800",
          transition: "all 0.15s ease"
        }}
      >
        {checked ? "✓" : ""}
      </div>
    </div>
  );
};
