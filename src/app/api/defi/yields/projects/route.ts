import { NextRequest, NextResponse } from 'next/server';
import { getProjects } from '@/lib/defi-yields';

export const runtime = 'edge';
export const revalidate = 3600;

/**
 * GET /api/defi/yields/projects
 * Returns all DeFi projects with available yield pools.
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    const data = await getProjects();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch projects', message: String(error) },
      { status: 500 }
    );
  }
}
