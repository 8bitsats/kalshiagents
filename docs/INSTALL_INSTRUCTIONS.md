# Installation Instructions

## Quick Fix for "ModuleNotFoundError: No module named 'typer'"

The error occurs because dependencies aren't installed. Run this in your terminal:

### Option 1: Use the install script (Recommended)

```bash
cd /Users/8bit/Downloads/agents
source .venv/bin/activate
./install_deps_cli.sh
```

### Option 2: Manual installation

```bash
cd /Users/8bit/Downloads/agents
source .venv/bin/activate

# Install essential packages
pip install typer devtools python-dotenv httpx web3 py_clob_client py_order_utils requests pydantic

# If using Python 3.10+ (for Grok/xAI features)
pip install "xai-sdk>=1.4.0"
```

### Option 3: Install from requirements file

```bash
cd /Users/8bit/Downloads/agents
source .venv/bin/activate

# For Python 3.9 (without xai-sdk)
pip install -r requirements-py39.txt

# OR for Python 3.10+ (with xai-sdk)
pip install -r requirements.txt
```

## Verify Installation

After installing, verify packages are installed:

```bash
python -c "import typer; print('✅ typer installed')"
python -c "import devtools; print('✅ devtools installed')"
python -c "import dotenv; print('✅ python-dotenv installed')"
```

## Then Start the CLI

```bash
# Set PYTHONPATH
export PYTHONPATH="."

# Check wallet balance
python check_wallet.py

# Start CLI
python scripts/python/cli.py --help

# Get markets
python scripts/python/cli.py get-all-markets --limit 10

# Run autonomous trader
python scripts/python/cli.py run-autonomous-trader
```

## Troubleshooting

### If pip install fails with SSL errors:
```bash
pip install --trusted-host pypi.org --trusted-host files.pythonhosted.org typer devtools python-dotenv httpx web3 py_clob_client py_order_utils requests pydantic
```

### If you get permission errors:
```bash
# Don't use sudo with virtual environments!
# Make sure you're in the virtual environment:
source .venv/bin/activate
which python  # Should show .venv/bin/python
```

### If packages still don't install:
```bash
# Upgrade pip first
pip install --upgrade pip

# Then try installing again
pip install typer devtools python-dotenv httpx web3 py_clob_client py_order_utils requests pydantic
```

