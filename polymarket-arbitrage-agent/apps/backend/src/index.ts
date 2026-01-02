import { getConfig } from "./config.js";
import { PolymarketMarketWS } from "./feeds/polymarket_ws.js";
import { BinanceFuturesWS } from "./feeds/binance_futures_ws.js";
import { L2Book } from "./core/orderbook.js";
import { deriveMetrics } from "./fusion/derive.js";
import { buildStrategy } from "./strategies/index.js";
import { PaperSim } from "./execution/paper.js";
import { LiveExecutor } from "./execution/live.js";
import { RiskManager } from "./execution/risk.js";
import { btcUpDown15mSlug, secondsRemainingIn15m } from "./core/round_watcher.js";
import type { FusedState, StrategyDecision, Side } from "@packages/types/fused.js";
import { Recorder } from "./recorder/recorder.js";
import { GrokAgent } from "./agent/grok.js";
import { runReplay } from "./replay/replay.js";
import { HitlProposalStore, applyHitlGate, type PaperBuySharesAction } from "./execution/hitl_gate.js";
import { createHitlRoutes } from "./api/hitl.js";
import { executeApprovedAction } from "./execution/executor_consume.js";
import Fastify from "fastify";
import cors from "@fastify/cors";
import websocket from "@fastify/websocket";

const cfg = getConfig();

// State
let fusedState: FusedState | null = null;
let activeStrategy = buildStrategy(cfg.STRATEGY || "pair_arbitrage", process.env);
let mode: "AUTONOMOUS" | "HITL" = "AUTONOMOUS";
let isPaused = false;

const upBook = new L2Book();
const downBook = new L2Book();
const sim = new PaperSim();
const liveExecutor = new LiveExecutor(cfg);
const risk = new RiskManager(
  cfg.MAX_SHARES_PER_ROUND,
  cfg.MAX_TRADES_PER_DAY,
  cfg.MAX_DAILY_DRAWDOWN,
  cfg.KILL_SWITCH
);

// Initialize live executor if not paper trading
if (!cfg.PAPER_TRADING && cfg.LIVE_TRADING) {
  liveExecutor.initialize().catch((err) => {
    console.error("❌ Failed to initialize live trading:", err);
    process.exit(1);
  });
}
const recorder = new Recorder("./data");
recorder.start(); // Auto-start recording
const grokAgent = new GrokAgent(cfg.GROK_API_KEY, cfg.GROK_MODEL, cfg.LIVE_SEARCH);
const proposalStore = new HitlProposalStore({ max: 500 });
const hitlRoutes = createHitlRoutes(proposalStore);

let btcPrice = 0;
let cvd = 0;
let flowImbalance = 0;
let whaleScore: 0 | 1 = 0;
let vol = 0;
let momentum = 0;

let currentRoundId = "";
let lastDecision: StrategyDecision | null = null;
const decisionHistory: Array<{ ts: number; decision: StrategyDecision }> = [];

// WebSocket clients
const wsClients = new Set<{ readyState: number; send: (data: string) => void }>();

function buildFusedState(): FusedState | null {
  if (!upBook.bids.length || !upBook.asks.length || !downBook.bids.length || !downBook.asks.length) {
    return null;
  }

  const upBid = upBook.bestBid();
  const upAsk = upBook.bestAsk();
  const downBid = downBook.bestBid();
  const downAsk = downBook.bestAsk();

  const derived = deriveMetrics({
    pm: {
      up: { bid: upBid, ask: upAsk, depth: upBook.bids.slice(0, 10).map((l) => ({ px: l.price, sz: l.size })) },
      down: {
        bid: downBid,
        ask: downAsk,
        depth: downBook.bids.slice(0, 10).map((l) => ({ px: l.price, sz: l.size })),
      },
    },
    binance: {
      price: btcPrice,
      cvd,
      flowImbalance,
      whaleScore,
      vol,
      momentum,
    },
  });

  const roundSlug = btcUpDown15mSlug();
  const secRemaining = secondsRemainingIn15m();

  if (roundSlug !== currentRoundId) {
    currentRoundId = roundSlug;
    activeStrategy.onRoundReset(roundSlug);
    risk.resetRound();
  }

  const state: FusedState = {
    ts: Date.now(),
    pm: {
      market: cfg.POLYMARKET_MARKET_SLUG,
      roundId: roundSlug,
      roundStartMs: Math.floor(Date.now() / 1000) * 1000 - (900 - secRemaining) * 1000,
      secondsRemaining: secRemaining,
      up: {
        bid: upBid,
        ask: upAsk,
        depth: upBook.bids.slice(0, 25).map((l) => ({ px: l.price, sz: l.size })),
        tokenId: cfg.POLYMARKET_TOKEN_UP_ID,
      },
      down: {
        bid: downBid,
        ask: downAsk,
        depth: downBook.bids.slice(0, 25).map((l) => ({ px: l.price, sz: l.size })),
        tokenId: cfg.POLYMARKET_TOKEN_DOWN_ID,
      },
    },
    binance: {
      price: btcPrice,
      cvd,
      flowImbalance,
      whaleScore,
      vol,
      momentum,
    },
    derived,
    portfolio: {
      paper: cfg.PAPER_TRADING,
      positions: {
        upShares: sim.up.shares,
        downShares: sim.down.shares,
        avgUp: sim.up.avg,
        avgDown: sim.down.avg,
      },
      pnl: {
        realized: 0,
        unrealized: sim.totalPnL(),
        total: sim.totalPnL(),
      },
    },
  };

  return state;
}

