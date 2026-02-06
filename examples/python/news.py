#!/usr/bin/env python3
"""
News API Examples - Python
Free Crypto News API - https://github.com/nirholas/free-crypto-news

Examples for all news-related endpoints.
"""

import requests
import json
from typing import Optional, List
from datetime import datetime, timedelta

BASE_URL = "https://cryptocurrency.cv"


# =============================================================================
# GET /api/news - Main News Feed
# =============================================================================

def get_news(limit: int = 20, category: Optional[str] = None, 
             source: Optional[str] = None) -> dict:
    """
    Fetch aggregated news from all sources.
    
    Args:
        limit: Number of articles (default: 20, max: 100)
        category: Filter by category (bitcoin, ethereum, defi, nft, etc.)
        source: Filter by source (coindesk, cointelegraph, etc.)
    
    Returns:
        List of news articles
    """
    params = {"limit": limit}
    if category:
        params["category"] = category
    if source:
        params["source"] = source
    
    response = requests.get(f"{BASE_URL}/api/news", params=params)
    return response.json()


# Example usage
if __name__ == "__main__":
    # Basic fetch
    news = get_news(limit=5)
    print("=== Latest News ===")
    for article in news.get("articles", news)[:5]:
        print(f"- {article.get('title', 'No title')}")
    
    # Filter by category
    bitcoin_news = get_news(limit=5, category="bitcoin")
    print("\n=== Bitcoin News ===")
    for article in bitcoin_news.get("articles", bitcoin_news)[:5]:
        print(f"- {article.get('title', 'No title')}")


# =============================================================================
# GET /api/news/international - International News
# =============================================================================

def get_international_news(lang: Optional[str] = None, 
                           translate: bool = True) -> dict:
    """
    Fetch news from 75 international sources in 18 languages.
    
    Args:
        lang: Language code (ko, zh, ja, es, de, fr, etc.)
        translate: Auto-translate to English (default: True)
    
    Returns:
        International news articles with optional translation
    """
    params = {"translate": str(translate).lower()}
    if lang:
        params["lang"] = lang
    
    response = requests.get(f"{BASE_URL}/api/news/international", params=params)
    return response.json()


# =============================================================================
# POST /api/news/extract - Extract Article Content
# =============================================================================

def extract_article(url: str) -> dict:
    """
    Extract full article content from any URL.
    
    Args:
        url: Article URL to extract content from
    
    Returns:
        Extracted article with title, content, images, etc.
    """
    response = requests.post(
        f"{BASE_URL}/api/news/extract",
        json={"url": url},
        headers={"Content-Type": "application/json"}
    )
    return response.json()


# =============================================================================
# GET /api/news/categories - Available Categories
# =============================================================================

def get_categories() -> dict:
    """
    Get all available news categories with article counts.
    
    Returns:
        List of categories with metadata
    """
    response = requests.get(f"{BASE_URL}/api/news/categories")
    return response.json()


# =============================================================================
# GET /api/bitcoin - Bitcoin-specific News
# =============================================================================

def get_bitcoin_news(limit: int = 20) -> dict:
    """
    Get Bitcoin-specific news and analysis.
    
    Args:
        limit: Number of articles
    
    Returns:
        Bitcoin news articles
    """
    response = requests.get(f"{BASE_URL}/api/bitcoin", params={"limit": limit})
    return response.json()


# =============================================================================
# GET /api/defi - DeFi News
# =============================================================================

def get_defi_news(limit: int = 20) -> dict:
    """
    Get DeFi protocol news and updates.
    
    Args:
        limit: Number of articles
    
    Returns:
        DeFi news articles
    """
    response = requests.get(f"{BASE_URL}/api/defi", params={"limit": limit})
    return response.json()


# =============================================================================
# GET /api/breaking - Breaking News
# =============================================================================

def get_breaking_news() -> dict:
    """
    Get breaking/urgent news from the last hour.
    
    Returns:
        Breaking news articles
    """
    response = requests.get(f"{BASE_URL}/api/breaking")
    return response.json()


# =============================================================================
# GET /api/search - Search News
# =============================================================================

