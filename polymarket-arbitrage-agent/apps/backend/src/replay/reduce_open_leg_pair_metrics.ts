import fs from "node:fs";
import readline from "node:readline";

type Side = "UP" | "DOWN";

type TickLine = {
  type: "tick";
  ts: number;
  pm: {
    roundId: string;
    roundStartMs: number;
    secondsRemaining: number;
    up: { ask: number; bid: number };
    down: { ask: number; bid: number };
  };
};

type TradeLine = {
  type: "trade";
  ts: number;
  roundId: string;
  strategy: "open_leg_dislocation_pair";
  leg: 1 | 2;
  side: Side;
  shares: number;
  px: number;
};

type JsonlLine = TickLine | TradeLine;

export type OpenLegPairReplayParams = {
  pairTarget: number;
  maxUnpairedSec: number;
};

type PerRound = {
  roundId: string;
  roundStartMs: number;
  lastTickTs: number;
  lastOppAsk: number | null;
  lastPairCostIfNow: number | null;
  belowTarget: boolean;
  belowTargetEnterTs: number | null;
  leg1Side: Side | null;
  leg1Ts: number | null;
  leg1Px: number | null;
  leg2Ts: number | null;
  leg2Px: number | null;
  minPairCostSeen: number | null;
  timeBelowTargetMs: number;
  unpairedExposureAuc: number;
  maxUnpairedMs: number;
};

type Agg = {
  roundsWithLeg1: number;
  roundsCompleted: number;
  roundsMissedOpp: number;
  roundsMaxUnpairedBreached: number;
  sumUnpairedMsCompleted: number;
  sumUnpairedMsAll: number;
  sumPairCost: number;
  minPairCost: number;
  maxPairCost: number;
  sumMinPairCostSeenWhileUnpaired: number;
  countMinPairCostSeenWhileUnpaired: number;
  sumTimeBelowTargetMs: number;
  sumUnpairedExposureAuc: number;
};

function otherSide(side: Side): Side {
  return side === "UP" ? "DOWN" : "UP";
}

function initPerRound(roundId: string, roundStartMs: number, ts: number): PerRound {
  return {
    roundId,
    roundStartMs,
    lastTickTs: ts,
    lastOppAsk: null,
    lastPairCostIfNow: null,
    belowTarget: false,
    belowTargetEnterTs: null,
    leg1Side: null,
    leg1Ts: null,
    leg1Px: null,
    leg2Ts: null,
    leg2Px: null,
    minPairCostSeen: null,
    timeBelowTargetMs: 0,
    unpairedExposureAuc: 0,
    maxUnpairedMs: 0,
  };
}

function finalizeBelowTargetWindow(r: PerRound, endTs: number) {
  if (r.belowTarget && r.belowTargetEnterTs != null) {
    r.timeBelowTargetMs += Math.max(0, endTs - r.belowTargetEnterTs);
  }
  r.belowTarget = false;
  r.belowTargetEnterTs = null;
}

function finalizeRound(agg: Agg, r: PerRound, roundEndTs: number, params: OpenLegPairReplayParams) {
  if (!r.leg1Ts || r.leg1Px == null || r.leg1Side == null) return;

  finalizeBelowTargetWindow(r, roundEndTs);

  agg.roundsWithLeg1 += 1;

  const paired = r.leg2Ts != null && r.leg2Px != null;
  const unpairedMs = paired ? (r.leg2Ts! - r.leg1Ts) : (roundEndTs - r.leg1Ts);

  agg.sumUnpairedMsAll += Math.max(0, unpairedMs);
  if (paired) {
    agg.roundsCompleted += 1;
    agg.sumUnpairedMsCompleted += Math.max(0, unpairedMs);

    const pairCost = r.leg1Px + r.leg2Px!;
    agg.sumPairCost += pairCost;
    agg.minPairCost = Math.min(agg.minPairCost, pairCost);
    agg.maxPairCost = Math.max(agg.maxPairCost, pairCost);
  } else {
    if (r.timeBelowTargetMs > 0) agg.roundsMissedOpp += 1;
  }

  if (unpairedMs / 1000 > params.maxUnpairedSec) agg.roundsMaxUnpairedBreached += 1;

  agg.sumTimeBelowTargetMs += r.timeBelowTargetMs;
  agg.sumUnpairedExposureAuc += r.unpairedExposureAuc;

  if (r.minPairCostSeen != null) {
    agg.sumMinPairCostSeenWhileUnpaired += r.minPairCostSeen;
    agg.countMinPairCostSeenWhileUnpaired += 1;
  }
}

