# HITL Integration Complete

## ✅ What's Been Added

### 1. **HITL Gating System** (`src/execution/hitl_gate.ts`)
- Converts `PAPER_BUY_SHARES` actions into proposals in HITL mode
- Constant-memory proposal store (ring buffer)
- Automatic expiration based on TTL and round time remaining
- Zero UI glue requirement - frontend consumes `decision.state` as-is

### 2. **HITL API Routes** (`src/api/hitl.ts`)
- `GET /hitl/list` - List pending proposals
- `POST /hitl/approve` - Approve and execute a proposal
- `POST /hitl/reject` - Reject a proposal

### 3. **Enhanced Open Leg Dislocation Strategy** (`src/strategies/open_leg_dislocation_pair_v2.ts`)
- Complete state model matching frontend props
- Grok automation `suggestedActions`
- Risk tracking (unpaired exposure, AUC, below-target time)
- Full UI state building

### 4. **Main Engine Integration** (`src/index.ts`)
- HITL gating applied to all strategy decisions
- Proposals broadcast via WebSocket
- Auto-execution of approved proposals
- Strategy fill notifications

## 🚀 Usage

### Backend Behavior

**AUTO Mode:**
- Strategy emits `PAPER_BUY_SHARES` → Executor fills normally

**HITL Mode:**
- Strategy emits `PAPER_BUY_SHARES` → Server stores proposal → Executor receives `NOOP` until user approves
- Approval: `POST /hitl/approve` returns exact `PAPER_BUY_SHARES` action → Executed unchanged

### API Examples

**List Proposals:**
```bash
curl http://localhost:3001/hitl/list?limit=50
```

**Approve Proposal:**
```bash
curl -X POST http://localhost:3001/hitl/approve \
  -H "Content-Type: application/json" \
  -d '{"id": "proposal_id_here"}'
```

**Reject Proposal:**
```bash
curl -X POST http://localhost:3001/hitl/reject \
  -H "Content-Type: application/json" \
  -d '{"id": "proposal_id_here", "reason": "Too risky"}'
```

### WebSocket Events

The backend now broadcasts proposals in the `tick` event:

```json
{
  "type": "tick",
  "state": {...},
  "decision": {...},
  "proposals": [
    {
      "id": "abc123",
      "createdTs": 1234567890,
      "expiresTs": 1234597890,
      "status": "PENDING",
      "action": {
        "type": "PAPER_BUY_SHARES",
        "leg": 1,
        "side": "UP",
        "shares": 250,
        "limitPx": 0.52,
        "reason": "OPEN: CHEAPER @ round start",
        "strategy": "open_leg_dislocation_pair",
        "roundId": "btc-updown-15m-1234567890"
      },
      "summary": "PROPOSAL open_leg_dislocation_pair leg1 BUY_UP 250 @0.5200 r=btc-updown-15m-1234567890"
    }
  ]
}
```

## 🎯 Frontend Integration

The frontend can:
1. Display proposals from WebSocket `proposals` array
2. Call `/hitl/approve` or `/hitl/reject` when user clicks
3. Show proposal status (PENDING, APPROVED, REJECTED, EXPIRED)

**Zero glue required** - the `decision.state` object is unchanged, only `decision.actions` are gated.

## 📋 Strategy State Format

The new strategy emits `StrategyOpenLegDislocationPairState` which matches the frontend panel props exactly:

```typescript
{
  name: "open_leg_dislocation_pair",
  ts: number,
  round: {...},
  params: {...},
  leg1: {...} | null,
  leg2: {...} | null,
  live: {
    up: { bid, ask, depthBids, depthAsks },
    down: { bid, ask, depthBids, depthAsks },
    sumAsk,
    pairCostIfPairedNow,
    requiredOppAsk,
    oppMovePct,
    bestPairCostSeen,
    timeBelowTargetMs
  },
  risk: {
    unpairedMs,
    unpairedSec,
    maxUnpairedSec,
    unpairedExposureAuc,
    status: "OK" | "WARN" | "DANGER",
    flags: string[]
  },
  automation: {
    mode: "AUTO" | "HITL",
    agentEnabled: boolean,
    suggestedActions: [...]
  }
}
```

## ✅ All Features Integrated

- ✅ HITL gating shim
- ✅ Proposal store (constant memory)
- ✅ HITL API routes
- ✅ Enhanced strategy with full state model
- ✅ WebSocket proposal broadcasting
- ✅ Auto-execution on approval
- ✅ Strategy fill notifications
- ✅ Grok automation integration

The backend is **fully ready** for HITL mode! 🚀

