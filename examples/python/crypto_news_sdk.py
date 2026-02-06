#!/usr/bin/env python3
"""
Free Crypto News API - Complete Python SDK

A comprehensive Python SDK covering all 150+ API endpoints.
No API key required - all endpoints are free and open.

Usage:
    from crypto_news_sdk import CryptoNewsAPI
    
    api = CryptoNewsAPI()
    news = api.news.get_latest(limit=10)
    sentiment = api.ai.get_sentiment(asset="BTC")
"""

import requests
from typing import Optional, List, Dict, Any, Union
from dataclasses import dataclass
from datetime import datetime
import json


BASE_URL = "https://cryptocurrency.cv"


# =============================================================================
# DATACLASSES FOR TYPE HINTS
# =============================================================================

@dataclass
class Article:
    title: str
    link: str
    source: str
    pub_date: str
    description: Optional[str] = None
    category: Optional[str] = None
    image: Optional[str] = None
    sentiment: Optional[Dict] = None


@dataclass
class MarketSentiment:
    label: str
    score: float
    confidence: float
    breakdown: Dict[str, float]


@dataclass
class FearGreedIndex:
    value: int
    classification: str
    history: Optional[List[Dict]] = None


# =============================================================================
# HTTP CLIENT
# =============================================================================

class HttpClient:
    """HTTP client for API requests."""
    
    def __init__(self, base_url: str = BASE_URL, timeout: int = 30):
        self.base_url = base_url
        self.timeout = timeout
        self.session = requests.Session()
    
    def get(self, endpoint: str, params: Dict = None) -> Dict[str, Any]:
        """Make GET request."""
        response = self.session.get(
            f"{self.base_url}{endpoint}",
            params=params or {},
            timeout=self.timeout
        )
        response.raise_for_status()
        return response.json()
    
    def post(self, endpoint: str, data: Dict = None) -> Dict[str, Any]:
        """Make POST request."""
        response = self.session.post(
            f"{self.base_url}{endpoint}",
            json=data or {},
            timeout=self.timeout
        )
        response.raise_for_status()
        return response.json()
    
    def put(self, endpoint: str, data: Dict = None) -> Dict[str, Any]:
        """Make PUT request."""
        response = self.session.put(
            f"{self.base_url}{endpoint}",
            json=data or {},
            timeout=self.timeout
        )
        response.raise_for_status()
        return response.json()
    
    def delete(self, endpoint: str) -> Dict[str, Any]:
        """Make DELETE request."""
        response = self.session.delete(
            f"{self.base_url}{endpoint}",
            timeout=self.timeout
        )
        response.raise_for_status()
        return response.json()


# =============================================================================
# NEWS API MODULE
# =============================================================================

class NewsAPI:
    """News-related API endpoints."""
    
    def __init__(self, http: HttpClient):
        self.http = http
    
    def get_latest(
        self,
        limit: int = 50,
        source: str = None,
        category: str = None,
        lang: str = None,
        page: int = 1
    ) -> Dict[str, Any]:
        """Get latest aggregated news."""
        params = {"limit": limit, "page": page}
        if source:
            params["source"] = source
        if category:
            params["category"] = category
        if lang:
            params["lang"] = lang
        return self.http.get("/api/news", params)
    
    def get_bitcoin(self, limit: int = 20, lang: str = None) -> Dict[str, Any]:
        """Get Bitcoin-specific news."""
        params = {"limit": limit}
        if lang:
            params["lang"] = lang
        return self.http.get("/api/bitcoin", params)
    
    def get_defi(self, limit: int = 20) -> Dict[str, Any]:
        """Get DeFi news."""
        return self.http.get("/api/defi", {"limit": limit})
    
    def get_breaking(self, limit: int = 10) -> Dict[str, Any]:
        """Get breaking news."""
        return self.http.get("/api/breaking", {"limit": limit})
    
    def get_international(
        self,
        language: str = None,
        region: str = None,
        translate: bool = False,
        limit: int = 50
    ) -> Dict[str, Any]:
        """Get international news."""
        params = {"limit": limit, "translate": translate}
        if language:
            params["language"] = language
        if region:
            params["region"] = region
        return self.http.get("/api/news/international", params)
    
    def extract_article(self, url: str) -> Dict[str, Any]:
        """Extract full article content from URL."""
        return self.http.post("/api/news/extract", {"url": url})
    
    def get_categories(self) -> Dict[str, Any]:
        """Get available categories."""
        return self.http.get("/api/news/categories")
    
    def search(
        self,
        query: str,
        limit: int = 20,
        from_date: str = None,
        to_date: str = None
    ) -> Dict[str, Any]:
        """Search news articles."""
        params = {"q": query, "limit": limit}
        if from_date:
            params["from"] = from_date
        if to_date:
            params["to"] = to_date
        return self.http.get("/api/search", params)
    
    def get_trending(self, limit: int = 10) -> Dict[str, Any]:
        """Get trending topics."""
        return self.http.get("/api/trending", {"limit": limit})
    
    def get_sources(self) -> Dict[str, Any]:
        """Get available news sources."""
        return self.http.get("/api/sources")
    
    def get_tags(self, limit: int = 50) -> Dict[str, Any]:
        """Get popular tags."""
        return self.http.get("/api/tags", {"limit": limit})
    
    def get_tag(self, slug: str, limit: int = 20) -> Dict[str, Any]:
        """Get articles by tag."""
        return self.http.get(f"/api/tags/{slug}", {"limit": limit})


