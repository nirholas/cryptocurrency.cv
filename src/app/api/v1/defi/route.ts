/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

/**
 * Premium API v1 - DeFi Protocols Endpoint
 *
 * Returns DeFi protocol rankings with TVL data
 * Requires x402 payment or valid API key
 *
 * @price $0.002 per request
 */

import { type NextRequest, NextResponse } from 'next/server';
import { hybridAuthMiddleware } from '@/lib/x402';
import { ApiError } from '@/lib/api-error';
import { createRequestLogger } from '@/lib/logger';

import { getLlamaProtocols } from '@/lib/apis/llama-bulk';
import { intParam } from '@/lib/query-params';
const ENDPOINT = '/api/v1/defi';

interface DefiProtocolRow {
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
}

export async function GET(request: NextRequest) {
  const logger = createRequestLogger(request);
  const startTime = Date.now();

  // Check authentication
  const authResponse = await hybridAuthMiddleware(request, ENDPOINT);
  if (authResponse) return authResponse;

  const searchParams = request.nextUrl.searchParams;
  const limit = intParam(searchParams, 'limit', { fallback: 50, min: 1, max: 100 });
  const chain = searchParams.get('chain');
  const category = searchParams.get('category');

  try {
    logger.info('Fetching DeFi protocols', { limit, chain, category });

    // Shared in-process copy: the ~9 MB list is too large for Next's data cache.
    // Copied because the sort below works in place.
    let protocols: DefiProtocolRow[] = [...(await getLlamaProtocols<DefiProtocolRow>())];

    // Filter by chain if specified
    if (chain) {
      protocols = protocols.filter(
        (p: { chain: string; chains?: string[] }) =>
          p.chain?.toLowerCase() === chain.toLowerCase() ||
          p.chains?.some((c: string) => c.toLowerCase() === chain.toLowerCase()),
      );
    }

    // Filter by category if specified
    if (category) {
      protocols = protocols.filter(
        (p: { category: string }) => p.category?.toLowerCase() === category.toLowerCase(),
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
        index: number,
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
      }),
    );

    // Calculate totals
    const totalTvl = protocols.reduce((sum: number, p: { tvl: number }) => sum + (p.tvl || 0), 0);
    const categories = [...new Set(protocols.map((p: { category: string }) => p.category))];
    const chains = [...new Set(protocols.flatMap((p: { chains?: string[] }) => p.chains || []))];

    logger.request(request.method, request.nextUrl.pathname, 200, Date.now() - startTime);

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
      },
    );
  } catch (error) {
    logger.error('Failed to fetch DeFi data', error);
    return ApiError.upstream('DefiLlama', error);
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
