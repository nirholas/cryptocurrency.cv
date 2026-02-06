#!/usr/bin/env python3
"""
🚨 AI Alert Bot Agent

Real-time cryptocurrency news alerts delivered to:
- Telegram
- Discord
- Slack
- Email
- Webhooks

Features:
- Keyword-based filtering (e.g., "bitcoin", "hack", "regulation")
- Sentiment-based alerts (only bullish/bearish news)
- Breaking news priority alerts
- Whale movement notifications
- Configurable cooldowns to prevent spam
- Multi-channel support

Usage:
    python alert-bot.py --keywords "bitcoin,regulation" --channel telegram
    python alert-bot.py --sentiment bearish --channel discord
    python alert-bot.py --breaking --channel slack
    python alert-bot.py --whales --min-amount 10000000 --channel webhook

Requirements:
    pip install aiohttp python-telegram-bot discord.py slack-sdk

Author: Free Crypto News
License: MIT
"""

import argparse
import asyncio
import json
import os
import re
import time
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Set
from dataclasses import dataclass, field

import aiohttp

# Platform SDKs
try:
    from telegram import Bot
    from telegram.constants import ParseMode
    TELEGRAM_AVAILABLE = True
except ImportError:
    TELEGRAM_AVAILABLE = False

try:
    import discord
    from discord import Webhook
    DISCORD_AVAILABLE = True
except ImportError:
    DISCORD_AVAILABLE = False

try:
    from slack_sdk.webhook import WebhookClient
    SLACK_AVAILABLE = True
except ImportError:
    SLACK_AVAILABLE = False

# Rich console
try:
    from rich.console import Console
    from rich.live import Live
    from rich.table import Table
    from rich.panel import Panel
    console = Console()
    RICH_AVAILABLE = True
except ImportError:
    RICH_AVAILABLE = False
    console = None


# =============================================================================
# CONFIGURATION
# =============================================================================

API_BASE = "https://cryptocurrency.cv"

# Alert types
@dataclass
class AlertConfig:
    keywords: List[str] = field(default_factory=list)
    sentiment: Optional[str] = None  # "bullish", "bearish", or None for all
    breaking_only: bool = False
    min_importance: int = 0  # 0-100
    sources: List[str] = field(default_factory=list)  # Filter by source
    cooldown_minutes: int = 5  # Prevent duplicate alerts
    whale_alerts: bool = False
    whale_min_amount: int = 1_000_000  # $1M minimum


@dataclass
class Alert:
    id: str
    title: str
    source: str
    link: str
    timestamp: str
    alert_type: str  # "keyword", "sentiment", "breaking", "whale"
    matched_keywords: List[str] = field(default_factory=list)
    sentiment: Optional[str] = None
    importance: int = 50


# =============================================================================
# NEWS FETCHER
# =============================================================================

