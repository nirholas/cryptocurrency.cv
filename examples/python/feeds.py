#!/usr/bin/env python3
"""
Feeds & Export API Examples - Python
Free Crypto News API - https://github.com/nirholas/free-crypto-news

Examples for RSS feeds, exports, and data format endpoints.
"""

import requests
import json
from typing import Optional, List

BASE_URL = "https://cryptocurrency.cv"


# =============================================================================
# GET /api/rss - RSS Feed (XML)
# =============================================================================

def get_rss_feed(category: Optional[str] = None, limit: int = 50) -> str:
    """
    Get RSS feed in XML format.
    
    Args:
        category: Filter by category
        limit: Number of items
    
    Returns:
        RSS XML feed
    """
    params = {"limit": limit}
    if category:
        params["category"] = category
    
    response = requests.get(f"{BASE_URL}/api/rss", params=params)
    return response.text


# =============================================================================
# GET /api/rss.json - RSS Feed (JSON)
# =============================================================================

def get_rss_json(category: Optional[str] = None, limit: int = 50) -> dict:
    """
    Get RSS feed in JSON format.
    
    Args:
        category: Filter by category
        limit: Number of items
    
    Returns:
        RSS JSON feed
    """
    params = {"limit": limit}
    if category:
        params["category"] = category
    
    response = requests.get(f"{BASE_URL}/api/rss.json", params=params)
    return response.json()


# =============================================================================
# GET /api/feed/atom - Atom Feed
# =============================================================================

def get_atom_feed(category: Optional[str] = None, limit: int = 50) -> str:
    """
    Get Atom feed.
    
    Args:
        category: Filter by category
        limit: Number of items
    
    Returns:
        Atom XML feed
    """
    params = {"limit": limit}
    if category:
        params["category"] = category
    
    response = requests.get(f"{BASE_URL}/api/feed/atom", params=params)
    return response.text


# =============================================================================
# GET /api/feed/json - JSON Feed
# =============================================================================

def get_json_feed(category: Optional[str] = None, limit: int = 50) -> dict:
    """
    Get JSON Feed format.
    
    Args:
        category: Filter by category
        limit: Number of items
    
    Returns:
        JSON Feed
    """
    params = {"limit": limit}
    if category:
        params["category"] = category
    
    response = requests.get(f"{BASE_URL}/api/feed/json", params=params)
    return response.json()


# =============================================================================
# GET /api/export - Export Data
# =============================================================================

def export_data(format: str = "json", start: Optional[str] = None,
                end: Optional[str] = None, category: Optional[str] = None) -> dict:
    """
    Export news data in various formats.
    
    Args:
        format: Export format (json, csv, xml, parquet)
        start: Start date (YYYY-MM-DD)
        end: End date (YYYY-MM-DD)
        category: Filter by category
    
    Returns:
        Exported data or download URL
    """
    params = {"format": format}
    if start:
        params["start"] = start
    if end:
        params["end"] = end
    if category:
        params["category"] = category
    
    response = requests.get(f"{BASE_URL}/api/export", params=params)
    return response.json() if format == "json" else {"url": response.url}


# =============================================================================
# GET /api/export/csv - CSV Export
# =============================================================================

def export_csv(limit: int = 100, category: Optional[str] = None) -> str:
    """
    Export news data as CSV.
    
    Args:
        limit: Number of records
        category: Filter by category
    
    Returns:
        CSV data
    """
    params = {"limit": limit}
    if category:
        params["category"] = category
    
    response = requests.get(f"{BASE_URL}/api/export/csv", params=params)
    return response.text


# =============================================================================
# GET /api/export/json - JSON Export
# =============================================================================

def export_json(limit: int = 100, category: Optional[str] = None,
                pretty: bool = False) -> dict:
    """
    Export news data as JSON.
    
    Args:
        limit: Number of records
        category: Filter by category
        pretty: Pretty print JSON
    
    Returns:
        JSON data
    """
    params = {"limit": limit, "pretty": str(pretty).lower()}
    if category:
        params["category"] = category
    
    response = requests.get(f"{BASE_URL}/api/export/json", params=params)
    return response.json()


# =============================================================================
# GET /api/llms.txt - LLM-Friendly Format
# =============================================================================

def get_llms_txt() -> str:
    """
    Get news in LLM-friendly text format.
    
    Returns:
        Plain text formatted for LLMs
    """
    response = requests.get(f"{BASE_URL}/api/llms.txt")
    return response.text


# =============================================================================
# GET /api/sitemap - Sitemap
# =============================================================================

def get_sitemap() -> str:
    """
    Get XML sitemap.
    
    Returns:
        Sitemap XML
    """
    response = requests.get(f"{BASE_URL}/api/sitemap")
    return response.text


# =============================================================================
# GET /api/oembed - oEmbed
# =============================================================================

def get_oembed(url: str) -> dict:
    """
    Get oEmbed data for embedding.
    
    Args:
        url: Article URL
    
    Returns:
        oEmbed data
    """
    response = requests.get(f"{BASE_URL}/api/oembed", params={"url": url})
    return response.json()


# =============================================================================
# GET /api/embed - Embed Widget
# =============================================================================

