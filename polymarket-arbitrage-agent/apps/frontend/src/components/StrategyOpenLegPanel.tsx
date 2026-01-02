import React from "react";

export type Side = "UP" | "DOWN";

export type DepthLevel = { px: number; sz: number };

export type OpenLegDislocationPairParams = {
  shares: number;
  openSide: "CHEAPER" | "UP" | "DOWN";
  openWithinSec: number;
  pairTarget: number;
  minOppMovePct: number;
  maxUnpairedSec: number;
  maxPairCost?: number;
  coolDownMs: number;
};

export type StrategyOpenLegDislocationPairState = {
  name: "open_leg_dislocation_pair";
  ts: number;
  round: { roundId: string; roundStartMs: number; secondsRemaining: number; marketLabel: string };
  params: OpenLegDislocationPairParams;
  leg1: null | {
    side: Side;
    shares: number;
    entryPx: number;
    entryTs: number;
    entryOppAskAtEntry: number;
    entryPairCostAtEntry: number;
    reason: string;
  };
  leg2: null | {
    side: Side;
    shares: number;
    entryPx: number;
    entryTs: number;
    pairCost: number;
    reason: string;
  };
  live: {
    up: { bid: number; ask: number; depthBids: DepthLevel[]; depthAsks: DepthLevel[] };
    down: { bid: number; ask: number; depthBids: DepthLevel[]; depthAsks: DepthLevel[] };
    sumAsk: number;
    pairCostIfPairedNow: number | null;
    requiredOppAsk: number | null;
    oppMovePct: number | null;
    bestPairCostSeen: number | null;
    timeBelowTargetMs: number;
  };
  risk: {
    unpairedMs: number;
    unpairedSec: number;
    maxUnpairedSec: number;
    unpairedExposureAuc: number;
    status: "OK" | "WARN" | "DANGER";
    flags: string[];
  };
  automation: {
    mode: "AUTO" | "HITL";
    agentEnabled: boolean;
    suggestedActions: Array<
      | { type: "PAUSE"; reason: string }
      | { type: "RESUME"; reason: string }
      | { type: "SET_PARAM"; key: keyof OpenLegDislocationPairParams; value: number | string; reason: string }
    >;
  };
};

export type StrategyOpenLegPanelProps = {
  state: StrategyOpenLegDislocationPairState;
  paper: boolean;
  wsConnected: boolean;
};

const fmtPx = (n: number | null | undefined) => (n == null ? "—" : n.toFixed(4));
const fmtPct = (n: number | null | undefined) => (n == null ? "—" : `${(n * 100).toFixed(2)}%`);
const msTo = (ms: number) => `${Math.max(0, ms / 1000).toFixed(1)}s`;

function Ladder({
  title,
  accent,
  bids,
  asks,
}: {
  title: string;
  accent: "green" | "red";
  bids: DepthLevel[];
  asks: DepthLevel[];
}) {
  const c = {
    green: { fg: "#35d07f", dim: "rgba(53,208,127,0.25)" },
    red: { fg: "#ff5c6c", dim: "rgba(255,92,108,0.25)" },
  }[accent];

  const rows = 8;
  const b = (bids ?? []).slice(0, rows);
  const a = (asks ?? []).slice(0, rows);

  return (
    <div style={{ flex: 1, border: "1px solid rgba(120,180,255,0.18)", borderRadius: 10, padding: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div style={{ color: "rgba(190,220,255,0.9)", letterSpacing: 1 }}>{title}</div>
        <div style={{ color: c.fg, fontWeight: 700 }}>{accent === "green" ? "▲" : "▼"}</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 8 }}>
        <div>
          <div style={{ color: "rgba(190,220,255,0.55)", marginBottom: 4 }}>BIDS</div>
          {b.map((lvl, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", color: c.fg }}>
              <span>{(lvl.px * 100).toFixed(1)}%</span>
              <span style={{ color: "rgba(210,230,255,0.9)" }}>@</span>
              <span>{lvl.sz}</span>
            </div>
          ))}
          {b.length === 0 && <div style={{ color: "rgba(190,220,255,0.35)" }}>—</div>}
        </div>

        <div>
          <div style={{ color: "rgba(190,220,255,0.55)", marginBottom: 4 }}>ASKS</div>
          {a.map((lvl, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", color: "#ffcf66" }}>
              <span>{(lvl.px * 100).toFixed(1)}%</span>
              <span style={{ color: "rgba(210,230,255,0.9)" }}>@</span>
              <span style={{ color: c.fg }}>{lvl.sz}</span>
            </div>
          ))}
          {a.length === 0 && <div style={{ color: "rgba(190,220,255,0.35)" }}>—</div>}
        </div>
      </div>

      <div style={{ height: 1, background: "rgba(120,180,255,0.12)", margin: "10px 0" }} />
      <div style={{ display: "flex", justifyContent: "space-between", color: "rgba(210,230,255,0.85)" }}>
        <span>Top Bid</span>
        <span style={{ color: c.fg }}>{fmtPx(bids?.[0]?.px ?? null)}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", color: "rgba(210,230,255,0.85)" }}>
        <span>Top Ask</span>
        <span style={{ color: "#ffcf66" }}>{fmtPx(asks?.[0]?.px ?? null)}</span>
      </div>
    </div>
  );
}

