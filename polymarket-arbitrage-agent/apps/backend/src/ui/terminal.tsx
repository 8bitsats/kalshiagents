import React, { useEffect, useState } from "react";
import { Box, Text } from "ink";
import type { FusedState, StrategyDecision } from "@packages/types/fused.js";

export type TerminalProps = {
  state: FusedState | null;
  decision: StrategyDecision | null;
  strategy: string;
  mode: "AUTONOMOUS" | "HITL";
  isPaused: boolean;
  riskFlags: string[];
};

function pct(x: number) {
  return `${(x * 100).toFixed(2)}%`;
}

function fmt(x: number, d = 4) {
  return x.toFixed(d);
}

function bar(value: number, width = 28) {
  const v = Math.max(0, Math.min(1, value));
  const n = Math.round(v * width);
  return "█".repeat(n) + "░".repeat(width - n);
}

export function TerminalDashboard(props: TerminalProps) {
  const { state, decision, strategy, mode, isPaused, riskFlags } = props;

  if (!state) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text color="yellow">⏳ Waiting for market data...</Text>
      </Box>
    );
  }

  const pm = state.pm;
  const derived = state.derived;
  const portfolio = state.portfolio;

  return (
    <Box flexDirection="column" padding={1}>
      {/* Header */}
      <Box borderStyle="round" paddingX={2} marginBottom={1}>
        <Text bold>Polymarket Arbitrage Agent by FunPump.ai</Text>
        <Text>  </Text>
        <Text dimColor>Round: {pm.roundId}</Text>
        <Text>  </Text>
        <Text dimColor>T-{pm.secondsRemaining}s</Text>
        <Text>  </Text>
        <Text color={isPaused ? "red" : "green"}>{isPaused ? "PAUSED" : "RUNNING"}</Text>
        <Text>  </Text>
        <Text color={mode === "AUTONOMOUS" ? "blue" : "yellow"}>{mode}</Text>
      </Box>

      {/* Positions */}
      <Box borderStyle="round" paddingX={2} marginBottom={1} flexDirection="column">
        <Text bold>📊 POSITIONS</Text>
        <Box justifyContent="space-between">
          <Box flexDirection="column" width="50%">
            <Text color="green">▲ UP</Text>
            <Text>
              {bar(Math.min(1, portfolio.positions.upShares / 30000))} {Math.round(portfolio.positions.upShares)} @{" "}
              {fmt(portfolio.positions.avgUp)}
            </Text>
            <Text dimColor>
              Bid: {fmt(pm.up.bid)} | Ask: {fmt(pm.up.ask)} | PnL: ${portfolio.pnl.unrealized.toFixed(2)}
            </Text>
          </Box>
          <Box flexDirection="column" width="50%">
            <Text color="red">▼ DOWN</Text>
            <Text>
              {bar(Math.min(1, portfolio.positions.downShares / 30000))} {Math.round(portfolio.positions.downShares)} @{" "}
              {fmt(portfolio.positions.avgDown)}
            </Text>
            <Text dimColor>
              Bid: {fmt(pm.down.bid)} | Ask: {fmt(pm.down.ask)} | PnL: ${portfolio.pnl.unrealized.toFixed(2)}
            </Text>
          </Box>
        </Box>
        <Text>
          Total PnL: <Text color={portfolio.pnl.total >= 0 ? "green" : "red"}>${portfolio.pnl.total.toFixed(2)}</Text>
        </Text>
      </Box>

      {/* Market Analysis */}
      <Box borderStyle="round" paddingX={2} marginBottom={1} flexDirection="column">
        <Text bold>≡ MARKET ANALYSIS ≡</Text>
        <Text>
          UP: <Text color="green">{fmt(pm.up.ask)}</Text> | DOWN: <Text color="red">{fmt(pm.down.ask)}</Text> | Sum:{" "}
          {fmt(derived.sumAsk)} | Spread:{" "}
          <Text color={derived.spreadUp + derived.spreadDown > 0.02 ? "red" : "green"}>
            {pct(derived.spreadUp + derived.spreadDown)}
          </Text>
        </Text>
        <Text>
          Dislocation: {fmt(derived.dislocationScore, 3)} | BTC: ${state.binance.price.toFixed(0)} | CVD:{" "}
          {state.binance.cvd.toFixed(0)} | Flow: {state.binance.flowImbalance.toFixed(2)}
        </Text>
      </Box>

      {/* Strategy */}
      <Box borderStyle="round" paddingX={2} marginBottom={1} flexDirection="column">
        <Text bold>🤖 STRATEGY: {strategy}</Text>
        {decision && (
          <>
            <Text>
              Decision: <Text color="cyan">{decision.type}</Text>
            </Text>
            <Text dimColor>{decision.reason}</Text>
            {decision.type !== "NOOP" && (
              <Text>
                Tier: {decision.tier} | Confidence: {pct(decision.confidence)}
              </Text>
            )}
            {decision.risk.length > 0 && (
              <Text color="yellow">⚠️ Risk: {decision.risk.join(", ")}</Text>
            )}
          </>
        )}
      </Box>

      {/* Risk */}
      {riskFlags.length > 0 && (
        <Box borderStyle="round" paddingX={2} marginBottom={1} borderColor="red">
          <Text bold color="red">
            ⚠️ RISK FLAGS
          </Text>
          {riskFlags.map((flag, i) => (
            <Text key={i} color="red">
              - {flag}
            </Text>
          ))}
        </Box>
      )}

      <Text dimColor>Pure precision. No emotion. Just edge.</Text>
    </Box>
  );
}

