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
 * Security Tests
 *
 * Covers:
 * - Input sanitization (XSS, injection, null bytes)
 * - CSRF token generation and validation
 * - Timing-safe comparison
 * - IP validation (IPv4, IPv6)
 * - API security utilities (method enforcement, JSON parsing, response hardening)
 * - Payload size validation
 * - Request fingerprinting
 */

import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import {
  sanitizeInput,
  encodeHtmlEntities,
  generateRequestId,
  generateCsrfToken,
  timingSafeEqual,
  isValidEmail,
  isValidUrl,
  getClientIp,
  validatePayloadSize,
  sha256,
} from '@/lib/security';
import {
  enforceMethod,
  corsPreflightResponse,
  safeParseJsonBody,
  secureJsonResponse,
  safeErrorResponse,
} from '@/lib/api-security';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(
  url = 'https://example.com/api/test',
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
  } = {},
): NextRequest {
  const { method = 'GET', headers = {}, body } = options;
  return new NextRequest(url, {
    method,
    headers: new Headers(headers),
    ...(body ? { body } : {}),
  });
}

// =============================================================================
// INPUT SANITIZATION
// =============================================================================

describe('sanitizeInput', () => {
  it('strips HTML tags', () => {
    expect(sanitizeInput('<script>alert(1)</script>safe')).not.toContain('<script>');
    expect(sanitizeInput('<script>alert(1)</script>safe')).toContain('safe');
  });

  it('strips self-closing tags', () => {
    expect(sanitizeInput('<img src=x onerror=alert(1)/>')).not.toContain('<img');
  });

  it('removes javascript: protocol', () => {
    expect(sanitizeInput('javascript:alert(1)')).not.toContain('javascript:');
  });

  it('removes javascript: with spaces', () => {
    expect(sanitizeInput('javascript :alert(1)')).not.toContain('javascript');
  });

  it('removes data: protocol', () => {
    expect(sanitizeInput('data:text/html,<h1>XSS</h1>')).not.toContain('data:');
  });

  it('removes vbscript: protocol', () => {
    expect(sanitizeInput('vbscript:msgbox("XSS")')).not.toContain('vbscript:');
  });

  it('removes inline event handlers', () => {
    expect(sanitizeInput('onerror=alert(1)')).not.toContain('onerror=');
    expect(sanitizeInput('onclick =doEvil()')).not.toContain('onclick');
  });

  it('removes CSS expression()', () => {
    expect(sanitizeInput('expression(alert(1))')).not.toContain('expression(');
  });

  it('removes CSS url()', () => {
    expect(sanitizeInput('url(javascript:alert(1))')).not.toContain('url(');
  });

  it('removes null bytes', () => {
    expect(sanitizeInput('hel\0lo')).toBe('hello');
  });

  it('strips control characters', () => {
    const result = sanitizeInput('hello\x01\x02world');
    expect(result).toBe('helloworld');
  });

  it('trims whitespace', () => {
    expect(sanitizeInput('  hello  ')).toBe('hello');
  });

  it('handles empty string', () => {
    expect(sanitizeInput('')).toBe('');
  });

  it('preserves safe text', () => {
    expect(sanitizeInput('Bitcoin price is $42,000')).toBe('Bitcoin price is $42,000');
  });
});

// =============================================================================
// HTML ENTITY ENCODING
// =============================================================================

describe('encodeHtmlEntities', () => {
  it('encodes angle brackets', () => {
    expect(encodeHtmlEntities('<script>')).toBe('&lt;script&gt;');
  });

  it('encodes quotes', () => {
    expect(encodeHtmlEntities('"hello"')).toBe('&quot;hello&quot;');
    expect(encodeHtmlEntities("it's")).toBe("it&#x27;s");
  });

  it('encodes ampersand', () => {
    expect(encodeHtmlEntities('a&b')).toBe('a&amp;b');
  });

  it('encodes backticks', () => {
    expect(encodeHtmlEntities('`code`')).toBe('&#96;code&#96;');
  });

  it('preserves safe characters', () => {
    expect(encodeHtmlEntities('Hello World 123')).toBe('Hello World 123');
  });
});

// =============================================================================
// CSRF TOKENS
// =============================================================================

