---
name: scale-to-million
description: Comprehensive scaling checklist and action plan to prepare free-crypto-news for 1M+ concurrent users. Use when planning infrastructure upgrades, load testing, or pre-launch scaling sprints. Covers caching, databases, queues, CDN, horizontal scaling, and observability.
license: MIT
metadata:
  category: infrastructure
  difficulty: advanced
  author: free-crypto-news
  tags: [scaling, infrastructure, performance, caching, database, cdn, load-testing, 1m-users]
---

# Scale to 1M+ Users

## When to use this skill

Use when:
- Preparing for a major traffic event (viral post, exchange listing, market crash)
- Planning infrastructure upgrades for sustained growth
- Running pre-launch load testing
- Benchmarking current system against target concurrent users
- Comparing architecture against CoinGecko/DefiLlama scale

## Current Architecture Baseline

| Component | Current | Target (1M) |
|-----------|---------|-------------|
| Edge Runtime coverage | 82% | 95% |
| Cache hit rate | Unknown | 90%+ |
| API response time (p50) | ~200ms | <100ms |
| API response time (p99) | ~2s | <500ms |
| Concurrent WebSocket connections | ~100 | 50,000+ |
| RSS sources | 130+ | 200+ |
| Data provider chains | 4 categories | 8+ categories |
| Background job processing | Vercel cron only | Dedicated queue |
| Database | Redis/KV + static JSON | PostgreSQL + Redis |
| CDN cache | Basic | Multi-tier |

## Phase 1: Quick Wins (1 week → handles 100K users)

### 1.1 Enable All Caching Layers

```bash
# Required environment variables
UPSTASH_REDIS_REST_URL=your_url
UPSTASH_REDIS_REST_TOKEN=your_token
VERCEL_KV_URL=your_url
VERCEL_KV_REST_API_TOKEN=your_token
```

- Verify distributed cache is active (not in-memory fallback)
- Set cache TTLs: news=2min, prices=30s, AI=5min, static=1hr
- Enable stale-while-revalidate for all API routes
- Enable predictive cache warming for top 20 coins
- Verify response headers show `X-Cache: HIT` on repeated requests

### 1.2 Rate Limiting

- Activate Upstash rate limiting in middleware.ts
- Configure tiered limits:
  - Anonymous: 60 req/min
  - Free (registered): 200 req/min
  - Pro: 1,000 req/min
  - Enterprise: 10,000 req/min
- Set up rate limit bypass for internal services
- Add exponential backoff hints in 429 responses

### 1.3 Edge Runtime Audit

- Move remaining Node.js routes to Edge Runtime where possible
- Target: 95% of routes on Edge
- Exceptions: routes requiring Node.js-only libraries (crypto, fs)
- Verify Cold Start < 50ms on all Edge routes  

### 1.4 Static Generation

- Pre-render top 100 coin pages at build time
- ISR (Incremental Static Regeneration) for all coin pages: revalidate=60s
- Static JSON for archive pages (already done)
- Generate sitemap.xml at build time

## Phase 2: Database & Queue (2 weeks → handles 500K users)

### 2.1 PostgreSQL (via Neon or Supabase)

```env
DATABASE_URL=postgresql://...
```

Add PostgreSQL for:
- Article metadata & full-text search
- User accounts, API keys, subscriptions
- Rate limit state (more durable than Redis alone)
- Analytics / usage tracking
- Article deduplication across 200+ RSS sources

Schema priorities:
1. `articles` — id, title, url, source, category, published_at, content_hash
2. `api_keys` — key, tier, rate_limit, created_at, last_used
3. `subscriptions` — user_id, plan, expires_at
4. `usage_logs` — api_key, endpoint, timestamp, response_time

### 2.2 Job Queue (Inngest or Trigger.dev)

Replace Vercel cron with a proper queue for:
- RSS feed polling (every 1-5 min per source, staggered)
- Article enrichment (AI classification, entity extraction)
- Archive generation (daily snapshots)
- Email digest delivery
- Webhook delivery (retry with exponential backoff)
- Market snapshot recording

### 2.3 Search (Typesense or Meilisearch)

- Index all articles with full-text search
- Faceted search by source, category, coin, date
- Typo-tolerant search
- < 50ms search latency
- Self-hosted Typesense on Railway or Fly.io

## Phase 3: Horizontal Scaling (2 weeks → handles 1M+ users)

### 3.1 Multi-Region Deployment

```yaml
# docker-compose.scale.yml already supports this
# Scale to 4-8 replicas:
docker compose -f docker-compose.scale.yml up -d --scale app=8
```

- Deploy to 3+ regions (US-East, EU-West, Asia-Pacific)
- Use Vercel Edge Network or Cloudflare for global distribution
- Region-aware routing: users hit nearest PoP
- Redis replication across regions (Upstash Global)

### 3.2 WebSocket Scaling

Current: single-process with optional Redis Pub/Sub

Target architecture:
- Dedicated WebSocket service (separate from Next.js)
- Redis Pub/Sub for cross-instance message broadcasting
- Leader election for feed polling (already implemented)
- Connection limits: 10,000 per instance × 5 instances = 50K concurrent
- Heartbeat interval: 30s
- Consider Ably/Pusher for > 100K concurrent connections

### 3.3 CDN & Edge Caching

```nginx
# Already configured in nginx.conf
proxy_cache_valid 200 10m;
proxy_cache_use_stale error timeout updating http_500 http_502 http_503 http_504;
proxy_cache_lock on;
```

Additions:
- Cloudflare or Fastly CDN in front of origin
- Cache API responses at edge (news: 2min, prices: 15s)
- Purge cache on new article publish via webhook
- Serve stale on origin failure (up to 1hr)
- Target: 95% cache hit rate

