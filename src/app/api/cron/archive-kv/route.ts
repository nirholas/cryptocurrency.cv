/**
 * Cron Job: Archive News (Vercel Cron)
 * 
 * Runs every hour to archive news articles to Vercel KV.
 * Triggered automatically by Vercel Cron.
 * 
 * @route GET /api/cron/archive-kv
 * @schedule 0 * * * * (every hour)
 */

import { NextRequest, NextResponse } from 'next/server';
import { archiveNews, getArchiveStats } from '@/lib/archive-service';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

/**
 * Verify Vercel Cron authorization
 */
function verifyCronAuth(request: NextRequest): boolean {
  // Vercel Cron sends this header
  const authHeader = request.headers.get('Authorization');
  if (authHeader === `Bearer ${process.env.CRON_SECRET}`) {
    return true;
  }
  
  // Also check for Vercel's internal cron header
  const cronHeader = request.headers.get('x-vercel-cron');
  if (cronHeader) {
    return true;
  }
  
  // Allow in development
  if (process.env.NODE_ENV === 'development') {
    return true;
  }
  
  // Allow if no CRON_SECRET is set (public mode)
  if (!process.env.CRON_SECRET) {
    return true;
  }
  
  // Check query param for manual triggers
  const querySecret = request.nextUrl.searchParams.get('secret');
  if (querySecret === process.env.CRON_SECRET) {
    return true;
  }
  
  return false;
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  // Verify authorization
  if (!verifyCronAuth(request)) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Unauthorized',
        message: 'Invalid or missing authorization'
      },
      { status: 401 }
    );
  }
  
  console.log('🗄️ Starting archive cron job...');
  
  try {
    // Run archive
    const result = await archiveNews();
    
    // Get updated stats
    const stats = await getArchiveStats();
    
    const response = {
      success: result.success,
      timestamp: new Date().toISOString(),
      result: {
        articlesProcessed: result.articlesProcessed,
        articlesArchived: result.articlesArchived,
        duplicatesSkipped: result.duplicatesSkipped,
        errors: result.errors.slice(0, 5), // Limit errors in response
      },
      stats: stats ? {
        totalArticles: stats.totalArticles,
        lastRun: stats.lastArchiveRun,
      } : null,
      duration: Date.now() - startTime,
    };
    
    if (result.success) {
      console.log(`✅ Archive complete: ${result.articlesArchived} new, ${result.duplicatesSkipped} duplicates`);
    } else {
      console.error('❌ Archive failed:', result.errors);
    }
    
    return NextResponse.json(response, {
      status: result.success ? 200 : 500,
    });
  } catch (error) {
    console.error('❌ Archive cron error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}

// Also support POST for webhook triggers
export async function POST(request: NextRequest) {
  return GET(request);
}