describe('generateCsrfToken', () => {
  it('generates a 32-character token', () => {
    const token = generateCsrfToken();
    expect(token).toHaveLength(32);
  });

  it('generates unique tokens each call', () => {
    const a = generateCsrfToken();
    const b = generateCsrfToken();
    expect(a).not.toBe(b);
  });

  it('generates URL-safe characters only', () => {
    const token = generateCsrfToken();
    expect(token).toMatch(/^[0-9A-Za-z]+$/);
  });
});

// =============================================================================
// TIMING-SAFE EQUAL
// =============================================================================

describe('timingSafeEqual', () => {
  it('returns true for equal strings', () => {
    expect(timingSafeEqual('abc123', 'abc123')).toBe(true);
  });

  it('returns false for different strings', () => {
    expect(timingSafeEqual('abc123', 'abc124')).toBe(false);
  });

  it('returns false for different lengths', () => {
    expect(timingSafeEqual('abc', 'abcd')).toBe(false);
  });

  it('returns true for empty strings', () => {
    expect(timingSafeEqual('', '')).toBe(true);
  });
});

// =============================================================================
// REQUEST ID GENERATION
// =============================================================================

describe('generateRequestId', () => {
  it('starts with req_ prefix', () => {
    expect(generateRequestId()).toMatch(/^req_/);
  });

  it('is unique per call', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateRequestId()));
    expect(ids.size).toBe(100);
  });
});

// =============================================================================
// EMAIL VALIDATION
// =============================================================================

describe('isValidEmail', () => {
  it('accepts valid email', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
  });

  it('rejects missing @', () => {
    expect(isValidEmail('userexample.com')).toBe(false);
  });

  it('rejects overly long email', () => {
    const long = 'a'.repeat(250) + '@b.com';
    expect(isValidEmail(long)).toBe(false);
  });

  it('rejects empty string', () => {
    expect(isValidEmail('')).toBe(false);
  });
});

// =============================================================================
// URL VALIDATION
// =============================================================================

describe('isValidUrl', () => {
  it('accepts https URL', () => {
    expect(isValidUrl('https://example.com')).toBe(true);
  });

  it('accepts http URL', () => {
    expect(isValidUrl('http://example.com')).toBe(true);
  });

  it('rejects javascript: URL', () => {
    expect(isValidUrl('javascript:alert(1)')).toBe(false);
  });

  it('rejects data: URL', () => {
    expect(isValidUrl('data:text/html,test')).toBe(false);
  });

  it('rejects ftp: URL', () => {
    expect(isValidUrl('ftp://files.example.com')).toBe(false);
  });

  it('rejects garbage', () => {
    expect(isValidUrl('not-a-url')).toBe(false);
  });
});

// =============================================================================
// IP EXTRACTION
// =============================================================================

describe('getClientIp', () => {
  it('extracts from x-forwarded-for', () => {
    const req = makeRequest('https://example.com/', {
      headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8' },
    });
    expect(getClientIp(req)).toBe('1.2.3.4');
  });

  it('falls back to x-real-ip', () => {
    const req = makeRequest('https://example.com/', {
      headers: { 'x-real-ip': '10.0.0.1' },
    });
    expect(getClientIp(req)).toBe('10.0.0.1');
  });

  it('returns unknown without headers', () => {
    const req = makeRequest('https://example.com/');
    expect(getClientIp(req)).toBe('unknown');
  });
});

// =============================================================================
// PAYLOAD SIZE VALIDATION
// =============================================================================

describe('validatePayloadSize', () => {
  it('returns null for GET requests with no body', () => {
    const req = makeRequest('https://example.com/');
    expect(validatePayloadSize(req)).toBeNull();
  });

  it('rejects oversized JSON', () => {
    const req = makeRequest('https://example.com/', {
      method: 'POST',
      headers: {
        'content-length': '2000000', // 2 MB
        'content-type': 'application/json',
      },
    });
    const result = validatePayloadSize(req);
    expect(result).toContain('Payload too large');
  });

  it('accepts reasonable JSON', () => {
    const req = makeRequest('https://example.com/', {
      method: 'POST',
      headers: {
        'content-length': '500',
        'content-type': 'application/json',
      },
    });
    expect(validatePayloadSize(req)).toBeNull();
  });
});

// =============================================================================
// SHA-256
// =============================================================================

describe('sha256', () => {
  it('produces consistent hex-encoded hash', async () => {
    const hash = await sha256('hello');
    expect(hash).toBe('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');
  });

  it('different inputs produce different hashes', async () => {
    const a = await sha256('hello');
    const b = await sha256('world');
    expect(a).not.toBe(b);
  });
});

