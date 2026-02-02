# 🤖 AGENT 3: Route Updates & Health Monitoring

**Mission**: Complete route standardization (remaining ~90 files) and implement health checks, monitoring, and observability systems.

**Priority**: HIGH - Depends on Agent 2's utilities being ready

**Estimated Time**: 2.5-3 hours

**Dependencies**: 
- Agent 2 must create `/src/lib/api-error.ts` and `/src/lib/logger.ts` first
- Wait for Agent 2's pattern guide

**Coordination**: Continues Agent 2's work on remaining routes

---

## 🎯 OBJECTIVES

### Primary Goals
1. ✅ Update remaining ~90 API routes with standardized error handling
2. ✅ Create comprehensive health check system
3. ✅ Add monitoring endpoints for metrics
4. ✅ Implement observability utilities
5. ✅ Create API status dashboard

### Success Criteria
- [ ] All remaining routes use `ApiError` and `logger`
- [ ] Health check endpoint operational
- [ ] Metrics collection working
- [ ] Status dashboard deployed
- [ ] 100% route coverage achieved (combined with Agent 2)

---

## 📁 FILES TO CREATE

### 1. `/src/app/api/health/route.ts` (NEW)
**Purpose**: Comprehensive health check endpoint

```typescript
/**
 * Health Check Endpoint
 * 
 * Provides system health status including:
 * - API availability
 * - Database connectivity
 * - External service status
 * - Cache status
 * - x402 facilitator status
 */

import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

export const runtime = 'edge';
export const revalidate = 0; // Always fresh

interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  message?: string;
  responseTime?: number;
}

interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    api: HealthCheck;
    cache: HealthCheck;
    x402Facilitator: HealthCheck;
    externalAPIs: HealthCheck;
  };
}

/**
 * Check cache (Vercel KV) connectivity
 */
async function checkCache(): Promise<HealthCheck> {
  const start = Date.now();
  
  try {
    // Try to set and get a test key
    await kv.set('health:check', Date.now(), { ex: 10 });
    const result = await kv.get('health:check');
    
    if (result) {
      return {
        status: 'healthy',
        responseTime: Date.now() - start,
      };
    }
    
    return {
      status: 'degraded',
      message: 'Cache accessible but returned unexpected result',
      responseTime: Date.now() - start,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Cache unavailable',
      responseTime: Date.now() - start,
    };
  }
}

/**
 * Check x402 facilitator status
 */
async function checkX402Facilitator(): Promise<HealthCheck> {
  const start = Date.now();
  const facilitatorUrl = process.env.X402_FACILITATOR_URL || 'https://x402.org/facilitator';
  
  try {
    const response = await fetch(`${facilitatorUrl}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });
    
    if (response.ok) {
      return {
        status: 'healthy',
        responseTime: Date.now() - start,
      };
    }
    
    return {
      status: 'degraded',
      message: `Facilitator returned ${response.status}`,
      responseTime: Date.now() - start,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Facilitator unreachable',
      responseTime: Date.now() - start,
    };
  }
}

/**
 * Check external APIs (CoinGecko, etc.)
 */
async function checkExternalAPIs(): Promise<HealthCheck> {
  const start = Date.now();
  
  try {
    // Quick check to CoinGecko ping endpoint
    const response = await fetch('https://api.coingecko.com/api/v3/ping', {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });
    
    if (response.ok) {
      return {
        status: 'healthy',
        responseTime: Date.now() - start,
      };
    }
    
    return {
      status: 'degraded',
      message: 'External API responding slowly or with errors',
      responseTime: Date.now() - start,
    };
  } catch (error) {
    return {
      status: 'degraded',
      message: 'External APIs may be slow or unavailable',
      responseTime: Date.now() - start,
    };
  }
}

/**
 * GET /api/health
 */
