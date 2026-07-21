import React from "react";

interface StatBarProps {
  label: string;
  val: number;
}

export const StatBar: React.FC<StatBarProps> = ({ label, val }) => {
  return (
    <div className="stat-box" style={{
      background: "rgba(22, 27, 46, 0.6)",
      border: "1px solid rgba(59, 91, 219, 0.15)",
      borderRadius: "12px",
      padding: "10px",
      textAlign: "center",
      minWidth: "70px",
      flex: 1
    }}>
      <div className="stat-name" style={{
        fontSize: "10px",
        fontWeight: "700",
        color: "var(--body)",
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        marginBottom: "4px"
      }}>{label}</div>
      <div className="stat-val" style={{
        fontSize: "13px",
        color: "var(--head)",
        fontWeight: "700",
        marginBottom: "6px"
      }}>{val}</div>
      <div className="bar-track" style={{
        height: "6px",
        background: "rgba(255, 255, 255, 0.08)",
        borderRadius: "99px",
        overflow: "hidden"
      }}>
        <div className="bar-fill" style={{
          height: "100%",
          width: `${Math.min(100, Math.max(0, val))}%`,
          borderRadius: "99px",
          transition: "width 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
        }}></div>
      </div>
    </div>
  );
};
