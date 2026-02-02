/**
 * Newsletter Subscription API
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  subscribe, 
  unsubscribe, 
  updatePreferences, 
  verifySubscription,
  getSubscriberStats 
} from '@/lib/newsletter';

// Use Node.js runtime because newsletter.ts uses crypto and database.ts uses fs
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action');
  const token = searchParams.get('token');

  // Verify email
  if (action === 'verify' && token) {
    const result = await verifySubscription(token);
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  }

  // Unsubscribe
  if (action === 'unsubscribe' && token) {
    const result = await unsubscribe(token);
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  }

  // Stats (admin only - add auth in production)
  if (action === 'stats') {
    const stats = await getSubscriberStats();
    return NextResponse.json(stats);
  }

  return NextResponse.json({
    message: 'Newsletter API',
    endpoints: {
      subscribe: 'POST /api/newsletter',
      verify: 'GET /api/newsletter?action=verify&token=xxx',
      unsubscribe: 'GET /api/newsletter?action=unsubscribe&token=xxx',
      preferences: 'PUT /api/newsletter',
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, frequency, categories, sources } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const result = await subscribe(email, { frequency, categories, sources });
    
    return NextResponse.json(result, {
      status: result.success ? 201 : 400,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, frequency, categories, sources } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    const result = await updatePreferences(token, { frequency, categories, sources });
    
    return NextResponse.json(result, {
      status: result.success ? 200 : 400,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}

export async function OPTIONS() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
