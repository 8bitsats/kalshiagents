# Final Fix - Install Essential Packages Only

## The Problem

You're using **Python 3.14**, but several packages in `requirements.txt` don't support it:
- `onnxruntime==1.18.1` - doesn't support Python 3.14
- `pyunormalize==15.1.0` - build error with Python 3.14

When pip hits these errors, it stops installing, leaving you with missing modules like `web3`, `httpx`, etc.

## Solution: Install Essential Packages Only

I've created `install_essentials.sh` that installs only the packages needed to run the trading agent:

```bash
cd /Users/8bit/Downloads/agents
./install_essentials.sh
export PYTHONPATH="."
python agents/application/trade.py
```

## Or Install Manually

If the script doesn't work, install these essential packages manually:

```bash
cd /Users/8bit/Downloads/agents
source .venv/bin/activate  # or create venv if needed

# Install essential packages
pip install "xai-sdk>=1.4.0" python-dotenv httpx web3 py_clob_client py_order_utils requests pydantic

# Set PYTHONPATH and run
export PYTHONPATH="."
python agents/application/trade.py
```

## What Gets Installed

The essential packages script installs:
- `xai-sdk>=1.4.0` - Grok integration
- `python-dotenv` - Environment variables
- `httpx` - HTTP client for API calls
- `web3` - Ethereum/blockchain interactions
- `py_clob_client` - Polymarket trading client
- `py_order_utils` - Order building utilities
- `requests` - HTTP requests
- `pydantic` - Data validation

## What Gets Skipped

These packages are NOT critical for running the trading agent:
- `onnxruntime` - Only needed for ML model inference (not used in trading)
- `pyunormalize` - Text normalization (not critical)
- Various other packages that may have compatibility issues

## If You Still Get Missing Module Errors

If you encounter more missing modules, install them individually:

```bash
pip install <package-name>
```

Common ones you might need:
- `langchain-openai` (for Chroma RAG)
- `chromadb` (for vector database)
- Other packages as errors appear

## Recommended: Use Python 3.9

For the best compatibility, use Python 3.9 as specified in the README:

```bash
# Check if python3.9 is available
which python3.9

# If available, recreate venv:
rm -rf .venv
python3.9 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

If `python3.9` is not available, install it via Homebrew:
```bash
brew install python@3.9
```

