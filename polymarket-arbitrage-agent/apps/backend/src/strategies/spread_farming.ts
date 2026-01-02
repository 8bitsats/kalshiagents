import { BaseStrategy } from "./base.js";
import type { StrategyDecision, StrategyContext, FusedState } from "@packages/types/fused.js";

/**
 * Strategy: Spread Farming
 * 
 * Buy at bid (5¢), sell at ask (6¢), repeat
 * Or hedge across platforms (short polymarket, long binance)
 * High-frequency loop via CLOB API
 */
export type SpreadFarmingParams = {
  minSpreadBps: number; // e.g. 5 (5 basis points = 0.05%)
  shares: number;
  maxPositions: number;
  cooldownMs: number;
};

export class SpreadFarmingStrategy extends BaseStrategy {
  readonly name = "spread_farming";
  private lastActionMs = 0;
  private positions = 0;

  constructor(private params: SpreadFarmingParams) {
    super();
  }

  onRoundReset(roundId: string): void {
    this.lastActionMs = 0;
    this.positions = 0;
  }

  async onTick(state: FusedState, ctx: StrategyContext): Promise<StrategyDecision> {
    const now = ctx.nowMs();
    const p = this.params;

    // Max positions check
    if (this.positions >= p.maxPositions) {
      return {
        state: {
          strategy: this.name,
          positions: this.positions,
          maxPositions: p.maxPositions,
        } as any,
        actions: [{ type: "NOOP", reason: "maxPositions reached" }],
      };
    }

    // Cooldown check
    if (now - this.lastActionMs < p.cooldownMs) {
      return {
        state: {
          strategy: this.name,
          positions: this.positions,
        } as any,
        actions: [{ type: "NOOP", reason: "cooldown" }],
      };
    }

    const upSpread = state.pm.up.ask - state.pm.up.bid;
    const downSpread = state.pm.down.ask - state.pm.down.bid;
    const upSpreadBps = (upSpread / state.pm.up.ask) * 10000;
    const downSpreadBps = (downSpread / state.pm.down.ask) * 10000;

    // Find best spread opportunity
    if (upSpreadBps >= p.minSpreadBps) {
      this.positions += 1;
      this.lastActionMs = now;
      return {
        state: {
          strategy: this.name,
          positions: this.positions,
          spreadBps: upSpreadBps,
          side: "UP",
        } as any,
        actions: [
          {
            type: "PAPER_BUY_SHARES",
            leg: 1,
            side: "UP",
            shares: p.shares,
            limitPx: state.pm.up.bid, // Buy at bid
            reason: `SPREAD_FARM: UP spread=${upSpreadBps.toFixed(1)}bps >= ${p.minSpreadBps}bps | buy@bid=${state.pm.up.bid.toFixed(4)}`,
            strategy: this.name,
            roundId: state.pm.roundId,
          },
        ],
      };
    }

    if (downSpreadBps >= p.minSpreadBps) {
      this.positions += 1;
      this.lastActionMs = now;
      return {
        state: {
          strategy: this.name,
          positions: this.positions,
          spreadBps: downSpreadBps,
          side: "DOWN",
        } as any,
        actions: [
          {
            type: "PAPER_BUY_SHARES",
            leg: 1,
            side: "DOWN",
            shares: p.shares,
            limitPx: state.pm.down.bid, // Buy at bid
            reason: `SPREAD_FARM: DOWN spread=${downSpreadBps.toFixed(1)}bps >= ${p.minSpreadBps}bps | buy@bid=${state.pm.down.bid.toFixed(4)}`,
            strategy: this.name,
            roundId: state.pm.roundId,
          },
        ],
      };
    }

    return {
      state: {
        strategy: this.name,
        positions: this.positions,
        upSpreadBps,
        downSpreadBps,
        minSpreadBps: p.minSpreadBps,
      } as any,
      actions: [{ type: "NOOP", reason: `No spread opportunity: UP=${upSpreadBps.toFixed(1)}bps DOWN=${downSpreadBps.toFixed(1)}bps < ${p.minSpreadBps}bps` }],
    };
  }
}

