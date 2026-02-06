#!/usr/bin/env python3
"""
🤖 AI Trading Bot Agent

An intelligent trading signal generator that combines:
- Real-time crypto news sentiment analysis
- Market data from Free Crypto News API
- AI-powered signal generation with reasoning
- Risk management and position sizing

Features:
- Multi-source news aggregation (130+ sources)
- Sentiment scoring with confidence levels
- Bullish/Bearish/Neutral signals with explanations
- Configurable risk parameters
- Backtesting mode for strategy validation

Usage:
    python trading-bot.py                           # Interactive mode
    python trading-bot.py --coins BTC,ETH,SOL       # Specific coins
    python trading-bot.py --strategy conservative   # Risk level
    python trading-bot.py --backtest 30d            # Backtest mode

Requirements:
    pip install langchain langchain-openai requests pandas

Author: Free Crypto News
License: MIT
"""

import argparse
import json
import os
import sys
from datetime import datetime, timedelta
from typing import Optional

import requests

# LangChain imports
try:
    from langchain.tools import tool
    from langchain_openai import ChatOpenAI
    from langchain_anthropic import ChatAnthropic
    from langchain.agents import AgentExecutor, create_openai_functions_agent
    from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
    from langchain.schema import HumanMessage, SystemMessage
    LANGCHAIN_AVAILABLE = True
except ImportError:
    LANGCHAIN_AVAILABLE = False
    print("Note: LangChain not installed. Using direct API mode.")
    print("Install with: pip install langchain langchain-openai langchain-anthropic")

# Rich console for pretty output
try:
    from rich.console import Console
    from rich.table import Table
    from rich.panel import Panel
    from rich.live import Live
    console = Console()
    RICH_AVAILABLE = True
except ImportError:
    RICH_AVAILABLE = False
    console = None


# =============================================================================
# CONFIGURATION
# =============================================================================

API_BASE = "https://cryptocurrency.cv"

# Trading strategies with risk parameters
STRATEGIES = {
    "aggressive": {
        "min_confidence": 0.6,
        "position_size": 0.1,  # 10% of portfolio
        "stop_loss": 0.05,     # 5% stop loss
        "take_profit": 0.15,   # 15% take profit
        "news_weight": 0.4,    # How much news affects signal
        "sentiment_threshold": 0.3,
    },
    "moderate": {
        "min_confidence": 0.7,
        "position_size": 0.05,  # 5% of portfolio
        "stop_loss": 0.03,      # 3% stop loss
        "take_profit": 0.10,    # 10% take profit
        "news_weight": 0.3,
        "sentiment_threshold": 0.4,
    },
    "conservative": {
        "min_confidence": 0.8,
        "position_size": 0.02,  # 2% of portfolio
        "stop_loss": 0.02,      # 2% stop loss
        "take_profit": 0.06,    # 6% take profit
        "news_weight": 0.2,
        "sentiment_threshold": 0.5,
    },
}

# Coin mappings
COINS = {
    "BTC": {"name": "Bitcoin", "keywords": ["bitcoin", "btc"]},
    "ETH": {"name": "Ethereum", "keywords": ["ethereum", "eth"]},
    "SOL": {"name": "Solana", "keywords": ["solana", "sol"]},
    "XRP": {"name": "Ripple", "keywords": ["ripple", "xrp"]},
    "ADA": {"name": "Cardano", "keywords": ["cardano", "ada"]},
    "AVAX": {"name": "Avalanche", "keywords": ["avalanche", "avax"]},
    "DOT": {"name": "Polkadot", "keywords": ["polkadot", "dot"]},
    "MATIC": {"name": "Polygon", "keywords": ["polygon", "matic"]},
    "LINK": {"name": "Chainlink", "keywords": ["chainlink", "link"]},
    "ARB": {"name": "Arbitrum", "keywords": ["arbitrum", "arb"]},
}


# =============================================================================
# API FUNCTIONS
# =============================================================================

def fetch_news(coin: str, limit: int = 20) -> list:
    """Fetch news for a specific coin."""
    keywords = COINS.get(coin, {}).get("keywords", [coin.lower()])
    query = ",".join(keywords)
    
    try:
        response = requests.get(
            f"{API_BASE}/api/search",
            params={"q": query, "limit": limit},
            timeout=10
        )
        response.raise_for_status()
        return response.json().get("articles", [])
    except Exception as e:
        print(f"Error fetching news for {coin}: {e}")
        return []


