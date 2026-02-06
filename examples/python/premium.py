#!/usr/bin/env python3
"""
Premium API Examples - Python
Free Crypto News API - https://github.com/nirholas/free-crypto-news

Examples for premium/paid tier endpoints.
"""

import requests
import json
from typing import Optional, List

BASE_URL = "https://cryptocurrency.cv"


# =============================================================================
# GET /api/premium - Premium Status
# =============================================================================

def get_premium_status(api_key: str) -> dict:
    """
    Check premium subscription status.
    
    Args:
        api_key: Your API key
    
    Returns:
        Premium status and limits
    """
    headers = {"X-API-Key": api_key}
    response = requests.get(f"{BASE_URL}/api/premium", headers=headers)
    return response.json()


# =============================================================================
# GET /api/premium/news - Premium News Feed
# =============================================================================

def get_premium_news(api_key: str, limit: int = 50, 
                     sources: Optional[List[str]] = None) -> dict:
    """
    Get premium news feed with exclusive sources.
    
    Args:
        api_key: Your API key
        limit: Number of articles (up to 500)
        sources: List of premium sources
    
    Returns:
        Premium news articles
    """
    headers = {"X-API-Key": api_key}
    params = {"limit": limit}
    if sources:
        params["sources"] = ",".join(sources)
    
    response = requests.get(f"{BASE_URL}/api/premium/news", 
                           headers=headers, params=params)
    return response.json()


# =============================================================================
# GET /api/premium/analytics - Advanced Analytics
# =============================================================================

def get_premium_analytics(api_key: str, report: str = "full") -> dict:
    """
    Get advanced analytics reports.
    
    Args:
        api_key: Your API key
        report: Report type (full, sentiment, market, social)
    
    Returns:
        Advanced analytics data
    """
    headers = {"X-API-Key": api_key}
    response = requests.get(f"{BASE_URL}/api/premium/analytics",
                           headers=headers, params={"report": report})
    return response.json()


# =============================================================================
# GET /api/premium/ai - Premium AI Features
# =============================================================================

def get_premium_ai(api_key: str, action: str, **kwargs) -> dict:
    """
    Access premium AI features.
    
    Args:
        api_key: Your API key
        action: AI action (analysis, prediction, summary)
        **kwargs: Additional parameters
    
    Returns:
        AI analysis result
    """
    headers = {"X-API-Key": api_key}
    params = {"action": action, **kwargs}
    response = requests.get(f"{BASE_URL}/api/premium/ai",
                           headers=headers, params=params)
    return response.json()


# =============================================================================
# POST /api/premium/webhooks - Configure Webhooks
# =============================================================================

def create_webhook(api_key: str, url: str, events: List[str],
                   secret: Optional[str] = None) -> dict:
    """
    Configure webhook for real-time updates.
    
    Args:
        api_key: Your API key
        url: Webhook URL
        events: List of events to subscribe to
        secret: Webhook secret for verification
    
    Returns:
        Webhook configuration
    """
    headers = {
        "X-API-Key": api_key,
        "Content-Type": "application/json"
    }
    payload = {
        "url": url,
        "events": events
    }
    if secret:
        payload["secret"] = secret
    
    response = requests.post(f"{BASE_URL}/api/premium/webhooks",
                            headers=headers, json=payload)
    return response.json()


# =============================================================================
# GET /api/premium/bulk - Bulk Data Export
# =============================================================================

def bulk_export(api_key: str, start_date: str, end_date: str,
                format: str = "json") -> dict:
    """
    Export bulk historical data.
    
    Args:
        api_key: Your API key
        start_date: Start date (YYYY-MM-DD)
        end_date: End date (YYYY-MM-DD)
        format: Export format (json, csv, parquet)
    
    Returns:
        Download URL or data
    """
    headers = {"X-API-Key": api_key}
    params = {
        "start": start_date,
        "end": end_date,
        "format": format
    }
    response = requests.get(f"{BASE_URL}/api/premium/bulk",
                           headers=headers, params=params)
    return response.json()


# =============================================================================
# GET /api/premium/historical - Historical Data
# =============================================================================

def get_historical(api_key: str, asset: str, start: str, end: str,
                   granularity: str = "1h") -> dict:
    """
    Get historical data with fine granularity.
    
    Args:
        api_key: Your API key
        asset: Asset symbol
        start: Start date
        end: End date
        granularity: Data granularity (1m, 5m, 1h, 1d)
    
    Returns:
        Historical data
    """
    headers = {"X-API-Key": api_key}
    params = {
        "asset": asset,
        "start": start,
        "end": end,
        "granularity": granularity
    }
    response = requests.get(f"{BASE_URL}/api/premium/historical",
                           headers=headers, params=params)
    return response.json()


# =============================================================================
# GET /api/premium/research - Research Reports
# =============================================================================

def get_research(api_key: str, topic: Optional[str] = None,
                 limit: int = 10) -> dict:
    """
    Get professional research reports.
    
    Args:
        api_key: Your API key
        topic: Filter by topic
        limit: Number of reports
    
    Returns:
        Research reports
    """
    headers = {"X-API-Key": api_key}
    params = {"limit": limit}
    if topic:
        params["topic"] = topic
    
    response = requests.get(f"{BASE_URL}/api/premium/research",
                           headers=headers, params=params)
    return response.json()


# =============================================================================
# GET /api/premium/signals - Premium Trading Signals
# =============================================================================

