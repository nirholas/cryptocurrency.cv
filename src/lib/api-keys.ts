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
 * API Key Management System
 *
 * Handles generation, validation, and rate limiting of API keys.
 * Uses Vercel KV for persistent storage and @upstash/ratelimit for
 * atomic, distributed rate limiting with sliding window algorithm.
 *
 * @module lib/api-keys
 */

import { kv } from '@vercel/kv';
import { authLogger } from '@/lib/logger';
import {
  checkRateLimit as checkUpstashRateLimit,
  isRedisConfigured,
  type RateLimitResult as UpstashRateLimitResult,
} from './ratelimit';

// ============================================================================
// Edge-compatible crypto utilities (using Web Crypto API)
// ============================================================================

/**
 * Generate cryptographically secure random bytes (Edge compatible)
 */
function getRandomBytes(length: number): Uint8Array {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return array;
}

/**
 * Convert bytes to base64url string
 */
function toBase64Url(bytes: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...bytes));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Convert bytes to hex string
 */
function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * SHA-256 hash using Web Crypto API (Edge compatible)
 */
async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  return toHex(new Uint8Array(hashBuffer));
}

// ============================================================================
// Types
// ============================================================================

export interface ApiKeyData {
  id: string;
  key: string; // Hashed key (never store raw)
  keyPrefix: string; // First 8 chars for display
  name: string;
  email: string;
  tier: 'free' | 'pro' | 'enterprise';
  permissions: string[];
  rateLimit: number; // Requests per day
  usageToday: number;
  usageMonth: number;
  createdAt: string;
  lastUsedAt?: string;
  expiresAt?: string;
  active: boolean;
  metadata?: Record<string, unknown>;
}

export interface ApiKeyUsage {
  keyId: string;
  count: number;
  resetAt: number; // Unix timestamp
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: number;
}

// ============================================================================
// Configuration - Derived from Single Source of Truth
// ============================================================================

import { API_TIERS, type TierConfig } from '@/lib/x402/pricing';

/**
 * API_KEY_TIERS is derived from API_TIERS (the single source of truth).
 * Maps permission scopes to the 'features' field for backward compatibility.
 *
 * @deprecated Import API_TIERS from '@/lib/x402/pricing' directly for new code.
 */
export const API_KEY_TIERS = Object.fromEntries(
  Object.entries(API_TIERS).map(([tier, config]) => [
    tier,
    {
      name: config.name,
      requestsPerDay: config.requestsPerDay,
      requestsPerMinute: config.requestsPerMinute,
      features: config.permissions, // Map permissions to features for backward compat
    },
  ]),
) as Record<
  string,
  {
    name: string;
    requestsPerDay: number;
    requestsPerMinute: number;
    features: readonly string[];
  }
>;

// Key prefixes for different tiers
const KEY_PREFIXES = {
  free: 'cda_free_',
  pro: 'cda_pro_',
  enterprise: 'cda_ent_',
} as const;

// ============================================================================
// Key Generation (Edge-compatible)
// ============================================================================

/**
 * Generate a secure random API key
 */
export function generateApiKey(tier: 'free' | 'pro' | 'enterprise' = 'free'): string {
  const prefix = KEY_PREFIXES[tier];
  const randomPart = toBase64Url(getRandomBytes(24));
  return `${prefix}${randomPart}`;
}

/**
 * Hash an API key for secure storage (async for Edge compatibility)
 */
export async function hashApiKey(key: string): Promise<string> {
  return sha256(key);
}

/**
 * Synchronous hash for non-security purposes only (e.g. cache keys, logging).
 * WARNING: This is a trivial 32-bit hash — do NOT use for authentication,
 * authorization, or any security-sensitive operation. Use hashApiKey() (SHA-256) instead.
 * @deprecated Prefer hashApiKey() for all new code.
 */
