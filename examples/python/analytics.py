#!/usr/bin/env python3
"""
Analytics API Examples - Python
Free Crypto News API - https://github.com/nirholas/free-crypto-news

Examples for analytics and insights endpoints.
"""

import requests
import json
from typing import Optional, List
from datetime import datetime, timedelta

BASE_URL = "https://cryptocurrency.cv"


# =============================================================================
# GET /api/analytics/overview - Analytics Overview
# =============================================================================

def get_analytics_overview() -> dict:
    """
    Get overall analytics dashboard data.
    
    Returns:
        Analytics overview with key metrics
    """
    response = requests.get(f"{BASE_URL}/api/analytics/overview")
    return response.json()


# =============================================================================
# GET /api/analytics/trends - Trend Analysis
# =============================================================================

def get_trends(period: str = "7d", category: Optional[str] = None) -> dict:
    """
    Get trending analysis data.
    
    Args:
        period: Time period (24h, 7d, 30d)
        category: Filter by category
    
    Returns:
        Trend analysis data
    """
    params = {"period": period}
    if category:
        params["category"] = category
    
    response = requests.get(f"{BASE_URL}/api/analytics/trends", params=params)
    return response.json()


# =============================================================================
# GET /api/analytics/coverage - Coverage Analysis
# =============================================================================

def get_coverage_analysis(asset: Optional[str] = None) -> dict:
    """
    Get news coverage analysis for assets.
    
    Args:
        asset: Filter by specific asset
    
    Returns:
        Coverage metrics and source analysis
    """
    params = {}
    if asset:
        params["asset"] = asset
    
    response = requests.get(f"{BASE_URL}/api/analytics/coverage", params=params)
    return response.json()


# =============================================================================
# GET /api/analytics/sentiment - Sentiment Trends
# =============================================================================

def get_sentiment_trends(asset: str = "BTC", period: str = "7d") -> dict:
    """
    Get sentiment trends over time.
    
    Args:
        asset: Asset symbol
        period: Time period
    
    Returns:
        Sentiment trend data
    """
    params = {"asset": asset, "period": period}
    response = requests.get(f"{BASE_URL}/api/analytics/sentiment", params=params)
    return response.json()


# =============================================================================
# GET /api/analytics/sources - Source Analytics
# =============================================================================

def get_source_analytics() -> dict:
    """
    Get analytics by news source.
    
    Returns:
        Source performance metrics
    """
    response = requests.get(f"{BASE_URL}/api/analytics/sources")
    return response.json()


# =============================================================================
# GET /api/analytics/volume - News Volume
# =============================================================================

def get_news_volume(period: str = "7d", granularity: str = "1h") -> dict:
    """
    Get news volume over time.
    
    Args:
        period: Time period
        granularity: Data granularity (1h, 6h, 1d)
    
    Returns:
        News volume time series
    """
    params = {"period": period, "granularity": granularity}
    response = requests.get(f"{BASE_URL}/api/analytics/volume", params=params)
    return response.json()


# =============================================================================
# GET /api/credibility - Credibility Scores
# =============================================================================

def get_credibility(source: Optional[str] = None) -> dict:
    """
    Get source credibility scores.
    
    Args:
        source: Filter by specific source
    
    Returns:
        Credibility scores and factors
    """
    params = {}
    if source:
        params["source"] = source
    
    response = requests.get(f"{BASE_URL}/api/credibility", params=params)
    return response.json()


# =============================================================================
# GET /api/impact - News Impact Analysis
# =============================================================================

def get_impact(period: str = "24h") -> dict:
    """
    Get news impact analysis (correlation with price).
    
    Args:
        period: Time period
    
    Returns:
        Impact analysis data
    """
    response = requests.get(f"{BASE_URL}/api/impact", params={"period": period})
    return response.json()


# =============================================================================
# GET /api/correlations - News-Price Correlations
# =============================================================================

def get_correlations(asset: str = "BTC", period: str = "30d") -> dict:
    """
    Get news-to-price correlations.
    
    Args:
        asset: Asset symbol
        period: Time period for correlation
    
    Returns:
        Correlation analysis
    """
    params = {"asset": asset, "period": period}
    response = requests.get(f"{BASE_URL}/api/correlations", params=params)
    return response.json()


# =============================================================================
# GET /api/heatmap - News Heatmap
# =============================================================================

