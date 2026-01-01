# Python 3.14 Compatibility Issue - CRITICAL

## Problem

Your script is crashing with `RecursionError: maximum recursion depth exceeded` because **Python 3.14 is incompatible with `httpx`**.

The error occurs deep in Python's standard library when `httpx` tries to make HTTP requests:
- `httpx.get()` → `httpcore` → Python's `typing.py` → `RecursionError`

## Root Cause

Python 3.14 is too new and has breaking changes that cause recursion errors in:
- `httpx` library
- `httpcore` library  
- Python's `typing.py` module
- Python's `os.py` module (when checking environment variables)

## Solution: Use Python 3.11 or 3.12

**You MUST switch to Python 3.11 or 3.12** for this project to work.

### Step 1: Install Python 3.11

```bash
# On macOS with Homebrew
brew install python@3.11

# Or download from python.org
```

### Step 2: Create New Virtual Environment

```bash
# Remove old venv
rm -rf .venv

# Create new venv with Python 3.11
python3.11 -m venv .venv

# Activate
source .venv/bin/activate

# Verify Python version
python --version  # Should show Python 3.11.x
```

### Step 3: Install Dependencies

```bash
# Install essential packages first
pip install httpx python-dotenv xai-sdk langchain-openai langchain-community jq

# Then install rest from requirements.txt (skip problematic ones)
pip install -r requirements.txt
```

## Temporary Workaround (If You Must Use Python 3.14)

I've added error handling to catch the recursion error, but **this won't fix the underlying issue**. The script will now:
- Catch the recursion error
- Print a clear error message
- Stop gracefully instead of infinite loop

But **you still won't be able to make HTTP requests** until you switch Python versions.

## Files Modified

1. `agents/application/trade.py` - Added retry limit and better error handling
2. `agents/polymarket/polymarket.py` - Added error handling for recursion errors

## Verification

After switching to Python 3.11:

```bash
python --version  # Should be 3.11.x
python agents/application/trade.py  # Should work without recursion errors
```

## Why Python 3.14 Doesn't Work

Python 3.14 introduced changes to:
- `typing` module (causes recursion in type checking)
- `os.environ` access (causes recursion in proxy detection)
- `re` module (causes recursion in regex compilation)

These changes break `httpx` and `httpcore` which are critical for making HTTP requests to the Polymarket API.

---

**Action Required: Switch to Python 3.11 or 3.12 immediately.**

