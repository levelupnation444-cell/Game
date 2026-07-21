import React, { useState, useEffect, useRef } from "react";
import { useWebHaptics } from "web-haptics/react";
import { api } from "../api";
import type { HealthData } from "../api";

export const HealthScreen: React.FC = () => {
  const { trigger } = useWebHaptics();
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [editingGoals, setEditingGoals] = useState(false);

  // Optimistic water state
  const [optimisticWater, setOptimisticWater] = useState<number | null>(null);

  const [calGoalInput, setCalGoalInput] = useState("2000");
  const [waterGoalInput, setWaterGoalInput] = useState("2500");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchHealth = async () => {
    try {
      const res = await api.health.get();
      setData(res);
      setCalGoalInput(String(res.calorieGoal));
      setWaterGoalInput(String(res.waterGoal));
    } catch (e) {
      console.error("Failed to load health data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const currentWater = optimisticWater !== null ? optimisticWater : (data?.totalWater ?? 0);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try { trigger("selection"); } catch {}
    setAnalyzing(true);

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      try {
        await api.health.logFoodAI(base64);
        try { trigger("success"); } catch {}
        await fetchHealth();
      } catch (err: any) {
        alert(err.message || "Failed to analyze meal image.");
      } finally {
        setAnalyzing(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddWater = async (amount: number) => {
    try { trigger("selection"); } catch {}
    const newWater = Math.max(0, currentWater + amount);
    setOptimisticWater(newWater);

    try {
      await api.health.addWater(amount);
      await fetchHealth();
      setOptimisticWater(null);
    } catch (e) {
      console.error("Failed to update water", e);
      setOptimisticWater(null);
    }
  };

  const handleDeleteFood = async (id: string) => {
    try { trigger("selection"); } catch {}
    try {
      await api.health.deleteFood(id);
      await fetchHealth();
    } catch (e) {
      console.error("Failed to delete food log", e);
    }
  };

  const handleSaveGoals = async (e: React.FormEvent) => {
    e.preventDefault();
    try { trigger("success"); } catch {}
    try {
      await api.health.updateGoals(Number(calGoalInput), Number(waterGoalInput));
      setEditingGoals(false);
      await fetchHealth();
    } catch (e) {
      console.error("Failed to update goals", e);
    }
  };

  if (loading || !data) {
    return (
      <div style={{ textAlign: "center", padding: "40px", color: "var(--text-3)" }}>
        Loading health dashboard...
      </div>
    );
  }

  const calProgress = Math.min(100, (data.totalCalories / data.calorieGoal) * 100);
  const waterProgress = Math.min(100, (currentWater / data.waterGoal) * 100);

  return (
    <div style={{ padding: "10px 0" }}>
      {/* Top Banner */}
      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <span className="tag blue">Vitality</span>
        <h1 className="headline" style={{ fontSize: "24px", marginTop: "8px" }}>
          Health Tracker
        </h1>
        <p style={{ fontSize: "14px", color: "var(--text-3)", margin: "4px 0 0", fontWeight: "600" }}>
          AI meal scan & daily hydration tracker.
        </p>
      </div>

      {/* Goal Edit Drawer */}
      {editingGoals ? (
        <div className="card" style={{ marginBottom: "20px" }}>
          <h3 className="headline" style={{ fontSize: "16px", marginBottom: "14px", color: "var(--blue)" }}>
            Edit Daily Goals
          </h3>
          <form onSubmit={handleSaveGoals} className="form-block" style={{ maxWidth: "100%" }}>
            <div>
              <label className="form-label">Calorie Goal (kcal)</label>
              <input
                type="number"
                value={calGoalInput}
                onChange={(e) => setCalGoalInput(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="form-label">Water Goal (ml)</label>
              <input
                type="number"
                value={waterGoalInput}
                onChange={(e) => setWaterGoalInput(e.target.value)}
                required
              />
            </div>
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "10px" }}>
              <button type="button" className="btn small ghost" onClick={() => setEditingGoals(false)}>
                Cancel
              </button>
              <button type="submit" className="btn small green">
                Save Goals
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "12px" }}>
          <button className="btn small ghost" onClick={() => setEditingGoals(true)}>
            ⚙️ Adjust Goals
          </button>
        </div>
      )}

      {/* Goals Progress Dashboard - Mobile Friendly Stack / Grid */}
      <div className="health-grid" style={{ marginBottom: "20px" }}>
        {/* Calories Card */}
        <div className="card" style={{ padding: "16px 14px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="form-label" style={{ margin: 0 }}>🔥 Calories</span>
              <span style={{ fontSize: "11px", color: "var(--text-3)", fontWeight: "700", whiteSpace: "nowrap" }}>
                {data.totalCalories}/{data.calorieGoal} kcal
              </span>
            </div>
          </div>
          <div className="bar-track" style={{ height: "12px", marginBottom: "10px" }}>
            <div
              className={`bar-fill ${data.totalCalories >= data.calorieGoal ? "green" : "blue"}`}
              style={{ width: `${calProgress}%` }}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--text-2)", fontWeight: "600" }}>
            <span>P: {data.totalProtein}g</span>
            <span>C: {data.totalCarbs}g</span>
            <span>F: {data.totalFat}g</span>
          </div>
        </div>

        {/* Water Card */}
        <div className="card" style={{ padding: "16px 14px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="form-label" style={{ margin: 0 }}>💧 Hydration</span>
              <span style={{ fontSize: "11px", color: "var(--text-3)", fontWeight: "700", whiteSpace: "nowrap" }}>
                {currentWater}/{data.waterGoal} ml
              </span>
            </div>
          </div>
          <div className="bar-track" style={{ height: "12px", marginBottom: "10px" }}>
            <div
              className="bar-fill blue"
              style={{ width: `${waterProgress}%` }}
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "4px" }}>
            <button
              className="btn small ghost"
              style={{ padding: "6px 0px", fontSize: "9px" }}
              onClick={() => handleAddWater(250)}
            >
              +250ml
            </button>
            <button
              className="btn small ghost"
              style={{ padding: "6px 0px", fontSize: "9px" }}
              onClick={() => handleAddWater(500)}
            >
              +500ml
            </button>
            <button
              className="btn small danger"
              style={{ padding: "6px 0px", fontSize: "9px" }}
              onClick={() => handleAddWater(-250)}
              disabled={currentWater <= 0}
            >
              -250ml
            </button>
          </div>
        </div>
      </div>

      {/* AI Calorie Tracker Section */}
      <div className="card" style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "10px" }}>
          <h2 className="headline" style={{ fontSize: "16px", margin: 0 }}>
            AI Meal Scanner
          </h2>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleImageUpload}
            style={{ display: "none" }}
          />
          <button
            className="btn small green"
            onClick={() => fileInputRef.current?.click()}
            disabled={analyzing}
          >
            {analyzing ? "Analyzing..." : "📸 Scan Food"}
          </button>
        </div>

        {analyzing && (
          <div style={{ textAlign: "center", padding: "16px 0", color: "var(--gold)", fontWeight: "700" }}>
            ⚡ AI is analyzing your food photo...
          </div>
        )}

        {/* Meal Logs List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {data.foodLogs.length === 0 ? (
            <div style={{ textAlign: "center", padding: "16px", color: "var(--text-3)", fontStyle: "italic", fontSize: "14px" }}>
              No meals logged today. Take a photo to estimate calories!
            </div>
          ) : (
            data.foodLogs.map((item) => (
              <div
                key={item.id}
                style={{
                  background: "var(--surface-2)",
                  border: "2px solid var(--border)",
                  padding: "10px 12px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: "700", color: "var(--text-1)", fontSize: "15px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {item.name}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--text-3)" }}>
                    P:{item.protein}g C:{item.carbs}g F:{item.fat}g
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                  <span style={{ fontWeight: "900", color: "var(--gold)", fontFamily: "Press Start 2P, monospace", fontSize: "10px" }}>
                    {item.calories} kcal
                  </span>
                  <button
                    onClick={() => handleDeleteFood(item.id)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--text-3)",
                      cursor: "pointer",
                      fontSize: "14px",
                      padding: "4px",
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
