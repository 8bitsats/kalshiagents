import { BaseStrategy } from "./base.js";
import type { StrategyDecision, StrategyContext, FusedState, Side } from "../../../packages/types/src/fused.js";
import { btcUpDown15mSlug } from "../core/round_watcher.js";

export type AutoCycleParams = {
  shares: number;
  sumTarget: number;
  movePct: number;
  windowMin: number;
  cooldownSec?: number;
};

type LegState =
  | { kind: "IDLE" }
  | { kind: "ARMED"; roundSlug: string }
  | { kind: "LEG1"; roundSlug: string; leg1: Side; entry: number; entryT: number }
  | { kind: "DONE"; roundSlug: string; leg1: Side; entry: number; hedge: number; doneT: number };

type AskSample = { t: number; upAsk: number; downAsk: number };

export class AutoCycleDumpHedge extends BaseStrategy {
  readonly name = "autocycle_dump_hedge";
  private state: LegState = { kind: "IDLE" };
  private upHist: AskSample[] = [];
  private downHist: AskSample[] = [];
  private lastActionTs = 0;

  constructor(private params: AutoCycleParams) {
    super();
  }

  setParams(p: AutoCycleParams) {
    this.params = { ...this.params, ...p };
  }

  onRoundReset(roundId: string): void {
    const slug = btcUpDown15mSlug();
    this.state = { kind: "ARMED", roundSlug: slug };
    this.upHist = [];
    this.downHist = [];
  }

  async onTick(state: FusedState, ctx: StrategyContext): Promise<StrategyDecision> {
    const now = ctx.nowMs();
    const p = this.params;

    // Update histories
    this.pushHist(this.upHist, now, state.pm.up.ask);
    this.pushHist(this.downHist, now, state.pm.down.ask);

    // Round guard
    const currentSlug = btcUpDown15mSlug(now);
    if (this.state.kind === "IDLE") {
      this.state = { kind: "ARMED", roundSlug: currentSlug };
    }
    if (this.state.kind !== "IDLE" && "roundSlug" in this.state && this.state.roundSlug !== currentSlug) {
      this.onRoundReset(currentSlug);
    }

    // Cooldown guard
    if (now - this.lastActionTs < (p.cooldownSec ?? 10) * 1000) {
      return { type: "NOOP", reason: "cooldown", tier: 0, confidence: 0, risk: [] };
    }

    // Leg1 allowed only in first windowMin minutes
    const windowAllowed =
      state.pm.secondsRemaining <= 900 && state.pm.secondsRemaining >= 900 - p.windowMin * 60;

    if (this.state.kind === "ARMED") {
      if (!windowAllowed) {
        return { type: "NOOP", reason: "outside window", tier: 0, confidence: 0, risk: [] };
      }

      const upDrop = this.dropPct(this.upHist, now, state.pm.up.ask);
      const downDrop = this.dropPct(this.downHist, now, state.pm.down.ask);

      if (upDrop >= p.movePct || downDrop >= p.movePct) {
        const leg1: Side = upDrop >= downDrop ? "UP" : "DOWN";
        const entry = leg1 === "UP" ? state.pm.up.ask : state.pm.down.ask;
        this.state = { kind: "LEG1", roundSlug: currentSlug, leg1, entry, entryT: now };
        this.lastActionTs = now;

        return {
          type: "BUY_ONE",
          side: leg1,
          shares: p.shares,
          tier: 1,
          confidence: 0.8,
          reason: `Leg1: dump ${((upDrop >= downDrop ? upDrop : downDrop) * 100).toFixed(1)}% over ~3s`,
          risk: ["UNPAIRED_EXPOSURE"],
        };
      }

      return { type: "NOOP", reason: "waiting for dump", tier: 0, confidence: 0, risk: [] };
    }

    if (this.state.kind === "LEG1") {
      const opposite: Side = this.state.leg1 === "UP" ? "DOWN" : "UP";
      const oppAsk = opposite === "UP" ? state.pm.up.ask : state.pm.down.ask;

      if (this.state.entry + oppAsk <= p.sumTarget) {
        this.state = {
          kind: "DONE",
          roundSlug: currentSlug,
          leg1: this.state.leg1,
          entry: this.state.entry,
          hedge: oppAsk,
          doneT: now,
        };
        this.lastActionTs = now;

        return {
          type: "HEDGE",
          side: opposite,
          shares: p.shares,
          tier: 1,
          confidence: 0.9,
          reason: `Leg2: hedge sum ${(this.state.entry + oppAsk).toFixed(3)} <= ${p.sumTarget}`,
          risk: [],
        };
      }

      return {
        type: "NOOP",
        reason: `waiting hedge: sum ${(this.state.entry + oppAsk).toFixed(3)} > ${p.sumTarget}`,
        tier: 0,
        confidence: 0,
        risk: ["UNPAIRED_EXPOSURE"],
      };
    }

    return { type: "NOOP", reason: "done for round", tier: 0, confidence: 0, risk: [] };
  }

  private pushHist(hist: AskSample[], t: number, ask: number) {
    hist.push({ t, upAsk: ask, downAsk: ask });
    const cutoff = t - 10_000;
    while (hist.length && hist[0].t < cutoff) hist.shift();
  }

  private dropPct(hist: AskSample[], nowT: number, nowAsk: number): number {
    const cutoff = nowT - 3000;
    const older = hist.find((x) => x.t >= cutoff) ?? hist[0];
    if (!older || older.upAsk <= 0) return 0;
    return (older.upAsk - nowAsk) / older.upAsk;
  }

  getState() {
    return this.state;
  }
}

