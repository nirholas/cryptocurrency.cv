/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

/**
 * Middleware Rate Limiting
 *
 * Distributed rate limiting via Upstash Redis with in-memory fallback.
 * Also handles repeat-429 escalation (blocking abusive IPs).
 *
 * @module middleware/rate-limit
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';
import type { MiddlewareContext, MiddlewareHandler } from './types';
import {
  PUBLIC_RATE_LIMIT,
  API_CLIENT_RATE_LIMIT,
  REPEAT_429_THRESHOLD,
  REPEAT_429_WINDOW_MS,
  REPEAT_429_BLOCK_MS,
  FREE_TIER_PATTERNS,
  EXEMPT_PATTERNS,
  MAX_BODY_SIZE,
  TIER_LIMITS,
  REGISTER_RATE_LIMIT,
  matchesPattern,
  findRouteRateLimit,
} from './config';

// =============================================================================
// REPEAT-429 ESCALATION
// =============================================================================

interface RateLimitOffender {
  hits: number[];
  blockedUntil?: number;
}

const offenderMap = new Map<string, RateLimitOffender>();

// In-memory fallback when Redis/Upstash is unavailable
interface FallbackEntry {
  count: number;
  resetAt: number;
}
const inMemoryFallbackMap = new Map<string, FallbackEntry>();

const MAX_OFFENDER_MAP_SIZE = 10_000;
const OFFENDER_PRUNE_INTERVAL = 300_000;
const FALLBACK_PRUNE_INTERVAL = 300_000;
let lastOffenderPrune = Date.now();
let lastFallbackPrune = Date.now();

function pruneFallbackEntries(now: number) {
  if (now - lastFallbackPrune < FALLBACK_PRUNE_INTERVAL) return;
  lastFallbackPrune = now;
  for (const [k, v] of inMemoryFallbackMap) {
    if (v.resetAt <= now) inMemoryFallbackMap.delete(k);
  }
}

function pruneOffenders(now: number) {
  if (now - lastOffenderPrune < OFFENDER_PRUNE_INTERVAL) return;
  lastOffenderPrune = now;
  pruneFallbackEntries(now);
  for (const [ip, entry] of offenderMap) {
    const recentHits = entry.hits.filter((t) => now - t < REPEAT_429_WINDOW_MS);
    if (recentHits.length === 0 && (!entry.blockedUntil || entry.blockedUntil <= now)) {
      offenderMap.delete(ip);
    }
  }
}

/** Record a 429 for an IP and return true if the client should be escalated to 403. */
export function record429(ip: string): boolean {
  const now = Date.now();
  pruneOffenders(now);
  let entry = offenderMap.get(ip);
  if (!entry) {
    if (offenderMap.size >= MAX_OFFENDER_MAP_SIZE) {
      const firstKey = offenderMap.keys().next().value;
      if (firstKey) offenderMap.delete(firstKey);
    }
    entry = { hits: [] };
    offenderMap.set(ip, entry);
  }
  if (entry.blockedUntil && entry.blockedUntil > now) return true;
  entry.hits = entry.hits.filter((t) => now - t < REPEAT_429_WINDOW_MS);
  entry.hits.push(now);
  if (entry.hits.length >= REPEAT_429_THRESHOLD) {
    entry.blockedUntil = now + REPEAT_429_BLOCK_MS;
    entry.hits = [];
    return true;
  }
  return false;
}

/** Check if an IP is currently hard-blocked from repeat 429 escalation. */
export function isRepeat429Blocked(ip: string): number | false {
  const entry = offenderMap.get(ip);
  if (!entry?.blockedUntil) return false;
  const now = Date.now();
  if (entry.blockedUntil > now) return entry.blockedUntil;
  entry.blockedUntil = undefined;
  return false;
}

// =============================================================================
// DISTRIBUTED RATE LIMIT (Upstash Redis)
// =============================================================================

let _rateLimiter: Ratelimit | null = null;
let _apiRateLimiter: Ratelimit | null = null;

function getRedisCredentials() {
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url, token } : null;
}

