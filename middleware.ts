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

const x402 = paymentProxyFromConfig(
  apiRoutes,
  undefined,
  undefined,
  undefined,
  undefined,
  false, // syncFacilitatorOnStart: false — avoids blocking cold starts
);

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
];

const EXEMPT_PATTERNS = [
  /^\/api\/health/,
  /^\/api\/\.well-known/,
  /^\/api\/admin/,
  /^\/api\/cron/,
  /^\/api\/webhooks/,
  /^\/api\/sse/,
  /^\/api\/ws/,
];

const MAX_BODY_SIZE = 10 * 1024 * 1024;
const PUBLIC_RATE_LIMIT = { requests: 60, windowMs: 3_600_000 };

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

// =============================================================================
// IN-MEMORY RATE LIMIT (Edge-compatible)
// =============================================================================

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now >= entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + PUBLIC_RATE_LIMIT.windowMs });
    return { allowed: true, remaining: PUBLIC_RATE_LIMIT.requests - 1, resetAt: now + PUBLIC_RATE_LIMIT.windowMs };
  }

  if (entry.count >= PUBLIC_RATE_LIMIT.requests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { allowed: true, remaining: PUBLIC_RATE_LIMIT.requests - entry.count, resetAt: entry.resetAt };
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

    // Rate limiting — SperaxOS is unlimited; free-tier paths are limited
    if (speraxos) {
      headers['X-RateLimit-Limit'] = 'unlimited';
      headers['X-RateLimit-Remaining'] = 'unlimited';
    } else if (matchesPattern(pathname, FREE_TIER_PATTERNS)) {
      const rl = checkRateLimit(`${getClientIp(request)}:${pathname}`);
      headers['X-RateLimit-Limit'] = PUBLIC_RATE_LIMIT.requests.toString();
      headers['X-RateLimit-Remaining'] = rl.remaining.toString();
      headers['X-RateLimit-Reset'] = new Date(rl.resetAt).toISOString();

      if (!rl.allowed) {
        const retry = Math.ceil((rl.resetAt - Date.now()) / 1000);
        return NextResponse.json(
          { error: 'Rate Limit Exceeded', code: 'RATE_LIMIT_EXCEEDED', retryAfter: retry, requestId },
          { status: 429, headers: { ...headers, 'Retry-After': retry.toString() } },
        );
      }
    }
  }

  // x402 payment gate — ALL /api/* routes require micropayment except:
  //   • EXEMPT_PATTERNS  (health, cron, webhooks, admin, sse, ws)
  //   • FREE_TIER_PATTERNS  (/api/news, /api/prices — rate-limited, degraded)
  //   • Trusted Sperax origins  (bypass entirely)
  if (
    pathname.startsWith('/api/') &&
    !speraxos &&
    !matchesPattern(pathname, EXEMPT_PATTERNS) &&
    !matchesPattern(pathname, FREE_TIER_PATTERNS)
  ) {
    const paymentResponse = await x402(request);
    // NextResponse.next() sets x-middleware-next:1 internally — that means payment verified.
    // Any other response (402, 400, etc.) is returned directly to the client.
    const verified = paymentResponse.headers.get('x-middleware-next') === '1';
    if (!verified) {
      Object.entries(headers).forEach(([k, v]) => paymentResponse.headers.set(k, v));
      paymentResponse.headers.set('X-Response-Time', `${Date.now() - start}ms`);
      return paymentResponse;
    }
  }

  // For free-tier paths, forward X-Free-Tier: 1 so route handlers can degrade results
  const isFreeTierRequest = !speraxos && matchesPattern(pathname, FREE_TIER_PATTERNS);
  const requestHeaders = new Headers(request.headers);
  if (isFreeTierRequest) requestHeaders.set('x-free-tier', '1');

  const res = NextResponse.next({ request: { headers: requestHeaders } });
  Object.entries(headers).forEach(([k, v]) => res.headers.set(k, v));
  res.headers.set('X-Response-Time', `${Date.now() - start}ms`);
  return res;
}

export const config = {
  matcher: [
    '/api/:path*',
    '/',
    '/((?!_next|_vercel|feed\\.xml|.*\\.(?:ico|png|jpg|jpeg|gif|svg|xml|json|txt|js|css|woff|woff2|webp|avif)).*)',
  ],
};