class NewsFetcher:
    """Async news fetcher with caching."""
    
    def __init__(self):
        self.seen_articles: Set[str] = set()
        self.last_fetch = datetime.min
        self.cache_ttl = 30  # seconds
    
    async def fetch_latest(self, limit: int = 20) -> List[Dict]:
        """Fetch latest news."""
        async with aiohttp.ClientSession() as session:
            try:
                async with session.get(
                    f"{API_BASE}/api/news",
                    params={"limit": limit},
                    timeout=aiohttp.ClientTimeout(total=10)
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        return data.get("articles", [])
            except Exception as e:
                print(f"Error fetching news: {e}")
        return []
    
    async def fetch_breaking(self) -> List[Dict]:
        """Fetch breaking news."""
        async with aiohttp.ClientSession() as session:
            try:
                async with session.get(
                    f"{API_BASE}/api/breaking",
                    timeout=aiohttp.ClientTimeout(total=10)
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        return data.get("articles", [])
            except Exception as e:
                print(f"Error fetching breaking news: {e}")
        return []
    
    async def fetch_whales(self) -> List[Dict]:
        """Fetch whale alerts."""
        async with aiohttp.ClientSession() as session:
            try:
                async with session.get(
                    f"{API_BASE}/api/whales",
                    timeout=aiohttp.ClientTimeout(total=10)
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        return data.get("transactions", [])
            except Exception:
                pass
        return []
    
    async def search(self, query: str, limit: int = 10) -> List[Dict]:
        """Search news by keyword."""
        async with aiohttp.ClientSession() as session:
            try:
                async with session.get(
                    f"{API_BASE}/api/search",
                    params={"q": query, "limit": limit},
                    timeout=aiohttp.ClientTimeout(total=10)
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        return data.get("articles", [])
            except Exception:
                pass
        return []
    
    def is_new(self, article_id: str) -> bool:
        """Check if article is new."""
        if article_id in self.seen_articles:
            return False
        self.seen_articles.add(article_id)
        # Limit cache size
        if len(self.seen_articles) > 1000:
            self.seen_articles = set(list(self.seen_articles)[-500:])
        return True


# =============================================================================
# ALERT CHANNELS
# =============================================================================

class AlertChannel:
    """Base class for alert channels."""
    
    async def send(self, alert: Alert) -> bool:
        raise NotImplementedError


class TelegramChannel(AlertChannel):
    """Telegram alert channel."""
    
    def __init__(self, bot_token: str, chat_id: str):
        if not TELEGRAM_AVAILABLE:
            raise ImportError("python-telegram-bot not installed")
        self.bot = Bot(token=bot_token)
        self.chat_id = chat_id
    
    async def send(self, alert: Alert) -> bool:
        try:
            emoji = {"keyword": "📰", "sentiment": "📊", "breaking": "🚨", "whale": "🐋"}.get(alert.alert_type, "📰")
            
            message = f"{emoji} *{alert.title}*\n\n"
            message += f"📍 Source: {alert.source}\n"
            
            if alert.matched_keywords:
                message += f"🏷️ Keywords: {', '.join(alert.matched_keywords)}\n"
            if alert.sentiment:
                sentiment_emoji = "📈" if alert.sentiment == "bullish" else "📉"
                message += f"{sentiment_emoji} Sentiment: {alert.sentiment.title()}\n"
            
            message += f"\n🔗 [Read More]({alert.link})"
            
            await self.bot.send_message(
                chat_id=self.chat_id,
                text=message,
                parse_mode=ParseMode.MARKDOWN,
                disable_web_page_preview=True
            )
            return True
        except Exception as e:
            print(f"Telegram error: {e}")
            return False


class DiscordChannel(AlertChannel):
    """Discord webhook channel."""
    
    def __init__(self, webhook_url: str):
        if not DISCORD_AVAILABLE:
            raise ImportError("discord.py not installed")
        self.webhook_url = webhook_url
    
    async def send(self, alert: Alert) -> bool:
        try:
            async with aiohttp.ClientSession() as session:
                webhook = Webhook.from_url(self.webhook_url, session=session)
                
                color = {
                    "breaking": 0xFF0000,  # Red
                    "whale": 0x0099FF,     # Blue
                    "sentiment": 0x00FF00 if alert.sentiment == "bullish" else 0xFF6600,
                    "keyword": 0xFFCC00,   # Yellow
                }.get(alert.alert_type, 0xFFCC00)
                
                embed = discord.Embed(
                    title=alert.title,
                    url=alert.link,
                    color=color,
                    timestamp=datetime.now()
                )
                embed.add_field(name="Source", value=alert.source, inline=True)
                embed.add_field(name="Type", value=alert.alert_type.title(), inline=True)
                
                if alert.matched_keywords:
                    embed.add_field(name="Keywords", value=", ".join(alert.matched_keywords), inline=False)
                
                await webhook.send(embed=embed)
                return True
        except Exception as e:
            print(f"Discord error: {e}")
            return False


class SlackChannel(AlertChannel):
    """Slack webhook channel."""
    
    def __init__(self, webhook_url: str):
        if not SLACK_AVAILABLE:
            raise ImportError("slack-sdk not installed")
        self.client = WebhookClient(webhook_url)
    
    async def send(self, alert: Alert) -> bool:
        try:
            emoji = {"keyword": ":newspaper:", "sentiment": ":chart_with_upwards_trend:", 
                     "breaking": ":rotating_light:", "whale": ":whale:"}.get(alert.alert_type, ":newspaper:")
            
            blocks = [
                {
                    "type": "header",
                    "text": {"type": "plain_text", "text": f"{emoji} {alert.alert_type.title()} Alert"}
                },
                {
                    "type": "section",
                    "text": {"type": "mrkdwn", "text": f"*{alert.title}*"}
                },
                {
                    "type": "context",
                    "elements": [
                        {"type": "mrkdwn", "text": f"📍 *Source:* {alert.source}"},
                        {"type": "mrkdwn", "text": f"⏰ *Time:* {alert.timestamp}"}
                    ]
                },
                {
                    "type": "actions",
                    "elements": [
                        {
                            "type": "button",
                            "text": {"type": "plain_text", "text": "Read Article"},
                            "url": alert.link
                        }
                    ]
                }
            ]
            
            response = self.client.send(blocks=blocks)
            return response.status_code == 200
        except Exception as e:
            print(f"Slack error: {e}")
            return False


class WebhookChannel(AlertChannel):
    """Generic webhook channel."""
    
    def __init__(self, webhook_url: str):
        self.webhook_url = webhook_url
    
    async def send(self, alert: Alert) -> bool:
        try:
            async with aiohttp.ClientSession() as session:
                payload = {
                    "id": alert.id,
                    "title": alert.title,
                    "source": alert.source,
                    "link": alert.link,
                    "timestamp": alert.timestamp,
                    "alert_type": alert.alert_type,
                    "keywords": alert.matched_keywords,
                    "sentiment": alert.sentiment,
                    "importance": alert.importance
                }
                
                async with session.post(
                    self.webhook_url,
                    json=payload,
                    timeout=aiohttp.ClientTimeout(total=10)
                ) as response:
                    return response.status in (200, 201, 202)
        except Exception as e:
            print(f"Webhook error: {e}")
            return False


class ConsoleChannel(AlertChannel):
    """Console output channel for testing."""
    
    async def send(self, alert: Alert) -> bool:
        emoji = {"keyword": "📰", "sentiment": "📊", "breaking": "🚨", "whale": "🐋"}.get(alert.alert_type, "📰")
        
        if RICH_AVAILABLE:
            color = {"breaking": "red", "whale": "blue", "sentiment": "green", "keyword": "yellow"}.get(alert.alert_type, "white")
            console.print(Panel(
                f"[bold]{alert.title}[/]\n\n"
                f"Source: {alert.source}\n"
                f"Type: {alert.alert_type.title()}\n"
                f"Keywords: {', '.join(alert.matched_keywords) if alert.matched_keywords else 'N/A'}",
                title=f"{emoji} Alert",
                border_style=color
            ))
        else:
            print(f"\n{emoji} [{alert.alert_type.upper()}] {alert.title}")
            print(f"   Source: {alert.source}")
            print(f"   Link: {alert.link}")
        
        return True


# =============================================================================
# ALERT BOT
# =============================================================================

class AlertBot:
    """Main alert bot engine."""
    
    def __init__(self, config: AlertConfig, channels: List[AlertChannel]):
        self.config = config
        self.channels = channels
        self.fetcher = NewsFetcher()
        self.alert_history: Dict[str, datetime] = {}
        self.stats = {"total": 0, "sent": 0, "filtered": 0}
    
    def matches_config(self, article: Dict) -> Optional[Alert]:
        """Check if article matches alert config."""
        title = article.get("title", "").lower()
        description = article.get("description", "").lower()
        text = f"{title} {description}"
        
        # Create article ID
        article_id = article.get("link", title[:50])
        
        # Check if already seen
        if not self.fetcher.is_new(article_id):
            return None
        
        # Check cooldown
        if article_id in self.alert_history:
            if datetime.now() - self.alert_history[article_id] < timedelta(minutes=self.config.cooldown_minutes):
                return None
        
        # Check source filter
        if self.config.sources:
            if article.get("source", "").lower() not in [s.lower() for s in self.config.sources]:
                return None
        
        # Check keywords
        matched_keywords = []
        if self.config.keywords:
            for keyword in self.config.keywords:
                if keyword.lower() in text:
                    matched_keywords.append(keyword)
            
            if not matched_keywords:
                self.stats["filtered"] += 1
                return None
        
        # Create alert
        alert = Alert(
            id=article_id,
            title=article.get("title", ""),
            source=article.get("source", "Unknown"),
            link=article.get("link", ""),
            timestamp=article.get("timeAgo", ""),
            alert_type="keyword" if matched_keywords else "breaking",
            matched_keywords=matched_keywords
        )
        
        self.alert_history[article_id] = datetime.now()
        return alert
    
    async def send_alert(self, alert: Alert):
        """Send alert to all channels."""
        self.stats["total"] += 1
        
        for channel in self.channels:
            success = await channel.send(alert)
            if success:
                self.stats["sent"] += 1
    
    async def check_news(self):
        """Check for new alerts."""
        if self.config.breaking_only:
            articles = await self.fetcher.fetch_breaking()
        else:
            articles = await self.fetcher.fetch_latest(limit=20)
        
        for article in articles:
            alert = self.matches_config(article)
            if alert:
                await self.send_alert(alert)
    
    async def check_whales(self):
        """Check for whale alerts."""
        if not self.config.whale_alerts:
            return
        
        transactions = await self.fetcher.fetch_whales()
        for tx in transactions:
            amount = tx.get("amount_usd", 0)
            if amount >= self.config.whale_min_amount:
                alert = Alert(
                    id=tx.get("hash", str(time.time())),
                    title=f"🐋 Whale Alert: ${amount:,.0f} {tx.get('coin', 'Unknown')}",
                    source="Whale Tracker",
                    link=tx.get("link", ""),
                    timestamp=tx.get("time", ""),
                    alert_type="whale"
                )
                await self.send_alert(alert)
    
    async def run(self, interval: int = 60):
        """Run the alert bot continuously."""
        if RICH_AVAILABLE:
            console.print(Panel.fit(
                f"[bold cyan]🚨 Alert Bot Running[/]\n"
                f"Keywords: {', '.join(self.config.keywords) if self.config.keywords else 'All'}\n"
                f"Breaking Only: {self.config.breaking_only}\n"
                f"Whale Alerts: {self.config.whale_alerts}\n"
                f"Interval: {interval}s",
                border_style="cyan"
            ))
        else:
            print(f"\n🚨 Alert Bot Running")
            print(f"Keywords: {', '.join(self.config.keywords) if self.config.keywords else 'All'}")
            print(f"Checking every {interval} seconds...\n")
        
        while True:
            try:
                await self.check_news()
                await self.check_whales()
                await asyncio.sleep(interval)
            except KeyboardInterrupt:
                print("\n👋 Alert bot stopped.")
                break
            except Exception as e:
                print(f"Error: {e}")
                await asyncio.sleep(interval)


# =============================================================================
# MAIN
# =============================================================================

def create_channel(channel_type: str) -> AlertChannel:
    """Create alert channel from type and environment."""
    if channel_type == "telegram":
        token = os.environ.get("TELEGRAM_BOT_TOKEN")
        chat_id = os.environ.get("TELEGRAM_CHAT_ID")
        if not token or not chat_id:
            raise ValueError("Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID")
        return TelegramChannel(token, chat_id)
    
    elif channel_type == "discord":
        webhook = os.environ.get("DISCORD_WEBHOOK_URL")
        if not webhook:
            raise ValueError("Set DISCORD_WEBHOOK_URL")
        return DiscordChannel(webhook)
    
    elif channel_type == "slack":
        webhook = os.environ.get("SLACK_WEBHOOK_URL")
        if not webhook:
            raise ValueError("Set SLACK_WEBHOOK_URL")
        return SlackChannel(webhook)
    
    elif channel_type == "webhook":
        webhook = os.environ.get("WEBHOOK_URL")
        if not webhook:
            raise ValueError("Set WEBHOOK_URL")
        return WebhookChannel(webhook)
    
    else:
        return ConsoleChannel()


def main():
    parser = argparse.ArgumentParser(description="AI Alert Bot")
    parser.add_argument("--keywords", type=str, help="Comma-separated keywords to monitor")
    parser.add_argument("--breaking", action="store_true", help="Breaking news only")
    parser.add_argument("--whales", action="store_true", help="Enable whale alerts")
    parser.add_argument("--min-amount", type=int, default=1_000_000, help="Minimum whale amount")
    parser.add_argument("--channel", type=str, default="console",
                        choices=["telegram", "discord", "slack", "webhook", "console"],
                        help="Alert channel")
    parser.add_argument("--interval", type=int, default=60, help="Check interval in seconds")
    parser.add_argument("--cooldown", type=int, default=5, help="Cooldown between duplicate alerts (minutes)")
    
    args = parser.parse_args()
    
    # Parse keywords
    keywords = [k.strip() for k in args.keywords.split(",")] if args.keywords else []
    
    # Create config
    config = AlertConfig(
        keywords=keywords,
        breaking_only=args.breaking,
        whale_alerts=args.whales,
        whale_min_amount=args.min_amount,
        cooldown_minutes=args.cooldown
    )
    
    # Create channel
    try:
        channel = create_channel(args.channel)
    except ValueError as e:
        print(f"❌ {e}")
        return
    except ImportError as e:
        print(f"❌ Missing dependency: {e}")
        return
    
    # Create and run bot
    bot = AlertBot(config, [channel])
    asyncio.run(bot.run(interval=args.interval))


if __name__ == "__main__":
    main()
