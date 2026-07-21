import React, { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AuthProvider, useAuth } from "../hooks/useAuth";
import { AuthScreen } from "../screens/AuthScreen";
import { PaywallScreen } from "../screens/PaywallScreen";
import { CreateScreen } from "../screens/CreateScreen";
import { HowScreen } from "../screens/HowScreen";
import { LevelIntroScreen } from "../screens/LevelIntroScreen";
import { DailyScreen } from "../screens/DailyScreen";
import { HealthScreen } from "../screens/HealthScreen";
import { LeaderboardScreen } from "../screens/LeaderboardScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { CoachScreen } from "../screens/CoachScreen";
import { BottomNav } from "../components/BottomNav";
import { api } from "../api";
import type { ProfileData } from "../api";

export const Route = createFileRoute("/")(
  { component: App }
);

const AppContent: React.FC = () => {
  const { user, loading: authLoading, refreshUser } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("daily"); // daily, health, leaderboard, coach
  const [overlayHow, setOverlayHow] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    // Check if returning from payment checkout
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has("payment")) {
      refreshUser();
      // clean URL query params
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const fetchProfile = async () => {
    if (!user) return;
    setProfileLoading(true);
    try {
      const data = await api.profile.get();
      setProfile(data);
    } catch (e) {
      console.error("Profile load failed", e);
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.is_subscribed) {
      fetchProfile();
    } else {
      setProfile(null);
    }
  }, [user]);

  if (authLoading || (user && user.is_subscribed && !profile && profileLoading)) {
    return (
      <div className="center-screen">
        <span style={{ fontSize: "28px" }}>🛡️</span>
        <h2 className="headline" style={{ fontSize: "18px", marginTop: "10px" }}>Loading Path...</h2>
      </div>
    );
  }

  // 1. Unauthenticated view
  if (!user) {
    return <AuthScreen />;
  }

  // 2. HARD PAYWALL: Must pay via Stripe after signing in
  if (!user.is_subscribed) {
    return <PaywallScreen onSuccess={refreshUser} />;
  }

  // 2. Profile needs setup (name/class)
  if (!user.name || !user.class) {
    return <CreateScreen onComplete={refreshUser} />;
  }

  // 3. User hasn't seen the "How this works" walkthrough
  if (user.seen_how === 0) {
    return <HowScreen onComplete={refreshUser} />;
  }

  // 4. User hasn't seen Level 1 introduction
  if (user.seen_level_intro === 0) {
    return <LevelIntroScreen onComplete={refreshUser} />;
  }

  // 5. Help overlay
  if (overlayHow) {
    return <HowScreen onComplete={() => setOverlayHow(false)} isOverlay={true} />;
  }

  // 6. Profile modal (slide in from left on Daily screen)
  if (showProfile && profile) {
    return (
      <div className="app-container">
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
          <button
            onClick={() => setShowProfile(false)}
            style={{
              background: "var(--surface-2)",
              border: "2px solid var(--border)",
              color: "var(--text-1)",
              fontFamily: "Press Start 2P, monospace",
              fontSize: "10px",
              padding: "8px 12px",
              cursor: "pointer",
              boxShadow: "0 3px 0 var(--border-2)",
            }}
          >
            ← Back
          </button>
          <span style={{ color: "var(--text-3)", fontSize: "13px", fontWeight: "700" }}>Profile</span>
        </div>
        <ProfileScreen profile={profile} onRefresh={fetchProfile} />
      </div>
    );
  }

  // 7. Main Dashboard tabs
  return (
    <div className="app-container">
      {activeTab === "daily" && profile && (
        <DailyScreen
          profile={profile}
          onRefresh={fetchProfile}
          onHelp={() => setOverlayHow(true)}
          onProfile={() => setShowProfile(true)}
        />
      )}
      {activeTab === "health" && <HealthScreen />}
      {activeTab === "leaderboard" && <LeaderboardScreen />}
      {activeTab === "coach" && (
        <div style={{ margin: "-20px -16px", padding: "0 16px" }}>
          <CoachScreen />
        </div>
      )}

      <BottomNav currentTab={activeTab} setTab={setActiveTab} />
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
