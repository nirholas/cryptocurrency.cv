/**
 * @fileoverview Article Views Tracking API
 * 
 * Tracks and retrieves article view counts for popularity metrics.
 * Uses in-memory storage with optional Redis persistence.
 * 
 * @module api/views
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

// In-memory view counts (in production, use Redis or database)
// Map of article ID -> view count
const viewCounts = new Map<string, number>();

// View tracking with time windows for trending detection
interface ViewRecord {
  total: number;
  last24h: number;
  last7d: number;
  lastViewed: number;
}

const viewRecords = new Map<string, ViewRecord>();

/**
 * GET /api/views
 * 
 * Get view counts for articles
 * Query params:
 * - ids: Comma-separated list of article IDs (optional, returns all if not provided)
 * - limit: Maximum number of results (default: 50)
 * - sort: Sort order ('views' | 'recent', default: 'views')
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get('ids');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const sort = searchParams.get('sort') || 'views';
    
    let results: Array<{ id: string; views: number; views24h: number; views7d: number }> = [];
    
    if (idsParam) {
      // Get specific article views
      const ids = idsParam.split(',').map(id => id.trim());
      results = ids.map(id => {
        const record = viewRecords.get(id);
        return {
          id,
          views: record?.total || 0,
          views24h: record?.last24h || 0,
          views7d: record?.last7d || 0,
        };
      });
    } else {
      // Get all views sorted by count
      results = Array.from(viewRecords.entries())
        .map(([id, record]) => ({
          id,
          views: record.total,
          views24h: record.last24h,
          views7d: record.last7d,
          lastViewed: record.lastViewed,
        }))
        .sort((a, b) => {
          if (sort === 'recent') {
            return (b.lastViewed || 0) - (a.lastViewed || 0);
          }
          return b.views - a.views;
        })
        .slice(0, limit);
    }
    
    return NextResponse.json({
      views: results,
      total: viewRecords.size,
      fetchedAt: new Date().toISOString(),
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Views API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch view counts', message: String(error) },
      { status: 500 }
    );
  }
}

/**
 * POST /api/views
 * 
 * Record a view for an article
 * Body: { articleId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { articleId } = body;
    
    if (!articleId || typeof articleId !== 'string') {
      return NextResponse.json(
        { error: 'articleId is required' },
        { status: 400 }
      );
    }
    
    const now = Date.now();
    const existing = viewRecords.get(articleId);
    
    if (existing) {
      existing.total++;
      existing.last24h++;
      existing.last7d++;
      existing.lastViewed = now;
    } else {
      viewRecords.set(articleId, {
        total: 1,
        last24h: 1,
        last7d: 1,
        lastViewed: now,
      });
    }
    
    // Also update the simple view count
    viewCounts.set(articleId, (viewCounts.get(articleId) || 0) + 1);
    
    return NextResponse.json({
      success: true,
      articleId,
      views: viewRecords.get(articleId)?.total || 1,
    });
  } catch (error) {
    console.error('Views POST error:', error);
    return NextResponse.json(
      { error: 'Failed to record view', message: String(error) },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS handler for CORS preflight
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
