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
 * Enterprise-Grade Rate Limiting with Upstash
 *
 * Uses @upstash/ratelimit for atomic, distributed rate limiting.
 * Implements sliding window algorithm for fair rate limiting across all instances.
 *
 * Benefits over raw KV operations:
 * - Atomic operations (no race conditions)
 * - Sliding window (fairer than fixed window)
 * - Built-in analytics
 * - Scales to millions of users
 *
 * @module lib/ratelimit
 * @see https://github.com/upstash/ratelimit
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { type NextRequest, NextResponse } from 'next/server';
import { rateLimitLogger } from '@/lib/logger';

// ============================================================================
// Types
// ============================================================================

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: number;
}

export interface TierConfig {
  name: string;
  requestsPerDay: number;
  requestsPerMinute: number;
}

// ============================================================================
// Configuration
// ============================================================================

/**
 * Check if Upstash Redis is configured
 * Works with both Vercel KV env vars and direct Upstash env vars
 */
export function isRedisConfigured(): boolean {
  // Vercel KV uses these (which are actually Upstash)
  const vercelKv = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
  // Direct Upstash config
  const upstash = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
  return vercelKv || upstash;
}

/**
 * Create Redis client from environment variables
 * Supports both Vercel KV and direct Upstash configuration
 */
function createRedisClient(): Redis | null {
  // Try Vercel KV env vars first (they're actually Upstash)
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    return new Redis({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    });
  }

  // Try direct Upstash env vars
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    return Redis.fromEnv();
  }

  return null;
}

// ============================================================================
// Rate Limiter Instances
// ============================================================================

/**
 * Lazy-initialize Redis client
 */
let redisClient: Redis | null = null;

function getRedis(): Redis | null {
  if (!redisClient) {
    redisClient = createRedisClient();
  }
  return redisClient;
}

/**
 * Rate limiter cache by tier
 * Each tier gets its own limiter with appropriate limits
 */
const rateLimiters = new Map<string, Ratelimit>();

/**
 * Get or create a rate limiter for a specific tier
 */
function getRateLimiter(tier: string, requestsPerDay: number): Ratelimit | null {
  const redis = getRedis();
  if (!redis) return null;

  const cacheKey = `${tier}:${requestsPerDay}`;

  if (!rateLimiters.has(cacheKey)) {
    // Use sliding window for fair rate limiting
    // This prevents the "100 requests at 23:59, 100 more at 00:01" problem
    const limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(requestsPerDay, '1 d'),
      prefix: `ratelimit:${tier}`,
      analytics: true, // Enable built-in analytics
      enableProtection: true, // Enable DDoS protection
    });

    rateLimiters.set(cacheKey, limiter);
  }

  return rateLimiters.get(cacheKey)!;
}

/**
 * Per-minute rate limiter for burst protection
 */
function getMinuteLimiter(tier: string, requestsPerMinute: number): Ratelimit | null {
  const redis = getRedis();
  if (!redis) return null;

  const cacheKey = `${tier}:minute:${requestsPerMinute}`;

  if (!rateLimiters.has(cacheKey)) {
    const limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(requestsPerMinute, '1 m'),
      prefix: `ratelimit:minute:${tier}`,
      analytics: true,
    });

    rateLimiters.set(cacheKey, limiter);
  }

  return rateLimiters.get(cacheKey)!;
}

// ============================================================================
// Main Rate Limiting Functions
// ============================================================================

// NextRequest imported at top of file

/**
 * Default free tier config
 */
const FREE_TIER_CONFIG: TierConfig = {
  name: 'free',
  requestsPerDay: 1000,
  requestsPerMinute: 60,
};

/**
 * Check rate limit from a NextRequest (convenience wrapper)
 * 
 * Extracts identifier from request headers/IP and uses free tier limits.
 * For more control, use checkRateLimit(identifier, tierConfig) directly.
 * 
 * @param request - NextRequest object
 * @param tierConfig - Optional tier config (defaults to free tier)
 * @returns Rate limit result
 */
export async function checkRateLimitFromRequest(
  request: NextRequest,
  tierConfig: TierConfig = FREE_TIER_CONFIG
): Promise<RateLimitResult> {
  // Extract identifier from API key header or IP
  const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
             request.headers.get('x-real-ip') || 
             'anonymous';
  
  const identifier = apiKey || `ip:${ip}`;
  
  return checkRateLimit(identifier, tierConfig);
}

