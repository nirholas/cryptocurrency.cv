#!/usr/bin/env python3
"""
Portfolio & Alerts API Examples - Python
Free Crypto News API - https://github.com/nirholas/free-crypto-news

Examples for portfolio management and alert endpoints.
"""

import requests
import json
from typing import Optional, List

BASE_URL = "https://cryptocurrency.cv"


# =============================================================================
# GET /api/portfolio - Get Portfolio
# =============================================================================

def get_portfolio(api_key: str) -> dict:
    """
    Get user's portfolio.
    
    Args:
        api_key: Your API key
    
    Returns:
        Portfolio holdings and value
    """
    headers = {"X-API-Key": api_key}
    response = requests.get(f"{BASE_URL}/api/portfolio", headers=headers)
    return response.json()


# =============================================================================
# POST /api/portfolio - Create/Update Portfolio
# =============================================================================

def create_portfolio(api_key: str, name: str, holdings: List[dict]) -> dict:
    """
    Create or update portfolio.
    
    Args:
        api_key: Your API key
        name: Portfolio name
        holdings: List of holdings [{symbol, amount, price}]
    
    Returns:
        Created portfolio
    """
    headers = {
        "X-API-Key": api_key,
        "Content-Type": "application/json"
    }
    payload = {
        "name": name,
        "holdings": holdings
    }
    response = requests.post(f"{BASE_URL}/api/portfolio", 
                            headers=headers, json=payload)
    return response.json()


# =============================================================================
# POST /api/portfolio/add - Add Holding
# =============================================================================

def add_holding(api_key: str, symbol: str, amount: float, price: float) -> dict:
    """
    Add a holding to portfolio.
    
    Args:
        api_key: Your API key
        symbol: Asset symbol (BTC, ETH, etc.)
        amount: Amount of asset
        price: Purchase price
    
    Returns:
        Updated portfolio
    """
    headers = {
        "X-API-Key": api_key,
        "Content-Type": "application/json"
    }
    payload = {
        "symbol": symbol,
        "amount": amount,
        "price": price
    }
    response = requests.post(f"{BASE_URL}/api/portfolio/add",
                            headers=headers, json=payload)
    return response.json()


# =============================================================================
# GET /api/portfolio/performance - Portfolio Performance
# =============================================================================

def get_portfolio_performance(api_key: str, period: str = "30d") -> dict:
    """
    Get portfolio performance over time.
    
    Args:
        api_key: Your API key
        period: Time period (7d, 30d, 90d, 1y)
    
    Returns:
        Performance metrics
    """
    headers = {"X-API-Key": api_key}
    params = {"period": period}
    response = requests.get(f"{BASE_URL}/api/portfolio/performance",
                           headers=headers, params=params)
    return response.json()


# =============================================================================
# GET /api/portfolio/news - Portfolio-Related News
# =============================================================================

def get_portfolio_news(api_key: str, limit: int = 20) -> dict:
    """
    Get news related to portfolio holdings.
    
    Args:
        api_key: Your API key
        limit: Number of articles
    
    Returns:
        News for portfolio assets
    """
    headers = {"X-API-Key": api_key}
    params = {"limit": limit}
    response = requests.get(f"{BASE_URL}/api/portfolio/news",
                           headers=headers, params=params)
    return response.json()


# =============================================================================
# GET /api/alerts - Get Alerts
# =============================================================================

def get_alerts(api_key: str) -> dict:
    """
    Get all configured alerts.
    
    Args:
        api_key: Your API key
    
    Returns:
        List of alerts
    """
    headers = {"X-API-Key": api_key}
    response = requests.get(f"{BASE_URL}/api/alerts", headers=headers)
    return response.json()


# =============================================================================
# POST /api/alerts - Create Alert
# =============================================================================

def create_alert(api_key: str, type: str, asset: str, 
                 condition: str, value: float,
                 notification: str = "email") -> dict:
    """
    Create a new alert.
    
    Args:
        api_key: Your API key
        type: Alert type (price, sentiment, volume, news)
        asset: Asset symbol
        condition: Condition (above, below, change)
        value: Trigger value
        notification: Notification method (email, webhook, push)
    
    Returns:
        Created alert
    """
    headers = {
        "X-API-Key": api_key,
        "Content-Type": "application/json"
    }
    payload = {
        "type": type,
        "asset": asset,
        "condition": condition,
        "value": value,
        "notification": notification
    }
    response = requests.post(f"{BASE_URL}/api/alerts",
                            headers=headers, json=payload)
    return response.json()


# =============================================================================
# DELETE /api/alerts/[id] - Delete Alert
# =============================================================================

def delete_alert(api_key: str, alert_id: str) -> dict:
    """
    Delete an alert.
    
    Args:
        api_key: Your API key
        alert_id: Alert ID
    
    Returns:
        Deletion result
    """
    headers = {"X-API-Key": api_key}
    response = requests.delete(f"{BASE_URL}/api/alerts/{alert_id}",
                              headers=headers)
    return response.json()


# =============================================================================
# GET /api/watchlist - Get Watchlist
# =============================================================================

def get_watchlist(api_key: str) -> dict:
    """
    Get user's watchlist.
    
    Args:
        api_key: Your API key
    
    Returns:
        Watchlist assets
    """
    headers = {"X-API-Key": api_key}
    response = requests.get(f"{BASE_URL}/api/watchlist", headers=headers)
    return response.json()


# =============================================================================
# POST /api/watchlist - Add to Watchlist
# =============================================================================

