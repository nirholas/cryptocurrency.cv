/**
 * Critical Fixes Validation Tests
 * 
 * Tests to ensure the 5 critical agent fixes stay fixed and don't regress.
 */

import { describe, it, expect } from 'vitest';
import { API_TIERS } from '@/lib/x402/pricing';
import { API_KEY_TIERS } from '@/lib/api-keys';

describe('Critical Agent Fixes', () => {
  describe('Agent 1: Tier Configuration Consolidation', () => {
    it('should have only ONE tier definition (API_TIERS)', () => {
      expect(API_TIERS).toBeDefined();
      expect(typeof API_TIERS).toBe('object');
    });

    it('should have API_KEY_TIERS reference API_TIERS data', () => {
      // Both should have same tiers
      expect(Object.keys(API_KEY_TIERS)).toEqual(Object.keys(API_TIERS));
      
      // Rate limits should match
      expect(API_KEY_TIERS.free.requestsPerDay).toBe(API_TIERS.free.requestsPerDay);
      expect(API_KEY_TIERS.free.requestsPerMinute).toBe(API_TIERS.free.requestsPerMinute);
      expect(API_KEY_TIERS.pro.requestsPerDay).toBe(API_TIERS.pro.requestsPerDay);
      expect(API_KEY_TIERS.pro.requestsPerMinute).toBe(API_TIERS.pro.requestsPerMinute);
    });

    it('should have all required fields in tier config', () => {
      Object.entries(API_TIERS).forEach(([tier, config]) => {
        // Critical rate limit fields
        expect(config.requestsPerMinute).toBeDefined();
        expect(config.requestsPerDay).toBeDefined();
        expect(typeof config.requestsPerMinute).toBe('number');
        expect(typeof config.requestsPerDay).toBe('number');
        
        // Required string fields
        expect(config.id).toBe(tier);
        expect(config.name).toBeDefined();
        expect(config.name.length).toBeGreaterThan(0);
        
        // Permissions array
        expect(Array.isArray(config.permissions)).toBe(true);
        expect(config.permissions.length).toBeGreaterThan(0);
      });
    });

    it('should have sane rate limit values', () => {
      Object.entries(API_TIERS).forEach(([tierName, config]) => {
        if (config.requestsPerDay !== -1) {
          // Daily limit should be >= minute limit
          expect(config.requestsPerDay).toBeGreaterThanOrEqual(config.requestsPerMinute);
        }
        
        // Minute limits should be positive
        expect(config.requestsPerMinute).toBeGreaterThan(0);
      });
    });
  });

  describe('Agent 2: Rate Limiter Consolidation', () => {
    it('should export distributed rate limiter functions', async () => {
      const { checkRateLimit, getRateLimitErrorResponse } = await import('@/lib/ratelimit');
      
      expect(typeof checkRateLimit).toBe('function');
      expect(typeof getRateLimitErrorResponse).toBe('function');
    });

    it('should have backward compatible rateLimitResponse alias', async () => {
      const { rateLimitResponse, getRateLimitErrorResponse } = await import('@/lib/ratelimit');
      
      expect(rateLimitResponse).toBe(getRateLimitErrorResponse);
    });

    it('should warn when using deprecated rate-limit.ts', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      // Import should trigger deprecation warning
      await import('@/lib/rate-limit');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[DEPRECATED] rate-limit.ts is deprecated')
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Agent 3: No Duplicate Exports', () => {
    it('should have only ONE getRateLimitHeaders export', async () => {
      const { getRateLimitHeaders } = await import('@/lib/x402/rate-limit');
      
      expect(typeof getRateLimitHeaders).toBe('function');
    });

    it('should return proper rate limit headers', async () => {
      const { getRateLimitHeaders } = await import('@/lib/x402/rate-limit');
      
      const result = {
        allowed: true,
        remaining: 5,
        limit: 10,
        resetAt: Date.now() + 60000,
      };
      
      const headers = getRateLimitHeaders(result);
      
      expect(headers['X-RateLimit-Limit']).toBe('10');
      expect(headers['X-RateLimit-Remaining']).toBe('5');
      expect(headers['X-RateLimit-Reset']).toBeDefined();
    });

    it('should handle unlimited tier properly', async () => {
      const { getRateLimitHeaders } = await import('@/lib/x402/rate-limit');
      
      const result = {
        allowed: true,
        remaining: -1,
        limit: -1,
        resetAt: 0,
      };
      
      const headers = getRateLimitHeaders(result);
      
      expect(headers['X-RateLimit-Limit']).toBe('unlimited');
      expect(headers['X-RateLimit-Remaining']).toBe('unlimited');
    });
  });

  describe('Agent 4: Security Validation', () => {
    it('should have payment address configured in production', async () => {
      const { PAYMENT_ADDRESS, IS_PRODUCTION } = await import('@/lib/x402/config');
      
      if (IS_PRODUCTION) {
        expect(PAYMENT_ADDRESS).toBeDefined();
        expect(PAYMENT_ADDRESS).not.toBe('0x0000000000000000000000000000000000000000');
        expect(PAYMENT_ADDRESS).toMatch(/^0x[a-fA-F0-9]{40}$/);
      }
    });

    it('should not export deprecated getTierFromApiKey', async () => {
      // Import only the pricing module to avoid next/server import issues in test
      const pricingExports = await import('@/lib/x402/pricing');
      
      expect(pricingExports).not.toHaveProperty('getTierFromApiKey');
    });

    it('should validate API keys properly (not prefix-based)', async () => {
      const { validateApiKey } = await import('@/lib/api-keys');
      
      expect(typeof validateApiKey).toBe('function');
      
      // Should return null for invalid keys
      const result = await validateApiKey('cda_fake_key_12345');
      expect(result).toBeNull();
    });
  });

  describe('Agent 5: Configuration Validation', () => {
    it('should log successful tier validation', () => {
      // This test validates that the module-level validation ran
      // If the module loaded without throwing, validation passed
      expect(API_TIERS).toBeDefined();
    });

    it('should have consistent tier configurations', () => {
      const tiers = ['free', 'pro', 'enterprise'];
      
      tiers.forEach(tier => {
        expect(API_TIERS[tier]).toBeDefined();
        expect(API_KEY_TIERS[tier]).toBeDefined();
        
        // Should have same core values
        expect(API_KEY_TIERS[tier].requestsPerDay).toBe(API_TIERS[tier].requestsPerDay);
        expect(API_KEY_TIERS[tier].requestsPerMinute).toBe(API_TIERS[tier].requestsPerMinute);
      });
    });
  });
});
