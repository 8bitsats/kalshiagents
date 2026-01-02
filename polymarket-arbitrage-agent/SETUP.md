# Setup Instructions

## Prerequisites

- Node.js 20+
- pnpm (or npm/yarn)
- TypeScript

## Installation

```bash
cd polymarket-arbitrage-agent
pnpm install
```

## Configuration

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Edit `.env` and set required values:
- `POLYMARKET_TOKEN_UP_ID` - Get from Polymarket market page
- `POLYMARKET_TOKEN_DOWN_ID` - Get from Polymarket market page
- `GROK_API_KEY` - Optional, for copilot features

## Getting Token IDs

1. Go to Polymarket and find a BTC 15-minute Up/Down market
2. Open browser DevTools → Network tab
3. Filter for WebSocket connections
4. Look for messages with `asset_id` fields - these are your token IDs
5. Or use Polymarket API to fetch market details

## Running

### Backend Only

```bash
cd apps/backend
pnpm dev
```

Server will start on `http://localhost:3001`
WebSocket available at `ws://localhost:3001/ws`

### With Frontend (when ready)

```bash
# Terminal 1: Backend
cd apps/backend
pnpm dev

# Terminal 2: Frontend
cd apps/frontend
pnpm dev
```

## Testing

```bash
# Check health
curl http://localhost:3001/health

# Get current state
curl http://localhost:3001/state

# Get trades
curl http://localhost:3001/trades?hours=24
```

## WebSocket Client Example

```javascript
const ws = new WebSocket('ws://localhost:3001/ws');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'tick') {
    console.log('State:', data.state);
    console.log('Decision:', data.decision);
  }
};
```

## Next Steps

1. ✅ Backend is running
2. ⏳ Frontend dashboard (coming next)
3. ⏳ Recorder + Replay system
4. ⏳ Grok copilot integration

