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
 * Liquidations Chain — Unit Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createLiquidationsChain } from '../adapters/derivatives';
import { registry } from '../registry';
import '../setup';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
});

// =============================================================================
// BINANCE LIQUIDATIONS
// =============================================================================

describe('Binance Liquidations Adapter', () => {
  it('fetches and aggregates forced liquidation orders', async () => {
    // Binance returns force orders per symbol. The adapter iterates over default symbols.
    // BTCUSDT
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          symbol: 'BTCUSDT',
          price: '64000',
          origQty: '0.5',
          executedQty: '0.5',
          averagePrice: '64000',
          status: 'FILLED',
          timeInForce: 'IOC',
          type: 'LIMIT',
          side: 'SELL', // Long liquidated
          time: 1700000000000,
        },
        {
          symbol: 'BTCUSDT',
          price: '64500',
          origQty: '0.3',
          executedQty: '0.3',
          averagePrice: '64500',
          status: 'FILLED',
          timeInForce: 'IOC',
          type: 'LIMIT',
          side: 'BUY', // Short liquidated
          time: 1700001000000,
        },
      ],
    });
    // ETHUSDT
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });
    // SOLUSDT
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    const chain = createLiquidationsChain({
      strategy: 'fallback',
      cacheTtlSeconds: 0,
    });
    chain.removeProvider('hyperliquid-liquidations');

    const result = await chain.fetch({});

    expect(result.data).toBeDefined();
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data.length).toBeGreaterThan(0);

    const btc = result.data[0];
    expect(btc.symbol).toBe('BTC');
    expect(btc.longLiquidationsUsd24h).toBe(64000 * 0.5);
    expect(btc.shortLiquidationsUsd24h).toBe(64500 * 0.3);
    expect(btc.count24h).toBe(2);
    expect(btc.largestSingleUsd).toBe(64000 * 0.5);
    expect(result.lineage.provider).toBe('binance-liquidations');
  });
});

// =============================================================================
// REGISTRY
// =============================================================================

describe('Liquidations Registry', () => {
  it('registry resolves liquidations category', () => {
    expect(registry.has('liquidations')).toBe(true);
  });

  it('registry resolves coinglass-liquidations category', () => {
    expect(registry.has('coinglass-liquidations')).toBe(true);
  });
});

// =============================================================================
// FALLBACK BEHAVIOR
// =============================================================================

describe('Liquidations Chain Fallback', () => {
  it('falls back to Hyperliquid when Binance fails', async () => {
    // Binance fails for all 3 symbols
    mockFetch.mockRejectedValueOnce(new Error('Binance down'));
    mockFetch.mockRejectedValueOnce(new Error('Binance down'));
    mockFetch.mockRejectedValueOnce(new Error('Binance down'));

    // Hyperliquid succeeds (metaAndAssetCtxs)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          universe: [
            { name: 'BTC', szDecimals: 5 },
            { name: 'ETH', szDecimals: 4 },
          ],
        },
        [
          {
            funding: '0.0001',
            openInterest: '10000',
            prevDayPx: '64000',
            dayNtlVlm: '500000000',
            markPx: '65000',
            midPx: '65000',
            oraclePx: '65000',
          },
          {
            funding: '0.0002',
            openInterest: '100000',
            prevDayPx: '3400',
            dayNtlVlm: '200000000',
            markPx: '3500',
            midPx: '3500',
            oraclePx: '3500',
          },
        ],
      ],
    });

    const chain = createLiquidationsChain({
      strategy: 'fallback',
      cacheTtlSeconds: 0,
    });

    const result = await chain.fetch({});

    expect(result.data).toBeDefined();
    expect(result.lineage.provider).toBe('hyperliquid-liquidations');
  });
});
