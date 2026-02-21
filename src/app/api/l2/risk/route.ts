import { NextRequest, NextResponse } from 'next/server';
import { getL2Projects } from '@/lib/apis/l2beat';
import type { L2Project } from '@/lib/apis/l2beat';

export const runtime = 'edge';
export const revalidate = 3600;

/**
 * GET /api/l2/risk
 * Returns L2 projects sorted by risk score.
 * Query params:
 *   sort  - 'asc' (safest first, default) | 'desc' (riskiest first)
 *   limit - number of results (default 20)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sort = searchParams.get('sort') === 'desc' ? 'desc' : 'asc';
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);

    const riskOrder: Record<L2Project['riskLevel'], number> = {
      low: 0,
      medium: 1,
      high: 2,
    };

    const projects = await getL2Projects();

    const sorted = [...projects].sort((a, b) => {
      const diff = riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
      return sort === 'asc' ? diff : -diff;
    });

    const data = sorted.slice(0, limit);

    return NextResponse.json(
      { projects: data, sort, total: projects.length },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch L2 risk data', message: String(error) },
      { status: 500 }
    );
  }
}