/**
 * Check rate limit for an API key with a specific tier
 *
 * Uses atomic sliding window algorithm via @upstash/ratelimit.
 * No race conditions, fair distribution, proper distributed state.
 *
 * @param identifier - Unique identifier (usually API key ID or hashed key)
 * @param tierConfig - Tier configuration with limits
 * @returns Rate limit result with allowed status and remaining quota
 */
export async function checkRateLimit(
  identifier: string,
  tierConfig: TierConfig
): Promise<RateLimitResult> {
  // Unlimited tier
  if (tierConfig.requestsPerDay === -1) {
    return {
      allowed: true,
      remaining: -1,
      limit: -1,
      resetAt: 0,
    };
  }

  // Check if Redis is configured
  if (!isRedisConfigured()) {
    rateLimitLogger.warn('Redis not configured, allowing request');
    return {
      allowed: true,
      remaining: tierConfig.requestsPerDay,
      limit: tierConfig.requestsPerDay,
      resetAt: Date.now() + 86400000,
    };
  }

  try {
    // Get rate limiters
    const dailyLimiter = getRateLimiter(tierConfig.name, tierConfig.requestsPerDay);
    const minuteLimiter = getMinuteLimiter(tierConfig.name, tierConfig.requestsPerMinute);

    if (!dailyLimiter) {
      rateLimitLogger.warn('Failed to create rate limiter');
      return {
        allowed: true,
        remaining: tierConfig.requestsPerDay,
        limit: tierConfig.requestsPerDay,
        resetAt: Date.now() + 86400000,
      };
    }

    // Check per-minute limit first (burst protection)
    if (minuteLimiter) {
      const minuteResult = await minuteLimiter.limit(identifier);
      if (!minuteResult.success) {
        return {
          allowed: false,
          remaining: 0,
          limit: tierConfig.requestsPerMinute,
          resetAt: minuteResult.reset,
        };
      }
    }

    // Check daily limit
    const result = await dailyLimiter.limit(identifier);

    return {
      allowed: result.success,
      remaining: result.remaining,
      limit: result.limit,
      resetAt: result.reset,
    };
  } catch (error) {
    rateLimitLogger.error({ err: error instanceof Error ? error : new Error(String(error)) }, 'Error checking rate limit');
    // Fail open - allow request on error
    return {
      allowed: true,
      remaining: tierConfig.requestsPerDay,
      limit: tierConfig.requestsPerDay,
      resetAt: Date.now() + 86400000,
    };
  }
}

/**
 * Check rate limit by tier name
 *
 * Convenience function that looks up tier config automatically.
 *
 * @param identifier - Unique identifier (API key ID)
 * @param tier - Tier name (free, pro, enterprise)
 * @param tiers - Tier configuration map
 */
export async function checkTierRateLimit(
  identifier: string,
  tier: string,
  tiers: Record<string, TierConfig>
): Promise<RateLimitResult> {
  const tierConfig = tiers[tier];

  if (!tierConfig) {
    rateLimitLogger.warn({ tier }, 'Unknown tier, using default limits');
    return checkRateLimit(identifier, {
      name: tier,
      requestsPerDay: 100,
      requestsPerMinute: 10,
    });
  }

  return checkRateLimit(identifier, tierConfig);
}

/**
 * Get current usage for an identifier without incrementing
 *
 * Useful for displaying usage in dashboards without affecting limits.
 */
export async function getUsage(
  identifier: string,
  tierConfig: TierConfig
): Promise<{ used: number; limit: number; resetAt: number } | null> {
  if (!isRedisConfigured()) return null;

  const redis = getRedis();
  if (!redis) return null;

  try {
    // @upstash/ratelimit doesn't have a "peek" function
    // We need to check without consuming a request
    const limiter = getRateLimiter(tierConfig.name, tierConfig.requestsPerDay);
    if (!limiter) return null;

    // Get remaining uses the same sliding window logic
    const result = await limiter.getRemaining(identifier);

    return {
      used: tierConfig.requestsPerDay - result.remaining,
      limit: tierConfig.requestsPerDay,
      resetAt: result.reset,
    };
  } catch (error) {
    rateLimitLogger.error({ err: error instanceof Error ? error : new Error(String(error)) }, 'Error getting usage');
    return null;
  }
}

/**
 * Reset rate limit for an identifier
 *
 * Useful for testing or admin overrides.
 */
