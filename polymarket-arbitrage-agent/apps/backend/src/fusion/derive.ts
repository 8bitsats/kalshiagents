import type { FusedState, Level } from "../../../packages/types/src/fused.js";

function sumTopDepth(levels: Level[], n = 10): number {
  return levels.slice(0, n).reduce((acc, l) => acc + l.sz, 0);
}

function imbalance(bids: Level[], asks: Level[], n = 10): number {
  const b = sumTopDepth(bids, n);
  const a = sumTopDepth(asks, n);
  const denom = Math.max(1e-9, b + a);
  return (b - a) / denom;
}

export function deriveMetrics(state: {
  pm: {
    up: { bid: number; ask: number; depth: Level[] };
    down: { bid: number; ask: number; depth: Level[] };
  };
  binance: {
    price: number;
    cvd: number;
    flowImbalance: number;
    whaleScore: number;
    vol: number;
    momentum: number;
  };
}): FusedState["derived"] {
  const up = state.pm.up;
  const down = state.pm.down;

  const sumAsk = up.ask + down.ask;
  const spreadUp = up.ask - up.bid;
  const spreadDown = down.ask - down.bid;

  const depthImbalanceUp = imbalance(up.depth.filter((l) => l.px <= up.bid), up.depth.filter((l) => l.px >= up.ask), 10);
  const depthImbalanceDown = imbalance(
    down.depth.filter((l) => l.px <= down.bid),
    down.depth.filter((l) => l.px >= down.ask),
    10
  );

  // Dislocation score: composite of spread tightness, depth, and binance flow
  const spreadTightness = 1.0 - Math.max(0, (spreadUp + spreadDown) / 0.1); // tighter = better
  const depthScore = Math.min(1, (sumTopDepth(up.depth, 10) + sumTopDepth(down.depth, 10)) / 50_000);
  const flowScore = Math.min(1, Math.abs(state.binance.flowImbalance));
  const dislocationScore = Math.max(0, Math.min(1, 0.4 * spreadTightness + 0.3 * depthScore + 0.3 * flowScore));

  return {
    sumAsk,
    spreadUp,
    spreadDown,
    depthImbalanceUp,
    depthImbalanceDown,
    dislocationScore,
  };
}

