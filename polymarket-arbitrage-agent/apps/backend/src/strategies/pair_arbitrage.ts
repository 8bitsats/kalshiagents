import { BaseStrategy } from "./base.js";
import type { StrategyDecision, StrategyContext, FusedState } from "@packages/types/fused.js";

/**
 * Strategy: Buy YES + NO when combined price < $1
 * 
 * Example: YES at 48¢ + NO at 49¢ = 97¢ total
 * You lock $0.03 profit per $1 no matter who wins
 * 
 * Targets 15-min crypto markets where prices move fast
 * Polls API every 1-3 seconds, executes when sum < 99¢
 */
export type PairArbitrageParams = {
  maxPairCost: number; // e.g. 0.99 (99¢)
  minPairCost?: number; // e.g. 0.84 (optional floor)
  shares: number; // position size per leg
  cooldownMs: number; // prevent spam
  maxPairsPerRound: number;
};

export class PairArbitrageStrategy extends BaseStrategy {
  readonly name = "pair_arbitrage";
  private pairsOpened = 0;
  private lastActionMs = 0;

  constructor(private params: PairArbitrageParams) {
    super();
  }

  setParams(p: Partial<PairArbitrageParams>) {
    this.params = { ...this.params, ...p };
  }

  onRoundReset(roundId: string): void {
    this.pairsOpened = 0;
    this.lastActionMs = 0;
  }

  async onTick(state: FusedState, ctx: StrategyContext): Promise<StrategyDecision> {
    const now = ctx.nowMs();
    const p = this.params;

    // Cooldown check
    if (now - this.lastActionMs < p.cooldownMs) {
      return {
        state: {
          strategy: this.name,
          sumAsk: state.derived.sumAsk,
          maxPairCost: p.maxPairCost,
          pairsOpened: this.pairsOpened,
          lastActionMs: this.lastActionMs,
        } as any,
        actions: [{ type: "NOOP", reason: "cooldown" }],
      };
    }

    // Max pairs check
    if (this.pairsOpened >= p.maxPairsPerRound) {
      return {
        state: {
          strategy: this.name,
          sumAsk: state.derived.sumAsk,
          maxPairCost: p.maxPairCost,
          pairsOpened: this.pairsOpened,
          lastActionMs: this.lastActionMs,
        } as any,
        actions: [{ type: "NOOP", reason: "maxPairsPerRound reached" }],
      };
    }

    const sumAsk = state.derived.sumAsk;
    const meetsMax = sumAsk <= p.maxPairCost;
    const meetsMin = p.minPairCost == null ? true : sumAsk >= p.minPairCost;

    if (meetsMax && meetsMin) {
      this.pairsOpened += 1;
      this.lastActionMs = now;

      const edge = 1.0 - sumAsk;
      const reason = `ARBITRAGE: sum=${sumAsk.toFixed(4)} <= ${p.maxPairCost} (edge=${edge.toFixed(4)})`;

      return {
        state: {
          strategy: this.name,
          sumAsk,
          maxPairCost: p.maxPairCost,
          pairsOpened: this.pairsOpened,
          lastActionMs: this.lastActionMs,
          edge,
        } as any,
        actions: [
          {
            type: "PAPER_BUY_SHARES",
            leg: 1,
            side: "UP",
            shares: p.shares,
            limitPx: state.pm.up.ask,
            reason: `${reason} | UP leg`,
            strategy: this.name,
            roundId: state.pm.roundId,
          },
          {
            type: "PAPER_BUY_SHARES",
            leg: 2,
            side: "DOWN",
            shares: p.shares,
            limitPx: state.pm.down.ask,
            reason: `${reason} | DOWN leg`,
            strategy: this.name,
            roundId: state.pm.roundId,
          },
        ],
      };
    }

    return {
      state: {
        strategy: this.name,
        sumAsk,
        maxPairCost: p.maxPairCost,
        pairsOpened: this.pairsOpened,
        lastActionMs: this.lastActionMs,
        waitingFor: `sumAsk=${sumAsk.toFixed(4)} > ${p.maxPairCost}`,
      } as any,
      actions: [{ type: "NOOP", reason: `Waiting: sumAsk=${sumAsk.toFixed(4)} > ${p.maxPairCost}` }],
    };
  }
}

