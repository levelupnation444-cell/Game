import React, { useState } from "react";
import { api, type ProfileData } from "../api";
import { CreateScreen } from "./CreateScreen";
import { useAuth } from "../hooks/useAuth";

interface ProfileScreenProps {
  profile: ProfileData;
  onRefresh: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ profile, onRefresh }) => {
  const [editing, setEditing] = useState(false);
  const [billingLoading, setBillingLoading] = useState(false);
  const [billingError, setBillingError] = useState<string | null>(null);
  const { logout } = useAuth();

  const handleBillingPortal = async () => {
    setBillingLoading(true);
    setBillingError(null);
    try {
      const res = await api.stripe.createPortal();
      window.location.href = res.url;
    } catch (e: any) {
      setBillingError(e.message || "Unable to open subscription settings.");
      setBillingLoading(false);
    }
  };

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
          borderRadius: "12px",
          background: "rgba(76, 110, 245, 0.15)",
          border: "2px solid var(--blue-dark)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--blue)",
          fontSize: "32px",
          fontWeight: "900",
          fontFamily: "Nunito, sans-serif",
          margin: "0 auto 12px"
        }}>
          {profile.user.name ? profile.user.name[0].toUpperCase() : "?"}
        </div>
        <h1 className="headline" style={{ fontSize: "26px" }}>{profile.user.name}</h1>
        <p style={{ fontSize: "14px", color: "var(--text-3)", textTransform: "capitalize", margin: "4px 0 16px", fontWeight: "600" }}>
          Level 1 {profile.user.class}
        </p>
        <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
          <button className="btn ghost small" onClick={() => setEditing(true)}>
            ✍️ Edit Profile
          </button>
          <button className="btn danger small" onClick={logout}>
            🚪 Logout
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "14px", alignItems: "center" }}>
          <div>
            <h2 className="headline" style={{ fontSize: "15px", marginBottom: "6px" }}>Subscription</h2>
            <p style={{ margin: 0, color: "var(--text-3)", fontSize: "12px", fontWeight: 700, textTransform: "capitalize" }}>
              Status: {profile.user.subscription_status || "active"}
            </p>
          </div>
          <button className="btn ghost small" onClick={handleBillingPortal} disabled={billingLoading}>
            {billingLoading ? "Opening..." : "Manage"}
          </button>
        </div>
        {billingError && (
          <p style={{ margin: "12px 0 0", color: "var(--red)", fontSize: "12px", fontWeight: 700 }}>
            {billingError}
          </p>
        )}
      </div>

      <div className="card" style={{ marginBottom: "24px", display: "flex", justifyContent: "space-around", textAlign: "center" }}>
        <div>
          <div style={{ fontSize: "22px", fontWeight: "900", color: "var(--gold)", fontFamily: "Nunito, sans-serif" }}>🔥 {profile.stats.streak}</div>
          <div style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--text-3)", marginTop: "4px", fontWeight: "700" }}>Streak</div>
        </div>
        <div style={{ borderLeft: "2px solid var(--border)" }}></div>
        <div>
          <div style={{ fontSize: "22px", fontWeight: "900", color: "var(--text-1)", fontFamily: "Nunito, sans-serif" }}>⚡ {totalXP}</div>
          <div style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--text-3)", marginTop: "4px", fontWeight: "700" }}>Total XP</div>
        </div>
        <div style={{ borderLeft: "2px solid var(--border)" }}></div>
        <div>
          <div style={{ fontSize: "22px", fontWeight: "900", color: "var(--blue)", fontFamily: "Nunito, sans-serif" }}>📅 {profile.dayNumber}</div>
          <div style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--text-3)", marginTop: "4px", fontWeight: "700" }}>Day Path</div>
        </div>
      </div>

      <h2 className="headline" style={{ fontSize: "18px", marginBottom: "12px" }}>Path Stats</h2>
      <div className="card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {[
          { label: "Faith", val: profile.stats.faith, emoji: "🙏" },
          { label: "Discipline", val: profile.stats.discipline, emoji: "📖" },
          { label: "Focus", val: profile.stats.focus, emoji: "📵" },
          { label: "Energy", val: profile.stats.energy, emoji: "💧" },
          { label: "Purpose", val: profile.stats.purpose, emoji: "❤️" },
        ].map((s) => (
          <div key={s.label}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "6px" }}>
              <span style={{ fontWeight: "700", color: "var(--text-1)" }}>{s.emoji} {s.label}</span>
              <span style={{ color: "var(--text-3)", fontWeight: "700" }}>{s.val} / 100 XP</span>
            </div>
            <div className="bar-track" style={{ height: "10px" }}>
              <div className="bar-fill blue" style={{ width: `${s.val}%` }}></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
