/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

/**
 * growthepie fee metrics (free, no key)
 *
 * Hourly median transaction cost per Ethereum chain, from
 * GET https://api.growthepie.com/v1/fees/table.json.
 *
 * @see https://docs.growthepie.com/
 * @module lib/apis/growthepie
 */

import { resilientFetch } from '@/lib/resilient-fetch';
import { staleCache } from '@/lib/cache';

const FEES_URL = 'https://api.growthepie.com/v1/fees/table.json';

interface GrowthepieSeries {
  types: string[];
  data: Array<Array<number | null>>;
}

export interface GrowthepieFeesResponse {
  chain_data: Record<string, { hourly?: Record<string, GrowthepieSeries | undefined> }>;
}

export interface ChainFee {
  /** growthepie chain key, e.g. "zksync_era" */
  chain: string;
  name: string;
  /** Median transaction cost in USD */
  usd: number;
  /** Median transaction cost in ETH */
  eth: number;
  /** Hour the median covers, ms since epoch */
  timestamp: number;
}

/** Display name and matching L2Beat / DefiLlama slugs for each growthepie chain */
export const GROWTHEPIE_CHAINS: Record<string, { name: string; slugs: string[] }> = {
  ethereum: { name: 'Ethereum L1', slugs: ['ethereum'] },
  arbitrum: { name: 'Arbitrum One', slugs: ['arbitrum'] },
  base: { name: 'Base', slugs: ['base'] },
  optimism: { name: 'OP Mainnet', slugs: ['op-mainnet', 'optimism'] },
  zksync_era: { name: 'ZKsync Era', slugs: ['zksync-era'] },
  linea: { name: 'Linea', slugs: ['linea'] },
  scroll: { name: 'Scroll', slugs: ['scroll'] },
  starknet: { name: 'Starknet', slugs: ['starknet'] },
  mantle: { name: 'Mantle', slugs: ['mantle'] },
  unichain: { name: 'Unichain', slugs: ['unichain'] },
  celo: { name: 'Celo', slugs: ['celo'] },
  taiko: { name: 'Taiko Alethia', slugs: ['taiko'] },
  metis: { name: 'Metis Andromeda', slugs: ['metis'] },
  mode: { name: 'Mode Network', slugs: ['mode'] },
};

function finite(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/**
 * Latest hourly median fee per known chain, cheapest last.
 *
 * growthepie rounds `value_usd` to 4 decimals, so sub-cent fees (OP Mainnet
 * often reports 0.0) are priced from `value_eth` at the ETH price implied by
 * the chains whose USD value survives rounding.
 */
export function latestMedianFees(response: GrowthepieFeesResponse): ChainFee[] {
  const rows: Array<Omit<ChainFee, 'usd'> & { reportedUsd: number }> = [];

  for (const [chain, meta] of Object.entries(GROWTHEPIE_CHAINS)) {
    const series = response.chain_data?.[chain]?.hourly?.txcosts_median;
    if (!series) continue;
    const ts = series.types.indexOf('unix');
    const eth = series.types.indexOf('value_eth');
    const usd = series.types.indexOf('value_usd');
    if (ts < 0 || eth < 0 || usd < 0) continue;

    let latest: Array<number | null> | undefined;
    for (const row of series.data) {
      if (!finite(row[ts]) || !finite(row[eth]) || !finite(row[usd])) continue;
      if (!latest || (row[ts] as number) > (latest[ts] as number)) latest = row;
    }
    if (!latest) continue;

    rows.push({
      chain,
      name: meta.name,
      eth: latest[eth] as number,
      reportedUsd: latest[usd] as number,
      timestamp: latest[ts] as number,
    });
  }

  // Rounding error is below 1% once value_usd is at least a cent
  const priced = rows.filter((r) => r.reportedUsd >= 0.01 && r.eth > 0);
  const ethUsd =
    priced.length > 0
      ? priced.reduce((sum, r) => sum + r.reportedUsd / r.eth, 0) / priced.length
      : null;

  return rows
    .map(({ reportedUsd, ...row }) => ({
      ...row,
      usd: ethUsd !== null ? row.eth * ethUsd : reportedUsd,
    }))
    .sort((a, b) => b.usd - a.usd);
}

/** Latest median fee per chain, or [] when growthepie is unreachable */
export async function getChainFees(): Promise<ChainFee[]> {
  try {
    const { data, stale } = await resilientFetch<GrowthepieFeesResponse>(FEES_URL, {
      service: 'growthepie',
      timeoutMs: 10_000,
      retries: 1,
      staleCache,
      staleCacheKey: 'growthepie:fees',
      next: { revalidate: 900 }, // growthepie refreshes hourly; s-maxage is 900
    });
    if (stale) console.warn('growthepie API: upstream failed, serving last known good fees');
    return latestMedianFees(data);
  } catch (error) {
    console.error('growthepie API request failed:', error);
    return [];
  }
}

/** Median USD fee keyed by every L2Beat / DefiLlama slug that maps to a growthepie chain */
export function feesBySlug(fees: ChainFee[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const fee of fees) {
    for (const slug of GROWTHEPIE_CHAINS[fee.chain]?.slugs ?? []) map.set(slug, fee.usd);
  }
  return map;
}
