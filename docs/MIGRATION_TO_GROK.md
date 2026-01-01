# Migration from OpenAI to Grok (xAI)

This document describes the migration from OpenAI to Grok (xAI) for Polymarket trading agents.

## Changes Made

### 1. Replaced OpenAI with Grok (xAI SDK)

- **Before**: Used `ChatOpenAI` from `langchain_openai`
- **After**: Uses `Client` from `xai_sdk` with `grok-4-1-fast` model

### 2. Environment Variables

**Old:**
```bash
OPENAI_API_KEY=""
```

**New:**
```bash
XAI_API_KEY=""
GROK_MODEL="grok-4-1-fast"  # Optional, defaults to grok-4-1-fast
```

### 3. Added Tools

The executor now includes powerful tools for Grok:

1. **Web Search** - Real-time web search with image understanding
2. **X (Twitter) Search** - Search X posts with image and video understanding
3. **Custom Polymarket Tools**:
   - `get_polymarket_market` - Get market information
   - `get_polymarket_active_markets` - List active markets
   - `get_polymarket_orderbook` - Get orderbook data
   - `get_polymarket_price` - Get current price
   - `get_polymarket_events` - List events
   - `get_polymarket_balance` - Get USDC balance

### 4. Vision Capabilities

Grok now has vision capabilities enabled:
- Image understanding in web search
- Image and video understanding in X search

### 5. Model Configuration

- **Default Model**: `grok-4-1-fast`
- **Token Limit**: 95,000 tokens (increased from 15,000)
- **Timeout**: 3600 seconds for reasoning models

## Installation

1. Install the xAI SDK:
```bash
pip install xai-sdk>=1.4.0
```

2. Set environment variables:
```bash
export XAI_API_KEY="your_xai_api_key"
export GROK_MODEL="grok-4-1-fast"  # Optional
```

3. Get your API key from [xAI Console](https://console.x.ai)

## Usage

The API remains largely the same, but now uses Grok with enhanced capabilities:

```python
from agents.application.executor import Executor

# Initialize executor (uses grok-4-1-fast by default)
executor = Executor()

# Get LLM response with tools
response = executor.get_llm_response("Analyze the current Polymarket markets")

# Source best trade (now with web search and X search)
best_trade = executor.source_best_trade(market_object)
```

## Benefits

1. **Real-time Information**: Web search and X search provide up-to-date information
2. **Vision Capabilities**: Can analyze images and videos from search results
3. **Custom Tools**: Polymarket-specific tools for direct market interaction
4. **Higher Token Limit**: 95,000 tokens vs 15,000
5. **Better Reasoning**: grok-4-1-fast is optimized for reasoning tasks

## Custom Polymarket Tools

The custom tools are defined in `agents/polymarket/grok_tools.py` and include:

- Market data retrieval
- Orderbook analysis
- Price queries
- Event listings
- Balance checks

These tools enable Grok to directly interact with Polymarket data during its reasoning process.

## Notes

- Embeddings still use OpenAI (for ChromaDB) - this can be changed if needed
- The executor automatically handles tool calls (both server-side and client-side)
- Tool calls are executed in a loop until Grok provides a final response

