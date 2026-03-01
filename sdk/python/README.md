# Free Crypto News Python SDK

Production-ready Python client for the [Free Crypto News API](https://cryptocurrency.cv). No API key required.

## Installation

```bash
pip install crypto-news-client
```

For async support (uses `aiohttp`):

```bash
pip install crypto-news-client[async]
```

Or copy the `crypto_news/` package directly into your project — the sync client has **zero dependencies**.

## Quick Start

```python
from crypto_news import CryptoNewsClient

client = CryptoNewsClient()

# Get latest news
news = client.get_news(limit=10)
for article in news:
    print(f"{article['title']} — {article['source']}")

# Search
results = client.search("bitcoin etf", limit=5)

# Trending topics
trending = client.get_trending(limit=5)
for t in trending["trending"]:
    print(f"{t['topic']}: {t['count']} mentions ({t['sentiment']})")
```

## Async Client

```python
import asyncio
from crypto_news import AsyncCryptoNewsClient

async def main():
    async with AsyncCryptoNewsClient() as client:
        news = await client.get_news(limit=10)
        prices = await client.get_prices(coin="bitcoin")
        market = await client.get_market()
        print(news, prices, market)

asyncio.run(main())
```

## All Methods

Both `CryptoNewsClient` and `AsyncCryptoNewsClient` share the same API:

| Method | Description |
|--------|-------------|
| `get_news(limit, category, search)` | Get latest news, optionally filtered |
| `get_prices(coin)` | Cryptocurrency price data |
| `get_market()` | Market overview (cap, volume, dominance) |
| `get_fear_greed()` | Fear & Greed Index |
| `get_gas()` | Ethereum gas prices |
| `get_trending(limit, hours)` | Trending topics with sentiment |
| `search(query, limit)` | Search news by keywords |
| `get_sources()` | List all news sources |
| `get_breaking(limit)` | Breaking news (last 2 hours) |
| `get_defi(limit)` | DeFi-specific news |
| `get_bitcoin(limit)` | Bitcoin-specific news |
| `get_stats()` | API statistics |
| `get_health()` | API health status |
| `analyze(limit, topic, sentiment)` | Sentiment analysis |
| `get_archive(date, query, limit)` | Historical archive |
| `get_origins(query, category, limit)` | Find original sources |
| `get_portfolio(coins, limit, include_prices)` | Portfolio news with prices |
| `get_coin_sentiment(coins, ...)` | Per-coin sentiment with trade signals |

## Error Handling

```python
from crypto_news import (
    CryptoNewsClient,
    CryptoNewsError,
    APIError,
    RateLimitError,
    NetworkError,
)

client = CryptoNewsClient()

try:
    news = client.get_news()
except RateLimitError as e:
    print(f"Rate limited — retry after {e.retry_after}s")
except NetworkError as e:
    print(f"Network error: {e}")
except APIError as e:
    print(f"API error (HTTP {e.status_code}): {e}")
except CryptoNewsError as e:
    print(f"Unexpected error: {e}")
```

Exception hierarchy:

```
CryptoNewsError          ← base, catch-all
├── NetworkError         ← connection failures, timeouts
└── APIError             ← non-2xx HTTP responses
    └── RateLimitError   ← HTTP 429
```

## Coin Sentiment Analysis

```python
client = CryptoNewsClient()

# Analyse top 5 pairs
from crypto_news.client import COIN_PAIRS
pairs = dict(list(COIN_PAIRS.items())[:5])

report = client.get_coin_sentiment(
    coins=pairs,
    min_articles=5,
    min_confidence=20.0,
)

for pair, data in report.items():
    if data["tradeable"]:
        print(f"TRADE {pair}: {data['signal']}  conf={data['confidence']:.1f}")
    else:
        print(f"SKIP  {pair}: {data['reason']}")
```

## Configuration

```python
# Default — free public API
client = CryptoNewsClient()

# Custom base URL (self-hosted)
client = CryptoNewsClient(base_url="https://your-instance.com/api")

# Custom timeout
client = CryptoNewsClient(timeout=30.0)
```

## Running Tests

```bash
cd sdk/python
python -m pytest tests/ -v
```

## No API Key Required!

This is a 100% free API. No authentication, no rate limits (fair use).

## License

MIT — see repository root.