async function tick() {
  if (isPaused) return;

  const state = buildFusedState();
  if (!state) return;

  fusedState = state;

  // Update marks for PnL
  sim.setMarks((state.pm.up.bid + state.pm.up.ask) / 2, (state.pm.down.bid + state.pm.down.ask) / 2);

  // Record snapshot
  const strategyState = (activeStrategy as any).getState?.() || {};
  recorder.write(state, strategyState);

  // Run strategy
  const strategyCtx = {
    nowMs: () => Date.now(),
    exec: sim,
    memory: {
      mode,
      agentEnabled: Boolean(cfg.GROK_API_KEY),
      wsConnected: wsClients.size > 0,
    },
  };

  const rawDecision = await activeStrategy.onTick(state, strategyCtx);

  // Apply HITL gating if decision has actions array (new format)
  let decision = rawDecision;
  let createdProposals: any[] = [];

  if ("actions" in rawDecision && Array.isArray(rawDecision.actions)) {
    const gateResult = applyHitlGate(
      rawDecision as any,
      {
        mode: mode === "AUTONOMOUS" ? "AUTO" : "HITL",
        agentAutoApprove: mode === "AUTONOMOUS" && Boolean(cfg.GROK_API_KEY),
        secondsRemaining: state.pm.secondsRemaining,
      },
      proposalStore,
      { proposalTtlMs: 30_000, minTtlMs: 3_000 }
    );

    decision = gateResult.gatedDecision as any;
    createdProposals = gateResult.created;

        // Execute approved actions (paper or live trading)
        // Note: In HITL mode, PAPER_BUY_SHARES are converted to NOOP, so we only execute if not gated
        // Approved proposals are executed via /hitl/approve endpoint
        for (const action of gateResult.gatedDecision.actions) {
          if (action.type === "PAPER_BUY_SHARES") {
            const a = action as PaperBuySharesAction;
            
            if (cfg.PAPER_TRADING) {
              // Paper trading
              sim.buy(a.side, a.limitPx, a.shares, a.reason, a.strategy, a.leg === 1 ? 1 : 2);
              risk.recordTrade(a.shares);

              // Record trade event
              recorder.writeTrade({
                type: "trade",
                t: Date.now(),
                roundId: a.roundId,
                strategy: a.strategy,
                leg: a.leg,
                side: a.side,
                shares: a.shares,
                px: a.limitPx,
                reason: a.reason,
              });
            } else if (cfg.LIVE_TRADING) {
              // Live trading
              try {
                const fill = await liveExecutor.buy(
                  a.side,
                  a.limitPx,
                  a.shares,
                  a.reason,
                  a.strategy,
                  a.leg === 1 ? 1 : 2
                );
                risk.recordTrade(a.shares);

                // Record trade event
                recorder.writeTrade({
                  type: "trade",
                  t: fill.t,
                  roundId: a.roundId,
                  strategy: a.strategy,
                  leg: a.leg,
                  side: a.side,
                  shares: a.shares,
                  px: a.limitPx,
                  reason: a.reason,
                });

                // Also update paper sim for tracking (but mark as live)
                sim.buy(a.side, a.limitPx, a.shares, a.reason, a.strategy, a.leg === 1 ? 1 : 2);
              } catch (error: any) {
                console.error(`❌ Live trade failed: ${error.message}`);
                // Don't notify strategy of failed fills
              }
            }

            // Notify strategy of fill (only if successful)
            if ((activeStrategy as any).onFill) {
              (activeStrategy as any).onFill({
                ts: Date.now(),
                roundId: a.roundId,
                strategy: a.strategy,
                leg: a.leg,
                side: a.side,
                shares: a.shares,
                px: a.limitPx,
                reason: a.reason,
              });
            }
          }
        }

    // Apply control actions
    if (gateResult.gatedDecision.control) {
      for (const ctrl of gateResult.gatedDecision.control) {
        if (ctrl.type === "PAUSE") isPaused = true;
        if (ctrl.type === "RESUME") isPaused = false;
      }
    }
  } else {
    // Legacy format - convert to new format for compatibility
    const riskFlags = risk.check({
      shares: rawDecision.type === "BUY_BOTH" ? rawDecision.sharesUp + rawDecision.sharesDown : rawDecision.shares ?? 0,
    });

    if (rawDecision.type !== "NOOP" && !riskFlags.killSwitch && (cfg.PAPER_TRADING || cfg.LIVE_TRADING)) {
      if (rawDecision.type === "BUY_BOTH") {
        if (cfg.PAPER_TRADING) {
          sim.buy("UP", state.pm.up.ask, rawDecision.sharesUp, rawDecision.reason, activeStrategy.name, rawDecision.tier);
          sim.buy("DOWN", state.pm.down.ask, rawDecision.sharesDown, rawDecision.reason, activeStrategy.name, rawDecision.tier);
        } else if (cfg.LIVE_TRADING) {
          try {
            await liveExecutor.buy("UP", state.pm.up.ask, rawDecision.sharesUp, rawDecision.reason, activeStrategy.name, rawDecision.tier);
            await liveExecutor.buy("DOWN", state.pm.down.ask, rawDecision.sharesDown, rawDecision.reason, activeStrategy.name, rawDecision.tier);
            // Also update paper sim for tracking
            sim.buy("UP", state.pm.up.ask, rawDecision.sharesUp, rawDecision.reason, activeStrategy.name, rawDecision.tier);
            sim.buy("DOWN", state.pm.down.ask, rawDecision.sharesDown, rawDecision.reason, activeStrategy.name, rawDecision.tier);
          } catch (error: any) {
            console.error(`❌ Live trade failed: ${error.message}`);
          }
        }
        risk.recordTrade(rawDecision.sharesUp + rawDecision.sharesDown);

        // Record trade events
        recorder.writeTrade({
          type: "trade",
          t: Date.now(),
          roundId: state.pm.roundId,
          strategy: activeStrategy.name,
          leg: 1,
          side: "UP",
          shares: rawDecision.sharesUp,
          px: state.pm.up.ask,
          reason: rawDecision.reason,
        });
        recorder.writeTrade({
          type: "trade",
          t: Date.now(),
          roundId: state.pm.roundId,
          strategy: activeStrategy.name,
          leg: 2,
          side: "DOWN",
          shares: rawDecision.sharesDown,
          px: state.pm.down.ask,
          reason: rawDecision.reason,
        });
      } else if (rawDecision.type === "BUY_ONE" || rawDecision.type === "HEDGE") {
        if (cfg.PAPER_TRADING) {
          sim.buy(
            rawDecision.side,
            rawDecision.side === "UP" ? state.pm.up.ask : state.pm.down.ask,
            rawDecision.shares,
            rawDecision.reason,
            activeStrategy.name,
            rawDecision.tier
          );
        } else if (cfg.LIVE_TRADING) {
          try {
            await liveExecutor.buy(
              rawDecision.side,
              rawDecision.side === "UP" ? state.pm.up.ask : state.pm.down.ask,
              rawDecision.shares,
              rawDecision.reason,
              activeStrategy.name,
              rawDecision.tier
            );
            // Also update paper sim for tracking
            sim.buy(
              rawDecision.side,
              rawDecision.side === "UP" ? state.pm.up.ask : state.pm.down.ask,
              rawDecision.shares,
              rawDecision.reason,
              activeStrategy.name,
              rawDecision.tier
            );
          } catch (error: any) {
            console.error(`❌ Live trade failed: ${error.message}`);
          }
        }
        risk.recordTrade(rawDecision.shares);

        // Record trade event
        recorder.writeTrade({
          type: "trade",
          t: Date.now(),
          roundId: state.pm.roundId,
          strategy: activeStrategy.name,
          leg: 1,
          side: rawDecision.side,
          shares: rawDecision.shares,
          px: rawDecision.side === "UP" ? state.pm.up.ask : state.pm.down.ask,
          reason: rawDecision.reason,
        });
      }
    }
  }

  lastDecision = decision;
  decisionHistory.unshift({ ts: Date.now(), decision });
  if (decisionHistory.length > 200) decisionHistory.pop();

  // Check risk (for legacy compatibility)
  const riskFlags = risk.check({ shares: 0 });

  // Broadcast to WS clients
  const message = JSON.stringify({
    type: "tick",
    state,
    decision,
    risk: riskFlags,
    proposals: createdProposals, // New: HITL proposals
  });

  wsClients.forEach((client) => {
    if (client.readyState === 1) {
      // WebSocket.OPEN
      try {
        client.send(message);
      } catch (e) {
        // Client disconnected, remove it
        wsClients.delete(client);
      }
    }
  });
}

