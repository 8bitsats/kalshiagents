# Quick Fix: Missing Token IDs

## ✅ Installation Complete!

The backend installed successfully. Now you just need to add the token IDs.

## 🚀 Quick Setup (2 steps)

### Step 1: Create .env file

```bash
cd /Users/8bit/Downloads/agents/polymarket-arbitrage-agent
cp .env.example .env
```

### Step 2: Add Token IDs

Edit `.env` and add your token IDs:

```bash
POLYMARKET_TOKEN_UP_ID=your_up_token_id_here
POLYMARKET_TOKEN_DOWN_ID=your_down_token_id_here
```

## 📝 How to Get Token IDs

### 🚀 Method 1: Network Tab (RECOMMENDED - No Errors!)

1. Go to **Polymarket website** → Navigate to a **"Bitcoin Up/Down 15m"** market
2. Open **DevTools** (F12 or Cmd+Option+I) → **Network tab**
3. Click **"WS"** filter (WebSocket) → Click on `ws-subscriptions-clob.polymarket.com`
4. Click **"Messages" tab** → Look for messages with `asset_id` fields
5. Copy the **two different `asset_id` values** (one for UP, one for DOWN)

**This method is 100% safe and won't cause errors!**

See `EXTRACT_TOKEN_IDS_NETWORK_TAB.md` for detailed instructions.

### 📡 Method 2: Browser Console Script (May Cause Errors)

1. Go to **Polymarket website** → Find a **"Bitcoin Up/Down 15m"** market
2. Open **DevTools** (F12 or Cmd+Option+I)
3. Go to **Network tab** → Filter for **"WS"** (WebSocket)
4. Click on WebSocket connection to `ws-subscriptions-clob.polymarket.com`
5. Look for messages with `asset_id` fields
6. Copy the two token IDs (one for UP, one for DOWN)

See `FIND_TOKEN_IDS.md` for all methods and detailed instructions.

## ✅ After Adding Token IDs

Start the backend:

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

## 🎯 That's It!

Once token IDs are added, the backend will:
- ✅ Connect to Polymarket WebSocket
- ✅ Connect to Binance WebSocket  
- ✅ Start computing fused state
- ✅ Run strategy logic
- ✅ Make paper trades
- ✅ Serve HTTP + WebSocket API

