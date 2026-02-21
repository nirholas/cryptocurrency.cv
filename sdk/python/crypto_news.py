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
import urllib.parse
import json
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Optional, List, Dict, Any, Tuple

__all__ = [
    "CryptoNews",
    "COIN_PAIRS",
    "get_crypto_news",
    "search_crypto_news",
    "get_trending_topics",
    "get_coin_sentiment",
]

# Trading-terminal key → search keyword mapping.
# Left side: exchange pair symbol; right side: keyword used for news search.
# Inspired by CyberPunkMetalHead/cryptocurrency-news-analysis.
# No external API needed — this project provides news for free.
COIN_PAIRS: Dict[str, str] = {
    "BTCUSD":  "Bitcoin",
    "ETHUSD":  "Ethereum",
    "LTCUSD":  "Litecoin",
    "XRPUSD":  "Ripple",
    "SOLUSD":  "Solana",
    "BNBUSD":  "Binance",
    "ADAUSD":  "Cardano",
    "AVAXUSD": "Avalanche",
    "DOTUSD":  "Polkadot",
    "MATICUSD":"Polygon",
    "DOGEUSD": "Dogecoin",
    "TRXUSD":  "Tron",
    "XLMUSD":  "Stellar Lumens",
    "XMRUSD":  "Monero",
    "ZECUSD":  "Zcash",
    "BATUSD":  "Basic Attention Token",
    "EOSUSD":  "EOS",
    "NEOUSD":  "NEO",
    "ETCUSD":  "Ethereum Classic",
}

# Graded sentiment scores shared by CryptoNews.get_coin_sentiment and helpers.
# Maps API sentiment labels → score weight on the −1 … +1 axis.
_SCORE_MAP: Dict[str, float] = {
    "very_bullish": +1.0,
    "bullish":      +0.5,
    "neutral":       0.0,
    "bearish":      -0.5,
    "very_bearish": -1.0,
}
# 5-tier signal derived from score value (same vocabulary as the API).
# Thresholds chosen so +0.5 (avg bullish article) → "bullish" etc.
_SCORE_SIGNAL_TIERS = [
    ( 0.5,  "very_bullish"),
    ( 0.15, "bullish"),
    (-0.15, "neutral"),
    (-0.5,  "bearish"),
    (-999,  "very_bearish"),
]


