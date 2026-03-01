/**
 * Unified DeFi Data Layer — Queries DeFiLlama, DexScreener, GeckoTerminal & more
 *
 * Covers: TVL, yields, DEX volumes, protocol revenue, stablecoins, bridges, L2s
 *
 * @module data-sources/defi
 */

import {
  defillama,
  defillamaYields,
  defillamaCoins,
  defillamaStablecoins,
  defillamaBridges,
  defillamaVolumes,
  defillamaFees,
  dexscreener,
  geckoterminal,
  l2beat,
} from './index';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface ProtocolTVL {
  name: string;
  slug: string;
  tvl: number;
  change1h: number;
  change1d: number;
  change7d: number;
  chains: string[];
  category: string;
  mcapTvl?: number;
}

export interface ChainTVL {
  name: string;
  tvl: number;
  tokenSymbol?: string;
  change1d: number;
  change7d: number;
  protocols: number;
}

export interface YieldPool {
  pool: string;
  chain: string;
  project: string;
  symbol: string;
  tvlUsd: number;
  apyBase: number;
  apyReward: number;
  apy: number;
  stablecoin: boolean;
  ilRisk: string;
  exposure: string;
}

export interface StablecoinData {
  id: string;
  name: string;
  symbol: string;
  pegType: string;
  circulatingAmount: number;
  price: number;
  chains: string[];
  chainCirculating: Record<string, number>;
}

export interface DEXPair {
  chainId: string;
  dexId: string;
  pairAddress: string;
  baseToken: { address: string; name: string; symbol: string };
  quoteToken: { address: string; name: string; symbol: string };
  priceUsd: string;
  volume24h: number;
  liquidity: number;
  fdv: number;
  priceChange24h: number;
}

export interface ProtocolRevenue {
  name: string;
  slug: string;
  totalFees24h: number;
  totalRevenue24h: number;
  totalFees7d: number;
  totalRevenue7d: number;
  totalFees30d: number;
  totalRevenue30d: number;
  category: string;
  chains: string[];
}

export interface BridgeVolume {
  id: number;
  name: string;
  displayName: string;
  volumePrevDay: number;
  volumePrev2Day: number;
  volumePrevWeek: number;
  volumePrevMonth: number;
  chains: string[];
}

export interface L2Data {
  name: string;
  tvl: number;
  tvlChange7d: number;
  risks: { category: string; value: string }[];
  stage: string;
  technology: string;
}

// ═══════════════════════════════════════════════════════════════
// RAW API RESPONSE TYPES (external API shapes)
// ═══════════════════════════════════════════════════════════════

/** DeFiLlama /protocols item */
interface RawProtocol {
  name: string;
  slug: string;
  tvl: number;
  change_1h?: number;
  change_1d?: number;
  change_7d?: number;
  chains?: string[];
  category?: string;
  mcap?: number;
}

/** DeFiLlama /v2/chains item */
interface RawChain {
  name: string;
  tvl: number;
  tokenSymbol?: string;
  change_1d?: number;
  change_7d?: number;
  protocols?: number;
}

/** DeFiLlama /pools item */
interface RawYieldPool {
  pool: string;
  chain: string;
  project: string;
  symbol: string;
  tvlUsd?: number;
  apyBase?: number;
  apyReward?: number;
  apy?: number;
  stablecoin?: boolean;
  ilRisk?: string;
  exposure?: string;
}

/** DeFiLlama stablecoin asset */
interface RawStablecoin {
  id: string;
  name: string;
  symbol: string;
  pegType?: string;
  circulating?: { peggedUSD?: number };
  price?: number;
  chains?: string[];
  chainCirculating?: Record<string, number>;
}

/** DeFiLlama bridge */
interface RawBridge {
  id: number;
  name: string;
  displayName: string;
  volumePrevDay?: number;
  volumePrev2Day?: number;
  volumePrevWeek?: number;
  volumePrevMonth?: number;
  chains?: string[];
}

/** DeFiLlama fees/revenue protocol */
interface RawFeeProtocol {
  name: string;
  slug?: string;
  module?: string;
  total24h?: number;
  totalRevenue24h?: number;
  total7d?: number;
  totalRevenue7d?: number;
  total30d?: number;
  totalRevenue30d?: number;
  category?: string;
  chains?: string[];
}

/** DeFiLlama DEX volume protocol */
interface RawDEXVolumeProtocol {
  name: string;
  slug?: string;
  module?: string;
  total24h?: number;
  total7d?: number;
  total30d?: number;
  change_1d?: number;
  change_7d?: number;
  chains?: string[];
}

