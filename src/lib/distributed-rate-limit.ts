/**
 * Distributed Rate Limiting
 * 
 * Provides a unified rate limiting interface that:
 * - Uses Vercel KV / Upstash Redis when available (for global limiting)
 * - Falls back to in-memory for development/single instance
 * - Supports sliding window algorithm for smooth rate limiting
 * - Implements tiered limits for different user types
 * 
 * @module distributed-rate-limit
 */

import { db, isKVAvailable } from './database';
import type { NextRequest } from 'next/server';

// =============================================================================
// TYPES
// =============================================================================

export interface RateLimitConfig {
  /** Maximum requests allowed in the window */
  limit: number;
  /** Window size in seconds */
  window: number;
  /** Unique identifier prefix for this limiter */
  prefix?: string;
}

export interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean;
  /** Remaining requests in the current window */
  remaining: number;
  /** Unix timestamp when the limit resets */
  resetAt: number;
  /** Total limit for this window */
  limit: number;
  /** Time until reset in seconds */
  retryAfter: number;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface SlidingWindowEntry {
  requests: number[];
  lastCleanup: number;
}

// =============================================================================
// TIER CONFIGURATION
// =============================================================================

export const RATE_LIMIT_TIERS = {
  /** Anonymous users - most restrictive */
  anonymous: { limit: 60, window: 60 },
  /** Free tier with API key */
  free: { limit: 200, window: 60 },
  /** Pro tier */
  pro: { limit: 1000, window: 60 },
  /** Enterprise tier */
  enterprise: { limit: 10000, window: 60 },
  /** Internal services */
  internal: { limit: 100000, window: 60 },
} as const;

export type RateLimitTier = keyof typeof RATE_LIMIT_TIERS;

// =============================================================================
// IN-MEMORY STORE
// =============================================================================

class MemoryRateLimitStore {
  private store = new Map<string, SlidingWindowEntry>();
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    if (typeof setInterval !== 'undefined') {
      this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
    }
  }

  async increment(
    key: string,
    window: number
  ): Promise<{ count: number; resetAt: number }> {
    const now = Date.now();
    const windowMs = window * 1000;
    const windowStart = now - windowMs;

    let entry = this.store.get(key);
    
    if (!entry) {
      entry = { requests: [], lastCleanup: now };
      this.store.set(key, entry);
    }

    // Clean old requests
    if (now - entry.lastCleanup > 5000) {
      entry.requests = entry.requests.filter(t => t > windowStart);
      entry.lastCleanup = now;
    }

    // Add new request
    entry.requests.push(now);

    // Count requests in window
    const count = entry.requests.filter(t => t > windowStart).length;
    const resetAt = Math.ceil((now + windowMs) / 1000);

    return { count, resetAt };
  }

  async getCount(key: string, window: number): Promise<number> {
    const entry = this.store.get(key);
    if (!entry) return 0;

    const windowStart = Date.now() - window * 1000;
    return entry.requests.filter(t => t > windowStart).length;
  }

  private cleanup(): void {
    const now = Date.now();
    const maxAge = 300000; // 5 minutes

    for (const [key, entry] of this.store.entries()) {
      const recent = entry.requests.filter(t => t > now - maxAge);
      if (recent.length === 0) {
        this.store.delete(key);
      } else {
        entry.requests = recent;
      }
    }
  }

  stats(): { size: number } {
    return { size: this.store.size };
  }
}

// =============================================================================
// DISTRIBUTED RATE LIMITER
// =============================================================================

/**
 * Distributed rate limiter with KV backend and memory fallback
 */
export class DistributedRateLimiter {
  private config: Required<RateLimitConfig>;
  private memory: MemoryRateLimitStore;
  private useKV: boolean;

  constructor(config: RateLimitConfig) {
    this.config = {
      limit: config.limit,
      window: config.window,
      prefix: config.prefix || 'ratelimit',
    };
    this.memory = new MemoryRateLimitStore();
    this.useKV = isKVAvailable();
  }

  /**
   * Check and increment rate limit for an identifier
   */
  async check(identifier: string): Promise<RateLimitResult> {
    const key = `${this.config.prefix}:${identifier}`;
    const now = Date.now();
    const windowMs = this.config.window * 1000;

    try {
      if (this.useKV) {
        return await this.checkWithKV(key, now, windowMs);
      }
    } catch (error) {
      console.error('[RateLimiter] KV error, falling back to memory:', error);
    }

    // Fallback to memory
    return this.checkWithMemory(key, now, windowMs);
  }

  private async checkWithKV(
    key: string,
    now: number,
    windowMs: number
  ): Promise<RateLimitResult> {
    // Use sliding window with Redis
    const windowKey = `${key}:${Math.floor(now / windowMs)}`;
    const prevWindowKey = `${key}:${Math.floor(now / windowMs) - 1}`;
    
    // Get current and previous window counts
    const [current, previous] = await Promise.all([
      db.get<RateLimitEntry>(windowKey),
      db.get<RateLimitEntry>(prevWindowKey),
    ]);

    const currentCount = current?.count || 0;
    const previousCount = previous?.count || 0;

    // Calculate weighted count (sliding window)
    const windowProgress = (now % windowMs) / windowMs;
    const weightedCount = Math.floor(
      currentCount + previousCount * (1 - windowProgress)
    );

    if (weightedCount >= this.config.limit) {
      const resetAt = Math.ceil((Math.floor(now / windowMs) + 1) * windowMs / 1000);
      return {
        allowed: false,
        remaining: 0,
        resetAt,
        limit: this.config.limit,
        retryAfter: Math.ceil((resetAt * 1000 - now) / 1000),
      };
    }

    // Increment current window
    const newEntry: RateLimitEntry = {
      count: currentCount + 1,
      resetAt: Math.ceil((Math.floor(now / windowMs) + 1) * windowMs / 1000),
    };
    
    await db.set(windowKey, newEntry, this.config.window * 2);

    return {
      allowed: true,
      remaining: Math.max(0, this.config.limit - weightedCount - 1),
      resetAt: newEntry.resetAt,
      limit: this.config.limit,
      retryAfter: 0,
    };
  }