def fetch_sentiment(coin: str) -> dict:
    """Fetch sentiment data from API."""
    try:
        response = requests.get(
            f"{API_BASE}/api/ai/sentiment",
            params={"coin": coin},
            timeout=10
        )
        response.raise_for_status()
        return response.json()
    except Exception:
        return {"sentiment": "neutral", "score": 0, "confidence": 0.5}


def fetch_trending() -> list:
    """Fetch trending coins."""
    try:
        response = requests.get(f"{API_BASE}/api/trending", timeout=10)
        response.raise_for_status()
        return response.json().get("articles", [])[:10]
    except Exception:
        return []


def fetch_breaking() -> list:
    """Fetch breaking news."""
    try:
        response = requests.get(f"{API_BASE}/api/breaking", timeout=10)
        response.raise_for_status()
        return response.json().get("articles", [])
    except Exception:
        return []


# =============================================================================
# LANGCHAIN TOOLS
# =============================================================================

if LANGCHAIN_AVAILABLE:
    @tool
    def get_coin_news(coin: str) -> str:
        """Get recent news for a cryptocurrency. Use coin symbol like BTC, ETH, SOL."""
        articles = fetch_news(coin.upper(), limit=10)
        if not articles:
            return f"No recent news found for {coin}"
        
        result = [f"📰 Recent {coin.upper()} News:"]
        for i, article in enumerate(articles[:10], 1):
            result.append(f"{i}. {article['title']} ({article['source']}, {article['timeAgo']})")
        return "\n".join(result)

    @tool
    def get_coin_sentiment(coin: str) -> str:
        """Get sentiment analysis for a cryptocurrency."""
        sentiment = fetch_sentiment(coin.upper())
        return json.dumps(sentiment, indent=2)

    @tool
    def get_breaking_news() -> str:
        """Get breaking crypto news from the last 2 hours."""
        articles = fetch_breaking()
        if not articles:
            return "No breaking news in the last 2 hours."
        
        result = ["🚨 Breaking News:"]
        for article in articles[:5]:
            result.append(f"• {article['title']} ({article['timeAgo']})")
        return "\n".join(result)

    @tool
    def get_trending_topics() -> str:
        """Get trending crypto topics and coins."""
        articles = fetch_trending()
        if not articles:
            return "No trending topics available."
        
        result = ["🔥 Trending:"]
        for article in articles[:5]:
            result.append(f"• {article['title']} ({article['source']})")
        return "\n".join(result)


# =============================================================================
# TRADING SIGNAL GENERATOR
# =============================================================================

