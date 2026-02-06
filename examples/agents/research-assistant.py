#!/usr/bin/env python3
"""
🔬 AI Research Assistant Agent

A comprehensive research assistant that helps you:
- Deep-dive into any crypto topic
- Analyze trends and patterns across news
- Generate research reports with citations
- Answer complex questions about crypto markets

Features:
- Multi-source research (130+ news outlets)
- Citation tracking with links
- Topic clustering and trend analysis
- Export to Markdown/PDF
- Conversation memory for follow-up questions

Usage:
    python research-assistant.py                                    # Interactive mode
    python research-assistant.py "What's happening with Bitcoin ETFs?"
    python research-assistant.py --topic "Ethereum L2s" --depth deep
    python research-assistant.py --report "DeFi Trends" --output report.md

Requirements:
    pip install langchain langchain-openai requests rich

Author: Free Crypto News
License: MIT
"""

import argparse
import json
import os
import sys
from datetime import datetime
from typing import Optional, List, Dict

import requests

# LangChain imports
try:
    from langchain.tools import tool
    from langchain_openai import ChatOpenAI
    from langchain_anthropic import ChatAnthropic
    from langchain.prompts import ChatPromptTemplate
    from langchain.schema import HumanMessage, SystemMessage, AIMessage
    from langchain.memory import ConversationBufferMemory
    LANGCHAIN_AVAILABLE = True
except ImportError:
    LANGCHAIN_AVAILABLE = False
    print("Note: LangChain not installed. Install with:")
    print("pip install langchain langchain-openai langchain-anthropic")

# Rich console
try:
    from rich.console import Console
    from rich.markdown import Markdown
    from rich.panel import Panel
    from rich.progress import Progress, SpinnerColumn, TextColumn
    from rich.prompt import Prompt
    console = Console()
    RICH_AVAILABLE = True
except ImportError:
    RICH_AVAILABLE = False
    console = None


# =============================================================================
# CONFIGURATION
# =============================================================================

API_BASE = "https://cryptocurrency.cv"

RESEARCH_SYSTEM_PROMPT = """You are an expert cryptocurrency research assistant with access to real-time news from 130+ trusted sources.

Your capabilities:
1. Analyze crypto news and identify key trends
2. Provide comprehensive answers with citations
3. Generate research reports on any crypto topic
4. Track sentiment and market narratives
5. Explain complex DeFi, NFT, and blockchain concepts

Guidelines:
- Always cite your sources with article titles and outlets
- Be objective and present multiple perspectives
- Highlight risks and uncertainties
- Use data and specific examples
- Structure your responses clearly with headers
- If you don't have enough information, say so

You have access to tools to fetch real-time news, search specific topics, and analyze sentiment."""

RESEARCH_DEPTHS = {
    "quick": {"articles": 5, "description": "Quick overview with top headlines"},
    "standard": {"articles": 15, "description": "Balanced research with multiple sources"},
    "deep": {"articles": 30, "description": "Comprehensive analysis with all available data"},
}


# =============================================================================
# API FUNCTIONS
# =============================================================================

def search_news(query: str, limit: int = 15) -> List[Dict]:
    """Search news by query."""
    try:
        response = requests.get(
            f"{API_BASE}/api/search",
            params={"q": query, "limit": limit},
            timeout=15
        )
        response.raise_for_status()
        return response.json().get("articles", [])
    except Exception as e:
        print(f"Error searching news: {e}")
        return []


def get_category_news(category: str, limit: int = 15) -> List[Dict]:
    """Get news by category."""
    try:
        response = requests.get(
            f"{API_BASE}/api/{category}",
            params={"limit": limit},
            timeout=15
        )
        response.raise_for_status()
        return response.json().get("articles", [])
    except Exception:
        return []


def get_trending_news(limit: int = 10) -> List[Dict]:
    """Get trending news."""
    try:
        response = requests.get(f"{API_BASE}/api/trending", timeout=10)
        response.raise_for_status()
        return response.json().get("articles", [])[:limit]
    except Exception:
        return []


def get_breaking_news() -> List[Dict]:
    """Get breaking news."""
    try:
        response = requests.get(f"{API_BASE}/api/breaking", timeout=10)
        response.raise_for_status()
        return response.json().get("articles", [])
    except Exception:
        return []


