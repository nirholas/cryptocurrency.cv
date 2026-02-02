/**
 * Rate Limiting for x402 API Key Users
 *
 * This module re-exports rate limiting functionality from the central
 * @/lib/ratelimit module, which uses @upstash/ratelimit for:
 * - Atomic operations (no race conditions)
 * - Sliding window algorithm (fair rate limiting)
 * - Distributed state across all instances
 *
 * x402 pay-per-request users bypass rate limits entirely.
 *
 * @module lib/x402/rate-limit
 */

import { API_TIERS, type ApiTier } from './pricing';
import {
  checkRateLimit as checkUpstashRateLimit,
  checkTierRateLimit as checkUpstashTierRateLimit,
  getUsage as getUpstashUsage,
  resetRateLimit as resetUpstashRateLimit,
  isRedisConfigured,
  type RateLimitResult,
  type TierConfig,
} from '@/lib/ratelimit';

// Re-export types
export type { RateLimitResult };

// =============================================================================
// RATE LIMIT FUNCTIONS (using @upstash/ratelimit)
// =============================================================================

/**
 * Check rate limit for an identifier
 *
 * Uses @upstash/ratelimit for atomic, distributed rate limiting.
 * No race conditions, fair sliding window algorithm.
 *
 * @param identifier - API key ID or unique identifier
 * @param limit - Maximum requests per day
 */
export async function checkRateLimit(identifier: string, limit: number): Promise<RateLimitResult> {
  return checkUpstashRateLimit(identifier, {
    name: 'custom',
    requestsPerDay: limit,
    requestsPerMinute: Math.max(1, Math.floor(limit / 100)), // 1% of daily limit per minute
  });
}

/**
 * Check rate limit for a specific API tier
 *
 * @param apiKey - API key ID
 * @param tier - Tier name (free, pro, enterprise)
 */
export async function checkTierRateLimit(apiKey: string, tier: ApiTier): Promise<RateLimitResult> {
  const tierConfig = API_TIERS[tier];

  // Unlimited tier
  if (tierConfig.requestsPerDay === -1) {
    return {
      allowed: true,
      remaining: -1,
      resetAt: 0,
      limit: -1,
    };
  }

  return checkUpstashRateLimit(apiKey, {
    name: tierConfig.name,
    requestsPerDay: tierConfig.requestsPerDay,
    requestsPerMinute: tierConfig.requestsPerMinute,
  });
}

/**
 * Get current usage for an identifier without incrementing
 */
export async function getUsage(
  identifier: string,
  tier: ApiTier
): Promise<{ count: number; resetAt: number } | null> {
  const tierConfig = API_TIERS[tier];

  const result = await getUpstashUsage(identifier, {
    name: tierConfig.name,
    requestsPerDay: tierConfig.requestsPerDay,
    requestsPerMinute: tierConfig.requestsPerMinute,
  });

  if (!result) return null;

  return {
    count: result.used,
    resetAt: result.resetAt,
  };
}

/**
 * Reset rate limit for an identifier
 */
export async function resetRateLimit(identifier: string, tier: ApiTier): Promise<void> {
  const tierConfig = API_TIERS[tier];

  await resetUpstashRateLimit(identifier, {
    name: tierConfig.name,
    requestsPerDay: tierConfig.requestsPerDay,
    requestsPerMinute: tierConfig.requestsPerMinute,
  });
}

/**
 * Get rate limit headers for HTTP responses
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  if (result.limit === -1) {
    return {
      'X-RateLimit-Limit': 'unlimited',
      'X-RateLimit-Remaining': 'unlimited',
    };
  }

  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': Math.max(0, result.remaining).toString(),
    'X-RateLimit-Reset': result.resetAt.toString(),
    'Retry-After':
      result.remaining <= 0 ? Math.ceil((result.resetAt - Date.now()) / 1000).toString() : '0',
  };
}

// =============================================================================
// UTILITIES
// =============================================================================

/**
 * Check if Redis/Upstash is configured
 */
export { isRedisConfigured };
