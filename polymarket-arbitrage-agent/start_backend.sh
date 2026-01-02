#!/bin/bash

# Navigate to backend directory
cd "$(dirname "$0")/apps/backend" || exit 1

# Set default strategy if not already set
export STRATEGY=${STRATEGY:-pair_arbitrage}
export PAIR_ARB_MAX_COST=${PAIR_ARB_MAX_COST:-0.99}
export PAIR_ARB_SHARES=${PAIR_ARB_SHARES:-250}
export ENABLE_TERMINAL_UI=${ENABLE_TERMINAL_UI:-true}

echo "🚀 Starting Polymarket Arbitrage Agent..."
echo "📊 Strategy: $STRATEGY"
echo "💰 Max Pair Cost: $PAIR_ARB_MAX_COST"
echo "📦 Shares: $PAIR_ARB_SHARES"
echo "🖥️  Terminal UI: $ENABLE_TERMINAL_UI"
echo ""

# Start the backend
pnpm dev

