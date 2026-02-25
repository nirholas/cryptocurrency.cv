/**
 * Token Terminal Protocol Analytics API
 *
 * Financial-grade protocol metrics: revenue, earnings, P/E ratio, P/S ratio,
 * active users, and TVL across 500+ DeFi & crypto protocols.
 *
 * Free tier: 5 req/min. Pro: $325/mo (50 req/min).
 *
 * @see https://docs.tokenterminal.com/
 * @module lib/apis/tokenterminal
 */

const BASE_URL = 'https://api.tokenterminal.com/v2';
const API_KEY = process.env.TOKENTERMINAL_API_KEY || '';

// =============================================================================
// Types
// =============================================================================

export interface ProtocolMetrics {
  projectId: string;
  name: string;
  symbol?: string;
  category: string;
  chains: string[];
  /** Revenue earned by the protocol (goes to token holders / treasury). */
  revenue24h: number;
  revenue7d: number;
  revenue30d: number;
  revenueAnnualized: number;
  /** Total fees generated (includes revenue + LP fees, etc.). */
  fees24h: number;
  fees7d: number;
  fees30d: number;
  feesAnnualized: number;
  /** Token price and valuation. */
  price: number;
  marketCap: number;
  fullyDilutedValuation: number;
  tvl: number;
  /** Financial ratios. */
  peRatio: number | null;
  psRatio: number | null;
  /** Activity metrics. */
  activeUsers24h: number;
  activeUsers7d: number;
  activeUsers30d: number;
  /** Token incentives emitted (inflation cost). */
  tokenIncentives24h: number;
  tokenIncentivesAnnualized: number;
  /** Earnings = Revenue - Token Incentives (can be negative). */
  earnings24h: number;
  earningsAnnualized: number;
  /** Treasury balance. */
  treasuryUsd: number;
  timestamp: string;
}

export interface ProtocolTimeSeries {
  projectId: string;
  metric: string;
  data: Array<{
    timestamp: string;
    value: number;
  }>;
}

export interface MarketSector {
  sector: string;
  totalRevenue24h: number;
  totalRevenue7d: number;
  totalFees24h: number;
  totalTvl: number;
  protocolCount: number;
  topProtocols: Array<{
    name: string;
    revenue24h: number;
    tvl: number;
  }>;
}

export interface ProtocolSummary {
  totalRevenue24h: number;
  totalFees24h: number;
  totalTvl: number;
  totalProtocols: number;
  topByRevenue: ProtocolMetrics[];
  topByFees: ProtocolMetrics[];
  topByUsers: ProtocolMetrics[];
  sectors: MarketSector[];
  timestamp: string;
}

// =============================================================================
// API Functions
// =============================================================================

/**
 * Fetch from Token Terminal API with bearer auth.
 */
