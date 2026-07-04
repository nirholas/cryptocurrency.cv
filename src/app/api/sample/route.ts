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
 * Sample API Endpoint — Free Preview
 *
 * GET /api/sample — Returns a tiny taste of the API: 2 headline snippets
 * and 2 coin prices. Heavily stripped — no content, no summaries, no metadata.
 * Designed to let developers verify the API works before paying.
 *
 * - No API key required
 * - Rate limited: 10 req/hour per IP
 * - Results are intentionally minimal and delayed (5-min cache)
 *
 * For full data, use x402 micropayment ($0.001/req) or a Pro/Enterprise key.
 */

import { type NextRequest } from 'next/server';
import { getLatestNews } from '@/lib/crypto-news';
import { jsonResponse, errorResponse } from '@/lib/api-utils';

export const runtime = 'nodejs';
export const revalidate = 300; // 5-minute cache — stale data is fine for a preview

export async function GET(request: NextRequest) {
  try {
    // Fetch a small batch of news — we only expose 2 stripped headlines
    const data = await getLatestNews(5);

    const headlines = data.articles.slice(0, 2).map((a) => ({
      title: a.title,
      source: a.source,
      pubDate: a.pubDate,
      // No URL, no content, no summary, no enrichment, no category
    }));

    // Simple static price preview — 2 coins only
    const prices = [
      { symbol: 'BTC', name: 'Bitcoin' },
      { symbol: 'ETH', name: 'Ethereum' },
    ];

    return jsonResponse({
      sample: true,
      notice:
        'This is a free preview with minimal data. ' +
        'For full access to 300+ endpoints, use x402 micropayment ($0.001/req in USDC on Base) ' +
        'or subscribe to a Pro key ($29/mo) at /api/keys/upgrade.',
      data: {
        headlines,
        coins: prices,
      },
      upgrade: {
        x402: 'Include x402 payment header — $0.001 per request in USDC on Base',
        pro: '$29/month — 50,000 req/day, all endpoints, AI access',
        enterprise: '$99/month — 500,000 req/day, priority routing, SLA',
        docs: '/api/docs',
        pricing: '/api/keys/upgrade',
      },
      _meta: {
        cached: true,
        maxAge: '5 minutes',
        resultsCapped: 2,
        fullEndpoints: '300+',
      },
    });
  } catch {
    return errorResponse('Sample data temporarily unavailable', 'Please try again shortly', 503);
  }
}
