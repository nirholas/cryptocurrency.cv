import { NextRequest, NextResponse } from 'next/server';
import { COINGECKO_BASE } from '@/lib/constants';
import { ApiError } from '@/lib/api-error';

export const runtime = 'edge';
export const revalidate = 60;

const COIN_ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,63}$/;

/**
 * GET /api/compare
 * 
 * Compare multiple cryptocurrencies side-by-side
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const coinsParam = searchParams.get('coins');

  if (!coinsParam) {
    return ApiError.badRequest('Missing coins parameter. Use ?coins=bitcoin,ethereum,solana');
  }

  const coins = coinsParam.split(',').map(c => c.trim().toLowerCase()).filter(c => COIN_ID_PATTERN.test(c)).slice(0, 10);

  if (coins.length === 0) {
    return ApiError.badRequest('No valid coin IDs provided');
  }

  try {
    // Fetch from CoinGecko
    const response = await fetch(
      `${COINGECKO_BASE}/coins/markets?vs_currency=usd&ids=${coins.join(',')}&order=market_cap_desc&sparkline=false&price_change_percentage=1h,24h,7d`,
      { next: { revalidate: 60 } }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch from CoinGecko');
    }

    const data = await response.json();

    const comparison = data.map((coin: {
      id: string;
      symbol: string;
      name: string;
      image: string;
      current_price: number;
      market_cap: number;
      market_cap_rank: number;
      total_volume: number;
      high_24h: number;
      low_24h: number;
      price_change_percentage_1h_in_currency: number;
      price_change_percentage_24h_in_currency: number;
      price_change_percentage_7d_in_currency: number;
      circulating_supply: number;
      total_supply: number;
      ath: number;
      ath_change_percentage: number;
    }) => ({
      id: coin.id,
      symbol: coin.symbol.toUpperCase(),
      name: coin.name,
      image: coin.image,
      price: {
        current: coin.current_price,
        high24h: coin.high_24h,
        low24h: coin.low_24h,
        ath: coin.ath,
        athChange: coin.ath_change_percentage?.toFixed(1),
      },
      changes: {
        '1h': coin.price_change_percentage_1h_in_currency?.toFixed(2),
        '24h': coin.price_change_percentage_24h_in_currency?.toFixed(2),
        '7d': coin.price_change_percentage_7d_in_currency?.toFixed(2),
      },
      marketCap: coin.market_cap,
      marketCapRank: coin.market_cap_rank,
      volume24h: coin.total_volume,
      supply: {
        circulating: coin.circulating_supply,
        total: coin.total_supply,
      },
    }));

    // Calculate summary metrics
    const avgChange24h = comparison.reduce((sum: number, c: { changes: { '24h': string } }) => 
      sum + (parseFloat(c.changes['24h']) || 0), 0) / comparison.length;
    
    const totalMarketCap = comparison.reduce((sum: number, c: { marketCap: number }) => 
      sum + c.marketCap, 0);
    
    const totalVolume = comparison.reduce((sum: number, c: { volume24h: number }) => 
      sum + c.volume24h, 0);

    return NextResponse.json({
      coins: comparison,
      summary: {
        count: comparison.length,
        avgChange24h: avgChange24h.toFixed(2),
        totalMarketCap,
        totalVolume24h: totalVolume,
        leader24h: comparison.reduce((best: { symbol: string; changes: { '24h': string } }, c: { symbol: string; changes: { '24h': string } }) => 
          (parseFloat(c.changes['24h']) || 0) > (parseFloat(best.changes['24h']) || 0) ? c : best
        ).symbol,
        laggard24h: comparison.reduce((worst: { symbol: string; changes: { '24h': string } }, c: { symbol: string; changes: { '24h': string } }) => 
          (parseFloat(c.changes['24h']) || 0) < (parseFloat(worst.changes['24h']) || 0) ? c : worst
        ).symbol,
      },
      timestamp: new Date().toISOString(),
      source: 'coingecko',
    });
  } catch (error) {
    console.error('Compare API error:', error);
    return ApiError.internal('Failed to compare coins');
  }
}
