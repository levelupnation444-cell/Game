import React, { useState } from "react";
import confetti from "canvas-confetti";
import { ProfileData, api } from "../api";
import { StatBar } from "../components/StatBar";
import { HabitRow } from "../components/HabitRow";

interface DailyScreenProps {
  profile: ProfileData;
  onRefresh: () => void;
  onHelp: () => void;
}

export const DailyScreen: React.FC<DailyScreenProps> = ({ profile, onRefresh, onHelp }) => {
  const [lootInput, setLootInput] = useState("");
  const [refText, setRefText] = useState(profile.reflection);
  const [savingRef, setSavingRef] = useState(false);

  const { content, stats, completedToday, habits, dayNumber, lootClaimedToday } = profile;

  // Keep local optimistic states for instant feedback
  const [optimisticCompleted, setOptimisticCompleted] = useState<string[] | null>(null);
  const [optimisticStats, setOptimisticStats] = useState<typeof stats | null>(null);
  const [optimisticLootClaimed, setOptimisticLootClaimed] = useState<boolean | null>(null);

  // Sync state whenever profile changes
  const activeCompleted = optimisticCompleted !== null ? optimisticCompleted : completedToday;
  const activeStats = optimisticStats !== null ? optimisticStats : stats;
  const activeLootClaimed = optimisticLootClaimed !== null ? optimisticLootClaimed : lootClaimedToday;

  const allCompleted = habits.every((h) => activeCompleted.includes(h.id));

  const handleToggleHabit = async (habitId: string) => {
    const isCompleted = activeCompleted.includes(habitId);
    
    // 1. Calculate optimistic completed array
    const nextCompleted = isCompleted
      ? activeCompleted.filter(id => id !== habitId)
      : [...activeCompleted, habitId];

    // 2. Calculate optimistic stats object
    const habitInfo = habits.find(h => h.id === habitId);
    const nextStats = { ...activeStats };
    if (habitInfo) {
      const delta = isCompleted ? -5 : 5;
      const key = habitInfo.stat;
      nextStats[key] = Math.min(100, Math.max(0, (nextStats[key] || 0) + delta));
    }

    // 3. Calculate optimistic streak
    const totalHabitsCount = habits.length;
    const currentlyAllDone = nextCompleted.length === totalHabitsCount;
    const previouslyAllDone = activeCompleted.length === totalHabitsCount;
    
    if (currentlyAllDone && !previouslyAllDone) {
      nextStats.streak = (nextStats.streak || 0) + 1;
    } else if (!currentlyAllDone && previouslyAllDone) {
      nextStats.streak = Math.max(0, (nextStats.streak || 0) - 1);
    }

    // Apply optimistic updates instantly
    setOptimisticCompleted(nextCompleted);
    setOptimisticStats(nextStats);

    // Haptic/audio/visual effect immediately
    if (!isCompleted) {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.8 },
        colors: ["#3b5bdb", "#637fe9", "#e8a33d"]
      });

      if (navigator.vibrate) {
        navigator.vibrate(10);
      }
    }

    try {
      await api.habits.toggle(habitId, !isCompleted);
      // Let the parent reload fresh DB data in background
      onRefresh();
    } catch (e) {
      console.error("Habit toggle error, rolling back", e);
      // Rollback optimistic state
      setOptimisticCompleted(null);
      setOptimisticStats(null);
    }
  };

  const handleClaimLoot = async () => {
    if (!lootInput.trim()) return;
    setOptimisticLootClaimed(true);

    try {
      await api.game.claimLoot(dayNumber, lootInput.trim());
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.7 }
      });
      onRefresh();
    } catch (e) {
      console.error("Claim loot error, rolling back", e);
      setOptimisticLootClaimed(null);
    }
  };

  const handleSaveReflection = async () => {
    setSavingRef(true);
    try {
      await api.game.saveReflection(refText);
    } catch (e) {
      console.error("Save reflection error", e);
    } finally {
      setSavingRef(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Mini top stats dashboard */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "38px",
            height: "38px",
            borderRadius: "50%",
            background: "var(--blue-soft)",
            border: "1px solid var(--blue-line)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--blue)",
            fontWeight: "700"
          }}>
            {profile.user.name ? profile.user.name[0].toUpperCase() : "?"}
          </div>
          <div>
            <div style={{ color: "var(--head)", fontWeight: "700", fontSize: "14px" }}>{profile.user.name}</div>
            <div style={{ color: "var(--body)", fontSize: "11px", textTransform: "capitalize" }}>{profile.user.class}</div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div className="streak-badge" style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            color: "var(--gold)",
            fontWeight: "700",
            fontSize: "13px",
            background: "var(--gold-soft)",
            border: "1px solid var(--gold-line)",
            borderRadius: "999px",
            padding: "6px 12px"
          }}>
            🔥 {stats.streak} day streak
          </div>
          <button
            onClick={onHelp}
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              border: "1px solid rgba(255,255,255,0.1)",
              background: "transparent",
              color: "var(--body)",
              fontWeight: "700",
              cursor: "pointer"
            }}
          >
            ?
          </button>
        </div>
      </div>

      {/* Row of stats bars */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(5, 1fr)",
        gap: "8px",
        width: "100%"
      }}>
        <StatBar label="Faith" val={activeStats.faith} />
        <StatBar label="Discipline" val={activeStats.discipline} />
        <StatBar label="Focus" val={activeStats.focus} />
        <StatBar label="Energy" val={activeStats.energy} />
        <StatBar label="Purpose" val={activeStats.purpose} />
      </div>

      <div style={{ display: "flex", gap: "6px", marginBottom: "4px" }}>
        <span className="tag">Save Point {String(dayNumber).padStart(2, "0")}</span>
        <span className="tag white">Day {dayNumber}</span>
      </div>

      <h1 className="headline" style={{ fontSize: "24px", marginBottom: "8px" }}>Today's Save Point</h1>

      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr",
        gap: "18px",
        width: "100%"
      }}>
        {/* Left side info block */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="card">
            <div className="form-label" style={{ display: "flex", alignItems: "center", gap: "6px" }}>📖 Today's Bible Verse</div>
            <div style={{ borderLeft: "3px solid var(--blue)", paddingLeft: "14px", margin: "10px 0" }}>
              <p style={{ color: "var(--head)", fontStyle: "italic", fontSize: "15px", lineHeight: "1.5", margin: "0 0 6px" }}>
                {content.verse}
              </p>
              <span style={{ fontSize: "12px", color: "var(--body)" }}>{content.ref}</span>
            </div>
          </div>

          <div className="card">
            <div className="form-label">Today's Focus Word</div>
            <h2 className="headline" style={{ color: "var(--blue)", fontSize: "26px", margin: "6px 0" }}>{content.focusWord}</h2>
            <p style={{ color: "var(--body)", fontSize: "13.5px", lineHeight: 1.5, margin: 0 }}>{content.focusDesc}</p>
          </div>

          <div className="card">
            <div className="form-label">🎯 Daily Mission</div>
            <p style={{ color: "var(--head)", fontSize: "14px", lineHeight: 1.5, margin: "6px 0 0" }}>{content.mission}</p>
          </div>
        </div>

        {/* Right side checklist block */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="card blue">
            <div className="form-label" style={{ marginBottom: "12px" }}>Habit Checklist</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {habits.map((habit) => (
                <HabitRow
                  key={habit.id}
                  habit={habit}
                  checked={activeCompleted.includes(habit.id)}
                  onToggle={() => handleToggleHabit(habit.id)}
                />
              ))}
            </div>

            <div style={{ marginTop: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--body)", marginBottom: "6px" }}>
                <span>Today's Progress</span>
                <span>{activeCompleted.length} / {habits.length}</span>
              </div>
              <div className="bar-track" style={{ height: "8px", background: "rgba(255, 255, 255, 0.06)", borderRadius: "99px", overflow: "hidden" }}>
                <div className="bar-fill" style={{ height: "100%", width: `${(activeCompleted.length / habits.length) * 100}%`, borderRadius: "99px" }}></div>
              </div>
            </div>
          </div>

          {/* Evening Reflection */}
          <div className="card">
            <div className="form-label">🌙 Evening Reflection</div>
            <label className="form-label" style={{ fontSize: "10px", marginTop: "8px", display: "block" }}>One Win Today:</label>
            <textarea
              rows={3}
              placeholder="Write down one thing that went right today..."
              value={refText}
              onChange={(e) => setRefText(e.target.value)}
              onBlur={handleSaveReflection}
              style={{ marginTop: "6px" }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "8px" }}>
              <button
                className="btn small ghost"
                onClick={handleSaveReflection}
                disabled={savingRef}
              >
                {savingRef ? "Saving..." : "Save Reflection"}
              </button>
            </div>
          </div>

          {/* Loot Drop box */}
          {allCompleted && (
            <div className="card blue" style={{ border: "1px solid var(--gold-line)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--gold)", fontWeight: "700", marginBottom: "8px" }}>
                <span>🎁</span>
                <span className="headline" style={{ fontSize: "16px", color: "var(--gold)" }}>Loot Drop</span>
              </div>

              {activeLootClaimed ? (
                <div style={{ color: "var(--gold)", fontWeight: "700", fontSize: "14px" }}>
                  ✓ Save Complete — Loot claimed for today.
                </div>
              ) : (
                <div>
                  <p style={{ fontSize: "13px", color: "var(--body)", margin: "0 0 12px" }}>
                    You completed Save Point {String(dayNumber).padStart(2, "0")}. Claim your reward.
                  </p>
                  <label className="form-label">My Loot Today</label>
                  <input
                    type="text"
                    placeholder="e.g. Favorite coffee, an early night..."
                    value={lootInput}
                    onChange={(e) => setLootInput(e.target.value)}
                    style={{ marginBottom: "12px" }}
                  />
                  <button className="btn full" onClick={handleClaimLoot} disabled={!lootInput.trim()}>
                    ✓ Save Complete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
