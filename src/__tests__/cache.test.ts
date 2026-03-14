import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import MemoryCache, {
  newsCache,
  aiCache,
  translationCache,
  cache,
  staleCache,
  withCache,
  generateCacheKey,
} from '@/lib/cache';

describe('MemoryCache', () => {
  let testCache: InstanceType<typeof MemoryCache>;

  beforeEach(() => {
    testCache = new MemoryCache(5);
  });

  afterEach(() => {
    testCache.destroy();
  });

  describe('get / set', () => {
    it('should return null for a missing key', () => {
      expect(testCache.get('missing')).toBeNull();
    });

    it('should store and retrieve a value', () => {
      testCache.set('key1', { foo: 'bar' }, 60);
      expect(testCache.get('key1')).toEqual({ foo: 'bar' });
    });

    it('should store and retrieve primitive values', () => {
      testCache.set('num', 42, 60);
      testCache.set('str', 'hello', 60);
      expect(testCache.get('num')).toBe(42);
      expect(testCache.get('str')).toBe('hello');
    });

    it('should return null for expired entries', () => {
      vi.useFakeTimers();
      testCache.set('expiring', 'data', 10);
      expect(testCache.get('expiring')).toBe('data');
      vi.advanceTimersByTime(11_000);
      expect(testCache.get('expiring')).toBeNull();
      vi.useRealTimers();
    });

    it('should overwrite existing entries', () => {
      testCache.set('key', 'first', 60);
      testCache.set('key', 'second', 60);
      expect(testCache.get('key')).toBe('second');
    });
  });

  describe('has', () => {
    it('should return false for missing keys', () => {
      expect(testCache.has('nope')).toBe(false);
    });

    it('should return true for existing keys', () => {
      testCache.set('exists', 'yes', 60);
      expect(testCache.has('exists')).toBe(true);
    });

    it('should return false for expired keys', () => {
      vi.useFakeTimers();
      testCache.set('temp', 'value', 1);
      vi.advanceTimersByTime(2_000);
      expect(testCache.has('temp')).toBe(false);
      vi.useRealTimers();
    });
  });

  describe('delete', () => {
    it('should delete an existing key', () => {
      testCache.set('del', 'me', 60);
      expect(testCache.delete('del')).toBe(true);
      expect(testCache.get('del')).toBeNull();
    });

    it('should return false when deleting a non-existent key', () => {
      expect(testCache.delete('ghost')).toBe(false);
    });
  });

  describe('clear', () => {
    it('should remove all entries', () => {
      testCache.set('a', 1, 60);
      testCache.set('b', 2, 60);
      testCache.clear();
      expect(testCache.stats().size).toBe(0);
    });
  });

  describe('stats', () => {
    it('should report correct size and keys', () => {
      testCache.set('x', 1, 60);
      testCache.set('y', 2, 60);
      const s = testCache.stats();
      expect(s.size).toBe(2);
      expect(s.maxSize).toBe(5);
      expect(s.keys).toContain('x');
      expect(s.keys).toContain('y');
    });
  });

  describe('eviction', () => {
    it('should evict oldest entry when at capacity', () => {
      vi.useFakeTimers();
      for (let i = 0; i < 5; i++) {
        testCache.set(`key-${i}`, i, 60);
        vi.advanceTimersByTime(10);
      }
      // Cache is full (5). Adding one more should evict the oldest (key-0).
      testCache.set('key-5', 5, 60);
      expect(testCache.get('key-0')).toBeNull();
      expect(testCache.get('key-5')).toBe(5);
      vi.useRealTimers();
    });
  });

  describe('destroy', () => {
    it('should clear the cache and nullify interval', () => {
      testCache.set('a', 1, 60);
      testCache.destroy();
      expect(testCache.stats().size).toBe(0);
    });
  });
});

