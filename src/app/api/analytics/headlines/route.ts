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
 * Headline Tracking API
 * 
 * Track how article headlines change over time.
 * 
 * GET /api/analytics/headlines
 * Query params:
 *   - hours: How far back to look (default: 24)
 *   - changesOnly: Only show changed headlines (default: false)
 */

import { type NextRequest } from 'next/server';
import { jsonResponse, errorResponse, withTiming } from '@/lib/api-utils';
import { 
  getHeadlineTracking, 
  bulkTrackArticles, 
  getTrackingStats 
} from '@/lib/headline-tracker';
import { getLatestNews } from '@/lib/crypto-news';
import { intParam } from '@/lib/query-params';

export const runtime = 'edge';
export const revalidate = 60; // 1 minute

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const searchParams = request.nextUrl.searchParams;
  
  // Parse query parameters
  const hours = intParam(searchParams, 'hours', { fallback: 24, min: 1, max: 168 }); // Max 1 week
  const changesOnly = searchParams.get('changesOnly') === 'true';
  
  try {
    // First, update tracking with latest news
    try {
      const news = await getLatestNews(50);
      const articles = news.articles.map(a => ({
        link: a.link,
        title: a.title,
        source: a.source,
      }));
      bulkTrackArticles(articles);
    } catch (fetchError) {
      console.warn('Failed to fetch latest news for tracking:', fetchError);
    }
    
    // Get tracking results
    const result = await getHeadlineTracking({ hours, changesOnly });
    
    // Add tracking stats
    const stats = getTrackingStats();
    
    const responseData = withTiming({
      ...result,
      params: { hours, changesOnly },
      trackingStats: stats,
    }, startTime);
    
    return jsonResponse(responseData, {
      cacheControl: 'realtime',
      etag: true,
      request,
    });
  } catch (error) {
    console.error('Headline tracking error:', error);
    return errorResponse('Failed to get headline tracking');
  }
}
