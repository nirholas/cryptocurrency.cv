/**
 * Messari API Integration
 * 
 * Professional research-grade cryptocurrency data including
 * asset profiles, metrics, and curated research.
 * 
 * @see https://messari.io/api
 * @module lib/apis/messari
 */

const BASE_URL = 'https://data.messari.io/api/v1';
const API_KEY = process.env.MESSARI_API_KEY || '';

// =============================================================================
// Types
// =============================================================================

export interface MessariAsset {
  id: string;
  symbol: string;
  name: string;
  slug: string;
  profile: AssetProfile;
  metrics: AssetMetrics;
  marketData: MarketData;
  roiData?: RoiData;
}

export interface AssetProfile {
  general: {
    overview: {
      tagline: string;
      projectDetails: string;
      officialLinks: { name: string; link: string }[];
    };
    background: {
      backgroundDetails: string;
      issuingOrganizations: { name: string; slug: string }[];
    };
    regulation: {
      regulatoryDetails: string;
      sfpiScore: number;
    };
  };
  contributors: {
    individuals: { firstName: string; lastName: string; title: string }[];
    organizations: { name: string; slug: string }[];
  };
  advisors: {
    individuals: { firstName: string; lastName: string; title: string }[];
    organizations: { name: string; slug: string }[];
  };
  technology: {
    overview: {
      technologyDetails: string;
    };
    blockchain: {
      consensus: {
        consensusDetails: string;
        generalConsensusMechanism: string;
        preciseConsensusMechanism: string;
      };
      mining: {
        miningDetails: string;
      };
    };
  };
  economics: {
    token: {
      tokenName: string;
      tokenType: string;
      tokenUsage: string;
      tokenDescription: string;
      launchStyle: string;
      launchDetails: string;
      initialDistribution: Record<string, number>;
      currentDistribution: Record<string, number>;
    };
    consensus: {
      supplyDetails: string;
      maxSupply: number | null;
    };
  };
  governance: {
    governanceDetails: string;
    onChainGovernance: {
      isOnChainGovernance: boolean;
    };
  };
}

export interface AssetMetrics {
  id: string;
  symbol: string;
  name: string;
  marketData: MarketData;
  marketcap: {
    rank: number;
    marketcapDominancePercent: number;
    currentMarketcapUsd: number;
    y2050MarketcapUsd: number;
    yplus10MarketcapUsd: number;
    liquidMarketcapUsd: number;
    realizedMarketcapUsd: number;
  };
  supply: {
    y2050: number;
    yplus10: number;
    liquid: number;
    circulating: number;
    stockToFlow: number;
    yplus10IssuePercent: number;
    annualInflationPercent: number;
  };
  allTimeHigh: {
    price: number;
    at: string;
    daysSince: number;
    percentDown: number;
  };
  cycleLow: {
    price: number;
    at: string;
    percentUp: number;
  };
  roiData: RoiData;
  developerActivity: {
    stars: number;
    watchers: number;
    commits30d: number;
    commits60d: number;
    commits90d: number;
    linesAdded30d: number;
    linesDeleted30d: number;
    issues: number;
    forks: number;
  };
  miningStats: {
    networkHashrate: number;
    averageDifficulty: number;
    hashrate30dAverage: number;
    hashratePeakValue: number;
    miningRevenueNative: number;
    miningRevenueUsd: number;
    averageBlockTime: number;
    miningRevenuePerTh: number;
  };
  onChainData: {
    txnCount24h: number;
    transferCount24h: number;
    activeAddresses: number;
    averageFeeUsd: number;
    medianFeeUsd: number;
    averageTransferValue: number;
    medianTransferValue: number;
    nvt: number;
    adjustedNvt: number;
    adjustedNvtSignal: number;
  };
  exchangeFlows: {
    supplyExchangeNative: number;
    supplyExchangeUsd: number;
    flowInExchangeNativeUnits24h: number;
    flowInExchangeUsd24h: number;
    flowOutExchangeNativeUnits24h: number;
    flowOutExchangeUsd24h: number;
    netFlowExchange24h: number;
    netFlowExchangeNative24h: number;
  };
  lendBorrowRates: {
    averageSupplyApr: number;
    averageBorrowApr: number;
  };
}

