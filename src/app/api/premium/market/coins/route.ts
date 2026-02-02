/**
 * Premium API - Extended Market Coins
 *
 * GET /api/premium/market/coins
 *
 * Premium endpoint providing extended coin data with:
 * - Up to 500 coins (vs 250 on free tier)
 * - Full metadata including social and developer data
 * - No rate limiting
 *
 * Price: $0.001 per request
 *
 * @module api/premium/market/coins
 */

import { NextRequest, NextResponse } from 'next/server';
import { withX402 } from '@/lib/x402';
import { getTopCoins, getCoinDetails, TokenPrice } from '@/lib/market-data';
import { ApiError } from '@/lib/api-error';
import { createRequestLogger } from '@/lib/logger';

export const runtime = 'nodejs'; // Required for x402

/**
 * Extended coin data with additional metadata
 */
interface ExtendedCoinData extends TokenPrice {
  description?: string;
  genesis_date?: string;
  categories?: string[];
  links?: {
    homepage?: string[];
    blockchain_site?: string[];
    twitter_screen_name?: string;
    telegram_channel_identifier?: string;
    subreddit_url?: string;
  };
  developer_score?: number;
  community_score?: number;
  liquidity_score?: number;
  public_interest_score?: number;
}

interface PremiumCoinsResponse {
  coins: ExtendedCoinData[];
  total: number;
  premium: true;
  metadata: {
    fetchedAt: string;
    includesExtendedData: boolean;
    maxAvailable: number;
  };
}

/**
 * Handler for premium coins endpoint
 */
async function handler(
  request: NextRequest
): Promise<NextResponse<PremiumCoinsResponse | { error: string; message: string }>> {
  const logger = createRequestLogger(request);
  const startTime = Date.now();
  
  try {
    logger.info('Processing premium coins request');
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10), 500);
    const includeDetails = searchParams.get('details') === 'true';

    // Fetch base coin data with higher limit
    const coins = await getTopCoins(limit);

    let extendedCoins: ExtendedCoinData[] = coins;

    // If details requested, fetch additional metadata for top coins
    if (includeDetails && limit <= 50) {
      const detailPromises = coins.slice(0, 20).map(async (coin) => {
        try {
          const details = await getCoinDetails(coin.id);
          if (details) {
            return {
              ...coin,
              description: details.description?.en?.substring(0, 500),
              genesis_date: details.genesis_date,
              categories: details.categories,
              links: {
                homepage: details.links?.homepage?.filter(Boolean),
                blockchain_site: details.links?.blockchain_site?.filter(Boolean)?.slice(0, 3),
                twitter_screen_name: details.links?.twitter_screen_name,
                telegram_channel_identifier: details.links?.telegram_channel_identifier,
                subreddit_url: details.links?.subreddit_url,
              },
              developer_score: details.developer_score,
              community_score: details.community_score,
              liquidity_score: details.liquidity_score,
              public_interest_score: details.public_interest_score,
            };
          }
          return coin;
        } catch {
          return coin;
        }
      });

      const detailedCoins = await Promise.all(detailPromises);
      extendedCoins = [...detailedCoins, ...coins.slice(20)];
    }

    logger.request(request.method, request.nextUrl.pathname, 200, Date.now() - startTime);
    
    return NextResponse.json(
      {
        coins: extendedCoins,
        total: extendedCoins.length,
        premium: true,
        metadata: {
          fetchedAt: new Date().toISOString(),
          includesExtendedData: includeDetails && limit <= 50,
          maxAvailable: 500,
        },
      },
      {
        headers: {
          'Cache-Control': 'private, s-maxage=30, stale-while-revalidate=60',
        },
      }
    );
  } catch (error) {
    logger.error('Premium coins request failed', error);
    return ApiError.internal('Failed to fetch premium coin data', error);
  }
}

/**
 * GET /api/premium/market/coins
 *
 * Premium endpoint - requires x402 payment
 *
 * Query parameters:
 * - limit: Number of coins (1-500, default: 100)
 * - details: Include extended metadata for top 20 coins (true/false)
 *
 * @example
 * GET /api/premium/market/coins?limit=500
 * GET /api/premium/market/coins?limit=50&details=true
 */
export const GET = withX402('/api/premium/market/coins', handler);
