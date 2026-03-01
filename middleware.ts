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
  /^\/api\/register$/,  // API key registration — must be free
  /^\/api\/keys\//,     // Key management (usage, rotate, upgrade) — auth via key itself
];

const MAX_BODY_SIZE = 10 * 1024 * 1024;

// Tiered rate limits: API consumers (identified by Accept: application/json,
// X-API-Key header, or a known SDK User-Agent) get a higher quota.
const PUBLIC_RATE_LIMIT   = { requests: 60,  windowMs: 3_600_000 }; // site visitors
const API_CLIENT_RATE_LIMIT = { requests: 300, windowMs: 3_600_000 }; // programmatic API consumers

// Known bad bot patterns (Googlebot intentionally excluded for SEO)
// Note: x402 clients should set a custom User-Agent (e.g. "x402-client/1.0")
const BLOCKED_BOTS =
  /bot|crawler|spider|scraper|wget|curl|python-requests|aiohttp|go-http|java\/|alphahunter/i;
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

// ── Repeat-429 escalation ─────────────────────────────────────────────────
// Track IPs that repeatedly get rate-limited (429).  After N 429s in a
// rolling window the client is escalated to a hard 403 block for a longer
// cooldown.  This defends against abusive scrapers that ignore Retry-After.
const REPEAT_429_THRESHOLD = 10;           // 429 responses before escalation
const REPEAT_429_WINDOW_MS = 600_000;      // 10-minute rolling window
const REPEAT_429_BLOCK_MS  = 3_600_000;    // 1-hour hard block after escalation

interface RateLimitOffender {
  /** Timestamps of 429 responses inside the current window */
  hits: number[];
  /** If set, the IP is hard-blocked until this timestamp */
  blockedUntil?: number;
}

const offenderMap = new Map<string, RateLimitOffender>();

/** Prune stale entries every 5 minutes to avoid unbounded memory growth. */
const OFFENDER_PRUNE_INTERVAL = 300_000;
let lastOffenderPrune = Date.now();

function pruneOffenders(now: number) {
  if (now - lastOffenderPrune < OFFENDER_PRUNE_INTERVAL) return;
  lastOffenderPrune = now;
  for (const [ip, entry] of offenderMap) {
    // Remove entries whose block has expired and have no recent hits
    const recentHits = entry.hits.filter((t) => now - t < REPEAT_429_WINDOW_MS);
    if (recentHits.length === 0 && (!entry.blockedUntil || entry.blockedUntil <= now)) {
      offenderMap.delete(ip);
    }
  }
}

/** Record a 429 for an IP and return true if the client should be escalated to 403. */
function record429(ip: string): boolean {
  const now = Date.now();
  pruneOffenders(now);
  let entry = offenderMap.get(ip);
  if (!entry) {
    entry = { hits: [] };
    offenderMap.set(ip, entry);
  }
  // Already hard-blocked?
  if (entry.blockedUntil && entry.blockedUntil > now) return true;
  // Slide the window
  entry.hits = entry.hits.filter((t) => now - t < REPEAT_429_WINDOW_MS);
  entry.hits.push(now);
  if (entry.hits.length >= REPEAT_429_THRESHOLD) {
    entry.blockedUntil = now + REPEAT_429_BLOCK_MS;
    entry.hits = []; // reset hits once blocked
    return true;
  }
  return false;
}

/** Check if an IP is currently hard-blocked from repeat 429 escalation. */
function isRepeat429Blocked(ip: string): number | false {
  const entry = offenderMap.get(ip);
  if (!entry?.blockedUntil) return false;
  const now = Date.now();
  if (entry.blockedUntil > now) return entry.blockedUntil;
  // Block expired — clean up
  entry.blockedUntil = undefined;
  return false;
}

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

// ============================================================================
// API KEY TIER RATE LIMITS (from pricing.ts single source of truth)
// ============================================================================

/**
 * Tier rate limits applied when a valid API key is present.
 * These override the default public/api-client limits.
 *
 *   free:       1,000 req/day, 3 results per response, no AI endpoints
 *   pro:       50,000 req/day, full results, AI access, webhook support
 *   enterprise: 500,000 req/day, priority routing, dedicated cache, SLA
 *
 * The canonical source is API_TIERS in src/lib/x402/pricing.ts.
 * We duplicate the numbers here to avoid importing heavy modules
 * in the Edge middleware (keeps cold starts fast).
 */