export function StrategyOpenLegPanel({ state, paper, wsConnected }: StrategyOpenLegPanelProps) {
  const { leg1, leg2, live, risk, round, params } = state;

  const paired = !!leg2;
  const unpaired = !!leg1 && !paired;

  const statusColor = risk.status === "OK" ? "#35d07f" : risk.status === "WARN" ? "#ffcf66" : "#ff5c6c";

  const badge = (text: string, color: string, bg: string) => (
    <span
      style={{
        padding: "2px 8px",
        borderRadius: 999,
        border: `1px solid ${bg}`,
        background: "rgba(0,0,0,0.35)",
        color,
        fontSize: 12,
        letterSpacing: 0.5,
      }}
    >
      {text}
    </span>
  );

  return (
    <div
      style={{
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
        background: "rgba(0,0,0,0.45)",
        border: "1px solid rgba(120,180,255,0.22)",
        borderRadius: 14,
        padding: 14,
        boxShadow: "0 0 0 1px rgba(0,0,0,0.2) inset",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
          <div style={{ color: "rgba(190,220,255,0.92)", letterSpacing: 2, fontWeight: 800 }}>
            STRATEGY: OPEN-LEG → PAIR
          </div>
          {badge(paper ? "PAPER" : "LIVE", paper ? "#ffcf66" : "#ff5c6c", "rgba(255,207,102,0.25)")}
          {badge(wsConnected ? "WS OK" : "WS DOWN", wsConnected ? "#35d07f" : "#ff5c6c", "rgba(53,208,127,0.2)")}
          {badge(state.automation.mode, "#9ad0ff", "rgba(154,208,255,0.25)")}
          {state.automation.agentEnabled && badge("GROK AUTO", "#b7ffea", "rgba(183,255,234,0.22)")}
        </div>

        <div style={{ color: "rgba(190,220,255,0.65)" }}>
          {round.marketLabel} • {round.roundId} • T-{round.secondsRemaining}s
        </div>
      </div>

      <div style={{ height: 1, background: "rgba(120,180,255,0.12)", margin: "12px 0" }} />

      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr 1fr", gap: 12 }}>
        <div style={{ border: "1px solid rgba(120,180,255,0.18)", borderRadius: 12, padding: 12 }}>
          <div style={{ color: "rgba(190,220,255,0.9)", letterSpacing: 1, marginBottom: 8 }}>
            OPEN / PAIR STATE
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ color: "rgba(210,230,255,0.85)" }}>Leg1</span>
            <span
              style={{
                color: leg1?.side === "UP" ? "#35d07f" : leg1?.side === "DOWN" ? "#ff5c6c" : "rgba(210,230,255,0.4)",
              }}
            >
              {leg1 ? `${leg1.side} @ ${fmtPx(leg1.entryPx)} x${leg1.shares}` : "—"}
            </span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ color: "rgba(210,230,255,0.85)" }}>Leg2</span>
            <span
              style={{
                color: leg2?.side === "UP" ? "#35d07f" : leg2?.side === "DOWN" ? "#ff5c6c" : "rgba(210,230,255,0.4)",
              }}
            >
              {leg2 ? `${leg2.side} @ ${fmtPx(leg2.entryPx)} x${leg2.shares}` : paired ? "—" : "WAITING"}
            </span>
          </div>

          <div style={{ height: 1, background: "rgba(120,180,255,0.12)", margin: "10px 0" }} />

          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "rgba(210,230,255,0.85)" }}>Pair Target</span>
            <span style={{ color: "#ffcf66" }}>{fmtPx(params.pairTarget)}</span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
            <span style={{ color: "rgba(210,230,255,0.85)" }}>Cost If Pair Now</span>
            <span style={{ color: unpaired ? statusColor : "rgba(210,230,255,0.55)" }}>
              {fmtPx(live.pairCostIfPairedNow)}
            </span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
            <span style={{ color: "rgba(210,230,255,0.85)" }}>Required Opp Ask</span>
            <span style={{ color: "#9ad0ff" }}>{fmtPx(live.requiredOppAsk)}</span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
            <span style={{ color: "rgba(210,230,255,0.85)" }}>Opp Move</span>
            <span style={{ color: "#b7ffea" }}>{fmtPct(live.oppMovePct)}</span>
          </div>

          <div style={{ marginTop: 10, color: "rgba(190,220,255,0.55)", fontSize: 12, lineHeight: 1.35 }}>
            {paired
              ? `PAIRED: total cost ${fmtPx(leg2!.pairCost)} (hold to settlement)`
              : leg1
              ? `OPEN: ${leg1.reason}`
              : `WAITING: will open within ${params.openWithinSec}s (side=${params.openSide})`}
          </div>
        </div>

        <div style={{ border: "1px solid rgba(120,180,255,0.18)", borderRadius: 12, padding: 12 }}>
          <div style={{ color: "rgba(190,220,255,0.9)", letterSpacing: 1, marginBottom: 8 }}>
            UNPAIRED RISK
          </div>

          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "rgba(210,230,255,0.85)" }}>Status</span>
            <span style={{ color: statusColor, fontWeight: 800 }}>{risk.status}</span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
            <span style={{ color: "rgba(210,230,255,0.85)" }}>Unpaired</span>
            <span style={{ color: unpaired ? statusColor : "rgba(210,230,255,0.55)" }}>
              {unpaired ? msTo(risk.unpairedMs) : "0.0s"}
            </span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
            <span style={{ color: "rgba(210,230,255,0.85)" }}>Below Target</span>
            <span style={{ color: "#35d07f" }}>{msTo(live.timeBelowTargetMs)}</span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
            <span style={{ color: "rgba(210,230,255,0.85)" }}>Best Pair Cost</span>
            <span style={{ color: "#35d07f" }}>{fmtPx(live.bestPairCostSeen)}</span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
            <span style={{ color: "rgba(210,230,255,0.85)" }}>Exposure AUC</span>
            <span style={{ color: "#ffcf66" }}>{risk.unpairedExposureAuc.toFixed(2)}</span>
          </div>

          <div style={{ marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap" }}>
            {risk.flags.length ? (
              risk.flags.map((f, i) => (
                <span key={i} style={{ ...badge(f, statusColor, "rgba(255,255,255,0.12)"), marginRight: 4 }} />
              ))
            ) : (
              <span style={{ color: "rgba(190,220,255,0.35)" }}>—</span>
            )}
          </div>

          {state.automation.suggestedActions.length > 0 && (
            <div style={{ marginTop: 10, padding: 10, borderRadius: 10, border: "1px solid rgba(255,207,102,0.25)" }}>
              <div style={{ color: "#ffcf66", marginBottom: 6, letterSpacing: 1 }}>GROK SUGGESTED</div>
              {state.automation.suggestedActions.slice(0, 2).map((a, i) => (
                <div key={i} style={{ color: "rgba(210,230,255,0.9)", fontSize: 12, lineHeight: 1.35 }}>
                  • {a.type} — {"reason" in a ? a.reason : ""}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ border: "1px solid rgba(120,180,255,0.18)", borderRadius: 12, padding: 12 }}>
          <div style={{ color: "rgba(190,220,255,0.9)", letterSpacing: 1, marginBottom: 8 }}>
            LIVE PRICES
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <div style={{ color: "#35d07f", fontWeight: 800 }}>UP</div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                <span style={{ color: "rgba(210,230,255,0.85)" }}>Bid</span>
                <span style={{ color: "#35d07f" }}>{fmtPx(live.up.bid)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                <span style={{ color: "rgba(210,230,255,0.85)" }}>Ask</span>
                <span style={{ color: "#ffcf66" }}>{fmtPx(live.up.ask)}</span>
              </div>
            </div>

            <div>
              <div style={{ color: "#ff5c6c", fontWeight: 800 }}>DOWN</div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                <span style={{ color: "rgba(210,230,255,0.85)" }}>Bid</span>
                <span style={{ color: "#ff5c6c" }}>{fmtPx(live.down.bid)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                <span style={{ color: "rgba(210,230,255,0.85)" }}>Ask</span>
                <span style={{ color: "#ffcf66" }}>{fmtPx(live.down.ask)}</span>
              </div>
            </div>
          </div>

          <div style={{ height: 1, background: "rgba(120,180,255,0.12)", margin: "10px 0" }} />
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "rgba(210,230,255,0.85)" }}>SUM (ask)</span>
            <span style={{ color: "#9ad0ff", fontWeight: 800 }}>{fmtPx(live.sumAsk)}</span>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 12, display: "flex", gap: 12 }}>
        <Ladder title="UP ORDER BOOK" accent="green" bids={live.up.depthBids} asks={live.up.depthAsks} />
        <Ladder title="DOWN ORDER BOOK" accent="red" bids={live.down.depthBids} asks={live.down.depthAsks} />
      </div>
    </div>
  );
}

