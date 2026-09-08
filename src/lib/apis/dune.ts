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
 * Dune Analytics API
 *
 * SQL-powered on-chain analytics. Execute pre-built queries or custom SQL
 * across Ethereum, Polygon, Arbitrum, Optimism, BNB Chain, Solana, and more.
 *
 * Free tier: 2500 credits/mo (≈500 small queries). Plus: $349/mo.
 * Writing/editing queries requires a Dune account; reading results is API-only.
 *
 * @see https://docs.dune.com/api-reference
 * @module lib/apis/dune
 */

import { resilientFetchResponse } from '@/lib/resilient-fetch';

const BASE_URL = 'https://api.dune.com/api/v1';
const API_KEY = process.env.DUNE_API_KEY || '';

// =============================================================================
// Types
// =============================================================================

export interface QueryResult<T = Record<string, unknown>> {
  queryId: number;
  executionId: string;
  state: 'QUERY_STATE_COMPLETED' | 'QUERY_STATE_EXECUTING' | 'QUERY_STATE_PENDING' | 'QUERY_STATE_FAILED';
  submittedAt: string;
  completedAt?: string;
  executionTimeMs?: number;
  rows: T[];
  metadata: {
    columnNames: string[];
    columnTypes: string[];
    totalRowCount: number;
  };
}

export interface QueryExecution {
  executionId: string;
  state: string;
}

/** Pre-built useful query IDs on Dune (community / popular). */
export const POPULAR_QUERIES = {
  /** Daily active addresses across chains. */
  dailyActiveAddresses: 2437365,
  /** DEX trading volume by protocol (24h). */
  dexVolumeByProtocol: 1847,
  /** Ethereum gas tracker. */
  ethGasTracker: 2508486,
  /** Top NFT collections by volume. */
  topNftCollections: 4823,
  /** Stablecoin supply on Ethereum. */
  stablecoinSupply: 3238174,
  /** Bridge volume last 30 days. */
  bridgeVolume30d: 2817908,
  /** L2 transaction count comparison. */
  l2TransactionCount: 3215235,
  /** Uniswap v3 pool analytics. */
  uniswapV3Pools: 2368,
  /** MEV activity on Ethereum. */
  mevActivity: 1438,
  /** Airdrop tracker (recent claims). */
  airdropTracker: 4172079,
} as const;

export interface DuneTableRow {
  [key: string]: string | number | boolean | null;
}

export interface DuneQueryMeta {
  queryId: number;
  name: string;
  description?: string;
  parameters?: Array<{ key: string; type: string; value: string }>;
}

// =============================================================================
// API Functions
// =============================================================================

/**
 * Fetch from Dune API with bearer auth.
 */
async function duneFetch<T>(
  path: string,
  opts?: { method?: string; body?: unknown; timeout?: number },
): Promise<T | null> {
  if (!API_KEY) {
    console.warn('Dune: DUNE_API_KEY not set — skipping request');
    return null;
  }

  try {
    const res = await resilientFetchResponse(`${BASE_URL}${path}`, {
      service: 'dune',
      timeoutMs: opts?.timeout ?? 15_000,
      retries: opts?.method && opts.method !== 'GET' ? 0 : 1,
      method: opts?.method ?? 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Dune-API-Key': API_KEY,
      },
      body: opts?.body ? JSON.stringify(opts.body) : undefined,
      next: { revalidate: 300 }, // 5 min cache
    });

    if (!res.ok) {
      console.error(`Dune API error ${res.status}: ${path}`);
      return null;
    }

    return await res.json();
  } catch (err) {
    console.error('Dune API request failed:', err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Execute Queries
// ---------------------------------------------------------------------------

/**
 * Execute a Dune query by ID and return results.
 * This triggers a fresh execution and waits for completion (polls).
 */
export async function executeQuery<T = DuneTableRow>(
  queryId: number,
  params?: Record<string, string | number>,
): Promise<QueryResult<T> | null> {
  // Step 1: Trigger execution
  const exec = await duneFetch<{ execution_id: string; state: string }>(
    `/query/${queryId}/execute`,
    {
      method: 'POST',
      body: params ? { query_parameters: params } : undefined,
    },
  );

  if (!exec?.execution_id) return null;

  // Step 2: Poll for results (max 60s)
  const maxAttempts = 20;
  const pollInterval = 3000;

  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, pollInterval));

    const result = await getExecutionResult<T>(exec.execution_id);
    if (result?.state === 'QUERY_STATE_COMPLETED') {
      return result;
    }
    if (result?.state === 'QUERY_STATE_FAILED') {
      console.error(`Dune query ${queryId} failed`);
      return null;
    }
  }

  console.warn(`Dune query ${queryId} timed out after ${maxAttempts * pollInterval / 1000}s`);
  return null;
}

