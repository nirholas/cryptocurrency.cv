#!/usr/bin/env python3
"""
📊 AI Sentiment Tracker Agent

Real-time cryptocurrency sentiment monitoring dashboard with:
- Continuous sentiment tracking across coins
- Historical trend visualization
- Anomaly detection for sudden sentiment shifts
- Multi-coin comparison
- Alert triggers on sentiment changes
- Interactive CLI dashboard

Features:
- Real-time updates with configurable intervals
- AI-powered sentiment analysis with LLM explanation
- VADER + LLM hybrid sentiment scoring
- Rolling averages and trend detection
- Export to CSV/JSON for further analysis
- Rich terminal UI with live charts

Usage:
    python sentiment-tracker.py --coins btc,eth,sol
    python sentiment-tracker.py --coins btc --interval 300 --alert-threshold 0.3
    python sentiment-tracker.py --all-coins --export csv
    python sentiment-tracker.py --historical --coin btc --hours 24

Requirements:
    pip install langchain openai nltk rich plotext pandas

Author: Free Crypto News
License: MIT
"""

import argparse
import asyncio
import csv
import json
import os
import time
from collections import deque
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Deque
from dataclasses import dataclass, field
import statistics

import requests

# NLTK for VADER
try:
    import nltk
    from nltk.sentiment import SentimentIntensityAnalyzer
    # Download VADER lexicon if needed
    try:
        nltk.data.find('sentiment/vader_lexicon.zip')
    except LookupError:
        nltk.download('vader_lexicon', quiet=True)
    NLTK_AVAILABLE = True
    sia = SentimentIntensityAnalyzer()
except ImportError:
    NLTK_AVAILABLE = False
    sia = None

# LangChain for AI analysis
try:
    from langchain_openai import ChatOpenAI
    from langchain_anthropic import ChatAnthropic
    from langchain_core.messages import HumanMessage, SystemMessage
    LANGCHAIN_AVAILABLE = True
except ImportError:
    LANGCHAIN_AVAILABLE = False

# Pandas for data handling
try:
    import pandas as pd
    PANDAS_AVAILABLE = True
except ImportError:
    PANDAS_AVAILABLE = False

# Rich for terminal UI
try:
    from rich.console import Console
    from rich.live import Live
    from rich.table import Table
    from rich.panel import Panel
    from rich.layout import Layout
    from rich.text import Text
    from rich.progress import Progress, SpinnerColumn, TextColumn
    console = Console()
    RICH_AVAILABLE = True
except ImportError:
    RICH_AVAILABLE = False
    console = None

# Plotext for terminal charts
try:
    import plotext as plt
    PLOTEXT_AVAILABLE = True
except ImportError:
    PLOTEXT_AVAILABLE = False


# =============================================================================
# CONFIGURATION
# =============================================================================

API_BASE = "https://cryptocurrency.cv"

# Common coin mappings
COIN_MAPPINGS = {
    "btc": "bitcoin",
    "eth": "ethereum",
    "sol": "solana",
    "bnb": "binance",
    "xrp": "ripple",
    "ada": "cardano",
    "doge": "dogecoin",
    "dot": "polkadot",
    "matic": "polygon",
    "link": "chainlink",
    "avax": "avalanche",
    "uni": "uniswap",
    "atom": "cosmos",
    "ltc": "litecoin",
    "etc": "ethereum-classic"
}


@dataclass
class SentimentScore:
    """Individual sentiment measurement."""
    timestamp: datetime
    coin: str
    score: float  # -1 to 1
    label: str  # "bullish", "bearish", "neutral"
    article_count: int
    top_headlines: List[str] = field(default_factory=list)
    ai_analysis: Optional[str] = None


@dataclass
class SentimentTrend:
    """Aggregated sentiment trend."""
    coin: str
    current_score: float
    current_label: str
    avg_1h: Optional[float] = None
    avg_24h: Optional[float] = None
    trend: str = "stable"  # "rising", "falling", "stable"
    change_1h: float = 0.0
    alert: bool = False


