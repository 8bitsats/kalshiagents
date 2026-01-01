#!/bin/bash
# Start the Polymarket Agent CLI and Autonomous Trader

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting Polymarket Agents...${NC}"
echo ""

# Activate virtual environment
if [ -d ".venv" ]; then
    source .venv/bin/activate
elif [ -d ".venv310" ]; then
    source .venv310/bin/activate
else
    echo "❌ Virtual environment not found. Please create one first:"
    echo "   virtualenv --python=python3.9 .venv"
    exit 1
fi

# Set PYTHONPATH (critical for imports)
export PYTHONPATH="${PYTHONPATH}:$(pwd)"
export PYTHONPATH=".:${PYTHONPATH}"

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found!"
    echo "   Please create .env file with required variables:"
    echo "   - POLYGON_WALLET_PRIVATE_KEY"
    echo "   - XAI_API_KEY"
    echo "   - GROK_MODEL (optional, defaults to grok-4-1-fast)"
    exit 1
fi

# Check wallet balance first
echo -e "${YELLOW}📊 Checking wallet balance...${NC}"
python check_wallet.py
echo ""

# Ask user what they want to do
echo -e "${GREEN}What would you like to do?${NC}"
echo "1. Start CLI (interactive commands)"
echo "2. Run autonomous trader (one_best_trade)"
echo "3. Check wallet balance only"
echo ""
read -p "Enter choice (1-3): " choice

case $choice in
    1)
        echo -e "${BLUE}Starting CLI...${NC}"
        echo "Available commands:"
        echo "  - get-all-markets --limit 5"
        echo "  - get-all-events --limit 5"
        echo "  - ask-llm 'your question here'"
        echo "  - ask-polymarket-llm 'your question here'"
        echo "  - run-autonomous-trader"
        echo ""
        python scripts/python/cli.py
        ;;
    2)
        echo -e "${BLUE}Starting autonomous trader...${NC}"
        echo "This will analyze markets and execute trades automatically."
        echo ""
        python -c "from agents.application.trade import Trader; t = Trader(); t.one_best_trade()"
        ;;
    3)
        echo "Wallet check complete."
        ;;
    *)
        echo "Invalid choice. Exiting."
        exit 1
        ;;
esac

