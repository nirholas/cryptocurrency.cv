---
name: scale-to-1m
description: Step-by-step prompts to prepare free-crypto-news for 1M+ concurrent users. Covers infrastructure, caching, database, job queues, WebSocket scaling, observability, and load testing. Execute these prompts sequentially with an AI coding agent.
license: MIT
metadata:
  category: infrastructure
  difficulty: advanced
  author: free-crypto-news
  tags: [scaling, infrastructure, redis, database, caching, load-testing, websocket, observability]
---

# Scale to 1M+ Users — Prompt Playbook

> **Goal**: Transform free-crypto-news from a single-instance Vercel app into a horizontally-scaled, multi-region platform capable of serving 1M+ concurrent users — rivaling CoinGecko and DefiLlama.

## Current State (Feb 2026)

- 82% Edge Runtime routes on Vercel
- Redis (Upstash) for distributed caching + rate limiting
- Nginx load balancer with 2–3 app replicas in Docker
- No persistent database — static JSON archive + Redis cache
- WebSocket server is single-instance in-memory
- Cron jobs via Vercel (no dedicated job queue)
- Provider framework has circuit breakers, anomaly detection, health monitoring — but only `market-price` category is wired through it

## Prompt Sequence

Execute these prompts in order with your AI coding agent. Each builds on the previous.

---

### Prompt 1 — PostgreSQL + Drizzle ORM

```
Add a PostgreSQL database to free-crypto-news using Drizzle ORM.

Requirements:
1. Add drizzle-orm, drizzle-kit, @neondatabase/serverless (for Neon Postgres serverless driver) as dependencies
2. Create src/lib/db/schema.ts with these tables:
   - articles (id, slug, title, summary, url, source, category, coin_tags[], published_at, fetched_at, embedding vector(1536), language, sentiment_score)
   - prices_snapshot (id, coin_id, symbol, price_usd, market_cap, volume_24h, change_24h, timestamp)
   - provider_health (id, provider_name, chain_name, success_rate, avg_latency_ms, circuit_state, recorded_at)
   - api_usage (id, api_key, endpoint, method, status_code, latency_ms, timestamp, ip_hash)
   - users (id, email, api_key, tier, created_at, last_active_at)
   - alerts (id, user_id, type, config jsonb, last_triggered_at, created_at)
3. Create src/lib/db/index.ts that exports a drizzle client using @neondatabase/serverless with DATABASE_URL env var
4. Create drizzle.config.ts at project root
5. Add "db:generate", "db:migrate", "db:push", "db:studio" scripts to package.json
6. Create src/lib/db/queries/ with reusable query functions for articles (insert, search, latest) and prices (upsert snapshot, get latest)
7. Add proper indexes: articles(published_at DESC), articles(slug UNIQUE), prices_snapshot(coin_id, timestamp DESC), api_usage(timestamp DESC, endpoint)
8. Use connection pooling via @neondatabase/serverless HTTP mode for Edge Runtime compatibility

This is for production scale — design schema for millions of rows.
```

---

### Prompt 2 — Background Job Queue with Inngest

```
Add Inngest as the background job queue for free-crypto-news.

Requirements:
1. Install inngest package
2. Create src/lib/inngest/client.ts — Inngest client with id "free-crypto-news"
3. Create src/app/api/inngest/route.ts — the Inngest serve endpoint
4. Migrate these existing cron jobs to Inngest functions:
   - cron/archive → inngest function "archive/news.archive" (every 5 min)
   - cron/digest → "digest/daily.generate" (daily at 06:00 UTC)
   - cron/x-sentiment → "sentiment/x.analyze" (every 15 min)
   - cron/predictions → "predictions/daily.score" (daily at 00:00 UTC)
   - cron/tag-scores → "tags/scores.update" (every hour)
   - cron/enrich-articles → "articles/enrich.batch" (every 10 min)
5. Add NEW job functions:
   - "prices/snapshot.capture" — snapshot top 100 coin prices to DB every 30s
   - "providers/health.record" — record provider health metrics to DB every minute
   - "alerts/check.all" — check all user alerts against latest data every minute
   - "cache/warm.predictive" — run predictive cache warming every 2 min
   - "analytics/usage.aggregate" — aggregate API usage stats hourly
6. Each function should have proper retries (3x with backoff), idempotency keys, and error reporting
7. Add INNGEST_EVENT_KEY and INNGEST_SIGNING_KEY to env vars documentation
8. Keep existing Vercel cron routes as fallback (check if Inngest is configured, otherwise use cron)
```

---

### Prompt 3 — Redis Pub/Sub for WebSocket Scaling

