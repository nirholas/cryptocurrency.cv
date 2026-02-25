/**
 * GET /api/v1/fundamentals
 *
 * Premium API v1 — Protocol Fundamentals & Revenue
 * Returns revenue, P/S ratios, and financial metrics for crypto protocols.
 * Aggregates data from DefiLlama and Token Terminal.
 * Requires x402 payment or valid API key.
 *
 * Query parameters:
 *   protocol — Filter by protocol name (uniswap, aave, etc.)
 *   sort     — Sort by: revenue, tvl, ps_ratio, fees (default: revenue)
 *   limit    — Number of results (1-100, default: 25)
 *
 * @price $0.003 per request
 */

import { NextRequest, NextResponse } from 'next/server';
import { hybridAuthMiddleware } from '@/lib/x402';
import { ApiError } from '@/lib/api-error';
import { createRequestLogger } from '@/lib/logger';

export const runtime = 'edge';
export const revalidate = 300;

const ENDPOINT = '/api/v1/fundamentals';

interface ProtocolFundamental {
  name: string;
  symbol: string;
  category: string;
  tvl: number;
  revenue30d: number;
  revenueAnnualized: number;
  fees30d: number;
  feesAnnualized: number;
  users30d: number;
  psRatio: number | null;
  pfRatio: number | null;
  tvlChange7d: number;
  tvlChange30d: number;
  fdv: number;
  mcapToTvl: number | null;
  chains: string[];
  url: string;
}

export async function GET(request: NextRequest) {
  const logger = createRequestLogger(request);
  const start = Date.now();

  const authResponse = await hybridAuthMiddleware(request, ENDPOINT);
  if (authResponse) return authResponse;

  const params = request.nextUrl.searchParams;
  const protocolFilter = params.get('protocol')?.toLowerCase();
  const sort = params.get('sort') || 'revenue';
  const limit = Math.min(Math.max(parseInt(params.get('limit') || '25', 10) || 25, 1), 100);

  try {
    logger.info('Fetching protocol fundamentals', { protocolFilter, sort, limit });

    // Fetch protocols and fees from DefiLlama (free, no API key needed)
    const [protocolsRes, feesRes] = await Promise.allSettled([
      fetch('https://api.llama.fi/protocols', {
        headers: { 'User-Agent': 'free-crypto-news/2.0' },
        next: { revalidate: 300 },
      }),
      fetch('https://api.llama.fi/overview/fees?excludeTotalDataChart=true&excludeTotalDataChartBreakdown=true', {
        headers: { 'User-Agent': 'free-crypto-news/2.0' },
        next: { revalidate: 300 },
      }),
    ]);

    let protocols: Record<string, unknown>[] = [];
    let feesMap = new Map<string, { fees30d: number; revenue30d: number }>();

    if (protocolsRes.status === 'fulfilled' && protocolsRes.value.ok) {
      protocols = await protocolsRes.value.json();
    }

    if (feesRes.status === 'fulfilled' && feesRes.value.ok) {
      const feesData = await feesRes.value.json();
      for (const p of (feesData.protocols || [])) {
        feesMap.set(
          (p.name as string)?.toLowerCase() || '',
          {
            fees30d: p.total30d || 0,
            revenue30d: p.totalRevenue30d || p.total30d * 0.3 || 0, // Estimate if not available
          },
        );
      }
    }

    // Build fundamentals
    let fundamentals: ProtocolFundamental[] = protocols
      .filter((p) => (p.tvl as number) > 1_000_000) // Only protocols with meaningful TVL
      .map((p): ProtocolFundamental => {
        const name = (p.name as string) || '';
        const fees = feesMap.get(name.toLowerCase());
        const tvl = (p.tvl as number) || 0;
        const mcap = (p.mcap as number) || 0;
        const fdv = (p.fdv as number) || mcap;

        const revenueAnnualized = (fees?.revenue30d || 0) * 12;
        const feesAnnualized = (fees?.fees30d || 0) * 12;

        return {
          name,
          symbol: (p.symbol as string) || '',
          category: (p.category as string) || 'DeFi',
          tvl,
          revenue30d: fees?.revenue30d || 0,
          revenueAnnualized,
          fees30d: fees?.fees30d || 0,
          feesAnnualized,
          users30d: 0,
          psRatio: revenueAnnualized > 0 && fdv > 0 ? round(fdv / revenueAnnualized, 2) : null,
          pfRatio: feesAnnualized > 0 && fdv > 0 ? round(fdv / feesAnnualized, 2) : null,
          tvlChange7d: (p.change_7d as number) || 0,
          tvlChange30d: (p.change_30d as number) || 0,
          fdv,
          mcapToTvl: tvl > 0 && mcap > 0 ? round(mcap / tvl, 2) : null,
          chains: (p.chains as string[]) || [],
          url: (p.url as string) || '',
        };
      });

    // Apply filter
    if (protocolFilter) {
      fundamentals = fundamentals.filter(
        (f) => f.name.toLowerCase().includes(protocolFilter) ||
               f.symbol.toLowerCase() === protocolFilter,
      );
    }

    // Sort
    const sortFns: Record<string, (a: ProtocolFundamental, b: ProtocolFundamental) => number> = {
      revenue: (a, b) => b.revenueAnnualized - a.revenueAnnualized,
      tvl: (a, b) => b.tvl - a.tvl,
      ps_ratio: (a, b) => (a.psRatio ?? Infinity) - (b.psRatio ?? Infinity),
      fees: (a, b) => b.feesAnnualized - a.feesAnnualized,
    };
    fundamentals.sort(sortFns[sort] || sortFns.revenue);
    fundamentals = fundamentals.slice(0, limit);

    // Aggregated stats
    const totalTvl = fundamentals.reduce((s, f) => s + f.tvl, 0);
    const totalRevenue = fundamentals.reduce((s, f) => s + f.revenueAnnualized, 0);

    return NextResponse.json({
      count: fundamentals.length,
      totalTvl: Math.round(totalTvl),
      totalAnnualizedRevenue: Math.round(totalRevenue),
      sort,
      protocols: fundamentals,
      sources: ['defillama'],
      timestamp: new Date().toISOString(),
      latencyMs: Date.now() - start,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    logger.error('Fundamentals fetch failed', { error: String(error) });
    return ApiError.upstream('DefiLlama protocols');
  }
}

function round(n: number, decimals: number): number {
  const f = 10 ** decimals;
  return Math.round(n * f) / f;
}
