# 🤖 AGENT 1: Security & Middleware Layer

**Mission**: Implement global security middleware, rate limiting, and request validation to protect all API endpoints.

**Priority**: CRITICAL - Must complete before other agents to avoid conflicts

**Estimated Time**: 2-3 hours

**Dependencies**: None (Agent 1 starts first)

---

## 🎯 OBJECTIVES

### Primary Goals
1. ✅ Add global middleware with rate limiting for free tier endpoints
2. ✅ Implement request size validation (prevent DoS)
3. ✅ Add IP-based rate limiting with Redis/Vercel KV
4. ✅ Create security utilities for all endpoints
5. ✅ Add request ID tracking for traceability

### Success Criteria
- [ ] All free tier endpoints rate-limited (100 req/hour per IP)
- [ ] All POST/PUT requests have size limits (10MB max)
- [ ] Request IDs generated for all API calls
- [ ] Security headers added globally
- [ ] Zero breaking changes to existing endpoints

---

## 📁 FILES TO CREATE

### 1. `/src/middleware.ts` (NEW)
**Purpose**: Next.js global middleware for all API routes

```typescript
/**
 * Global API Middleware
 * 
 * Handles:
 * - Rate limiting for free tier endpoints
 * - Request size validation
 * - Security headers
 * - Request ID generation
 * - CORS handling
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { generateRequestId } from '@/lib/security';

// Free tier endpoints (no auth required)
const FREE_TIER_PATTERNS = [
  /^\/api\/news/,
  /^\/api\/breaking/,
  /^\/api\/sources/,
  /^\/api\/market\/coins$/,
  /^\/api\/market\/search/,
  /^\/api\/trending/,
  /^\/api\/fear-greed/,
  /^\/api\/bitcoin/,
  /^\/api\/defi$/,
  /^\/api\/atom/,
  /^\/api\/rss/,
  /^\/api\/opml/,
];

// Exempt from rate limiting
const EXEMPT_PATTERNS = [
  /^\/api\/health/,
  /^\/api\/\.well-known/,
  /^\/api\/admin/,
];

// Maximum request body size (10MB)
const MAX_BODY_SIZE = 10 * 1024 * 1024;

// Rate limits by tier
const RATE_LIMITS = {
  free: { requests: 100, window: 3600 }, // 100 req/hour
  authenticated: { requests: 1000, window: 3600 }, // 1000 req/hour
};

export async function middleware(request: NextRequest) {
  const startTime = Date.now();
  const pathname = request.nextUrl.pathname;
  
  // Only process API routes
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Generate request ID
  const requestId = generateRequestId();
  
  // Create response headers
  const headers = new Headers();
  headers.set('X-Request-ID', requestId);
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-XSS-Protection', '1; mode=block');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Check if endpoint is exempt from rate limiting
  const isExempt = EXEMPT_PATTERNS.some(pattern => pattern.test(pathname));
  
  if (isExempt) {
    const response = NextResponse.next();
    headers.forEach((value, key) => response.headers.set(key, value));
    return response;
  }

  // Validate request size for POST/PUT/PATCH
  if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
    const contentLength = request.headers.get('content-length');
    
    if (contentLength) {
      const size = parseInt(contentLength);
      
      if (size > MAX_BODY_SIZE) {
        return NextResponse.json(
          {
            error: 'Request Entity Too Large',
            message: `Request body exceeds maximum size of ${MAX_BODY_SIZE / 1024 / 1024}MB`,
            code: 'REQUEST_TOO_LARGE',
            maxSize: `${MAX_BODY_SIZE / 1024 / 1024}MB`,
            receivedSize: `${(size / 1024 / 1024).toFixed(2)}MB`,
            requestId,
          },
          { 
            status: 413,
            headers: Object.fromEntries(headers.entries()),
          }
        );
      }
    }
  }

  // Check if this is a free tier endpoint
  const isFreeTier = FREE_TIER_PATTERNS.some(pattern => pattern.test(pathname));
  
  if (isFreeTier) {
    // Get client identifier (IP address)
    const clientIp = 
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';

    // Check rate limit
    const rateLimit = await checkRateLimit(
      `free:${clientIp}:${pathname}`,
      RATE_LIMITS.free.requests,
      RATE_LIMITS.free.window
    );

    // Add rate limit headers
    headers.set('X-RateLimit-Limit', RATE_LIMITS.free.requests.toString());
    headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString());
    headers.set('X-RateLimit-Reset', new Date(rateLimit.resetAt).toISOString());

    if (!rateLimit.allowed) {
      const retryAfter = Math.ceil((rateLimit.resetAt - Date.now()) / 1000);
      
      return NextResponse.json(
        {
          error: 'Rate Limit Exceeded',
          message: `You have exceeded the rate limit for free tier endpoints. Please wait ${retryAfter} seconds before trying again.`,
          code: 'RATE_LIMIT_EXCEEDED',
          limit: RATE_LIMITS.free.requests,
          window: `${RATE_LIMITS.free.window / 60} minutes`,
          resetAt: new Date(rateLimit.resetAt).toISOString(),
          retryAfter,
          requestId,
          upgrade: '/pricing',
        },
        { 
          status: 429,
          headers: {
            ...Object.fromEntries(headers.entries()),
            'Retry-After': retryAfter.toString(),
          },
        }
      );
    }
  }

  // Continue to route handler
  const response = NextResponse.next();
  
  // Add headers to response
  headers.forEach((value, key) => response.headers.set(key, value));
  
  // Add timing header
  response.headers.set('X-Response-Time', `${Date.now() - startTime}ms`);
  
  return response;
}

// Configure middleware to run on API routes only
export const config = {
  matcher: '/api/:path*',
};
```