class CryptoNews:
    """Free Crypto News API client."""
    
    BASE_URL = "https://cryptocurrency.cv"
    
    def __init__(self, base_url: Optional[str] = None, timeout: float = 10.0):
        """
        Initialize the client.

        Args:
            base_url: Optional custom API URL (for self-hosted instances).
            timeout:  HTTP request timeout in seconds (default 10).
        """
        self.base_url = base_url or self.BASE_URL
        self.timeout = timeout

    def _request(self, endpoint: str) -> Dict[str, Any]:
        """Make API request with timeout."""
        url = f"{self.base_url}{endpoint}"
        with urllib.request.urlopen(url, timeout=self.timeout) as response:
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

    def get_coin_sentiment(
        self,
        coins: Optional[Dict[str, str]] = None,
        limit: int = 30,
        min_articles: int = 5,
        min_confidence: float = 20.0,
        workers: int = 8,
    ) -> Dict[str, Dict]:
        """
        Calculate per-coin sentiment with confidence weighting and trade filtering.

        Implements the weight logic from the original TODO: signals backed by too
        few articles, or with too small a margin between bullish/bearish, are
        suppressed via ``tradeable=False`` and a low ``confidence`` score.

        Uses this project's free API — no external search or sentiment key needed.
        Inspired by CyberPunkMetalHead/cryptocurrency-news-analysis.

        Args:
            coins:          Dict mapping trading pair → search keyword.
                            Defaults to the module-level ``COIN_PAIRS``.
            limit:          Max articles to fetch per coin (default 30).
            min_articles:   Minimum number of articles required before a signal
                            is considered actionable (default 5).  A single
                            bullish headline will NOT produce ``tradeable=True``.
            min_confidence: Minimum confidence score (0–100) for ``tradeable``
                            to be set to ``True`` (default 20.0).
            workers:        Max parallel HTTP requests (default 8).  Set to 1
                            to disable concurrency.

        Returns:
            Dict keyed by trading pair symbol::

                {
                  "BTCUSD": {
                    "keyword":    "Bitcoin",
                    "articles":   25,
                    "pos":        64.0,       # % titles classified bullish/very_bullish
                    "mid":        20.0,       # % titles classified neutral
                    "neg":        16.0,       # % titles classified bearish/very_bearish
                    "score":      0.54,       # weighted average: −1.0 (bear) … +1.0 (bull)
                    "signal":     "bullish",  # 5-tier: very_bullish/bullish/neutral/bearish/very_bearish
                    "confidence": 43.2,       # 0–100; penalised by low volume & thin margin
                    "tradeable":  True,       # False when evidence is too thin to act on
                    "reason":     "",         # non-empty string explaining suppression when tradeable=False
                  },
                  ...
                }

        Confidence formula
        ------------------
        Two independent factors are multiplied together:

        * **Volume weight** – scales from 0 → 1 as article count approaches
          ``min_articles``, capped at 1.0 above that threshold.  This directly
          resolves the original TODO: a single-article signal can never exceed
          ``1/min_articles`` on this axis alone.

        * **Margin weight** – the percentage-point gap between the dominant
          sentiment bucket and the nearest rival, normalised to 0–1.
          A 50 % vs 49 % split produces near-zero margin weight.

        ``confidence = volume_weight × margin_weight × 100``

        The weighted ``score`` uses graded sentiment values
        (``very_bullish=+1``, ``bullish=+0.5``, ``neutral=0``,
        ``bearish=−0.5``, ``very_bearish=−1``) so strong signals outweigh mild
        ones and the result is normalised to the −1 … +1 range.

        Signal derivation
        -----------------
        ``signal`` is derived from ``score`` (not raw bucket counts), giving 5
        tiers that match the API's own vocabulary:

        +--------+---------------+
        | score  | signal        |
        +========+===============+
        |  ≥ 0.5 | very_bullish  |
        | ≥ 0.15 | bullish       |
        | > −0.15| neutral       |
        | > −0.5 | bearish       |
        | ≤ −0.5 | very_bearish  |
        +--------+---------------+

        ``reason`` is set to a human-readable string whenever
        ``tradeable=False``, and is an empty string otherwise.

        Example::

            news = CryptoNews()
            report = news.get_coin_sentiment(
                {"BTCUSD": "Bitcoin", "ETHUSD": "Ethereum"},
                min_articles=5,
                min_confidence=20.0,
            )
            for pair, data in report.items():
                if data["tradeable"]:
                    print(f"TRADE  {pair}: {data['signal']}  conf={data['confidence']:.1f}")
                else:
                    print(f"SKIP   {pair}: insufficient evidence ({data['articles']} articles)")
        """
        if coins is None:
            coins = COIN_PAIRS

        _BULLISH = {"very_bullish", "bullish"}
        _BEARISH = {"very_bearish", "bearish"}

        def _fetch_one(pair: str, keyword: str) -> Tuple[str, Dict]:
            """Fetch and score a single coin; always returns a result dict."""
            try:
                data = self.analyze(limit=limit, topic=keyword)
                articles = data.get("articles", [])
                total = len(articles)

                if total == 0:
                    return pair, {
                        "keyword": keyword, "articles": 0,
                        "pos": 0.0, "mid": 0.0, "neg": 0.0,
                        "score": 0.0, "signal": "neutral",
                        "confidence": 0.0, "tradeable": False,
                        "reason": "no articles found",
                    }

                pos = sum(1 for a in articles if a.get("sentiment") in _BULLISH)
                neg = sum(1 for a in articles if a.get("sentiment") in _BEARISH)
                mid = total - pos - neg

                pos_pct = pos * 100 / total
                mid_pct = mid * 100 / total
                neg_pct = neg * 100 / total

                raw_score = sum(
                    _SCORE_MAP.get(a.get("sentiment", "neutral"), 0.0)
                    for a in articles
                )
                score = round(raw_score / total, 4)

                signal = next(
                    label for threshold, label in _SCORE_SIGNAL_TIERS
                    if score >= threshold
                )

                volume_weight = min(total / max(min_articles, 1), 1.0)
                pct_vals = sorted([pos_pct, mid_pct, neg_pct], reverse=True)
                margin_weight = max(pct_vals[0] - pct_vals[1], 0.0) / 100.0
                confidence = round(volume_weight * margin_weight * 100, 1)

                reasons: List[str] = []
                if total < min_articles:
                    reasons.append(
                        f"only {total} article{'s' if total != 1 else ''} found (min {min_articles})"
                    )
                if confidence < min_confidence:
                    reasons.append(
                        f"confidence {confidence:.1f} below threshold {min_confidence:.1f}"
                    )

                return pair, {
                    "keyword":    keyword,
                    "articles":   total,
                    "pos":        round(pos_pct, 1),
                    "mid":        round(mid_pct, 1),
                    "neg":        round(neg_pct, 1),
                    "score":      score,
                    "signal":     signal,
                    "confidence": confidence,
                    "tradeable":  len(reasons) == 0,
                    "reason":     "; ".join(reasons),
                }

            except Exception as e:
                return pair, {
                    "keyword":  keyword,
                    "articles": 0,
                    "pos": 0.0, "mid": 0.0, "neg": 0.0,
                    "score": 0.0, "signal": "error",
                    "confidence": 0.0, "tradeable": False,
                    "reason": str(e),
                }

        results: Dict[str, Dict] = {}
        with ThreadPoolExecutor(max_workers=min(workers, len(coins))) as pool:
            futures = {pool.submit(_fetch_one, pair, kw): pair for pair, kw in coins.items()}
            for future in as_completed(futures):
                pair, result = future.result()
                results[pair] = result

        # Return in original insertion order.
        return {pair: results[pair] for pair in coins if pair in results}


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


