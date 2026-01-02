# 🚀 Quick Start - Polymarket Arbitrage Agent

## Step 1: Install Dependencies

```bash
cd /Users/8bit/Downloads/agents/polymarket-arbitrage-agent
pnpm install
```

If you don't have pnpm:
```bash
npm install -g pnpm
```

## Step 2: Configure Environment

```bash
# Copy example env file
cp .env.example .env

# Edit .env and set:
# - POLYMARKET_TOKEN_UP_ID (required)
# - POLYMARKET_TOKEN_DOWN_ID (required)
# - GROK_API_KEY (optional, for copilot)
```

### How to Get Token IDs

1. **Option 1: From Polymarket WebSocket**
   - Open Polymarket in browser
   - Open DevTools → Network → WS
   - Look for messages with `asset_id` fields
   - Copy the UP and DOWN token IDs

2. **Option 2: From Polymarket API**
   ```bash
   # Use the existing agents/polymarket/polymarket.py to fetch market details
   cd /Users/8bit/Downloads/agents
   source .venv/bin/activate
   export PYTHONPATH="."
   python -c "from agents.polymarket.polymarket import Polymarket; p = Polymarket(); markets = p.get_all_markets(); print(markets[0])"
   ```

## Step 3: Start Backend

```bash
cd apps/backend
pnpm dev
```

You should see:
```
🚀 Server listening on http://0.0.0.0:3001
📊 WebSocket available at ws://localhost:3001/ws
🤖 Strategy: autocycle_dump_hedge
📝 Mode: AUTONOMOUS
💰 Paper Trading: true
```

## Step 4: Test It

### Check Health
```bash
curl http://localhost:3001/health
```

### Get Current State
```bash
curl http://localhost:3001/state | jq
```

### Connect WebSocket (Node.js example)
```javascript
const WebSocket = require('ws');
const ws = new WebSocket('ws://localhost:3001/ws');

ws.on('message', (data) => {
  const msg = JSON.parse(data);
  if (msg.type === 'tick') {
    console.log('Sum Ask:', msg.state.derived.sumAsk);
    console.log('Decision:', msg.decision.reason);
  }
});
```

## Step 5: Control the Agent

### Pause/Resume
```bash
curl -X POST http://localhost:3001/control \
  -H "Content-Type: application/json" \
  -d '{"type": "PAUSE"}'

curl -X POST http://localhost:3001/control \
  -H "Content-Type: application/json" \
  -d '{"type": "RESUME"}'
```

### Switch Strategy
```bash
curl -X POST http://localhost:3001/control \
  -H "Content-Type: application/json" \
  -d '{"type": "SET_STRATEGY", "payload": {"name": "open_leg_dislocation_pair"}}'
```

## What's Working

✅ **Backend Core**
- Polymarket WebSocket feed
- Binance Futures WebSocket feed
- Fused state engine
- Round watcher (auto-switches to current 15m round)
- Two strategies implemented:
  - `autocycle_dump_hedge` - Dump → Hedge cycle
  - `open_leg_dislocation_pair` - Open leg → Dislocation → Complete pair
- Paper execution with risk controls
- HTTP API + WebSocket server
- Recorder (ready to use)

⏳ **Coming Next**
- Frontend dashboard (terminal-style UI)
- Grok 4.1 copilot integration
- Replay simulator

## Troubleshooting

### "Cannot find module '@packages/types'"
```bash
# Make sure you're in the monorepo root
cd /Users/8bit/Downloads/agents/polymarket-arbitrage-agent
pnpm install
```

### "POLYMARKET_TOKEN_UP_ID required"
- Make sure `.env` file exists and has the token IDs
- Check that token IDs are correct (they're long numbers)

### WebSocket connection fails
- Check that Polymarket and Binance WebSocket URLs are correct
- Verify your network connection
- Check browser console for CORS errors (if accessing from frontend)

## Next Steps

1. ✅ Backend is running
2. Get token IDs and add to `.env`
3. Watch the agent make decisions via WebSocket
4. Check `/state` endpoint to see positions and PnL
5. Wait for frontend dashboard (or build your own using the WebSocket)

## Architecture

```
Backend (Node.js + TypeScript)
├── Feeds (WebSocket)
│   ├── Polymarket CLOB (market channel)
│   └── Binance Futures (aggTrade + depth)
├── Fusion Engine
│   └── Derives: sumAsk, dislocationScore, spreads, etc.
├── Strategies
│   ├── AutoCycle Dump → Hedge
│   └── Open Leg → Dislocation → Pair
├── Execution
│   ├── Paper Simulator
│   └── Risk Manager
└── API
    ├── HTTP (REST)
    └── WebSocket (real-time)
```

The agent runs at **4Hz** (4 ticks per second) by default, updating fused state and making strategy decisions.

