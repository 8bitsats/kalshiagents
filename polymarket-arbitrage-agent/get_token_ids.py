#!/usr/bin/env python3
"""
Quick script to get Polymarket token IDs for BTC 15m Up/Down markets
"""
import os
import sys

# Add parent agents directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from dotenv import load_dotenv
load_dotenv()

try:
    from agents.polymarket.polymarket import Polymarket
    from agents.polymarket.gamma import GammaMarketClient
    
    print("🔍 Fetching BTC 15m markets...")
    
    polymarket = Polymarket()
    gamma = GammaMarketClient()
    
    # Get all markets
    markets = polymarket.get_all_markets()
    
    # Filter for BTC 15m markets
    btc_markets = [m for m in markets if 'btc' in m.question.lower() and '15' in m.question.lower()]
    
    if not btc_markets:
        print("❌ No BTC 15m markets found")
        print("\nAvailable markets (first 10):")
        for m in markets[:10]:
            print(f"  - {m.question}")
        sys.exit(1)
    
    print(f"\n✅ Found {len(btc_markets)} BTC 15m market(s)\n")
    
    for i, market in enumerate(btc_markets[:5], 1):
        print(f"Market {i}: {market.question}")
        print(f"  Condition ID: {market.condition_id}")
        print(f"  Market Slug: {market.slug}")
        
        # Try to get token IDs from market data
        if hasattr(market, 'tokens') and market.tokens:
            for token in market.tokens:
                print(f"  Token: {token.get('outcome', 'unknown')} = {token.get('token_id', 'N/A')}")
        
        print()
    
    print("\n💡 To get token IDs:")
    print("  1. Visit Polymarket website")
    print("  2. Open DevTools → Network → WS")
    print("  3. Look for WebSocket messages with 'asset_id' fields")
    print("  4. Copy the UP and DOWN token IDs")
    print("\n   OR")
    print("  5. Use Polymarket API directly to fetch market details")
    
except ImportError as e:
    print(f"❌ Error: {e}")
    print("\nMake sure you're in the agents directory and dependencies are installed:")
    print("  cd /Users/8bit/Downloads/agents")
    print("  source .venv/bin/activate")
    print("  export PYTHONPATH=\".\"")
    sys.exit(1)

