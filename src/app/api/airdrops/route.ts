/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

/**
 * Airdrops API
 * GET /api/airdrops — returns airdrop tracker data
 */

import { type NextRequest, NextResponse } from 'next/server';

const AIRDROPS = [
  { id: '1', name: 'LayerZero Season 2', token: 'ZRO', chain: 'Multi-chain', status: 'upcoming', estimatedValue: '$200-2,000', difficulty: 'medium', verified: false },
  { id: '2', name: 'Berachain', token: 'BERA', chain: 'Berachain', status: 'upcoming', estimatedValue: '$500-5,000', difficulty: 'medium', verified: false },
  { id: '3', name: 'Monad', token: 'MON', chain: 'Monad', status: 'upcoming', estimatedValue: '$1,000-10,000', difficulty: 'easy', verified: false },
  { id: '4', name: 'Scroll Airdrop', token: 'SCR', chain: 'Scroll', status: 'active', estimatedValue: '$100-1,000', difficulty: 'easy', verified: true, claimDeadline: '2026-04-30' },
  { id: '5', name: 'Hyperliquid Season 2', token: 'HYPE', chain: 'Hyperliquid', status: 'upcoming', estimatedValue: '$500-5,000', difficulty: 'medium', verified: false },
  { id: '6', name: 'Starknet STRK Round 2', token: 'STRK', chain: 'StarkNet', status: 'upcoming', estimatedValue: '$100-500', difficulty: 'hard', verified: false },
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const limit = parseInt(searchParams.get('limit') || '50', 10);

  let filtered = AIRDROPS;
  if (status) filtered = filtered.filter(a => a.status === status);
  filtered = filtered.slice(0, limit);

  return NextResponse.json({
    airdrops: filtered,
    total: filtered.length,
    active: AIRDROPS.filter(a => a.status === 'active').length,
    upcoming: AIRDROPS.filter(a => a.status === 'upcoming').length,
  }, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
