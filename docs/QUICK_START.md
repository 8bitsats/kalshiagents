# Quick Start Guide

## 🚀 Start the Backend

### Option 1: Use the Helper Script (Easiest)

```bash
cd /Users/8bit/Downloads/agents/polymarket-arbitrage-agent
./start_backend.sh
```

### Option 2: Manual Start

```bash
# Navigate to backend
cd /Users/8bit/Downloads/agents/polymarket-arbitrage-agent/apps/backend

# Set environment variables (optional - defaults are set)
export STRATEGY=pair_arbitrage
export PAIR_ARB_MAX_COST=0.99
export PAIR_ARB_SHARES=250
export ENABLE_TERMINAL_UI=true

# Start
pnpm dev
```

## 📋 Available Strategies

### 1. Pair Arbitrage (Default)
```bash
export STRATEGY=pair_arbitrage
export PAIR_ARB_MAX_COST=0.99
export PAIR_ARB_SHARES=250
```

### 2. Statistical Arbitrage
```bash
export STRATEGY=statistical_arbitrage
export STAT_ARB_MIN_SPREAD=0.04
export STAT_ARB_MAX_SPREAD=0.07
export STAT_ARB_SHARES=200
```

### 3. Spread Farming
```bash
export STRATEGY=spread_farming
export SPREAD_FARM_MIN_BPS=5
export SPREAD_FARM_SHARES=100
```

### 4. AutoCycle Dump Hedge
```bash
export STRATEGY=autocycle_dump_hedge
export ORDER_SIZE_SHARES=20
export SUM_TARGET=0.95
```

### 5. Open Leg Dislocation Pair
```bash
export STRATEGY=open_leg_dislocation_pair
export OPEN_LEG_SHARES=250
export OPEN_LEG_TARGET_PAIR_COST=0.95
```

## 🎯 Terminal UI

The terminal UI is **enabled by default**. It displays:
- **POSITIONS** - UP/DOWN positions with cost, avg, qty, PnL
- **MARKET ANALYSIS** - Combined prices, spread, BTC price
- **ORDER BOOKS** - Live UP/DOWN order books
- **RECENT TRANSACTIONS** - Last 6 trades
- **STRATEGY** - Current strategy and decisions
- **RISK FLAGS** - Active warnings

To disable:
```bash
export ENABLE_TERMINAL_UI=false
```

## 📝 Environment Variables

Create a `.env` file in `polymarket-arbitrage-agent/`:

```bash
# Required
POLYMARKET_TOKEN_UP_ID=your_up_token_id
POLYMARKET_TOKEN_DOWN_ID=your_down_token_id

# Strategy (default: pair_arbitrage)
STRATEGY=pair_arbitrage
PAIR_ARB_MAX_COST=0.99
PAIR_ARB_SHARES=250

# Terminal UI
ENABLE_TERMINAL_UI=true

# Optional: Grok AI
GROK_API_KEY=your_grok_api_key
GROK_MODEL=grok-4.1
LIVE_SEARCH=true
```

## 🔧 Troubleshooting

### "No package.json found"
Make sure you're in the correct directory:
```bash
cd /Users/8bit/Downloads/agents/polymarket-arbitrage-agent/apps/backend
```

### "Module not found"
Install dependencies:
```bash
cd /Users/8bit/Downloads/agents/polymarket-arbitrage-agent
pnpm install
```

### "POLYMARKET_TOKEN_UP_ID required"
Add token IDs to `.env` file. See `FIND_TOKEN_IDS.md` for instructions.

## 📊 What You'll See

When the backend starts, you'll see:
1. Server listening on port 3001
2. WebSocket available at ws://localhost:3001/ws
3. Strategy name
4. Mode (AUTONOMOUS/HITL)
5. Paper Trading status
6. Recording status

If `ENABLE_TERMINAL_UI=true`, you'll also see the enhanced terminal dashboard updating in real-time!

## 🎯 Next Steps

1. **Monitor the terminal** - Watch positions, order books, and trades
2. **Check API** - Visit `http://localhost:3001/state` for JSON state
3. **View trades** - Visit `http://localhost:3001/trades` for recent fills
4. **Chat with Grok** - POST to `/agent/chat` for AI assistance

See `TRADING_MODES.md` for detailed strategy documentation.
