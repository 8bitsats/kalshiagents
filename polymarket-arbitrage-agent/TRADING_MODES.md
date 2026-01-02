# Trading Modes & Strategies

## ✅ Available Strategies

### 1. **Pair Arbitrage** (`pair_arbitrage`) - DEFAULT
**Buy YES + NO when combined price < $1**

- Example: YES at 48¢ + NO at 49¢ = 97¢ total
- You lock $0.03 profit per $1 no matter who wins
- Targets 15-min crypto markets where prices move fast
- Polls API every 1-3 seconds, executes when sum < 99¢

**Config:**
```bash
STRATEGY=pair_arbitrage
PAIR_ARB_MAX_COST=0.99        # Max combined price to trigger (99¢)
PAIR_ARB_MIN_COST=0.84        # Optional: minimum combined price
PAIR_ARB_SHARES=250           # Position size per leg
PAIR_ARB_COOLDOWN_MS=1000     # Cooldown between trades
PAIR_ARB_MAX_PAIRS=10         # Max pairs per round
```

**Success Story:** Trader "distinct-baguette" made $242k in 1.5 months doing this

---

### 2. **Statistical Arbitrage** (`statistical_arbitrage`)
**Find correlated markets that drift apart**

- "trump wins" vs "GOP senate control" should move together
- When spread hits 4-7%, short expensive one, long cheap one
- Close when they converge

**Config:**
```bash
STRATEGY=statistical_arbitrage
STAT_ARB_MIN_SPREAD=0.04      # 4% minimum spread
STAT_ARB_MAX_SPREAD=0.07      # 7% maximum spread
STAT_ARB_SHARES=200           # Position size
STAT_ARB_CONVERGENCE=0.01     # 1% convergence threshold
STAT_ARB_COOLDOWN_MS=2000     # Cooldown
```

**Success Story:** Trader "sharky6999" made $480k scanning 100+ markets per minute

---

### 3. **Spread Farming** (`spread_farming`)
**Buy at bid, sell at ask, repeat**

- Buy at bid (5¢), sell at ask (6¢), repeat
- Or hedge across platforms (short polymarket, long binance)
- High-frequency loop via CLOB API

**Config:**
```bash
STRATEGY=spread_farming
SPREAD_FARM_MIN_BPS=5         # 5 basis points minimum
SPREAD_FARM_SHARES=100        # Position size
SPREAD_FARM_MAX_POS=20        # Max concurrent positions
SPREAD_FARM_COOLDOWN_MS=500   # Cooldown (high frequency)
```

**Success Story:** Trader "cry.eth2" made $194k with 1M trades

---

### 4. **AutoCycle Dump Hedge** (`autocycle_dump_hedge`)
**Detect dumps and hedge automatically**

- Enter one leg when price dumps >15% over 3 seconds
- Hedge with opposite leg when sum <= target
- Complete pair and hold to settlement

**Config:**
```bash
STRATEGY=autocycle_dump_hedge
ORDER_SIZE_SHARES=20
SUM_TARGET=0.95
MOVE_PCT=0.15
WINDOW_MIN=2
COOLDOWN_SECONDS=10
```

---

### 5. **Open Leg Dislocation Pair** (`open_leg_dislocation_pair`)
**Open leg → Wait for dislocation → Complete pair**

- Enter one leg immediately after round opens
- Wait for dislocation/price change
- Complete pair when conditions met (84-96¢ total)
- Hold to settlement

**Config:**
```bash
STRATEGY=open_leg_dislocation_pair
OPEN_LEG_SHARES=250
OPEN_LEG_TARGET_PAIR_COST=0.95
OPEN_LEG_MIN_DISLOCATION_SCORE=0.60
OPEN_LEG_MAX_WAIT_FOR_LEG2_SEC=480
```

---

## 🎯 Strategy Selection

### Via Environment Variable:
```bash
STRATEGY=pair_arbitrage
```

### Via API:
```bash
curl -X POST http://localhost:3001/control \
  -H "Content-Type: application/json" \
  -d '{"type": "SET_STRATEGY", "payload": "pair_arbitrage"}'
```

---

## 📊 Terminal UI

Enable the enhanced terminal UI that matches the screenshots:

```bash
ENABLE_TERMINAL_UI=true
```

The terminal displays:
- **POSITIONS** - UP/DOWN positions with cost, avg, qty, PnL
- **MARKET ANALYSIS** - Combined prices, spread, BTC price, CVD, flow
- **ORDER BOOKS** - Live UP/DOWN order books with bids/asks
- **RECENT TRANSACTIONS** - Last 6 trades with time, side, price, size
- **STRATEGY** - Current strategy and decision
- **RISK FLAGS** - Active risk warnings

---

## 📝 Recording

The recorder automatically writes:
- **Tick snapshots** (`type: "tick"`) - Market state every tick
- **Trade events** (`type: "trade"`) - Every fill/execution

Format:
```json
{"type": "tick", "t": 1234567890, "roundId": "...", "upAsk": 0.52, "downAsk": 0.48, ...}
{"type": "trade", "t": 1234567891, "roundId": "...", "strategy": "pair_arbitrage", "leg": 1, "side": "UP", "shares": 250, "px": 0.52}
```

Files: `./data/snapshots-YYYY-MM-DD.ndjson`

---

## 🚀 Quick Start

1. **Set strategy:**
```bash
export STRATEGY=pair_arbitrage
export PAIR_ARB_MAX_COST=0.99
export PAIR_ARB_SHARES=250
```

2. **Enable terminal UI:**
```bash
export ENABLE_TERMINAL_UI=true
```

3. **Start backend:**
```bash
cd apps/backend
pnpm dev
```

4. **Watch the terminal:**
The enhanced terminal UI will display real-time:
- Positions and PnL
- Order books
- Recent transactions
- Strategy decisions
- Risk flags

---

## 💡 Strategy Comparison

| Strategy | Best For | Frequency | Risk |
|----------|----------|-----------|------|
| `pair_arbitrage` | Fast-moving 15m markets | High (1-3s) | Low (locked profit) |
| `statistical_arbitrage` | Correlated markets | Medium | Medium |
| `spread_farming` | High-frequency spreads | Very High (500ms) | Low |
| `autocycle_dump_hedge` | Volatile dumps | Medium | Medium |
| `open_leg_dislocation_pair` | Dislocation opportunities | Low-Medium | Medium-High |

---

All strategies are **paper trading by default**. Set `PAPER_TRADING=false` and configure API keys for live trading.

