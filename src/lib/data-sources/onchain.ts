/**
 * On-Chain Analytics — Ethereum gas, Bitcoin mempool, whale tracking, network metrics
 *
 * Sources: Etherscan, Blockchair, Mempool.space, Glassnode, Dune
 *
 * @module data-sources/onchain
 */

import {
  etherscan,
  basescan,
  arbiscan,
  polygonscan,
  blockchairBtc,
  mempoolSpace,
  glassnode,
  dune,
} from './index';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface GasPrice {
  chain: string;
  low: number;
  average: number;
  high: number;
  baseFee?: number;
  timestamp: number;
}

export interface BlockInfo {
  chain: string;
  height: number;
  hash: string;
  timestamp: number;
  txCount: number;
  size: number;
  gasUsed?: number;
  gasLimit?: number;
}

export interface WalletBalance {
  address: string;
  chain: string;
  balanceWei: string;
  balanceEth: number;
}

export interface TokenTransfer {
  hash: string;
  from: string;
  to: string;
  value: string;
  tokenName: string;
  tokenSymbol: string;
  contractAddress: string;
  timestamp: number;
  blockNumber: number;
}

export interface WhaleTransaction {
  hash: string;
  from: string;
  to: string;
  value: number;
  chain: string;
  timestamp: number;
  isExchangeDeposit: boolean;
  isExchangeWithdrawal: boolean;
}

export interface BitcoinMempool {
  count: number;
  vsize: number;
  totalFee: number;
  feeHistogram: [number, number][];
  recommendedFees: {
    fastestFee: number;
    halfHourFee: number;
    hourFee: number;
    economyFee: number;
    minimumFee: number;
  };
}

export interface NetworkMetric {
  metric: string;
  value: number;
  unit: string;
  timestamp: number;
  change24h?: number;
}

// ═══════════════════════════════════════════════════════════════
// ETHEREUM GAS & BLOCKS
// ═══════════════════════════════════════════════════════════════

/**
 * Get current gas prices for Ethereum
 */
export async function getEthGasPrice(): Promise<GasPrice> {
  const data = await etherscan.fetch<{
    result: { SafeGasPrice: string; ProposeGasPrice: string; FastGasPrice: string; suggestBaseFee: string };
  }>('', {
    module: 'gastracker',
    action: 'gasoracle',
  });

  return {
    chain: 'ethereum',
    low: parseFloat(data.result.SafeGasPrice),
    average: parseFloat(data.result.ProposeGasPrice),
    high: parseFloat(data.result.FastGasPrice),
    baseFee: parseFloat(data.result.suggestBaseFee),
    timestamp: Date.now(),
  };
}

/**
 * Get gas prices for multiple EVM chains in parallel
 */
export async function getMultiChainGas(): Promise<GasPrice[]> {
  const chains = [
    { adapter: etherscan, name: 'ethereum' },
    { adapter: basescan, name: 'base' },
    { adapter: arbiscan, name: 'arbitrum' },
    { adapter: polygonscan, name: 'polygon' },
  ];

  const results = await Promise.allSettled(
    chains.map(async ({ adapter, name }) => {
      const data = await adapter.fetch<{
        result: { SafeGasPrice: string; ProposeGasPrice: string; FastGasPrice: string };
      }>('', { module: 'gastracker', action: 'gasoracle' });
      return {
        chain: name,
        low: parseFloat(data.result.SafeGasPrice) || 0,
        average: parseFloat(data.result.ProposeGasPrice) || 0,
        high: parseFloat(data.result.FastGasPrice) || 0,
        timestamp: Date.now(),
      };
    }),
  );

  return results
    .filter((r): r is PromiseFulfilledResult<GasPrice> => r.status === 'fulfilled')
    .map((r) => r.value);
}

/**
 * Get latest block info from Etherscan
 */
export async function getLatestBlock(chain: 'ethereum' | 'base' | 'arbitrum' | 'polygon' = 'ethereum'): Promise<BlockInfo> {
  const adapter = { ethereum: etherscan, base: basescan, arbitrum: arbiscan, polygon: polygonscan }[chain];
  const data = await adapter.fetch<any>('', {
    module: 'proxy',
    action: 'eth_blockNumber',
  });

  const blockNumber = parseInt(data.result, 16);
  const blockData = await adapter.fetch<any>('', {
    module: 'proxy',
    action: 'eth_getBlockByNumber',
    tag: data.result,
    boolean: 'true',
  });

  const block = blockData.result;
  return {
    chain,
    height: blockNumber,
    hash: block.hash,
    timestamp: parseInt(block.timestamp, 16) * 1000,
    txCount: block.transactions?.length || 0,
    size: parseInt(block.size, 16),
    gasUsed: parseInt(block.gasUsed, 16),
    gasLimit: parseInt(block.gasLimit, 16),
  };
}

// ═══════════════════════════════════════════════════════════════
// WALLET & TOKEN DATA
// ═══════════════════════════════════════════════════════════════

/**
 * Get ETH balance for an address
 */
