/**
 * @fileoverview Middleware and Security Tests
 * Tests for global middleware, rate limiting, and security utilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import {
  generateRequestId,
  getClientIp,
  getUserAgent,
  isBot,
  getBotType,
  validateOrigin,
  sanitizeInput,
  sanitizeObject,
  isValidEmail,
  isValidUrl,
  SECURITY_HEADERS,
  getSecurityHeaders,
  getRateLimitKey,
} from '@/lib/security';
import {
  checkRateLimit,
  resetRateLimit,
  getRateLimitStatus,
  checkMultipleRateLimits,
  createRateLimitKey,
  RateLimitError,
  rateLimiter,
  checkRateLimitByRequest,
} from '@/lib/rate-limit';

// Mock Vercel KV
vi.mock('@vercel/kv', () => ({
  kv: {
    zremrangebyscore: vi.fn().mockResolvedValue(0),
    zcard: vi.fn().mockResolvedValue(0),
    zadd: vi.fn().mockResolvedValue(1),
    expire: vi.fn().mockResolvedValue(1),
    del: vi.fn().mockResolvedValue(1),
  },
}));

// Helper to create mock NextRequest
function createMockRequest(
  url: string,
  options: {
    headers?: Record<string, string>;
    method?: string;
  } = {}
): NextRequest {
  const { headers = {}, method = 'GET' } = options;
  
  const request = new NextRequest(new URL(url, 'http://localhost:3000'), {
    method,
    headers: new Headers(headers),
  });
  
  return request;
}

// =============================================================================
// REQUEST ID GENERATION TESTS
// =============================================================================

describe('generateRequestId', () => {
  it('should generate unique request IDs', () => {
    const id1 = generateRequestId();
    const id2 = generateRequestId();
    
    expect(id1).not.toBe(id2);
  });

  it('should have correct prefix format', () => {
    const id = generateRequestId();
    
    expect(id.startsWith('req_')).toBe(true);
  });

  it('should have reasonable length', () => {
    const id = generateRequestId();
    
    // Format: req_{timestamp36}_{random12}
    expect(id.length).toBeGreaterThan(15);
    expect(id.length).toBeLessThan(30);
  });

  it('should contain only URL-safe characters', () => {
    const id = generateRequestId();
    const urlSafePattern = /^[a-zA-Z0-9_]+$/;
    
    expect(urlSafePattern.test(id)).toBe(true);
  });
});

// =============================================================================
// CLIENT IP EXTRACTION TESTS
// =============================================================================

describe('getClientIp', () => {
  it('should extract IP from x-forwarded-for header', () => {
    const request = createMockRequest('http://localhost/api/test', {
      headers: { 'x-forwarded-for': '192.168.1.1, 10.0.0.1' },
    });
    
    expect(getClientIp(request)).toBe('192.168.1.1');
  });

  it('should extract IP from x-real-ip header', () => {
    const request = createMockRequest('http://localhost/api/test', {
      headers: { 'x-real-ip': '10.20.30.40' },
    });
    
    expect(getClientIp(request)).toBe('10.20.30.40');
  });

  it('should extract IP from cf-connecting-ip header', () => {
    const request = createMockRequest('http://localhost/api/test', {
      headers: { 'cf-connecting-ip': '203.0.113.50' },
    });
    
    expect(getClientIp(request)).toBe('203.0.113.50');
  });

  it('should prioritize x-forwarded-for over other headers', () => {
    const request = createMockRequest('http://localhost/api/test', {
      headers: {
        'x-forwarded-for': '1.2.3.4',
        'x-real-ip': '5.6.7.8',
        'cf-connecting-ip': '9.10.11.12',
      },
    });
    
    expect(getClientIp(request)).toBe('1.2.3.4');
  });

  it('should return unknown when no IP headers present', () => {
    const request = createMockRequest('http://localhost/api/test');
    
    expect(getClientIp(request)).toBe('unknown');
  });
});

// =============================================================================
// USER AGENT TESTS
// =============================================================================

describe('getUserAgent', () => {
  it('should extract user agent from request', () => {
    const request = createMockRequest('http://localhost/api/test', {
      headers: { 'user-agent': 'Mozilla/5.0' },
    });
    
    expect(getUserAgent(request)).toBe('Mozilla/5.0');
  });

  it('should return unknown when no user agent', () => {
    const request = createMockRequest('http://localhost/api/test');
    
    expect(getUserAgent(request)).toBe('unknown');
  });
});

describe('isBot', () => {
  it('should detect googlebot', () => {
    const request = createMockRequest('http://localhost/api/test', {
      headers: { 'user-agent': 'Googlebot/2.1 (+http://www.google.com/bot.html)' },
    });
    
    expect(isBot(request)).toBe(true);
  });

  it('should detect curl', () => {
    const request = createMockRequest('http://localhost/api/test', {
      headers: { 'user-agent': 'curl/7.68.0' },
    });
    
    expect(isBot(request)).toBe(true);
  });

  it('should detect python-requests', () => {
    const request = createMockRequest('http://localhost/api/test', {
      headers: { 'user-agent': 'python-requests/2.28.0' },
    });
    
    expect(isBot(request)).toBe(true);
  });

  it('should not flag regular browsers as bots', () => {
    const request = createMockRequest('http://localhost/api/test', {
      headers: {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    
    expect(isBot(request)).toBe(false);
  });
});

describe('getBotType', () => {
  it('should identify googlebot', () => {
    const request = createMockRequest('http://localhost/api/test', {
      headers: { 'user-agent': 'Googlebot/2.1' },
    });
    
    expect(getBotType(request)).toBe('googlebot');
  });

  it('should identify discord bot', () => {
    const request = createMockRequest('http://localhost/api/test', {
      headers: { 'user-agent': 'DiscordBot (https://discord.com)' },
    });
    
    expect(getBotType(request)).toBe('discord');
  });

  it('should return null for regular browsers', () => {
    const request = createMockRequest('http://localhost/api/test', {
      headers: { 'user-agent': 'Mozilla/5.0 Chrome/100' },
    });
    
    expect(getBotType(request)).toBe(null);
  });
});

// =============================================================================
// ORIGIN VALIDATION TESTS
// =============================================================================

describe('validateOrigin', () => {
  it('should allow request without origin', () => {
    const request = createMockRequest('http://localhost/api/test');
    
    expect(validateOrigin(request, ['https://example.com'])).toBe(true);
  });

  it('should allow exact origin match', () => {
    const request = createMockRequest('http://localhost/api/test', {
      headers: { origin: 'https://example.com' },
    });
    
    expect(validateOrigin(request, ['https://example.com'])).toBe(true);
  });

  it('should reject non-matching origin', () => {
    const request = createMockRequest('http://localhost/api/test', {
      headers: { origin: 'https://evil.com' },
    });
    
    expect(validateOrigin(request, ['https://example.com'])).toBe(false);
  });

  it('should allow wildcard origin', () => {
    const request = createMockRequest('http://localhost/api/test', {
      headers: { origin: 'https://anything.com' },
    });
    
    expect(validateOrigin(request, ['*'])).toBe(true);
  });

  it('should allow subdomain wildcard', () => {
    const request = createMockRequest('http://localhost/api/test', {
      headers: { origin: 'https://sub.example.com' },
    });
    
    expect(validateOrigin(request, ['*.example.com'])).toBe(true);
  });
});

// =============================================================================
// INPUT SANITIZATION TESTS
// =============================================================================

describe('sanitizeInput', () => {
  it('should remove HTML tags', () => {
    // The sanitizeInput removes HTML tags completely
    expect(sanitizeInput('<script>alert("xss")</script>')).toBe('alert("xss")');
  });

  it('should remove javascript: protocol', () => {
    expect(sanitizeInput('javascript:alert(1)')).toBe('alert(1)');
  });

  it('should remove event handlers', () => {
    expect(sanitizeInput('onclick=evil()')).toBe('evil()');
  });

  it('should trim whitespace', () => {
    expect(sanitizeInput('  hello world  ')).toBe('hello world');
  });

  it('should preserve normal text', () => {
    expect(sanitizeInput('Hello, this is normal text!')).toBe('Hello, this is normal text!');
  });
});

describe('sanitizeObject', () => {
  it('should sanitize string values in object', () => {
    const input = { name: '<script>evil</script>' };
    const result = sanitizeObject(input);
    
    expect(result.name).not.toContain('<script>');
  });

  it('should recursively sanitize nested objects', () => {
    const input = {
      user: {
        name: '<b>John</b>',
        bio: 'javascript:void(0)',
      },
    };
    const result = sanitizeObject(input);
    
    expect(result.user.name).not.toContain('<');
    expect(result.user.bio).not.toContain('javascript:');
  });

  it('should preserve non-string values', () => {
    const input = { count: 42, active: true };
    const result = sanitizeObject(input);
    
    expect(result.count).toBe(42);
    expect(result.active).toBe(true);
  });
});

// =============================================================================
// VALIDATION TESTS
// =============================================================================

describe('isValidEmail', () => {
  it('should validate correct email formats', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
    expect(isValidEmail('user.name@domain.org')).toBe(true);
    expect(isValidEmail('user+tag@gmail.com')).toBe(true);
  });

  it('should reject invalid email formats', () => {
    expect(isValidEmail('not-an-email')).toBe(false);
    expect(isValidEmail('@domain.com')).toBe(false);
    expect(isValidEmail('user@')).toBe(false);
    expect(isValidEmail('user @domain.com')).toBe(false);
  });
});

describe('isValidUrl', () => {
  it('should validate HTTP/HTTPS URLs', () => {
    expect(isValidUrl('https://example.com')).toBe(true);
    expect(isValidUrl('http://localhost:3000')).toBe(true);
    expect(isValidUrl('https://api.example.com/v1/resource')).toBe(true);
  });

  it('should reject non-HTTP URLs', () => {
    expect(isValidUrl('ftp://files.example.com')).toBe(false);
    expect(isValidUrl('javascript:alert(1)')).toBe(false);
    expect(isValidUrl('file:///etc/passwd')).toBe(false);
  });

  it('should reject invalid URLs', () => {
    expect(isValidUrl('not a url')).toBe(false);
    expect(isValidUrl('example.com')).toBe(false);
  });
});

// =============================================================================
// SECURITY HEADERS TESTS
// =============================================================================

describe('SECURITY_HEADERS', () => {
  it('should include X-Content-Type-Options', () => {
    expect(SECURITY_HEADERS['X-Content-Type-Options']).toBe('nosniff');
  });

  it('should include X-Frame-Options', () => {
    expect(SECURITY_HEADERS['X-Frame-Options']).toBe('DENY');
  });

  it('should include X-XSS-Protection', () => {
    expect(SECURITY_HEADERS['X-XSS-Protection']).toBe('1; mode=block');
  });

  it('should include Referrer-Policy', () => {
    expect(SECURITY_HEADERS['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
  });
});

describe('getSecurityHeaders', () => {
  it('should return Headers object with all security headers', () => {
    const headers = getSecurityHeaders();
    
    expect(headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(headers.get('X-Frame-Options')).toBe('DENY');
    expect(headers.get('X-XSS-Protection')).toBe('1; mode=block');
  });
});

// =============================================================================
// RATE LIMIT KEY TESTS
// =============================================================================

describe('getRateLimitKey', () => {
  it('should generate key with prefix, IP, and path', () => {
    const request = createMockRequest('http://localhost/api/news', {
      headers: { 'x-forwarded-for': '192.168.1.1' },
    });
    
    const key = getRateLimitKey(request, 'free');
    
    expect(key).toBe('free:192.168.1.1:/api/news');
  });
});

describe('createRateLimitKey', () => {
  it('should create key with endpoint', () => {
    const key = createRateLimitKey('free', '192.168.1.1', '/api/news');
    expect(key).toBe('free:192.168.1.1:/api/news');
  });

  it('should create key without endpoint', () => {
    const key = createRateLimitKey('global', '192.168.1.1');
    expect(key).toBe('global:192.168.1.1');
  });
});

// =============================================================================
// DISTRIBUTED RATE LIMITING TESTS
// =============================================================================

describe('checkRateLimit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should allow request when under limit', async () => {
    const result = await checkRateLimit('test:key', 100, 3600);
    
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBeLessThan(100);
  });

  it('should return correct limit in result', async () => {
    const result = await checkRateLimit('test:key', 50, 3600);
    
    expect(result.limit).toBe(50);
  });

  it('should include reset timestamp', async () => {
    const before = Date.now();
    const result = await checkRateLimit('test:key', 100, 3600);
    const after = Date.now() + 3600 * 1000;
    
    expect(result.resetAt).toBeGreaterThanOrEqual(before);
    expect(result.resetAt).toBeLessThanOrEqual(after);
  });
});

describe('getRateLimitStatus', () => {
  it('should return status without incrementing', async () => {
    const status = await getRateLimitStatus('status:key', 100, 3600);
    
    expect(status.limit).toBe(100);
    expect(typeof status.allowed).toBe('boolean');
  });
});

describe('checkMultipleRateLimits', () => {
  it('should check multiple limits and return most restrictive', async () => {
    const result = await checkMultipleRateLimits([
      { key: 'test:1', limit: 100, window: 3600 },
      { key: 'test:2', limit: 50, window: 3600 },
    ]);
    
    expect(result.allowed).toBe(true);
    expect(typeof result.remaining).toBe('number');
  });
});

// =============================================================================
// IN-MEMORY RATE LIMITER TESTS
// =============================================================================

describe('rateLimiter', () => {
  beforeEach(() => {
    // Reset any existing rate limits
    rateLimiter.reset('test:inmemory');
  });

  it('should allow requests under limit', async () => {
    await expect(
      rateLimiter.checkLimit('test:inmemory', 10, 60000)
    ).resolves.not.toThrow();
  });

  it('should track remaining requests', () => {
    const remaining = rateLimiter.getRemainingRequests('new:key', 100);
    expect(remaining).toBe(100);
  });

  it('should reset limit', () => {
    rateLimiter.reset('test:reset');
    const remaining = rateLimiter.getRemainingRequests('test:reset', 100);
    expect(remaining).toBe(100);
  });
});

describe('RateLimitError', () => {
  it('should include retryAfter property', () => {
    const error = new RateLimitError(60);
    
    expect(error.retryAfter).toBe(60);
    expect(error.name).toBe('RateLimitError');
    expect(error.message).toBe('Rate limit exceeded');
  });
});