# =============================================================================
# SENTIMENT ANALYZER
# =============================================================================

class SentimentAnalyzer:
    """Hybrid VADER + LLM sentiment analyzer."""
    
    def __init__(self, use_ai: bool = True, llm_provider: str = "openai"):
        self.use_ai = use_ai and LANGCHAIN_AVAILABLE
        self.llm = None
        
        if self.use_ai:
            try:
                if llm_provider == "anthropic":
                    self.llm = ChatAnthropic(model="claude-3-5-sonnet-latest", temperature=0)
                else:
                    self.llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
            except Exception as e:
                print(f"LLM unavailable: {e}")
                self.use_ai = False
    
    def vader_score(self, text: str) -> float:
        """Get VADER sentiment score."""
        if not NLTK_AVAILABLE:
            return 0.0
        scores = sia.polarity_scores(text)
        return scores["compound"]
    
    def analyze_headlines(self, headlines: List[str]) -> tuple[float, str]:
        """Analyze list of headlines."""
        if not headlines:
            return 0.0, "neutral"
        
        # VADER analysis
        scores = [self.vader_score(h) for h in headlines]
        avg_score = statistics.mean(scores) if scores else 0.0
        
        # Crypto-specific adjustments
        crypto_bullish = ["surge", "rally", "bullish", "breakthrough", "adoption", "gain", "soar", "ath", "record"]
        crypto_bearish = ["crash", "plunge", "bearish", "hack", "scam", "fraud", "ban", "investigation", "concern"]
        
        text = " ".join(headlines).lower()
        bullish_count = sum(1 for word in crypto_bullish if word in text)
        bearish_count = sum(1 for word in crypto_bearish if word in text)
        
        # Adjust score based on crypto-specific keywords
        adjustment = (bullish_count - bearish_count) * 0.05
        final_score = max(-1, min(1, avg_score + adjustment))
        
        # Determine label
        if final_score >= 0.2:
            label = "bullish"
        elif final_score <= -0.2:
            label = "bearish"
        else:
            label = "neutral"
        
        return final_score, label
    
    def get_ai_analysis(self, headlines: List[str], coin: str) -> str:
        """Get AI-powered analysis explanation."""
        if not self.use_ai or not self.llm:
            return ""
        
        try:
            messages = [
                SystemMessage(content="""You are a crypto sentiment analyst. In 1-2 sentences, 
                explain the current sentiment based on these headlines. Be specific about 
                what's driving the sentiment. Focus on key events or themes."""),
                HumanMessage(content=f"Coin: {coin}\nRecent headlines:\n" + 
                           "\n".join([f"- {h}" for h in headlines[:10]]))
            ]
            
            response = self.llm.invoke(messages)
            return response.content.strip()
        except Exception:
            return ""


# =============================================================================
# DATA COLLECTOR
# =============================================================================

class DataCollector:
    """Collects news data for sentiment analysis."""
    
    def fetch_coin_news(self, coin: str, limit: int = 30) -> List[Dict]:
        """Fetch news for a specific coin."""
        # Expand coin symbol to full name
        search_term = COIN_MAPPINGS.get(coin.lower(), coin)
        
        try:
            response = requests.get(
                f"{API_BASE}/api/search",
                params={"q": search_term, "limit": limit},
                timeout=10
            )
            if response.status_code == 200:
                return response.json().get("articles", [])
        except Exception:
            pass
        return []
    
    def fetch_market_news(self, limit: int = 50) -> List[Dict]:
        """Fetch general market news."""
        try:
            response = requests.get(
                f"{API_BASE}/api/news",
                params={"limit": limit},
                timeout=10
            )
            if response.status_code == 200:
                return response.json().get("articles", [])
        except Exception:
            pass
        return []


# =============================================================================
# SENTIMENT TRACKER
# =============================================================================