def get_heatmap(period: str = "7d") -> dict:
    """
    Get news activity heatmap.
    
    Args:
        period: Time period
    
    Returns:
        Heatmap data by hour/day
    """
    response = requests.get(f"{BASE_URL}/api/heatmap", params={"period": period})
    return response.json()


# =============================================================================
# GET /api/velocity - News Velocity
# =============================================================================

def get_velocity(window: str = "1h") -> dict:
    """
    Get news velocity (rate of publication).
    
    Args:
        window: Time window
    
    Returns:
        Velocity metrics
    """
    response = requests.get(f"{BASE_URL}/api/velocity", params={"window": window})
    return response.json()


# =============================================================================
# GET /api/statistics - Overall Statistics
# =============================================================================

def get_statistics() -> dict:
    """
    Get overall API and news statistics.
    
    Returns:
        API statistics
    """
    response = requests.get(f"{BASE_URL}/api/statistics")
    return response.json()


# =============================================================================
# GET /api/reports - Generated Reports
# =============================================================================

def get_reports(type: str = "daily") -> dict:
    """
    Get pre-generated reports.
    
    Args:
        type: Report type (daily, weekly, monthly)
    
    Returns:
        Report data
    """
    response = requests.get(f"{BASE_URL}/api/reports", params={"type": type})
    return response.json()


def get_report(report_id: str) -> dict:
    """
    Get specific report by ID.
    
    Args:
        report_id: Report ID
    
    Returns:
        Report data
    """
    response = requests.get(f"{BASE_URL}/api/reports/{report_id}")
    return response.json()


# =============================================================================
# GET /api/timeline - News Timeline
# =============================================================================

def get_timeline(asset: Optional[str] = None, 
                 start: Optional[str] = None,
                 end: Optional[str] = None) -> dict:
    """
    Get news timeline for an asset.
    
    Args:
        asset: Asset symbol
        start: Start date (YYYY-MM-DD)
        end: End date (YYYY-MM-DD)
    
    Returns:
        Timeline of events
    """
    params = {}
    if asset:
        params["asset"] = asset
    if start:
        params["start"] = start
    if end:
        params["end"] = end
    
    response = requests.get(f"{BASE_URL}/api/timeline", params=params)
    return response.json()


# =============================================================================
# COMPLETE EXAMPLES
# =============================================================================

if __name__ == "__main__":
    print("\n" + "="*60)
    print("FREE CRYPTO NEWS API - ANALYTICS EXAMPLES")
    print("="*60)
    
    # 1. Overview
    print("\n📊 1. Analytics Overview")
    overview = get_analytics_overview()
    print(f"   Overview: {overview}")
    
    # 2. Trends
    print("\n📈 2. 7-Day Trends")
    trends = get_trends(period="7d")
    print(f"   Trends: {trends}")
    
    # 3. Coverage
    print("\n📰 3. BTC Coverage Analysis")
    coverage = get_coverage_analysis(asset="BTC")
    print(f"   Coverage: {coverage}")
    
    # 4. Sentiment Trends
    print("\n😀 4. Sentiment Trends")
    sentiment = get_sentiment_trends(asset="BTC", period="7d")
    print(f"   Sentiment: {sentiment}")
    
    # 5. Credibility
    print("\n✅ 5. Source Credibility")
    cred = get_credibility()
    print(f"   Credibility: {cred}")
    
    # 6. Impact
    print("\n💥 6. News Impact")
    impact = get_impact(period="24h")
    print(f"   Impact: {impact}")
    
    # 7. Correlations
    print("\n🔗 7. News-Price Correlations")
    corr = get_correlations(asset="BTC", period="30d")
    print(f"   Correlations: {corr}")
    
    # 8. Heatmap
    print("\n🗓️ 8. News Activity Heatmap")
    heatmap = get_heatmap()
    print(f"   Heatmap: {heatmap}")
    
    # 9. Velocity
    print("\n⚡ 9. News Velocity")
    velocity = get_velocity()
    print(f"   Velocity: {velocity}")
    
    # 10. Statistics
    print("\n📉 10. Overall Statistics")
    stats = get_statistics()
    print(f"   Stats: {stats}")
    
    print("\n" + "="*60)
    print("All analytics examples completed!")
    print("="*60)
