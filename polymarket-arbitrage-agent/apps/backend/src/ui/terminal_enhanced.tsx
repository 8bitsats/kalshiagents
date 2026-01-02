import React, { useEffect, useMemo, useRef, useState } from "react";
import { render, Box, Text } from "ink";
import type { FusedState, StrategyDecision } from "@packages/types/fused.js";
import type { Fill } from "../execution/paper.js";

export type TerminalEnhancedProps = {
  state: FusedState | null;
  decision: StrategyDecision | null;
  strategy: string;
  mode: "AUTONOMOUS" | "HITL";
  isPaused: boolean;
  riskFlags: string[];
  fills: Fill[];
  btcPrice?: number;
  wsLast?: string;
};

function fmt(x: number, d = 4) {
  return x.toFixed(d);
}

function fmtPct(x: number) {
  return `${(x * 100).toFixed(2)}%`;
}

function fmtTime(ts: number) {
  const d = new Date(ts);
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit", fractionalSecondDigits: 2 });
}

function bar(value: number, width = 40, color: "green" | "red" = "green") {
  const v = Math.max(0, Math.min(1, value));
  const n = Math.round(v * width);
  const blocks = color === "green" ? "█" : "█";
  return blocks.repeat(n) + "░".repeat(width - n);
}

function formatOrderBook(levels: Array<{ px: number; sz: number }>, maxRows = 10) {
  return levels.slice(0, maxRows).map((l) => `${fmtPct(l.px)} @ ${Math.round(l.sz)}`).join("\n");
}

