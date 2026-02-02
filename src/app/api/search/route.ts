import { NextRequest, NextResponse } from 'next/server';
import { searchNews } from '@/lib/crypto-news';
import { translateArticles, isLanguageSupported, SUPPORTED_LANGUAGES } from '@/lib/translate';
import { validateQuery } from '@/lib/validation-middleware';
import { searchQuerySchema } from '@/lib/schemas';
import { ApiError } from '@/lib/api-error';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  // Validate query parameters
  const validation = validateQuery(request, searchQuerySchema);
  if (!validation.success) {
    return validation.error;
  }
  
  const { q: sanitizedQuery, limit, lang } = validation.data;
  
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
    const data = await searchNews(sanitizedQuery, limit);
    
    // Translate articles if language is not English
    let articles = data.articles;
    let translatedLang = 'en';
    
    if (lang !== 'en' && articles.length > 0) {
      try {
        articles = await translateArticles(articles, lang);
        translatedLang = lang;
      } catch (translateError) {
        console.error('Translation failed:', translateError);
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
    return NextResponse.json(
      { error: 'Failed to search news', message: String(error) },
      { status: 500 }
    );
  }
}
