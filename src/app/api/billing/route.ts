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
 * GET /api/billing
 *
 * Returns x402 payment configuration for this API.
 * No Stripe. No subscriptions. Pay per request in USDC on Base.
 */
import { NextResponse } from 'next/server';

export const revalidate = 300; // ISR: payment config refreshes every 5 min

const RECEIVE_ADDRESS =
  process.env.X402_RECEIVE_ADDRESS ?? '0x4027FdaC1a5216e264A00a5928b8366aE59cE888';

export async function GET() {
  return NextResponse.json({
    scheme: 'x402',
    version: 1,
    network: 'base',
    asset: 'USDC',
    payTo: RECEIVE_ADDRESS,
    endpoints: {
      '/api/premium/:path*': { price: '$0.001', description: 'Premium data endpoints' },
    },
    docs: 'https://x402.org',
    note: 'No subscription required. Pay per request on-chain.',
  });
}