const TIER_LIMITS: Record<string, { daily: number; perMinute: number }> = {
  free:       { daily: 1_000,   perMinute: 20 },
  pro:        { daily: 50_000,  perMinute: 500 },
  enterprise: { daily: 500_000, perMinute: 2_000 },
};

/** Endpoints that require pro or enterprise tier (AI, premium) */
const AI_ENDPOINT_PATTERNS = [
  /^\/api\/premium\/ai\//,
  /^\/api\/v1\/ai\//,
  /^\/api\/premium\/whales\//,
  /^\/api\/premium\/smart-money/,
  /^\/api\/premium\/stream\//,
  /^\/api\/premium\/ws\//,
  /^\/api\/premium\/export\//,
  /^\/api\/premium\/analytics\//,
];

/** Max results a free-tier key may receive (route handlers check x-tier-max-results) */
const FREE_TIER_MAX_RESULTS = 3;

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
// TIER-SPECIFIC RATE LIMITER (for authenticated API keys)
// =============================================================================

const _tierLimiters = new Map<string, Ratelimit>();

function getTierRateLimiter(tier: string, dailyLimit: number): Ratelimit {
  const cacheKey = `tier:${tier}:${dailyLimit}`;
  const existing = _tierLimiters.get(cacheKey);
  if (existing) return existing;

  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

  let limiter: Ratelimit;
  if (url && token) {
    limiter = new Ratelimit({
      redis: new Redis({ url, token }),
      limiter: Ratelimit.slidingWindow(dailyLimit, '1 d'),
      prefix: `mw:tier:${tier}`,
      analytics: true,
      enableProtection: true,
    });
  } else {
    // Dev fallback
    const ephemeralStore = new Map();
    limiter = new Ratelimit({
      redis: {
        sadd: async () => 1 as any,
        eval: async () => [dailyLimit, Math.floor(Date.now() / 1000) + 86400] as any,
        evalsha: async () => [dailyLimit, Math.floor(Date.now() / 1000) + 86400] as any,
        scriptLoad: async () => '' as any,
      } as unknown as InstanceType<typeof Redis>,
      limiter: Ratelimit.slidingWindow(dailyLimit, '1 d'),
      prefix: `mw:tier:${tier}`,
      ephemeralCache: ephemeralStore,
    });
  }

  _tierLimiters.set(cacheKey, limiter);
  return limiter;
}

async function checkTierRateLimit(
  keyId: string,
  dailyLimit: number,
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  // Determine tier name from the limit
  const tierName = dailyLimit >= 500_000 ? 'enterprise' : dailyLimit >= 50_000 ? 'pro' : 'free';
  try {
    const limiter = getTierRateLimiter(tierName, dailyLimit);
    const { success, remaining, reset } = await limiter.limit(keyId);
    return { allowed: success, remaining, resetAt: reset };
  } catch {
    // Fail-open
    return { allowed: true, remaining: dailyLimit, resetAt: Date.now() + 86400000 };
  }
}

// =============================================================================
// SECURITY HEADERS
// =============================================================================

