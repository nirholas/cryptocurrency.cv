#!/usr/bin/env python3
"""
Social & Community API Examples - Python
Free Crypto News API - https://github.com/nirholas/free-crypto-news

Examples for social media and community endpoints.
"""

import requests
import json
from typing import Optional, List

BASE_URL = "https://cryptocurrency.cv"


# =============================================================================
# GET /api/social/x - Twitter/X Feed
# =============================================================================

def get_x_feed(asset: Optional[str] = None, limit: int = 20) -> dict:
    """
    Get Twitter/X crypto posts.
    
    Args:
        asset: Filter by asset (BTC, ETH, etc.)
        limit: Number of posts
    
    Returns:
        X/Twitter posts
    """
    params = {"limit": limit}
    if asset:
        params["asset"] = asset
    
    response = requests.get(f"{BASE_URL}/api/social/x", params=params)
    return response.json()


# =============================================================================
# GET /api/social/reddit - Reddit Feed
# =============================================================================

def get_reddit_feed(subreddit: Optional[str] = None, limit: int = 20) -> dict:
    """
    Get Reddit crypto posts.
    
    Args:
        subreddit: Filter by subreddit (cryptocurrency, bitcoin, etc.)
        limit: Number of posts
    
    Returns:
        Reddit posts
    """
    params = {"limit": limit}
    if subreddit:
        params["subreddit"] = subreddit
    
    response = requests.get(f"{BASE_URL}/api/social/reddit", params=params)
    return response.json()


# =============================================================================
# GET /api/social/youtube - YouTube Feed
# =============================================================================

def get_youtube_feed(channel: Optional[str] = None, limit: int = 20) -> dict:
    """
    Get YouTube crypto videos.
    
    Args:
        channel: Filter by channel
        limit: Number of videos
    
    Returns:
        YouTube videos
    """
    params = {"limit": limit}
    if channel:
        params["channel"] = channel
    
    response = requests.get(f"{BASE_URL}/api/social/youtube", params=params)
    return response.json()


# =============================================================================
# GET /api/social/discord - Discord Activity
# =============================================================================

def get_discord_activity() -> dict:
    """
    Get Discord community activity.
    
    Returns:
        Discord activity metrics
    """
    response = requests.get(f"{BASE_URL}/api/social/discord")
    return response.json()


# =============================================================================
# GET /api/social/telegram - Telegram Feed
# =============================================================================

def get_telegram_feed(channel: Optional[str] = None, limit: int = 20) -> dict:
    """
    Get Telegram crypto channel posts.
    
    Args:
        channel: Filter by channel
        limit: Number of posts
    
    Returns:
        Telegram posts
    """
    params = {"limit": limit}
    if channel:
        params["channel"] = channel
    
    response = requests.get(f"{BASE_URL}/api/social/telegram", params=params)
    return response.json()


# =============================================================================
# GET /api/social/github - GitHub Activity
# =============================================================================

def get_github_activity(project: Optional[str] = None) -> dict:
    """
    Get GitHub crypto project activity.
    
    Args:
        project: Filter by project name
    
    Returns:
        GitHub activity metrics
    """
    params = {}
    if project:
        params["project"] = project
    
    response = requests.get(f"{BASE_URL}/api/social/github", params=params)
    return response.json()


# =============================================================================
# GET /api/social/developers - Developer Activity
# =============================================================================

def get_developer_activity(asset: str = "ethereum") -> dict:
    """
    Get developer activity for a project.
    
    Args:
        asset: Asset/project name
    
    Returns:
        Developer activity metrics
    """
    response = requests.get(f"{BASE_URL}/api/social/developers", 
                           params={"asset": asset})
    return response.json()


# =============================================================================
# GET /api/social/influencers - Crypto Influencers
# =============================================================================

def get_influencers(limit: int = 20) -> dict:
    """
    Get list of crypto influencers.
    
    Args:
        limit: Number of influencers
    
    Returns:
        Influencer list with metrics
    """
    response = requests.get(f"{BASE_URL}/api/social/influencers", 
                           params={"limit": limit})
    return response.json()


# =============================================================================
# GET /api/social/sentiment - Social Sentiment
# =============================================================================

def get_social_sentiment(asset: str = "BTC") -> dict:
    """
    Get social media sentiment analysis.
    
    Args:
        asset: Asset symbol
    
    Returns:
        Social sentiment metrics
    """
    response = requests.get(f"{BASE_URL}/api/social/sentiment", 
                           params={"asset": asset})
    return response.json()


# =============================================================================
# GET /api/social/trending - Trending on Social
# =============================================================================

