# Scaling to 1M+ Users — Complete Runbook

> **free-crypto-news** scaling playbook for surpassing CoinGecko/DeFiLlama.
> Covers infrastructure, database migration, Kubernetes, multi-region, and performance optimization.

---

## Table of Contents

1. [Current Architecture Assessment](#current-architecture)
2. [Phase 1: Database Migration (Week 1-2)](#phase-1-database)
3. [Phase 2: Job Queue & Workers (Week 2-3)](#phase-2-workers)
4. [Phase 3: CDN & Edge Caching (Week 3-4)](#phase-3-cdn)
5. [Phase 4: Kubernetes Migration (Week 4-6)](#phase-4-kubernetes)
6. [Phase 5: Multi-Region Deployment (Week 6-8)](#phase-5-multi-region)
7. [Phase 6: Observability & Alerting (Week 8-9)](#phase-6-observability)
8. [Phase 7: Performance Optimization (Ongoing)](#phase-7-performance)
9. [Cost Projections](#cost-projections)
10. [Scaling Prompts](#scaling-prompts)

---

## Current Architecture Assessment {#current-architecture}

### What Works Well
- **Edge runtime**: ~82% of routes run on edge — excellent for global latency
- **Provider system**: Fallback chains with circuit breakers — resilient
- **163 RSS feeds + 77 international**: Wide coverage
- **Redis caching**: 3-tier cache (in-memory → Redis → NGINX)
- **Docker Compose**: NGINX load balancer with rate limiting

### Critical Gaps for 1M+ Users
| Gap | Impact | Priority |
|-----|--------|----------|
| No persistent database | Data loss on restart, no historical queries | P0 |
| No job queue | Cron-based polling, no retry/backpressure | P0 |
| Single-region | High latency for global users | P1 |
| In-memory RSS fetching | Single point of failure, memory pressure | P1 |
| No full-text search engine | Can't scale article search beyond cache | P1 |
| Per-instance memory cache | Cache inconsistency across replicas | P2 |
| No observability stack | Blind to performance regressions | P2 |

---

## Phase 1: Database Migration {#phase-1-database}

### Why
The entire system runs on in-memory cache + Redis. At 1M users:
- Redis at 512MB can't hold 662k+ articles + market data
- App restart = total cache loss
- No way to run historical analytics queries

### Target Stack
```
PostgreSQL 16 + TimescaleDB + pgvector
├── Articles table (with full-text search + vector embeddings)
├── Market data (hypertable, compressed after 7d)
├── DeFi TVL (hypertable)
├── On-chain metrics (hypertable)
├── Derivatives data (hypertable)
├── Social sentiment (hypertable)
├── Feed sources (admin)
├── API keys + rate limits
└── Jobs table (PostgreSQL-backed queue)
```

### Migration Steps

```bash
# 1. Provision PostgreSQL on your cloud provider
# Recommended: Neon (serverless), Supabase, or Railway Postgres
# Min specs: 4 vCPU, 16GB RAM, 100GB SSD, connection pooling

# 2. Install extensions
psql $DATABASE_URL -c "CREATE EXTENSION IF NOT EXISTS uuid-ossp;"
psql $DATABASE_URL -c "CREATE EXTENSION IF NOT EXISTS pg_trgm;"
psql $DATABASE_URL -c "CREATE EXTENSION IF NOT EXISTS vector;"
psql $DATABASE_URL -c "CREATE EXTENSION IF NOT EXISTS timescaledb;"

# 3. Run the schema from src/lib/scale/index.ts DATABASE_SCHEMA export

# 4. Backfill articles from archive/
# The archive has 662,000+ articles in JSON — bulk insert
node scripts/migrate-archive-to-postgres.js

# 5. Set environment variable
echo "DATABASE_URL=postgresql://user:pass@host:5432/cryptonews" >> .env

# 6. Update src/lib/crypto-news.ts to read from Postgres
# Keep Redis as L2 cache, Postgres as source of truth
```

### Connection Pooling
```
App → PgBouncer (connection pooler) → PostgreSQL
     └── Max 100 connections pooled
     └── Transaction mode for edge functions
     └── Statement-level for long-running queries
```

### Environment Variables Needed
```env
DATABASE_URL=postgresql://...
DATABASE_POOL_URL=postgresql://...(pooled connection)
PGBOUNCER_URL=postgresql://...:6432/...
REDIS_URL=redis://...
```

---

## Phase 2: Job Queue & Workers {#phase-2-workers}

### Why
Currently, RSS fetching happens on each request or via 7 Vercel cron jobs. At scale:
- Crons can't handle 163+ feeds every 5 minutes
- No retry logic for failed fetches
- No backpressure — all feeds attempted simultaneously
- Enrichment (AI sentiment, entity extraction) blocks the request

### Architecture

```
                          ┌─────────────────┐
                          │   Redis Queue    │
                          │   (BullMQ)       │
                          └────────┬────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              │                    │                    │
    ┌─────────▼──────┐  ┌────────▼────────┐  ┌───────▼────────┐
    │  RSS Workers   │  │ Enrichment      │  │ Market Data    │
    │  (5 concurrent)│  │ Workers (3)     │  │ Workers (2)    │
    └────────────────┘  └─────────────────┘  └────────────────┘
```

### Implementation

```bash
# Install BullMQ (production-grade Redis queue)
npm install bullmq

# Or use the in-memory queue from src/lib/scale/index.ts for development
```

### Worker Configuration

| Worker | Concurrency | Schedule | Rate Limit |
|--------|-------------|----------|------------|
| RSS Fetcher | 5 | Every 5 min | 50/min |
| Article Enricher | 3 | On article insert | 20/min |
| Market Data | 2 | Every 1 min | 30/min |
| Archiver | 1 | Every hour | N/A |
| Sentiment Analyzer | 2 | On new article | 10/min |
| Health Checker | 1 | Every 10 min | N/A |

---

## Phase 3: CDN & Edge Caching {#phase-3-cdn}

### Strategy

```
User → Cloudflare (CDN edge) → Vercel Edge → Redis → PostgreSQL
       └── 90% of reads served from edge cache
       └── Cache-Control headers already set on all routes
```

### Cloudflare Configuration

```yaml
# Cache rules for /api/* routes
# wrangler.toml or Cloudflare Dashboard

[[rules]]
  path = "/api/news*"
  cache_ttl = 300  # 5 min
  
[[rules]]
  path = "/api/market*"
  cache_ttl = 60   # 1 min
  
[[rules]]
  path = "/api/defi*"
  cache_ttl = 300  # 5 min
  
[[rules]]
  path = "/api/data-sources/derivatives*"
  cache_ttl = 15   # 15 sec
  
[[rules]]
  path = "/api/data-sources/social*"
  cache_ttl = 300  # 5 min

[[rules]]
  path = "/api/data-sources/onchain*"
  cache_ttl = 30   # 30 sec
```

### Cache Invalidation

```typescript
// Purge cache when new articles arrive
async function purgeEdgeCache(paths: string[]) {
  await fetch(`https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/purge_cache`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${CF_TOKEN}` },
    body: JSON.stringify({ files: paths.map(p => `https://api.cryptonews.example${p}`) }),
  });
}
```

### Expected Hit Rates

| Endpoint | Cache TTL | Expected Hit Rate |
|----------|-----------|-------------------|
| /api/news | 5 min | 95% |
| /api/market | 1 min | 85% |
| /api/defi | 5 min | 90% |
| /api/derivatives | 15 sec | 70% |
| /api/onchain/gas | 15 sec | 75% |
| /api/social/fear-greed | 5 min | 95% |

With 95% average cache hit rate at 1M users = ~50K req/day hitting origin instead of 1M.

---

## Phase 4: Kubernetes Migration {#phase-4-kubernetes}

### When to Move
- Docker Compose works up to ~100K users / 100 req/s
- Move to K8s when you need: auto-scaling, zero-downtime deploys, resource isolation

### Architecture

```yaml
# k8s-cluster.yaml (high-level)

Namespace: cryptonews-prod
│
├── Deployments:
│   ├── web (Next.js app) — 3-10 replicas, HPA
│   ├── worker-rss — 2-5 replicas
│   ├── worker-enrichment — 1-3 replicas
│   ├── worker-market — 1-2 replicas
│   └── ws-server — 2-4 replicas
│
├── StatefulSets:
│   ├── postgres-primary — 1 replica
│   ├── postgres-replica — 2 replicas (read)
│   └── redis-cluster — 3 replicas
│
├── Services:
│   ├── web (ClusterIP → Ingress)
│   ├── postgres-primary (ClusterIP)
│   ├── postgres-read (ClusterIP, round-robin)
│   ├── redis (ClusterIP)
│   └── ws-server (ClusterIP → Ingress)
│
├── Ingress:
│   └── NGINX Ingress → Cloudflare CDN
│       ├── api.cryptonews.example → web
│       └── ws.cryptonews.example → ws-server
│
├── HPA (Horizontal Pod Autoscaler):
│   ├── web: 3-10 replicas, target 70% CPU
│   ├── worker-rss: 2-5, based on queue depth
│   └── ws-server: 2-4, based on connections
│
└── CronJobs:
    ├── archive — hourly
    ├── digest — 6am daily
    └── cleanup — midnight daily
```

### Helm Chart (Key Values)

```yaml
# values.yaml
web:
  replicas: 3
  resources:
    requests: { cpu: 500m, memory: 512Mi }
    limits: { cpu: 2000m, memory: 2Gi }
  hpa:
    minReplicas: 3
    maxReplicas: 10
    targetCPU: 70

worker:
  rss:
    replicas: 2
    resources:
      requests: { cpu: 250m, memory: 256Mi }
  enrichment:
    replicas: 1
    resources:
      requests: { cpu: 500m, memory: 512Mi }

postgres:
  primary:
    resources:
      requests: { cpu: 2000m, memory: 8Gi }
    storage: 200Gi
  readReplicas: 2

redis:
  cluster:
    replicas: 3
    maxMemory: 2Gi

ingress:
  className: nginx
  annotations:
    nginx.ingress.kubernetes.io/rate-limit: "100"
    nginx.ingress.kubernetes.io/rate-limit-window: "1m"
```

---

## Phase 5: Multi-Region Deployment {#phase-5-multi-region}

### Target Regions

| Region | Provider | Purpose |
|--------|----------|---------|
| US East (Virginia) | Primary | Main origin, write path |
| US West (Oregon) | Secondary | Read replicas, failover |
| EU West (Frankfurt) | Edge | European users |
| Asia Pacific (Tokyo) | Edge | Asian users |

### Architecture

```
              Cloudflare (Global CDN + WAF)
                        │
            ┌───────────┼───────────┐
            │           │           │
     US East (Primary)  EU West   Asia Pacific
     ├── Next.js ×5    Next.js ×3  Next.js ×3
     ├── Workers ×5    Workers ×2  Workers ×2
     ├── PG Primary    PG Replica  PG Replica
     ├── Redis ×3      Redis ×2   Redis ×2
     └── WS Server ×3  WS ×2     WS ×2
```

### Database Replication

```
PostgreSQL Primary (US East)
├── Streaming Replication → Read Replica (US East)
├── Streaming Replication → Read Replica (EU West)
└── Streaming Replication → Read Replica (Asia Pacific)

Writes: Always go to primary
Reads: Routed to nearest replica by Cloudflare
```

---

## Phase 6: Observability & Alerting {#phase-6-observability}

### Stack

```
Metrics:    Prometheus + Grafana
Logging:    Loki (or Datadog)
Tracing:    OpenTelemetry → Jaeger
Alerting:   Grafana Alerting → Slack/PagerDuty
Uptime:     BetterUptime or UptimeRobot
```

### Key Metrics to Track

| Metric | Alert Threshold | Dashboard |
|--------|----------------|-----------|
| API response time (p95) | > 500ms | Grafana |
| Error rate | > 1% | Grafana |
| Cache hit rate | < 80% | Grafana |
| RSS fetch success rate | < 95% | Grafana |
| Queue depth | > 1000 | Grafana + Slack |
| Database connections | > 80% pool | PagerDuty |
| Memory usage | > 80% | PagerDuty |
| Disk usage | > 70% | PagerDuty |
| Data source health | Any 'down' | Slack |
| Article freshness | > 15 min stale | Slack |

### Custom Next.js metrics endpoint

```typescript
// Already exists: /api/health
// Add: /api/metrics (Prometheus format)
// Add: /api/data-sources?action=health
```

---

## Phase 7: Performance Optimization {#phase-7-performance}

### Quick Wins (Do First)

1. **Enable ISR on all static pages** — `revalidate` already set on most routes
2. **Add stale-while-revalidate to all API responses** — Already partially done
3. **Compress API responses** — NGINX gzip already configured
4. **Optimize JSON serialization** — Use `Response.json()` instead of `NextResponse.json()`

### Medium Effort

5. **Add Redis cluster** instead of single instance
6. **Implement request coalescing** — Deduplicate identical concurrent requests
7. **Add connection pooling** for all external API calls
8. **Precompute popular queries** — Top 100 endpoints warmed every minute

### High Effort (Big Impact)

9. **Add Elasticsearch/Meilisearch** for full-text article search
10. **Implement WebSocket pub/sub scaling** with Redis Streams
11. **Add read replicas** for database queries
12. **Implement edge-side includes (ESI)** for widget embedding

### Request Coalescing Pattern

```typescript
const inflightRequests = new Map<string, Promise<unknown>>();

async function coalesce<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const existing = inflightRequests.get(key);
  if (existing) return existing as Promise<T>;

  const promise = fn().finally(() => inflightRequests.delete(key));
  inflightRequests.set(key, promise);
  return promise;
}
```

---

## Cost Projections {#cost-projections}

### 100K Users/Month (Phase 1-2)

| Service | Monthly Cost |
|---------|-------------|
| Vercel Pro | $20 |
| Neon PostgreSQL (Launch) | $19 |
| Upstash Redis (Pro) | $10 |
| Cloudflare Pro | $20 |
| Domain + cert | $15/yr |
| **Total** | **~$70/mo** |

### 500K Users/Month (Phase 3-4)

| Service | Monthly Cost |
|---------|-------------|
| Vercel Enterprise or Self-hosted K8s | $200-500 |
| PostgreSQL (Neon Scale or self-hosted) | $50-150 |
| Redis Cluster | $30-80 |
| Cloudflare Business | $200 |
| Monitoring (Grafana Cloud) | $50 |
| **Total** | **~$530-980/mo** |

### 1M+ Users/Month (Phase 5-7)

| Service | Monthly Cost |
|---------|-------------|
| K8s Cluster (3 regions, managed) | $500-1500 |
| PostgreSQL HA + replicas | $200-500 |
| Redis Cluster (3 regions) | $100-300 |
| Cloudflare Enterprise | $500+ |
| Monitoring + logging | $100-300 |
| API keys (external data) | $200-500 |
| **Total** | **~$1,600-3,100/mo** |

---

## Scaling Prompts {#scaling-prompts}

### Prompt 1: Database Migration Script

```
You are a database engineer working on free-crypto-news, a Next.js crypto news aggregator
with 662,000+ articles stored in JSON archive files.

Task: Create a migration script that:
1. Reads all JSON files from archive/2021/ through archive/2025/
2. Inserts articles into PostgreSQL with the schema from src/lib/scale/index.ts
3. Generates vector embeddings for each article using OpenAI ada-002
4. Creates full-text search vectors
5. Handles duplicates gracefully
6. Runs in batches of 1000 with progress logging
7. Can resume from last successful batch

The DATABASE_URL is in environment variables. Use pg (node-postgres) library.
```

### Prompt 2: BullMQ Worker System

```
You are building a production job queue for free-crypto-news using BullMQ + Redis.

Create a worker system that:
1. Has separate queues for: rss-fetch, article-enrich, market-data, archive, sentiment
2. RSS worker fetches 163 feeds with 5 concurrent workers, respecting rate limits
3. Article enricher runs AI sentiment/entity extraction on new articles
4. Market data worker polls CoinGecko, Binance, DeFiLlama every minute
5. All workers have exponential backoff retry (3 attempts)
6. Workers expose queue depth and throughput metrics via logging
7. Uses Redis connection from REDIS_URL env var
8. Graceful shutdown on SIGTERM

The existing RSS sources are in src/lib/sources.ts. The enrichment functions are in
src/lib/entity-extractor.ts and src/lib/advanced-anomaly.ts.
```

### Prompt 3: Kubernetes Deployment

```
You are a DevOps engineer creating a Kubernetes deployment for free-crypto-news.

Create Helm chart with:
1. Web deployment (Next.js) — 3-10 replicas with HPA targeting 70% CPU
2. Worker deployments (rss, enrichment, market) — scaled by queue depth
3. WebSocket server — 2-4 replicas with sticky sessions
4. PostgreSQL StatefulSet with PgBouncer sidecar
5. Redis cluster (3 nodes)
6. NGINX Ingress with rate limiting (100 req/min per IP)
7. Network policies isolating web from workers
8. Resource quotas and limit ranges
9. ConfigMaps for environment variables
10. Secrets for API keys and database credentials
11. Prometheus ServiceMonitor for all deployments
12. PodDisruptionBudgets for zero-downtime updates

The Docker image is built from the existing Dockerfile. Include values.yaml for
staging and production environments.
```

### Prompt 4: Elasticsearch Integration

```
You are integrating Elasticsearch (or Meilisearch) into free-crypto-news for
full-text article search at scale.

Create:
1. Elasticsearch index mapping for articles with:
   - Title (boosted 3x), description (2x), content (1x), tags, categories
   - Date range filtering, source filtering, language filtering
   - Fuzzy matching with typo tolerance
   - Aggregations for faceted search (by source, category, date)
2. Indexing pipeline that syncs from PostgreSQL (CDC or polling)
3. Search API at /api/search/v2 with:
   - query, filters, pagination, sorting, highlighting
   - Autocomplete/suggest endpoint
   - "More like this" for related articles
4. Keep backward compatibility with existing /api/search endpoints

The current search is in src/lib/search.ts using in-memory filtering.
```

### Prompt 5: Multi-Region WebSocket Scaling

```
You are scaling the WebSocket server (ws-server.js) for multi-region deployment.

Current: Single WebSocket server with Redis pub/sub and leader election.

Build:
1. Redis Streams-based message bus for multi-region pub/sub
2. Client connection routing — connect to nearest region
3. Message fanout — article published in US East reaches all regions <1s
4. Connection state — track which clients subscribe to which topics
5. Graceful handoff — when a server restarts, clients reconnect to another
6. Backpressure — if a client is slow, buffer then disconnect
7. Metrics — connections per region, message throughput, latency p99

Target: 100K concurrent WebSocket connections across 3 regions.
```

### Prompt 6: API Gateway & Rate Limiting

```
You are building an API gateway layer for free-crypto-news to handle 1M+ users.

Create:
1. Tiered rate limiting (anonymous: 60/hr, free: 300/hr, pro: 3000/hr, enterprise: 30K/hr)
2. API key management — generate, rotate, revoke keys
3. Usage tracking — per-key request counts, popular endpoints
4. Request validation — input sanitization, size limits
5. Response compression — auto gzip/brotli
6. CORS configuration per tier
7. Webhook delivery for pro/enterprise (new article, price alert)
8. Gateway metrics available via logging

Currently using Upstash Redis for rate limiting in middleware.ts.
Enhance this to support API keys and tiers.
```

### Prompt 7: Data Pipeline Orchestration

```
You are building a data pipeline for free-crypto-news that ingests data from
35+ sources (see src/lib/data-sources/index.ts).

Create an orchestration layer that:
1. Schedules each data source based on its optimal refresh interval
2. Handles authentication for paid APIs (rotate keys if rate limited)
3. Normalizes all data into a common schema before storage
4. Detect data quality issues (stale data, outliers, missing fields)
5. Fan out to subscribers (WebSocket, webhooks, cache invalidation)
6. Maintain a data freshness dashboard
7. Auto-disable sources that have been failing for >1 hour
8. Generate a "data coverage" report — what % of the crypto market we cover

The data sources are defined in src/lib/data-sources/index.ts with
adapters in src/lib/data-sources/defi.ts, onchain.ts, derivatives.ts, social.ts.
```

### Prompt 8: Performance Load Testing

```
You are a performance engineer preparing free-crypto-news for 1M+ users.

Create a comprehensive load test suite using k6 (or Artillery):
1. Baseline test — 100 concurrent users, 5 min
2. Stress test — ramp to 1000 users over 10 min
3. Spike test — sudden jump to 5000 users
4. Endurance test — 500 users for 1 hour
5. Test scenarios:
   - GET /api/news (most popular)
   - GET /api/market (real-time)
   - GET /api/defi/summary
   - GET /api/data-sources/derivatives?symbol=BTC
   - GET /api/search?q=bitcoin
   - WebSocket connection + subscribe
6. Report: p50, p95, p99 latencies, error rates, throughput

The API is at https://localhost:3000 (dev) or your production URL.
Export results as HTML report.
```

---

## API Keys Needed for Full Coverage

Sign up for these to unlock the complete data source registry:

| Service | Tier | URL | Priority |
|---------|------|-----|----------|
| CoinMarketCap | Free (Basic) | https://coinmarketcap.com/api/ | P0 |
| CoinGecko | Demo/Free | https://www.coingecko.com/en/api | Already configured |
| Etherscan | Free | https://etherscan.io/apis | P0 |
| CryptoCompare | Free | https://min-api.cryptocompare.com/ | P1 |
| Coinglass | Free | https://coinglass.com/pricing | P1 |
| LunarCrush | Free V4 | https://lunarcrush.com/developers | P1 |
| Glassnode | Free | https://studio.glassnode.com/settings/api | P1 |
| Dune Analytics | Free | https://dune.com/settings/api | P2 |
| Messari | Free | https://messari.io/api | P2 |
| Arkham Intelligence | Paid | https://platform.arkhamintelligence.com/ | P3 |
| Token Terminal | Paid | https://tokenterminal.com/pricing | P3 |
| BaseScan | Free | https://basescan.org/apis | P2 |
| Arbiscan | Free | https://arbiscan.io/apis | P2 |
| PolygonScan | Free | https://polygonscan.com/apis | P2 |
| Solscan | Free | https://pro-api.solscan.io/ | P2 |
| Reservoir | Free | https://reservoir.tools/ | P2 |
| SimpleHash | Free | https://simplehash.com/ | P3 |
| Tally | Free | https://docs.tally.xyz/ | P3 |
| Defined.fi | Free | https://docs.defined.fi/ | P3 |

---

## Quick Start Checklist

- [ ] Set up PostgreSQL (Neon/Supabase recommended)
- [ ] Run database schema migration
- [ ] Backfill articles from archive/
- [ ] Sign up for P0 API keys (CoinMarketCap, Etherscan)
- [ ] Configure Cloudflare CDN
- [ ] Set up Redis cluster (Upstash recommended)
- [ ] Enable all data source adapters in .env
- [ ] Run load test baseline
- [ ] Set up monitoring (Grafana Cloud free tier)
- [ ] Deploy to production with health checks

---

*Last updated: 2025 — Generated by the free-crypto-news scaling agent*