/** DexScreener pair */
interface RawDexPair {
  chainId: string;
  dexId: string;
  pairAddress: string;
  baseToken?: { address: string; name: string; symbol: string };
  quoteToken?: { address: string; name: string; symbol: string };
  priceUsd?: string;
  volume?: { h24?: number };
  liquidity?: { usd?: number };
  fdv?: number;
  priceChange?: { h24?: number };
}

/** GeckoTerminal pool */
interface RawGeckoPool {
  id: string;
  attributes: Record<string, unknown>;
}

/** L2Beat scaling project */
interface RawL2Project {
  name: string;
  tvl?: { canonical?: number; change7d?: number };
  risks?: { category: string; value: string }[];
  stage?: string;
  technology?: string;
}

// ═══════════════════════════════════════════════════════════════
// DEFILLAMA — TVL
// ═══════════════════════════════════════════════════════════════

/**
 * Get TVL for all protocols, ranked by size
 */
export async function getProtocolsTVL(limit = 100): Promise<ProtocolTVL[]> {
  const data = await defillama.fetch('/protocols') as RawProtocol[];
  return data
    .slice(0, limit)
    .map((p) => ({
      name: p.name,
      slug: p.slug,
      tvl: p.tvl || 0,
      change1h: p.change_1h || 0,
      change1d: p.change_1d || 0,
      change7d: p.change_7d || 0,
      chains: p.chains || [],
      category: p.category || 'Unknown',
      mcapTvl: p.mcap && p.tvl ? p.mcap / p.tvl : undefined,
    }));
}

/**
 * Get TVL by chain
 */
export async function getChainsTVL(): Promise<ChainTVL[]> {
  const data = await defillama.fetch('/v2/chains') as RawChain[];
  return data.map((c) => ({
    name: c.name,
    tvl: c.tvl || 0,
    tokenSymbol: c.tokenSymbol,
    change1d: c.change_1d || 0,
    change7d: c.change_7d || 0,
    protocols: c.protocols || 0,
  }));
}

/**
 * Get TVL for a specific protocol
 */
export async function getProtocolDetail(slug: string): Promise<Record<string, unknown>> {
  return defillama.fetch(`/protocol/${slug}`) as Promise<Record<string, unknown>>;
}

/**
 * Get TVL for a specific chain
 */
export async function getChainDetail(chain: string): Promise<Record<string, unknown>> {
  return defillama.fetch(`/v2/historicalChainTvl/${chain}`) as Promise<Record<string, unknown>>;
}

/**
 * Get total TVL of all DeFi
 */
export async function getGlobalTVL(): Promise<{ tvl: number; date: number }[]> {
  return defillama.fetch('/v2/historicalChainTvl') as Promise<{ tvl: number; date: number }[]>;
}

// ═══════════════════════════════════════════════════════════════
// DEFILLAMA — YIELDS
// ═══════════════════════════════════════════════════════════════

/**
 * Get all yield pools with APY data
 */
export async function getYieldPools(options?: {
  chain?: string;
  project?: string;
  stableOnly?: boolean;
  minTvl?: number;
  minApy?: number;
  maxApy?: number;
  limit?: number;
}): Promise<YieldPool[]> {
  const response = await defillamaYields.fetch('/pools') as { status: string; data: RawYieldPool[] };
  let pools = response.data || [];

  if (options?.chain) {
    pools = pools.filter((p) => p.chain?.toLowerCase() === options.chain!.toLowerCase());
  }
  if (options?.project) {
    pools = pools.filter((p) => p.project?.toLowerCase() === options.project!.toLowerCase());
  }
  if (options?.stableOnly) {
    pools = pools.filter((p) => p.stablecoin);
  }
  if (options?.minTvl) {
    pools = pools.filter((p) => (p.tvlUsd || 0) >= options.minTvl!);
  }
  if (options?.minApy !== undefined) {
    pools = pools.filter((p) => (p.apy || 0) >= options.minApy!);
  }
  if (options?.maxApy !== undefined) {
    pools = pools.filter((p) => (p.apy || 0) <= options.maxApy!);
  }

  const limit = options?.limit || 100;

  return pools.slice(0, limit).map((p) => ({
    pool: p.pool,
    chain: p.chain,
    project: p.project,
    symbol: p.symbol,
    tvlUsd: p.tvlUsd || 0,
    apyBase: p.apyBase || 0,
    apyReward: p.apyReward || 0,
    apy: p.apy || 0,
    stablecoin: p.stablecoin || false,
    ilRisk: p.ilRisk || 'unknown',
    exposure: p.exposure || 'single',
  }));
}

// ═══════════════════════════════════════════════════════════════
// DEFILLAMA — STABLECOINS
// ═══════════════════════════════════════════════════════════════

/**
 * Get all stablecoins with circulation data
 */
