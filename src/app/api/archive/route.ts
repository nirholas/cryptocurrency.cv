import { NextRequest, NextResponse } from 'next/server';
import { 
  queryArchive, 
  getArchiveIndex, 
  getArchiveStats
} from '@/lib/archive';
import { translateArticles, isLanguageSupported, SUPPORTED_LANGUAGES } from '@/lib/translate';

export const runtime = 'edge';

/**
 * GET /api/archive - Query historical news archive
 * 
 * Query Parameters:
 * - start_date: Start date (YYYY-MM-DD)
 * - end_date: End date (YYYY-MM-DD)
 * - source: Filter by source name
 * - q: Search query
 * - limit: Max results (default 50, max 200)
 * - offset: Pagination offset
 * - stats: If "true", return archive statistics only
 * - index: If "true", return archive index only
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Check for stats-only request
    if (searchParams.get('stats') === 'true') {
      const stats = await getArchiveStats();
      
      if (!stats) {
        return NextResponse.json({
          success: false,
          error: 'Archive not available',
          message: 'Historical archive has not been initialized yet'
        }, { status: 404 });
      }
      
      return NextResponse.json({
        success: true,
        stats
      });
    }
    
    // Check for index-only request
    if (searchParams.get('index') === 'true') {
      const index = await getArchiveIndex();
      
      if (!index) {
        return NextResponse.json({
          success: false,
          error: 'Archive not available',
          message: 'Historical archive has not been initialized yet'
        }, { status: 404 });
      }
      
      return NextResponse.json({
        success: true,
        index
      });
    }
    
    // Parse query parameters
    const startDate = searchParams.get('start_date') || undefined;
    const endDate = searchParams.get('end_date') || undefined;
    const source = searchParams.get('source') || undefined;
    const search = searchParams.get('q') || undefined;
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
    const offset = parseInt(searchParams.get('offset') || '0');
    const lang = searchParams.get('lang') || 'en';
    
    // Validate language parameter
    if (lang !== 'en' && !isLanguageSupported(lang)) {
      return NextResponse.json({
        success: false,
        error: 'Unsupported language',
        message: `Language '${lang}' is not supported`,
        supported: Object.keys(SUPPORTED_LANGUAGES)
      }, { status: 400 });
    }
    
    // Validate date formats
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (startDate && !dateRegex.test(startDate)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid start_date format',
        message: 'Use YYYY-MM-DD format'
      }, { status: 400 });
    }
    if (endDate && !dateRegex.test(endDate)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid end_date format',
        message: 'Use YYYY-MM-DD format'
      }, { status: 400 });
    }
    
    // Fetch archive index to get available date range
    const archiveIndex = await getArchiveIndex();
    
    // Check if requested dates are outside available range
    let warning: string | null = null;
    if (archiveIndex && (startDate || endDate)) {
      const { earliest, latest } = archiveIndex.dateRange;
      if (startDate && endDate) {
        // Both dates provided - check if range is entirely outside archive
        if (endDate < earliest || startDate > latest) {
          warning = `Requested date range (${startDate} to ${endDate}) is outside the available archive range (${earliest} to ${latest}). No data available for this period.`;
        } else if (startDate < earliest || endDate > latest) {
          warning = `Part of the requested date range is outside the available archive range (${earliest} to ${latest}).`;
        }
      } else if (startDate && startDate > latest) {
        warning = `Start date ${startDate} is after the latest archived date (${latest}).`;
      } else if (endDate && endDate < earliest) {
        warning = `End date ${endDate} is before the earliest archived date (${earliest}).`;
      }
    }
    
    // Query archive
    const result = await queryArchive({
      startDate,
      endDate,
      source,
      search,
      limit,
      offset
    });
    
    // Translate articles if language is not English
    let articles = result.articles;
    let translatedLang = 'en';
    
    if (lang !== 'en' && articles.length > 0) {
      try {
        articles = await translateArticles(articles as any, lang);
        translatedLang = lang;
      } catch (translateError) {
        console.error('Translation failed:', translateError);
        // Continue with original articles on translation failure
      }
    }
    
    return NextResponse.json({
      success: true,
      count: articles.length,
      total: result.total,
      pagination: result.pagination,
      lang: translatedLang,
      availableLanguages: Object.keys(SUPPORTED_LANGUAGES),
      ...(warning && { warning }),
      archiveDateRange: archiveIndex?.dateRange || null,
      filters: {
        start_date: startDate || null,
        end_date: endDate || null,
        source: source || null,
        search: search || null
      },
      articles
    });
    
  } catch (error) {
    console.error('Archive API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to query archive',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
