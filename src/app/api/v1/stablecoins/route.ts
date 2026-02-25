/**
 * GET /api/v1/stablecoins
 *
 * Premium API v1 — Stablecoin Analytics
 * Returns stablecoin supply data, market cap, and flow analysis.
 * Uses provider framework (DefiLlama + Glassnode + Artemis + Dune + CryptoQuant)
 * with circuit breakers, caching, and multi-source fallback.
 * Requires x402 payment or valid API key.
 *
 * Query parameters:
 *   stablecoin — Filter by name (USDT, USDC, DAI, etc.)
 *   chain      — Filter by chain (ethereum, tron, bsc, etc.)
 *
 * @price $0.002 per request
 */

import { NextRequest, NextResponse } from 'next/server';
import { hybridAuthMiddleware } from '@/lib/x402';
import { ApiError } from '@/lib/api-error';
import { createRequestLogger } from '@/lib/logger';
import { registry } from '@/lib/providers/registry';
import type { StablecoinFlow } from '@/lib/providers/adapters/stablecoin-flows';

export const runtime = 'edge';
export const revalidate = 300;

const ENDPOINT = '/api/v1/stablecoins';

interface StablecoinData {
  id: number;
  name: string;
  symbol: string;
  pegType: string;
  pegMechanism: string;
  circulating: number;
  circulatingPrevDay: number;
  circulatingPrevWeek: number;
  circulatingPrevMonth: number;
  change1d: number;
  change7d: number;
  change30d: number;
  chains: string[];
  price: number;
  depeg: boolean;
}

