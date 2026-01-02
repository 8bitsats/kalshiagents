# Fix: Missing Token IDs Error

## ❌ Error Message

```
❌ Missing required environment variables:
   - POLYMARKET_TOKEN_UP_ID: Required
   - POLYMARKET_TOKEN_DOWN_ID: Required
```

## ✅ Quick Fix

### Option 1: Add Token IDs Manually (Recommended)

1. **Get Token IDs from Polymarket:**
   - Go to https://polymarket.com
   - Navigate to a "Bitcoin Up/Down 15m" market
   - Open DevTools (F12 or Cmd+Option+I)
   - Go to **Network** tab → Click **"WS"** filter
   - Click on WebSocket to `ws-subscriptions-clob.polymarket.com`
   - Click **"Messages"** tab
   - Look for messages with `asset_id` fields
   - Copy **TWO different** `asset_id` values (one UP, one DOWN)

2. **Add to .env file:**
   ```bash
   cd /Users/8bit/Downloads/agents/polymarket-arbitrage-agent
   
   # Edit .env file (or create if it doesn't exist)
   nano .env
   # or
   vim .env
   # or
   code .env
   ```

3. **Add these lines:**
   ```bash
   POLYMARKET_TOKEN_UP_ID=your_up_token_id_here
   POLYMARKET_TOKEN_DOWN_ID=your_down_token_id_here
   ```

   Replace `your_up_token_id_here` and `your_down_token_id_here` with the actual token IDs you copied.

### Option 2: Use Helper Script

If you have both token IDs ready:

```bash
cd /Users/8bit/Downloads/agents/polymarket-arbitrage-agent
bash add_token_ids_to_env.sh UP_TOKEN_ID DOWN_TOKEN_ID
```

Example:
```bash
bash add_token_ids_to_env.sh 0x1234567890abcdef... 0xabcdef1234567890...
```

### Option 3: Use TypeScript Script to Fetch Token IDs

```bash
cd /Users/8bit/Downloads/agents/polymarket-arbitrage-agent
tsx get_both_token_ids.ts
```

This will try to fetch token IDs from the Polymarket API. If it finds them, it will print the `.env` lines you need to add.

## 📋 Complete .env Example

Your `.env` file should look like this:

```bash
# Required: Token IDs
POLYMARKET_TOKEN_UP_ID=0x1234567890abcdef1234567890abcdef12345678
POLYMARKET_TOKEN_DOWN_ID=0xabcdef1234567890abcdef1234567890abcdef12

# Strategy (optional - defaults shown)
STRATEGY=pair_arbitrage
PAIR_ARB_MAX_COST=0.99
PAIR_ARB_SHARES=250

# Terminal UI (optional)
ENABLE_TERMINAL_UI=true

# Optional: Grok AI
# GROK_API_KEY=your_grok_api_key
# GROK_MODEL=grok-4.1
# LIVE_SEARCH=true
```

## 🔍 How to Find Token IDs

### Method 1: Network Tab (Easiest)

1. Visit Polymarket → Navigate to BTC Up/Down 15m market
2. Open DevTools (F12) → **Network** tab → Click **"WS"** filter
3. Click on WebSocket connection to `ws-subscriptions-clob.polymarket.com`
4. Click **"Messages"** tab
5. Look for messages with `asset_id` field
6. Copy the two different `asset_id` values

### Method 2: Browser Console Script

1. Visit Polymarket → Navigate to BTC Up/Down 15m market
2. Open DevTools (F12) → **Console** tab
3. Copy and paste the script from `browser_console_script.js`
4. Press Enter
5. It will print both token IDs

### Method 3: API Query

Use the TypeScript script:
```bash
cd /Users/8bit/Downloads/agents/polymarket-arbitrage-agent
tsx get_both_token_ids.ts
```

## ✅ Verify Token IDs Are Set

After adding token IDs, verify they're loaded:

```bash
cd /Users/8bit/Downloads/agents/polymarket-arbitrage-agent/apps/backend
pnpm dev
```

You should **NOT** see the "Missing required environment variables" error anymore.

## 📚 More Help

- See `FIND_TOKEN_IDS.md` for detailed instructions
- See `EXTRACT_TOKEN_IDS_NETWORK_TAB.md` for step-by-step with screenshots
- See `GET_TOKEN_IDS.md` for all methods

## 🚨 Common Issues

### "Token IDs not found in .env"
- Make sure you're editing the `.env` file in `polymarket-arbitrage-agent/` directory
- Check that the file exists: `ls -la /Users/8bit/Downloads/agents/polymarket-arbitrage-agent/.env`
- Make sure there are no spaces around the `=` sign: `POLYMARKET_TOKEN_UP_ID=value` (not `POLYMARKET_TOKEN_UP_ID = value`)

### "Still getting error after adding token IDs"
- Make sure token IDs don't have quotes: `POLYMARKET_TOKEN_UP_ID=0x123...` (not `POLYMARKET_TOKEN_UP_ID="0x123..."`)
- Make sure there are no extra spaces or newlines
- Restart the backend after editing `.env`

### "Can't find token IDs in WebSocket"
- Make sure you're on a BTC Up/Down 15m market page
- Wait a few seconds for WebSocket messages to appear
- Try refreshing the page
- Check that the WebSocket connection is active (should show green/connected status)

