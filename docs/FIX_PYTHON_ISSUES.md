# Fix: Python 3.9 Issues

## ❌ Issues

1. **xai-sdk Installation Error:**
   ```
   ERROR: Could not find a version that satisfies the requirement xai-sdk>=1.4.0
   ERROR: No matching distribution found for xai-sdk>=1.4.0
   ```
   - `xai-sdk>=1.4.0` requires Python 3.10+, but you're using Python 3.9.6

2. **ModuleNotFoundError:**
   ```
   ModuleNotFoundError: No module named 'agents'
   ```
   - Python can't find the `agents` module because `PYTHONPATH` isn't set

## ✅ Solutions

### Solution 1: Install Dependencies Without xai-sdk (Python 3.9)

Use the Python 3.9-compatible requirements file:

```bash
cd /Users/8bit/Downloads/agents
source .venv/bin/activate
pip install -r requirements-py39.txt
```

This will install all dependencies except `xai-sdk`. **Note:** Grok features will not work without `xai-sdk`.

### Solution 2: Fix Module Import Error

The `agents` module can't be found because `PYTHONPATH` isn't set. Use one of these methods:

#### Option A: Use the Start Script (Recommended)

```bash
cd /Users/8bit/Downloads/agents
bash start_agent.sh
```

This script automatically sets `PYTHONPATH` and handles everything.

#### Option B: Set PYTHONPATH Manually

```bash
cd /Users/8bit/Downloads/agents
source .venv/bin/activate
export PYTHONPATH="${PYTHONPATH}:$(pwd)"
export PYTHONPATH=".:${PYTHONPATH}"
python agents/application/trade.py
```

#### Option C: Run as Module

```bash
cd /Users/8bit/Downloads/agents
source .venv/bin/activate
export PYTHONPATH="${PYTHONPATH}:$(pwd)"
python -m agents.application.trade
```

#### Option D: Use run_cli.sh Helper

```bash
cd /Users/8bit/Downloads/agents
bash run_cli.sh
```

## 🔧 Quick Fix Commands

### Install Dependencies (Python 3.9)

```bash
cd /Users/8bit/Downloads/agents
source .venv/bin/activate
pip install -r requirements-py39.txt
```

### Run Trade Script

```bash
cd /Users/8bit/Downloads/agents
source .venv/bin/activate
export PYTHONPATH="${PYTHONPATH}:$(pwd)"
python agents/application/trade.py
```

### Or Use the Helper Script

```bash
cd /Users/8bit/Downloads/agents
bash start_agent.sh
```

## 📋 What's Different in requirements-py39.txt

The `requirements-py39.txt` file is identical to `requirements.txt` except:
- `xai-sdk>=1.4.0` is commented out (requires Python 3.10+)

## ⚠️ Important Notes

1. **xai-sdk Features Won't Work:** Without `xai-sdk`, these features will fail:
   - `agents/polymarket/grok_tools.py` - Grok integration
   - Any code that imports `xai_sdk`

2. **To Use xai-sdk:** Upgrade to Python 3.10+:
   ```bash
   # Create new venv with Python 3.10+
   virtualenv --python=python3.10 .venv310
   source .venv310/bin/activate
   pip install -r requirements.txt  # This will include xai-sdk
   ```

3. **PYTHONPATH Must Be Set:** Always set `PYTHONPATH` when running Python scripts directly, or use the helper scripts that set it automatically.

## ✅ Verification

After fixing, verify:

```bash
# Check Python version
python --version  # Should show Python 3.9.6

# Check if agents module can be imported
python -c "import agents; print('✅ agents module found')"

# Check if xai-sdk is available (will fail on Python 3.9, that's OK)
python -c "import xai_sdk; print('✅ xai-sdk available')" || echo "⚠️  xai-sdk not available (requires Python 3.10+)"
```