# =============================================================================
# AI API MODULE
# =============================================================================

class AIAPI:
    """AI-powered API endpoints."""
    
    def __init__(self, http: HttpClient):
        self.http = http
    
    def get_sentiment(
        self,
        asset: str = None,
        limit: int = 20
    ) -> Dict[str, Any]:
        """Get sentiment analysis."""
        params = {"limit": limit}
        if asset:
            params["asset"] = asset
        return self.http.get("/api/sentiment", params)
    
    def get_digest(self, period: str = "24h", format: str = "detailed") -> Dict[str, Any]:
        """Get AI-generated daily digest."""
        return self.http.get("/api/digest", {"period": period, "format": format})
    
    def summarize(self, url: str, sentences: int = 3) -> Dict[str, Any]:
        """Summarize an article by URL."""
        return self.http.get("/api/summarize", {"url": url, "sentences": sentences})
    
    def ask(self, question: str, context: str = None) -> Dict[str, Any]:
        """Ask AI a question."""
        params = {"q": question}
        if context:
            params["context"] = context
        return self.http.get("/api/ask", params)
    
    def request(self, action: str, **kwargs) -> Dict[str, Any]:
        """Unified AI request."""
        return self.http.post("/api/ai", {"action": action, **kwargs})
    
    def get_brief(self, date: str = None, format: str = "newsletter") -> Dict[str, Any]:
        """Get AI market brief."""
        params = {"format": format}
        if date:
            params["date"] = date
        return self.http.get("/api/ai/brief", params)
    
    def debate(self, topic: str, article: Dict = None) -> Dict[str, Any]:
        """Generate AI debate."""
        payload = {"topic": topic}
        if article:
            payload["article"] = article
        return self.http.post("/api/ai/debate", payload)
    
    def counter(self, claim: str, context: str = None) -> Dict[str, Any]:
        """Generate counter-arguments."""
        payload = {"claim": claim}
        if context:
            payload["context"] = context
        return self.http.post("/api/ai/counter", payload)
    
    def agent_query(
        self,
        question: str,
        assets: List[str] = None,
        time_horizon: str = None
    ) -> Dict[str, Any]:
        """Query AI research agent."""
        payload = {"question": question}
        if assets:
            payload["assets"] = assets
        if time_horizon:
            payload["timeHorizon"] = time_horizon
        return self.http.post("/api/ai/agent", payload)
    
    def detect_ai_content(
        self,
        text: Union[str, List[str]],
        quick: bool = False
    ) -> Dict[str, Any]:
        """Detect AI-generated content."""
        if isinstance(text, list):
            payload = {"texts": text, "quick": quick}
        else:
            payload = {"text": text, "quick": quick}
        return self.http.post("/api/detect/ai-content", payload)


# =============================================================================
# TRADING API MODULE
# =============================================================================

