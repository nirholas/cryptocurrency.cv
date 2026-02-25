/**
 * Inngest Function — Multi-Category Data Collection
 *
 * Periodically collects data from all new provider categories:
 * - Solana ecosystem tokens (every 5 min)
 * - Governance proposals (every 1 hour)
 * - Protocol revenue (every 6 hours)
 * - L2 data (every 30 min)
 * - MEV stats (every 10 min)
 * - Bridge volumes (every 1 hour)
 * - BTC ETF flows (every 1 hour)
 * - Mining stats (every 30 min)
 * - Prediction markets (every 15 min)
 *
 * @module inngest/functions/data-collection
 */

import { inngest } from '../client';

// ─────────────────────────────────────────────────────────────────────────────
// Solana Ecosystem Snapshot — every 5 minutes
// ─────────────────────────────────────────────────────────────────────────────

export const solanaSnapshot = inngest.createFunction(
  {
    id: 'solana-ecosystem-snapshot',
    name: 'Solana Ecosystem Token Snapshot',
    retries: 2,
  },
  { cron: '*/5 * * * *' },
  async () => {
    const { solanaChain } = await import('@/lib/providers/adapters/solana-ecosystem');
    const now = new Date();

    try {
      const result = await solanaChain.fetch({ limit: 50 });
      return {
        status: 'ok',
        tokens: result?.data?.length ?? 0,
        provider: result?.lineage?.provider ?? 'unknown',
        timestamp: now.toISOString(),
      };
    } catch (err) {
      console.error('[solana-snapshot] Error:', err);
      return { status: 'error', error: String(err), timestamp: now.toISOString() };
    }
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// Prediction Markets Snapshot — every 15 minutes
// ─────────────────────────────────────────────────────────────────────────────

export const predictionMarketsSnapshot = inngest.createFunction(
  {
    id: 'prediction-markets-snapshot',
    name: 'Prediction Markets Snapshot',
    retries: 2,
  },
  { cron: '*/15 * * * *' },
  async () => {
    const { predictionMarketsChain } = await import(
      '@/lib/providers/adapters/prediction-markets'
    );
    const now = new Date();

    try {
      const result = await predictionMarketsChain.fetch({ limit: 25 });
      return {
        status: 'ok',
        markets: result?.data?.length ?? 0,
        timestamp: now.toISOString(),
      };
    } catch (err) {
      console.error('[prediction-markets-snapshot] Error:', err);
      return { status: 'error', error: String(err), timestamp: now.toISOString() };
    }
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// Governance Snapshot — every 1 hour
// ─────────────────────────────────────────────────────────────────────────────

export const governanceSnapshot = inngest.createFunction(
  {
    id: 'governance-snapshot',
    name: 'Governance Proposals Snapshot',
    retries: 2,
  },
  { cron: '0 * * * *' },
  async () => {
    const { governanceChain } = await import('@/lib/providers/adapters/governance');
    const now = new Date();

    try {
      const result = await governanceChain.fetch({ limit: 20 });
      return {
        status: 'ok',
        proposals: result?.data?.length ?? 0,
        timestamp: now.toISOString(),
      };
    } catch (err) {
      console.error('[governance-snapshot] Error:', err);
      return { status: 'error', error: String(err), timestamp: now.toISOString() };
    }
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// L2 Data Snapshot — every 30 minutes
// ─────────────────────────────────────────────────────────────────────────────

export const l2DataSnapshot = inngest.createFunction(
  {
    id: 'l2-data-snapshot',
    name: 'L2 Rollup Data Snapshot',
    retries: 2,
  },
  { cron: '*/30 * * * *' },
  async () => {
    const { l2DataChain } = await import('@/lib/providers/adapters/l2-data');
    const now = new Date();

    try {
      const result = await l2DataChain.fetch({ limit: 30 });
      return {
        status: 'ok',
        l2s: result?.data?.length ?? 0,
        timestamp: now.toISOString(),
      };
    } catch (err) {
      console.error('[l2-data-snapshot] Error:', err);
      return { status: 'error', error: String(err), timestamp: now.toISOString() };
    }
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// MEV Snapshot — every 10 minutes
// ─────────────────────────────────────────────────────────────────────────────

export const mevSnapshot = inngest.createFunction(
  {
    id: 'mev-snapshot',
    name: 'MEV Stats Snapshot',
    retries: 2,
  },
  { cron: '*/10 * * * *' },
  async () => {
    const { mevChain } = await import('@/lib/providers/adapters/mev');
    const now = new Date();

    try {
      const result = await mevChain.fetch({});
      return {
        status: 'ok',
        totalMevEth: result?.data?.totalMevEth ?? 0,
        bundleCount: result?.data?.bundleCount ?? 0,
        timestamp: now.toISOString(),
      };
    } catch (err) {
      console.error('[mev-snapshot] Error:', err);
      return { status: 'error', error: String(err), timestamp: now.toISOString() };
    }
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// Bridge Volume Snapshot — every 1 hour
// ─────────────────────────────────────────────────────────────────────────────

export const bridgeSnapshot = inngest.createFunction(
  {
    id: 'bridge-volume-snapshot',
    name: 'Cross-Chain Bridge Volume Snapshot',
    retries: 2,
  },
  { cron: '15 * * * *' },
  async () => {
    const { bridgesChain } = await import('@/lib/providers/adapters/bridges');
    const now = new Date();

    try {
      const result = await bridgesChain.fetch({ limit: 20 });
      return {
        status: 'ok',
        bridges: result?.data?.length ?? 0,
        timestamp: now.toISOString(),
      };
    } catch (err) {
      console.error('[bridge-snapshot] Error:', err);
      return { status: 'error', error: String(err), timestamp: now.toISOString() };
    }
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// BTC ETF Flows Snapshot — every 1 hour
// ─────────────────────────────────────────────────────────────────────────────

export const btcETFSnapshot = inngest.createFunction(
  {
    id: 'btc-etf-snapshot',
    name: 'BTC ETF Flow Snapshot',
    retries: 2,
  },
  { cron: '30 * * * *' },
  async () => {
    const { btcETFChain } = await import('@/lib/providers/adapters/btc-etf');
    const now = new Date();

    try {
      const result = await btcETFChain.fetch({});
      return {
        status: 'ok',
        etfCount: result?.data?.etfs?.length ?? 0,
        dailyFlowUsd: result?.data?.dailyNetFlowUsd ?? 0,
        timestamp: now.toISOString(),
      };
    } catch (err) {
      console.error('[btc-etf-snapshot] Error:', err);
      return { status: 'error', error: String(err), timestamp: now.toISOString() };
    }
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// Mining Stats Snapshot — every 30 minutes
// ─────────────────────────────────────────────────────────────────────────────

export const miningSnapshot = inngest.createFunction(
  {
    id: 'mining-stats-snapshot',
    name: 'Bitcoin Mining Stats Snapshot',
    retries: 2,
  },
  { cron: '*/30 * * * *' },
  async () => {
    const { miningChain } = await import('@/lib/providers/adapters/mining');
    const now = new Date();

    try {
      const result = await miningChain.fetch({});
      return {
        status: 'ok',
        hashRate: result?.data?.hashRate ?? 0,
        difficulty: result?.data?.difficulty ?? 0,
        timestamp: now.toISOString(),
      };
    } catch (err) {
      console.error('[mining-snapshot] Error:', err);
      return { status: 'error', error: String(err), timestamp: now.toISOString() };
    }
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// Protocol Revenue Snapshot — every 6 hours
// ─────────────────────────────────────────────────────────────────────────────

export const protocolRevenueSnapshot = inngest.createFunction(
  {
    id: 'protocol-revenue-snapshot',
    name: 'Protocol Revenue Snapshot',
    retries: 2,
  },
  { cron: '0 */6 * * *' },
  async () => {
    const { protocolRevenueChain } = await import(
      '@/lib/providers/adapters/protocol-revenue'
    );
    const now = new Date();

    try {
      const result = await protocolRevenueChain.fetch({ limit: 50 });
      return {
        status: 'ok',
        protocols: result?.data?.length ?? 0,
        timestamp: now.toISOString(),
      };
    } catch (err) {
      console.error('[protocol-revenue-snapshot] Error:', err);
      return { status: 'error', error: String(err), timestamp: now.toISOString() };
    }
  },
);