/**
 * Get the latest cached results of a query without re-executing.
 * Much cheaper — uses 0 credits if results are cached.
 */
export async function getLatestResults<T = DuneTableRow>(
  queryId: number,
): Promise<QueryResult<T> | null> {
  const data = await duneFetch<{
    execution_id: string;
    query_id: number;
    state: string;
    submitted_at: string;
    completed_at?: string;
    execution_ended_at?: string;
    result?: {
      rows: T[];
      metadata: { column_names: string[]; column_types: string[]; total_row_count: number };
    };
  }>(`/query/${queryId}/results`);

  if (!data?.result) return null;

  return {
    queryId,
    executionId: data.execution_id,
    state: data.state as QueryResult['state'],
    submittedAt: data.submitted_at,
    completedAt: data.completed_at || data.execution_ended_at,
    rows: data.result.rows,
    metadata: {
      columnNames: data.result.metadata.column_names,
      columnTypes: data.result.metadata.column_types,
      totalRowCount: data.result.metadata.total_row_count,
    },
  };
}

/**
 * Get the status/results of a specific execution.
 * @alias getQueryResults
 */
export async function getExecutionResult<T = DuneTableRow>(
  executionId: string,
): Promise<QueryResult<T> | null> {
  const data = await duneFetch<{
    execution_id: string;
    query_id: number;
    state: string;
    submitted_at: string;
    completed_at?: string;
    execution_ended_at?: string;
    execution_started_at?: string;
    result?: {
      rows: T[];
      metadata: { column_names: string[]; column_types: string[]; total_row_count: number };
    };
  }>(`/execution/${executionId}/results`);

  if (!data) return null;

  const startMs = data.execution_started_at ? new Date(data.execution_started_at).getTime() : 0;
  const endMs = data.execution_ended_at ? new Date(data.execution_ended_at).getTime() : 0;

  return {
    queryId: data.query_id,
    executionId: data.execution_id,
    state: data.state as QueryResult['state'],
    submittedAt: data.submitted_at,
    completedAt: data.completed_at || data.execution_ended_at,
    executionTimeMs: startMs && endMs ? endMs - startMs : undefined,
    rows: data.result?.rows || [],
    metadata: data.result
      ? {
          columnNames: data.result.metadata.column_names,
          columnTypes: data.result.metadata.column_types,
          totalRowCount: data.result.metadata.total_row_count,
        }
      : { columnNames: [], columnTypes: [], totalRowCount: 0 },
  };
}

// ---------------------------------------------------------------------------
// Pre-Built Analytics (using popular community queries)
// ---------------------------------------------------------------------------

/**
 * Get DEX volume breakdown by protocol.
 */
export async function getDexVolumeByProtocol(): Promise<
  Array<{ protocol: string; volume24h: number; trades24h: number }> | null
> {
  const result = await getLatestResults<{
    project: string;
    volume_24h: number;
    trades_24h: number;
  }>(POPULAR_QUERIES.dexVolumeByProtocol);

  if (!result?.rows) return null;

  return result.rows.map((r) => ({
    protocol: r.project || 'Unknown',
    volume24h: r.volume_24h || 0,
    trades24h: r.trades_24h || 0,
  }));
}

/**
 * Get Ethereum gas price analytics.
 */
export async function getEthGasAnalytics(): Promise<
  Array<{ hour: string; avgGasPrice: number; maxGasPrice: number; txCount: number }> | null
