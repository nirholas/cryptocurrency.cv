/**
 * CryptoQuant On-Chain Analytics API
 * 
 * Professional on-chain metrics focused on exchange flows and miner activity.
 * 
 * @see https://cryptoquant.com/docs
 * @module lib/apis/cryptoquant
 */

const CRYPTOQUANT_API_KEY = process.env.CRYPTOQUANT_API_KEY || '';
const BASE_URL = 'https://api.cryptoquant.com/v1';

// =============================================================================
// Types
// =============================================================================

export interface ExchangeReserve {
  exchange: string;
  asset: string;
  reserve: number;
  reserveUSD: number;
  change24h: number;
  change7d: number;
  allExchangesReserve: number;
  timestamp: string;
}

export interface NetflowData {
  asset: string;
  exchange: string;
  netflow: number;
  inflow: number;
  outflow: number;
  netflowUSD: number;
  timestamp: string;
}

export interface StablecoinFlow {
  stablecoin: 'USDT' | 'USDC' | 'BUSD' | 'DAI';
  exchange: string;
  netflow: number;
  inflow: number;
  outflow: number;
  exchangeReserve: number;
  timestamp: string;
}

export interface MinerFlow {
  asset: string;
  minerToExchange: number;
  minerOutflow: number;
  minerReserve: number;
  minerPositionIndex: number; // MPI
  timestamp: string;
}

export interface FundFlow {
  asset: string;
  fundNetflow: number;
  fundInflow: number;
  fundOutflow: number;
  totalFundHoldings: number;
  timestamp: string;
}

export interface MarketIndicator {
  asset: string;
  indicator: string;
  value: number;
  signal: 'buy' | 'sell' | 'neutral';
  description: string;
  timestamp: string;
}

// =============================================================================
// API Functions
// =============================================================================

/**
 * Check if CryptoQuant API is configured
 */
export function isCryptoQuantConfigured(): boolean {
  return !!CRYPTOQUANT_API_KEY;
}

/**
 * Make authenticated request to CryptoQuant API
 */
async function cryptoQuantFetch<T>(endpoint: string, params: Record<string, string> = {}): Promise<T | null> {
  if (!CRYPTOQUANT_API_KEY) {
    console.warn('CryptoQuant API key not configured');
    return null;
  }

  const url = new URL(`${BASE_URL}${endpoint}`);
  Object.entries(params).forEach(([key, value]) => url.searchParams.append(key, value));

  try {
    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${CRYPTOQUANT_API_KEY}`,
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
      console.error(`CryptoQuant API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data.result || data;
  } catch (error) {
    console.error('CryptoQuant API request failed:', error);
    return null;
  }
}

/**
 * Get exchange reserves for an asset
 */
export async function getExchangeReserves(
  asset: 'BTC' | 'ETH' = 'BTC',
  exchange?: string
): Promise<ExchangeReserve[]> {
  const endpoint = exchange 
    ? `/btc/exchange-flows/reserve?exchange=${exchange}`
    : `/btc/exchange-flows/reserve`;
    
  const data = await cryptoQuantFetch<Array<{
    exchange: string;
    reserve: number;
    reserve_usd: number;
    change_24h: number;
    change_7d: number;
  }>>(endpoint, { window: '24h' });

  if (!data || !Array.isArray(data)) return [];

  return data.map(item => ({
    exchange: item.exchange || 'All Exchanges',
    asset,
    reserve: item.reserve || 0,
    reserveUSD: item.reserve_usd || 0,
    change24h: item.change_24h || 0,
    change7d: item.change_7d || 0,
    allExchangesReserve: 0,
    timestamp: new Date().toISOString(),
  }));
}

/**
 * Get exchange netflow data
 */
