import { describe, it, expect } from 'vitest';
import {
  getPresetForPath,
  buildCacheControl,
  setCdnHeaders,
  applyCacheForPath,
  type CachePreset,
} from '@/lib/cache/cdn-headers';

describe('getPresetForPath', () => {
  it('should return REALTIME for price routes', () => {
    expect(getPresetForPath('/api/prices')).toBe('REALTIME');
    expect(getPresetForPath('/api/prices/bitcoin')).toBe('REALTIME');
  });

  it('should return FAST for news routes', () => {
    expect(getPresetForPath('/api/news')).toBe('FAST');
    expect(getPresetForPath('/api/news/latest')).toBe('FAST');
  });

  it('should return STANDARD for search routes', () => {
    expect(getPresetForPath('/api/search')).toBe('STANDARD');
  });

  it('should return SLOW for archive routes', () => {
    expect(getPresetForPath('/api/archive')).toBe('SLOW');
  });

  it('should return STATIC for openapi routes', () => {
    expect(getPresetForPath('/api/openapi')).toBe('STATIC');
  });

  it('should return NONE for admin routes', () => {
    expect(getPresetForPath('/api/admin')).toBe('NONE');
    expect(getPresetForPath('/api/keys')).toBe('NONE');
  });

  it('should return STANDARD as default for unknown routes', () => {
    expect(getPresetForPath('/api/unknown')).toBe('STANDARD');
  });

  it('should return NONE for SSE and WebSocket routes', () => {
    expect(getPresetForPath('/api/sse')).toBe('NONE');
    expect(getPresetForPath('/api/ws')).toBe('NONE');
  });

  it('should return FAST for health route', () => {
    expect(getPresetForPath('/api/health')).toBe('FAST');
  });
});

describe('buildCacheControl', () => {
  it('should build cache control for REALTIME preset', () => {
    const value = buildCacheControl('REALTIME');
    expect(value).toContain('s-maxage=5');
    expect(value).toContain('stale-while-revalidate=10');
  });

  it('should build no-store for NONE preset', () => {
    const value = buildCacheControl('NONE');
    expect(value).toContain('no-store');
    expect(value).toContain('no-cache');
  });

  it('should build cache control for STATIC preset', () => {
    const value = buildCacheControl('STATIC');
    expect(value).toContain('s-maxage=86400');
    expect(value).toContain('public');
  });

  it('should accept CacheConfig object', () => {
    const value = buildCacheControl({
      sMaxAge: 100,
      maxAge: 50,
      staleWhileRevalidate: 200,
      surrogateControl: true,
    });
    expect(value).toContain('s-maxage=100');
    expect(value).toContain('max-age=50');
    expect(value).toContain('stale-while-revalidate=200');
    expect(value).toContain('public');
  });

  it('should return no-store for zero maxAge and sMaxAge', () => {
    const value = buildCacheControl({
      sMaxAge: 0,
      maxAge: 0,
      staleWhileRevalidate: 0,
      surrogateControl: false,
    });
    expect(value).toContain('no-store');
  });
});

describe('setCdnHeaders', () => {
  it('should set Cache-Control header', () => {
    const headers = new Headers();
    setCdnHeaders(headers, 'FAST');
    expect(headers.get('Cache-Control')).toContain('s-maxage=30');
  });

  it('should set Surrogate-Control for appropriate presets', () => {
    const headers = new Headers();
    setCdnHeaders(headers, 'FAST');
    expect(headers.get('Surrogate-Control')).toContain('max-age=30');
  });

  it('should not set Surrogate-Control for NONE', () => {
    const headers = new Headers();
    setCdnHeaders(headers, 'NONE');
    expect(headers.get('Surrogate-Control')).toBeNull();
  });

  it('should set Surrogate-Key when tags provided', () => {
    const headers = new Headers();
    setCdnHeaders(headers, 'FAST', ['news', 'bitcoin']);
    expect(headers.get('Surrogate-Key')).toBe('news bitcoin');
  });

  it('should set Cache-Status header', () => {
    const headers = new Headers();
    setCdnHeaders(headers, 'FAST', [], 'HIT');
    expect(headers.get('Cache-Status')).toBe('HIT');
  });

  it('should default to MISS cache status', () => {
    const headers = new Headers();
    setCdnHeaders(headers, 'FAST');
    expect(headers.get('Cache-Status')).toBe('MISS');
  });

  it('should set Vary header', () => {
    const headers = new Headers();
    setCdnHeaders(headers, 'FAST');
    expect(headers.get('Vary')).toContain('Accept-Encoding');
  });
});

describe('applyCacheForPath', () => {
  it('should auto-detect preset and apply headers', () => {
    const headers = new Headers();
    applyCacheForPath(headers, '/api/prices');
    expect(headers.get('Cache-Control')).toContain('s-maxage=5');
  });

  it('should accept optional tags', () => {
    const headers = new Headers();
    applyCacheForPath(headers, '/api/news', ['feed', 'latest']);
    expect(headers.get('Surrogate-Key')).toBe('feed latest');
  });
});
