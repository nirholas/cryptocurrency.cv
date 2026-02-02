import { NextRequest, NextResponse } from 'next/server';
import { getBreakingNews } from '@/lib/crypto-news';
import { translateArticles, isLanguageSupported, SUPPORTED_LANGUAGES } from '@/lib/translate';
import { validateQuery } from '@/lib/validation-middleware';
import { breakingNewsQuerySchema } from '@/lib/schemas';
import { ApiError } from '@/lib/api-error';
import { createRequestLogger } from '@/lib/logger';

export const runtime = 'edge';
export const revalidate = 60; // 1 minute for breaking news

export async function GET(request: NextRequest) {
  const logger = createRequestLogger(request);
  const startTime = Date.now();
  
  logger.info('Fetching breaking news');
  
  // Validate query parameters using Zod schema
  const validation = validateQuery(request, breakingNewsQuerySchema);
  if (!validation.success) {
    return validation.error;
  }
  
  const { limit, priority } = validation.data;
  
  // Note: lang parameter support could be added to schema if needed
  const lang = request.nextUrl.searchParams.get('lang') || 'en';
  
  // Validate language parameter
  if (lang !== 'en' && !isLanguageSupported(lang)) {
    return NextResponse.json(
      { 
        error: 'Unsupported language', 
        message: `Language '${lang}' is not supported`,
        supported: Object.keys(SUPPORTED_LANGUAGES),
      },
      { status: 400 }
    );
  }
  
  try {
    const data = await getBreakingNews(limit);
    
    // Translate articles if language is not English
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
    
    return NextResponse.json(
      {
        ...data,
        articles,
        lang: translatedLang,
        availableLanguages: Object.keys(SUPPORTED_LANGUAGES),
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    logger.error('Failed to fetch breaking news', error);
    return ApiError.internal('Failed to fetch breaking news', error);
  }
}
