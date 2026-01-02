#!/bin/bash
# Run trade.py with proper PYTHONPATH setup

set -e

# Activate virtual environment
if [ -d ".venv" ]; then
    source .venv/bin/activate
elif [ -d ".venv310" ]; then
    source .venv310/bin/activate
else
    echo "❌ Virtual environment not found!"
    exit 1
fi

# Set PYTHONPATH (CRITICAL - must be set for imports to work)
export PYTHONPATH=".:${PYTHONPATH}"

# Run trade script
python agents/application/trade.py "$@"

