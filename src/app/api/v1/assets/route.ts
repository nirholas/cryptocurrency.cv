import { NextRequest, NextResponse } from 'next/server';
import { getAggregatedAssets, getCoinCapAsset, getCoinCapHistory } from '@/lib/external-apis';

export const runtime = 'edge';
export const revalidate = 30;

/**
 * GET /api/v1/assets
 *
 * Get aggregated cryptocurrency assets from multiple free sources.
 * Data is normalized and combined from CoinCap, CoinPaprika, and CoinLore.
 *
 * Query parameters:
 * - limit: Number of assets to return (default: 100, max: 250)
 * - id: Specific asset ID to fetch (returns single asset)
 *
 * @example
 * GET /api/v1/assets               # Top 100 assets
 * GET /api/v1/assets?limit=50      # Top 50 assets
 * GET /api/v1/assets?id=bitcoin    # Single asset
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get('id');
  const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10), 250);

  try {
    if (id) {
      // Fetch single asset
      const asset = await getCoinCapAsset(id);
      return NextResponse.json(
        {
          data: {
            id: asset.id,
            symbol: asset.symbol,
            name: asset.name,
            rank: parseInt(asset.rank, 10),
            price: parseFloat(asset.priceUsd),
            marketCap: parseFloat(asset.marketCapUsd),
            volume24h: parseFloat(asset.volumeUsd24Hr),
            change24h: parseFloat(asset.changePercent24Hr),
            supply: parseFloat(asset.supply),
            maxSupply: asset.maxSupply ? parseFloat(asset.maxSupply) : null,
            vwap24h: parseFloat(asset.vwap24Hr),
            explorer: asset.explorer,
          },
          source: 'coincap',
          timestamp: new Date().toISOString(),
        },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // Fetch aggregated assets
    const assets = await getAggregatedAssets(limit);

    return NextResponse.json(
      {
        data: assets,
        total: assets.length,
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching assets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assets', message: String(error) },
      { status: 500 }
    );
  }
}
