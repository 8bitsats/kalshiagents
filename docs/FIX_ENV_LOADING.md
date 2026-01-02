# Fix: .env File Not Loading

## ❌ Problem

When running `pnpm dev` from `apps/backend`, the `.env` file is not being loaded, causing errors like:

```
❌ Missing required environment variables:
   - POLYMARKET_TOKEN_UP_ID: Required
   - POLYMARKET_TOKEN_DOWN_ID: Required
```

## 🔍 Root Cause

The `dotenv/config` import looks for `.env` in the **current working directory** (`process.cwd()`). When you run:

```bash
cd apps/backend
pnpm dev
```

The current working directory is `apps/backend/`, but the `.env` file is in the project root (`polymarket-arbitrage-agent/`).

## ✅ Solution

The config file has been updated to explicitly load the `.env` file from the project root:

```typescript
// apps/backend/src/config.ts
import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: resolve(__dirname, "../../../.env") });
```

This ensures the `.env` file is loaded from `polymarket-arbitrage-agent/.env` regardless of where you run the command from.

## 🧪 Testing

After this fix, you should be able to:

1. **Run from any directory:**
   ```bash
   cd /Users/8bit/Downloads/agents/polymarket-arbitrage-agent/apps/backend
   pnpm dev
   ```

2. **Or from project root:**
   ```bash
   cd /Users/8bit/Downloads/agents/polymarket-arbitrage-agent
   cd apps/backend && pnpm dev
   ```

Both should now correctly load the `.env` file from the project root.

## 📋 Verify .env File Location

Make sure your `.env` file is in the correct location:

```
polymarket-arbitrage-agent/
  ├── .env                    ← Should be here
  ├── apps/
  │   └── backend/
  │       └── src/
  │           └── config.ts   ← Loads from ../../../.env
  └── package.json
```

## 🔧 Alternative: Use Environment Variables Directly

If you prefer, you can also set environment variables directly when running:

```bash
cd /Users/8bit/Downloads/agents/polymarket-arbitrage-agent/apps/backend
POLYMARKET_TOKEN_UP_ID=... POLYMARKET_TOKEN_DOWN_ID=... pnpm dev
```

But using the `.env` file is recommended for convenience.

## ✅ Verification

After starting the backend, you should **NOT** see the "Missing required environment variables" error. If you still see it:

1. Check that `.env` file exists in `polymarket-arbitrage-agent/`
2. Verify the file contains `POLYMARKET_TOKEN_UP_ID` and `POLYMARKET_TOKEN_DOWN_ID`
3. Make sure there are no syntax errors in the `.env` file (no spaces around `=`)
4. Restart the backend after making changes

