/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

/**
 * Tests for middleware config utility functions
 */

import { describe, it, expect } from 'vitest';
import {
  matchesPattern,
  findRouteRateLimit,
  generateRequestId,
  getClientIp,
  FREE_TIER_PATTERNS,
  EXEMPT_PATTERNS,
  AI_ENDPOINT_PATTERNS,
  TIER_LIMITS,
  ROUTE_RATE_LIMITS,
} from '@/middleware/config';

// =============================================================================
// matchesPattern
// =============================================================================

describe('matchesPattern', () => {
  it('should match free-tier sample route', () => {
    expect(matchesPattern('/api/sample', FREE_TIER_PATTERNS)).toBe(true);
  });

  it('should not match non-free-tier routes', () => {
    expect(matchesPattern('/api/news', FREE_TIER_PATTERNS)).toBe(false);
  });

  it('should match exempt routes', () => {
    expect(matchesPattern('/api/health', EXEMPT_PATTERNS)).toBe(true);
    expect(matchesPattern('/api/.well-known/x402', EXEMPT_PATTERNS)).toBe(true);
    expect(matchesPattern('/api/register', EXEMPT_PATTERNS)).toBe(true);
  });

  it('should not match non-exempt routes', () => {
    expect(matchesPattern('/api/news', EXEMPT_PATTERNS)).toBe(false);
    expect(matchesPattern('/api/prices', EXEMPT_PATTERNS)).toBe(false);
  });

  it('should match AI endpoint patterns', () => {
    expect(matchesPattern('/api/premium/ai/summarize', AI_ENDPOINT_PATTERNS)).toBe(true);
    expect(matchesPattern('/api/v1/ai/chat', AI_ENDPOINT_PATTERNS)).toBe(true);
  });

  it('should return false for empty patterns', () => {
    expect(matchesPattern('/api/test', [])).toBe(false);
  });
});

// =============================================================================
// findRouteRateLimit
// =============================================================================

describe('findRouteRateLimit', () => {
  it('should find AI route rate limit', () => {
    const limit = findRouteRateLimit('/api/ai/chat');
    expect(limit).not.toBeNull();
    expect(limit!.label).toBe('ai');
  });

  it('should find search route rate limit', () => {
    const limit = findRouteRateLimit('/api/search');
    expect(limit).not.toBeNull();
    expect(limit!.label).toBe('search');
  });

  it('should find export route rate limit', () => {
    const limit = findRouteRateLimit('/api/export/csv');
    expect(limit).not.toBeNull();
    expect(limit!.label).toBe('export');
  });

  it('should return null for routes without specific limits', () => {
    expect(findRouteRateLimit('/api/news')).toBeNull();
    expect(findRouteRateLimit('/api/prices')).toBeNull();
  });
});

// =============================================================================
// generateRequestId
// =============================================================================

describe('generateRequestId', () => {
  it('should generate IDs with req_ prefix', () => {
    const id = generateRequestId();
    expect(id.startsWith('req_')).toBe(true);
  });

  it('should generate unique IDs', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateRequestId()));
    expect(ids.size).toBe(100);
  });

  it('should contain underscore separator', () => {
    const id = generateRequestId();
    const parts = id.split('_');
    expect(parts.length).toBeGreaterThanOrEqual(3);
  });
});

// =============================================================================
// getClientIp
// =============================================================================

describe('getClientIp', () => {
  it('should extract first IP from x-forwarded-for', () => {
    const request = {
      headers: {
        get: (name: string) => (name === 'x-forwarded-for' ? '1.2.3.4, 5.6.7.8' : null),
      },
    };
    expect(getClientIp(request)).toBe('1.2.3.4');
  });

  it('should fall back to x-real-ip', () => {
    const request = {
      headers: {
        get: (name: string) => (name === 'x-real-ip' ? '9.8.7.6' : null),
      },
    };
    expect(getClientIp(request)).toBe('9.8.7.6');
  });

  it('should return unknown when no IP headers present', () => {
    const request = { headers: { get: () => null } };
    expect(getClientIp(request)).toBe('unknown');
  });
});

// =============================================================================
// Constants validation
// =============================================================================

describe('config constants', () => {
  it('should have valid tier limits', () => {
    expect(TIER_LIMITS.pro.daily).toBeGreaterThan(0);
    expect(TIER_LIMITS.enterprise.daily).toBeGreaterThan(TIER_LIMITS.pro.daily);
  });

  it('should have route rate limits with required fields', () => {
    for (const limit of ROUTE_RATE_LIMITS) {
      expect(limit.pattern).toBeInstanceOf(RegExp);
      expect(limit.requests).toBeGreaterThan(0);
      expect(limit.windowMs).toBeGreaterThan(0);
      expect(limit.label).toBeTruthy();
    }
  });
});
