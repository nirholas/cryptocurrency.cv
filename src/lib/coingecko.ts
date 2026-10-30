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
 * Centralized CoinGecko API fetch wrapper with rate limiting,
 * in-process caching, and a keyless DefiLlama/CoinLore fallback.
 * 
 * Prevents 429 errors during SSR builds by serializing requests
 * and respecting CoinGecko's free-tier rate limits (~10-30 calls/min).
 * 
 * Features:
 * - In-process stale-while-revalidate cache (shared by SSR + API routes)
 * - Keyless fallback (DefiLlama prices, CoinLore market lists) for
 *   /simple/price and /coins/markets when CoinGecko is rate-limited
 * - Build-time short-circuit (returns null immediately during CI/build)
 * 
 * All CoinGecko fetch calls from page-level server components should
 * use `fetchCoinGecko()` instead of raw `fetch()`.
 */

import { resilientFetchResponse } from '@/lib/resilient-fetch';
import { backOffCoinGecko, coinGeckoBackoffRemaining } from '@/lib/coingecko-backoff';
import { getKeylessMarketCoins, getKeylessSimplePrice } from '@/lib/keyless-market';

// ---------------------------------------------------------------------------
// Build-time detection
// ---------------------------------------------------------------------------
const IS_BUILD =
  process.env.NEXT_PHASE === 'phase-production-build' ||
  process.env.npm_lifecycle_event === 'build' ||
  (process.env.CI === 'true' && process.env.VERCEL_ENV === undefined);

// ---------------------------------------------------------------------------
// In-process cache (stale-while-revalidate)
// ---------------------------------------------------------------------------
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  /** TTL in ms – data is fresh until timestamp + freshMs */
  freshMs: number;
  /** Data is usable (stale) until timestamp + staleMs */
  staleMs: number;
}

const dataCache = new Map<string, CacheEntry<unknown>>();
const MAX_CACHE_ENTRIES = 200;

function getCached<T>(key: string): { data: T; fresh: boolean } | null {
  const entry = dataCache.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;

  const age = Date.now() - entry.timestamp;
  // Serve stale data up to staleMs (typically 10× the fresh window)
  if (age > entry.staleMs) {
    dataCache.delete(key);
    return null;
  }
  return { data: entry.data, fresh: age <= entry.freshMs };
}

function setCache<T>(key: string, data: T, freshSec: number): void {
  // Evict oldest entries if cache is full
  if (dataCache.size >= MAX_CACHE_ENTRIES) {
    const oldest = dataCache.keys().next().value;
    if (oldest) dataCache.delete(oldest);
  }
  dataCache.set(key, {
    data,
    timestamp: Date.now(),
    freshMs: freshSec * 1000,
    staleMs: freshSec * 10 * 1000, // serve stale for 10× TTL
  });
}

// ---------------------------------------------------------------------------
// Rate-limit state (module-scoped singleton, per-process)
// ---------------------------------------------------------------------------
interface RateLimitState {
  /** Timestamps (ms) of recent requests inside the current window */
  timestamps: number[];
}

const state: RateLimitState = {
  timestamps: [],
};

/** Sliding window size in ms */
const WINDOW_MS = 60_000;

/**
 * Max requests per window.  CoinGecko free tier allows ~10-30/min.
 * During SSR builds many pages render in parallel so keep this conservative.
 */
const MAX_REQUESTS = 10;

/** Minimum delay between consecutive requests (ms) */
const MIN_DELAY_MS = 2_000;

/** Last request timestamp */
let lastRequestTime = 0;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Remove expired timestamps from the sliding window */
function pruneWindow(): void {
  const cutoff = Date.now() - WINDOW_MS;
  state.timestamps = state.timestamps.filter((t) => t > cutoff);
}

/** Sleep helper */
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// Serialization queue – ensures only one in-flight CG request at a time
let queue: Promise<void> = Promise.resolve();

function enqueue<T>(fn: () => Promise<T>): Promise<T> {
  // Chain onto the queue so requests are serialized
  const p = queue.then(fn, fn);
  // Update queue tail (swallow errors so the chain never breaks)
  queue = p.then(() => {}, () => {});
  return p;
}

