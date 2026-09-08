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
 * Arkham Intelligence API Integration
 *
 * On-chain intelligence platform for wallet labelling, entity portfolios,
 * and smart money flow tracking across EVM chains.
 *
 * @see https://platform.arkhamintelligence.com/docs
 * @module lib/apis/arkham
 */

import { marketCache, apiCacheKey } from '@/lib/distributed-cache';
import { resilientFetchResponse } from '@/lib/resilient-fetch';

const BASE_URL = 'https://api.arkhamintel.com';
const API_KEY = process.env.ARKHAM_API_KEY || '';

// =============================================================================
// Types
// =============================================================================

export interface WalletLabel {
  address: string;
  chain: string;
  entityName: string | null;
  entityType: string | null;
  labels: string[];
  tags: string[];
  isContract: boolean;
  firstSeen: string | null;
  lastSeen: string | null;
}

export interface EntityPortfolio {
  entity: string;
  totalValueUsd: number;
  chains: string[];
  holdings: EntityHolding[];
  lastUpdated: string;
}

export interface EntityHolding {
  token: string;
  symbol: string;
  chain: string;
  balance: number;
  valueUsd: number;
  percentOfPortfolio: number;
  priceUsd: number;
}

export interface SmartMoneyFlow {
  id: string;
  from: {
    address: string;
    entity: string | null;
    labels: string[];
  };
  to: {
    address: string;
    entity: string | null;
    labels: string[];
  };
  token: string;
  symbol: string;
  chain: string;
  amount: number;
  valueUsd: number;
  timestamp: string;
  txHash: string;
  flowType: 'accumulation' | 'distribution' | 'transfer' | 'unknown';
}

export interface SmartMoneyFlowSummary {
  flows: SmartMoneyFlow[];
  totalVolumeUsd: number;
  netFlowUsd: number;
  topAccumulators: Array<{ entity: string; netValueUsd: number }>;
  topDistributors: Array<{ entity: string; netValueUsd: number }>;
  timestamp: string;
}

// =============================================================================
// API Functions
// =============================================================================

/**
 * Fetch from Arkham Intelligence API with key auth.
 */