  private async checkWithMemory(
    key: string,
    now: number,
    windowMs: number
  ): Promise<RateLimitResult> {
    const result = await this.memory.increment(key, this.config.window);
    
    const allowed = result.count <= this.config.limit;
    const resetAt = result.resetAt;

    return {
      allowed,
      remaining: Math.max(0, this.config.limit - result.count),
      resetAt,
      limit: this.config.limit,
      retryAfter: allowed ? 0 : Math.ceil((resetAt * 1000 - now) / 1000),
    };
  }

  /**
   * Get current count without incrementing
   */
  async peek(identifier: string): Promise<number> {
    const key = `${this.config.prefix}:${identifier}`;
    return this.memory.getCount(key, this.config.window);
  }

  /**
   * Get rate limit headers for a response
   */
  getHeaders(result: RateLimitResult): Record<string, string> {
    return {
      'X-RateLimit-Limit': String(result.limit),
      'X-RateLimit-Remaining': String(result.remaining),
      'X-RateLimit-Reset': String(result.resetAt),
      ...(result.allowed ? {} : { 'Retry-After': String(result.retryAfter) }),
    };
  }
}

// =============================================================================
// REQUEST HELPERS
// =============================================================================

/**
 * Extract identifier from a Next.js request
 */
export function getRequestIdentifier(request: NextRequest): string {
  // Priority order:
  // 1. API key from header
  // 2. Authenticated user ID
  // 3. IP address (with forwarding support)
  
  const apiKey = request.headers.get('x-api-key') || 
                 request.headers.get('authorization')?.replace('Bearer ', '');
  
  if (apiKey && apiKey.startsWith('cda_')) {
    return `key:${apiKey}`;
  }

  // Check for user ID from auth
  const userId = request.headers.get('x-user-id');
  if (userId) {
    return `user:${userId}`;
  }

  // Fall back to IP
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0]?.trim() || 
             realIp || 
             'unknown';

  return `ip:${ip}`;
}

/**
 * Determine rate limit tier from request
 */
export function getRequestTier(request: NextRequest): RateLimitTier {
  const apiKey = request.headers.get('x-api-key') || 
                 request.headers.get('authorization')?.replace('Bearer ', '');

  // Internal service key
  if (apiKey === process.env.INTERNAL_API_KEY) {
    return 'internal';
  }

  // Check for tier in header (set by auth middleware)
  const tierHeader = request.headers.get('x-rate-limit-tier');
  if (tierHeader && tierHeader in RATE_LIMIT_TIERS) {
    return tierHeader as RateLimitTier;
  }

  // API key indicates at least free tier
  if (apiKey) {
    // In production, look up the key to get actual tier
    // For now, default to free
    return 'free';
  }

  return 'anonymous';
}

// =============================================================================
// SINGLETON INSTANCES
// =============================================================================

/** Default rate limiter for API routes */
export const apiRateLimiter = new DistributedRateLimiter({
  limit: 60,
  window: 60,
  prefix: 'api',
});

/** Stricter limiter for expensive operations (AI, etc.) */
export const expensiveRateLimiter = new DistributedRateLimiter({
  limit: 10,
  window: 60,
  prefix: 'expensive',
});

/** Auth-related rate limiter (login attempts, etc.) */
export const authRateLimiter = new DistributedRateLimiter({
  limit: 5,
  window: 300,
  prefix: 'auth',
});

/** WebSocket connection limiter */
export const wsRateLimiter = new DistributedRateLimiter({
  limit: 5,
  window: 60,
  prefix: 'ws',
});

// =============================================================================
// MIDDLEWARE HELPER
// =============================================================================

/**
 * Create a rate limit middleware for API routes
 */
export async function withRateLimit(
  request: NextRequest,
  limiter?: DistributedRateLimiter
): Promise<RateLimitResult & { headers: Record<string, string> }> {
  const identifier = getRequestIdentifier(request);
  const tier = getRequestTier(request);
  
  // Use tier-specific limits
  const effectiveLimiter = limiter || new DistributedRateLimiter({
    ...RATE_LIMIT_TIERS[tier],
    prefix: 'api',
  });

  const result = await effectiveLimiter.check(identifier);
  const headers = effectiveLimiter.getHeaders(result);

  return { ...result, headers };
}

/**
 * Create a 429 response for rate-limited requests
 */
export function rateLimitedResponse(
  result: RateLimitResult,
  headers: Record<string, string>
): Response {
  return new Response(
    JSON.stringify({
      error: 'Too Many Requests',
      message: `Rate limit exceeded. Retry after ${result.retryAfter} seconds.`,
      retryAfter: result.retryAfter,
      limit: result.limit,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    }
  );
}

export default DistributedRateLimiter;
