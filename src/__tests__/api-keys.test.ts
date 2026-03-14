import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateApiKey,
  hashApiKey,
  hashApiKeySync,
  isKvConfigured,
  API_KEY_TIERS,
} from '@/lib/api-keys';

// Mock external dependencies
vi.mock('@vercel/kv', () => ({
  kv: {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    lpush: vi.fn(),
    lrange: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('@/lib/webhooks', () => ({
  sendWebhook: vi.fn(),
  webhookPayloads: {},
}));

vi.mock('@/lib/logger', () => {
  const mockLogger = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    child: vi.fn().mockReturnThis(),
  };
  return {
    logger: mockLogger,
    authLogger: mockLogger,
    apiLogger: mockLogger,
    rateLimitLogger: mockLogger,
    createLogger: vi.fn().mockReturnValue(mockLogger),
  };
});

vi.mock('@/lib/ratelimit', () => ({
  checkRateLimit: vi
    .fn()
    .mockResolvedValue({ allowed: true, remaining: 100, limit: 1000, resetAt: Date.now() + 60000 }),
  isRedisConfigured: vi.fn().mockReturnValue(false),
}));

describe('generateApiKey', () => {
  it('should generate a key with free prefix by default', () => {
    const key = generateApiKey();
    expect(key).toMatch(/^cda_free_/);
  });

  it('should generate a key with pro prefix', () => {
    const key = generateApiKey('pro');
    expect(key).toMatch(/^cda_pro_/);
  });

  it('should generate a key with enterprise prefix', () => {
    const key = generateApiKey('enterprise');
    expect(key).toMatch(/^cda_ent_/);
  });

  it('should generate unique keys', () => {
    const keys = new Set(Array.from({ length: 10 }, () => generateApiKey()));
    expect(keys.size).toBe(10);
  });

  it('should generate keys of reasonable length', () => {
    const key = generateApiKey();
    expect(key.length).toBeGreaterThanOrEqual(20);
    expect(key.length).toBeLessThanOrEqual(100);
  });

  it('should generate URL-safe characters', () => {
    const key = generateApiKey();
    // Base64URL uses only [A-Za-z0-9_-] plus the prefix chars
    expect(key).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});

describe('hashApiKey', () => {
  it('should return a hex string', async () => {
    const hash = await hashApiKey('test-key');
    expect(hash).toMatch(/^[0-9a-f]+$/);
  });

  it('should produce consistent hashes', async () => {
    const hash1 = await hashApiKey('same-key');
    const hash2 = await hashApiKey('same-key');
    expect(hash1).toBe(hash2);
  });

  it('should produce different hashes for different keys', async () => {
    const hash1 = await hashApiKey('key-a');
    const hash2 = await hashApiKey('key-b');
    expect(hash1).not.toBe(hash2);
  });

  it('should produce 64 char hex (SHA-256)', async () => {
    const hash = await hashApiKey('test');
    expect(hash.length).toBe(64);
  });
});

describe('hashApiKeySync', () => {
  it('should return a hex string', () => {
    const hash = hashApiKeySync('test-key');
    expect(hash).toMatch(/^[0-9a-f]+$/);
  });

  it('should produce consistent hashes', () => {
    expect(hashApiKeySync('same')).toBe(hashApiKeySync('same'));
  });

  it('should produce different hashes for different keys', () => {
    expect(hashApiKeySync('a')).not.toBe(hashApiKeySync('b'));
  });

  it('should return at least 8 chars (zero-padded)', () => {
    const hash = hashApiKeySync('test');
    expect(hash.length).toBeGreaterThanOrEqual(8);
  });
});

describe('isKvConfigured', () => {
  const _originalEnv = process.env;

  beforeEach(() => {
    vi.stubEnv('KV_REST_API_URL', '');
    vi.stubEnv('KV_REST_API_TOKEN', '');
  });

  it('should return false when env vars not set', () => {
    vi.stubEnv('KV_REST_API_URL', '');
    vi.stubEnv('KV_REST_API_TOKEN', '');
    expect(isKvConfigured()).toBe(false);
  });

  it('should return true when both env vars set', () => {
    vi.stubEnv('KV_REST_API_URL', 'https://kv.example.com');
    vi.stubEnv('KV_REST_API_TOKEN', 'token123');
    expect(isKvConfigured()).toBe(true);
  });
});

describe('API_KEY_TIERS', () => {
  it('should have free tier', () => {
    expect(API_KEY_TIERS.free).toBeDefined();
    expect(API_KEY_TIERS.free.name).toBeTruthy();
    // Free tier is discontinued — 0 requests
    expect(API_KEY_TIERS.free.requestsPerDay).toBe(0);
    expect(API_KEY_TIERS.free.requestsPerMinute).toBe(0);
  });

  it('should have pro tier', () => {
    expect(API_KEY_TIERS.pro).toBeDefined();
    expect(API_KEY_TIERS.pro.requestsPerDay).toBeGreaterThan(API_KEY_TIERS.free.requestsPerDay);
  });

  it('should have enterprise tier', () => {
    expect(API_KEY_TIERS.enterprise).toBeDefined();
    expect(API_KEY_TIERS.enterprise.requestsPerDay).toBeGreaterThan(
      API_KEY_TIERS.pro.requestsPerDay,
    );
  });

  it('pro and enterprise tiers should have permissions', () => {
    expect(API_KEY_TIERS.pro.features.length).toBeGreaterThan(0);
    expect(API_KEY_TIERS.enterprise.features.length).toBeGreaterThan(0);
  });

  it('free tier should have empty permissions (discontinued)', () => {
    expect(API_KEY_TIERS.free.features.length).toBe(0);
  });
});
