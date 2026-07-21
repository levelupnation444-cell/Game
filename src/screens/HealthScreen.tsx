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
    try {
      await api.health.addWater(amount);
      await fetchHealth();
    } catch (e) {
      console.error("Failed to add water", e);
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
  const waterProgress = Math.min(100, (data.totalWater / data.waterGoal) * 100);

  return (
    <div style={{ padding: "10px 0" }}>
      {/* Top Banner */}
      <div style={{ textAlign: "center", marginBottom: "24px" }}>
        <span className="tag blue">Vitality</span>
        <h1 className="headline" style={{ fontSize: "28px", marginTop: "10px" }}>Health Tracker</h1>
        <p style={{ fontSize: "14px", color: "var(--text-3)", margin: "6px 0 0", fontWeight: "600" }}>
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

      {/* Goals Progress Dashboard */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "24px" }}>
        {/* Calories Card */}
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <span className="form-label" style={{ margin: 0 }}>🔥 Calories</span>
            <span style={{ fontSize: "12px", color: "var(--text-3)", fontWeight: "700" }}>
              {data.totalCalories} / {data.calorieGoal} kcal
            </span>
          </div>
          <div className="bar-track" style={{ height: "14px", marginBottom: "12px" }}>
            <div
              className={`bar-fill ${data.totalCalories >= data.calorieGoal ? "green" : "blue"}`}
              style={{ width: `${calProgress}%` }}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--text-2)" }}>
            <span>P: {data.totalProtein}g</span>
            <span>C: {data.totalCarbs}g</span>
            <span>F: {data.totalFat}g</span>
          </div>
        </div>

        {/* Water Card */}
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <span className="form-label" style={{ margin: 0 }}>💧 Hydration</span>
            <span style={{ fontSize: "12px", color: "var(--text-3)", fontWeight: "700" }}>
              {data.totalWater} / {data.waterGoal} ml
            </span>
          </div>
          <div className="bar-track" style={{ height: "14px", marginBottom: "12px" }}>
            <div
              className="bar-fill blue"
              style={{ width: `${waterProgress}%` }}
            />
          </div>
          <div style={{ display: "flex", gap: "6px" }}>
            <button className="btn small ghost" style={{ flex: 1, padding: "4px" }} onClick={() => handleAddWater(250)}>
              +250ml
            </button>
            <button className="btn small ghost" style={{ flex: 1, padding: "4px" }} onClick={() => handleAddWater(500)}>
              +500ml
            </button>
          </div>
        </div>
      </div>

      {/* AI Calorie Tracker Section */}
      <div className="card" style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div>
            <span className="tag gold">Gemini 3.1 AI</span>
            <h2 className="headline" style={{ fontSize: "18px", marginTop: "6px" }}>AI Meal Scanner</h2>
          </div>
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
          <div style={{ textAlign: "center", padding: "20px 0", color: "var(--gold)", fontWeight: "700" }}>
            ⚡ AI is analyzing your food photo...
          </div>
        )}

        {/* Meal Logs List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {data.foodLogs.length === 0 ? (
            <div style={{ textAlign: "center", padding: "20px", color: "var(--text-3)", fontStyle: "italic" }}>
              No meals logged today. Take a photo to estimate calories!
            </div>
          ) : (
            data.foodLogs.map((item) => (
              <div
                key={item.id}
                style={{
                  background: "var(--surface-2)",
                  border: "2px solid var(--border)",
                  padding: "12px 14px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ fontWeight: "700", color: "var(--text-1)", fontSize: "16px" }}>
                    {item.name}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--text-3)" }}>
                    P: {item.protein}g | C: {item.carbs}g | F: {item.fat}g
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontWeight: "900", color: "var(--gold)", fontFamily: "Press Start 2P, monospace", fontSize: "12px" }}>
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
