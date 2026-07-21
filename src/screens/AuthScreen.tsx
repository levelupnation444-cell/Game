import React, { useState } from "react";
import { api } from "../api";

export const AuthScreen: React.FC = () => {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await api.auth.sendMagicLink(email.trim());
      setSent(true);
    } catch (err: any) {
      setError(err.message || "Failed to send magic link. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="center-screen">
      <div className="tag-row">
        <span className="tag blue">Purpose Path</span>
        <span className="tag">Level 1: Wake Up</span>
      </div>

      <h1 className="headline" style={{ fontSize: "40px", letterSpacing: "-0.5px" }}>
        Level One
      </h1>
      <p style={{ color: "var(--text-2)", fontSize: "15px", maxWidth: "380px", lineHeight: 1.7, margin: 0 }}>
        A heavily gamified daily habit tracker built to walk the purpose path. Sign in below via magic link.
      </p>

      <div className="card" style={{ width: "100%", maxWidth: "400px" }}>
        {sent ? (
          <div style={{ textAlign: "center", padding: "10px 0" }}>
            <span style={{ fontSize: "48px" }}>✉️</span>
            <h2 className="headline" style={{ fontSize: "22px", margin: "14px 0 8px" }}>
              Link Dispatched
            </h2>
            <p style={{ color: "var(--text-2)", fontSize: "14px", lineHeight: 1.6, margin: "0 0 20px" }}>
              Check <strong style={{ color: "var(--text-1)" }}>{email}</strong> for your sign-in link.
              Check spam if you don't see it.
            </p>
            <button className="btn ghost" onClick={() => setSent(false)}>
              Back
            </button>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="form-block" style={{ maxWidth: "100%" }}>
            <div>
              <label className="form-label">Email Address</label>
              <input
                type="email"
                placeholder="you@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            {error && (
              <div style={{ color: "#ff6b6b", fontSize: "13px", fontWeight: "600" }}>
                ⚠️ {error}
              </div>
            )}
            <button type="submit" className="btn full" disabled={loading}>
              {loading ? "Sending..." : "Receive Magic Link"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
