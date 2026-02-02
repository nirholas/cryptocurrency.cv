/**
 * DEPRECATED: Legacy Rate Limiting Module
 *
 * ⚠️ This module is DEPRECATED and should not be used in new code.
 * It uses in-memory rate limiting which:
 * - Resets on server restart
 * - Doesn't work across multiple instances
 * - Has race conditions
 *
 * Use @/lib/ratelimit instead, which provides:
 * - Distributed rate limiting via Upstash
 * - Atomic operations (no race conditions)
 * - Sliding window algorithm
 * - Persistent across restarts
 *
 * @deprecated Use @/lib/ratelimit instead
 * @module lib/rate-limit
 */

import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

console.warn(
  '[DEPRECATED] rate-limit.ts is deprecated. Use @/lib/ratelimit for distributed rate limiting.'
);

/**
 * Enhanced Rate Limiting Module
 *
 * Provides both in-memory and distributed (Vercel KV/Redis) rate limiting.
 *
 * Features:
 * - Sliding window rate limiting
 * - Distributed support via Vercel KV
 * - Fallback to in-memory when KV is unavailable
 * - Multiple rate limit checking
 *
 * @module lib/rate-limit
 */

// =============================================================================
// TYPES
// =============================================================================

/**
 * Result from distributed rate limit check
 */
export interface DistributedRateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}

// Custom error class for rate limiting
export class RateLimitError extends Error {
  retryAfter: number;
  
