import React from "react";
import { useTiks } from "../hooks/useTiks";
import type { Habit } from "../api";

interface HabitRowProps {
  habit: Habit;
  checked: boolean;
  onToggle: () => void;
}

export const HabitRow: React.FC<HabitRowProps> = ({ habit, checked, onToggle }) => {
  const { play } = useTiks();

  const handleClick = () => {
    play(checked ? "toggle" : "pop", !checked);
    onToggle();
  };

  return (
    <div
      onClick={handleClick}
      className={`habit-row ${checked ? "checked" : ""}`}
    >
      {/* Emoji icon */}
      <div style={{
        width: "36px",
        height: "36px",
        borderRadius: "8px",
        background: checked ? "rgba(76, 110, 245, 0.15)" : "var(--surface-3)",
        border: `2px solid ${checked ? "var(--blue-dark)" : "var(--border-2)"}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "18px",
        flexShrink: 0,
        transition: "all 0.15s ease",
      }}>
        {habit.emoji}
      </div>

      {/* Label */}
      <div style={{
        flex: 1,
        color: checked ? "var(--text-2)" : "var(--text-1)",
        fontSize: "15px",
        fontWeight: "600",
        textDecoration: checked ? "line-through" : "none",
        transition: "all 0.15s ease",
      }}>
        {habit.label}
      </div>

      {/* Checkmark */}
      <div className={`habit-check ${checked ? "done" : ""}`}>
        {checked ? "✓" : ""}
      </div>
    </div>
  );
};