### 2. `/src/lib/security.ts` (NEW)
**Purpose**: Security utilities for request validation and ID generation

```typescript
/**
 * Security Utilities
 * 
 * Provides security features:
 * - Request ID generation
 * - IP address extraction
 * - User agent parsing
 * - Security header management
 */

import { NextRequest } from 'next/server';
import { customAlphabet } from 'nanoid';

// Generate request IDs (URL-safe, 21 chars)
const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 21);

/**
 * Generate unique request ID
 */
export function generateRequestId(): string {
  const timestamp = Date.now().toString(36);
  const random = nanoid(12);
  return `req_${timestamp}_${random}`;
}

/**
 * Extract client IP address from request
 */
export function getClientIp(request: NextRequest): string {
  // Try various headers in order of preference
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  if (cfConnectingIp) {
    return cfConnectingIp.trim();
  }
  
  return 'unknown';
}

/**
 * Extract user agent from request
 */
export function getUserAgent(request: NextRequest): string {
  return request.headers.get('user-agent') || 'unknown';
}

/**
 * Check if request is from a bot
 */
export function isBot(request: NextRequest): boolean {
  const userAgent = getUserAgent(request).toLowerCase();
  const botPatterns = [
    'bot', 'crawl', 'spider', 'scrape',
    'curl', 'wget', 'python-requests',
  ];
  
  return botPatterns.some(pattern => userAgent.includes(pattern));
}

/**
 * Validate request origin
 */
export function validateOrigin(request: NextRequest, allowedOrigins: string[]): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true; // Allow requests without origin (server-to-server)
  
  return allowedOrigins.some(allowed => {
    if (allowed === '*') return true;
    if (allowed.startsWith('*.')) {
      const domain = allowed.slice(2);
      return origin.endsWith(domain);
    }
    return origin === allowed;
  });
}

/**
 * Security headers for API responses
 */
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
} as const;

/**
 * Get security headers as Headers object
 */
export function getSecurityHeaders(): Headers {
  const headers = new Headers();
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    headers.set(key, value);
  });
  return headers;
}

/**
 * Sanitize user input (prevent XSS)
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .trim();
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Check if request is HTTPS
 */
export function isSecureRequest(request: NextRequest): boolean {
  return request.nextUrl.protocol === 'https:';
}
```

