"use client";

import { useState } from "react";
import { useStore } from "@/store/useStore";
import { apiClient } from "@/lib/api";

export function ControlPanel() {
  const { systemState } = useStore();
  const [loading, setLoading] = useState(false);

  if (!systemState) return null;

  const handleControl = async (type: string, payload?: any) => {
    setLoading(true);
    try {
      await apiClient.control(type, payload);
      // Refresh state
      const newState = await apiClient.getState();
      useStore.getState().setSystemState(newState);
    } catch (err) {
      console.error("Control error:", err);
      alert("Failed to execute control command");
    } finally {
      setLoading(false);
    }
  };

  const strategies = [
    "pair_arbitrage",
    "open_leg_dislocation_pair",
    "autocycle_dump_hedge",
    "statistical_arbitrage",
    "spread_farming",
  ];

  return (
    <div className="border border-border-primary rounded-lg p-4 bg-bg-secondary">
      <h2 className="text-lg font-bold text-text-primary mb-4">🎛️ CONTROL</h2>

      <div className="space-y-3">
        {/* Pause/Resume */}
        <div className="flex gap-2">
          <button
            onClick={() => handleControl("PAUSE")}
            disabled={loading || systemState.isPaused}
            className="flex-1 px-3 py-2 bg-accent-red/20 border border-accent-red rounded text-accent-red hover:bg-accent-red/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            PAUSE
          </button>
          <button
            onClick={() => handleControl("RESUME")}
            disabled={loading || !systemState.isPaused}
            className="flex-1 px-3 py-2 bg-accent-green/20 border border-accent-green rounded text-accent-green hover:bg-accent-green/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            RESUME
          </button>
        </div>

        {/* Strategy Selection */}
        <div>
          <label className="block text-sm text-text-secondary mb-2">Strategy:</label>
          <select
            value={systemState.activeStrategy}
            onChange={(e) => handleControl("SET_STRATEGY", { name: e.target.value })}
            disabled={loading}
            className="w-full px-3 py-2 bg-bg-card border border-border-secondary rounded text-text-primary disabled:opacity-50"
          >
            {strategies.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Mode Toggle */}
        <div>
          <label className="block text-sm text-text-secondary mb-2">Mode:</label>
          <div className="flex gap-2">
            <button
              onClick={() => handleControl("SET_MODE", "AUTONOMOUS")}
              disabled={loading || systemState.mode === "AUTONOMOUS"}
              className={`flex-1 px-3 py-2 rounded border ${
                systemState.mode === "AUTONOMOUS"
                  ? "bg-accent-blue/20 border-accent-blue text-accent-blue"
                  : "bg-bg-card border-border-secondary text-text-secondary hover:bg-bg-primary"
              } disabled:opacity-50`}
            >
              AUTO
            </button>
            <button
              onClick={() => handleControl("SET_MODE", "HITL")}
              disabled={loading || systemState.mode === "HITL"}
              className={`flex-1 px-3 py-2 rounded border ${
                systemState.mode === "HITL"
                  ? "bg-accent-yellow/20 border-accent-yellow text-accent-yellow"
                  : "bg-bg-card border-border-secondary text-text-secondary hover:bg-bg-primary"
              } disabled:opacity-50`}
            >
              HITL
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

