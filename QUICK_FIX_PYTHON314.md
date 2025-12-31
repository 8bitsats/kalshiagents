# Quick Fix for Python 3.14 Compatibility Issues

## The Problem

You're using **Python 3.14**, but `requirements.txt` was created for **Python 3.9**. Some packages like `onnxruntime==1.18.1` don't support Python 3.14, causing installation to fail.

## Solution 1: Install Essential Packages Only (Quick Fix)

Run this to install just what you need to run the application:

```bash
cd /Users/8bit/Downloads/agents
source .venv/bin/activate
pip install "xai-sdk>=1.4.0" python-dotenv httpx
export PYTHONPATH="."
python agents/application/trade.py
```

## Solution 2: Use the Install Script

I've created `install_deps.sh` that skips problematic packages:

```bash
cd /Users/8bit/Downloads/agents
./install_deps.sh
export PYTHONPATH="."
python agents/application/trade.py
```

## Solution 3: Use Python 3.9 (Recommended)

The project is designed for Python 3.9. Create a new virtual environment with Python 3.9:

```bash
cd /Users/8bit/Downloads/agents

# Remove old venv
rm -rf .venv

# Create new venv with Python 3.9
python3.9 -m venv .venv

# Activate and install
source .venv/bin/activate
pip install -r requirements.txt
export PYTHONPATH="."
python agents/application/trade.py
```

## Solution 4: Install Dependencies Selectively

If you want to install most packages but skip problematic ones:

```bash
cd /Users/8bit/Downloads/agents
source .venv/bin/activate

# Install from requirements.txt but skip onnxruntime
pip install -r <(grep -v "^onnxruntime" requirements.txt)

# Install essential packages that might be missing
pip install "xai-sdk>=1.4.0" python-dotenv httpx

export PYTHONPATH="."
python agents/application/trade.py
```

## What's Happening

- **onnxruntime==1.18.1** doesn't support Python 3.14
- When pip hits this error, it stops installing, so `httpx` and other packages never get installed
- The project README specifies Python 3.9, which is why some packages have version constraints

## Recommended Approach

**Use Python 3.9** as specified in the README. This ensures all dependencies install correctly.

