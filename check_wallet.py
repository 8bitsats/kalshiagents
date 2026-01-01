#!/usr/bin/env python3
"""Quick script to check wallet balance and address"""
import os
import sys
from dotenv import load_dotenv
from web3 import Web3

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

load_dotenv()

private_key = os.getenv("POLYGON_WALLET_PRIVATE_KEY")
if not private_key:
    print("❌ ERROR: POLYGON_WALLET_PRIVATE_KEY not found in .env file")
    sys.exit(1)

# Connect to Polygon
polygon_rpc = "https://polygon-rpc.com"
w3 = Web3(Web3.HTTPProvider(polygon_rpc))

if not w3.is_connected():
    print("❌ ERROR: Could not connect to Polygon RPC")
    sys.exit(1)

# Get wallet address
account = w3.eth.account.from_key(private_key)
address = account.address

print(f"📍 Wallet Address: {address}")
print(f"🔗 View on PolygonScan: https://polygonscan.com/address/{address}")

# Check USDC balance
usdc_address = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174"
usdc_abi = [{"constant": True, "inputs": [{"name": "_owner", "type": "address"}], "name": "balanceOf", "outputs": [{"name": "balance", "type": "uint256"}], "type": "function"}]
usdc_contract = w3.eth.contract(address=usdc_address, abi=usdc_abi)

try:
    balance_raw = usdc_contract.functions.balanceOf(address).call()
    balance_usdc = balance_raw / 1e6  # USDC has 6 decimals
    print(f"💰 USDC Balance: ${balance_usdc:,.2f}")
    
    if balance_usdc < 10:
        print("\n⚠️  WARNING: Low balance! You need at least $10-20 USDC to start trading.")
        print("📝 To fund your wallet:")
        print(f"   1. Send USDC to: {address}")
        print("   2. Use Polygon network (not Ethereum mainnet)")
        print("   3. USDC contract: 0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174")
        print("\n   You can buy USDC on:")
        print("   - Coinbase (withdraw to Polygon)")
        print("   - Uniswap (bridge to Polygon)")
        print("   - Any DEX on Polygon")
    else:
        print(f"✅ Wallet is funded! Ready to trade.")
except Exception as e:
    print(f"❌ Error checking balance: {e}")

# Check MATIC balance (for gas)
try:
    matic_balance = w3.eth.get_balance(address)
    matic_balance_ether = w3.from_wei(matic_balance, 'ether')
    print(f"⛽ MATIC Balance: {matic_balance_ether:.4f} MATIC")
    
    if matic_balance_ether < 0.1:
        print("⚠️  WARNING: Low MATIC! You need MATIC for gas fees.")
        print("   Send some MATIC to your wallet for transaction fees.")
except Exception as e:
    print(f"❌ Error checking MATIC balance: {e}")

