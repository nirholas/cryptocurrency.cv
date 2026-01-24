/**
 * DefiLlama DeFi Analytics API
 * 
 * Comprehensive DeFi protocol data including TVL, yields, volumes, and more.
 * Free API with no authentication required.
 * 
 * @see https://defillama.com/docs/api
 * @module lib/apis/defillama
 */

const BASE_URL = 'https://api.llama.fi';
const COINS_URL = 'https://coins.llama.fi';
const YIELDS_URL = 'https://yields.llama.fi';
const STABLECOINS_URL = 'https://stablecoins.llama.fi';

// =============================================================================
// Types
// =============================================================================

export interface Protocol {
  id: string;
  name: string;
  slug: string;
  chain: string;
  chains: string[];
  category: string;
  tvl: number;
  tvlChange24h: number;
  tvlChange7d: number;
  mcap?: number;
  symbol?: string;
  logo?: string;
  url?: string;
  twitter?: string;
  description?: string;
  audits?: string;
  listedAt?: number;
}

export interface ChainTVL {
  name: string;
  tvl: number;
  tvlChange24h: number;
  tvlChange7d: number;
  tokenSymbol?: string;
  cmcId?: number;
  gecko_id?: string;
  chainId?: number;
}

export interface YieldPool {
  chain: string;
  project: string;
  symbol: string;
  tvlUsd: number;
  apyBase: number;
  apyReward: number;
  apy: number;
  rewardTokens: string[];
  pool: string;
  exposure: 'single' | 'multi';
  stablecoin: boolean;
  ilRisk: 'yes' | 'no';
  poolMeta?: string;
  apyPct1D?: number;
  apyPct7D?: number;
  apyPct30D?: number;
  apyMean30d?: number;
  volumeUsd1d?: number;
  volumeUsd7d?: number;
}

export interface StablecoinData {
  id: string;
  name: string;
  symbol: string;
  gecko_id: string;
  pegType: string;
  pegMechanism: string;
  circulating: Record<string, number>;
  circulatingPrevDay: Record<string, number>;
  circulatingPrevWeek: Record<string, number>;
  circulatingPrevMonth: Record<string, number>;
  price: number;
  priceSource?: string;
  delisted?: boolean;
}

export interface DexVolume {
  defiLlamaId: string;
  name: string;
  chain: string;
  total24h: number;
  total7d: number;
  total30d: number;
  totalAllTime: number;
  change_1d: number;
  change_7d: number;
  change_1m: number;
  methodology?: string;
  category?: string;
}

export interface HistoricalTVL {
  date: number;
  tvl: number;
}

export interface TokenPrice {
  symbol: string;
  price: number;
  timestamp: number;
  confidence: number;
}

export interface BridgeData {
  id: number;
  name: string;
  displayName: string;
  lastDailyVolume: number;
  dayBeforeLastVolume: number;
  weeklyVolume: number;
  monthlyVolume: number;
  chains: string[];
}

export interface DefiSummary {
  totalTvl: number;
  totalTvlChange24h: number;
  totalProtocols: number;
  chainDistribution: Record<string, number>;
  categoryDistribution: Record<string, number>;
  topProtocols: Protocol[];
  topYields: YieldPool[];
  stablecoinSupply: number;
  bridgeVolume24h: number;
  dexVolume24h: number;
  timestamp: string;
}

// =============================================================================
// API Functions
// =============================================================================

/**
 * Fetch data from DefiLlama API
 */
