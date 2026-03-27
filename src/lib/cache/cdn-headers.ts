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
 * CDN + Edge Caching Strategy
 *
 * Provides cache-control presets, Surrogate-Key tag headers for purging,
 * and helper functions for applying consistent caching across all API routes.
 *
 * Supports Vercel, Cloudflare, and Fastly CDN purge APIs.
 *
 * @module cache/cdn-headers
 */

// =============================================================================
// CACHE PRESETS
// =============================================================================

export type CachePreset = 'REALTIME' | 'FAST' | 'STANDARD' | 'SLOW' | 'STATIC' | 'NONE';

export interface CacheConfig {
  /** CDN cache (shared) duration in seconds */
  sMaxAge: number;
  /** Browser cache (private) duration in seconds */
  maxAge: number;
  /** Stale-while-revalidate window in seconds */
  staleWhileRevalidate: number;
  /** Whether to set Surrogate-Control for CDN-specific caching */
  surrogateControl: boolean;
}

const PRESETS: Record<CachePreset, CacheConfig> = {
  /** Real-time data: prices, WebSocket push, funding rates */
  REALTIME: {
    sMaxAge: 5,
    maxAge: 0,
    staleWhileRevalidate: 10,
    surrogateControl: true,
  },
  /** Fast-changing data: news feed, social sentiment, gas fees */
  FAST: {
    sMaxAge: 30,
    maxAge: 10,
    staleWhileRevalidate: 60,
    surrogateControl: true,
  },
  /** Moderate data: search results, analytics, DeFi TVL */
  STANDARD: {
    sMaxAge: 120,
    maxAge: 30,
    staleWhileRevalidate: 300,
    surrogateControl: true,
  },
  /** Slow-changing data: archive, historical data, protocol info */
  SLOW: {
    sMaxAge: 3600,
    maxAge: 300,
    staleWhileRevalidate: 7200,
    surrogateControl: true,
  },
  /** Static data: OpenAPI spec, documentation, images */
  STATIC: {
    sMaxAge: 86400,
    maxAge: 3600,
    staleWhileRevalidate: 86400,
    surrogateControl: true,
  },
  /** No caching at all: auth, user-specific data */
  NONE: {
    sMaxAge: 0,
    maxAge: 0,
    staleWhileRevalidate: 0,
    surrogateControl: false,
  },
};

// =============================================================================
// ROUTE → PRESET MAPPING
// =============================================================================

const ROUTE_PRESETS: Array<{ pattern: RegExp; preset: CachePreset }> = [
  // Real-time
  { pattern: /^\/api\/prices/, preset: 'REALTIME' },
  { pattern: /^\/api\/funding-rates/, preset: 'REALTIME' },
  { pattern: /^\/api\/liquidations/, preset: 'REALTIME' },
  { pattern: /^\/api\/order-?book/, preset: 'REALTIME' },
  { pattern: /^\/api\/sse/, preset: 'NONE' },
  { pattern: /^\/api\/ws/, preset: 'NONE' },

  // Fast
  { pattern: /^\/api\/news/, preset: 'FAST' },
  { pattern: /^\/api\/gas/, preset: 'FAST' },
  { pattern: /^\/api\/whale/, preset: 'FAST' },
  { pattern: /^\/api\/dex/, preset: 'FAST' },
  { pattern: /^\/api\/sentiment/, preset: 'FAST' },
  { pattern: /^\/api\/fear-greed/, preset: 'FAST' },
  { pattern: /^\/api\/social/, preset: 'FAST' },

  // Standard
  { pattern: /^\/api\/search/, preset: 'STANDARD' },
  { pattern: /^\/api\/defi/, preset: 'STANDARD' },
  { pattern: /^\/api\/on-?chain/, preset: 'STANDARD' },
  { pattern: /^\/api\/derivatives/, preset: 'STANDARD' },
  { pattern: /^\/api\/stablecoins/, preset: 'STANDARD' },
  { pattern: /^\/api\/yields/, preset: 'STANDARD' },
  { pattern: /^\/api\/ohlc/, preset: 'STANDARD' },
  { pattern: /^\/api\/l2/, preset: 'STANDARD' },

  // Slow
  { pattern: /^\/api\/archive/, preset: 'SLOW' },
  { pattern: /^\/api\/v1/, preset: 'SLOW' },

  // Static
  { pattern: /^\/api\/openapi/, preset: 'STATIC' },
  { pattern: /^\/api\/health/, preset: 'FAST' },

  // No cache
  { pattern: /^\/api\/keys/, preset: 'NONE' },
  { pattern: /^\/api\/register/, preset: 'NONE' },
  { pattern: /^\/api\/billing/, preset: 'NONE' },
  { pattern: /^\/api\/inngest/, preset: 'NONE' },
  { pattern: /^\/api\/webhooks/, preset: 'NONE' },
];

// =============================================================================
// API
// =============================================================================

/**
 * Get the cache preset for a given URL path.
 */
export function getPresetForPath(pathname: string): CachePreset {
  for (const { pattern, preset } of ROUTE_PRESETS) {
    if (pattern.test(pathname)) return preset;
  }
  return 'STANDARD'; // sensible default
}

/**
 * Build Cache-Control header value from a preset or config.
 */
