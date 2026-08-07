/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

/**
 * Tests for rate-limit utility functions
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { record429, isRepeat429Blocked } from '@/middleware/rate-limit';

describe('record429 / isRepeat429Blocked', () => {
  // Use unique IPs per test to avoid state leakage
  let testIp: string;

  beforeEach(() => {
    testIp = `test-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  });

  it('should not block after a single 429', () => {
    const escalated = record429(testIp);
    expect(escalated).toBe(false);
    expect(isRepeat429Blocked(testIp)).toBe(false);
  });

  it('should escalate after threshold hits', () => {
    // Threshold is 10 by default
    for (let i = 0; i < 9; i++) {
      expect(record429(testIp)).toBe(false);
    }
    // 10th hit should trigger escalation
    expect(record429(testIp)).toBe(true);
    expect(isRepeat429Blocked(testIp)).not.toBe(false);
  });

  it('should return blocked-until timestamp after escalation', () => {
    for (let i = 0; i < 10; i++) {
      record429(testIp);
    }
    const blocked = isRepeat429Blocked(testIp);
    expect(typeof blocked).toBe('number');
    expect(blocked as number).toBeGreaterThan(Date.now());
  });

  it('should return false for unknown IPs', () => {
    expect(isRepeat429Blocked('unknown-ip-123')).toBe(false);
  });
});

describe('checkRateLimit anonymous tiers (in-memory path)', () => {
  // No Upstash creds in the test env, so these exercise the in-memory limiter —
  // the same code path a Redis outage falls back to.
  beforeEach(() => {
    delete process.env.KV_REST_API_URL;
    delete process.env.KV_REST_API_TOKEN;
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  it('free-tier routes get the FREE_TIER_RATE_LIMIT allowance, not the public 10/hour', async () => {
    const { checkRateLimit } = await import('@/middleware/rate-limit');
    const { FREE_TIER_RATE_LIMIT, PUBLIC_RATE_LIMIT } = await import('@/middleware/config');
    const ip = `203.0.113.${Math.floor(Math.random() * 200)}-free`;
    const first = await checkRateLimit(ip, 'free-tier');
    expect(first.allowed).toBe(true);
    expect(first.limit).toBe(FREE_TIER_RATE_LIMIT.requests);
    expect(first.limit).toBeGreaterThan(PUBLIC_RATE_LIMIT.requests);
  });

  it('exhausting the public bucket does not touch the same IP\'s free-tier bucket', async () => {
    const { checkRateLimit } = await import('@/middleware/rate-limit');
    const { PUBLIC_RATE_LIMIT } = await import('@/middleware/config');
    const ip = '198.51.100.77-tier-isolation';
    let last;
    for (let i = 0; i <= PUBLIC_RATE_LIMIT.requests; i++) {
      last = await checkRateLimit(ip, 'public');
    }
    expect(last!.allowed).toBe(false);
    const free = await checkRateLimit(ip, 'free-tier');
    expect(free.allowed).toBe(true);
  });

  it('the free-tier window still limits once its own allowance is spent', async () => {
    const { checkRateLimit } = await import('@/middleware/rate-limit');
    const { FREE_TIER_RATE_LIMIT } = await import('@/middleware/config');
    const ip = '198.51.100.78-free-cap';
    let last;
    for (let i = 0; i <= FREE_TIER_RATE_LIMIT.requests; i++) {
      last = await checkRateLimit(ip, 'free-tier');
    }
    expect(last!.allowed).toBe(false);
    expect(last!.remaining).toBe(0);
  });
});

describe('FREE_TIER_PATTERNS covers the routes the 2026-08 429 noise came from', () => {
  it('matches /api/news and /api/fear-greed, and keeps /api/search on the public tier', async () => {
    const { FREE_TIER_PATTERNS, matchesPattern } = await import('@/middleware/config');
    expect(matchesPattern('/api/news', FREE_TIER_PATTERNS)).toBe(true);
    expect(matchesPattern('/api/fear-greed', FREE_TIER_PATTERNS)).toBe(true);
    // Search fans out to live backends on every miss — it stays tightly capped.
    expect(matchesPattern('/api/search', FREE_TIER_PATTERNS)).toBe(false);
  });
});
