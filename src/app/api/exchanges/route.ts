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
 * Exchanges API
 * GET /api/exchanges — returns exchange reviews and comparison data
 */

import { type NextRequest, NextResponse } from 'next/server';

const EXCHANGES = [
  { id: 'coinbase', name: 'Coinbase', trustScore: 10, rating: 4.5, makerFee: '0.40%', takerFee: '0.60%', coins: 250, volume24h: '$2.1B', kyc: 'required', regulated: true, proofOfReserves: true, founded: 2012, headquarters: 'San Francisco, USA' },
  { id: 'binance', name: 'Binance', trustScore: 8, rating: 4.3, makerFee: '0.10%', takerFee: '0.10%', coins: 600, volume24h: '$12.5B', kyc: 'required', regulated: true, proofOfReserves: true, founded: 2017, headquarters: 'Multiple' },
  { id: 'kraken', name: 'Kraken', trustScore: 9, rating: 4.4, makerFee: '0.16%', takerFee: '0.26%', coins: 200, volume24h: '$1.8B', kyc: 'required', regulated: true, proofOfReserves: true, founded: 2011, headquarters: 'San Francisco, USA' },
  { id: 'bybit', name: 'Bybit', trustScore: 7, rating: 4.2, makerFee: '0.10%', takerFee: '0.10%', coins: 500, volume24h: '$5.2B', kyc: 'required', regulated: true, proofOfReserves: true, founded: 2018, headquarters: 'Dubai, UAE' },
  { id: 'okx', name: 'OKX', trustScore: 7, rating: 4.1, makerFee: '0.08%', takerFee: '0.10%', coins: 350, volume24h: '$3.8B', kyc: 'optional', regulated: true, proofOfReserves: true, founded: 2017, headquarters: 'Seychelles' },
  { id: 'gemini', name: 'Gemini', trustScore: 9, rating: 4.0, makerFee: '0.20%', takerFee: '0.40%', coins: 100, volume24h: '$200M', kyc: 'required', regulated: true, proofOfReserves: true, founded: 2014, headquarters: 'New York, USA' },
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sortBy = searchParams.get('sort') || 'trust';
  const limit = parseInt(searchParams.get('limit') || '50', 10);

  const sorted = [...EXCHANGES].sort((a, b) => {
    if (sortBy === 'rating') return b.rating - a.rating;
    if (sortBy === 'coins') return b.coins - a.coins;
    if (sortBy === 'fees') return parseFloat(a.takerFee) - parseFloat(b.takerFee);
    return b.trustScore - a.trustScore;
  }).slice(0, limit);

  return NextResponse.json({
    exchanges: sorted,
    total: sorted.length,
  }, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