export async function getWalletBalance(
  address: string,
  chain: 'ethereum' | 'base' | 'arbitrum' | 'polygon' = 'ethereum',
): Promise<WalletBalance> {
  const adapter = { ethereum: etherscan, base: basescan, arbitrum: arbiscan, polygon: polygonscan }[chain];
  const data = await adapter.fetch<{ result: string }>('', {
    module: 'account',
    action: 'balance',
    address,
    tag: 'latest',
  });

  return {
    address,
    chain,
    balanceWei: data.result,
    balanceEth: parseInt(data.result) / 1e18,
  };
}

/**
 * Get recent ERC-20 token transfers for an address
 */
export async function getTokenTransfers(
  address: string,
  options?: { startblock?: number; endblock?: number; sort?: 'asc' | 'desc' },
): Promise<TokenTransfer[]> {
  const data = await etherscan.fetch<{ result: any[] }>('', {
    module: 'account',
    action: 'tokentx',
    address,
    startblock: String(options?.startblock || 0),
    endblock: String(options?.endblock || 99999999),
    sort: options?.sort || 'desc',
  });

  return (Array.isArray(data.result) ? data.result : []).slice(0, 100).map((tx) => ({
    hash: tx.hash,
    from: tx.from,
    to: tx.to,
    value: tx.value,
    tokenName: tx.tokenName,
    tokenSymbol: tx.tokenSymbol,
    contractAddress: tx.contractAddress,
    timestamp: parseInt(tx.timeStamp) * 1000,
    blockNumber: parseInt(tx.blockNumber),
  }));
}

/**
 * Detect whale transactions — large ETH transfers
 */
export async function detectWhaleTransactions(
  minValueEth = 100,
  block = 'latest',
): Promise<WhaleTransaction[]> {
  // Get the latest block and scan for large transfers
  const blockData = await etherscan.fetch<any>('', {
    module: 'proxy',
    action: 'eth_getBlockByNumber',
    tag: block === 'latest' ? 'latest' : `0x${parseInt(block).toString(16)}`,
    boolean: 'true',
  });

  if (!blockData.result?.transactions) return [];

  const threshold = BigInt(Math.floor(minValueEth * 1e18));
  const whales: WhaleTransaction[] = [];

  for (const tx of blockData.result.transactions) {
    const value = BigInt(tx.value || '0x0');
    if (value >= threshold) {
      whales.push({
        hash: tx.hash,
        from: tx.from,
        to: tx.to || '',
        value: Number(value) / 1e18,
        chain: 'ethereum',
        timestamp: parseInt(blockData.result.timestamp, 16) * 1000,
        isExchangeDeposit: false, // Would need address labeling service
        isExchangeWithdrawal: false,
      });
    }
  }

  return whales;
}

// ═══════════════════════════════════════════════════════════════
// BITCOIN — MEMPOOL.SPACE
// ═══════════════════════════════════════════════════════════════

/**
 * Get Bitcoin mempool status and recommended fees
 */
export async function getBitcoinMempool(): Promise<BitcoinMempool> {
  const [mempool, fees] = await Promise.all([
    mempoolSpace.fetch<{ count: number; vsize: number; total_fee: number; fee_histogram: [number, number][] }>(
      '/v1/mempool',
    ),
    mempoolSpace.fetch<{
      fastestFee: number;
      halfHourFee: number;
      hourFee: number;
      economyFee: number;
      minimumFee: number;
    }>('/v1/fees/recommended'),
  ]);

  return {
    count: mempool.count,
    vsize: mempool.vsize,
    totalFee: mempool.total_fee,
    feeHistogram: mempool.fee_histogram || [],
    recommendedFees: fees,
  };
}

/**
 * Get Bitcoin hashrate and difficulty info
 */
export async function getBitcoinHashrate(): Promise<{
  currentHashrate: number;
  currentDifficulty: number;
  difficultyChange: number;
  remainingBlocks: number;
  remainingTime: number;
}> {
  const data = await mempoolSpace.fetch<any>('/v1/mining/hashrate/1m');
  const difficulty = await mempoolSpace.fetch<any>('/v1/difficulty-adjustment');

  return {
    currentHashrate: data.currentHashrate || 0,
    currentDifficulty: data.currentDifficulty || 0,
    difficultyChange: difficulty.difficultyChange || 0,
    remainingBlocks: difficulty.remainingBlocks || 0,
    remainingTime: difficulty.remainingTime || 0,
  };
}

/**
 * Get Bitcoin block tip info
 */
export async function getBitcoinTipBlock(): Promise<BlockInfo> {
  const height = await mempoolSpace.fetch<number>('/v1/blocks/tip/height');
  const hash = await mempoolSpace.fetch<string>('/v1/blocks/tip/hash');
  const block = await mempoolSpace.fetch<any>(`/v1/block/${hash}`);

  return {
    chain: 'bitcoin',
    height,
    hash: hash as unknown as string,
    timestamp: (block.timestamp || 0) * 1000,
    txCount: block.tx_count || 0,
    size: block.size || 0,
  };
}

