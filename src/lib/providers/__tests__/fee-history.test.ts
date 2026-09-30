/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/cryptocurrency.cv
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

/**
 * eth_feeHistory gas estimation: the pure estimator and the RPC failover.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  estimateFromFeeHistory,
  fetchFeeHistoryGas,
  isFeeHistoryNetwork,
  type FeeHistoryResult,
} from '../adapters/gas/fee-history.adapter';

const gwei = (n: number) => `0x${BigInt(Math.round(n * 1e9)).toString(16)}`;

function history(overrides: Partial<FeeHistoryResult> = {}): FeeHistoryResult {
  return {
    oldestBlock: '0x10',
    baseFeePerGas: [gwei(1), gwei(1), gwei(1), gwei(2)],
    gasUsedRatio: [0.5, 0.5, 0.5],
    reward: [
      [gwei(0.1), gwei(1), gwei(2), gwei(3)],
      [gwei(0.1), gwei(1), gwei(2), gwei(3)],
      [gwei(0.1), gwei(1), gwei(2), gwei(3)],
    ],
    ...overrides,
  };
}

describe('estimateFromFeeHistory', () => {
  it('prices each tier as the next base fee plus the median tip at its percentile', () => {
    const est = estimateFromFeeHistory('ethereum', history());
    expect(est.baseFee).toBe(2);
    expect(est.slow).toBeCloseTo(2.1);
    expect(est.standard).toBe(3);
    expect(est.fast).toBe(4);
    // instant budgets a full-block base-fee rise (12.5%) on top of the p99 tip
    expect(est.instant).toBeCloseTo(2 * 1.125 + 3);
    expect(est).toMatchObject({ chain: 'ethereum', chainId: 1, symbol: 'ETH', unit: 'gwei' });
    // oldest block 0x10 + 3 blocks => newest is 0x12
    expect(est.blockNumber).toBe(0x12);
  });

  it('ignores empty blocks, whose zero tips would drag every tier to the base fee', () => {
    const est = estimateFromFeeHistory(
      'base',
      history({
        gasUsedRatio: [0, 0.5, 0],
        reward: [
          ['0x0', '0x0', '0x0', '0x0'],
          [gwei(0.1), gwei(1), gwei(2), gwei(3)],
          ['0x0', '0x0', '0x0', '0x0'],
        ],
      }),
    );
    expect(est.standard).toBe(3);
    expect(est.symbol).toBe('ETH');
    expect(est.chainId).toBe(8453);
  });

  it('keeps tiers ordered when sparse percentiles cross', () => {
    const est = estimateFromFeeHistory(
      'polygon',
      history({ reward: [[gwei(5), gwei(1), gwei(0.5), gwei(0)]], gasUsedRatio: [0.2] }),
    );
    expect(est.slow).toBeLessThanOrEqual(est.standard);
    expect(est.standard).toBeLessThanOrEqual(est.fast);
    expect(est.fast).toBeLessThanOrEqual(est.instant);
    expect(est.symbol).toBe('POL');
  });

  it('serves the base fee alone on chains with no priority market (Arbitrum)', () => {
    const est = estimateFromFeeHistory(
      'arbitrum',
      history({
        baseFeePerGas: [gwei(0.01), gwei(0.01)],
        gasUsedRatio: [0.1],
        reward: [['0x0', '0x0', '0x0', '0x0']],
      }),
    );
    expect(est.slow).toBe(0.01);
    expect(est.fast).toBe(0.01);
  });

  it('keeps sub-gwei precision instead of rounding to zero', () => {
    const est = estimateFromFeeHistory(
      'optimism',
      history({
        baseFeePerGas: ['0x3ab', '0x3ab'],
        gasUsedRatio: [0.4],
        reward: [['0x1', '0x33', '0x0', '0x0']],
      }),
    );
    expect(est.baseFee).toBeCloseTo(9.39e-7, 12);
    expect(est.slow).toBeGreaterThan(0);
  });

  it('rejects a response with no base fees', () => {
    expect(() => estimateFromFeeHistory('ethereum', history({ baseFeePerGas: [] }))).toThrow(
      /no base fees/,
    );
  });
});

describe('fetchFeeHistoryGas', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    mockFetch.mockReset();
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    delete process.env.ARBITRUM_RPC_URL;
    vi.unstubAllGlobals();
  });

  const ok = (result: unknown) => ({
    ok: true,
    status: 200,
    json: async () => ({ jsonrpc: '2.0', id: 1, result }),
  });

  it('fails over to the next public RPC and reports which one answered', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ error: { message: 'range too large' } }),
      })
      .mockResolvedValueOnce(ok(history()));

    const est = await fetchFeeHistoryGas('optimism');

    expect(mockFetch.mock.calls.map(([url]) => url)).toEqual([
      'https://mainnet.optimism.io',
      'https://optimism-rpc.publicnode.com',
    ]);
    expect(est.rpc).toBe('optimism-rpc.publicnode.com');
    expect(est.standard).toBe(3);
  });

  it('tries the operator RPC from <NETWORK>_RPC_URL first', async () => {
    process.env.ARBITRUM_RPC_URL = 'https://arb.example.org/rpc';
    mockFetch.mockResolvedValueOnce(ok(history()));

    await fetchFeeHistoryGas('arbitrum');

    expect(mockFetch.mock.calls[0][0]).toBe('https://arb.example.org/rpc');
  });

  it('names every failed RPC when none answers', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 503, json: async () => ({}) });

    await expect(fetchFeeHistoryGas('ethereum')).rejects.toThrow(
      /ethereum-rpc\.publicnode\.com: HTTP 503.*eth\.drpc\.org: HTTP 503/,
    );
  });
});

describe('isFeeHistoryNetwork', () => {
  it('accepts supported networks only', () => {
    expect(isFeeHistoryNetwork('base')).toBe(true);
    expect(isFeeHistoryNetwork('solana')).toBe(false);
    expect(isFeeHistoryNetwork('toString')).toBe(false);
  });
});
