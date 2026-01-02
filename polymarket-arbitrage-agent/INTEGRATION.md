# Integration with Existing Agents

This Polymarket Arbitrage Agent is designed to work alongside the existing Python agents in `/Users/8bit/Downloads/agents/agents/`.

## Shared Resources

### 1. Environment Variables

Both systems can share the same `.env` file:

```bash
# Polymarket (used by both)
POLYGON_WALLET_PRIVATE_KEY=...
POLYMARKET_API_KEY=...
POLYMARKET_API_SECRET=...
POLYMARKET_API_PASSPHRASE=...

# New agent specific
POLYMARKET_TOKEN_UP_ID=...
POLYMARKET_TOKEN_DOWN_ID=...
```

### 2. Getting Token IDs from Python Agent

Use the existing Python agent to discover markets and token IDs:

```bash
cd /Users/8bit/Downloads/agents
source .venv/bin/activate
export PYTHONPATH="."

# Get markets
python scripts/python/cli.py get-all-markets --limit 10

# Or use the helper script
cd polymarket-arbitrage-agent
python get_token_ids.py
```

### 3. Running Both Systems

**Terminal 1: Python Agent (CLI)**
```bash
cd /Users/8bit/Downloads/agents
source .venv/bin/activate
export PYTHONPATH="."
python scripts/python/cli.py run-autonomous-trader
```

**Terminal 2: New TypeScript Agent (Backend)**
```bash
cd /Users/8bit/Downloads/agents/polymarket-arbitrage-agent
cd apps/backend
pnpm dev
```

They can run simultaneously - they use different ports and don't conflict.

## Differences

| Feature | Python Agent | TypeScript Agent |
|---------|-------------|------------------|
| **Language** | Python 3.9+ | Node.js 20+ / TypeScript |
| **Strategy** | LLM-based (Grok) | Rule-based (AutoCycle, Dislocation) |
| **Execution** | Live trading (with API keys) | Paper trading (default) |
| **UI** | CLI commands | WebSocket + HTTP API |
| **Focus** | General market analysis | BTC 15m Up/Down arbitrage |

## When to Use Which

**Use Python Agent when:**
- You want LLM-powered market analysis
- You need general Polymarket market data
- You want to trade on any market (not just BTC 15m)
- You prefer Python ecosystem

**Use TypeScript Agent when:**
- You want high-frequency arbitrage (4Hz+)
- You need deterministic, rule-based strategies
- You want paper trading with replay capability
- You need WebSocket-based real-time dashboard
- You're building a web frontend

## Future Integration

Potential integration points:
1. **Shared Market Discovery**: Python agent finds markets, TypeScript agent trades them
2. **Shared Wallet**: Both use same Polygon wallet (with proper coordination)
3. **Shared Data**: Python agent's RAG database could inform TypeScript strategies
4. **Unified Dashboard**: Frontend that shows both agents' activity

## File Structure

```
/Users/8bit/Downloads/agents/
├── agents/              # Python agents (existing)
│   ├── polymarket/
│   ├── application/
│   └── connectors/
├── polymarket-arbitrage-agent/  # New TypeScript agent
│   ├── apps/
│   │   ├── backend/    # Node.js backend
│   │   └── frontend/   # Next.js frontend (coming)
│   └── packages/
└── .env                 # Shared environment variables
```

Both can coexist peacefully! 🚀

