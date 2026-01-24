import { NextRequest, NextResponse } from 'next/server';
import { getDashboardStats, getSystemHealth, trackAPICall } from '@/lib/analytics';
import { requireAdminAuth } from '@/lib/admin-auth';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  // Check authorization using centralized admin auth
  const authError = requireAdminAuth(request);
  if (authError) return authError;

  const startTime = Date.now();
  
  try {
    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view') || 'dashboard';

    let data: unknown;

    switch (view) {
      case 'dashboard':
        data = getDashboardStats();
        break;
      
      case 'health':
        data = await getSystemHealth();
        break;
      
      case 'full':
        const [stats, health] = await Promise.all([
          getDashboardStats(),
          getSystemHealth(),
        ]);
        data = { stats, health };
        break;
      
      default:
        return NextResponse.json(
          { error: 'Invalid view parameter' },
          { status: 400 }
        );
    }

    // Track this API call
    trackAPICall({
      endpoint: '/api/admin',
      method: 'GET',
      statusCode: 200,
      responseTime: Date.now() - startTime,
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('Admin API error:', error);
    
    trackAPICall({
      endpoint: '/api/admin',
      method: 'GET',
      statusCode: 500,
      responseTime: Date.now() - startTime,
    });

    return NextResponse.json(
      { error: 'Failed to fetch admin data' },
      { status: 500 }
    );
  }
}

// POST endpoint to track custom events
export async function POST(request: NextRequest) {
  const authError = requireAdminAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'track':
        trackAPICall({
          endpoint: data.endpoint || '/unknown',
          method: data.method || 'GET',
          statusCode: data.statusCode || 200,
          responseTime: data.responseTime || 0,
          userAgent: data.userAgent,
          ip: data.ip,
        });
        return NextResponse.json({ success: true });
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Admin POST error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
