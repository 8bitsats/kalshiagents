# Predictfun Debug - Issues and Fixes

## Issues Found

### 1. **Python 3.9 Incompatibility** (Line 175-176)
**Error:** `ERROR: Could not find a version that satisfies the requirement xai-sdk>=1.4.0`

**Problem:** `xai-sdk>=1.4.0` requires Python 3.10+, but you're using Python 3.9.6.

**Solution:** Use Python 3.11 (which you already have installed):
```bash
cd /Users/8bit/Downloads/agents
rm -rf .venv
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 2. **Missing Anchor Build** (Lines 12-26)
**Error:** TypeScript compilation fails because:
- `Cannot find module '../target/types/prediction_market'`
- `Cannot find module '../lib/scripts'`
- `Cannot find module '../lib/util'`
- `Cannot find module '../lib/constant'`

**Problem:** 
- The Anchor program hasn't been built yet, so TypeScript types don't exist
- The `lib/` directory with helper scripts is missing

**Solution:** Build the Anchor program first:
```bash
cd predictfun
anchor build
```

### 3. **Missing Solana Build Tools** (Lines 433, 477)
**Error:** `error: no such command: 'build-sbf'`

**Problem:** The Solana toolchain is not installed or not in PATH.

**Solution:** Install Solana CLI tools:
```bash
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
# Then add to PATH (usually ~/.local/share/solana/install/active_release/bin)
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
```

Or if already installed, ensure it's in PATH:
```bash
which solana
which cargo-build-sbf
# If not found, add Solana bin to PATH
```

### 4. **Anchor Version Mismatch** (Lines 413-426)
**Warning:** Anchor CLI version (0.32.1) doesn't match Anchor.toml (0.30.1)

**Solution:** Either:
- **Option A:** Use the correct Anchor version:
  ```bash
  avm install 0.30.1
  avm use 0.30.1
  ```

- **Option B:** Update Anchor.toml to match installed version:
  ```toml
  [toolchain]
  anchor_version = "0.32.1"
  ```
  And update package.json:
  ```bash
  yarn upgrade @coral-xyz/anchor@0.32.1
  ```

### 5. **Missing lib/ Directory**
The TypeScript code expects helper files in `lib/` directory that don't exist.

**Solution:** These files need to be created or the project structure needs to be fixed. Check if there's a template or if these files should be generated.

## Step-by-Step Fix

### For Python Trading Script:
```bash
cd /Users/8bit/Downloads/agents
rm -rf .venv
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
export PYTHONPATH="."
python agents/application/trade.py
```

### For Predictfun (Solana):
```bash
# 1. Install Solana CLI (if not installed)
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"

# 2. Install correct Anchor version
avm install 0.30.1
avm use 0.30.1

# 3. Build the Anchor program
cd predictfun
anchor build

# 4. If lib/ directory is missing, check if it should be created or if imports need fixing

# 5. Run the config command
yarn script config -e devnet -k /Users/8bit/Downloads/X402Terminal2/wallet-keypair.json -r "https://devnet.helius-rpc.com/?api-key=c55c146c-71ef-41b9-a574-cb08f359c00c"
```

## Quick Check Commands

```bash
# Check Python version
python --version  # Should be 3.11+

# Check Solana installation
solana --version
cargo-build-sbf --version

# Check Anchor installation
anchor --version
avm list

# Check if target/types exists
ls -la predictfun/target/types/

# Check if lib directory exists
ls -la predictfun/lib/
```

