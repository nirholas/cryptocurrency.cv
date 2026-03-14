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
 * Events API
 * GET /api/events — returns crypto events calendar data
 */

import { type NextRequest, NextResponse } from 'next/server';

const EVENTS = [
  { id: '1', title: 'ETH Denver 2026', date: '2026-02-23', endDate: '2026-03-01', category: 'conference', location: 'Denver, CO', importance: 'high', tags: ['ethereum', 'hackathon'] },
  { id: '2', title: 'Consensus 2026', date: '2026-05-14', endDate: '2026-05-16', category: 'conference', location: 'Austin, TX', importance: 'critical', tags: ['industry', 'institutional'] },
  { id: '3', title: 'Token2049 Singapore', date: '2026-09-16', endDate: '2026-09-17', category: 'conference', location: 'Singapore', importance: 'critical', tags: ['asia', 'industry'] },
  { id: '4', title: 'Bitcoin Halving (Est.)', date: '2028-04-15', category: 'halving', importance: 'critical', tags: ['bitcoin', 'halving'] },
  { id: '5', title: 'Ethereum Pectra Upgrade', date: '2026-03-15', category: 'upgrade', importance: 'high', tags: ['ethereum', 'upgrade'] },
  { id: '6', title: 'Devconnect 2026', date: '2026-11-10', endDate: '2026-11-15', category: 'conference', location: 'Buenos Aires', importance: 'high', tags: ['ethereum', 'developers'] },
  { id: '7', title: 'Paris Blockchain Week', date: '2026-04-08', endDate: '2026-04-10', category: 'conference', location: 'Paris', importance: 'medium', tags: ['europe', 'web3'] },
  { id: '8', title: 'Solana Breakpoint 2026', date: '2026-10-20', endDate: '2026-10-22', category: 'conference', location: 'Amsterdam', importance: 'high', tags: ['solana'] },
  { id: '9', title: 'Bitcoin Nashville 2026', date: '2026-07-24', endDate: '2026-07-26', category: 'conference', location: 'Nashville, TN', importance: 'high', tags: ['bitcoin'] },
  { id: '10', title: 'SEC Crypto Regulatory Hearing', date: '2026-03-20', category: 'regulatory', location: 'Washington, DC', importance: 'high', tags: ['regulation', 'SEC'] },
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  const importance = searchParams.get('importance');
  const limit = parseInt(searchParams.get('limit') || '50', 10);

  let filtered = EVENTS;
  if (category) filtered = filtered.filter(e => e.category === category);
  if (importance) filtered = filtered.filter(e => e.importance === importance);

  filtered = filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, limit);

  return NextResponse.json({
    events: filtered,
    total: filtered.length,
    categories: [...new Set(EVENTS.map(e => e.category))],
  }, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
