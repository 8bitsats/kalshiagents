import { BaseStrategy } from "./base.js";
import type { StrategyDecision, StrategyContext, FusedState, Side } from "../../../packages/types/src/fused.js";

export type OpenLegDislocationParams = {
  shares: number;
  enterDelaySec: number;
  firstLegMode: "CHEAPER_ASK" | "BINANCE_MOMENTUM" | "DISLOCATION_SIDE";
  maxLeg1Cost: number;
  targetPairCost: number;
  minPairCost?: number;
  maxPairCost?: number;
  minDislocationScore: number;
  priceChangeTriggerPct: number;
  maxWaitForLeg2Sec: number;
  abortIfNoLeg2BySecRemaining: number;
  cooldownSec: number;
  maxPairsPerRound: number;
};

type RoundMemory = {
  roundId: string;
  roundStartMs: number;
  lastActionTs?: number;
  pairsOpened: number;
  leg1?: { side: Side; ask: number; ts: number; shares: number };
  leg2?: { side: Side; ask: number; ts: number; shares: number };
};

function pctChange(a: number, b: number): number {
  if (a <= 0) return 0;
  return Math.abs(b - a) / a;
}

function pickFirstLegSide(state: FusedState, params: OpenLegDislocationParams): Side {
  const upAsk = state.pm.up.ask;
  const downAsk = state.pm.down.ask;

  if (params.firstLegMode === "CHEAPER_ASK") {
    return upAsk <= downAsk ? "UP" : "DOWN";
  }

  if (params.firstLegMode === "BINANCE_MOMENTUM") {
    if (state.binance.momentum > 0) return "UP";
    if (state.binance.momentum < 0) return "DOWN";
    return upAsk <= downAsk ? "UP" : "DOWN";
  }

  // DISLOCATION_SIDE
  const scoreUp = state.derived.spreadUp + (1 - state.derived.depthImbalanceUp);
  const scoreDown = state.derived.spreadDown + (1 - state.derived.depthImbalanceDown);
  return scoreUp >= scoreDown ? "UP" : "DOWN";
}

export class OpenLegDislocationPair extends BaseStrategy {
  readonly name = "open_leg_dislocation_pair";
  private mem: RoundMemory = {
    roundId: "",
    roundStartMs: 0,
    pairsOpened: 0,
  };

  constructor(private params: OpenLegDislocationParams) {
    super();
  }

  onRoundReset(roundId: string): void {
    this.mem = {
      roundId,
      roundStartMs: 0,
      lastActionTs: undefined,
      pairsOpened: 0,
      leg1: undefined,
      leg2: undefined,
    };
  }

