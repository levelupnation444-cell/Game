import React, { useState } from "react";
import { api } from "../api";
import { useAuth } from "../hooks/useAuth";

interface PaywallScreenProps {
  onSuccess?: () => void;
}

export const PaywallScreen: React.FC<PaywallScreenProps> = ({ onSuccess }) => {
  const { refreshUser, logout } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly">("yearly");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.stripe.createCheckout(selectedPlan);
      if (res.url) {
        window.location.href = res.url;
      }
    } catch (e: any) {
      setError(e.message || "Unable to launch checkout. Please try again.");
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setLoading(true);
    setError(null);
    try {
      const subscription = await api.stripe.verifySubscription();
      if (subscription.is_subscribed) {
        await refreshUser();
        if (onSuccess) onSuccess();
      } else {
        setError("Your subscription is not active yet. If you just paid, wait a moment and try again.");
      }
    } catch (e: any) {
      setError(e.message || "Unable to verify subscription status.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #0b0d14 0%, #121624 50%, #0d0f18 100%)",
        color: "#ffffff",
        fontFamily: "var(--font-sans, system-ui, -apple-system, sans-serif)",
        padding: "24px 16px 48px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* Header bar */}
      <div
        style={{
          width: "100%",
          maxWidth: "480px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "22px" }}>⚔️</span>
          <span
            style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: "12px",
              color: "#fbbf24",
              letterSpacing: "1px",
              textTransform: "uppercase",
            }}
          >
            LevelUp Nation
          </span>
        </div>
        <button
          onClick={logout}
          style={{
            background: "transparent",
            border: "none",
            color: "#94a3b8",
            fontSize: "12px",
            cursor: "pointer",
            fontWeight: 600,
            textDecoration: "underline",
          }}
        >
          Sign Out
        </button>
      </div>

      {/* Main hero badge */}
      <div
        style={{
          maxWidth: "480px",
          width: "100%",
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "inline-block",
            background: "rgba(251, 191, 36, 0.12)",
            border: "1px solid rgba(251, 191, 36, 0.3)",
            padding: "6px 14px",
            borderRadius: "20px",
            fontSize: "11px",
            fontWeight: 700,
            color: "#fbbf24",
            letterSpacing: "0.5px",
            textTransform: "uppercase",
            marginBottom: "16px",
          }}
        >
          ⚡ LEVELUP PREMIUM ACCESS
        </div>

        <h1
          style={{
            fontSize: "28px",
            fontWeight: "800",
            lineHeight: "1.25",
            marginBottom: "12px",
            background: "linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Invest In Yourself.<br />
          <span style={{ color: "#fbbf24", WebkitTextFillColor: "#fbbf24" }}>
            Become Unstoppable.
          </span>
        </h1>

        <p
          style={{
            color: "#94a3b8",
            fontSize: "14px",
            lineHeight: "1.5",
            marginBottom: "28px",
            padding: "0 10px",
          }}
        >
          Join thousands building daily spiritual discipline, tracking fitness & AI macros, and unlocking their true potential every single day.
        </p>

        {/* Feature list grid */}
        <div
          style={{
            background: "rgba(30, 41, 59, 0.5)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "16px",
            padding: "20px",
            textAlign: "left",
            marginBottom: "28px",
            backdropFilter: "blur(10px)",
          }}
        >
          {[
            { icon: "📖", title: "Daily Spiritual & Discipline Quests", desc: "Build unshakeable habits with scripture & daily missions" },
            { icon: "🤖", title: "AI Macro & Calorie Scanner", desc: "Snap a photo of any meal to instantly track calories & macros" },
            { icon: "🕊️", title: "24/7 AI Faith & Life Coach", desc: "Personal wisdom, prayer support & daily guidance" },
            { icon: "🏆", title: "Leaderboard & Guild Community", desc: "Compete with brothers & sisters, level up your stats" },
          ].map((item, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                gap: "14px",
                alignItems: "flex-start",
                marginBottom: idx === 3 ? 0 : "16px",
              }}
            >
              <span
                style={{
                  fontSize: "20px",
                  background: "rgba(255, 255, 255, 0.05)",
                  padding: "8px",
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minWidth: "36px",
                  height: "36px",
                }}
              >
                {item.icon}
              </span>
              <div>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "#f8fafc" }}>
                  {item.title}
                </div>
                <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>
                  {item.desc}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Plan selection cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "24px" }}>
          {/* Yearly Card (Recommended) */}
          <div
            onClick={() => setSelectedPlan("yearly")}
            style={{
              position: "relative",
              background:
                selectedPlan === "yearly"
                  ? "linear-gradient(135deg, rgba(251, 191, 36, 0.15) 0%, rgba(30, 41, 59, 0.8) 100%)"
                  : "rgba(30, 41, 59, 0.4)",
              border:
                selectedPlan === "yearly"
                  ? "2px solid #fbbf24"
                  : "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "16px",
              padding: "18px 20px",
              cursor: "pointer",
              transition: "all 0.2s ease",
              textAlign: "left",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "-10px",
                right: "16px",
                background: "linear-gradient(90deg, #f59e0b, #d97706)",
                color: "#000",
                fontSize: "10px",
                fontWeight: 900,
                padding: "3px 10px",
                borderRadius: "12px",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                boxShadow: "0 2px 8px rgba(245, 158, 11, 0.4)",
              }}
            >
              SAVE 50% - BEST VALUE
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <input
                  type="radio"
                  checked={selectedPlan === "yearly"}
                  onChange={() => setSelectedPlan("yearly")}
                  style={{ accentColor: "#fbbf24", width: "18px", height: "18px" }}
                />
                <div>
                  <div style={{ fontWeight: 800, fontSize: "16px", color: "#ffffff" }}>
                    Yearly Access
                  </div>
                  <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>
                    Billed annually ($59.88/yr)
                  </div>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 800, fontSize: "18px", color: "#fbbf24" }}>
                  $4.99<span style={{ fontSize: "12px", color: "#94a3b8" }}>/mo</span>
                </div>
                <div style={{ fontSize: "10px", color: "#a1a1aa", textDecoration: "line-through" }}>
                  $9.99/mo
                </div>
              </div>
            </div>
          </div>

          {/* Monthly Card */}
          <div
            onClick={() => setSelectedPlan("monthly")}
            style={{
              background:
                selectedPlan === "monthly"
                  ? "linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(30, 41, 59, 0.8) 100%)"
                  : "rgba(30, 41, 59, 0.4)",
              border:
                selectedPlan === "monthly"
                  ? "2px solid #6366f1"
                  : "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "16px",
              padding: "18px 20px",
              cursor: "pointer",
              transition: "all 0.2s ease",
              textAlign: "left",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <input
                  type="radio"
                  checked={selectedPlan === "monthly"}
                  onChange={() => setSelectedPlan("monthly")}
                  style={{ accentColor: "#6366f1", width: "18px", height: "18px" }}
                />
                <div>
                  <div style={{ fontWeight: 800, fontSize: "16px", color: "#ffffff" }}>
                    Monthly Access
                  </div>
                  <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>
                    Flexible, cancel anytime
                  </div>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 800, fontSize: "18px", color: "#ffffff" }}>
                  $9.99<span style={{ fontSize: "12px", color: "#94a3b8" }}>/mo</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div
            style={{
              background: "rgba(239, 68, 68, 0.15)",
              border: "1px solid rgba(239, 68, 68, 0.4)",
              color: "#fca5a5",
              fontSize: "12px",
              padding: "10px 14px",
              borderRadius: "10px",
              marginBottom: "16px",
              textAlign: "center",
            }}
          >
            {error}
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={handleCheckout}
          disabled={loading}
          style={{
            width: "100%",
            background: "linear-gradient(135deg, #fbbf24 0%, #d97706 100%)",
            color: "#0f172a",
            fontFamily: "'Press Start 2P', monospace",
            fontSize: "12px",
            fontWeight: 900,
            padding: "18px 24px",
            borderRadius: "14px",
            border: "none",
            cursor: loading ? "not-allowed" : "pointer",
            boxShadow: "0 4px 20px rgba(245, 158, 11, 0.35)",
            transition: "transform 0.1s ease, filter 0.2s ease",
            marginBottom: "16px",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "PREPARING CHECKOUT..." : "START YOUR LEVELUP JOURNEY ⚡"}
        </button>

        {/* Security & Money-Back Notice */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "16px",
            fontSize: "11px",
            color: "#64748b",
            marginBottom: "28px",
          }}
        >
          <span>🔒 Safe 256-bit SSL Checkout</span>
          <span>•</span>
          <span>⚡ Instant Access</span>
          <span>•</span>
          <button
            onClick={handleVerify}
            style={{
              background: "none",
              border: "none",
              color: "#94a3b8",
              cursor: "pointer",
              fontSize: "11px",
              textDecoration: "underline",
            }}
          >
            Already Paid? Check Status
          </button>
        </div>

        {/* Social Proof Quote */}
        <div
          style={{
            background: "rgba(15, 23, 42, 0.6)",
            border: "1px dashed rgba(255, 255, 255, 0.1)",
            borderRadius: "12px",
            padding: "14px",
            fontSize: "12px",
            color: "#cbd5e1",
            fontStyle: "italic",
            lineHeight: "1.4",
          }}
        >
          "LevelUp completely shifted my morning routine. I went from starting my day distracted to locked in with God and my goals."
          <div style={{ fontStyle: "normal", fontWeight: 700, color: "#fbbf24", marginTop: "6px", fontSize: "11px" }}>
            — Mark T., Warrior Member ⭐⭐⭐⭐⭐
          </div>
        </div>
      </div>
    </div>
  );
};
