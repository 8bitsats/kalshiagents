# Polymarket Arbitrage Agent by FunPump.ai

**Pure precision. No emotion. Just edge.**

A production-grade Polymarket trading agent with real-time orderbook streaming, multiple arbitrage strategies, deterministic replay system, and **Grok 4.1 conversational copilot** with Live Search integration for intelligent market analysis and Human-In-The-Loop (HITL) trading decisions.

## 🎯 What We Built

This is a complete, production-ready trading system that successfully integrates:

- ✅ **Real-time market data fusion** from Polymarket CLOB and Binance Futures
- ✅ **5 sophisticated trading strategies** with configurable parameters
- ✅ **Grok 4.1 AI copilot** with Live Search for market analysis and trade recommendations
- ✅ **Human-In-The-Loop (HITL) gating** for safe autonomous trading
- ✅ **Paper and live trading** modes with seamless switching
- ✅ **Deterministic replay system** for backtesting strategies on historical data
- ✅ **Terminal dashboard** with real-time positions, market analysis, and transaction logs
- ✅ **Risk management** with configurable limits and kill switches
- ✅ **Recording system** that captures all market data for analysis

## ✨ Key Features

### Real-Time Market Data
- **Polymarket CLOB WebSocket** - Live orderbook updates for UP/DOWN tokens
- **Binance Futures WebSocket** - BTC price, volume, CVD, flow imbalance, momentum
- **Fused State Engine** - Combines both feeds at ~4Hz for unified decision-making
- **15-minute round tracking** - Automatic detection of BTC Up/Down round boundaries

### Trading Strategies

#### 1. **Pair Arbitrage** (Default)
Buy YES + NO when combined price < $1. Locks in guaranteed profit regardless of outcome.

```typescript
// Example: YES at 48¢ + NO at 49¢ = 97¢ total → $0.03 profit per $1
```

**Configuration:**
- `PAIR_ARBITRAGE_MAX_COST=0.99` - Maximum combined price to trigger
- `PAIR_ARBITRAGE_SHARES=250` - Shares to buy for each leg

#### 2. **Open Leg → Dislocation → Complete Pair**
Opens one leg at round start, waits for market dislocation, then completes the pair when conditions are met.

**Strategy Flow:**
1. Enter first leg within `OPEN_LEG_ENTER_DELAY_SEC` seconds of round start
2. Monitor for dislocation (sumAsk ≤ `OPEN_LEG_TARGET_PAIR_COST`)
3. Complete pair when opposite side moves by `OPEN_LEG_PRICE_CHANGE_TRIGGER_PCT`
4. Hold both legs through settlement

**Configuration:**
- `OPEN_LEG_SHARES=20` - Shares per leg
- `OPEN_LEG_TARGET_PAIR_COST=0.95` - Target combined cost
- `OPEN_LEG_MAX_WAIT_FOR_LEG2_SEC=480` - Max time to wait for leg 2
- `OPEN_LEG_MIN_DISLOCATION_SCORE=0.60` - Minimum dislocation to trigger

#### 3. **Dump → Hedge AutoCycle**
Detects violent price dumps in the first minutes of a round and executes a two-leg hedge cycle.

**Strategy Flow:**
1. Watch first `WINDOW_MIN` minutes of round
2. Detect dump (≥ `MOVE_PCT` price drop over ~3 seconds)
3. **Leg 1:** Buy dumped side
4. **Leg 2:** Hedge when `leg1EntryPrice + oppositeAsk <= SUM_TARGET`
5. Never buys same side twice per round

**Configuration:**
- `ORDER_SIZE_SHARES=20` - Shares per leg
- `SUM_TARGET=0.95` - Target sum for hedge trigger
- `MOVE_PCT=0.15` - Minimum dump percentage to trigger
- `WINDOW_MIN=2` - Minutes after round start to watch for dumps

#### 4. **Statistical Arbitrage**
Finds correlated markets that drift apart and trades the spread.

