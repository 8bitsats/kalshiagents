import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

export type FusedState = {
  ts: number;
  pm: {
    market: string;
    roundId: string;
    roundStartMs: number;
    secondsRemaining: number;
    up: { bid: number; ask: number; depth: Array<{ px: number; sz: number }>; tokenId: string };
    down: { bid: number; ask: number; depth: Array<{ px: number; sz: number }>; tokenId: string };
  };
  binance: {
    price: number;
    cvd: number;
    flowImbalance: number;
    whaleScore: 0 | 1;
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

export type StrategyDecision = {
  type: "NOOP" | "BUY_BOTH" | "BUY_ONE" | "HEDGE";
  reason?: string;
  tier?: 1 | 2 | 3;
  confidence?: number;
  risk?: string[];
  shares?: number;
  sharesUp?: number;
  sharesDown?: number;
  side?: "UP" | "DOWN";
};

export type SystemState = {
  state: FusedState | null;
  activeStrategy: string;
  mode: "AUTONOMOUS" | "HITL";
  isPaused: boolean;
  risk: {
    flags: string[];
    killSwitch: boolean;
    dailyStats: {
      shares: number;
      trades: number;
      drawdown: number;
    };
  };
  liveFills: Array<{
    t: number;
    leg: "UP" | "DOWN";
    side: "BUY" | "SELL";
    price: number;
    size: number;
    ref?: string;
    reason?: string;
    strategy?: string;
    tier?: 1 | 2 | 3;
  }>;
  liveOrders: Array<any>;
};

export const apiClient = {
  // Health check
  health: async () => {
    const res = await api.get("/health");
    return res.data;
  },

  // Get current state
  getState: async (): Promise<SystemState> => {
    const res = await api.get("/state");
    return res.data;
  },

  // Get trades
  getTrades: async (hours: number = 24) => {
    const res = await api.get("/trades", { params: { hours } });
    return res.data;
  },

  // Get decisions
  getDecisions: async (limit: number = 200) => {
    const res = await api.get("/decisions", { params: { limit } });
    return res.data;
  },

  // Control commands
  control: async (type: string, payload?: any) => {
    const res = await api.post("/control", { type, payload });
    return res.data;
  },

  // Apply multiple actions
  applyActions: async (actions: Array<any>) => {
    const res = await api.post("/control/applyActions", { actions });
    return res.data;
  },

  // Grok chat
  chat: async (message: string, mode: "AUTONOMOUS" | "HITL" = "AUTONOMOUS", context?: any) => {
    const res = await api.post("/agent/chat", { message, mode, context });
    return res.data;
  },

  // HITL endpoints
  hitlList: async () => {
    const res = await api.get("/hitl/list");
    return res.data;
  },

  hitlApprove: async (proposalId: string) => {
    const res = await api.post("/hitl/approve", { proposalId });
    return res.data;
  },

  hitlReject: async (proposalId: string, reason?: string) => {
    const res = await api.post("/hitl/reject", { proposalId, reason });
    return res.data;
  },

  // Recording
  recorderStart: async () => {
    const res = await api.post("/recorder/start");
    return res.data;
  },

  recorderStop: async () => {
    const res = await api.post("/recorder/stop");
    return res.data;
  },

  // Replay
  replayRun: async (file: string, strategy: string, params?: any) => {
    const res = await api.post("/replay/run", { file, strategy, params });
    return res.data;
  },

  // Live trading
  getLiveOrders: async () => {
    const res = await api.get("/live/orders");
    return res.data;
  },

  cancelOrder: async (orderId: string) => {
    const res = await api.post("/live/cancel", { orderId });
    return res.data;
  },

  cancelAllOrders: async () => {
    const res = await api.post("/live/cancel-all");
    return res.data;
  },

  getLiveFills: async () => {
    const res = await api.get("/live/fills");
    return res.data;
  },
};

