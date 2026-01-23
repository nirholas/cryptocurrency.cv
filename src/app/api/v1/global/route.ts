import { NextResponse } from 'next/server';
import {
  getAggregatedGlobalData,
  getCoinPaprikaGlobal,
  getCoinLoreGlobal,
} from '@/lib/external-apis';

export const runtime = 'edge';
export const revalidate = 60;

/**
 * GET /api/v1/global
 *
 * Get aggregated global cryptocurrency market data from multiple free sources.
 * Combines data from CoinPaprika, CoinLore, and other free APIs.
 *
 * @example
 * GET /api/v1/global
 */
export async function GET() {
  try {
    const globalData = await getAggregatedGlobalData();

    return NextResponse.json(
      {
        data: {
          totalMarketCap: globalData.totalMarketCap,
          totalMarketCapFormatted: formatLargeNumber(globalData.totalMarketCap),
          totalVolume24h: globalData.totalVolume24h,
          totalVolume24hFormatted: formatLargeNumber(globalData.totalVolume24h),
          btcDominance: globalData.btcDominance,
          ethDominance: globalData.ethDominance,
          totalCoins: globalData.totalCoins,
          totalExchanges: globalData.totalExchanges,
          marketCapChange24h: globalData.marketCapChange24h,
        },
        sources: globalData.sources,
        timestamp: globalData.lastUpdated,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching global data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch global data', message: String(error) },
      { status: 500 }
    );
  }
}

function formatLargeNumber(num: number): string {
  if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  return `$${num.toFixed(2)}`;
}