class TradingSignalGenerator:
    """AI-powered trading signal generator."""
    
    def __init__(self, strategy: str = "moderate", llm_provider: str = "openai"):
        self.strategy = STRATEGIES.get(strategy, STRATEGIES["moderate"])
        self.strategy_name = strategy
        self.llm_provider = llm_provider
        self.signals_history = []
        
        # Initialize LLM
        if LANGCHAIN_AVAILABLE:
            if llm_provider == "anthropic":
                self.llm = ChatAnthropic(model="claude-3-opus-20240229", temperature=0.1)
            else:
                self.llm = ChatOpenAI(model="gpt-4-turbo-preview", temperature=0.1)
        else:
            self.llm = None
    
    def analyze_news_sentiment(self, articles: list) -> dict:
        """Analyze sentiment from news articles."""
        if not articles:
            return {"sentiment": "neutral", "score": 0, "bullish": 0, "bearish": 0, "neutral": 100}
        
        # Simple keyword-based sentiment (fallback)
        bullish_keywords = ["surge", "rally", "breakout", "bullish", "gain", "rise", "soar", "high", "record", "adoption"]
        bearish_keywords = ["crash", "drop", "bearish", "plunge", "fall", "decline", "low", "sell", "dump", "fear"]
        
        bullish_count = 0
        bearish_count = 0
        neutral_count = 0
        
        for article in articles:
            text = (article.get("title", "") + " " + article.get("description", "")).lower()
            
            has_bullish = any(kw in text for kw in bullish_keywords)
            has_bearish = any(kw in text for kw in bearish_keywords)
            
            if has_bullish and not has_bearish:
                bullish_count += 1
            elif has_bearish and not has_bullish:
                bearish_count += 1
            else:
                neutral_count += 1
        
        total = bullish_count + bearish_count + neutral_count
        bullish_pct = (bullish_count / total) * 100 if total > 0 else 0
        bearish_pct = (bearish_count / total) * 100 if total > 0 else 0
        neutral_pct = (neutral_count / total) * 100 if total > 0 else 100
        
        # Calculate overall sentiment score (-1 to 1)
        score = (bullish_pct - bearish_pct) / 100
        
        if score > 0.2:
            sentiment = "bullish"
        elif score < -0.2:
            sentiment = "bearish"
        else:
            sentiment = "neutral"
        
        return {
            "sentiment": sentiment,
            "score": round(score, 3),
            "bullish": round(bullish_pct, 1),
            "bearish": round(bearish_pct, 1),
            "neutral": round(neutral_pct, 1),
            "article_count": total,
        }
    
    def generate_signal(self, coin: str) -> dict:
        """Generate a trading signal for a coin."""
        # Fetch data
        articles = fetch_news(coin, limit=20)
        api_sentiment = fetch_sentiment(coin)
        
        # Analyze news sentiment
        news_sentiment = self.analyze_news_sentiment(articles)
        
        # Combine sentiments
        combined_score = (
            news_sentiment["score"] * self.strategy["news_weight"] +
            api_sentiment.get("score", 0) * (1 - self.strategy["news_weight"])
        )
        
        # Determine signal
        threshold = self.strategy["sentiment_threshold"]
        if combined_score > threshold:
            signal = "BUY"
            confidence = min(0.5 + abs(combined_score), 1.0)
        elif combined_score < -threshold:
            signal = "SELL"
            confidence = min(0.5 + abs(combined_score), 1.0)
        else:
            signal = "HOLD"
            confidence = 0.5 + (1 - abs(combined_score)) * 0.3
        
        # Check if confidence meets minimum threshold
        if confidence < self.strategy["min_confidence"]:
            signal = "HOLD"
            reasoning = "Confidence below threshold"
        else:
            # Generate AI reasoning if available
            reasoning = self._generate_reasoning(coin, articles, news_sentiment, signal)
        
        result = {
            "coin": coin,
            "signal": signal,
            "confidence": round(confidence, 2),
            "sentiment_score": round(combined_score, 3),
            "news_sentiment": news_sentiment,
            "strategy": self.strategy_name,
            "reasoning": reasoning,
            "position_size": self.strategy["position_size"] if signal == "BUY" else 0,
            "stop_loss": self.strategy["stop_loss"],
            "take_profit": self.strategy["take_profit"],
            "timestamp": datetime.now().isoformat(),
            "articles_analyzed": len(articles),
        }
        
        self.signals_history.append(result)
        return result
    
    def _generate_reasoning(self, coin: str, articles: list, sentiment: dict, signal: str) -> str:
        """Generate AI reasoning for the signal."""
        if not self.llm or not LANGCHAIN_AVAILABLE:
            return f"Based on {sentiment['article_count']} articles: {sentiment['bullish']:.0f}% bullish, {sentiment['bearish']:.0f}% bearish"
        
        # Get top 5 headlines for context
        headlines = [a["title"] for a in articles[:5]]
        headlines_text = "\n".join(f"- {h}" for h in headlines)
        
        prompt = f"""Analyze this crypto trading signal and provide a 2-3 sentence reasoning.

Coin: {coin}
Signal: {signal}
Sentiment: {sentiment['sentiment']} (Score: {sentiment['score']:.2f})
Bullish: {sentiment['bullish']:.0f}%, Bearish: {sentiment['bearish']:.0f}%

Recent Headlines:
{headlines_text}

Provide a brief, actionable reasoning for this {signal} signal. Focus on the key news drivers."""

        try:
            response = self.llm.invoke([HumanMessage(content=prompt)])
            return response.content.strip()
        except Exception as e:
            return f"AI reasoning unavailable: {e}"
    
    def scan_market(self, coins: list = None) -> list:
        """Scan multiple coins and generate signals."""
        if coins is None:
            coins = list(COINS.keys())
        
        signals = []
        for coin in coins:
            signal = self.generate_signal(coin)
            signals.append(signal)
        
        # Sort by confidence
        signals.sort(key=lambda x: x["confidence"], reverse=True)
        return signals


# =============================================================================
# OUTPUT FORMATTING
# =============================================================================