export async function GET() {
  const startTime = Date.now();
  
  // Run all health checks in parallel
  const [cache, x402, external] = await Promise.all([
    checkCache(),
    checkX402Facilitator(),
    checkExternalAPIs(),
  ]);

  const checks = {
    api: {
      status: 'healthy' as const,
      responseTime: Date.now() - startTime,
    },
    cache,
    x402Facilitator: x402,
    externalAPIs: external,
  };

  // Determine overall status
  const unhealthyCount = Object.values(checks).filter(c => c.status === 'unhealthy').length;
  const degradedCount = Object.values(checks).filter(c => c.status === 'degraded').length;
  
  let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
  if (unhealthyCount > 0) {
    overallStatus = 'unhealthy';
  } else if (degradedCount > 0) {
    overallStatus = 'degraded';
  } else {
    overallStatus = 'healthy';
  }

  const response: HealthResponse = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    uptime: process.uptime ? process.uptime() : 0,
    checks,
  };

  // Return appropriate status code
  const statusCode = overallStatus === 'healthy' ? 200 : 
                     overallStatus === 'degraded' ? 200 : 503;

  return NextResponse.json(response, {
    status: statusCode,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}
```

### 2. `/src/app/api/metrics/route.ts` (NEW)
**Purpose**: API metrics and statistics

```typescript
/**
 * Metrics Endpoint
 * 
 * Provides API usage metrics:
 * - Request counts
 * - Error rates
 * - Response times
 * - Rate limit stats
 */

import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { ApiError } from '@/lib/api-error';

export const runtime = 'edge';

interface Metrics {
  timestamp: string;
  period: {
    start: string;
    end: string;
    duration: string;
  };
  requests: {
    total: number;
    byStatus: Record<string, number>;
    byEndpoint: Record<string, number>;
  };
  performance: {
    avgResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
  };
  rateLimits: {
    totalBlocked: number;
    topBlockedIps: Array<{ ip: string; count: number }>;
  };
  errors: {
    total: number;
    byCode: Record<string, number>;
  };
}

/**
 * GET /api/metrics
 * 
 * Query params:
 * - period: 1h, 24h, 7d (default: 1h)
 * - admin_key: Required for access
 */
export async function GET(request: NextRequest) {
  // Require admin authentication
  const adminKey = request.headers.get('X-Admin-Key') || 
                   request.nextUrl.searchParams.get('admin_key');
  
  if (adminKey !== process.env.ADMIN_API_KEY) {
    return ApiError.unauthorized('Admin authentication required');
  }

  const period = request.nextUrl.searchParams.get('period') || '1h';
  const now = Date.now();
  
  // Calculate time window
  const windows: Record<string, number> = {
    '1h': 3600 * 1000,
    '24h': 24 * 3600 * 1000,
    '7d': 7 * 24 * 3600 * 1000,
  };
  
  const windowMs = windows[period] || windows['1h'];
  const startTime = now - windowMs;

  try {
    // Fetch metrics from KV (collected by middleware/routes)
    const [requestCounts, errorCounts, rateLimitBlocks] = await Promise.all([
      kv.get<Record<string, number>>('metrics:requests') || {},
      kv.get<Record<string, number>>('metrics:errors') || {},
      kv.get<number>('metrics:rate_limit_blocks') || 0,
    ]);

    const metrics: Metrics = {
      timestamp: new Date().toISOString(),
      period: {
        start: new Date(startTime).toISOString(),
        end: new Date(now).toISOString(),
        duration: period,
      },
      requests: {
        total: Object.values(requestCounts).reduce((a, b) => a + b, 0),
        byStatus: requestCounts,
        byEndpoint: {}, // TODO: Implement endpoint tracking
      },
      performance: {
        avgResponseTime: 0, // TODO: Implement timing tracking
        p95ResponseTime: 0,
        p99ResponseTime: 0,
      },
      rateLimits: {
        totalBlocked: rateLimitBlocks,
        topBlockedIps: [], // TODO: Implement IP tracking
      },
      errors: {
        total: Object.values(errorCounts).reduce((a, b) => a + b, 0),
        byCode: errorCounts,
      },
    };

    return NextResponse.json(metrics, {
      headers: {
        'Cache-Control': 'private, max-age=60',
      },
    });
  } catch (error) {
    return ApiError.internal('Failed to fetch metrics', error);
  }
}
```

### 3. `/src/lib/monitoring.ts` (NEW)
**Purpose**: Monitoring utilities for collecting metrics

```typescript
/**
 * Monitoring & Observability Utilities
 * 
 * Provides:
 * - Metrics collection
 * - Performance tracking
 * - Error tracking
 * - Usage analytics
 */

import { kv } from '@vercel/kv';

/**
 * Track API request
 */
export async function trackRequest(
  endpoint: string,
  method: string,
  status: number,
  duration: number
): Promise<void> {
  try {
    const timestamp = Date.now();
    const hour = new Date(timestamp).toISOString().slice(0, 13); // YYYY-MM-DDTHH
    
    // Increment request counter
    await kv.hincrby(`metrics:requests:${hour}`, `${status}`, 1);
    
    // Track endpoint usage
    await kv.hincrby(`metrics:endpoints:${hour}`, endpoint, 1);
    
    // Track response times (store for percentile calculation)
    await kv.zadd(`metrics:response_times:${hour}`, {
      score: duration,
      member: `${timestamp}:${Math.random()}`,
    });
    
    // Set expiry (7 days)
    await kv.expire(`metrics:requests:${hour}`, 7 * 24 * 3600);
    await kv.expire(`metrics:endpoints:${hour}`, 7 * 24 * 3600);
    await kv.expire(`metrics:response_times:${hour}`, 7 * 24 * 3600);
  } catch (error) {
    // Don't let metrics tracking break the app
    console.error('Failed to track request:', error);
  }
}

/**
 * Track error occurrence
 */
export async function trackError(
  code: string,
  endpoint: string,
  severity: string
): Promise<void> {
  try {
    const hour = new Date().toISOString().slice(0, 13);
    
    await kv.hincrby(`metrics:errors:${hour}`, code, 1);
    await kv.hincrby(`metrics:errors_by_endpoint:${hour}`, endpoint, 1);
    await kv.hincrby(`metrics:errors_by_severity:${hour}`, severity, 1);
    
    await kv.expire(`metrics:errors:${hour}`, 7 * 24 * 3600);
    await kv.expire(`metrics:errors_by_endpoint:${hour}`, 7 * 24 * 3600);
    await kv.expire(`metrics:errors_by_severity:${hour}`, 7 * 24 * 3600);
  } catch (error) {
    console.error('Failed to track error:', error);
  }
}

/**
 * Track rate limit block
 */
export async function trackRateLimitBlock(
  ip: string,
  endpoint: string
): Promise<void> {
  try {
    const hour = new Date().toISOString().slice(0, 13);
    
    await kv.incr(`metrics:rate_limit_blocks:${hour}`);
    await kv.hincrby(`metrics:rate_limit_ips:${hour}`, ip, 1);
    await kv.hincrby(`metrics:rate_limit_endpoints:${hour}`, endpoint, 1);
    
    await kv.expire(`metrics:rate_limit_blocks:${hour}`, 7 * 24 * 3600);
    await kv.expire(`metrics:rate_limit_ips:${hour}`, 7 * 24 * 3600);
    await kv.expire(`metrics:rate_limit_endpoints:${hour}`, 7 * 24 * 3600);
  } catch (error) {
    console.error('Failed to track rate limit:', error);
  }
}

/**
 * Get metrics for time period
 */
export async function getMetrics(hours = 1): Promise<{
  requests: number;
  errors: number;
  rateLimitBlocks: number;
}> {
  try {
    const now = new Date();
    let totalRequests = 0;
    let totalErrors = 0;
    let totalBlocks = 0;
    
    for (let i = 0; i < hours; i++) {
      const time = new Date(now.getTime() - i * 3600 * 1000);
      const hour = time.toISOString().slice(0, 13);
      
      const requests = await kv.hgetall(`metrics:requests:${hour}`) || {};
      const errors = await kv.hgetall(`metrics:errors:${hour}`) || {};
      const blocks = await kv.get<number>(`metrics:rate_limit_blocks:${hour}`) || 0;
      
      totalRequests += Object.values(requests).reduce((a: number, b) => a + (b as number), 0);
      totalErrors += Object.values(errors).reduce((a: number, b) => a + (b as number), 0);
      totalBlocks += blocks;
    }
    
    return {
      requests: totalRequests,
      errors: totalErrors,
      rateLimitBlocks: totalBlocks,
    };
  } catch (error) {
    console.error('Failed to get metrics:', error);
    return { requests: 0, errors: 0, rateLimitBlocks: 0 };
  }
}
```

---

## 📝 FILES TO UPDATE

### 4. Update REMAINING ~90 API Routes

**Agent 2 already updated:**
- ✅ `/api/v1/*`
- ✅ `/api/premium/*`
- ✅ `/api/news/*`
- ✅ `/api/market/*`
- ✅ `/api/breaking`, `/api/sources`, `/api/trending`

**Your scope (remaining routes):**
```
/src/app/api/
├── admin/**/*.ts (~10 files)
├── ai/**/*.ts (~8 files)
├── analytics/**/*.ts (~8 files)
├── webhooks/**/*.ts (~5 files)
├── archive/**/*.ts (~5 files)
├── billing/**/*.ts (~4 files)
├── citations/**/*.ts (~2 files)
├── detect/**/*.ts (~2 files)
├── export/**/*.ts (~4 files)
├── integrations/**/*.ts (~3 files)
├── oracle/**/*.ts (~2 files)
├── portfolio/**/*.ts (~4 files)
├── predictions/**/*.ts (~3 files)
├── regulatory/**/*.ts (~2 files)
├── signals/**/*.ts (~2 files)
├── social/**/*.ts (~4 files)
├── stats/**/*.ts (~2 files)
├── summarize/**/*.ts (~2 files)
├── trading/**/*.ts (~4 files)
├── tradingview/**/*.ts (~2 files)
├── watchlist/**/*.ts (~3 files)
├── whale-alerts/**/*.ts (~2 files)
└── [other routes] (~15 files)

Total: ~90 files
```

**Follow Agent 2's pattern guide for each file.**

---

## ✅ TESTING CHECKLIST

### Health Check Tests
```bash
# Test health endpoint
curl http://localhost:3000/api/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "...",
  "version": "1.0.0",
  "checks": {
    "api": { "status": "healthy", "responseTime": 5 },
    "cache": { "status": "healthy", "responseTime": 12 },
    "x402Facilitator": { "status": "healthy", "responseTime": 150 },
    "externalAPIs": { "status": "healthy", "responseTime": 200 }
  }
}
```

### Metrics Tests
```bash
# Test metrics endpoint (requires admin key)
curl -H "X-Admin-Key: $ADMIN_API_KEY" \
  http://localhost:3000/api/metrics?period=1h

