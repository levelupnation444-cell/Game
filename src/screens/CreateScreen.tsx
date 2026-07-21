import React, { useState } from "react";
import { api } from "../api";

const CLASSES = [
  { id: "warrior", name: "Warrior", line: "You push through when it's hard." },
  { id: "disciple", name: "Disciple", line: "You learn it, then you live it." },
  { id: "builder", name: "Builder", line: "You show up and stack the bricks." },
  { id: "seeker", name: "Seeker", line: "You're still figuring it out — that's fine." },
];

interface CreateScreenProps {
  onComplete: () => void;
  initialName?: string;
}

export const CreateScreen: React.FC<CreateScreenProps> = ({ onComplete, initialName = "" }) => {
  const [name, setName] = useState(initialName);
  const [selectedClass, setSelectedClass] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("Please input a player name.");
      return;
    }
    if (!selectedClass) {
      setError("Please choose a character class.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await api.profile.setup(name.trim(), selectedClass);
      onComplete();
    } catch (err: any) {
      setError(err.message || "Failed to setup profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="center-screen" style={{ minHeight: "85vh" }}>
      <span className="tag blue">Character Creation</span>
      <h1 className="headline" style={{ fontSize: "28px" }}>Who are you showing up as?</h1>

      <div className="form-block">
        <div>
          <label className="form-label">Player Name</label>
          <input
            type="text"
            placeholder="Enter your name"
            maxLength={24}
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
          />
        </div>

        <div>
          <label className="form-label" style={{ marginBottom: "10px", display: "block" }}>Choose Your Class</label>
          <div className="class-grid" style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: "12px",
            width: "100%"
          }}>
            {CLASSES.map((c) => (
              <div
                key={c.id}
                className={`class-card ${selectedClass === c.id ? "selected" : ""}`}
                onClick={() => setSelectedClass(c.id)}
                style={{
                  background: selectedClass === c.id ? "rgba(76, 110, 245, 0.08)" : "var(--surface)",
                  border: `2px solid ${selectedClass === c.id ? "var(--blue)" : "var(--border)"}`,
                  borderRadius: "var(--radius)",
                  padding: "14px 18px",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.15s ease"
                }}
              >
                <h3 style={{ fontSize: "15px", color: "var(--text-1)", fontWeight: "700", marginBottom: "4px" }}>{c.name}</h3>
                <p style={{ fontSize: "12.5px", color: "var(--text-2)", margin: 0, lineHeight: 1.4 }}>{c.line}</p>
              </div>
            ))}
          </div>
        </div>

        {error && <div style={{ color: "#ff6b6b", fontSize: "13px", fontWeight: "600" }}>⚠️ {error}</div>}

        <button className="btn full" onClick={handleSubmit} disabled={loading}>
          {loading ? "Saving..." : "Continue"}
        </button>
      </div>
    </div>
  );
};