// ---------------------------------------------------------------------------
// Keyless fallback for /simple/price and /coins/markets
// ---------------------------------------------------------------------------

function flag(params: URLSearchParams, name: string): boolean {
  return params.get(name) === 'true';
}

function idList(params: URLSearchParams): string[] {
  return (params.get('ids') ?? '')
    .split(',')
    .map((id) => id.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Answer a failed CoinGecko request from the keyless sources (DefiLlama and
 * CoinLore, see `keyless-market.ts`) in CoinGecko's own response shape.
 *
 * Covers `/simple/price` and `/coins/markets` in USD. Any other endpoint or
 * quote currency returns null, as does a total upstream failure, so the
 * caller's own degradation path runs instead of serving wrong data.
 */
async function tryKeylessFallback<T>(url: string): Promise<T | null> {
  try {
    const parsed = new URL(url);
    const params = parsed.searchParams;

    if (parsed.pathname.endsWith('/simple/price')) {
      const currencies = (params.get('vs_currencies') ?? '').toLowerCase().split(',');
      if (!currencies.includes('usd')) return null;
      const ids = idList(params);
      if (ids.length === 0) return null;
      const data = await getKeylessSimplePrice(ids, {
        include24hChange: flag(params, 'include_24hr_change'),
        includeMarketCap: flag(params, 'include_market_cap'),
        include24hVol: flag(params, 'include_24hr_vol'),
        includeLastUpdatedAt: flag(params, 'include_last_updated_at'),
      });
      if (!data) return null;
      console.info(`[CoinGecko] Served ${Object.keys(data).length} prices from keyless fallback`);
      return data as unknown as T;
    }

    if (parsed.pathname.endsWith('/coins/markets')) {
      if ((params.get('vs_currency') ?? 'usd').toLowerCase() !== 'usd') return null;
      const ids = idList(params);
      const coins = await getKeylessMarketCoins({
        ids: ids.length > 0 ? ids : undefined,
        perPage: parseInt(params.get('per_page') ?? '100', 10) || 100,
        page: parseInt(params.get('page') ?? '1', 10) || 1,
      });
      if (coins.length === 0) return null;
      console.info(`[CoinGecko] Served ${coins.length} coins from keyless fallback`);
      return coins as unknown as T;
    }

    return null;
  } catch (err) {
    console.warn('[CoinGecko] Keyless fallback failed:', (err as Error).message);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface CoinGeckoFetchOptions {
  /** Next.js revalidate seconds (default 120) */
  revalidate?: number;
  /** Fetch timeout in ms (default 15 000) */
  timeout?: number;
  /** In-process cache TTL in seconds (default = revalidate value) */
  cacheTtl?: number;
  /** Skip in-process cache (e.g. for one-off requests) */
  skipCache?: boolean;
}

/**
 * Rate-limited fetch for CoinGecko endpoints.
 * 
 * - In-process stale-while-revalidate cache (shared across SSR + API)
 * - Serializes requests so only one is in flight at a time
 * - Enforces a sliding-window rate limit
 * - Respects `retry-after` headers on 429 responses
 * - Falls back to DefiLlama/CoinLore for /simple/price and /coins/markets
 * - Returns `null` on failure so pages can render gracefully with empty data
 */
export async function fetchCoinGecko<T = unknown>(
  url: string,
  options: CoinGeckoFetchOptions = {},
): Promise<T | null> {
  const { revalidate = 120, timeout = 15_000, skipCache = false } = options;
  const cacheTtl = options.cacheTtl ?? revalidate;

  // Short-circuit during build to avoid rate-limiting
  if (IS_BUILD) return null;

  // --- check in-process cache first ---
  const cacheKey = url;
  if (!skipCache) {
    const cached = getCached<T>(cacheKey);
    if (cached) {
      if (!cached.fresh) {
        // Trigger background refresh (non-blocking)
        enqueue(async () => {
          const fresh = await _fetchFromCoinGecko<T>(url, revalidate, timeout);
          if (fresh !== null) setCache(cacheKey, fresh, cacheTtl);
        }).catch(() => {});
      }
      return cached.data;
    }
  }

  // --- fetch from CoinGecko ---
  const data = await enqueue(() => _fetchFromCoinGecko<T>(url, revalidate, timeout));

  if (data !== null) {
    if (!skipCache) setCache(cacheKey, data, cacheTtl);
    return data;
  }

  // --- CoinGecko failed: try stale cache ---
  if (!skipCache) {
    // getCached already returned null above if nothing cached, but the entry
    // may have been evicted during the await. Re-check the raw map.
    const stale = dataCache.get(cacheKey) as CacheEntry<T> | undefined;
    if (stale) {
      console.warn(`[CoinGecko] Serving stale cache for ${url}`);
      return stale.data;
    }
  }

  // --- keyless fallback (DefiLlama / CoinLore) ---
  const fallback = await tryKeylessFallback<T>(url);
  if (fallback !== null && !skipCache) {
    // Cache the fallback data with a shorter TTL
    setCache(cacheKey, fallback, Math.min(cacheTtl, 60));
  }
  return fallback;
}

// ---------------------------------------------------------------------------
// Internal: raw CoinGecko fetch (no cache, no fallback)
// ---------------------------------------------------------------------------
async function _fetchFromCoinGecko<T>(
  url: string,
  revalidate: number,
  timeout: number,
): Promise<T | null> {
  // ---- wait for retry-after window if set ----
  const backoff = coinGeckoBackoffRemaining();
  if (backoff > 0) {
    // If the wait is very long (>30s), don't block — return null so fallbacks kick in
    if (backoff > 30_000) {
      console.warn(`[CoinGecko] Retry-after ${(backoff / 1000).toFixed(0)}s too long, skipping`);
      return null;
    }
    console.warn(`[CoinGecko] Waiting ${(backoff / 1000).toFixed(1)}s for retry-after`);
    await sleep(backoff);
  }

  // ---- sliding-window gate ----
  pruneWindow();
  if (state.timestamps.length >= MAX_REQUESTS) {
    const oldest = state.timestamps[0];
    const wait = oldest + WINDOW_MS - Date.now() + 500;
    if (wait > 30_000) {
      console.warn(`[CoinGecko] Rate limit wait ${(wait / 1000).toFixed(0)}s too long, skipping`);
      return null;
    }
    console.warn(`[CoinGecko] Rate limit window full – waiting ${(wait / 1000).toFixed(1)}s`);
    await sleep(Math.max(wait, 0));
    pruneWindow();
  }

  // ---- enforce minimum gap between requests ----
  const elapsed = Date.now() - lastRequestTime;
  if (elapsed < MIN_DELAY_MS) {
    await sleep(MIN_DELAY_MS - elapsed);
  }

  // ---- make request ----
  try {
    state.timestamps.push(Date.now());
    lastRequestTime = Date.now();

    // Include CoinGecko demo key if available
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'User-Agent': 'FreeCryptoNews/2.0',
    };
    if (process.env.COINGECKO_API_KEY) {
      headers['x-cg-demo-api-key'] = process.env.COINGECKO_API_KEY;
    }

    // retries: 0 because this module runs its own 429 back-off state below
    const res = await resilientFetchResponse(url, {
      service: 'coingecko',
      timeoutMs: timeout,
      retries: 0,
      headers,
      next: { revalidate },
    });

    if (res.status === 429) {
      const backoffMs = backOffCoinGecko(res.headers.get('retry-after'));
      console.warn(`[CoinGecko] 429 received – backing off ${backoffMs / 1000}s`);
      return null;
    }

    if (!res.ok) {
      console.warn(`[CoinGecko] ${res.status} from ${url}`);
      return null;
    }

    return (await res.json()) as T;
  } catch (err) {
    if ((err as Error).name === 'AbortError') {
      console.warn(`[CoinGecko] Timeout after ${timeout}ms for ${url}`);
    } else {
      console.warn(`[CoinGecko] Fetch error:`, (err as Error).message);
    }
    return null;
  }
}
