/**
 * Etherscan Whales Adapter — Large ETH/ERC-20 transfers from Etherscan
 *
 * Monitors Etherscan's internal & token transfer APIs for high-value
 * on-chain movements. Free API key tier.
 *
 * @see https://docs.etherscan.io/
 * @module providers/adapters/on-chain/etherscan-whales
 */

import type { DataProvider, FetchParams, RateLimitConfig } from '../../types';
import type { WhaleAlert } from './types';

const BASE = 'https://api.etherscan.io/api';
const ETHERSCAN_KEY = process.env.ETHERSCAN_API_KEY ?? '';

const RATE_LIMIT: RateLimitConfig = { maxRequests: 5, windowMs: 1_000 };

/** Minimum value in ETH to consider a whale transfer */
const MIN_ETH_VALUE = 100; // ~$300K+ at $3k/ETH

export const etherscanWhalesAdapter: DataProvider<WhaleAlert[]> = {
  name: 'etherscan-whales',
  description: 'Etherscan — Large ETH transfers from recent blocks',
  priority: 3,
  weight: 0.20,
  rateLimit: RATE_LIMIT,
  capabilities: ['whale-alerts'],

  async fetch(params: FetchParams): Promise<WhaleAlert[]> {
    if (!ETHERSCAN_KEY) throw new Error('ETHERSCAN_API_KEY not configured');

    const limit = params.limit ?? 20;

    // Fetch recent internal transactions (large ETH movements)
    const res = await fetch(
      `${BASE}?module=account&action=txlistinternal&startblock=0&endblock=99999999&page=1&offset=${limit}&sort=desc&apikey=${ETHERSCAN_KEY}`,
      { signal: AbortSignal.timeout(10_000) },
    );

    if (!res.ok) throw new Error(`Etherscan API error: ${res.status}`);

    const json = await res.json();
    const txs: EtherscanInternalTx[] = json?.result ?? [];

    if (!Array.isArray(txs)) throw new Error('Invalid Etherscan response');

    const ethPriceUsd = params.extra?.ethPrice ?? 3000;

    const results: WhaleAlert[] = txs
      .map(tx => {
        const ethValue = Number(tx.value) / 1e18;
        const usdValue = ethValue * ethPriceUsd;

        return {
          txHash: tx.hash ?? '',
          chain: 'ethereum',
          symbol: 'ETH',
          amountUsd: usdValue,
          amount: ethValue,
          from: tx.from ?? '',
          to: tx.to ?? '',
          type: classifyAddress(tx.from, tx.to),
          timestamp: tx.timeStamp
            ? new Date(Number(tx.timeStamp) * 1000).toISOString()
            : new Date().toISOString(),
        };
      })
      .filter(tx => tx.amount >= MIN_ETH_VALUE)
      .slice(0, limit);

    if (results.length === 0) throw new Error('No large ETH transfers found');
    return results;
  },

  async healthCheck(): Promise<boolean> {
    if (!ETHERSCAN_KEY) return false;
    try {
      const res = await fetch(
        `${BASE}?module=proxy&action=eth_blockNumber&apikey=${ETHERSCAN_KEY}`,
        { signal: AbortSignal.timeout(5000) },
      );
      return res.ok;
    } catch { return false; }
  },

  validate(data: WhaleAlert[]): boolean {
    return Array.isArray(data) && data.length > 0;
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Known exchange addresses (just a sample for classification) */
const EXCHANGE_ADDRESSES = new Set([
  '0x28c6c06298d514db089934071355e5743bf21d60', // Binance Hot
  '0x21a31ee1afc51d94c2efccaa2092ad1028285549', // Binance US
  '0x71660c4005ba85c37ccec55d0c4493e66fe775d3', // Coinbase
  '0xa9d1e08c7793af67e9d92fe308d5697fb81d3e43', // Coinbase
  '0x2faf487a4414fe77e2327f0bf4ae2a264a776ad2', // FTX (historical)
  '0x503828976d22510aad0201ac7ec88293211d23da', // Coinbase Commerce
  '0xdfd5293d8e347dfe59e90efd55b2956a1343963d', // Kraken
  '0x267be1c1d684f78cb4f6a176c4911b741e4ffdc0', // Kraken
]);

function classifyAddress(from: string, to: string): WhaleAlert['type'] {
  const fromExchange = EXCHANGE_ADDRESSES.has(from?.toLowerCase());
  const toExchange = EXCHANGE_ADDRESSES.has(to?.toLowerCase());

  if (fromExchange && !toExchange) return 'exchange-withdraw';
  if (!fromExchange && toExchange) return 'exchange-deposit';
  return 'transfer';
}

// Internal
interface EtherscanInternalTx {
  hash?: string;
  from?: string;
  to?: string;
  value?: string;
  timeStamp?: string;
}
