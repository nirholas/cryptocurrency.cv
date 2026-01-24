/**
 * Bitcoin On-Chain Data Integration
 * Free APIs for Bitcoin blockchain data
 *
 * Sources:
 * - Mempool.space: https://mempool.space/api
 * - Blockstream: https://blockstream.info/api
 * - Blockchain.info: https://blockchain.info
 *
 * @module bitcoin-onchain
 */

import { EXTERNAL_APIS, CACHE_TTL, MempoolFees, MempoolBlock } from './external-apis';
import { cache } from './cache';

// =============================================================================
// Types
// =============================================================================

export interface MempoolStats {
  funded_txo_count: number;
  funded_txo_sum: number;
  spent_txo_count: number;
  spent_txo_sum: number;
  tx_count: number;
}

export interface MempoolAddress {
  address: string;
  chain_stats: MempoolStats;
  mempool_stats: MempoolStats;
}

export interface MempoolTransaction {
  txid: string;
  version: number;
  locktime: number;
  vin: Array<{
    txid: string;
    vout: number;
    prevout: {
      scriptpubkey: string;
      value: number;
    };
    scriptsig: string;
    sequence: number;
  }>;
  vout: Array<{
    scriptpubkey: string;
    value: number;
  }>;
  size: number;
  weight: number;
  fee: number;
  status: {
    confirmed: boolean;
    block_height?: number;
    block_hash?: string;
    block_time?: number;
  };
}

export interface MempoolInfo {
  count: number;
  vsize: number;
  total_fee: number;
  fee_histogram: Array<[number, number]>;
}

export interface DifficultyAdjustment {
  progressPercent: number;
  difficultyChange: number;
  estimatedRetargetDate: number;
  remainingBlocks: number;
  remainingTime: number;
  previousRetarget: number;
  nextRetargetHeight: number;
  timeAvg: number;
  timeOffset: number;
  expectedBlocks: number;
}

export interface BlockchainStats {
  hashrate: number;
  difficulty: number;
  blockHeight: number;
  unconfirmedTxs: number;
  mempoolSize: number;
}

// =============================================================================
// Mempool.space API Functions
// =============================================================================

/**
 * Get recommended transaction fees
 */
export async function getRecommendedFees(): Promise<MempoolFees> {
  const cacheKey = 'mempool:fees';
  const cached = cache.get<MempoolFees>(cacheKey);
  if (cached) return cached;

  const response = await fetch(`${EXTERNAL_APIS.MEMPOOL}/v1/fees/recommended`);

  if (!response.ok) {
    throw new Error(`Mempool API error: ${response.status}`);
  }

  const data: MempoolFees = await response.json();
  cache.set(cacheKey, data, CACHE_TTL.fees);

  return data;
}

/**
 * Get mempool blocks projection
 */
export async function getMempoolBlocks(): Promise<
  Array<{
    blockSize: number;
    blockVSize: number;
    nTx: number;
    totalFees: number;
    medianFee: number;
    feeRange: number[];
  }>
> {
  const cacheKey = 'mempool:blocks';
  const cached = cache.get<Awaited<ReturnType<typeof getMempoolBlocks>>>(cacheKey);
  if (cached) return cached;

  const response = await fetch(`${EXTERNAL_APIS.MEMPOOL}/v1/fees/mempool-blocks`);

  if (!response.ok) {
    throw new Error(`Mempool API error: ${response.status}`);
  }

  const data = await response.json();
  cache.set(cacheKey, data, CACHE_TTL.mempool);

  return data;
}

/**
 * Get mempool info
 */
export async function getMempoolInfo(): Promise<MempoolInfo> {
  const cacheKey = 'mempool:info';
  const cached = cache.get<MempoolInfo>(cacheKey);
  if (cached) return cached;

  const response = await fetch(`${EXTERNAL_APIS.MEMPOOL}/mempool`);

  if (!response.ok) {
    throw new Error(`Mempool API error: ${response.status}`);
  }

  const data: MempoolInfo = await response.json();
  cache.set(cacheKey, data, CACHE_TTL.mempool);

  return data;
}

/**
 * Get recent blocks
 */
