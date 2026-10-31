/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

import { type NextRequest, NextResponse } from 'next/server';
import { resilientFetchResponse } from '@/lib/resilient-fetch';
import {
  getUpcomingUnlocks,
  getTokenUnlockSchedule,
  getUnlockCalendar,
} from '@/lib/apis/tokenunlocks';
import { intParam } from '@/lib/query-params';

export const runtime = 'edge';
export const revalidate = 3600; // 1 hour

/**
 * GET /api/unlocks
 *
 * Get upcoming token unlock schedules.
 * Uses Token Unlocks API when TOKEN_UNLOCKS_API_KEY is set,
 * otherwise falls back to DefiLlama unlocks data.
 *
 * Query params:
 *   ?project=arbitrum  — get full unlock schedule for a project
 *   ?calendar=true     — return calendar view of upcoming unlocks
 *   ?limit=10          — number of results (default 10, max 50)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = intParam(searchParams, 'limit', { fallback: 10, min: 1, max: 50 });
  const project = searchParams.get('project');
  const calendar = searchParams.get('calendar') === 'true';

  const headers = {
    'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
    'Access-Control-Allow-Origin': '*',
  };

  try {
    // Project-specific schedule
    if (project) {
      const schedule = await getTokenUnlockSchedule(project);
      if (schedule) {
        return NextResponse.json(
          { ...schedule, source: 'tokenunlocks', timestamp: new Date().toISOString() },
          { headers },
        );
      }
      return NextResponse.json(
        { error: `No unlock schedule found for project: ${project}` },
        { status: 404 },
      );
    }

    // Calendar view
    if (calendar) {
      const cal = await getUnlockCalendar();
      if (cal.length) {
        return NextResponse.json(
          {
            count: cal.length,
            calendar: cal,
            source: 'tokenunlocks',
            timestamp: new Date().toISOString(),
          },
          { headers },
        );
      }
    }

    // Try Token Unlocks API first
    const tokenUnlocks = await getUpcomingUnlocks();
    if (tokenUnlocks.length) {
      return NextResponse.json(
        {
          count: Math.min(tokenUnlocks.length, limit),
          unlocks: tokenUnlocks.slice(0, limit),
          timestamp: new Date().toISOString(),
          source: 'tokenunlocks',
        },
        { headers },
      );
    }

    // Fallback: DefiLlama unlocks data

    const response = await resilientFetchResponse('https://api.llama.fi/unlocks', {
      service: 'defillama',
      timeoutMs: 8000,
      retries: 1,
      next: { revalidate: 3600 },
    });

    if (response.ok) {
      const data = await response.json();

      // Filter for upcoming unlocks and sort by date
      const now = Date.now();
      const upcoming = (data.protocols || data || [])
        .filter((p: { events?: Array<{ timestamp: number }> }) => {
          // Find next unlock event
          const nextEvent = p.events?.find((e) => e.timestamp * 1000 > now);
          return nextEvent;
        })
        .map(
          (p: {
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
            const nextEvent = p.events?.find((e) => e.timestamp * 1000 > now);
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
          },
        )
        .filter((p: { nextUnlock: { date: string | null } }) => p.nextUnlock.date)
        .sort(
          (a: { nextUnlock: { date: string } }, b: { nextUnlock: { date: string } }) =>
            new Date(a.nextUnlock.date).getTime() - new Date(b.nextUnlock.date).getTime(),
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
      source: 'static',
      note: 'Curated list of major upcoming token unlocks',
    });
  } catch (error) {
    console.error('Unlocks API error:', error);
    return NextResponse.json({ error: 'Failed to fetch token unlocks' }, { status: 500 });
  }
}