const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
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

  // Repeat-429 escalation — hard-block IPs that ignore rate limits
  const clientIpForEscalation = getClientIp(request);
  const blockedUntil = isRepeat429Blocked(clientIpForEscalation);
  if (blockedUntil) {
    const retryEsc = Math.ceil((blockedUntil - Date.now()) / 1000);
    return NextResponse.json(
      {
        error: 'Forbidden',
        code: 'REPEAT_RATE_LIMIT_ABUSE',
        message: 'Too many rate-limited requests. You are temporarily blocked.',
        retryAfter: retryEsc,
        requestId,
      },
      { status: 403, headers: { ...headers, 'Retry-After': retryEsc.toString() } },
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

  // ── API Key tier detection ────────────────────────────────────────────────
  // If the caller presents a valid cda_* API key, we resolve their tier and
  // apply the appropriate rate limit instead of the default public/api limit.
  // Key validation is lightweight (SHA-256 + single KV GET at the edge).
  const apiKeyRaw = request.headers.get('x-api-key')
    || request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || null;

  let resolvedTier: 'free' | 'pro' | 'enterprise' | null = null;
  let resolvedKeyId: string | null = null;

  if (apiKeyRaw && apiKeyRaw.startsWith('cda_')) {
    // Determine tier from prefix without going to KV — fast path
    if (apiKeyRaw.startsWith('cda_ent_')) resolvedTier = 'enterprise';
    else if (apiKeyRaw.startsWith('cda_pro_')) resolvedTier = 'pro';
    else resolvedTier = 'free';

    // We'll do a lightweight KV lookup to validate + get keyId
    // We use the Redis client directly (already initialized for rate limiting)
    // If KV is unavailable, trust the prefix but mark it unverified.
    try {
      const msgBuffer = new TextEncoder().encode(apiKeyRaw);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      const hashHex = Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');

      const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
      const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

      if (url && token) {
        const redis = new Redis({ url, token });
        const keyData = await redis.get<{
          id: string;
          tier: 'free' | 'pro' | 'enterprise';
          active: boolean;
          email: string;
        }>(`apikey:${hashHex}`);

        if (keyData && keyData.active) {
          resolvedTier = keyData.tier;
          resolvedKeyId = keyData.id;
        } else if (keyData && !keyData.active) {
          // Revoked key
          return NextResponse.json(
            { error: 'API key revoked', code: 'KEY_REVOKED', requestId },
            { status: 401, headers },
          );
        }
        // If keyData is null, key not found — fallback to anonymous
        if (!keyData) {
          resolvedTier = null;
        }
      }
    } catch {
      // KV lookup failed — trust the prefix tier but mark unverified
      // This is the fail-open approach
    }
  }

  // ── AI endpoint gating ─────────────────────────────────────────────────
  // Free-tier keys cannot access AI/premium endpoints
  if (
    resolvedTier === 'free' &&
    matchesPattern(pathname, AI_ENDPOINT_PATTERNS) &&
    !speraxos
  ) {
    return NextResponse.json(
      {
        error: 'Upgrade required',
        code: 'TIER_INSUFFICIENT',
        message: 'AI and premium endpoints require a Pro or Enterprise API key',
        currentTier: 'free',
        requiredTier: 'pro',
        upgrade: '/api/keys/upgrade',
        requestId,
      },
      { status: 403, headers },
    );
  }

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

    // ── Tier-aware rate limiting ──────────────────────────────────────────
    if (speraxos) {
      headers['X-RateLimit-Limit'] = 'unlimited';
      headers['X-RateLimit-Remaining'] = 'unlimited';
    } else if (resolvedTier && resolvedKeyId) {
      // Authenticated API key — apply tier-specific rate limit
      const tierLimit = TIER_LIMITS[resolvedTier] ?? TIER_LIMITS.free;
      const rl = await checkTierRateLimit(resolvedKeyId, tierLimit.daily);
      headers['X-RateLimit-Limit'] = tierLimit.daily.toString();
      headers['X-RateLimit-Remaining'] = rl.remaining.toString();
      headers['X-RateLimit-Reset'] = new Date(rl.resetAt).toISOString();
      headers['X-RateLimit-Tier'] = resolvedTier;
      headers['X-Key-Tier'] = resolvedTier;

      if (!rl.allowed) {
        const retry = Math.ceil((rl.resetAt - Date.now()) / 1000);
        // Escalate to 403 if this IP keeps ignoring 429s
        if (record429(clientIpForEscalation)) {
          return NextResponse.json(
            {
              error: 'Forbidden',
              code: 'REPEAT_RATE_LIMIT_ABUSE',
              message: 'Too many rate-limited requests. You are temporarily blocked.',
              retryAfter: Math.ceil(REPEAT_429_BLOCK_MS / 1000),
              requestId,
            },
            { status: 403, headers: { ...headers, 'Retry-After': Math.ceil(REPEAT_429_BLOCK_MS / 1000).toString() } },
          );
        }
        return NextResponse.json(
          {
            error: 'Rate Limit Exceeded',
            code: 'RATE_LIMIT_EXCEEDED',
            tier: resolvedTier,
            limit: tierLimit.daily,
            retryAfter: retry,
            upgrade: resolvedTier === 'free'
              ? 'Upgrade to Pro for 50,000 req/day at /api/keys/upgrade'
              : resolvedTier === 'pro'
                ? 'Upgrade to Enterprise for 500,000 req/day'
                : undefined,
            requestId,
          },
          { status: 429, headers: { ...headers, 'Retry-After': retry.toString() } },
        );
      }

      // ── Usage tracking ──────────────────────────────────────────────────
      // Increment daily counter in KV (non-blocking, fire-and-forget)
      try {
        const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
        const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
        if (url && token) {
          const redis = new Redis({ url, token });
          const today = new Date().toISOString().split('T')[0];
          const month = today.substring(0, 7);
          // Fire-and-forget pipeline: daily, monthly, total
          const pipe = redis.pipeline();
          pipe.incr(`usage:${resolvedKeyId}:${today}`);
          pipe.expire(`usage:${resolvedKeyId}:${today}`, 172800); // 48h
          pipe.incr(`usage:${resolvedKeyId}:${month}`);
          pipe.expire(`usage:${resolvedKeyId}:${month}`, 3024000); // 35d
          pipe.incr(`usage:${resolvedKeyId}:total`);
          // Track global revenue counters for admin dashboard
          pipe.incr(`stats:requests:${today}`);
          pipe.incr(`stats:requests:${month}`);
          pipe.exec().catch(() => {}); // fire-and-forget
        }
      } catch {
        // Usage tracking failure is non-fatal
      }
    } else if (matchesPattern(pathname, FREE_TIER_PATTERNS)) {
      // No API key — anonymous IP-based rate limit for free-tier paths
      const tier = apiClient ? 'api' : 'public';
      const rl = await checkRateLimit(`${getClientIp(request)}:${pathname}`, tier);
      headers['X-RateLimit-Limit'] = rl.limit.toString();
      headers['X-RateLimit-Remaining'] = rl.remaining.toString();
      headers['X-RateLimit-Reset'] = new Date(rl.resetAt).toISOString();
      headers['X-RateLimit-Tier'] = tier;

      if (!rl.allowed) {
        const retry = Math.ceil((rl.resetAt - Date.now()) / 1000);
        // Escalate to 403 if this IP keeps ignoring 429s
        if (record429(clientIpForEscalation)) {
          return NextResponse.json(
            {
              error: 'Forbidden',
              code: 'REPEAT_RATE_LIMIT_ABUSE',
              message: 'Too many rate-limited requests. You are temporarily blocked.',
              retryAfter: Math.ceil(REPEAT_429_BLOCK_MS / 1000),
              requestId,
            },
            { status: 403, headers: { ...headers, 'Retry-After': Math.ceil(REPEAT_429_BLOCK_MS / 1000).toString() } },
          );
        }
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
  //   • Requests with a valid API key (they already paid via subscription)
  if (
    pathname.startsWith('/api/') &&
    !speraxos &&
    !resolvedKeyId &&
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
  const isFreeTierRequest = !speraxos && matchesPattern(pathname, FREE_TIER_PATTERNS) && !resolvedKeyId;
  const requestHeaders = new Headers(request.headers);
  if (isFreeTierRequest) requestHeaders.set('x-free-tier', '1');
  if (apiClient) requestHeaders.set('x-api-client', '1');

  // Forward tier metadata to route handlers
  if (resolvedTier) {
    requestHeaders.set('x-key-tier', resolvedTier);
    requestHeaders.set('x-key-id', resolvedKeyId || '');
    // Free tier: cap results at 3 per response
    if (resolvedTier === 'free') {
      requestHeaders.set('x-free-tier', '1');
      requestHeaders.set('x-tier-max-results', FREE_TIER_MAX_RESULTS.toString());
    }
    // Enterprise: priority routing + dedicated cache
    if (resolvedTier === 'enterprise') {
      requestHeaders.set('x-priority', 'enterprise');
      headers['X-Priority'] = 'enterprise';
    }
  }

  const res = NextResponse.next({ request: { headers: requestHeaders } });
  Object.entries(headers).forEach(([k, v]) => res.headers.set(k, v));
  res.headers.set('X-Response-Time', `${Date.now() - start}ms`);

  // Default Cache-Control for API responses that don't set their own.
  // Enables CDN / NGINX proxy_cache to absorb repeat traffic.
  // Enterprise tier gets a dedicated cache with longer TTL.
  if (pathname.startsWith('/api/') && !res.headers.has('Cache-Control')) {
    if (resolvedTier === 'enterprise') {
      res.headers.set(
        'Cache-Control',
        'private, s-maxage=30, stale-while-revalidate=120',
      );
      res.headers.set('X-Cache-Tier', 'enterprise');
    } else {
      res.headers.set(
        'Cache-Control',
        'public, s-maxage=60, stale-while-revalidate=300',
      );
    }
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