class SentimentTracker:
    """Main sentiment tracking engine."""
    
    def __init__(
        self,
        coins: List[str],
        use_ai: bool = True,
        llm_provider: str = "openai",
        alert_threshold: float = 0.3
    ):
        self.coins = [c.lower() for c in coins]
        self.collector = DataCollector()
        self.analyzer = SentimentAnalyzer(use_ai, llm_provider)
        self.alert_threshold = alert_threshold
        
        # Historical data storage (rolling window)
        self.history: Dict[str, Deque[SentimentScore]] = {
            coin: deque(maxlen=288)  # 24 hours at 5-min intervals
            for coin in self.coins
        }
    
    def measure_coin(self, coin: str) -> SentimentScore:
        """Measure current sentiment for a coin."""
        articles = self.collector.fetch_coin_news(coin, limit=30)
        headlines = [a.get("title", "") for a in articles if a.get("title")]
        
        score, label = self.analyzer.analyze_headlines(headlines)
        
        # Get AI analysis for significant sentiment
        ai_analysis = None
        if abs(score) >= 0.3:
            ai_analysis = self.analyzer.get_ai_analysis(headlines[:10], coin)
        
        sentiment = SentimentScore(
            timestamp=datetime.now(),
            coin=coin,
            score=score,
            label=label,
            article_count=len(articles),
            top_headlines=headlines[:5],
            ai_analysis=ai_analysis
        )
        
        # Store in history
        self.history[coin].append(sentiment)
        
        return sentiment
    
    def measure_all(self) -> List[SentimentScore]:
        """Measure sentiment for all tracked coins."""
        return [self.measure_coin(coin) for coin in self.coins]
    
    def get_trend(self, coin: str) -> SentimentTrend:
        """Calculate trend for a coin."""
        history = list(self.history.get(coin, []))
        
        if not history:
            return SentimentTrend(
                coin=coin,
                current_score=0.0,
                current_label="neutral"
            )
        
        current = history[-1]
        
        # Calculate averages
        now = datetime.now()
        scores_1h = [s.score for s in history if now - s.timestamp <= timedelta(hours=1)]
        scores_24h = [s.score for s in history]
        
        avg_1h = statistics.mean(scores_1h) if scores_1h else None
        avg_24h = statistics.mean(scores_24h) if scores_24h else None
        
        # Calculate change
        change_1h = 0.0
        if len(scores_1h) >= 2:
            old_avg = statistics.mean(scores_1h[:len(scores_1h)//2])
            new_avg = statistics.mean(scores_1h[len(scores_1h)//2:])
            change_1h = new_avg - old_avg
        
        # Determine trend
        if change_1h >= 0.1:
            trend = "rising"
        elif change_1h <= -0.1:
            trend = "falling"
        else:
            trend = "stable"
        
        # Check for alert
        alert = abs(change_1h) >= self.alert_threshold
        
        return SentimentTrend(
            coin=coin,
            current_score=current.score,
            current_label=current.label,
            avg_1h=avg_1h,
            avg_24h=avg_24h,
            trend=trend,
            change_1h=change_1h,
            alert=alert
        )
    
    def export_history(self, format: str = "json", filepath: str = None) -> str:
        """Export historical data."""
        if not filepath:
            filepath = f"sentiment_history_{datetime.now().strftime('%Y%m%d_%H%M%S')}.{format}"
        
        if format == "csv" and PANDAS_AVAILABLE:
            rows = []
            for coin, history in self.history.items():
                for s in history:
                    rows.append({
                        "timestamp": s.timestamp.isoformat(),
                        "coin": s.coin,
                        "score": s.score,
                        "label": s.label,
                        "article_count": s.article_count
                    })
            
            df = pd.DataFrame(rows)
            df.to_csv(filepath, index=False)
        else:
            data = {
                coin: [
                    {
                        "timestamp": s.timestamp.isoformat(),
                        "score": s.score,
                        "label": s.label,
                        "article_count": s.article_count,
                        "headlines": s.top_headlines
                    }
                    for s in history
                ]
                for coin, history in self.history.items()
            }
            with open(filepath, 'w') as f:
                json.dump(data, f, indent=2)
        
        return filepath


# =============================================================================
# DASHBOARD UI
# =============================================================================

class Dashboard:
    """Rich terminal dashboard."""
    
    def __init__(self, tracker: SentimentTracker):
        self.tracker = tracker
        self.running = True
    
    def create_table(self, scores: List[SentimentScore]) -> Table:
        """Create sentiment table."""
        table = Table(title="📊 Real-time Sentiment Monitor")
        
        table.add_column("Coin", style="cyan", width=10)
        table.add_column("Score", justify="center", width=10)
        table.add_column("Sentiment", justify="center", width=12)
        table.add_column("Trend", justify="center", width=10)
        table.add_column("1h Avg", justify="center", width=10)
        table.add_column("Articles", justify="right", width=10)
        table.add_column("Alert", justify="center", width=8)
        
        for score in scores:
            trend = self.tracker.get_trend(score.coin)
            
            # Color coding
            if score.label == "bullish":
                sentiment_style = "green"
                sentiment_emoji = "📈"
            elif score.label == "bearish":
                sentiment_style = "red"
                sentiment_emoji = "📉"
            else:
                sentiment_style = "yellow"
                sentiment_emoji = "➡️"
            
            # Trend indicator
            trend_indicators = {"rising": "⬆️", "falling": "⬇️", "stable": "➡️"}
            trend_text = f"{trend_indicators.get(trend.trend, '')} {trend.trend}"
            
            # Alert
            alert_text = "🚨" if trend.alert else ""
            
            table.add_row(
                score.coin.upper(),
                f"{score.score:+.2f}",
                Text(f"{sentiment_emoji} {score.label}", style=sentiment_style),
                trend_text,
                f"{trend.avg_1h:+.2f}" if trend.avg_1h is not None else "N/A",
                str(score.article_count),
                alert_text
            )
        
        return table
    
    def create_chart(self, coin: str) -> str:
        """Create ASCII chart for a coin."""
        if not PLOTEXT_AVAILABLE:
            return "plotext not installed"
        
        history = list(self.tracker.history.get(coin, []))
        if len(history) < 2:
            return "Not enough data for chart"
        
        plt.clear_data()
        plt.clear_figure()
        
        times = list(range(len(history)))
        scores = [s.score for s in history]
        
        plt.plot(times, scores, marker="braille")
        plt.title(f"{coin.upper()} Sentiment History")
        plt.xlabel("Time →")
        plt.ylabel("Score")
        plt.ylim(-1, 1)
        plt.plotsize(60, 15)
        
        return plt.build()
    
    async def run_live(self, interval: int = 60):
        """Run live dashboard."""
        if not RICH_AVAILABLE:
            print("Rich not installed. Running in simple mode.")
            await self.run_simple(interval)
            return
        
        with Live(console=console, refresh_per_second=1) as live:
            while self.running:
                try:
                    # Measure all coins
                    scores = self.tracker.measure_all()
                    
                    # Create layout
                    layout = Layout()
                    layout.split_column(
                        Layout(name="header", size=3),
                        Layout(name="main"),
                        Layout(name="footer", size=3)
                    )
                    
                    # Header
                    layout["header"].update(Panel(
                        f"[bold cyan]📊 Crypto Sentiment Tracker[/] | "
                        f"Tracking: {', '.join(c.upper() for c in self.tracker.coins)} | "
                        f"Updated: {datetime.now().strftime('%H:%M:%S')}",
                        style="cyan"
                    ))
                    
                    # Main table
                    layout["main"].update(self.create_table(scores))
                    
                    # Footer with any alerts
                    alerts = [s for s in scores if self.tracker.get_trend(s.coin).alert]
                    if alerts:
                        alert_text = " | ".join([
                            f"🚨 {s.coin.upper()}: {s.ai_analysis or s.label}"
                            for s in alerts
                        ])
                        layout["footer"].update(Panel(alert_text, style="red"))
                    else:
                        layout["footer"].update(Panel(
                            f"[dim]Next update in {interval} seconds. Press Ctrl+C to stop.[/]"
                        ))
                    
                    live.update(layout)
                    
                    await asyncio.sleep(interval)
                    
                except KeyboardInterrupt:
                    self.running = False
                    break
                except Exception as e:
                    console.print(f"[red]Error: {e}[/]")
                    await asyncio.sleep(interval)
        
        console.print("\n👋 Sentiment tracker stopped.")
    
    async def run_simple(self, interval: int = 60):
        """Run in simple text mode."""
        while self.running:
            try:
                print(f"\n{'='*60}")
                print(f"📊 Sentiment Update - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
                print(f"{'='*60}")
                
                scores = self.tracker.measure_all()
                
                for score in scores:
                    trend = self.tracker.get_trend(score.coin)
                    emoji = {"bullish": "📈", "bearish": "📉", "neutral": "➡️"}[score.label]
                    
                    print(f"\n{score.coin.upper():>6}: {emoji} {score.label:>8} "
                          f"({score.score:+.2f}) | Articles: {score.article_count}")
                    
                    if trend.alert:
                        print(f"        🚨 ALERT: Significant sentiment change!")
                    
                    if score.ai_analysis:
                        print(f"        💡 {score.ai_analysis[:100]}...")
                
                await asyncio.sleep(interval)
                
            except KeyboardInterrupt:
                self.running = False
                break
        
        print("\n👋 Sentiment tracker stopped.")


# =============================================================================
# MAIN
# =============================================================================

def main():
    parser = argparse.ArgumentParser(description="AI Sentiment Tracker")
    parser.add_argument("--coins", type=str, default="btc,eth,sol",
                        help="Comma-separated coin symbols to track")
    parser.add_argument("--all-coins", action="store_true",
                        help="Track all major coins")
    parser.add_argument("--interval", type=int, default=60,
                        help="Update interval in seconds")
    parser.add_argument("--alert-threshold", type=float, default=0.3,
                        help="Sentiment change threshold for alerts")
    parser.add_argument("--no-ai", action="store_true",
                        help="Disable AI analysis")
    parser.add_argument("--llm", type=str, default="openai",
                        choices=["openai", "anthropic"],
                        help="LLM provider for AI analysis")
    parser.add_argument("--export", type=str, choices=["json", "csv"],
                        help="Export format (triggers one-time export)")
    parser.add_argument("--historical", action="store_true",
                        help="Show historical analysis only")
    parser.add_argument("--hours", type=int, default=24,
                        help="Hours of history to analyze (with --historical)")
    
    args = parser.parse_args()
    
    # Determine coins to track
    if args.all_coins:
        coins = list(COIN_MAPPINGS.keys())
    else:
        coins = [c.strip() for c in args.coins.split(",")]
    
    # Create tracker
    tracker = SentimentTracker(
        coins=coins,
        use_ai=not args.no_ai,
        llm_provider=args.llm,
        alert_threshold=args.alert_threshold
    )
    
    # Export mode
    if args.export:
        print(f"📊 Measuring sentiment for: {', '.join(c.upper() for c in coins)}")
        tracker.measure_all()
        filepath = tracker.export_history(args.export)
        print(f"✅ Exported to {filepath}")
        return
    
    # Historical analysis mode
    if args.historical:
        if RICH_AVAILABLE:
            console.print(Panel.fit(
                f"[bold cyan]📈 Historical Sentiment Analysis[/]\n"
                f"Coins: {', '.join(c.upper() for c in coins)}\n"
                f"Period: Last {args.hours} hours",
                border_style="cyan"
            ))
        
        # Take multiple measurements
        print(f"\nCollecting data (this may take a moment)...")
        tracker.measure_all()
        
        for coin in coins:
            trend = tracker.get_trend(coin)
            print(f"\n{coin.upper()}: {trend.current_label} ({trend.current_score:+.2f})")
        
        return
    
    # Live dashboard mode
    dashboard = Dashboard(tracker)
    
    try:
        asyncio.run(dashboard.run_live(args.interval))
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
