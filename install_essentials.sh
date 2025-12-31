#!/bin/bash

# Navigate to project root
cd "$(dirname "$0")"

# Activate virtual environment
if [ -d ".venv" ]; then
    source .venv/bin/activate
    echo "✓ Virtual environment activated"
else
    echo "✗ Virtual environment not found. Creating one..."
    python3 -m venv .venv
    source .venv/bin/activate
    echo "✓ Virtual environment created and activated"
fi

# Set PYTHONPATH
export PYTHONPATH="."

echo ""
echo "Installing essential packages for Polymarket trading agent..."
echo ""

# Install essential packages one by one to avoid dependency conflicts
ESSENTIAL_PACKAGES=(
    "xai-sdk>=1.4.0"
    "python-dotenv"
    "httpx"
    "web3"
    "py_clob_client"
    "py_order_utils"
    "requests"
    "pydantic"
)

for package in "${ESSENTIAL_PACKAGES[@]}"; do
    echo "Installing $package..."
    pip install -q "$package" 2>&1 | grep -v "WARNING:" || {
        echo "⚠ Warning: $package installation had issues, but continuing..."
    }
done

echo ""
echo "✓ Essential packages installed!"
echo ""
echo "Note: Some packages from requirements.txt may be missing (like onnxruntime, pyunormalize)."
echo "These are not critical for running the trading agent."
echo ""
echo "You can now run:"
echo "  export PYTHONPATH=\".\""
echo "  python agents/application/trade.py"

