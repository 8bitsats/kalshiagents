# Polymarket Arbitrage Agent - Frontend

Next.js 14 frontend for the Polymarket Arbitrage Agent, providing a real-time web dashboard with Grok AI integration.

## Features

- **Real-time Dashboard** - Live market data, positions, and strategy decisions
- **WebSocket Integration** - Sub-100ms latency updates from backend
- **Grok 4.1 Chat** - Conversational AI copilot for market analysis
- **Control Panel** - Pause/resume, strategy switching, mode toggling
- **Cyberpunk UI** - Dark theme matching terminal aesthetic
- **Responsive Design** - Works on desktop and mobile

## Quick Start

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

### 3. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

### 4. Build for Production

```bash
pnpm build
pnpm start
```

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx             # Main dashboard page
│   └── globals.css          # Global styles
├── components/
│   ├── Dashboard.tsx       # Main dashboard container
│   ├── PositionsPanel.tsx   # Positions display
│   ├── MarketAnalysisPanel.tsx # Market metrics
│   ├── RecentTransactionsPanel.tsx # Trade history
│   ├── StrategyPanel.tsx    # Strategy status
│   ├── RiskPanel.tsx        # Risk flags
│   ├── ControlPanel.tsx     # Control buttons
│   ├── GrokChatPanel.tsx    # Grok AI chat
│   └── StrategyOpenLegPanel.tsx # Strategy-specific panel
├── lib/
│   ├── api.ts               # API client
│   └── ws.ts                # WebSocket client
└── store/
    └── useStore.ts          # Zustand state management
```

## Components

### Dashboard
Main container that orchestrates all panels and WebSocket connection.

### PositionsPanel
Shows current UP/DOWN positions with:
- Share quantities with visual bars
- Average entry prices
- Current bid/ask
- Unrealized PnL
- Total PnL

### MarketAnalysisPanel
Displays real-time market metrics:
- UP/DOWN ask prices
- Combined sum ask
- Spread percentage
- Dislocation score
- BTC price, CVD, flow imbalance

### RecentTransactionsPanel
Table of last 6 trades with:
- Timestamp
- Side (UP/DOWN)
- Price
- Size
- Strategy
- Reason

### StrategyPanel
Shows current strategy:
- Strategy name
- Latest decision
- Decision reason
- Confidence and tier
- Risk flags

### RiskPanel
Displays active risk flags (only shown when flags exist):
- Risk warnings
- Kill switch status
- Drawdown alerts

### ControlPanel
Interactive controls:
- Pause/Resume buttons
- Strategy selector
- Mode toggle (AUTONOMOUS/HITL)

### GrokChatPanel
Grok 4.1 AI copilot:
- Chat interface
- Real-time responses
- Market context awareness
- Strategy recommendations

## API Integration

The frontend connects to the backend via:

1. **HTTP API** (`/lib/api.ts`)
   - REST endpoints for state, control, chat
   - Polls system state every 5 seconds

2. **WebSocket** (`/lib/ws.ts`)
   - Real-time tick updates (~4Hz)
   - Automatic reconnection
   - Connection status tracking

## State Management

Uses Zustand for global state:
- `state` - Current fused market state
- `decision` - Latest strategy decision
- `systemState` - System status (mode, paused, risk)
- `wsConnected` - WebSocket connection status

## Styling

Uses Tailwind CSS with custom cyberpunk theme:
- Dark background (`#050505`)
- Blue accents for Polymarket
- Green/Red for UP/DOWN
- Monospace font for terminal aesthetic

## Development

### Hot Reload
Next.js provides automatic hot reload during development.

### TypeScript
Full TypeScript support with strict mode enabled.

### Linting
```bash
pnpm lint
```

## Deployment

### Vercel (Recommended)
```bash
vercel
```

### Docker
```bash
docker build -t polymarket-frontend .
docker run -p 3000:3000 polymarket-frontend
```

### Environment Variables
Set in deployment platform:
- `NEXT_PUBLIC_API_URL` - Backend API URL
- `NEXT_PUBLIC_WS_URL` - WebSocket URL

## Troubleshooting

### Backend Connection Issues
- Verify backend is running on port 3001
- Check `NEXT_PUBLIC_API_URL` in `.env`
- Check browser console for CORS errors

### WebSocket Not Connecting
- Verify `NEXT_PUBLIC_WS_URL` is correct
- Check backend WebSocket endpoint is accessible
- Look for connection errors in browser console

### Grok Chat Not Working
- Verify `GROK_API_KEY` is set in backend `.env`
- Check backend `/agent/chat` endpoint is working
- Review browser network tab for API errors

## License

MIT

