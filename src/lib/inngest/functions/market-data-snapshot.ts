/**
 * Inngest Function — Market Data Snapshots
 *
 * Periodically snapshots stablecoin flows, gas fees, and social metrics
 * into their respective database tables for historical analysis.
 *
 * Schedule: Every 30 minutes for stablecoins/social, every 5 min for gas
 *
 * @module inngest/functions/market-data-snapshot
 */

import { inngest } from '../client';
import { getDb } from '@/lib/db/client';
import {
  stablecoinSnapshots,
  gasFeesHistory,
} from '@/lib/db/schema';

// ─────────────────────────────────────────────────────────────────────────────
// Stablecoin Supply Snapshot — every 30 minutes
// ─────────────────────────────────────────────────────────────────────────────

export const stablecoinSnapshot = inngest.createFunction(
  {
    id: 'stablecoin-snapshot',
    name: 'Stablecoin Supply Snapshot',
    retries: 2,
  },
  { cron: '*/30 * * * *' },
  async () => {
    const db = getDb();
    if (!db) {
      return { status: 'skipped', reason: 'DATABASE_URL not configured' };
    }

    const { stablecoinFlowsChain } = await import(
      '@/lib/providers/adapters/stablecoin-flows'
    );

    const now = new Date();
    let count = 0;

    try {
      const result = await stablecoinFlowsChain.fetch({ limit: 20 });

      if (result?.data) {
        for (const sc of result.data) {
          await db.insert(stablecoinSnapshots).values({
            symbol: sc.symbol,
            name: sc.name,
            pegType: sc.pegType,
            circulatingUsd: sc.circulatingUsd,
            circulatingChange24h: sc.circulatingChange24h,
            circulatingChange7d: sc.circulatingChange7d,
            price: sc.price,
            rank: sc.rank,
            chainDistribution: sc.chainDistribution,
            source: 'defillama-stablecoins',
            timestamp: now,
          });
          count++;
        }
      }
    } catch (err) {
      console.error('[stablecoin-snapshot] Fetch error:', err);
    }

    return { status: 'ok', snapshots: count, timestamp: now.toISOString() };
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// Gas Fees Snapshot — every 5 minutes
// ─────────────────────────────────────────────────────────────────────────────

export const gasFeeSnapshot = inngest.createFunction(
  {
    id: 'gas-fee-snapshot',
    name: 'Gas Fee Snapshot',
    retries: 2,
  },
  { cron: '*/5 * * * *' },
  async () => {
    const db = getDb();
    if (!db) {
      return { status: 'skipped', reason: 'DATABASE_URL not configured' };
    }

    const { gasChain } = await import('@/lib/providers/adapters/gas');

    const now = new Date();

    try {
      const result = await gasChain.fetch({});

      if (result?.data) {
        const gas = result.data as unknown as Record<string, number>;
        await db.insert(gasFeesHistory).values({
          chain: 'ethereum',
          safeLowGwei: gas.safeGasPrice ?? null,
          standardGwei: gas.proposeGasPrice ?? null,
          fastGwei: gas.fastGasPrice ?? null,
          baseFeeGwei: gas.suggestBaseFee ?? null,
          source: 'gas-chain',
          timestamp: now,
        });

        return { status: 'ok', timestamp: now.toISOString() };
      }
    } catch (err) {
      console.error('[gas-fee-snapshot] Fetch error:', err);
    }

    return { status: 'skipped', reason: 'No gas data available' };
  }
);
