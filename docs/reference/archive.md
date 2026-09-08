# Historical Archive

> Everything about the historical news archive: the 662,047-article dataset, the archive API and its query parameters, the Archive v2 collection pipeline, the JSONL directory layout, and the enriched article schema.
>
> Moved here from the project README. Back to the [reference index](https://github.com/nirholas/cryptocurrency.cv/blob/main/README.md).

## 📚 Historical Archive

Access **662,000+ crypto news articles** spanning 2017-2025 — the largest free crypto news dataset available!

| Metric | Value |
| ------ | ----- |
| **Total Articles** | 662,047 |
| **Date Range** | September 2017 - February 2025 |
| **Languages** | English + Chinese |
| **Unique Sources** | 100+ |
| **Top Tickers** | BTC (81k), ETH (50k), USDT (19k), SOL (16k), XRP (13k) |
| **Search Terms** | 79,512 indexed |

**Data Sources:**
- **CryptoPanic** — 346,031 articles from 200+ English sources
- **Odaily 星球日报** — 316,016 Chinese crypto news articles

```bash
# Query historical archive
curl "https://cryptocurrency.cv/api/archive?date=2024-01"

# Search by ticker
curl "https://cryptocurrency.cv/api/archive?ticker=BTC&limit=100"

# Full-text search
curl "https://cryptocurrency.cv/api/archive?q=bitcoin%20etf"
```

📁 Raw data is served month by month in JSONL form through the archive API (`/api/archive?date=YYYY-MM`).


---

## 📚 Historical Archive

Query historical news data stored in GitHub.

**Merged query parameters** (both parameter sets in this file are accepted by `/api/archive`):

| Parameter | Example | Description |
| --------- | ------- | ----------- |
| `date` | `date=2024-01` | Articles for one month (`YYYY-MM`) |
| `start_date` / `end_date` | `start_date=2025-01-01&end_date=2025-01-07` | Inclusive date range |
| `ticker` | `ticker=BTC` | Filter by extracted ticker |
| `q` | `q=bitcoin%20etf` | Full-text search |
| `sentiment` | `sentiment=positive` | positive / negative / neutral |
| `limit` | `limit=100` | Max articles returned |
| `stats` | `stats=true` | Archive statistics instead of articles |
| `index` | `index=true` | Archive index (months, sources, counts) |
| `trending` | `trending=true` | Trending tickers over the last 24h |
| `market` | `market=2026-01` | Market context (BTC/ETH price, Fear & Greed) for a month |

```bash
# Get archive statistics
curl "https://cryptocurrency.cv/api/archive?stats=true"

# Query by date range
curl "https://cryptocurrency.cv/api/archive?start_date=2025-01-01&end_date=2025-01-07"

# Search historical articles
curl "https://cryptocurrency.cv/api/archive?q=bitcoin&limit=50"

# Get archive index
curl "https://cryptocurrency.cv/api/archive?index=true"
```

Archive is automatically updated every 6 hours via GitHub Actions.


---

## 🗄️ Archive v2: The Definitive Crypto News Record

We're building the most comprehensive open historical archive of crypto news. Every headline. Every hour. Forever.

## What's in v2

| Feature               | Description                                      |
| --------------------- | ------------------------------------------------ |
| **Hourly collection** | Every hour, not every 6 hours                    |
| **Append-only**       | Never overwrite - every unique article preserved |
| **Deduplication**     | Content-addressed IDs prevent duplicates         |
| **Entity extraction** | Auto-extracted tickers ($BTC, $ETH, etc.)        |
| **Named entities**    | People, companies, protocols identified          |
| **Sentiment scoring** | Every headline scored positive/negative/neutral  |
| **Market context**    | BTC/ETH prices + Fear & Greed at capture time    |
| **Content hashing**   | SHA256 for integrity verification                |
| **Hourly snapshots**  | What was trending each hour                      |
| **Indexes**           | Fast lookups by source, ticker, date             |
| **JSONL format**      | Streamable, append-friendly, grep-able           |

## Archive API Endpoints

```bash
# Get enriched articles with all metadata
curl "https://cryptocurrency.cv/api/archive?limit=20"

# Filter by ticker
curl "https://cryptocurrency.cv/api/archive?ticker=BTC"

# Filter by sentiment
curl "https://cryptocurrency.cv/api/archive?sentiment=positive"

# Get archive statistics
curl "https://cryptocurrency.cv/api/archive?stats=true"

# Get trending tickers (last 24h)
curl "https://cryptocurrency.cv/api/archive?trending=true"

# Get market history for a month
curl "https://cryptocurrency.cv/api/archive?market=2026-01"
```

## Archive Directory Structure

```
archive/
    articles/           # JSONL files, one per month
      2026-01.jsonl     # All articles from January 2026
    snapshots/          # Hourly trending state
      2026/01/11/
        00.json         # What was trending at midnight
        01.json         # What was trending at 1am
        ...
    market/             # Price/sentiment history
      2026-01.jsonl     # Market data for January 2026
    indexes/            # Fast lookups
      by-source.json    # Article IDs grouped by source
      by-ticker.json    # Article IDs grouped by ticker
      by-date.json      # Article IDs grouped by date
    meta/
      schema.json       # Schema version and definition
      stats.json        # Running statistics
```

## Enriched Article Schema

```json
{
  "id": "a1b2c3d4e5f6g7h8",
  "schema_version": "2.0.0",
  "title": "BlackRock adds $900M BTC...",
  "link": "https://...",
  "canonical_link": "https://... (normalized)",
  "description": "...",
  "source": "CoinTelegraph",
  "source_key": "cointelegraph",
  "category": "bitcoin",
  "pub_date": "2026-01-08T18:05:00.000Z",
  "first_seen": "2026-01-08T18:10:00.000Z",
  "last_seen": "2026-01-08T23:05:00.000Z",
  "fetch_count": 5,
  "tickers": ["BTC"],
  "entities": {
    "people": ["Larry Fink"],
    "companies": ["BlackRock"],
    "protocols": ["Bitcoin"]
  },
  "tags": ["institutional", "price"],
  "sentiment": {
    "score": 0.65,
    "label": "positive",
    "confidence": 0.85
  },
  "market_context": {
    "btc_price": 94500,
    "eth_price": 3200,
    "fear_greed_index": 65
  },
  "content_hash": "h8g7f6e5d4c3b2a1",
  "meta": {
    "word_count": 23,
    "has_numbers": true,
    "is_breaking": false,
    "is_opinion": false
  }
}
```


---

## 📂 Archive Data Structure

The enhanced archive system captures comprehensive crypto intelligence:

```
archive/
├── articles/              # JSONL, append-only articles
│   └── 2026-01.jsonl     # ~50 new articles per hour
├── market/               # Full market snapshots
│   └── 2026-01.jsonl     # CoinGecko + DeFiLlama data
├── onchain/              # On-chain events
│   └── 2026-01.jsonl     # BTC stats, DEX volumes, bridges
├── social/               # Social signals
│   └── 2026-01.jsonl     # Reddit sentiment, trending
├── predictions/          # Prediction markets
│   └── 2026-01.jsonl     # Polymarket + Manifold odds
├── snapshots/            # Hourly trending snapshots
│   └── 2026/01/11/
│       └── 08.json       # Complete state at 08:00 UTC
├── analytics/            # Generated insights
│   ├── digest-2026-01-11.json
│   ├── narrative-momentum.json
│   └── coverage-patterns.json
├── exports/training/     # AI-ready exports
│   ├── instruction-tuning.jsonl
│   ├── qa-pairs.jsonl
│   ├── sentiment-dataset.jsonl
│   ├── embeddings-data.jsonl
│   └── ner-training.jsonl
├── indexes/              # Fast lookups
│   ├── by-source.json
│   ├── by-ticker.json
│   └── by-date.json
└── meta/
    ├── schema.json
    ├── stats.json
    └── source-stats.json # Reliability scores
```

### Per-Article Data

Each article is enriched with:

```json
{
  "id": "sha256:abc123...",
  "schema_version": "2.0.0",
  "title": "Bitcoin Surges Past $100K",
  "link": "https://...",
  "description": "...",
  "source": "CoinDesk",
  "source_key": "coindesk",
  "pub_date": "2026-01-11T10:00:00Z",
  "first_seen": "2026-01-11T10:05:00Z",
  "last_seen": "2026-01-11T18:05:00Z",
  "fetch_count": 8,
  "tickers": ["BTC", "ETH"],
  "categories": ["market", "bitcoin"],
  "sentiment": "bullish",
  "market_context": {
    "btc_price": 100500,
    "eth_price": 4200,
    "fear_greed": 75,
    "btc_dominance": 52.3
  }
}
```

### Hourly Snapshot Data

Each hour captures:

- **Articles**: Count, sentiment breakdown, top tickers, source distribution
- **Market**: Top 100 coins, DeFi TVL, yields, stablecoins, trending
- **On-Chain**: BTC network stats, DEX volumes, bridge activity
- **Social**: Reddit sentiment, active users, trending topics
- **Predictions**: Polymarket/Manifold crypto prediction odds
- **Clustering**: Story clusters, first-movers, coordinated releases

---

## Why This Matters

**Time is our moat.**

If we capture complete data now with proper structure, in 2 years we'll have something nobody can recreate. The compound value:

- **Year 1**: Interesting dataset
- **Year 3**: Valuable for research
- **Year 5**: Irreplaceable historical record
- **Year 10**: The definitive source, cited in papers, used by institutions

Every day we delay proper archiving is data lost forever.