  async onTick(state: FusedState, ctx: StrategyContext): Promise<StrategyDecision> {
    const ts = ctx.nowMs();
    const p = this.params;

    // Initialize round memory
    if (state.pm.roundId !== this.mem.roundId) {
      this.onRoundReset(state.pm.roundId);
    }
    if (!this.mem.roundStartMs) this.mem.roundStartMs = state.pm.roundStartMs;

    // Global guards
    if (this.mem.pairsOpened >= p.maxPairsPerRound) {
      return { type: "NOOP", reason: "maxPairsPerRound reached", tier: 0, confidence: 0, risk: [] };
    }

    if (this.mem.lastActionTs && ts - this.mem.lastActionTs < p.cooldownSec * 1000) {
      return { type: "NOOP", reason: "cooldown", tier: 0, confidence: 0, risk: [] };
    }

    if (state.pm.secondsRemaining <= p.abortIfNoLeg2BySecRemaining && this.mem.leg1 && !this.mem.leg2) {
      return { type: "NOOP", reason: "too late to complete pair", tier: 0, confidence: 0, risk: [] };
    }

    const upAsk = state.pm.up.ask;
    const downAsk = state.pm.down.ask;
    const sumAsk = state.derived.sumAsk;

    // Step 1: Place Leg 1 shortly after open
    if (!this.mem.leg1) {
      const sinceOpenSec = (ts - this.mem.roundStartMs) / 1000;
      if (sinceOpenSec < p.enterDelaySec) {
        return {
          type: "NOOP",
          reason: `waiting enterDelaySec (${sinceOpenSec.toFixed(1)}s)`,
          tier: 0,
          confidence: 0,
          risk: [],
        };
      }

      const side = pickFirstLegSide(state, p);
      const ask = side === "UP" ? upAsk : downAsk;

      if (ask > p.maxLeg1Cost) {
        return {
          type: "NOOP",
          reason: `leg1 ask too high (${ask.toFixed(3)} > ${p.maxLeg1Cost})`,
          tier: 0,
          confidence: 0,
          risk: [],
        };
      }

      this.mem.leg1 = { side, ask, ts, shares: p.shares };
      this.mem.lastActionTs = ts;

      return {
        type: side === "UP" ? "BUY_ONE" : "BUY_ONE",
        side,
        shares: p.shares,
        tier: 1,
        confidence: 0.7,
        reason: `Leg1 entered ${side} @${ask.toFixed(3)} after open (${p.firstLegMode})`,
        risk: ["UNPAIRED_EXPOSURE"],
      };
    }

    // Step 2: Wait for dislocation / price change to complete Leg 2
    if (this.mem.leg1 && !this.mem.leg2) {
      const leg1Side = this.mem.leg1.side;
      const leg2Side: Side = leg1Side === "UP" ? "DOWN" : "UP";
      const leg1NowAsk = leg1Side === "UP" ? upAsk : downAsk;
      const leg2NowAsk = leg2Side === "UP" ? upAsk : downAsk;

      const waitedSec = (ts - this.mem.leg1.ts) / 1000;
      if (waitedSec > p.maxWaitForLeg2Sec) {
        return {
          type: "NOOP",
          reason: `maxWaitForLeg2Sec exceeded (${waitedSec.toFixed(0)}s)`,
          tier: 0,
          confidence: 0,
          risk: ["UNPAIRED_EXPOSURE"],
        };
      }

      const priceMovedEnough = pctChange(this.mem.leg1.ask, leg1NowAsk) >= p.priceChangeTriggerPct;

      const dislocationOk =
        sumAsk <= p.targetPairCost &&
        (p.maxPairCost ? sumAsk <= p.maxPairCost : true) &&
        (p.minPairCost ? sumAsk >= p.minPairCost : true) &&
        state.derived.dislocationScore >= p.minDislocationScore;

      const relaxedSumOk =
        sumAsk <= p.targetPairCost &&
        (p.maxPairCost ? sumAsk <= p.maxPairCost : true) &&
        (p.minPairCost ? sumAsk >= p.minPairCost : true);

      if (dislocationOk || (priceMovedEnough && relaxedSumOk)) {
        this.mem.leg2 = { side: leg2Side, ask: leg2NowAsk, ts, shares: p.shares };
        this.mem.lastActionTs = ts;
        this.mem.pairsOpened += 1;

        return {
          type: leg2Side === "UP" ? "BUY_ONE" : "BUY_ONE",
          side: leg2Side,
          shares: p.shares,
          tier: 1,
          confidence: 0.9,
          reason: `Leg2 paired ${leg2Side} @${leg2NowAsk.toFixed(3)} | sumAsk=${sumAsk.toFixed(3)} | dislocation=${state.derived.dislocationScore.toFixed(2)} | moved=${priceMovedEnough}`,
          risk: [],
        };
      }

      return {
        type: "NOOP",
        reason: `waiting Leg2: sumAsk=${sumAsk.toFixed(3)} disloc=${state.derived.dislocationScore.toFixed(2)} moved=${priceMovedEnough}`,
        tier: 0,
        confidence: 0,
        risk: ["UNPAIRED_EXPOSURE"],
      };
    }

    return { type: "NOOP", reason: "paired holding until settlement", tier: 0, confidence: 0, risk: [] };
  }
}