// Setup feeds
const polyWS = new PolymarketMarketWS(cfg.POLYMARKET_WS_URL);
const binanceWS = new BinanceFuturesWS(cfg.BINANCE_FUTURES_WS, cfg.BINANCE_SYMBOL);

polyWS.on("book", (m: any) => {
  const asset = m.asset_id;
  const bids = (m.bids ?? []).map((x: any) => ({ price: Number(x.price), size: Number(x.size) }));
  const asks = (m.asks ?? []).map((x: any) => ({ price: Number(x.price), size: Number(x.size) }));

  if (asset === cfg.POLYMARKET_TOKEN_UP_ID) {
    upBook.updateFromSnapshot(bids, asks, Number(m.timestamp ?? Date.now()), m.hash);
  } else if (asset === cfg.POLYMARKET_TOKEN_DOWN_ID) {
    downBook.updateFromSnapshot(bids, asks, Number(m.timestamp ?? Date.now()), m.hash);
  }
});

binanceWS.on("aggTrade", (t: any) => {
  const price = Number(t.p);
  const qty = Number(t.q);
  btcPrice = price;

  const dv = (t.m ? -1 : 1) * qty;
  cvd += dv;

  // Simple flow window (last 3s)
  flowImbalance = dv / Math.max(1e-9, qty);
  whaleScore = price * qty > 250_000 ? 1 : 0;

  // Simple momentum (price change)
  momentum = (price - btcPrice) / Math.max(1e-9, btcPrice);
});

