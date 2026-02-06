#!/usr/bin/env python3
"""
📰 AI Digest Bot Agent

Generates daily/weekly AI-summarized news digests:
- Executive summary of top stories
- Category breakdowns (DeFi, Bitcoin, Regulations, etc.)
- Sentiment trends over time
- Trending topics and emerging narratives
- Multi-format output (Email, Telegram, Slack, Markdown, HTML)

Features:
- Multiple digest frequencies (hourly, daily, weekly)
- AI-powered summarization with multiple LLM support
- Customizable topics and focus areas
- Beautiful HTML email templates
- Scheduled delivery with APScheduler
- Historical archive support

Usage:
    python digest-bot.py --frequency daily --channel email
    python digest-bot.py --frequency hourly --channel telegram --focus bitcoin,eth
    python digest-bot.py --generate-now --output markdown
    python digest-bot.py --schedule "0 8 * * *" --channel slack

Requirements:
    pip install langchain openai anthropic apscheduler aiosmtplib jinja2 markdown

Author: Free Crypto News
License: MIT
"""

import argparse
import asyncio
import os
import json
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from dataclasses import dataclass, field
from pathlib import Path
import hashlib

import requests

# LLM imports
try:
    from langchain_openai import ChatOpenAI
    from langchain_anthropic import ChatAnthropic
    from langchain_core.messages import HumanMessage, SystemMessage
    LANGCHAIN_AVAILABLE = True
except ImportError:
    LANGCHAIN_AVAILABLE = False

# Scheduling
try:
    from apscheduler.schedulers.asyncio import AsyncIOScheduler
    from apscheduler.triggers.cron import CronTrigger
    SCHEDULER_AVAILABLE = True
except ImportError:
    SCHEDULER_AVAILABLE = False

# Email
try:
    import aiosmtplib
    from email.mime.text import MIMEText
    from email.mime.multipart import MIMEMultipart
    EMAIL_AVAILABLE = True
except ImportError:
    EMAIL_AVAILABLE = False

# Templates
try:
    from jinja2 import Template
    import markdown
    TEMPLATE_AVAILABLE = True
except ImportError:
    TEMPLATE_AVAILABLE = False

# Rich console
try:
    from rich.console import Console
    from rich.panel import Panel
    from rich.markdown import Markdown
    from rich.progress import Progress, SpinnerColumn, TextColumn
    console = Console()
    RICH_AVAILABLE = True
except ImportError:
    RICH_AVAILABLE = False
    console = None


# =============================================================================
# CONFIGURATION
# =============================================================================

API_BASE = "https://cryptocurrency.cv"

# Categories for digest sections
DIGEST_CATEGORIES = [
    "bitcoin",
    "ethereum",
    "defi",
    "nft",
    "regulation",
    "altcoins",
    "exchanges",
    "analysis"
]

