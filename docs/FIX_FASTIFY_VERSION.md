# Fix: Fastify Version Mismatch

## ❌ Error

```
FastifyError: fastify-plugin: @fastify/websocket - expected '5.x' fastify version, '4.29.1' is installed
```

## 🔍 Root Cause

`@fastify/websocket` version 11.x requires Fastify 5.x, but Fastify 4.29.1 is installed.

## ✅ Solution

The `package.json` has been updated to use Fastify 5.x. You need to reinstall dependencies:

```bash
cd /Users/8bit/Downloads/agents/polymarket-arbitrage-agent/apps/backend
pnpm install
```

This will upgrade Fastify from 4.29.1 to 5.x, which is compatible with `@fastify/websocket` 11.x.

## 📋 What Changed

**Before:**
```json
"fastify": "^4.26.0"
```

**After:**
```json
"fastify": "^5.0.0"
```

## 🔄 Alternative: Downgrade @fastify/websocket

If you prefer to stay on Fastify 4.x, you could downgrade `@fastify/websocket` instead:

```bash
pnpm install @fastify/websocket@^10.0.0
```

However, upgrading to Fastify 5.x is recommended as it's the latest version.

## ✅ Verification

After running `pnpm install`, verify the versions:

```bash
pnpm list fastify @fastify/websocket
```

You should see:
- `fastify 5.x.x`
- `@fastify/websocket 11.x.x`

Then restart the backend:

```bash
pnpm dev
```

The version mismatch error should be resolved.

