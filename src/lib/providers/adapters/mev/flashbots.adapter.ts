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
 * Flashbots MEV Adapter
 *
 * Flashbots provides MEV data for Ethereum:
 * - MEV-Boost relay data
 * - Block builder statistics
 * - Historical MEV extraction data
 *
 * @module providers/adapters/mev/flashbots
 */

import type { DataProvider, FetchParams, RateLimitConfig } from '../../types';
import type { MEVStats } from './types';

const BASE = 'https://boost-relay.flashbots.net';

const RATE_LIMIT: RateLimitConfig = { maxRequests: 30, windowMs: 60_000 };

export const flashbotsAdapter: DataProvider<MEVStats> = {
  name: 'flashbots',
  description: 'Flashbots — Ethereum MEV relay data',
  priority: 1,
  weight: 0.60,
  rateLimit: RATE_LIMIT,
  capabilities: ['mev'],

  async fetch(params: FetchParams): Promise<MEVStats> {
    const limit = params.limit ?? 100;

    // Fetch recent delivered payloads from Flashbots relay
    const res = await fetch(
      `${BASE}/relay/v1/data/bidtraces/proposer_payload_delivered?limit=${limit}`,
    );
    if (!res.ok) throw new Error(`Flashbots relay: ${res.status}`);

    const payloads: FlashbotsPayload[] = await res.json();
    const now = new Date().toISOString();

    // Aggregate stats
    let totalMevWei = BigInt(0);
    const builderMap = new Map<string, bigint>();

    for (const p of payloads) {
      const value = BigInt(p.value ?? '0');
      totalMevWei += value;

      const builder = p.builder_pubkey?.slice(0, 10) ?? 'unknown';
      builderMap.set(builder, (builderMap.get(builder) ?? BigInt(0)) + value);
    }

    const totalMevEth = Number(totalMevWei) / 1e18;

    const topBuilders = Array.from(builderMap.entries())
      .map(([name, mev]) => ({
        name,
        mevEth: Number(mev) / 1e18,
        share: totalMevWei > 0 ? Number((mev * BigInt(100)) / totalMevWei) / 100 : 0,
      }))
      .sort((a, b) => b.mevEth - a.mevEth)
      .slice(0, 10);

    // Fetch ETH price for USD conversion
    let ethPrice = 0;
    try {
      const ethRes = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd', { signal: AbortSignal.timeout(5000) });
      if (ethRes.ok) {
        const ethData = await ethRes.json();
        ethPrice = ethData?.ethereum?.usd ?? 0;
      }
    } catch { /* ETH price unavailable */ }

    return {
      period: '24h',
      totalMevEth,
      totalMevUsd: Math.round(totalMevEth * ethPrice * 100) / 100,
      bundleCount: payloads.length,
      topBuilders,
      avgMevPerBlock: payloads.length > 0 ? totalMevEth / payloads.length : 0,
      source: 'flashbots',
      timestamp: now,
    };
  },

  async healthCheck(): Promise<boolean> {
    try {
      const res = await fetch(
        `${BASE}/relay/v1/data/bidtraces/proposer_payload_delivered?limit=1`,
        { signal: AbortSignal.timeout(5000) },
      );
      return res.ok;
    } catch {
      return false;
    }
  },

  validate(data: MEVStats): boolean {
    return typeof data.totalMevEth === 'number' && data.bundleCount >= 0;
  },
};

interface FlashbotsPayload {
  slot?: string;
  parent_hash?: string;
  block_hash?: string;
  builder_pubkey?: string;
  proposer_pubkey?: string;
  value?: string;
  gas_used?: string;
  gas_limit?: string;
  num_tx?: number;
}
