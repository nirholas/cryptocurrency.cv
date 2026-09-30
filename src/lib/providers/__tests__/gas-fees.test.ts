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

    const chain = createGasChain({ cacheTtlSeconds: 0, includeFeeHistory: false });
    const result = await chain.fetch({});

    expect(result.data).toBeDefined();
    expect(result.lineage.provider).toContain('etherscan');
  });

  it('falls back to eth_feeHistory when Etherscan fails', async () => {
    // Etherscan fails
    mockFetch.mockRejectedValueOnce(new Error('Etherscan down'));
    // The first public RPC answers eth_feeHistory (3 blocks + next base fee)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        jsonrpc: '2.0',
        id: 1,
        result: {
          oldestBlock: '0x100',
          baseFeePerGas: ['0x3b9aca00', '0x3b9aca00', '0x3b9aca00', '0x77359400'], // 1,1,1 then 2 gwei
          gasUsedRatio: [0.5, 0.5, 0.5],
          reward: [
            ['0x5f5e100', '0x3b9aca00', '0x77359400', '0xb2d05e00'], // 0.1, 1, 2, 3 gwei
            ['0x5f5e100', '0x3b9aca00', '0x77359400', '0xb2d05e00'],
            ['0x5f5e100', '0x3b9aca00', '0x77359400', '0xb2d05e00'],
          ],
        },
      }),
    });

    // Owlracle is excluded so a fee-history failure cannot be masked by the
    // tertiary provider picking up the request.
    const chain = createGasChain({
      cacheTtlSeconds: 0,
      includeFeeHistory: true,
      includeOwlracle: false,
    });
    const result = await chain.fetch({});

    expect(result.lineage.provider).toContain('feehistory');
    expect(result.data.baseFee).toBe(2);
    expect(result.data.slow).toBeCloseTo(2.1);
    expect(result.data.standard).toBe(3);
    expect(result.data.fast).toBe(4);
    const [url, init] = mockFetch.mock.calls[1];
    expect(url).toBe('https://ethereum-rpc.publicnode.com');
    expect(JSON.parse(init.body).method).toBe('eth_feeHistory');
  });

  it('registry resolves gas-fees category', () => {
    expect(registry.has('gas-fees')).toBe(true);
  });
});
