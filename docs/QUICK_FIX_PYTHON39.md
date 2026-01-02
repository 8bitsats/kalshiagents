# Quick Fix: Python 3.9 Issues

## ❌ Two Issues Found

1. **xai-sdk Installation Error:**
   ```
   ERROR: Could not find a version that satisfies the requirement xai-sdk>=1.4.0
   ```
   - `xai-sdk>=1.4.0` requires Python 3.10+, but you're using Python 3.9.6

2. **ModuleNotFoundError:**
   ```
   ModuleNotFoundError: No module named 'agents'
   ```
   - Python can't find the `agents` module because `PYTHONPATH` isn't set

## ✅ Quick Fix

### Step 1: Install Dependencies Without xai-sdk

```bash
cd /Users/8bit/Downloads/agents
source .venv/bin/activate
pip install -r requirements-py39.txt
```

This installs all dependencies except `xai-sdk` (which requires Python 3.10+).

### Step 2: Run Trade Script with PYTHONPATH

**Option A: Use the Helper Script (Easiest)**

```bash
cd /Users/8bit/Downloads/agents
bash run_trade.sh
```

**Option B: Set PYTHONPATH Manually**

```bash
cd /Users/8bit/Downloads/agents
source .venv/bin/activate
export PYTHONPATH=".:${PYTHONPATH}"
python agents/application/trade.py
```

**Option C: Use start_agent.sh**

```bash
cd /Users/8bit/Downloads/agents
bash start_agent.sh
# Then choose option 2 (autonomous trader)
```

## 📋 All-in-One Command

```bash
cd /Users/8bit/Downloads/agents && \
source .venv/bin/activate && \
pip install -r requirements-py39.txt && \
export PYTHONPATH=".:${PYTHONPATH}" && \
python agents/application/trade.py
```

## ⚠️ Important Notes

1. **xai-sdk Won't Work:** Without `xai-sdk`, Grok features will not work. This is expected with Python 3.9.

2. **PYTHONPATH Must Be Set:** Always set `PYTHONPATH` when running Python scripts directly, or use the helper scripts.

3. **To Use xai-sdk:** Upgrade to Python 3.10+:
   ```bash
   virtualenv --python=python3.10 .venv310
   source .venv310/bin/activate
   pip install -r requirements.txt  # Includes xai-sdk
   ```

## ✅ Verification

After fixing, test:

```bash
# Check if agents module can be imported
python -c "import agents; print('✅ agents module found')"

# Try running trade script
bash run_trade.sh
```