export async function getStablecoins(): Promise<StablecoinData[]> {
  const data = await defillamaStablecoins.fetch('/stablecoins?includePrices=true') as {
    peggedAssets: RawStablecoin[];
  };

  return (data.peggedAssets || []).map((s) => ({
    id: s.id,
    name: s.name,
    symbol: s.symbol,
    pegType: s.pegType || 'peggedUSD',
    circulatingAmount: s.circulating?.peggedUSD || 0,
    price: s.price || 1,
    chains: s.chains || [],
    chainCirculating: s.chainCirculating || {},
  }));
}

/**
 * Get stablecoin dominance chart
 */
export async function getStablecoinCharts(
  stablecoinId?: number,
): Promise<{ date: number; totalCirculatingUSD: number }[]> {
  const endpoint = stablecoinId
    ? `/stablecoincharts/all?stablecoin=${stablecoinId}`
    : '/stablecoincharts/all';
  return defillamaStablecoins.fetch(endpoint) as Promise<{ date: number; totalCirculatingUSD: number }[]>;
}

// ═══════════════════════════════════════════════════════════════
// DEFILLAMA — BRIDGES
// ═══════════════════════════════════════════════════════════════

/**
 * Get bridge volumes
 */
export async function getBridges(): Promise<BridgeVolume[]> {
  const data = await defillamaBridges.fetch('/bridges?includeChains=true') as { bridges: RawBridge[] };
  return (data.bridges || []).map((b) => ({
    id: b.id,
    name: b.name,
    displayName: b.displayName,
    volumePrevDay: b.volumePrevDay || 0,
    volumePrev2Day: b.volumePrev2Day || 0,
    volumePrevWeek: b.volumePrevWeek || 0,
    volumePrevMonth: b.volumePrevMonth || 0,
    chains: b.chains || [],
  }));
}

// ═══════════════════════════════════════════════════════════════
// DEFILLAMA — FEES & REVENUE
// ═══════════════════════════════════════════════════════════════

/**
 * Get protocol fees and revenue rankings
 */
export async function getProtocolFees(limit = 50): Promise<ProtocolRevenue[]> {
  const data = await defillamaFees.fetch('/overview/fees?excludeTotalDataChart=true&excludeTotalDataChartBreakdown=true') as { protocols: RawFeeProtocol[] };
  return (data.protocols || []).slice(0, limit).map((p) => ({
    name: p.name,
    slug: p.slug || p.module || '',
    totalFees24h: p.total24h || 0,
    totalRevenue24h: p.totalRevenue24h || 0,
    totalFees7d: p.total7d || 0,
    totalRevenue7d: p.totalRevenue7d || 0,
    totalFees30d: p.total30d || 0,
    totalRevenue30d: p.totalRevenue30d || 0,
    category: p.category || '',
    chains: p.chains || [],
  }));
}

export interface DEXVolume {
  name: string;
  slug: string;
  volume24h: number;
  volume7d: number;
  volume30d: number;
  change1d: number;
  change7d: number;
  chains: string[];
}

/**
 * Get DEX volume rankings
 */
export async function getDEXVolumes(limit = 50): Promise<DEXVolume[]> {
  const data = await defillamaVolumes.fetch('/overview/dexs?excludeTotalDataChart=true&excludeTotalDataChartBreakdown=true') as { protocols: RawDEXVolumeProtocol[] };
  return (data.protocols || []).slice(0, limit).map((p) => ({
    name: p.name,
    slug: p.slug || p.module || '',
    volume24h: p.total24h || 0,
    volume7d: p.total7d || 0,
    volume30d: p.total30d || 0,
    change1d: p.change_1d || 0,
    change7d: p.change_7d || 0,
    chains: p.chains || [],
  }));
}

// ═══════════════════════════════════════════════════════════════
// DEX SCREENER
// ═══════════════════════════════════════════════════════════════

/**
 * Search pairs by token name or symbol
 */
export async function searchDEXPairs(query: string): Promise<DEXPair[]> {
  const data = await dexscreener.fetch(`/dex/search/?q=${encodeURIComponent(query)}`) as { pairs: RawDexPair[] };
  return (data.pairs || []).map(normalizeDexPair);
}

/**
 * Get pair data by chain and pair address
 */
export async function getDEXPairByAddress(chain: string, pairAddress: string): Promise<DEXPair | null> {
  const data = await dexscreener.fetch(`/dex/pairs/${chain}/${pairAddress}`) as { pairs: RawDexPair[] };
  if (!data.pairs?.length) return null;
  return normalizeDexPair(data.pairs[0]);
}

/**
 * Get token info from multiple DEX sources
 */