def get_sentiment(topic: str) -> Dict:
    """Get sentiment for a topic."""
    try:
        response = requests.get(
            f"{API_BASE}/api/ai/sentiment",
            params={"q": topic},
            timeout=10
        )
        response.raise_for_status()
        return response.json()
    except Exception:
        return {"sentiment": "unknown", "score": 0}


# =============================================================================
# LANGCHAIN TOOLS
# =============================================================================

if LANGCHAIN_AVAILABLE:
    @tool
    def search_crypto_news(query: str, limit: int = 15) -> str:
        """
        Search for crypto news articles by keyword.
        Use this to find news about specific topics, coins, or events.
        
        Args:
            query: Search keywords (e.g., "Bitcoin ETF", "Ethereum merge", "DeFi hack")
            limit: Number of articles to return (default 15)
        """
        articles = search_news(query, limit)
        if not articles:
            return f"No articles found for '{query}'"
        
        results = [f"📰 Found {len(articles)} articles for '{query}':\n"]
        for i, article in enumerate(articles, 1):
            results.append(
                f"{i}. **{article['title']}**\n"
                f"   Source: {article['source']} | {article['timeAgo']}\n"
                f"   Link: {article['link']}\n"
            )
        return "\n".join(results)

    @tool
    def get_news_by_category(category: str) -> str:
        """
        Get news by category.
        
        Available categories: bitcoin, ethereum, defi, nft, regulation, 
        altcoins, mining, trading, technology, security
        """
        articles = get_category_news(category, limit=10)
        if not articles:
            return f"No articles found for category '{category}'"
        
        results = [f"📂 {category.title()} News:\n"]
        for i, article in enumerate(articles, 1):
            results.append(f"{i}. {article['title']} ({article['source']})")
        return "\n".join(results)

    @tool
    def get_trending() -> str:
        """Get currently trending crypto topics and news."""
        articles = get_trending_news(10)
        if not articles:
            return "No trending topics available"
        
        results = ["🔥 Trending Topics:\n"]
        for i, article in enumerate(articles, 1):
            results.append(f"{i}. {article['title']} ({article['source']})")
        return "\n".join(results)

    @tool
    def get_breaking() -> str:
        """Get breaking news from the last 2 hours."""
        articles = get_breaking_news()
        if not articles:
            return "No breaking news in the last 2 hours"
        
        results = ["🚨 Breaking News:\n"]
        for article in articles[:5]:
            results.append(f"• {article['title']} ({article['timeAgo']})")
        return "\n".join(results)

    @tool
    def analyze_sentiment(topic: str) -> str:
        """
        Analyze market sentiment for a topic or coin.
        
        Args:
            topic: The topic to analyze (e.g., "Bitcoin", "DeFi", "NFTs")
        """
        sentiment = get_sentiment(topic)
        return json.dumps(sentiment, indent=2)


# =============================================================================
# RESEARCH ASSISTANT
# =============================================================================

