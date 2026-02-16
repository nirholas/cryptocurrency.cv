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

1. **Database Optimization**
   - Use connection pooling
   - Consider read replicas
   - Implement cursor pagination

2. **Job Queues**
   - Move background jobs to Inngest or Trigger.dev
   - Separate compute for AI analysis

3. **CDN Configuration**
   - Enable stale-while-revalidate headers
   - Configure cache zones by region

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
