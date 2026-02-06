#!/usr/bin/env python3
"""
Crypto News Sentiment Analysis Tool

A complete sentiment analysis tool for cryptocurrency news that:
- Fetches real-time news from Free Crypto News API
- Analyzes sentiment using NLTK VADER (finance-tuned)
- Calculates aggregate sentiment percentages per coin
- Supports both API-based and local VADER analysis
- Outputs results in multiple formats (console, JSON, CSV)

This is a FREE alternative to paid sentiment analysis APIs.
No API keys required for news fetching!

Usage:
    python sentiment-analysis.py                    # Analyze all coins
    python sentiment-analysis.py --coins BTC ETH   # Specific coins
    python sentiment-analysis.py --output json     # JSON output
    python sentiment-analysis.py --output csv      # CSV output
    python sentiment-analysis.py --use-api         # Use API sentiment (faster)
    python sentiment-analysis.py --verbose         # Show individual articles

Requirements:
    pip install requests nltk pandas

Author: Free Crypto News (https://github.com/nirholas/free-crypto-news)
License: MIT
"""

import argparse
import csv
import json
import sys
from datetime import datetime, timedelta
from typing import Optional

import requests

# Try to import NLTK VADER for local sentiment analysis
try:
    import nltk
    from nltk.sentiment.vader import SentimentIntensityAnalyzer
    
    # Download VADER lexicon if not present
    try:
        nltk.data.find('sentiment/vader_lexicon.zip')
    except LookupError:
        print("Downloading VADER lexicon...")
        nltk.download('vader_lexicon', quiet=True)
    
    VADER_AVAILABLE = True
    sia = SentimentIntensityAnalyzer()
except ImportError:
    VADER_AVAILABLE = False
    sia = None
    print("Note: NLTK not installed. Using API sentiment only.")
    print("Install with: pip install nltk")

# Try to import pandas for CSV export
try:
    import pandas as pd
    PANDAS_AVAILABLE = True
except ImportError:
    PANDAS_AVAILABLE = False


# =============================================================================
# CONFIGURATION
# =============================================================================

API_URL = "https://cryptocurrency.cv"

# Cryptocurrency keywords mapping (symbol -> search keywords)
CRYPTO_KEYWORDS = {
    "BTC": ["Bitcoin", "BTC"],
    "ETH": ["Ethereum", "ETH"],
    "SOL": ["Solana", "SOL"],
    "XRP": ["Ripple", "XRP"],
    "ADA": ["Cardano", "ADA"],
    "DOGE": ["Dogecoin", "DOGE"],
    "DOT": ["Polkadot", "DOT"],
    "AVAX": ["Avalanche", "AVAX"],
    "MATIC": ["Polygon", "MATIC"],
    "LINK": ["Chainlink", "LINK"],
    "UNI": ["Uniswap", "UNI"],
    "ATOM": ["Cosmos", "ATOM"],
    "LTC": ["Litecoin", "LTC"],
    "ARB": ["Arbitrum", "ARB"],
    "OP": ["Optimism", "OP"],
}

# Sentiment thresholds for VADER compound score
POSITIVE_THRESHOLD = 0.05
NEGATIVE_THRESHOLD = -0.05


# =============================================================================
# SENTIMENT ANALYSIS FUNCTIONS
# =============================================================================

def analyze_sentiment_vader(text: str) -> dict:
    """
    Analyze sentiment using NLTK VADER (Valence Aware Dictionary and sEntiment Reasoner).
    
    VADER is specifically tuned for social media and financial text, making it
    excellent for crypto news analysis.
    
    Args:
        text: The text to analyze
        
    Returns:
        Dictionary with sentiment scores and classification
    """
    if not VADER_AVAILABLE or sia is None:
        return {"error": "VADER not available"}
    
    scores = sia.polarity_scores(text)
    compound = scores['compound']
    
    # Classify based on compound score
    if compound >= POSITIVE_THRESHOLD:
        sentiment = "positive"
    elif compound <= NEGATIVE_THRESHOLD:
        sentiment = "negative"
    else:
        sentiment = "neutral"
    
    return {
        "sentiment": sentiment,
        "compound": compound,
        "positive": scores['pos'],
        "neutral": scores['neu'],
        "negative": scores['neg'],
        "confidence": abs(compound)
    }


