#!/usr/bin/env tsx
/**
 * Get both token IDs from Polymarket API using one token ID
 * 
 * Usage:
 *   cd apps/backend
 *   tsx ../../get_both_token_ids.ts
 */

const POLYMARKET_HOST = "https://clob.polymarket.com";
const KNOWN_TOKEN_ID = "6559194800246007569880856750288251987392974475870450229880549861162240950022";

async function getBothTokenIds() {
  console.log("🔍 Finding both token IDs from Polymarket API...\n");
  console.log(`Using known token ID: ${KNOWN_TOKEN_ID}\n`);

  try {
    // Method 1: Try to get market info from the token ID
    console.log("📡 Method 1: Querying Polymarket API...\n");
    
    // Try to get token info
    const tokenInfo = await fetch(`${POLYMARKET_HOST}/tokens/${KNOWN_TOKEN_ID}`)
      .then((r) => r.json())
      .catch(() => null);

    if (tokenInfo) {
      console.log("✅ Found token info:");
      console.log(JSON.stringify(tokenInfo, null, 2));
      
      // Look for related tokens or market info
      if (tokenInfo.market || tokenInfo.condition_id) {
        const marketId = tokenInfo.market || tokenInfo.condition_id;
        console.log(`\n📊 Market ID: ${marketId}`);
        
        // Try to get all tokens for this market
        const marketInfo = await fetch(`${POLYMARKET_HOST}/markets/${marketId}`)
          .then((r) => r.json())
          .catch(() => null);
        
        if (marketInfo && marketInfo.tokens) {
          console.log("\n✅ Found tokens for this market:");
          marketInfo.tokens.forEach((token: any, i: number) => {
            console.log(`  Token ${i + 1}: ${token.asset_id || token.token_id || token.id}`);
          });
        }
      }
    }

    // Method 2: Try to get market by searching for BTC 15m markets
    console.log("\n📡 Method 2: Searching for BTC 15m markets...\n");
    
    const markets = await fetch(`${POLYMARKET_HOST}/markets?slug=btc-updown-15m`)
      .then((r) => r.json())
      .catch(() => null);

    if (markets && Array.isArray(markets) && markets.length > 0) {
      const market = markets[0];
      console.log(`✅ Found market: ${market.question || market.slug}\n`);
      
      if (market.tokens || market.asset_ids) {
        const tokens = market.tokens || market.asset_ids || [];
        console.log("Token IDs for this market:");
        tokens.forEach((token: any, i: number) => {
          const tokenId = typeof token === 'string' ? token : (token.asset_id || token.token_id || token.id);
          const label = i === 0 ? 'UP' : 'DOWN';
          console.log(`  ${label}: ${tokenId}`);
        });
      }
    }

    // Method 3: Try Gamma API (Polymarket's main API)
    console.log("\n📡 Method 3: Trying Gamma API...\n");
    
    const gammaMarkets = await fetch(`https://gamma-api.polymarket.com/markets?active=true&slug=btc-updown-15m`)
      .then((r) => r.json())
      .catch(() => null);

    if (gammaMarkets && Array.isArray(gammaMarkets) && gammaMarkets.length > 0) {
      const market = gammaMarkets[0];
      console.log(`✅ Found market: ${market.question}\n`);
      
      if (market.clobTokenIds) {
        const tokenIds = typeof market.clobTokenIds === 'string' 
          ? market.clobTokenIds.split(',') 
          : market.clobTokenIds;
        
        console.log("Token IDs for this market:");
        tokenIds.forEach((tokenId: string, i: number) => {
          const label = i === 0 ? 'UP' : 'DOWN';
          console.log(`  ${label}: ${tokenId.trim()}`);
        });
        
        if (tokenIds.length >= 2) {
          console.log("\n" + "=".repeat(60));
          console.log("✅ SUCCESS! Found both token IDs:");
          console.log("=".repeat(60) + "\n");
          console.log(`POLYMARKET_TOKEN_UP_ID=${tokenIds[0].trim()}`);
          console.log(`POLYMARKET_TOKEN_DOWN_ID=${tokenIds[1].trim()}`);
          console.log("\n💡 Copy these two lines into your .env file!\n");
        }
      }
    }

    // Method 4: Use the known token ID to find the market, then get the other token
    console.log("\n📡 Method 4: Using known token to find market...\n");
    
    // Try to get orderbook for the known token - this might give us market info
    const orderbook = await fetch(`${POLYMARKET_HOST}/book?token_id=${KNOWN_TOKEN_ID}`)
      .then((r) => r.json())
      .catch(() => null);

    if (orderbook && orderbook.market) {
      console.log(`✅ Found market from orderbook: ${orderbook.market}\n`);
      
      // Try to get all tokens for this market
      const marketSlug = orderbook.market;
      const marketDetails = await fetch(`${POLYMARKET_HOST}/markets/${marketSlug}`)
        .then((r) => r.json())
        .catch(() => null);
      
      if (marketDetails) {
        console.log("Market details:", JSON.stringify(marketDetails, null, 2));
      }
    }

  } catch (error: any) {
    console.error("❌ Error:", error.message);
    console.error("\n💡 Alternative: Use the browser Network tab method");
    console.error("   See EXTRACT_TOKEN_IDS_NETWORK_TAB.md for instructions");
  }
}

getBothTokenIds();