def get_coin_sentiment(
    coins: Optional[Dict[str, str]] = None,
    limit: int = 30,
    min_articles: int = 5,
    min_confidence: float = 20.0,
    workers: int = 8,
) -> Dict[str, Dict]:
    """
    Calculate per-coin sentiment with confidence weighting and trade filtering.
    No external API key required.

    Args:
        coins:          Dict of {trading_pair: keyword}. Defaults to COIN_PAIRS.
        limit:          Articles per coin (default 30).
        min_articles:   Minimum articles before a signal is tradeable (default 5).
        min_confidence: Minimum confidence score (0-100) for tradeable=True (default 20).
        workers:        Max parallel HTTP requests (default 8).

    Returns:
        {"BTCUSD": {"pos": 64.0, "mid": 20.0, "neg": 16.0,
                    "signal": "bullish", "confidence": 43.2, "tradeable": True, ...}}
    """
    return CryptoNews().get_coin_sentiment(
        coins=coins, limit=limit,
        min_articles=min_articles, min_confidence=min_confidence,
        workers=workers,
    )


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

    print("\n\n🎯 Coin Sentiment (top 5 pairs)\n" + "=" * 50)
    print(f"  {'Pair':<10} {'Keyword':<20} {'Signal':<10} {'Pos':>6} {'Mid':>6} {'Neg':>6} {'Score':>7} {'Conf':>6} {'Arts':>5}  Trade?")
    print("  " + "-" * 90)
    sentiment = news.get_coin_sentiment(
        coins=dict(list(COIN_PAIRS.items())[:5]),
        limit=15,
        min_articles=5,
        min_confidence=20.0,
    )
    for pair, data in sentiment.items():
        if data.get("articles", 0) == 0:
            print(f"  {pair:<10} {data['keyword']:<20}  (no articles found)")
            continue
        sig = data["signal"]
        if "very_bullish" in sig:
            arrow = "🟢🟢"
        elif "bullish" in sig:
            arrow = "🟢  "
        elif "very_bearish" in sig:
            arrow = "🔴🔴"
        elif "bearish" in sig:
            arrow = "🔴  "
        else:
            arrow = "⚪  "
        trade_flag = "✅ YES" if data["tradeable"] else "🚫 NO "
        reason_str = f"  ({data['reason']})" if data.get("reason") else ""
        print(
            f"  {pair:<10} {data['keyword']:<20} {arrow} {sig:<14}"
            f"  pos={data['pos']:5.1f}%  mid={data['mid']:5.1f}%  neg={data['neg']:5.1f}%"
            f"  score={data['score']:+.3f}  conf={data['confidence']:5.1f}  n={data['articles']:3d}   {trade_flag}{reason_str}"
        )