polyWS.connect([cfg.POLYMARKET_TOKEN_UP_ID, cfg.POLYMARKET_TOKEN_DOWN_ID]);
binanceWS.connect();

// Main tick loop
setInterval(tick, 1000 / cfg.ENGINE_HZ);

// HTTP + WebSocket server
const app = Fastify({ logger: true });

await app.register(cors, { origin: true });
await app.register(websocket);

app.get("/health", async () => {
  return { ok: true, ts: Date.now() };
});

app.get("/state", async () => {
  return {
    state: fusedState,
    activeStrategy: activeStrategy.name,
    mode,
    isPaused,
    risk: risk.getDailyStats(),
  };
});

app.get("/trades", async (req) => {
  const hours = Number((req.query as any).hours ?? 24);
  const cutoff = Date.now() - hours * 3600 * 1000;
  return {
    trades: sim.fills.filter((f) => f.t >= cutoff),
  };
});

app.get("/decisions", async (req) => {
  const limit = Number((req.query as any).limit ?? 200);
  return {
    decisions: decisionHistory.slice(0, limit),
  };
});

app.post("/control", async (req) => {
  const body = req.body as any;
  const { type, payload } = body;

  if (type === "PAUSE") {
    isPaused = true;
  } else if (type === "RESUME") {
    isPaused = false;
  } else if (type === "SET_STRATEGY") {
    activeStrategy = buildStrategy(payload.name || payload, process.env);
    activeStrategy.onRoundReset(currentRoundId || btcUpDown15mSlug());
  } else if (type === "SET_MODE") {
    mode = payload;
  } else if (type === "SET_PARAM") {
    // Update strategy params if supported
    if ((activeStrategy as any).setParams) {
      (activeStrategy as any).setParams({ [payload.key]: payload.value });
    }
  }

  return { ok: true };
});