def get_embed_code(theme: str = "light", limit: int = 5,
                   category: Optional[str] = None) -> dict:
    """
    Get embeddable widget code.
    
    Args:
        theme: Widget theme (light, dark)
        limit: Number of articles
        category: Filter by category
    
    Returns:
        Embed code and options
    """
    params = {"theme": theme, "limit": limit}
    if category:
        params["category"] = category
    
    response = requests.get(f"{BASE_URL}/api/embed", params=params)
    return response.json()


# =============================================================================
# GET /api/opml - OPML Export
# =============================================================================

def get_opml() -> str:
    """
    Get OPML file of all feeds.
    
    Returns:
        OPML XML
    """
    response = requests.get(f"{BASE_URL}/api/opml")
    return response.text


# =============================================================================
# GET /api/archive - News Archive
# =============================================================================

def get_archive(year: Optional[int] = None, month: Optional[int] = None,
                day: Optional[int] = None) -> dict:
    """
    Get archived news.
    
    Args:
        year: Year
        month: Month
        day: Day
    
    Returns:
        Archived articles
    """
    params = {}
    if year:
        params["year"] = year
    if month:
        params["month"] = month
    if day:
        params["day"] = day
    
    response = requests.get(f"{BASE_URL}/api/archive", params=params)
    return response.json()


# =============================================================================
# COMPLETE EXAMPLES
# =============================================================================

if __name__ == "__main__":
    print("\n" + "="*60)
    print("FREE CRYPTO NEWS API - FEEDS & EXPORT EXAMPLES")
    print("="*60)
    
    # 1. RSS Feed (XML)
    print("\n📡 1. RSS Feed (XML)")
    rss = get_rss_feed(limit=5)
    print(f"   RSS: {rss[:200]}...")
    
    # 2. RSS Feed (JSON)
    print("\n📊 2. RSS Feed (JSON)")
    rss_json = get_rss_json(limit=5)
    print(f"   JSON RSS: {rss_json}")
    
    # 3. Atom Feed
    print("\n⚛️ 3. Atom Feed")
    atom = get_atom_feed(limit=5)
    print(f"   Atom: {atom[:200]}...")
    
    # 4. JSON Feed
    print("\n📋 4. JSON Feed")
    json_feed = get_json_feed(limit=5)
    print(f"   JSON Feed: {json_feed}")
    
    # 5. CSV Export
    print("\n📑 5. CSV Export")
    csv = export_csv(limit=10)
    lines = csv.split('\n')[:3]
    print(f"   CSV Preview:\n   {lines}")
    
    # 6. JSON Export
    print("\n💾 6. JSON Export")
    json_export = export_json(limit=5, pretty=True)
    print(f"   JSON Export: {len(json_export)} items")
    
    # 7. LLMs.txt
    print("\n🤖 7. LLMs.txt Format")
    llms = get_llms_txt()
    print(f"   LLMs.txt: {llms[:200]}...")
    
    # 8. Sitemap
    print("\n🗺️ 8. Sitemap")
    sitemap = get_sitemap()
    print(f"   Sitemap: {sitemap[:200]}...")
    
    # 9. oEmbed
    print("\n🔗 9. oEmbed")
    oembed = get_oembed("https://example.com/article")
    print(f"   oEmbed: {oembed}")
    
    # 10. Embed Widget
    print("\n📦 10. Embed Widget")
    embed = get_embed_code(theme="dark", limit=5)
    print(f"   Embed: {embed}")
    
    # 11. OPML
    print("\n📂 11. OPML Export")
    opml = get_opml()
    print(f"   OPML: {opml[:200]}...")
    
    # 12. Archive
    print("\n📚 12. News Archive (2024)")
    archive = get_archive(year=2024, month=6)
    print(f"   Archive: {archive}")
    
    print("\n" + "="*60)
    print("Feeds & export examples completed!")
    print("="*60)


# =============================================================================
# INTEGRATION EXAMPLES
# =============================================================================

def subscribe_to_rss_in_reader():
    """Example: How to use RSS feed in a feed reader."""
    # Add this URL to your RSS reader:
    rss_url = f"{BASE_URL}/api/rss"
    
    # For specific categories:
    bitcoin_rss = f"{BASE_URL}/api/rss?category=bitcoin"
    defi_rss = f"{BASE_URL}/api/rss?category=defi"
    
    print(f"RSS Feed URLs:")
    print(f"  All News: {rss_url}")
    print(f"  Bitcoin: {bitcoin_rss}")
    print(f"  DeFi: {defi_rss}")


def import_to_pandas():
    """Example: Import data into pandas DataFrame."""
    try:
        import pandas as pd
        from io import StringIO
        
        csv_data = export_csv(limit=100)
        df = pd.read_csv(StringIO(csv_data))
        
        print(f"Loaded {len(df)} articles into DataFrame")
        print(f"Columns: {list(df.columns)}")
        return df
    except ImportError:
        print("pandas not installed. Run: pip install pandas")


def integrate_with_feedly():
    """Example: URLs to add to Feedly."""
    feeds = {
        "All Crypto News": f"{BASE_URL}/api/rss",
        "Bitcoin": f"{BASE_URL}/api/rss?category=bitcoin",
        "Ethereum": f"{BASE_URL}/api/rss?category=ethereum",
        "DeFi": f"{BASE_URL}/api/rss?category=defi",
        "NFT": f"{BASE_URL}/api/rss?category=nft",
        "Regulatory": f"{BASE_URL}/api/rss?category=regulatory",
    }
    
    print("Add these feeds to Feedly:")
    for name, url in feeds.items():
        print(f"  {name}: {url}")
