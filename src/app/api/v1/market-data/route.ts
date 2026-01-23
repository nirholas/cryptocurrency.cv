/**
 * Premium API v1 - Global Market Data Endpoint
 *
 * Returns global cryptocurrency market statistics and trending coins
 * Requires x402 payment or valid API key
 *
 * @price $0.002 per request
 */

import { NextRequest, NextResponse } from 'next/server';
import { hybridAuthMiddleware } from '@/lib/x402';

const ENDPOINT = '/api/v1/market-data';

export async function GET(request: NextRequest) {
  // Check authentication
  const authResponse = await hybridAuthMiddleware(request, ENDPOINT);
  if (authResponse) return authResponse;

  try {
    // Fetch global data and trending in parallel
    const [globalResponse, trendingResponse] = await Promise.all([
      fetch('https://api.coingecko.com/api/v3/global', {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'CryptoDataAggregator/1.0',
        },
        next: { revalidate: 120 },
      }),
      fetch('https://api.coingecko.com/api/v3/search/trending', {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'CryptoDataAggregator/1.0',
        },
        next: { revalidate: 300 },
      }),
    ]);

    const globalData = globalResponse.ok ? await globalResponse.json() : null;
    const trendingData = trendingResponse.ok ? await trendingResponse.json() : null;

    // Transform global data
    const global = globalData?.data
      ? {
          active_cryptocurrencies: globalData.data.active_cryptocurrencies,
          upcoming_icos: globalData.data.upcoming_icos,
          ongoing_icos: globalData.data.ongoing_icos,
          ended_icos: globalData.data.ended_icos,
          markets: globalData.data.markets,
          total_market_cap: globalData.data.total_market_cap,
          total_volume: globalData.data.total_volume,
          market_cap_percentage: globalData.data.market_cap_percentage,
          market_cap_change_percentage_24h_usd:
            globalData.data.market_cap_change_percentage_24h_usd,
          updated_at: globalData.data.updated_at,
        }
      : null;

    // Transform trending data
    const trending =
      trendingData?.coins?.map(
        (c: {
          item: {
            id: string;
            symbol: string;
            name: string;
            market_cap_rank: number;
            thumb: string;
            score: number;
          };
        }) => ({
          id: c.item.id,
          symbol: c.item.symbol,
          name: c.item.name,
          market_cap_rank: c.item.market_cap_rank,
          thumb: c.item.thumb,
          score: c.item.score,
        })
      ) || [];

    // Calculate additional metrics
    const btcDominance = global?.market_cap_percentage?.btc || 0;
    const ethDominance = global?.market_cap_percentage?.eth || 0;
    const totalMarketCapUsd = global?.total_market_cap?.usd || 0;
    const totalVolumeUsd = global?.total_volume?.usd || 0;

    return NextResponse.json(
      {
        success: true,
        data: {
          global,
          trending,
          summary: {
            total_market_cap_usd: totalMarketCapUsd,
            total_volume_usd: totalVolumeUsd,
            btc_dominance: btcDominance,
            eth_dominance: ethDominance,
            altcoin_dominance: 100 - btcDominance - ethDominance,
            market_cap_change_24h: global?.market_cap_change_percentage_24h_usd || 0,
            active_cryptocurrencies: global?.active_cryptocurrencies || 0,
            markets: global?.markets || 0,
          },
          timestamp: new Date().toISOString(),
        },
        meta: {
          endpoint: ENDPOINT,
          cached: true,
          timestamp: new Date().toISOString(),
        },
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=600',
          'X-Data-Source': 'CoinGecko',
        },
      }
    );
  } catch (error) {
    console.error('[API] /v1/market-data error:', error);

    return NextResponse.json(
      { success: false, error: 'Failed to fetch market data' },
      { status: 502 }
    );
  }
}
