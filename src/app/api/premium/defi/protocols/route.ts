/**
 * Premium API - DeFi Protocols Data
 *
 * GET /api/premium/defi/protocols
 *
 * Premium endpoint providing comprehensive DeFi data:
 * - All 500+ DeFi protocols (vs 50 on free tier)
 * - Extended TVL breakdowns by chain
 * - Treasury and staking data
 * - Revenue and fees metrics
 *
 * Price: $0.01 per request
 *
 * @module api/premium/defi/protocols
 */

import { NextRequest, NextResponse } from 'next/server';
import { withX402 } from '@x402/next';
import { x402Server, getRouteConfig } from '@/lib/x402-server';
import { getTopProtocols, getTopChains } from '@/lib/market-data';

export const runtime = 'nodejs';

interface Protocol {
  id: string;
  name: string;
  symbol?: string;
  chain?: string;
  chains?: string[];
  category?: string;
  tvl: number;
  change_1h?: number;
  change_1d?: number;
  change_7d?: number;
  mcap?: number;
  mcapTvl?: number;
  staking?: number;
  pool2?: number;
  borrowed?: number;
  logo?: string;
  url?: string;
  twitter?: string;
  description?: string;
  audits?: number;
  audit_note?: string;
  gecko_id?: string;
  cmcId?: string;
  listedAt?: number;
  slug?: string;
  chainTvls?: Record<string, number>;
}

interface Chain {
  name: string;
  tvl: number;
  tokenSymbol?: string;
  cmcId?: number;
  gecko_id?: string;
  chainId?: number;
}

interface PremiumDeFiResponse {
  protocols: Protocol[];
  chains?: Chain[];
  total: number;
  premium: true;
  metadata: {
    fetchedAt: string;
    totalTVL: number;
    categoryBreakdown?: Record<string, number>;
    chainBreakdown?: Record<string, number>;
  };
}

/**
 * Group protocols by category
 */
function getCategoryBreakdown(protocols: Protocol[]): Record<string, number> {
  const breakdown: Record<string, number> = {};
  for (const p of protocols) {
    const category = p.category || 'Other';
    breakdown[category] = (breakdown[category] || 0) + (p.tvl || 0);
  }
  return breakdown;
}

/**
 * Group TVL by chain
 */
function getChainBreakdown(protocols: Protocol[]): Record<string, number> {
  const breakdown: Record<string, number> = {};
  for (const p of protocols) {
    if (p.chainTvls) {
      for (const [chain, tvl] of Object.entries(p.chainTvls)) {
        // Skip aggregated entries
        if (!chain.includes('-') && !chain.includes('staking') && !chain.includes('pool2')) {
          breakdown[chain] = (breakdown[chain] || 0) + (tvl as number);
        }
      }
    } else if (p.chain) {
      breakdown[p.chain] = (breakdown[p.chain] || 0) + (p.tvl || 0);
    }
  }
  // Sort by TVL descending
  const sorted = Object.entries(breakdown)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20);
  return Object.fromEntries(sorted);
}

/**
 * Handler for premium DeFi protocols endpoint
 */
async function handler(
  request: NextRequest
): Promise<NextResponse<PremiumDeFiResponse | { error: string; message: string }>> {
  const searchParams = request.nextUrl.searchParams;
  const limit = Math.min(parseInt(searchParams.get('limit') || '500', 10), 1000);
  const category = searchParams.get('category');
  const chain = searchParams.get('chain');
  const includeChains = searchParams.get('chains') === 'true';
  const minTvl = parseFloat(searchParams.get('minTvl') || '0');

  try {
    // Fetch all protocols
    let protocols = await getTopProtocols(limit);

    // Apply filters
    if (category) {
      protocols = protocols.filter(
        (p: Protocol) => p.category?.toLowerCase() === category.toLowerCase()
      );
    }

    if (chain) {
      protocols = protocols.filter(
        (p: Protocol) =>
          p.chain?.toLowerCase() === chain.toLowerCase() ||
          p.chains?.some((c: string) => c.toLowerCase() === chain.toLowerCase())
      );
    }

    if (minTvl > 0) {
      protocols = protocols.filter((p: Protocol) => (p.tvl || 0) >= minTvl);
    }

    // Calculate total TVL
    const totalTVL = protocols.reduce((sum: number, p: Protocol) => sum + (p.tvl || 0), 0);

    // Get breakdowns
    const categoryBreakdown = getCategoryBreakdown(protocols);
    const chainBreakdown = getChainBreakdown(protocols);

    // Fetch chain data if requested
    let chains: Chain[] | undefined;
    if (includeChains) {
      chains = await getTopChains();
    }

    return NextResponse.json(
      {
        protocols,
        chains,
        total: protocols.length,
        premium: true,
        metadata: {
          fetchedAt: new Date().toISOString(),
          totalTVL,
          categoryBreakdown,
          chainBreakdown,
        },
      },
      {
        headers: {
          'Cache-Control': 'private, s-maxage=60, stale-while-revalidate=120',
        },
      }
    );
  } catch (error) {
    console.error('Error in premium DeFi protocols route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch DeFi protocol data', message: String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/premium/defi/protocols
 *
 * Premium endpoint - requires x402 payment
 *
 * Query parameters:
 * - limit: Number of protocols (1-1000, default: 500)
 * - category: Filter by category (e.g., 'DEX', 'Lending', 'Bridge')
 * - chain: Filter by chain (e.g., 'Ethereum', 'Solana', 'Arbitrum')
 * - minTvl: Minimum TVL in USD
 * - chains: Include chain TVL data (true/false)
 *
 * @example
 * GET /api/premium/defi/protocols?limit=1000
 * GET /api/premium/defi/protocols?category=DEX&chains=true
 * GET /api/premium/defi/protocols?chain=Ethereum&minTvl=1000000000
 */
export const GET = withX402(handler, getRouteConfig('/api/premium/defi/protocols'), x402Server);
