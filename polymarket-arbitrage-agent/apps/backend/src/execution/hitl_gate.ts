import crypto from "node:crypto";
import type { Side } from "@packages/types/fused.js";

export type PaperBuySharesAction = {
  type: "PAPER_BUY_SHARES";
  leg: 1 | 2;
  side: Side;
  shares: number;
  limitPx: number;
  reason: string;
  strategy: string;
  roundId: string;
};

export type NoopAction = { type: "NOOP"; reason: string };

export type StrategyAction = PaperBuySharesAction | NoopAction;

export type StrategyDecision<State = any> = {
  state: State;
  actions: StrategyAction[];
  control?: Array<{ type: "PAUSE" | "RESUME"; reason: string }>;
};

export type EngineMode = "AUTO" | "HITL";

export type HitlContext = {
  mode: EngineMode;
  agentAutoApprove: boolean;
  secondsRemaining?: number;
};

export type ProposalStatus = "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED";

export type HitlProposal = {
  id: string;
  createdTs: number;
  expiresTs: number;
  status: ProposalStatus;
  action: PaperBuySharesAction;
  summary: string;
};

export type HitlGateResult<State = any> = {
  gatedDecision: StrategyDecision<State>;
  created: HitlProposal[];
};

function nowMs() {
  return Date.now();
}

function makeId() {
  return crypto.randomBytes(12).toString("hex");
}

function formatProposalSummary(a: PaperBuySharesAction) {
  return `PROPOSAL ${a.strategy} leg${a.leg} BUY_${a.side} ${a.shares} @${a.limitPx.toFixed(4)} r=${a.roundId}`;
}

export class HitlProposalStore {
  private max: number;
  private ring: HitlProposal[] = [];
  private idx = 0;
  private byId = new Map<string, HitlProposal>();

  constructor(opts?: { max?: number }) {
    this.max = opts?.max ?? 500;
  }

  public list(limit = 50): HitlProposal[] {
    const all = [...this.byId.values()].sort((a, b) => b.createdTs - a.createdTs);
    return all.slice(0, limit);
  }

  public get(id: string): HitlProposal | undefined {
    return this.byId.get(id);
  }

  public add(action: PaperBuySharesAction, ttlMs: number): HitlProposal {
    const createdTs = nowMs();
    const p: HitlProposal = {
      id: makeId(),
      createdTs,
      expiresTs: createdTs + ttlMs,
      status: "PENDING",
      action,
      summary: formatProposalSummary(action),
    };

    if (this.ring.length < this.max) {
      this.ring.push(p);
    } else {
      const evicted = this.ring[this.idx];
      if (evicted) this.byId.delete(evicted.id);
      this.ring[this.idx] = p;
      this.idx = (this.idx + 1) % this.max;
    }

    this.byId.set(p.id, p);
    return p;
  }

  public expireNow(ts = nowMs()): number {
    let n = 0;
    for (const p of this.byId.values()) {
      if (p.status === "PENDING" && ts >= p.expiresTs) {
        p.status = "EXPIRED";
        n++;
      }
    }
    return n;
  }

  public reject(id: string, reason?: string): HitlProposal | undefined {
    const p = this.byId.get(id);
    if (!p) return;
    if (p.status !== "PENDING") return p;
    p.status = "REJECTED";
    if (reason) p.summary = `${p.summary} | REJECTED: ${reason}`;
    return p;
  }

  public approve(id: string): HitlProposal | undefined {
    const p = this.byId.get(id);
    if (!p) return;
    if (p.status !== "PENDING") return p;
    if (nowMs() >= p.expiresTs) {
      p.status = "EXPIRED";
      return p;
    }
    p.status = "APPROVED";
    return p;
  }
}

export function applyHitlGate<State>(
  decision: StrategyDecision<State>,
  ctx: HitlContext,
  store: HitlProposalStore,
  opts?: {
    proposalTtlMs?: number;
    minTtlMs?: number;
  }
): HitlGateResult<State> {
  const proposalTtlMs = opts?.proposalTtlMs ?? 30_000;
  const minTtlMs = opts?.minTtlMs ?? 3_000;

  store.expireNow();

  if (ctx.mode === "AUTO" || ctx.agentAutoApprove) {
    return { gatedDecision: decision, created: [] };
  }

  const created: HitlProposal[] = [];
  const gatedActions: StrategyAction[] = [];

  let ttl = proposalTtlMs;
  if (typeof ctx.secondsRemaining === "number") {
    if (ctx.secondsRemaining <= 10) ttl = Math.max(minTtlMs, Math.floor(proposalTtlMs * 0.25));
    else if (ctx.secondsRemaining <= 30) ttl = Math.max(minTtlMs, Math.floor(proposalTtlMs * 0.5));
  }

  for (const a of decision.actions) {
    if (a.type === "PAPER_BUY_SHARES") {
      const p = store.add(a, ttl);
      created.push(p);
      gatedActions.push({
        type: "NOOP",
        reason: `HITL: proposed ${p.id} (awaiting approval)`,
      });
    } else {
      gatedActions.push(a);
    }
  }

  return {
    gatedDecision: { ...decision, actions: gatedActions },
    created,
  };
}

