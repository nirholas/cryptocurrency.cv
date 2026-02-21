/**
 * GET /api/v1/bitcoin
 *
 * Premium API v1 - Bitcoin News Endpoint
 * Returns latest Bitcoin-specific news with optional translation.
 * Requires x402 payment or valid API key.
 *
 * @price $0.001 per request
 */

import { NextRequest, NextResponse } from 'next/server';
import { hybridAuthMiddleware } from '@/lib/x402';
import { ApiError } from '@/lib/api-error';
import { createRequestLogger } from '@/lib/logger';
import { getBitcoinNews } from '@/lib/crypto-news';
import { translateArticles, isLanguageSupported, SUPPORTED_LANGUAGES } from '@/lib/translate';

export const runtime = 'edge';
export const revalidate = 300;

const ENDPOINT = '/api/v1/bitcoin';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const logger = createRequestLogger(request);
  const startTime = Date.now();

  // Check authentication
  const authResponse = await hybridAuthMiddleware(request, ENDPOINT);
  if (authResponse) return authResponse;

  const searchParams = request.nextUrl.searchParams;
  const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 100);
  const lang = searchParams.get('lang') || 'en';

  // Validate language
  if (lang !== 'en' && !isLanguageSupported(lang)) {
    return NextResponse.json(
      {
        error: 'Unsupported language',
        message: `Language '${lang}' is not supported`,
        supported: Object.keys(SUPPORTED_LANGUAGES),
        version: 'v1',
      },
      { status: 400 }
    );
  }

  try {
    logger.info('Fetching Bitcoin news', { limit, lang });

    const data = await getBitcoinNews(limit);

    let articles = data.articles;
    let translatedLang = 'en';

    if (lang !== 'en' && articles.length > 0) {
      try {
        articles = await translateArticles(articles, lang);
        translatedLang = lang;
      } catch (translateError) {
        logger.error('Translation failed', translateError);
      }
    }

    logger.request(request.method, request.nextUrl.pathname, 200, Date.now() - startTime);

    return NextResponse.json(
      {
        ...data,
        articles,
        lang: translatedLang,
        availableLanguages: Object.keys(SUPPORTED_LANGUAGES),
        version: 'v1',
        meta: {
          endpoint: ENDPOINT,
          count: articles.length,
          timestamp: new Date().toISOString(),
        },
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          'Access-Control-Allow-Origin': '*',
          'X-Data-Source': 'CryptoNews',
        },
      }
    );
  } catch (error) {
    logger.error('Failed to fetch Bitcoin news', error);
    return ApiError.internal('Failed to fetch Bitcoin news', error);
  }
}