def get_social_trending() -> dict:
    """
    Get trending topics across social platforms.
    
    Returns:
        Trending topics
    """
    response = requests.get(f"{BASE_URL}/api/social/trending")
    return response.json()


# =============================================================================
# GET /api/social/mentions - Mention Tracking
# =============================================================================

def get_mentions(asset: str = "BTC", period: str = "24h") -> dict:
    """
    Get mention tracking for an asset.
    
    Args:
        asset: Asset symbol
        period: Time period
    
    Returns:
        Mention counts and sources
    """
    params = {"asset": asset, "period": period}
    response = requests.get(f"{BASE_URL}/api/social/mentions", params=params)
    return response.json()


# =============================================================================
# GET /api/governance - Governance Updates
# =============================================================================

def get_governance(protocol: Optional[str] = None, limit: int = 20) -> dict:
    """
    Get DAO governance proposals and votes.
    
    Args:
        protocol: Filter by protocol (aave, compound, etc.)
        limit: Number of proposals
    
    Returns:
        Governance proposals
    """
    params = {"limit": limit}
    if protocol:
        params["protocol"] = protocol
    
    response = requests.get(f"{BASE_URL}/api/governance", params=params)
    return response.json()


def get_proposal(proposal_id: str) -> dict:
    """
    Get details of a specific proposal.
    
    Args:
        proposal_id: Proposal ID
    
    Returns:
        Proposal details
    """
    response = requests.get(f"{BASE_URL}/api/governance/{proposal_id}")
    return response.json()


# =============================================================================
# GET /api/events - Crypto Events
# =============================================================================

def get_events(type: Optional[str] = None, limit: int = 20) -> dict:
    """
    Get upcoming crypto events.
    
    Args:
        type: Event type (conference, ama, airdrop, etc.)
        limit: Number of events
    
    Returns:
        Upcoming events
    """
    params = {"limit": limit}
    if type:
        params["type"] = type
    
    response = requests.get(f"{BASE_URL}/api/events", params=params)
    return response.json()


# =============================================================================
# GET /api/calendar - Events Calendar
# =============================================================================

def get_calendar(month: Optional[int] = None, year: Optional[int] = None) -> dict:
    """
    Get crypto events calendar.
    
    Args:
        month: Month number (1-12)
        year: Year
    
    Returns:
        Calendar events
    """
    params = {}
    if month:
        params["month"] = month
    if year:
        params["year"] = year
    
    response = requests.get(f"{BASE_URL}/api/calendar", params=params)
    return response.json()


# =============================================================================
# COMPLETE EXAMPLES
# =============================================================================

if __name__ == "__main__":
    print("\n" + "="*60)
    print("FREE CRYPTO NEWS API - SOCIAL & COMMUNITY EXAMPLES")
    print("="*60)
    
    # 1. X/Twitter
    print("\n🐦 1. X/Twitter Feed")
    x_feed = get_x_feed(limit=5)
    print(f"   X Posts: {x_feed}")
    
    # 2. Reddit
    print("\n🔴 2. Reddit Feed")
    reddit = get_reddit_feed(subreddit="cryptocurrency", limit=5)
    print(f"   Reddit: {reddit}")
    
    # 3. YouTube
    print("\n📺 3. YouTube Videos")
    yt = get_youtube_feed(limit=5)
    print(f"   YouTube: {yt}")
    
    # 4. Telegram
    print("\n📱 4. Telegram Feed")
    tg = get_telegram_feed(limit=5)
    print(f"   Telegram: {tg}")
    
    # 5. GitHub
    print("\n💻 5. GitHub Activity")
    gh = get_github_activity(project="ethereum")
    print(f"   GitHub: {gh}")
    
    # 6. Influencers
    print("\n👤 6. Top Influencers")
    influencers = get_influencers(limit=5)
    print(f"   Influencers: {influencers}")
    
    # 7. Social Sentiment
    print("\n😊 7. Social Sentiment (BTC)")
    sentiment = get_social_sentiment("BTC")
    print(f"   Sentiment: {sentiment}")
    
    # 8. Trending
    print("\n🔥 8. Social Trending")
    trending = get_social_trending()
    print(f"   Trending: {trending}")
    
    # 9. Mentions
    print("\n📢 9. BTC Mentions (24h)")
    mentions = get_mentions("BTC", "24h")
    print(f"   Mentions: {mentions}")
    
    # 10. Governance
    print("\n🏛️ 10. DAO Governance")
    gov = get_governance(limit=5)
    print(f"   Governance: {gov}")
    
    # 11. Events
    print("\n📅 11. Upcoming Events")
    events = get_events(limit=5)
    print(f"   Events: {events}")
    
    print("\n" + "="*60)
    print("All social & community examples completed!")
    print("="*60)
