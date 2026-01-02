"""
Custom Polymarket tools for Grok (xAI) integration.
These tools enable Grok to interact with Polymarket data and make trading decisions.
"""

import json
from typing import Dict, Any, List

# Optional xai_sdk import
try:
    from xai_sdk.chat import tool
    XAI_SDK_AVAILABLE = True
except ImportError:
    XAI_SDK_AVAILABLE = False
    # Dummy tool function for when xai_sdk is not available
    def tool(*args, **kwargs):
        raise ImportError("xai_sdk requires Python 3.10+. Install with: pip install xai-sdk (requires Python 3.10+)")

from agents.polymarket.polymarket import Polymarket
from agents.polymarket.gamma import GammaMarketClient as Gamma


def create_polymarket_tools(polymarket_client: Polymarket, gamma_client: Gamma) -> List:
    """
    Create custom Polymarket tools for Grok.
    
    Returns a list of tool definitions that Grok can use to interact with Polymarket.
    """
    
    # Tool 1: Get market information
    get_market_tool = tool(
        name="get_polymarket_market",
        description="Get detailed information about a specific Polymarket market by market ID or token ID. Returns market question, outcomes, prices, volume, and other relevant data.",
        parameters={
            "type": "object",
            "properties": {
                "market_id": {
                    "type": "string",
                    "description": "The market ID or token ID to query"
                }
            },
            "required": ["market_id"]
        }
    )
    
    # Tool 2: Get all active markets
    get_active_markets_tool = tool(
        name="get_polymarket_active_markets",
        description="Get a list of all currently active and tradeable markets on Polymarket. Returns market IDs, questions, outcomes, and current prices.",
        parameters={
            "type": "object",
            "properties": {
                "limit": {
                    "type": "integer",
                    "description": "Maximum number of markets to return (default: 10)",
                    "default": 10
                }
            },
            "required": []
        }
    )
    
    # Tool 3: Get market orderbook
    get_orderbook_tool = tool(
        name="get_polymarket_orderbook",
        description="Get the orderbook for a specific market, showing current bid/ask prices and sizes. Useful for understanding market liquidity and finding optimal entry/exit points.",
        parameters={
            "type": "object",
            "properties": {
                "token_id": {
                    "type": "string",
                    "description": "The token ID for the market outcome"
                }
            },
            "required": ["token_id"]
        }
    )
    
    # Tool 4: Get market price
    get_price_tool = tool(
        name="get_polymarket_price",
        description="Get the current price for a specific market outcome token. Returns the current market price as a float between 0 and 1.",
        parameters={
            "type": "object",
            "properties": {
                "token_id": {
                    "type": "string",
                    "description": "The token ID for the market outcome"
                }
            },
            "required": ["token_id"]
        }
    )
    
    # Tool 5: Get all events
    get_events_tool = tool(
        name="get_polymarket_events",
        description="Get a list of all active events on Polymarket. Events contain multiple markets. Returns event titles, descriptions, and associated market IDs.",
        parameters={
            "type": "object",
            "properties": {
                "limit": {
                    "type": "integer",
                    "description": "Maximum number of events to return (default: 10)",
                    "default": 10
                }
            },
            "required": []
        }
    )
    
    # Tool 6: Get USDC balance
    get_balance_tool = tool(
        name="get_polymarket_balance",
        description="Get the current USDC balance in the trading wallet. Returns the available balance for trading.",
        parameters={
            "type": "object",
            "properties": {},
            "required": []
        }
    )
    
    return [
        get_market_tool,
        get_active_markets_tool,
        get_orderbook_tool,
        get_price_tool,
        get_events_tool,
        get_balance_tool
    ]


def execute_polymarket_tool(
    tool_name: str,
    arguments: Dict[str, Any],
    polymarket_client: Polymarket,
    gamma_client: Gamma
) -> str:
    """
    Execute a Polymarket tool and return the result as a JSON string.
    
    This function is called by the executor when Grok requests a Polymarket tool.
    """
    try:
        if tool_name == "get_polymarket_market":
            market_id = arguments.get("market_id")
            market = gamma_client.get_market(market_id)
            if market:
                formatted_market = polymarket_client.map_api_to_market(market)
                return json.dumps(formatted_market, indent=2, default=str)
            return json.dumps({"error": f"Market {market_id} not found"})
        
        elif tool_name == "get_polymarket_active_markets":
            limit = arguments.get("limit", 10)
            markets = polymarket_client.get_all_markets()
            tradeable = polymarket_client.filter_markets_for_trading(markets)
            limited = tradeable[:limit]
            result = [polymarket_client.map_api_to_market(m) if isinstance(m, dict) else m.dict() for m in limited]
            return json.dumps(result, indent=2, default=str)
        
        elif tool_name == "get_polymarket_orderbook":
            token_id = arguments.get("token_id")
            orderbook = polymarket_client.get_orderbook(token_id)
            return json.dumps({
                "token_id": token_id,
                "bids": [{"price": str(b.price), "size": str(b.size)} for b in orderbook.bids[:5]],
                "asks": [{"price": str(a.price), "size": str(a.size)} for a in orderbook.asks[:5]]
            }, indent=2)
        
        elif tool_name == "get_polymarket_price":
            token_id = arguments.get("token_id")
            price = polymarket_client.get_orderbook_price(token_id)
            return json.dumps({"token_id": token_id, "price": float(price)})
        
        elif tool_name == "get_polymarket_events":
            limit = arguments.get("limit", 10)
            events = polymarket_client.get_all_tradeable_events()
            limited = events[:limit]
            result = [e.dict() for e in limited]
            return json.dumps(result, indent=2, default=str)
        
        elif tool_name == "get_polymarket_balance":
            balance = polymarket_client.get_usdc_balance()
            return json.dumps({"balance_usdc": balance})
        
        else:
            return json.dumps({"error": f"Unknown tool: {tool_name}"})
    
    except Exception as e:
        return json.dumps({"error": str(e)})

