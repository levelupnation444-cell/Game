import React, { useState } from "react";
import type { ProfileData } from "../api";
import { CreateScreen } from "./CreateScreen";

interface ProfileScreenProps {
  profile: ProfileData;
  onRefresh: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ profile, onRefresh }) => {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <CreateScreen
        initialName={profile.user.name}
        onComplete={() => {
          setEditing(false);
          onRefresh();
        }}
      />
    );
  }

  const totalXP =
    profile.stats.faith +
    profile.stats.discipline +
    profile.stats.focus +
    profile.stats.energy +
    profile.stats.purpose;

  return (
    <div style={{ padding: "10px 0" }}>
      <div style={{ textAlign: "center", marginBottom: "28px" }}>
        <div style={{
          width: "72px",
          height: "72px",
          borderRadius: "50%",
          background: "var(--blue-soft)",
          border: "2px solid var(--blue-line)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--blue)",
          fontSize: "28px",
          fontWeight: "700",
          margin: "0 auto 12px"
        }}>
          {profile.user.name ? profile.user.name[0].toUpperCase() : "?"}
        </div>
        <h1 className="headline" style={{ fontSize: "24px" }}>{profile.user.name}</h1>
        <p style={{ fontSize: "14px", color: "var(--body)", textTransform: "capitalize", margin: "4px 0 14px" }}>
          Level 1 {profile.user.class}
        </p>
        <button className="btn ghost small" onClick={() => setEditing(true)}>
          ✍️ Edit Profile
        </button>
      </div>

      <div className="card blue" style={{ marginBottom: "20px", display: "flex", justifyContent: "space-around", textAlign: "center" }}>
        <div>
          <div style={{ fontSize: "22px", fontWeight: "800", color: "var(--gold)" }}>🔥 {profile.stats.streak}</div>
          <div style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--body)", marginTop: "4px" }}>Streak</div>
        </div>
        <div style={{ borderLeft: "1px solid rgba(255,255,255,0.1)" }}></div>
        <div>
          <div style={{ fontSize: "22px", fontWeight: "800", color: "var(--head)" }}>⚡ {totalXP}</div>
          <div style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--body)", marginTop: "4px" }}>Total XP</div>
        </div>
        <div style={{ borderLeft: "1px solid rgba(255,255,255,0.1)" }}></div>
        <div>
          <div style={{ fontSize: "22px", fontWeight: "800", color: "var(--blue)" }}>📅 {profile.dayNumber}</div>
          <div style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--body)", marginTop: "4px" }}>Day Path</div>
        </div>
      </div>

      <h2 className="headline" style={{ fontSize: "18px", marginBottom: "12px" }}>Path Stats</h2>
      <div className="card" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {[
          { label: "Faith", val: profile.stats.faith, emoji: "🙏" },
          { label: "Discipline", val: profile.stats.discipline, emoji: "📖" },
          { label: "Focus", val: profile.stats.focus, emoji: "📵" },
          { label: "Energy", val: profile.stats.energy, emoji: "💧" },
          { label: "Purpose", val: profile.stats.purpose, emoji: "❤️" },
        ].map((s) => (
          <div key={s.label}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "6px" }}>
              <span style={{ fontWeight: "600", color: "var(--head)" }}>{s.emoji} {s.label}</span>
              <span style={{ color: "var(--body)" }}>{s.val} / 100 XP</span>
            </div>
            <div className="bar-track" style={{ height: "8px", background: "rgba(255,255,255,0.06)", borderRadius: "99px", overflow: "hidden" }}>
              <div className="bar-fill" style={{ height: "100%", width: `${s.val}%`, borderRadius: "99px" }}></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