export async function getExchangeNetflow(
  asset: 'BTC' | 'ETH' = 'BTC',
  exchange: string = 'all_exchange'
): Promise<NetflowData | null> {
  const data = await cryptoQuantFetch<{
    netflow: number;
    inflow: number;
    outflow: number;
    netflow_usd: number;
  }>(`/${asset.toLowerCase()}/exchange-flows/netflow`, {
    exchange,
    window: '24h',
  });

  if (!data) return null;

  return {
    asset,
    exchange,
    netflow: data.netflow || 0,
    inflow: data.inflow || 0,
    outflow: data.outflow || 0,
    netflowUSD: data.netflow_usd || 0,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Get stablecoin flows to exchanges
 */
export async function getStablecoinFlows(
  stablecoin: 'USDT' | 'USDC' = 'USDT'
): Promise<StablecoinFlow[]> {
  const data = await cryptoQuantFetch<Array<{
    exchange: string;
    netflow: number;
    inflow: number;
    outflow: number;
    reserve: number;
  }>>(`/stablecoin/${stablecoin.toLowerCase()}/exchange-flows`);

  if (!data || !Array.isArray(data)) return [];

  return data.map(item => ({
    stablecoin,
    exchange: item.exchange,
    netflow: item.netflow || 0,
    inflow: item.inflow || 0,
    outflow: item.outflow || 0,
    exchangeReserve: item.reserve || 0,
    timestamp: new Date().toISOString(),
  }));
}

/**
 * Get miner flow data
 */
export async function getMinerFlows(): Promise<MinerFlow | null> {
  const data = await cryptoQuantFetch<{
    miner_to_exchange: number;
    miner_outflow: number;
    miner_reserve: number;
    mpi: number;
  }>('/btc/miner-flows/miner-to-exchange');

  if (!data) return null;

  return {
    asset: 'BTC',
    minerToExchange: data.miner_to_exchange || 0,
    minerOutflow: data.miner_outflow || 0,
    minerReserve: data.miner_reserve || 0,
    minerPositionIndex: data.mpi || 0,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Get fund flow data (institutional)
 */
export async function getFundFlows(asset: 'BTC' | 'ETH' = 'BTC'): Promise<FundFlow | null> {
  const data = await cryptoQuantFetch<{
    fund_netflow: number;
    fund_inflow: number;
    fund_outflow: number;
    total_holdings: number;
  }>(`/${asset.toLowerCase()}/fund-flows/fund-netflow`);

  if (!data) return null;

  return {
    asset,
    fundNetflow: data.fund_netflow || 0,
    fundInflow: data.fund_inflow || 0,
    fundOutflow: data.fund_outflow || 0,
    totalFundHoldings: data.total_holdings || 0,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Get market indicators
 */
export async function getMarketIndicators(asset: 'BTC' | 'ETH' = 'BTC'): Promise<MarketIndicator[]> {
  const indicators: MarketIndicator[] = [];

  // Exchange Whale Ratio
  const whaleRatio = await cryptoQuantFetch<{ value: number }>(`/${asset.toLowerCase()}/market-indicator/exchange-whale-ratio`);
  if (whaleRatio) {
    let signal: 'buy' | 'sell' | 'neutral' = 'neutral';
    if (whaleRatio.value > 0.9) signal = 'sell';
    else if (whaleRatio.value < 0.5) signal = 'buy';
    indicators.push({
      asset,
      indicator: 'Exchange Whale Ratio',
      value: whaleRatio.value,
      signal,
      description: 'Ratio of whale deposits to total exchange inflows',
      timestamp: new Date().toISOString(),
    });
  }

  // Stablecoin Supply Ratio
  const ssr = await cryptoQuantFetch<{ value: number }>('/btc/market-indicator/stablecoin-supply-ratio');
  if (ssr) {
    let signal: 'buy' | 'sell' | 'neutral' = 'neutral';
    if (ssr.value < 3) signal = 'buy';
    else if (ssr.value > 6) signal = 'sell';
    indicators.push({
      asset: 'BTC',
      indicator: 'Stablecoin Supply Ratio',
      value: ssr.value,
      signal,
      description: 'Market cap to stablecoin supply ratio - buying power indicator',
      timestamp: new Date().toISOString(),
    });
  }

  return indicators;
}

/**
 * Get comprehensive flow analysis
 */
export async function getFlowAnalysis(asset: 'BTC' | 'ETH' = 'BTC'): Promise<{
  summary: string;
  bullishSignals: number;
  bearishSignals: number;
  exchangeReserves: ExchangeReserve[];
  netflow: NetflowData | null;
  minerFlows: MinerFlow | null;
  stablecoinFlows: StablecoinFlow[];
  indicators: MarketIndicator[];
}> {
  const [reserves, netflow, minerFlows, stableFlows, indicators] = await Promise.all([
    getExchangeReserves(asset),
    getExchangeNetflow(asset),
    asset === 'BTC' ? getMinerFlows() : null,
    getStablecoinFlows('USDT'),
    getMarketIndicators(asset),
  ]);

  let bullishSignals = 0;
  let bearishSignals = 0;

  // Analyze netflow
  if (netflow) {
    if (netflow.netflow < 0) bullishSignals++; // Outflows = bullish
    else if (netflow.netflow > 0) bearishSignals++; // Inflows = bearish
  }

  // Analyze miner flows
  if (minerFlows && minerFlows.minerPositionIndex > 0) {
    bearishSignals++;
  } else if (minerFlows) {
    bullishSignals++;
  }

  // Analyze stablecoin flows
  const totalStableInflow = stableFlows.reduce((sum, f) => sum + f.inflow, 0);
  const totalStableOutflow = stableFlows.reduce((sum, f) => sum + f.outflow, 0);
  if (totalStableInflow > totalStableOutflow) bullishSignals++;
  else if (totalStableOutflow > totalStableInflow) bearishSignals++;

  // Analyze indicators
  for (const ind of indicators) {
    if (ind.signal === 'buy') bullishSignals++;
    else if (ind.signal === 'sell') bearishSignals++;
  }

  let summary = '';
  if (bullishSignals > bearishSignals + 1) {
    summary = `Bullish on-chain signals for ${asset}. Exchange outflows and stablecoin positioning suggest accumulation.`;
  } else if (bearishSignals > bullishSignals + 1) {
    summary = `Cautionary signals for ${asset}. Exchange inflows and whale activity suggest potential distribution.`;
  } else {
    summary = `Mixed signals for ${asset}. On-chain metrics are inconclusive with balanced buyer/seller activity.`;
  }

  return {
    summary,
    bullishSignals,
    bearishSignals,
    exchangeReserves: reserves,
    netflow,
    minerFlows,
    stablecoinFlows: stableFlows,
    indicators,
  };
}
