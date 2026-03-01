# Copyright 2024-2026 nirholas. All rights reserved.
# SPDX-License-Identifier: SEE LICENSE IN LICENSE
# https://github.com/nirholas/free-crypto-news
#
# This file is part of free-crypto-news.
# Unauthorized copying, modification, or distribution is strictly prohibited.
# For licensing inquiries: nirholas@users.noreply.github.com

"""
LangChain Tool Example — Crypto News AI Agent

A LangChain agent with access to comprehensive crypto news, market data,
sentiment analysis, and AI-powered tools.

Setup:
    pip install langchain langchain-openai requests

    export OPENAI_API_KEY=your_key
    python langchain-tool.py
"""

from langchain.tools import tool
from langchain_openai import ChatOpenAI
from langchain.agents import AgentExecutor, create_openai_functions_agent
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
import requests
import json

API_BASE = "https://cryptocurrency.cv"


def _get(endpoint: str, params: dict | None = None) -> dict:
    """Helper to make GET requests."""
    try:
        resp = requests.get(f"{API_BASE}{endpoint}", params=params, timeout=15)
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        return {"error": str(e)}


def _post(endpoint: str, payload: dict) -> dict:
    """Helper to make POST requests."""
    try:
        resp = requests.post(
            f"{API_BASE}{endpoint}",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=15,
        )
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        return {"error": str(e)}


# ── News Tools ────────────────────────────────────

@tool
def get_crypto_news(limit: int = 5) -> str:
    """Get the latest cryptocurrency news from 75+ sources. Returns titles, sources, and timestamps."""
    data = _get("/api/news", {"limit": limit})
    articles = data.get("articles", [])
    if not articles:
        return "No news available."
    return "\n".join(f"• {a['title']} ({a['source']}, {a.get('timeAgo', '')})" for a in articles)


@tool
def search_crypto_news(keywords: str, limit: int = 5) -> str:
    """Search crypto news by keywords. Use comma-separated terms for multiple keywords."""
    data = _get("/api/search", {"q": keywords, "limit": limit})
    articles = data.get("articles", [])
    if not articles:
        return f"No news found for '{keywords}'."
    return "\n".join(f"• {a['title']} ({a['source']})" for a in articles)


@tool
def get_bitcoin_news(limit: int = 5) -> str:
    """Get Bitcoin-specific news about BTC, mining, Lightning Network, halving, etc."""
    data = _get("/api/bitcoin", {"limit": limit})
    articles = data.get("articles", [])
    return "\n".join(f"• {a['title']} ({a['source']})" for a in articles) if articles else "No Bitcoin news."


@tool
def get_defi_news(limit: int = 5) -> str:
    """Get DeFi-specific news about yield farming, DEXs, lending protocols, and TVL."""
    data = _get("/api/defi", {"limit": limit})
    articles = data.get("articles", [])
    return "\n".join(f"• {a['title']} ({a['source']})" for a in articles) if articles else "No DeFi news."


@tool
def get_breaking_news(limit: int = 5) -> str:
    """Get breaking crypto news from the last 2 hours. Urgent and time-sensitive articles."""
    data = _get("/api/breaking", {"limit": limit})
    articles = data.get("articles", [])
    return "\n".join(f"🚨 {a['title']} ({a.get('timeAgo', '')})" for a in articles) if articles else "No breaking news."


@tool
def get_trending_topics(limit: int = 10) -> str:
    """Get trending crypto topics with sentiment analysis and mention counts."""
    data = _get("/api/trending", {"limit": limit, "period": "24h"})
    return json.dumps(data, indent=2)[:2000] if data else "No trending data."


# ── Market Tools ──────────────────────────────────

@tool
def get_crypto_prices(coins: str = "bitcoin,ethereum,solana") -> str:
    """Get current prices for specified coins. Provide comma-separated coin IDs."""
    data = _get("/api/prices", {"ids": coins, "vs_currencies": "usd"})
    return json.dumps(data, indent=2)[:2000] if data else "No price data."


@tool
def get_fear_greed_index() -> str:
    """Get the Crypto Fear & Greed Index. Values: 0-25 Extreme Fear, 25-45 Fear, 45-55 Neutral, 55-75 Greed, 75-100 Extreme Greed."""
    data = _get("/api/fear-greed")
    if data and "error" not in data:
        return f"Fear & Greed Index: {data.get('value', 'N/A')} — {data.get('classification', 'Unknown')}"
    return "Could not fetch Fear & Greed data."


@tool
def get_market_overview() -> str:
    """Get global crypto market overview: total market cap, volume, BTC dominance, top coins."""
    data = _get("/api/global")
    return json.dumps(data, indent=2)[:2000] if data else "No market overview available."