// In-memory rate limiting — used when Redis/Upstash is not configured
function inMemoryRateCheck(
  key: string,
  maxRequests: number,
  windowMs: number,
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  pruneFallbackEntries(now);
  const entry = inMemoryFallbackMap.get(key);
  if (!entry || entry.resetAt <= now) {
    inMemoryFallbackMap.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, resetAt: now + windowMs };
  }
  entry.count++;
  if (entry.count > maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }
  return { allowed: true, remaining: maxRequests - entry.count, resetAt: entry.resetAt };
}

function getRateLimiter(tier: 'public' | 'api' = 'public'): Ratelimit | null {
  const creds = getRedisCredentials();
  if (!creds) return null; // Use in-memory path instead

  const existing = tier === 'api' ? _apiRateLimiter : _rateLimiter;
  if (existing) return existing;

  const limit = tier === 'api' ? API_CLIENT_RATE_LIMIT : PUBLIC_RATE_LIMIT;
  const prefix = tier === 'api' ? 'mw:rl:api' : 'mw:rl';

  const limiter = new Ratelimit({
    redis: new Redis(creds),
    limiter: Ratelimit.slidingWindow(limit.requests, `${limit.windowMs}ms`),
    prefix,
    analytics: true,
    enableProtection: true,
  });

  if (tier === 'api') _apiRateLimiter = limiter;
  else _rateLimiter = limiter;
  return limiter;
}

export async function checkRateLimit(
  key: string,
  tier: 'public' | 'api' = 'public',
): Promise<{ allowed: boolean; remaining: number; resetAt: number; limit: number }> {
  const limit = tier === 'api' ? API_CLIENT_RATE_LIMIT : PUBLIC_RATE_LIMIT;
  const limiter = getRateLimiter(tier);

  // No Redis configured — use proper in-memory rate limiting
  if (!limiter) {
    const result = inMemoryRateCheck(key, limit.requests, limit.windowMs);
    return { ...result, limit: limit.requests };
  }

  try {
    const { success, remaining, reset } = await limiter.limit(key);
    return { allowed: success, remaining, resetAt: reset, limit: limit.requests };
  } catch {
    // Redis error — conservative in-memory fallback at 50% quota
    const fallbackLimit = Math.max(1, Math.floor(limit.requests * 0.5));
    const result = inMemoryRateCheck(`fallback:${key}`, fallbackLimit, limit.windowMs);
    return { ...result, limit: fallbackLimit };
  }
}

// =============================================================================
// TIER-SPECIFIC RATE LIMITER (for authenticated API keys)
// =============================================================================

const _tierLimiters = new Map<string, Ratelimit>();

function getTierRateLimiter(tier: string, dailyLimit: number): Ratelimit | null {
  const creds = getRedisCredentials();
  if (!creds) return null; // Use in-memory path instead

  const cacheKey = `tier:${tier}:${dailyLimit}`;
  const existing = _tierLimiters.get(cacheKey);
  if (existing) return existing;

  const limiter = new Ratelimit({
    redis: new Redis(creds),
    limiter: Ratelimit.slidingWindow(dailyLimit, '1 d'),
    prefix: `mw:tier:${tier}`,
    analytics: true,
    enableProtection: true,
  });

  _tierLimiters.set(cacheKey, limiter);
  return limiter;
}

export async function checkTierRateLimit(
  keyId: string,
  dailyLimit: number,
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const tierName = dailyLimit >= 500_000 ? 'enterprise' : dailyLimit >= 50_000 ? 'pro' : 'free';
  const limiter = getTierRateLimiter(tierName, dailyLimit);

  // No Redis configured — use proper in-memory rate limiting
  if (!limiter) {
    return inMemoryRateCheck(`tier:${keyId}`, dailyLimit, 86400000);
  }

  try {
    const { success, remaining, reset } = await limiter.limit(keyId);
    return { allowed: success, remaining, resetAt: reset };
  } catch {
    // Redis error — conservative in-memory fallback at 50% quota
    const fallbackLimit = Math.max(1, Math.floor(dailyLimit * 0.5));
    return inMemoryRateCheck(`tier-fallback:${keyId}`, fallbackLimit, 86400000);
  }
}

