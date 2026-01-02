import { BaseStrategy } from "./base.js";
import type { StrategyDecision, StrategyContext, FusedState, Side } from "@packages/types/fused.js";

export type OpenLegDislocationPairParams = {
  shares: number;
  openSide: "CHEAPER" | "UP" | "DOWN";
  openWithinSec: number;
  pairTarget: number;
  minOppMovePct: number;
  maxUnpairedSec: number;
  maxPairCost?: number;
  coolDownMs: number;
};

type DepthLevel = { px: number; sz: number };

export type StrategyOpenLegDislocationPairState = {
  name: "open_leg_dislocation_pair";
  ts: number;
  round: {
    roundId: string;
    roundStartMs: number;
    secondsRemaining: number;
    marketLabel: string;
  };
  params: OpenLegDislocationPairParams;
  leg1: null | {
    side: Side;
    shares: number;
    entryPx: number;
    entryTs: number;
    entryOppAskAtEntry: number;
    entryPairCostAtEntry: number;
    reason: string;
  };
  leg2: null | {
    side: Side;
    shares: number;
    entryPx: number;
    entryTs: number;
    pairCost: number;
    reason: string;
  };
  live: {
    up: { bid: number; ask: number; depthBids: DepthLevel[]; depthAsks: DepthLevel[] };
    down: { bid: number; ask: number; depthBids: DepthLevel[]; depthAsks: DepthLevel[] };
    sumAsk: number;
    pairCostIfPairedNow: number | null;
    requiredOppAsk: number | null;
    oppMovePct: number | null;
    bestPairCostSeen: number | null;
    timeBelowTargetMs: number;
  };
  risk: {
    unpairedMs: number;
    unpairedSec: number;
    maxUnpairedSec: number;
    unpairedExposureAuc: number;
    status: "OK" | "WARN" | "DANGER";
    flags: string[];
  };
  automation: {
    mode: "AUTO" | "HITL";
    agentEnabled: boolean;
    suggestedActions: Array<
      | { type: "PAUSE"; reason: string }
      | { type: "RESUME"; reason: string }
      | { type: "SET_PARAM"; key: keyof OpenLegDislocationPairParams; value: number | string; reason: string }
    >;
  };
};

type RoundMemory = {
  roundId: string;
  roundStartMs: number;
  lastTickTs: number;
  leg1?: {
    side: Side;
    shares: number;
    entryPx: number;
    entryTs: number;
    entryOppAskAtEntry: number;
    entryPairCostAtEntry: number;
    reason: string;
  };
  leg2?: {
    side: Side;
    shares: number;
    entryPx: number;
    entryTs: number;
    pairCost: number;
    reason: string;
  };
  belowTarget: boolean;
  belowTargetEnterTs: number | null;
  timeBelowTargetMs: number;
  bestPairCostSeen: number | null;
  unpairedExposureAuc: number;
  lastPairCostIfNow: number | null;
  lastActionMs: number;
};

const otherSide = (s: Side): Side => (s === "UP" ? "DOWN" : "UP");

// Removed unused clamp01 function

function pickOpenSide(params: OpenLegDislocationPairParams, upAsk: number, downAsk: number): Side {
  if (params.openSide === "UP") return "UP";
  if (params.openSide === "DOWN") return "DOWN";
  return upAsk <= downAsk ? "UP" : "DOWN";
}

function depthToBidsAsks(depth?: DepthLevel[]): { bids: DepthLevel[]; asks: DepthLevel[] } {
  return { bids: depth?.filter((d) => d.px <= 0.5) || [], asks: depth?.filter((d) => d.px >= 0.5) || [] };
}

export class OpenLegDislocationPairV2 extends BaseStrategy {
  public readonly name = "open_leg_dislocation_pair" as const;
  private mem: RoundMemory | null = null;
  private lastKnownUpAsk: number | null = null;
  private lastKnownDownAsk: number | null = null;

  constructor(private params: OpenLegDislocationPairParams) {
    super();
  }

  public setParams(next: Partial<OpenLegDislocationPairParams>) {
    this.params = { ...this.params, ...next };
  }

