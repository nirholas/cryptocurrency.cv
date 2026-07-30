# cryptocurrency.cv examples

Real-time crypto news aggregator with AI analysis, 12+ sources, sentiment tracking, and full market data. Works with Claude, ChatGPT, Discord, Telegram & more.

## Example 1

```bash
curl https://cryptocurrency.cv/api/news
```

## Example 2

```bash
# Query historical archive
curl "https://cryptocurrency.cv/api/archive?date=2024-01"

# Search by ticker
curl "https://cryptocurrency.cv/api/archive?ticker=BTC&limit=100"

# Full-text search
curl "https://cryptocurrency.cv/api/archive?q=bitcoin%20etf"
```

## Example 3

```bash
git checkout redesign/pro-news-ui
npm install && npm run dev
```

## Example 4

```bash
# Get latest news
curl "https://cryptocurrency.cv/api/news?limit=10"

# Get Bitcoin sentiment
curl "https://cryptocurrency.cv/api/ai/sentiment?asset=BTC"

# Search articles
curl "https://cryptocurrency.cv/api/search?q=ethereum%20upgrade"

# Get international news with translation
curl "https://cryptocurrency.cv/api/news/international?language=ko&translate=true"
```

## Example 5

```bash
npm install sharp
npm run pwa:icons
```

## Example 6

```bash
# Get institutional/VC research
curl "https://cryptocurrency.cv/api/news?category=institutional"

# Get on-chain analytics news
curl "https://cryptocurrency.cv/api/news?category=onchain"

# Get ETF and asset manager news
curl "https://cryptocurrency.cv/api/news?category=etf"

# Get macro economic analysis
curl "https://cryptocurrency.cv/api/news?category=macro"

# Get quantitative research
curl "https://cryptocurrency.cv/api/news?category=quant"

# List all available categories
curl "https://cryptocurrency.cv/api/news/categories"
```

## Example 7

```bash
# Get news in Spanish
curl "https://cryptocurrency.cv/api/news?lang=es"

# Get breaking news in Japanese
curl "https://cryptocurrency.cv/api/breaking?lang=ja"

# Get DeFi news in Arabic
curl "https://cryptocurrency.cv/api/defi?lang=ar"

# Get Bitcoin news in Chinese (Simplified)
curl "https://cryptocurrency.cv/api/bitcoin?lang=zh-CN"
```

## Example 8

```bash
# Backtest a sentiment-based strategy
curl -X POST "https://fcn.dev/api/research/backtest" \
  -H "Content-Type: application/json" \
  -d '{"strategy": "sentiment_momentum", "asset": "BTC", "period": "1y"}'
```


Every snippet above is taken from the [repository documentation](https://github.com/nirholas/cryptocurrency.cv#readme).
