import React, { useState, useEffect } from "react";
import { api } from "../api";
import type { LeaderboardEntry } from "../api";

export const LeaderboardScreen: React.FC = () => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.leaderboard.get()
      .then((data) => {
        setEntries(data.leaderboard);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Leaderboard fetch error", err);
        setLoading(false);
      });
  }, []);

  return (
    <div style={{ padding: "10px 0" }}>
      <div style={{ textAlign: "center", marginBottom: "24px" }}>
        <span className="tag">Level Up Nation</span>
        <h1 className="headline" style={{ fontSize: "28px", marginTop: "10px" }}>Leaderboard</h1>
        <p style={{ fontSize: "14px", color: "var(--body)", margin: "6px 0 0" }}>
          Streaks and power levels of active pathfinders.
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px" }}>Loading rankings...</div>
      ) : (
        <div className="leaderboard-list">
          {entries.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "var(--body)" }}>
              No active players found yet.
            </div>
          ) : (
            entries.map((player, idx) => {
              const rank = idx + 1;
              const totalStats = player.faith + player.discipline + player.focus + player.energy + player.purpose;
              return (
                <div key={idx} className="leaderboard-row" style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "rgba(22, 27, 46, 0.4)",
                  border: "1px solid rgba(255, 255, 255, 0.05)",
                  borderRadius: "12px",
                  padding: "12px 16px",
                  marginBottom: "8px"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span className={`rank-badge ${rank <= 3 ? `rank-${rank}` : ""}`} style={{
                      fontWeight: "800",
                      fontSize: "16px",
                      width: "28px"
                    }}>
                      {rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `#${rank}`}
                    </span>
                    <div>
                      <div style={{ fontWeight: "700", color: "var(--head)" }}>{player.name}</div>
                      <div style={{ fontSize: "12px", color: "var(--body)", textTransform: "capitalize" }}>
                        {player.class}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ color: "var(--gold)", fontWeight: "800", fontSize: "15px" }}>
                      🔥 {player.streak} Days
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--body)", marginTop: "2px" }}>
                      ⚡ {totalStats} XP
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