async function ttFetch<T>(path: string): Promise<T | null> {
  if (!API_KEY) {
    console.warn('TokenTerminal: TOKENTERMINAL_API_KEY not set — skipping');
    return null;
  }

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
      next: { revalidate: 300 }, // 5 min cache
    });

    if (!res.ok) {
      console.error(`TokenTerminal API error ${res.status}: ${path}`);
      return null;
    }

    return await res.json();
  } catch (err) {
    console.error('TokenTerminal API request failed:', err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Projects / Protocol Metrics
// ---------------------------------------------------------------------------

/**
 * Get all projects with latest financial metrics.
 */
export async function getProtocols(): Promise<ProtocolMetrics[]> {
  const data = await ttFetch<
    Array<{
      project_id: string;
      project_name: string;
      symbol?: string;
      category: string;
      chains?: string[];
      // Revenue
      revenue_24h?: number;
      revenue_7d?: number;
      revenue_30d?: number;
      revenue_annualized?: number;
      // Fees
      fees_24h?: number;
      fees_7d?: number;
      fees_30d?: number;
      fees_annualized?: number;
      // Valuation
      price?: number;
      market_cap?: number;
      fully_diluted_valuation?: number;
      tvl?: number;
      // Ratios
      pe_ratio?: number | null;
      ps_ratio?: number | null;
      // Users
      active_users_24h?: number;
      active_users_7d?: number;
      active_users_30d?: number;
      // Incentives
      token_incentives_24h?: number;
      token_incentives_annualized?: number;
      earnings_24h?: number;
      earnings_annualized?: number;
      treasury?: number;
    }>
  >('/projects');

  if (!data || !Array.isArray(data)) return [];

  return data.map((p) => ({
    projectId: p.project_id,
    name: p.project_name,
    symbol: p.symbol,
    category: p.category || 'Unknown',
    chains: p.chains || [],
    revenue24h: p.revenue_24h || 0,
    revenue7d: p.revenue_7d || 0,
    revenue30d: p.revenue_30d || 0,
    revenueAnnualized: p.revenue_annualized || 0,
    fees24h: p.fees_24h || 0,
    fees7d: p.fees_7d || 0,
    fees30d: p.fees_30d || 0,
    feesAnnualized: p.fees_annualized || 0,
    price: p.price || 0,
    marketCap: p.market_cap || 0,
    fullyDilutedValuation: p.fully_diluted_valuation || 0,
    tvl: p.tvl || 0,
    peRatio: p.pe_ratio ?? null,
    psRatio: p.ps_ratio ?? null,
    activeUsers24h: p.active_users_24h || 0,
    activeUsers7d: p.active_users_7d || 0,
    activeUsers30d: p.active_users_30d || 0,
    tokenIncentives24h: p.token_incentives_24h || 0,
    tokenIncentivesAnnualized: p.token_incentives_annualized || 0,
    earnings24h: p.earnings_24h || 0,
    earningsAnnualized: p.earnings_annualized || 0,
    treasuryUsd: p.treasury || 0,
    timestamp: new Date().toISOString(),
  }));
}

/**
 * Get metrics for a specific protocol.
 */
export async function getProtocol(projectId: string): Promise<ProtocolMetrics | null> {
  const protocols = await getProtocols();
  return protocols.find((p) => p.projectId === projectId) || null;
}

/**
 * Get historical time series for a protocol metric.
 * Metric options: revenue, fees, active_users, tvl, price, market_cap, pe, ps,
 *   token_incentives, earnings.
 */
export async function getTimeSeries(
  projectId: string,
  metric: string = 'revenue',
  interval: 'daily' | 'weekly' | 'monthly' = 'daily',
): Promise<ProtocolTimeSeries | null> {
  const data = await ttFetch<
    Array<{ timestamp: string; [key: string]: unknown }>
  >(`/projects/${projectId}/metrics/${metric}?interval=${interval}`);

  if (!data || !Array.isArray(data)) return null;

  return {
    projectId,
    metric,
    data: data.map((d) => ({
      timestamp: d.timestamp,
      value: (d[metric] as number) || (d.value as number) || 0,
    })),
  };
}

// ---------------------------------------------------------------------------
// Rankings
// ---------------------------------------------------------------------------

/**
 * Get top protocols by revenue.
 */
export async function getTopByRevenue(limit: number = 20): Promise<ProtocolMetrics[]> {
  const protocols = await getProtocols();
  return protocols
    .sort((a, b) => b.revenue24h - a.revenue24h)
    .slice(0, limit);
}

/**
 * Get top protocols by fees.
 */
export async function getTopByFees(limit: number = 20): Promise<ProtocolMetrics[]> {
  const protocols = await getProtocols();
  return protocols
    .sort((a, b) => b.fees24h - a.fees24h)
    .slice(0, limit);
}

/**
 * Get top protocols by active users.
 */
export async function getTopByUsers(limit: number = 20): Promise<ProtocolMetrics[]> {
  const protocols = await getProtocols();
  return protocols
    .sort((a, b) => b.activeUsers24h - a.activeUsers24h)
    .slice(0, limit);
}

/**
 * Get most undervalued protocols by P/S ratio.
 */
export async function getUndervalued(limit: number = 20): Promise<ProtocolMetrics[]> {
  const protocols = await getProtocols();
  return protocols
    .filter((p) => p.psRatio !== null && p.psRatio > 0 && p.revenue24h > 1000)
    .sort((a, b) => (a.psRatio || Infinity) - (b.psRatio || Infinity))
    .slice(0, limit);
}

// ---------------------------------------------------------------------------
// Sector Breakdown
// ---------------------------------------------------------------------------

/**
 * Get market sectors aggregated from all protocols.
 */
export async function getSectors(): Promise<MarketSector[]> {
  const protocols = await getProtocols();

  const sectorMap = new Map<string, ProtocolMetrics[]>();
  for (const p of protocols) {
    const cat = p.category || 'Other';
    if (!sectorMap.has(cat)) sectorMap.set(cat, []);
    sectorMap.get(cat)!.push(p);
  }

  return Array.from(sectorMap.entries())
    .map(([sector, protos]) => ({
      sector,
      totalRevenue24h: protos.reduce((s, p) => s + p.revenue24h, 0),
      totalRevenue7d: protos.reduce((s, p) => s + p.revenue7d, 0),
      totalFees24h: protos.reduce((s, p) => s + p.fees24h, 0),
      totalTvl: protos.reduce((s, p) => s + p.tvl, 0),
      protocolCount: protos.length,
      topProtocols: protos
        .sort((a, b) => b.revenue24h - a.revenue24h)
        .slice(0, 5)
        .map((p) => ({ name: p.name, revenue24h: p.revenue24h, tvl: p.tvl })),
    }))
    .sort((a, b) => b.totalRevenue24h - a.totalRevenue24h);
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

/**
 * Get comprehensive protocol market summary.
 */
export async function getProtocolSummary(): Promise<ProtocolSummary> {
  const protocols = await getProtocols();

  const totalRevenue24h = protocols.reduce((s, p) => s + p.revenue24h, 0);
  const totalFees24h = protocols.reduce((s, p) => s + p.fees24h, 0);
  const totalTvl = protocols.reduce((s, p) => s + p.tvl, 0);

  const sectors = await getSectors();

  return {
    totalRevenue24h,
    totalFees24h,
    totalTvl,
    totalProtocols: protocols.length,
    topByRevenue: protocols.sort((a, b) => b.revenue24h - a.revenue24h).slice(0, 10),
    topByFees: [...protocols].sort((a, b) => b.fees24h - a.fees24h).slice(0, 10),
    topByUsers: [...protocols].sort((a, b) => b.activeUsers24h - a.activeUsers24h).slice(0, 10),
    sectors: sectors.slice(0, 10),
    timestamp: new Date().toISOString(),
  };
}