**Strategy Flow:**
1. Monitor spread between UP and DOWN tokens
2. When spread hits threshold (`STAT_ARB_THRESHOLD`), enter position
3. Long the cheaper side, short the expensive side
4. Exit when spread converges below `STAT_ARB_CONVERGENCE`

**Configuration:**
- `STAT_ARB_THRESHOLD=0.04` - Minimum spread to enter (4%)
- `STAT_ARB_SHARES=100` - Shares per position
- `STAT_ARB_CONVERGENCE=0.01` - Spread to exit (1%)

#### 5. **Spread Farming**
High-frequency market-making strategy that captures bid-ask spreads.

**Strategy Flow:**
1. Monitor bid-ask spreads on both UP and DOWN tokens
2. When spread ≥ `SPREAD_FARM_MIN_SPREAD`, execute trade
3. Buy at bid, sell at ask (simulated)
4. Repeat up to `SPREAD_FARM_MAX_POS` positions

**Configuration:**
- `SPREAD_FARM_MIN_SPREAD=0.01` - Minimum spread to trade (1 cent)
- `SPREAD_FARM_SIZE=100` - Shares per trade
- `SPREAD_FARM_MAX_POS=20` - Maximum concurrent positions

### 🤖 Grok 4.1 AI Copilot

The system includes a fully integrated **Grok 4.1 conversational agent** with Live Search capabilities:

#### Features
- **Real-time market analysis** - Grok analyzes current market conditions and provides insights
- **Trade recommendations** - AI suggests optimal entry/exit points based on market data
- **Live Search integration** - Grok can search the web for relevant market news and events
- **HITL mode** - Human-In-The-Loop gating for autonomous trading with AI oversight
- **Conversational interface** - Chat with Grok about market conditions, strategy performance, and risk

#### API Endpoint
```bash
POST /agent/chat
{
  "message": "What's the current market dislocation score?",
  "mode": "AUTONOMOUS" | "HITL",
  "context": { /* current market state */ }
}
```

#### HITL (Human-In-The-Loop) Mode
When enabled, Grok's trade recommendations are:
1. **Analyzed** by the AI for risk and opportunity
2. **Proposed** to the user via `/hitl/list` endpoint
3. **Approved/Rejected** via `/hitl/approve` or `/hitl/reject`
4. **Executed** only after approval (or auto-approved in AUTONOMOUS mode)

### 🌐 Web Dashboard

Modern Next.js 14 frontend with real-time updates:

- **Live Positions** - UP/DOWN positions with visual bars and PnL
- **Market Analysis** - Real-time prices, spreads, dislocation scores
- **Recent Transactions** - Last 6 trades with full details
- **Strategy Status** - Current decision, confidence, risk flags
- **Control Panel** - Pause/resume, strategy switching, mode toggle
- **Grok Chat** - Interactive AI copilot for market analysis
- **WebSocket Integration** - Sub-100ms latency updates
- **Responsive Design** - Works on desktop and mobile

**Start Frontend:**
```bash
cd apps/frontend
pnpm install
pnpm dev
# Open http://localhost:3000
```

See [FRONTEND_SETUP.md](./FRONTEND_SETUP.md) for detailed frontend documentation.

### 📊 Terminal Dashboard

Real-time terminal UI powered by Ink + React showing:

- **Positions Panel** - Current UP/DOWN positions with PnL
- **Market Analysis** - Live prices, spreads, dislocation scores, Binance data
- **Recent Transactions** - Last 6 trades with timestamps, prices, strategies
- **Strategy Status** - Current decision, confidence, risk flags
- **Risk Flags** - Active risk warnings (drawdown, max trades, etc.)

Enable with:
```bash
export ENABLE_TERMINAL_UI=true
```

### 🎬 Recording & Replay System

#### Recording
- **Automatic recording** - All market data captured to `./data/` directory
- **JSONL format** - One snapshot per line for easy parsing
- **Trade events** - All fills recorded with full context
- **Strategy state** - Strategy-specific state snapshots

#### Deterministic Replay
Replay historical data with exact same logic:

