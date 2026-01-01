#!/usr/bin/env python3
"""
Quick test script to verify API connectivity and Python 3.14 compatibility.
Run this to test if the fixes work before running the full trading script.
"""

import httpx
import sys

def test_gamma_api():
    """Test the Gamma API endpoint with query params."""
    print("Testing Gamma API connectivity...")
    print(f"Python version: {sys.version}")
    
    query_params = {
        "active": "true",
        "closed": "false",
        "archived": "false",
        "limit": 10
    }
    
    try:
        with httpx.Client(timeout=30.0) as client:
            print(f"Fetching: https://gamma-api.polymarket.com/events")
            print(f"Params: {query_params}")
            r = client.get(
                "https://gamma-api.polymarket.com/events",
                params=query_params
            )
            print(f"✅ Status: {r.status_code}")
            data = r.json()
            print(f"✅ Events fetched: {len(data)}")
            
            if len(data) > 0:
                print(f"\nFirst event sample:")
                print(f"  ID: {data[0].get('id')}")
                print(f"  Title: {data[0].get('title', 'N/A')}")
                print(f"  Active: {data[0].get('active', 'N/A')}")
            
            return True
            
    except RecursionError as e:
        print(f"❌ RecursionError: {e}")
        print("❌ Python 3.14 incompatibility detected!")
        print("RECOMMENDATION: Switch to Python 3.11 or 3.12")
        return False
    except Exception as e:
        print(f"❌ Error: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_gamma_api()
    sys.exit(0 if success else 1)

