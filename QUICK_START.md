# Quick Start Guide - Start CLI and Agent

## Step 1: Install Dependencies

Since you're using Python 3.9, install dependencies without xai-sdk first:

```bash
# Activate virtual environment
source .venv/bin/activate

# Install dependencies (without xai-sdk which requires Python 3.10+)
pip install -r requirements-py39.txt

# Install essential packages for CLI
pip install typer devtools python-dotenv httpx web3 py_clob_client py_order_utils requests pydantic
```

**OR** if you want full functionality with xai-sdk:

```bash
# Upgrade to Python 3.10+
python3.10 -m venv .venv310
source .venv310/bin/activate
pip install -r requirements.txt
```

## Step 2: Check Wallet Balance

```bash
# Make sure PYTHONPATH is set
export PYTHONPATH="."

# Check wallet balance
python check_wallet.py
```

This will show:
- Your wallet address
- USDC balance
- MATIC balance (for gas)

## Step 3: Fund Your Wallet

If your wallet needs funding:

1. **Get your wallet address** from the balance check
2. **Send USDC to your wallet** on Polygon network:
   - Minimum: $10-20 USDC recommended
   - USDC Contract: `0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174`
   - Network: Polygon (not Ethereum mainnet)
3. **Send MATIC for gas fees**:
   - Minimum: 0.1 MATIC recommended
   - Used for transaction fees

**Where to get USDC:**
- Coinbase (withdraw to Polygon)
- Uniswap (bridge to Polygon)
- Any DEX on Polygon
- Centralized exchanges that support Polygon withdrawals

## Step 4: Start the CLI

```bash
# Make sure virtual environment is activated
source .venv/bin/activate  # or source .venv310/bin/activate

# Set PYTHONPATH
export PYTHONPATH="."

# Start CLI
python scripts/python/cli.py --help
```

**Available CLI Commands:**

```bash
# Get markets
python scripts/python/cli.py get-all-markets --limit 10

# Get events
python scripts/python/cli.py get-all-events --limit 5

# Ask LLM a question
python scripts/python/cli.py ask-llm "What are the best markets to trade right now?"

# Ask Polymarket-specific question
python scripts/python/cli.py ask-polymarket-llm "What markets have the best spreads?"

# Run autonomous trader
python scripts/python/cli.py run-autonomous-trader
```

## Step 5: Start the Autonomous Agent

```bash
# Option 1: Via CLI
python scripts/python/cli.py run-autonomous-trader

# Option 2: Direct Python
python -c "from agents.application.trade import Trader; t = Trader(); t.one_best_trade()"

# Option 3: Using the start script
./start_agent.sh
```

## Troubleshooting

### Missing Dependencies
```bash
pip install typer devtools python-dotenv httpx web3 py_clob_client py_order_utils
```

### Missing XAI_API_KEY
If you see errors about XAI_API_KEY:
- Get your API key from https://console.x.ai
- Add to `.env`: `XAI_API_KEY=your_key_here`
- Note: Requires Python 3.10+ for xai-sdk package

### Low Balance
- Minimum $10-20 USDC recommended
- Need MATIC for gas fees (0.1+ MATIC)

### Connection Issues
- Check your internet connection
- Verify Polygon RPC is accessible
- Check if Polymarket API is up

## Environment Variables Required

Make sure your `.env` file has:

```bash
POLYGON_WALLET_PRIVATE_KEY=your_private_key_here
XAI_API_KEY=your_xai_api_key_here  # Optional if not using Grok
GROK_MODEL=grok-4-1-fast  # Optional, defaults to this
```

## Next Steps

1. ✅ Install dependencies
2. ✅ Check wallet balance
3. ✅ Fund wallet if needed
4. ✅ Start CLI or agent
5. 🚀 Start trading!

