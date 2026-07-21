import React from "react";

interface StatBarProps {
  label: string;
  val: number;
  color?: "blue" | "green" | "gold";
}

export const StatBar: React.FC<StatBarProps> = ({ label, val, color = "blue" }) => {
  return (
    <div className="stat-box">
      <div style={{
        fontSize: "9px",
        fontWeight: "700",
        color: "var(--text-3)",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        marginBottom: "4px",
      }}>{label}</div>
      <div style={{
        fontSize: "14px",
        color: "var(--text-1)",
        fontWeight: "800",
        fontFamily: "Nunito, sans-serif",
        marginBottom: "6px",
      }}>{val}</div>
      <div className="bar-track">
        <div
          className={`bar-fill ${color}`}
          style={{
            width: `${Math.min(100, Math.max(0, val))}%`,
            transition: "width 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />
      </div>
    </div>
  );
};