  public onFill(_fill: {
    ts: number;
    roundId: string;
    strategy: "open_leg_dislocation_pair";
    leg: 1 | 2;
    side: Side;
    shares: number;
    px: number;
    reason?: string;
  }) {
    const fill = _fill;
    if (!this.mem || this.mem.roundId !== fill.roundId) return;

    if (fill.leg === 1 && !this.mem.leg1) {
      const oppAskAtEntry = fill.side === "UP" ? this.lastKnownDownAsk ?? 0 : this.lastKnownUpAsk ?? 0;
      const entryPairCostAtEntry = fill.px + oppAskAtEntry;
      this.mem.leg1 = {
        side: fill.side,
        shares: fill.shares,
        entryPx: fill.px,
        entryTs: fill.ts,
        entryOppAskAtEntry: oppAskAtEntry,
        entryPairCostAtEntry,
        reason: fill.reason ?? "LEG1 fill",
      };
      return;
    }

    if (fill.leg === 2 && this.mem.leg1 && !this.mem.leg2) {
      const pairCost = this.mem.leg1.entryPx + fill.px;
      this.mem.leg2 = {
        side: fill.side,
        shares: fill.shares,
        entryPx: fill.px,
        entryTs: fill.ts,
        pairCost,
        reason: fill.reason ?? "LEG2 fill",
      };
      if (this.mem.belowTarget && this.mem.belowTargetEnterTs != null) {
        this.mem.timeBelowTargetMs += Math.max(0, fill.ts - this.mem.belowTargetEnterTs);
      }
      this.mem.belowTarget = false;
      this.mem.belowTargetEnterTs = null;
    }
  }

  onRoundReset(roundId: string): void {
    this.mem = null;
  }

  private integrateUnpairedStats(_fused: FusedState) {
    const fused = _fused;
    if (!this.mem) return;
    const dt = Math.max(0, fused.ts - this.mem.lastTickTs);
    this.mem.lastTickTs = fused.ts;
    if (!this.mem.leg1 || this.mem.leg2) return;

    const leg1 = this.mem.leg1;
    const opp = otherSide(leg1.side);
    const oppAsk = opp === "UP" ? fused.pm.up.ask : fused.pm.down.ask;
    const pairCostIfNow = leg1.entryPx + oppAsk;
    this.mem.lastPairCostIfNow = pairCostIfNow;
    this.mem.unpairedExposureAuc += pairCostIfNow * (dt / 1000);
    this.mem.bestPairCostSeen =
      this.mem.bestPairCostSeen == null ? pairCostIfNow : Math.min(this.mem.bestPairCostSeen, pairCostIfNow);

    const isBelow = pairCostIfNow <= this.params.pairTarget;
    if (isBelow && !this.mem.belowTarget) {
      this.mem.belowTarget = true;
      this.mem.belowTargetEnterTs = fused.ts;
    } else if (!isBelow && this.mem.belowTarget) {
      if (this.mem.belowTargetEnterTs != null) {
        this.mem.timeBelowTargetMs += Math.max(0, fused.ts - this.mem.belowTargetEnterTs);
      }
      this.mem.belowTarget = false;
      this.mem.belowTargetEnterTs = null;
    }
  }

  private computeRisk(fused: FusedState, ctx: StrategyContext): StrategyOpenLegDislocationPairState["risk"] {
    const maxUnpairedSec = this.params.maxUnpairedSec;
    const hasLeg1 = !!this.mem?.leg1;
    const hasLeg2 = !!this.mem?.leg2;
    const unpaired = hasLeg1 && !hasLeg2;
    const unpairedMs = unpaired && this.mem?.leg1 ? Math.max(0, fused.ts - this.mem.leg1.entryTs) : 0;
    const unpairedSec = unpairedMs / 1000;
    const flags: string[] = [];
    let status: "OK" | "WARN" | "DANGER" = "OK";

    if (unpaired) flags.push("UNPAIRED");
    if (unpaired && this.mem?.lastPairCostIfNow != null) {
      const gap = this.mem.lastPairCostIfNow - this.params.pairTarget;
      if (gap <= 0.005) flags.push("NEAR_TARGET");
      if (gap <= 0) flags.push("BELOW_TARGET");
    }
    if (unpaired && unpairedSec > maxUnpairedSec) flags.push("MAX_UNPAIRED_BREACH");

    if (unpaired) {
      if (unpairedSec > maxUnpairedSec) status = "DANGER";
      else if (unpairedSec > maxUnpairedSec * 0.6) status = "WARN";
      else status = "OK";
    }

    return {
      unpairedMs,
      unpairedSec,
      maxUnpairedSec,
      unpairedExposureAuc: this.mem?.unpairedExposureAuc ?? 0,
      status,
      flags,
    };
  }