app.post("/control/applyActions", async (req) => {
  const body = req.body as any;
  const { actions } = body;

  if (!Array.isArray(actions)) {
    return { ok: false, error: "actions must be an array" };
  }

  let applied = 0;
  for (const action of actions) {
    if (action.type === "SET_STRATEGY") {
      activeStrategy = buildStrategy(action.name, process.env);
      activeStrategy.onRoundReset(currentRoundId || btcUpDown15mSlug());
      applied++;
    } else if (action.type === "SET_PARAM") {
      if ((activeStrategy as any).setParams) {
        (activeStrategy as any).setParams({ [action.key]: action.value });
        applied++;
      }
    } else if (action.type === "PAUSE") {
      isPaused = true;
      applied++;
    } else if (action.type === "RESUME") {
      isPaused = false;
      applied++;
    } else if (action.type === "SET_MODE") {
      mode = action.mode;
      applied++;
    }
  }

  return { ok: true, applied };
});

app.post("/agent/chat", async (req) => {
  const body = req.body as any;
  const { message, mode: chatMode } = body;

  if (!fusedState) {
    return { ok: false, error: "No state available" };
  }

  const agentCtx = {
    mode: chatMode || mode,
    fused: fusedState,
    activeStrategy: activeStrategy.name,
    params: (activeStrategy as any).params || {},
    lastDecisions: decisionHistory.slice(0, 10).map((d) => ({
      ts: d.ts,
      decision: d.decision,
      reason: d.decision.reason,
    })),
    lastTrades: sim.fills.slice(0, 10).map((f) => ({
      ts: f.t,
      side: f.leg,
      price: f.price,
      shares: f.size,
      tag: cfg.PAPER_TRADING ? ("PAPER" as const) : ("LIVE" as const),
    })),
    risk: {
      unpairedSeconds: undefined, // TODO: calculate from strategy state
      dailyPnL: risk.getDailyStats().dailyPnL,
      guardFlags: risk.check({ shares: 0 }).flags,
    },
  };

  const response = await grokAgent.chat(message, agentCtx);

  // In HITL mode, don't auto-apply actions
  if (chatMode === "HITL" || mode === "HITL") {
    return { ...response, requiresApproval: true };
  }

  // In AUTONOMOUS mode, apply actions immediately (if configured)
  if (response.actionPlan.actions.length > 0 && (chatMode === "AUTONOMOUS" || mode === "AUTONOMOUS")) {
    // Auto-apply in autonomous mode (paper trading only)
    if (cfg.PAPER_TRADING) {
      // Apply actions would go here, but for safety we still require explicit approval
      // Uncomment if you want true autonomous mode:
      // await app.inject({ method: "POST", url: "/control/applyActions", payload: { actions: response.actionPlan.actions } });
    }
  }

  return response;
});

app.post("/replay/run", async (req) => {
  const body = req.body as any;
  const { file, strategy, params } = body;

  if (!file) {
    return { ok: false, error: "file path required" };
  }

  try {
    // Use specialized reducer for open_leg_dislocation_pair
    if (strategy === "open_leg_dislocation_pair" || activeStrategy.name === "open_leg_dislocation_pair") {
      const { runOpenLegPairReplay } = await import("./replay/replay.js");
      const replayParams = {
        pairTarget: Number(params?.pairTarget ?? params?.OPEN_LEG_TARGET_PAIR_COST ?? 0.95),
        maxUnpairedSec: Number(params?.maxUnpairedSec ?? params?.OPEN_LEG_MAX_UNPAIRED_SEC ?? 120),
      };
      const report = await runOpenLegPairReplay(file, replayParams);
      return { ok: true, reportId: `replay_${Date.now()}`, report };
    }

    // Fallback to generic replay
    const report = await runReplay(file, strategy || activeStrategy.name, params || process.env);
    return { ok: true, reportId: `replay_${Date.now()}`, report };
  } catch (error: any) {
    return { ok: false, error: error.message };
  }
});

app.get("/replay/report", async (req) => {
  const { id } = req.query as any;
  // In a real implementation, you'd store reports by ID
  // For now, return a placeholder
  return { ok: false, error: "Report storage not implemented. Use POST /replay/run to get report directly." };
});

// HITL routes
app.get("/hitl/list", hitlRoutes.list);
app.post("/hitl/approve", async (req, reply) => {
  const result = await hitlRoutes.approve(req, reply);
  const body = result as any;
  
  // If approved, execute the action immediately
  if (body && body.ok && body.action) {
    const action = body.action as PaperBuySharesAction;
    executeApprovedAction(action, sim, risk);
    
    // Notify strategy of fill
    if ((activeStrategy as any).onFill) {
      (activeStrategy as any).onFill({
        ts: Date.now(),
        roundId: action.roundId,
        strategy: action.strategy,
        leg: action.leg,
        side: action.side,
        shares: action.shares,
        px: action.limitPx,
        reason: action.reason,
      });
    }
  }
  
  return result;
});
app.post("/hitl/reject", hitlRoutes.reject);

