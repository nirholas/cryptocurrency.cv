/**
 * Glassnode On-Chain Analytics API
 * 
 * Professional on-chain metrics for Bitcoin and Ethereum.
 * Provides institutional-grade blockchain analytics.
 * 
 * @see https://docs.glassnode.com/
 * @module lib/apis/glassnode
 */

const GLASSNODE_API_KEY = process.env.GLASSNODE_API_KEY || '';
const BASE_URL = 'https://api.glassnode.com/v1';

// =============================================================================
// Types
// =============================================================================

export interface ExchangeFlows {
  asset: string;
  exchangeNetflow: number; // Positive = inflow, negative = outflow
  exchangeInflow: number;
  exchangeOutflow: number;
  exchangeBalance: number;
  exchangeBalanceChange24h: number;
  exchangeBalanceChangePercent: number;
  timestamp: string;
}

export interface OnChainMetrics {
  asset: string;
  // Market Value to Realized Value
  mvrv: number;
  mvrvZScore: number;
  // Spent Output Profit Ratio
  sopr: number;
  soprAdjusted: number;
  // Network Value to Transactions
  nvt: number;
  nvtSignal: number;
  // Active Addresses
  activeAddresses: number;
  activeAddresses24hChange: number;
  // Transaction Count
  transactionCount: number;
  transactionVolume: number;
  // Realized Price
  realizedPrice: number;
  realizedCap: number;
  // Supply Metrics
  supplyInProfit: number;
  supplyInLoss: number;
  profitSupplyPercent: number;
  timestamp: string;
}

export interface MinerMetrics {
  asset: string;
  hashRate: number;
  hashRateChange24h: number;
  difficulty: number;
  minerRevenue: number;
  minerRevenueUSD: number;
  minersBalance: number;
  minerNetflow: number;
  puellMultiple: number;
  timestamp: string;
}

export interface LongTermHolderMetrics {
  asset: string;
  lthSupply: number;
  lthSupplyPercent: number;
  sthSupply: number;
  sthSupplyPercent: number;
  lthNetChange: number;
  lthSopr: number;
  sthSopr: number;
  accumulationTrendScore: number;
  timestamp: string;
}

export interface WhaleMetrics {
  asset: string;
  whaleCount: number; // Addresses with 1000+ BTC
  whaleBalance: number;
  whaleNetChange: number;
  top1PercentSupply: number;
  top10PercentSupply: number;
  timestamp: string;
}

export interface FundingData {
  asset: string;
  fundingRate: number;
  fundingRatePerpetual: number;
  openInterest: number;
  openInterestChange24h: number;
  longLiquidations: number;
  shortLiquidations: number;
  timestamp: string;
}

// =============================================================================
// API Functions
// =============================================================================

/**
 * Check if Glassnode API is configured
 */
export function isGlassnodeConfigured(): boolean {
  return !!GLASSNODE_API_KEY;
}

/**
 * Make authenticated request to Glassnode API
 */
