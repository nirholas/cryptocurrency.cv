/**
 * GET /api/v1/news
 *
 * Premium API v1 - Crypto News Endpoint
 * Returns latest cryptocurrency news with optional filtering, translation, and AI enrichment.
 * Requires x402 payment or valid API key.
 *
 * @price $0.001 per request
 */

import { NextRequest, NextResponse } from 'next/server';
import { hybridAuthMiddleware } from '@/lib/x402';
import { ApiError } from '@/lib/api-error';
import { createRequestLogger } from '@/lib/logger';
import { getLatestNews } from '@/lib/crypto-news';
import { translateArticles, isLanguageSupported, SUPPORTED_LANGUAGES } from '@/lib/translate';
import { getBulkEnrichment } from '@/lib/article-enrichment';

export const runtime = 'edge';
export const revalidate = 60;

const ENDPOINT = '/api/v1/news';

const VALID_CATEGORIES = [
  'general', 'bitcoin', 'defi', 'nft', 'research', 'institutional',
  'etf', 'derivatives', 'onchain', 'fintech', 'macro', 'quant',
  'journalism', 'ethereum', 'asia', 'tradfi', 'mainstream', 'mining',
  'gaming', 'altl1', 'stablecoin', 'geopolitical', 'security', 'developer',
  'layer2', 'solana', 'trading',
];

export async function GET(request: NextRequest): Promise<NextResponse> {
  const logger = createRequestLogger(request);
  const startTime = Date.now();

  // Check authentication (API key or x402 payment)
  const authResponse = await hybridAuthMiddleware(request, ENDPOINT);
  if (authResponse) return authResponse;

  const searchParams = request.nextUrl.searchParams;
  const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
  const source = searchParams.get('source') || undefined;
  const category = searchParams.get('category') || undefined;
  const from = searchParams.get('from') || undefined;
  const to = searchParams.get('to') || undefined;
  const page = parseInt(searchParams.get('page') || '1', 10);
  const per_page = Math.min(parseInt(searchParams.get('per_page') || '20', 10), 100);
  const lang = searchParams.get('lang') || 'en';
  const sort = searchParams.get('sort');

  // Validate language
  if (lang !== 'en' && !isLanguageSupported(lang)) {
    return NextResponse.json(
      {
        error: 'Unsupported language',
        message: `Language '${lang}' is not supported. Supported: ${Object.keys(SUPPORTED_LANGUAGES).join(', ')}`,
        version: 'v1',
      },
      { status: 400 }
    );
  }

  try {
    logger.info('Fetching news', { limit, source, category, page });

    const data = await getLatestNews(limit, source, { from, to, page, perPage: per_page, category });

    let articles = data.articles;
    let translatedLang = 'en';

    // Attach AI enrichment (non-blocking)
    try {
      const enrichmentMap = await getBulkEnrichment(articles.map(a => a.link));
      articles = articles.map(a => {
        const ai = enrichmentMap.get(a.link);
        return ai ? { ...a, ai } : a;
      });

      if (sort === 'impact') {
        articles = [...articles].sort((a, b) => {
          const sa = (a as { ai?: { impactScore?: number } }).ai?.impactScore ?? -1;
          const sb = (b as { ai?: { impactScore?: number } }).ai?.impactScore ?? -1;
          return sb - sa;
        });
      }
    } catch {
      // Enrichment is best-effort
    }

    // Translate if needed
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
        availableCategories: VALID_CATEGORIES,
        version: 'v1',
        meta: {
          endpoint: ENDPOINT,
          count: articles.length,
          page,
          perPage: per_page,
          timestamp: new Date().toISOString(),
        },
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
          'Access-Control-Allow-Origin': '*',
          'X-Data-Source': 'CryptoNews',
        },
      }
    );
  } catch (error) {
    logger.error('Failed to fetch news', error);
    return ApiError.internal('Failed to fetch news', error);
  }
}
