# Scalability Guide

This document outlines the scalability architecture and configuration for Free Crypto News.

## Current Scalability Features

### ✅ Edge Runtime (Ready for Scale)

82% of routes use Edge Runtime for:
- Global distribution via Vercel's edge network
- Sub-50ms cold starts
- Unlimited concurrent connections
- No cold start penalties

**Edge-enabled routes include:**
- `/api/news/*` - News aggregation
- `/api/market/*` - Market data
- `/api/ai/*` - AI analysis
- `/api/health` - Health checks
- All `/api/v2/*` endpoints

### ✅ Distributed Caching

**File:** `src/lib/distributed-cache.ts`

The caching layer automatically uses:
1. **Vercel KV / Upstash Redis** when `KV_REST_API_URL` is set (production)
2. **In-memory cache** as fallback (development)

**Features:**
- Stale-while-revalidate pattern
- Cache stampede prevention (request coalescing)
- Tag-based invalidation
- Configurable TTL per cache type

**Cache Instances:**
```typescript
import { newsCache, marketCache, aiCache, translationCache } from '@/lib/distributed-cache';

// Use with getOrSet for automatic caching
const data = await newsCache.getOrSet(
  'latest-news',
  () => fetchNews(),
  { ttl: 300, staleTtl: 60 }
);
```

**TTL Presets:**
```typescript
import { CACHE_TTL } from '@/lib/distributed-cache';

// CACHE_TTL.REALTIME   - 15s fresh, 60s stale
// CACHE_TTL.PRICES     - 30s fresh, 2min stale
// CACHE_TTL.NEWS       - 2min fresh, 10min stale
// CACHE_TTL.AI         - 5min fresh, 30min stale
// CACHE_TTL.STATIC     - 1hr fresh, 24hr stale
// CACHE_TTL.TRANSLATIONS - 24hr fresh, 7d stale
```

### ✅ Distributed Rate Limiting

**File:** `src/lib/distributed-rate-limit.ts`

Uses Redis-backed sliding window algorithm for:
- Global rate limiting across all instances
- Tiered limits by user type
- Smooth rate limiting (no burst spikes)

**Rate Limit Tiers:**
```typescript
// Requests per minute by tier
anonymous:  60 req/min
free:       200 req/min  
pro:        1,000 req/min
enterprise: 10,000 req/min
internal:   100,000 req/min
```

**Usage in API routes:**
```typescript
import { withRateLimit, rateLimitedResponse } from '@/lib/distributed-rate-limit';

export async function GET(request: NextRequest) {
  const { allowed, headers } = await withRateLimit(request);
  
  if (!allowed) {
    return rateLimitedResponse(result, headers);
  }
  
  // Handle request...
  return new Response(data, { headers });
}
```

### ✅ Error Monitoring

**File:** `src/lib/sentry.ts`

Sentry integration for:
- Automatic error capture
- Performance monitoring
- User context tracking
- Custom breadcrumbs

**Configuration:**
```bash
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_ENVIRONMENT=production
SENTRY_RELEASE=v1.0.0
```

**Usage:**
```typescript
import { captureException, withErrorTracking } from '@/lib/sentry';

// Manual error capture
try {
  await riskyOperation();
} catch (error) {
  captureException(error, { userId: user.id });
}

// Automatic wrapper
const result = await withErrorTracking('fetchPrices', async () => {
  return await fetchMarketPrices();
});
```

### ✅ Multi-Backend Database

**File:** `src/lib/database.ts`

Supports multiple storage backends:
1. Vercel KV (recommended for production)
2. Upstash Redis
3. In-memory (development)
4. File-based (local persistence)

**Backend Priority:**
```
VERCEL_KV_URL → KV_REST_API_URL → UPSTASH_REDIS_REST_URL → Memory/File
```

## Scaling Recommendations

### For 10x Scale (~100K users)

1. **Enable Redis Caching**
   ```bash
   # Vercel KV or Upstash
   KV_REST_API_URL=https://xxx
   KV_REST_API_TOKEN=xxx
   ```

2. **Enable Sentry**
   ```bash
   SENTRY_DSN=https://xxx@sentry.io/xxx
   ```

3. **Review Rate Limits**
   - Adjust tiers based on actual usage patterns
   - Monitor 429 response rates

### For 100x Scale (~1M users)

At 1 million monthly active users you can expect **~350 sustained req/s** with
spikes of **1 500+ req/s** during breaking-news events. The following checklist
turns the existing foundation into a production-grade, horizontally scalable
system.