> {
  const result = await getLatestResults<{
    hour: string;
    avg_gas_price: number;
    max_gas_price: number;
    tx_count: number;
  }>(POPULAR_QUERIES.ethGasTracker);

  if (!result?.rows) return null;

  return result.rows.map((r) => ({
    hour: r.hour,
    avgGasPrice: r.avg_gas_price || 0,
    maxGasPrice: r.max_gas_price || 0,
    txCount: r.tx_count || 0,
  }));
}

/**
 * Get stablecoin supply on Ethereum.
 */
export async function getStablecoinSupply(): Promise<
  Array<{ symbol: string; supply: number; change7d: number }> | null
> {
  const result = await getLatestResults<{
    symbol: string;
    total_supply: number;
    change_7d: number;
  }>(POPULAR_QUERIES.stablecoinSupply);

  if (!result?.rows) return null;

  return result.rows.map((r) => ({
    symbol: r.symbol || 'Unknown',
    supply: r.total_supply || 0,
    change7d: r.change_7d || 0,
  }));
}

/**
 * Get L2 transaction count comparison.
 */
export async function getL2TransactionComparison(): Promise<
  Array<{ chain: string; txCount24h: number; txCount7d: number }> | null
> {
  const result = await getLatestResults<{
    chain: string;
    tx_count_24h: number;
    tx_count_7d: number;
  }>(POPULAR_QUERIES.l2TransactionCount);

  if (!result?.rows) return null;

  return result.rows.map((r) => ({
    chain: r.chain || 'Unknown',
    txCount24h: r.tx_count_24h || 0,
    txCount7d: r.tx_count_7d || 0,
  }));
}

/**
 * Get bridge volumes over the last 30 days.
 */
export async function getBridgeVolumes(): Promise<
  Array<{ bridge: string; volume30d: number; txCount: number }> | null
> {
  const result = await getLatestResults<{
    bridge_name: string;
    volume_30d: number;
    tx_count: number;
  }>(POPULAR_QUERIES.bridgeVolume30d);

  if (!result?.rows) return null;

  return result.rows.map((r) => ({
    bridge: r.bridge_name || 'Unknown',
    volume30d: r.volume_30d || 0,
    txCount: r.tx_count || 0,
  }));
}

/**
 * Alias for getExecutionResult — get query results by execution ID.
 */
export const getQueryResults = getExecutionResult;

// ---------------------------------------------------------------------------
// Extended Dune Analytics Features
// ---------------------------------------------------------------------------

/**
 * Get top NFT collections by volume.
 */
export async function getTopNFTCollections(): Promise<
  Array<{ collection: string; volume24h: number; sales24h: number; floorPrice: number }> | null
> {
  const result = await getLatestResults<{
    collection_name: string;
    volume_24h: number;
    sales_24h: number;
    floor_price: number;
  }>(POPULAR_QUERIES.topNftCollections);

  if (!result?.rows) return null;

  return result.rows.map((r) => ({
    collection: r.collection_name || 'Unknown',
    volume24h: r.volume_24h || 0,
    sales24h: r.sales_24h || 0,
    floorPrice: r.floor_price || 0,
  }));
}

/**
 * Get daily active addresses across chains.
 */
export async function getDailyActiveAddresses(): Promise<
  Array<{ chain: string; date: string; activeAddresses: number }> | null
> {
  const result = await getLatestResults<{
    blockchain: string;
    date: string;
    active_addresses: number;
  }>(POPULAR_QUERIES.dailyActiveAddresses);

  if (!result?.rows) return null;

  return result.rows.map((r) => ({
    chain: r.blockchain || 'Unknown',
    date: r.date || '',
    activeAddresses: r.active_addresses || 0,
  }));
}

/**
 * Get MEV activity on Ethereum (sandwich attacks, arbitrage, liquidations).
 */
export async function getMEVActivity(): Promise<
  Array<{ type: string; count: number; profitUsd: number; date: string }> | null
> {
  const result = await getLatestResults<{
    mev_type: string;
    tx_count: number;
    profit_usd: number;
    day: string;
  }>(POPULAR_QUERIES.mevActivity);

  if (!result?.rows) return null;

  return result.rows.map((r) => ({
    type: r.mev_type || 'Unknown',
    count: r.tx_count || 0,
    profitUsd: r.profit_usd || 0,
    date: r.day || '',
  }));
}