export async function getTokenDEXData(tokenAddress: string): Promise<DEXPair[]> {
  const data = await dexscreener.fetch(`/dex/tokens/${tokenAddress}`) as { pairs: RawDexPair[] };
  return (data.pairs || []).map(normalizeDexPair);
}

function normalizeDexPair(p: RawDexPair): DEXPair {
  return {
    chainId: p.chainId,
    dexId: p.dexId,
    pairAddress: p.pairAddress,
    baseToken: p.baseToken || { address: '', name: '', symbol: '' },
    quoteToken: p.quoteToken || { address: '', name: '', symbol: '' },
    priceUsd: p.priceUsd || '0',
    volume24h: p.volume?.h24 || 0,
    liquidity: p.liquidity?.usd || 0,
    fdv: p.fdv || 0,
    priceChange24h: p.priceChange?.h24 || 0,
  };
}

// ═══════════════════════════════════════════════════════════════
// GECKO TERMINAL
// ═══════════════════════════════════════════════════════════════

/**
 * Get trending pools across all networks
 */
export async function getTrendingPools(network?: string): Promise<any[]> {
  const endpoint = network
    ? `/networks/${network}/trending_pools`
    : '/networks/trending_pools';
  const data = await geckoterminal.fetch(endpoint) as { data: any[] };
  return (data.data || []).map((p: any) => ({
    id: p.id,
    ...p.attributes,
  }));
}

/**
 * Get new pools listed on GeckoTerminal
 */
export async function getNewPools(network?: string): Promise<any[]> {
  const endpoint = network
    ? `/networks/${network}/new_pools`
    : '/networks/new_pools';
  const data = await geckoterminal.fetch(endpoint) as { data: any[] };
  return (data.data || []).map((p: any) => ({
    id: p.id,
    ...p.attributes,
  }));
}

// ═══════════════════════════════════════════════════════════════
// L2BEAT
// ═══════════════════════════════════════════════════════════════

/**
 * Get L2 scaling data from L2Beat
 */
export async function getL2ScalingData(): Promise<L2Data[]> {
  try {
    const data = await l2beat.fetch('/scaling/summary') as { data: { projects: any[] } };
    return (data.data?.projects || []).map((p: any) => ({
      name: p.name,
      tvl: p.tvl?.canonical || 0,
      tvlChange7d: p.tvl?.change7d || 0,
      risks: p.risks || [],
      stage: p.stage || 'Unknown',
      technology: p.technology || 'Unknown',
    }));
  } catch {
    // L2Beat API may not be publicly documented — return empty
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════
// AGGREGATED VIEWS
// ═══════════════════════════════════════════════════════════════

/**
 * Full DeFi dashboard snapshot — combines TVL, fees, yields, stablecoins
 */
export async function getDeFiDashboard(): Promise<{
  topProtocols: ProtocolTVL[];
  topChains: ChainTVL[];
  topYields: YieldPool[];
  stablecoins: StablecoinData[];
  topFees: ProtocolRevenue[];
  topDEXVolumes: any[];
}> {
  const [topProtocols, topChains, topYields, stablecoins, topFees, topDEXVolumes] = await Promise.allSettled([
    getProtocolsTVL(20),
    getChainsTVL(),
    getYieldPools({ minTvl: 1_000_000, limit: 20 }),
    getStablecoins(),
    getProtocolFees(20),
    getDEXVolumes(20),
  ]);

  return {
    topProtocols: topProtocols.status === 'fulfilled' ? topProtocols.value : [],
    topChains: topChains.status === 'fulfilled' ? topChains.value : [],
    topYields: topYields.status === 'fulfilled' ? topYields.value : [],
    stablecoins: stablecoins.status === 'fulfilled' ? stablecoins.value : [],
    topFees: topFees.status === 'fulfilled' ? topFees.value : [],
    topDEXVolumes: topDEXVolumes.status === 'fulfilled' ? topDEXVolumes.value : [],
  };
}

/**
 * Token-level DeFi research — TVL, DEX liquidity, yields
 */
export async function getTokenDeFiProfile(tokenSymbol: string): Promise<{
  dexPairs: DEXPair[];
  yields: YieldPool[];
  trendingPools: any[];
}> {
  const [dexPairs, yields, trendingPools] = await Promise.allSettled([
    searchDEXPairs(tokenSymbol),
    getYieldPools({ minTvl: 10_000, limit: 20 }),
    getTrendingPools(),
  ]);

  return {
    dexPairs: dexPairs.status === 'fulfilled' ? dexPairs.value : [],
    yields: yields.status === 'fulfilled'
      ? yields.value.filter((y) =>
          y.symbol.toLowerCase().includes(tokenSymbol.toLowerCase()),
        )
      : [],
    trendingPools: trendingPools.status === 'fulfilled' ? trendingPools.value : [],
  };
}
