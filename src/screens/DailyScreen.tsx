import React, { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import { api } from "../api";
import type { ProfileData } from "../api";
import { StatBar } from "../components/StatBar";
import { HabitRow } from "../components/HabitRow";

interface DailyScreenProps {
  profile: ProfileData;
  onRefresh: () => void;
  onHelp: () => void;
}

/** Simple level-up dialog shown when all habits are completed for the first time */
const LevelUpDialog: React.FC<{ dayNumber: number; onClose: () => void }> = ({ dayNumber, onClose }) => (
  <div className="dialog-overlay" onClick={onClose}>
    <div className="dialog-box" onClick={(e) => e.stopPropagation()}>
      <div style={{ fontSize: "56px", marginBottom: "12px", lineHeight: 1 }}>🏆</div>
      <h2 className="headline" style={{ fontSize: "28px", marginBottom: "8px" }}>
        Save Point {String(dayNumber).padStart(2, "0")} Complete!
      </h2>
      <p style={{ color: "var(--text-2)", fontSize: "14px", lineHeight: 1.6, marginBottom: "24px" }}>
        All habits done. Streak extended. You're building something real — keep showing up.
      </p>
      <button className="btn green full" onClick={onClose}>
        Continue
      </button>
    </div>
  </div>
);

export const DailyScreen: React.FC<DailyScreenProps> = ({ profile, onRefresh, onHelp }) => {
  const [lootInput, setLootInput] = useState("");
  const [refText, setRefText] = useState(profile.reflection);
  const [savingRef, setSavingRef] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);

  const { content, stats, completedToday, habits, dayNumber, lootClaimedToday } = profile;

  const [optimisticCompleted, setOptimisticCompleted] = useState<string[] | null>(null);
  const [optimisticStats, setOptimisticStats] = useState<typeof stats | null>(null);
  const [optimisticLootClaimed, setOptimisticLootClaimed] = useState<boolean | null>(null);
  const [didShowDialog, setDidShowDialog] = useState(false);

  const activeCompleted = optimisticCompleted !== null ? optimisticCompleted : completedToday;
  const activeStats = optimisticStats !== null ? optimisticStats : stats;
  const activeLootClaimed = optimisticLootClaimed !== null ? optimisticLootClaimed : lootClaimedToday;

  const allCompleted = habits.every((h) => activeCompleted.includes(h.id));

  // Show level-up dialog when all habits get ticked off for the first time
  useEffect(() => {
    if (allCompleted && !didShowDialog && !lootClaimedToday) {
      setShowLevelUp(true);
      setDidShowDialog(true);
    }
  }, [allCompleted]);

  const handleToggleHabit = async (habitId: string) => {
    const isCompleted = activeCompleted.includes(habitId);
    const nextCompleted = isCompleted
      ? activeCompleted.filter((id) => id !== habitId)
      : [...activeCompleted, habitId];

    const habitInfo = habits.find((h) => h.id === habitId);
    const nextStats = { ...activeStats };
    if (habitInfo) {
      const delta = isCompleted ? -5 : 5;
      const key = habitInfo.stat;
      nextStats[key] = Math.min(100, Math.max(0, (nextStats[key] || 0) + delta));
    }

    const totalHabitsCount = habits.length;
    const currentlyAllDone = nextCompleted.length === totalHabitsCount;
    const previouslyAllDone = activeCompleted.length === totalHabitsCount;
    if (currentlyAllDone && !previouslyAllDone) {
      nextStats.streak = (nextStats.streak || 0) + 1;
    } else if (!currentlyAllDone && previouslyAllDone) {
      nextStats.streak = Math.max(0, (nextStats.streak || 0) - 1);
    }

    setOptimisticCompleted(nextCompleted);
    setOptimisticStats(nextStats);

    if (!isCompleted) {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.8 },
        colors: ["#4c6ef5", "#58cc02", "#ffc800"],
      });
      if (navigator.vibrate) navigator.vibrate(10);
    }

    try {
      await api.habits.toggle(habitId, !isCompleted);
      onRefresh();
    } catch (e) {
      console.error("Habit toggle error, rolling back", e);
      setOptimisticCompleted(null);
      setOptimisticStats(null);
    }
  };

  const handleClaimLoot = async () => {
    if (!lootInput.trim()) return;
    setOptimisticLootClaimed(true);
    try {
      await api.game.claimLoot(dayNumber, lootInput.trim());
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.7 } });
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

  const progress = habits.length > 0 ? (activeCompleted.length / habits.length) * 100 : 0;

  return (
    <>
      {showLevelUp && (
        <LevelUpDialog dayNumber={dayNumber} onClose={() => setShowLevelUp(false)} />
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* Top bar: avatar + streak + help */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "10px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "40px",
              height: "40px",
              borderRadius: "8px",
              background: "rgba(76, 110, 245, 0.15)",
              border: "2px solid var(--blue-dark)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--blue)",
              fontWeight: "900",
              fontFamily: "Nunito, sans-serif",
              fontSize: "16px",
              flexShrink: 0,
            }}>
              {profile.user.name ? profile.user.name[0].toUpperCase() : "?"}
            </div>
            <div>
              <div style={{ color: "var(--text-1)", fontWeight: "700", fontSize: "14px" }}>
                {profile.user.name}
              </div>
              <div style={{ color: "var(--text-3)", fontSize: "11px", textTransform: "capitalize", fontWeight: "600" }}>
                {profile.user.class}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div className="streak-badge">
              🔥 {activeStats.streak} day streak
            </div>
            <button
              onClick={onHelp}
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "8px",
                border: "2px solid var(--border-2)",
                background: "var(--surface-2)",
                color: "var(--text-2)",
                fontWeight: "800",
                fontFamily: "Nunito, sans-serif",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "14px",
                flexShrink: 0,
              }}
            >
              ?
            </button>
          </div>
        </div>

        {/* Stat bars */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: "8px",
          width: "100%",
        }}>
          <StatBar label="Faith"      val={activeStats.faith}      />
          <StatBar label="Discipline" val={activeStats.discipline} />
          <StatBar label="Focus"      val={activeStats.focus}      />
          <StatBar label="Energy"     val={activeStats.energy}     />
          <StatBar label="Purpose"    val={activeStats.purpose}    />
        </div>

        {/* Save Point header */}
        <div>
          <div style={{ display: "flex", gap: "6px", marginBottom: "10px" }}>
            <span className="tag blue">Save Point {String(dayNumber).padStart(2, "0")}</span>
            <span className="tag">Day {dayNumber}</span>
          </div>
          <h1 className="headline" style={{ fontSize: "22px" }}>Today's Save Point</h1>
        </div>

        {/* Content cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Bible verse */}
          <div className="card">
            <div className="form-label" style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
              📖 Today's Bible Verse
            </div>
            <div style={{ borderLeft: "3px solid var(--blue)", paddingLeft: "14px" }}>
              <p style={{ color: "var(--text-1)", fontStyle: "italic", fontSize: "15px", lineHeight: "1.6", margin: "0 0 6px" }}>
                {content.verse}
              </p>
              <span style={{ fontSize: "12px", color: "var(--text-3)", fontWeight: "600" }}>{content.ref}</span>
            </div>
          </div>

          {/* Focus word */}
          <div className="card">
            <div className="form-label" style={{ marginBottom: "6px" }}>Today's Focus Word</div>
            <h2 className="headline" style={{ color: "var(--blue)", fontSize: "24px", marginBottom: "6px" }}>
              {content.focusWord}
            </h2>
            <p style={{ color: "var(--text-2)", fontSize: "13.5px", lineHeight: 1.6, margin: 0 }}>
              {content.focusDesc}
            </p>
          </div>

          {/* Daily mission */}
          <div className="card">
            <div className="form-label" style={{ marginBottom: "6px" }}>🎯 Daily Mission</div>
            <p style={{ color: "var(--text-1)", fontSize: "14px", lineHeight: 1.6, margin: 0 }}>
              {content.mission}
            </p>
          </div>

          {/* Habit checklist */}
          <div className="card blue">
            <div className="form-label" style={{ marginBottom: "14px" }}>Habit Checklist</div>
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

            {/* Progress bar */}
            <div style={{ marginTop: "18px" }}>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "11px",
                fontWeight: "700",
                color: "var(--text-3)",
                marginBottom: "8px",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}>
                <span>Progress</span>
                <span style={{ color: allCompleted ? "var(--green)" : "var(--text-3)" }}>
                  {activeCompleted.length} / {habits.length}
                </span>
              </div>
              <div className="bar-track" style={{ height: "10px" }}>
                <div
                  className={`bar-fill ${allCompleted ? "green" : "blue"}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Evening reflection */}
          <div className="card">
            <div className="form-label" style={{ marginBottom: "10px" }}>🌙 Evening Reflection</div>
            <label className="form-label" style={{ fontSize: "10px", marginBottom: "6px", display: "block" }}>
              One Win Today:
            </label>
            <textarea
              rows={3}
              placeholder="Write down one thing that went right today..."
              value={refText}
              onChange={(e) => setRefText(e.target.value)}
              onBlur={handleSaveReflection}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "10px" }}>
              <button
                className="btn small ghost"
                onClick={handleSaveReflection}
                disabled={savingRef}
              >
                {savingRef ? "Saving..." : "Save Reflection"}
              </button>
            </div>
          </div>

          {/* Loot drop */}
          {allCompleted && (
            <div className="card" style={{ border: "2px solid var(--gold-dark)" }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "12px",
              }}>
                <span style={{ fontSize: "22px" }}>🎁</span>
                <h3 className="headline" style={{ fontSize: "16px", color: "var(--gold)" }}>
                  Loot Drop
                </h3>
              </div>

              {activeLootClaimed ? (
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  color: "var(--green)",
                  fontWeight: "700",
                  fontSize: "14px",
                }}>
                  ✓ Save Complete — Loot claimed for today.
                </div>
              ) : (
                <>
                  <p style={{ fontSize: "13px", color: "var(--text-2)", margin: "0 0 14px", lineHeight: 1.5 }}>
                    You completed Save Point {String(dayNumber).padStart(2, "0")}. Claim your reward.
                  </p>
                  <label className="form-label" style={{ marginBottom: "6px", display: "block" }}>
                    My Loot Today
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Favorite coffee, an early night..."
                    value={lootInput}
                    onChange={(e) => setLootInput(e.target.value)}
                    style={{ marginBottom: "14px" }}
                  />
                  <button className="btn gold full" onClick={handleClaimLoot} disabled={!lootInput.trim()}>
                    ✓ Save Complete
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};
