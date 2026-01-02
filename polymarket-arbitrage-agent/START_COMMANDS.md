# Start Commands - Fixed

## ✅ Correct Commands

The backend is located at:
```
/Users/8bit/Downloads/agents/polymarket-arbitrage-agent/apps/backend
```

### Quick Start

```bash
# Navigate to the correct directory
cd /Users/8bit/Downloads/agents/polymarket-arbitrage-agent/apps/backend

# Set environment variables (one line, no comments)
export STRATEGY=pair_arbitrage PAIR_ARB_MAX_COST=0.99 PAIR_ARB_SHARES=250 ENABLE_TERMINAL_UI=true

# Start the backend
pnpm dev
```

### Or use the helper script:

```bash
cd /Users/8bit/Downloads/agents/polymarket-arbitrage-agent
bash start_backend.sh
```

## 🔧 What Was Wrong

1. **Wrong directory**: You were in `/Users/8bit/Downloads/agents` but need to be in `polymarket-arbitrage-agent/apps/backend`
2. **Comments in shell**: Shell doesn't understand `# comments` as commands - they need to be on separate lines or omitted
3. **Path issue**: `apps/backend` doesn't exist from the root - it's `polymarket-arbitrage-agent/apps/backend`

## 📝 Correct Path Structure

```
/Users/8bit/Downloads/agents/
  └── polymarket-arbitrage-agent/
      └── apps/
          └── backend/          ← You need to be HERE
              ├── package.json
              ├── tsconfig.json
              └── src/
```

## 🚀 All-in-One Command

```bash
cd /Users/8bit/Downloads/agents/polymarket-arbitrage-agent/apps/backend && export STRATEGY=pair_arbitrage && export PAIR_ARB_MAX_COST=0.99 && export PAIR_ARB_SHARES=250 && export ENABLE_TERMINAL_UI=true && pnpm dev
```

## 📋 Environment Variables in .env

Alternatively, create/edit `.env` in `polymarket-arbitrage-agent/`:

```bash
STRATEGY=pair_arbitrage
PAIR_ARB_MAX_COST=0.99
PAIR_ARB_SHARES=250
ENABLE_TERMINAL_UI=true
```

Then just run:
```bash
cd /Users/8bit/Downloads/agents/polymarket-arbitrage-agent/apps/backend
pnpm dev
```

The `.env` file will be automatically loaded by `dotenv/config`.

