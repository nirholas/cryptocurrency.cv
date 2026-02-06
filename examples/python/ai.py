#!/usr/bin/env python3
"""
AI API Examples - Python
Free Crypto News API - https://github.com/nirholas/free-crypto-news

Examples for all AI-powered endpoints.
"""

import requests
import json
from typing import Optional, List

BASE_URL = "https://cryptocurrency.cv"


# =============================================================================
# POST /api/ai - Main AI Endpoint
# =============================================================================

def ai_request(action: str, **kwargs) -> dict:
    """
    Make a request to the main AI endpoint.
    
    Args:
        action: AI action (sentiment, summarize, analyze, etc.)
        **kwargs: Additional parameters for the action
    
    Returns:
        AI response
    """
    payload = {"action": action, **kwargs}
    
    response = requests.post(
        f"{BASE_URL}/api/ai",
        json=payload,
        headers={"Content-Type": "application/json"}
    )
    return response.json()


# =============================================================================
# GET /api/sentiment - Sentiment Analysis
# =============================================================================

def get_sentiment(asset: Optional[str] = None, limit: int = 20) -> dict:
    """
    Get sentiment analysis for crypto assets.
    
    Args:
        asset: Filter by asset (BTC, ETH, etc.)
        limit: Number of articles to analyze
    
    Returns:
        Sentiment scores and analysis
    """
    params = {"limit": limit}
    if asset:
        params["asset"] = asset
    
    response = requests.get(f"{BASE_URL}/api/sentiment", params=params)
    return response.json()


def analyze_text_sentiment(title: str, content: str) -> dict:
    """
    Analyze sentiment of custom text.
    
    Args:
        title: Article title
        content: Article content
    
    Returns:
        Sentiment analysis result
    """
    return ai_request("sentiment", title=title, content=content)


# =============================================================================
# GET /api/summarize - Article Summarization
# =============================================================================

def summarize_article(url: str) -> dict:
    """
    Generate AI summary of an article.
    
    Args:
        url: Article URL to summarize
    
    Returns:
        AI-generated summary
    """
    response = requests.get(f"{BASE_URL}/api/summarize", params={"url": url})
    return response.json()


def summarize_text(text: str, max_length: int = 200) -> dict:
    """
    Summarize custom text.
    
    Args:
        text: Text to summarize
        max_length: Maximum summary length
    
    Returns:
        AI-generated summary
    """
    return ai_request("summarize", text=text, max_length=max_length)


# =============================================================================
# GET /api/ask - Ask AI Questions
# =============================================================================

def ask_ai(question: str, context: Optional[str] = None) -> dict:
    """
    Ask AI questions about crypto news/markets.
    
    Args:
        question: Your question
        context: Optional context to include
    
    Returns:
        AI response
    """
    params = {"q": question}
    if context:
        params["context"] = context
    
    response = requests.get(f"{BASE_URL}/api/ask", params=params)
    return response.json()


# =============================================================================
# GET /api/ai/brief - Market Brief
# =============================================================================

def get_market_brief() -> dict:
    """
    Get AI-generated market brief/overview.
    
    Returns:
        Current market brief
    """
    response = requests.get(f"{BASE_URL}/api/ai/brief")
    return response.json()


# =============================================================================
# POST /api/ai/debate - AI Debate
# =============================================================================

def ai_debate(topic: str) -> dict:
    """
    Generate AI debate on a crypto topic (bull vs bear case).
    
    Args:
        topic: Topic to debate (e.g., "Bitcoin will reach $100k")
    
    Returns:
        Bull and bear arguments
    """
    response = requests.post(
        f"{BASE_URL}/api/ai/debate",
        json={"topic": topic},
        headers={"Content-Type": "application/json"}
    )
    return response.json()


# =============================================================================
# POST /api/ai/counter - Counter Arguments
# =============================================================================

