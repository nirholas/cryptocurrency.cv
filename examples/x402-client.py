#!/usr/bin/env python3
"""
x402 Payment Client Example - Python

This example shows how to make authenticated API calls using x402 payments.

Requirements:
    pip install requests eth-account web3

Usage:
    export WALLET_PRIVATE_KEY="your_private_key_here"
    python x402-client.py

See: https://docs.x402.org
"""

import os
import json
import time
import hashlib
from typing import Optional, Dict, Any
from dataclasses import dataclass

import requests
from eth_account import Account
from eth_account.messages import encode_defunct
from web3 import Web3

# =============================================================================
# CONFIGURATION
# =============================================================================

API_BASE = "https://cryptocurrency.cv"
PRIVATE_KEY = os.environ.get("WALLET_PRIVATE_KEY")

if not PRIVATE_KEY:
    print("Warning: WALLET_PRIVATE_KEY not set. Using demo mode.")
    PRIVATE_KEY = "0x" + "0" * 64  # Dummy key for demo

# Create account from private key
account = Account.from_key(PRIVATE_KEY)
print(f"Wallet address: {account.address}")


# =============================================================================
# X402 PAYMENT HANDLING
# =============================================================================

@dataclass
class PaymentRequirements:
    """Parsed 402 Payment Required response"""
    version: int
    network: str
    amount: str
    pay_to: str
    asset: str
    nonce: str
    resource: str


def parse_402_response(data: Dict[str, Any]) -> Optional[PaymentRequirements]:
    """Parse x402 payment requirements from 402 response"""
    x402 = data.get("x402", {})
    accepts = x402.get("accepts", [])
    
    if not accepts:
        return None
    
    # Use first accepted payment method
    accept = accepts[0]
    
    return PaymentRequirements(
        version=x402.get("x402Version", 1),
        network=accept.get("network", ""),
        amount=accept.get("maxAmountRequired", "0"),
        pay_to=accept.get("payTo", ""),
        asset=accept.get("asset", ""),
        nonce=accept.get("paymentNonce", ""),
        resource=accept.get("resource", ""),
    )


def create_payment_signature(requirements: PaymentRequirements) -> str:
    """
    Create x402 payment signature
    
    Note: This is a simplified example. Production implementations
    should use the official x402 SDK which handles the full signing flow.
    """
    # Create payment message
    message = json.dumps({
        "network": requirements.network,
        "amount": requirements.amount,
        "payTo": requirements.pay_to,
        "asset": requirements.asset,
        "nonce": requirements.nonce,
        "resource": requirements.resource,
        "timestamp": int(time.time()),
    }, separators=(',', ':'))
    
    # Sign with wallet
    message_hash = encode_defunct(text=message)
    signature = account.sign_message(message_hash)
    
    return signature.signature.hex()


def make_paid_request(endpoint: str, method: str = "GET", **kwargs) -> requests.Response:
    """
    Make an API request with x402 payment handling
    
    This function:
    1. Makes initial request
    2. If 402 returned, creates payment signature
    3. Retries with payment header
    """
    url = f"{API_BASE}{endpoint}"
    
    # Initial request
    response = requests.request(method, url, **kwargs)
    
    # Handle 402 Payment Required
    if response.status_code == 402:
        print(f"💰 Payment required for {endpoint}")
        
        data = response.json()
        requirements = parse_402_response(data)
        
        if requirements:
            print(f"  Network: {requirements.network}")
            print(f"  Amount: {requirements.amount} (USDC units)")
            print(f"  PayTo: {requirements.pay_to}")
            
            # Create payment signature
            signature = create_payment_signature(requirements)
            
            # Retry with payment header
            headers = kwargs.get("headers", {})
            headers["X-Payment"] = signature
            
            response = requests.request(method, url, headers=headers, **kwargs)
            
            if response.ok:
                print(f"  ✅ Payment successful!")
    
    return response


# =============================================================================
# API FUNCTIONS
# =============================================================================

def fetch_news() -> Dict[str, Any]:
    """Fetch crypto news with payment"""
    print("\n📰 Fetching crypto news...")
    
    response = make_paid_request("/api/v1/news")
    
    if response.ok:
        data = response.json()
        articles = data.get("articles", [])
        print(f"✅ Received {len(articles)} articles")
        if articles:
            print(f"  Latest: {articles[0].get('title', 'N/A')}")
        return data
    else:
        print(f"❌ Error: {response.status_code}")
        return {}


def fetch_trending() -> Dict[str, Any]:
    """Fetch trending coins"""
    print("\n📈 Fetching trending coins...")
    
    response = make_paid_request("/api/v1/trending")
    
    if response.ok:
        data = response.json()
        coins = data.get("coins", [])
        print(f"✅ Received {len(coins)} trending coins")
        return data
    else:
        print(f"❌ Error: {response.status_code}")
        return {}


def fetch_market_data() -> Dict[str, Any]:
    """Fetch market overview"""
    print("\n📊 Fetching market data...")
    
    response = make_paid_request("/api/v1/market-data")
    
    if response.ok:
        data = response.json()
        print(f"✅ Market cap: ${data.get('total_market_cap', 0):,.0f}")
        return data
    else:
        print(f"❌ Error: {response.status_code}")
        return {}


def check_api_discovery() -> Dict[str, Any]:
    """Check available endpoints via Bazaar discovery"""
    print("\n🔍 Checking available endpoints...")
    
    response = requests.get(f"{API_BASE}/api/.well-known/x402")
    
    if response.ok:
        data = response.json()
        resources = data.get("resources", [])
        print(f"✅ Found {len(resources)} paid endpoints:")
        for r in resources[:5]:
            print(f"  - {r['path']} ({r['price']})")
        if len(resources) > 5:
            print(f"  ... and {len(resources) - 5} more")
        return data
    else:
        print(f"❌ Discovery failed: {response.status_code}")
        return {}


# =============================================================================
# MAIN
# =============================================================================

def main():
    print("🚀 x402 Payment Client - Python Example")
    print("=" * 50)
    
    # Check discovery endpoint first (free)
    check_api_discovery()
    
    # Fetch data with payments
    fetch_news()
    fetch_trending()
    fetch_market_data()
    
    print("\n" + "=" * 50)
    print("✅ Examples complete!")
    print("\nNote: This is a demo. For production, use proper x402 SDK:")
    print("  - pip install x402-client (when available)")
    print("  - Or use the @x402/fetch npm package with Node.js")


if __name__ == "__main__":
    main()
