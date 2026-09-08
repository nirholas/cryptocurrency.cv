/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

import { NextResponse } from 'next/server';
import { getPipelineGas } from '@/lib/data-pipeline';
import { registry } from '@/lib/providers/registry';
import type { GasPrice } from '@/lib/providers/adapters/gas';

import { resilientFetchResponse } from '@/lib/resilient-fetch';
export const revalidate = 30;

/**
 * GET /api/gas
 *
 * Get current Ethereum gas prices
 * Uses pipeline cache → provider framework (Etherscan + Blocknative) → direct Etherscan fallback
 */
export async function GET() {
  try {
    // Layer 1: Pipeline cache-first
    try {
      const pipelineData = await getPipelineGas();
      if (pipelineData) {
        return NextResponse.json(
          {
            ...pipelineData,
            _cache: 'pipeline',
          },
          {
            headers: {
              'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30',
            },
          },
        );
      }
    } catch {
      /* pipeline miss — try provider chain */
    }

    // Layer 2: Provider framework (fallback between Etherscan + Blocknative with circuit breakers)
    try {
      const result = await registry.fetch<GasPrice>('gas-fees');
      return NextResponse.json(
        {
          ...result.data,
          _cache: 'provider',
          _provider: result.lineage.provider,
          _confidence: result.lineage.confidence,
        },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30',
          },
        },
      );
    } catch {
      /* provider chain miss — fall through to direct call */
    }

    // Layer 3: Direct Etherscan fallback (legacy)
    const etherscanKey = process.env.ETHERSCAN_API_KEY || '';
    const etherscanUrl = `https://api.etherscan.io/v2/api?chainid=1&module=gastracker&action=gasoracle${etherscanKey ? `&apikey=${etherscanKey}` : ''}`;

    const response = await fetch(etherscanUrl, {
      next: { revalidate: 30 },
    });

    if (response.ok) {
      const data = await response.json();

      if (data.status === '1' && data.result) {
        // Fetch ETH price for USD conversion
        let ethPriceUsd: number | null = null;
        try {
          const ethRes = await resilientFetchResponse(
            'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd',
            { service: 'coingecko', timeoutMs: 8000, retries: 1, next: { revalidate: 60 } },
          );
          if (ethRes.ok) {
            const ethData = await ethRes.json();
            ethPriceUsd = ethData?.ethereum?.usd ?? null;
          }
        } catch {
          /* ETH price fetch failed — USD will be null */
        }

        // Standard transfer gas: 21000 units. USD = gwei * 21000 * 1e-9 * ethPrice
        const gweiToUsd = (gwei: number) =>
          ethPriceUsd !== null ? parseFloat((gwei * 21000 * 1e-9 * ethPriceUsd).toFixed(4)) : null;

        const lowGwei = parseInt(data.result.SafeGasPrice);
        const medGwei = parseInt(data.result.ProposeGasPrice);
        const highGwei = parseInt(data.result.FastGasPrice);

        return NextResponse.json({
          network: 'ethereum',
          baseFee: parseFloat(data.result.suggestBaseFee) || null,
          low: {
            gwei: lowGwei,
            usd: gweiToUsd(lowGwei),
          },
          medium: {
            gwei: medGwei,
            usd: gweiToUsd(medGwei),
          },
          high: {
            gwei: highGwei,
            usd: gweiToUsd(highGwei),
          },
          lastBlock: data.result.LastBlock,
          timestamp: new Date().toISOString(),
          source: 'etherscan',
        });
      }
    }

    // Fallback: estimate based on recent blocks
    return NextResponse.json({
      network: 'ethereum',
      baseFee: null,
      low: { gwei: 20, usd: null },
      medium: { gwei: 30, usd: null },
      high: { gwei: 50, usd: null },
      lastBlock: null,
      timestamp: new Date().toISOString(),
      source: 'estimate',
      note: 'Estimates based on typical gas prices. Add ETHERSCAN_API_KEY for live data.',
    });
  } catch (error) {
    console.error('Gas API error:', error);
    return NextResponse.json({ error: 'Failed to fetch gas prices' }, { status: 500 });
  }
}