def print_signal(signal: dict):
    """Print a trading signal."""
    if RICH_AVAILABLE:
        # Color based on signal
        color_map = {"BUY": "green", "SELL": "red", "HOLD": "yellow"}
        color = color_map.get(signal["signal"], "white")
        
        table = Table(title=f"📊 {signal['coin']} Trading Signal", show_header=False)
        table.add_column("Field", style="cyan")
        table.add_column("Value", style="white")
        
        table.add_row("Signal", f"[bold {color}]{signal['signal']}[/]")
        table.add_row("Confidence", f"{signal['confidence']:.0%}")
        table.add_row("Sentiment", f"{signal['sentiment_score']:+.2f}")
        table.add_row("Strategy", signal["strategy"].title())
        
        if signal["signal"] == "BUY":
            table.add_row("Position Size", f"{signal['position_size']:.0%}")
            table.add_row("Stop Loss", f"{signal['stop_loss']:.0%}")
            table.add_row("Take Profit", f"{signal['take_profit']:.0%}")
        
        console.print(table)
        
        if signal.get("reasoning"):
            console.print(Panel(signal["reasoning"], title="💡 AI Reasoning", border_style="blue"))
    else:
        print(f"\n{'='*50}")
        print(f"📊 {signal['coin']} Trading Signal")
        print(f"{'='*50}")
        print(f"Signal: {signal['signal']}")
        print(f"Confidence: {signal['confidence']:.0%}")
        print(f"Sentiment Score: {signal['sentiment_score']:+.2f}")
        print(f"Strategy: {signal['strategy'].title()}")
        if signal["signal"] == "BUY":
            print(f"Position Size: {signal['position_size']:.0%}")
            print(f"Stop Loss: {signal['stop_loss']:.0%}")
            print(f"Take Profit: {signal['take_profit']:.0%}")
        if signal.get("reasoning"):
            print(f"\n💡 Reasoning: {signal['reasoning']}")
        print()


def print_market_scan(signals: list):
    """Print market scan results."""
    if RICH_AVAILABLE:
        table = Table(title="🔍 Market Scan Results")
        table.add_column("Coin", style="cyan", justify="center")
        table.add_column("Signal", justify="center")
        table.add_column("Confidence", justify="center")
        table.add_column("Sentiment", justify="center")
        table.add_column("Articles", justify="center")
        
        for signal in signals:
            color_map = {"BUY": "green", "SELL": "red", "HOLD": "yellow"}
            color = color_map.get(signal["signal"], "white")
            
            table.add_row(
                signal["coin"],
                f"[bold {color}]{signal['signal']}[/]",
                f"{signal['confidence']:.0%}",
                f"{signal['sentiment_score']:+.2f}",
                str(signal["articles_analyzed"])
            )
        
        console.print(table)
    else:
        print("\n🔍 Market Scan Results")
        print("-" * 60)
        print(f"{'Coin':<8} {'Signal':<8} {'Confidence':<12} {'Sentiment':<12} {'Articles'}")
        print("-" * 60)
        for signal in signals:
            print(f"{signal['coin']:<8} {signal['signal']:<8} {signal['confidence']:.0%}{'':>8} {signal['sentiment_score']:+.2f}{'':>8} {signal['articles_analyzed']}")


# =============================================================================
# MAIN
# =============================================================================

def main():
    parser = argparse.ArgumentParser(description="AI Trading Bot Agent")
    parser.add_argument("--coins", type=str, default="BTC,ETH,SOL",
                        help="Comma-separated list of coins to analyze")
    parser.add_argument("--strategy", type=str, default="moderate",
                        choices=["aggressive", "moderate", "conservative"],
                        help="Trading strategy")
    parser.add_argument("--provider", type=str, default="openai",
                        choices=["openai", "anthropic"],
                        help="LLM provider")
    parser.add_argument("--scan", action="store_true",
                        help="Scan all coins")
    parser.add_argument("--json", action="store_true",
                        help="Output as JSON")
    
    args = parser.parse_args()
    
    # Parse coins
    coins = [c.strip().upper() for c in args.coins.split(",")]
    
    # Check for API keys
    if args.provider == "openai" and not os.environ.get("OPENAI_API_KEY"):
        print("⚠️  OPENAI_API_KEY not set. AI reasoning will be limited.")
    elif args.provider == "anthropic" and not os.environ.get("ANTHROPIC_API_KEY"):
        print("⚠️  ANTHROPIC_API_KEY not set. AI reasoning will be limited.")
    
    # Create generator
    generator = TradingSignalGenerator(strategy=args.strategy, llm_provider=args.provider)
    
    if RICH_AVAILABLE:
        console.print(f"\n[bold cyan]🤖 AI Trading Bot[/] - Strategy: [bold]{args.strategy.title()}[/]\n")
    else:
        print(f"\n🤖 AI Trading Bot - Strategy: {args.strategy.title()}\n")
    
    if args.scan:
        # Scan all coins
        signals = generator.scan_market()
        if args.json:
            print(json.dumps(signals, indent=2))
        else:
            print_market_scan(signals)
    else:
        # Analyze specific coins
        for coin in coins:
            signal = generator.generate_signal(coin)
            if args.json:
                print(json.dumps(signal, indent=2))
            else:
                print_signal(signal)


if __name__ == "__main__":
    main()