export interface MarketData {
  priceUsd: number;
  priceBtc: number;
  priceEth: number;
  volumeLast24h: number;
  volumeLast24hOverstatementMultiple: number;
  realVolumeLast24h: number;
  percentChangeUsdLast1h: number;
  percentChangeUsdLast24h: number;
  percentChangeBtcLast24h: number;
  percentChangeEthLast24h: number;
  ohlcvLast1h: OhlcvData;
  ohlcvLast24h: OhlcvData;
  lastTradeAt: string;
}

export interface OhlcvData {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface RoiData {
  percentChangeLast1Week: number;
  percentChangeLast1Month: number;
  percentChangeLast3Months: number;
  percentChangeLastYear: number;
  percentChangeYtd: number;
}

export interface MessariNews {
  id: string;
  title: string;
  content: string;
  references: { title: string; url: string }[];
  publishedAt: string;
  author: {
    name: string;
  };
  tags: string[];
  assets: { id: string; name: string; symbol: string }[];
}

export interface MarketIntelligence {
  topAssets: MessariAsset[];
  marketTrends: {
    direction: 'bullish' | 'bearish' | 'neutral';
    confidence: number;
    signals: string[];
  };
  sectorPerformance: Record<string, number>;
  keyMetrics: {
    totalMarketCap: number;
    btcDominance: number;
    ethDominance: number;
    altcoinSeason: boolean;
    fearGreedScore: number;
  };
  latestResearch: MessariNews[];
  timestamp: string;
}

// =============================================================================
// API Functions
// =============================================================================

/**
 * Make authenticated request to Messari API
 */
async function messariFetch<T>(endpoint: string, params?: Record<string, string>): Promise<T | null> {
  try {
    const url = new URL(`${BASE_URL}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };
    
    if (API_KEY) {
      headers['x-messari-api-key'] = API_KEY;
    }

    const response = await fetch(url.toString(), {
      headers,
      next: { revalidate: 120 }, // Cache for 2 minutes
    });

    if (!response.ok) {
      console.error(`Messari API error: ${response.status}`);
      return null;
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Messari API request failed:', error);
    return null;
  }
}

/**
 * Get asset by symbol
 */
export async function getAsset(symbol: string): Promise<MessariAsset | null> {
  const data = await messariFetch<MessariAsset>(`/assets/${symbol.toLowerCase()}`);
  return data;
}

/**
 * Get asset profile (detailed information)
 */
export async function getAssetProfile(symbol: string): Promise<AssetProfile | null> {
  const data = await messariFetch<{ profile: AssetProfile }>(`/assets/${symbol.toLowerCase()}/profile`);
  return data?.profile || null;
}

/**
 * Get asset metrics
 */
export async function getAssetMetrics(symbol: string): Promise<AssetMetrics | null> {
  const data = await messariFetch<AssetMetrics>(`/assets/${symbol.toLowerCase()}/metrics`);
  return data;
}

/**
 * Get asset market data
 */
export async function getAssetMarketData(symbol: string): Promise<MarketData | null> {
  const data = await messariFetch<{ market_data: MarketData }>(`/assets/${symbol.toLowerCase()}/metrics/market-data`);
  return data?.market_data || null;
}

/**
 * Get all assets with basic data
 */
export async function getAllAssets(options?: {
  page?: number;
  limit?: number;
  sort?: 'market_cap' | 'volume_24h' | 'price' | 'percent_change_24h';
  sortOrder?: 'asc' | 'desc';
}): Promise<MessariAsset[]> {
  const params: Record<string, string> = {
    page: String(options?.page || 1),
    limit: String(options?.limit || 50),
  };

  if (options?.sort) {
    params.sort = options.sort;
    params.order = options.sortOrder || 'desc';
  }

  const data = await messariFetch<MessariAsset[]>('/assets', params);
  return data || [];
}

/**
 * Get Messari news and research
 */
export async function getNews(options?: {
  page?: number;
  limit?: number;
  assetSymbol?: string;
}): Promise<MessariNews[]> {
  const params: Record<string, string> = {
    page: String(options?.page || 1),
    limit: String(options?.limit || 20),
  };

  let endpoint = '/news';
  if (options?.assetSymbol) {
    endpoint = `/assets/${options.assetSymbol.toLowerCase()}/news`;
  }

  const data = await messariFetch<MessariNews[]>(endpoint, params);
  return data || [];
}

/**
 * Get ROI data for comparison
 */
export async function getRoiData(symbol: string): Promise<RoiData | null> {
  const data = await messariFetch<{ roi_data: RoiData }>(`/assets/${symbol.toLowerCase()}/metrics/roi-data`);
  return data?.roi_data || null;
}

/**
 * Get on-chain data
 */
export async function getOnChainData(symbol: string): Promise<AssetMetrics['onChainData'] | null> {
  const metrics = await getAssetMetrics(symbol);
  return metrics?.onChainData || null;
}

/**
 * Get developer activity
 */
export async function getDeveloperActivity(symbol: string): Promise<AssetMetrics['developerActivity'] | null> {
  const metrics = await getAssetMetrics(symbol);
  return metrics?.developerActivity || null;
}

/**
 * Get exchange flows
 */
export async function getExchangeFlows(symbol: string): Promise<AssetMetrics['exchangeFlows'] | null> {
  const metrics = await getAssetMetrics(symbol);
  return metrics?.exchangeFlows || null;
}

/**
 * Calculate market trends from top assets
 */
function calculateMarketTrends(assets: MessariAsset[]): MarketIntelligence['marketTrends'] {
  if (!assets.length) {
    return { direction: 'neutral', confidence: 0, signals: [] };
  }

  const signals: string[] = [];
  let bullishCount = 0;
  let bearishCount = 0;

  // Analyze price changes
  const avgChange24h = assets.reduce((sum, a) => 
    sum + (a.metrics?.marketData?.percentChangeUsdLast24h || 0), 0) / assets.length;
  
  if (avgChange24h > 5) {
    bullishCount += 2;
    signals.push('Strong positive 24h price movement across major assets');
  } else if (avgChange24h > 0) {
    bullishCount += 1;
    signals.push('Positive 24h price movement');
  } else if (avgChange24h < -5) {
    bearishCount += 2;
    signals.push('Strong negative 24h price movement');
  } else if (avgChange24h < 0) {
    bearishCount += 1;
    signals.push('Negative 24h price movement');
  }

  // Analyze volume trends
  const btcMetrics = assets.find(a => a.symbol?.toUpperCase() === 'BTC')?.metrics;
  if (btcMetrics?.marketData?.volumeLast24h) {
    const volumeRatio = btcMetrics.marketData.realVolumeLast24h / btcMetrics.marketData.volumeLast24h;
    if (volumeRatio > 0.7) {
      bullishCount += 1;
      signals.push('High real volume ratio indicates genuine interest');
    }
  }

  // Analyze NVT
  if (btcMetrics?.onChainData?.nvt) {
    if (btcMetrics.onChainData.nvt < 40) {
      bullishCount += 1;
      signals.push('BTC NVT ratio suggests undervaluation');
    } else if (btcMetrics.onChainData.nvt > 90) {
      bearishCount += 1;
      signals.push('BTC NVT ratio suggests overvaluation');
    }
  }

  // Calculate direction and confidence
  const total = bullishCount + bearishCount;
  const confidence = total > 0 ? Math.abs(bullishCount - bearishCount) / total : 0;
  
  let direction: 'bullish' | 'bearish' | 'neutral';
  if (bullishCount > bearishCount) {
    direction = 'bullish';
  } else if (bearishCount > bullishCount) {
    direction = 'bearish';
  } else {
    direction = 'neutral';
  }

  return { direction, confidence, signals };
}

/**
 * Get comprehensive market intelligence
 */
export async function getMarketIntelligence(): Promise<MarketIntelligence> {
  // Get top assets
  const topAssets = await getAllAssets({ limit: 50, sort: 'market_cap' });
  
  // Get latest news
  const latestNews = await getNews({ limit: 10 });

  // Calculate market trends
  const marketTrends = calculateMarketTrends(topAssets);

  // Calculate sector performance (using tags/categories)
  const sectorPerformance: Record<string, number> = {};
  // Group by common sectors
  const sectorAssets: Record<string, MessariAsset[]> = {};
  
  topAssets.forEach(asset => {
    const sector = asset.profile?.economics?.token?.tokenType || 'Other';
    if (!sectorAssets[sector]) sectorAssets[sector] = [];
    sectorAssets[sector].push(asset);
  });

  Object.entries(sectorAssets).forEach(([sector, assets]) => {
    const avgChange = assets.reduce((sum, a) => 
      sum + (a.metrics?.marketData?.percentChangeUsdLast24h || 0), 0) / assets.length;
    sectorPerformance[sector] = avgChange;
  });

  // Calculate key metrics
  const totalMarketCap = topAssets.reduce((sum, a) => 
    sum + (a.metrics?.marketcap?.currentMarketcapUsd || 0), 0);
  
  const btcAsset = topAssets.find(a => a.symbol?.toUpperCase() === 'BTC');
  const ethAsset = topAssets.find(a => a.symbol?.toUpperCase() === 'ETH');
  
  const btcDominance = btcAsset?.metrics?.marketcap?.marketcapDominancePercent || 0;
  const ethDominance = ethAsset?.metrics?.marketcap?.marketcapDominancePercent || 0;
  
  // Altcoin season: typically when BTC dominance is low and alts outperform
  const altcoinSeason = btcDominance < 45 && marketTrends.direction === 'bullish';

  return {
    topAssets,
    marketTrends,
    sectorPerformance,
    keyMetrics: {
      totalMarketCap,
      btcDominance,
      ethDominance,
      altcoinSeason,
      fearGreedScore: 50, // Would need separate API call
    },
    latestResearch: latestNews,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Search assets by name or symbol
 */
export async function searchAssets(query: string): Promise<MessariAsset[]> {
  const allAssets = await getAllAssets({ limit: 200 });
  const lowerQuery = query.toLowerCase();

  return allAssets.filter(asset =>
    asset.name?.toLowerCase().includes(lowerQuery) ||
    asset.symbol?.toLowerCase().includes(lowerQuery) ||
    asset.slug?.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get comparative analysis of multiple assets
 */
export async function compareAssets(symbols: string[]): Promise<{
  assets: MessariAsset[];
  comparison: {
    bestPerformer24h: string;
    worstPerformer24h: string;
    highestVolume: string;
    bestDeveloperActivity: string;
    recommendations: string[];
  };
}> {
  const assets = await Promise.all(
    symbols.map(async (symbol) => {
      const asset = await getAsset(symbol);
      const metrics = await getAssetMetrics(symbol);
      if (asset && metrics) {
        return { ...asset, metrics };
      }
      return null;
    })
  );

  const validAssets = assets.filter((a): a is MessariAsset => a !== null);

  if (validAssets.length === 0) {
    return {
      assets: [],
      comparison: {
        bestPerformer24h: 'N/A',
        worstPerformer24h: 'N/A',
        highestVolume: 'N/A',
        bestDeveloperActivity: 'N/A',
        recommendations: [],
      },
    };
  }

  // Find best/worst performers
  const sortedByChange = [...validAssets].sort((a, b) => 
    (b.metrics?.marketData?.percentChangeUsdLast24h || 0) - 
    (a.metrics?.marketData?.percentChangeUsdLast24h || 0)
  );

  const sortedByVolume = [...validAssets].sort((a, b) => 
    (b.metrics?.marketData?.volumeLast24h || 0) - 
    (a.metrics?.marketData?.volumeLast24h || 0)
  );

  const sortedByDevActivity = [...validAssets].sort((a, b) => 
    (b.metrics?.developerActivity?.commits30d || 0) - 
    (a.metrics?.developerActivity?.commits30d || 0)
  );

  const recommendations: string[] = [];
  
  // Generate recommendations based on analysis
  const best = sortedByChange[0];
  if (best?.metrics?.marketData?.percentChangeUsdLast24h && best.metrics.marketData.percentChangeUsdLast24h > 10) {
    recommendations.push(`${best.symbol} showing strong momentum with ${best.metrics.marketData.percentChangeUsdLast24h.toFixed(1)}% gain`);
  }

  const mostActive = sortedByDevActivity[0];
  if (mostActive?.metrics?.developerActivity?.commits30d && mostActive.metrics.developerActivity.commits30d > 100) {
    recommendations.push(`${mostActive.symbol} has high developer activity (${mostActive.metrics.developerActivity.commits30d} commits/30d)`);
  }

  return {
    assets: validAssets,
    comparison: {
      bestPerformer24h: sortedByChange[0]?.symbol || 'N/A',
      worstPerformer24h: sortedByChange[sortedByChange.length - 1]?.symbol || 'N/A',
      highestVolume: sortedByVolume[0]?.symbol || 'N/A',
      bestDeveloperActivity: sortedByDevActivity[0]?.symbol || 'N/A',
      recommendations,
    },
  };
}
