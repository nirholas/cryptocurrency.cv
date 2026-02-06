"""
Free Crypto News Python SDK

100% FREE - no API keys required!

Usage:
    from crypto_news import CryptoNews
    
    news = CryptoNews()
    articles = news.get_latest(limit=10)
    
    for article in articles:
        print(f"{article['title']} - {article['source']}")
"""

import urllib.request
import json
from typing import Optional, List, Dict, Any

class CryptoNews:
    """Free Crypto News API client."""
    
    BASE_URL = "https://cryptocurrency.cv"
    
    def __init__(self, base_url: Optional[str] = None):
        """
        Initialize the client.
        
        Args:
            base_url: Optional custom API URL (for self-hosted instances)
        """
        self.base_url = base_url or self.BASE_URL
    
    def _request(self, endpoint: str) -> Dict[str, Any]:
        """Make API request."""
        url = f"{self.base_url}{endpoint}"
        with urllib.request.urlopen(url) as response:
            return json.loads(response.read().decode())
    
    def get_latest(self, limit: int = 10, source: Optional[str] = None) -> List[Dict]:
        """
        Get latest crypto news.
        
        Args:
            limit: Max articles (1-50)
            source: Filter by source (coindesk, theblock, decrypt, etc.)
        
        Returns:
            List of news articles
        """
        endpoint = f"/api/news?limit={limit}"
        if source:
            endpoint += f"&source={source}"
        return self._request(endpoint)["articles"]
    
    def search(self, keywords: str, limit: int = 10) -> List[Dict]:
        """
        Search news by keywords.
        
        Args:
            keywords: Comma-separated search terms
            limit: Max results (1-30)
        
        Returns:
            List of matching articles
        """
        encoded = urllib.parse.quote(keywords)
        return self._request(f"/api/search?q={encoded}&limit={limit}")["articles"]
    
    def get_defi(self, limit: int = 10) -> List[Dict]:
        """Get DeFi-specific news."""
        return self._request(f"/api/defi?limit={limit}")["articles"]
    
    def get_bitcoin(self, limit: int = 10) -> List[Dict]:
        """Get Bitcoin-specific news."""
        return self._request(f"/api/bitcoin?limit={limit}")["articles"]
    
    def get_breaking(self, limit: int = 5) -> List[Dict]:
        """Get breaking news (last 2 hours)."""
        return self._request(f"/api/breaking?limit={limit}")["articles"]
    
    def get_sources(self) -> List[Dict]:
        """Get list of all news sources."""
        return self._request("/api/sources")["sources"]
    
    def get_trending(self, limit: int = 10, hours: int = 24) -> Dict:
        """Get trending topics with sentiment."""
        return self._request(f"/api/trending?limit={limit}&hours={hours}")
    
    def get_stats(self) -> Dict:
        """Get API statistics and analytics."""
        return self._request("/api/stats")
    
    def get_health(self) -> Dict:
        """Check API health status."""
        return self._request("/api/health")
    
    def analyze(self, limit: int = 20, topic: Optional[str] = None, sentiment: Optional[str] = None) -> Dict:
        """Get news with topic classification and sentiment analysis."""
        endpoint = f"/api/analyze?limit={limit}"
        if topic:
            endpoint += f"&topic={urllib.parse.quote(topic)}"
        if sentiment:
            endpoint += f"&sentiment={sentiment}"
        return self._request(endpoint)
    
    def get_archive(self, date: Optional[str] = None, query: Optional[str] = None, limit: int = 50) -> Dict:
        """Get archived historical news."""
        params = [f"limit={limit}"]
        if date:
            params.append(f"date={date}")
        if query:
            params.append(f"q={urllib.parse.quote(query)}")
        return self._request(f"/api/archive?{'&'.join(params)}")
    
    def get_origins(self, query: Optional[str] = None, category: Optional[str] = None, limit: int = 20) -> Dict:
        """Find original sources of news."""
        params = [f"limit={limit}"]
        if query:
            params.append(f"q={urllib.parse.quote(query)}")
        if category:
            params.append(f"category={category}")
        return self._request(f"/api/origins?{'&'.join(params)}")
    
    def get_portfolio(self, coins: list, limit: int = 10, include_prices: bool = True) -> Dict:
        """Get portfolio news with optional prices from CoinGecko."""
        coins_param = ','.join(coins) if isinstance(coins, list) else coins
        return self._request(f"/api/portfolio?coins={urllib.parse.quote(coins_param)}&limit={limit}&prices={str(include_prices).lower()}")


# Convenience functions
def get_crypto_news(limit: int = 10) -> List[Dict]:
    """Quick function to get latest news."""
    return CryptoNews().get_latest(limit)

def search_crypto_news(keywords: str, limit: int = 10) -> List[Dict]:
    """Quick function to search news."""
    return CryptoNews().search(keywords, limit)

def get_trending_topics(limit: int = 10) -> List[Dict]:
    """Quick function to get trending topics."""
    return CryptoNews().get_trending(limit)["trending"]


if __name__ == "__main__":
    # Demo
    print("📰 Latest Crypto News\n" + "=" * 50)
    news = CryptoNews()
    for article in news.get_latest(5):
        print(f"\n📌 {article['title']}")
        print(f"   🔗 {article['link']}")
        print(f"   📰 {article['source']} • {article['timeAgo']}")
    
    print("\n\n📊 Trending Topics\n" + "=" * 50)
    trending = news.get_trending(5)
    for topic in trending["trending"]:
        emoji = "🟢" if topic["sentiment"] == "bullish" else "🔴" if topic["sentiment"] == "bearish" else "⚪"
        print(f"{emoji} {topic['topic']}: {topic['count']} mentions")
