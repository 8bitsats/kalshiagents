#!/bin/bash

# Navigate to project root
cd "$(dirname "$0")"

# Activate virtual environment
if [ -d ".venv" ]; then
    source .venv/bin/activate
    echo "✓ Virtual environment activated"
else
    echo "✗ Virtual environment not found. Please create it first:"
    echo "  virtualenv --python=python3.9 .venv"
    exit 1
fi

# Set PYTHONPATH
export PYTHONPATH="."
echo "✓ PYTHONPATH set to current directory"

# Install/update required packages
echo "Installing/updating dependencies from requirements.txt..."
if pip install -q -r requirements.txt 2>/dev/null; then
    echo "✓ Dependencies installed"
else
    echo "⚠ Warning: Some packages may have failed. Trying to install key packages..."
    pip install -q "xai-sdk>=1.4.0" python-dotenv httpx 2>/dev/null || {
        echo "⚠ Error: Could not install packages. Please run manually:"
        echo "  pip install -r requirements.txt"
    }
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠ Warning: .env file not found. Make sure to create it with:"
    echo "  XAI_API_KEY=\"your_key\""
    echo "  GROK_MODEL=\"grok-4-1-fast\""
    echo "  POLYGON_WALLET_PRIVATE_KEY=\"your_key\""
fi

# Run the application
echo ""
echo "Starting Polymarket trading agent..."
echo ""
python agents/application/trade.py

