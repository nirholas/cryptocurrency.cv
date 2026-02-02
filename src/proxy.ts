/**
 * Combined Proxy for Next.js 16+
 * 
 * Handles:
 * - Internationalization (locale detection and routing)
 * - Rate limiting for free tier API endpoints
 * - Request size validation
 * - Security headers
 * - Request ID generation
 * 
 * @note Next.js 16 uses "proxy.ts" instead of "middleware.ts"
 * @see https://nextjs.org/docs/messages/middleware-to-proxy
 */

import { NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/navigation';

// =============================================================================
// INTERNATIONALIZATION
// =============================================================================

const intlMiddleware = createMiddleware(routing);

// =============================================================================
// API CONFIGURATION
// =============================================================================

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
  /^\/api\/tags/,
  /^\/api\/search/,
  /^\/api\/sentiment/,
  /^\/api\/regulatory/,
  /^\/api\/archive/,
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
const RATE_LIMIT = { requests: 100, windowMs: 3600000 };

// =============================================================================
// IN-MEMORY RATE LIMIT (Edge-compatible)
// =============================================================================

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimitInMemory(key: string): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  
  if (!entry || now >= entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT.windowMs });
    return { allowed: true, remaining: RATE_LIMIT.requests - 1, resetAt: now + RATE_LIMIT.windowMs };
  }
  
  if (entry.count >= RATE_LIMIT.requests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }
  
  entry.count++;
  return { allowed: true, remaining: RATE_LIMIT.requests - entry.count, resetAt: entry.resetAt };
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
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
         request.headers.get('x-real-ip') ||
         'unknown';
}

// =============================================================================
// API HANDLER
// =============================================================================

async function handleApiRequest(request: NextRequest): Promise<NextResponse> {
  const start = Date.now();
  const pathname = request.nextUrl.pathname;
  const requestId = generateRequestId();

  // Create response headers
  const headers: Record<string, string> = {
    'X-Request-ID': requestId,
    ...SECURITY_HEADERS,
  };

  if (matchesPattern(pathname, EXEMPT_PATTERNS)) {
    const res = NextResponse.next();
    Object.entries(headers).forEach(([k, v]) => res.headers.set(k, v));
    res.headers.set('X-Response-Time', `${Date.now() - start}ms`);
    return res;
  }

  // Size validation
  if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
    const len = request.headers.get('content-length');
    if (len && parseInt(len, 10) > MAX_BODY_SIZE) {
      return NextResponse.json(
        { error: 'Request Entity Too Large', code: 'REQUEST_TOO_LARGE', requestId },
        { status: 413, headers }
      );
    }
  }

  // Rate limiting for free tier
  if (matchesPattern(pathname, FREE_TIER_PATTERNS)) {
    const clientIp = getClientIp(request);
    const rl = checkRateLimitInMemory(`${clientIp}:${pathname}`);
    
    headers['X-RateLimit-Limit'] = RATE_LIMIT.requests.toString();
    headers['X-RateLimit-Remaining'] = rl.remaining.toString();
    headers['X-RateLimit-Reset'] = new Date(rl.resetAt).toISOString();

    if (!rl.allowed) {
      const retry = Math.ceil((rl.resetAt - Date.now()) / 1000);
      return NextResponse.json(
        { error: 'Rate Limit Exceeded', code: 'RATE_LIMIT_EXCEEDED', retryAfter: retry, requestId },
        { status: 429, headers: { ...headers, 'Retry-After': retry.toString() } }
      );
    }
  }

  const res = NextResponse.next();
  Object.entries(headers).forEach(([k, v]) => res.headers.set(k, v));
  res.headers.set('X-Response-Time', `${Date.now() - start}ms`);
  return res;
}

// =============================================================================
// PROXY FUNCTION
// =============================================================================

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // API routes: rate limiting + security headers
  if (pathname.startsWith('/api/')) {
    return handleApiRequest(request);
  }
  
  // All other routes: i18n
  return intlMiddleware(request);
}

export const config = {
  matcher: [
    '/api/:path*',
    '/',
    '/((?!_next|_vercel|feed\\.xml|.*\\.(?:ico|png|jpg|jpeg|gif|svg|xml|json|txt|js|css|woff|woff2|webp|avif)).*)',
  ],
};
