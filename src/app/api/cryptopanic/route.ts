/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

import { type NextRequest, NextResponse } from 'next/server';
import {
  getCryptoNews,
  getCryptoPanicFiltered,
  getBullishNews,
  getBearishNews,
  getRisingNews,
  getImportantNews,
  getMediaPosts,
  getAnalysisPosts,
  getCryptoPanicDashboard,
  getTrendingTopics,
  getRegulatoryUpdates,
  getNewsSummary,
} from '@/lib/apis/news-feeds';

export const runtime = 'edge';
export const revalidate = 60;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
};

/**
 * GET /api/cryptopanic
 *
 * CryptoPanic news aggregator. Supports:
 *   ?action=dashboard              — full dashboard (trending, bullish, bearish, etc.)
 *   ?action=news                    — latest news (&currencies=BTC,ETH)
 *   ?action=trending               — trending posts
 *   ?action=bullish                — bullish sentiment posts
 *   ?action=bearish                — bearish sentiment posts
 *   ?action=rising                 — rising posts
 *   ?action=important              — community-flagged important
 *   ?action=media                  — media posts (videos, podcasts)
 *   ?action=analysis               — analysis posts only
 *   ?action=filter                  — custom filter (&filter=hot&kind=news&regions=en)
 *   ?action=topics                 — trending topics
 *   ?action=regulatory             — regulatory news
 *   ?action=summary                — comprehensive news summary
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'dashboard';
    const currencies = searchParams.get('currencies')?.split(',') || undefined;

    switch (action) {
      case 'dashboard': {
        const data = await getCryptoPanicDashboard(currencies);
        return NextResponse.json(data, { headers: CORS_HEADERS });
      }

      case 'news': {
        const page = parseInt(searchParams.get('page') || '1', 10);
        const data = await getCryptoNews({ currencies, page });
        return NextResponse.json(data, { headers: CORS_HEADERS });
      }

      case 'trending': {
        const data = await getCryptoPanicFiltered({ filter: 'trending', currencies });
        return NextResponse.json(data, { headers: CORS_HEADERS });
      }

      case 'bullish': {
        const data = await getBullishNews(currencies);
        return NextResponse.json(data, { headers: CORS_HEADERS });
      }

      case 'bearish': {
        const data = await getBearishNews(currencies);
        return NextResponse.json(data, { headers: CORS_HEADERS });
      }

      case 'rising': {
        const data = await getRisingNews(currencies);
        return NextResponse.json(data, { headers: CORS_HEADERS });
      }

      case 'important': {
        const data = await getImportantNews(currencies);
        return NextResponse.json(data, { headers: CORS_HEADERS });
      }

      case 'media': {
        const data = await getMediaPosts(currencies);
        return NextResponse.json(data, { headers: CORS_HEADERS });
      }

      case 'analysis': {
        const data = await getAnalysisPosts(currencies);
        return NextResponse.json(data, { headers: CORS_HEADERS });
      }

      case 'filter': {
        const filter = searchParams.get('filter') as 'trending' | 'hot' | 'rising' | 'bullish' | 'bearish' | 'important' | undefined;
        const kind = searchParams.get('kind') as 'news' | 'media' | 'analysis' | undefined;
        const regions = searchParams.get('regions')?.split(',') || undefined;
        const source = searchParams.get('source') || undefined;
        const page = parseInt(searchParams.get('page') || '1', 10);
        const data = await getCryptoPanicFiltered({ filter, kind, currencies, regions, source, page });
        return NextResponse.json(data, { headers: CORS_HEADERS });
      }

      case 'topics': {
        const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 50);
        const data = await getTrendingTopics(limit);
        return NextResponse.json({ data, count: data.length, timestamp: new Date().toISOString() }, { headers: CORS_HEADERS });
      }

      case 'regulatory': {
        const country = searchParams.get('country') || undefined;
        const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);
        const data = await getRegulatoryUpdates({ country, limit });
        return NextResponse.json({ data, count: data.length, timestamp: new Date().toISOString() }, { headers: CORS_HEADERS });
      }

      case 'summary': {
        const data = await getNewsSummary();
        return NextResponse.json(data, { headers: CORS_HEADERS });
      }

      default:
        return NextResponse.json({
          error: `Unknown action: ${action}`,
          available: [
            'dashboard', 'news', 'trending', 'bullish', 'bearish', 'rising',
            'important', 'media', 'analysis', 'filter', 'topics', 'regulatory', 'summary',
          ],
        }, { status: 400, headers: CORS_HEADERS });
    }
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch CryptoPanic data' },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}

export function OPTIONS() {
  return new NextResponse(null, { headers: CORS_HEADERS });
}
