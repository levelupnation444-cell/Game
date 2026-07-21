import React, { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AuthProvider, useAuth } from "../hooks/useAuth";
import { AuthScreen } from "../screens/AuthScreen";
import { CreateScreen } from "../screens/CreateScreen";
import { HowScreen } from "../screens/HowScreen";
import { LevelIntroScreen } from "../screens/LevelIntroScreen";
import { DailyScreen } from "../screens/DailyScreen";
import { LeaderboardScreen } from "../screens/LeaderboardScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { BottomNav } from "../components/BottomNav";
import { api } from "../api";
import type { ProfileData } from "../api";

export const Route = createFileRoute("/")({
  component: App,
});

const AppContent: React.FC = () => {
  const { user, loading: authLoading, logout, refreshUser } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("daily"); // daily, leaderboard, profile
  const [overlayHow, setOverlayHow] = useState(false);

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
    if (user) {
      fetchProfile();
    } else {
      setProfile(null);
    }
  }, [user]);

  if (authLoading || (user && !profile && profileLoading)) {
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

  // 6. Main Dashboard tabs
  return (
    <div className="app-container">
      {activeTab === "daily" && profile && (
        <DailyScreen
          profile={profile}
          onRefresh={fetchProfile}
          onHelp={() => setOverlayHow(true)}
        />
      )}
      {activeTab === "leaderboard" && <LeaderboardScreen />}
      {activeTab === "profile" && profile && (
        <ProfileScreen profile={profile} onRefresh={fetchProfile} />
      )}

      <BottomNav currentTab={activeTab} setTab={setActiveTab} onLogout={logout} />
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
