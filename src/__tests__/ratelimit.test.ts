import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Upstash modules
vi.mock('@upstash/ratelimit', () => {
  const mockLimit = vi
    .fn()
    .mockResolvedValue({
      success: true,
      remaining: 999,
      limit: 1000,
      reset: Date.now() + 86400000,
    });
  const mockGetRemaining = vi
    .fn()
    .mockResolvedValue({ remaining: 999, reset: Date.now() + 86400000 });
  const mockResetUsedTokens = vi.fn().mockResolvedValue(undefined);
  return {
    Ratelimit: vi.fn().mockImplementation(() => ({
      limit: mockLimit,
      getRemaining: mockGetRemaining,
      resetUsedTokens: mockResetUsedTokens,
    })),
  };
});

vi.mock('@upstash/redis', () => ({
  Redis: vi.fn().mockImplementation(() => ({
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue('OK'),
  })),
}));

vi.mock('@/lib/logger', () => ({
  rateLimitLogger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

import {
  isRedisConfigured,
  checkRateLimit,
  checkRateLimitFromRequest,
  checkTierRateLimit,
  getUsage,
  resetRateLimit,
  blockIdentifier,
  isBlocked,
  getRateLimitErrorResponse,
  type RateLimitResult,
  type TierConfig,
} from '@/lib/ratelimit';

describe('ratelimit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear env vars
    delete process.env.KV_REST_API_URL;
    delete process.env.KV_REST_API_TOKEN;
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  describe('isRedisConfigured', () => {
    it('should return false when no env vars set', () => {
      expect(isRedisConfigured()).toBe(false);
    });

    it('should return true when Vercel KV vars set', () => {
      process.env.KV_REST_API_URL = 'https://test.upstash.io';
      process.env.KV_REST_API_TOKEN = 'test-token';
      expect(isRedisConfigured()).toBe(true);
    });

    it('should return true when Upstash vars set', () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://test.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';
      expect(isRedisConfigured()).toBe(true);
    });

    it('should return false with partial Vercel KV vars', () => {
      process.env.KV_REST_API_URL = 'https://test.upstash.io';
      expect(isRedisConfigured()).toBe(false);
    });
  });

  describe('checkRateLimit', () => {
    const freeTier: TierConfig = { name: 'free', requestsPerDay: 1000, requestsPerMinute: 60 };

    it('should allow unlimited tier', async () => {
      const result = await checkRateLimit('test', {
        name: 'unlimited',
        requestsPerDay: -1,
        requestsPerMinute: -1,
      });
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(-1);
      expect(result.limit).toBe(-1);
    });

    it('should allow when Redis not configured (fail open)', async () => {
      const result = await checkRateLimit('test', freeTier);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(1000);
    });
  });

  describe('checkRateLimitFromRequest', () => {
    it('should extract identifier from x-api-key header', async () => {
      const request = new Request('https://example.com/api/news', {
        headers: { 'x-api-key': 'cda_free_test123' },
      }) as unknown as import('next/server').NextRequest;
      // Force the headers.get to work properly
      Object.defineProperty(request, 'headers', {
        value: new Headers({ 'x-api-key': 'cda_free_test123' }),
      });
      const result = await checkRateLimitFromRequest(request);
      expect(result.allowed).toBe(true);
    });

    it('should fall back to IP when no API key', async () => {
      const request = new Request(
        'https://example.com/api/news',
      ) as unknown as import('next/server').NextRequest;
      Object.defineProperty(request, 'headers', {
        value: new Headers({ 'x-forwarded-for': '1.2.3.4' }),
      });
      const result = await checkRateLimitFromRequest(request);
      expect(result.allowed).toBe(true);
    });
  });

  describe('checkTierRateLimit', () => {
    it('should use default limits for unknown tier', async () => {
      const result = await checkTierRateLimit('test', 'unknown', {});
      expect(result.allowed).toBe(true);
    });

    it('should use correct tier config', async () => {
      const tiers = {
        pro: { name: 'pro', requestsPerDay: 10000, requestsPerMinute: 300 },
      };
      const result = await checkTierRateLimit('test', 'pro', tiers);
      expect(result.allowed).toBe(true);
    });
  });

  describe('getUsage', () => {
    it('should return null when Redis not configured', async () => {
      const result = await getUsage('test', {
        name: 'free',
        requestsPerDay: 1000,
        requestsPerMinute: 60,
      });
      expect(result).toBeNull();
    });
  });

  describe('resetRateLimit', () => {
    it('should return false when Redis not configured', async () => {
      const result = await resetRateLimit('test', {
        name: 'free',
        requestsPerDay: 1000,
        requestsPerMinute: 60,
      });
      expect(result).toBe(false);
    });
  });

  describe('blockIdentifier', () => {
    it('should return false when Redis not available', async () => {
      const result = await blockIdentifier('bad-actor');
      expect(result).toBe(false);
    });
  });

  describe('isBlocked', () => {
    it('should return false when Redis not available', async () => {
      const result = await isBlocked('test');
      expect(result).toBe(false);
    });
  });

  describe('getRateLimitErrorResponse', () => {
    it('should return 429 status', () => {
      const result: RateLimitResult = {
        allowed: false,
        remaining: 0,
        limit: 1000,
        resetAt: Date.now() + 60000,
      };
      const response = getRateLimitErrorResponse(result);
      expect(response.status).toBe(429);
    });

    it('should include rate limit headers', () => {
      const result: RateLimitResult = {
        allowed: false,
        remaining: 0,
        limit: 1000,
        resetAt: Date.now() + 60000,
      };
      const response = getRateLimitErrorResponse(result);
      expect(response.headers.get('X-RateLimit-Limit')).toBe('1000');
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('0');
      expect(response.headers.get('Retry-After')).toBeTruthy();
    });

    it('should include error body', async () => {
      const result: RateLimitResult = {
        allowed: false,
        remaining: 0,
        limit: 1000,
        resetAt: Date.now() + 30000,
      };
      const response = getRateLimitErrorResponse(result);
      const body = await response.json();
      expect(body.error.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(body.error.retryAfter).toBeGreaterThan(0);
    });
  });
});