def add_to_watchlist(api_key: str, symbol: str) -> dict:
    """
    Add asset to watchlist.
    
    Args:
        api_key: Your API key
        symbol: Asset symbol
    
    Returns:
        Updated watchlist
    """
    headers = {
        "X-API-Key": api_key,
        "Content-Type": "application/json"
    }
    response = requests.post(f"{BASE_URL}/api/watchlist",
                            headers=headers, json={"symbol": symbol})
    return response.json()


# =============================================================================
# DELETE /api/watchlist/[symbol] - Remove from Watchlist
# =============================================================================

def remove_from_watchlist(api_key: str, symbol: str) -> dict:
    """
    Remove asset from watchlist.
    
    Args:
        api_key: Your API key
        symbol: Asset symbol
    
    Returns:
        Updated watchlist
    """
    headers = {"X-API-Key": api_key}
    response = requests.delete(f"{BASE_URL}/api/watchlist/{symbol}",
                              headers=headers)
    return response.json()


# =============================================================================
# GET /api/notifications - Get Notifications
# =============================================================================

def get_notifications(api_key: str, unread_only: bool = False) -> dict:
    """
    Get user notifications.
    
    Args:
        api_key: Your API key
        unread_only: Only unread notifications
    
    Returns:
        Notifications list
    """
    headers = {"X-API-Key": api_key}
    params = {"unread": str(unread_only).lower()}
    response = requests.get(f"{BASE_URL}/api/notifications",
                           headers=headers, params=params)
    return response.json()


# =============================================================================
# POST /api/notifications/read - Mark as Read
# =============================================================================

def mark_notifications_read(api_key: str, notification_ids: List[str]) -> dict:
    """
    Mark notifications as read.
    
    Args:
        api_key: Your API key
        notification_ids: List of notification IDs
    
    Returns:
        Result
    """
    headers = {
        "X-API-Key": api_key,
        "Content-Type": "application/json"
    }
    response = requests.post(f"{BASE_URL}/api/notifications/read",
                            headers=headers, json={"ids": notification_ids})
    return response.json()


# =============================================================================
# GET /api/preferences - Get Preferences
# =============================================================================

def get_preferences(api_key: str) -> dict:
    """
    Get user preferences.
    
    Args:
        api_key: Your API key
    
    Returns:
        User preferences
    """
    headers = {"X-API-Key": api_key}
    response = requests.get(f"{BASE_URL}/api/preferences", headers=headers)
    return response.json()


# =============================================================================
# PUT /api/preferences - Update Preferences
# =============================================================================

def update_preferences(api_key: str, preferences: dict) -> dict:
    """
    Update user preferences.
    
    Args:
        api_key: Your API key
        preferences: Preference settings
    
    Returns:
        Updated preferences
    """
    headers = {
        "X-API-Key": api_key,
        "Content-Type": "application/json"
    }
    response = requests.put(f"{BASE_URL}/api/preferences",
                           headers=headers, json=preferences)
    return response.json()


# =============================================================================
# COMPLETE EXAMPLES
# =============================================================================

if __name__ == "__main__":
    print("\n" + "="*60)
    print("FREE CRYPTO NEWS API - PORTFOLIO & ALERTS EXAMPLES")
    print("="*60)
    
    # Note: These require an API key
    API_KEY = "your-api-key-here"
    
    print("\n⚠️ These endpoints require authentication.")
    print("   Replace 'your-api-key-here' with your actual API key.")
    
    # Example 1: Create Portfolio
    print("\n📊 1. Create Portfolio")
    portfolio = create_portfolio(
        api_key=API_KEY,
        name="My Crypto Portfolio",
        holdings=[
            {"symbol": "BTC", "amount": 0.5, "price": 45000},
            {"symbol": "ETH", "amount": 5.0, "price": 2500},
            {"symbol": "SOL", "amount": 50, "price": 100}
        ]
    )
    print(f"   Portfolio: {portfolio}")
    
    # Example 2: Create Price Alert
    print("\n🔔 2. Create Price Alert")
    alert = create_alert(
        api_key=API_KEY,
        type="price",
        asset="BTC",
        condition="above",
        value=100000,
        notification="email"
    )
    print(f"   Alert: {alert}")
    
    # Example 3: Create Sentiment Alert
    print("\n📈 3. Create Sentiment Alert")
    sentiment_alert = create_alert(
        api_key=API_KEY,
        type="sentiment",
        asset="ETH",
        condition="below",
        value=0.3,  # Sentiment drops below 0.3
        notification="webhook"
    )
    print(f"   Sentiment Alert: {sentiment_alert}")
    
    # Example 4: Add to Watchlist
    print("\n👀 4. Add to Watchlist")
    watchlist = add_to_watchlist(API_KEY, "AVAX")
    print(f"   Watchlist: {watchlist}")
    
    # Example 5: Get Portfolio News
    print("\n📰 5. Get Portfolio News")
    news = get_portfolio_news(API_KEY, limit=5)
    print(f"   News: {news}")
    
    # Example 6: Update Preferences
    print("\n⚙️ 6. Update Preferences")
    prefs = update_preferences(API_KEY, {
        "language": "en",
        "timezone": "UTC",
        "notifications": {
            "email": True,
            "push": True,
            "digest": "daily"
        },
        "categories": ["bitcoin", "ethereum", "defi"]
    })
    print(f"   Preferences: {prefs}")
    
    print("\n" + "="*60)
    print("Portfolio & alerts examples completed!")
    print("="*60)
