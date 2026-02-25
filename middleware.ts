/**
 * Main Middleware
 *
 * Handles (in order of evaluation):
 *  1. Internationalisation — locale detection and routing for page requests
 *  2. Trusted-origin check — Sperax domains bypass x402 and rate limiting
 *  3. Bot detection — blocks known scrapers/crawlers (curl, wget, python-requests, …)
 *  4. Admin route authentication — bearer-token guard
 *  5. Request size validation — rejects oversized bodies
 *  6. Rate limiting — 60 req/hour per IP for free-tier API routes
 *  7. x402 payment gate — ALL /api/* routes require USDC micropayment (Base)
 *     Exceptions: health/cron/webhooks/admin (always free), /api/news and /api/prices
 *     (rate-limited free tier, returns degraded / limited results)
 *  8. Security + observability headers on all responses
 *
 * Trusted origins (UNLIMITED — no rate limit, no x402):
 *   Exact:     https://sperax.live  |  https://speraxos.vercel.app
 *   Wildcard:  *.sperax.chat  |  *.sperax.io  (and their apex domains)
 *
 * @see https://x402.org
 */

import { NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { paymentProxyFromConfig } from '@x402/next';
import type { RouteConfig } from '@x402/next';
import { routing } from './src/i18n/navigation';

// =============================================================================
// INTERNATIONALISATION
// =============================================================================

const intlMiddleware = createMiddleware(routing);

// =============================================================================
// x402 PAYMENT GATE
// =============================================================================

const RECEIVE_ADDRESS =
  (process.env.X402_RECEIVE_ADDRESS as `0x${string}`) ??
  '0x40252CFDF8B20Ed757D61ff157719F33Ec332402';

const NETWORK = (process.env.X402_NETWORK ?? 'eip155:8453') as never;

const apiRoutes: Record<string, RouteConfig> = {
  '/api/:path*': {
    accepts: [
      {
        scheme: 'exact',
        payTo: RECEIVE_ADDRESS,
        price: '$0.001',
        network: NETWORK,
      },
    ],
    description: 'Free Crypto News API — pay per request in USDC on Base',
  },
};

// Lazy-init to avoid RouteConfigurationError during Next.js build (the
// @x402/next SDK validates route schemes eagerly in the constructor, but
// the "exact" EVM scheme is only available at request time).
let _x402: ReturnType<typeof paymentProxyFromConfig> | null = null;
function getX402Proxy() {
  if (!_x402) {
    try {
      _x402 = paymentProxyFromConfig(
        apiRoutes,
        undefined,
        undefined,
        undefined,
        undefined,
        false, // syncFacilitatorOnStart: false — avoids blocking cold starts
      );
    } catch (err) {
      // During build / edge compilation the "exact" EVM scheme is not
      // registered yet, so the SDK throws RouteConfigurationError.
      // Return a pass-through that does nothing; real requests will
      // re-attempt initialization at runtime.
      console.warn('[x402] Proxy init deferred — scheme not yet available:', (err as Error).message);
      return (req: NextRequest) => NextResponse.next();
    }
  }
  return _x402;
}

// =============================================================================
// SPERAXOS — trusted origins get UNLIMITED access and priority routing
// =============================================================================

// Exact-match origins that bypass x402 and rate limiting entirely
const TRUSTED_EXACT_ORIGINS = new Set([
  'https://sperax.live',
  'https://www.sperax.live',
  'https://speraxos.vercel.app',
  // Additional x402-exempt origins from env: X402_BYPASS_ORIGINS=https://a.com,https://b.com
  ...(process.env.X402_BYPASS_ORIGINS?.split(',').map((s) => s.trim()).filter(Boolean) ?? []),
]);

// Apex domains whose subdomains are ALSO trusted: *.sperax.chat and *.sperax.io
const TRUSTED_WILDCARD_DOMAINS = ['sperax.chat', 'sperax.io'];

function isTrustedOrigin(origin: string): boolean {
  if (!origin) return false;
  if (TRUSTED_EXACT_ORIGINS.has(origin)) return true;
  try {
    const host = new URL(origin).hostname;
    return TRUSTED_WILDCARD_DOMAINS.some((d) => host === d || host.endsWith('.' + d));
  } catch {
    return false;
  }
}

function isSperaxOSRequest(request: NextRequest): boolean {
  const origin = request.headers.get('origin') ?? '';
  if (origin && isTrustedOrigin(origin)) return true;

  const referer = request.headers.get('referer') ?? '';
  if (referer) {
    try {
      if (isTrustedOrigin(new URL(referer).origin)) return true;
    } catch {
      // malformed referer — ignore
    }
  }

  const token = request.headers.get('x-speraxos-token') ?? '';
  if (token && process.env.SPERAXOS_API_SECRET && token === process.env.SPERAXOS_API_SECRET) {
    return true;
  }

  return false;
}

// =============================================================================
// API CONFIGURATION
// =============================================================================

// Routes that are free but rate-limited and return degraded / limited results.
// Everything else (not exempt, not free-tier, not a trusted origin) requires x402.
const FREE_TIER_PATTERNS = [
  /^\/api\/news($|\/)/, // /api/news — returns max 3 headlines
  /^\/api\/prices$/,   // /api/prices — returns max 3 coins
  /^\/api\/batch$/,    // /api/batch — combined requests, same per-sub-request limits
];

const EXEMPT_PATTERNS = [
  /^\/api\/health/,
  /^\/api\/\.well-known/,
  /^\/api\/admin/,
  /^\/api\/cron/,
  /^\/api\/webhooks/,
  /^\/api\/sse/,
  /^\/api\/ws/,
  /^\/api\/internal/,   // internal snapshot writer — same-origin only
];

const MAX_BODY_SIZE = 10 * 1024 * 1024;

// Tiered rate limits: API consumers (identified by Accept: application/json,
// X-API-Key header, or a known SDK User-Agent) get a higher quota.
const PUBLIC_RATE_LIMIT   = { requests: 60,  windowMs: 3_600_000 }; // site visitors
const API_CLIENT_RATE_LIMIT = { requests: 300, windowMs: 3_600_000 }; // programmatic API consumers

// Known bad bot patterns (Googlebot intentionally excluded for SEO)
// Note: x402 clients should set a custom User-Agent (e.g. "x402-client/1.0")
const BLOCKED_BOTS =
  /bot|crawler|spider|scraper|wget|curl|python-requests|go-http|java\//i;
const BOT_ALLOWLIST = [
  'Googlebot',
  'Bingbot',
  'Slurp',
  'DuckDuckBot',
  'facebookexternalhit',
  'x402',      // x402 payment clients
  'coinbase',  // Coinbase Wallet SDK
];

// SDK / programmatic client User-Agent patterns
const SDK_UA_PATTERNS = /fcn-sdk|free-crypto-news|axios|node-fetch|undici|python-httpx|guzzle|x402-client/i;

/** Detect whether the caller is a programmatic API consumer vs a browser visitor */
function isApiClient(request: NextRequest): boolean {
  if (request.headers.get('x-api-key')) return true;
  if (request.headers.get('x-batch-request') === '1') return true;
  const accept = request.headers.get('accept') ?? '';
  if (accept.includes('application/json') && !accept.includes('text/html')) return true;
  const ua = request.headers.get('user-agent') ?? '';
  if (SDK_UA_PATTERNS.test(ua)) return true;
  return false;
}

// =============================================================================
// DISTRIBUTED RATE LIMIT (Upstash Redis — scales across all Edge instances)
// =============================================================================
// Falls back to in-memory when UPSTASH_REDIS_REST_URL / KV_REST_API_URL is not set.

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

/**
 * Build either an Upstash-backed or ephemeral (in-memory) rate limiter.
 * Lazy-initialised on first request so that the build step never talks to Redis.
 * Two tiers: one for browser visitors, one (higher) for API consumers.
 */
let _rateLimiter: Ratelimit | null = null;
let _apiRateLimiter: Ratelimit | null = null;

function getRateLimiter(tier: 'public' | 'api' = 'public'): Ratelimit {
  const existing = tier === 'api' ? _apiRateLimiter : _rateLimiter;
  if (existing) return existing;

  const limit = tier === 'api' ? API_CLIENT_RATE_LIMIT : PUBLIC_RATE_LIMIT;
  const prefix = tier === 'api' ? 'mw:rl:api' : 'mw:rl';

  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

  let limiter: Ratelimit;
  if (url && token) {
    // Production: fully distributed, survives deploys and instance recycling
    limiter = new Ratelimit({
      redis: new Redis({ url, token }),
      limiter: Ratelimit.slidingWindow(
        limit.requests,
        `${limit.windowMs}ms`,
      ),
      prefix,
      analytics: true,
      enableProtection: true,
    });
  } else {
    // Dev / self-hosted fallback: ephemeral in-memory only (no Redis needed)
    // Uses a Map-based cache that lives as long as the isolate/process.
    // At scale this means rate limits are per-instance, but that's acceptable
    // for local dev. In production, always set KV_REST_API_URL.
    const ephemeralStore = new Map();
    limiter = new Ratelimit({
      redis: {
        // Minimal Redis-like interface backed by a local Map so that
        // @upstash/ratelimit works without any network calls.
         
        sadd: async () => 1 as any,
        eval: async () => [limit.requests, Math.floor(Date.now() / 1000) + Math.floor(limit.windowMs / 1000)] as any,
        evalsha: async () => [limit.requests, Math.floor(Date.now() / 1000) + Math.floor(limit.windowMs / 1000)] as any,
        scriptLoad: async () => '' as any,
         
      } as unknown as InstanceType<typeof Redis>,
      limiter: Ratelimit.slidingWindow(limit.requests, `${limit.windowMs}ms`),
      prefix,
      ephemeralCache: ephemeralStore,
    });
  }

  if (tier === 'api') {
    _apiRateLimiter = limiter;
  } else {
    _rateLimiter = limiter;
  }
  return limiter;
}

async function checkRateLimit(
  key: string,
  tier: 'public' | 'api' = 'public',
): Promise<{ allowed: boolean; remaining: number; resetAt: number; limit: number }> {
  const limit = tier === 'api' ? API_CLIENT_RATE_LIMIT : PUBLIC_RATE_LIMIT;
  try {
    const limiter = getRateLimiter(tier);
    const { success, remaining, reset } = await limiter.limit(key);
    return { allowed: success, remaining, resetAt: reset, limit: limit.requests };
  } catch {
    // If Redis is down, fail-open to avoid a total outage
    return { allowed: true, remaining: limit.requests, resetAt: Date.now() + limit.windowMs, limit: limit.requests };
  }
}

// =============================================================================
// SECURITY HEADERS
// =============================================================================

const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

// =============================================================================
// HELPERS
// =============================================================================

function matchesPattern(pathname: string, patterns: RegExp[]): boolean {
  return patterns.some((p) => p.test(pathname));
}

function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

// =============================================================================
// MAIN MIDDLEWARE
// =============================================================================

export default async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // ── Non-API routes: internationalisation only ────────────────────────────
  if (!pathname.startsWith('/api/')) {
    return intlMiddleware(request);
  }

  // ── API routes ────────────────────────────────────────────────────────────
  const start = Date.now();
  const requestId = generateRequestId();
  const speraxos = isSperaxOSRequest(request);

  const headers: Record<string, string> = {
    'X-Request-ID': requestId,
    'X-RateLimit-Policy': 'fair-use',
    ...SECURITY_HEADERS,
  };

  if (speraxos) {
    headers['X-Priority'] = 'speraxos';
    headers['X-SperaxOS'] = '1';
    headers['Vary'] = 'Origin';
  }

  // Bot check — x402 clients are explicitly allowed via BOT_ALLOWLIST
  const ua = request.headers.get('user-agent') || '';
  if (
    BLOCKED_BOTS.test(ua) &&
    !BOT_ALLOWLIST.some((allowed) => ua.toLowerCase().includes(allowed.toLowerCase()))
  ) {
    return NextResponse.json(
      { error: 'Forbidden', code: 'BOT_BLOCKED', requestId },
      { status: 403, headers },
    );
  }

  // Admin auth
  if (pathname.startsWith('/api/admin') || pathname.startsWith('/admin')) {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!process.env.ADMIN_TOKEN || token !== process.env.ADMIN_TOKEN) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'ADMIN_AUTH_REQUIRED', requestId },
        { status: 401, headers },
      );
    }
  }

  // Compute once — reused in rate-limiting tier selection AND request-header forwarding below.
  const apiClient = isApiClient(request);

  // Exempt patterns — skip rate limiting / size check
  if (!matchesPattern(pathname, EXEMPT_PATTERNS)) {
    // Size validation
    if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
      const len = request.headers.get('content-length');
      if (len && parseInt(len, 10) > MAX_BODY_SIZE) {
        return NextResponse.json(
          { error: 'Request Entity Too Large', code: 'REQUEST_TOO_LARGE', requestId },
          { status: 413, headers },
        );
      }
    }

    // Rate limiting — SperaxOS is unlimited; free-tier paths are limited.
    // API consumers (identified by Accept/UA/key) get a higher quota.
    if (speraxos) {
      headers['X-RateLimit-Limit'] = 'unlimited';
      headers['X-RateLimit-Remaining'] = 'unlimited';
    } else if (matchesPattern(pathname, FREE_TIER_PATTERNS)) {
      const tier = apiClient ? 'api' : 'public';
      const rl = await checkRateLimit(`${getClientIp(request)}:${pathname}`, tier);
      headers['X-RateLimit-Limit'] = rl.limit.toString();
      headers['X-RateLimit-Remaining'] = rl.remaining.toString();
      headers['X-RateLimit-Reset'] = new Date(rl.resetAt).toISOString();
      headers['X-RateLimit-Tier'] = tier;

      if (!rl.allowed) {
        const retry = Math.ceil((rl.resetAt - Date.now()) / 1000);
        return NextResponse.json(
          { error: 'Rate Limit Exceeded', code: 'RATE_LIMIT_EXCEEDED', retryAfter: retry, tier, requestId },
          { status: 429, headers: { ...headers, 'Retry-After': retry.toString() } },
        );
      }
    }
  }

  // x402 payment gate — ALL /api/* routes require micropayment except:
  //   • EXEMPT_PATTERNS  (health, cron, webhooks, admin, sse, ws)
  //   • FREE_TIER_PATTERNS  (/api/news, /api/prices, /api/batch — rate-limited, degraded)
  //   • Trusted Sperax origins  (bypass entirely)
  if (
    pathname.startsWith('/api/') &&
    !speraxos &&
    !matchesPattern(pathname, EXEMPT_PATTERNS) &&
    !matchesPattern(pathname, FREE_TIER_PATTERNS)
  ) {
    const paymentResponse = await getX402Proxy()(request);
    // NextResponse.next() sets x-middleware-next:1 internally — that means payment verified.
    // Any other response (402, 400, etc.) is returned directly to the client.
    const verified = paymentResponse.headers.get('x-middleware-next') === '1';
    if (!verified) {
      Object.entries(headers).forEach(([k, v]) => paymentResponse.headers.set(k, v));
      paymentResponse.headers.set('X-Response-Time', `${Date.now() - start}ms`);
      return paymentResponse;
    }
  }

  // For free-tier paths, forward X-Free-Tier: 1 so route handlers can degrade results.
  // Also forward X-API-Client: 1 for programmatic consumers so handlers can optimise
  // their response format (e.g. skip HTML-friendly wrappers, enable bulk fields).
  const isFreeTierRequest = !speraxos && matchesPattern(pathname, FREE_TIER_PATTERNS);
  const requestHeaders = new Headers(request.headers);
  if (isFreeTierRequest) requestHeaders.set('x-free-tier', '1');
  if (apiClient) requestHeaders.set('x-api-client', '1');

  const res = NextResponse.next({ request: { headers: requestHeaders } });
  Object.entries(headers).forEach(([k, v]) => res.headers.set(k, v));
  res.headers.set('X-Response-Time', `${Date.now() - start}ms`);

  // Default Cache-Control for API responses that don't set their own.
  // Enables CDN / NGINX proxy_cache to absorb repeat traffic.
  if (pathname.startsWith('/api/') && !res.headers.has('Cache-Control')) {
    res.headers.set(
      'Cache-Control',
      'public, s-maxage=60, stale-while-revalidate=300',
    );
  }

  // Tell downstream CDN caches to vary on the tier marker so API consumers
  // and browser visitors don't share the same edge-cached response.
  res.headers.append('Vary', 'Accept');
  return res;
}

export const config = {
  matcher: [
    '/api/:path*',
    '/',
    '/((?!_next|_vercel|feed\\.xml|.*\\.(?:ico|png|jpg|jpeg|gif|svg|xml|json|txt|js|css|woff|woff2|webp|avif)).*)',
  ],
};
