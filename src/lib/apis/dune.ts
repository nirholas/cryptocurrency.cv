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
    const res = await fetch(`${BASE_URL}${path}`, {
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
    if (result && result.state === 'QUERY_STATE_COMPLETED') {
      return result;
    }
    if (result && result.state === 'QUERY_STATE_FAILED') {
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