def get_counter_arguments(claim: str) -> dict:
    """
    Generate counter-arguments for a claim.
    
    Args:
        claim: Claim to counter
    
    Returns:
        Counter-arguments
    """
    response = requests.post(
        f"{BASE_URL}/api/ai/counter",
        json={"claim": claim},
        headers={"Content-Type": "application/json"}
    )
    return response.json()


# =============================================================================
# GET /api/ai/agent - AI Agent
# =============================================================================

def ai_agent(task: str) -> dict:
    """
    Use AI agent for complex analysis tasks.
    
    Args:
        task: Task description
    
    Returns:
        Agent response
    """
    response = requests.get(f"{BASE_URL}/api/ai/agent", params={"task": task})
    return response.json()


def ai_agent_post(task: str, data: Optional[dict] = None) -> dict:
    """
    Use AI agent with custom data.
    
    Args:
        task: Task description
        data: Additional data for the task
    
    Returns:
        Agent response
    """
    payload = {"task": task}
    if data:
        payload["data"] = data
    
    response = requests.post(
        f"{BASE_URL}/api/ai/agent",
        json=payload,
        headers={"Content-Type": "application/json"}
    )
    return response.json()


# =============================================================================
# GET /api/ai/oracle - Price Oracle/Prediction
# =============================================================================

def get_oracle_prediction(asset: str = "BTC") -> dict:
    """
    Get AI oracle prediction for an asset.
    
    Args:
        asset: Asset symbol (BTC, ETH, etc.)
    
    Returns:
        Oracle prediction and analysis
    """
    response = requests.get(f"{BASE_URL}/api/ai/oracle", params={"asset": asset})
    return response.json()


# =============================================================================
# GET /api/entities - Entity Extraction
# =============================================================================

def extract_entities(text: Optional[str] = None, url: Optional[str] = None) -> dict:
    """
    Extract named entities (people, orgs, coins) from text.
    
    Args:
        text: Text to analyze
        url: Article URL to analyze
    
    Returns:
        Extracted entities
    """
    params = {}
    if text:
        params["text"] = text
    if url:
        params["url"] = url
    
    response = requests.get(f"{BASE_URL}/api/entities", params=params)
    return response.json()


# =============================================================================
# GET /api/ai/relationships - Entity Relationships
# =============================================================================

def get_relationships(entity: Optional[str] = None) -> dict:
    """
    Get relationships between entities in news.
    
    Args:
        entity: Filter by specific entity
    
    Returns:
        Entity relationship graph
    """
    params = {}
    if entity:
        params["entity"] = entity
    
    response = requests.get(f"{BASE_URL}/api/ai/relationships", params=params)
    return response.json()


# =============================================================================
# GET /api/narratives - Narrative Detection
# =============================================================================

def get_narratives(limit: int = 10) -> dict:
    """
    Detect emerging narratives in crypto news.
    
    Returns:
        Current narratives and trends
    """
    response = requests.get(f"{BASE_URL}/api/narratives", params={"limit": limit})
    return response.json()


# =============================================================================
# GET /api/claims - Claim Detection
# =============================================================================

def get_claims(limit: int = 20) -> dict:
    """
    Extract verifiable claims from news.
    
    Returns:
        Detected claims with verification status
    """
    response = requests.get(f"{BASE_URL}/api/claims", params={"limit": limit})
    return response.json()


# =============================================================================
# GET /api/clickbait - Clickbait Detection
# =============================================================================

def detect_clickbait(title: Optional[str] = None, limit: int = 20) -> dict:
    """
    Detect clickbait headlines.
    
    Args:
        title: Specific title to check
        limit: Number of articles to analyze
    
    Returns:
        Clickbait scores
    """
    params = {"limit": limit}
    if title:
        params["title"] = title
    
    response = requests.get(f"{BASE_URL}/api/clickbait", params=params)
    return response.json()


# =============================================================================
# GET /api/factcheck - Fact Checking
# =============================================================================