export async function getRecentBlocks(startHeight?: number): Promise<MempoolBlock[]> {
  const cacheKey = `mempool:blocks:recent:${startHeight || 'latest'}`;
  const cached = cache.get<MempoolBlock[]>(cacheKey);
  if (cached) return cached;

  const url = startHeight
    ? `${EXTERNAL_APIS.MEMPOOL}/v1/blocks/${startHeight}`
    : `${EXTERNAL_APIS.MEMPOOL}/v1/blocks`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Mempool API error: ${response.status}`);
  }

  const data: MempoolBlock[] = await response.json();
  cache.set(cacheKey, data, CACHE_TTL.blocks);

  return data;
}

/**
 * Get block by hash
 */
export async function getBlock(hash: string): Promise<MempoolBlock> {
  const cacheKey = `mempool:block:${hash}`;
  const cached = cache.get<MempoolBlock>(cacheKey);
  if (cached) return cached;

  const response = await fetch(`${EXTERNAL_APIS.MEMPOOL}/block/${hash}`);

  if (!response.ok) {
    throw new Error(`Mempool API error: ${response.status}`);
  }

  const data: MempoolBlock = await response.json();
  cache.set(cacheKey, data, CACHE_TTL.static); // Blocks are immutable

  return data;
}

/**
 * Get current block height
 */
export async function getBlockHeight(): Promise<number> {
  const cacheKey = 'mempool:height';
  const cached = cache.get<number>(cacheKey);
  if (cached) return cached;

  const response = await fetch(`${EXTERNAL_APIS.MEMPOOL}/blocks/tip/height`);

  if (!response.ok) {
    throw new Error(`Mempool API error: ${response.status}`);
  }

  const height = parseInt(await response.text());
  cache.set(cacheKey, height, CACHE_TTL.blocks);

  return height;
}

/**
 * Get difficulty adjustment info
 */
export async function getDifficultyAdjustment(): Promise<DifficultyAdjustment> {
  const cacheKey = 'mempool:difficulty';
  const cached = cache.get<DifficultyAdjustment>(cacheKey);
  if (cached) return cached;

  const response = await fetch(`${EXTERNAL_APIS.MEMPOOL}/v1/difficulty-adjustment`);

  if (!response.ok) {
    throw new Error(`Mempool API error: ${response.status}`);
  }

  const data: DifficultyAdjustment = await response.json();
  cache.set(cacheKey, data, CACHE_TTL.blocks);

  return data;
}

/**
 * Get address info
 */
export async function getAddress(address: string): Promise<MempoolAddress> {
  const cacheKey = `mempool:address:${address}`;
  const cached = cache.get<MempoolAddress>(cacheKey);
  if (cached) return cached;

  const response = await fetch(`${EXTERNAL_APIS.MEMPOOL}/address/${address}`);

  if (!response.ok) {
    throw new Error(`Mempool API error: ${response.status}`);
  }

  const data: MempoolAddress = await response.json();
  cache.set(cacheKey, data, CACHE_TTL.prices);

  return data;
}

/**
 * Get address transactions
 */
export async function getAddressTransactions(address: string): Promise<MempoolTransaction[]> {
  const cacheKey = `mempool:address:txs:${address}`;
  const cached = cache.get<MempoolTransaction[]>(cacheKey);
  if (cached) return cached;

  const response = await fetch(`${EXTERNAL_APIS.MEMPOOL}/address/${address}/txs`);

  if (!response.ok) {
    throw new Error(`Mempool API error: ${response.status}`);
  }

  const data: MempoolTransaction[] = await response.json();
  cache.set(cacheKey, data, CACHE_TTL.prices);

  return data;
}

/**
 * Get transaction by ID
 */
export async function getTransaction(txid: string): Promise<MempoolTransaction> {
  const cacheKey = `mempool:tx:${txid}`;
  const cached = cache.get<MempoolTransaction>(cacheKey);
  if (cached) return cached;

  const response = await fetch(`${EXTERNAL_APIS.MEMPOOL}/tx/${txid}`);

  if (!response.ok) {
    throw new Error(`Mempool API error: ${response.status}`);
  }

  const data: MempoolTransaction = await response.json();
  // Cache confirmed transactions permanently, unconfirmed briefly
  const ttl = data.status.confirmed ? CACHE_TTL.static : CACHE_TTL.mempool;
  cache.set(cacheKey, data, ttl);

  return data;
}

// =============================================================================
// Blockchain.info API Functions
// =============================================================================

/**
 * Get Bitcoin network stats from blockchain.info
 */
export async function getNetworkStats(): Promise<BlockchainStats> {
  const cacheKey = 'blockchain:stats';
  const cached = cache.get<BlockchainStats>(cacheKey);
  if (cached) return cached;

  const [hashrate, difficulty, blockHeight, unconfirmed] = await Promise.all([
    fetch(`${EXTERNAL_APIS.BLOCKCHAIN_INFO}/q/hashrate`).then((r) => r.text()),
    fetch(`${EXTERNAL_APIS.BLOCKCHAIN_INFO}/q/getdifficulty`).then((r) => r.text()),
    fetch(`${EXTERNAL_APIS.BLOCKCHAIN_INFO}/q/getblockcount`).then((r) => r.text()),
    fetch(`${EXTERNAL_APIS.BLOCKCHAIN_INFO}/q/unconfirmedcount`).then((r) => r.text()),
  ]);

  const stats: BlockchainStats = {
    hashrate: parseFloat(hashrate),
    difficulty: parseFloat(difficulty),
    blockHeight: parseInt(blockHeight),
    unconfirmedTxs: parseInt(unconfirmed),
    mempoolSize: 0, // Not available from this endpoint
  };

  cache.set(cacheKey, stats, CACHE_TTL.blocks);

  return stats;
}

/**
 * Get BTC price from blockchain.info
 */
export async function getBtcPrice(): Promise<
  Record<string, { last: number; buy: number; sell: number; symbol: string }>
> {
  const cacheKey = 'blockchain:price';
  const cached = cache.get<Awaited<ReturnType<typeof getBtcPrice>>>(cacheKey);
  if (cached) return cached;

  const response = await fetch(`${EXTERNAL_APIS.BLOCKCHAIN_INFO}/ticker`);

  if (!response.ok) {
    throw new Error(`Blockchain.info API error: ${response.status}`);
  }

  const data = await response.json();
  cache.set(cacheKey, data, CACHE_TTL.prices);

  return data;
}

// =============================================================================
// Aggregated Stats
// =============================================================================

/**
 * Get comprehensive Bitcoin network stats
 */
export async function getBitcoinStats(): Promise<{
  fees: MempoolFees;
  difficulty: DifficultyAdjustment;
  network: BlockchainStats;
  mempool: MempoolInfo;
  blockHeight: number;
}> {
  const [fees, difficulty, network, mempool, blockHeight] = await Promise.all([
    getRecommendedFees(),
    getDifficultyAdjustment(),
    getNetworkStats(),
    getMempoolInfo(),
    getBlockHeight(),
  ]);

  return {
    fees,
    difficulty,
    network,
    mempool,
    blockHeight,
  };
}