export function TerminalEnhanced(props: TerminalEnhancedProps) {
  const { state, decision, strategy, mode, isPaused, riskFlags, fills, btcPrice, wsLast } = props;

  const recentFills = useMemo(() => fills.slice(0, 6), [fills]);

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

  const upBid = pm.up.bid;
  const upAsk = pm.up.ask;
  const downBid = pm.down.bid;
  const downAsk = pm.down.ask;

  const combinedAsk = upAsk + downAsk;
  const spreadCost = (upAsk - upBid) + (downAsk - downBid);
  const spreadPct = spreadCost / Math.max(1e-9, combinedAsk);

  const pairs = portfolio.positions.upShares > 0 && portfolio.positions.downShares > 0
    ? Math.min(portfolio.positions.upShares, portfolio.positions.downShares)
    : 0;
  const delta = portfolio.positions.upShares - portfolio.positions.downShares;

  return (
    <Box flexDirection="column" padding={1}>
      {/* Header */}
      <Box borderStyle="round" borderColor="cyan" paddingX={1} marginBottom={1}>
        <Text bold color="cyan">
          {pm.market || "BTC Up/Down 15m"} | {pm.roundId}
        </Text>
        <Text>  </Text>
        <Text dimColor>T-{pm.secondsRemaining}s</Text>
        <Text>  </Text>
        {wsLast && <Text dimColor>• WS Last: {wsLast}</Text>}
        <Text>  </Text>
        <Text color={isPaused ? "red" : "green"}>{isPaused ? "PAUSED" : "RUNNING"}</Text>
        <Text>  </Text>
        <Text color={mode === "AUTONOMOUS" ? "blue" : "yellow"}>{mode}</Text>
      </Box>

      {/* Positions Section */}
      <Box borderStyle="round" borderColor="blue" paddingX={1} marginBottom={1} flexDirection="column">
        <Text bold color="cyan">POSITIONS</Text>
        <Box justifyContent="space-between" marginTop={1}>
          <Box flexDirection="column" width="50%">
            <Text color="green">▲ UP</Text>
            <Text>
              Cost: ${portfolio.positions.upShares * portfolio.positions.avgUp}
            </Text>
            <Text>
              Avg: ${fmt(portfolio.positions.avgUp)}
            </Text>
            <Text>
              Qty: {Math.round(portfolio.positions.upShares)}
            </Text>
            <Text>
              Current: @{fmt(upAsk)}
            </Text>
            <Text color={portfolio.pnl.unrealized >= 0 ? "green" : "red"}>
              PnL: {portfolio.pnl.unrealized >= 0 ? "+" : ""}${portfolio.pnl.unrealized.toFixed(2)}
            </Text>
          </Box>
          <Box flexDirection="column" width="50%">
            <Text color="red">▼ DOWN</Text>
            <Text>
              Cost: ${portfolio.positions.downShares * portfolio.positions.avgDown}
            </Text>
            <Text>
              Avg: ${fmt(portfolio.positions.avgDown)}
            </Text>
            <Text>
              Qty: {Math.round(portfolio.positions.downShares)}
            </Text>
            <Text>
              Current: @{fmt(downAsk)}
            </Text>
            <Text color={portfolio.pnl.unrealized >= 0 ? "green" : "red"}>
              PnL: {portfolio.pnl.unrealized >= 0 ? "+" : ""}${portfolio.pnl.unrealized.toFixed(2)}
            </Text>
          </Box>
        </Box>
      </Box>

      {/* Market Analysis */}
      <Box borderStyle="round" borderColor="blue" paddingX={1} marginBottom={1} flexDirection="column">
        <Text bold color="cyan">MARKET ANALYSIS</Text>
        <Text>
          UP: <Text color="green">${fmt(upAsk)}</Text> | DOWN: <Text color="red">${fmt(downAsk)}</Text>
        </Text>
        <Text>
          Combined: ${fmt(combinedAsk)}
        </Text>
        <Text>
          Spread: <Text color={spreadPct > 0.03 ? "red" : "green"}>{fmtPct(spreadPct)}</Text>
        </Text>
        {btcPrice && (
          <Text>
            BTC: ${btcPrice.toFixed(0)} | CVD: {state.binance.cvd.toFixed(0)} | Flow: {state.binance.flowImbalance.toFixed(2)}
          </Text>
        )}
        <Text>
          Pairs: {pairs} | Delta: {delta} | Total PnL: <Text color={portfolio.pnl.total >= 0 ? "green" : "red"}>${portfolio.pnl.total.toFixed(2)}</Text>
        </Text>
      </Box>

      {/* Order Books */}
      <Box justifyContent="space-between" marginBottom={1}>
        <Box borderStyle="round" borderColor="green" paddingX={1} width="48%" flexDirection="column">
          <Text bold color="green">UP ORDER BOOK</Text>
          <Text>
            Bid: {fmtPct(upBid)} | Ask: {fmtPct(upAsk)}
          </Text>
          <Text dimColor>BIDS ({pm.up.depth?.filter((d) => d.px <= upBid).length || 0})</Text>
          <Text>
            {pm.up.depth?.filter((d) => d.px <= upBid).slice(0, 10).map((l, i) => (
              <Text key={i}>
                {fmtPct(l.px)} @ {Math.round(l.sz)}
                {"\n"}
              </Text>
            ))}
          </Text>
          <Text dimColor>ASKS ({pm.up.depth?.filter((d) => d.px >= upAsk).length || 0})</Text>
          <Text>
            {pm.up.depth?.filter((d) => d.px >= upAsk).slice(0, 10).map((l, i) => (
              <Text key={i}>
                {fmtPct(l.px)} @ {Math.round(l.sz)}
                {"\n"}
              </Text>
            ))}
          </Text>
        </Box>

        <Box borderStyle="round" borderColor="red" paddingX={1} width="48%" flexDirection="column">
          <Text bold color="red">DOWN ORDER BOOK</Text>
          <Text>
            Bid: {fmtPct(downBid)} | Ask: {fmtPct(downAsk)}
          </Text>
          <Text dimColor>BIDS ({pm.down.depth?.filter((d) => d.px <= downBid).length || 0})</Text>
          <Text>
            {pm.down.depth?.filter((d) => d.px <= downBid).slice(0, 10).map((l, i) => (
              <Text key={i}>
                {fmtPct(l.px)} @ {Math.round(l.sz)}
                {"\n"}
              </Text>
            ))}
          </Text>
          <Text dimColor>ASKS ({pm.down.depth?.filter((d) => d.px >= downAsk).length || 0})</Text>
          <Text>
            {pm.down.depth?.filter((d) => d.px >= downAsk).slice(0, 10).map((l, i) => (
              <Text key={i}>
                {fmtPct(l.px)} @ {Math.round(l.sz)}
                {"\n"}
              </Text>
            ))}
          </Text>
        </Box>
      </Box>

      {/* Recent Transactions */}
      <Box borderStyle="round" borderColor="yellow" paddingX={1} marginBottom={1} flexDirection="column">
        <Text bold color="cyan">RECENT TRANSACTIONS</Text>
        <Box>
          <Text width={12}>TIME</Text>
          <Text width={8}>SIDE</Text>
          <Text width={10}>PRICE</Text>
          <Text width={8}>SIZE</Text>
          {btcPrice && <Text width={12}>BTC PRICE</Text>}
          <Text width={20}>TX HASH</Text>
        </Box>
        {recentFills.map((fill, i) => (
          <Box key={i}>
            <Text width={12}>{fmtTime(fill.t)}</Text>
            <Text width={8} color={fill.leg === "UP" ? "green" : "red"}>
              {fill.leg === "UP" ? "▲ UP" : "▼ DOWN"}
            </Text>
            <Text width={10}>${fmt(fill.price)}</Text>
            <Text width={8}>{Math.round(fill.size)}</Text>
            {btcPrice && <Text width={12}>${btcPrice.toFixed(0)}</Text>}
            <Text width={20} dimColor>{fill.ref || "paper"}</Text>
          </Box>
        ))}
        <Box marginTop={1}>
          <Text>
            Trades: {fills.length} | Volume: ${(fills.reduce((sum, f) => sum + f.price * f.size, 0)).toFixed(2)}
          </Text>
        </Box>
      </Box>

      {/* Strategy */}
      <Box borderStyle="round" borderColor="magenta" paddingX={1} marginBottom={1} flexDirection="column">
        <Text bold color="cyan">STRATEGY: {strategy}</Text>
        {decision && (
          <>
            <Text>
              Decision: <Text color="cyan">{decision.type}</Text>
            </Text>
            <Text dimColor>{decision.reason}</Text>
          </>
        )}
      </Box>

      {/* Risk */}
      {riskFlags.length > 0 && (
        <Box borderStyle="round" borderColor="red" paddingX={1} marginBottom={1}>
          <Text bold color="red">⚠️ RISK FLAGS</Text>
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