async function glassnodeFetch<T>(endpoint: string, params: Record<string, string> = {}): Promise<T | null> {
  if (!GLASSNODE_API_KEY) {
    console.warn('Glassnode API key not configured');
    return null;
  }

  const url = new URL(`${BASE_URL}${endpoint}`);
  url.searchParams.append('api_key', GLASSNODE_API_KEY);
  Object.entries(params).forEach(([key, value]) => url.searchParams.append(key, value));

  try {
    const response = await fetch(url.toString(), {
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
      console.error(`Glassnode API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Glassnode API request failed:', error);
    return null;
  }
}

/**
 * Get the latest value from a time series
 */
function getLatestValue(data: Array<{ t: number; v: number }> | null): number {
  if (!data || data.length === 0) return 0;
  return data[data.length - 1].v;
}

/**
 * Get exchange flow metrics
 */
export async function getExchangeFlows(asset: 'BTC' | 'ETH' = 'BTC'): Promise<ExchangeFlows | null> {
  const [inflow, outflow, balance] = await Promise.all([
    glassnodeFetch<Array<{ t: number; v: number }>>('/metrics/transactions/transfers_volume_to_exchanges_sum', {
      a: asset,
      i: '24h',
    }),
    glassnodeFetch<Array<{ t: number; v: number }>>('/metrics/transactions/transfers_volume_from_exchanges_sum', {
      a: asset,
      i: '24h',
    }),
    glassnodeFetch<Array<{ t: number; v: number }>>('/metrics/distribution/balance_exchanges', {
      a: asset,
      i: '24h',
    }),
  ]);

  const inflowVal = getLatestValue(inflow);
  const outflowVal = getLatestValue(outflow);
  const balanceVal = getLatestValue(balance);
  const prevBalance = balance && balance.length > 1 ? balance[balance.length - 2].v : balanceVal;

  return {
    asset,
    exchangeNetflow: inflowVal - outflowVal,
    exchangeInflow: inflowVal,
    exchangeOutflow: outflowVal,
    exchangeBalance: balanceVal,
    exchangeBalanceChange24h: balanceVal - prevBalance,
    exchangeBalanceChangePercent: prevBalance > 0 ? ((balanceVal - prevBalance) / prevBalance) * 100 : 0,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Get comprehensive on-chain metrics
 */
export async function getOnChainMetrics(asset: 'BTC' | 'ETH' = 'BTC'): Promise<OnChainMetrics | null> {
  const [mvrv, mvrvZScore, sopr, nvt, activeAddresses, txCount, realizedPrice, supplyProfit] = await Promise.all([
    glassnodeFetch<Array<{ t: number; v: number }>>('/metrics/market/mvrv', { a: asset, i: '24h' }),
    glassnodeFetch<Array<{ t: number; v: number }>>('/metrics/market/mvrv_z_score', { a: asset, i: '24h' }),
    glassnodeFetch<Array<{ t: number; v: number }>>('/metrics/indicators/sopr', { a: asset, i: '24h' }),
    glassnodeFetch<Array<{ t: number; v: number }>>('/metrics/indicators/nvt', { a: asset, i: '24h' }),
    glassnodeFetch<Array<{ t: number; v: number }>>('/metrics/addresses/active_count', { a: asset, i: '24h' }),
    glassnodeFetch<Array<{ t: number; v: number }>>('/metrics/transactions/count', { a: asset, i: '24h' }),
    glassnodeFetch<Array<{ t: number; v: number }>>('/metrics/market/price_realized_usd', { a: asset, i: '24h' }),
    glassnodeFetch<Array<{ t: number; v: number }>>('/metrics/supply/profit_relative', { a: asset, i: '24h' }),
  ]);

  const activeAddressesVal = getLatestValue(activeAddresses);
  const prevActiveAddresses = activeAddresses && activeAddresses.length > 1 
    ? activeAddresses[activeAddresses.length - 2].v 
    : activeAddressesVal;

  return {
    asset,
    mvrv: getLatestValue(mvrv),
    mvrvZScore: getLatestValue(mvrvZScore),
    sopr: getLatestValue(sopr),
    soprAdjusted: getLatestValue(sopr),
    nvt: getLatestValue(nvt),
    nvtSignal: getLatestValue(nvt),
    activeAddresses: activeAddressesVal,
    activeAddresses24hChange: ((activeAddressesVal - prevActiveAddresses) / prevActiveAddresses) * 100,
    transactionCount: getLatestValue(txCount),
    transactionVolume: 0,
    realizedPrice: getLatestValue(realizedPrice),
    realizedCap: 0,
    supplyInProfit: getLatestValue(supplyProfit) * 100,
    supplyInLoss: (1 - getLatestValue(supplyProfit)) * 100,
    profitSupplyPercent: getLatestValue(supplyProfit) * 100,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Get miner metrics (Bitcoin only)
 */
export async function getMinerMetrics(): Promise<MinerMetrics | null> {
  const [hashRate, difficulty, revenue, balance, puell] = await Promise.all([
    glassnodeFetch<Array<{ t: number; v: number }>>('/metrics/mining/hash_rate_mean', { a: 'BTC', i: '24h' }),
    glassnodeFetch<Array<{ t: number; v: number }>>('/metrics/mining/difficulty_latest', { a: 'BTC', i: '24h' }),
    glassnodeFetch<Array<{ t: number; v: number }>>('/metrics/mining/revenue_sum', { a: 'BTC', i: '24h' }),
    glassnodeFetch<Array<{ t: number; v: number }>>('/metrics/mining/miners_balance', { a: 'BTC', i: '24h' }),
    glassnodeFetch<Array<{ t: number; v: number }>>('/metrics/indicators/puell_multiple', { a: 'BTC', i: '24h' }),
  ]);

  const hashRateVal = getLatestValue(hashRate);
  const prevHashRate = hashRate && hashRate.length > 1 ? hashRate[hashRate.length - 2].v : hashRateVal;
  const balanceVal = getLatestValue(balance);
  const prevBalance = balance && balance.length > 1 ? balance[balance.length - 2].v : balanceVal;

  return {
    asset: 'BTC',
    hashRate: hashRateVal,
    hashRateChange24h: ((hashRateVal - prevHashRate) / prevHashRate) * 100,
    difficulty: getLatestValue(difficulty),
    minerRevenue: getLatestValue(revenue),
    minerRevenueUSD: 0,
    minersBalance: balanceVal,
    minerNetflow: balanceVal - prevBalance,
    puellMultiple: getLatestValue(puell),
    timestamp: new Date().toISOString(),
  };
}

/**
 * Get long-term holder metrics
 */
export async function getLongTermHolderMetrics(asset: 'BTC' | 'ETH' = 'BTC'): Promise<LongTermHolderMetrics | null> {
  const [lthSupply, sthSupply, lthSopr, sthSopr, accumulation] = await Promise.all([
    glassnodeFetch<Array<{ t: number; v: number }>>('/metrics/supply/lth_sum', { a: asset, i: '24h' }),
    glassnodeFetch<Array<{ t: number; v: number }>>('/metrics/supply/sth_sum', { a: asset, i: '24h' }),
    glassnodeFetch<Array<{ t: number; v: number }>>('/metrics/indicators/sopr_less_155', { a: asset, i: '24h' }),
    glassnodeFetch<Array<{ t: number; v: number }>>('/metrics/indicators/sopr_more_155', { a: asset, i: '24h' }),
    glassnodeFetch<Array<{ t: number; v: number }>>('/metrics/supply/accumulation_trend_score', { a: asset, i: '24h' }),
  ]);

  const lthVal = getLatestValue(lthSupply);
  const sthVal = getLatestValue(sthSupply);
  const totalSupply = lthVal + sthVal;
  const prevLth = lthSupply && lthSupply.length > 1 ? lthSupply[lthSupply.length - 2].v : lthVal;

  return {
    asset,
    lthSupply: lthVal,
    lthSupplyPercent: totalSupply > 0 ? (lthVal / totalSupply) * 100 : 0,
    sthSupply: sthVal,
    sthSupplyPercent: totalSupply > 0 ? (sthVal / totalSupply) * 100 : 0,
    lthNetChange: lthVal - prevLth,
    lthSopr: getLatestValue(lthSopr),
    sthSopr: getLatestValue(sthSopr),
    accumulationTrendScore: getLatestValue(accumulation),
    timestamp: new Date().toISOString(),
  };
}

/**
 * Get whale address metrics
 */
export async function getWhaleMetrics(asset: 'BTC' | 'ETH' = 'BTC'): Promise<WhaleMetrics | null> {
  const [whaleCount, top1Percent] = await Promise.all([
    glassnodeFetch<Array<{ t: number; v: number }>>('/metrics/addresses/min_1k_count', { a: asset, i: '24h' }),
    glassnodeFetch<Array<{ t: number; v: number }>>('/metrics/distribution/balance_1pct_holders', { a: asset, i: '24h' }),
  ]);

  const whaleCountVal = getLatestValue(whaleCount);
  const prevWhaleCount = whaleCount && whaleCount.length > 1 ? whaleCount[whaleCount.length - 2].v : whaleCountVal;

  return {
    asset,
    whaleCount: whaleCountVal,
    whaleBalance: 0,
    whaleNetChange: whaleCountVal - prevWhaleCount,
    top1PercentSupply: getLatestValue(top1Percent),
    top10PercentSupply: 0,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Get derivatives/funding metrics
 */
export async function getFundingMetrics(asset: 'BTC' | 'ETH' = 'BTC'): Promise<FundingData | null> {
  const [fundingRate, openInterest, longLiq, shortLiq] = await Promise.all([
    glassnodeFetch<Array<{ t: number; v: number }>>('/metrics/derivatives/funding_rate_perpetual_all', { a: asset, i: '24h' }),
    glassnodeFetch<Array<{ t: number; v: number }>>('/metrics/derivatives/futures_open_interest_sum', { a: asset, i: '24h' }),
    glassnodeFetch<Array<{ t: number; v: number }>>('/metrics/derivatives/futures_liquidated_volume_long_sum', { a: asset, i: '24h' }),
    glassnodeFetch<Array<{ t: number; v: number }>>('/metrics/derivatives/futures_liquidated_volume_short_sum', { a: asset, i: '24h' }),
  ]);

  const oiVal = getLatestValue(openInterest);
  const prevOi = openInterest && openInterest.length > 1 ? openInterest[openInterest.length - 2].v : oiVal;

  return {
    asset,
    fundingRate: getLatestValue(fundingRate),
    fundingRatePerpetual: getLatestValue(fundingRate),
    openInterest: oiVal,
    openInterestChange24h: ((oiVal - prevOi) / prevOi) * 100,
    longLiquidations: getLatestValue(longLiq),
    shortLiquidations: getLatestValue(shortLiq),
    timestamp: new Date().toISOString(),
  };
}

/**
 * Get comprehensive on-chain health assessment
 */
export async function getOnChainHealthAssessment(asset: 'BTC' | 'ETH' = 'BTC'): Promise<{
  overallScore: number;
  signals: Array<{ metric: string; value: number; signal: 'bullish' | 'bearish' | 'neutral'; weight: number }>;
  summary: string;
}> {
  const [metrics, exchangeFlows, lthMetrics] = await Promise.all([
    getOnChainMetrics(asset),
    getExchangeFlows(asset),
    getLongTermHolderMetrics(asset),
  ]);

  const signals: Array<{ metric: string; value: number; signal: 'bullish' | 'bearish' | 'neutral'; weight: number }> = [];

  // MVRV Z-Score analysis
  if (metrics) {
    let mvrvSignal: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    if (metrics.mvrvZScore < 0) mvrvSignal = 'bullish';
    else if (metrics.mvrvZScore > 7) mvrvSignal = 'bearish';
    signals.push({ metric: 'MVRV Z-Score', value: metrics.mvrvZScore, signal: mvrvSignal, weight: 25 });

    // SOPR analysis
    let soprSignal: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    if (metrics.sopr < 1) soprSignal = 'bullish';
    else if (metrics.sopr > 1.05) soprSignal = 'bearish';
    signals.push({ metric: 'SOPR', value: metrics.sopr, signal: soprSignal, weight: 20 });

    // Supply in profit
    let profitSignal: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    if (metrics.profitSupplyPercent < 50) profitSignal = 'bullish';
    else if (metrics.profitSupplyPercent > 95) profitSignal = 'bearish';
    signals.push({ metric: 'Supply in Profit', value: metrics.profitSupplyPercent, signal: profitSignal, weight: 15 });
  }

  // Exchange flows
  if (exchangeFlows) {
    let flowSignal: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    if (exchangeFlows.exchangeNetflow < 0) flowSignal = 'bullish'; // Outflows are bullish
    else if (exchangeFlows.exchangeNetflow > 0) flowSignal = 'bearish';
    signals.push({ metric: 'Exchange Netflow', value: exchangeFlows.exchangeNetflow, signal: flowSignal, weight: 20 });
  }

  // LTH behavior
  if (lthMetrics) {
    let lthSignal: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    if (lthMetrics.accumulationTrendScore > 0.5) lthSignal = 'bullish';
    else if (lthMetrics.accumulationTrendScore < -0.5) lthSignal = 'bearish';
    signals.push({ metric: 'Accumulation Trend', value: lthMetrics.accumulationTrendScore, signal: lthSignal, weight: 20 });
  }

  // Calculate overall score
  let totalWeight = 0;
  let weightedScore = 0;
  for (const signal of signals) {
    totalWeight += signal.weight;
    if (signal.signal === 'bullish') weightedScore += signal.weight;
    else if (signal.signal === 'neutral') weightedScore += signal.weight * 0.5;
  }
  const overallScore = totalWeight > 0 ? (weightedScore / totalWeight) * 100 : 50;

  // Generate summary
  const bullishCount = signals.filter(s => s.signal === 'bullish').length;
  const bearishCount = signals.filter(s => s.signal === 'bearish').length;
  let summary = '';
  if (overallScore >= 70) {
    summary = `Strong bullish on-chain signals for ${asset}. ${bullishCount} of ${signals.length} metrics indicate accumulation.`;
  } else if (overallScore >= 50) {
    summary = `Mixed on-chain signals for ${asset}. Market structure is neutral with ${bullishCount} bullish and ${bearishCount} bearish indicators.`;
  } else {
    summary = `Cautionary on-chain signals for ${asset}. ${bearishCount} of ${signals.length} metrics suggest distribution.`;
  }

  return { overallScore, signals, summary };
}
