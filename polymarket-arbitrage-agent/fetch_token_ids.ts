#!/usr/bin/env tsx
/**
 * Fetch Polymarket Token IDs for BTC 15m Up/Down markets
 * 
 * Usage:
 *   cd apps/backend
 *   tsx ../../fetch_token_ids.ts
 */

import { ClobClient } from "@polymarket/clob-client";

const POLYMARKET_HOST = process.env.POLYMARKET_HOST || "https://clob.polymarket.com";
const MARKET_SLUG = process.env.POLYMARKET_MARKET_SLUG || "btc-updown-15m";

async function fetchTokenIds() {
  console.log("🔍 Fetching token IDs from Polymarket...\n");

  try {
    const client = new ClobClient({
      host: POLYMARKET_HOST,
    });

    // Get market information
    console.log(`📊 Looking for market: ${MARKET_SLUG}\n`);
    
    // Try to get market by slug or search for BTC markets
    // Note: The CLOB client API may vary, so we'll try multiple approaches
    
    // Method 1: Try to get market info directly
    try {
      // Search for markets containing "btc" and "15"
      const markets = await fetch(`${POLYMARKET_HOST}/markets`).then((r) => r.json());
      
      const btcMarkets = markets
        ?.filter((m: any) => 
          m.slug?.toLowerCase().includes("btc") && 
          (m.slug?.toLowerCase().includes("15") || m.question?.toLowerCase().includes("15"))
        ) || [];

      if (btcMarkets.length > 0) {
        console.log(`✅ Found ${btcMarkets.length} BTC 15m market(s):\n`);
        
        for (const market of btcMarkets.slice(0, 3)) {
          console.log(`Market: ${market.question || market.slug}`);
          console.log(`  Slug: ${market.slug}`);
          
          // Get market details to find token IDs
          try {
            const marketDetails = await fetch(`${POLYMARKET_HOST}/markets/${market.slug}`).then((r) => r.json());
            
            if (marketDetails.tokens || marketDetails.assets) {
              const tokens = marketDetails.tokens || marketDetails.assets || [];
              console.log(`  Tokens:`);
              for (const token of tokens) {
                const outcome = token.outcome || token.name || "unknown";
                const tokenId = token.token_id || token.asset_id || token.id;
                console.log(`    ${outcome}: ${tokenId}`);
              }
            }
          } catch (e) {
            console.log(`  ⚠️  Could not fetch market details: ${e}`);
          }
          
          console.log();
        }
      } else {
        console.log("❌ No BTC 15m markets found via API\n");
      }
    } catch (e) {
      console.log(`⚠️  API method failed: ${e}\n`);
    }

    // Method 2: Use WebSocket to discover token IDs
    console.log("📡 Alternative: Use browser DevTools to find token IDs\n");
    console.log("1. Go to Polymarket website");
    console.log("2. Open DevTools (F12) → Network → WS");
    console.log("3. Find WebSocket to ws-subscriptions-clob.polymarket.com");
    console.log("4. Look for messages with 'asset_id' fields");
    console.log("5. Copy the two token IDs (UP and DOWN)\n");

    // Method 3: Browser console script
    console.log("💡 Or paste this into browser console (on Polymarket page):\n");
    console.log(`
// Paste this into browser console:
(() => {
  const tokens = new Set();
  const ws = new WebSocket('wss://ws-subscriptions-clob.polymarket.com/ws/');
  
  ws.onopen = () => {
    console.log('Connected to Polymarket WS');
    ws.send(JSON.stringify({
      type: 'MARKET',
      asset_ids: [],
      custom_feature_enabled: false
    }));
  };
  
  ws.onmessage = (e) => {
    try {
      const msg = JSON.parse(e.data);
      if (msg.asset_id) {
        tokens.add(msg.asset_id);
        console.log('Found token ID:', msg.asset_id);
        if (tokens.size >= 2) {
          console.log('\\n✅ Token IDs found:');
          Array.from(tokens).forEach((id, i) => {
            console.log(\`  \${i === 0 ? 'UP' : 'DOWN'}: \${id}\`);
          });
          ws.close();
        }
      }
    } catch (e) {}
  };
  
  setTimeout(() => {
    if (tokens.size < 2) {
      console.log('\\n⚠️  Only found', tokens.size, 'token(s). Keep the page open longer.');
      console.log('Token IDs so far:', Array.from(tokens));
    }
  }, 10000);
})();
    `);

  } catch (error: any) {
    console.error("❌ Error:", error.message);
    console.error("\n💡 Try using the browser method instead (see instructions above)");
    process.exit(1);
  }
}

fetchTokenIds();