export async function GET(request: NextRequest) {
  const logger = createRequestLogger(request);
  const start = Date.now();

  const authResponse = await hybridAuthMiddleware(request, ENDPOINT);
  if (authResponse) return authResponse;

  const params = request.nextUrl.searchParams;
  const stablecoinFilter = params.get('stablecoin')?.toUpperCase();
  const chainFilter = params.get('chain')?.toLowerCase();

  try {
    logger.info('Fetching stablecoin data', { stablecoinFilter, chainFilter });

    // Layer 1: Provider framework (broadcast across DefiLlama, Glassnode, Artemis, Dune, CryptoQuant)
    try {
      const result = await registry.fetch<StablecoinFlow[]>('stablecoin-flows');
      let stablecoins: StablecoinData[] = result.data.map((f, i) => ({
        id: i + 1,
        name: f.name,
        symbol: f.symbol,
        pegType: f.pegType,
        pegMechanism: 'unknown',
        circulating: f.circulatingUsd,
        circulatingPrevDay: f.circulatingUsd - f.circulatingChange24h,
        circulatingPrevWeek: f.circulatingUsd - f.circulatingChange7d,
        circulatingPrevMonth: f.circulatingUsd,
        change1d: f.circulatingChange24h !== 0 ? (f.circulatingChange24h / (f.circulatingUsd - f.circulatingChange24h)) * 100 : 0,
        change7d: f.circulatingChange7d !== 0 ? (f.circulatingChange7d / (f.circulatingUsd - f.circulatingChange7d)) * 100 : 0,
        change30d: 0,
        chains: f.chainDistribution.map(c => c.chain),
        price: f.price,
        depeg: Math.abs(f.price - 1) > 0.01,
      }));

      if (stablecoinFilter) {
        stablecoins = stablecoins.filter((s) => s.symbol === stablecoinFilter);
      }
      if (chainFilter) {
        stablecoins = stablecoins.filter((s) =>
          s.chains.some((c) => c.toLowerCase() === chainFilter),
        );
      }

      stablecoins.sort((a, b) => b.circulating - a.circulating);

      const totalSupply = stablecoins.reduce((s, c) => s + c.circulating, 0);
      const totalChange1d = stablecoins.reduce((s, c) => s + (c.circulating - c.circulatingPrevDay), 0);
      const depegged = stablecoins.filter((s) => s.depeg).map((s) => s.symbol);

      return NextResponse.json({
        count: stablecoins.length,
        totalSupply: Math.round(totalSupply),
        netFlow1d: Math.round(totalChange1d),
        depeggedTokens: depegged,
        stablecoins: stablecoins.slice(0, 50),
        source: result.lineage.provider,
        timestamp: new Date().toISOString(),
        latencyMs: Date.now() - start,
      }, {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          'X-Provider': result.lineage.provider,
          'X-Confidence': String(result.lineage.confidence),
          'X-Cache': result.cached ? 'HIT' : 'MISS',
        },
      });
    } catch { /* provider chain miss — fall through to direct fetch */ }

    // Layer 2: Direct DefiLlama fallback (legacy)
    const res = await fetch('https://stablecoins.llama.fi/stablecoins?includePrices=true', {
      headers: { 'User-Agent': 'free-crypto-news/2.0' },
      next: { revalidate: 300 },
    });

    if (!res.ok) throw new Error(`DefiLlama stablecoins ${res.status}`);

    const json = await res.json();
    const rawData: Record<string, unknown>[] = json.peggedAssets || [];

    let stablecoins: StablecoinData[] = rawData.map((s: Record<string, unknown>) => {
      const circulating = extractCirculating(s.circulating as Record<string, unknown> | undefined);
      const prevDay = extractCirculating(s.circulatingPrevDay as Record<string, unknown> | undefined);
      const prevWeek = extractCirculating(s.circulatingPrevWeek as Record<string, unknown> | undefined);
      const prevMonth = extractCirculating(s.circulatingPrevMonth as Record<string, unknown> | undefined);
      const price = (s.price as number) ?? 1;

      return {
        id: s.id as number,
        name: s.name as string,
        symbol: (s.symbol as string) || '',
        pegType: (s.pegType as string) || 'peggedUSD',
        pegMechanism: (s.pegMechanism as string) || 'unknown',
        circulating,
        circulatingPrevDay: prevDay,
        circulatingPrevWeek: prevWeek,
        circulatingPrevMonth: prevMonth,
        change1d: prevDay > 0 ? ((circulating - prevDay) / prevDay) * 100 : 0,
        change7d: prevWeek > 0 ? ((circulating - prevWeek) / prevWeek) * 100 : 0,
        change30d: prevMonth > 0 ? ((circulating - prevMonth) / prevMonth) * 100 : 0,
        chains: (s.chains as string[]) || [],
        price,
        depeg: Math.abs(price - 1) > 0.01,
      };
    });

    // Apply filters
    if (stablecoinFilter) {
      stablecoins = stablecoins.filter((s) => s.symbol === stablecoinFilter);
    }
    if (chainFilter) {
      stablecoins = stablecoins.filter((s) =>
        s.chains.some((c) => c.toLowerCase() === chainFilter),
      );
    }

    // Sort by market cap
    stablecoins.sort((a, b) => b.circulating - a.circulating);

    // Aggregated stats
    const totalSupply = stablecoins.reduce((s, c) => s + c.circulating, 0);
    const totalChange1d = stablecoins.reduce((s, c) => s + (c.circulating - c.circulatingPrevDay), 0);
    const depegged = stablecoins.filter((s) => s.depeg).map((s) => s.symbol);

    return NextResponse.json({
      count: stablecoins.length,
      totalSupply: Math.round(totalSupply),
      netFlow1d: Math.round(totalChange1d),
      depeggedTokens: depegged,
      stablecoins: stablecoins.slice(0, 50),
      source: 'defillama',
      timestamp: new Date().toISOString(),
      latencyMs: Date.now() - start,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'X-Cache': 'DIRECT',
      },
    });
  } catch (error) {
    logger.error('Stablecoin fetch failed', { error: String(error) });
    return ApiError.upstream('DefiLlama stablecoins');
  }
}

function extractCirculating(data: Record<string, unknown> | undefined): number {
  if (!data) return 0;
  let total = 0;
  for (const val of Object.values(data)) {
    if (typeof val === 'number') total += val;
    else if (typeof val === 'object' && val !== null) {
      // Nested chain breakdown
      for (const v of Object.values(val as Record<string, unknown>)) {
        if (typeof v === 'number') total += v;
      }
    }
  }
  return total;
}