export async function resetRateLimit(
  identifier: string,
  tierConfig: TierConfig
): Promise<boolean> {
  if (!isRedisConfigured()) return false;

  const limiter = getRateLimiter(tierConfig.name, tierConfig.requestsPerDay);
  if (!limiter) return false;

  try {
    await limiter.resetUsedTokens(identifier);
    return true;
  } catch (error) {
    rateLimitLogger.error({ err: error instanceof Error ? error : new Error(String(error)) }, 'Error resetting rate limit');
    return false;
  }
}

/**
 * Block an identifier completely
 *
 * Useful for abuse prevention.
 */
export async function blockIdentifier(
  identifier: string,
  durationMs: number = 86400000 // Default: 24 hours
): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false;

  try {
    await redis.set(`blocked:${identifier}`, 'true', {
      px: durationMs,
    });
    return true;
  } catch (error) {
    rateLimitLogger.error({ err: error instanceof Error ? error : new Error(String(error)) }, 'Error blocking identifier');
    return false;
  }
}

/**
 * Check if an identifier is blocked
 */
export async function isBlocked(identifier: string): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false;

  try {
    const blocked = await redis.get(`blocked:${identifier}`);
    return blocked === 'true';
  } catch {
    return false;
  }
}

// ============================================================================
// Request-based Rate Limiting (for simpler usage)
// ============================================================================

// NextRequest and NextResponse imported at top of file

/**
 * Default tier for anonymous/free requests
 */
const DEFAULT_FREE_TIER: TierConfig = {
  name: 'free',
  requestsPerDay: 1000,
  requestsPerMinute: 30,
};

/**
 * Extract identifier from request (IP-based for anonymous)
 */
function getIdentifierFromRequest(request: NextRequest): string {
  // Try API key first
  const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (apiKey) {
    // Hash the API key for privacy
    let hash = 0;
    for (let i = 0; i < apiKey.length; i++) {
      const char = apiKey.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `key:${Math.abs(hash).toString(36)}`;
  }

  // Fall back to IP
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return `ip:${forwardedFor.split(',')[0].trim()}`;
  }
  
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return `ip:${realIP}`;
  }

  // Fallback
  const userAgent = request.headers.get('user-agent') || 'unknown';
  let hash = 0;
  for (let i = 0; i < userAgent.length; i++) {
    const char = userAgent.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `ua:${Math.abs(hash).toString(36)}`;
}

/**
 * Check rate limit for a request (simpler API)
 * 
 * Automatically extracts identifier from request and uses free tier limits.
 * For API key-based requests with custom tiers, use checkRateLimit directly.
 */
export async function checkRateLimitByRequest(
  request: NextRequest,
  tierConfig: TierConfig = DEFAULT_FREE_TIER
): Promise<RateLimitResult> {
  const identifier = getIdentifierFromRequest(request);
  return checkRateLimit(identifier, tierConfig);
}

// ============================================================================
// Response Helpers
// ============================================================================

/**
 * Generate rate limit error response
 * 
 * Returns a 429 Too Many Requests response with proper headers.
 */
export function getRateLimitErrorResponse(result: RateLimitResult): NextResponse {
  const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
  
  return NextResponse.json(
    {
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please slow down.',
        retryAfter,
      },
    },
    {
      status: 429,
      headers: {
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': result.resetAt.toString(),
        'Retry-After': retryAfter.toString(),
      },
    }
  );
}

/**
 * Alias for backward compatibility with old rate-limit.ts imports
 * @deprecated Use getRateLimitErrorResponse instead
 */
export const rateLimitResponse = getRateLimitErrorResponse;

/**
 * Add rate limit headers to an existing response
 */
export function addRateLimitHeaders(
  response: NextResponse,
  result: RateLimitResult
): NextResponse {
  response.headers.set('X-RateLimit-Limit', result.limit.toString());
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
  response.headers.set('X-RateLimit-Reset', result.resetAt.toString());
  return response;
}

// ============================================================================
// Analytics (if enabled)
// ============================================================================

/**
 * Get rate limit analytics for a time period
 *
 * Requires analytics: true in the rate limiter config.
 */
export async function getAnalytics(
  tier: string,
  requestsPerDay: number
): Promise<{
  requests: number;
  blocked: number;
} | null> {
  const limiter = getRateLimiter(tier, requestsPerDay);
  if (!limiter) return null;

  // Analytics require Upstash paid plan — return null until available
  return null;
}
