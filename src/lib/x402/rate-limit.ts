/**
 * Rate Limiting for API Key Users
 *
 * Implements rate limiting for subscription-based API access
 * x402 pay-per-request users bypass rate limits
 */

import { API_TIERS, ApiTier } from './pricing';

// =============================================================================
// RATE LIMIT STORE
// =============================================================================

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

/**
 * In-memory rate limit store
 *
 * NOTE: In production, use Redis or similar for:
 * - Distributed rate limiting across instances
 * - Persistence across restarts
 * - Better memory management
 */
const rateLimitStore = new Map<string, RateLimitRecord>();

// Cleanup old records periodically
if (typeof setInterval !== 'undefined') {
  setInterval(
    () => {
      const now = Date.now();
      for (const [key, record] of rateLimitStore.entries()) {
        if (record.resetAt < now) {
          rateLimitStore.delete(key);
        }
      }
    },
    60 * 60 * 1000
  ); // Every hour
}

// =============================================================================
// RATE LIMIT FUNCTIONS
// =============================================================================

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  limit: number;
}

/**
 * Check rate limit for an identifier (usually API key)
 */
export function checkRateLimit(identifier: string, limit: number): RateLimitResult {
  const now = Date.now();
  const windowMs = 24 * 60 * 60 * 1000; // 24 hours

  const record = rateLimitStore.get(identifier);

  // No record or expired - create new window
  if (!record || record.resetAt < now) {
    rateLimitStore.set(identifier, { count: 1, resetAt: now + windowMs });
    return {
      allowed: true,
      remaining: limit - 1,
      resetAt: now + windowMs,
      limit,
    };
  }

  // Check if limit exceeded
  if (record.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: record.resetAt,
      limit,
    };
  }

  // Increment count
  record.count++;
  return {
    allowed: true,
    remaining: limit - record.count,
    resetAt: record.resetAt,
    limit,
  };
}

/**
 * Check rate limit for a specific API tier
 */
export function checkTierRateLimit(apiKey: string, tier: ApiTier): RateLimitResult {
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

  return checkRateLimit(apiKey, tierConfig.requestsPerDay);
}

/**
 * Get current usage for an identifier
 */
export function getUsage(identifier: string): { count: number; resetAt: number } | null {
  const record = rateLimitStore.get(identifier);

  if (!record || record.resetAt < Date.now()) {
    return null;
  }

  return { count: record.count, resetAt: record.resetAt };
}

/**
 * Reset rate limit for an identifier (for testing or admin purposes)
 */
export function resetRateLimit(identifier: string): void {
  rateLimitStore.delete(identifier);
}

// =============================================================================
// API KEY VALIDATION
// =============================================================================

/**
 * Get API tier from API key
 *
 * In production, implement proper key validation:
 * 1. Look up key in database
 * 2. Verify key is active and not revoked
 * 3. Check subscription status
 * 4. Return tier and user info
 */
export function getTierFromApiKey(apiKey: string | null): ApiTier | null {
  if (!apiKey) return null;

  // Demo implementation using key prefixes
  // Replace with database lookup in production
  if (apiKey.startsWith('ent_') && apiKey.length >= 32) return 'enterprise';
  if (apiKey.startsWith('pro_') && apiKey.length >= 32) return 'pro';
  if (apiKey.startsWith('free_') && apiKey.length >= 32) return 'free';

  return null;
}

/**
 * Validate API key format
 */
export function isValidApiKeyFormat(apiKey: string): boolean {
  // API keys should be: prefix_randomstring (min 32 chars total)
  const pattern = /^(ent|pro|free)_[a-zA-Z0-9]{28,}$/;
  return pattern.test(apiKey);
}

/**
 * Generate a demo API key (for testing only)
 */
export function generateDemoApiKey(tier: ApiTier): string {
  const prefix = tier === 'enterprise' ? 'ent' : tier === 'pro' ? 'pro' : 'free';
  const random = Array.from({ length: 28 }, () =>
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.charAt(
      Math.floor(Math.random() * 62)
    )
  ).join('');

  return `${prefix}_${random}`;
}
