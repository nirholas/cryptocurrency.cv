/**
 * Premium API v1 - DeFi Protocols Endpoint
 *
 * Returns DeFi protocol rankings with TVL data
 * Requires x402 payment or valid API key
 *
 * @price $0.002 per request
 */

import { NextRequest, NextResponse } from 'next/server';
import { hybridAuthMiddleware } from '@/lib/x402';

const ENDPOINT = '/api/v1/defi';

export async function GET(request: NextRequest) {
  // Check authentication
  const authResponse = await hybridAuthMiddleware(request, ENDPOINT);
  if (authResponse) return authResponse;

  const searchParams = request.nextUrl.searchParams;
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')));
  const chain = searchParams.get('chain');
  const category = searchParams.get('category');

  try {
    const response = await fetch('https://api.llama.fi/protocols', {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'CryptoDataAggregator/1.0',
      },
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      throw new Error(`Upstream API error: ${response.status}`);
    }

    let protocols = await response.json();

    // Filter by chain if specified
    if (chain) {
      protocols = protocols.filter(
        (p: { chain: string; chains?: string[] }) =>
          p.chain?.toLowerCase() === chain.toLowerCase() ||
          p.chains?.some((c: string) => c.toLowerCase() === chain.toLowerCase())
      );
    }

    // Filter by category if specified
    if (category) {
      protocols = protocols.filter(
        (p: { category: string }) => p.category?.toLowerCase() === category.toLowerCase()
      );
    }

    // Sort by TVL and limit
    protocols = protocols
      .sort((a: { tvl: number }, b: { tvl: number }) => (b.tvl || 0) - (a.tvl || 0))
      .slice(0, limit);

    // Transform data
    const data = protocols.map(
      (
        p: {
          name: string;
          symbol: string;
          category: string;
          chain: string;
          chains?: string[];
          tvl: number;
          change_1h: number;
          change_1d: number;
          change_7d: number;
          mcap?: number;
          url: string;
          logo: string;
          slug: string;
        },
        index: number
      ) => ({
        rank: index + 1,
        name: p.name,
        symbol: p.symbol,
        category: p.category,
        chain: p.chain,
        chains: p.chains || [p.chain],
        tvl: p.tvl,
        tvlFormatted: formatTVL(p.tvl),
        change_1h: p.change_1h,
        change_1d: p.change_1d,
        change_7d: p.change_7d,
        mcap: p.mcap,
        mcapToTvl: p.mcap && p.tvl ? (p.mcap / p.tvl).toFixed(2) : null,
        url: p.url,
        logo: p.logo,
        slug: p.slug,
      })
    );

    // Calculate totals
    const totalTvl = protocols.reduce((sum: number, p: { tvl: number }) => sum + (p.tvl || 0), 0);
    const categories = [...new Set(protocols.map((p: { category: string }) => p.category))];
    const chains = [...new Set(protocols.flatMap((p: { chains?: string[] }) => p.chains || []))];

    return NextResponse.json(
      {
        success: true,
        data,
        summary: {
          totalProtocols: data.length,
          totalTvl,
          totalTvlFormatted: formatTVL(totalTvl),
          categories: categories.slice(0, 20),
          chains: chains.slice(0, 30),
        },
        meta: {
          endpoint: ENDPOINT,
          filters: { chain, category, limit },
          timestamp: new Date().toISOString(),
        },
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          'X-Data-Source': 'DefiLlama',
        },
      }
    );
  } catch (error) {
    console.error('[API] /v1/defi error:', error);

    return NextResponse.json(
      { success: false, error: 'Failed to fetch DeFi data' },
      { status: 502 }
    );
  }
}

/**
 * Format TVL to human readable string
 */
function formatTVL(tvl: number): string {
  if (!tvl) return '$0';

  if (tvl >= 1e12) return `$${(tvl / 1e12).toFixed(2)}T`;
  if (tvl >= 1e9) return `$${(tvl / 1e9).toFixed(2)}B`;
  if (tvl >= 1e6) return `$${(tvl / 1e6).toFixed(2)}M`;
  if (tvl >= 1e3) return `$${(tvl / 1e3).toFixed(2)}K`;

  return `$${tvl.toFixed(2)}`;
}
