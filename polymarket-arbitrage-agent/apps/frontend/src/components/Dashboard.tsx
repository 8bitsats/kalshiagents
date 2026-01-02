"use client";

import { useStore } from "@/store/useStore";
import { PositionsPanel } from "./PositionsPanel";
import { MarketAnalysisPanel } from "./MarketAnalysisPanel";
import { RecentTransactionsPanel } from "./RecentTransactionsPanel";
import { StrategyPanel } from "./StrategyPanel";
import { RiskPanel } from "./RiskPanel";
import { ControlPanel } from "./ControlPanel";
import { GrokChatPanel } from "./GrokChatPanel";

export function Dashboard() {
  const { state, systemState, wsConnected } = useStore();

  if (!state || !systemState) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg-primary text-text-primary">
        <div className="text-center">
          <div className="text-accent-yellow text-xl mb-2">⏳ Waiting for market data...</div>
          <div className="text-text-dim">Ensure backend is running on port 3001</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary p-4">
      {/* Header */}
      <div className="mb-6 border border-border-primary rounded-lg p-4 bg-bg-secondary">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary mb-1">
              Polymarket Arbitrage Agent by FunPump.ai
            </h1>
            <div className="flex items-center gap-4 text-sm text-text-dim">
              <span>Round: {state.pm.roundId}</span>
              <span>T-{state.pm.secondsRemaining}s</span>
              <span className={systemState.isPaused ? "text-accent-red" : "text-accent-green"}>
                {systemState.isPaused ? "PAUSED" : "RUNNING"}
              </span>
              <span className={systemState.mode === "AUTONOMOUS" ? "text-accent-blue" : "text-accent-yellow"}>
                {systemState.mode}
              </span>
              <span className={state.portfolio.paper ? "text-accent-yellow" : "text-accent-red"}>
                {state.portfolio.paper ? "PAPER" : "LIVE"}
              </span>
              <span className={wsConnected ? "text-accent-green" : "text-accent-red"}>
                {wsConnected ? "WS ✓" : "WS ✗"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-4">
          <PositionsPanel />
          <MarketAnalysisPanel />
          <RecentTransactionsPanel />
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          <StrategyPanel />
          <RiskPanel />
          <ControlPanel />
        </div>
      </div>

      {/* Bottom: Grok Chat */}
      <GrokChatPanel />
    </div>
  );
}