  private buildUiState(
    fused: FusedState,
    ctx: StrategyContext,
    risk: StrategyOpenLegDislocationPairState["risk"],
    suggestedActions: StrategyOpenLegDislocationPairState["automation"]["suggestedActions"]
  ): StrategyOpenLegDislocationPairState {
    const upDepth = depthToBidsAsks(fused.pm.up.depth);
    const downDepth = depthToBidsAsks(fused.pm.down.depth);
    const leg1 = this.mem?.leg1 ?? null;
    const leg2 = this.mem?.leg2 ?? null;
    const sumAsk = fused.derived.sumAsk ?? (fused.pm.up.ask + fused.pm.down.ask);

    let pairCostIfPairedNow: number | null = null;
    let requiredOppAsk: number | null = null;
    let oppMovePct: number | null = null;

    if (leg1 && !leg2) {
      const opp = otherSide(leg1.side);
      const oppAsk = opp === "UP" ? fused.pm.up.ask : fused.pm.down.ask;
      pairCostIfPairedNow = leg1.entryPx + oppAsk;
      requiredOppAsk = this.params.pairTarget - leg1.entryPx;
      const base = leg1.entryOppAskAtEntry > 0 ? leg1.entryOppAskAtEntry : oppAsk;
      oppMovePct = base > 0 ? (oppAsk - base) / base : 0;
    }

    let timeBelowTargetMs = this.mem?.timeBelowTargetMs ?? 0;
    if (this.mem?.belowTarget && this.mem.belowTargetEnterTs != null) {
      timeBelowTargetMs += Math.max(0, fused.ts - this.mem.belowTargetEnterTs);
    }

    return {
      name: "open_leg_dislocation_pair",
      ts: fused.ts,
      round: {
        roundId: fused.pm.roundId,
        roundStartMs: fused.pm.roundStartMs,
        secondsRemaining: fused.pm.secondsRemaining,
        marketLabel: fused.pm.market || "BTC Up/Down 15m",
      },
      params: this.params,
      leg1,
      leg2,
      live: {
        up: {
          bid: fused.pm.up.bid,
          ask: fused.pm.up.ask,
          depthBids: upDepth.bids,
          depthAsks: upDepth.asks,
        },
        down: {
          bid: fused.pm.down.bid,
          ask: fused.pm.down.ask,
          depthBids: downDepth.bids,
          depthAsks: downDepth.asks,
        },
        sumAsk,
        pairCostIfPairedNow,
        requiredOppAsk,
        oppMovePct,
        bestPairCostSeen: this.mem?.bestPairCostSeen ?? null,
        timeBelowTargetMs,
      },
      risk,
      automation: {
        mode: (ctx.memory?.mode as "AUTO" | "HITL") || "AUTO",
        agentEnabled: Boolean(ctx.memory?.agentEnabled),
        suggestedActions,
      },
    };
  }