#### 1. Middleware Rate Limiting — Upstash (already wired)

The middleware (`middleware.ts`) now uses `@upstash/ratelimit` with a Redis-backed
sliding window instead of an in-memory `Map`. This means rate-limit state is
**shared across every Edge/serverless isolate** on Vercel — no more per-instance
blind spots.

```bash
# Required env vars (set in Vercel / Railway / .env)
KV_REST_API_URL=https://xxx.upstash.io
KV_REST_API_TOKEN=AXxx…
# — or —
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXxx…
```

The limiter **fails open** — if Redis is unreachable, requests pass through
instead of causing a total outage.

#### 2. Circuit Breakers for External APIs

`src/lib/circuit-breaker.ts` now exports **pre-configured breakers** for every
upstream dependency:

| Breaker         | Threshold | Cooldown | Timeout | Use for                    |
|-----------------|-----------|----------|---------|----------------------------|
| `priceCircuit`  | 5         | 30 s     | 8 s     | CoinGecko, Binance         |
| `feedCircuit`   | 10        | 60 s     | 15 s    | RSS / Atom feeds           |
| `aiCircuit`     | 3         | 60 s     | 30 s    | OpenAI, Groq               |
| `externalCircuit` | 5       | 30 s     | 10 s    | Everything else            |

```typescript
import { priceCircuit } from '@/lib/circuit-breaker';

const data = await priceCircuit.call(() =>
  fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd')
);
```

When a breaker is OPEN, callers receive a `CircuitOpenError` and should serve
stale / cached data.  The `/api/health` endpoint now exposes circuit-breaker
state for every upstream.

#### 3. Horizontal Scaling via Docker Compose

```bash
# Spin up 4 app replicas + Redis + Nginx load balancer
docker compose -f docker-compose.scale.yml up -d --scale app=4
```

Key components:
- **Nginx** (`infra/nginx/nginx.conf`) — `least_conn` upstream, 64 keepalive
  connections, edge rate-limiting (defence-in-depth), WebSocket upgrade
- **Redis 7** — 512 MB `allkeys-lru`, AOF persistence, 10 000 `maxclients`
- **App replicas** — 512 MB / 1 CPU each, health-checked, auto-restarted

#### 4. Redis Connection Improvements

`src/lib/redis.ts` now includes:
- **TCP keep-alive** (30 s) to survive load-balancer idle timeouts
- **Exponential back-off with jitter** on reconnect (up to 10 retries)
- **Command queue limit** (`REDIS_QUEUE_MAX`, default 2 000) to apply back-pressure
  when Redis is saturated

#### 5. CDN Cache Tuning

All `Cache-Control` headers already use `s-maxage` + `stale-while-revalidate`.
For 1 M users, ensure Vercel's Edge Cache is the primary traffic absorber:

| Route             | s-maxage | stale-while-revalidate | Expected cache-hit % |
|-------------------|----------|------------------------|----------------------|
| `/api/news`       | 60 s     | 120 s                  | 85–95 %              |
| `/api/prices`     | 120 s    | 300 s                  | 90 %+                |
| `/api/trending`   | 300 s    | 600 s                  | 95 %+                |
| `/api/ai/*`       | 600 s    | 1 200 s                | 95 %+                |
| Static assets     | 1 year   | immutable              | 99 %+                |

At 90 %+ CDN hit rate, only ~35 req/s hit your origin — well within a single
Vercel Pro plan or a 4-replica Docker deployment.

#### 6. Load Testing

Two K6 scripts are provided:

```bash
# Standard load test (up to 200 VUs)
k6 run scripts/load-test.js

# 1 M-user simulation (up to 1 500 VUs, 40+ minutes, soak test)
BASE_URL=https://your-domain.com k6 run scripts/load-test-1m.js

# Quick soak (5 min, 500 VUs)
k6 run --vus 500 --duration 5m scripts/load-test-1m.js
```

The 1 M script tests four phases: warm-up → steady state → breaking-news-spike → soak.

#### 7. Database / Storage

Move from file-based archive to a persistent store:
- **Short-term**: Vercel KV / Upstash Redis (already supported, just set env vars)
- **Medium-term**: Add PostgreSQL via Neon or Supabase for structured queries
- **Long-term**: Consider read replicas + connection pooling (PgBouncer)

#### 8. Background Jobs

