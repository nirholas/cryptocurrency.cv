# CrewAI Integration Guide

Complete guide for using Free Crypto News with CrewAI multi-agent framework.

## What is CrewAI?

[CrewAI](https://crewai.com) is a framework for orchestrating role-playing autonomous AI agents that collaborate on complex tasks.

---

## Integration Methods

| Method | Difficulty | Features | Best For |
|--------|------------|----------|----------|
| Custom Tools | ⭐⭐ Medium | Full API access | Single agent |
| Toolkit | ⭐⭐ Medium | Bundled tools | Crew access |
| MCP Integration | ⭐⭐⭐ Advanced | Protocol-based | Enterprise |

---

## Installation

```bash
pip install crewai crewai-tools requests
```

---

## Method 1: Custom Tools

### Create Crypto Tools

```python
"""
Free Crypto News Tools for CrewAI
"""

from crewai_tools import BaseTool
from typing import Optional, Type
from pydantic import BaseModel, Field
import requests


API_BASE = "https://cryptocurrency.cv"


def fetch_api(endpoint: str, params: dict = None) -> dict:
    """Fetch data from the API."""
    try:
        response = requests.get(
            f"{API_BASE}{endpoint}",
            params=params or {},
            timeout=15
        )
        response.raise_for_status()
        return response.json()
    except Exception as e:
        return {"error": str(e)}


# ============= TOOL DEFINITIONS =============

class CryptoNewsInput(BaseModel):
    """Input for the crypto news tool."""
    limit: int = Field(default=10, description="Number of articles (1-50)")
    category: Optional[str] = Field(
        default=None,
        description="Category: bitcoin, ethereum, defi, nft, regulation"
    )


class CryptoNewsTool(BaseTool):
    name: str = "crypto_news"
    description: str = "Get the latest cryptocurrency news articles. Use this to stay updated on market events."
    args_schema: Type[BaseModel] = CryptoNewsInput

    def _run(self, limit: int = 10, category: Optional[str] = None) -> str:
        params = {"limit": min(limit, 50)}
        if category:
            params["category"] = category
        
        data = fetch_api("/api/news", params)
        
        if "error" in data:
            return f"Error: {data['error']}"
        
        articles = data.get("articles", [])
        if not articles:
            return "No news articles found."
        
        result = ["📰 Latest Crypto News:", ""]
        for i, article in enumerate(articles, 1):
            result.append(f"{i}. **{article.get('title', 'No title')}**")
            result.append(f"   Source: {article.get('source', 'Unknown')}")
            result.append(f"   Date: {article.get('publishedAt', 'Unknown')}")
            result.append(f"   Summary: {article.get('description', 'No description')[:200]}")
            result.append("")
        
        return "\n".join(result)


class SearchNewsInput(BaseModel):
    """Input for the search tool."""
    query: str = Field(description="Search query (e.g., 'bitcoin etf', 'ethereum upgrade')")
    limit: int = Field(default=10, description="Number of results (1-50)")


class SearchNewsTool(BaseTool):
    name: str = "search_crypto_news"
    description: str = "Search cryptocurrency news by keywords. Use this to find specific topics or events."
    args_schema: Type[BaseModel] = SearchNewsInput

    def _run(self, query: str, limit: int = 10) -> str:
        data = fetch_api("/api/search", {"q": query, "limit": min(limit, 50)})
        
        if "error" in data:
            return f"Error: {data['error']}"
        
        articles = data.get("articles", [])
        if not articles:
            return f"No results found for '{query}'."
        
        result = [f"🔍 Search Results for '{query}':", ""]
        for i, article in enumerate(articles, 1):
            result.append(f"{i}. {article.get('title', 'No title')}")
            result.append(f"   Source: {article.get('source', 'Unknown')}")
            result.append("")
        
        return "\n".join(result)


class SentimentInput(BaseModel):
    """Input for sentiment analysis."""
    asset: str = Field(description="Asset symbol (e.g., BTC, ETH, SOL)")


class SentimentTool(BaseTool):
    name: str = "crypto_sentiment"
    description: str = "Get AI sentiment analysis for a cryptocurrency. Returns sentiment label, score, and confidence."
    args_schema: Type[BaseModel] = SentimentInput

    def _run(self, asset: str) -> str:
        data = fetch_api("/api/ai/sentiment", {"asset": asset.upper()})
        
        if "error" in data:
            return f"Error: {data['error']}"
        
        score = data.get("score", 0)
        label = data.get("label", "neutral")
        confidence = data.get("confidence", 0)
        
        emoji = "🚀" if score > 0.3 else "📉" if score < -0.3 else "😐"
        interpretation = (
            "Strong bullish signal" if score > 0.5 else
            "Moderately bullish" if score > 0.2 else
            "Slightly bullish" if score > 0 else
            "Strong bearish signal" if score < -0.5 else
            "Moderately bearish" if score < -0.2 else
            "Slightly bearish" if score < 0 else
            "Neutral"
        )
        
        return f"""
{emoji} **{asset.upper()} Sentiment Analysis**

- **Label:** {label.title()}
- **Score:** {score:.2f} (range: -1 to +1)
- **Confidence:** {confidence:.1%}
- **Interpretation:** {interpretation}
"""


class FearGreedTool(BaseTool):
    name: str = "fear_greed_index"
    description: str = "Get the Crypto Fear & Greed Index. This measures market sentiment from 0 (extreme fear) to 100 (extreme greed)."

    def _run(self) -> str:
        data = fetch_api("/api/market/fear-greed")
        
        if "error" in data:
            return f"Error: {data['error']}"
        
        value = data.get("value", 50)
        classification = data.get("classification", "Neutral")
        
        if value <= 25:
            emoji = "😱"
            advice = "Extreme fear often indicates buying opportunities as investors are overly pessimistic."
        elif value <= 45:
            emoji = "😰"
            advice = "Fear in the market. Prices may be undervalued."
        elif value <= 55:
            emoji = "😐"
            advice = "Neutral sentiment. Market is balanced."
        elif value <= 75:
            emoji = "😊"
            advice = "Greed in the market. Exercise caution with new positions."
        else:
            emoji = "🤑"
            advice = "Extreme greed. Market may be overheated and due for correction."
        
        return f"""
{emoji} **Fear & Greed Index: {value}/100**

- **Classification:** {classification}
- **Advice:** {advice}
"""


class TrendingTool(BaseTool):
    name: str = "trending_crypto"
    description: str = "Get trending cryptocurrency topics and hashtags with mention counts and sentiment."

    def _run(self) -> str:
        data = fetch_api("/api/trending")
        
        if "error" in data:
            return f"Error: {data['error']}"
        
        topics = data.get("topics", [])[:10]
        if not topics:
            return "No trending topics found."
        
        result = ["🔥 **Trending Crypto Topics**", ""]
        for topic in topics:
            name = topic.get("name", "Unknown")
            mentions = topic.get("mentions", 0)
            sentiment = topic.get("sentiment", "neutral")
            emoji = "🟢" if sentiment == "bullish" else "🔴" if sentiment == "bearish" else "🟡"
            result.append(f"{emoji} **{name}**: {mentions:,} mentions ({sentiment})")
        
        return "\n".join(result)


class PricesInput(BaseModel):
    """Input for prices tool."""
    limit: int = Field(default=20, description="Number of coins (1-100)")


class PricesTool(BaseTool):
    name: str = "crypto_prices"
    description: str = "Get current cryptocurrency prices with 24h changes."
    args_schema: Type[BaseModel] = PricesInput

    def _run(self, limit: int = 20) -> str:
        data = fetch_api("/api/coins", {"limit": min(limit, 100)})
        
        if "error" in data:
            return f"Error: {data['error']}"
        
        coins = data.get("coins", [])[:limit]
        if not coins:
            return "No price data available."
        
        result = ["💰 **Cryptocurrency Prices**", ""]
        for coin in coins:
            symbol = coin.get("symbol", "???").upper()
            price = coin.get("price", 0)
            change = coin.get("priceChange24h", 0)
            emoji = "📈" if change >= 0 else "📉"
            result.append(f"**{symbol}**: ${price:,.2f} {emoji} {change:+.2f}%")
        
        return "\n".join(result)


class WhaleInput(BaseModel):
    """Input for whale alerts."""
    min_value: int = Field(default=1000000, description="Minimum USD value for transactions")


class WhaleTool(BaseTool):
    name: str = "whale_alerts"
    description: str = "Get recent whale (large) transaction alerts. Useful for tracking smart money movements."
    args_schema: Type[BaseModel] = WhaleInput

    def _run(self, min_value: int = 1000000) -> str:
        data = fetch_api("/api/trading/whales", {"minValue": min_value})
        
        if "error" in data:
            return f"Error: {data['error']}"
        
        alerts = data.get("alerts", [])[:10]
        if not alerts:
            return "No recent whale movements detected."
        
        result = [f"🐋 **Whale Alerts (≥ ${min_value:,})**", ""]
        for alert in alerts:
            token = alert.get("token", "???")
            amount = alert.get("amountUSD", 0)
            from_addr = alert.get("from", "Unknown")[:10]
            to_addr = alert.get("to", "Unknown")[:10]
            result.append(f"**{token}**: ${amount:,.0f}")
            result.append(f"  {from_addr}... → {to_addr}...")
            result.append("")
        
        return "\n".join(result)


class ArbitrageTool(BaseTool):
    name: str = "arbitrage_opportunities"
    description: str = "Find cross-exchange arbitrage opportunities with spread percentages."

    def _run(self) -> str:
        data = fetch_api("/api/trading/arbitrage")
        
        if "error" in data:
            return f"Error: {data['error']}"
        
        opportunities = data.get("opportunities", [])[:10]
        if not opportunities:
            return "No significant arbitrage opportunities found."
        
        result = ["💱 **Arbitrage Opportunities**", ""]
        for opp in opportunities:
            pair = opp.get("pair", "???")
            spread = opp.get("spreadPercent", 0)
            buy = opp.get("buyExchange", "???")
            sell = opp.get("sellExchange", "???")
            result.append(f"**{pair}**: {spread:.2f}% spread")
            result.append(f"  Buy @ {buy} → Sell @ {sell}")
            result.append("")
        
        result.append("⚠️ *Spreads don't account for fees. Verify before trading.*")
        return "\n".join(result)


# ============= COLLECT ALL TOOLS =============

CRYPTO_TOOLS = [
    CryptoNewsTool(),
    SearchNewsTool(),
    SentimentTool(),
    FearGreedTool(),
    TrendingTool(),
    PricesTool(),
    WhaleTool(),
    ArbitrageTool(),
]
```

---

## Method 2: Create a Crypto Research Crew

### Complete Crew Example

```python
"""
Crypto Research Crew
Multi-agent system for cryptocurrency market analysis.
"""

from crewai import Agent, Task, Crew, Process
from crypto_tools import CRYPTO_TOOLS

# ============= AGENTS =============

news_analyst = Agent(
    role="Crypto News Analyst",
    goal="Analyze cryptocurrency news and identify important market events",
    backstory="""You are an experienced cryptocurrency news analyst with years of 
    experience tracking market-moving events. You excel at identifying patterns 
    in news coverage and understanding their potential market impact.""",
    tools=[CRYPTO_TOOLS[0], CRYPTO_TOOLS[1]],  # news, search
    verbose=True,
    allow_delegation=False
)

sentiment_analyst = Agent(
    role="Sentiment Analyst",
    goal="Analyze market sentiment and provide actionable insights",
    backstory="""You are an expert in market psychology and sentiment analysis.
    You understand how fear and greed drive crypto markets and can interpret
    sentiment data to predict market movements.""",
    tools=[CRYPTO_TOOLS[2], CRYPTO_TOOLS[3], CRYPTO_TOOLS[4]],  # sentiment, fear_greed, trending
    verbose=True,
    allow_delegation=False
)

trading_analyst = Agent(
    role="Trading Analyst",
    goal="Identify trading opportunities and assess market conditions",
    backstory="""You are a seasoned crypto trader with expertise in technical 
    analysis and market microstructure. You track whale movements and arbitrage
    opportunities to find alpha.""",
    tools=[CRYPTO_TOOLS[5], CRYPTO_TOOLS[6], CRYPTO_TOOLS[7]],  # prices, whales, arbitrage
    verbose=True,
    allow_delegation=False
)

research_lead = Agent(
    role="Research Lead",
    goal="Synthesize all research into comprehensive market reports",
    backstory="""You are a senior research director who leads a team of analysts.
    You excel at synthesizing complex information into clear, actionable reports
    for investors and traders.""",
    tools=CRYPTO_TOOLS,  # All tools
    verbose=True,
    allow_delegation=True
)

# ============= TASKS =============

def create_market_research_tasks():
    """Create tasks for comprehensive market research."""
    
    news_task = Task(
        description="""Research the latest cryptocurrency news:
        1. Get the 15 most recent news articles
        2. Search for any breaking news about Bitcoin, Ethereum, and regulations
        3. Identify the most important stories that could move markets
        4. Summarize key themes and potential market impact""",
        agent=news_analyst,
        expected_output="A summary of key news stories with potential market impact analysis"
    )
    
    sentiment_task = Task(
        description="""Analyze current market sentiment:
        1. Get the Fear & Greed Index and interpret its meaning
        2. Analyze sentiment for BTC, ETH, SOL, and XRP
        3. Identify trending topics and their sentiment
        4. Provide an overall sentiment assessment""",
        agent=sentiment_analyst,
        expected_output="A comprehensive sentiment analysis with scores and interpretations"
    )
    
    trading_task = Task(
        description="""Analyze trading conditions:
        1. Get current prices for top 20 cryptocurrencies
        2. Check for whale movements over $5 million
        3. Identify any arbitrage opportunities
        4. Assess overall market liquidity and trading conditions""",
        agent=trading_analyst,
        expected_output="A trading conditions report with opportunities and risks"
    )
    
    synthesis_task = Task(
        description="""Synthesize all research into a comprehensive report:
        1. Review the news analysis
        2. Incorporate sentiment findings
        3. Add trading conditions assessment
        4. Create an executive summary with key takeaways
        5. Provide actionable recommendations (not financial advice)""",
        agent=research_lead,
        expected_output="A comprehensive market research report with executive summary",
        context=[news_task, sentiment_task, trading_task]
    )
    
    return [news_task, sentiment_task, trading_task, synthesis_task]

# ============= CREW =============

def create_crypto_research_crew():
    """Create the crypto research crew."""
    tasks = create_market_research_tasks()
    
    crew = Crew(
        agents=[news_analyst, sentiment_analyst, trading_analyst, research_lead],
        tasks=tasks,
        process=Process.sequential,
        verbose=True
    )
    
    return crew

# ============= RUN =============

if __name__ == "__main__":
    crew = create_crypto_research_crew()
    result = crew.kickoff()
    
    print("\n" + "=" * 60)
    print("FINAL REPORT")
    print("=" * 60)
    print(result)
```

---

## Method 3: Specialized Crews

### Trading Opportunity Crew

```python
from crewai import Agent, Task, Crew, Process
from crypto_tools import CRYPTO_TOOLS

# Specialized agents for trading
whale_tracker = Agent(
    role="Whale Tracker",
    goal="Monitor and analyze large cryptocurrency transactions",
    backstory="Expert in tracking institutional and whale wallet movements.",
    tools=[CRYPTO_TOOLS[6]],  # whale_alerts
    verbose=True
)

arbitrage_hunter = Agent(
    role="Arbitrage Hunter",
    goal="Find and validate cross-exchange arbitrage opportunities",
    backstory="Quantitative trader specializing in market microstructure and arbitrage.",
    tools=[CRYPTO_TOOLS[7], CRYPTO_TOOLS[5]],  # arbitrage, prices
    verbose=True
)

risk_manager = Agent(
    role="Risk Manager",
    goal="Assess risks and provide risk management recommendations",
    backstory="Former institutional risk manager with deep crypto market experience.",
    tools=[CRYPTO_TOOLS[3], CRYPTO_TOOLS[2]],  # fear_greed, sentiment
    verbose=True
)

# Tasks
whale_task = Task(
    description="Monitor whale transactions over $5M and identify patterns",
    agent=whale_tracker,
    expected_output="Whale activity report with transaction analysis"
)

arb_task = Task(
    description="Find arbitrage opportunities with >0.5% spreads",
    agent=arbitrage_hunter,
    expected_output="List of viable arbitrage opportunities with execution details"
)

risk_task = Task(
    description="Assess market risk conditions and provide position sizing guidance",
    agent=risk_manager,
    expected_output="Risk assessment with recommended exposure levels",
    context=[whale_task, arb_task]
)

# Crew
trading_crew = Crew(
    agents=[whale_tracker, arbitrage_hunter, risk_manager],
    tasks=[whale_task, arb_task, risk_task],
    process=Process.sequential,
    verbose=True
)

# Run
result = trading_crew.kickoff()
```

### News Analysis Crew

```python
from crewai import Agent, Task, Crew, Process
from crypto_tools import CRYPTO_TOOLS

# News specialized agents
bitcoin_analyst = Agent(
    role="Bitcoin Analyst",
    goal="Track and analyze all Bitcoin-related news",
    backstory="Bitcoin maximalist with deep understanding of BTC ecosystem.",
    tools=[CRYPTO_TOOLS[0], CRYPTO_TOOLS[1], CRYPTO_TOOLS[2]],
    verbose=True
)

defi_analyst = Agent(
    role="DeFi Analyst",
    goal="Monitor DeFi protocols and ecosystem developments",
    backstory="DeFi researcher tracking protocol developments and TVL movements.",
    tools=[CRYPTO_TOOLS[0], CRYPTO_TOOLS[1], CRYPTO_TOOLS[4]],
    verbose=True
)

regulation_analyst = Agent(
    role="Regulatory Analyst",
    goal="Track cryptocurrency regulatory developments worldwide",
    backstory="Former compliance officer tracking global crypto regulations.",
    tools=[CRYPTO_TOOLS[1]],  # search
    verbose=True
)

# Tasks
btc_task = Task(
    description="Research Bitcoin news: ETFs, mining, Lightning Network, institutional adoption",
    agent=bitcoin_analyst,
    expected_output="Bitcoin ecosystem report"
)

defi_task = Task(
    description="Research DeFi news: major protocols, hacks, new launches, TVL changes",
    agent=defi_analyst,
    expected_output="DeFi ecosystem report"
)

reg_task = Task(
    description="Search for regulation news: SEC, CFTC, EU MiCA, Asia regulations",
    agent=regulation_analyst,
    expected_output="Regulatory landscape report"
)

# Crew
news_crew = Crew(
    agents=[bitcoin_analyst, defi_analyst, regulation_analyst],
    tasks=[btc_task, defi_task, reg_task],
    process=Process.parallel,  # Run in parallel for faster results
    verbose=True
)
```

---

## Method 4: Hierarchical Crew

```python
from crewai import Agent, Task, Crew, Process
from crypto_tools import CRYPTO_TOOLS

# Manager agent
crypto_director = Agent(
    role="Crypto Research Director",
    goal="Coordinate research team and deliver comprehensive analysis",
    backstory="C-level executive managing crypto research operations.",
    tools=CRYPTO_TOOLS,
    verbose=True,
    allow_delegation=True
)

# Worker agents (same as before)
# ... news_analyst, sentiment_analyst, trading_analyst

# Hierarchical crew
hierarchical_crew = Crew(
    agents=[crypto_director, news_analyst, sentiment_analyst, trading_analyst],
    tasks=create_market_research_tasks(),
    process=Process.hierarchical,
    manager_agent=crypto_director,
    verbose=True
)
```

---

## Running the Crew

### Basic Run

```python
from crypto_crew import create_crypto_research_crew

crew = create_crypto_research_crew()
result = crew.kickoff()
print(result)
```

### With Inputs

```python
from crewai import Crew

# Task with input variables
analysis_task = Task(
    description="Analyze the cryptocurrency {coin} including news, sentiment, and price action",
    agent=analyst,
    expected_output="Complete analysis of {coin}"
)

crew = Crew(agents=[analyst], tasks=[analysis_task])

# Run with inputs
result = crew.kickoff(inputs={"coin": "Bitcoin"})
```

### Async Execution

```python
import asyncio

async def run_research():
    crew = create_crypto_research_crew()
    result = await crew.kickoff_async()
    return result

result = asyncio.run(run_research())
```

---

## Example Output

```
==============================
CRYPTO MARKET RESEARCH REPORT
==============================

EXECUTIVE SUMMARY
-----------------
The cryptocurrency market is showing signs of GREED (68/100) with Bitcoin 
leading the rally. Institutional interest remains strong as evidenced by 
continued ETF inflows.

KEY FINDINGS

📰 News Highlights:
• Bitcoin breaks $92,000 on institutional demand
• Ethereum gas fees drop 40% post-upgrade
• SEC approves two new Bitcoin ETF applications

📊 Sentiment Analysis:
• BTC: Bullish (score: 0.72, confidence: 89%)
• ETH: Moderately Bullish (score: 0.45, confidence: 82%)
• Overall Market: Optimistic but approaching overbought

🐋 Whale Activity:
• $150M BTC moved from Binance to cold storage
• Large ETH accumulation detected

💱 Opportunities:
• BTC/USDT 0.8% arbitrage between Binance and Kraken
• SOL showing relative strength vs. market

⚠️ RISKS
• Extreme greed readings suggest caution
• Regulatory uncertainty remains
• High leverage in derivatives markets

RECOMMENDATIONS
• Consider taking partial profits on longs
• Maintain diversified positions
• Set stop-losses on leveraged positions

*This is not financial advice*
```

---

## Links

- **CrewAI:** https://crewai.com
- **CrewAI Docs:** https://docs.crewai.com
- **CrewAI GitHub:** https://github.com/crewAIInc/crewAI
- **CrewAI Tools:** https://github.com/crewAIInc/crewAI-tools
- **Free Crypto News API:** https://cryptocurrency.cv
