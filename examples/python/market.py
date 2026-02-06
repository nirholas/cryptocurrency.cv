#!/usr/bin/env python3
"""
Market Data API Examples - Python
Free Crypto News API - https://github.com/nirholas/free-crypto-news

Examples for all market data endpoints.
"""

import requests
import json
from typing import Optional, List

BASE_URL = "https://cryptocurrency.cv"


# =============================================================================
# GET /api/market/coins - All Coins Data
# =============================================================================

def get_coins(limit: int = 100, page: int = 1, 
              order: str = "market_cap_desc") -> dict:
    """
    Get list of all cryptocurrencies with market data.
    
    Args:
        limit: Number of coins (max 250)
        page: Page number
        order: Sort order (market_cap_desc, volume_desc, etc.)
    
    Returns:
        List of coins with market data
    """
    params = {"limit": limit, "page": page, "order": order}
    response = requests.get(f"{BASE_URL}/api/market/coins", params=params)
    return response.json()


# =============================================================================
# GET /api/market/ohlc/[coinId] - OHLC Data
# =============================================================================

def get_ohlc(coin_id: str, days: int = 30) -> dict:
    """
    Get OHLC (candlestick) data for a coin.
    
    Args:
        coin_id: Coin ID (e.g., "bitcoin", "ethereum")
        days: Number of days of data
    
    Returns:
        OHLC data for charting
    """
    params = {"days": days}
    response = requests.get(f"{BASE_URL}/api/market/ohlc/{coin_id}", params=params)
    return response.json()


# =============================================================================
# GET /api/market/history/[coinId] - Price History
# =============================================================================

def get_price_history(coin_id: str, days: int = 30) -> dict:
    """
    Get historical price data.
    
    Args:
        coin_id: Coin ID
        days: Number of days
    
    Returns:
        Historical price data
    """
    params = {"days": days}
    response = requests.get(f"{BASE_URL}/api/market/history/{coin_id}", params=params)
    return response.json()


# =============================================================================
# GET /api/market/exchanges - Exchange Data
# =============================================================================

def get_exchanges(limit: int = 100) -> dict:
    """
    Get list of cryptocurrency exchanges.
    
    Args:
        limit: Number of exchanges
    
    Returns:
        List of exchanges with volume data
    """
    response = requests.get(f"{BASE_URL}/api/market/exchanges", params={"limit": limit})
    return response.json()


def get_exchange(exchange_id: str) -> dict:
    """
    Get details for a specific exchange.
    
    Args:
        exchange_id: Exchange ID (e.g., "binance", "coinbase")
    
    Returns:
        Exchange details
    """
    response = requests.get(f"{BASE_URL}/api/market/exchanges/{exchange_id}")
    return response.json()


# =============================================================================
# GET /api/market/derivatives - Derivatives Data
# =============================================================================

def get_derivatives() -> dict:
    """
    Get derivatives market data (futures, perpetuals).
    
    Returns:
        Derivatives market data
    """
    response = requests.get(f"{BASE_URL}/api/market/derivatives")
    return response.json()


# =============================================================================
# GET /api/market/categories - Market Categories
# =============================================================================

def get_market_categories() -> dict:
    """
    Get market categories (DeFi, NFT, Layer 2, etc.)
    
    Returns:
        Categories with market data
    """
    response = requests.get(f"{BASE_URL}/api/market/categories")
    return response.json()


def get_category(category_id: str) -> dict:
    """
    Get coins in a specific category.
    
    Args:
        category_id: Category ID
    
    Returns:
        Coins in the category
    """
    response = requests.get(f"{BASE_URL}/api/market/categories/{category_id}")
    return response.json()


# =============================================================================
# GET /api/market/search - Search Markets
# =============================================================================

def search_markets(query: str) -> dict:
    """
    Search for coins, exchanges, categories.
    
    Args:
        query: Search query
    
    Returns:
        Search results
    """
    response = requests.get(f"{BASE_URL}/api/market/search", params={"q": query})
    return response.json()


# =============================================================================
# GET /api/market/defi - DeFi Market Data
# =============================================================================

def get_defi_market() -> dict:
    """
    Get DeFi-specific market data.
    
    Returns:
        DeFi market overview
    """
    response = requests.get(f"{BASE_URL}/api/market/defi")
    return response.json()


# =============================================================================
# GET /api/market/compare - Compare Coins
# =============================================================================

def compare_coins(coins: List[str]) -> dict:
    """
    Compare multiple coins.
    
    Args:
        coins: List of coin IDs to compare
    
    Returns:
        Comparison data
    """
    params = {"coins": ",".join(coins)}
    response = requests.get(f"{BASE_URL}/api/market/compare", params=params)
    return response.json()