// =============================================================================
// API SECURITY: METHOD ENFORCEMENT
// =============================================================================

describe('enforceMethod', () => {
  it('returns null for allowed method', () => {
    const req = makeRequest('https://example.com/api/test', { method: 'GET' });
    expect(enforceMethod(req, ['GET', 'HEAD'])).toBeNull();
  });

  it('returns 405 for disallowed method', () => {
    const req = makeRequest('https://example.com/api/test', { method: 'DELETE' });
    const res = enforceMethod(req, ['GET', 'POST']);
    expect(res).not.toBeNull();
    expect(res!.status).toBe(405);
  });

  it('includes Allow header in 405', async () => {
    const req = makeRequest('https://example.com/api/test', { method: 'PUT' });
    const res = enforceMethod(req, ['GET', 'POST'])!;
    expect(res.headers.get('Allow')).toBe('GET, POST');
  });
});

// =============================================================================
// API SECURITY: CORS PREFLIGHT
// =============================================================================

describe('corsPreflightResponse', () => {
  it('returns 204 with proper CORS headers', () => {
    const res = corsPreflightResponse();
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(res.headers.get('Access-Control-Max-Age')).toBe('86400');
  });

  it('advertises specified methods', () => {
    const res = corsPreflightResponse(['GET', 'POST', 'DELETE']);
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('DELETE');
  });
});

// =============================================================================
// API SECURITY: SECURE JSON RESPONSE
// =============================================================================

describe('secureJsonResponse', () => {
  it('includes hardened headers', async () => {
    const res = secureJsonResponse({ ok: true });
    expect(res.status).toBe(200);
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(res.headers.get('X-Frame-Options')).toBe('DENY');
    expect(res.headers.get('Cache-Control')).toContain('no-store');
  });

  it('supports custom status code', () => {
    const res = secureJsonResponse({ error: 'oops' }, 500);
    expect(res.status).toBe(500);
  });
});

// =============================================================================
// API SECURITY: SAFE ERROR RESPONSE
// =============================================================================

describe('safeErrorResponse', () => {
  it('includes error and code', async () => {
    const res = safeErrorResponse('Not found', 'NOT_FOUND', 404);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe('Not found');
    expect(body.code).toBe('NOT_FOUND');
    expect(body.timestamp).toBeDefined();
  });

  it('hides details in production', async () => {
    const originalEnv = process.env.NODE_ENV;
    (process.env as any).NODE_ENV = 'production';
    const res = safeErrorResponse('fail', 'ERR', 500, { stack: 'sensitive' });
    const body = await res.json();
    expect(body.details).toBeUndefined();
    (process.env as any).NODE_ENV = originalEnv;
  });

  it('shows details in development', async () => {
    const originalEnv = process.env.NODE_ENV;
    (process.env as any).NODE_ENV = 'development';
    const res = safeErrorResponse('fail', 'ERR', 500, { info: 'debug' });
    const body = await res.json();
    expect(body.details).toEqual({ info: 'debug' });
    (process.env as any).NODE_ENV = originalEnv;
  });
});

// =============================================================================
// API SECURITY: SAFE JSON BODY PARSING
// =============================================================================

describe('safeParseJsonBody', () => {
  it('rejects non-JSON content-type', async () => {
    const req = makeRequest('https://example.com/api/test', {
      method: 'POST',
      headers: { 'content-type': 'text/plain' },
      body: '{"key":"val"}',
    });
    const result = await safeParseJsonBody(req);
    expect(result).toBeInstanceOf(Response);
    if (result instanceof Response) {
      expect(result.status).toBe(415);
    }
  });

  it('rejects oversized body via content-length', async () => {
    const req = makeRequest('https://example.com/api/test', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'content-length': '99999999',
      },
      body: '{}',
    });
    const result = await safeParseJsonBody(req);
    expect(result).toBeInstanceOf(Response);
    if (result instanceof Response) {
      expect(result.status).toBe(413);
    }
  });

  it('parses valid JSON correctly', async () => {
    const req = makeRequest('https://example.com/api/test', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'Bitcoin Update' }),
    });
    const result = await safeParseJsonBody<{ title: string }>(req);
    expect(result).not.toBeInstanceOf(Response);
    if (!(result instanceof Response)) {
      expect(result.title).toBe('Bitcoin Update');
    }
  });
});