```bash
POST /replay/run
{
  "file": "./data/snapshot_20250101.jsonl",
  "strategy": "open_leg_dislocation_pair",
  "params": {
    "pairTarget": 0.95,
    "maxUnpairedSec": 120
  }
}
```

**Metrics Tracked:**
- Avg unpaired duration
- Completion rate
- Avg pair cost
- Missed opportunities
- Slippage + depth impact
- EV proxy
- Guard/abort reasons
- Latency/reaction time

### 🛡️ Risk Management

Multi-layer risk controls:

- **Max Shares Per Round** - `MAX_SHARES_PER_ROUND=200`
- **Max Trades Per Day** - `MAX_TRADES_PER_DAY=200`
- **Max Daily Drawdown** - `MAX_DAILY_DRAWDOWN=-250` (kills trading if exceeded)
- **Kill Switch** - `KILL_SWITCH=true` (emergency stop)
- **Cooldown Periods** - Strategy-specific cooldowns between trades

### 💰 Trading Modes

#### Paper Trading (Default)
- Safe testing environment
- Simulated fills at current market prices
- Full PnL tracking
- No real money at risk

#### Live Trading
- Real orders on Polymarket CLOB
- Supports both signature types:
  - **Type 1:** Email/Magic Link authentication
  - **Type 2:** Browser Wallet (MetaMask, etc.)
- Automatic order management
- Fill tracking and position updates

**Enable Live Trading:**
```bash
PAPER_TRADING=false
LIVE_TRADING=true
POLYMARKET_PRIVATE_KEY=your_private_key
POLYMARKET_API_KEY=your_api_key
POLYMARKET_API_SECRET=your_api_secret
POLYMARKET_API_PASSPHRASE=your_passphrase
POLYMARKET_SIGNATURE_TYPE=1  # or 2 for browser wallet
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and pnpm
- Polymarket account (for live trading)
- Grok API key (optional, for AI copilot)

### 1. Install Dependencies

```bash
cd polymarket-arbitrage-agent
pnpm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and set required variables:

```bash
# Required: Token IDs for BTC Up/Down 15m market
POLYMARKET_TOKEN_UP_ID=your_up_token_id
POLYMARKET_TOKEN_DOWN_ID=your_down_token_id

# Optional: Grok API for AI copilot
GROK_API_KEY=your_grok_api_key
GROK_MODEL=grok-4.1
LIVE_SEARCH=true

# Optional: Live trading (set PAPER_TRADING=false)
PAPER_TRADING=true
LIVE_TRADING=false
POLYMARKET_PRIVATE_KEY=your_private_key
POLYMARKET_API_KEY=your_api_key
POLYMARKET_API_SECRET=your_api_secret
POLYMARKET_API_PASSPHRASE=your_passphrase
POLYMARKET_SIGNATURE_TYPE=1

# Strategy selection
STRATEGY=pair_arbitrage  # or: open_leg_dislocation_pair, autocycle_dump_hedge, statistical_arbitrage, spread_farming

# Terminal UI
ENABLE_TERMINAL_UI=false  # Set to true for terminal dashboard
```

### 3. Get Token IDs

The token IDs are required for the BTC Up/Down 15-minute market:

