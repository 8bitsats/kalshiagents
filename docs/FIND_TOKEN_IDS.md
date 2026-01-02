# How to Find Token IDs - 3 Easy Methods

## 🚀 Method 1: Network Tab (RECOMMENDED - No Errors!)

**This is the safest and most reliable method!**

1. **Go to Polymarket** and navigate to a "Bitcoin Up/Down 15m" market
2. **Open DevTools** (F12 or Cmd+Option+I)
3. **Go to Network tab** → Click **"WS"** filter (WebSocket)
4. **Click on** the WebSocket connection to `ws-subscriptions-clob.polymarket.com`
5. **Click "Messages" tab** in the WebSocket inspector
6. **Look for messages** with `asset_id` fields
7. **Copy the two different `asset_id` values** (one for UP, one for DOWN)

See `EXTRACT_TOKEN_IDS_NETWORK_TAB.md` for detailed step-by-step instructions with screenshots!

**Example message:**
```json
{
  "event_type": "book",
  "asset_id": "0x1234567890abcdef...",  // ← Copy this
  ...
}
```

---

## 📡 Method 2: DevTools Network Tab (Manual)

1. **Go to Polymarket** and navigate to a "Bitcoin Up/Down 15m" market
2. **Open DevTools** (F12 or Cmd+Option+I)
3. **Go to Network tab**
4. **Filter for "WS"** (WebSocket)
5. **Click on** the WebSocket connection to `ws-subscriptions-clob.polymarket.com`
6. **Go to Messages tab** in the WebSocket inspector
7. **Look for messages** with `asset_id` fields
8. **Copy the two token IDs** (you'll see two different `asset_id` values)

Example message:
```json
{
  "event_type": "book",
  "asset_id": "0x1234567890abcdef...",  // ← This is a token ID
  "market": "btc-updown-15m",
  "bids": [...],
  "asks": [...]
}
```

---

## 💻 Method 3: Node.js Script (Programmatic)

```bash
cd /Users/8bit/Downloads/agents/polymarket-arbitrage-agent/apps/backend
tsx ../../fetch_token_ids.ts
```

This script will try to fetch token IDs from the Polymarket API.

---

## ✅ After Getting Token IDs

1. **Create `.env` file** (if it doesn't exist):
```bash
cd /Users/8bit/Downloads/agents/polymarket-arbitrage-agent
cp .env.example .env
```

2. **Edit `.env`** and add your token IDs:
```bash
POLYMARKET_TOKEN_UP_ID=0x1234567890abcdef...
POLYMARKET_TOKEN_DOWN_ID=0xabcdef1234567890...
```

3. **Start the backend**:
```bash
cd apps/backend
pnpm dev
```

---

## 🎯 Quick Reference

- **Token IDs** are Ethereum addresses (0x followed by 40 hex characters)
- You need **TWO** token IDs: one for UP, one for DOWN
- They should be **different** addresses
- They're specific to each market (different markets = different token IDs)

---

## ❓ Still Can't Find Them?

1. Make sure you're on a **"Bitcoin Up/Down 15m"** market page
2. Wait for the page to **fully load** (orderbook should be visible)
3. Try **refreshing the page** with DevTools open
4. Check that WebSocket messages are **actually being received** (they should appear in real-time)

If all else fails, you can also:
- Check the Polymarket API documentation
- Use the Python agent's `get-all-markets` command to list markets
- Contact Polymarket support for API access

