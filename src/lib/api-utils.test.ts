/**
 * Tests for lib/api-utils.ts
 * Covers ETag generation, cache control headers, JSON/error responses, withTiming
 */

import { describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';
import {
  generateETag,
  checkETagMatch,
  CACHE_CONTROL,
  jsonResponse,
  errorResponse,
  withTiming,
} from '@/lib/api-utils';

// ---------------------------------------------------------------------------
// generateETag
// ---------------------------------------------------------------------------

describe('generateETag', () => {
  it('returns a quoted string', () => {
    const tag = generateETag({ a: 1 });
    expect(tag).toMatch(/^"[a-z0-9]+"$/);
  });

  it('produces the same ETag for identical data', () => {
    const data = { articles: [{ id: 1, title: 'BTC rally' }] };
    expect(generateETag(data)).toBe(generateETag(data));
  });

  it('produces different ETags for different data', () => {
    expect(generateETag({ a: 1 })).not.toBe(generateETag({ a: 2 }));
  });

  it('handles empty objects', () => {
    expect(generateETag({})).toMatch(/^"[a-z0-9]+"$/);
  });

  it('handles arrays', () => {
    expect(generateETag([1, 2, 3])).toMatch(/^"[a-z0-9]+"$/);
  });

  it('handles null', () => {
    expect(generateETag(null)).toMatch(/^"[a-z0-9]+"$/);
  });

  it('handles strings', () => {
    expect(generateETag('hello world')).toMatch(/^"[a-z0-9]+"$/);
  });
});

// ---------------------------------------------------------------------------
// checkETagMatch
// ---------------------------------------------------------------------------

describe('checkETagMatch', () => {
  function makeRequest(ifNoneMatch?: string): NextRequest {
    return new NextRequest('http://localhost/api/test', {
      headers: ifNoneMatch ? { 'if-none-match': ifNoneMatch } : {},
    });
  }

  it('returns true when ETags match', () => {
    const etag = '"abc123"';
    expect(checkETagMatch(makeRequest(etag), etag)).toBe(true);
  });

  it('returns false when ETags differ', () => {
    expect(checkETagMatch(makeRequest('"old"'), '"new"')).toBe(false);
  });

  it('returns false when if-none-match header is absent', () => {
    expect(checkETagMatch(makeRequest(), '"abc"')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// CACHE_CONTROL
// ---------------------------------------------------------------------------

describe('CACHE_CONTROL', () => {
  it('exports all expected keys', () => {
    const keys = ['realtime', 'standard', 'ai', 'static', 'immutable', 'none'] as const;
    for (const key of keys) {
      expect(CACHE_CONTROL[key]).toBeDefined();
      expect(typeof CACHE_CONTROL[key]).toBe('string');
    }
  });

  it('none value prevents caching', () => {
    expect(CACHE_CONTROL.none).toContain('no-store');
  });

  it('immutable value sets long max-age', () => {
    expect(CACHE_CONTROL.immutable).toContain('immutable');
    expect(CACHE_CONTROL.immutable).toContain('31536000');
  });

  it('realtime value has short s-maxage', () => {
    expect(CACHE_CONTROL.realtime).toContain('s-maxage=60');
  });
});

// ---------------------------------------------------------------------------
// jsonResponse
// ---------------------------------------------------------------------------

describe('jsonResponse', () => {
  it('returns 200 by default', async () => {
    const res = jsonResponse({ ok: true });
    expect(res.status).toBe(200);
  });

  it('sets Content-Type to application/json', async () => {
    const res = jsonResponse({ ok: true });
    expect(res.headers.get('Content-Type')).toContain('application/json');
  });

  it('sets CORS header', () => {
    const res = jsonResponse({ ok: true });
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });

  it('sets ETag header by default', () => {
    const res = jsonResponse({ data: 42 });
    expect(res.headers.get('ETag')).toMatch(/^"[a-z0-9]+"$/);
  });

  it('omits ETag when etag: false', () => {
    const res = jsonResponse({ data: 42 }, { etag: false });
    expect(res.headers.get('ETag')).toBeNull();
  });

  it('respects custom status code', () => {
    const res = jsonResponse({ created: true }, { status: 201 });
    expect(res.status).toBe(201);
  });

  it('uses named cache control value', () => {
    const res = jsonResponse({}, { cacheControl: 'immutable' });
    expect(res.headers.get('Cache-Control')).toContain('immutable');
  });

  it('accepts raw cache-control string', () => {
    const res = jsonResponse({}, { cacheControl: 'private, max-age=0' });
    expect(res.headers.get('Cache-Control')).toBe('private, max-age=0');
  });

  it('returns 304 when ETag matches', () => {
    const data = { articles: [] };
    const etag = generateETag(data);
    const req = new NextRequest('http://localhost/api/news', {
      headers: { 'if-none-match': etag },
    });
    const res = jsonResponse(data, { request: req });
    expect(res.status).toBe(304);
  });

  it('returns body that round-trips through JSON', async () => {
    const data = { hello: 'world', count: 5 };
    const res = jsonResponse(data);
    const parsed = await res.json();
    expect(parsed).toEqual(data);
  });
});

// ---------------------------------------------------------------------------
// errorResponse
// ---------------------------------------------------------------------------

describe('errorResponse', () => {
  it('returns 500 by default', () => {
    const res = errorResponse('Server error');
    expect(res.status).toBe(500);
  });

  it('includes error message in body', async () => {
    const res = errorResponse('Not found', undefined, 404);
    const body = await res.json();
    expect(body.error).toBe('Not found');
  });

  it('includes details when provided', async () => {
    const res = errorResponse('Validation failed', 'field "limit" must be a number');
    const body = await res.json();
    expect(body.details).toBe('field "limit" must be a number');
  });

  it('includes timestamp', async () => {
    const res = errorResponse('oops');
    const body = await res.json();
    expect(body.timestamp).toBeDefined();
    expect(() => new Date(body.timestamp)).not.toThrow();
  });

  it('respects custom status', () => {
    const res = errorResponse('Unauthorized', undefined, 401);
    expect(res.status).toBe(401);
  });

  it('sets no-store cache control', () => {
    const res = errorResponse('x');
    expect(res.headers.get('Cache-Control')).toContain('no-store');
  });

  it('sets CORS header', () => {
    const res = errorResponse('x');
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });
});

// ---------------------------------------------------------------------------
// withTiming
// ---------------------------------------------------------------------------

describe('withTiming', () => {
  it('appends _meta with responseTimeMs', () => {
    const start = Date.now() - 150;
    const result = withTiming({ articles: [] }, start);
    expect(result._meta).toBeDefined();
    expect(result._meta.responseTimeMs).toBeGreaterThanOrEqual(150);
  });

  it('preserves original data properties', () => {
    const result = withTiming({ count: 5, status: 'ok' }, Date.now());
    expect(result.count).toBe(5);
    expect(result.status).toBe('ok');
  });

  it('responseTimeMs is a number', () => {
    const result = withTiming({}, Date.now());
    expect(typeof result._meta.responseTimeMs).toBe('number');
  });
});
