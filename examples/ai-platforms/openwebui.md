# OpenWebUI Integration Guide

Complete guide for integrating Free Crypto News with OpenWebUI (formerly Ollama WebUI).

## What is OpenWebUI?

[OpenWebUI](https://openwebui.com) is an open-source, self-hosted WebUI for LLMs that supports Ollama, OpenAI-compatible APIs, and has a powerful tools/functions system.

---

## Integration Methods

| Method | Difficulty | Features | Requirements |
|--------|------------|----------|--------------|
| Tools/Functions | ⭐⭐ Medium | Full API access | OpenWebUI 0.3+ |
| RAG Pipeline | ⭐⭐⭐ Advanced | Context injection | OpenWebUI 0.3+ |
| Custom Model | ⭐ Easy | System prompt | OpenWebUI + Ollama |

---

## Method 1: OpenWebUI Tools (Recommended)

### Step 1: Access Tool Settings

1. Open OpenWebUI (typically `http://localhost:3000`)
2. Go to **Workspace** → **Tools**
3. Click **"+ Create Tool"**

### Step 2: Create Crypto News Tool

**Name:** `crypto_news`

**Description:** Fetch real-time cryptocurrency news

**Code:**

```python
"""
title: Crypto News Tool
description: Fetch real-time cryptocurrency news from Free Crypto News API
author: Free Crypto News
version: 1.0.0
"""

import requests
from typing import Optional, List
from pydantic import BaseModel, Field


class Tools:
    def __init__(self):
        self.base_url = "https://news-crypto.vercel.app"
        self.valves = self.Valves()
    
    class Valves(BaseModel):
        base_url: str = Field(
            default="https://news-crypto.vercel.app",
            description="API base URL"
        )
        default_limit: int = Field(
            default=10,
            description="Default number of articles to fetch"
        )

    def get_news(
        self,
        limit: int = 10,
        category: Optional[str] = None,
        source: Optional[str] = None
    ) -> str:
        """
        Get the latest cryptocurrency news.
        
        :param limit: Number of articles to fetch (1-50)
        :param category: Filter by category (bitcoin, ethereum, defi, nft, regulation)
        :param source: Filter by source (coindesk, theblock, decrypt, etc.)
        :return: Formatted news articles
        """
        params = {"limit": min(limit, 50)}
        if category:
            params["category"] = category
        if source:
            params["source"] = source
        
        try:
            response = requests.get(
                f"{self.valves.base_url}/api/news",
                params=params,
                timeout=10
            )
            data = response.json()
            
            articles = data.get("articles", [])
            if not articles:
                return "No news articles found."
            
            result = "📰 **Latest Crypto News**\n\n"
            for i, article in enumerate(articles, 1):
                result += f"{i}. **{article.get('title', 'No title')}**\n"
                result += f"   Source: {article.get('source', 'Unknown')} | "
                result += f"{article.get('publishedAt', 'Unknown time')}\n"
                result += f"   {article.get('description', '')[:200]}...\n\n"
            
            return result
        except Exception as e:
            return f"Error fetching news: {str(e)}"

    def search_news(self, query: str, limit: int = 10) -> str:
        """
        Search cryptocurrency news by keywords.
        
        :param query: Search query (e.g., "bitcoin etf", "ethereum upgrade")
        :param limit: Number of results (1-50)
        :return: Search results
        """
        try:
            response = requests.get(
                f"{self.valves.base_url}/api/search",
                params={"q": query, "limit": min(limit, 50)},
                timeout=10
            )
            data = response.json()
            
            articles = data.get("articles", [])
            if not articles:
                return f"No results found for '{query}'."
            
            result = f"🔍 **Search Results: '{query}'**\n\n"
            for i, article in enumerate(articles, 1):
                result += f"{i}. **{article.get('title', 'No title')}**\n"
                result += f"   Source: {article.get('source', 'Unknown')}\n"
                result += f"   {article.get('description', '')[:150]}...\n\n"
            
            return result
        except Exception as e:
            return f"Error searching news: {str(e)}"

    def get_sentiment(self, asset: str) -> str:
        """
        Get AI sentiment analysis for a cryptocurrency.
        
        :param asset: Asset symbol (e.g., BTC, ETH, SOL)
        :return: Sentiment analysis
        """
        try:
            response = requests.get(
                f"{self.valves.base_url}/api/ai/sentiment",
                params={"asset": asset.upper()},
                timeout=10
            )
            data = response.json()
            
            score = data.get("score", 0)
            label = data.get("label", "neutral")
            confidence = data.get("confidence", 0)
            
            emoji = "🟢" if label == "positive" else "🔴" if label == "negative" else "🟡"
            
            result = f"📊 **{asset.upper()} Sentiment Analysis**\n\n"
            result += f"{emoji} **Sentiment:** {label.title()}\n"
            result += f"📈 **Score:** {score:.2f} (-1 to 1)\n"
            result += f"🎯 **Confidence:** {confidence:.1%}\n"
            
            return result
        except Exception as e:
            return f"Error getting sentiment: {str(e)}"

    def get_fear_greed(self) -> str:
        """
        Get the Crypto Fear & Greed Index.
        
        :return: Current Fear & Greed Index value and classification
        """
        try:
            response = requests.get(
                f"{self.valves.base_url}/api/market/fear-greed",
                timeout=10
            )
            data = response.json()
            
            value = data.get("value", 50)
            classification = data.get("classification", "Neutral")
            
            if value <= 25:
                emoji = "😱"
            elif value <= 45:
                emoji = "😰"
            elif value <= 55:
                emoji = "😐"
            elif value <= 75:
                emoji = "😊"
            else:
                emoji = "🤑"
            
            result = f"**Fear & Greed Index**\n\n"
            result += f"{emoji} **Value:** {value}/100\n"
            result += f"📊 **Classification:** {classification}\n\n"
            
            if value <= 25:
                result += "💡 *Extreme fear can indicate a buying opportunity.*"
            elif value >= 75:
                result += "⚠️ *Extreme greed may signal an overheated market.*"
            
            return result
        except Exception as e:
            return f"Error getting Fear & Greed: {str(e)}"

    def get_trending(self) -> str:
        """
        Get trending cryptocurrency topics.
        
        :return: Trending topics and hashtags
        """
        try:
            response = requests.get(
                f"{self.valves.base_url}/api/trending",
                timeout=10
            )
            data = response.json()
            
            topics = data.get("topics", [])
            if not topics:
                return "No trending topics found."
            
            result = "🔥 **Trending Crypto Topics**\n\n"
            for topic in topics[:10]:
                name = topic.get("name", "Unknown")
                mentions = topic.get("mentions", 0)
                sentiment = topic.get("sentiment", "neutral")
                emoji = "🟢" if sentiment == "bullish" else "🔴" if sentiment == "bearish" else "🟡"
                result += f"{emoji} **{name}** - {mentions:,} mentions\n"
            
            return result
        except Exception as e:
            return f"Error getting trending: {str(e)}"

    def get_coins(self, limit: int = 20) -> str:
        """
        Get cryptocurrency prices and market data.
        
        :param limit: Number of coins (1-100)
        :return: Coin prices and changes
        """
        try:
            response = requests.get(
                f"{self.valves.base_url}/api/coins",
                params={"limit": min(limit, 100)},
                timeout=10
            )
            data = response.json()
            
            coins = data.get("coins", [])[:limit]
            if not coins:
                return "No coin data found."
            
            result = "💰 **Cryptocurrency Prices**\n\n"
            result += "| Coin | Price | 24h Change |\n"
            result += "|------|-------|------------|\n"
            
            for coin in coins:
                symbol = coin.get("symbol", "???").upper()
                price = coin.get("price", 0)
                change = coin.get("priceChange24h", 0)
                emoji = "📈" if change >= 0 else "📉"
                result += f"| {symbol} | ${price:,.2f} | {emoji} {change:+.2f}% |\n"
            
            return result
        except Exception as e:
            return f"Error getting coins: {str(e)}"

    def get_arbitrage(self) -> str:
        """
        Get cross-exchange arbitrage opportunities.
        
        :return: Current arbitrage opportunities
        """
        try:
            response = requests.get(
                f"{self.valves.base_url}/api/trading/arbitrage",
                timeout=10
            )
            data = response.json()
            
            opportunities = data.get("opportunities", [])[:10]
            if not opportunities:
                return "No significant arbitrage opportunities found."
            
            result = "💱 **Arbitrage Opportunities**\n\n"
            result += "| Pair | Buy @ | Sell @ | Spread |\n"
            result += "|------|-------|--------|--------|\n"
            
            for opp in opportunities:
                pair = opp.get("pair", "???")
                buy = opp.get("buyExchange", "???")
                sell = opp.get("sellExchange", "???")
                spread = opp.get("spreadPercent", 0)
                result += f"| {pair} | {buy} | {sell} | {spread:.2f}% |\n"
            
            result += "\n⚠️ *Spreads don't account for fees. Verify before trading.*"
            return result
        except Exception as e:
            return f"Error getting arbitrage: {str(e)}"

    def get_whale_alerts(self, min_value: int = 1000000) -> str:
        """
        Get whale transaction alerts.
        
        :param min_value: Minimum USD value for whale transactions
        :return: Recent whale movements
        """
        try:
            response = requests.get(
                f"{self.valves.base_url}/api/trading/whales",
                params={"minValue": min_value},
                timeout=10
            )
            data = response.json()
            
            alerts = data.get("alerts", [])[:10]
            if not alerts:
                return "No recent whale movements detected."
            
            result = "🐋 **Whale Alerts**\n\n"
            for alert in alerts:
                token = alert.get("token", "???")
                amount = alert.get("amountUSD", 0)
                from_addr = alert.get("from", "Unknown")[:8]
                to_addr = alert.get("to", "Unknown")[:8]
                result += f"• **{token}** ${amount:,.0f}\n"
                result += f"  {from_addr}... → {to_addr}...\n\n"
            
            return result
        except Exception as e:
            return f"Error getting whale alerts: {str(e)}"

    def get_gas_prices(self) -> str:
        """
        Get current Ethereum gas prices.
        
        :return: Current gas prices (slow, standard, fast)
        """
        try:
            response = requests.get(
                f"{self.valves.base_url}/api/blockchain/gas",
                timeout=10
            )
            data = response.json()
            
            result = "⛽ **Ethereum Gas Prices**\n\n"
            result += f"🐢 **Slow:** {data.get('slow', 0)} gwei\n"
            result += f"🚗 **Standard:** {data.get('standard', 0)} gwei\n"
            result += f"🚀 **Fast:** {data.get('fast', 0)} gwei\n"
            result += f"⚡ **Instant:** {data.get('instant', 0)} gwei\n"
            
            if data.get('baseFee'):
                result += f"\n📊 **Base Fee:** {data.get('baseFee')} gwei"
            
            return result
        except Exception as e:
            return f"Error getting gas prices: {str(e)}"
```

### Step 3: Save and Enable

1. Click **"Save"**
2. The tool is now available in all chats

### Step 4: Test the Tool

Start a chat and try:
- "Get the latest crypto news"
- "Search for Bitcoin ETF updates"
- "What's the current Fear & Greed Index?"
- "Show me Ethereum sentiment"
- "Get whale alerts"

---

## Method 2: Function Calling

For models that support function calling (GPT-4, Claude, etc.):

### Step 1: Create Function

Go to **Workspace** → **Functions** → **+ Create Function**

**Name:** `crypto_api`

**Code:**

```python
"""
title: Crypto API Functions
description: Function calling interface for crypto news
author: Free Crypto News
version: 1.0.0
"""

import requests
import json
from typing import Optional


class Functions:
    def __init__(self):
        self.base_url = "https://news-crypto.vercel.app"

    async def get_crypto_data(
        self,
        action: str,
        params: Optional[dict] = None,
        __user__: Optional[dict] = None
    ) -> str:
        """
        Unified crypto data function.
        
        :param action: Action to perform (news, search, sentiment, fear_greed, trending, coins)
        :param params: Additional parameters for the action
        :return: Formatted response
        """
        params = params or {}
        
        endpoints = {
            "news": "/api/news",
            "search": "/api/search",
            "sentiment": "/api/ai/sentiment",
            "fear_greed": "/api/market/fear-greed",
            "trending": "/api/trending",
            "coins": "/api/coins",
            "breaking": "/api/breaking",
            "arbitrage": "/api/trading/arbitrage",
            "whales": "/api/trading/whales",
            "gas": "/api/blockchain/gas"
        }
        
        if action not in endpoints:
            return f"Unknown action: {action}. Available: {', '.join(endpoints.keys())}"
        
        try:
            response = requests.get(
                f"{self.base_url}{endpoints[action]}",
                params=params,
                timeout=15
            )
            return json.dumps(response.json(), indent=2)
        except Exception as e:
            return f"Error: {str(e)}"
```

---

## Method 3: Model File with System Prompt

For Ollama models, create a custom modelfile:

### Step 1: Create Modelfile

```dockerfile
FROM llama3.2

SYSTEM """
You are a cryptocurrency news analyst with access to real-time market data.

When users ask about crypto news or markets, use the Free Crypto News API:
- Base URL: https://news-crypto.vercel.app
- No API key required

Key endpoints:
- GET /api/news?limit=10 - Latest news
- GET /api/search?q={query} - Search news
- GET /api/ai/sentiment?asset={symbol} - Sentiment analysis
- GET /api/market/fear-greed - Fear & Greed Index
- GET /api/trending - Trending topics
- GET /api/coins - Cryptocurrency prices

Always:
1. Provide balanced analysis
2. Cite sources when possible
3. Include relevant metrics
4. Warn about market risks
5. Never give financial advice

Format responses with emojis for clarity:
📰 News | 📊 Data | 🔥 Trending | ⚠️ Risk
"""

PARAMETER temperature 0.7
PARAMETER num_ctx 4096
```

### Step 2: Create the Model

```bash
ollama create crypto-analyst -f Modelfile
```

### Step 3: Use in OpenWebUI

Select "crypto-analyst" as your model in OpenWebUI.

---

## Example Conversations

### Market Briefing

**User:** Give me a complete crypto market update

**OpenWebUI (with tools):**
```
📊 **Crypto Market Update**

I've fetched the latest data for you:

**Fear & Greed Index:** 68/100 (Greed) 😊
The market is showing optimism but not extreme greed.

**Top Cryptocurrencies:**
| Coin | Price | 24h |
|------|-------|-----|
| BTC | $92,345 | 📈 +2.3% |
| ETH | $3,456 | 📈 +1.8% |
| SOL | $145 | 📈 +5.2% |

**📰 Top Headlines:**
1. "Bitcoin breaks $92K on institutional buying" - CoinDesk
2. "Ethereum gas fees drop 40% after upgrade" - The Block
3. "Solana DEX volume hits record highs" - Decrypt

**🔥 Trending Topics:**
🟢 #BitcoinETF - 12,453 mentions (bullish)
🟢 #Layer2 - 8,234 mentions (bullish)
🟡 #Regulation - 5,891 mentions (neutral)

**🐋 Recent Whale Activity:**
• BTC $50M moved from Binance → Cold wallet
• ETH $25M staked on Lido

Would you like me to dive deeper into any of these topics?
```

---

## Troubleshooting

### Tools Not Appearing

1. Verify Python syntax in tool code
2. Check OpenWebUI version (0.3+)
3. Restart the container/service

### API Errors

1. Test the endpoint:
```bash
curl https://news-crypto.vercel.app/api/news?limit=5
```

2. Check network connectivity from container
3. Increase timeout in tool code

### Slow Responses

1. Reduce `limit` parameters
2. Use specific endpoints
3. Add caching to frequently used tools

---

## Links

- **OpenWebUI:** https://openwebui.com
- **OpenWebUI Docs:** https://docs.openwebui.com
- **OpenWebUI GitHub:** https://github.com/open-webui/open-webui
- **Ollama:** https://ollama.ai
- **API Documentation:** https://news-crypto.vercel.app/docs/api
