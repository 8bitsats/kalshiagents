import { BaseStrategy } from "./base.js";
import type { StrategyDecision, StrategyContext, FusedState } from "@packages/types/fused.js";

/**
 * Strategy: Statistical Arbitrage
 * 
 * Find correlated markets that drift apart
 * "trump wins" vs "GOP senate control" should move together
 * When spread hits 4-7%, short expensive one, long cheap one
 * Close when they converge
 */
export type StatisticalArbitrageParams = {
  minSpreadPct: number; // e.g. 0.04 (4%)
  maxSpreadPct: number; // e.g. 0.07 (7%)
  shares: number;
  convergenceThreshold: number; // e.g. 0.01 (1%)
  cooldownMs: number;
};

export class StatisticalArbitrageStrategy extends BaseStrategy {
  readonly name = "statistical_arbitrage";
  private lastActionMs = 0;
  private position: "NONE" | "LONG_UP_SHORT_DOWN" | "LONG_DOWN_SHORT_UP" = "NONE";

  constructor(private params: StatisticalArbitrageParams) {
    super();
  }

  onRoundReset(roundId: string): void {
    this.lastActionMs = 0;
    this.position = "NONE";
  }

  async onTick(state: FusedState, ctx: StrategyContext): Promise<StrategyDecision> {
    const now = ctx.nowMs();
    const p = this.params;

    const upMid = (state.pm.up.bid + state.pm.up.ask) / 2;
    const downMid = (state.pm.down.bid + state.pm.down.ask) / 2;
    const spread = Math.abs(upMid - downMid);
    const spreadPct = spread / Math.max(0.01, Math.min(upMid, downMid));

    // Check for convergence (close position)
    if (this.position !== "NONE" && spreadPct <= p.convergenceThreshold) {
      this.position = "NONE";
      this.lastActionMs = now;
      return {
        state: {
          strategy: this.name,
          spreadPct,
          position: "CLOSED",
        } as any,
        actions: [{ type: "NOOP", reason: `Converged: spread=${(spreadPct * 100).toFixed(2)}%` }],
      };
    }

    // Cooldown check
    if (now - this.lastActionMs < p.cooldownMs) {
      return {
        state: {
          strategy: this.name,
          spreadPct,
          position: this.position,
        } as any,
        actions: [{ type: "NOOP", reason: "cooldown" }],
      };
    }

    // Entry check
    if (this.position === "NONE" && spreadPct >= p.minSpreadPct && spreadPct <= p.maxSpreadPct) {
      const upExpensive = upMid > downMid;
      this.position = upExpensive ? "LONG_DOWN_SHORT_UP" : "LONG_UP_SHORT_DOWN";
      this.lastActionMs = now;

      if (upExpensive) {
        // Long DOWN, short UP (UP is expensive)
        return {
          state: {
            strategy: this.name,
            spreadPct,
            position: this.position,
          } as any,
          actions: [
            {
              type: "PAPER_BUY_SHARES",
              leg: 1,
              side: "DOWN",
              shares: p.shares,
              limitPx: state.pm.down.ask,
              reason: `STAT_ARB: UP expensive (${upMid.toFixed(4)}) vs DOWN (${downMid.toFixed(4)}), spread=${(spreadPct * 100).toFixed(2)}% | LONG DOWN`,
              strategy: this.name,
              roundId: state.pm.roundId,
            },
          ],
        };
      } else {
        // Long UP, short DOWN (DOWN is expensive)
        return {
          state: {
            strategy: this.name,
            spreadPct,
            position: this.position,
          } as any,
          actions: [
            {
              type: "PAPER_BUY_SHARES",
              leg: 1,
              side: "UP",
              shares: p.shares,
              limitPx: state.pm.up.ask,
              reason: `STAT_ARB: DOWN expensive (${downMid.toFixed(4)}) vs UP (${upMid.toFixed(4)}), spread=${(spreadPct * 100).toFixed(2)}% | LONG UP`,
              strategy: this.name,
              roundId: state.pm.roundId,
            },
          ],
        };
      }
    }

    return {
      state: {
        strategy: this.name,
        spreadPct,
        position: this.position,
        waitingFor: this.position === "NONE" ? `spread ${(spreadPct * 100).toFixed(2)}% not in range [${(p.minSpreadPct * 100).toFixed(0)}%, ${(p.maxSpreadPct * 100).toFixed(0)}%]` : "convergence",
      } as any,
      actions: [{ type: "NOOP", reason: this.position === "NONE" ? `Waiting for spread: ${(spreadPct * 100).toFixed(2)}%` : `Holding: spread=${(spreadPct * 100).toFixed(2)}%` }],
    };
  }
}

