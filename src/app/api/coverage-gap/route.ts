/**
 * Coverage Gap Analysis API
 * 
 * Analyzes news coverage to identify under-covered topics and assets
 * 
 * @module api/coverage-gap
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  generateCoverageReport,
  getCoverageGaps,
  getTopicTrends,
  getTopicCoverage,
  getSourceDiversity,
} from '@/lib/coverage-gap';
import { checkRateLimit } from '@/lib/ratelimit';

// =============================================================================
// GET /api/coverage-gap
// =============================================================================

export async function GET(request: NextRequest) {
  // Rate limiting
  const rateLimit = await checkRateLimit(request);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded', resetTime: rateLimit.resetTime },
      { status: 429 }
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action') || 'report';
  const period = (searchParams.get('period') || '24h') as '24h' | '7d' | '30d';
  const topic = searchParams.get('topic');
  const severity = searchParams.get('severity') as 'critical' | 'high' | 'medium' | 'low' | null;

  try {
    switch (action) {
      case 'report': {
        const report = await generateCoverageReport(period);
        return NextResponse.json({
          success: true,
          data: report,
          meta: {
            period,
            generatedAt: new Date().toISOString(),
          },
        });
      }

      case 'gaps': {
        const gaps = await getCoverageGaps(severity || 'low');
        return NextResponse.json({
          success: true,
          data: gaps,
          count: gaps.length,
        });
      }

      case 'trends': {
        const trends = await getTopicTrends();
        return NextResponse.json({
          success: true,
          data: trends,
          count: trends.length,
        });
      }

      case 'topic': {
        if (!topic) {
          return NextResponse.json(
            { error: 'Topic parameter required' },
            { status: 400 }
          );
        }
        const coverage = await getTopicCoverage(topic);
        if (!coverage) {
          return NextResponse.json(
            { error: 'Topic not found in recent coverage' },
            { status: 404 }
          );
        }
        return NextResponse.json({
          success: true,
          data: coverage,
        });
      }

      case 'sources': {
        const diversity = await getSourceDiversity();
        return NextResponse.json({
          success: true,
          data: diversity,
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: report, gaps, trends, topic, sources' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Coverage gap analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze coverage gaps' },
      { status: 500 }
    );
  }
}

// =============================================================================
// OPTIONS
// =============================================================================

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
