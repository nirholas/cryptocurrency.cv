/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = '@crypto_news_cache:';
const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

/**
 * Offline-capable cache backed by AsyncStorage.
 * Falls back to cached data when network requests fail.
 */
export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    // Return data even if expired — caller decides freshness
    return entry.data;
  } catch {
    return null;
  }
}

export async function isCacheFresh(key: string): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!raw) return false;
    const entry = JSON.parse(raw);
    return Date.now() - entry.timestamp < entry.ttl;
  } catch {
    return false;
  }
}

export async function setCache<T>(
  key: string,
  data: T,
  ttlMs: number = DEFAULT_TTL_MS,
): Promise<void> {
  try {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
    };
    await AsyncStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(entry));
  } catch {
    // Silently fail — caching is best-effort
  }
}

export async function removeCache(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(`${CACHE_PREFIX}${key}`);
  } catch {
    // no-op
  }
}

export async function clearAllCache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter((k) => k.startsWith(CACHE_PREFIX));
    if (cacheKeys.length > 0) {
      await AsyncStorage.multiRemove(cacheKeys);
    }
  } catch {
    // no-op
  }
}

/**
 * Fetch with offline fallback.
 * Tries the network first, caches the result.
 * If network fails, returns cached data if available.
 */
export async function fetchWithCache<T>(
  cacheKey: string,
  fetcher: () => Promise<T>,
  ttlMs: number = DEFAULT_TTL_MS,
): Promise<{ data: T; fromCache: boolean }> {
  try {
    const data = await fetcher();
    await setCache(cacheKey, data, ttlMs);
    return { data, fromCache: false };
  } catch {
    const cached = await getCached<T>(cacheKey);
    if (cached) {
      return { data: cached, fromCache: true };
    }
    throw new Error('No network and no cached data available');
  }
}