@tool
def get_top_coins(limit: int = 10) -> str:
    """Get top cryptocurrencies by market cap with price, volume, and 24h change."""
    data = _get("/api/market/coins", {"per_page": limit})
    return json.dumps(data, indent=2)[:3000] if data else "No coin data."


# ── Trading Tools ────────────────────────────────

@tool
def get_whale_alerts() -> str:
    """Get large whale transaction alerts — movements of $1M+ in crypto."""
    data = _get("/api/whale-alerts")
    return json.dumps(data, indent=2)[:2000] if data else "No whale alerts."


@tool
def get_trading_signals() -> str:
    """Get AI-powered trading signals with buy/sell recommendations."""
    data = _get("/api/signals")
    return json.dumps(data, indent=2)[:2000] if data else "No trading signals."


@tool
def get_funding_rates() -> str:
    """Get funding rates across perpetual futures exchanges (Binance, Bybit, OKX)."""
    data = _get("/api/funding")
    return json.dumps(data, indent=2)[:2000] if data else "No funding rate data."


@tool
def get_liquidations() -> str:
    """Get recent liquidation data from leveraged trading positions."""
    data = _get("/api/liquidations")
    return json.dumps(data, indent=2)[:2000] if data else "No liquidation data."


# ── AI / Analysis Tools ──────────────────────────

@tool
def get_sentiment_analysis(asset: str = "bitcoin") -> str:
    """Get AI-powered sentiment analysis for a specific crypto asset."""
    data = _get("/api/sentiment", {"asset": asset, "period": "24h"})
    return json.dumps(data, indent=2)[:2000] if data else f"No sentiment data for {asset}."


@tool
def ask_crypto_question(question: str) -> str:
    """Ask a natural language question about crypto and get an AI-powered answer based on recent news."""
    data = _get("/api/ask", {"q": question})
    if data and data.get("answer"):
        return data["answer"][:2000]
    return json.dumps(data, indent=2)[:2000] if data else "Could not get an answer."


@tool
def get_ai_daily_brief() -> str:
    """Get an AI-generated daily crypto news brief with key stories and market context."""
    data = _get("/api/ai/brief", {"format": "detailed"})
    return json.dumps(data, indent=2)[:3000] if data else "No daily brief available."


@tool
def get_regulatory_updates() -> str:
    """Get latest crypto regulatory news, SEC actions, ETF updates, and policy changes."""
    data = _get("/api/regulatory")
    return json.dumps(data, indent=2)[:2000] if data else "No regulatory updates."


@tool
def get_gas_prices() -> str:
    """Get current Ethereum gas prices (slow, standard, fast) in Gwei."""
    data = _get("/api/gas")
    return json.dumps(data, indent=2)[:1000] if data else "No gas data."


# ── Agent Setup ──────────────────────────────────

def create_news_agent():
    """Create a LangChain agent with all crypto news tools."""
    llm = ChatOpenAI(model="gpt-4", temperature=0)

    tools = [
        # News
        get_crypto_news,
        search_crypto_news,
        get_bitcoin_news,
        get_defi_news,
        get_breaking_news,
        get_trending_topics,
        # Market
        get_crypto_prices,
        get_fear_greed_index,
        get_market_overview,
        get_top_coins,
        # Trading
        get_whale_alerts,
        get_trading_signals,
        get_funding_rates,
        get_liquidations,
        # AI / Analysis
        get_sentiment_analysis,
        ask_crypto_question,
        get_ai_daily_brief,
        get_regulatory_updates,
        get_gas_prices,
    ]

    prompt = ChatPromptTemplate.from_messages([
        (
            "system",
            "You are a helpful crypto news and market analysis assistant. "
            "Use the available tools to fetch real-time data from cryptocurrency.cv. "
            "Provide concise, actionable insights based on the data. "
            "Always cite your sources and mention relevant timestamps."
        ),
        ("human", "{input}"),
        MessagesPlaceholder("agent_scratchpad"),
    ])

    agent = create_openai_functions_agent(llm, tools, prompt)
    return AgentExecutor(agent=agent, tools=tools, verbose=True)


# ── Main ─────────────────────────────────────────

if __name__ == "__main__":
    print("Testing crypto news tools...\n")

    print("━" * 50)
    print("Latest News:")
    print(get_crypto_news.invoke({"limit": 3}))

    print("\n" + "━" * 50)
    print("Bitcoin News:")
    print(get_bitcoin_news.invoke({"limit": 3}))

    print("\n" + "━" * 50)
    print("Fear & Greed Index:")
    print(get_fear_greed_index.invoke({}))

    print("\n" + "━" * 50)
    print("Trending Topics:")
    print(get_trending_topics.invoke({"limit": 5}))

    print("\n" + "━" * 50)
    print("Ask AI:")
    print(ask_crypto_question.invoke({"question": "What is happening with Bitcoin?"}))

    print("\n✅ All tools tested successfully!")
