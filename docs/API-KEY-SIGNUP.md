# API Key Signup Guide

> Complete guide to signing up for all external API keys used by free-crypto-news.
> Organized by priority — start with HIGH priority (free, most value) first.

## Quick Reference

| Provider | Category | Free Tier | Priority | Time to Setup |
|----------|----------|-----------|----------|---------------|
| CoinGecko Demo | Market Prices | 10K calls/mo | HIGH | 2 min |
| Etherscan | Gas + On-chain | 5 calls/sec | HIGH | 2 min |
| CoinMarketCap | Market Prices | 10K calls/mo | HIGH | 2 min |
| CryptoPanic | News + Social | 60 req/min | HIGH | 1 min |
| Whale Alert | Whale Tracking | 10 req/min | HIGH | 3 min |
| LunarCrush | Social Metrics | 10 req/min | HIGH | 3 min |
| Neon Postgres | Database | 0.5 GB free | HIGH | 5 min |
| Upstash Redis | Cache + Rate Limit | 10K cmd/day | HIGH | 3 min |
| NewsData.io | News API | 200 credits/day | MEDIUM | 2 min |
| CoinStats | Fear & Greed | 30 req/min | MEDIUM | 3 min |
| Blocknative | Gas Mempool | 30 req/min | MEDIUM | 5 min |
| Santiment | Social Analytics | 10 req/min | MEDIUM | 3 min |
| CoinGlass | Derivatives | 30 req/min | MEDIUM | 3 min |
| The Graph | DeFi Subgraphs | 100K queries/mo | MEDIUM | 5 min |
| Token Terminal | DeFi Revenue | 5 req/min | MEDIUM | 3 min |
| CryptoCompare | OHLCV | 100K calls/mo | MEDIUM | 2 min |
| Inngest | Job Queue | 25K events/mo | MEDIUM | 5 min |
| Typesense Cloud | Search | 1M docs free | LOW | 5 min |
| Sentry | Error Tracking | 5K events/mo | LOW | 5 min |

---

## HIGH Priority (Start Here)

### 1. CoinGecko Demo API Key
**What it powers:** Market prices, coin metadata, market cap, volume  
**Free tier:** 10,000 calls/month (Demo plan)  
**Signup:**
1. Go to https://www.coingecko.com/en/api
2. Click "Get Your API Key" → Sign up for Demo plan
3. Copy your API key

**Environment variable:**
```bash
COINGECKO_API_KEY=CG-xxxxxxxxxxxxxxxxxxxxxxxx
```

### 2. Etherscan API Key
**What it powers:** Gas fees, on-chain data, token transfers  
**Free tier:** 5 calls/second, 100,000 calls/day  
**Signup:**
1. Go to https://etherscan.io/register
2. Create account → verify email
3. Go to https://etherscan.io/myapikey → "Add" new key

**Environment variable:**
```bash
ETHERSCAN_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 3. CoinMarketCap API Key
**What it powers:** Market prices (alternative to CoinGecko)  
**Free tier:** 10,000 calls/month  
**Signup:**
1. Go to https://coinmarketcap.com/api/
2. Click "Get Your API Key Now" → Basic plan (free)
3. Copy API key from dashboard

**Environment variable:**
```bash
COINMARKETCAP_API_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

### 4. CryptoPanic API Key
**What it powers:** News aggregation, social sentiment  
**Free tier:** 60 requests/minute (basic access without key)  
**Pro tier:** 120 requests/minute with auth token  
**Signup:**
1. Go to https://cryptopanic.com/developers/api/
2. Sign up → verify email
3. Get auth token from dashboard

**Environment variable:**
```bash
CRYPTOPANIC_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 5. Whale Alert API Key
**What it powers:** Large transaction tracking ($500K+)  
**Free tier:** 10 requests/minute  
**Signup:**
1. Go to https://whale-alert.io/
2. Click "API" → sign up for free plan
3. Get API key from dashboard

**Environment variable:**
```bash
WHALE_ALERT_API_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

### 6. LunarCrush API Key
**What it powers:** Social metrics, Galaxy Score, AltRank  
**Free tier:** 10 requests/minute  
**Signup:**
1. Go to https://lunarcrush.com/developers/api
2. Create free account
3. Generate API key (v4 Bearer token)

**Environment variable:**
```bash
LUNARCRUSH_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 7. Neon Postgres (Database)
**What it powers:** Article storage, price history, social metrics, derivatives snapshots  
**Free tier:** 0.5 GB storage, 190 compute hours/month  
**Signup:**
1. Go to https://neon.tech/
2. Sign up with GitHub
3. Create a new project (choose nearest region)
4. Copy the connection string

**Environment variable:**
```bash
DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```

### 8. Upstash Redis
**What it powers:** Distributed cache, rate limiting, WebSocket pub/sub  
**Free tier:** 10,000 commands/day, 256 MB  
**Signup:**
1. Go to https://upstash.com/
2. Sign up → create Redis database
3. Copy REST URL and token

**Environment variables:**
```bash
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## MEDIUM Priority

