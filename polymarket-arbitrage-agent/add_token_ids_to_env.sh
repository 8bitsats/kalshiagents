#!/bin/bash

# Helper script to add token IDs to .env file
# Usage: ./add_token_ids_to_env.sh UP_TOKEN_ID DOWN_TOKEN_ID

ENV_FILE="$(dirname "$0")/.env"

if [ ! -f "$ENV_FILE" ]; then
    echo "Creating .env file..."
    touch "$ENV_FILE"
fi

if [ $# -eq 2 ]; then
    UP_ID="$1"
    DOWN_ID="$2"
    
    # Remove existing token ID lines
    sed -i.bak '/^POLYMARKET_TOKEN_UP_ID=/d' "$ENV_FILE"
    sed -i.bak '/^POLYMARKET_TOKEN_DOWN_ID=/d' "$ENV_FILE"
    
    # Add new token IDs
    echo "POLYMARKET_TOKEN_UP_ID=$UP_ID" >> "$ENV_FILE"
    echo "POLYMARKET_TOKEN_DOWN_ID=$DOWN_ID" >> "$ENV_FILE"
    
    echo "✅ Added token IDs to .env file:"
    echo "   POLYMARKET_TOKEN_UP_ID=$UP_ID"
    echo "   POLYMARKET_TOKEN_DOWN_ID=$DOWN_ID"
else
    echo "Usage: $0 UP_TOKEN_ID DOWN_TOKEN_ID"
    echo ""
    echo "Example:"
    echo "  $0 0x1234... 0xabcd..."
    echo ""
    echo "Or manually edit .env and add:"
    echo "  POLYMARKET_TOKEN_UP_ID=your_up_token_id"
    echo "  POLYMARKET_TOKEN_DOWN_ID=your_down_token_id"
fi

