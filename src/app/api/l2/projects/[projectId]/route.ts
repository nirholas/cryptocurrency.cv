import { NextRequest, NextResponse } from 'next/server';
import { getL2RiskAssessment } from '@/lib/apis/l2beat';

export const runtime = 'edge';
export const revalidate = 3600;

/**
 * GET /api/l2/projects/[projectId]
 * Returns detailed risk assessment for a specific L2 project.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
): Promise<NextResponse> {
  const { projectId } = await params;

  if (!projectId) {
    return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
  }

  try {
    const data = await getL2RiskAssessment(projectId);

    if (!data) {
      return NextResponse.json(
        {
          error: 'L2 project not found',
          message: `No data found for project ID "${projectId}"`,
        },
        { status: 404 }
      );
    }

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch L2 risk assessment', message: String(error) },
      { status: 500 }
    );
  }
}
