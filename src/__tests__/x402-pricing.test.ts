import { describe, it, expect } from 'vitest';

// Mock logger before importing pricing module
vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { vi } from 'vitest';
import {
  usdToUsdc,
  usdToUsdcBigInt,
  formatPrice,
  toX402Price,
  API_PRICING,
  PREMIUM_PRICING,
  getEndpointPrice,
  API_TIERS,
  isPremiumEndpoint,
  isV1PricedEndpoint,
} from '@/lib/x402/pricing';

describe('usdToUsdc', () => {
  it('should convert 0.001 USD to 1000 atomic units', () => {
    expect(usdToUsdc(0.001)).toBe('1000');
  });

  it('should convert 1.50 USD to 1500000', () => {
    expect(usdToUsdc(1.5)).toBe('1500000');
  });

  it('should convert "$0.001" string to 1000', () => {
    expect(usdToUsdc('$0.001')).toBe('1000');
  });

  it('should convert 0 to "0"', () => {
    expect(usdToUsdc(0)).toBe('0');
  });

  it('should handle whole dollar amounts', () => {
    expect(usdToUsdc(1)).toBe('1000000');
    expect(usdToUsdc(100)).toBe('100000000');
  });

  it('should handle string without $ prefix', () => {
    expect(usdToUsdc('0.005')).toBe('5000');
  });
});

describe('usdToUsdcBigInt', () => {
  it('should return BigInt', () => {
    const result = usdToUsdcBigInt(0.001);
    expect(typeof result).toBe('bigint');
    expect(result).toBe(1000n);
  });

  it('should convert $1 to 1000000n', () => {
    expect(usdToUsdcBigInt(1)).toBe(1000000n);
  });
});

describe('formatPrice', () => {
  it('should format small prices with 4 decimals', () => {
    expect(formatPrice(0.001)).toBe('$0.0010');
  });

  it('should format larger prices with 2 decimals', () => {
    expect(formatPrice(1.5)).toBe('$1.50');
  });

  it('should handle string prices', () => {
    expect(formatPrice('$0.05')).toBe('$0.05');
  });

  it('should handle zero', () => {
    expect(formatPrice(0)).toBe('$0.0000');
  });
});

describe('toX402Price', () => {
  it('should add $ prefix to number', () => {
    expect(toX402Price(0.001)).toBe('$0.001');
  });

  it('should keep existing $ prefix', () => {
    expect(toX402Price('$0.05')).toBe('$0.05');
  });

  it('should add $ prefix to string without it', () => {
    expect(toX402Price('0.001')).toBe('$0.001');
  });
});

describe('API_PRICING', () => {
  it('should have v1 news endpoint', () => {
    expect(API_PRICING['/api/v1/news']).toBe('$0.001');
  });

  it('should have v1 coins endpoint', () => {
    expect(API_PRICING['/api/v1/coins']).toBe('$0.001');
  });

  it('should have AI endpoints with higher prices', () => {
    expect(API_PRICING['/api/v1/sentiment']).toBe('$0.005');
  });

  it('all prices should start with $', () => {
    for (const [, price] of Object.entries(API_PRICING)) {
      expect(price).toMatch(/^\$\d/);
    }
  });
});

describe('getEndpointPrice', () => {
  it('should return price for known endpoint', () => {
    expect(getEndpointPrice('/api/v1/news')).toBe('$0.001');
  });

  it('should return default $0.001 for unknown endpoint', () => {
    expect(getEndpointPrice('/api/v1/unknown')).toBe('$0.001');
  });
});

describe('PREMIUM_PRICING', () => {
  it('should have premium AI endpoints', () => {
    expect(PREMIUM_PRICING['/api/premium/ai/sentiment']).toBeDefined();
    expect(PREMIUM_PRICING['/api/premium/ai/sentiment'].price).toBeGreaterThan(0);
  });

  it('every premium config should have required fields', () => {
    for (const [, config] of Object.entries(PREMIUM_PRICING)) {
      expect(config.price).toBeGreaterThanOrEqual(0);
      expect(config.description).toBeTruthy();
      expect(config.category).toBeTruthy();
      expect(config.rateLimit).toBeGreaterThan(0);
      expect(config.features.length).toBeGreaterThan(0);
    }
  });
});

describe('API_TIERS', () => {
  it('should have free tier', () => {
    expect(API_TIERS.free).toBeDefined();
    expect(API_TIERS.free.id).toBe('free');
  });

  it('should have pro tier with correct config', () => {
    expect(API_TIERS.pro).toBeDefined();
    expect(API_TIERS.pro.requestsPerDay).toBe(50000);
    expect(API_TIERS.pro.requestsPerMinute).toBe(500);
  });

  it('should have enterprise tier with highest limits', () => {
    expect(API_TIERS.enterprise).toBeDefined();
    expect(API_TIERS.enterprise.requestsPerDay).toBeGreaterThan(API_TIERS.pro.requestsPerDay);
  });

  it('each tier should have permissions', () => {
    expect(Array.isArray(API_TIERS.pro.permissions)).toBe(true);
    expect(API_TIERS.pro.permissions.length).toBeGreaterThan(0);
    expect(API_TIERS.enterprise.permissions).toContain('*');
  });
});

describe('isPremiumEndpoint', () => {
  it('should return true for premium endpoints', () => {
    expect(isPremiumEndpoint('/api/premium/ai/sentiment')).toBe(true);
  });

  it('should return false for v1 endpoints', () => {
    expect(isPremiumEndpoint('/api/v1/news')).toBe(false);
  });

  it('should return false for unknown endpoints', () => {
    expect(isPremiumEndpoint('/api/unknown')).toBe(false);
  });
});

describe('isV1PricedEndpoint', () => {
  it('should return true for v1 priced endpoints', () => {
    expect(isV1PricedEndpoint('/api/v1/news')).toBe(true);
  });

  it('should return false for unknown endpoints', () => {
    expect(isV1PricedEndpoint('/api/v1/nonexistent-route')).toBe(false);
  });
});
