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
 * DefiLlama Unlocks Adapter — Token Unlock Schedule Data
 *
 * DefiLlama provides free, no-key-required token unlock schedule data:
 * - Upcoming cliff unlocks (large one-time releases)
 * - Linear vesting events
 * - Historical unlock data
 * - USD values and percentage of supply
 *
 * This is critical market-moving data — large unlocks create sell pressure.
 *
 * Rate limit: Unlimited (be respectful, ~30 req/min recommended)
 * No API key required.
 *
 * API: https://defillama.com/docs/api (emissions/unlocks endpoints)
 *
 * @module providers/adapters/token-unlocks/defillama-unlocks
 */

import type { DataProvider, FetchParams, RateLimitConfig } from '../../types';
import type { TokenUnlockEvent } from './types';

const BASE = 'https://api.llama.fi';

const RATE_LIMIT: RateLimitConfig = {
  maxRequests: 30,
  windowMs: 60_000,
};

export const defillamaUnlocksAdapter: DataProvider<TokenUnlockEvent[]> = {
  name: 'defillama-unlocks',
  description: 'DefiLlama — Token unlock schedules, cliff vesting, and emissions data (free, no key)',
  priority: 1,
  weight: 0.60,
  rateLimit: RATE_LIMIT,
  capabilities: ['token-unlocks'],

  async fetch(params: FetchParams): Promise<TokenUnlockEvent[]> {
    const limit = params.limit ?? 50;
    const now = new Date();
    const nowIso = now.toISOString();

    // Fetch the list of protocols with emissions data
    const res = await fetch(`${BASE}/emissions/breakdown`, {
      headers: {
        'User-Agent': 'free-crypto-news/2.0',
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      throw new Error(`DefiLlama Unlocks API error: ${res.status}`);
    }

    const protocols: DLProtocol[] = await res.json();

    // Filter to upcoming unlock events (next 30 days)
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const events: TokenUnlockEvent[] = [];

    for (const protocol of protocols) {
      if (!protocol.events || events.length >= limit) break;

      for (const event of protocol.events) {
        if (events.length >= limit) break;

        const eventDate = new Date(event.timestamp * 1000);
        if (eventDate < now || eventDate > thirtyDaysFromNow) continue;

        const unlockValueUsd = (event.noOfTokens ?? 0) * (protocol.price ?? 0);
        const unlockPctCirculating = protocol.circSupply
          ? ((event.noOfTokens ?? 0) / protocol.circSupply) * 100
          : 0;
        const unlockPctTotal = protocol.totalSupply
          ? ((event.noOfTokens ?? 0) / protocol.totalSupply) * 100
          : 0;

        events.push({
          name: protocol.name ?? 'Unknown',
          symbol: (protocol.symbol ?? '').toUpperCase(),
          unlockDate: eventDate.toISOString(),
          unlockValueUsd,
          unlockTokens: event.noOfTokens ?? 0,
          unlockPctCirculating,
          unlockPctTotal,
          price: protocol.price ?? 0,
          marketCap: (protocol.price ?? 0) * (protocol.circSupply ?? 0),
          unlockCategory: event.description ?? 'unknown',
          coingeckoId: protocol.gecko_id,
          source: 'defillama-unlocks',
          timestamp: nowIso,
        });
      }
    }

    // Sort by unlock date ascending
    events.sort((a, b) => new Date(a.unlockDate).getTime() - new Date(b.unlockDate).getTime());

    return events.slice(0, limit);
  },

  async healthCheck(): Promise<boolean> {
    try {
      const res = await fetch(`${BASE}/emissions/breakdown`, {
        signal: AbortSignal.timeout(5000),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  validate(data: TokenUnlockEvent[]): boolean {
    return Array.isArray(data) && data.length > 0;
  },
};

// ────────────────────────────────────────────────────────────────────────────
// Internal types for DefiLlama API response
// ────────────────────────────────────────────────────────────────────────────

interface DLProtocol {
  name?: string;
  symbol?: string;
  gecko_id?: string;
  price?: number;
  circSupply?: number;
  totalSupply?: number;
  events?: DLUnlockEvent[];
}

interface DLUnlockEvent {
  timestamp: number;
  noOfTokens?: number;
  description?: string;
}
