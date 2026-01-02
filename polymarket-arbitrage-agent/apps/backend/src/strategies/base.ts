import type { Strategy, StrategyDecision, StrategyContext, FusedState } from "@packages/types/fused";

export abstract class BaseStrategy implements Strategy {
  abstract name: string;

  abstract onTick(state: FusedState, ctx: StrategyContext): StrategyDecision | Promise<StrategyDecision>;

  onRoundReset(roundId: string): void {
    // Override in subclasses
  }
}

