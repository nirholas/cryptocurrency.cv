/**
 * Premium API v1 - Trending Coins Endpoint
 *
 * Returns currently trending cryptocurrencies
 * Requires x402 payment or valid API key
 *
 * @price $0.001 per request
 */

import { NextRequest, NextResponse } from 'next/server';
import { hybridAuthMiddleware } from '@/lib/x402';

const ENDPOINT = '/api/v1/trending';

export async function GET(request: NextRequest) {
  // Check authentication
  const authResponse = await hybridAuthMiddleware(request, ENDPOINT);
  if (authResponse) return authResponse;

  try {
    const response = await fetch('https://api.coingecko.com/api/v3/search/trending', {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'CryptoDataAggregator/1.0',
      },
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      throw new Error(`Upstream API error: ${response.status}`);
    }

    const data = await response.json();

    // Transform trending coins
    const coins =
      data.coins?.map(
        (
          c: {
            item: {
              id: string;
              coin_id: number;
              symbol: string;
              name: string;
              market_cap_rank: number;
              thumb: string;
              small: string;
              large: string;
              slug: string;
              price_btc: number;
              score: number;
            };
          },
          index: number
        ) => ({
          rank: index + 1,
          id: c.item.id,
          symbol: c.item.symbol?.toUpperCase(),
          name: c.item.name,
          market_cap_rank: c.item.market_cap_rank,
          price_btc: c.item.price_btc,
          score: c.item.score,
          images: {
            thumb: c.item.thumb,
            small: c.item.small,
            large: c.item.large,
          },
        })
      ) || [];

    // Transform trending NFTs if available
    const nfts =
      data.nfts
        ?.slice(0, 5)
        .map(
          (n: {
            id: string;
            name: string;
            symbol: string;
            thumb: string;
            floor_price_in_native_currency: number;
            floor_price_24h_percentage_change: number;
          }) => ({
            id: n.id,
            name: n.name,
            symbol: n.symbol,
            thumb: n.thumb,
            floor_price: n.floor_price_in_native_currency,
            floor_price_change_24h: n.floor_price_24h_percentage_change,
          })
        ) || [];

    return NextResponse.json(
      {
        success: true,
        data: {
          coins,
          nfts,
          categories: data.categories?.slice(0, 5) || [],
        },
        meta: {
          endpoint: ENDPOINT,
          coinCount: coins.length,
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
    console.error('[API] /v1/trending error:', error);

    return NextResponse.json(
      { success: false, error: 'Failed to fetch trending data' },
      { status: 502 }
    );
  }
}
