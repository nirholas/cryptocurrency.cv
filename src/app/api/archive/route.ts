import { NextRequest, NextResponse } from 'next/server';
import { 
  queryArchive, 
  getArchiveIndex, 
  getArchiveStats 
} from '@/lib/archive';

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
    
    // Query archive
    const result = await queryArchive({
      startDate,
      endDate,
      source,
      search,
      limit,
      offset
    });
    
    return NextResponse.json({
      success: true,
      count: result.articles.length,
      total: result.total,
      pagination: result.pagination,
      filters: {
        start_date: startDate || null,
        end_date: endDate || null,
        source: source || null,
        search: search || null
      },
      articles: result.articles
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