// =============================================================================
// COMPOSABLE HANDLER
// =============================================================================

/**
 * Middleware handler: all rate limiting — register, body size, tier-aware,
 * free-tier, per-route, and usage tracking.
 */
export const rateLimitHandler: MiddlewareHandler = async (ctx) => {
  if (!ctx.isApiRoute) return ctx;

  const { pathname } = ctx;

  // /api/register rate limit — prevent abuse / key enumeration
  if (pathname === '/api/register' && !ctx.isSperaxOS && !ctx.isTrustedOrigin) {
    const regIp = ctx.clientIp;
    const regRl = await checkRateLimit(`register:${regIp}`, 'public');
    if (regRl.remaining <= 0 || !regRl.allowed) {
      const retry = Math.ceil((regRl.resetAt - Date.now()) / 1000);
      return NextResponse.json(
        {
          error: 'Rate Limit Exceeded',
          code: 'REGISTER_RATE_LIMIT',
          message: `API key registration is limited to ${REGISTER_RATE_LIMIT.requests} requests per hour per IP`,
          retryAfter: retry,
          requestId: ctx.requestId,
        },
        {
          status: 429,
          headers: { ...ctx.headers, 'Retry-After': retry.toString() },
        },
      );
    }
  }

  // Exempt patterns — skip rate limiting / size check
  if (matchesPattern(pathname, EXEMPT_PATTERNS)) return ctx;

  // Body size check
  if (['POST', 'PUT', 'PATCH'].includes(ctx.request.method)) {
    const len = ctx.request.headers.get('content-length');
    if (len && parseInt(len, 10) > MAX_BODY_SIZE) {
      return NextResponse.json(
        {
          error: 'Request Entity Too Large',
          code: 'REQUEST_TOO_LARGE',
          requestId: ctx.requestId,
        },
        { status: 413, headers: ctx.headers },
      );
    }
  }

  // Tier-aware rate limiting
  if (ctx.isSperaxOS || ctx.isTrustedOrigin || ctx.isAlibabaGateway) {
    ctx.headers['X-RateLimit-Limit'] = 'unlimited';
    ctx.headers['X-RateLimit-Remaining'] = 'unlimited';
  } else if (ctx.apiKeyTier && ctx.apiKeyId) {
    const tierLimit = TIER_LIMITS[ctx.apiKeyTier] ?? TIER_LIMITS.free;
    const rl = await checkTierRateLimit(ctx.apiKeyId, tierLimit.daily);
    ctx.headers['X-RateLimit-Limit'] = tierLimit.daily.toString();
    ctx.headers['X-RateLimit-Remaining'] = rl.remaining.toString();
    ctx.headers['X-RateLimit-Reset'] = new Date(rl.resetAt).toISOString();
    ctx.headers['X-RateLimit-Tier'] = ctx.apiKeyTier;
    ctx.headers['X-Key-Tier'] = ctx.apiKeyTier;

    if (!rl.allowed) {
      const retry = Math.ceil((rl.resetAt - Date.now()) / 1000);
      if (record429(ctx.clientIp)) {
        return NextResponse.json(
          {
            error: 'Forbidden',
            code: 'REPEAT_RATE_LIMIT_ABUSE',
            message: 'Too many rate-limited requests. You are temporarily blocked.',
            retryAfter: Math.ceil(REPEAT_429_BLOCK_MS / 1000),
            requestId: ctx.requestId,
          },
          {
            status: 403,
            headers: {
              ...ctx.headers,
              'Retry-After': Math.ceil(REPEAT_429_BLOCK_MS / 1000).toString(),
            },
          },
        );
      }
      return NextResponse.json(
        {
          error: 'Rate Limit Exceeded',
          code: 'RATE_LIMIT_EXCEEDED',
          tier: ctx.apiKeyTier,
          limit: tierLimit.daily,
          retryAfter: retry,
          upgrade:
            ctx.apiKeyTier === 'free'
              ? 'Upgrade to Pro for 50,000 req/day at /api/keys/upgrade'
              : ctx.apiKeyTier === 'pro'
                ? 'Upgrade to Enterprise for 500,000 req/day'
                : undefined,
          requestId: ctx.requestId,
        },
        {
          status: 429,
          headers: { ...ctx.headers, 'Retry-After': retry.toString() },
        },
      );
    }

    // Usage tracking (fire-and-forget)
    try {
      const creds = getRedisCredentials();
      if (creds) {
        const redis = new Redis(creds);
        const today = new Date().toISOString().split('T')[0];
        const month = today.substring(0, 7);
        const pipe = redis.pipeline();
        pipe.incr(`usage:${ctx.apiKeyId}:${today}`);
        pipe.expire(`usage:${ctx.apiKeyId}:${today}`, 172800);
        pipe.incr(`usage:${ctx.apiKeyId}:${month}`);
        pipe.expire(`usage:${ctx.apiKeyId}:${month}`, 3024000);
        pipe.incr(`usage:${ctx.apiKeyId}:total`);
        pipe.incr(`stats:requests:${today}`);
        pipe.incr(`stats:requests:${month}`);
        pipe.exec().catch(() => {});
      }
    } catch {
      // Usage tracking failure is non-fatal
    }
  } else if (matchesPattern(pathname, FREE_TIER_PATTERNS)) {
    const tier = ctx.isApiClient ? 'api' : 'public';
    const rl = await checkRateLimit(`${ctx.clientIp}:${pathname}`, tier);
    ctx.headers['X-RateLimit-Limit'] = rl.limit.toString();
    ctx.headers['X-RateLimit-Remaining'] = rl.remaining.toString();
    ctx.headers['X-RateLimit-Reset'] = new Date(rl.resetAt).toISOString();
    ctx.headers['X-RateLimit-Tier'] = tier;

    if (!rl.allowed) {
      const retry = Math.ceil((rl.resetAt - Date.now()) / 1000);
      if (record429(ctx.clientIp)) {
        return NextResponse.json(
          {
            error: 'Forbidden',
            code: 'REPEAT_RATE_LIMIT_ABUSE',
            message: 'Too many rate-limited requests. You are temporarily blocked.',
            retryAfter: Math.ceil(REPEAT_429_BLOCK_MS / 1000),
            requestId: ctx.requestId,
          },
          {
            status: 403,
            headers: {
              ...ctx.headers,
              'Retry-After': Math.ceil(REPEAT_429_BLOCK_MS / 1000).toString(),
            },
          },
        );
      }
      return NextResponse.json(
        {
          error: 'Rate Limit Exceeded',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: retry,
          tier,
          requestId: ctx.requestId,
        },
        {
          status: 429,
          headers: { ...ctx.headers, 'Retry-After': retry.toString() },
        },
      );
    }
  }

  // Per-route rate limits for expensive endpoints
  if (!ctx.isSperaxOS && !ctx.isTrustedOrigin && !ctx.isAlibabaGateway) {
    const routeLimit = findRouteRateLimit(pathname);
    if (routeLimit) {
      const routeKey = ctx.apiKeyId
        ? `route:${routeLimit.label}:${ctx.apiKeyId}`
        : `route:${routeLimit.label}:${ctx.clientIp}`;
      const routeRl = await checkRateLimit(routeKey, 'public');
      if (!routeRl.allowed) {
        const retry = Math.ceil((routeRl.resetAt - Date.now()) / 1000);
        return NextResponse.json(
          {
            error: 'Rate Limit Exceeded',
            code: 'ROUTE_RATE_LIMIT',
            message: `This endpoint is limited to ${routeLimit.requests} requests per minute`,
            endpoint: routeLimit.label,
            retryAfter: retry,
            requestId: ctx.requestId,
          },
          {
            status: 429,
            headers: { ...ctx.headers, 'Retry-After': retry.toString() },
          },
        );
      }
    }
  }

  return ctx;
};