def analyze_sentiment_api(title: str, content: str) -> dict:
    """
    Analyze sentiment using the Free Crypto News API.
    
    This uses Groq AI for sentiment analysis and is useful when
    NLTK is not available or for comparison.
    
    Args:
        title: Article title
        content: Article content/description
        
    Returns:
        Dictionary with sentiment analysis results
    """
    try:
        payload = {
            "action": "sentiment",
            "title": title,
            "content": content or title
        }
        
        response = requests.post(
            f"{API_URL}/api/ai",
            headers={"Content-Type": "application/json"},
            json=payload,
            timeout=30
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            return {"error": f"API returned {response.status_code}"}
            
    except Exception as e:
        return {"error": str(e)}


# =============================================================================
# NEWS FETCHING FUNCTIONS
# =============================================================================

def fetch_news(query: Optional[str] = None, category: Optional[str] = None, 
               limit: int = 50) -> list:
    """
    Fetch news from Free Crypto News API.
    
    Args:
        query: Search query (e.g., "Bitcoin")
        category: Category filter (e.g., "bitcoin", "defi")
        limit: Maximum number of articles to fetch
        
    Returns:
        List of news articles
    """
    params = {"limit": limit}
    
    if query:
        # Use search endpoint
        params["q"] = query
        endpoint = f"{API_URL}/api/search"
    elif category:
        params["category"] = category
        endpoint = f"{API_URL}/api/news"
    else:
        endpoint = f"{API_URL}/api/news"
    
    try:
        response = requests.get(endpoint, params=params, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            # Handle both direct array and nested response formats
            if isinstance(data, list):
                return data
            elif isinstance(data, dict):
                return data.get("articles", data.get("news", data.get("results", [])))
            return []
        else:
            print(f"Error fetching news: {response.status_code}")
            return []
            
    except Exception as e:
        print(f"Error fetching news: {e}")
        return []


def fetch_sentiment_from_api(asset: Optional[str] = None) -> dict:
    """
    Fetch pre-computed sentiment data from the API.
    
    Args:
        asset: Filter by asset (e.g., "BTC", "ETH")
        
    Returns:
        Sentiment data from API
    """
    params = {"limit": 20}
    if asset:
        params["asset"] = asset
    
    try:
        response = requests.get(
            f"{API_URL}/api/sentiment",
            params=params,
            timeout=30
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            return {"error": f"API returned {response.status_code}"}
            
    except Exception as e:
        return {"error": str(e)}


# =============================================================================
# MAIN ANALYSIS FUNCTIONS
# =============================================================================

def analyze_coin_sentiment(symbol: str, keywords: list, limit: int = 30, 
                          use_api: bool = False, verbose: bool = False) -> dict:
    """
    Analyze sentiment for a specific cryptocurrency.
    
    Args:
        symbol: Coin symbol (e.g., "BTC")
        keywords: Search keywords for the coin
        limit: Number of articles to analyze
        use_api: Use API sentiment instead of local VADER
        verbose: Print individual article sentiments
        
    Returns:
        Dictionary with sentiment analysis results
    """
    # Fetch news for this coin
    articles = []
    for keyword in keywords:
        fetched = fetch_news(query=keyword, limit=limit // len(keywords))
        articles.extend(fetched)
    
    if not articles:
        return {
            "symbol": symbol,
            "keywords": keywords,
            "article_count": 0,
            "sentiment": {
                "positive": 0,
                "neutral": 0,
                "negative": 0
            },
            "average_compound": 0,
            "overall": "neutral",
            "articles": []
        }
    
    # Analyze each article
    sentiments = []
    compound_scores = []
    article_details = []
    
    for article in articles:
        title = article.get("title", "")
        description = article.get("description", "") or article.get("summary", "") or ""
        text = f"{title} {description}"
        
        if use_api:
            result = analyze_sentiment_api(title, description)
            sentiment = result.get("sentiment", "neutral")
            compound = 0.5 if sentiment == "positive" else (-0.5 if sentiment == "negative" else 0)
        else:
            result = analyze_sentiment_vader(text)
            sentiment = result.get("sentiment", "neutral")
            compound = result.get("compound", 0)
        
        sentiments.append(sentiment)
        compound_scores.append(compound)
        
        article_detail = {
            "title": title[:100],
            "sentiment": sentiment,
            "compound": round(compound, 3),
            "source": article.get("source", {}).get("name", article.get("source", "Unknown"))
        }
        article_details.append(article_detail)
        
        if verbose:
            emoji = "🟢" if sentiment == "positive" else ("🔴" if sentiment == "negative" else "⚪")
            print(f"  {emoji} [{compound:+.3f}] {title[:60]}...")
    
    # Calculate percentages
    total = len(sentiments)
    positive_pct = sentiments.count("positive") / total * 100
    neutral_pct = sentiments.count("neutral") / total * 100
    negative_pct = sentiments.count("negative") / total * 100
    avg_compound = sum(compound_scores) / total
    
    # Determine overall sentiment
    if avg_compound >= POSITIVE_THRESHOLD:
        overall = "bullish"
    elif avg_compound <= NEGATIVE_THRESHOLD:
        overall = "bearish"
    else:
        overall = "neutral"
    
    return {
        "symbol": symbol,
        "keywords": keywords,
        "article_count": total,
        "sentiment": {
            "positive": round(positive_pct, 1),
            "neutral": round(neutral_pct, 1),
            "negative": round(negative_pct, 1)
        },
        "average_compound": round(avg_compound, 3),
        "overall": overall,
        "analyzed_at": datetime.utcnow().isoformat(),
        "articles": article_details if verbose else []
    }


def analyze_all_coins(coins: Optional[list] = None, limit: int = 30,
                      use_api: bool = False, verbose: bool = False) -> dict:
    """
    Analyze sentiment for multiple cryptocurrencies.
    
    Args:
        coins: List of coin symbols to analyze (None = all)
        limit: Articles per coin
        use_api: Use API sentiment instead of VADER
        verbose: Print detailed output
        
    Returns:
        Dictionary with all analysis results
    """
    results = {}
    coin_list = coins if coins else list(CRYPTO_KEYWORDS.keys())
    
    print(f"\n📊 Analyzing sentiment for {len(coin_list)} cryptocurrencies...\n")
    
    for symbol in coin_list:
        if symbol not in CRYPTO_KEYWORDS:
            print(f"⚠️  Unknown symbol: {symbol}, skipping...")
            continue
            
        keywords = CRYPTO_KEYWORDS[symbol]
        print(f"🔍 Analyzing {symbol} ({', '.join(keywords)})...")
        
        result = analyze_coin_sentiment(
            symbol=symbol,
            keywords=keywords,
            limit=limit,
            use_api=use_api,
            verbose=verbose
        )
        results[symbol] = result
        
        # Print summary
        s = result["sentiment"]
        overall = result["overall"]
        emoji = "🐂" if overall == "bullish" else ("🐻" if overall == "bearish" else "😐")
        
        print(f"   {emoji} {overall.upper()}: +{s['positive']:.1f}% | ○{s['neutral']:.1f}% | -{s['negative']:.1f}% "
              f"(compound: {result['average_compound']:+.3f}, {result['article_count']} articles)\n")
    
    return {
        "analyzed_at": datetime.utcnow().isoformat(),
        "coins_analyzed": len(results),
        "method": "api" if use_api else "vader",
        "results": results
    }


# =============================================================================
# OUTPUT FUNCTIONS
# =============================================================================

def output_json(data: dict, filename: Optional[str] = None) -> None:
    """Output results as JSON."""
    json_str = json.dumps(data, indent=2)
    
    if filename:
        with open(filename, 'w') as f:
            f.write(json_str)
        print(f"\n📁 Results saved to {filename}")
    else:
        print(json_str)


def output_csv(data: dict, filename: str = "sentiment_results.csv") -> None:
    """Output results as CSV."""
    rows = []
    
    for symbol, result in data.get("results", {}).items():
        rows.append({
            "symbol": symbol,
            "overall": result["overall"],
            "positive_pct": result["sentiment"]["positive"],
            "neutral_pct": result["sentiment"]["neutral"],
            "negative_pct": result["sentiment"]["negative"],
            "compound_avg": result["average_compound"],
            "article_count": result["article_count"],
            "analyzed_at": result["analyzed_at"]
        })
    
    if PANDAS_AVAILABLE:
        df = pd.DataFrame(rows)
        df.to_csv(filename, index=False)
    else:
        with open(filename, 'w', newline='') as f:
            if rows:
                writer = csv.DictWriter(f, fieldnames=rows[0].keys())
                writer.writeheader()
                writer.writerows(rows)
    
    print(f"\n📁 Results saved to {filename}")


def output_table(data: dict) -> None:
    """Output results as a formatted table."""
    print("\n" + "=" * 80)
    print("                    CRYPTO NEWS SENTIMENT ANALYSIS")
    print("=" * 80)
    print(f"{'Symbol':<8} {'Overall':<10} {'Positive':>10} {'Neutral':>10} {'Negative':>10} {'Compound':>10} {'Articles':>10}")
    print("-" * 80)
    
    for symbol, result in data.get("results", {}).items():
        s = result["sentiment"]
        overall = result["overall"].upper()
        
        # Color coding for terminal
        if overall == "BULLISH":
            color = "\033[92m"  # Green
        elif overall == "BEARISH":
            color = "\033[91m"  # Red
        else:
            color = "\033[93m"  # Yellow
        reset = "\033[0m"
        
        print(f"{symbol:<8} {color}{overall:<10}{reset} {s['positive']:>9.1f}% {s['neutral']:>9.1f}% "
              f"{s['negative']:>9.1f}% {result['average_compound']:>+10.3f} {result['article_count']:>10}")
    
    print("=" * 80)
    print(f"Analyzed at: {data['analyzed_at']}")
    print(f"Method: {'API Sentiment' if data['method'] == 'api' else 'VADER (Local)'}")
    print("=" * 80)


# =============================================================================
# MAIN ENTRY POINT
# =============================================================================

def main():
    parser = argparse.ArgumentParser(
        description="Analyze cryptocurrency news sentiment",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python sentiment-analysis.py                     # Analyze all coins
  python sentiment-analysis.py --coins BTC ETH SOL # Specific coins only
  python sentiment-analysis.py --output json       # Output as JSON
  python sentiment-analysis.py --output csv        # Save to CSV file
  python sentiment-analysis.py --use-api           # Use API sentiment (Groq AI)
  python sentiment-analysis.py --verbose           # Show individual articles
  python sentiment-analysis.py --limit 50          # 50 articles per coin

Powered by Free Crypto News API - https://github.com/nirholas/free-crypto-news
        """
    )
    
    parser.add_argument(
        "--coins", "-c",
        nargs="+",
        help="Specific coin symbols to analyze (e.g., BTC ETH SOL)"
    )
    
    parser.add_argument(
        "--limit", "-l",
        type=int,
        default=30,
        help="Number of articles to analyze per coin (default: 30)"
    )
    
    parser.add_argument(
        "--output", "-o",
        choices=["table", "json", "csv"],
        default="table",
        help="Output format (default: table)"
    )
    
    parser.add_argument(
        "--file", "-f",
        help="Output filename for json/csv formats"
    )
    
    parser.add_argument(
        "--use-api",
        action="store_true",
        help="Use API sentiment analysis instead of local VADER"
    )
    
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="Show individual article sentiments"
    )
    
    parser.add_argument(
        "--api-only",
        action="store_true",
        help="Fetch pre-computed sentiment from API only (fastest)"
    )
    
    args = parser.parse_args()
    
    # Check if using VADER without it installed
    if not args.use_api and not VADER_AVAILABLE:
        print("⚠️  NLTK VADER not available. Using API sentiment instead.")
        args.use_api = True
    
    # API-only mode: just fetch from /api/sentiment
    if args.api_only:
        print("\n📡 Fetching sentiment data from API...")
        for coin in (args.coins or ["BTC", "ETH", "SOL"]):
            data = fetch_sentiment_from_api(coin)
            print(f"\n{coin}:")
            print(json.dumps(data, indent=2))
        return
    
    # Analyze coins
    results = analyze_all_coins(
        coins=args.coins,
        limit=args.limit,
        use_api=args.use_api,
        verbose=args.verbose
    )
    
    # Output results
    if args.output == "json":
        output_json(results, args.file)
    elif args.output == "csv":
        output_csv(results, args.file or "sentiment_results.csv")
    else:
        output_table(results)
    
    # Summary
    bullish = sum(1 for r in results["results"].values() if r["overall"] == "bullish")
    bearish = sum(1 for r in results["results"].values() if r["overall"] == "bearish")
    neutral = sum(1 for r in results["results"].values() if r["overall"] == "neutral")
    
    print(f"\n📈 Market Summary: {bullish} Bullish | {neutral} Neutral | {bearish} Bearish")
    
    if bullish > bearish:
        print("🐂 Overall market sentiment: BULLISH")
    elif bearish > bullish:
        print("🐻 Overall market sentiment: BEARISH")
    else:
        print("😐 Overall market sentiment: MIXED")


if __name__ == "__main__":
    main()
