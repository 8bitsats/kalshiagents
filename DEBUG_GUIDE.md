# Debug Guide for Running Polymarket Agents

## Issues and Solutions

### 1. Installing xai-sdk Package

**Problem**: `zsh: 1.4.0 not found` when running `pip install xai-sdk>=1.4.0`

**Solution**: Quote the package name to prevent shell interpretation:
```bash
pip install "xai-sdk>=1.4.0"
```

Or use the virtual environment Python directly:
```bash
/Users/8bit/Downloads/agents/.venv/bin/python -m pip install "xai-sdk>=1.4.0"
```

### 2. ModuleNotFoundError: No module named 'agents'

**Problem**: Python can't find the `agents` module because PYTHONPATH is not set.

**Solution**: Set PYTHONPATH before running:
```bash
export PYTHONPATH="/Users/8bit/Downloads/agents:$PYTHONPATH"
python agents/application/trade.py
```

Or run from the project root with:
```bash
cd /Users/8bit/Downloads/agents
export PYTHONPATH="."
python agents/application/trade.py
```

### 3. Missing Dependencies

**Problem**: `ModuleNotFoundError: No module named 'typer'` or other missing packages.

**Solution**: Install all dependencies from requirements.txt:
```bash
# Activate virtual environment first
source /Users/8bit/Downloads/agents/.venv/bin/activate

# Install all dependencies
pip install -r requirements.txt

# Or install xai-sdk specifically
pip install "xai-sdk>=1.4.0"
```

## Complete Setup Steps

1. **Activate virtual environment**:
   ```bash
   cd /Users/8bit/Downloads/agents
   source .venv/bin/activate
   ```

2. **Install/update dependencies**:
   ```bash
   pip install -r requirements.txt
   pip install "xai-sdk>=1.4.0"  # Ensure latest version
   ```

3. **Set PYTHONPATH**:
   ```bash
   export PYTHONPATH="."
   ```

4. **Run the application**:
   ```bash
   python agents/application/trade.py
   ```

   Or use the CLI:
   ```bash
   python scripts/python/cli.py
   ```

## Quick Fix Script

Create a script `run.sh` in the project root:

```bash
#!/bin/bash
cd /Users/8bit/Downloads/agents
source .venv/bin/activate
export PYTHONPATH="."
python agents/application/trade.py
```

Make it executable:
```bash
chmod +x run.sh
./run.sh
```

## Environment Variables

Make sure your `.env` file contains:
```bash
POLYGON_WALLET_PRIVATE_KEY="your_key_here"
XAI_API_KEY="your_xai_api_key"
GROK_MODEL="grok-4-1-fast"
```

## Troubleshooting

- **Permission errors**: If you see permission errors, try:
  ```bash
  pip install --user "xai-sdk>=1.4.0"
  ```

- **Virtual environment not activated**: Make sure you see `(.venv)` in your terminal prompt

- **Python version**: This project requires Python 3.9. Check with:
  ```bash
  python --version
  ```

