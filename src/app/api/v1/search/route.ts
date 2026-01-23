/**
 * Premium API v1 - Search Endpoint
 *
 * Search for cryptocurrencies by name or symbol
 * Requires x402 payment or valid API key
 *
 * @price $0.001 per request
 */

import { NextRequest, NextResponse } from 'next/server';
import { hybridAuthMiddleware } from '@/lib/x402';

const ENDPOINT = '/api/v1/search';

export async function GET(request: NextRequest) {
  // Check authentication
  const authResponse = await hybridAuthMiddleware(request, ENDPOINT);
  if (authResponse) return authResponse;

  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q') || searchParams.get('query');

  if (!query || query.length < 1) {
    return NextResponse.json(
      { success: false, error: 'Search query is required. Use ?q=bitcoin' },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(query)}`,
      {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'CryptoDataAggregator/1.0',
        },
        next: { revalidate: 300 },
      }
    );

    if (!response.ok) {
      throw new Error(`Upstream API error: ${response.status}`);
    }

    const data = await response.json();

    // Transform coins
    const coins =
      data.coins
        ?.slice(0, 50)
        .map(
          (c: {
            id: string;
            symbol: string;
            name: string;
            market_cap_rank: number;
            thumb: string;
            large: string;
          }) => ({
            id: c.id,
            symbol: c.symbol?.toUpperCase(),
            name: c.name,
            market_cap_rank: c.market_cap_rank,
            thumb: c.thumb,
            large: c.large,
          })
        ) || [];

    // Transform exchanges
    const exchanges =
      data.exchanges
        ?.slice(0, 10)
        .map((e: { id: string; name: string; market_type: string; thumb: string }) => ({
          id: e.id,
          name: e.name,
          market_type: e.market_type,
          thumb: e.thumb,
        })) || [];

    // Transform categories
    const categories =
      data.categories?.slice(0, 10).map((c: { id: number; name: string }) => ({
        id: c.id,
        name: c.name,
      })) || [];

    // Transform NFTs
    const nfts =
      data.nfts
        ?.slice(0, 10)
        .map((n: { id: string; name: string; symbol: string; thumb: string }) => ({
          id: n.id,
          name: n.name,
          symbol: n.symbol,
          thumb: n.thumb,
        })) || [];

    return NextResponse.json(
      {
        success: true,
        data: {
          coins,
          exchanges,
          categories,
          nfts,
        },
        meta: {
          endpoint: ENDPOINT,
          query,
          results: {
            coins: coins.length,
            exchanges: exchanges.length,
            categories: categories.length,
            nfts: nfts.length,
          },
          timestamp: new Date().toISOString(),
        },
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          'X-Data-Source': 'CoinGecko',
        },
      }
    );
  } catch (error) {
    console.error('[API] /v1/search error:', error);

    return NextResponse.json({ success: false, error: 'Search failed' }, { status: 502 });
  }
}