// ═══════════════════════════════════════════════════════════════
// BITCOIN — BLOCKCHAIR
// ═══════════════════════════════════════════════════════════════

/**
 * Get Bitcoin network stats from Blockchair
 */
export async function getBitcoinStats(): Promise<any> {
  const data = await blockchairBtc.fetch<{ data: any }>('/stats');
  return data.data;
}

/**
 * Get Bitcoin address info (balance, tx count)
 */
export async function getBitcoinAddressInfo(
  address: string,
): Promise<{ balance: number; txCount: number; received: number; spent: number }> {
  const data = await blockchairBtc.fetch<{ data: Record<string, any> }>(
    `/dashboards/address/${address}`,
  );

  const info = data.data?.[address]?.address;
  return {
    balance: (info?.balance || 0) / 1e8,
    txCount: info?.transaction_count || 0,
    received: (info?.received || 0) / 1e8,
    spent: (info?.spent || 0) / 1e8,
  };
}

// ═══════════════════════════════════════════════════════════════
// GLASSNODE — ON-CHAIN METRICS
// ═══════════════════════════════════════════════════════════════

/**
 * Get key on-chain metrics from Glassnode
 */
export async function getGlassnodeMetric(
  asset: string,
  metric: string,
  options?: { since?: number; until?: number; interval?: '1h' | '24h' | '1w' },
): Promise<NetworkMetric[]> {
  const data = await glassnode.fetch<{ data: any[] }>(`/metrics/${metric}`, {
    a: asset,
    s: options?.since?.toString() || '',
    u: options?.until?.toString() || '',
    i: options?.interval || '24h',
  });

  return (data?.data || []).map((d: any) => ({
    metric,
    value: d.v || d.o?.v || 0,
    unit: '',
    timestamp: (d.t || 0) * 1000,
  }));
}

/**
 * Get key Bitcoin on-chain summary
 */
export async function getBitcoinOnChainSummary(): Promise<{
  activeAddresses: NetworkMetric[];
  newAddresses: NetworkMetric[];
  txCount: NetworkMetric[];
}> {
  const [activeAddresses, newAddresses, txCount] = await Promise.allSettled([
    getGlassnodeMetric('BTC', 'addresses/active_count'),
    getGlassnodeMetric('BTC', 'addresses/new_non_zero_count'),
    getGlassnodeMetric('BTC', 'transactions/count'),
  ]);

  return {
    activeAddresses: activeAddresses.status === 'fulfilled' ? activeAddresses.value : [],
    newAddresses: newAddresses.status === 'fulfilled' ? newAddresses.value : [],
    txCount: txCount.status === 'fulfilled' ? txCount.value : [],
  };
}

// ═══════════════════════════════════════════════════════════════
// DUNE ANALYTICS
// ═══════════════════════════════════════════════════════════════

/**
 * Execute a Dune query by ID and fetch results
 */
export async function executeDuneQuery(
  queryId: number,
  params?: Record<string, string>,
): Promise<any> {
  // Trigger execution
  const execution = await dune.fetch<{ execution_id: string }>(
    `/query/${queryId}/execute`,
    params,
  );

  // Poll for results
  const executionId = execution.execution_id;
  let attempts = 0;
  const maxAttempts = 30;

  while (attempts < maxAttempts) {
    const status = await dune.fetch<{
      state: string;
      result?: { rows: any[] };
    }>(`/execution/${executionId}/results`);

    if (status.state === 'QUERY_STATE_COMPLETED') {
      return status.result?.rows || [];
    }

    if (status.state === 'QUERY_STATE_FAILED') {
      throw new Error('Dune query execution failed');
    }

    await new Promise((r) => setTimeout(r, 2000));
    attempts++;
  }

  throw new Error('Dune query timed out');
}

/**
 * Get results from a pre-executed Dune query (cached)
 */
export async function getDuneQueryResults(queryId: number): Promise<any[]> {
  const data = await dune.fetch<{ result?: { rows: any[] } }>(
    `/query/${queryId}/results`,
  );
  return data.result?.rows || [];
}

// ═══════════════════════════════════════════════════════════════
// AGGREGATE VIEWS
// ═══════════════════════════════════════════════════════════════

/**
 * Full on-chain dashboard — gas, mempool, blocks, whale detection
 */
export async function getOnChainDashboard(): Promise<{
  ethGas: GasPrice | null;
  multiChainGas: GasPrice[];
  btcMempool: BitcoinMempool | null;
  btcStats: any;
}> {
  const [ethGas, multiChainGas, btcMempool, btcStats] = await Promise.allSettled([
    getEthGasPrice(),
    getMultiChainGas(),
    getBitcoinMempool(),
    getBitcoinStats(),
  ]);

  return {
    ethGas: ethGas.status === 'fulfilled' ? ethGas.value : null,
    multiChainGas: multiChainGas.status === 'fulfilled' ? multiChainGas.value : [],
    btcMempool: btcMempool.status === 'fulfilled' ? btcMempool.value : null,
    btcStats: btcStats.status === 'fulfilled' ? btcStats.value : null,
  };
}