### 3.4 Read Replicas

- PostgreSQL read replicas for search queries
- Redis read replicas for cache reads
- Write to primary, read from nearest replica
- Eventual consistency acceptable for news (< 5s lag)

## Phase 4: Observability & Reliability (ongoing)

### 4.1 Monitoring

- Sentry for error tracking (SENTRY_DSN configured)
- Pino structured logging → Grafana Loki
- Prometheus metrics for:
  - Request rate, latency, error rate (RED metrics)
  - Cache hit/miss ratio
  - Provider health (circuit breaker states)
  - RSS polling success/failure per source
  - WebSocket connection count
  - Queue depth & processing time
- Alert on: p99 > 500ms, error rate > 1%, cache hit < 80%

### 4.2 Load Testing

```bash
# K6 load test for 1M user simulation
# Install: brew install grafana/tap/k6
k6 run --vus 1000 --duration 5m scripts/load-test.js
```

Test scenarios:
1. **Smoke test**: 10 VUs, 1 min — baseline
2. **Load test**: 100 VUs, 5 min — normal traffic
3. **Stress test**: 1,000 VUs, 5 min — peak traffic
4. **Spike test**: 0 → 5,000 VUs in 10s — viral event
5. **Soak test**: 200 VUs, 2 hr — sustained load

Key endpoints to test:
- `GET /api/news` (most popular)
- `GET /api/prices` (highest frequency)
- `GET /api/search?q=bitcoin` (most expensive)
- `WebSocket /ws` (connection lifecycle)
- `GET /api/rss` (feed readers)

### 4.3 Chaos Engineering

- Random provider failure injection (already built: chaos-engineering.ts)
- Redis connection failure simulation
- Simulate slow upstream APIs (artificial 5s delay)
- Network partition between app and database
- Verify graceful degradation: stale cache served, no 500s

### 4.4 Incident Response

- Runbook for common failures (Redis down, RSS source blocked, rate limited)
- Automatic failover: circuit breakers on all providers
- Status page (Upptime or Instatus)
- PagerDuty/Opsgenie for on-call alerts

## Data Source Scaling Targets

| Category | Current Sources | Target | New Sources to Add |
|----------|----------------|--------|-------------------|
| News RSS | 130+ English, 75 intl | 250+ | Decrypt newsletters, Mirror.xyz, Paragraph |
| Market Price | 6 (CoinGecko, CoinCap, Binance, CMC, CoinPaprika, CryptoCompare) | 8+ | Kraken, KuCoin |
| DeFi TVL | 1 (DefiLlama) | 3+ | DeFi Pulse, L2Beat API |
| Funding Rates | 3 (Binance, Bybit, OKX) | 5+ | Deribit, Hyperliquid |
| On-Chain | 2 (Blockchain.info, Etherscan) + new Mempool.space | 5+ | Glassnode API, Santiment |
| Gas Fees | 3 (Etherscan, eth_feeHistory, Owlracle) | 3+ | ✅ Done |
| DEX Data | 0 → 2 (DexScreener, GeckoTerminal) | 3+ | 1inch API |
| Fear & Greed | 0 → 2 (Alternative.me, CoinStats) | 2 | ✅ Done |
| Whale Alerts | 0 → 1 (Whale Alert) | 2+ | Arkham Intelligence |
| Social Metrics | 0 | 2+ | LunarCrush, Santiment |

## API Keys to Sign Up For

| Service | Free Tier | Sign Up URL | Priority |
|---------|-----------|-------------|----------|
| CoinGecko Demo | 30 → 500 req/min | https://www.coingecko.com/en/api/pricing | HIGH |
| Etherscan | 5 req/s | https://etherscan.io/apis | HIGH |
| CoinMarketCap | 10K req/mo | https://coinmarketcap.com/api/ | HIGH |
| Whale Alert | 10 req/min | https://whale-alert.io/signup | HIGH |
| CoinStats | 500 req/mo | https://coinstats.app/api | MEDIUM |
| Neon (PostgreSQL) | 500MB free | https://neon.tech | HIGH |
| Upstash Redis | 10K cmd/day | https://upstash.com | HIGH |
| Typesense Cloud | 1M docs free | https://cloud.typesense.org | MEDIUM |
| Sentry | 5K events/mo | https://sentry.io | HIGH |
| Inngest | 25K events/mo | https://www.inngest.com | MEDIUM |
| LunarCrush | 300 req/day | https://lunarcrush.com/developers | MEDIUM |
| Arkham Intelligence | Research tier | https://platform.arkhamintelligence.com | LOW |

## Competition Benchmark

### vs CoinGecko
- CoinGecko: 13,000+ coins, 800+ exchanges, 100M+ monthly visits
- Our advantages: open-source, no API key required, 130+ news sources, AI analysis, x402 micropayments
- Their moat: coin listing depth, historical data completeness

### vs DefiLlama
- DefiLlama: TVL tracking, yields, DEX aggregator, NFT data
- Our advantages: news aggregation, AI commentary, multi-source consensus, podcast
- Their moat: DeFi protocol coverage depth, community contributions

### Key differentiators to double down on:
1. **Real-time AI analysis** — no competitor offers live AI commentary
2. **130+ RSS sources** — broadest news coverage, no competitor aggregates this many
3. **Free & open source** — lower barrier than CoinGecko Pro / CMC API
4. **Multi-language** — 40+ locales, most competitors are English-only
5. **x402 micropayments** — novel monetization without API keys

## Notes for Agent Use

- Run this skill before any major deployment or scaling decision
- Use the provider health check (`registry.report()`) to verify all data sources
- The docker-compose.scale.yml is production-ready for 4-8 replicas
- Always load test before claiming a capacity number
- WebSocket scaling is the biggest bottleneck — address early
