"use client";

import { useStore } from "@/store/useStore";

export function PositionsPanel() {
  const { state } = useStore();

  if (!state) return null;

  const { positions, pnl } = state.portfolio;
  const { up, down } = state.pm;

  const barWidth = (shares: number, max: number = 30000) => {
    const pct = Math.min(1, shares / max);
    return `${pct * 100}%`;
  };

  return (
    <div className="border border-border-primary rounded-lg p-4 bg-bg-secondary">
      <h2 className="text-lg font-bold text-text-primary mb-4">📊 POSITIONS</h2>

      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* UP Position */}
        <div className="border border-border-secondary rounded-lg p-3 bg-bg-card">
          <div className="text-accent-green font-bold mb-2">▲ UP</div>
          <div className="mb-2">
            <div className="flex items-center gap-2 mb-1">
              <div className="flex-1 h-2 bg-bg-primary rounded overflow-hidden">
                <div
                  className="h-full bg-accent-green transition-all"
                  style={{ width: barWidth(positions.upShares) }}
                />
              </div>
              <span className="text-sm">{Math.round(positions.upShares)}</span>
            </div>
            <div className="text-sm text-text-secondary">
              @ {positions.avgUp.toFixed(4)}
            </div>
          </div>
          <div className="text-xs text-text-dim space-y-1">
            <div>Bid: {up.bid.toFixed(4)} | Ask: {up.ask.toFixed(4)}</div>
            <div>PnL: ${pnl.unrealized.toFixed(2)}</div>
          </div>
        </div>

        {/* DOWN Position */}
        <div className="border border-border-secondary rounded-lg p-3 bg-bg-card">
          <div className="text-accent-red font-bold mb-2">▼ DOWN</div>
          <div className="mb-2">
            <div className="flex items-center gap-2 mb-1">
              <div className="flex-1 h-2 bg-bg-primary rounded overflow-hidden">
                <div
                  className="h-full bg-accent-red transition-all"
                  style={{ width: barWidth(positions.downShares) }}
                />
              </div>
              <span className="text-sm">{Math.round(positions.downShares)}</span>
            </div>
            <div className="text-sm text-text-secondary">
              @ {positions.avgDown.toFixed(4)}
            </div>
          </div>
          <div className="text-xs text-text-dim space-y-1">
            <div>Bid: {down.bid.toFixed(4)} | Ask: {down.ask.toFixed(4)}</div>
            <div>PnL: ${pnl.unrealized.toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* Total PnL */}
      <div className="border-t border-border-secondary pt-3">
        <div className="flex justify-between items-center">
          <span className="text-text-secondary">Total PnL:</span>
          <span className={`text-lg font-bold ${pnl.total >= 0 ? "text-accent-green" : "text-accent-red"}`}>
            ${pnl.total.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}

