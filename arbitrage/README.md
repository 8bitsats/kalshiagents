# Arbitrage Client

Unified TypeScript client for cross-chain arbitrage trading across Kalshi, Polymarket, and Solana.

## Installation

```bash
npm install
npm run build
```

## Usage

### Basic Setup

```typescript
import { UnifiedArbitrageClient, SolanaToEVMBridge } from "@solbridge/arbitrage-client";
import { Wallet } from "ethers";

// Initialize bridge
const bridge = new SolanaToEVMBridge(solanaPrivateKeyBase58);
const evmSigner = bridge.getEVMSigner();

// Create unified client
const client = new UnifiedArbitrageClient(
  kalshiApiKey,
  kalshiPrivateKeyPath,
  "https://clob.polymarket.com",
  137, // Polygon
  evmSigner,
  "https://api.mainnet-beta.solana.com"
);
```

### Find Arbitrage Opportunities

```typescript
const opportunity = await client.findArbitrageOpportunity(
  "KX-TRUMP-24",  // Kalshi ticker
  "polymarket-token-id"  // Polymarket token ID
);

if (opportunity && opportunity.spread > 2.0) {
  console.log(`Spread detected: ${opportunity.spread}%`);
  await client.executeArbitrage(opportunity);
}
```

### Individual Clients

#### Kalshi Client

```typescript
import { KalshiClient } from "@solbridge/arbitrage-client";

const kalshi = new KalshiClient(apiKeyId, privateKeyPath);

// Get balance
const balance = await kalshi.getBalance();

// Get orderbook
const orderbook = await kalshi.getOrderbook("KX-TRUMP-24");
```

#### Polymarket Client

```typescript
import { PolymarketClient } from "@solbridge/arbitrage-client";
import { Wallet } from "ethers";

const poly = new PolymarketClient(
  "https://clob.polymarket.com",
  137,
  evmWallet
);

await poly.initialize();
await poly.createOrder({
  tokenID: "token-id",
  price: 0.52,
  side: "BUY",
  size: 10
});
```

## API Reference

See the main [README.md](../README.md) for full documentation.