async function arkhamFetch<T>(
  path: string,
  params?: Record<string, string>,
): Promise<T | null> {
  if (!API_KEY) {
    console.warn('Arkham: ARKHAM_API_KEY not set — skipping request');
    return null;
  }

  const url = new URL(`${BASE_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }

  const res = await resilientFetchResponse(url.toString(), {
    service: 'arkham', timeoutMs: 8000, retries: 1,
    headers: {
      accept: 'application/json',
      'API-Key': API_KEY,
    },
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    throw new Error(`Arkham API error ${res.status}: ${path}`);
  }

  return (await res.json()) as T;
}

// ---------------------------------------------------------------------------
// Wallet Labels
// ---------------------------------------------------------------------------

/**
 * Get labels and entity attribution for a wallet address.
 */
export async function getWalletLabels(address: string): Promise<WalletLabel | null> {
  const cacheKey = apiCacheKey('arkham:wallet-labels', { address });

  return marketCache.getOrSet(
    cacheKey,
    async () => {
      const data = await arkhamFetch<{
        address: string;
        chain?: string;
        arkhamEntity?: {
          name: string;
          type?: string;
        };
        arkhamLabel?: {
          name: string;
        };
        labels?: string[];
        tags?: string[];
        isContract?: boolean;
        firstSeen?: string;
        lastSeen?: string;
      }>(`/intelligence/address/${address}`);

      if (!data) return null;

      return {
        address: data.address,
        chain: data.chain || 'ethereum',
        entityName: data.arkhamEntity?.name || data.arkhamLabel?.name || null,
        entityType: data.arkhamEntity?.type || null,
        labels: data.labels || [],
        tags: data.tags || [],
        isContract: data.isContract || false,
        firstSeen: data.firstSeen || null,
        lastSeen: data.lastSeen || null,
      } satisfies WalletLabel;
    },
    { ttl: 3600, staleTtl: 1800 }, // 1hr profiles
  );
}

// ---------------------------------------------------------------------------
// Entity Portfolio
// ---------------------------------------------------------------------------

/**
 * Get full portfolio breakdown for a known entity (e.g., "Wintermute", "Jump Trading").
 */
export async function getEntityPortfolio(entity: string): Promise<EntityPortfolio | null> {
  const cacheKey = apiCacheKey('arkham:entity-portfolio', { entity });

  return marketCache.getOrSet(
    cacheKey,
    async () => {
      const data = await arkhamFetch<{
        entity: string;
        totalUsd?: number;
        chains?: string[];
        holdings?: Array<{
          token?: string;
          symbol?: string;
          chain?: string;
          balance?: number;
          usdValue?: number;
          percentOfPortfolio?: number;
          price?: number;
        }>;
      }>(`/intelligence/entity/${encodeURIComponent(entity)}/portfolio`);

      if (!data) return null;

      const holdings: EntityHolding[] = (data.holdings || []).map((h) => ({
        token: h.token || 'unknown',
        symbol: h.symbol || 'UNKNOWN',
        chain: h.chain || 'ethereum',
        balance: h.balance || 0,
        valueUsd: h.usdValue || 0,
        percentOfPortfolio: h.percentOfPortfolio || 0,
        priceUsd: h.price || 0,
      }));

      return {
        entity: data.entity,
        totalValueUsd: data.totalUsd || holdings.reduce((s, h) => s + h.valueUsd, 0),
        chains: data.chains || [...new Set(holdings.map((h) => h.chain))],
        holdings,
        lastUpdated: new Date().toISOString(),
      } satisfies EntityPortfolio;
    },
    { ttl: 300, staleTtl: 120 }, // 5min analytics
  );
}

// ---------------------------------------------------------------------------
// Smart Money Flows
// ---------------------------------------------------------------------------

/**
 * Get recent large smart-money transactions across chains.
 */
export async function getSmartMoneyFlows(options?: {
  chain?: string;
  token?: string;
  minValueUsd?: number;
  limit?: number;
}): Promise<SmartMoneyFlowSummary> {
  const params: Record<string, string> = {};
  if (options?.chain) params.chain = options.chain;
  if (options?.token) params.token = options.token;
  if (options?.minValueUsd) params.min_value = String(options.minValueUsd);
  if (options?.limit) params.limit = String(options.limit);

  const cacheKey = apiCacheKey('arkham:smart-money-flows', params);

  return marketCache.getOrSet(
    cacheKey,
    async () => {
      const data = await arkhamFetch<{
        transfers?: Array<{
          id?: string;
          fromAddress?: { address: string; arkhamEntity?: { name: string }; labels?: string[] };
          toAddress?: { address: string; arkhamEntity?: { name: string }; labels?: string[] };
          tokenName?: string;
          tokenSymbol?: string;
          chain?: string;
          unitValue?: number;
          historicalUSD?: number;
          blockTimestamp?: string;
          transactionHash?: string;
        }>;
      }>('/intelligence/transfers', params);

      const flows: SmartMoneyFlow[] = (data?.transfers || []).map((t) => ({
        id: t.id || t.transactionHash || '',
        from: {
          address: t.fromAddress?.address || '',
          entity: t.fromAddress?.arkhamEntity?.name || null,
          labels: t.fromAddress?.labels || [],
        },
        to: {
          address: t.toAddress?.address || '',
          entity: t.toAddress?.arkhamEntity?.name || null,
          labels: t.toAddress?.labels || [],
        },
        token: t.tokenName || 'Unknown',
        symbol: t.tokenSymbol || 'UNKNOWN',
        chain: t.chain || 'ethereum',
        amount: t.unitValue || 0,
        valueUsd: t.historicalUSD || 0,
        timestamp: t.blockTimestamp || new Date().toISOString(),
        txHash: t.transactionHash || '',
        flowType: inferFlowType(t.fromAddress?.labels, t.toAddress?.labels),
      }));

      const totalVolumeUsd = flows.reduce((s, f) => s + f.valueUsd, 0);

      // Aggregate net flows by entity
      const entityNet = new Map<string, number>();
      for (const f of flows) {
        if (f.to.entity) {
          entityNet.set(f.to.entity, (entityNet.get(f.to.entity) || 0) + f.valueUsd);
        }
        if (f.from.entity) {
          entityNet.set(f.from.entity, (entityNet.get(f.from.entity) || 0) - f.valueUsd);
        }
      }

      const sorted = [...entityNet.entries()].sort((a, b) => b[1] - a[1]);
      const topAccumulators = sorted
        .filter(([, v]) => v > 0)
        .slice(0, 10)
        .map(([entity, netValueUsd]) => ({ entity, netValueUsd }));
      const topDistributors = sorted
        .filter(([, v]) => v < 0)
        .slice(0, 10)
        .map(([entity, netValueUsd]) => ({ entity, netValueUsd: Math.abs(netValueUsd) }));

      return {
        flows,
        totalVolumeUsd,
        netFlowUsd: flows.reduce(
          (s, f) => s + (f.flowType === 'accumulation' ? f.valueUsd : -f.valueUsd),
          0,
        ),
        topAccumulators,
        topDistributors,
        timestamp: new Date().toISOString(),
      } satisfies SmartMoneyFlowSummary;
    },
    { ttl: 30, staleTtl: 15 }, // 30s for flow data
  );
}

// =============================================================================
// Helpers
// =============================================================================

function inferFlowType(
  fromLabels?: string[],
  toLabels?: string[],
): SmartMoneyFlow['flowType'] {
  const fromSet = new Set((fromLabels || []).map((l) => l.toLowerCase()));
  const toSet = new Set((toLabels || []).map((l) => l.toLowerCase()));

  if (toSet.has('exchange') || toSet.has('cex')) return 'distribution';
  if (fromSet.has('exchange') || fromSet.has('cex')) return 'accumulation';
  if (toSet.has('fund') || toSet.has('market maker')) return 'accumulation';
  if (fromSet.has('fund') || fromSet.has('market maker')) return 'distribution';

  return 'unknown';
}
