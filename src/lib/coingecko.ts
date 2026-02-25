/**
 * Centralized CoinGecko API fetch wrapper with rate limiting,
 * in-process caching, and CoinCap/CoinPaprika fallbacks.
 * 
 * Prevents 429 errors during SSR builds by serializing requests
 * and respecting CoinGecko's free-tier rate limits (~10-30 calls/min).
 * 
 * Features:
 * - In-process stale-while-revalidate cache (shared by SSR + API routes)
 * - CoinCap fallback for /coins/markets when CoinGecko is rate-limited
 * - CoinPaprika fallback for global market data
 * - Build-time short-circuit (returns null immediately during CI/build)
 * 
 * All CoinGecko fetch calls from page-level server components should
 * use `fetchCoinGecko()` instead of raw `fetch()`.
 */

import { COINCAP_BASE } from './constants';

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
  /** Absolute ms timestamp – do not send requests before this */
  retryAfter: number;
}

const state: RateLimitState = {
  timestamps: [],
  retryAfter: 0,
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
// CoinCap fallback for /coins/markets
// ---------------------------------------------------------------------------

/**
 * Map a CoinCap asset to the same shape CoinGecko /coins/markets returns.
 * Fields not available from CoinCap are set to zero / undefined.
 */
interface CoinCapAssetRaw {
  id: string;
  rank: string;
  symbol: string;
  name: string;
  supply: string;
  maxSupply: string | null;
  marketCapUsd: string;
  volumeUsd24Hr: string;
  priceUsd: string;
  changePercent24Hr: string;
  vwap24Hr: string;
}

function coinCapToMarketCoin(a: CoinCapAssetRaw): Record<string, unknown> {
  return {
    id: a.id,
    symbol: a.symbol.toLowerCase(),
    name: a.name,
    image: '', // CoinCap doesn't provide images
    current_price: parseFloat(a.priceUsd) || 0,
    market_cap: parseFloat(a.marketCapUsd) || 0,
    market_cap_rank: parseInt(a.rank, 10) || 0,
    total_volume: parseFloat(a.volumeUsd24Hr) || 0,
    price_change_percentage_24h: parseFloat(a.changePercent24Hr) || 0,
    circulating_supply: parseFloat(a.supply) || 0,
    total_supply: a.maxSupply ? parseFloat(a.maxSupply) : null,
    max_supply: a.maxSupply ? parseFloat(a.maxSupply) : null,
    ath: 0,
    ath_change_percentage: 0,
  };
}

/**
 * Try CoinCap as a fallback when a CoinGecko /coins/markets request fails.
 * Returns null if the URL is not a markets request or if CoinCap also fails.
 */
async function tryCoinCapFallback<T>(url: string): Promise<T | null> {
  try {
    // Only fall back for /coins/markets requests
    if (!url.includes('/coins/markets')) return null;

    const parsed = new URL(url);
    const perPage = parsed.searchParams.get('per_page') || '100';

    const res = await fetch(
      `${COINCAP_BASE}/assets?limit=${perPage}`,
      {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(10_000),
      },
    );
    if (!res.ok) return null;

    const json = (await res.json()) as { data: CoinCapAssetRaw[] };
    if (!Array.isArray(json?.data)) return null;

    console.info(`[CoinGecko] Served ${json.data.length} assets from CoinCap fallback`);
    return json.data.map(coinCapToMarketCoin) as unknown as T;
  } catch {
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
 * - Falls back to CoinCap for /coins/markets on failure
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

  // --- fallback to CoinCap ---
  const fallback = await tryCoinCapFallback<T>(url);
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
  if (state.retryAfter > Date.now()) {
    const wait = state.retryAfter - Date.now();
    // If the wait is very long (>30s), don't block — return null so fallbacks kick in
    if (wait > 30_000) {
      console.warn(`[CoinGecko] Retry-after ${(wait / 1000).toFixed(0)}s too long, skipping`);
      return null;
    }
    console.warn(`[CoinGecko] Waiting ${(wait / 1000).toFixed(1)}s for retry-after`);
    await sleep(wait);
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
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

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

    const res = await fetch(url, {
      signal: controller.signal,
      headers,
      next: { revalidate },
    });

    if (res.status === 429) {
      const retryAfterSec = parseInt(res.headers.get('retry-after') || '60', 10);
      state.retryAfter = Date.now() + retryAfterSec * 1000;
      console.warn(`[CoinGecko] 429 received – backing off ${retryAfterSec}s`);
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
  } finally {
    clearTimeout(timer);
  }
}
