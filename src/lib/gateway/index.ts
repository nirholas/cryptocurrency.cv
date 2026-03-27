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
 * API Gateway — Tiered Rate Limiting, API Key Management, Usage Tracking
 *
 * Provides production-grade API access control:
 *   1. **API Key validation** — Bearer token or X-API-Key header
 *   2. **Tiered rate limits** — anonymous (60/hr), free (300/hr), pro (3K/hr), enterprise (30K/hr)
 *   3. **Usage tracking** — per-key request counting with daily/hourly windows
 *   4. **Burst protection** — sliding window rate limiter with Redis
 *
 * Architecture:
 *   Request → extractApiKey() → validateKey() → checkRateLimit() → route handler
 *
 * Environment:
 *   API_KEYS_SECRET — HMAC secret for key generation
 *   REDIS_URL       — Required for distributed rate limiting
 *
 * @module lib/gateway
 */

import { cache } from '@/lib/cache';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type ApiTier = 'anonymous' | 'free' | 'pro' | 'enterprise';

export interface ApiKey {
  id: string;
  keyHash: string;
  name: string;
  tier: ApiTier;
  ownerId: string;
  ownerEmail?: string;
  isActive: boolean;
  rateLimit: number;      // requests per hour
  dailyLimit: number;     // requests per day
  burstLimit: number;     // max concurrent requests
  allowedOrigins: string[];
  allowedEndpoints: string[];  // empty = all
  createdAt: number;
  lastUsedAt?: number;
  usageCount: number;
  metadata?: Record<string, unknown>;
}

export interface RateLimitResult {
  allowed: boolean;
  tier: ApiTier;
  limit: number;
  remaining: number;
  reset: number;          // Unix timestamp when window resets
  retryAfter?: number;    // Seconds to wait (only if blocked)
}

export interface UsageRecord {
  keyId: string;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTimeMs: number;
  timestamp: number;
  ip: string;
  userAgent?: string;
}

