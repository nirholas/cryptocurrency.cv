import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import {
  generateETag,
  checkETagMatch,
  jsonResponse,
  errorResponse,
  withTiming,
  CACHE_CONTROL,
} from '@/lib/api-utils';

describe('generateETag', () => {
  it('should generate a quoted string', () => {
    const etag = generateETag({ hello: 'world' });
    expect(etag).toMatch(/^"[a-z0-9]+"$/);
  });

  it('should generate the same etag for the same data', () => {
    const data = { a: 1, b: 'test' };
    expect(generateETag(data)).toBe(generateETag(data));
  });

  it('should generate different etags for different data', () => {
    expect(generateETag({ a: 1 })).not.toBe(generateETag({ a: 2 }));
  });

  it('should handle null', () => {
    expect(generateETag(null)).toBeTruthy();
  });

  it('should throw for undefined (JSON.stringify returns undefined)', () => {
    expect(() => generateETag(undefined)).toThrow();
  });

  it('should handle arrays', () => {
    expect(generateETag([1, 2, 3])).toBeTruthy();
  });

  it('should handle empty objects', () => {
    const etag = generateETag({});
    expect(etag).toMatch(/^"[a-z0-9]+"$/);
  });
});

describe('checkETagMatch', () => {
  it('should return true when if-none-match matches', () => {
    const etag = '"abc123"';
    const request = new NextRequest('https://example.com', {
      headers: { 'if-none-match': etag },
    });
    expect(checkETagMatch(request, etag)).toBe(true);
  });

  it('should return false when if-none-match does not match', () => {
    const request = new NextRequest('https://example.com', {
      headers: { 'if-none-match': '"old"' },
    });
    expect(checkETagMatch(request, '"new"')).toBe(false);
  });

  it('should return false when no if-none-match header', () => {
    const request = new NextRequest('https://example.com');
    expect(checkETagMatch(request, '"any"')).toBe(false);
  });
});

describe('CACHE_CONTROL', () => {
  it('should have all expected cache control values', () => {
    expect(CACHE_CONTROL.realtime).toBeDefined();
    expect(CACHE_CONTROL.standard).toBeDefined();
    expect(CACHE_CONTROL.ai).toBeDefined();
    expect(CACHE_CONTROL.static).toBeDefined();
    expect(CACHE_CONTROL.immutable).toBeDefined();
    expect(CACHE_CONTROL.none).toBeDefined();
  });

  it('none should disable caching', () => {
    expect(CACHE_CONTROL.none).toContain('no-store');
  });

  it('immutable should have long max-age', () => {
    expect(CACHE_CONTROL.immutable).toContain('immutable');
  });
});

describe('jsonResponse', () => {
  it('should return JSON response with correct content type', async () => {
    const response = jsonResponse({ data: 'test' });
    expect(response.headers.get('Content-Type')).toContain('application/json');
  });

  it('should default to status 200', () => {
    const response = jsonResponse({ ok: true });
    expect(response.status).toBe(200);
  });

  it('should allow custom status code', () => {
    const response = jsonResponse({ created: true }, { status: 201 });
    expect(response.status).toBe(201);
  });

  it('should include ETag header by default', () => {
    const response = jsonResponse({ data: 'etag-test' });
    expect(response.headers.get('ETag')).toBeTruthy();
  });

  it('should skip ETag when disabled', () => {
    const response = jsonResponse({ data: 'no-etag' }, { etag: false });
    expect(response.headers.get('ETag')).toBeNull();
  });

  it('should return 304 when ETag matches', () => {
    const data = { x: 1 };
    const etag = generateETag(data);
    const request = new NextRequest('https://example.com', {
      headers: { 'if-none-match': etag },
    });
    const response = jsonResponse(data, { request });
    expect(response.status).toBe(304);
  });

  it('should set Cache-Control using preset key', () => {
    const response = jsonResponse({}, { cacheControl: 'realtime' });
    expect(response.headers.get('Cache-Control')).toBe(CACHE_CONTROL.realtime);
  });

  it('should set Cache-Control using custom string', () => {
    const response = jsonResponse({}, { cacheControl: 'max-age=999' });
    expect(response.headers.get('Cache-Control')).toBe('max-age=999');
  });

  it('should set X-Stale header when stale flag is true', () => {
    const response = jsonResponse({}, { stale: true });
    expect(response.headers.get('X-Stale')).toBe('1');
  });

  it('should set Last-Modified header when provided', () => {
    const date = new Date('2025-01-01T00:00:00Z');
    const response = jsonResponse({}, { lastModified: date });
    expect(response.headers.get('Last-Modified')).toBe(date.toUTCString());
  });

  it('should return 304 when If-Modified-Since matches', () => {
    const serverDate = new Date('2025-01-01T00:00:00Z');
    const request = new NextRequest('https://example.com', {
      headers: { 'if-modified-since': new Date('2025-01-02T00:00:00Z').toUTCString() },
    });
    const response = jsonResponse({ a: 1 }, { request, lastModified: serverDate, etag: false });
    expect(response.status).toBe(304);
  });

  it('should include CORS header', () => {
    const response = jsonResponse({});
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });

  it('should include Vary header', () => {
    const response = jsonResponse({});
    expect(response.headers.get('Vary')).toContain('Accept-Encoding');
  });
});

describe('errorResponse', () => {
  it('should return error with default 500 status', async () => {
    const response = errorResponse('Something went wrong');
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe('Something went wrong');
  });

  it('should allow custom status code', () => {
    const response = errorResponse('Not found', undefined, 404);
    expect(response.status).toBe(404);
  });

  it('should include details when provided', async () => {
    const response = errorResponse('Bad', 'missing field', 400);
    const body = await response.json();
    expect(body.details).toBe('missing field');
  });

  it('should include timestamp', async () => {
    const response = errorResponse('Error');
    const body = await response.json();
    expect(body.timestamp).toBeTruthy();
  });

  it('should set no-cache headers', () => {
    const response = errorResponse('Error');
    expect(response.headers.get('Cache-Control')).toContain('no-store');
  });
});

describe('withTiming', () => {
  it('should add _meta with responseTimeMs', () => {
    const start = Date.now() - 42;
    const result = withTiming({ data: 'test' }, start);
    expect(result.data).toBe('test');
    expect(result._meta.responseTimeMs).toBeGreaterThanOrEqual(40);
  });

  it('should preserve original data properties', () => {
    const result = withTiming({ a: 1, b: 'two' }, Date.now());
    expect(result.a).toBe(1);
    expect(result.b).toBe('two');
    expect(result._meta).toBeDefined();
  });
});
