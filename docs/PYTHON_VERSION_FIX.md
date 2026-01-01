# Python Version Compatibility Fix

## Problem

The `requirements.txt` includes `xai-sdk>=1.4.0` which requires **Python 3.10+**, but you're using **Python 3.9.6**.

## Error Message

```
ERROR: Could not find a version that satisfies the requirement xai-sdk>=1.4.0 (from versions: none)
```

## Solutions

### Option 1: Install Dependencies Without xai-sdk (Python 3.9)

Use the Python 3.9 compatible requirements file:

```bash
# Activate your virtual environment
source .venv/bin/activate

# Install dependencies without xai-sdk
pip install -r requirements-py39.txt

# Or use the install script
./install_py39.sh
```

**Note**: This will install all dependencies except `xai-sdk`. Features that use `xai-sdk` (like Grok integration in `executor.py` and `grok_tools.py`) will not work.

### Option 2: Upgrade to Python 3.10+ (Recommended)

If you need `xai-sdk` functionality, upgrade to Python 3.10 or higher:

```bash
# Check available Python versions
python3 --version
python3.10 --version  # or python3.11, python3.12, etc.

# Create new virtual environment with Python 3.10+
python3.10 -m venv .venv310
source .venv310/bin/activate

# Install all dependencies including xai-sdk
pip install -r requirements.txt
```

### Option 3: Use pyenv to Manage Python Versions

```bash
# Install pyenv (if not already installed)
brew install pyenv  # macOS
# or: curl https://pyenv.run | bash

# Install Python 3.10
pyenv install 3.10.12

# Set local Python version
pyenv local 3.10.12

# Create virtual environment
python -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

## Files Affected by xai-sdk

The following files require `xai-sdk`:
- `agents/application/executor.py` - Uses `xai_sdk.Client` for Grok integration
- `agents/polymarket/grok_tools.py` - Uses `xai_sdk.chat.tool` decorator

If you continue with Python 3.9, these features will fail when imported.

## Quick Fix for CLI

To run the CLI without xai-sdk dependencies:

```bash
# Install essential packages only
pip install typer devtools python-dotenv httpx requests

# Run CLI (some commands may fail if they use xai-sdk)
python scripts/python/cli.py --help
```

## Verification

After installation, verify:

```bash
# Check Python version
python --version

# Check if xai-sdk is installed (should fail on Python 3.9)
python -c "import xai_sdk; print('xai-sdk installed')" || echo "xai-sdk not available (requires Python 3.10+)"

# Check other essential packages
python -c "import typer; print('typer installed')"
python -c "import httpx; print('httpx installed')"
```

