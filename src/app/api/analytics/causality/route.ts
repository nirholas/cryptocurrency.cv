/**
 * Causal Inference API
 * 
 * Provides causal analysis of news events and market movements.
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimitFromRequest, getRateLimitErrorResponse } from '@/lib/ratelimit';
import { 
  analyzeCausality, 
  assessNewsImpact, 
  registerEvent,
  listEvents,
  getEvent,
  type CausalAnalysisRequest,
  type CausalEvent,
  type CausalMethod,
} from '@/lib/causal-inference';

// Use Node.js runtime since causal-inference.ts imports database.ts which requires fs/path modules
export const runtime = 'nodejs';
export const revalidate = 60;

/**
 * GET /api/analytics/causality
 * 
 * List causal events or get analysis for a specific event
 */
export async function GET(request: NextRequest) {
  const rateLimitResult = await checkRateLimitFromRequest(request);
  if (!rateLimitResult.allowed) {
    return getRateLimitErrorResponse(rateLimitResult);
  }

  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    const eventType = searchParams.get('type');
    const asset = searchParams.get('asset');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (eventId) {
      const event = await getEvent(eventId);
      if (!event) {
        return NextResponse.json(
          { error: 'Event not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ event });
    }

    const events = await listEvents({
      limit,
      eventType: eventType as CausalEvent['eventType'] | undefined,
      asset: asset || undefined,
    });

    return NextResponse.json({
      events,
      count: events.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Causality API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch causal events' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/analytics/causality
 * 
 * Perform causal analysis on an event
 */
export async function POST(request: NextRequest) {
  const rateLimitResult = await checkRateLimitFromRequest(request);
  if (!rateLimitResult.allowed) {
    return getRateLimitErrorResponse(rateLimitResult);
  }

  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'register') {
      // Register a new causal event
      const { event } = body as { event: Omit<CausalEvent, 'id'> };
      
      if (!event.timestamp || !event.eventType || !event.description || !event.assets) {
        return NextResponse.json(
          { error: 'Missing required fields: timestamp, eventType, description, assets' },
          { status: 400 }
        );
      }

      const registeredEvent = await registerEvent(event);
      return NextResponse.json({
        success: true,
        event: registeredEvent,
      });
    }

    if (action === 'analyze') {
      // Perform causal analysis
      const { eventId, event: eventData, assets, windowBefore, windowAfter, method, confidence } = body as {
        eventId?: string;
        event?: Omit<CausalEvent, 'id'>;
        assets: string[];
        windowBefore: number;
        windowAfter: number;
        method?: CausalMethod;
        confidence?: number;
      };

      if (!assets || assets.length === 0) {
        return NextResponse.json(
          { error: 'At least one asset is required' },
          { status: 400 }
        );
      }

      // Convert Omit<CausalEvent, 'id'> to CausalEvent by adding an id
      const event: CausalEvent | undefined = eventData ? {
        id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...eventData,
      } : undefined;

      const analysisRequest: CausalAnalysisRequest = {
        eventId,
        event,
        assets,
        windowBefore: windowBefore || 24,
        windowAfter: windowAfter || 48,
        method: method || 'event_study',
        confidence,
      };

      const result = await analyzeCausality(analysisRequest);
      return NextResponse.json({
        success: true,
        analysis: result,
      });
    }

    if (action === 'assess-news') {
      // Quick assessment of news impact
      const { article, assets } = body as {
        article: { title: string; pubDate: string; source: string };
        assets: string[];
      };

      if (!article || !assets) {
        return NextResponse.json(
          { error: 'Article and assets are required' },
          { status: 400 }
        );
      }

      const result = await assessNewsImpact(article, assets);
      return NextResponse.json({
        success: true,
        assessment: result,
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Supported: register, analyze, assess-news' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Causality analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to perform causal analysis' },
      { status: 500 }
    );
  }
}
