/**
 * Tests for lib/cache.ts
 * Covers MemoryCache class, withCache helper, and generateCacheKey
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import MemoryCache, {
  newsCache,
  aiCache,
  translationCache,
  cache,
  withCache,
  generateCacheKey,
} from '@/lib/cache';

// ---------------------------------------------------------------------------
// MemoryCache
// ---------------------------------------------------------------------------

describe('MemoryCache', () => {
  let c: MemoryCache;

  beforeEach(() => {
    // Create a fresh instance with no interval to avoid timer leaks
    c = new MemoryCache(10);
  });

  afterEach(() => {
    c.destroy();
  });

  it('returns null for a missing key', () => {
    expect(c.get('missing')).toBeNull();
  });

  it('stores and retrieves a value', () => {
    c.set('k', { foo: 'bar' }, 60);
    expect(c.get('k')).toEqual({ foo: 'bar' });
  });

  it('returns null after TTL expires', () => {
    vi.useFakeTimers();
    c.set('expiring', 42, 1); // 1 second TTL
    vi.advanceTimersByTime(1001);
    expect(c.get('expiring')).toBeNull();
    vi.useRealTimers();
  });

  it('has() returns true for live entry', () => {
    c.set('live', 'value', 60);
    expect(c.has('live')).toBe(true);
  });

  it('has() returns false for missing key', () => {
    expect(c.has('nope')).toBe(false);
  });

  it('has() returns false after TTL expires', () => {
    vi.useFakeTimers();
    c.set('gone', 'x', 1);
    vi.advanceTimersByTime(1001);
    expect(c.has('gone')).toBe(false);
    vi.useRealTimers();
  });

  it('delete() removes an entry', () => {
    c.set('d', 1, 60);
    expect(c.delete('d')).toBe(true);
    expect(c.get('d')).toBeNull();
  });

  it('delete() returns false for non-existent key', () => {
    expect(c.delete('ghost')).toBe(false);
  });

  it('clear() removes all entries', () => {
    c.set('a', 1, 60);
    c.set('b', 2, 60);
    c.clear();
    expect(c.stats().size).toBe(0);
  });

  it('stats() returns correct size and key list', () => {
    c.set('x', 1, 60);
    c.set('y', 2, 60);
    const s = c.stats();
    expect(s.size).toBe(2);
    expect(s.keys).toContain('x');
    expect(s.keys).toContain('y');
    expect(s.maxSize).toBe(10);
  });

  it('evicts oldest entry when at max capacity', () => {
    const small = new MemoryCache(3);
    vi.useFakeTimers();
    // Add 3 entries with slight time gaps so createdAt differs
    small.set('first', 1, 60);
    vi.advanceTimersByTime(1);
    small.set('second', 2, 60);
    vi.advanceTimersByTime(1);
    small.set('third', 3, 60);
    vi.advanceTimersByTime(1);
    // Adding a 4th should evict 'first' (oldest)
    small.set('fourth', 4, 60);
    expect(small.stats().size).toBe(3);
    expect(small.get('first')).toBeNull();
    expect(small.get('fourth')).toBe(4);
    vi.useRealTimers();
    small.destroy();
  });

  it('overwrites an existing entry', () => {
    c.set('dup', 'v1', 60);
    c.set('dup', 'v2', 60);
    expect(c.get('dup')).toBe('v2');
  });

  it('stores different types — object, array, number, boolean, null', () => {
    c.set('obj', { a: 1 }, 60);
    c.set('arr', [1, 2, 3], 60);
    c.set('num', 3.14, 60);
    c.set('bool', false, 60);
    c.set('nil', null, 60);
    expect(c.get('obj')).toEqual({ a: 1 });
    expect(c.get('arr')).toEqual([1, 2, 3]);
    expect(c.get('num')).toBe(3.14);
    expect(c.get<boolean>('bool')).toBe(false);
    // null is stored as null data — has() should still return true, get returns null
    // (internal: null data stored, but get returns null — behaviour matches)
    expect(c.get('nil')).toBeNull();
  });

  it('destroy() clears entries and stops interval', () => {
    c.set('s', 1, 60);
    c.destroy();
    expect(c.stats().size).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// generateCacheKey
// ---------------------------------------------------------------------------

describe('generateCacheKey', () => {
  it('generates a key with prefix', () => {
    expect(generateCacheKey('news', { limit: 10, locale: 'en' })).toBe('news:limit=10&locale=en');
  });

  it('sorts parameters alphabetically', () => {
    const a = generateCacheKey('p', { z: 1, a: 2 });
    const b = generateCacheKey('p', { a: 2, z: 1 });
    expect(a).toBe(b);
  });

  it('omits undefined and null values', () => {
    const key = generateCacheKey('k', { a: 1, b: undefined, c: null, d: 'val' });
    expect(key).not.toContain('b=');
    expect(key).not.toContain('c=');
    expect(key).toContain('a=1');
    expect(key).toContain('d=val');
  });

  it('uses "default" when all params are filtered', () => {
    expect(generateCacheKey('x', { a: undefined })).toBe('x:default');
  });

  it('handles empty params object', () => {
    expect(generateCacheKey('prefix', {})).toBe('prefix:default');
  });
});

// ---------------------------------------------------------------------------
// withCache
// ---------------------------------------------------------------------------

describe('withCache', () => {
  let c: MemoryCache;

  beforeEach(() => {
    c = new MemoryCache(100);
  });

  afterEach(() => {
    c.destroy();
  });

  it('calls fetchFn once and caches result', async () => {
    const fetchFn = vi.fn().mockResolvedValue({ data: 'fresh' });
    const result1 = await withCache(c, 'key1', 60, fetchFn);
    const result2 = await withCache(c, 'key1', 60, fetchFn);
    expect(result1).toEqual({ data: 'fresh' });
    expect(result2).toEqual({ data: 'fresh' });
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it('refetches after TTL expires', async () => {
    vi.useFakeTimers();
    const fetchFn = vi.fn().mockResolvedValue('v1');
    await withCache(c, 'exp', 1, fetchFn);
    vi.advanceTimersByTime(1001);
    fetchFn.mockResolvedValue('v2');
    const result = await withCache(c, 'exp', 1, fetchFn);
    expect(result).toBe('v2');
    expect(fetchFn).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it('deduplicates concurrent requests for the same key', async () => {
    let resolveFn!: (v: string) => void;
    const fetchFn = vi.fn(
      () => new Promise<string>((res) => { resolveFn = res; })
    );
    const [p1, p2, p3] = [
      withCache(c, 'concurrent', 60, fetchFn),
      withCache(c, 'concurrent', 60, fetchFn),
      withCache(c, 'concurrent', 60, fetchFn),
    ];
    resolveFn('result');
    const [r1, r2, r3] = await Promise.all([p1, p2, p3]);
    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(r1).toBe('result');
    expect(r2).toBe('result');
    expect(r3).toBe('result');
  });

  it('propagates fetch errors without caching', async () => {
    const fetchFn = vi.fn().mockRejectedValue(new Error('fetch failed'));
    await expect(withCache(c, 'fail', 60, fetchFn)).rejects.toThrow('fetch failed');
    // Next call should retry (not cached)
    fetchFn.mockResolvedValue('recovered');
    const result = await withCache(c, 'fail', 60, fetchFn);
    expect(result).toBe('recovered');
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });
});

// ---------------------------------------------------------------------------
// Singleton instances
// ---------------------------------------------------------------------------

describe('cache singletons', () => {
  it('exports newsCache as MemoryCache', () => {
    expect(newsCache).toBeInstanceOf(MemoryCache);
  });
  it('exports aiCache as MemoryCache', () => {
    expect(aiCache).toBeInstanceOf(MemoryCache);
  });
  it('exports translationCache as MemoryCache', () => {
    expect(translationCache).toBeInstanceOf(MemoryCache);
  });
  it('exports general cache as MemoryCache', () => {
    expect(cache).toBeInstanceOf(MemoryCache);
  });
});