1. Visit [Polymarket](https://polymarket.com)
2. Navigate to "BTC Up/Down 15m" market
3. Open browser DevTools → Network → WS tab
4. Look for WebSocket messages with `asset_id` fields
5. Copy the UP and DOWN token IDs

Or use the Polymarket API to fetch market details.

### 4. Run Backend

```bash
cd apps/backend
pnpm dev
```

You should see:
```
🚀 Server listening on http://0.0.0.0:3001
📊 WebSocket available at ws://localhost:3001/ws
🤖 Strategy: pair_arbitrage
📝 Mode: AUTONOMOUS
💰 Trading Mode: PAPER
📹 Recording: ON
```

### 5. Run Frontend (Optional)

In a separate terminal:

```bash
cd apps/frontend
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the web dashboard.

### 6. Access API

- **Health Check:** `GET http://localhost:3001/health`
- **Current State:** `GET http://localhost:3001/state`
- **WebSocket:** `ws://localhost:3001/ws`
- **Web Dashboard:** `http://localhost:3000`

## 📁 Project Structure

```
polymarket-arbitrage-agent/
├── apps/
│   ├── backend/                    # Node.js + TypeScript backend
│   │   ├── src/
│   │   │   ├── feeds/              # WebSocket feeds
│   │   │   │   ├── polymarket_ws.ts    # Polymarket CLOB WebSocket
│   │   │   │   └── binance_futures_ws.ts # Binance Futures WebSocket
│   │   │   ├── strategies/         # Trading strategies
│   │   │   │   ├── pair_arbitrage.ts
│   │   │   │   ├── open_leg_dislocation_pair_v2.ts
│   │   │   │   ├── autocycle_dump_hedge.ts
│   │   │   │   ├── statistical_arbitrage.ts
│   │   │   │   └── spread_farming.ts
│   │   │   ├── execution/          # Trade execution
│   │   │   │   ├── paper.ts         # Paper trading simulator
│   │   │   │   ├── live.ts          # Live trading executor
│   │   │   │   ├── risk.ts          # Risk management
│   │   │   │   └── hitl_gate.ts     # HITL gating system
│   │   │   ├── recorder/           # Data recording
│   │   │   │   └── recorder.ts      # JSONL snapshot writer
│   │   │   ├── replay/             # Deterministic replay
│   │   │   │   ├── replay.ts        # Generic replay engine
│   │   │   │   └── reduce_open_leg_pair_metrics.ts # Strategy-specific metrics
│   │   │   ├── agent/              # Grok AI integration
│   │   │   │   └── grok.ts          # Grok 4.1 client with Live Search
│   │   │   ├── api/                # HTTP API routes
│   │   │   │   └── hitl.ts          # HITL endpoints
│   │   │   ├── core/               # Core utilities
│   │   │   │   ├── orderbook.ts     # L2 orderbook management
│   │   │   │   └── round_watcher.ts # 15m round tracking
│   │   │   ├── fusion/             # State fusion
│   │   │   │   └── derive.ts        # Derived metrics calculation
│   │   │   ├── ui/                 # Terminal UI
│   │   │   │   └── terminal_enhanced.tsx # Ink/React dashboard
│   │   │   └── index.ts            # Main entry point
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── frontend/                    # Next.js 14 frontend
│       ├── src/
│       │   ├── app/                 # Next.js app router
│       │   │   ├── layout.tsx        # Root layout
│       │   │   ├── page.tsx          # Main dashboard
│       │   │   └── globals.css       # Cyberpunk styling
│       │   ├── components/           # React components
│       │   │   ├── Dashboard.tsx     # Main container
│       │   │   ├── PositionsPanel.tsx
│       │   │   ├── MarketAnalysisPanel.tsx
│       │   │   ├── RecentTransactionsPanel.tsx
│       │   │   ├── StrategyPanel.tsx
│       │   │   ├── RiskPanel.tsx
│       │   │   ├── ControlPanel.tsx
│       │   │   ├── GrokChatPanel.tsx
│       │   │   └── StrategyOpenLegPanel.tsx
│       │   ├── lib/                  # Utilities
│       │   │   ├── api.ts            # API client
│       │   │   └── ws.ts             # WebSocket client
│       │   └── store/                # State management
│       │       └── useStore.ts       # Zustand store
│       ├── package.json
│       └── tailwind.config.ts        # Cyberpunk theme
├── packages/
│   ├── types/                       # Shared TypeScript types
│   │   └── src/
│   │       └── fused.ts             # FusedState, StrategyDecision types
│   └── utils/                       # Shared utilities
├── .env.example                     # Environment template
└── README.md                        # This file
```

## 🔌 API Reference

### HTTP Endpoints

#### Health & Status
- `GET /health` - Health check
- `GET /state` - Current fused state, positions, risk flags
- `GET /trades?hours=24` - Trade history (paper + live)
- `GET /decisions?limit=200` - Recent strategy decisions

#### Control
- `POST /control` - Control commands
  ```json
  {
    "type": "PAUSE" | "RESUME" | "SET_STRATEGY" | "SET_MODE" | "SET_PARAM",
    "payload": { /* command-specific data */ }
  }
  ```

- `POST /control/applyActions` - Apply multiple actions atomically
  ```json
  {
    "actions": [
      { "type": "SET_STRATEGY", "name": "pair_arbitrage" },
      { "type": "SET_PARAM", "key": "PAIR_ARBITRAGE_MAX_COST", "value": 0.98 }
    ]
  }
  ```

#### Grok AI Copilot
- `POST /agent/chat` - Chat with Grok
  ```json
  {
    "message": "Analyze current market conditions",
    "mode": "AUTONOMOUS" | "HITL",
    "context": { /* optional market context */ }
  }
  ```
  Returns: `{ reply, analysis, actionPlan }`

#### HITL (Human-In-The-Loop)
- `GET /hitl/list` - List pending trade proposals
- `POST /hitl/approve` - Approve a trade proposal
  ```json
  { "proposalId": "uuid" }
  ```
- `POST /hitl/reject` - Reject a trade proposal
  ```json
  { "proposalId": "uuid", "reason": "optional reason" }
  ```

#### Recording & Replay
- `POST /recorder/start` - Start recording market data
- `POST /recorder/stop` - Stop recording
- `POST /replay/run` - Run deterministic replay
  ```json
  {
    "file": "./data/snapshot_20250101.jsonl",
    "strategy": "open_leg_dislocation_pair",
    "params": { /* strategy parameters */ }
  }
  ```

#### Live Trading
- `GET /live/orders` - Get open orders
- `POST /live/cancel` - Cancel specific order
  ```json
  { "orderId": "order_id" }
  ```
- `POST /live/cancel-all` - Cancel all open orders
- `GET /live/fills` - Get recent fills

### WebSocket Events

Connect to `ws://localhost:3001/ws` to receive real-time updates:

#### `tick` Event
Fused state update (~4Hz):
```json
{
  "type": "tick",
  "state": {
    "ts": 1234567890,
    "pm": { /* Polymarket data */ },
    "binance": { /* Binance data */ },
    "derived": { /* Derived metrics */ },
    "portfolio": { /* Positions & PnL */ }
  },
  "decision": { /* Strategy decision */ },
  "risk": { /* Risk flags */ },
  "proposals": [ /* HITL proposals */ ]
}
```

## 🎛️ Configuration

All configuration via environment variables (see `.env.example`):

### Market Configuration
- `POLYMARKET_WS_URL` - WebSocket URL (default: wss://ws-subscriptions-clob.polymarket.com/ws/)
- `POLYMARKET_HOST` - API host (default: https://clob.polymarket.com)
- `POLYMARKET_MARKET_SLUG` - Market slug (default: btc-updown-15m)
- `POLYMARKET_TOKEN_UP_ID` - **Required** - UP token ID
- `POLYMARKET_TOKEN_DOWN_ID` - **Required** - DOWN token ID
- `BINANCE_FUTURES_WS` - Binance WebSocket URL
- `BINANCE_SYMBOL` - Symbol (default: btcusdt)

### Strategy Configuration
- `STRATEGY` - Active strategy (default: pair_arbitrage)
- Strategy-specific params (see strategy sections above)

### Grok AI Configuration
- `GROK_API_KEY` - **Required for AI features** - Grok API key
- `GROK_MODEL` - Model name (default: grok-4.1)
- `LIVE_SEARCH` - Enable Live Search (default: true)

### Trading Configuration
- `PAPER_TRADING` - Paper mode (default: true)
- `LIVE_TRADING` - Enable live trading (default: false)
- `POLYMARKET_PRIVATE_KEY` - Private key for live trading
- `POLYMARKET_API_KEY` - API key
- `POLYMARKET_API_SECRET` - API secret
- `POLYMARKET_API_PASSPHRASE` - API passphrase
- `POLYMARKET_SIGNATURE_TYPE` - 1 (Email/Magic) or 2 (Browser Wallet)

### Risk Configuration
- `MAX_SHARES_PER_ROUND` - Max shares per 15m round (default: 200)
- `MAX_TRADES_PER_DAY` - Max trades per day (default: 200)
- `MAX_DAILY_DRAWDOWN` - Kill switch threshold (default: -250)
- `KILL_SWITCH` - Enable kill switch (default: true)

### UI Configuration
- `ENABLE_TERMINAL_UI` - Enable terminal dashboard (default: false)
- `ENGINE_HZ` - Engine tick rate (default: 4)
- `RECORDER_HZ` - Recording frequency (default: 4)

## 🧪 Testing & Development

### Run in Development Mode
```bash
cd apps/backend
pnpm dev  # Uses tsx watch for hot reload
```

### Build for Production
```bash
pnpm build
pnpm start
```

### Run Replay on Historical Data
```bash
curl -X POST http://localhost:3001/replay/run \
  -H "Content-Type: application/json" \
  -d '{
    "file": "./data/snapshot_20250101.jsonl",
    "strategy": "open_leg_dislocation_pair",
    "params": {
      "pairTarget": 0.95,
      "maxUnpairedSec": 120
    }
  }'
```

## 📊 Monitoring

### Terminal Dashboard
Enable with `ENABLE_TERMINAL_UI=true` to see:
- Real-time positions and PnL
- Market analysis (prices, spreads, dislocation)
- Recent transactions
- Strategy decisions
- Risk flags

### WebSocket Monitoring
Connect to `ws://localhost:3001/ws` and listen for `tick` events to monitor:
- Fused state updates
- Strategy decisions
- Trade executions
- Risk flags
- HITL proposals

### Logs
The backend uses Fastify's built-in logger. Logs include:
- HTTP requests/responses
- WebSocket connections
- Trade executions
- Strategy decisions
- Errors and warnings

## 🔒 Security

- **Never commit `.env` files** - All secrets in environment variables
- **Paper trading by default** - Safe testing environment
- **HITL mode** - Human approval required for trades (when enabled)
- **Risk limits** - Multiple layers of protection
- **Kill switch** - Emergency stop mechanism

## 🐛 Troubleshooting

### Backend won't start
- Check that token IDs are set in `.env`
- Verify all dependencies installed: `pnpm install`
- Check port 3001 is available

### No market data
- Verify WebSocket connections are working
- Check token IDs are correct for BTC Up/Down 15m market
- Verify network connectivity

### Grok AI not working
- Check `GROK_API_KEY` is set and valid
- Verify API key has access to Grok 4.1 model
- Check network connectivity to Grok API

### Live trading errors
- Verify all live trading env vars are set
- Check private key format (should start with `0x`)
- Verify API credentials are correct
- Check signature type matches your authentication method

## 📈 Performance

- **Engine tick rate:** 4Hz (configurable)
- **WebSocket latency:** <100ms typical
- **Strategy decision time:** <10ms typical
- **Recording overhead:** <1% CPU
- **Memory usage:** ~50-100MB typical

## 🎓 Learning Resources

- [Polymarket CLOB Documentation](https://docs.clob.polymarket.com)
- [Binance Futures API](https://binance-docs.github.io/apidocs/futures/en/)
- [Grok API Documentation](https://x.ai/api)
- [Fastify Documentation](https://www.fastify.io)

## 🤝 Contributing

This is a production trading system. Contributions should:
- Maintain backward compatibility
- Include tests for new strategies
- Update documentation
- Follow existing code style

## 📝 License

MIT

## 🙏 Acknowledgments

Built with:
- [Polymarket CLOB Client](https://github.com/Polymarket/clob-client)
- [Fastify](https://www.fastify.io) - Fast web framework
- [Ink](https://github.com/vadimdemedes/ink) - React for terminal UIs
- [Grok 4.1](https://x.ai) - AI copilot with Live Search
- [Binance](https://www.binance.com) - Futures market data

---

**Pure precision. No emotion. Just edge.** 🚀
