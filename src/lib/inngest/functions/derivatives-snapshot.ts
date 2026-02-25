/**
 * Inngest Function — Derivatives Snapshot
 *
 * Periodically snapshots open interest and liquidation data from
 * the derivatives and liquidations provider chains, storing them
 * in the derivatives_snapshots table for historical analysis.
 *
 * Schedule: Every 15 minutes
 *
 * @module inngest/functions/derivatives-snapshot
 */

import { inngest } from '../client';
import { getDb } from '@/lib/db/client';
import { derivativesSnapshots } from '@/lib/db/schema';

export const derivativesSnapshot = inngest.createFunction(
  {
    id: 'derivatives-snapshot',
    name: 'Derivatives Snapshot',
    retries: 2,
  },
  { cron: '*/15 * * * *' }, // Every 15 minutes
  async () => {
    const db = getDb();
    if (!db) {
      return { status: 'skipped', reason: 'DATABASE_URL not configured' };
    }

    // Dynamically import to avoid circular dependencies
    const { derivativesChain } = await import(
      '@/lib/providers/adapters/derivatives'
    );
    const { liquidationsChain } = await import(
      '@/lib/providers/adapters/derivatives'
    );

    const now = new Date();
    let oiCount = 0;
    let liqCount = 0;

    // Fetch open interest data
    try {
      const oiResult = await derivativesChain.fetch({
        symbols: ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'DOGE', 'AVAX', 'ARB', 'OP'],
        limit: 20,
      });

      if (oiResult?.data) {
        for (const oi of oiResult.data) {
          await db.insert(derivativesSnapshots).values({
            ticker: oi.symbol,
            openInterestUsd: oi.openInterestUsd,
            openInterestCoin: oi.openInterestCoin,
            oiChange24h: oi.change24h,
            source: 'derivatives-chain',
            exchangeBreakdown: oi.exchanges?.map((e) => ({
              exchange: e.exchange,
              oiUsd: e.openInterestUsd,
              oiCoin: e.openInterestCoin,
            })),
            timestamp: now,
          });
          oiCount++;
        }
      }
    } catch (err) {
      console.error('[derivatives-snapshot] OI fetch error:', err);
    }

    // Fetch liquidation data
    try {
      const liqResult = await liquidationsChain.fetch({
        symbols: ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'],
        limit: 100,
      });

      if (liqResult?.data) {
        for (const liq of liqResult.data) {
          await db.insert(derivativesSnapshots).values({
            ticker: liq.symbol,
            longLiquidationsUsd24h: liq.longLiquidationsUsd24h,
            shortLiquidationsUsd24h: liq.shortLiquidationsUsd24h,
            liquidationCount24h: liq.count24h,
            largestLiquidationUsd: liq.largestSingleUsd,
            source: 'liquidations-chain',
            timestamp: now,
          });
          liqCount++;
        }
      }
    } catch (err) {
      console.error('[derivatives-snapshot] Liquidation fetch error:', err);
    }

    return {
      status: 'ok',
      oiSnapshots: oiCount,
      liqSnapshots: liqCount,
      timestamp: now.toISOString(),
    };
  }
);
