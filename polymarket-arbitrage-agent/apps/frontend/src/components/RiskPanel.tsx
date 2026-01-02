"use client";

import { useStore } from "@/store/useStore";

export function RiskPanel() {
  const { systemState } = useStore();

  if (!systemState) return null;

  const { risk } = systemState;

  if (risk.flags.length === 0) {
    return null;
  }

  return (
    <div className="border border-accent-red rounded-lg p-4 bg-bg-secondary">
      <h2 className="text-lg font-bold text-accent-red mb-4">⚠️ RISK FLAGS</h2>
      <div className="space-y-2">
        {risk.flags.map((flag, i) => (
          <div key={i} className="text-accent-red text-sm">- {flag}</div>
        ))}
      </div>
    </div>
  );
}

