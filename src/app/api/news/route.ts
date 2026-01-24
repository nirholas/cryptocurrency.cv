import { NextRequest } from 'next/server';
import { getLatestNews } from '@/lib/crypto-news';
import { translateArticles, isLanguageSupported, SUPPORTED_LANGUAGES } from '@/lib/translate';
import { jsonResponse, errorResponse, withTiming } from '@/lib/api-utils';

export const runtime = 'edge';
export const revalidate = 300; // 5 minutes

// Valid news categories
const VALID_CATEGORIES = [
  'general', 'bitcoin', 'defi', 'nft', 'research', 'institutional', 
  'etf', 'derivatives', 'onchain', 'fintech', 'macro', 'quant',
  'journalism', 'ethereum', 'asia', 'tradfi', 'mainstream', 'mining',
  'gaming', 'altl1', 'stablecoin'
];

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const searchParams = request.nextUrl.searchParams;
  const limit = parseInt(searchParams.get('limit') || '10');
  const source = searchParams.get('source') || undefined;
  const category = searchParams.get('category') || undefined;
  const from = searchParams.get('from') || undefined;
  const to = searchParams.get('to') || undefined;
  const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : undefined;
  const perPage = searchParams.get('per_page') ? parseInt(searchParams.get('per_page')!) : undefined;
  const lang = searchParams.get('lang') || 'en';
  
  // Validate category parameter
  if (category && !VALID_CATEGORIES.includes(category)) {
    return errorResponse(
      'Invalid category',
      `Category '${category}' is not valid. Valid categories: ${VALID_CATEGORIES.join(', ')}`,
      400
    );
  }
  
  // Validate language parameter
  if (lang !== 'en' && !isLanguageSupported(lang)) {
    return errorResponse(
      'Unsupported language',
      `Language '${lang}' is not supported. Supported: ${Object.keys(SUPPORTED_LANGUAGES).join(', ')}`,
      400
    );
  }
  
  try {
    const data = await getLatestNews(limit, source, { from, to, page, perPage, category });
    
    // Translate articles if language is not English
    let articles = data.articles;
    let translatedLang = 'en';
    
    if (lang !== 'en' && articles.length > 0) {
      try {
        articles = await translateArticles(articles, lang);
        translatedLang = lang;
      } catch (translateError) {
        console.error('Translation failed:', translateError);
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
    return errorResponse('Failed to fetch news', String(error));
  }
}