export async function reduceOpenLegPairMetrics(filePath: string, params: OpenLegPairReplayParams) {
  const agg: Agg = {
    roundsWithLeg1: 0,
    roundsCompleted: 0,
    roundsMissedOpp: 0,
    roundsMaxUnpairedBreached: 0,
    sumUnpairedMsCompleted: 0,
    sumUnpairedMsAll: 0,
    sumPairCost: 0,
    minPairCost: Number.POSITIVE_INFINITY,
    maxPairCost: Number.NEGATIVE_INFINITY,
    sumMinPairCostSeenWhileUnpaired: 0,
    countMinPairCostSeenWhileUnpaired: 0,
    sumTimeBelowTargetMs: 0,
    sumUnpairedExposureAuc: 0,
  };

  let r: PerRound | null = null;
  let lastSeenRoundId: string | null = null;
  let lastTickTsGlobal = 0;

  const rl = readline.createInterface({
    input: fs.createReadStream(filePath, { encoding: "utf8" }),
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    let obj: JsonlLine;
    try {
      obj = JSON.parse(trimmed);
    } catch {
      continue;
    }

    if (obj.type === "tick") {
      lastTickTsGlobal = obj.ts;

      if (lastSeenRoundId && obj.pm.roundId !== lastSeenRoundId) {
        if (r) finalizeRound(agg, r, r.lastTickTs, params);
        r = initPerRound(obj.pm.roundId, obj.pm.roundStartMs, obj.ts);
      }

      if (!r) r = initPerRound(obj.pm.roundId, obj.pm.roundStartMs, obj.ts);
      lastSeenRoundId = obj.pm.roundId;

      const dt = Math.max(0, obj.ts - r.lastTickTs);
      const unpaired = r.leg1Ts != null && r.leg2Ts == null && r.leg1Px != null && r.leg1Side != null;

      if (unpaired) {
        const opp = otherSide(r.leg1Side);
        const oppAsk = opp === "UP" ? obj.pm.up.ask : obj.pm.down.ask;
        const pairCostIfNow = r.leg1Px + oppAsk;

        r.unpairedExposureAuc += pairCostIfNow * (dt / 1000);

        r.minPairCostSeen = r.minPairCostSeen == null ? pairCostIfNow : Math.min(r.minPairCostSeen, pairCostIfNow);

        const isBelow = pairCostIfNow <= params.pairTarget;
        if (isBelow && !r.belowTarget) {
          r.belowTarget = true;
          r.belowTargetEnterTs = obj.ts;
        } else if (!isBelow && r.belowTarget) {
          finalizeBelowTargetWindow(r, obj.ts);
        }

        const unpairedMsSoFar = obj.ts - r.leg1Ts!;
        r.maxUnpairedMs = Math.max(r.maxUnpairedMs, Math.max(0, unpairedMsSoFar));

        r.lastOppAsk = oppAsk;
        r.lastPairCostIfNow = pairCostIfNow;
      }

      r.lastTickTs = obj.ts;
    }

    if (obj.type === "trade" && obj.strategy === "open_leg_dislocation_pair") {
      if (!r) {
        r = initPerRound(obj.roundId, 0, obj.ts);
        lastSeenRoundId = obj.roundId;
      }

      if (lastSeenRoundId && obj.roundId !== lastSeenRoundId) {
        finalizeRound(agg, r, r.lastTickTs, params);
        r = initPerRound(obj.roundId, 0, obj.ts);
        lastSeenRoundId = obj.roundId;
      }

      if (obj.leg === 1) {
        r.leg1Side = obj.side;
        r.leg1Ts = obj.ts;
        r.leg1Px = obj.px;
      } else if (obj.leg === 2) {
        r.leg2Ts = obj.ts;
        r.leg2Px = obj.px;
        finalizeBelowTargetWindow(r, obj.ts);
      }
    }
  }

  if (r) finalizeRound(agg, r, r.lastTickTs || lastTickTsGlobal, params);

  const completionRate = agg.roundsWithLeg1 > 0 ? agg.roundsCompleted / agg.roundsWithLeg1 : 0;
  const avgUnpairedCompletedMs = agg.roundsCompleted > 0 ? agg.sumUnpairedMsCompleted / agg.roundsCompleted : 0;
  const avgUnpairedAllMs = agg.roundsWithLeg1 > 0 ? agg.sumUnpairedMsAll / agg.roundsWithLeg1 : 0;

  const avgPairCost = agg.roundsCompleted > 0 ? agg.sumPairCost / agg.roundsCompleted : 0;

  const avgMinPairCostSeen =
    agg.countMinPairCostSeenWhileUnpaired > 0
      ? agg.sumMinPairCostSeenWhileUnpaired / agg.countMinPairCostSeenWhileUnpaired
      : 0;

  return {
    roundsWithLeg1: agg.roundsWithLeg1,
    roundsCompleted: agg.roundsCompleted,
    completionRate,

    avgUnpairedDurationMs_completed: avgUnpairedCompletedMs,
    avgUnpairedDurationMs_all: avgUnpairedAllMs,

    avgPairCost,
    minPairCost: Number.isFinite(agg.minPairCost) ? agg.minPairCost : null,
    maxPairCost: Number.isFinite(agg.maxPairCost) ? agg.maxPairCost : null,

    timeInDislocationMs_total: agg.sumTimeBelowTargetMs,
    missedOpportunitiesRounds: agg.roundsMissedOpp,

    avgBestPossiblePairCostWhileUnpaired: avgMinPairCostSeen,
    unpairedExposureAuc_total: agg.sumUnpairedExposureAuc,

    maxUnpairedSecBreaches: agg.roundsMaxUnpairedBreached,
  };
}