def get_premium_signals(api_key: str, asset: Optional[str] = None) -> dict:
    """
    Get premium trading signals.
    
    Args:
        api_key: Your API key
        asset: Filter by asset
    
    Returns:
        Premium trading signals
    """
    headers = {"X-API-Key": api_key}
    params = {}
    if asset:
        params["asset"] = asset
    
    response = requests.get(f"{BASE_URL}/api/premium/signals",
                           headers=headers, params=params)
    return response.json()


# =============================================================================
# GET /api/premium/predictions - AI Predictions
# =============================================================================

def get_predictions(api_key: str, asset: str = "BTC", 
                    horizon: str = "24h") -> dict:
    """
    Get AI price predictions.
    
    Args:
        api_key: Your API key
        asset: Asset symbol
        horizon: Prediction horizon (1h, 24h, 7d)
    
    Returns:
        Price prediction
    """
    headers = {"X-API-Key": api_key}
    params = {"asset": asset, "horizon": horizon}
    response = requests.get(f"{BASE_URL}/api/premium/predictions",
                           headers=headers, params=params)
    return response.json()


# =============================================================================
# POST /api/premium/custom - Custom Analysis
# =============================================================================

def custom_analysis(api_key: str, query: str, 
                    data: Optional[dict] = None) -> dict:
    """
    Request custom AI analysis.
    
    Args:
        api_key: Your API key
        query: Analysis query
        data: Custom data to analyze
    
    Returns:
        Custom analysis result
    """
    headers = {
        "X-API-Key": api_key,
        "Content-Type": "application/json"
    }
    payload = {"query": query}
    if data:
        payload["data"] = data
    
    response = requests.post(f"{BASE_URL}/api/premium/custom",
                            headers=headers, json=payload)
    return response.json()


# =============================================================================
# GET /api/premium/realtime - Real-time Stream Access
# =============================================================================

def get_realtime_token(api_key: str) -> dict:
    """
    Get token for real-time WebSocket stream.
    
    Args:
        api_key: Your API key
    
    Returns:
        WebSocket connection token
    """
    headers = {"X-API-Key": api_key}
    response = requests.get(f"{BASE_URL}/api/premium/realtime",
                           headers=headers)
    return response.json()


# =============================================================================
# COMPLETE EXAMPLES
# =============================================================================

if __name__ == "__main__":
    print("\n" + "="*60)
    print("FREE CRYPTO NEWS API - PREMIUM EXAMPLES")
    print("="*60)
    
    API_KEY = "your-premium-api-key"
    
    print("\n⭐ These endpoints require a Premium subscription.")
    
    # 1. Check Status
    print("\n📊 1. Premium Status")
    status = get_premium_status(API_KEY)
    print(f"   Status: {status}")
    
    # 2. Premium News (500 articles)
    print("\n📰 2. Premium News Feed")
    news = get_premium_news(API_KEY, limit=500)
    print(f"   Articles: {len(news.get('articles', []))} available")
    
    # 3. Advanced Analytics
    print("\n📈 3. Advanced Analytics")
    analytics = get_premium_analytics(API_KEY, report="full")
    print(f"   Analytics: {analytics}")
    
    # 4. Premium AI
    print("\n🤖 4. Premium AI Analysis")
    ai = get_premium_ai(API_KEY, action="analysis", asset="BTC")
    print(f"   AI: {ai}")
    
    # 5. Configure Webhook
    print("\n🔗 5. Configure Webhook")
    webhook = create_webhook(
        API_KEY,
        url="https://your-server.com/webhook",
        events=["breaking_news", "whale_alert", "price_alert"],
        secret="your-webhook-secret"
    )
    print(f"   Webhook: {webhook}")
    
    # 6. Bulk Export
    print("\n📦 6. Bulk Export")
    bulk = bulk_export(API_KEY, "2024-01-01", "2024-06-30", format="json")
    print(f"   Export: {bulk}")
    
    # 7. Historical Data
    print("\n📜 7. Historical Data (BTC, 1-minute)")
    historical = get_historical(
        API_KEY, 
        asset="BTC",
        start="2024-01-01",
        end="2024-01-07",
        granularity="1m"
    )
    print(f"   Data points: {len(historical.get('data', []))}")
    
    # 8. Research Reports
    print("\n📚 8. Research Reports")
    research = get_research(API_KEY, topic="DeFi", limit=5)
    print(f"   Reports: {research}")
    
    # 9. Premium Signals
    print("\n📡 9. Premium Trading Signals")
    signals = get_premium_signals(API_KEY, asset="BTC")
    print(f"   Signals: {signals}")
    
    # 10. AI Predictions
    print("\n🔮 10. AI Predictions (24h)")
    predictions = get_predictions(API_KEY, asset="BTC", horizon="24h")
    print(f"   Prediction: {predictions}")
    
    # 11. Custom Analysis
    print("\n🎯 11. Custom Analysis")
    custom = custom_analysis(
        API_KEY,
        query="Analyze the correlation between Bitcoin news sentiment and price movement over the last month",
        data={"include_charts": True}
    )
    print(f"   Custom: {custom}")
    
    # 12. Real-time Token
    print("\n⚡ 12. Real-time WebSocket Token")
    token = get_realtime_token(API_KEY)
    print(f"   Token: {token}")
    
    print("\n" + "="*60)
    print("Premium examples completed!")
    print("="*60)
