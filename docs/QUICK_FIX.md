# Quick Fix: ModuleNotFoundError: No module named 'agents'

## The Problem

You're getting `ModuleNotFoundError: No module named 'agents'` because `PYTHONPATH` is not set.

## Quick Fix

**Always set PYTHONPATH before running the CLI:**

```bash
cd /Users/8bit/Downloads/agents
source .venv/bin/activate
export PYTHONPATH="."

# Now run CLI
python scripts/python/cli.py --help
```

## Or Use the Helper Script

I've created a helper script that sets everything up automatically:

```bash
# Make it executable (one time)
chmod +x run_cli.sh

# Use it to run any CLI command
./run_cli.sh --help
./run_cli.sh get-all-markets --limit 10
./run_cli.sh run-autonomous-trader
```

## Add to Your Shell Profile (Permanent Fix)

Add this to your `~/.zshrc` or `~/.bashrc`:

```bash
# Add to ~/.zshrc
echo 'export PYTHONPATH="."' >> ~/.zshrc
source ~/.zshrc
```

Or create an alias:

```bash
# Add to ~/.zshrc
echo 'alias polymarket="cd /Users/8bit/Downloads/agents && source .venv/bin/activate && export PYTHONPATH=\".\" && python scripts/python/cli.py"' >> ~/.zshrc
source ~/.zshrc

# Then you can just run:
polymarket --help
```

## Complete Workflow

```bash
# 1. Navigate to project
cd /Users/8bit/Downloads/agents

# 2. Activate virtual environment
source .venv/bin/activate

# 3. Set PYTHONPATH (IMPORTANT!)
export PYTHONPATH="."

# 4. Check wallet balance
python check_wallet.py

# 5. Run CLI commands
python scripts/python/cli.py --help
python scripts/python/cli.py get-all-markets --limit 10
python scripts/python/cli.py run-autonomous-trader
```

## Why This Happens

Python needs to know where to find the `agents` module. Since it's in the project root, you need to add the current directory (`.`) to `PYTHONPATH` so Python can find it.

