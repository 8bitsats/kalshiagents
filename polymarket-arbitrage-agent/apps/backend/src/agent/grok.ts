import type { FusedState, StrategyDecision } from "@packages/types/fused.js";

export type AgentContext = {
  mode: "AUTONOMOUS" | "HITL";
  fused: FusedState;
  activeStrategy: string;
  params: Record<string, any>;
  lastDecisions: Array<{ ts: number; decision: StrategyDecision; reason: string }>;
  lastTrades: Array<{ ts: number; side: string; price: number; shares: number; tag: "PAPER" | "LIVE" }>;
  risk: {
    unpairedSeconds?: number;
    dailyPnL: number;
    guardFlags: string[];
  };
};

export type AgentResponse = {
  reply: string;
  analysis: {
    stateSummary: string;
    riskFlags: string[];
    recommendedAction: string;
  };
  actionPlan: {
    actions: Array<
      | { type: "SET_STRATEGY"; name: string }
      | { type: "SET_PARAM"; key: string; value: any }
      | { type: "PAUSE" }
      | { type: "RESUME" }
      | { type: "SET_MODE"; mode: "AUTONOMOUS" | "HITL" }
    >;
  };
};

export class GrokAgent {
  private apiKey?: string;
  private model: string;

  constructor(apiKey?: string, model = "grok-4.1", _liveSearch = false) {
    this.apiKey = apiKey;
    this.model = model;
    // liveSearch feature not yet implemented
  }