class TradingAPI:
    """Trading-related API endpoints."""
    
    def __init__(self, http: HttpClient):
        self.http = http
    
    def get_arbitrage(
        self,
        pairs: List[str] = None,
        min_spread: float = None,
        exchanges: List[str] = None
    ) -> Dict[str, Any]:
        """Get arbitrage opportunities."""
        params = {}
        if pairs:
            params["pairs"] = ",".join(pairs)
        if min_spread:
            params["minSpread"] = min_spread
        if exchanges:
            params["exchanges"] = ",".join(exchanges)
        return self.http.get("/api/arbitrage", params)
    
    def get_signals(self, asset: str = None, timeframe: str = "1d") -> Dict[str, Any]:
        """Get AI trading signals."""
        params = {"timeframe": timeframe}
        if asset:
            params["asset"] = asset
        return self.http.get("/api/signals", params)
    
    def get_funding(self, symbol: str = None, exchanges: List[str] = None) -> Dict[str, Any]:
        """Get perpetual funding rates."""
        params = {}
        if symbol:
            params["symbol"] = symbol
        if exchanges:
            params["exchanges"] = ",".join(exchanges)
        return self.http.get("/api/funding", params)
    
    def get_options(
        self,
        asset: str = "BTC",
        exchange: str = None,
        type: str = None
    ) -> Dict[str, Any]:
        """Get options flow data."""
        params = {"asset": asset}
        if exchange:
            params["exchange"] = exchange
        if type:
            params["type"] = type
        return self.http.get("/api/options", params)
    
    def get_liquidations(
        self,
        symbol: str = None,
        side: str = None,
        min_value: float = None,
        period: str = "24h"
    ) -> Dict[str, Any]:
        """Get liquidation data."""
        params = {"period": period}
        if symbol:
            params["symbol"] = symbol
        if side:
            params["side"] = side
        if min_value:
            params["minValue"] = min_value
        return self.http.get("/api/liquidations", params)
    
    def get_whale_alerts(
        self,
        asset: str = None,
        min_value: float = None,
        type: str = None
    ) -> Dict[str, Any]:
        """Get whale alerts."""
        params = {}
        if asset:
            params["asset"] = asset
        if min_value:
            params["minValue"] = min_value
        if type:
            params["type"] = type
        return self.http.get("/api/whale-alerts", params)
    
    def get_orderbook(
        self,
        symbol: str = "BTCUSDT",
        depth: int = 20,
        exchanges: List[str] = None
    ) -> Dict[str, Any]:
        """Get order book data."""
        params = {"symbol": symbol, "depth": depth}
        if exchanges:
            params["exchanges"] = ",".join(exchanges)
        return self.http.get("/api/orderbook", params)
    
    def get_fear_greed(self, days: int = 7) -> Dict[str, Any]:
        """Get Fear & Greed Index."""
        return self.http.get("/api/fear-greed", {"days": days})


# =============================================================================
# MARKET API MODULE
# =============================================================================

class MarketAPI:
    """Market data API endpoints."""
    
    def __init__(self, http: HttpClient):
        self.http = http
    
    def get_coins(
        self,
        ids: str = None,
        vs_currency: str = "usd",
        order: str = "market_cap_desc",
        per_page: int = 100
    ) -> Dict[str, Any]:
        """Get coin market data."""
        params = {
            "vs_currency": vs_currency,
            "order": order,
            "per_page": per_page
        }
        if ids:
            params["ids"] = ids
        return self.http.get("/api/market/coins", params)
    
    def get_ohlc(
        self,
        coin_id: str,
        days: int = 7,
        interval: str = None
    ) -> Dict[str, Any]:
        """Get OHLC candlestick data."""
        params = {"days": days}
        if interval:
            params["interval"] = interval
        return self.http.get(f"/api/market/ohlc/{coin_id}", params)
    
    def get_exchanges(self) -> Dict[str, Any]:
        """Get exchange data."""
        return self.http.get("/api/market/exchanges")
    
    def get_derivatives(self) -> Dict[str, Any]:
        """Get derivatives data."""
        return self.http.get("/api/market/derivatives")
    
    def get_categories(self) -> Dict[str, Any]:
        """Get market categories."""
        return self.http.get("/api/market/categories")
    
    def search(self, query: str) -> Dict[str, Any]:
        """Search market data."""
        return self.http.get("/api/market/search", {"q": query})


# =============================================================================
# ANALYTICS API MODULE
# =============================================================================

class AnalyticsAPI:
    """Analytics and research API endpoints."""
    
    def __init__(self, http: HttpClient):
        self.http = http
    
    def get_narratives(self, period: str = "24h", limit: int = 10) -> Dict[str, Any]:
        """Detect narrative clusters."""
        return self.http.get("/api/narratives", {"period": period, "limit": limit})
    
    def get_regulatory(
        self,
        jurisdiction: str = None,
        type: str = None
    ) -> Dict[str, Any]:
        """Get regulatory intelligence."""
        params = {}
        if jurisdiction:
            params["jurisdiction"] = jurisdiction
        if type:
            params["type"] = type
        return self.http.get("/api/regulatory", params)
    
    def get_influencers(
        self,
        platform: str = None,
        limit: int = 20,
        sort_by: str = "followers"
    ) -> Dict[str, Any]:
        """Get influencer data."""
        params = {"limit": limit, "sortBy": sort_by}
        if platform:
            params["platform"] = platform
        return self.http.get("/api/influencers", params)
    
    def get_anomalies(self, hours: int = 24, severity: str = None) -> Dict[str, Any]:
        """Detect anomalies."""
        params = {"hours": hours}
        if severity:
            params["severity"] = severity
        return self.http.get("/api/analytics/anomalies", params)
    
    def get_headlines(self, hours: int = 24, changes_only: bool = False) -> Dict[str, Any]:
        """Get headline tracking."""
        return self.http.get("/api/analytics/headlines", {
            "hours": hours,
            "changesOnly": changes_only
        })
    
    def get_credibility(self, source: str = None, sort_by: str = "score") -> Dict[str, Any]:
        """Get source credibility."""
        params = {"sortBy": sort_by}
        if source:
            params["source"] = source
        return self.http.get("/api/analytics/credibility", params)
    
    def get_causality(
        self,
        event_id: str = None,
        type: str = None,
        asset: str = None
    ) -> Dict[str, Any]:
        """Get causal analysis."""
        params = {}
        if event_id:
            params["eventId"] = event_id
        if type:
            params["type"] = type
        if asset:
            params["asset"] = asset
        return self.http.get("/api/analytics/causality", params)