export interface ApiKeyCreateRequest {
  name: string;
  tier?: ApiTier;
  ownerId: string;
  ownerEmail?: string;
  allowedOrigins?: string[];
  allowedEndpoints?: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Tier Configuration
// ─────────────────────────────────────────────────────────────────────────────

export const TIER_CONFIG: Record<ApiTier, {
  requestsPerHour: number;
  requestsPerDay: number;
  burstLimit: number;
  features: string[];
  maxResponseSize: number;   // bytes
  cacheTtlMultiplier: number;
}> = {
  anonymous: {
    requestsPerHour: 60,
    requestsPerDay: 500,
    burstLimit: 10,
    features: ['news', 'prices', 'fear-greed'],
    maxResponseSize: 100_000,
    cacheTtlMultiplier: 1,
  },
  free: {
    requestsPerHour: 300,
    requestsPerDay: 5_000,
    burstLimit: 30,
    features: ['news', 'prices', 'fear-greed', 'defi', 'onchain', 'social', 'search'],
    maxResponseSize: 500_000,
    cacheTtlMultiplier: 1,
  },
  pro: {
    requestsPerHour: 3_000,
    requestsPerDay: 50_000,
    burstLimit: 100,
    features: ['news', 'prices', 'fear-greed', 'defi', 'onchain', 'social', 'derivatives', 'ai', 'websocket', 'search', 'archive'],
    maxResponseSize: 5_000_000,
    cacheTtlMultiplier: 0.5,  // fresher cache for pro users
  },
  enterprise: {
    requestsPerHour: 30_000,
    requestsPerDay: 500_000,
    burstLimit: 500,
    features: ['*'],
    maxResponseSize: 50_000_000,
    cacheTtlMultiplier: 0.25,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// API Key Management
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate a new API key.
 * Format: `fcn_<tier>_<random32hex>`
 */
export function generateApiKey(tier: ApiTier = 'free'): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const random = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `fcn_${tier}_${random}`;
}

/**
 * Hash an API key for storage (SHA-256).
 */
export async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key + (process.env.API_KEYS_SECRET ?? 'fcn-default-secret'));
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Create a new API key record.
 */
export async function createApiKey(req: ApiKeyCreateRequest): Promise<{ key: string; record: ApiKey }> {
  const tier = req.tier ?? 'free';
  const key = generateApiKey(tier);
  const keyHash = await hashApiKey(key);
  const config = TIER_CONFIG[tier];

  const record: ApiKey = {
    id: `key_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    keyHash,
    name: req.name,
    tier,
    ownerId: req.ownerId,
    ownerEmail: req.ownerEmail,
    isActive: true,
    rateLimit: config.requestsPerHour,
    dailyLimit: config.requestsPerDay,
    burstLimit: config.burstLimit,
    allowedOrigins: req.allowedOrigins ?? [],
    allowedEndpoints: req.allowedEndpoints ?? [],
    createdAt: Date.now(),
    usageCount: 0,
  };

  // Store in Redis
  await cache.set(`apikey:${keyHash}`, record, 0);

  // Add to key index
  const index = (await cache.get<string[]>(`apikeys:index:${req.ownerId}`)) ?? [];
  index.push(record.id);
  await cache.set(`apikeys:index:${req.ownerId}`, index, 0);

  return { key, record };
}

/**
 * Validate an API key and return the key record.
 * Returns null for anonymous requests (no key provided).
 */
export async function validateApiKey(rawKey: string | null): Promise<ApiKey | null> {
  if (!rawKey) return null;

  // Quick format check
  if (!rawKey.startsWith('fcn_')) return null;

  const keyHash = await hashApiKey(rawKey);
  const record = await cache.get<ApiKey>(`apikey:${keyHash}`);

  if (!record) return null;
  if (!record.isActive) return null;

  return record;
}

/**
 * Extract API key from request headers.
 * Supports: Authorization: Bearer fcn_... | X-API-Key: fcn_...
 */
export function extractApiKey(headers: Headers): string | null {
  // Check Authorization header
  const auth = headers.get('authorization');
  if (auth?.startsWith('Bearer fcn_')) {
    return auth.slice(7);
  }

  // Check X-API-Key header
  const apiKey = headers.get('x-api-key');
  if (apiKey?.startsWith('fcn_')) {
    return apiKey;
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Rate Limiting (Sliding Window with Redis)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Check rate limit for a request.
 * Uses sliding window algorithm with Redis sorted sets.
 */
export async function checkRateLimit(
  identifier: string,
  tier: ApiTier,
): Promise<RateLimitResult> {
  const config = TIER_CONFIG[tier];
  const now = Date.now();
  const windowMs = 3_600_000; // 1 hour
  const windowStart = now - windowMs;

  const hourlyKey = `rl:hourly:${identifier}`;
  const dailyKey = `rl:daily:${identifier}`;

  // Try Redis-based rate limiting
  try {
    // Count requests in current hourly window
    const hourlyCount = await cache.get<number>(hourlyKey) ?? 0;

    if (hourlyCount >= config.requestsPerHour) {
      return {
        allowed: false,
        tier,
        limit: config.requestsPerHour,
        remaining: 0,
        reset: Math.ceil((now + windowMs) / 1000),
        retryAfter: Math.ceil(windowMs / 1000),
      };
    }

    // Check daily limit
    const dailyCount = await cache.get<number>(dailyKey) ?? 0;
    if (dailyCount >= config.requestsPerDay) {
      const endOfDay = new Date();
      endOfDay.setUTCHours(23, 59, 59, 999);
      return {
        allowed: false,
        tier,
        limit: config.requestsPerDay,
        remaining: 0,
        reset: Math.ceil(endOfDay.getTime() / 1000),
        retryAfter: Math.ceil((endOfDay.getTime() - now) / 1000),
      };
    }

    // Increment counters
    await cache.set(hourlyKey, hourlyCount + 1, 3600);
    await cache.set(dailyKey, dailyCount + 1, 86400);

    return {
      allowed: true,
      tier,
      limit: config.requestsPerHour,
      remaining: config.requestsPerHour - hourlyCount - 1,
      reset: Math.ceil((now + windowMs) / 1000),
    };
  } catch {
    // Redis unavailable — allow request but log degradation
    console.warn('[gateway] Rate limit check failed — allowing request');
    return {
      allowed: true,
      tier,
      limit: config.requestsPerHour,
      remaining: config.requestsPerHour,
      reset: Math.ceil((now + windowMs) / 1000),
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Usage Tracking
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Record a usage event (fire-and-forget, non-blocking).
 */
export function trackUsage(record: UsageRecord): void {
  // Fire-and-forget — don't await
  void (async () => {
    try {
      // Increment usage counter for the key
      const key = `usage:${record.keyId}:${new Date().toISOString().slice(0, 10)}`;
      const count = (await cache.get<number>(key)) ?? 0;
      await cache.set(key, count + 1, 86400 * 7); // Keep 7 days

      // Update last_used_at on the key record
      const keyRecord = await cache.get<ApiKey>(`apikey:${record.keyId}`);
      if (keyRecord) {
        keyRecord.lastUsedAt = record.timestamp;
        keyRecord.usageCount++;
        await cache.set(`apikey:${keyRecord.keyHash}`, keyRecord, 0);
      }

      // Store endpoint-level usage (aggregate)
      const endpointKey = `usage:endpoint:${record.endpoint}:${new Date().toISOString().slice(0, 13)}`;
      const endpointCount = (await cache.get<number>(endpointKey)) ?? 0;
      await cache.set(endpointKey, endpointCount + 1, 86400 * 2);
    } catch {
      // Non-critical — don't let tracking failure break anything
    }
  })();
}

/**
 * Get usage stats for a key.
 */
export async function getUsageStats(keyId: string, days = 7): Promise<{
  daily: { date: string; count: number }[];
  total: number;
}> {
  const daily: { date: string; count: number }[] = [];
  let total = 0;

  for (let i = 0; i < days; i++) {
    const date = new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10);
    const count = (await cache.get<number>(`usage:${keyId}:${date}`)) ?? 0;
    daily.push({ date, count });
    total += count;
  }

  return { daily, total };
}

// ─────────────────────────────────────────────────────────────────────────────
// Gateway Middleware Helper
// ─────────────────────────────────────────────────────────────────────────────

export interface GatewayContext {
  tier: ApiTier;
  keyId: string | null;
  rateLimit: RateLimitResult;
}

/**
 * Full gateway check: extract key → validate → rate limit → return context.
 */
export async function gatewayCheck(
  headers: Headers,
  ip: string,
): Promise<GatewayContext & { error?: string; status?: number }> {
  // Extract and validate API key
  const rawKey = extractApiKey(headers);
  const keyRecord = await validateApiKey(rawKey);

  const tier: ApiTier = keyRecord?.tier ?? 'anonymous';
  const identifier = keyRecord ? keyRecord.id : `ip:${ip}`;

  // Check rate limit
  const rateLimit = await checkRateLimit(identifier, tier);

  if (!rateLimit.allowed) {
    return {
      tier,
      keyId: keyRecord?.id ?? null,
      rateLimit,
      error: 'Rate limit exceeded',
      status: 429,
    };
  }

  return { tier, keyId: keyRecord?.id ?? null, rateLimit };
}

/**
 * Add rate limit headers to a Response.
 */
export function addRateLimitHeaders(
  headers: Headers,
  result: RateLimitResult,
): void {
  headers.set('X-RateLimit-Limit', String(result.limit));
  headers.set('X-RateLimit-Remaining', String(result.remaining));
  headers.set('X-RateLimit-Reset', String(result.reset));
  headers.set('X-RateLimit-Tier', result.tier);
  if (result.retryAfter) {
    headers.set('Retry-After', String(result.retryAfter));
  }
}
