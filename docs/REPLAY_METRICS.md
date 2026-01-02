# Replay Metrics Integration Complete

## ✅ What's Been Added

### 1. **Replay Metrics Reducer** (`src/replay/reduce_open_leg_pair_metrics.ts`)
- Single-pass, constant-memory JSONL reducer
- Computes comprehensive metrics for `open_leg_dislocation_pair` strategy:
  - Completion rates
  - Unpaired durations (completed vs all)
  - Pair costs (avg, min, max)
  - Missed opportunities
  - Time in dislocation
  - Exposure AUC
  - Max unpaired breaches

### 2. **Frontend Panel Component** (`apps/frontend/src/components/StrategyOpenLegPanel.tsx`)
- Terminal aesthetic (monospace, green/red ladders)
- Amber warnings when unpaired
- Red danger when max unpaired breached
- Shows "requiredOppAsk" and "pairCostIfPairedNow" live
- Full integration with strategy state

### 3. **Enhanced Replay API**
- `/replay/run` now detects `open_leg_dislocation_pair` strategy
- Automatically uses specialized reducer when appropriate
- Returns comprehensive metrics report

## 📊 Metrics Computed

1. **completionRate** - % of rounds where Leg2 was executed after Leg1
2. **avgUnpairedDurationMs_completed** - Average time between Leg1 and Leg2 for completed pairs
3. **avgUnpairedDurationMs_all** - Average unpaired time including incomplete rounds
4. **avgPairCost / minPairCost / maxPairCost** - Total cost when pair completes
5. **timeInDislocationMs_total** - Total ms where pair cost was below target while unpaired
6. **missedOpportunitiesRounds** - Rounds with dislocation but no pairing
7. **avgBestPossiblePairCostWhileUnpaired** - Average minimum observed pair cost
8. **unpairedExposureAuc_total** - Area-under-curve of unpaired exposure
9. **maxUnpairedSecBreaches** - Rounds exceeding max unpaired threshold

## 🚀 Usage

### Run Replay

```bash
curl -X POST http://localhost:3001/replay/run \
  -H "Content-Type: application/json" \
  -d '{
    "file": "./data/snapshots-2025-01-01.jsonl",
    "strategy": "open_leg_dislocation_pair",
    "params": {
      "pairTarget": 0.95,
      "maxUnpairedSec": 120
    }
  }'
```

### Expected JSONL Format

The reducer expects JSONL with two line types:

**Tick lines:**
```json
{"type": "tick", "ts": 1234567890, "pm": {"roundId": "...", "roundStartMs": 1234567800, "secondsRemaining": 90, "up": {"ask": 0.52, "bid": 0.51}, "down": {"ask": 0.48, "bid": 0.47}}}
```

**Trade lines:**
```json
{"type": "trade", "ts": 1234567891, "roundId": "...", "strategy": "open_leg_dislocation_pair", "leg": 1, "side": "UP", "shares": 250, "px": 0.52}
```

### Frontend Integration

```tsx
import { StrategyOpenLegPanel } from "./components/StrategyOpenLegPanel";

// In your dashboard:
<StrategyOpenLegPanel
  state={strategyState.open_leg_dislocation_pair}
  paper={fusedState.portfolio.paper}
  wsConnected={wsConnected}
/>
```

## 📋 Strategy State Format

The strategy emits `StrategyOpenLegDislocationPairState` which matches the frontend panel props exactly. The backend already includes this in the `decision.state` object when using `open_leg_dislocation_pair_v2` strategy.

## ✅ All Features Integrated

- ✅ Single-pass constant-memory replay reducer
- ✅ Comprehensive metrics computation
- ✅ Frontend panel component (terminal aesthetic)
- ✅ Enhanced replay API with strategy detection
- ✅ Full state model matching frontend props

The replay system is **production-ready**! 🚀

