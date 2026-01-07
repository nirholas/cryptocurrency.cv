import { NextRequest, NextResponse } from 'next/server';
import { getBreakingNews } from '@/lib/crypto-news';

export const runtime = 'edge';

// In-memory webhook store (in production, use a database)
// This is a simple implementation for demo purposes
const webhooks = new Map<string, { url: string; secret: string; events: string[] }>();

// POST - Register a webhook
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, secret, events = ['breaking'] } = body;
    
    if (!url || !secret) {
      return NextResponse.json(
        { error: 'Missing required fields: url, secret' },
        { status: 400 }
      );
    }
    
    // Validate URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid webhook URL' },
        { status: 400 }
      );
    }
    
    // Generate webhook ID
    const id = crypto.randomUUID();
    
    webhooks.set(id, { url, secret, events });
    
    return NextResponse.json({
      id,
      url,
      events,
      message: 'Webhook registered successfully',
      note: 'This is a demo implementation. Webhooks are not persisted and will be lost on server restart.',
    }, {
      status: 201,
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to register webhook', message: String(error) },
      { status: 500 }
    );
  }
}

// GET - Test webhook / Get breaking news for webhook consumers
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const test = searchParams.get('test');
  
  if (test === 'true') {
    // Return sample webhook payload
    const news = await getBreakingNews(3);
    
    return NextResponse.json({
      event: 'breaking_news',
      timestamp: new Date().toISOString(),
      data: {
        articles: news.articles,
        totalCount: news.totalCount,
      },
      signature: 'sha256=<hmac_signature_here>',
    }, {
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  }
  
  return NextResponse.json({
    endpoints: {
      register: {
        method: 'POST',
        body: {
          url: 'https://your-server.com/webhook',
          secret: 'your-secret-key',
          events: ['breaking', 'all'],
        },
      },
      test: {
        method: 'GET',
        params: { test: 'true' },
      },
    },
    events: [
      { name: 'breaking', description: 'Breaking news from last 2 hours' },
      { name: 'all', description: 'All new articles' },
    ],
    note: 'Webhooks are delivered with HMAC-SHA256 signature in X-Signature header',
  }, {
    headers: { 'Access-Control-Allow-Origin': '*' },
  });
}

// OPTIONS - CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
