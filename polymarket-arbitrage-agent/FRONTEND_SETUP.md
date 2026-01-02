# Frontend Setup Guide

Complete Next.js 14 frontend for the Polymarket Arbitrage Agent.

## 🎯 What's Included

A production-ready web dashboard with:

- ✅ **Real-time WebSocket updates** (~4Hz)
- ✅ **Grok 4.1 AI chat** integration
- ✅ **Interactive control panel** for strategy management
- ✅ **Live positions & PnL** tracking
- ✅ **Market analysis** with fused state metrics
- ✅ **Recent transactions** table
- ✅ **Risk monitoring** with visual alerts
- ✅ **Cyberpunk UI** matching terminal aesthetic

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd apps/frontend
pnpm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001/ws
```

### 3. Start Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
apps/frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Main dashboard
│   │   └── globals.css         # Cyberpunk styling
│   ├── components/
│   │   ├── Dashboard.tsx       # Main container
│   │   ├── PositionsPanel.tsx  # Positions display
│   │   ├── MarketAnalysisPanel.tsx
│   │   ├── RecentTransactionsPanel.tsx
│   │   ├── StrategyPanel.tsx
│   │   ├── RiskPanel.tsx
│   │   ├── ControlPanel.tsx
│   │   ├── GrokChatPanel.tsx
│   │   └── StrategyOpenLegPanel.tsx
│   ├── lib/
│   │   ├── api.ts              # API client
│   │   └── ws.ts               # WebSocket client
│   └── store/
│       └── useStore.ts         # Zustand state
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.js
```

## 🎨 Components

### Dashboard
Main container that:
- Connects to WebSocket
- Polls backend API every 5 seconds
- Orchestrates all panels
- Handles connection status

### PositionsPanel
Shows:
- UP/DOWN positions with visual bars
- Average entry prices
- Current bid/ask
- Unrealized PnL per leg
- Total PnL

### MarketAnalysisPanel
Displays:
- UP/DOWN ask prices
- Combined sum ask
- Spread percentage
- Dislocation score
- BTC price, CVD, flow imbalance

### RecentTransactionsPanel
Table showing:
- Last 6 trades
- Timestamp, side, price, size
- Strategy and reason

### StrategyPanel
Shows:
- Active strategy name
- Latest decision
- Decision reason
- Confidence and tier
- Risk flags

### RiskPanel
Displays:
- Active risk flags (only when present)
- Kill switch status
- Drawdown alerts

### ControlPanel
Interactive controls:
- **Pause/Resume** buttons
- **Strategy selector** dropdown
- **Mode toggle** (AUTONOMOUS/HITL)

### GrokChatPanel
Grok 4.1 AI copilot:
- Chat interface
- Real-time responses
- Market context awareness
- Strategy recommendations

## 🔌 API Integration

### HTTP API Client (`/lib/api.ts`)

All backend endpoints wrapped in `apiClient`:
- `getState()` - Get current system state
- `getTrades()` - Get trade history
- `control()` - Send control commands
- `chat()` - Grok AI chat
- `hitlApprove()` / `hitlReject()` - HITL actions
- And more...

### WebSocket Client (`/lib/ws.ts`)

Real-time updates:
- Automatic connection on mount
- Auto-reconnect with exponential backoff
- Connection status tracking
- Tick message handling

**Usage:**
```typescript
import { wsClient } from "@/lib/ws";

wsClient.connect();
const unsubscribe = wsClient.onTick((msg) => {
  // Handle tick message
});
```

## 🎨 Styling

Uses Tailwind CSS with custom cyberpunk theme:

**Colors:**
- Background: `#050505` (dark)
- Text: `rgba(190,220,255,0.92)` (light blue)
- Accent Green: `#35d07f` (UP)
- Accent Red: `#ff5c6c` (DOWN)
- Accent Yellow: `#ffcf66` (warnings)
- Accent Blue: `#9ad0ff` (info)
- Accent Cyan: `#b7ffea` (metrics)

**Font:**
- Monospace font family for terminal aesthetic

## 📊 State Management

Uses Zustand for global state:

```typescript
const { state, decision, systemState, wsConnected } = useStore();
```

**State:**
- `state` - Current fused market state
- `decision` - Latest strategy decision
- `systemState` - System status (mode, paused, risk)
- `wsConnected` - WebSocket connection status

## 🚀 Deployment

### Vercel (Recommended)

```bash
cd apps/frontend
vercel
```

Set environment variables in Vercel dashboard:
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_WS_URL`

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install
COPY . .
RUN pnpm build
CMD ["pnpm", "start"]
```

### Environment Variables

Required for production:
- `NEXT_PUBLIC_API_URL` - Backend API URL
- `NEXT_PUBLIC_WS_URL` - WebSocket URL (use `wss://` for HTTPS)

## 🐛 Troubleshooting

### Backend Connection Issues

**Problem:** Frontend can't connect to backend

**Solutions:**
1. Verify backend is running: `curl http://localhost:3001/health`
2. Check `NEXT_PUBLIC_API_URL` in `.env`
3. Check browser console for CORS errors
4. Verify backend CORS is enabled

### WebSocket Not Connecting

**Problem:** WebSocket fails to connect

**Solutions:**
1. Verify `NEXT_PUBLIC_WS_URL` is correct
2. Check backend WebSocket endpoint: `ws://localhost:3001/ws`
3. Look for connection errors in browser console
4. Check browser WebSocket support

### Grok Chat Not Working

**Problem:** Grok chat returns errors

**Solutions:**
1. Verify `GROK_API_KEY` is set in backend `.env`
2. Test backend endpoint: `curl -X POST http://localhost:3001/agent/chat -d '{"message":"test"}'`
3. Check browser network tab for API errors
4. Verify API key has access to Grok 4.1

### Build Errors

**Problem:** `pnpm build` fails

**Solutions:**
1. Clear `.next` directory: `rm -rf .next`
2. Reinstall dependencies: `rm -rf node_modules && pnpm install`
3. Check TypeScript errors: `pnpm tsc --noEmit`
4. Verify all environment variables are set

## 📝 Development Tips

### Hot Reload
Next.js provides automatic hot reload. Changes to components update instantly.

### TypeScript
Full TypeScript support. Use `any` sparingly, prefer proper types.

### State Updates
State updates from WebSocket are automatic. Manual polling every 5 seconds for system state.

### Component Structure
Each panel is a separate component for easy maintenance and testing.

## 🎯 Next Steps

1. **Add Charts** - Use Recharts for 15-minute price charts
2. **Add Replay UI** - Interface for running replays
3. **Add HITL Panel** - Dedicated panel for approving/rejecting trades
4. **Add Settings** - User preferences and configuration
5. **Add Alerts** - Browser notifications for important events

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Zustand](https://github.com/pmndrs/zustand)
- [Recharts](https://recharts.org)

---

**Pure precision. No emotion. Just edge.** 🚀

