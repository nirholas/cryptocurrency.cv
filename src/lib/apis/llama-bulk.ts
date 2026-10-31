/**
 * Shared in-process cache for DefiLlama's bulk datasets.
 *
 * `/protocols` (~9 MB), yields `/pools` (~11 MB), `/overview/fees` (~5 MB)
 * and `/overview/dexs` (~2.3 MB) are all over the 2 MB limit of Next.js's
 * data cache, so `fetch(..., { next: { revalidate } })` silently re-downloads
 * and re-parses them on every request. Here each URL is fetched once per TTL,
 * concurrent callers share the in-flight request, and the last good copy is
 * served for an hour when DefiLlama fails.
 *
 * Returned arrays are shared by every caller and typed `ReadonlyArray`, so an
 * in-place `.sort()` / `.splice()` is a compile error. Copy before mutating.
 */

import MemoryCache, { withCache } from '@/lib/cache';
import { resilientFetchResponse } from '@/lib/resilient-fetch';

export const LLAMA_API = 'https://api.llama.fi';
export const LLAMA_YIELDS_API = 'https://yields.llama.fi';

/** Query string that drops the multi-MB chart arrays from `/overview/*`. */
const NO_CHARTS = 'excludeTotalDataChart=true&excludeTotalDataChartBreakdown=true';

const TTL_SECONDS = 300;

/** One entry per bulk URL; the 1-hour fallback copy lives in `staleCache`. */
export const llamaBulkCache = new MemoryCache(32);

/**
 * GET a DefiLlama URL, parse it as JSON and keep the result in process.
 * Throws when DefiLlama fails and no copy from the last hour exists.
 */
export function getLlamaJson<T>(
  url: string,
  options: { ttlSeconds?: number; isUsable?: (body: T) => boolean } = {},
): Promise<T> {
  return withCache(
    llamaBulkCache,
    `llama:${url}`,
    options.ttlSeconds ?? TTL_SECONDS,
    async () => {
      const response = await resilientFetchResponse(url, {
        service: 'defillama',
        timeoutMs: 20_000,
        retries: 1,
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) {
        throw new Error(`DefiLlama ${new URL(url).pathname} returned HTTP ${response.status}`);
      }
      return (await response.json()) as T;
    },
    { shouldCache: options.isUsable },
  );
}

// ---------------------------------------------------------------------------
// /protocols
// ---------------------------------------------------------------------------

/** Fields of a `/protocols` row that callers in this codebase read. */
export interface LlamaProtocol {
  id: string;
  name: string;
  slug: string;
  symbol?: string;
  category?: string;
  chain?: string;
  chains?: string[];
  tvl?: number | null;
  chainTvls?: Record<string, number>;
  change_1h?: number | null;
  change_1d?: number | null;
  change_7d?: number | null;
  mcap?: number | null;
  fdv?: number | null;
  url?: string;
  logo?: string;
  description?: string;
  gecko_id?: string | null;
  cmcId?: string | null;
  twitter?: string | null;
  audits?: string;
  audit_links?: string[];
  listedAt?: number;
  parentProtocol?: string;
  [key: string]: unknown;
}

/** All DefiLlama protocols, TVL-descending as upstream returns them. */
export async function getLlamaProtocols<T extends object = LlamaProtocol>(): Promise<
  ReadonlyArray<T>
> {
  const body = await getLlamaJson<unknown>(`${LLAMA_API}/protocols`, {
    isUsable: (b) => Array.isArray(b) && b.length > 0,
  });
  if (!Array.isArray(body)) throw new Error('DefiLlama /protocols returned a non-array body');
  return body as ReadonlyArray<T>;
}

// ---------------------------------------------------------------------------
// yields /pools
// ---------------------------------------------------------------------------

/** Fields of a yields `/pools` row that callers in this codebase read. */
export interface LlamaYieldPool {
  pool: string;
  chain: string;
  project: string;
  symbol: string;
  tvlUsd: number;
  apy: number | null;
  apyBase: number | null;
  apyReward: number | null;
  apyPct1D?: number | null;
  apyPct7D?: number | null;
  apyPct30D?: number | null;
  apyMean30d?: number | null;
  stablecoin?: boolean;
  ilRisk?: string;
  exposure?: string;
  rewardTokens?: string[] | null;
  underlyingTokens?: string[] | null;
  poolMeta?: string | null;
  predictions?: { predictedClass: string | null; predictedProbability: number | null; binnedConfidence: number | null } | null;
  mu?: number;
  sigma?: number;
  count?: number;
  outlier?: boolean;
  volumeUsd1d?: number | null;
  volumeUsd7d?: number | null;
  [key: string]: unknown;
}

/** Every DefiLlama yield pool (~20k rows). */
export async function getLlamaYieldPools<T extends object = LlamaYieldPool>(): Promise<
  ReadonlyArray<T>
> {
  const body = await getLlamaJson<{ data?: unknown }>(`${LLAMA_YIELDS_API}/pools`, {
    isUsable: (b) => Array.isArray(b?.data) && b.data.length > 0,
  });
  if (!Array.isArray(body?.data)) throw new Error('DefiLlama yields /pools returned no data array');
  return body.data as ReadonlyArray<T>;
}

// ---------------------------------------------------------------------------
// /overview/{dexs,fees}
// ---------------------------------------------------------------------------

/** Summary fields shared by `/overview/dexs` and `/overview/fees`. */
export interface LlamaOverview<P extends object> {
  protocols: ReadonlyArray<P>;
  allChains?: string[];
  chain?: string | null;
  total24h?: number | null;
  total48hto24h?: number | null;
  total7d?: number | null;
  total30d?: number | null;
  total1y?: number | null;
  totalAllTime?: number | null;
  change_1d?: number | null;
  change_7d?: number | null;
  change_1m?: number | null;
  [key: string]: unknown;
}

function overviewUrl(kind: 'dexs' | 'fees', chain?: string, dataType?: string): string {
  const path = chain ? `${kind}/${encodeURIComponent(chain)}` : kind;
  const type = dataType ? `&dataType=${encodeURIComponent(dataType)}` : '';
  return `${LLAMA_API}/overview/${path}?${NO_CHARTS}${type}`;
}

async function getOverview<P extends object>(url: string): Promise<LlamaOverview<P>> {
  const body = await getLlamaJson<LlamaOverview<P>>(url, {
    isUsable: (b) => Array.isArray(b?.protocols) && b.protocols.length > 0,
  });
  if (!Array.isArray(body?.protocols)) {
    throw new Error(`DefiLlama ${new URL(url).pathname} returned no protocols array`);
  }
  return body;
}

/** DEX volume overview, all chains or one chain, without chart arrays. */
export function getLlamaDexOverview<P extends object = Record<string, unknown>>(
  chain?: string,
): Promise<LlamaOverview<P>> {
  return getOverview<P>(overviewUrl('dexs', chain));
}

/**
 * Fees overview without chart arrays. `dataType: 'dailyRevenue'` switches the
 * `total*` fields from fees to revenue.
 */
export function getLlamaFeesOverview<P extends object = Record<string, unknown>>(
  options: { chain?: string; dataType?: 'dailyFees' | 'dailyRevenue' | 'dailyHoldersRevenue' } = {},
): Promise<LlamaOverview<P>> {
  return getOverview<P>(overviewUrl('fees', options.chain, options.dataType));
}
