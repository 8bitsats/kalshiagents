# Fix: Fastify 5.x and @fastify/cors Compatibility

## ❌ Error

```
FastifyError: fastify-plugin: @fastify/cors - expected '4.x' fastify version, '5.6.2' is installed
```

## 🔍 Root Cause

`@fastify/cors` version 10.0.0 expects Fastify 4.x, but Fastify 5.6.2 is installed.

## ✅ Solution

Upgrade `@fastify/cors` to version 11.x which supports Fastify 5.x:

```bash
cd /Users/8bit/Downloads/agents/polymarket-arbitrage-agent/apps/backend
pnpm install @fastify/cors@^11.0.0
```

Or update `package.json`:

```json
{
  "dependencies": {
    "fastify": "^5.0.0",
    "@fastify/cors": "^11.0.0",
    "@fastify/websocket": "^11.0.0"
  }
}
```

Then run:
```bash
pnpm install
```

## 📋 Version Compatibility

- **Fastify 4.x** → `@fastify/cors` 10.x
- **Fastify 5.x** → `@fastify/cors` 11.x

## ✅ Verification

After installing, verify:

```bash
pnpm list fastify @fastify/cors
```

You should see:
- `fastify 5.x.x`
- `@fastify/cors 11.x.x`

Then restart:
```bash
pnpm dev
```

## 🔄 Alternative: Downgrade Fastify

If you prefer to stay on Fastify 4.x:

```bash
pnpm install fastify@^4.29.0 @fastify/cors@^10.0.0
```

However, upgrading to Fastify 5.x with `@fastify/cors` 11.x is recommended.

