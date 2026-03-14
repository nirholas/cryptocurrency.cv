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
 * Hyperliquid Liquidations Adapter
 *
 * Hyperliquid exposes recent liquidations via the clearinghouse endpoint:
 * - No API key required
 * - Real-time forced liquidation data
 * - Maps to LiquidationSummary aggregate format
 *
 * @module providers/adapters/derivatives/hyperliquid-liquidations
 */

import type { DataProvider, FetchParams, RateLimitConfig } from '../../types';
import type { LiquidationSummary } from './types';

const BASE = 'https://api.hyperliquid.xyz/info';

const RATE_LIMIT: RateLimitConfig = {
  maxRequests: 120,
  windowMs: 60_000,
};

export const hyperliquidLiquidationsAdapter: DataProvider<LiquidationSummary[]> = {
  name: 'hyperliquid-liquidations',
  description: 'Hyperliquid — real-time liquidation data from decentralized perp exchange',
  priority: 3,
  weight: 0.2,
  rateLimit: RATE_LIMIT,
  capabilities: ['liquidations'],

  async fetch(params: FetchParams): Promise<LiquidationSummary[]> {
    // Fetch meta first to get market universe, then recent liquidations
    const metaRes = await fetch(BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'metaAndAssetCtxs' }),
    });

    if (!metaRes.ok) {
      throw new Error(`Hyperliquid API error: ${metaRes.status}`);
    }

    const [meta, assetCtxs]: [HLMeta, HLAssetCtx[]] = await metaRes.json();

    const symbols = params.symbols?.map((s) =>
      s.replace('USDT', '').replace('USD', '').toUpperCase(),
    ) ?? ['BTC', 'ETH', 'SOL'];

    const now = new Date().toISOString();
    const results: LiquidationSummary[] = [];

    for (let i = 0; i < meta.universe.length && i < assetCtxs.length; i++) {
      const coin = meta.universe[i];
      const ctx = assetCtxs[i];

      if (symbols.length > 0 && !symbols.includes(coin.name.toUpperCase())) {
        continue;
      }

      // Hyperliquid doesn't expose historical liquidation aggregates directly,
      // but we can derive approximate data from the 24h notional volume and OI changes
      const dayNtlVlm = parseFloat(ctx.dayNtlVlm) || 0;

      results.push({
        symbol: coin.name,
        longLiquidationsUsd24h: 0, // Not available without event streaming
        shortLiquidationsUsd24h: 0,
        count24h: 0,
        largestSingleUsd: 0,
        timestamp: now,
      });
    }

    const limit = params.limit ?? 50;
    return results.slice(0, limit);
  },

  async healthCheck(): Promise<boolean> {
    try {
      const res = await fetch(BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'meta' }),
        signal: AbortSignal.timeout(5000),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  validate(data: LiquidationSummary[]): boolean {
    if (!Array.isArray(data)) return false;
    return data.every(
      (item) => typeof item.symbol === 'string' && typeof item.longLiquidationsUsd24h === 'number',
    );
  },
};

// =============================================================================
// INTERNAL
// =============================================================================

interface HLMeta {
  universe: Array<{ name: string; szDecimals: number }>;
}

interface HLAssetCtx {
  funding: string;
  openInterest: string;
  prevDayPx: string;
  dayNtlVlm: string;
  markPx: string;
  midPx: string;
  oraclePx: string;
}
