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
 * Open Interest Adapters — Unit Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createDerivativesChain } from '../adapters/derivatives';
import '../setup';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
});

// =============================================================================
// BYBIT OI
// =============================================================================

describe('Bybit OI Adapter', () => {
  it('fetches and normalizes open interest data', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        retCode: 0,
        retMsg: 'OK',
        result: {
          list: [
            {
              symbol: 'BTCUSDT',
              openInterest: '50000',
              openInterestValue: '3250000000',
              lastPrice: '65000',
              markPrice: '65000',
              indexPrice: '65000',
              fundingRate: '0.0001',
              nextFundingTime: '1700000000000',
              volume24h: '100000',
              turnover24h: '6500000000',
            },
            {
              symbol: 'ETHUSDT',
              openInterest: '500000',
              openInterestValue: '1750000000',
              lastPrice: '3500',
              markPrice: '3500',
              indexPrice: '3500',
              fundingRate: '0.0002',
              nextFundingTime: '1700000000000',
              volume24h: '200000',
              turnover24h: '700000000',
            },
          ],
        },
      }),
    });

    const chain = createDerivativesChain({
      strategy: 'fallback',
      cacheTtlSeconds: 0,
      includeCoinglass: false,
    });

    // Remove other providers — test only bybit-oi (priority 3)
    chain.removeProvider('hyperliquid');
    chain.removeProvider('okx-oi');
    chain.removeProvider('dydx-oi');

    const result = await chain.fetch({});

    expect(result.data).toBeDefined();
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data.length).toBeGreaterThan(0);
    expect(result.data[0].symbol).toBe('BTC');
    expect(result.data[0].openInterestUsd).toBe(3250000000);
    expect(result.data[0].openInterestCoin).toBe(50000);
    expect(result.data[0].exchanges[0].exchange).toBe('Bybit');
    expect(result.lineage.provider).toBe('bybit-oi');
  });
});

// =============================================================================
// OKX OI
// =============================================================================

describe('OKX OI Adapter', () => {
  it('fetches and normalizes open interest data', async () => {
    // OI response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        code: '0',
        msg: '',
        data: [
          {
            instId: 'BTC-USDT-SWAP',
            instType: 'SWAP',
            oi: '45000',
            oiCcy: '2925000000',
            ts: '1700000000000',
          },
          {
            instId: 'ETH-USDT-SWAP',
            instType: 'SWAP',
            oi: '400000',
            oiCcy: '1400000000',
            ts: '1700000000000',
          },
        ],
      }),
    });
    // Ticker response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        code: '0',
        msg: '',
        data: [
          { instId: 'BTC-USDT-SWAP', last: '65000' },
          { instId: 'ETH-USDT-SWAP', last: '3500' },
        ],
      }),
    });

    const chain = createDerivativesChain({
      strategy: 'fallback',
      cacheTtlSeconds: 0,
      includeCoinglass: false,
    });

    chain.removeProvider('hyperliquid');
    chain.removeProvider('bybit-oi');
    chain.removeProvider('dydx-oi');

    const result = await chain.fetch({});

    expect(result.data).toBeDefined();
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data[0].symbol).toBe('BTC');
    expect(result.data[0].openInterestUsd).toBe(2925000000);
    expect(result.data[0].exchanges[0].exchange).toBe('OKX');
    expect(result.lineage.provider).toBe('okx-oi');
  });
});

// =============================================================================
// DYDX OI
// =============================================================================