def search_news(query: str, limit: int = 20, 
                from_date: Optional[str] = None,
                to_date: Optional[str] = None) -> dict:
    """
    Full-text search across all news articles.
    
    Args:
        query: Search query
        limit: Number of results
        from_date: Start date (YYYY-MM-DD)
        to_date: End date (YYYY-MM-DD)
    
    Returns:
        Search results
    """
    params = {"q": query, "limit": limit}
    if from_date:
        params["from"] = from_date
    if to_date:
        params["to"] = to_date
    
    response = requests.get(f"{BASE_URL}/api/search", params=params)
    return response.json()


# =============================================================================
# GET /api/trending - Trending Topics
# =============================================================================

def get_trending(limit: int = 10) -> dict:
    """
    Get trending topics and keywords.
    
    Args:
        limit: Number of trending items
    
    Returns:
        Trending topics with scores
    """
    response = requests.get(f"{BASE_URL}/api/trending", params={"limit": limit})
    return response.json()


# =============================================================================
# GET /api/sources - Available Sources
# =============================================================================

def get_sources() -> dict:
    """
    Get all available news sources with metadata.
    
    Returns:
        List of sources with article counts
    """
    response = requests.get(f"{BASE_URL}/api/sources")
    return response.json()


# =============================================================================
# GET /api/digest - AI Daily Digest
# =============================================================================

def get_digest(date: Optional[str] = None) -> dict:
    """
    Get AI-generated daily news digest.
    
    Args:
        date: Date for digest (YYYY-MM-DD), defaults to today
    
    Returns:
        AI-summarized daily digest
    """
    params = {}
    if date:
        params["date"] = date
    
    response = requests.get(f"{BASE_URL}/api/digest", params=params)
    return response.json()


# =============================================================================
# GET /api/tags - Browse by Tags
# =============================================================================

def get_tags() -> dict:
    """
    Get all available tags/topics.
    
    Returns:
        List of tags with article counts
    """
    response = requests.get(f"{BASE_URL}/api/tags")
    return response.json()


def get_tag_articles(slug: str, limit: int = 20) -> dict:
    """
    Get articles for a specific tag.
    
    Args:
        slug: Tag slug (e.g., "bitcoin", "ethereum")
        limit: Number of articles
    
    Returns:
        Articles for the tag
    """
    response = requests.get(f"{BASE_URL}/api/tags/{slug}", params={"limit": limit})
    return response.json()


# =============================================================================
# COMPLETE EXAMPLES
# =============================================================================

if __name__ == "__main__":
    print("\n" + "="*60)
    print("FREE CRYPTO NEWS API - PYTHON EXAMPLES")
    print("="*60)
    
    # 1. Basic News
    print("\n📰 1. Latest News (5 articles)")
    news = get_news(limit=5)
    for i, article in enumerate(news.get("articles", news)[:5], 1):
        print(f"   {i}. {article.get('title', 'N/A')[:60]}...")
    
    # 2. Category Filter
    print("\n₿ 2. Bitcoin News")
    btc = get_bitcoin_news(limit=3)
    for article in btc.get("articles", btc)[:3]:
        print(f"   - {article.get('title', 'N/A')[:60]}...")
    
    # 3. Search
    print("\n🔍 3. Search 'Ethereum ETF'")
    results = search_news("Ethereum ETF", limit=3)
    for article in results.get("articles", results)[:3]:
        print(f"   - {article.get('title', 'N/A')[:60]}...")
    
    # 4. Trending
    print("\n🔥 4. Trending Topics")
    trending = get_trending(limit=5)
    for topic in trending.get("topics", trending)[:5]:
        if isinstance(topic, dict):
            print(f"   - {topic.get('keyword', topic)}")
        else:
            print(f"   - {topic}")
    
    # 5. International
    print("\n🌏 5. Korean News (translated)")
    intl = get_international_news(lang="ko")
    for article in intl.get("articles", intl)[:3]:
        print(f"   - {article.get('title', 'N/A')[:60]}...")
    
    # 6. Breaking
    print("\n⚡ 6. Breaking News")
    breaking = get_breaking_news()
    for article in breaking.get("articles", breaking)[:3]:
        print(f"   - {article.get('title', 'N/A')[:60]}...")
    
    # 7. Digest
    print("\n📋 7. Daily Digest")
    digest = get_digest()
    if isinstance(digest, dict) and "summary" in digest:
        print(f"   {digest['summary'][:200]}...")
    else:
        print("   Digest available via API")
    
    print("\n" + "="*60)
    print("All examples completed! See source code for more options.")
    print("="*60)
