"use client";

import { useStore } from "@/store/useStore";

export function MarketAnalysisPanel() {
  const { state } = useStore();

  if (!state) return null;

  const { pm, binance, derived } = state;
  const totalSpread = derived.spreadUp + derived.spreadDown;

  return (
    <div className="border border-border-primary rounded-lg p-4 bg-bg-secondary">
      <h2 className="text-lg font-bold text-text-primary mb-4">≡ MARKET ANALYSIS ≡</h2>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-text-secondary">UP:</span>
          <span className="text-accent-green font-mono">{pm.up.ask.toFixed(4)}</span>
          <span className="text-text-dim">|</span>
          <span className="text-text-secondary">DOWN:</span>
          <span className="text-accent-red font-mono">{pm.down.ask.toFixed(4)}</span>
          <span className="text-text-dim">|</span>
          <span className="text-text-secondary">Sum:</span>
          <span className="text-accent-blue font-mono">{derived.sumAsk.toFixed(4)}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-text-secondary">Spread:</span>
          <span className={totalSpread > 0.02 ? "text-accent-red" : "text-accent-green"}>
            {(totalSpread * 100).toFixed(2)}%
          </span>
        </div>

        <div className="border-t border-border-secondary pt-3 space-y-2">
          <div className="flex justify-between">
            <span className="text-text-secondary">Dislocation:</span>
            <span className="text-accent-cyan font-mono">{derived.dislocationScore.toFixed(3)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">BTC Price:</span>
            <span className="text-accent-blue font-mono">${binance.price.toFixed(0)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">CVD:</span>
            <span className="text-text-primary font-mono">{binance.cvd.toFixed(0)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Flow:</span>
            <span className="text-text-primary font-mono">{binance.flowImbalance.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

