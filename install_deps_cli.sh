#!/bin/bash
# Install dependencies for CLI and Agent

set -e

echo "🔧 Installing dependencies for Polymarket Agents CLI..."
echo ""

# Activate virtual environment
if [ -d ".venv" ]; then
    source .venv/bin/activate
    echo "✅ Activated .venv"
elif [ -d ".venv310" ]; then
    source .venv310/bin/activate
    echo "✅ Activated .venv310"
else
    echo "❌ Virtual environment not found!"
    echo "   Create one with: virtualenv --python=python3.9 .venv"
    exit 1
fi

# Check Python version
PYTHON_VERSION=$(python --version 2>&1 | awk '{print $2}')
echo "📌 Python version: $PYTHON_VERSION"
echo ""

# Install essential packages for CLI
echo "📦 Installing essential packages..."
pip install --upgrade pip

# Core CLI dependencies
pip install typer==0.12.3
pip install devtools==0.12.2
pip install python-dotenv==1.0.1
pip install httpx==0.27.0
pip install requests==2.32.3
pip install pydantic==2.8.2

# Web3 and blockchain
pip install web3==6.11.0

# Polymarket specific
# py_clob_client requires Python >=3.9.10, but we have 3.9.6
# Try to install without version constraint or use compatible version
PYTHON_MINOR=$(python -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}')")
PYTHON_VERSION_CHECK=$(python -c "import sys; exit(0 if sys.version_info >= (3, 9, 10) else 1)" 2>/dev/null && echo "ok" || echo "old")

if [ "$PYTHON_VERSION_CHECK" = "ok" ]; then
    echo "✅ Python version compatible, installing py_clob_client==0.17.5"
    pip install py-clob-client==0.17.5 || pip install py-clob-client
    pip install py-order-utils==0.3.2 || pip install py-order-utils
else
    echo "⚠️  Python 3.9.6 detected. py_clob_client requires >=3.9.10"
    echo "   Attempting to install latest compatible version..."
    pip install py-clob-client || echo "❌ Could not install py-clob-client (requires Python >=3.9.10)"
    pip install py-order-utils || echo "❌ Could not install py-order-utils"
    echo ""
    echo "💡 Recommendation: Upgrade to Python 3.9.10+ or 3.10+"
    echo "   python3.10 -m venv .venv310"
    echo "   source .venv310/bin/activate"
    echo "   pip install -r requirements.txt"
fi

# Additional utilities
pip install coloredlogs==15.0.1

echo ""
echo "✅ Essential packages installed!"
echo ""

# Check if xai-sdk is needed (requires Python 3.10+)
if python -c "import sys; exit(0 if sys.version_info >= (3, 10) else 1)" 2>/dev/null; then
    echo "📦 Python 3.10+ detected. Installing xai-sdk for Grok integration..."
    pip install "xai-sdk>=1.4.0" || echo "⚠️  Could not install xai-sdk (optional)"
else
    echo "⚠️  Python 3.9 detected. Skipping xai-sdk (requires Python 3.10+)"
    echo "   Grok features will not work without xai-sdk"
fi

echo ""
echo "🎉 Installation complete!"
echo ""
echo "Next steps:"
echo "  1. Check wallet: python check_wallet.py"
echo "  2. Start CLI: python scripts/python/cli.py --help"
echo "  3. Run agent: python scripts/python/cli.py run-autonomous-trader"

