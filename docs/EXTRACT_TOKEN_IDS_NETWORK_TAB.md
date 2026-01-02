# Extract Token IDs Using Network Tab (Recommended - No Errors!)

This method is **100% safe** and won't cause any errors on the Polymarket website.

## Step-by-Step Instructions

### 1. Open Polymarket
- Go to https://polymarket.com
- Navigate to a **"Bitcoin Up/Down 15m"** market
- Wait for the page to fully load (orderbook should be visible)

### 2. Open DevTools
- Press **F12** (Windows/Linux) or **Cmd+Option+I** (Mac)
- Or right-click → "Inspect"

### 3. Go to Network Tab
- Click on the **"Network"** tab in DevTools
- Click the **"WS"** filter button (WebSocket) - it's in the filter row
- You should see WebSocket connections listed

### 4. Find the Polymarket WebSocket
- Look for a connection to: `ws-subscriptions-clob.polymarket.com`
- **Click on it** to open the WebSocket inspector

### 5. View Messages
- In the WebSocket inspector, you'll see tabs like "Headers", "Messages", etc.
- Click on the **"Messages"** tab
- You should see messages appearing in real-time

### 6. Find Token IDs
- Look for messages that look like this:
```json
{
  "event_type": "book",
  "asset_id": "0x1234567890abcdef1234567890abcdef12345678",
  "market": "btc-updown-15m",
  "bids": [...],
  "asks": [...]
}
```

- The `asset_id` field contains the token ID
- You need to find **TWO different** `asset_id` values (one for UP, one for DOWN)
- They will appear in separate messages

### 7. Copy Token IDs
- Copy the first `asset_id` value → This is your **UP token**
- Copy the second `asset_id` value → This is your **DOWN token**
- They should be different Ethereum addresses (0x followed by 40 hex characters)

### 8. Add to .env File
```bash
cd /Users/8bit/Downloads/agents/polymarket-arbitrage-agent
cp .env.example .env
```

Then edit `.env` and add:
```bash
POLYMARKET_TOKEN_UP_ID=0x1234567890abcdef1234567890abcdef12345678
POLYMARKET_TOKEN_DOWN_ID=0xabcdef1234567890abcdef1234567890abcdef12
```

## Visual Guide

```
DevTools
├── Network Tab
    ├── Filter: WS (WebSocket) ← Click this
    ├── ws-subscriptions-clob.polymarket.com ← Click this
    │   ├── Headers
    │   ├── Messages ← Click this tab
    │   │   ├── Message 1: { "asset_id": "0x1234..." } ← Copy this
    │   │   ├── Message 2: { "asset_id": "0x5678..." } ← Copy this
    │   │   └── ...
```

## Troubleshooting

**Q: I don't see any WebSocket connections**
- Make sure you're on a market page (not the homepage)
- Refresh the page with DevTools open
- Wait a few seconds for connections to establish

**Q: I only see one asset_id**
- Wait longer - messages come in real-time
- Scroll through the messages list
- The two token IDs appear in separate messages

**Q: The messages are empty or not JSON**
- Make sure you're looking at the "Messages" tab (not "Headers")
- Wait for the page to fully load
- Try refreshing the page

**Q: I see multiple asset_ids but don't know which is UP/DOWN**
- It doesn't matter which is which for now
- Just pick any two different asset_id values
- The backend will figure out which is which based on market data

## Quick Reference

- **Token IDs** = Ethereum addresses (0x + 40 hex chars)
- **You need 2 different token IDs**
- **They appear in WebSocket messages as `asset_id`**
- **Copy them into your `.env` file**

That's it! This method is foolproof and won't break anything. 🎉

