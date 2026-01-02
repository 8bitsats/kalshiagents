# Terminal UI - Enhanced Dashboard

## ✅ Features

The enhanced terminal UI matches the screenshots you provided with:

### 1. **POSITIONS Section**
- UP position: Cost, Avg, Qty, Current Price, PnL
- DOWN position: Cost, Avg, Qty, Current Price, PnL
- Color-coded (green for UP, red for DOWN)
- Real-time PnL updates

### 2. **MARKET ANALYSIS Section**
- UP/DOWN prices
- Combined price
- Spread percentage
- BTC price, CVD, Flow
- Pairs count, Delta, Total PnL

### 3. **ORDER BOOKS**
- **UP Order Book**: Bids and Asks with price levels and sizes
- **DOWN Order Book**: Bids and Asks with price levels and sizes
- Side-by-side display
- Top 10 levels shown

### 4. **RECENT TRANSACTIONS**
- Table format: TIME | SIDE | PRICE | SIZE | BTC PRICE | TX HASH
- Last 6 transactions displayed
- Color-coded sides (green UP, red DOWN)
- Summary: Total trades and volume

### 5. **STRATEGY Section**
- Current strategy name
- Latest decision and reason

### 6. **RISK FLAGS**
- Active risk warnings
- Red border when flags present

## 🚀 Enable Terminal UI

Add to `.env`:
```bash
ENABLE_TERMINAL_UI=true
```

Then start the backend:
```bash
cd apps/backend
pnpm dev
```

The terminal will refresh at 4Hz (4 times per second) showing:
- Real-time positions
- Live order books
- Recent transactions
- Strategy decisions
- Risk flags

## 📊 Output Format

The terminal matches the aesthetic from your screenshots:
- Dark background
- Monospace font
- Green/red color scheme
- Bordered sections
- Real-time updates

## 🎯 Example Output

```
┌─────────────────────────────────────────────────────────┐
│ BTC Up/Down 15m | btc-updown-15m-1767191400 | T-540s │
│ • WS Last: 10:35:31 PM | RUNNING | AUTONOMOUS          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ POSITIONS                                                │
│ ▲ UP                    ▼ DOWN                          │
│ Cost: $12,857.32        Cost: $12,554.30                │
│ Avg: $0.4881            Avg: $0.4693                    │
│ Qty: 26,340             Qty: 26,751                     │
│ Current: @0.513         Current: @0.517                  │
│ PnL: +$655              PnL: +$1,275                    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ MARKET ANALYSIS                                          │
│ UP: $0.5130 | DOWN: $0.5170                             │
│ Combined: $1.0300                                        │
│ Spread: -3.00%                                           │
│ BTC: $97,967 | CVD: 1234 | Flow: 0.45                   │
│ Pairs: 26,340 | Delta: -411 | Total PnL: +$1,930        │
└─────────────────────────────────────────────────────────┘

┌──────────────────────┐  ┌──────────────────────┐
│ UP ORDER BOOK         │  │ DOWN ORDER BOOK      │
│ Bid: 31.0% | Ask: 32.0%│  │ Bid: 68.0% | Ask: 69.0%│
│ BIDS (31)             │  │ BIDS (68)            │
│ 31.0% @ 47            │  │ 68.0% @ 264          │
│ 30.0% @ 1413          │  │ 67.0% @ 361          │
│ ...                   │  │ ...                  │
│ ASKS (68)             │  │ ASKS (31)            │
│ 32.0% @ 264           │  │ 69.0% @ 47           │
│ 33.0% @ 361           │  │ 70.0% @ 1413         │
│ ...                   │  │ ...                  │
└──────────────────────┘  └──────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ RECENT TRANSACTIONS                                      │
│ TIME       SIDE    PRICE     SIZE    BTC PRICE  TX HASH │
│ 15:39:02.28 ▼ DOWN $0.4822   785    $97,967     paper   │
│ 15:39:01.62 ▲ UP   $0.4943   732    $98,435     paper   │
│ ...                                                      │
│ Trades: 91 | Volume: $25,411.61                          │
└─────────────────────────────────────────────────────────┘
```

## 🎨 Color Scheme

- **Green** (`#35d07f`): UP positions, positive PnL, success
- **Red** (`#ff5c6c`): DOWN positions, negative PnL, warnings
- **Cyan** (`#9ad0ff`): Headers, labels
- **Yellow** (`#ffcf66`): Warnings, asks
- **Dim** (`rgba(190,220,255,0.55)`): Secondary text

## 📝 Notes

- Terminal UI uses Ink/React for rendering
- Updates at 4Hz (250ms intervals)
- Automatically clears and redraws
- Works in any terminal that supports ANSI colors
- Responsive to terminal size

The terminal UI provides a **real-time trading dashboard** matching your screenshots exactly! 🚀

