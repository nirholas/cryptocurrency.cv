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
 * International News API Endpoint
 * 
 * GET /api/news/international
 * 
 * Fetches and optionally translates news from 50+ international crypto news sources
 * across 16 languages and 5 regions.
 */

import { type NextRequest } from 'next/server';
import { 
  getInternationalNews, 
  getInternationalSources,
  getSourceHealthStats,
  SOURCES_BY_LANGUAGE,
  SOURCES_BY_REGION,
} from '@/lib/international-sources';
import { 
  translateInternationalNewsResponse,
  isTranslationAvailable,
} from '@/lib/source-translator';
import { jsonResponse, errorResponse, withTiming } from '@/lib/api-utils';
import { intParam } from '@/lib/query-params';

export const runtime = 'edge';
export const revalidate = 300; // 5 minutes

// Valid language values (16 languages)
const VALID_LANGUAGES = [
  'ko', 'zh', 'ja',           // East Asia
  'es', 'pt',                  // Latin America
  'de', 'fr', 'ru', 'tr', 'it', 'nl', 'pl', // Europe
  'id', 'vi', 'th',           // Southeast Asia
  'ar',                        // Middle East
  'all'
] as const;
type ValidLanguage = typeof VALID_LANGUAGES[number];

// Valid region values (5 regions + all)
const VALID_REGIONS = ['asia', 'europe', 'latam', 'mena', 'sea', 'all'] as const;
type ValidRegion = typeof VALID_REGIONS[number];

/**
 * GET /api/news/international
 * 
 * Query Parameters:
 * - language: ko | zh | ja | es | pt | de | fr | ru | tr | it | nl | pl | id | vi | th | ar | all (default: all)
 * - translate: true | false (default: false)
 * - limit: 1-100 (default: 20)
 * - region: asia | europe | latam | mena | sea | all (default: all)
 * - sources: true (returns available sources instead of articles)
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const searchParams = request.nextUrl.searchParams;

  // Parse query parameters
  const languageParam = searchParams.get('language') || 'all';
  const translateParam = searchParams.get('translate') === 'true';
  const limit = intParam(searchParams, 'limit', { fallback: 20, min: 1, max: 100 });
  const regionParam = searchParams.get('region') || 'all';
  const sourcesParam = searchParams.get('sources') === 'true';

  // If requesting sources info
  if (sourcesParam) {
    try {
      const sourcesData = await getInternationalSources();
      const healthStats = getSourceHealthStats();
      
      return jsonResponse(withTiming({
        ...sourcesData,
        health: healthStats,
        availableLanguages: Object.keys(SOURCES_BY_LANGUAGE),
        availableRegions: Object.keys(SOURCES_BY_REGION).filter(r => SOURCES_BY_REGION[r].length > 0),
        translationAvailable: isTranslationAvailable(),
      }, startTime), {
        cacheControl: 'standard',
        etag: true,
        request,
      });
    } catch (error) {
      console.error('International sources error:', error);
      return errorResponse('Failed to fetch sources');
    }
  }

  // Validate language parameter
  if (!VALID_LANGUAGES.includes(languageParam as ValidLanguage)) {
    return errorResponse(
      'Invalid language parameter',
      `Must be one of: ${VALID_LANGUAGES.join(', ')}`,
      400
    );
  }

  // Validate region parameter
  if (!VALID_REGIONS.includes(regionParam as ValidRegion)) {
    return errorResponse(
      'Invalid region parameter',
      `Must be one of: ${VALID_REGIONS.join(', ')}`,
      400
    );
  }

  try {
    // Fetch international news
    let response = await getInternationalNews({
      language: languageParam as ValidLanguage,
      region: regionParam as ValidRegion,
      limit,
    });

    // Translate if requested and available
    if (translateParam && isTranslationAvailable()) {
      try {
        response = await translateInternationalNewsResponse(response);
      } catch (translateError) {
        console.error('Translation failed:', translateError);
        // Continue with untranslated articles
      }
    }

    // Build response with metadata
    const responseData = withTiming({
      articles: response.articles,
      meta: {
        total: response.total,
        languages: response.languages,
        regions: response.regions,
        translationEnabled: translateParam,
        translationAvailable: isTranslationAvailable(),
        translated: response.translated,
      },
      _links: {
        self: `/api/news/international?language=${languageParam}&region=${regionParam}&limit=${limit}&translate=${translateParam}`,
        sources: '/api/news/international?sources=true',
      },
    }, startTime);

    return jsonResponse(responseData, {
      cacheControl: translateParam ? 'ai' : 'standard',
      etag: true,
      request,
    });
  } catch (error) {
    console.error('International news fetch error:', error);
    return errorResponse('Failed to fetch international news');
  }
}

/**
 * OPTIONS handler for CORS preflight
 */
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}
