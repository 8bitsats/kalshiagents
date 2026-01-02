import fs from "node:fs";
import readline from "node:readline";
import type { FusedState } from "@packages/types/fused.js";
import { buildStrategy } from "../strategies/index.js";
import { PaperSim } from "../execution/paper.js";
import { reduceOpenLegPairMetrics } from "./reduce_open_leg_pair_metrics.js";

export type ReplayStats = {
  roundsSeen: number;
  entries: number;
  completedPairs: number;
  leg1Entries: number;
  leg2Entries: number;
  avgPairCost: number;
  medianPairCost: number;
  p10PairCost: number;
  p90PairCost: number;
  withinBandPct: number;
  overshootPct: number;
  avgUnpairedSec: number;
  medianUnpairedSec: number;
  p90UnpairedSec: number;
  totalPnL: number;
  avgPnLPerRound: number;
  entryRate: number;
  completionRate: number;
  pairRate: number;
};

export type ReplayReport = {
  file: string;
  strategy: string;
  stats: ReplayStats;
  equityCurve: Array<{ ts: number; pnl: number }>;
};

export async function runReplay(
  filePath: string,
  strategyName: string,
  strategyParams: Record<string, any>
): Promise<ReplayReport> {
  const strategy = buildStrategy(strategyName, strategyParams);
  const sim = new PaperSim();

  const stats: Partial<ReplayStats> = {
    roundsSeen: 0,
    entries: 0,
    completedPairs: 0,
    leg1Entries: 0,
    leg2Entries: 0,
    totalPnL: 0,
    entryRate: 0,
    completionRate: 0,
    pairRate: 0,
  };

  const pairCosts: number[] = [];
  const unpairedDurations: number[] = [];
  const equityCurve: Array<{ ts: number; pnl: number }> = [];

  let currentRoundId = "";
  let leg1EntryTs: number | null = null;
  let roundStartPnL = 0;

  const input = fs.createReadStream(filePath, { encoding: "utf8" });
  const rl = readline.createInterface({ input, crlfDelay: Infinity });

  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    let snapshot: any;
    try {
      snapshot = JSON.parse(trimmed);
    } catch {
      continue;
    }

    const state = snapshot.state as FusedState | undefined;
    const strategyState = snapshot.strategy || {};

    if (!state) continue;

    // Round transition
    if (state.pm.roundId !== currentRoundId) {
      if (currentRoundId) {
        stats.roundsSeen = (stats.roundsSeen || 0) + 1;
        const roundPnL = sim.totalPnL() - roundStartPnL;
        stats.totalPnL = (stats.totalPnL || 0) + roundPnL;
      }
      currentRoundId = state.pm.roundId;
      strategy.onRoundReset(state.pm.roundId);
      roundStartPnL = sim.totalPnL();
      leg1EntryTs = null;
    }

    // Update marks
    sim.setMarks((state.pm.up.bid + state.pm.up.ask) / 2, (state.pm.down.bid + state.pm.down.ask) / 2);

    // Run strategy
    const decision = await strategy.onTick(state, {
      nowMs: () => state.ts,
      exec: sim,
      memory: {},
    });

    // Track decisions
    if (decision.type === "BUY_ONE" || decision.type === "HEDGE") {
      stats.entries = (stats.entries || 0) + 1;
      if (!leg1EntryTs) {
        stats.leg1Entries = (stats.leg1Entries || 0) + 1;
        leg1EntryTs = state.ts;
      } else {
        stats.leg2Entries = (stats.leg2Entries || 0) + 1;
        const unpairedSec = (state.ts - leg1EntryTs) / 1000;
        unpairedDurations.push(unpairedSec);
        leg1EntryTs = null;
      }
    }

    if (decision.type === "BUY_BOTH") {
      stats.entries = (stats.entries || 0) + 1;
      stats.completedPairs = (stats.completedPairs || 0) + 1;
      const pairCost = state.pm.up.ask + state.pm.down.ask;
      pairCosts.push(pairCost);
    }

    // Track pair completion from strategy state
    if (strategyState.phase === "DONE" || strategyState.phase === "PAIRED_HOLDING") {
      if (strategyState.leg1 && strategyState.leg2) {
        stats.completedPairs = (stats.completedPairs || 0) + 1;
        const pairCost = strategyState.leg1.ask + strategyState.leg2.ask;
        pairCosts.push(pairCost);
      }
    }

    // Record equity curve
    equityCurve.push({ ts: state.ts, pnl: sim.totalPnL() });
  }

  // Finalize stats
  const finalStats: ReplayStats = {
    roundsSeen: stats.roundsSeen || 0,
    entries: stats.entries || 0,
    completedPairs: stats.completedPairs || 0,
    leg1Entries: stats.leg1Entries || 0,
    leg2Entries: stats.leg2Entries || 0,
    avgPairCost: pairCosts.length ? pairCosts.reduce((a, b) => a + b, 0) / pairCosts.length : 0,
    medianPairCost: pairCosts.length ? [...pairCosts].sort((a, b) => a - b)[Math.floor(pairCosts.length / 2)] : 0,
    p10PairCost: pairCosts.length ? [...pairCosts].sort((a, b) => a - b)[Math.floor(pairCosts.length * 0.1)] : 0,
    p90PairCost: pairCosts.length ? [...pairCosts].sort((a, b) => a - b)[Math.floor(pairCosts.length * 0.9)] : 0,
    withinBandPct: pairCosts.length
      ? pairCosts.filter((c) => c >= 0.84 && c <= 0.96).length / pairCosts.length
      : 0,
    overshootPct: pairCosts.length ? pairCosts.filter((c) => c > 0.96).length / pairCosts.length : 0,
    avgUnpairedSec: unpairedDurations.length ? unpairedDurations.reduce((a, b) => a + b, 0) / unpairedDurations.length : 0,
    medianUnpairedSec: unpairedDurations.length
      ? [...unpairedDurations].sort((a, b) => a - b)[Math.floor(unpairedDurations.length / 2)]
      : 0,
    p90UnpairedSec: unpairedDurations.length
      ? [...unpairedDurations].sort((a, b) => a - b)[Math.floor(unpairedDurations.length * 0.9)]
      : 0,
    totalPnL: stats.totalPnL || 0,
    avgPnLPerRound: (stats.roundsSeen || 0) > 0 ? (stats.totalPnL || 0) / (stats.roundsSeen || 0) : 0,
    entryRate: (stats.roundsSeen || 0) > 0 ? (stats.entries || 0) / (stats.roundsSeen || 0) : 0,
    completionRate: (stats.leg1Entries || 0) > 0 ? (stats.completedPairs || 0) / (stats.leg1Entries || 0) : 0,
    pairRate: (stats.roundsSeen || 0) > 0 ? (stats.completedPairs || 0) / (stats.roundsSeen || 0) : 0,
  };

  return {
    file: filePath,
    strategy: strategyName,
    stats: finalStats,
    equityCurve: equityCurve.slice(-1000), // Last 1000 points
  };
}

export async function runOpenLegPairReplay(
  filePath: string,
  params: { pairTarget: number; maxUnpairedSec: number }
) {
  return reduceOpenLegPairMetrics(filePath, params);
}