/**
 * Get Uniswap V3 pool analytics.
 */
export async function getUniswapV3Analytics(): Promise<
  Array<{ pool: string; tvl: number; volume24h: number; fees24h: number }> | null
> {
  const result = await getLatestResults<{
    pool_name: string;
    tvl_usd: number;
    volume_24h: number;
    fees_24h: number;
  }>(POPULAR_QUERIES.uniswapV3Pools);

  if (!result?.rows) return null;

  return result.rows.map((r) => ({
    pool: r.pool_name || 'Unknown',
    tvl: r.tvl_usd || 0,
    volume24h: r.volume_24h || 0,
    fees24h: r.fees_24h || 0,
  }));
}

/**
 * Get recent airdrop claims and activity.
 */
export async function getAirdropTracker(): Promise<
  Array<{ project: string; token: string; claimers: number; totalClaimed: number; date: string }> | null
> {
  const result = await getLatestResults<{
    project: string;
    token_symbol: string;
    unique_claimers: number;
    total_claimed: number;
    day: string;
  }>(POPULAR_QUERIES.airdropTracker);

  if (!result?.rows) return null;

  return result.rows.map((r) => ({
    project: r.project || 'Unknown',
    token: r.token_symbol || '',
    claimers: r.unique_claimers || 0,
    totalClaimed: r.total_claimed || 0,
    date: r.day || '',
  }));
}

/**
 * Execute a custom SQL query with parameters — useful for parameterized queries.
 */
export async function executeCustomQuery<T = DuneTableRow>(
  queryId: number,
  params: Record<string, string | number>,
): Promise<QueryResult<T> | null> {
  return executeQuery<T>(queryId, params);
}

/**
 * Get a comprehensive Dune analytics dashboard.
 */
export async function getDuneDashboard(): Promise<{
  dexVolume: Awaited<ReturnType<typeof getDexVolumeByProtocol>>;
  ethGas: Awaited<ReturnType<typeof getEthGasAnalytics>>;
  stablecoins: Awaited<ReturnType<typeof getStablecoinSupply>>;
  l2Comparison: Awaited<ReturnType<typeof getL2TransactionComparison>>;
  bridges: Awaited<ReturnType<typeof getBridgeVolumes>>;
  nftCollections: Awaited<ReturnType<typeof getTopNFTCollections>>;
  dailyActiveAddresses: Awaited<ReturnType<typeof getDailyActiveAddresses>>;
  mev: Awaited<ReturnType<typeof getMEVActivity>>;
  airdrops: Awaited<ReturnType<typeof getAirdropTracker>>;
  timestamp: string;
}> {
  const [dexVolume, ethGas, stablecoins, l2Comparison, bridges, nftCollections, dailyActive, mev, airdrops] =
    await Promise.allSettled([
      getDexVolumeByProtocol(),
      getEthGasAnalytics(),
      getStablecoinSupply(),
      getL2TransactionComparison(),
      getBridgeVolumes(),
      getTopNFTCollections(),
      getDailyActiveAddresses(),
      getMEVActivity(),
      getAirdropTracker(),
    ]);

  return {
    dexVolume: dexVolume.status === 'fulfilled' ? dexVolume.value : null,
    ethGas: ethGas.status === 'fulfilled' ? ethGas.value : null,
    stablecoins: stablecoins.status === 'fulfilled' ? stablecoins.value : null,
    l2Comparison: l2Comparison.status === 'fulfilled' ? l2Comparison.value : null,
    bridges: bridges.status === 'fulfilled' ? bridges.value : null,
    nftCollections: nftCollections.status === 'fulfilled' ? nftCollections.value : null,
    dailyActiveAddresses: dailyActive.status === 'fulfilled' ? dailyActive.value : null,
    mev: mev.status === 'fulfilled' ? mev.value : null,
    airdrops: airdrops.status === 'fulfilled' ? airdrops.value : null,
    timestamp: new Date().toISOString(),
  };
}
