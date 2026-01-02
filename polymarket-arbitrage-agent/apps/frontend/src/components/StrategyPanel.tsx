"use client";

import { useStore } from "@/store/useStore";

export function StrategyPanel() {
  const { decision, systemState } = useStore();

  if (!systemState) return null;

  return (
    <div className="border border-border-primary rounded-lg p-4 bg-bg-secondary">
      <h2 className="text-lg font-bold text-text-primary mb-4">
        🤖 STRATEGY: {systemState.activeStrategy}
      </h2>

      {decision ? (
        <div className="space-y-2">
          <div>
            <span className="text-text-secondary">Decision: </span>
            <span className="text-accent-cyan font-mono">{decision.type}</span>
          </div>
          {decision.reason && (
            <div className="text-text-dim text-sm">{decision.reason}</div>
          )}
          {decision.type !== "NOOP" && (
            <div className="text-text-secondary text-sm">
              Tier: {decision.tier} | Confidence: {((decision.confidence || 0) * 100).toFixed(2)}%
            </div>
          )}
          {decision.risk && decision.risk.length > 0 && (
            <div className="text-accent-yellow text-sm">
              ⚠️ Risk: {decision.risk.join(", ")}
            </div>
          )}
        </div>
      ) : (
        <div className="text-text-dim">No decision yet...</div>
      )}
    </div>
  );
}