async function llamaFetch<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url, {
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
      console.error(`DefiLlama API error: ${response.status}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('DefiLlama API request failed:', error);
    return null;
  }
}

/**
 * Get all DeFi protocols with TVL
 */
export async function getProtocols(): Promise<Protocol[]> {
  const data = await llamaFetch<Protocol[]>(`${BASE_URL}/protocols`);
  
  if (!data) return [];

  return data.map(protocol => ({
    id: protocol.id || protocol.slug,
    name: protocol.name,
    slug: protocol.slug,
    chain: protocol.chain || (protocol.chains?.[0] || 'Multi-chain'),
    chains: protocol.chains || [],
    category: protocol.category || 'Unknown',
    tvl: protocol.tvl || 0,
    tvlChange24h: protocol.tvlChange24h || 0,
    tvlChange7d: protocol.tvlChange7d || 0,
    mcap: protocol.mcap,
    symbol: protocol.symbol,
    logo: protocol.logo,
    url: protocol.url,
    twitter: protocol.twitter,
    description: protocol.description,
    audits: protocol.audits,
    listedAt: protocol.listedAt,
  })).sort((a, b) => b.tvl - a.tvl);
}

/**
 * Get TVL by chain
 */
export async function getChainTVL(): Promise<ChainTVL[]> {
  const data = await llamaFetch<ChainTVL[]>(`${BASE_URL}/v2/chains`);
  
  if (!data) return [];

  return data.map(chain => ({
    name: chain.name,
    tvl: chain.tvl || 0,
    tvlChange24h: chain.tvlChange24h || 0,
    tvlChange7d: chain.tvlChange7d || 0,
    tokenSymbol: chain.tokenSymbol,
    cmcId: chain.cmcId,
    gecko_id: chain.gecko_id,
    chainId: chain.chainId,
  })).sort((a, b) => b.tvl - a.tvl);
}

/**
 * Get historical TVL data
 */
export async function getHistoricalTVL(protocol?: string): Promise<HistoricalTVL[]> {
  const endpoint = protocol 
    ? `${BASE_URL}/protocol/${protocol}` 
    : `${BASE_URL}/charts`;
  
  const data = await llamaFetch<{tvl?: HistoricalTVL[]} | HistoricalTVL[]>(endpoint);
  
  if (!data) return [];

  // Handle both protocol-specific and global responses
  if (Array.isArray(data)) {
    return data;
  } else if (data.tvl) {
    return data.tvl;
  }

  return [];
}

/**
 * Get yield pools with APY data
 */
export async function getYieldPools(options?: {
  chain?: string;
  project?: string;
  stablecoinsOnly?: boolean;
  minTvl?: number;
  minApy?: number;
}): Promise<YieldPool[]> {
  const data = await llamaFetch<{data: YieldPool[]}>(`${YIELDS_URL}/pools`);
  
  if (!data?.data) return [];

  let pools = data.data;

  // Apply filters
  if (options?.chain) {
    pools = pools.filter(p => p.chain.toLowerCase() === options.chain!.toLowerCase());
  }
  if (options?.project) {
    pools = pools.filter(p => p.project.toLowerCase() === options.project!.toLowerCase());
  }
  if (options?.stablecoinsOnly) {
    pools = pools.filter(p => p.stablecoin);
  }
  if (options?.minTvl) {
    pools = pools.filter(p => p.tvlUsd >= options.minTvl!);
  }
  if (options?.minApy) {
    pools = pools.filter(p => p.apy >= options.minApy!);
  }

  return pools.sort((a, b) => b.tvlUsd - a.tvlUsd);
}

/**
 * Get top yield opportunities
 */
export async function getTopYields(limit: number = 20): Promise<YieldPool[]> {
  const pools = await getYieldPools({
    minTvl: 1000000, // At least $1M TVL
    minApy: 1, // At least 1% APY
  });

  // Sort by risk-adjusted yield (APY * log(TVL))
  return pools
    .map(pool => ({
      ...pool,
      score: pool.apy * Math.log10(Math.max(pool.tvlUsd, 1)),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Get stablecoin data
 */
export async function getStablecoins(): Promise<StablecoinData[]> {
  const data = await llamaFetch<{peggedAssets: StablecoinData[]}>(`${STABLECOINS_URL}/stablecoins`);
  
  if (!data?.peggedAssets) return [];

  return data.peggedAssets
    .filter(s => !s.delisted)
    .map(s => ({
      id: s.id,
      name: s.name,
      symbol: s.symbol,
      gecko_id: s.gecko_id,
      pegType: s.pegType,
      pegMechanism: s.pegMechanism,
      circulating: s.circulating || {},
      circulatingPrevDay: s.circulatingPrevDay || {},
      circulatingPrevWeek: s.circulatingPrevWeek || {},
      circulatingPrevMonth: s.circulatingPrevMonth || {},
      price: s.price || 1,
      priceSource: s.priceSource,
    }));
}

/**
 * Get DEX volumes
 */
export async function getDexVolumes(): Promise<DexVolume[]> {
  const data = await llamaFetch<{protocols: DexVolume[]}>(`${BASE_URL}/overview/dexs`);
  
  if (!data?.protocols) return [];

  return data.protocols.map(dex => ({
    defiLlamaId: dex.defiLlamaId,
    name: dex.name,
    chain: dex.chain || 'Multi-chain',
    total24h: dex.total24h || 0,
    total7d: dex.total7d || 0,
    total30d: dex.total30d || 0,
    totalAllTime: dex.totalAllTime || 0,
    change_1d: dex.change_1d || 0,
    change_7d: dex.change_7d || 0,
    change_1m: dex.change_1m || 0,
    methodology: dex.methodology,
    category: dex.category,
  })).sort((a, b) => b.total24h - a.total24h);
}

/**
 * Get bridge volumes
 */
export async function getBridges(): Promise<BridgeData[]> {
  const data = await llamaFetch<{bridges: BridgeData[]}>(`${BASE_URL}/bridges`);
  
  if (!data?.bridges) return [];

  return data.bridges.map(bridge => ({
    id: bridge.id,
    name: bridge.name,
    displayName: bridge.displayName || bridge.name,
    lastDailyVolume: bridge.lastDailyVolume || 0,
    dayBeforeLastVolume: bridge.dayBeforeLastVolume || 0,
    weeklyVolume: bridge.weeklyVolume || 0,
    monthlyVolume: bridge.monthlyVolume || 0,
    chains: bridge.chains || [],
  })).sort((a, b) => b.lastDailyVolume - a.lastDailyVolume);
}

/**
 * Get token prices
 */
export async function getTokenPrices(tokens: string[]): Promise<Record<string, TokenPrice>> {
  // Format: chain:address or coingecko:id
  const tokenString = tokens.join(',');
  const data = await llamaFetch<{coins: Record<string, {price: number; symbol: string; timestamp: number; confidence: number}>}>(
    `${COINS_URL}/prices/current/${tokenString}`
  );
  
  if (!data?.coins) return {};

  const prices: Record<string, TokenPrice> = {};
  for (const [key, value] of Object.entries(data.coins)) {
    prices[key] = {
      symbol: value.symbol,
      price: value.price,
      timestamp: value.timestamp,
      confidence: value.confidence,
    };
  }

  return prices;
}

/**
 * Get comprehensive DeFi summary
 */
export async function getDefiSummary(): Promise<DefiSummary> {
  const [protocols, chains, yields, stablecoins, dexVolumes, bridges] = await Promise.all([
    getProtocols(),
    getChainTVL(),
    getTopYields(10),
    getStablecoins(),
    getDexVolumes(),
    getBridges(),
  ]);

  const totalTvl = chains.reduce((sum, c) => sum + c.tvl, 0);
  
  // Calculate 24h change
  const prevTvl = chains.reduce((sum, c) => sum + c.tvl / (1 + c.tvlChange24h / 100), 0);
  const totalTvlChange24h = prevTvl > 0 ? ((totalTvl - prevTvl) / prevTvl) * 100 : 0;

  // Chain distribution
  const chainDistribution: Record<string, number> = {};
  chains.slice(0, 15).forEach(c => {
    chainDistribution[c.name] = totalTvl > 0 ? (c.tvl / totalTvl) * 100 : 0;
  });

  // Category distribution
  const categoryTvl: Record<string, number> = {};
  protocols.forEach(p => {
    categoryTvl[p.category] = (categoryTvl[p.category] || 0) + p.tvl;
  });
  const categoryDistribution: Record<string, number> = {};
  Object.entries(categoryTvl)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([cat, tvl]) => {
      categoryDistribution[cat] = totalTvl > 0 ? (tvl / totalTvl) * 100 : 0;
    });

  // Stablecoin total supply
  const stablecoinSupply = stablecoins.reduce((sum, s) => {
    const totalCirculating = Object.values(s.circulating).reduce((a, b) => a + (b || 0), 0);
    return sum + totalCirculating;
  }, 0);

  // DEX volume
  const dexVolume24h = dexVolumes.reduce((sum, d) => sum + d.total24h, 0);

  // Bridge volume
  const bridgeVolume24h = bridges.reduce((sum, b) => sum + b.lastDailyVolume, 0);

  return {
    totalTvl,
    totalTvlChange24h,
    totalProtocols: protocols.length,
    chainDistribution,
    categoryDistribution,
    topProtocols: protocols.slice(0, 20),
    topYields: yields,
    stablecoinSupply,
    bridgeVolume24h,
    dexVolume24h,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Search protocols by name
 */
export async function searchProtocols(query: string): Promise<Protocol[]> {
  const protocols = await getProtocols();
  const lowerQuery = query.toLowerCase();
  
  return protocols.filter(p => 
    p.name.toLowerCase().includes(lowerQuery) ||
    p.slug.toLowerCase().includes(lowerQuery) ||
    p.symbol?.toLowerCase().includes(lowerQuery)
  );
}
