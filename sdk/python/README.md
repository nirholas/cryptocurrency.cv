# Python SDK

Zero dependencies Python client for Free Crypto News API.

## Installation

Just copy `crypto_news.py` to your project - no pip install needed!

Or for convenience:
```bash
curl -O https://raw.githubusercontent.com/nirholas/free-crypto-news/main/sdk/python/crypto_news.py
```

## Usage

```python
from crypto_news import CryptoNews

# Initialize client
news = CryptoNews()

# Get latest news
articles = news.get_latest(limit=10)
for article in articles:
    print(f"{article['title']} - {article['source']}")

# Search for specific topics
eth_news = news.search("ethereum,eth")

# Get DeFi news
defi = news.get_defi(limit=5)

# Get Bitcoin news
btc = news.get_bitcoin(limit=5)

# Get breaking news (last 2 hours)
breaking = news.get_breaking()

# List all sources
sources = news.get_sources()
```

## Analytics & Trends

```python
# Trending topics with sentiment
trending = news.get_trending(limit=10, hours=24)
for topic in trending['trending']:
    print(f"{topic['topic']}: {topic['sentiment']}")

# API statistics
stats = news.get_stats()

# Sentiment analysis
analysis = news.analyze(limit=20, topic='bitcoin', sentiment='bullish')
print(f"Market: {analysis['summary']['overall_sentiment']}")
```

## Historical & Sources

```python
# Get archived news
archive = news.get_archive(date='2024-01-15', query='SEC', limit=20)

# Find original sources
origins = news.get_origins(query='binance', category='exchange')
for item in origins['items']:
    print(f"{item['title']} - Original: {item['likely_original_source']}")
```

## Available Methods

| Method | Description |
|--------|-------------|
| `get_latest(limit, source)` | Get latest news |
| `search(keywords, limit)` | Search by keywords |
| `get_defi(limit)` | DeFi news |
| `get_bitcoin(limit)` | Bitcoin news |
| `get_breaking(limit)` | Breaking news (last 2 hours) |
| `get_sources()` | List all sources |
| `get_trending(limit, hours)` | Trending topics |
| `get_stats()` | API statistics |
| `get_health()` | API health status |
| `analyze(limit, topic, sentiment)` | News with sentiment analysis |
| `get_archive(date, query, limit)` | Historical archive |
| `get_origins(query, category, limit)` | Find original sources |

## Quick Functions

```python
from crypto_news import get_crypto_news, search_crypto_news, get_trending_topics

# One-liner to get news
articles = get_crypto_news(10)

# One-liner to search
results = search_crypto_news("bitcoin etf")

# One-liner for trending
topics = get_trending_topics(5)
```

## Self-Hosted

```python
news = CryptoNews(base_url="https://your-deployment.vercel.app")
```

## No API Key Required!

This is a 100% free API. No authentication, no rate limits (fair use).