### 3. `/src/lib/rate-limit.ts` (UPDATE)
**Purpose**: Enhanced rate limiting with distributed support

```typescript
/**
 * Enhanced Rate Limiting
 * 
 * Distributed rate limiting using Vercel KV (Redis)
 * Supports multiple strategies and time windows
 */

import { kv } from '@vercel/kv';

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}

/**
 * Check rate limit with sliding window
 * 
 * @param key - Unique identifier (e.g., "ip:123.456.789.0" or "apikey:cda_xxx")
 * @param limit - Maximum requests allowed
 * @param windowSeconds - Time window in seconds (default: 3600 = 1 hour)
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds = 3600
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowStart = now - (windowSeconds * 1000);
  const resetAt = now + (windowSeconds * 1000);

  try {
    // Use Redis sorted set for sliding window
    const kvKey = `ratelimit:${key}`;
    
    // Remove old entries outside window
    await kv.zremrangebyscore(kvKey, 0, windowStart);
    
    // Get current count
    const count = await kv.zcard(kvKey);
    
    if (count >= limit) {
      return {
        allowed: false,
        limit,
        remaining: 0,
        resetAt,
      };
    }
    
    // Add current request
    await kv.zadd(kvKey, { score: now, member: `${now}:${Math.random()}` });
    
    // Set expiry on key
    await kv.expire(kvKey, windowSeconds);
    
    return {
      allowed: true,
      limit,
      remaining: limit - (count + 1),
      resetAt,
    };
  } catch (error) {
    console.error('Rate limit error:', error);
    
    // On error, allow request but log
    return {
      allowed: true,
      limit,
      remaining: limit,
      resetAt,
    };
  }
}

/**
 * Reset rate limit for a key
 */
export async function resetRateLimit(key: string): Promise<void> {
  try {
    await kv.del(`ratelimit:${key}`);
  } catch (error) {
    console.error('Reset rate limit error:', error);
  }
}

/**
 * Get current rate limit status without incrementing
 */
export async function getRateLimitStatus(
  key: string,
  limit: number,
  windowSeconds = 3600
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowStart = now - (windowSeconds * 1000);
  const resetAt = now + (windowSeconds * 1000);

  try {
    const kvKey = `ratelimit:${key}`;
    
    // Remove old entries
    await kv.zremrangebyscore(kvKey, 0, windowStart);
    
    // Get current count
    const count = await kv.zcard(kvKey);
    
    return {
      allowed: count < limit,
      limit,
      remaining: Math.max(0, limit - count),
      resetAt,
    };
  } catch (error) {
    console.error('Get rate limit status error:', error);
    
    return {
      allowed: true,
      limit,
      remaining: limit,
      resetAt,
    };
  }
}

/**
 * Check multiple rate limits (e.g., per-endpoint + global)
 */
export async function checkMultipleRateLimits(
  checks: Array<{
    key: string;
    limit: number;
    window?: number;
  }>
): Promise<RateLimitResult> {
  const results = await Promise.all(
    checks.map(({ key, limit, window }) => 
      checkRateLimit(key, limit, window)
    )
  );
  
  // If any limit is exceeded, return that result
  const exceeded = results.find(r => !r.allowed);
  if (exceeded) {
    return exceeded;
  }
  
  // Return the most restrictive remaining count
  const mostRestrictive = results.reduce((min, curr) => 
    curr.remaining < min.remaining ? curr : min
  );
  
  return mostRestrictive;
}
```

---

## 📝 FILES TO UPDATE

### 4. `/package.json` (ADD DEPENDENCIES)
**Add to dependencies:**
```json
{
  "dependencies": {
    "nanoid": "^5.0.8"
  }
}
```