# Expected: Metrics data
```

### Route Update Tests
```bash
# Verify all routes return consistent errors
curl http://localhost:3000/api/admin/stats
# Should return proper ApiError format

curl http://localhost:3000/api/ai/summarize
# Should return proper ApiError format
```

---

## 📊 CONVERSION CHECKLIST

For EACH of your ~90 route files:
- [ ] Import `ApiError` from `@/lib/api-error`
- [ ] Import `createRequestLogger` from `@/lib/logger`
- [ ] Replace all `console.error` with `logger.error`
- [ ] Replace all `console.log` with `logger.info`
- [ ] Replace all error responses with `ApiError.*`
- [ ] Add request timing and logging
- [ ] Test the route still works

---

## 🎯 SUCCESS METRICS

After completion:
- [ ] Health endpoint returns 200 for healthy system
- [ ] Metrics endpoint tracks requests/errors
- [ ] All ~90 remaining routes updated
- [ ] 100% route coverage (combined with Agent 2)
- [ ] Zero console.log/error in production routes
- [ ] All errors use ApiError system
- [ ] Monitoring data visible in metrics

---

## 🚀 DELIVERABLES

1. ✅ `/api/health` - Working health check endpoint
2. ✅ `/api/metrics` - Metrics collection endpoint
3. ✅ `/src/lib/monitoring.ts` - Monitoring utilities
4. ✅ Updated ~90 remaining route files
5. ✅ Tests for health/metrics
6. ✅ Monitoring dashboard (optional)
7. ✅ Complete route coverage report

---

## 💬 COORDINATION

**Wait for Agent 2:**
- Must have `ApiError` created
- Must have `logger` created
- Must have pattern guide

**You provide:**
- Health check system
- Metrics tracking
- Complete route standardization

**Works with:**
- Agent 4 will use your health endpoint
- Agent 5 will test your monitoring

---

## 🚀 READY TO START?

**Agent 3, wait for Agent 2's utilities, then begin route updates systematically. Focus on one directory at a time. Report progress every hour. Good luck! 🎯**
