/**
 * Premium API v1 - Single Coin Endpoint
 *
 * Returns detailed data for a single cryptocurrency
 * Requires x402 payment or valid API key
 *
 * @price $0.002 per request
 */

import { NextRequest, NextResponse } from 'next/server';
import { hybridAuthMiddleware } from '@/lib/x402';

const ENDPOINT = '/api/v1/coin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ coinId: string }> }
) {
  // Check authentication
  const authResponse = await hybridAuthMiddleware(request, ENDPOINT);
  if (authResponse) return authResponse;

  const { coinId } = await params;

  if (!coinId || coinId.length < 1) {
    return NextResponse.json({ success: false, error: 'Coin ID is required' }, { status: 400 });
  }

  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/${coinId}?localization=false&tickers=true&market_data=true&community_data=true&developer_data=false&sparkline=true`,
      {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'CryptoDataAggregator/1.0',
        },
        next: { revalidate: 60 },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { success: false, error: 'Coin not found', coinId },
          { status: 404 }
        );
      }
      throw new Error(`Upstream API error: ${response.status}`);
    }

    const data = await response.json();

    // Transform to cleaner structure
    const coin = {
      id: data.id,
      symbol: data.symbol,
      name: data.name,
      image: data.image,
      description: data.description?.en || null,
      links: {
        homepage: data.links?.homepage?.[0] || null,
        blockchain_site: data.links?.blockchain_site?.filter(Boolean) || [],
        repos: data.links?.repos_url?.github || [],
        twitter: data.links?.twitter_screen_name
          ? `https://twitter.com/${data.links.twitter_screen_name}`
          : null,
        telegram: data.links?.telegram_channel_identifier
          ? `https://t.me/${data.links.telegram_channel_identifier}`
          : null,
        reddit: data.links?.subreddit_url || null,
      },
      categories: data.categories || [],
      market_cap_rank: data.market_cap_rank,
      coingecko_rank: data.coingecko_rank,
      market_data: data.market_data
        ? {
            current_price: data.market_data.current_price,
            market_cap: data.market_data.market_cap,
            total_volume: data.market_data.total_volume,
            high_24h: data.market_data.high_24h,
            low_24h: data.market_data.low_24h,
            price_change_24h: data.market_data.price_change_24h,
            price_change_percentage_24h: data.market_data.price_change_percentage_24h,
            price_change_percentage_7d: data.market_data.price_change_percentage_7d,
            price_change_percentage_30d: data.market_data.price_change_percentage_30d,
            ath: data.market_data.ath,
            ath_change_percentage: data.market_data.ath_change_percentage,
            ath_date: data.market_data.ath_date,
            atl: data.market_data.atl,
            atl_change_percentage: data.market_data.atl_change_percentage,
            atl_date: data.market_data.atl_date,
            circulating_supply: data.market_data.circulating_supply,
            total_supply: data.market_data.total_supply,
            max_supply: data.market_data.max_supply,
            fully_diluted_valuation: data.market_data.fully_diluted_valuation,
            sparkline_7d: data.market_data.sparkline_7d,
          }
        : null,
      community_data: data.community_data,
      tickers: data.tickers?.slice(0, 10) || [],
      last_updated: data.last_updated,
    };

    return NextResponse.json(
      {
        success: true,
        data: coin,
        meta: {
          endpoint: ENDPOINT,
          coinId,
          timestamp: new Date().toISOString(),
        },
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
          'X-Data-Source': 'CoinGecko',
        },
      }
    );
  } catch (error) {
    console.error(`[API] /v1/coin/${coinId} error:`, error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch coin data',
        coinId,
      },
      { status: 502 }
    );
  }
}