```
Upgrade the WebSocket server (ws-server.js) to support horizontal scaling via Redis Pub/Sub.

Requirements:
1. Refactor ws-server.js to TypeScript at src/lib/ws/server.ts
2. Add ioredis as a dependency
3. Implement Redis Pub/Sub message bus:
   - When a client subscribes to a channel (e.g., "prices:bitcoin", "news:breaking"), the server subscribes to the corresponding Redis channel
   - When new data arrives (from any server instance), publish to Redis → all instances broadcast to their connected clients
   - Track subscriptions per client with a Map<WebSocket, Set<string>>
4. Add channels:
   - "prices:{coinId}" — real-time price updates
   - "news:latest" — new articles as they're fetched
   - "news:breaking" — breaking news only
   - "alerts:{userId}" — user-specific alerts
   - "market:global" — global market metrics
   - "sentiment:live" — live sentiment changes
5. Add heartbeat/ping-pong (every 30s) to detect dead connections
6. Add connection limit per IP (100) and total connection limit (50,000 per instance)
7. Add graceful shutdown: drain connections on SIGTERM
8. Update docker-compose.scale.yml to run 4 WebSocket replicas all sharing the same Redis
9. Add metrics: connections_total, messages_sent_total, subscriptions_active via /ws/stats endpoint
```

---

### Prompt 4 — CDN + Edge Caching Strategy

```
Implement a comprehensive CDN and edge caching strategy for free-crypto-news.

Requirements:
1. Create src/lib/cache/cdn-headers.ts with a helper function setCacheHeaders(res, preset) that sets:
   - Cache-Control with s-maxage (CDN) and max-age (browser) + stale-while-revalidate + stale-if-error
   - CDN-Cache-Control (Cloudflare/Vercel specific)
   - Surrogate-Key headers for tag-based purging
   - Vary: Accept-Encoding, Accept-Language
2. Define presets matching data freshness needs:
   - REALTIME (prices, orderbook): s-maxage=5, max-age=0, swr=10
   - FAST (news, trending): s-maxage=30, max-age=15, swr=60
   - STANDARD (search, articles): s-maxage=120, max-age=60, swr=300
   - SLOW (historical, archive): s-maxage=3600, max-age=1800, swr=86400
   - STATIC (docs, openapi): s-maxage=86400, max-age=86400, immutable
3. Create src/lib/cache/purge.ts — cache purge utilities:
   - purgeByTag(tag) — purge CDN cache by surrogate key
   - purgeByPath(path) — purge a specific URL
   - purgeAll() — nuclear option
   - Integrate with Vercel's revalidation API and/or Cloudflare purge API
4. Apply setCacheHeaders to ALL route handlers in src/app/api/:
   - /api/prices/* → REALTIME
   - /api/news/*, /api/trending, /api/breaking → FAST
   - /api/search/*, /api/articles/* → STANDARD
   - /api/historical/*, /api/archive/* → SLOW
   - /api/openapi.json, /api/docs → STATIC
5. Create middleware rule in middleware.ts that sets default cache headers for unhandled routes
6. Target: 95% CDN cache hit rate for read-heavy endpoints
```

---

### Prompt 5 — Observability Stack

```
Implement production-grade observability for free-crypto-news at 1M+ user scale.

Requirements:
1. Create src/lib/observability/metrics.ts — a metrics registry using Prometheus-compatible counters/histograms:
   - http_requests_total{method, path, status} — counter
   - http_request_duration_ms{method, path} — histogram (buckets: 5, 10, 25, 50, 100, 250, 500, 1000, 2500)
   - cache_hits_total{cache, type} — counter (hit/miss/stale)
   - provider_requests_total{provider, status} — counter
   - provider_latency_ms{provider} — histogram
   - ws_connections_active — gauge
   - ws_messages_total{channel, direction} — counter
   - db_query_duration_ms{operation, table} — histogram
   - job_execution_total{job, status} — counter
   - job_duration_ms{job} — histogram
2. Create GET /api/metrics endpoint that exports Prometheus text format (protected by METRICS_TOKEN env var)
3. Create src/lib/observability/tracing.ts — structured request tracing:
   - Generate trace-id per request in middleware
   - Pass through X-Trace-Id header
   - Log: trace_id, method, path, status, duration_ms, cache_status, provider, user_tier
   - Use JSON structured logging (compatible with Datadog/Grafana Loki)
4. Create src/lib/observability/alerts.ts — alerting rules:
   - P99 latency > 2s for 5 minutes → alert
   - Error rate > 5% for 3 minutes → alert
   - Cache hit rate < 80% for 10 minutes → alert
   - Provider circuit breaker open → alert
   - WebSocket connections > 80% capacity → alert
   - Send alerts via webhook URL (ALERT_WEBHOOK_URL env var — works with Slack, Discord, PagerDuty)
5. Create a /admin/dashboard page that shows live metrics (use the existing admin layout if present)
6. Add a Grafana dashboard JSON export at infra/grafana/dashboard.json with panels for all the above metrics
```

---

### Prompt 6 — Load Testing for 1M Users

