/**
 * Data Sources Health + Registry API
 * GET /api/data-sources — list all data sources
 * GET /api/data-sources?action=health — run health checks
 * GET /api/data-sources?category=defi — filter by category
 */

import { NextRequest, NextResponse } from 'next/server';
import { listDataSources, listDataSourcesByCategory, healthCheckAll, type DataSourceCategory } from '@/lib/data-sources';

export const runtime = 'edge';
export const revalidate = 60;

const CATEGORIES: DataSourceCategory[] = [
  'market-data', 'defi', 'onchain', 'social', 'derivatives',
  'nft', 'blockchain-explorer', 'news-aggregator', 'research',
  'governance', 'stablecoins', 'bridges', 'yields', 'whale-tracking', 'developer',
];

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action');
  const category = searchParams.get('category') as DataSourceCategory | null;

  try {
    // Health check endpoint
    if (action === 'health') {
      const health = await healthCheckAll();
      const healthy = health.filter((h) => h.ok).length;
      return NextResponse.json({
        status: 'ok',
        totalSources: health.length,
        healthy,
        unhealthy: health.length - healthy,
        sources: health,
        timestamp: new Date().toISOString(),
      }, {
        headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' },
      });
    }

    // Filter by category
    if (category) {
      if (!CATEGORIES.includes(category)) {
        return NextResponse.json(
          { error: 'Invalid category', valid: CATEGORIES },
          { status: 400 },
        );
      }
      const sources = listDataSourcesByCategory(category);
      return NextResponse.json({
        category,
        count: sources.length,
        sources,
        timestamp: new Date().toISOString(),
      }, {
        headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
      });
    }

    // Default: list all
    const sources = listDataSources();
    const byCategory = CATEGORIES.reduce((acc, cat) => {
      const catSources = sources.filter((s) => s.category === cat);
      if (catSources.length > 0) acc[cat] = catSources.length;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      totalSources: sources.length,
      categories: byCategory,
      sources,
      timestamp: new Date().toISOString(),
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to retrieve data sources', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
