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
 * Influencer Reliability API
 *
 * Track and score cryptocurrency influencer predictions.
 *
 * GET /api/influencers - List influencers with reliability scores
 * GET /api/influencers/[id] - Get specific influencer details
 * POST /api/influencers/calls - Record a new trading call
 * GET /api/influencers/stats - Get overall statistics
 *
 * @module api/influencers
 */

import { type NextRequest, NextResponse } from 'next/server';
import {
  getAllInfluencers,
  getInfluencerStats,
  rankInfluencers,
  type Influencer,
} from '@/lib/influencer-tracker';

export const revalidate = 300; // ISR: influencer data refreshes every 5 min

/**
 * GET /api/influencers
 *
 * Query Parameters:
 * - sortBy: 'reliability' | 'accuracy' | 'returns' | 'sharpe' (default: 'reliability')
 * - limit: number (default: 50, max: 100)
 * - minCalls: Minimum number of calls to include (default: 0)
 * - platform: Filter by platform
 * - ticker: Filter by ticker expertise
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const sortBy = (searchParams.get('sortBy') || 'reliability') as
      | 'reliability'
      | 'accuracy'
      | 'returns'
      | 'sharpe';
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const minCalls = parseInt(searchParams.get('minCalls') || '0');
    const platform = searchParams.get('platform');
    const ticker = searchParams.get('ticker');
    const view = searchParams.get('view');

    // Return stats view if requested
    if (view === 'stats') {
      const stats = getInfluencerStats();
      return NextResponse.json({
        success: true,
        data: stats,
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Get and filter influencers
    let influencers = await getAllInfluencers();

    // Filter by minimum calls
    if (minCalls > 0) {
      influencers = influencers.filter(
        (i: { postsWithCalls: number }) => i.postsWithCalls >= minCalls,
      );
    }

    // Filter by platform
    if (platform) {
      influencers = influencers.filter((i: { platform: string }) => i.platform === platform);
    }

    // Filter by ticker expertise
    if (ticker) {
      influencers = influencers.filter((i: { topTickers: Array<{ ticker: string }> }) =>
        i.topTickers.some((t: { ticker: string }) => t.ticker === ticker.toUpperCase()),
      );
    }

    // Rank and limit
    const ranked = rankInfluencers(influencers, sortBy).slice(0, limit);

    return NextResponse.json({
      success: true,
      data: {
        influencers: ranked,
        total: influencers.length,
        returned: ranked.length,
      },
      meta: {
        sortBy,
        limit,
        filters: {
          minCalls,
          platform,
          ticker,
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[Influencers API] Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch influencer data',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/influencers
 *
 * Register a new influencer for tracking
 *
 * Body:
 * - platform: 'twitter' | 'discord' | 'telegram' | 'youtube'
 * - username: string
 * - displayName?: string
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { platform, username, displayName } = body;

    if (!platform || !username) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: platform, username' },
        { status: 400 },
      );
    }

    const validPlatforms = ['twitter', 'discord', 'telegram', 'youtube'];
    if (!validPlatforms.includes(platform)) {
      return NextResponse.json(
        { success: false, error: `Invalid platform. Must be one of: ${validPlatforms.join(', ')}` },
        { status: 400 },
      );
    }

    // Create new influencer (in production, would store in database)
    const influencer: Influencer = {
      id: `${platform}:${username}`,
      platform,
      username,
      displayName: displayName || username,
      followers: 0,
      isVerified: false,
      trackedSince: new Date().toISOString(),
      lastActive: new Date().toISOString(),
      totalPosts: 0,
      postsWithCalls: 0,
      reliabilityScore: 50, // Neutral starting score
      accuracyRate: 0,
      avgReturn: 0,
      sharpeRatio: 0,
      maxDrawdown: 0,
      sentimentBias: 0,
      tickerConcentration: 0,
      avgHoldingPeriod: 0,
      overallRank: 0,
      accuracyRank: 0,
      returnRank: 0,
      topTickers: [],
    };

    // Note: In production, store in database
    // For now, just return the created influencer

    return NextResponse.json(
      {
        success: true,
        data: influencer,
        meta: {
          message: 'Influencer registered for tracking',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('[Influencers API] POST Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to register influencer',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
