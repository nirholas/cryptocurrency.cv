# AutoGPT Integration Guide

Complete guide for using Free Crypto News with AutoGPT.

## What is AutoGPT?

[AutoGPT](https://github.com/Significant-Gravitas/AutoGPT) is an autonomous AI agent that chains together LLM calls to accomplish complex tasks with minimal human intervention.

---

## Integration Methods

| Method | Difficulty | Features | Version |
|--------|------------|----------|---------|
| Plugin | ⭐⭐ Medium | Full API access | AutoGPT 0.4+ |
| Command | ⭐⭐⭐ Advanced | Custom commands | Any |
| Forge Component | ⭐⭐⭐ Advanced | Modular | Forge |

---

## Method 1: AutoGPT Plugin

### Step 1: Create Plugin Directory

```bash
cd autogpt/plugins
mkdir crypto_news_plugin
cd crypto_news_plugin
```

### Step 2: Create Plugin Files

**`__init__.py`**

```python
"""Free Crypto News Plugin for AutoGPT"""

from .crypto_news import CryptoNewsPlugin

__all__ = ["CryptoNewsPlugin"]
```

**`crypto_news.py`**

```python
"""
Free Crypto News Plugin
Provides real-time cryptocurrency news and market data.
"""

import requests
from typing import Optional, Dict, Any, List
from auto_gpt_plugin_template import AutoGPTPluginTemplate


class CryptoNewsPlugin(AutoGPTPluginTemplate):
    """Plugin for accessing Free Crypto News API."""

    def __init__(self):
        super().__init__()
        self._name = "Free-Crypto-News"
        self._version = "1.0.0"
        self._description = "Real-time cryptocurrency news and market data"
        self.api_base = "https://cryptocurrency.cv"

    def _fetch(self, endpoint: str, params: Dict[str, Any] = None) -> Dict:
        """Fetch data from the API."""
        try:
            response = requests.get(
                f"{self.api_base}{endpoint}",
                params=params or {},
                timeout=15
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            return {"error": str(e)}

    def can_handle_on_response(self) -> bool:
        return False

    def on_response(self, response: str, *args, **kwargs) -> str:
        return response

    def can_handle_post_prompt(self) -> bool:
        return True

    def post_prompt(self, prompt: str) -> str:
        """Add crypto context to prompts."""
        return prompt

    def can_handle_on_planning(self) -> bool:
        return False

    def on_planning(self, prompt: str, messages: List) -> Optional[str]:
        return None

    def can_handle_post_planning(self) -> bool:
        return False

    def post_planning(self, response: str) -> str:
        return response

    def can_handle_pre_instruction(self) -> bool:
        return False

    def pre_instruction(self, messages: List) -> List:
        return messages

    def can_handle_on_instruction(self) -> bool:
        return False

    def on_instruction(self, messages: List) -> Optional[str]:
        return None

    def can_handle_post_instruction(self) -> bool:
        return False

    def post_instruction(self, response: str) -> str:
        return response

    def can_handle_pre_command(self) -> bool:
        return False

    def pre_command(self, command_name: str, arguments: Dict) -> tuple:
        return command_name, arguments

    def can_handle_post_command(self) -> bool:
        return False

    def post_command(self, command_name: str, response: str) -> str:
        return response

    def can_handle_chat_completion(
        self, messages: List, model: str, temperature: float, max_tokens: int
    ) -> bool:
        return False

    def handle_chat_completion(
        self, messages: List, model: str, temperature: float, max_tokens: int
    ) -> str:
        return None

    def can_handle_text_embedding(self, text: str) -> bool:
        return False

    def handle_text_embedding(self, text: str) -> list:
        return None

    def can_handle_user_input(self, user_input: str) -> bool:
        return False

    def user_input(self, user_input: str) -> str:
        return user_input

    def can_handle_report(self) -> bool:
        return False

    def report(self, message: str) -> None:
        pass

    # ============= PLUGIN COMMANDS =============

    def get_crypto_news(
        self,
        limit: int = 10,
        category: Optional[str] = None
    ) -> str:
        """
        Get latest cryptocurrency news.
        
        Args:
            limit: Number of articles (1-50)
            category: Filter (bitcoin, ethereum, defi, nft, regulation)
        
        Returns:
            Formatted news articles
        """
        params = {"limit": min(limit, 50)}
        if category:
            params["category"] = category
        
        data = self._fetch("/api/news", params)
        
        if "error" in data:
            return f"Error: {data['error']}"
        
        articles = data.get("articles", [])
        if not articles:
            return "No news articles found."
        
        result = ["📰 Latest Crypto News:", ""]
        for i, article in enumerate(articles, 1):
            result.append(f"{i}. {article.get('title', 'No title')}")
            result.append(f"   Source: {article.get('source', 'Unknown')}")
            result.append(f"   {article.get('description', '')[:150]}...")
            result.append("")
        
        return "\n".join(result)

    def search_crypto_news(self, query: str, limit: int = 10) -> str:
        """
        Search cryptocurrency news.
        
        Args:
            query: Search query
            limit: Number of results (1-50)
        
        Returns:
            Search results
        """
        data = self._fetch("/api/search", {"q": query, "limit": min(limit, 50)})
        
        if "error" in data:
            return f"Error: {data['error']}"
        
        articles = data.get("articles", [])
        if not articles:
            return f"No results found for '{query}'."
        
        result = [f"🔍 Results for '{query}':", ""]
        for i, article in enumerate(articles, 1):
            result.append(f"{i}. {article.get('title', 'No title')}")
            result.append(f"   Source: {article.get('source', 'Unknown')}")
            result.append("")
        
        return "\n".join(result)

    def get_sentiment(self, asset: str) -> str:
        """
        Get AI sentiment for a cryptocurrency.
        
        Args:
            asset: Symbol (BTC, ETH, SOL, etc.)
        
        Returns:
            Sentiment analysis
        """
        data = self._fetch("/api/ai/sentiment", {"asset": asset.upper()})
        
        if "error" in data:
            return f"Error: {data['error']}"
        
        score = data.get("score", 0)
        label = data.get("label", "neutral")
        confidence = data.get("confidence", 0)
        
        emoji = "🚀" if score > 0.3 else "📉" if score < -0.3 else "😐"
        
        return f"""
{emoji} {asset.upper()} Sentiment Analysis:
- Label: {label.title()}
- Score: {score:.2f} (-1 bearish to +1 bullish)
- Confidence: {confidence:.1%}
"""

    def get_fear_greed(self) -> str:
        """
        Get the Fear & Greed Index.
        
        Returns:
            Current index value and interpretation
        """
        data = self._fetch("/api/market/fear-greed")
        
        if "error" in data:
            return f"Error: {data['error']}"
        
        value = data.get("value", 50)
        classification = data.get("classification", "Neutral")
        
        if value <= 25:
            emoji, advice = "😱", "Extreme fear - potential buying opportunity"
        elif value <= 45:
            emoji, advice = "😰", "Fear - market may be undervalued"
        elif value <= 55:
            emoji, advice = "😐", "Neutral - market is balanced"
        elif value <= 75:
            emoji, advice = "😊", "Greed - exercise caution"
        else:
            emoji, advice = "🤑", "Extreme greed - market may be overheated"
        
        return f"""
{emoji} Fear & Greed Index: {value}/100
Classification: {classification}
Interpretation: {advice}
"""

    def get_trending(self) -> str:
        """Get trending crypto topics."""
        data = self._fetch("/api/trending")
        
        if "error" in data:
            return f"Error: {data['error']}"
        
        topics = data.get("topics", [])[:10]
        if not topics:
            return "No trending topics found."
        
        result = ["🔥 Trending Crypto Topics:", ""]
        for topic in topics:
            name = topic.get("name", "Unknown")
            mentions = topic.get("mentions", 0)
            sentiment = topic.get("sentiment", "neutral")
            emoji = "🟢" if sentiment == "bullish" else "🔴" if sentiment == "bearish" else "🟡"
            result.append(f"{emoji} {name}: {mentions:,} mentions")
        
        return "\n".join(result)

    def get_prices(self, limit: int = 10) -> str:
        """
        Get cryptocurrency prices.
        
        Args:
            limit: Number of coins (1-100)
        
        Returns:
            Price list with 24h changes
        """
        data = self._fetch("/api/coins", {"limit": min(limit, 100)})
        
        if "error" in data:
            return f"Error: {data['error']}"
        
        coins = data.get("coins", [])[:limit]
        if not coins:
            return "No price data available."
        
        result = ["💰 Crypto Prices:", ""]
        for coin in coins:
            symbol = coin.get("symbol", "???").upper()
            price = coin.get("price", 0)
            change = coin.get("priceChange24h", 0)
            emoji = "📈" if change >= 0 else "📉"
            result.append(f"{symbol}: ${price:,.2f} {emoji} {change:+.2f}%")
        
        return "\n".join(result)

    def get_whales(self, min_value: int = 1000000) -> str:
        """
        Get whale transaction alerts.
        
        Args:
            min_value: Minimum USD value
        
        Returns:
            Recent whale movements
        """
        data = self._fetch("/api/trading/whales", {"minValue": min_value})
        
        if "error" in data:
            return f"Error: {data['error']}"
        
        alerts = data.get("alerts", [])[:10]
        if not alerts:
            return "No recent whale movements detected."
        
        result = [f"🐋 Whale Alerts (>= ${min_value:,}):", ""]
        for alert in alerts:
            token = alert.get("token", "???")
            amount = alert.get("amountUSD", 0)
            result.append(f"• {token}: ${amount:,.0f}")
        
        return "\n".join(result)

    def get_arbitrage(self) -> str:
        """Get arbitrage opportunities."""
        data = self._fetch("/api/trading/arbitrage")
        
        if "error" in data:
            return f"Error: {data['error']}"
        
        opportunities = data.get("opportunities", [])[:10]
        if not opportunities:
            return "No significant arbitrage opportunities."
        
        result = ["💱 Arbitrage Opportunities:", ""]
        for opp in opportunities:
            pair = opp.get("pair", "???")
            spread = opp.get("spreadPercent", 0)
            buy = opp.get("buyExchange", "???")
            sell = opp.get("sellExchange", "???")
            result.append(f"• {pair}: {spread:.2f}% (Buy @ {buy}, Sell @ {sell})")
        
        result.append("")
        result.append("⚠️ Verify fees before trading.")
        return "\n".join(result)

    def market_overview(self) -> str:
        """Get complete market overview."""
        # Fetch all data
        fg = self._fetch("/api/market/fear-greed")
        news = self._fetch("/api/news", {"limit": 3})
        trending = self._fetch("/api/trending")
        
        result = ["📊 CRYPTO MARKET OVERVIEW", "=" * 30, ""]
        
        # Fear & Greed
        if "error" not in fg:
            result.append(f"Fear & Greed Index: {fg.get('value', '?')}/100 ({fg.get('classification', '?')})")
            result.append("")
        
        # Top Headlines
        if "error" not in news:
            result.append("📰 Top Headlines:")
            for article in news.get("articles", [])[:3]:
                result.append(f"  • {article.get('title', 'No title')}")
            result.append("")
        
        # Trending
        if "error" not in trending:
            result.append("🔥 Trending:")
            for topic in trending.get("topics", [])[:5]:
                result.append(f"  • {topic.get('name', '?')}: {topic.get('mentions', 0)} mentions")
        
        return "\n".join(result)
```

### Step 3: Register Plugin

Add to `.env`:

```env
ALLOWLISTED_PLUGINS=CryptoNewsPlugin
```

Or `plugins_config.yaml`:

```yaml
CryptoNewsPlugin:
  enabled: true
  config:
    api_base: "https://cryptocurrency.cv"
```

---

## Method 2: Custom Commands

Add commands directly to AutoGPT:

### `commands/crypto_commands.py`

```python
"""Crypto news commands for AutoGPT."""

import requests
from autogpt.commands.command import command

API_BASE = "https://cryptocurrency.cv"


@command(
    "crypto_news",
    "Get latest cryptocurrency news",
    {
        "limit": {"type": "integer", "description": "Number of articles (default: 10)", "required": False},
        "category": {"type": "string", "description": "Category filter", "required": False}
    }
)
def crypto_news(limit: int = 10, category: str = None) -> str:
    """Fetch latest crypto news."""
    params = {"limit": min(limit, 50)}
    if category:
        params["category"] = category
    
    try:
        response = requests.get(f"{API_BASE}/api/news", params=params, timeout=15)
        data = response.json()
        
        articles = data.get("articles", [])
        if not articles:
            return "No news found."
        
        result = []
        for i, a in enumerate(articles, 1):
            result.append(f"{i}. {a.get('title')} ({a.get('source')})")
        
        return "\n".join(result)
    except Exception as e:
        return f"Error: {e}"


@command(
    "crypto_search",
    "Search cryptocurrency news",
    {"query": {"type": "string", "description": "Search query", "required": True}}
)
def crypto_search(query: str) -> str:
    """Search crypto news."""
    try:
        response = requests.get(
            f"{API_BASE}/api/search",
            params={"q": query, "limit": 10},
            timeout=15
        )
        data = response.json()
        
        articles = data.get("articles", [])
        if not articles:
            return f"No results for '{query}'."
        
        return "\n".join([a.get("title") for a in articles])
    except Exception as e:
        return f"Error: {e}"


@command(
    "crypto_sentiment",
    "Get AI sentiment for cryptocurrency",
    {"asset": {"type": "string", "description": "Asset symbol (BTC, ETH)", "required": True}}
)
def crypto_sentiment(asset: str) -> str:
    """Get sentiment analysis."""
    try:
        response = requests.get(
            f"{API_BASE}/api/ai/sentiment",
            params={"asset": asset.upper()},
            timeout=15
        )
        data = response.json()
        
        return f"{asset.upper()}: {data.get('label')} (score: {data.get('score'):.2f})"
    except Exception as e:
        return f"Error: {e}"


@command(
    "crypto_fear_greed",
    "Get Fear & Greed Index",
    {}
)
def crypto_fear_greed() -> str:
    """Get Fear & Greed Index."""
    try:
        response = requests.get(f"{API_BASE}/api/market/fear-greed", timeout=15)
        data = response.json()
        return f"Fear & Greed: {data.get('value')}/100 ({data.get('classification')})"
    except Exception as e:
        return f"Error: {e}"


@command(
    "crypto_prices",
    "Get cryptocurrency prices",
    {"limit": {"type": "integer", "description": "Number of coins", "required": False}}
)
def crypto_prices(limit: int = 10) -> str:
    """Get crypto prices."""
    try:
        response = requests.get(
            f"{API_BASE}/api/coins",
            params={"limit": min(limit, 100)},
            timeout=15
        )
        data = response.json()
        
        coins = data.get("coins", [])[:limit]
        return "\n".join([
            f"{c.get('symbol')}: ${c.get('price'):,.2f} ({c.get('priceChange24h'):+.2f}%)"
            for c in coins
        ])
    except Exception as e:
        return f"Error: {e}"


@command(
    "crypto_market_overview",
    "Get complete market overview",
    {}
)
def crypto_market_overview() -> str:
    """Get market overview."""
    try:
        fg = requests.get(f"{API_BASE}/api/market/fear-greed", timeout=15).json()
        news = requests.get(f"{API_BASE}/api/news?limit=3", timeout=15).json()
        
        result = [
            f"Fear & Greed: {fg.get('value')}/100 ({fg.get('classification')})",
            "",
            "Headlines:",
        ]
        for a in news.get("articles", [])[:3]:
            result.append(f"• {a.get('title')}")
        
        return "\n".join(result)
    except Exception as e:
        return f"Error: {e}"
```

---

## Example Agent Goals

### Market Research Agent

```
Goal: Research the current cryptocurrency market
Tasks:
1. Get the Fear & Greed Index
2. Fetch the latest 10 news articles
3. Analyze sentiment for BTC and ETH
4. Identify trending topics
5. Write a market summary report
```

### Trading Opportunity Finder

```
Goal: Find trading opportunities in crypto markets
Tasks:
1. Check arbitrage opportunities across exchanges
2. Monitor whale transactions over $5 million
3. Analyze sentiment for top 5 cryptocurrencies
4. Look for breaking news that might affect prices
5. Compile a list of potential opportunities with risk assessments
```

### News Analyst Agent

```
Goal: Analyze crypto news and create a daily briefing
Tasks:
1. Fetch the latest 20 news articles
2. Categorize by topic (regulation, DeFi, Bitcoin, etc.)
3. Identify positive and negative news
4. Search for specific topics: "Bitcoin ETF", "Ethereum upgrade", "SEC"
5. Create a formatted daily briefing document
```

---

## Links

- **AutoGPT:** https://github.com/Significant-Gravitas/AutoGPT
- **AutoGPT Docs:** https://docs.agpt.co
- **AutoGPT Forge:** https://github.com/Significant-Gravitas/AutoGPT/tree/master/autogpts/forge
- **Plugin Template:** https://github.com/Significant-Gravitas/Auto-GPT-Plugin-Template
- **Free Crypto News API:** https://cryptocurrency.cv