# HTML Email Template
EMAIL_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; margin-bottom: 20px; }
        .header h1 { margin: 0; font-size: 28px; }
        .header p { margin: 5px 0 0; opacity: 0.9; }
        .section { background: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 15px; }
        .section h2 { color: #667eea; margin-top: 0; font-size: 18px; border-bottom: 2px solid #667eea; padding-bottom: 8px; }
        .article { padding: 12px 0; border-bottom: 1px solid #e9ecef; }
        .article:last-child { border-bottom: none; }
        .article h3 { margin: 0 0 5px; font-size: 16px; }
        .article h3 a { color: #333; text-decoration: none; }
        .article h3 a:hover { color: #667eea; }
        .article .meta { font-size: 13px; color: #6c757d; }
        .summary { background: white; border-left: 4px solid #667eea; padding: 15px; margin: 15px 0; }
        .stats { display: flex; gap: 20px; margin-top: 15px; }
        .stat { text-align: center; }
        .stat .number { font-size: 24px; font-weight: bold; color: #667eea; }
        .stat .label { font-size: 12px; color: #6c757d; }
        .sentiment { display: inline-block; padding: 3px 8px; border-radius: 12px; font-size: 12px; font-weight: bold; }
        .bullish { background: #d4edda; color: #155724; }
        .bearish { background: #f8d7da; color: #721c24; }
        .neutral { background: #e2e3e5; color: #383d41; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; color: #6c757d; font-size: 13px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>📰 {{ title }}</h1>
        <p>{{ subtitle }}</p>
    </div>
    
    <div class="summary">
        <strong>📋 Executive Summary</strong>
        <p>{{ executive_summary }}</p>
    </div>
    
    <div class="stats">
        <div class="stat">
            <div class="number">{{ total_articles }}</div>
            <div class="label">Articles</div>
        </div>
        <div class="stat">
            <div class="number">{{ sources_count }}</div>
            <div class="label">Sources</div>
        </div>
        <div class="stat">
            <div class="number">
                <span class="sentiment {{ overall_sentiment }}">{{ overall_sentiment | upper }}</span>
            </div>
            <div class="label">Sentiment</div>
        </div>
    </div>
    
    {% for section in sections %}
    <div class="section">
        <h2>{{ section.emoji }} {{ section.title }}</h2>
        {% if section.summary %}
        <p>{{ section.summary }}</p>
        {% endif %}
        {% for article in section.articles %}
        <div class="article">
            <h3><a href="{{ article.link }}">{{ article.title }}</a></h3>
            <div class="meta">{{ article.source }} • {{ article.timeAgo }}</div>
        </div>
        {% endfor %}
    </div>
    {% endfor %}
    
    <div class="section">
        <h2>🔥 Trending Topics</h2>
        <p>{{ trending_topics }}</p>
    </div>
    
    <div class="footer">
        <p>Powered by <a href="https://cryptocurrency.cv">Free Crypto News API</a></p>
        <p>{{ timestamp }}</p>
    </div>
</body>
</html>
"""


@dataclass
class DigestConfig:
    frequency: str = "daily"  # hourly, daily, weekly
    focus_topics: List[str] = field(default_factory=list)
    max_articles_per_section: int = 5
    include_sentiment: bool = True
    include_ai_summary: bool = True
    llm_provider: str = "openai"  # openai, anthropic
    output_format: str = "markdown"  # markdown, html, json


@dataclass
class Digest:
    title: str
    subtitle: str
    timestamp: str
    executive_summary: str
    sections: List[Dict]
    trending_topics: str
    total_articles: int
    sources_count: int
    overall_sentiment: str


# =============================================================================
# NEWS COLLECTOR
# =============================================================================

class NewsCollector:
    """Collects news for digest generation."""
    
    def __init__(self, config: DigestConfig):
        self.config = config
    
    def get_time_range(self) -> int:
        """Get hours to look back based on frequency."""
        if self.config.frequency == "hourly":
            return 1
        elif self.config.frequency == "daily":
            return 24
        else:  # weekly
            return 168
    
    def fetch_latest(self, limit: int = 100) -> List[Dict]:
        """Fetch latest news."""
        try:
            response = requests.get(f"{API_BASE}/api/news", params={"limit": limit}, timeout=10)
            if response.status_code == 200:
                return response.json().get("articles", [])
        except Exception as e:
            print(f"Error fetching news: {e}")
        return []
    
    def fetch_by_category(self, category: str, limit: int = 20) -> List[Dict]:
        """Fetch news by category."""
        try:
            response = requests.get(
                f"{API_BASE}/api/news/{category}",
                params={"limit": limit},
                timeout=10
            )
            if response.status_code == 200:
                return response.json().get("articles", [])
        except Exception:
            pass
        return []
    
    def fetch_trending(self) -> List[Dict]:
        """Fetch trending topics."""
        try:
            response = requests.get(f"{API_BASE}/api/trending", timeout=10)
            if response.status_code == 200:
                return response.json().get("topics", [])
        except Exception:
            pass
        return []
    
    def fetch_breaking(self) -> List[Dict]:
        """Fetch breaking news."""
        try:
            response = requests.get(f"{API_BASE}/api/breaking", timeout=10)
            if response.status_code == 200:
                return response.json().get("articles", [])
        except Exception:
            pass
        return []
    
    def collect_all(self) -> Dict[str, Any]:
        """Collect all news for digest."""
        data = {
            "latest": self.fetch_latest(100),
            "breaking": self.fetch_breaking(),
            "trending": self.fetch_trending(),
            "categories": {}
        }
        
        categories = self.config.focus_topics if self.config.focus_topics else DIGEST_CATEGORIES
        
        for category in categories:
            data["categories"][category] = self.fetch_by_category(category, 10)
        
        return data


# =============================================================================
# AI SUMMARIZER
# =============================================================================

class AISummarizer:
    """AI-powered news summarization."""
    
    def __init__(self, provider: str = "openai"):
        if not LANGCHAIN_AVAILABLE:
            raise ImportError("langchain not installed")
        
        if provider == "anthropic":
            self.llm = ChatAnthropic(model="claude-3-5-sonnet-latest", temperature=0.3)
        else:
            self.llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.3)
    
    def summarize_articles(self, articles: List[Dict], context: str = "") -> str:
        """Summarize a list of articles."""
        if not articles:
            return "No significant news in this period."
        
        # Prepare article summaries
        article_text = "\n".join([
            f"- {a.get('title', '')} ({a.get('source', 'Unknown')})"
            for a in articles[:15]
        ])
        
        messages = [
            SystemMessage(content="""You are a crypto news analyst. Write a concise 2-3 sentence summary 
            of the key themes and important developments from these headlines. Focus on actionable insights 
            and market implications. Be factual and avoid speculation."""),
            HumanMessage(content=f"Context: {context}\n\nHeadlines:\n{article_text}\n\nProvide a brief summary:")
        ]
        
        response = self.llm.invoke(messages)
        return response.content
    
    def generate_executive_summary(self, all_articles: List[Dict]) -> str:
        """Generate executive summary for the digest."""
        if not all_articles:
            return "Light news activity during this period."
        
        # Get top headlines
        headlines = [a.get("title", "") for a in all_articles[:20]]
        
        messages = [
            SystemMessage(content="""You are a senior crypto analyst writing an executive summary for 
            investors. In 3-4 sentences, highlight the most important developments, market trends, 
            and key takeaways. Be professional and insightful."""),
            HumanMessage(content=f"Top headlines:\n" + "\n".join([f"- {h}" for h in headlines]))
        ]
        
        response = self.llm.invoke(messages)
        return response.content
    
    def analyze_sentiment(self, articles: List[Dict]) -> str:
        """Analyze overall sentiment."""
        if not articles:
            return "neutral"
        
        # Simple keyword-based sentiment
        bullish_keywords = ["surge", "rally", "soar", "gain", "bullish", "breakthrough", "adoption", "growth", "up", "high"]
        bearish_keywords = ["crash", "drop", "fall", "plunge", "bearish", "decline", "risk", "warning", "down", "low"]
        
        text = " ".join([a.get("title", "").lower() for a in articles])
        
        bullish_count = sum(1 for kw in bullish_keywords if kw in text)
        bearish_count = sum(1 for kw in bearish_keywords if kw in text)
        
        if bullish_count > bearish_count + 2:
            return "bullish"
        elif bearish_count > bullish_count + 2:
            return "bearish"
        return "neutral"
    
    def extract_trending_summary(self, topics: List[Dict]) -> str:
        """Summarize trending topics."""
        if not topics:
            return "No clear trending topics."
        
        topic_names = [t.get("topic", t.get("name", "")) for t in topics[:10]]
        return ", ".join(topic_names) if topic_names else "General market activity"


# =============================================================================
# DIGEST GENERATOR
# =============================================================================

class DigestGenerator:
    """Generates the complete digest."""
    
    def __init__(self, config: DigestConfig):
        self.config = config
        self.collector = NewsCollector(config)
        self.summarizer = None
        
        if config.include_ai_summary and LANGCHAIN_AVAILABLE:
            try:
                self.summarizer = AISummarizer(config.llm_provider)
            except Exception as e:
                print(f"AI summarization unavailable: {e}")
    
    def get_category_emoji(self, category: str) -> str:
        """Get emoji for category."""
        emojis = {
            "bitcoin": "₿",
            "ethereum": "⟠",
            "defi": "🏦",
            "nft": "🖼️",
            "regulation": "⚖️",
            "altcoins": "🪙",
            "exchanges": "📊",
            "analysis": "📈",
            "breaking": "🚨"
        }
        return emojis.get(category.lower(), "📰")
    
    def generate(self) -> Digest:
        """Generate the complete digest."""
        if RICH_AVAILABLE:
            with Progress(
                SpinnerColumn(),
                TextColumn("[progress.description]{task.description}"),
                console=console
            ) as progress:
                task = progress.add_task("Collecting news...", total=None)
                data = self.collector.collect_all()
                progress.update(task, description="Analyzing content...")
        else:
            print("📥 Collecting news...")
            data = self.collector.collect_all()
        
        # Calculate stats
        all_articles = data["latest"]
        sources = set(a.get("source", "Unknown") for a in all_articles)
        
        # Generate sections
        sections = []
        
        # Breaking news section (if any)
        if data["breaking"]:
            section = {
                "title": "Breaking News",
                "emoji": "🚨",
                "articles": data["breaking"][:self.config.max_articles_per_section],
                "summary": None
            }
            if self.summarizer:
                section["summary"] = self.summarizer.summarize_articles(
                    data["breaking"][:5], "Breaking crypto news"
                )
            sections.append(section)
        
        # Category sections
        for category, articles in data["categories"].items():
            if not articles:
                continue
            
            section = {
                "title": category.title(),
                "emoji": self.get_category_emoji(category),
                "articles": articles[:self.config.max_articles_per_section],
                "summary": None
            }
            
            if self.summarizer:
                section["summary"] = self.summarizer.summarize_articles(
                    articles[:5], f"{category} news"
                )
            
            sections.append(section)
        
        # Generate executive summary
        executive_summary = "Here are the key developments in crypto today."
        if self.summarizer:
            executive_summary = self.summarizer.generate_executive_summary(all_articles)
        
        # Analyze sentiment
        overall_sentiment = "neutral"
        if self.summarizer:
            overall_sentiment = self.summarizer.analyze_sentiment(all_articles)
        
        # Trending topics
        trending_topics = "General market activity"
        if self.summarizer and data["trending"]:
            trending_topics = self.summarizer.extract_trending_summary(data["trending"])
        
        # Create digest
        frequency_titles = {
            "hourly": "Hourly Update",
            "daily": "Daily Digest",
            "weekly": "Weekly Roundup"
        }
        
        digest = Digest(
            title=f"Crypto News {frequency_titles.get(self.config.frequency, 'Digest')}",
            subtitle=datetime.now().strftime("%B %d, %Y %I:%M %p"),
            timestamp=datetime.now().isoformat(),
            executive_summary=executive_summary,
            sections=sections,
            trending_topics=trending_topics,
            total_articles=len(all_articles),
            sources_count=len(sources),
            overall_sentiment=overall_sentiment
        )
        
        return digest


# =============================================================================
# OUTPUT FORMATTERS
# =============================================================================

class OutputFormatter:
    """Base output formatter."""
    
    def format(self, digest: Digest) -> str:
        raise NotImplementedError


class MarkdownFormatter(OutputFormatter):
    """Format digest as Markdown."""
    
    def format(self, digest: Digest) -> str:
        lines = [
            f"# 📰 {digest.title}",
            f"*{digest.subtitle}*",
            "",
            "---",
            "",
            "## 📋 Executive Summary",
            "",
            digest.executive_summary,
            "",
            f"📊 **Stats:** {digest.total_articles} articles from {digest.sources_count} sources | "
            f"Sentiment: **{digest.overall_sentiment.upper()}**",
            "",
            "---",
        ]
        
        for section in digest.sections:
            lines.append("")
            lines.append(f"## {section['emoji']} {section['title']}")
            lines.append("")
            
            if section.get("summary"):
                lines.append(f"> {section['summary']}")
                lines.append("")
            
            for article in section["articles"]:
                lines.append(f"- [{article.get('title', 'Untitled')}]({article.get('link', '#')}) "
                           f"*({article.get('source', 'Unknown')})*")
            
            lines.append("")
        
        lines.extend([
            "---",
            "",
            f"## 🔥 Trending Topics",
            "",
            digest.trending_topics,
            "",
            "---",
            "",
            f"*Generated at {digest.timestamp}*",
            "*Powered by [Free Crypto News API](https://cryptocurrency.cv)*"
        ])
        
        return "\n".join(lines)


class HTMLFormatter(OutputFormatter):
    """Format digest as HTML."""
    
    def format(self, digest: Digest) -> str:
        if not TEMPLATE_AVAILABLE:
            return "<p>Jinja2 not installed for HTML formatting</p>"
        
        template = Template(EMAIL_TEMPLATE)
        return template.render(
            title=digest.title,
            subtitle=digest.subtitle,
            executive_summary=digest.executive_summary,
            sections=digest.sections,
            trending_topics=digest.trending_topics,
            total_articles=digest.total_articles,
            sources_count=digest.sources_count,
            overall_sentiment=digest.overall_sentiment,
            timestamp=digest.timestamp
        )


class JSONFormatter(OutputFormatter):
    """Format digest as JSON."""
    
    def format(self, digest: Digest) -> str:
        return json.dumps({
            "title": digest.title,
            "subtitle": digest.subtitle,
            "timestamp": digest.timestamp,
            "executive_summary": digest.executive_summary,
            "sections": digest.sections,
            "trending_topics": digest.trending_topics,
            "stats": {
                "total_articles": digest.total_articles,
                "sources_count": digest.sources_count,
                "overall_sentiment": digest.overall_sentiment
            }
        }, indent=2)


# =============================================================================
# DELIVERY CHANNELS
# =============================================================================

class DeliveryChannel:
    """Base delivery channel."""
    
    async def deliver(self, content: str, format: str) -> bool:
        raise NotImplementedError


class ConsoleChannel(DeliveryChannel):
    """Console output."""
    
    async def deliver(self, content: str, format: str) -> bool:
        if RICH_AVAILABLE and format == "markdown":
            console.print(Markdown(content))
        else:
            print(content)
        return True


class FileChannel(DeliveryChannel):
    """File output."""
    
    def __init__(self, output_dir: str = "./digests"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
    
    async def deliver(self, content: str, format: str) -> bool:
        ext = {"markdown": "md", "html": "html", "json": "json"}.get(format, "txt")
        filename = f"digest_{datetime.now().strftime('%Y%m%d_%H%M%S')}.{ext}"
        filepath = self.output_dir / filename
        
        filepath.write_text(content)
        print(f"📁 Saved digest to {filepath}")
        return True


class EmailChannel(DeliveryChannel):
    """Email delivery."""
    
    def __init__(self):
        self.host = os.environ.get("SMTP_HOST", "smtp.gmail.com")
        self.port = int(os.environ.get("SMTP_PORT", "587"))
        self.user = os.environ.get("SMTP_USER")
        self.password = os.environ.get("SMTP_PASSWORD")
        self.to_email = os.environ.get("DIGEST_EMAIL_TO")
    
    async def deliver(self, content: str, format: str) -> bool:
        if not EMAIL_AVAILABLE:
            print("❌ aiosmtplib not installed")
            return False
        
        if not all([self.user, self.password, self.to_email]):
            print("❌ Email not configured (set SMTP_USER, SMTP_PASSWORD, DIGEST_EMAIL_TO)")
            return False
        
        try:
            message = MIMEMultipart("alternative")
            message["From"] = self.user
            message["To"] = self.to_email
            message["Subject"] = f"📰 Crypto News Digest - {datetime.now().strftime('%B %d, %Y')}"
            
            if format == "html":
                message.attach(MIMEText(content, "html"))
            else:
                message.attach(MIMEText(content, "plain"))
            
            await aiosmtplib.send(
                message,
                hostname=self.host,
                port=self.port,
                username=self.user,
                password=self.password,
                start_tls=True
            )
            print(f"📧 Sent digest to {self.to_email}")
            return True
        except Exception as e:
            print(f"❌ Email error: {e}")
            return False


# =============================================================================
# DIGEST BOT
# =============================================================================

class DigestBot:
    """Main digest bot orchestrator."""
    
    def __init__(self, config: DigestConfig, channel: DeliveryChannel):
        self.config = config
        self.channel = channel
        self.generator = DigestGenerator(config)
        self.formatter = self._get_formatter()
    
    def _get_formatter(self) -> OutputFormatter:
        formatters = {
            "markdown": MarkdownFormatter(),
            "html": HTMLFormatter(),
            "json": JSONFormatter()
        }
        return formatters.get(self.config.output_format, MarkdownFormatter())
    
    async def generate_and_deliver(self):
        """Generate and deliver a digest."""
        if RICH_AVAILABLE:
            console.print(Panel.fit(
                f"[bold cyan]📰 Generating {self.config.frequency} Digest[/]",
                border_style="cyan"
            ))
        else:
            print(f"\n📰 Generating {self.config.frequency} digest...")
        
        # Generate digest
        digest = self.generator.generate()
        
        # Format
        content = self.formatter.format(digest)
        
        # Deliver
        await self.channel.deliver(content, self.config.output_format)
        
        if RICH_AVAILABLE:
            console.print(f"[green]✓ Digest generated with {digest.total_articles} articles[/]")
        else:
            print(f"✓ Digest generated with {digest.total_articles} articles")
    
    async def run_scheduled(self, cron_expression: str):
        """Run with scheduling."""
        if not SCHEDULER_AVAILABLE:
            print("❌ APScheduler not installed. Run with --generate-now instead.")
            return
        
        scheduler = AsyncIOScheduler()
        scheduler.add_job(
            self.generate_and_deliver,
            CronTrigger.from_crontab(cron_expression)
        )
        
        if RICH_AVAILABLE:
            console.print(Panel.fit(
                f"[bold cyan]📅 Scheduled Digest Bot[/]\n"
                f"Schedule: {cron_expression}\n"
                f"Format: {self.config.output_format}",
                border_style="cyan"
            ))
        else:
            print(f"\n📅 Digest scheduled: {cron_expression}")
        
        scheduler.start()
        
        try:
            while True:
                await asyncio.sleep(60)
        except KeyboardInterrupt:
            scheduler.shutdown()
            print("\n👋 Digest bot stopped.")


# =============================================================================
# MAIN
# =============================================================================

def main():
    parser = argparse.ArgumentParser(description="AI Digest Bot")
    parser.add_argument("--frequency", type=str, default="daily",
                        choices=["hourly", "daily", "weekly"],
                        help="Digest frequency")
    parser.add_argument("--focus", type=str, help="Comma-separated topics to focus on")
    parser.add_argument("--output", type=str, default="markdown",
                        choices=["markdown", "html", "json"],
                        help="Output format")
    parser.add_argument("--channel", type=str, default="console",
                        choices=["console", "email", "file"],
                        help="Delivery channel")
    parser.add_argument("--llm", type=str, default="openai",
                        choices=["openai", "anthropic"],
                        help="LLM provider for summaries")
    parser.add_argument("--no-ai", action="store_true", help="Disable AI summarization")
    parser.add_argument("--generate-now", action="store_true", help="Generate immediately")
    parser.add_argument("--schedule", type=str, help="Cron expression for scheduling (e.g., '0 8 * * *')")
    parser.add_argument("--output-dir", type=str, default="./digests", help="Output directory for file channel")
    
    args = parser.parse_args()
    
    # Parse focus topics
    focus_topics = [t.strip() for t in args.focus.split(",")] if args.focus else []
    
    # Create config
    config = DigestConfig(
        frequency=args.frequency,
        focus_topics=focus_topics,
        include_ai_summary=not args.no_ai,
        llm_provider=args.llm,
        output_format=args.output
    )
    
    # Create channel
    if args.channel == "email":
        channel = EmailChannel()
    elif args.channel == "file":
        channel = FileChannel(args.output_dir)
    else:
        channel = ConsoleChannel()
    
    # Create bot
    bot = DigestBot(config, channel)
    
    # Run
    if args.schedule:
        asyncio.run(bot.run_scheduled(args.schedule))
    else:
        asyncio.run(bot.generate_and_deliver())


if __name__ == "__main__":
    main()
