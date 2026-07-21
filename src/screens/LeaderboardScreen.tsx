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
        <span className="tag blue">Level Up Nation</span>
        <h1 className="headline" style={{ fontSize: "28px", marginTop: "10px" }}>Leaderboard</h1>
        <p style={{ fontSize: "14px", color: "var(--text-3)", margin: "6px 0 0", fontWeight: "600" }}>
          Streaks and power levels of active pathfinders.
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "var(--text-3)" }}>Loading rankings...</div>
      ) : (
        <div className="leaderboard-list">
          {entries.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "var(--text-3)" }}>
              No active players found yet.
            </div>
          ) : (
            entries.map((player, idx) => {
              const rank = idx + 1;
              const totalStats = player.faith + player.discipline + player.focus + player.energy + player.purpose;
              const isTop3 = rank <= 3;
              return (
                <div
                  key={idx}
                  className={`leaderboard-row ${isTop3 ? "top" : ""}`}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
                    <span className={`rank-badge ${rank <= 3 ? `rank-${rank}` : ""}`}>
                      {rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `#${rank}`}
                    </span>
                    <div>
                      <div style={{ fontWeight: "700", color: "var(--text-1)" }}>{player.name}</div>
                      <div style={{ fontSize: "12px", color: "var(--text-3)", textTransform: "capitalize", fontWeight: "600" }}>
                        {player.class}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ color: "var(--gold)", fontWeight: "800", fontSize: "15px", fontFamily: "Nunito, sans-serif" }}>
                      🔥 {player.streak}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--text-3)", marginTop: "2px", fontWeight: "700" }}>
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
