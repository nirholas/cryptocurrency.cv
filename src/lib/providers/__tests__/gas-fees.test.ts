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
 * Gas Fees Chain — Integration Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// The Blocknative adapter reads its key once, at module scope, so this has to
// run before the adapter module is imported. Without a key the adapter refuses
// to fetch at all and the fallback test below asserted nothing.
vi.hoisted(() => {
  process.env.BLOCKNATIVE_API_KEY = 'test-key';
});

import { createGasChain } from '../adapters/gas';
import { registry } from '../registry';
import '../setup';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
});

describe('GasChain', () => {
  it('fetches gas prices from Etherscan (primary)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: '1',
        result: {
          LastBlock: '18500000',
          SafeGasPrice: '20',
          ProposeGasPrice: '30',
          FastGasPrice: '50',
          suggestBaseFee: '18.5',
          gasUsedRatio: '0.5,0.6,0.7',
        },
      }),
    });

    const chain = createGasChain({ cacheTtlSeconds: 0, includeBlocknative: false });
    const result = await chain.fetch({});

    expect(result.data).toBeDefined();
    expect(result.lineage.provider).toContain('etherscan');
  });

  it('falls back to Blocknative when Etherscan fails', async () => {
    // Etherscan fails
    mockFetch.mockRejectedValueOnce(new Error('Etherscan down'));
    // Blocknative succeeds
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        blockPrices: [{
          baseFeePerGas: 25,
          estimatedPrices: [
            { confidence: 99, price: 50, maxPriorityFeePerGas: 2, maxFeePerGas: 52 },
            { confidence: 90, price: 35, maxPriorityFeePerGas: 1.5, maxFeePerGas: 36.5 },
            { confidence: 70, price: 25, maxPriorityFeePerGas: 1, maxFeePerGas: 26 },
          ],
        }],
      }),
    });

    // Owlracle is excluded so a Blocknative failure cannot be masked by the
    // tertiary provider picking up the request.
    const chain = createGasChain({
      cacheTtlSeconds: 0,
      includeBlocknative: true,
      includeOwlracle: false,
    });
    const result = await chain.fetch({});

    expect(result.data).toBeDefined();
    expect(result.lineage.provider).toContain('blocknative');
  });

  it('registry resolves gas-fees category', () => {
    expect(registry.has('gas-fees')).toBe(true);
  });
});