# =============================================================================
# GET /api/market/snapshot/[coinId] - Coin Snapshot
# =============================================================================

def get_coin_snapshot(coin_id: str) -> dict:
    """
    Get detailed snapshot of a coin.
    
    Args:
        coin_id: Coin ID
    
    Returns:
        Detailed coin data
    """
    response = requests.get(f"{BASE_URL}/api/market/snapshot/{coin_id}")
    return response.json()


# =============================================================================
# GET /api/market/tickers/[coinId] - Coin Tickers
# =============================================================================

def get_coin_tickers(coin_id: str) -> dict:
    """
    Get exchange tickers for a coin.
    
    Args:
        coin_id: Coin ID
    
    Returns:
        Ticker data from all exchanges
    """
    response = requests.get(f"{BASE_URL}/api/market/tickers/{coin_id}")
    return response.json()


# =============================================================================
# GET /api/market/social/[coinId] - Social Stats
# =============================================================================

def get_social_stats(coin_id: str) -> dict:
    """
    Get social media stats for a coin.
    
    Args:
        coin_id: Coin ID
    
    Returns:
        Social media metrics
    """
    response = requests.get(f"{BASE_URL}/api/market/social/{coin_id}")
    return response.json()


# =============================================================================
# GET /api/market/orderbook - Order Book
# =============================================================================

def get_orderbook(symbol: str = "BTCUSDT", exchange: str = "binance") -> dict:
    """
    Get order book data.
    
    Args:
        symbol: Trading pair
        exchange: Exchange name
    
    Returns:
        Order book with bids and asks
    """
    params = {"symbol": symbol, "exchange": exchange}
    response = requests.get(f"{BASE_URL}/api/market/orderbook", params=params)
    return response.json()


# =============================================================================
# GET /api/fear-greed - Fear & Greed Index
# =============================================================================

def get_fear_greed() -> dict:
    """
    Get the Crypto Fear & Greed Index.
    
    Returns:
        Current fear/greed value and history
    """
    response = requests.get(f"{BASE_URL}/api/fear-greed")
    return response.json()


# =============================================================================
# COMPLETE EXAMPLES
# =============================================================================

if __name__ == "__main__":
    print("\n" + "="*60)
    print("FREE CRYPTO NEWS API - MARKET DATA EXAMPLES")
    print("="*60)
    
    # 1. Top Coins
    print("\n💰 1. Top 10 Coins by Market Cap")
    coins = get_coins(limit=10)
    for coin in coins[:10] if isinstance(coins, list) else coins.get("coins", [])[:10]:
        if isinstance(coin, dict):
            name = coin.get("name", "Unknown")
            price = coin.get("current_price", coin.get("price", "N/A"))
            print(f"   {name}: ${price}")
    
    # 2. OHLC Data
    print("\n📊 2. Bitcoin OHLC (7 days)")
    ohlc = get_ohlc("bitcoin", days=7)
    print(f"   Data points: {len(ohlc) if isinstance(ohlc, list) else 'See response'}")
    
    # 3. Exchanges
    print("\n🏦 3. Top Exchanges")
    exchanges = get_exchanges(limit=5)
    for ex in exchanges[:5] if isinstance(exchanges, list) else exchanges.get("exchanges", [])[:5]:
        if isinstance(ex, dict):
            print(f"   {ex.get('name', 'Unknown')}: Vol ${ex.get('trade_volume_24h_btc', 'N/A')}")
    
    # 4. Fear & Greed
    print("\n😱 4. Fear & Greed Index")
    fg = get_fear_greed()
    if isinstance(fg, dict):
        print(f"   Value: {fg.get('value', fg)}")
        print(f"   Classification: {fg.get('classification', 'N/A')}")
    
    # 5. Compare Coins
    print("\n⚖️ 5. Compare BTC vs ETH vs SOL")
    comparison = compare_coins(["bitcoin", "ethereum", "solana"])
    print(f"   Comparison: {json.dumps(comparison, indent=2)[:200]}...")
    
    # 6. DeFi Market
    print("\n🔗 6. DeFi Market Data")
    defi = get_defi_market()
    print(f"   DeFi TVL: {defi}")
    
    # 7. Derivatives
    print("\n📈 7. Derivatives Markets")
    derivs = get_derivatives()
    print(f"   Open Interest: {derivs}")
    
    # 8. Search
    print("\n🔍 8. Search for 'Layer 2'")
    results = search_markets("layer 2")
    print(f"   Results: {results}")
    
    print("\n" + "="*60)
    print("All market data examples completed!")
    print("="*60)
