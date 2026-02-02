import { NextRequest } from 'next/server';
import { getLatestNews } from '@/lib/crypto-news';
import { translateArticles, isLanguageSupported, SUPPORTED_LANGUAGES } from '@/lib/translate';
import { jsonResponse, errorResponse, withTiming } from '@/lib/api-utils';
import { validateQuery } from '@/lib/validation-middleware';
import { newsQuerySchema } from '@/lib/schemas';
import { ApiError } from '@/lib/api-error';
import { createRequestLogger } from '@/lib/logger';

export const runtime = 'edge';
export const revalidate = 60; // 1 minute for fresher content

// Valid news categories (kept for backward compatibility)
const VALID_CATEGORIES = [
  'general', 'bitcoin', 'defi', 'nft', 'research', 'institutional', 
  'etf', 'derivatives', 'onchain', 'fintech', 'macro', 'quant',
  'journalism', 'ethereum', 'asia', 'tradfi', 'mainstream', 'mining',
  'gaming', 'altl1', 'stablecoin'
];

export async function GET(request: NextRequest) {
  const logger = createRequestLogger(request);
  const startTime = Date.now();
  
  logger.info('Fetching news');
  
  // Validate query parameters using Zod schema
  const validation = validateQuery(request, newsQuerySchema);
  if (!validation.success) {
    return validation.error;
  }
  
  const { limit, source, category, from, to, page, per_page, lang } = validation.data;
  
  // Validate language parameter (additional check beyond schema)
  if (lang !== 'en' && !isLanguageSupported(lang)) {
    return errorResponse(
      'Unsupported language',
      `Language '${lang}' is not supported. Supported: ${Object.keys(SUPPORTED_LANGUAGES).join(', ')}`,
      400
    );
  }
  
  try {
    const data = await getLatestNews(limit, source, { from, to, page, perPage: per_page, category });
    
    // Translate articles if language is not English
    let articles = data.articles;
    let translatedLang = 'en';
    
    if (lang !== 'en' && articles.length > 0) {
      try {
        articles = await translateArticles(articles, lang);
        translatedLang = lang;
      } catch (translateError) {
        logger.error('Translation failed', translateError);
        // Continue with original articles on translation failure
      }
    }
    
    const responseData = withTiming({
      ...data,
      articles,
      lang: translatedLang,
      availableLanguages: Object.keys(SUPPORTED_LANGUAGES),
      availableCategories: VALID_CATEGORIES,
    }, startTime);
    
    return jsonResponse(responseData, {
      cacheControl: 'standard',
      etag: true,
      request,
    });
  } catch (error) {
    logger.error('Failed to fetch news', error);
    return ApiError.internal('Failed to fetch news', error);
  }
}