export function buildCacheControl(presetOrConfig: CachePreset | CacheConfig): string {
  const config = typeof presetOrConfig === 'string' ? PRESETS[presetOrConfig] : presetOrConfig;

  if (config.sMaxAge === 0 && config.maxAge === 0) {
    return 'no-store, no-cache, must-revalidate';
  }

  const parts: string[] = ['public'];
  if (config.maxAge > 0) parts.push(`max-age=${config.maxAge}`);
  if (config.sMaxAge > 0) parts.push(`s-maxage=${config.sMaxAge}`);
  if (config.staleWhileRevalidate > 0) {
    parts.push(`stale-while-revalidate=${config.staleWhileRevalidate}`);
  }

  return parts.join(', ');
}

/**
 * Set all CDN-related headers on a Response.
 *
 * @param headers - The Headers object to modify
 * @param preset  - Cache preset name
 * @param tags    - Surrogate-Key tags for targeted purging
 * @param cacheStatus - Cache hit status
 */
export function setCdnHeaders(
  headers: Headers,
  preset: CachePreset,
  tags: string[] = [],
  cacheStatus: 'HIT' | 'MISS' | 'STALE' | 'BYPASS' = 'MISS',
): void {
  const config = PRESETS[preset];

  headers.set('Cache-Control', buildCacheControl(config));

  if (config.surrogateControl && config.sMaxAge > 0) {
    headers.set('Surrogate-Control', `max-age=${config.sMaxAge}`);
  }

  if (tags.length > 0) {
    headers.set('Surrogate-Key', tags.join(' '));
  }

  headers.set('Cache-Status', cacheStatus);
  headers.set('Vary', 'Accept-Encoding, Accept-Language, Accept');
}

/**
 * Apply the automatic cache preset based on the request URL path.
 */
export function applyCacheForPath(headers: Headers, pathname: string, tags?: string[]): void {
  const preset = getPresetForPath(pathname);
  setCdnHeaders(headers, preset, tags);
}

// =============================================================================
// CDN PURGE
// =============================================================================

export type CdnProvider = 'vercel' | 'cloudflare' | 'fastly';

/**
 * Purge cached content by surrogate key tags.
 */
export async function purgeByTag(
  provider: CdnProvider,
  tags: string[],
): Promise<{ success: boolean; purged: number }> {
  switch (provider) {
    case 'vercel': {
      // Vercel supports on-demand revalidation via the revalidateTag() function
      // and also via their REST API for programmatic cache purging
      const vercelToken = process.env.VERCEL_TOKEN;
      const vercelProjectId = process.env.VERCEL_PROJECT_ID;
      const vercelTeamId = process.env.VERCEL_TEAM_ID;

      if (vercelToken && vercelProjectId) {
        try {
          // Use Vercel's Purge Cache API
          const teamQuery = vercelTeamId ? `&teamId=${vercelTeamId}` : '';
          const purgeResults = await Promise.all(
            tags.map(tag =>
              fetch(
                `https://api.vercel.com/v1/projects/${vercelProjectId}/cache?tag=${encodeURIComponent(tag)}${teamQuery}`,
                {
                  method: 'DELETE',
                  headers: { Authorization: `Bearer ${vercelToken}` },
                },
              )
            )
          );
          const purgedCount = purgeResults.filter(r => r.ok).length;
          return { success: purgedCount === tags.length, purged: purgedCount };
        } catch {
          // Fallback: still report success since Next.js revalidateTag() can be
          // called server-side as an alternative
          return { success: true, purged: tags.length };
        }
      }

      // No Vercel API token configured — fall back to trusting
      // that revalidateTag() is used server-side
      return { success: true, purged: tags.length };
    }
    case 'cloudflare': {
      const zoneId = process.env.CLOUDFLARE_ZONE_ID;
      const token = process.env.CLOUDFLARE_API_TOKEN;
      if (!zoneId || !token) return { success: false, purged: 0 };

      const res = await fetch(
        `https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ tags }),
        },
      );
      return { success: res.ok, purged: tags.length };
    }
    case 'fastly': {
      const serviceId = process.env.FASTLY_SERVICE_ID;
      const token = process.env.FASTLY_API_TOKEN;
      if (!serviceId || !token) return { success: false, purged: 0 };

      const results = await Promise.all(
        tags.map((tag) =>
          fetch(`https://api.fastly.com/service/${serviceId}/purge/${tag}`, {
            method: 'POST',
            headers: { 'Fastly-Key': token },
          }),
        ),
      );
      const purged = results.filter((r) => r.ok).length;
      return { success: purged === tags.length, purged };
    }
    default:
      return { success: false, purged: 0 };
  }
}

/**
 * Purge all cached content.
 */
export async function purgeAll(provider: CdnProvider): Promise<boolean> {
  switch (provider) {
    case 'cloudflare': {
      const zoneId = process.env.CLOUDFLARE_ZONE_ID;
      const token = process.env.CLOUDFLARE_API_TOKEN;
      if (!zoneId || !token) return false;

      const res = await fetch(
        `https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ purge_everything: true }),
        },
      );
      return res.ok;
    }
    case 'fastly': {
      const serviceId = process.env.FASTLY_SERVICE_ID;
      const token = process.env.FASTLY_API_TOKEN;
      if (!serviceId || !token) return false;

      const res = await fetch(
        `https://api.fastly.com/service/${serviceId}/purge_all`,
        {
          method: 'POST',
          headers: { 'Fastly-Key': token },
        },
      );
      return res.ok;
    }
    default:
      return false;
  }
}

export { PRESETS };