describe('dYdX OI Adapter', () => {
  it('fetches and normalizes open interest data', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        markets: {
          'BTC-USD': {
            market: 'BTC-USD',
            type: 'PERPETUAL',
            status: 'ONLINE',
            baseAsset: 'BTC',
            openInterest: '5000',
            oraclePrice: '65000',
            indexPrice: '64990',
          },
          'ETH-USD': {
            market: 'ETH-USD',
            type: 'PERPETUAL',
            status: 'ONLINE',
            baseAsset: 'ETH',
            openInterest: '50000',
            oraclePrice: '3500',
            indexPrice: '3498',
          },
        },
      }),
    });

    const chain = createDerivativesChain({
      strategy: 'fallback',
      cacheTtlSeconds: 0,
      includeCoinglass: false,
    });

    chain.removeProvider('hyperliquid');
    chain.removeProvider('bybit-oi');
    chain.removeProvider('okx-oi');

    const result = await chain.fetch({});

    expect(result.data).toBeDefined();
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data[0].symbol).toBe('BTC');
    expect(result.data[0].openInterestUsd).toBe(5000 * 65000);
    expect(result.data[0].openInterestCoin).toBe(5000);
    expect(result.data[0].exchanges[0].exchange).toBe('dYdX');
    expect(result.lineage.provider).toBe('dydx-oi');
  });
});

// =============================================================================
// BROADCAST CHAIN
// =============================================================================

describe('Derivatives Broadcast Chain', () => {
  it('returns data from highest-priority provider on broadcast', async () => {
    // Hyperliquid response (highest priority = 1)
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
          { funding: '0.0001', openInterest: '10000', oraclePx: '65000', markPx: '65010' },
          { funding: '0.0002', openInterest: '100000', oraclePx: '3500', markPx: '3501' },
        ],
      ],
    });

    // Bybit response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        retCode: 0,
        retMsg: 'OK',
        result: {
          list: [
            {
              symbol: 'BTCUSDT',
              openInterest: '8000',
              openInterestValue: '520000000',
              lastPrice: '65000',
              markPrice: '65000',
              indexPrice: '65000',
              fundingRate: '0.0001',
              nextFundingTime: '1700000000000',
              volume24h: '100000',
              turnover24h: '6500000000',
            },
          ],
        },
      }),
    });

    // OKX OI + ticker
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        code: '0',
        msg: '',
        data: [{ instId: 'BTC-USDT-SWAP', oi: '7000', oiCcy: '455000000', ts: '1700000000000' }],
      }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        code: '0',
        msg: '',
        data: [{ instId: 'BTC-USDT-SWAP', last: '65000' }],
      }),
    });

    // dYdX response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        markets: {
          'BTC-USD': {
            market: 'BTC-USD',
            type: 'PERPETUAL',
            status: 'ONLINE',
            openInterest: '3000',
            oraclePrice: '65000',
            indexPrice: '65000',
            baseAsset: 'BTC',
          },
        },
      }),
    });

    const chain = createDerivativesChain({
      strategy: 'broadcast',
      cacheTtlSeconds: 0,
      includeCoinglass: false,
    });

    const result = await chain.fetch({});

    expect(result.data).toBeDefined();
    expect(result.lineage.provider).toBe('hyperliquid');
    // Broadcast returns contributors
    expect(result.lineage.contributors).toBeDefined();
    expect(result.lineage.contributors!.length).toBeGreaterThanOrEqual(1);
  });
});

// =============================================================================
// CIRCUIT BREAKER
// =============================================================================

describe('Derivatives Chain Circuit Breaker', () => {
  it('falls back when primary provider fails', async () => {
    // Hyperliquid fails
    mockFetch.mockRejectedValueOnce(new Error('Hyperliquid down'));

    // Bybit succeeds
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        retCode: 0,
        retMsg: 'OK',
        result: {
          list: [
            {
              symbol: 'BTCUSDT',
              openInterest: '50000',
              openInterestValue: '3250000000',
              lastPrice: '65000',
              markPrice: '65000',
              indexPrice: '65000',
              fundingRate: '0.0001',
              nextFundingTime: '1700000000000',
              volume24h: '100000',
              turnover24h: '6500000000',
            },
          ],
        },
      }),
    });

    const chain = createDerivativesChain({
      strategy: 'fallback',
      cacheTtlSeconds: 0,
      includeCoinglass: false,
    });

    chain.removeProvider('okx-oi');
    chain.removeProvider('dydx-oi');

    const result = await chain.fetch({});

    expect(result.data).toBeDefined();
    expect(result.lineage.provider).toBe('bybit-oi');
  });
});