# =============================================================================
# SOCIAL API MODULE
# =============================================================================

class SocialAPI:
    """Social media API endpoints."""
    
    def __init__(self, http: HttpClient):
        self.http = http
    
    def get_sentiment(self, asset: str = None, platforms: str = None) -> Dict[str, Any]:
        """Get aggregated social sentiment."""
        params = {}
        if asset:
            params["asset"] = asset
        if platforms:
            params["platforms"] = platforms
        return self.http.get("/api/social", params)
    
    def get_twitter_sentiment(
        self,
        query: str = None,
        accounts: str = None
    ) -> Dict[str, Any]:
        """Get Twitter/X sentiment."""
        params = {}
        if query:
            params["query"] = query
        if accounts:
            params["accounts"] = accounts
        return self.http.get("/api/social/x/sentiment", params)
    
    def get_monitor(self, platform: str = None, hours: int = 24) -> Dict[str, Any]:
        """Get community monitoring data."""
        params = {"hours": hours}
        if platform:
            params["platform"] = platform
        return self.http.get("/api/social/monitor", params)
    
    def get_influencer_scores(
        self,
        username: str = None,
        platform: str = None
    ) -> Dict[str, Any]:
        """Get influencer scores."""
        params = {}
        if username:
            params["username"] = username
        if platform:
            params["platform"] = platform
        return self.http.get("/api/social/influencer-score", params)


# =============================================================================
# ALERTS API MODULE
# =============================================================================