### 9. NewsData.io API Key
**What it powers:** Global crypto news from 75+ countries  
**Free tier:** 200 credits/day  
**Signup:**
1. Go to https://newsdata.io/
2. Sign up → get API key
3. Enable "Crypto" category

**Environment variable:**
```bash
NEWSDATA_API_KEY=pub_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 10. CoinStats API Key
**What it powers:** Fear & Greed Index (secondary)  
**Free tier:** 30 requests/minute  
**Signup:**
1. Go to https://coinstats.app/
2. Sign up → Developer section
3. Generate API key

**Environment variable:**
```bash
COINSTATS_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 11. Blocknative API Key
**What it powers:** Mempool-based gas estimation  
**Free tier:** 30 requests/minute  
**Signup:**
1. Go to https://www.blocknative.com/
2. Sign up → "Gas Platform" → free plan
3. Get API key from dashboard

**Environment variable:**
```bash
BLOCKNATIVE_API_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

### 12. Santiment API Key
**What it powers:** On-chain + social analytics with dev activity  
**Free tier:** 10 requests/minute (basic metrics)  
**Signup:**
1. Go to https://app.santiment.net/
2. Sign up → go to Account → API Keys
3. Generate new API key

**Environment variable:**
```bash
SANTIMENT_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 13. CoinGlass API Key
**What it powers:** Aggregated derivatives data (10+ exchanges)  
**Free tier:** 30 requests/minute  
**Signup:**
1. Go to https://www.coinglass.com/
2. Sign up → API section
3. Generate secret key

**Environment variable:**
```bash
COINGLASS_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 14. The Graph API Key
**What it powers:** DeFi subgraph data (Uniswap, Aave)  
**Free tier:** 100,000 queries/month  
**Signup:**
1. Go to https://thegraph.com/studio/
2. Sign up with wallet or email
3. Create API key in Subgraph Studio

**Environment variable:**
```bash
THEGRAPH_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 15. Token Terminal API Key
**What it powers:** DeFi protocol revenue & fundamentals  
**Free tier:** 5 requests/minute (limited data)  
**Signup:**
1. Go to https://tokenterminal.com/
2. Sign up → Developer section
3. Generate API key

**Environment variable:**
```bash
TOKENTERMINAL_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 16. CryptoCompare API Key
**What it powers:** OHLCV historical data (7,000+ coins)  
**Free tier:** 100,000 calls/month  
**Signup:**
1. Go to https://min-api.cryptocompare.com/
2. Sign up → generate API key

**Environment variable:**
```bash
CRYPTOCOMPARE_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 17. Inngest
**What it powers:** Background job queue (reliable, retryable)  
**Free tier:** 25,000 events/month  
**Signup:**
1. Go to https://www.inngest.com/
2. Sign up with GitHub
3. Create new app → copy keys

**Environment variables:**
```bash
INNGEST_EVENT_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
INNGEST_SIGNING_KEY=signkey-xxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## LOW Priority

### 18. Typesense Cloud
**What it powers:** Full-text article search  
**Free tier:** 1M documents  
**Signup:**
1. Go to https://cloud.typesense.org/
2. Sign up → create cluster
3. Copy API key and host

**Environment variables:**
```bash
TYPESENSE_HOST=xxx.a1.typesense.net
TYPESENSE_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 19. Sentry
**What it powers:** Error tracking, performance monitoring  
**Free tier:** 5K events/month  
**Signup:**
1. Go to https://sentry.io/
2. Sign up → create Next.js project
3. Copy DSN

**Environment variable:**
```bash
SENTRY_DSN=https://xxx@oxxxxxx.ingest.sentry.io/xxxxxxx
NEXT_PUBLIC_SENTRY_DSN=https://xxx@oxxxxxx.ingest.sentry.io/xxxxxxx
```

---

## Quick Setup Script

After signing up, add all keys to your `.env.local`:

```bash
# Copy the template
cp .env.example .env.local

# Then fill in your keys:
# HIGH priority
COINGECKO_API_KEY=
ETHERSCAN_API_KEY=
COINMARKETCAP_API_KEY=
CRYPTOPANIC_API_KEY=
WHALE_ALERT_API_KEY=
LUNARCRUSH_API_KEY=
DATABASE_URL=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# MEDIUM priority
NEWSDATA_API_KEY=
COINSTATS_API_KEY=
BLOCKNATIVE_API_KEY=
SANTIMENT_API_KEY=
COINGLASS_API_KEY=
THEGRAPH_API_KEY=
TOKENTERMINAL_API_KEY=
CRYPTOCOMPARE_API_KEY=
INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=

# LOW priority
TYPESENSE_HOST=
TYPESENSE_API_KEY=
SENTRY_DSN=
```

## Graceful Degradation

The app works without any API keys — all adapters handle missing keys gracefully:
- Adapters with missing keys are skipped in the provider chain
- The chain falls back to the next available adapter
- Free endpoints (Binance, DefiLlama, Hyperliquid, DexScreener, Alternative.me) work without keys
- RSS feeds work without any API keys

Start with the free-no-key providers, then add keys to unlock more data sources over time.