app.post("/recorder/start", async () => {
  recorder.start();
  return { ok: true, file: recorder["dir"] };
});

app.post("/recorder/stop", async () => {
  recorder.stop();
  return { ok: true };
});

// Live trading endpoints
if (cfg.LIVE_TRADING) {
  app.get("/live/orders", async () => {
    try {
      const orders = await liveExecutor.getActiveOrders();
      return { ok: true, orders };
    } catch (error: any) {
      return { ok: false, error: error.message };
    }
  });

  app.post("/live/cancel", async (req) => {
    const body = req.body as any;
    const { orderId } = body;
    if (!orderId) {
      return { ok: false, error: "orderId required" };
    }
    try {
      await liveExecutor.cancelOrder(orderId);
      return { ok: true };
    } catch (error: any) {
      return { ok: false, error: error.message };
    }
  });

  app.post("/live/cancel-all", async () => {
    try {
      await liveExecutor.cancelAllOrders();
      return { ok: true };
    } catch (error: any) {
      return { ok: false, error: error.message };
    }
  });

  app.get("/live/fills", async () => {
    return { ok: true, fills: liveExecutor.getFills() };
  });
}

app.get("/ws", { websocket: true }, (socket, req) => {
  console.log("🔌 WebSocket client connected");
  wsClients.add(socket);

  socket.on("close", () => {
    console.log("🔌 WebSocket client disconnected");
    wsClients.delete(socket);
  });

  socket.on("error", (err: Error) => {
    console.error("❌ WebSocket error:", err);
    wsClients.delete(socket);
  });

  // Send initial state
  if (fusedState) {
    try {
      socket.send(
        JSON.stringify({
          type: "tick",
          state: fusedState,
          decision: lastDecision,
          risk: risk.check({ shares: 0 }),
        })
      );
    } catch (err) {
      console.error("Failed to send initial state:", err);
    }
  }
});

const port = Number(process.env.PORT ?? cfg.PORT);
app.listen({ port, host: "0.0.0.0" }, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  console.log(`🚀 Server listening on http://0.0.0.0:${port}`);
  console.log(`📊 WebSocket available at ws://localhost:${port}/ws`);
  console.log(`🤖 Strategy: ${activeStrategy.name}`);
  console.log(`📝 Mode: ${mode}`);
      console.log(`💰 Trading Mode: ${cfg.PAPER_TRADING ? "PAPER" : "LIVE"}`);
      if (cfg.LIVE_TRADING) {
        console.log(`🔐 Live Trading: ENABLED`);
        console.log(`   Signature Type: ${cfg.POLYMARKET_SIGNATURE_TYPE} (1=Email/Magic, 2=Browser Wallet)`);
        if (cfg.POLYMARKET_FUNDER) {
          console.log(`   Funder Address: ${cfg.POLYMARKET_FUNDER}`);
        }
      }
  console.log(`📹 Recording: ${recorder["isRecording"] ? "ON" : "OFF"}`);
});

// Terminal UI (if enabled)
if (cfg.ENABLE_TERMINAL_UI) {
  (async () => {
    const { render } = await import("ink");
    const React = await import("react");
    const { TerminalEnhanced } = await import("./ui/terminal_enhanced.js");

    let wsLastTime = "";
    polyWS.on("log", (msg: string) => {
      if (msg.includes("WS")) {
        wsLastTime = new Date().toLocaleTimeString();
      }
    });

    // Create a component that updates on state changes
    const TerminalApp = () => {
      const [refresh, setRefresh] = React.useState(0);
      
      React.useEffect(() => {
        const interval = setInterval(() => {
          setRefresh((r) => r + 1);
        }, 1000 / 4); // 4Hz refresh
        return () => clearInterval(interval);
      }, []);

      return React.createElement(TerminalEnhanced, {
        state: fusedState,
        decision: lastDecision,
        strategy: activeStrategy.name,
        mode: mode,
        isPaused: isPaused,
        riskFlags: risk.check({ shares: 0 }).flags,
        fills: sim.fills,
        btcPrice: btcPrice,
        wsLast: wsLastTime,
      });
    };

    render(React.createElement(TerminalApp));
  })();
}