  async chat(message: string, ctx: AgentContext): Promise<AgentResponse> {
    if (!this.apiKey) {
      return {
        reply: "Grok API key not configured. Set GROK_API_KEY in .env to enable conversational copilot.",
        analysis: {
          stateSummary: "Grok disabled",
          riskFlags: ctx.risk.guardFlags,
          recommendedAction: "Configure API key",
        },
        actionPlan: { actions: [] },
      };
    }

    const systemPrompt = this.buildSystemPrompt(ctx);
    const userPrompt = this.buildUserPrompt(message, ctx);

    try {
      // Use xAI API (Grok)
      const response = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        throw new Error(`Grok API error: ${response.statusText}`);
      }

      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const reply = data.choices?.[0]?.message?.content || "No response from Grok";

      // Parse action plan from reply (simple extraction)
      const actionPlan = this.extractActionPlan(reply, ctx);

      return {
        reply,
        analysis: {
          stateSummary: this.summarizeState(ctx),
          riskFlags: ctx.risk.guardFlags,
          recommendedAction: this.recommendAction(ctx),
        },
        actionPlan,
      };
    } catch (error: any) {
      return {
        reply: `Error calling Grok API: ${error.message}. Check your API key and network connection.`,
        analysis: {
          stateSummary: this.summarizeState(ctx),
          riskFlags: ctx.risk.guardFlags,
          recommendedAction: "Check API configuration",
        },
        actionPlan: { actions: [] },
      };
    }
  }

  private buildSystemPrompt(ctx: AgentContext): string {
    return `You are Grok 4.1, the trading copilot for FunPump.ai "Polymarket Arbitrage Agent".
Your job: explain decisions, manage risk, and propose parameter changes.

Constraints:
- Paper trading by default (${ctx.fused.portfolio.paper ? "PAPER" : "LIVE"}).
- Never reveal secrets or API keys.
- Never execute actions in HITL mode unless user explicitly approves.
- Current mode: ${ctx.mode}
- Active strategy: ${ctx.activeStrategy}

When proposing changes, output a JSON action plan using this schema:
{
  "actions": [
    { "type": "SET_STRATEGY", "name": "strategy_name" },
    { "type": "SET_PARAM", "key": "param_name", "value": value },
    { "type": "PAUSE" },
    { "type": "RESUME" },
    { "type": "SET_MODE", "mode": "AUTONOMOUS" | "HITL" }
  ]
}

Keep answers short, concrete, and reference current fused state metrics (sumAsk, dislocationScore, spreads, secondsRemaining).`;
  }

  private buildUserPrompt(message: string, ctx: AgentContext): string {
    const state = ctx.fused;
    const pm = state.pm;
    const derived = state.derived;
    const portfolio = state.portfolio;

    return `User message: ${message}

Current state:
- Round: ${pm.roundId} (${pm.secondsRemaining}s remaining)
- UP: bid=${pm.up.bid.toFixed(4)} ask=${pm.up.ask.toFixed(4)}
- DOWN: bid=${pm.down.bid.toFixed(4)} ask=${pm.down.ask.toFixed(4)}
- Sum ask: ${derived.sumAsk.toFixed(4)}
- Dislocation score: ${derived.dislocationScore.toFixed(3)}
- Spread UP: ${derived.spreadUp.toFixed(4)} DOWN: ${derived.spreadDown.toFixed(4)}
- Positions: UP=${portfolio.positions.upShares} @ ${portfolio.positions.avgUp.toFixed(4)}, DOWN=${portfolio.positions.downShares} @ ${portfolio.positions.avgDown.toFixed(4)}
- PnL: ${portfolio.pnl.total.toFixed(2)} USD
- Binance BTC: ${state.binance.price.toFixed(0)} (CVD=${state.binance.cvd.toFixed(0)}, flow=${state.binance.flowImbalance.toFixed(2)})

Recent decisions: ${ctx.lastDecisions.slice(0, 3).map((d) => `${d.decision.type}: ${d.reason}`).join("; ")}

Risk flags: ${ctx.risk.guardFlags.join(", ") || "none"}

Strategy params: ${JSON.stringify(ctx.params, null, 2)}

Analyze and respond.`;
  }

  private summarizeState(ctx: AgentContext): string {
    const state = ctx.fused;
    return `Round ${state.pm.roundId} (${state.pm.secondsRemaining}s), sumAsk=${state.derived.sumAsk.toFixed(3)}, PnL=${state.portfolio.pnl.total.toFixed(2)}`;
  }

  private recommendAction(ctx: AgentContext): string {
    if (ctx.risk.guardFlags.includes("KILL_SWITCH")) {
      return "PAUSE immediately - kill switch triggered";
    }
    if (ctx.risk.dailyPnL < -200) {
      return "Consider pausing - significant daily loss";
    }
    if (ctx.fused.derived.sumAsk <= 0.95) {
      return "Good entry opportunity - sumAsk below target";
    }
    return "Monitor and wait for better entry";
  }

  private extractActionPlan(reply: string, ctx: AgentContext): AgentResponse["actionPlan"] {
    // Simple extraction - look for JSON in code blocks or parse natural language
    const jsonMatch = reply.match(/```json\s*([\s\S]*?)\s*```/) || reply.match(/\{[\s\S]*"actions"[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);
        if (parsed.actions && Array.isArray(parsed.actions)) {
          return { actions: parsed.actions };
        }
      } catch {
        // Fall through to heuristic parsing
      }
    }

    // Heuristic parsing from natural language
    const actions: AgentResponse["actionPlan"]["actions"] = [];

    if (reply.toLowerCase().includes("pause") || reply.toLowerCase().includes("stop")) {
      actions.push({ type: "PAUSE" });
    }
    if (reply.toLowerCase().includes("resume") || reply.toLowerCase().includes("start")) {
      actions.push({ type: "RESUME" });
    }
    if (reply.toLowerCase().includes("hitl") || reply.toLowerCase().includes("human")) {
      actions.push({ type: "SET_MODE", mode: "HITL" });
    }
    if (reply.toLowerCase().includes("autonomous") || reply.toLowerCase().includes("auto")) {
      actions.push({ type: "SET_MODE", mode: "AUTONOMOUS" });
    }

    // Extract parameter changes (simple patterns)
    const paramMatch = reply.match(/(?:set|change|adjust)\s+(\w+)\s+to\s+([0-9.]+)/i);
    if (paramMatch) {
      const key = paramMatch[1];
      const value = Number(paramMatch[2]);
      if (Number.isFinite(value)) {
        actions.push({ type: "SET_PARAM", key, value });
      }
    }

    return { actions };
  }
}