Move cron-triggered work to a proper job queue:
- **Recommended**: [Inngest](https://inngest.com) or [Trigger.dev](https://trigger.dev)
- Separates compute for AI enrichment, archive collection, digest generation
- Provides retry logic, observability, and dead-letter queues out of the box

#### 9. WebSocket Scaling

The current `ws-server.js` is single-instance (in-memory state). For 1 M users:
- Add **Redis Pub/Sub** as the message bus between WS instances
- Or migrate to **Ably** / **Pusher** / **Socket.io Cloud** for managed scaling
- Set `REDIS_URL` in `docker-compose.scale.yml` to enable shared state

#### 10. Monitoring Checklist

| Tool               | Purpose                          | Status       |
|---------------------|----------------------------------|--------------|
| Vercel Analytics    | Page views, Web Vitals           | ✅ Integrated |
| Vercel Speed Insights | Core Web Vitals               | ✅ Integrated |
| Sentry              | Error tracking, performance      | ✅ Ready      |
| Upstash Analytics   | Rate-limit hit/miss rates        | ✅ Enabled    |
| Circuit Breaker Health | Upstream degradation alerts   | ✅ `/api/health` |
| K6 / Grafana        | Load testing, dashboards         | ✅ Scripts    |
| Nginx access logs   | Request timing, status codes     | ✅ Configured |

### For 1000x Scale (~10M users)

1. **Dedicated Services**
   - WebSocket: Ably, Pusher, or Socket.io Cloud
   - Search: Algolia or Typesense
   - AI: Dedicated GPU instances

2. **Multi-Region**
   - Deploy to multiple Vercel regions
   - Use geo-routing for data sources

3. **Database Sharding**
   - Shard by user ID or data type
   - Consider CockroachDB or PlanetScale

## Environment Variables

```bash
# Caching (Vercel KV or Upstash)
KV_REST_API_URL=
KV_REST_API_TOKEN=

# Error Monitoring
SENTRY_DSN=
SENTRY_ENVIRONMENT=production
SENTRY_RELEASE=

# Rate Limiting
RATE_LIMIT_TIER=free  # Default tier for API key users
INTERNAL_API_KEY=     # Bypass rate limiting for internal services

# Logging
LOG_LEVEL=info        # debug, info, warn, error

# Feature Flags
ENABLE_REALTIME=true
ENABLE_AI=true
```

## Health Check Endpoint

The `/api/health` endpoint provides comprehensive system status:

```bash
curl https://your-domain.com/api/health
```

**Response includes:**
- RSS source health status
- Cache hit/miss rates
- Rate limit statistics
- Monitoring configuration

## Monitoring Dashboard

For production monitoring, we recommend:

1. **Vercel Analytics** - Already integrated via `@vercel/analytics`
2. **Vercel Speed Insights** - Already integrated via `@vercel/speed-insights`
3. **Sentry** - Error tracking and performance
4. **Grafana/DataDog** - Custom metrics (optional)

## Load Testing

Before scaling, run load tests:

```bash
# Install k6
brew install k6

# Run load test
k6 run scripts/load-test.js
```

Sample load test script:
```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 },  // Ramp up
    { duration: '5m', target: 100 },  // Sustain
    { duration: '2m', target: 0 },    // Ramp down
  ],
};

export default function() {
  const res = http.get('https://your-domain.com/api/news');
  check(res, { 'status is 200': (r) => r.status === 200 });
  sleep(1);
}
```

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Vercel Edge                             │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ Edge Route  │  │ Edge Route  │  │ Edge Route  │  ...         │
│  │   /api/news │  │ /api/market │  │   /api/ai   │              │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│         │                │                │                     │
│         ▼                ▼                ▼                     │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              Distributed Cache (Vercel KV)                │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │  │
│  │  │newsCache│ │mktCache │ │aiCache  │ │i18nCache│          │  │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘          │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │            Rate Limiter (Redis-backed)                    │  │
│  │   IP-based │ API Key │ User Tier │ Sliding Window         │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      External Services                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ RSS Sources │  │  CoinGecko  │  │   OpenAI    │              │
│  │   (50+)     │  │   Binance   │  │    Groq     │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
└─────────────────────────────────────────────────────────────────┘
```

## Conclusion

The Free Crypto News platform is built for scale from day one:

- **Edge-first**: 82% of routes on Edge Runtime
- **Cache-efficient**: Distributed caching with stale-while-revalidate
- **Rate-limited**: Tiered limits with Redis backing
- **Observable**: Sentry + Vercel Analytics integration
- **Modular**: Easy to swap backends as needs grow

For questions or scaling assistance, open an issue on GitHub.
