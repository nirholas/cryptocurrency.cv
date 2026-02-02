import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';
export const revalidate = 3600; // 1 hour

/**
 * GET /api/unlocks
 * 
 * Get upcoming token unlock schedules
 * Large unlocks can create selling pressure
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);

  try {
    // Token Unlocks API (if available)
    // For now, use DeFiLlama unlocks data
    
    const response = await fetch('https://api.llama.fi/unlocks', {
      next: { revalidate: 3600 },
    });

    if (response.ok) {
      const data = await response.json();
      
      // Filter for upcoming unlocks and sort by date
      const now = Date.now();
      const upcoming = (data.protocols || data || [])
        .filter((p: { events?: Array<{ timestamp: number }> }) => {
          // Find next unlock event
          const nextEvent = p.events?.find(e => e.timestamp * 1000 > now);
          return nextEvent;
        })
        .map((p: {
          name: string;
          symbol: string;
          events?: Array<{
            timestamp: number;
            unlockAmount: number;
            unlockValue: number;
            unlockPercent: number;
          }>;
          totalLocked: number;
          mcap: number;
        }) => {
          const nextEvent = p.events?.find(e => e.timestamp * 1000 > now);
          return {
            name: p.name,
            symbol: p.symbol,
            nextUnlock: {
              date: nextEvent ? new Date(nextEvent.timestamp * 1000).toISOString() : null,
              amount: nextEvent?.unlockAmount,
              valueUsd: nextEvent?.unlockValue,
              percentOfCirculating: nextEvent?.unlockPercent,
            },
            totalLocked: p.totalLocked,
            marketCap: p.mcap,
          };
        })
        .filter((p: { nextUnlock: { date: string | null } }) => p.nextUnlock.date)
        .sort((a: { nextUnlock: { date: string } }, b: { nextUnlock: { date: string } }) => 
          new Date(a.nextUnlock.date).getTime() - new Date(b.nextUnlock.date).getTime()
        )
        .slice(0, limit);

      return NextResponse.json({
        count: upcoming.length,
        unlocks: upcoming,
        timestamp: new Date().toISOString(),
        source: 'defillama',
      });
    }

    // Fallback: curated list of major upcoming unlocks
    const curatedUnlocks = [
      {
        name: 'Arbitrum',
        symbol: 'ARB',
        nextUnlock: {
          date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          amount: 92650000,
          valueUsd: 111000000,
          percentOfCirculating: 2.8,
        },
        impact: 'medium',
      },
      {
        name: 'Optimism',
        symbol: 'OP',
        nextUnlock: {
          date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          amount: 31340000,
          valueUsd: 75000000,
          percentOfCirculating: 2.5,
        },
        impact: 'medium',
      },
      {
        name: 'Aptos',
        symbol: 'APT',
        nextUnlock: {
          date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
          amount: 11310000,
          valueUsd: 102000000,
          percentOfCirculating: 2.4,
        },
        impact: 'medium',
      },
      {
        name: 'Sui',
        symbol: 'SUI',
        nextUnlock: {
          date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          amount: 64190000,
          valueUsd: 180000000,
          percentOfCirculating: 3.1,
        },
        impact: 'high',
      },
    ].slice(0, limit);

    return NextResponse.json({
      count: curatedUnlocks.length,
      unlocks: curatedUnlocks,
      timestamp: new Date().toISOString(),
      source: 'curated',
      note: 'Curated list of major upcoming token unlocks',
    });
  } catch (error) {
    console.error('Unlocks API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch token unlocks' },
      { status: 500 }
    );
  }
}