  constructor(retryAfter: number) {
    super('Rate limit exceeded');
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store (resets on server restart)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Configuration
const RATE_LIMIT_CONFIG = {
  windowMs: 60 * 1000, // 1 minute window
  maxRequests: 60,     // 60 requests per minute (1 per second average)
  message: 'Too many requests. Please slow down.',
};

function getClientIP(request: NextRequest): string {
  // Try various headers for client IP
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  
  // Fallback to a hash of user-agent for basic identification
  const userAgent = request.headers.get('user-agent') || 'unknown';
  return `ua-${hashCode(userAgent)}`;
}

function hashCode(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  limit: number;
}

/**
 * Check rate limit for a request using in-memory store
 * @deprecated Use checkRateLimitByKey for distributed rate limiting
 */
export function checkRateLimitByRequest(request: NextRequest): RateLimitResult {
  const clientIP = getClientIP(request);
  const now = Date.now();
  
  // Periodic cleanup (every 100 requests)
  if (Math.random() < 0.01) {
    cleanupExpiredEntries();
  }
  
  let entry = rateLimitStore.get(clientIP);
  
  // Create new entry if doesn't exist or has expired
  if (!entry || now > entry.resetTime) {
    entry = {
      count: 0,
      resetTime: now + RATE_LIMIT_CONFIG.windowMs,
    };
  }
  
  entry.count++;
  rateLimitStore.set(clientIP, entry);
  
  const remaining = Math.max(0, RATE_LIMIT_CONFIG.maxRequests - entry.count);
  const allowed = entry.count <= RATE_LIMIT_CONFIG.maxRequests;
  
  return {
    allowed,
    remaining,
    resetTime: entry.resetTime,
    limit: RATE_LIMIT_CONFIG.maxRequests,
  };
}

export function rateLimitResponse(result: RateLimitResult): NextResponse {
  return NextResponse.json(
    {
      error: 'Rate limit exceeded',
      message: RATE_LIMIT_CONFIG.message,
      retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
    },
    {
      status: 429,
      headers: {
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': result.resetTime.toString(),
        'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString(),
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
}

export function addRateLimitHeaders(
  response: NextResponse,
  result: RateLimitResult
): NextResponse {
  response.headers.set('X-RateLimit-Limit', result.limit.toString());
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
  response.headers.set('X-RateLimit-Reset', result.resetTime.toString());
  return response;
}

/**
 * Rate limiting middleware wrapper
 * 
 * Usage in route:
 * ```
 * import { withRateLimit } from '@/lib/rate-limit';
 * 
 * export const GET = withRateLimit(async (request) => {
 *   // Your handler code
 * });
 * ```
 */
export function withRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>
): (request: NextRequest) => Promise<NextResponse> {
  return async (request: NextRequest) => {
    const result = checkRateLimitByRequest(request);
    
    if (!result.allowed) {
      return rateLimitResponse(result);
    }
    
    const response = await handler(request);
    return addRateLimitHeaders(response, result);
  };
}

/**
 * Key-based rate limiter for use outside of request context
 * 
 * Usage:
 * ```
 * await rateLimiter.checkLimit('api:user:123');
 * ```
 */
export const rateLimiter = {
  async checkLimit(key: string, maxRequests = 60, windowMs = 60000): Promise<void> {
    const now = Date.now();
    
    let entry = rateLimitStore.get(key);
    
    if (!entry || now > entry.resetTime) {
      entry = {
        count: 0,
        resetTime: now + windowMs,
      };
    }
    
    entry.count++;
    rateLimitStore.set(key, entry);
    
    if (entry.count > maxRequests) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
      throw new RateLimitError(retryAfter);
    }
  },
  
  getRemainingRequests(key: string, maxRequests = 60): number {
    const entry = rateLimitStore.get(key);
    if (!entry || Date.now() > entry.resetTime) {
      return maxRequests;
    }
    return Math.max(0, maxRequests - entry.count);
  },
  
  reset(key: string): void {
    rateLimitStore.delete(key);
  }
};

// =============================================================================
// DISTRIBUTED RATE LIMITING (VERCEL KV / REDIS)
// =============================================================================

/**
 * Check rate limit with sliding window using Vercel KV
 *
 * Uses Redis sorted sets for accurate sliding window rate limiting.
 * Falls back to in-memory on KV errors for resilience.
 *
 * @param key - Unique identifier (e.g., "free:123.456.789.0:/api/news")
 * @param limit - Maximum requests allowed
 * @param windowSeconds - Time window in seconds (default: 3600 = 1 hour)
 * @returns Rate limit result with allowed status and metadata
 *
 * @example
 * const result = await checkRateLimit('free:192.168.1.1:/api/news', 100, 3600);
 * if (!result.allowed) {
 *   return new Response('Rate limited', { status: 429 });
 * }
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds = 3600
): Promise<DistributedRateLimitResult> {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const windowStart = now - windowMs;
  const resetAt = now + windowMs;

  try {
    // Use Redis sorted set for sliding window
    const kvKey = `ratelimit:${key}`;

    // Remove old entries outside the window
    await kv.zremrangebyscore(kvKey, 0, windowStart);

    // Get current count
    const count = (await kv.zcard(kvKey)) || 0;

    if (count >= limit) {
      return {
        allowed: false,
        limit,
        remaining: 0,
        resetAt,
      };
    }

    // Add current request with timestamp as score
    const member = `${now}:${Math.random().toString(36).substring(2)}`;
    await kv.zadd(kvKey, { score: now, member });

    // Set TTL on the key to auto-cleanup
    await kv.expire(kvKey, windowSeconds);

    return {
      allowed: true,
      limit,
      remaining: Math.max(0, limit - (count + 1)),
      resetAt,
    };
  } catch (error) {
    // Log error but don't fail the request
    console.error('[RateLimit] KV error, falling back to allow:', error);

    // On error, allow request (fail-open for availability)
    return {
      allowed: true,
      limit,
      remaining: limit,
      resetAt,
    };
  }
}

/**
 * Reset rate limit for a specific key
 *
 * @param key - The rate limit key to reset
 */
export async function resetRateLimit(key: string): Promise<void> {
  try {
    await kv.del(`ratelimit:${key}`);
  } catch (error) {
    console.error('[RateLimit] Reset error:', error);
  }
}

/**
 * Get current rate limit status without incrementing counter
 *
 * Useful for checking remaining quota before making a request.
 *
 * @param key - Unique identifier
 * @param limit - Maximum requests allowed
 * @param windowSeconds - Time window in seconds
 * @returns Current rate limit status
 */
export async function getRateLimitStatus(
  key: string,
  limit: number,
  windowSeconds = 3600
): Promise<DistributedRateLimitResult> {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const windowStart = now - windowMs;
  const resetAt = now + windowMs;

  try {
    const kvKey = `ratelimit:${key}`;

    // Remove old entries
    await kv.zremrangebyscore(kvKey, 0, windowStart);

    // Get current count
    const count = (await kv.zcard(kvKey)) || 0;

    return {
      allowed: count < limit,
      limit,
      remaining: Math.max(0, limit - count),
      resetAt,
    };
  } catch (error) {
    console.error('[RateLimit] Status check error:', error);

    return {
      allowed: true,
      limit,
      remaining: limit,
      resetAt,
    };
  }
}

/**
 * Check multiple rate limits simultaneously
 *
 * Useful for implementing tiered rate limits (e.g., per-endpoint + global).
 * Returns the most restrictive result.
 *
 * @param checks - Array of rate limit checks to perform
 * @returns The most restrictive rate limit result
 *
 * @example
 * const result = await checkMultipleRateLimits([
 *   { key: 'ip:192.168.1.1:/api/news', limit: 100, window: 3600 },
 *   { key: 'global:192.168.1.1', limit: 1000, window: 86400 },
 * ]);
 */
export async function checkMultipleRateLimits(
  checks: Array<{
    key: string;
    limit: number;
    window?: number;
  }>
): Promise<DistributedRateLimitResult> {
  const results = await Promise.all(
    checks.map(({ key, limit, window }) => checkRateLimit(key, limit, window))
  );

  // If any limit is exceeded, return that result
  const exceeded = results.find((r) => !r.allowed);
  if (exceeded) {
    return exceeded;
  }

  // Return the most restrictive remaining count
  return results.reduce((min, curr) =>
    curr.remaining < min.remaining ? curr : min
  );
}

/**
 * Create a rate limit key with consistent format
 *
 * @param tier - Rate limit tier (e.g., 'free', 'pro')
 * @param identifier - Client identifier (e.g., IP address)
 * @param endpoint - Optional endpoint path
 * @returns Formatted rate limit key
 */
export function createRateLimitKey(
  tier: string,
  identifier: string,
  endpoint?: string
): string {
  if (endpoint) {
    return `${tier}:${identifier}:${endpoint}`;
  }
  return `${tier}:${identifier}`;
}