def factcheck(claim: str) -> dict:
    """
    Fact-check a claim.
    
    Args:
        claim: Claim to verify
    
    Returns:
        Fact-check result
    """
    response = requests.get(f"{BASE_URL}/api/factcheck", params={"claim": claim})
    return response.json()


# =============================================================================
# POST /api/detect/ai-content - AI Content Detection
# =============================================================================

def detect_ai_content(text: str) -> dict:
    """
    Detect if content was AI-generated.
    
    Args:
        text: Text to analyze
    
    Returns:
        AI detection result with probability
    """
    response = requests.post(
        f"{BASE_URL}/api/detect/ai-content",
        json={"text": text},
        headers={"Content-Type": "application/json"}
    )
    return response.json()


# =============================================================================
# GET /api/classify - Article Classification
# =============================================================================

def classify_article(text: Optional[str] = None, url: Optional[str] = None) -> dict:
    """
    Classify article by topic/category.
    
    Args:
        text: Article text
        url: Article URL
    
    Returns:
        Classification result
    """
    params = {}
    if text:
        params["text"] = text
    if url:
        params["url"] = url
    
    response = requests.get(f"{BASE_URL}/api/classify", params=params)
    return response.json()


# =============================================================================
# GET /api/origins - Source Origin Tracking
# =============================================================================

def get_origins(story: Optional[str] = None, limit: int = 10) -> dict:
    """
    Track the origin/first source of a news story.
    
    Args:
        story: Story keyword or topic
        limit: Number of results
    
    Returns:
        Origin tracking data
    """
    params = {"limit": limit}
    if story:
        params["story"] = story
    
    response = requests.get(f"{BASE_URL}/api/origins", params=params)
    return response.json()


# =============================================================================
# COMPLETE EXAMPLES
# =============================================================================

if __name__ == "__main__":
    print("\n" + "="*60)
    print("FREE CRYPTO NEWS API - AI EXAMPLES")
    print("="*60)
    
    # 1. Sentiment
    print("\n📊 1. Sentiment Analysis")
    sentiment = get_sentiment(asset="BTC", limit=10)
    print(f"   Result: {json.dumps(sentiment, indent=2)[:200]}...")
    
    # 2. Summarize
    print("\n📝 2. Article Summarization")
    summary = summarize_text("Bitcoin reached a new all-time high today as institutional investors continue to pour money into crypto markets. The surge comes amid growing adoption of Bitcoin ETFs.")
    print(f"   Summary: {summary}")
    
    # 3. Ask AI
    print("\n❓ 3. Ask AI")
    answer = ask_ai("What is the current Bitcoin sentiment?")
    print(f"   Answer: {answer}")
    
    # 4. Market Brief
    print("\n📋 4. Market Brief")
    brief = get_market_brief()
    print(f"   Brief: {brief}")
    
    # 5. Debate
    print("\n🗣️ 5. AI Debate")
    debate = ai_debate("Bitcoin will replace gold as a store of value")
    print(f"   Debate: {json.dumps(debate, indent=2)[:300]}...")
    
    # 6. Narratives
    print("\n📈 6. Emerging Narratives")
    narratives = get_narratives(limit=5)
    print(f"   Narratives: {narratives}")
    
    # 7. Entity Extraction
    print("\n🏷️ 7. Entity Extraction")
    entities = extract_entities(text="Vitalik Buterin announced a major Ethereum upgrade while Coinbase listed new tokens")
    print(f"   Entities: {entities}")
    
    # 8. Clickbait Detection
    print("\n🎣 8. Clickbait Detection")
    clickbait = detect_clickbait(title="You WON'T BELIEVE what Bitcoin just did!!!")
    print(f"   Clickbait: {clickbait}")
    
    # 9. AI Content Detection
    print("\n🤖 9. AI Content Detection")
    ai_detect = detect_ai_content("This is a sample text to check if it was written by AI.")
    print(f"   AI Detection: {ai_detect}")
    
    print("\n" + "="*60)
    print("All AI examples completed!")
    print("="*60)
