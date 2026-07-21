import React from "react";
import { api } from "../api";

interface LevelIntroScreenProps {
  onComplete: () => void;
}

export const LevelIntroScreen: React.FC<LevelIntroScreenProps> = ({ onComplete }) => {
  const handleProceed = async () => {
    try {
      await api.profile.seenIntro();
    } catch (e) {
      console.error("Failed to save state", e);
    }
    onComplete();
  };

  return (
    <div style={{ maxWidth: "640px", margin: "40px auto", padding: "0 16px" }}>
      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <span className="tag blue">Level 1</span>
        <h1 className="headline" style={{ fontSize: "36px", marginTop: "12px" }}>Wake Up</h1>
      </div>

      <div className="card" style={{ borderLeft: "4px solid var(--blue)", marginBottom: "24px", background: "var(--surface)" }}>
        <p style={{ color: "var(--text-1)", fontStyle: "italic", fontSize: "16px", lineHeight: "1.6", margin: "0 0 8px" }}>
          "Wake up, sleeper, rise from the dead, and Christ will shine on you."
        </p>
        <span style={{ fontSize: "13px", color: "var(--text-3)", fontWeight: "700" }}>Ephesians 5:14</span>
      </div>

      <div className="card" style={{ display: "flex", flexDirection: "column", gap: "16px", lineHeight: "1.7" }}>
        <p style={{ margin: 0, color: "var(--text-1)" }}>
          There is a version of you that God has been waiting for — not a perfect version, but an awake one. Someone who has stopped sleepwalking through their own life and started moving with intention, with purpose, with faith.
        </p>
        <p style={{ margin: 0, color: "var(--text-2)" }}>
          Level 1 isn't about having it all figured out. It's about opening your eyes. It's about deciding that today, you will be present — to God, to your mission, and to the person you are becoming. The world is full of noise. This level is about learning to hear the voice that matters most.
        </p>
        <p style={{ margin: 0, color: "var(--text-2)" }}>
          You are not behind. You are not too far gone. You are exactly where you need to be to begin. <span style={{ color: "var(--gold)", fontWeight: "800" }}>Welcome to Level 1.</span>
        </p>
      </div>

      <div style={{ textAlign: "center", marginTop: "28px" }}>
        <button className="btn full" onClick={handleProceed}>
          Enter Level 1
        </button>
      </div>
    </div>
  );
};
