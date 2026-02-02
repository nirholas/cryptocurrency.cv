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
    console.warn('[RateLimit] Redis not configured, allowing request');
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
      console.warn('[RateLimit] Failed to create rate limiter');
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
    console.error('[RateLimit] Error checking rate limit:', error);
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
    console.warn(`[RateLimit] Unknown tier: ${tier}, using default limits`);
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
    console.error('[RateLimit] Error getting usage:', error);
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
    console.error('[RateLimit] Error resetting rate limit:', error);
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
    console.error('[RateLimit] Error blocking identifier:', error);
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
// Response Helpers
// ============================================================================

import { NextResponse } from 'next/server';

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

  // Note: Analytics require Upstash paid plan
  // This is a placeholder for when analytics are available
  return null;
}
