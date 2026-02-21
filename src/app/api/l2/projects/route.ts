import { NextRequest, NextResponse } from 'next/server';
import { getL2Projects } from '@/lib/apis/l2beat';

export const runtime = 'edge';
export const revalidate = 3600;

/**
 * GET /api/l2/projects
 * Returns all L2 projects with TVL, risk scores, and technology details.
 * Query params: limit (default all, max 100)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? Math.min(parseInt(limitParam, 10), 100) : null;

    const projects = await getL2Projects();
    const data = limit !== null ? projects.slice(0, limit) : projects;

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch L2 projects', message: String(error) },
      { status: 500 }
    );
  }
}
