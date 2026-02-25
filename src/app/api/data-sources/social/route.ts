/**
 * Social Sentiment & Governance API
 * GET /api/data-sources/social — full social dashboard
 * GET /api/data-sources/social?view=fear-greed — Fear & Greed index
 * GET /api/data-sources/social?view=trending — trending by social volume
 * GET /api/data-sources/social?view=token&symbol=BTC — token sentiment profile
 * GET /api/data-sources/social?view=governance — major protocol governance
 * GET /api/data-sources/social?view=proposals&space=aave.eth — specific space proposals
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getSocialDashboard,
  getFearGreedIndex,
  getFearGreedHistory,
  getTrendingSocial,
  getTokenSentimentProfile,
  getActiveProposals,
  getMajorProtocolGovernance,
  getTopSpaces,
} from '@/lib/data-sources/social';

export const runtime = 'edge';
export const revalidate = 300;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const view = searchParams.get('view') || 'dashboard';

  try {
    switch (view) {
      case 'fear-greed': {
        const days = parseInt(searchParams.get('days') || '30');
        const [current, history] = await Promise.allSettled([
          getFearGreedIndex(),
          getFearGreedHistory(days),
        ]);

        return NextResponse.json({
          status: 'ok',
          data: {
            current: current.status === 'fulfilled' ? current.value : null,
            history: history.status === 'fulfilled' ? history.value : [],
          },
          timestamp: new Date().toISOString(),
        }, {
          headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
        });
      }

      case 'trending': {
        const limit = parseInt(searchParams.get('limit') || '20');
        const trending = await getTrendingSocial(limit);
        return NextResponse.json({ status: 'ok', data: trending, timestamp: new Date().toISOString() }, {
          headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
        });
      }

      case 'token': {
        const symbol = searchParams.get('symbol');
        if (!symbol) {
          return NextResponse.json({ error: 'symbol parameter required' }, { status: 400 });
        }
        const space = searchParams.get('space') || undefined;
        const profile = await getTokenSentimentProfile(symbol, space);
        return NextResponse.json({ status: 'ok', data: profile, timestamp: new Date().toISOString() }, {
          headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
        });
      }

      case 'governance': {
        const governance = await getMajorProtocolGovernance();
        return NextResponse.json({ status: 'ok', data: governance, timestamp: new Date().toISOString() }, {
          headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
        });
      }

      case 'proposals': {
        const space = searchParams.get('space') || undefined;
        const limit = parseInt(searchParams.get('limit') || '20');
        const proposals = await getActiveProposals(space, limit);
        return NextResponse.json({ status: 'ok', data: proposals, timestamp: new Date().toISOString() }, {
          headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
        });
      }

      case 'spaces': {
        const limit = parseInt(searchParams.get('limit') || '20');
        const spaces = await getTopSpaces(limit);
        return NextResponse.json({ status: 'ok', data: spaces, timestamp: new Date().toISOString() }, {
          headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200' },
        });
      }

      case 'dashboard':
      default: {
        const dashboard = await getSocialDashboard();
        return NextResponse.json({ status: 'ok', data: dashboard, timestamp: new Date().toISOString() }, {
          headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
        });
      }
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch social data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
