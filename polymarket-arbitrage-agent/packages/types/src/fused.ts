export type Level = { px: number; sz: number };

export type Side = "UP" | "DOWN";

export type FusedState = {
  ts: number;
  pm: {
    market: string;
    roundId: string;
    roundStartMs: number;
    secondsRemaining: number;
    up: {
      bid: number;
      ask: number;
      depth: Level[];
      tokenId: string;
    };
    down: {
      bid: number;
      ask: number;
      depth: Level[];
      tokenId: string;
    };
  };
  binance: {
    price: number;
    cvd: number;
    flowImbalance: number;
    whaleScore: number;
    vol: number;
    momentum: number;
  };
  derived: {
    sumAsk: number;
    spreadUp: number;
    spreadDown: number;
    depthImbalanceUp: number;
    depthImbalanceDown: number;
    dislocationScore: number;
  };
  portfolio: {
    paper: boolean;
    positions: {
      upShares: number;
      downShares: number;
      avgUp: number;
      avgDown: number;
    };
    pnl: {
      realized: number;
      unrealized: number;
      total: number;
    };
  };
};

export type StrategyDecision =
  | { type: "NOOP"; reason: string; tier: 0; confidence: number; risk: string[] }
  | { type: "BUY_BOTH"; sharesUp: number; sharesDown: number; tier: 1 | 2 | 3; confidence: number; reason: string; risk: string[] }
  | { type: "BUY_ONE"; side: Side; shares: number; tier: 1 | 2 | 3; confidence: number; reason: string; risk: string[] }
  | { type: "HEDGE"; side: Side; shares: number; tier: 1 | 2 | 3; confidence: number; reason: string; risk: string[] };

export type StrategyContext = {
  nowMs: () => number;
  exec: any; // PaperExecutor
  memory: Record<string, any>;
};

export interface Strategy {
  name: string;
  onTick(state: FusedState, ctx: StrategyContext): StrategyDecision | Promise<StrategyDecision>;
  onRoundReset(roundId: string): void;
}