describe('Singleton cache instances', () => {
  it('newsCache should exist', () => {
    expect(newsCache).toBeDefined();
    expect(newsCache.stats().maxSize).toBe(500);
  });

  it('aiCache should exist', () => {
    expect(aiCache).toBeDefined();
    expect(aiCache.stats().maxSize).toBe(200);
  });

  it('translationCache should exist', () => {
    expect(translationCache).toBeDefined();
    expect(translationCache.stats().maxSize).toBe(300);
  });

  it('cache should exist', () => {
    expect(cache).toBeDefined();
    expect(cache.stats().maxSize).toBe(500);
  });

  it('staleCache should exist', () => {
    expect(staleCache).toBeDefined();
    expect(staleCache.stats().maxSize).toBe(500);
  });
});

describe('withCache', () => {
  let testCacheInstance: InstanceType<typeof MemoryCache>;

  beforeEach(() => {
    testCacheInstance = new MemoryCache(100);
    staleCache.clear();
  });

  afterEach(() => {
    testCacheInstance.destroy();
  });

  it('should return cached value on hit', async () => {
    testCacheInstance.set('hit-key', 'cached-value', 60);
    const fetchFn = vi.fn().mockResolvedValue('fresh');
    const result = await withCache(testCacheInstance, 'hit-key', 60, fetchFn);
    expect(result).toBe('cached-value');
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('should call fetchFn on cache miss', async () => {
    const fetchFn = vi.fn().mockResolvedValue('fresh-data');
    const result = await withCache(testCacheInstance, 'miss-key', 60, fetchFn);
    expect(result).toBe('fresh-data');
    expect(fetchFn).toHaveBeenCalledOnce();
  });

  it('should store fetched data in cache and staleCache', async () => {
    const fetchFn = vi.fn().mockResolvedValue('stored');
    await withCache(testCacheInstance, 'store-key', 60, fetchFn);
    expect(testCacheInstance.get('store-key')).toBe('stored');
    expect(staleCache.get('store-key')).toBe('stored');
  });

  it('should deduplicate concurrent requests for the same key', async () => {
    let resolvePromise: (v: string) => void;
    const fetchFn = vi.fn().mockImplementation(
      () =>
        new Promise<string>((resolve) => {
          resolvePromise = resolve;
        }),
    );

    const p1 = withCache(testCacheInstance, 'dedup-key', 60, fetchFn);
    const p2 = withCache(testCacheInstance, 'dedup-key', 60, fetchFn);

    resolvePromise!('deduped');
    const [r1, r2] = await Promise.all([p1, p2]);
    expect(r1).toBe('deduped');
    expect(r2).toBe('deduped');
    expect(fetchFn).toHaveBeenCalledOnce();
  });

  it('should serve stale data on fetch error when available', async () => {
    staleCache.set('stale-key', 'stale-data', 3600);
    const fetchFn = vi.fn().mockRejectedValue(new Error('network error'));
    const result = await withCache(testCacheInstance, 'stale-key', 60, fetchFn, {
      serveStaleOnError: true,
    });
    expect(result).toBe('stale-data');
  });

  it('should throw when fetch fails and no stale data available', async () => {
    const fetchFn = vi.fn().mockRejectedValue(new Error('fail'));
    await expect(
      withCache(testCacheInstance, 'no-stale', 60, fetchFn, { serveStaleOnError: true }),
    ).rejects.toThrow('fail');
  });

  it('should throw when fetch fails and serveStaleOnError is disabled', async () => {
    staleCache.set('has-stale', 'stale', 3600);
    const fetchFn = vi.fn().mockRejectedValue(new Error('fail'));
    await expect(
      withCache(testCacheInstance, 'has-stale', 60, fetchFn, { serveStaleOnError: false }),
    ).rejects.toThrow('fail');
  });
});

describe('generateCacheKey', () => {
  it('should generate key from prefix and params', () => {
    const key = generateCacheKey('news', { page: 1, limit: 10 });
    expect(key).toBe('news:limit=10&page=1');
  });

  it('should sort params alphabetically', () => {
    const key = generateCacheKey('test', { z: 'last', a: 'first' });
    expect(key).toBe('test:a=first&z=last');
  });

  it('should filter out undefined and null params', () => {
    const key = generateCacheKey('test', { a: 'keep', b: undefined, c: null, d: 'also' });
    expect(key).toBe('test:a=keep&d=also');
  });

  it('should return prefix:default for empty params', () => {
    const key = generateCacheKey('empty', {});
    expect(key).toBe('empty:default');
  });
});