class ResearchAssistant:
    """AI-powered crypto research assistant."""
    
    def __init__(self, provider: str = "openai", depth: str = "standard"):
        self.provider = provider
        self.depth = RESEARCH_DEPTHS.get(depth, RESEARCH_DEPTHS["standard"])
        self.conversation_history = []
        
        # Initialize LLM
        if LANGCHAIN_AVAILABLE:
            if provider == "anthropic":
                self.llm = ChatAnthropic(
                    model="claude-3-opus-20240229",
                    temperature=0.3,
                    max_tokens=4096
                )
            else:
                self.llm = ChatOpenAI(
                    model="gpt-4-turbo-preview",
                    temperature=0.3,
                    max_tokens=4096
                )
        else:
            self.llm = None
    
    def research(self, query: str) -> str:
        """Conduct research on a topic."""
        if not self.llm:
            return self._simple_research(query)
        
        # Gather context
        context = self._gather_context(query)
        
        # Build prompt with context
        prompt = f"""Based on the following recent news and data, answer this research question:

**Question:** {query}

**Recent News Context:**
{context}

Provide a comprehensive answer with:
1. Key findings and trends
2. Specific citations from the articles
3. Different perspectives if applicable
4. Potential implications
5. Any gaps in information

Format your response in clear Markdown."""

        # Add to conversation history
        self.conversation_history.append(HumanMessage(content=prompt))
        
        try:
            response = self.llm.invoke([
                SystemMessage(content=RESEARCH_SYSTEM_PROMPT),
                *self.conversation_history
            ])
            
            self.conversation_history.append(AIMessage(content=response.content))
            return response.content
        except Exception as e:
            return f"Error during research: {e}"
    
    def _gather_context(self, query: str) -> str:
        """Gather relevant news context for the query."""
        articles = search_news(query, limit=self.depth["articles"])
        
        if not articles:
            # Try broader search
            articles = get_trending_news(self.depth["articles"])
        
        context_parts = []
        for i, article in enumerate(articles, 1):
            context_parts.append(
                f"[{i}] **{article['title']}**\n"
                f"Source: {article['source']} | Published: {article['timeAgo']}\n"
                f"Description: {article.get('description', 'N/A')}\n"
            )
        
        return "\n".join(context_parts) if context_parts else "No relevant articles found."
    
    def _simple_research(self, query: str) -> str:
        """Simple research without LLM."""
        articles = search_news(query, limit=self.depth["articles"])
        
        if not articles:
            return f"No articles found for '{query}'"
        
        result = [f"# Research: {query}\n"]
        result.append(f"Found {len(articles)} relevant articles:\n")
        
        for i, article in enumerate(articles, 1):
            result.append(f"## {i}. {article['title']}")
            result.append(f"**Source:** {article['source']} | **Published:** {article['timeAgo']}")
            if article.get('description'):
                result.append(f"\n{article['description']}\n")
            result.append(f"[Read more]({article['link']})\n")
        
        return "\n".join(result)
    
    def generate_report(self, topic: str, output_file: Optional[str] = None) -> str:
        """Generate a comprehensive research report."""
        if RICH_AVAILABLE:
            with Progress(
                SpinnerColumn(),
                TextColumn("[progress.description]{task.description}"),
                console=console
            ) as progress:
                task = progress.add_task("Gathering news...", total=4)
                
                # Gather data
                main_articles = search_news(topic, limit=20)
                progress.update(task, advance=1, description="Analyzing trends...")
                
                trending = get_trending_news(10)
                progress.update(task, advance=1, description="Getting sentiment...")
                
                sentiment = get_sentiment(topic)
                progress.update(task, advance=1, description="Generating report...")
        else:
            print("Gathering data...")
            main_articles = search_news(topic, limit=20)
            trending = get_trending_news(10)
            sentiment = get_sentiment(topic)
        
        # Build report
        report = self._build_report(topic, main_articles, trending, sentiment)
        
        # Save to file if specified
        if output_file:
            with open(output_file, 'w') as f:
                f.write(report)
            if RICH_AVAILABLE:
                console.print(f"[green]✓ Report saved to {output_file}[/]")
            else:
                print(f"✓ Report saved to {output_file}")
        
        return report
    
    def _build_report(self, topic: str, articles: list, trending: list, sentiment: dict) -> str:
        """Build a formatted research report."""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")
        
        report = f"""# Research Report: {topic}

**Generated:** {timestamp}  
**Sources Analyzed:** {len(articles)}  
**Research Depth:** {self.depth['description']}

---

## Executive Summary

This report analyzes {len(articles)} articles about {topic} from multiple crypto news sources.

**Sentiment:** {sentiment.get('sentiment', 'Unknown').title()}  
**Sentiment Score:** {sentiment.get('score', 0):+.2f}

---

## Key Headlines

"""
        # Add top articles
        for i, article in enumerate(articles[:10], 1):
            report += f"{i}. **{article['title']}**  \n"
            report += f"   *{article['source']}* — {article['timeAgo']}  \n"
            if article.get('description'):
                report += f"   > {article['description'][:200]}...  \n"
            report += "\n"
        
        # Add trending context
        if trending:
            report += "\n---\n\n## Related Trending Topics\n\n"
            for article in trending[:5]:
                report += f"- {article['title']} ({article['source']})\n"
        
        # Add sources
        report += "\n---\n\n## Sources\n\n"
        sources = set(a['source'] for a in articles)
        for source in sorted(sources):
            count = sum(1 for a in articles if a['source'] == source)
            report += f"- {source}: {count} articles\n"
        
        report += f"""
---

## Methodology

This report was generated using the Free Crypto News API, which aggregates content from 130+ trusted cryptocurrency news sources. The sentiment analysis combines AI-powered natural language processing with keyword-based heuristics.

**Disclaimer:** This report is for informational purposes only and should not be considered financial advice. Always do your own research before making investment decisions.

---

*Generated by Free Crypto News Research Assistant*  
*https://github.com/nirholas/free-crypto-news*
"""
        
        return report
    
    def follow_up(self, question: str) -> str:
        """Answer a follow-up question using conversation context."""
        return self.research(question)
    
    def clear_history(self):
        """Clear conversation history."""
        self.conversation_history = []


