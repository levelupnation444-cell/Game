import React from "react";
import { api } from "../api";

interface HowScreenProps {
  onComplete: () => void;
  isOverlay?: boolean;
}

export const HowScreen: React.FC<HowScreenProps> = ({ onComplete, isOverlay = false }) => {
  const handleComplete = async () => {
    if (!isOverlay) {
      try {
        await api.profile.seenHow();
      } catch (e) {
        console.error("Failed to mark how-it-works seen", e);
      }
    }
    onComplete();
  };

  return (
    <div style={{ maxWidth: "600px", margin: "40px auto", padding: "0 16px" }}>
      <div style={{ textAlign: "center", marginBottom: "24px" }}>
        <span className="tag blue">Tutorial</span>
        <h1 className="headline" style={{ fontSize: "32px", marginTop: "10px" }}>How It Works</h1>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "28px" }}>
        <div className="card">
          <h3 className="headline" style={{ fontSize: "16px", color: "var(--blue)", marginBottom: "8px" }}>
            1. Daily Save Points
          </h3>
          <p style={{ color: "var(--text-2)", fontSize: "13.5px", lineHeight: 1.6, margin: 0 }}>
            Every day is a Save Point. You get a set of 5 core habits to align your energy. Tick them off to lock in your progress.
          </p>
        </div>

        <div className="card">
          <h3 className="headline" style={{ fontSize: "16px", color: "var(--green)", marginBottom: "8px" }}>
            2. Build Streaks
          </h3>
          <p style={{ color: "var(--text-2)", fontSize: "13.5px", lineHeight: 1.6, margin: 0 }}>
            Complete all 5 habits in a single day to increase your streak. If you skip a day, your streak will break. Consistent action builds real momentum.
          </p>
        </div>

        <div className="card">
          <h3 className="headline" style={{ fontSize: "16px", color: "var(--gold)", marginBottom: "8px" }}>
            3. Claim Daily Loot
          </h3>
          <p style={{ color: "var(--text-2)", fontSize: "13.5px", lineHeight: 1.6, margin: 0 }}>
            When all habits are checked, you unlock the evening reflection and loot claim. Reward yourself with something small to build positive reinforcement loops.
          </p>
        </div>
      </div>

      <div style={{ textAlign: "center" }}>
        <button className="btn full" onClick={handleComplete}>
          {isOverlay ? "Go Back" : "Let's Begin"}
        </button>
      </div>
    </div>
  );
};
