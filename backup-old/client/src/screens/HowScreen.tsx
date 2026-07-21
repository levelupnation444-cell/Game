import React from "react";
import { api } from "../api";

interface HowScreenProps {
  onComplete: () => void;
  isOverlay?: boolean;
}

export const HowScreen: React.FC<HowScreenProps> = ({ onComplete, isOverlay = false }) => {
  const handleProceed = async () => {
    if (!isOverlay) {
      try {
        await api.profile.seenHow();
      } catch (e) {
        console.error("Failed to save state", e);
      }
    }
    onComplete();
  };

  return (
    <div style={{ maxWidth: "760px", margin: "40px auto 100px", padding: "0 16px" }}>
      <div style={{ textAlign: "center", marginBottom: "24px" }}>
        <span className="tag">Help</span>
        <h1 className="headline" style={{ fontSize: "32px", marginTop: "12px" }}>How This Works</h1>
      </div>

      <div style={{ textAlign: "center", maxWidth: "600px", margin: "0 auto 28px", lineHeight: "1.7" }}>
        <p>This workbook is your game. Your life is the level. Every day is a chance to move forward — and the rules are simple. No complicated systems. No judgment. Just you, your purpose, and the grace of God meeting you right where you are.</p>
      </div>

      <div className="info-cards" style={{
        display: "grid",
        gridTemplateColumns: "1fr",
        gap: "16px",
        marginBottom: "28px"
      }}>
        <div className="card">
          <h3 style={{ fontSize: "15px", color: "var(--blue)", marginBottom: "8px", fontWeight: "700" }}>💾 Save Points</h3>
          <p style={{ fontSize: "13.5px", lineHeight: "1.5", margin: 0 }}>Each day is a Save Point — a moment to pause, reflect, and lock in your progress. Complete it and you move forward.</p>
        </div>
        <div className="card">
          <h3 style={{ fontSize: "15px", color: "var(--gold)", marginBottom: "8px", fontWeight: "700" }}>🎁 Earn Loot</h3>
          <p style={{ fontSize: "13.5px", lineHeight: "1.5", margin: 0 }}>Finishing a Save Point earns you Loot — small, meaningful rewards you give yourself for showing up and doing the work.</p>
        </div>
        <div className="card">
          <h3 style={{ fontSize: "15px", color: "#ff6b6b", marginBottom: "8px", fontWeight: "700" }}>⚡ Respawn Anytime</h3>
          <p style={{ fontSize: "13.5px", lineHeight: "1.5", margin: 0 }}>Miss a day? No shame. You can always Respawn. The game doesn't end — it just waits for you to come back.</p>
        </div>
      </div>

      <div className="card blue" style={{ maxWidth: "560px", margin: "22px auto", textAlign: "center" }}>
        <p style={{ color: "var(--head)", fontStyle: "italic", fontSize: "15px", lineHeight: "1.5", margin: "0 0 8px" }}>
          "Do not conform to the pattern of this world, but be transformed by the renewing of your mind."
        </p>
        <span style={{ fontSize: "12px", color: "var(--body)" }}>Romans 12:2</span>
      </div>

      <div style={{ textAlign: "center", marginTop: "28px" }}>
        <button className="btn" onClick={handleProceed}>
          {isOverlay ? "Back to Daily" : "Continue"}
        </button>
      </div>
    </div>
  );
};
