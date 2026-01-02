# How to Get Polymarket Token IDs

The backend requires `POLYMARKET_TOKEN_UP_ID` and `POLYMARKET_TOKEN_DOWN_ID` to connect to a specific market.

## Method 1: From Polymarket Website (Easiest)

1. **Go to Polymarket** and find a "Bitcoin Up/Down 15m" market
2. **Open Browser DevTools** (F12 or Cmd+Option+I)
3. **Go to Network tab** → Filter for "WS" (WebSocket)
4. **Look for WebSocket connections** to `ws-subscriptions-clob.polymarket.com`
5. **Click on a WebSocket message** and look for `asset_id` fields
6. **Copy the two token IDs** (one for UP, one for DOWN)

Example message structure:
```json
{
  "event_type": "book",
  "asset_id": "1234567890123456789012345678901234567890",  // ← This is the token ID
  "market": "...",
  "bids": [...],
  "asks": [...]
}
```

## Method 2: Using Python Agent (If Available)

```bash
cd /Users/8bit/Downloads/agents
source .venv/bin/activate
export PYTHONPATH="."

# Get markets
python scripts/python/cli.py get-all-markets --limit 5

# Look for token IDs in the output
```

## Method 3: From Polymarket API

You can also query the Polymarket API directly to get market details including token IDs.

## Quick Setup

Once you have the token IDs:

```bash
cd /Users/8bit/Downloads/agents/polymarket-arbitrage-agent

# Create .env file
cp .env.example .env

# Edit .env and add:
POLYMARKET_TOKEN_UP_ID=your_up_token_id_here
POLYMARKET_TOKEN_DOWN_ID=your_down_token_id_here
```

## Example .env

```bash
# Required
POLYMARKET_TOKEN_UP_ID=1234567890123456789012345678901234567890
POLYMARKET_TOKEN_DOWN_ID=0987654321098765432109876543210987654321

# Optional (for paper trading, these can be empty)
POLYMARKET_API_KEY=
POLYMARKET_API_SECRET=
POLYMARKET_PRIVATE_KEY=
```

## Verify

After adding token IDs, start the backend:

```bash
cd apps/backend
pnpm dev
```

You should see:
```
🚀 Server listening on http://0.0.0.0:3001
📊 WebSocket available at ws://localhost:3001/ws
🤖 Strategy: autocycle_dump_hedge
```

If you still see errors about missing token IDs, double-check your `.env` file is in the correct location and the values are set correctly.

