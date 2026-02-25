/**
 * Last-Resort Fallback Layer
 *
 * Provides a guarantee that API consumers **never** see an error response,
 * even on a cold start with every upstream API down and in-memory caches empty.
 *
 * Architecture:
 *
 *   Request
 *     │
 *     ├─ 1. In-memory cache (60 s)          ← fastest, lost on restart
 *     ├─ 2. Live upstream fetch              ← real-time data
 *     ├─ 3. In-memory stale cache (1 hr)     ← recent-ish, lost on restart
 *     ├─ 4. Disk fallback via static file    ← survives restarts + deploys
 *     │     GET /fallback/news.json
 *     │     GET /fallback/prices.json
 *     └─ 5. Hardcoded emergency payload      ← always available, never fails
 *
 * ## How disk fallback stays fresh
 *
 * - The `POST /api/internal/snapshot` route (Node runtime) writes to
 *   `public/fallback/*.json` whenever fresh data is obtained.
 * - Because these are in `public/`, they are served as static files by
 *   Next.js and cached by the CDN — zero compute cost to read.
 * - Edge routes can read them via `fetch(origin + '/fallback/news.json')`.
 * - Even if the write mechanism fails, the *previous* build's fallback
 *   files are already deployed and available.
 *
 * ## Emergency payloads
 *
 * Hardcoded data that is always in-memory, even if the filesystem is
 * completely unavailable. Outdated? Absolutely. Better than an error? Yes.
 */

// ─── Emergency Hardcoded Data (absolute last resort) ─────────────────────────

export const EMERGENCY_NEWS = {
  articles: [
    {
      title: 'Crypto market data temporarily unavailable',
      link: 'https://cryptocurrency.cv',
      description:
        'We are experiencing a temporary service disruption. Please check back shortly for the latest crypto news.',
      pubDate: new Date().toISOString(),
      source: 'Free Crypto News',
      sourceKey: 'system',
      category: 'general',
      timeAgo: 'just now',
    },
  ],
  articleCount: 1,
  source: 'all',
  _fallback: true as const,
  _fallbackLevel: 'emergency' as string,
  _fallbackTimestamp: new Date().toISOString(),
};

export const EMERGENCY_PRICES: Record<string, unknown> = {
  _fallback: true,
  _fallbackLevel: 'emergency',
  _fallbackTimestamp: new Date().toISOString(),
};

// ─── Disk Fallback Reader (works from Edge via fetch) ────────────────────────

export interface FallbackResult<T> {
  data: T;
  level: 'disk' | 'emergency';
  age?: string; // ISO timestamp of when the fallback was written
}

/**
 * Read a fallback file from the static public/ directory.
 *
 * Works from both Edge and Node runtimes because it uses `fetch()` against
 * the app's own origin.
 *
 * @param origin  - The request's origin, e.g. `request.nextUrl.origin`
 * @param file    - Filename under /fallback/, e.g. "news.json"
 * @param timeout - Max ms to wait (default 3 000)
 */
export async function readDiskFallback<T>(
  origin: string,
  file: string,
  timeout = 3_000,
): Promise<T | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    const res = await fetch(`${origin}/fallback/${file}`, {
      signal: controller.signal,
      headers: { 'x-fallback-read': '1' }, // marker for logging
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/**
 * Full fallback chain for news — guaranteed to return data, never throws.
 *
 * Call this when the stale in-memory cache is also empty.
 */
export async function getNewsFallback(
  origin: string,
): Promise<FallbackResult<typeof EMERGENCY_NEWS>> {
  // Try disk first
  const disk = await readDiskFallback<typeof EMERGENCY_NEWS>(origin, 'news.json');
  if (disk && Array.isArray(disk.articles) && disk.articles.length > 0) {
    return {
      data: { ...disk, _fallback: true, _fallbackLevel: 'disk' as const },
      level: 'disk',
      age: (disk as Record<string, unknown>)._fallbackTimestamp as string | undefined,
    };
  }

  // Emergency hardcoded
  return { data: EMERGENCY_NEWS, level: 'emergency' };
}

/**
 * Full fallback chain for prices — guaranteed to return data, never throws.
 */
export async function getPricesFallback(
  origin: string,
): Promise<FallbackResult<Record<string, unknown>>> {
  const disk = await readDiskFallback<Record<string, unknown>>(origin, 'prices.json');
  if (disk && Object.keys(disk).length > 0) {
    return {
      data: { ...disk, _fallback: true, _fallbackLevel: 'disk' },
      level: 'disk',
      age: disk._fallbackTimestamp as string | undefined,
    };
  }

  return { data: EMERGENCY_PRICES, level: 'emergency' };
}