export function hashApiKeySync(key: string): string {
  // Simple deterministic hash for sync operations
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    const char = key.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

/**
 * Generate a unique ID for the key record
 */
function generateKeyId(): string {
  return `key_${Date.now()}_${toHex(getRandomBytes(4))}`;
}

/**
 * Default expiry per tier: free=90d, pro=365d, enterprise=730d.
 * Returns an ISO string for the expiry date.
 */
function getDefaultExpiry(tier: 'free' | 'pro' | 'enterprise'): string {
  const days: Record<string, number> = { free: 90, pro: 365, enterprise: 730 };
  const d = new Date();
  d.setDate(d.getDate() + (days[tier] ?? 90));
  return d.toISOString();
}

// ============================================================================
// Key Storage (Vercel KV)
// ============================================================================

const KV_PREFIX = {
  key: 'apikey:', // apikey:{hashedKey} -> ApiKeyData
  email: 'email:', // email:{email} -> keyId[]
  usage: 'usage:', // usage:{keyId}:{date} -> count
  rateLimit: 'rl:', // rl:{keyId}:{minute} -> count
};

/**
 * Check if Vercel KV is configured
 */
export function isKvConfigured(): boolean {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

/**
 * Create a new API key
 */
export async function createApiKey(params: {
  email: string;
  name?: string;
  tier?: 'free' | 'pro' | 'enterprise';
}): Promise<{ key: string; data: ApiKeyData } | { error: string }> {
  const { email, name = 'Default', tier = 'free' } = params;

  // Check if KV is configured
  if (!isKvConfigured()) {
    return { error: 'API key storage not configured. Set KV_REST_API_URL and KV_REST_API_TOKEN.' };
  }

  // Check existing keys for this email
  const existingKeys = await getKeysByEmail(email);
  if (existingKeys.length >= 3) {
    return { error: 'Maximum 3 API keys per email. Please revoke an existing key first.' };
  }

  // Generate new key
  const rawKey = generateApiKey(tier);
  const hashedKey = await hashApiKey(rawKey);
  const keyId = generateKeyId();

  const tierConfig = API_KEY_TIERS[tier];

  const keyData: ApiKeyData = {
    id: keyId,
    key: hashedKey,
    keyPrefix: rawKey.substring(0, 12),
    name,
    email,
    tier,
    permissions: [...tierConfig.features],
    rateLimit: tierConfig.requestsPerDay,
    usageToday: 0,
    usageMonth: 0,
    createdAt: new Date().toISOString(),
    expiresAt: getDefaultExpiry(tier),
    active: true,
  };

  try {
    // Store key data
    await kv.set(`${KV_PREFIX.key}${hashedKey}`, keyData);

    // Add to email index
    const emailKeys = existingKeys.map((k) => k.id);
    emailKeys.push(keyId);
    await kv.set(`${KV_PREFIX.email}${email}`, emailKeys);

    // Also store by keyId for reverse lookup
    await kv.set(`${KV_PREFIX.key}id:${keyId}`, hashedKey);


    return { key: rawKey, data: keyData };
  } catch (error) {
    authLogger.error(
      { err: error instanceof Error ? error : new Error(String(error)) },
      'Failed to create API key',
    );
    return { error: 'Failed to create API key. Please try again.' };
  }
}

/**
 * Validate an API key and return its data
 */
export async function validateApiKey(rawKey: string): Promise<ApiKeyData | null> {
  if (!isKvConfigured()) {
    authLogger.warn('KV not configured, skipping validation');
    return null;
  }

  if (!rawKey?.startsWith('cda_')) {
    return null;
  }

  const hashedKey = await hashApiKey(rawKey);

  try {
    const keyData = await kv.get<ApiKeyData>(`${KV_PREFIX.key}${hashedKey}`);

    if (!keyData?.active) {
      return null;
    }

    // Check key expiration
    if (keyData.expiresAt && new Date(keyData.expiresAt) < new Date()) {
      authLogger.warn(
        { keyPrefix: keyData.keyPrefix, expiresAt: keyData.expiresAt },
        'Key expired',
      );
      // Deactivate expired key (non-blocking)
      kv.set(`${KV_PREFIX.key}${hashedKey}`, {
        ...keyData,
        active: false,
      }).catch(() => {});
      return null;
    }

    // Update last used timestamp (non-blocking)
    kv.set(`${KV_PREFIX.key}${hashedKey}`, {
      ...keyData,
      lastUsedAt: new Date().toISOString(),
    }).catch(() => {});

    return keyData;
  } catch (error) {
    authLogger.error(
      { err: error instanceof Error ? error : new Error(String(error)) },
      'Failed to validate API key',
    );
    return null;
  }
}

/**
 * Get all keys for an email
 */
export async function getKeysByEmail(email: string): Promise<ApiKeyData[]> {
  if (!isKvConfigured()) return [];

  try {
    const keyIds = await kv.get<string[]>(`${KV_PREFIX.email}${email}`);
    if (!keyIds || keyIds.length === 0) return [];

    const keys: ApiKeyData[] = [];
    for (const keyId of keyIds) {
      const hashedKey = await kv.get<string>(`${KV_PREFIX.key}id:${keyId}`);
      if (hashedKey) {
        const keyData = await kv.get<ApiKeyData>(`${KV_PREFIX.key}${hashedKey}`);
        if (keyData) keys.push(keyData);
      }
    }

    return keys;
  } catch (error) {
    authLogger.error(
      { err: error instanceof Error ? error : new Error(String(error)) },
      'Failed to get keys by email',
    );
    return [];
  }
}

/**
 * Revoke an API key
 */
export async function revokeApiKey(keyId: string, email: string): Promise<boolean> {
  if (!isKvConfigured()) return false;

  try {
    const hashedKey = await kv.get<string>(`${KV_PREFIX.key}id:${keyId}`);
    if (!hashedKey) return false;

    const keyData = await kv.get<ApiKeyData>(`${KV_PREFIX.key}${hashedKey}`);
    if (keyData?.email !== email) return false;

    // Mark as inactive
    await kv.set(`${KV_PREFIX.key}${hashedKey}`, {
      ...keyData,
      active: false,
    });

    return true;
  } catch (error) {
    authLogger.error(
      { err: error instanceof Error ? error : new Error(String(error)) },
      'Failed to revoke API key',
    );
    return false;
  }
}

// ============================================================================
// Rate Limiting (using @upstash/ratelimit for atomic operations)
// ============================================================================

/**
 * Check and update rate limit for a key
 *
 * Uses @upstash/ratelimit for:
 * - Atomic operations (no race conditions)
 * - Sliding window algorithm (fair rate limiting)
 * - Distributed state across all instances
 * - DDoS protection
 */
export async function checkRateLimit(keyData: ApiKeyData): Promise<RateLimitResult> {
  const tierConfig = API_KEY_TIERS[keyData.tier];

  // Unlimited tier
  if (tierConfig.requestsPerDay === -1) {
    return {
      allowed: true,
      remaining: -1,
      limit: -1,
      resetAt: 0,
    };
  }

  // Use @upstash/ratelimit for atomic rate limiting
  const result = await checkUpstashRateLimit(keyData.id, {
    name: tierConfig.name,
    requestsPerDay: tierConfig.requestsPerDay,
    requestsPerMinute: tierConfig.requestsPerMinute,
  });

  // Send notifications for rate limit thresholds
  await sendRateLimitNotifications(keyData, result, tierConfig);

  return result;
}

/**
 * Send notifications when rate limit thresholds are hit
 */
async function sendRateLimitNotifications(
  keyData: ApiKeyData,
  result: RateLimitResult,
  tierConfig: (typeof API_KEY_TIERS)[keyof typeof API_KEY_TIERS],
): Promise<void> {
  // Skip if KV not configured (can't track notifications)
  if (!isKvConfigured() || !isRedisConfigured()) return;

  const today = new Date().toISOString().split('T')[0];
  const notifiedKey = `${KV_PREFIX.usage}notified:${keyData.id}:${today}`;

  try {
    const used = tierConfig.requestsPerDay - result.remaining;
    const percentage = Math.round((used / tierConfig.requestsPerDay) * 100);

    // Get current notification state
    const notified = (await kv.get<{ at90: boolean; at100: boolean }>(notifiedKey)) || {
      at90: false,
      at100: false,
    };

    // Track 100% threshold notification
    if (!result.allowed && !notified.at100) {
      await kv.set(notifiedKey, { ...notified, at100: true });
      await kv.expire(notifiedKey, 90000);
    }
    // Track 90% threshold notification
    else if (percentage >= 90 && percentage < 100 && !notified.at90) {
      await kv.set(notifiedKey, { ...notified, at90: true });
      await kv.expire(notifiedKey, 90000);
    }
  } catch (error) {
    // Non-fatal - don't fail the request if notifications fail
    authLogger.error(
      { err: error instanceof Error ? error : new Error(String(error)) },
      'Failed to send rate limit notifications',
    );
  }
}

// ============================================================================
// Middleware Helper
// ============================================================================

/**
 * Extract API key from request
 */
export function extractApiKey(request: Request): string | null {
  // Check header first
  const headerKey = request.headers.get('X-API-Key');
  if (headerKey) return headerKey;

  // Check query param
  const url = new URL(request.url);
  const queryKey = url.searchParams.get('api_key');
  if (queryKey) return queryKey;

  // Check Authorization header (Bearer token)
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer cda_')) {
    return authHeader.slice(7);
  }

  return null;
}

/**
 * Validate request and return key data with rate limit info
 */
export async function validateRequest(request: Request): Promise<{
  valid: boolean;
  keyData?: ApiKeyData;
  rateLimit?: RateLimitResult;
  error?: string;
}> {
  const rawKey = extractApiKey(request);

  if (!rawKey) {
    return {
      valid: false,
      error: 'API key required. Get a free key at /api/register',
    };
  }

  const keyData = await validateApiKey(rawKey);

  if (!keyData) {
    return {
      valid: false,
      error: 'Invalid or revoked API key',
    };
  }

  const rateLimit = await checkRateLimit(keyData);

  if (!rateLimit.allowed) {
    return {
      valid: false,
      keyData,
      rateLimit,
      error: `Rate limit exceeded. Resets at ${new Date(rateLimit.resetAt).toISOString()}`,
    };
  }

  return {
    valid: true,
    keyData,
    rateLimit,
  };
}
// ============================================================================
// Key Lookup by ID
// ============================================================================

/**
 * Get API key data by key ID
 */
export async function getKeyById(keyId: string): Promise<ApiKeyData | null> {
  if (!isKvConfigured()) return null;

  try {
    const hashedKey = await kv.get<string>(`${KV_PREFIX.key}id:${keyId}`);
    if (!hashedKey) return null;

    const keyData = await kv.get<ApiKeyData>(`${KV_PREFIX.key}${hashedKey}`);
    return keyData;
  } catch (error) {
    authLogger.error(
      { err: error instanceof Error ? error : new Error(String(error)) },
      'Failed to get key by ID',
    );
    return null;
  }
}

// ============================================================================
// Subscription Management
// ============================================================================

/**
 * Rotate an API key — generate a new key, invalidate the old one
 */
export async function rotateApiKey(
  keyId: string,
  email: string,
): Promise<{ key: string; data: ApiKeyData } | { error: string }> {
  if (!isKvConfigured()) {
    return { error: 'API key storage not configured' };
  }

  try {
    // Look up the old key
    const oldHashedKey = await kv.get<string>(`${KV_PREFIX.key}id:${keyId}`);
    if (!oldHashedKey) {
      return { error: 'Key not found' };
    }

    const oldKeyData = await kv.get<ApiKeyData>(`${KV_PREFIX.key}${oldHashedKey}`);
    if (!oldKeyData) {
      return { error: 'Key data not found' };
    }

    if (oldKeyData.email !== email) {
      return { error: 'Email mismatch — unauthorized' };
    }

    if (!oldKeyData.active) {
      return { error: 'Key is already revoked' };
    }

    // Generate new key with the same tier
    const newRawKey = generateApiKey(oldKeyData.tier);
    const newHashedKey = await hashApiKey(newRawKey);

    const newKeyData: ApiKeyData = {
      ...oldKeyData,
      key: newHashedKey,
      keyPrefix: newRawKey.substring(0, 12),
      metadata: {
        ...oldKeyData.metadata,
        rotatedAt: new Date().toISOString(),
        rotatedFrom: keyId,
      },
    };

    // Invalidate old key
    await kv.set(`${KV_PREFIX.key}${oldHashedKey}`, {
      ...oldKeyData,
      active: false,
      metadata: {
        ...oldKeyData.metadata,
        revokedAt: new Date().toISOString(),
        revokedReason: 'rotated',
        rotatedTo: newRawKey.substring(0, 12),
      },
    });

    // Store new key
    await kv.set(`${KV_PREFIX.key}${newHashedKey}`, newKeyData);

    // Update the keyId -> hash mapping to point to the new hash
    await kv.set(`${KV_PREFIX.key}id:${keyId}`, newHashedKey);

    return { key: newRawKey, data: newKeyData };
  } catch (error) {
    authLogger.error(
      { err: error instanceof Error ? error : new Error(String(error)) },
      'Failed to rotate API key',
    );
    return { error: 'Failed to rotate API key. Please try again.' };
  }
}

// ============================================================================
// Usage Tracking
// ============================================================================

/**
 * Increment daily usage counter for an API key.
 * Called on every request that passes validation.
 */
export async function incrementUsage(keyId: string): Promise<void> {
  if (!isKvConfigured()) return;

  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const month = today.substring(0, 7); // YYYY-MM
  const dailyKey = `${KV_PREFIX.usage}${keyId}:${today}`;
  const monthlyKey = `${KV_PREFIX.usage}${keyId}:${month}`;
  const allTimeKey = `${KV_PREFIX.usage}${keyId}:total`;

  try {
    // Atomic increments — pipeline for performance
    const pipeline = kv.pipeline();
    pipeline.incr(dailyKey);
    pipeline.incr(monthlyKey);
    pipeline.incr(allTimeKey);
    // Set TTL on daily key (48 hours) and monthly key (35 days)
    pipeline.expire(dailyKey, 172800);
    pipeline.expire(monthlyKey, 3024000);
    await pipeline.exec();
  } catch (error) {
    // Non-fatal — don't block request if usage tracking fails
    authLogger.error(
      { err: error instanceof Error ? error : new Error(String(error)) },
      'Failed to increment usage',
    );
  }
}

/**
 * Get detailed usage statistics for an API key
 */
export async function getUsageStats(keyId: string): Promise<{
  today: number;
  month: number;
  allTime: number;
  daily: Record<string, number>;
  resetAt: string;
} | null> {
  if (!isKvConfigured()) return null;

  try {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const month = today.substring(0, 7);

    // Get current counters
    const [todayCount, monthCount, allTimeCount] = await Promise.all([
      kv.get<number>(`${KV_PREFIX.usage}${keyId}:${today}`),
      kv.get<number>(`${KV_PREFIX.usage}${keyId}:${month}`),
      kv.get<number>(`${KV_PREFIX.usage}${keyId}:total`),
    ]);

    // Get last 7 days of daily usage
    const daily: Record<string, number> = {};
    const dayPromises: Promise<[string, number | null]>[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setUTCDate(d.getUTCDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      dayPromises.push(
        kv
          .get<number>(`${KV_PREFIX.usage}${keyId}:${dateStr}`)
          .then((v) => [dateStr, v] as [string, number | null]),
      );
    }
    const dayResults = await Promise.all(dayPromises);
    for (const [dateStr, count] of dayResults) {
      daily[dateStr] = count ?? 0;
    }

    // Calculate next midnight UTC
    const tomorrow = new Date(now);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    tomorrow.setUTCHours(0, 0, 0, 0);

    return {
      today: todayCount ?? 0,
      month: monthCount ?? 0,
      allTime: allTimeCount ?? 0,
      daily,
      resetAt: tomorrow.toISOString(),
    };
  } catch (error) {
    authLogger.error(
      { err: error instanceof Error ? error : new Error(String(error)) },
      'Failed to get usage stats',
    );
    return null;
  }
}

/**
 * Upgrade an API key to a new tier
 */
export async function upgradeKeyTier(
  keyId: string,
  newTier: 'pro' | 'enterprise',
  expiresAt?: string,
): Promise<{ success: boolean; data?: ApiKeyData; error?: string }> {
  if (!isKvConfigured()) {
    return { success: false, error: 'API key storage not configured' };
  }

  try {
    const hashedKey = await kv.get<string>(`${KV_PREFIX.key}id:${keyId}`);
    if (!hashedKey) {
      return { success: false, error: 'Key not found' };
    }

    const keyData = await kv.get<ApiKeyData>(`${KV_PREFIX.key}${hashedKey}`);
    if (!keyData) {
      return { success: false, error: 'Key data not found' };
    }

    if (!keyData.active) {
      return { success: false, error: 'Key is revoked' };
    }

    const tierConfig = API_KEY_TIERS[newTier];

    const updatedKeyData: ApiKeyData = {
      ...keyData,
      tier: newTier,
      permissions: [...tierConfig.features],
      rateLimit: tierConfig.requestsPerDay,
      expiresAt: expiresAt || keyData.expiresAt,
      metadata: {
        ...keyData.metadata,
        upgradedAt: new Date().toISOString(),
        previousTier: keyData.tier,
      },
    };

    await kv.set(`${KV_PREFIX.key}${hashedKey}`, updatedKeyData);


    return { success: true, data: updatedKeyData };
  } catch (error) {
    authLogger.error(
      { err: error instanceof Error ? error : new Error(String(error)) },
      'Failed to upgrade key tier',
    );
    return { success: false, error: 'Failed to upgrade key tier' };
  }
}

/**
 * Downgrade an API key to free tier (used when subscription expires)
 */
export async function downgradeKeyToFree(keyId: string): Promise<boolean> {
  if (!isKvConfigured()) return false;

  try {
    const hashedKey = await kv.get<string>(`${KV_PREFIX.key}id:${keyId}`);
    if (!hashedKey) return false;

    const keyData = await kv.get<ApiKeyData>(`${KV_PREFIX.key}${hashedKey}`);
    if (!keyData) return false;

    const tierConfig = API_KEY_TIERS.free;

    const updatedKeyData: ApiKeyData = {
      ...keyData,
      tier: 'free',
      permissions: [...tierConfig.features],
      rateLimit: tierConfig.requestsPerDay,
      expiresAt: undefined,
      metadata: {
        ...keyData.metadata,
        downgradedAt: new Date().toISOString(),
        previousTier: keyData.tier,
      },
    };

    await kv.set(`${KV_PREFIX.key}${hashedKey}`, updatedKeyData);

    return true;
  } catch (error) {
    authLogger.error(
      { err: error instanceof Error ? error : new Error(String(error)) },
      'Failed to downgrade key',
    );
    return false;
  }
}

/**
 * Check for expired subscriptions and return keys that need to be downgraded
 */
export async function checkSubscriptionExpiry(): Promise<string[]> {
  if (!isKvConfigured()) return [];

  try {
    // Get all keys with pro or enterprise tier that have an expiry date
    // This uses a scan pattern - in production, you'd want a more efficient index
    const keys = await kv.keys(`${KV_PREFIX.key}*`);
    const expiredKeyIds: string[] = [];
    const now = new Date();

    for (const key of keys) {
      // Skip id reference keys
      if (key.includes(':id:')) continue;

      const keyData = await kv.get<ApiKeyData>(key);
      if (!keyData) continue;

      // Check if key has expired
      if (keyData.expiresAt && keyData.tier !== 'free' && new Date(keyData.expiresAt) < now) {
        expiredKeyIds.push(keyData.id);
      }
    }

    return expiredKeyIds;
  } catch (error) {
    authLogger.error(
      { err: error instanceof Error ? error : new Error(String(error)) },
      'Failed to check subscription expiry',
    );
    return [];
  }
}
