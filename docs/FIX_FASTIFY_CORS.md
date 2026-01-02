# Fix: @fastify/cors Version Mismatch

## ❌ Error

```
FastifyError: fastify-plugin: @fastify/cors - expected '4.x' fastify version, '5.6.2' is installed
```

## 🔍 Root Cause

`@fastify/cors` version 9.x is compatible with Fastify 4.x, but we upgraded to Fastify 5.x. We need to upgrade `@fastify/cors` to version 10.x which is compatible with Fastify 5.x.

## ✅ Solution

Updated `package.json` to use `@fastify/cors` version 10.x:

**Changed:**
```json
"@fastify/cors": "^9.0.1"  // ❌ Compatible with Fastify 4.x
```

**To:**
```json
"@fastify/cors": "^10.0.0"  // ✅ Compatible with Fastify 5.x
```

## 📋 Fastify Plugin Compatibility

| Fastify Version | @fastify/cors | @fastify/websocket |
|----------------|---------------|-------------------|
| 4.x | 9.x | 10.x |
| 5.x | 10.x | 11.x |

## 🔧 Installation

Run:

```bash
cd /Users/8bit/Downloads/agents/polymarket-arbitrage-agent/apps/backend
pnpm install
```

This will upgrade `@fastify/cors` from 9.x to 10.x.

## ✅ Verification

After running `pnpm install`, verify the versions:

```bash
pnpm list fastify @fastify/cors @fastify/websocket
```

You should see:
- `fastify 5.x.x`
- `@fastify/cors 10.x.x`
- `@fastify/websocket 11.x.x`

Then restart the backend:

```bash
pnpm dev
```

The version mismatch error should be resolved.

## 📝 Summary of All Fastify Updates

To use Fastify 5.x, you need:
1. ✅ `fastify: ^5.0.0` (already updated)
2. ✅ `@fastify/cors: ^10.0.0` (just updated)
3. ✅ `@fastify/websocket: ^11.0.0` (already compatible)

All plugins are now compatible with Fastify 5.x!