  async onTick(fused: FusedState, ctx: StrategyContext): Promise<StrategyDecision> {
    this.lastKnownUpAsk = fused.pm.up.ask;
    this.lastKnownDownAsk = fused.pm.down.ask;

    if (!this.mem || this.mem.roundId !== fused.pm.roundId) {
      this.mem = {
        roundId: fused.pm.roundId,
        roundStartMs: fused.pm.roundStartMs,
        lastTickTs: fused.ts,
        belowTarget: false,
        belowTargetEnterTs: null,
        timeBelowTargetMs: 0,
        bestPairCostSeen: null,
        unpairedExposureAuc: 0,
        lastPairCostIfNow: null,
        lastActionMs: 0,
      };
    }

    this.integrateUnpairedStats(fused);

    const actions: StrategyDecision["actions"] = [];
    const control: StrategyDecision["control"] = [];
    const suggestedActions: StrategyOpenLegDislocationPairState["automation"]["suggestedActions"] = [];

    const now = fused.ts;
    const canAct = now - this.mem.lastActionMs >= this.params.coolDownMs;
    const roundAgeSec = (now - fused.pm.roundStartMs) / 1000;
    const withinOpenWindow = roundAgeSec <= this.params.openWithinSec;
    const hasLeg1 = !!this.mem.leg1;
    const hasLeg2Mem = !!this.mem.leg2;
    const unpaired = hasLeg1 && !hasLeg2Mem;

    if (!hasLeg1 && withinOpenWindow && canAct) {
      const openSide = pickOpenSide(this.params, fused.pm.up.ask, fused.pm.down.ask);
      const openAsk = openSide === "UP" ? fused.pm.up.ask : fused.pm.down.ask;
      const reason = `OPEN: ${this.params.openSide} @ round start`;

      actions.push({
        type: "PAPER_BUY_SHARES",
        leg: 1,
        side: openSide,
        shares: this.params.shares,
        limitPx: openAsk,
        reason,
        strategy: this.name,
        roundId: fused.pm.roundId,
      });

      this.mem.lastActionMs = now;
    }

    if (unpaired && canAct && this.mem.leg1) {
      const leg1 = this.mem.leg1;
      const opp = otherSide(leg1.side);
      const oppAsk = opp === "UP" ? fused.pm.up.ask : fused.pm.down.ask;
      const pairCostIfNow = leg1.entryPx + oppAsk;
      const base = leg1.entryOppAskAtEntry > 0 ? leg1.entryOppAskAtEntry : oppAsk;
      const oppMovePct = base > 0 ? (oppAsk - base) / base : 0;
      const meetsMoveGate = Math.abs(oppMovePct) >= this.params.minOppMovePct;
      const meetsTarget = pairCostIfNow <= this.params.pairTarget;
      const meetsMaxCost = this.params.maxPairCost == null ? true : pairCostIfNow <= this.params.maxPairCost;

      if (meetsTarget && meetsMoveGate && meetsMaxCost) {
        const reason = `PAIR: cost=${pairCostIfNow.toFixed(4)}<=${this.params.pairTarget} & oppMove=${(oppMovePct * 100).toFixed(2)}%`;

        actions.push({
          type: "PAPER_BUY_SHARES",
          leg: 2,
          side: opp,
          shares: leg1.shares,
          limitPx: oppAsk,
          reason,
          strategy: this.name,
          roundId: fused.pm.roundId,
        });

        this.mem.lastActionMs = now;
      } else {
        actions.push({ type: "NOOP", reason: "WAIT: unpaired; conditions not met" });
      }
    }

    const risk = this.computeRisk(fused, ctx);

    if (risk.flags.includes("MAX_UNPAIRED_BREACH")) {
      if (ctx.memory?.agentEnabled) {
        suggestedActions.push({
          type: "PAUSE",
          reason: `Unpaired exposure exceeded maxUnpairedSec=${this.params.maxUnpairedSec}s`,
        });
        if ((ctx.memory?.mode as string) === "AUTO") {
          control.push({
            type: "PAUSE",
            reason: "Auto-paused due to MAX_UNPAIRED_BREACH (agent automation)",
          });
        }
      }
    }

    const state = this.buildUiState(fused, ctx, risk, suggestedActions);

    return {
      state: state as StrategyDecision["state"],
      actions: actions.length ? actions : [{ type: "NOOP", reason: hasLeg2Mem ? "paired holding" : "waiting" }],
      control: control.length ? control : undefined,
    };
  }

  getState() {
    return this.mem;
  }
}

