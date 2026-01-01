# Quick Fix for Missing Dependencies

## The Problem
You're encountering missing modules one by one (`dotenv`, `httpx`, etc.). Instead of installing them individually, install all dependencies at once.

## Solution

Run this single command to install all dependencies:

```bash
cd /Users/8bit/Downloads/agents
source .venv/bin/activate
pip install -r requirements.txt
export PYTHONPATH="."
python agents/application/trade.py
```

## Or Use the Updated Script

The `run.sh` script has been updated to install all dependencies automatically:

```bash
cd /Users/8bit/Downloads/agents
./run.sh
```

## What Changed

The `run.sh` script now:
1. Installs all packages from `requirements.txt` (which includes `httpx`, `python-dotenv`, and all other dependencies)
2. Falls back to installing key packages if the full install fails
3. Sets PYTHONPATH automatically
4. Runs the application

## If You Still Get Errors

If you continue to get missing module errors after installing from `requirements.txt`, try:

```bash
# Make sure you're in the virtual environment
source .venv/bin/activate

# Upgrade pip first
pip install --upgrade pip

# Install all dependencies
pip install -r requirements.txt

# Verify key packages are installed
pip list | grep -E "(httpx|python-dotenv|xai-sdk)"

# Run the app
export PYTHONPATH="."
python agents/application/trade.py
```

