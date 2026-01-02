import type { PaperBuySharesAction } from "./hitl_gate.js";
import type { PaperSim } from "./paper.js";
import type { RiskManager } from "../risk/risk.js";

/**
 * Execute an approved HITL proposal action.
 * This is the same code path used for strategy actions.
 * No glue: action shape is identical to what strategies emit.
 */
export async function executeApprovedAction(
  action: PaperBuySharesAction,
  sim: PaperSim,
  risk: RiskManager
) {
  sim.buy(action.side, action.limitPx, action.shares, action.reason, action.strategy, action.leg === 1 ? 1 : 2);
  risk.recordTrade(action.shares);
}