```
Create a comprehensive load testing suite that validates free-crypto-news can handle 1M+ concurrent users.

Requirements:
1. Upgrade scripts/load-test-1m.js to a full K6 test suite at scripts/load-tests/:
   - scenarios/smoke.js — 10 VUs, 1 minute (sanity check)
   - scenarios/load.js — 1,000 VUs ramping to 10,000, 10 minutes
   - scenarios/stress.js — 10,000 VUs ramping to 50,000, 15 minutes
   - scenarios/spike.js — 100 VUs → spike to 100,000 → back to 100
   - scenarios/soak.js — 5,000 VUs sustained for 1 hour
   - scenarios/websocket.js — 10,000 concurrent WS connections with subscriptions
2. Each scenario should hit realistic endpoint mix:
   - 40% /api/news (most popular)
   - 25% /api/prices
   - 15% /api/market/*
   - 10% /api/search
   - 5% /api/v1/* versioned endpoints
   - 5% other (trending, fear-greed, social)
3. Define SLOs (thresholds in K6):
   - p95 response time < 200ms
   - p99 response time < 1000ms
   - Error rate < 0.1%
   - Cache hit rate > 90%
4. Create scripts/load-tests/run.sh that:
   - Starts the docker-compose.scale.yml stack
   - Waits for health check
   - Runs smoke → load → stress in sequence
   - Collects results into scripts/load-tests/results/
   - Generates a summary report
5. Add to CI: a GitHub Action at .github/workflows/load-test.yml that runs smoke tests on every PR and full suite on release tags
```

---

### Prompt 7 — Multi-Region Deployment

```
Prepare free-crypto-news for multi-region deployment.

Requirements:
1. Create infra/terraform/ with Terraform configs for:
   - Neon Postgres with read replicas in us-east-1, eu-west-1, ap-southeast-1
   - Upstash Redis Global (multi-region replication)
   - Vercel project pointing to the repo with environment variables
2. Create src/lib/db/read-replica.ts — a connection router that:
   - Detects the current region from headers (x-vercel-id) or VERCEL_REGION env var
   - Routes read queries to the nearest read replica
   - Routes write queries to the primary
3. Update the distributed cache to use Upstash Redis Global (it already supports it, just document the config)
4. Create a region-aware middleware in middleware.ts that:
   - Sets X-Region header on all responses
   - Routes /api/prices to the nearest exchange data center when possible
   - Logs region in observability traces
5. Create infra/docker/docker-compose.multi-region.yml showing how to run 3 regional clusters with:
   - Traefik or Caddy as global load balancer
   - Regional Nginx → N app instances
   - Shared Redis Global
   - Read replica DB connections per region
6. Document the multi-region architecture in docs/MULTI-REGION.md with a diagram (Mermaid)
```

---

### Prompt 8 — API Gateway + Rate Limit Tiers

```
Implement a production API gateway layer for free-crypto-news at scale.

Requirements:
1. Upgrade src/lib/distributed-rate-limit.ts to support these tiers:
   - Free (no key): 30 req/min, 1,000 req/day
   - Starter (API key): 300 req/min, 50,000 req/day ($0)
   - Pro (API key): 3,000 req/min, unlimited ($29/mo)
   - Enterprise (API key): 30,000 req/min, unlimited, SLA ($199/mo)
   - Internal: unlimited (service-to-service)
2. Create src/lib/gateway/api-key.ts:
   - API key validation (check DB or Redis)
   - API key issuance (POST /api/keys with email)
   - Key rotation (POST /api/keys/rotate)
   - Usage tracking per key (stored in DB, aggregated hourly)
3. Create src/lib/gateway/quota.ts:
   - Daily quota tracking per API key
   - Quota reset at midnight UTC
   - X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset headers on every response
   - 429 response with Retry-After when exceeded
4. Update middleware.ts to:
   - Extract API key from Authorization header (Bearer) or X-API-Key header or ?api_key query param
   - Look up tier and apply rate limits
   - Track usage
   - Set X-RateLimit-* headers
5. Create /api/v1/usage endpoint — returns current usage stats for the authenticated API key
6. Create /api/admin/keys endpoint — admin-only key management (list, revoke, upgrade)
7. Make it backward-compatible: all existing endpoints continue working for free tier with IP-based rate limits
```

---

## Execution Order

| Phase | Prompts | Timeline | Impact |
|-------|---------|----------|--------|
| **Foundation** | 1 (Database), 2 (Jobs) | Week 1 | Persistent data, async processing |
| **Scale** | 3 (WebSocket), 4 (CDN) | Week 2 | Handle 100K concurrent |
| **Observe** | 5 (Observability), 6 (Load Test) | Week 3 | Know your limits |
| **Monetize** | 8 (API Gateway) | Week 3 | Revenue + abuse protection |
| **Global** | 7 (Multi-Region) | Week 4 | Global latency < 100ms |

## Success Metrics

| Metric | Target |
|--------|--------|
| p95 API response time | < 200ms |
| p99 API response time | < 1,000ms |
| CDN cache hit rate | > 95% |
| Error rate | < 0.1% |
| WebSocket connections | 100K+ per region |
| Database query time (p95) | < 50ms |
| Time to first byte (global) | < 100ms |
| Monthly API requests supported | 1B+ |
| Uptime | 99.95% |
