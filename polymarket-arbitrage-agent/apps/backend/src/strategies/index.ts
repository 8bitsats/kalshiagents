import { AutoCycleDumpHedge, AutoCycleParams } from "./autocycle_dump_hedge.js";
import { OpenLegDislocationPair, OpenLegDislocationParams } from "./open_leg_dislocation_pair.js";
import { PairArbitrageStrategy, PairArbitrageParams } from "./pair_arbitrage.js";
import { StatisticalArbitrageStrategy, StatisticalArbitrageParams } from "./statistical_arbitrage.js";
import { SpreadFarmingStrategy, SpreadFarmingParams } from "./spread_farming.js";
import type { Strategy } from "@packages/types/fused.js";

export function buildStrategy(name: string, cfg: Record<string, any>): Strategy {
  switch (name) {
    case "autocycle_dump_hedge": {
      const params: AutoCycleParams = {
        shares: Number(cfg.ORDER_SIZE_SHARES ?? 20),
        sumTarget: Number(cfg.SUM_TARGET ?? 0.95),
        movePct: Number(cfg.MOVE_PCT ?? 0.15),
        windowMin: Number(cfg.WINDOW_MIN ?? 2),
        cooldownSec: Number(cfg.COOLDOWN_SECONDS ?? 10),
      };
      return new AutoCycleDumpHedge(params);
    }

    case "open_leg_dislocation_pair": {
      const params: OpenLegDislocationParams = {
        shares: Number(cfg.OPEN_LEG_SHARES ?? 20),
        enterDelaySec: Number(cfg.OPEN_LEG_ENTER_DELAY_SEC ?? 2),
        firstLegMode: (cfg.OPEN_LEG_FIRST_LEG_MODE ?? "CHEAPER_ASK") as "CHEAPER_ASK" | "BINANCE_MOMENTUM" | "DISLOCATION_SIDE",
        maxLeg1Cost: Number(cfg.OPEN_LEG_MAX_LEG1_COST ?? 0.70),
        targetPairCost: Number(cfg.OPEN_LEG_TARGET_PAIR_COST ?? 0.95),
        minPairCost: cfg.OPEN_LEG_MIN_PAIR_COST ? Number(cfg.OPEN_LEG_MIN_PAIR_COST) : undefined,
        maxPairCost: cfg.OPEN_LEG_MAX_PAIR_COST ? Number(cfg.OPEN_LEG_MAX_PAIR_COST) : undefined,
        minDislocationScore: Number(cfg.OPEN_LEG_MIN_DISLOCATION_SCORE ?? 0.60),
        priceChangeTriggerPct: Number(cfg.OPEN_LEG_PRICE_CHANGE_TRIGGER_PCT ?? 0.02),
        maxWaitForLeg2Sec: Number(cfg.OPEN_LEG_MAX_WAIT_FOR_LEG2_SEC ?? 480),
        abortIfNoLeg2BySecRemaining: Number(cfg.OPEN_LEG_ABORT_IF_NO_LEG2_BY_SEC_REMAINING ?? 180),
        cooldownSec: Number(cfg.COOLDOWN_SECONDS ?? 10),
        maxPairsPerRound: 1,
      };
      return new OpenLegDislocationPair(params);
    }

    case "pair_arbitrage": {
      const params: PairArbitrageParams = {
        maxPairCost: Number(cfg.PAIR_ARB_MAX_COST ?? 0.99),
        minPairCost: cfg.PAIR_ARB_MIN_COST ? Number(cfg.PAIR_ARB_MIN_COST) : undefined,
        shares: Number(cfg.PAIR_ARB_SHARES ?? 250),
        cooldownMs: Number(cfg.PAIR_ARB_COOLDOWN_MS ?? 1000),
        maxPairsPerRound: Number(cfg.PAIR_ARB_MAX_PAIRS ?? 10),
      };
      return new PairArbitrageStrategy(params);
    }

    case "statistical_arbitrage": {
      const params: StatisticalArbitrageParams = {
        minSpreadPct: Number(cfg.STAT_ARB_MIN_SPREAD ?? 0.04),
        maxSpreadPct: Number(cfg.STAT_ARB_MAX_SPREAD ?? 0.07),
        shares: Number(cfg.STAT_ARB_SHARES ?? 200),
        convergenceThreshold: Number(cfg.STAT_ARB_CONVERGENCE ?? 0.01),
        cooldownMs: Number(cfg.STAT_ARB_COOLDOWN_MS ?? 2000),
      };
      return new StatisticalArbitrageStrategy(params);
    }

    case "spread_farming": {
      const params: SpreadFarmingParams = {
        minSpreadBps: Number(cfg.SPREAD_FARM_MIN_BPS ?? 5),
        shares: Number(cfg.SPREAD_FARM_SHARES ?? 100),
        maxPositions: Number(cfg.SPREAD_FARM_MAX_POS ?? 20),
        cooldownMs: Number(cfg.SPREAD_FARM_COOLDOWN_MS ?? 500),
      };
      return new SpreadFarmingStrategy(params);
    }

    default:
      throw new Error(`Unknown strategy: ${name}`);
  }
}

