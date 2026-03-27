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
 * x402 Well-Known Discovery Endpoint (Standard Location)
 *
 * Also served via rewrite /.well-known/x402 → /api/.well-known/x402.
 * This route exists as a direct fallback in case the rewrite doesn't apply.
 *
 * @see https://github.com/Merit-Systems/x402scan
 */

import { NextResponse } from 'next/server';
import { buildX402WellKnownV1 } from '@/lib/x402/discovery';

export const runtime = 'edge';
export const revalidate = 300;

export async function GET() {
  const discovery = buildX402WellKnownV1();

  return NextResponse.json(discovery, {
    headers: {
      'Cache-Control': 'public, max-age=300, s-maxage=300',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