# =============================================================================
# INTERACTIVE MODE
# =============================================================================

def interactive_mode(assistant: ResearchAssistant):
    """Run interactive research session."""
    if RICH_AVAILABLE:
        console.print(Panel.fit(
            "[bold cyan]🔬 AI Research Assistant[/]\n"
            "Ask any question about cryptocurrency markets.\n"
            "Commands: /report <topic>, /clear, /exit",
            border_style="cyan"
        ))
    else:
        print("\n🔬 AI Research Assistant")
        print("Ask any question about cryptocurrency markets.")
        print("Commands: /report <topic>, /clear, /exit\n")
    
    while True:
        try:
            if RICH_AVAILABLE:
                query = Prompt.ask("\n[bold cyan]You[/]")
            else:
                query = input("\nYou: ").strip()
            
            if not query:
                continue
            
            # Handle commands
            if query.lower() == "/exit":
                print("Goodbye!")
                break
            elif query.lower() == "/clear":
                assistant.clear_history()
                print("Conversation cleared.")
                continue
            elif query.lower().startswith("/report "):
                topic = query[8:].strip()
                report = assistant.generate_report(topic, f"report_{topic.replace(' ', '_').lower()}.md")
                if RICH_AVAILABLE:
                    console.print(Markdown(report))
                else:
                    print(report)
                continue
            
            # Regular research query
            if RICH_AVAILABLE:
                with console.status("[bold green]Researching..."):
                    response = assistant.research(query)
                console.print("\n[bold green]Assistant:[/]")
                console.print(Markdown(response))
            else:
                print("Researching...")
                response = assistant.research(query)
                print(f"\nAssistant:\n{response}")
                
        except KeyboardInterrupt:
            print("\nGoodbye!")
            break


# =============================================================================
# MAIN
# =============================================================================

def main():
    parser = argparse.ArgumentParser(description="AI Research Assistant")
    parser.add_argument("query", nargs="?", help="Research query")
    parser.add_argument("--topic", type=str, help="Topic for research")
    parser.add_argument("--depth", type=str, default="standard",
                        choices=["quick", "standard", "deep"],
                        help="Research depth")
    parser.add_argument("--provider", type=str, default="openai",
                        choices=["openai", "anthropic"],
                        help="LLM provider")
    parser.add_argument("--report", type=str, help="Generate report on topic")
    parser.add_argument("--output", type=str, help="Output file for report")
    
    args = parser.parse_args()
    
    # Check for API keys
    if args.provider == "openai" and not os.environ.get("OPENAI_API_KEY"):
        print("⚠️  OPENAI_API_KEY not set. Set it with: export OPENAI_API_KEY='sk-...'")
    elif args.provider == "anthropic" and not os.environ.get("ANTHROPIC_API_KEY"):
        print("⚠️  ANTHROPIC_API_KEY not set.")
    
    # Create assistant
    assistant = ResearchAssistant(provider=args.provider, depth=args.depth)
    
    if args.report:
        # Generate report
        report = assistant.generate_report(args.report, args.output)
        if RICH_AVAILABLE:
            console.print(Markdown(report))
        else:
            print(report)
    elif args.query or args.topic:
        # Single query
        query = args.query or args.topic
        if RICH_AVAILABLE:
            with console.status("[bold green]Researching..."):
                response = assistant.research(query)
            console.print(Markdown(response))
        else:
            print("Researching...")
            response = assistant.research(query)
            print(response)
    else:
        # Interactive mode
        interactive_mode(assistant)


if __name__ == "__main__":
    main()