### 5. `/next.config.js` (UPDATE)
**Add middleware configuration:**
```javascript
// Ensure middleware runs on all API routes
const config = {
  // ... existing config
  experimental: {
    // ... existing experimental features
  },
  // Middleware is now configured in middleware.ts
};
```

---

## ✅ TESTING CHECKLIST

### Manual Tests
```bash
# Test 1: Rate limiting works
curl http://localhost:3000/api/news
# Repeat 101 times quickly
# Expected: 429 after 100 requests

# Test 2: Request size limit
curl -X POST http://localhost:3000/api/oracle \
  -H "Content-Type: application/json" \
  -d "$(yes '{\"test\":\"data\"}' | head -n 100000)"
# Expected: 413 Request Too Large

# Test 3: Request ID added
curl -I http://localhost:3000/api/news
# Expected: X-Request-ID header present

# Test 4: Security headers
curl -I http://localhost:3000/api/news
# Expected: X-Content-Type-Options, X-Frame-Options, etc.

# Test 5: Paid endpoints unaffected
curl http://localhost:3000/api/v1/coins?api_key=cda_test
# Expected: 200 (if valid key) or 402 (if x402)
```

### Integration Tests
```typescript
// Create: src/__tests__/middleware.test.ts

describe('Middleware', () => {
  it('should rate limit free tier endpoints', async () => {
    // Make 101 requests
    // Assert 101st returns 429
  });
  
  it('should reject oversized requests', async () => {
    // Send 20MB payload
    // Assert 413 response
  });
  
  it('should add security headers', async () => {
    // Make any request
    // Assert headers present
  });
  
  it('should not rate limit paid endpoints', async () => {
    // Make 1000 requests to /api/v1/coins
    // Assert all succeed (if authed)
  });
});
```

---

## 🚨 IMPORTANT NOTES

### Do NOT Touch
- ❌ `/src/lib/x402/*` - Agent working on this separately
- ❌ `/src/app/api/premium/*` - Don't modify premium routes
- ❌ `/src/app/api/v1/*` - Don't modify v1 routes
- ❌ Database migrations
- ❌ Environment variables

### Do Touch
- ✅ `/src/middleware.ts` - CREATE THIS
- ✅ `/src/lib/security.ts` - CREATE THIS  
- ✅ `/src/lib/rate-limit.ts` - UPDATE THIS
- ✅ `/package.json` - Add nanoid dependency
- ✅ Tests - Create middleware tests

### Coordination Points
- **Agent 2** will use your `generateRequestId()` function for error tracking
- **Agent 3** will use your `getClientIp()` for logging
- **Agent 4** will integrate with your rate limiting
- **Agent 5** will test your middleware

---

## 📊 SUCCESS METRICS

After completion, verify:
- [ ] All free endpoints return 429 after 100 requests/hour
- [ ] All POST requests > 10MB return 413
- [ ] All responses have X-Request-ID header
- [ ] All responses have security headers
- [ ] Rate limits tracked in Vercel KV
- [ ] Zero errors in production logs
- [ ] No breaking changes to existing endpoints
- [ ] Tests pass (>90% coverage for new code)

---

## 🎯 DELIVERABLES

1. Working `/src/middleware.ts` with global middleware
2. New `/src/lib/security.ts` with security utilities
3. Updated `/src/lib/rate-limit.ts` with Vercel KV integration
4. Tests for all new functionality
5. Updated `package.json` with dependencies
6. README documentation for rate limiting behavior

---

## 💬 QUESTIONS TO CLARIFY

Before starting, confirm:
1. ✅ Vercel KV is configured? (Check `KV_REST_API_URL` env var)
2. ✅ Rate limit of 100 req/hour for free tier is correct?
3. ✅ 10MB request size limit is appropriate?
4. ✅ Should bots be rate limited differently?
5. ✅ Should we add IP whitelist for trusted sources?

---

## 🚀 READY TO START?

**Agent 1, your mission is clear. Begin implementation and report progress every 30 minutes. Good luck! 🎯**