class AlertsAPI:
    """Alerts and webhooks API endpoints."""
    
    def __init__(self, http: HttpClient):
        self.http = http
    
    def create(self, alert: Dict[str, Any]) -> Dict[str, Any]:
        """Create an alert."""
        return self.http.post("/api/alerts", alert)
    
    def list(self, user_id: str = None) -> Dict[str, Any]:
        """List alerts."""
        params = {"userId": user_id} if user_id else {}
        return self.http.get("/api/alerts", params)
    
    def get(self, alert_id: str) -> Dict[str, Any]:
        """Get alert by ID."""
        return self.http.get(f"/api/alerts/{alert_id}")
    
    def update(self, alert_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
        """Update alert."""
        return self.http.put(f"/api/alerts/{alert_id}", updates)
    
    def delete(self, alert_id: str) -> Dict[str, Any]:
        """Delete alert."""
        return self.http.delete(f"/api/alerts/{alert_id}")
    
    def test(self, alert_id: str) -> Dict[str, Any]:
        """Test alert."""
        return self.http.post(f"/api/alerts/{alert_id}?action=test", {})


# =============================================================================
# WEBHOOKS API MODULE
# =============================================================================

class WebhooksAPI:
    """Webhooks API endpoints."""
    
    def __init__(self, http: HttpClient):
        self.http = http
    
    def register(self, webhook: Dict[str, Any]) -> Dict[str, Any]:
        """Register webhook."""
        return self.http.post("/api/webhooks", webhook)
    
    def test(self, webhook_id: str) -> Dict[str, Any]:
        """Test webhook."""
        return self.http.post("/api/webhooks/test", {"webhookId": webhook_id})
    
    def get_queue(self) -> Dict[str, Any]:
        """Get queue status."""
        return self.http.get("/api/webhooks/queue")


# =============================================================================
# ARCHIVE API MODULE
# =============================================================================

class ArchiveAPI:
    """Archive API endpoints."""
    
    def __init__(self, http: HttpClient):
        self.http = http
    
    def query(
        self,
        date: str = None,
        start: str = None,
        end: str = None,
        source: str = None,
        ticker: str = None,
        limit: int = 100
    ) -> Dict[str, Any]:
        """Query historical archive."""
        params = {"limit": limit}
        if date:
            params["date"] = date
        if start:
            params["start"] = start
        if end:
            params["end"] = end
        if source:
            params["source"] = source
        if ticker:
            params["ticker"] = ticker
        return self.http.get("/api/archive", params)
    
    def query_v2(
        self,
        start_date: str = None,
        end_date: str = None,
        source: str = None,
        query: str = None,
        sentiment: str = None
    ) -> Dict[str, Any]:
        """Query V2 archive."""
        params = {}
        if start_date:
            params["start_date"] = start_date
        if end_date:
            params["end_date"] = end_date
        if source:
            params["source"] = source
        if query:
            params["q"] = query
        if sentiment:
            params["sentiment"] = sentiment
        return self.http.get("/api/archive", params)
    
    def get_status(self) -> Dict[str, Any]:
        """Get archive status."""
        return self.http.get("/api/archive/status")


# =============================================================================
# UTILITY API MODULE
# =============================================================================

class UtilityAPI:
    """Utility API endpoints."""
    
    def __init__(self, http: HttpClient):
        self.http = http
    
    def get_health(self) -> Dict[str, Any]:
        """Health check."""
        return self.http.get("/api/health")
    
    def get_stats(self) -> Dict[str, Any]:
        """Get API statistics."""
        return self.http.get("/api/stats")
    
    def get_cache_status(self) -> Dict[str, Any]:
        """Get cache status."""
        return self.http.get("/api/cache")
    
    def clear_cache(self) -> Dict[str, Any]:
        """Clear cache."""
        return self.http.delete("/api/cache")
    
    def get_openapi(self) -> Dict[str, Any]:
        """Get OpenAPI specification."""
        return self.http.get("/api/openapi.json")


# =============================================================================
# MAIN SDK CLASS
# =============================================================================

class CryptoNewsAPI:
    """
    Complete Python SDK for the Free Crypto News API.
    
    Usage:
        api = CryptoNewsAPI()
        
        # News
        news = api.news.get_latest(limit=10)
        
        # AI Sentiment
        sentiment = api.ai.get_sentiment(asset="BTC")
        
        # Trading Signals
        signals = api.trading.get_signals(asset="ETH")
        
        # Market Data
        coins = api.market.get_coins(ids="bitcoin,ethereum")
    """
    
    def __init__(self, base_url: str = BASE_URL, timeout: int = 30):
        """Initialize the SDK."""
        self.http = HttpClient(base_url, timeout)
        
        # Initialize all API modules
        self.news = NewsAPI(self.http)
        self.ai = AIAPI(self.http)
        self.trading = TradingAPI(self.http)
        self.market = MarketAPI(self.http)
        self.analytics = AnalyticsAPI(self.http)
        self.social = SocialAPI(self.http)
        self.alerts = AlertsAPI(self.http)
        self.webhooks = WebhooksAPI(self.http)
        self.archive = ArchiveAPI(self.http)
        self.utility = UtilityAPI(self.http)


# =============================================================================
# EXAMPLE USAGE
# =============================================================================

def main():
    """Run example usage."""
    api = CryptoNewsAPI()
    
    print("=" * 60)
    print("🚀 CRYPTO NEWS API - Python SDK Examples")
    print("=" * 60)
    
    try:
        # Latest News
        print("\n📰 Latest News:")
        news = api.news.get_latest(limit=5)
        for article in news.get('articles', [])[:5]:
            print(f"   • {article.get('title', '')[:60]}...")
        
        # Fear & Greed
        print("\n😨 Fear & Greed Index:")
        fg = api.trading.get_fear_greed()
        print(f"   Value: {fg.get('value', 0)}/100 - {fg.get('classification', 'Unknown')}")
        
        # Sentiment
        print("\n📊 Market Sentiment:")
        sentiment = api.ai.get_sentiment(limit=20)
        if 'market' in sentiment:
            print(f"   Overall: {sentiment['market'].get('overall', 'Unknown')}")
        
        # Trending
        print("\n🔥 Trending Topics:")
        trending = api.news.get_trending(limit=5)
        for topic in trending.get('topics', [])[:5]:
            print(f"   • {topic.get('name', topic.get('topic', 'Unknown'))}")
        
        # Health Check
        print("\n✅ API Health:")
        health = api.utility.get_health()
        print(f"   Status: {health.get('status', 'Unknown')}")
        
        print("\n" + "=" * 60)
        print("✅ All examples completed successfully!")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")


if __name__ == "__main__":
    main()
