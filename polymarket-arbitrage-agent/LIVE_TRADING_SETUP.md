# Live Trading Setup Guide

## 🚨 Important: Live Trading Uses Real Money

**WARNING**: When `PAPER_TRADING=false` and `LIVE_TRADING=true`, the bot will place **real orders** on Polymarket using **real USDC**. Make sure you understand the risks before enabling live trading.

## ✅ Prerequisites

1. **Polymarket Account**: You need an active Polymarket account
2. **USDC Balance**: Fund your Polymarket account with USDC
3. **Private Key**: Export your private key from:
   - Email/Magic login: https://reveal.magic.link/polymarket
   - Browser Wallet: Export from MetaMask/Coinbase Wallet
4. **Funder Address**: Your Polymarket proxy address (shown below your profile picture on Polymarket)

## 📋 Environment Variables

Add these to your `.env` file:

```bash
# Disable paper trading, enable live trading
PAPER_TRADING=false
LIVE_TRADING=true

# Required: Private key (export from reveal.magic.link/polymarket or your wallet)
POLYMARKET_PRIVATE_KEY=0x...

# Required: Your Polymarket proxy address (funder address)
# Find this below your profile picture on Polymarket website
POLYMARKET_FUNDER=0x...

# Required: Signature type
# 1 = Email/Magic login
# 2 = Browser Wallet (MetaMask, Coinbase Wallet, etc)
POLYMARKET_SIGNATURE_TYPE=1

# Optional: API credentials (will be auto-created if not provided)
# If you already have API credentials, you can set them:
POLYMARKET_API_KEY=...
POLYMARKET_API_SECRET=...
POLYMARKET_API_PASSPHRASE=...

# Required: Token IDs (same as paper trading)
POLYMARKET_TOKEN_UP_ID=...
POLYMARKET_TOKEN_DOWN_ID=...
```

## 🔧 Setup Steps

### 1. Get Your Private Key

**For Email/Magic Login:**
1. Go to https://reveal.magic.link/polymarket
2. Sign in with your Polymarket account
3. Copy your private key
4. Add to `.env`: `POLYMARKET_PRIVATE_KEY=0x...`

**For Browser Wallet:**
1. Export private key from MetaMask/Coinbase Wallet
2. Add to `.env`: `POLYMARKET_PRIVATE_KEY=0x...`
3. Set `POLYMARKET_SIGNATURE_TYPE=2`

### 2. Get Your Funder Address

1. Go to https://polymarket.com
2. Click on your profile picture
3. Look for your address below your profile picture
4. This is your **Polymarket Proxy Address** (funder address)
5. Add to `.env`: `POLYMARKET_FUNDER=0x...`

### 3. Set Signature Type

- **Email/Magic login**: `POLYMARKET_SIGNATURE_TYPE=1`
- **Browser Wallet**: `POLYMARKET_SIGNATURE_TYPE=2`

### 4. Fund Your Account

1. Send USDC to your Polymarket proxy address (funder address)
2. Make sure you have enough balance for your trading strategy

### 5. Start the Backend

```bash
cd /Users/8bit/Downloads/agents/polymarket-arbitrage-agent/apps/backend
pnpm dev
```

You should see:
```
✅ Live trading executor initialized
🔐 Live Trading: ENABLED
   Signature Type: 1 (1=Email/Magic, 2=Browser Wallet)
   Funder Address: 0x...
```

## 📊 API Endpoints

When live trading is enabled, these endpoints are available:

### Get Active Orders
```bash
GET /live/orders
```

### Cancel an Order
```bash
POST /live/cancel
{
  "orderId": "0x..."
}
```

### Cancel All Orders
```bash
POST /live/cancel-all
```

### Get Live Fills
```bash
GET /live/fills
```

## 🛡️ Safety Features

1. **Risk Management**: The risk manager still applies (max shares, max trades, max drawdown)
2. **Kill Switch**: Set `KILL_SWITCH=true` to enable automatic stop on drawdown
3. **HITL Mode**: Use `SET_MODE=HITL` to require manual approval for all trades
4. **Paper Sim Tracking**: Live trades are also tracked in the paper sim for comparison

## ⚠️ Common Issues

### "Live executor not initialized"
- Make sure `LIVE_TRADING=true` and `PAPER_TRADING=false`
- Check that `POLYMARKET_PRIVATE_KEY` is set correctly
- Verify the private key format (should start with `0x`)

### "Failed to initialize live trading"
- Check your private key is correct
- Verify your funder address matches your Polymarket account
- Make sure you have API credentials or they can be auto-created

### "Not enough balance"
- Fund your Polymarket account with USDC
- Send USDC to your funder address (proxy address)

### "Invalid signature type"
- Use `1` for Email/Magic login
- Use `2` for Browser Wallet

## 🔄 Switching Back to Paper Trading

To switch back to paper trading:

```bash
PAPER_TRADING=true
LIVE_TRADING=false
```

Then restart the backend.

## 📝 Notes

- **API Credentials**: If you don't provide `POLYMARKET_API_KEY`, `POLYMARKET_API_SECRET`, and `POLYMARKET_API_PASSPHRASE`, the system will automatically create/derive them using `createOrDeriveApiKey()`
- **Order Types**: All orders are placed as `GTC` (Good-Til-Cancelled) limit orders
- **Tick Sizes**: Tick sizes and neg risk are automatically fetched for each token
- **Error Handling**: Failed trades are logged but don't crash the system

## 🎯 Testing

Before going live with real money:

1. **Test with Paper Trading**: Run the strategy in paper mode first
2. **Start Small**: Use small order sizes initially
3. **Monitor Closely**: Watch the first few live trades carefully
4. **Use HITL Mode**: Start with `SET_MODE=HITL` to approve each trade manually

## 📚 References

- Polymarket CLOB Documentation: https://docs.polymarket.com
- Reveal Magic Link: https://reveal.magic.link/polymarket
- Polymarket Website: https://polymarket.com

