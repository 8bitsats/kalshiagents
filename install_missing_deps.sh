#!/bin/bash
# Install missing dependencies for the trading agent

source .venv/bin/activate

echo "Installing web3 and blockchain dependencies..."
pip install web3==6.11.0

echo "Installing Polymarket client libraries..."
pip install py-clob-client==0.17.5 py-order-utils==0.3.2

echo "Installing other critical dependencies..."
pip install eth-account eth-utils eth-abi hexbytes

echo "✅ Done! Try running the script again:"
echo "   python agents/application/trade.py"

