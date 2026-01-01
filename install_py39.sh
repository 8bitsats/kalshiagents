#!/bin/bash
# Install dependencies for Python 3.9 (without xai-sdk which requires Python 3.10+)

set -e

echo "Installing dependencies for Python 3.9..."
echo "Note: xai-sdk>=1.4.0 requires Python 3.10+, so it will be skipped"

# Check Python version
PYTHON_VERSION=$(python --version 2>&1 | awk '{print $2}' | cut -d. -f1,2)
echo "Current Python version: $PYTHON_VERSION"

if [ "$PYTHON_VERSION" != "3.9" ]; then
    echo "Warning: This script is designed for Python 3.9"
    echo "If you have Python 3.10+, use: pip install -r requirements.txt"
fi

# Install all dependencies except xai-sdk
echo "Installing dependencies from requirements-py39.txt..."
pip install -r requirements-py39.txt

echo ""
echo "✅ Dependencies installed successfully!"
echo ""
echo "⚠️  IMPORTANT: xai-sdk>=1.4.0 requires Python 3.10+"
echo ""
echo "To use xai-sdk features, you have two options:"
echo "1. Upgrade to Python 3.10+:"
echo "   python3.10 -m venv .venv310"
echo "   source .venv310/bin/activate"
echo "   pip install -r requirements.txt"
echo ""
echo "2. Continue with Python 3.9 (xai-sdk features will not work)"
echo "   Some features in agents/application/executor.py and"
echo "   agents/polymarket/grok_tools.py will fail without xai-sdk"

