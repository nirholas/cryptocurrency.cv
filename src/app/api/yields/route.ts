import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';
export const revalidate = 300; // 5 minutes

/**
 * GET /api/yields
 * 
 * Get top DeFi yields from lending, staking, and liquidity protocols
 * Uses DeFiLlama API (free)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const chain = searchParams.get('chain');
  const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);

  try {
    // Fetch from DeFiLlama yields API
    const response = await fetch('https://yields.llama.fi/pools', {
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch yields');
    }

    const data = await response.json();
    let pools = data.data || [];

    // Filter by chain if specified
    if (chain) {
      const chainLower = chain.toLowerCase();
      pools = pools.filter((p: { chain: string }) => 
        p.chain.toLowerCase() === chainLower
      );
    }

    // Sort by APY and take top pools
    const topPools = pools
      .filter((p: { apy: number; tvlUsd: number }) => p.apy > 0 && p.tvlUsd > 100000)
      .sort((a: { apy: number }, b: { apy: number }) => b.apy - a.apy)
      .slice(0, limit)
      .map((p: {
        pool: string;
        chain: string;
        project: string;
        symbol: string;
        tvlUsd: number;
        apy: number;
        apyBase: number;
        apyReward: number;
        stablecoin: boolean;
        ilRisk: string;
      }) => ({
        pool: p.pool,
        chain: p.chain,
        project: p.project,
        symbol: p.symbol,
        tvlUsd: Math.round(p.tvlUsd),
        apy: {
          total: p.apy?.toFixed(2),
          base: p.apyBase?.toFixed(2),
          reward: p.apyReward?.toFixed(2),
        },
        stablecoin: p.stablecoin || false,
        ilRisk: p.ilRisk || 'unknown',
      }));

    return NextResponse.json({
      chain: chain || 'all',
      count: topPools.length,
      yields: topPools,
      timestamp: new Date().toISOString(),
      source: 'defillama',
    });
  } catch (error) {
    console.error('Yields API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch DeFi yields' },
      { status: 500 }
    );
  }
}
