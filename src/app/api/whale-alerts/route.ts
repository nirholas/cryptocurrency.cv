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
 * @fileoverview Whale Alerts API
 * Monitors large cryptocurrency transactions across multiple blockchains
 * Uses real blockchain data from public APIs and websockets
 */

import { type NextRequest, NextResponse } from 'next/server';
import { COINGECKO_BASE } from '@/lib/constants';

import { resilientFetchResponse } from '@/lib/resilient-fetch';
interface WhaleTransaction {
  id: string;
  blockchain: string;
  symbol: string;
  amount: number;
  amountUsd: number;
  from: {
    address: string;
    owner?: string;
    ownerType?: 'exchange' | 'whale' | 'unknown';
  };
  to: {
    address: string;
    owner?: string;
    ownerType?: 'exchange' | 'whale' | 'unknown';
  };
  hash: string;
  timestamp: number;
  transactionType: 'exchange_deposit' | 'exchange_withdrawal' | 'whale_transfer' | 'unknown';
  significance: 'normal' | 'notable' | 'massive';
}

interface WhaleAlertsResponse {
  alerts: WhaleTransaction[];
  summary: {
    totalTransactions: number;
    totalValueUsd: number;
    exchangeDeposits: number;
    exchangeWithdrawals: number;
    largestTransaction: WhaleTransaction | null;
  };
  lastUpdated: string;
}

// Known exchange addresses for identifying transaction types
const EXCHANGE_ADDRESSES: Record<string, string> = {
  // Binance
  '0x28c6c06298d514db089934071355e5743bf21d60': 'Binance',
  '0x21a31ee1afc51d94c2efccaa2092ad1028285549': 'Binance',
  '0xdfd5293d8e347dfe59e90efd55b2956a1343963d': 'Binance',
  // Coinbase
  '0x503828976d22510aad0339f595c3d6f0ea7b4a77': 'Coinbase',
  '0xddfabcdc4d8ffc6d5beaf154f18b778f892a0740': 'Coinbase',
  '0x71660c4005ba85c37ccec55d0c4493e66fe775d3': 'Coinbase',
  // Kraken
  '0x2910543af39aba0cd09dbb2d50200b3e800a63d2': 'Kraken',
  '0x0a869d79a7052c7f1b55a8ebabbea3420f0d1e13': 'Kraken',
  // Bitfinex
  '0x876eabf441b2ee5b5b0554fd502a8e0600950cfa': 'Bitfinex',
  '0xc6cde7c39eb2f0f0095f41570af89efc2c1ea828': 'Bitfinex',
  // OKX
  '0x6cc5f688a315f3dc28a7781717a9a798a59fda7b': 'OKX',
  // Bybit
  '0xf89d7b9c864f589bbf53a82105107622b35eaa40': 'Bybit',
};

// Thresholds for whale alerts (in USD)
const SIGNIFICANCE_THRESHOLDS = {
  BTC: { notable: 10_000_000, massive: 50_000_000 },
  ETH: { notable: 5_000_000, massive: 25_000_000 },
  default: { notable: 1_000_000, massive: 10_000_000 },
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const blockchain = searchParams.get('blockchain') || 'all';
    const minValue = parseInt(searchParams.get('minValue') || '100000');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Fetch whale transactions from multiple sources
    const [ethTransactions, btcTransactions] = await Promise.all([
      blockchain === 'all' || blockchain === 'ethereum'
        ? fetchEthereumWhaleTransactions(minValue)
        : [],
      blockchain === 'all' || blockchain === 'bitcoin'
        ? fetchBitcoinWhaleTransactions(minValue)
        : [],
    ]);

    // Combine and sort by timestamp
    const allTransactions = [...ethTransactions, ...btcTransactions]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);

    // Calculate summary
    const summary = calculateSummary(allTransactions);

    const response: WhaleAlertsResponse = {
      alerts: allTransactions,
      summary,
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Whale alerts error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch whale alerts',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

/**
 * Fetch large Ethereum transactions from Etherscan API
 */
async function fetchEthereumWhaleTransactions(minValueUsd: number): Promise<WhaleTransaction[]> {
  const transactions: WhaleTransaction[] = [];

  try {
    // Use Etherscan API to get recent large ETH transfers
    // Note: Requires ETHERSCAN_API_KEY for production use
    const apiKey = process.env.ETHERSCAN_API_KEY;

    // Get current ETH price
    const priceResponse = await fetch(
      `${COINGECKO_BASE}/simple/price?ids=ethereum&vs_currencies=usd`,
      { next: { revalidate: 60 } },
    );
    const priceData = await priceResponse.json();
    const ethPrice = priceData.ethereum?.usd || 3000;

    // Minimum ETH value based on USD threshold
    const minEthValue = minValueUsd / ethPrice;

    if (apiKey) {
      // Fetch recent blocks and their transactions
      const response = await resilientFetchResponse(
        `https://api.etherscan.io/v2/api?chainid=1&module=account&action=txlist&address=0x28c6c06298d514db089934071355e5743bf21d60&startblock=0&endblock=99999999&page=1&offset=100&sort=desc&apikey=${apiKey}`,
        { service: 'etherscan', timeoutMs: 8000, retries: 1, next: { revalidate: 30 } },
      );

      if (response.ok) {
        const data = await response.json();

        if (data.status === '1' && Array.isArray(data.result)) {
          for (const tx of data.result) {
            const valueEth = parseFloat(tx.value) / 1e18;
            const valueUsd = valueEth * ethPrice;

            if (valueUsd >= minValueUsd) {
              const fromAddress = tx.from.toLowerCase();
              const toAddress = tx.to.toLowerCase();

              transactions.push({
                id: `eth-${tx.hash}`,
                blockchain: 'Ethereum',
                symbol: 'ETH',
                amount: valueEth,
                amountUsd: valueUsd,
                from: {
                  address: fromAddress,
                  owner: EXCHANGE_ADDRESSES[fromAddress],
                  ownerType: EXCHANGE_ADDRESSES[fromAddress] ? 'exchange' : 'whale',
                },
                to: {
                  address: toAddress,
                  owner: EXCHANGE_ADDRESSES[toAddress],
                  ownerType: EXCHANGE_ADDRESSES[toAddress] ? 'exchange' : 'whale',
                },
                hash: tx.hash,
                timestamp: parseInt(tx.timeStamp) * 1000,
                transactionType: determineTransactionType(fromAddress, toAddress),
                significance: determineSignificance('ETH', valueUsd),
              });
            }
          }
        }
      }
    }

    // Also fetch from public whale watching APIs
    const publicResponse = await resilientFetchResponse(
      'https://api.blockchair.com/ethereum/transactions?limit=25&s=value(desc)',
      { service: 'blockchair', timeoutMs: 8000, retries: 1, next: { revalidate: 60 } },
    );

    if (publicResponse.ok) {
      const publicData = await publicResponse.json();

      if (publicData.data && Array.isArray(publicData.data)) {
        for (const tx of publicData.data) {
          const valueEth = parseFloat(tx.value) / 1e18;
          const valueUsd = valueEth * ethPrice;

          if (valueUsd >= minValueUsd && !transactions.find((t) => t.hash === tx.hash)) {
            const fromAddress = (tx.sender || '').toLowerCase();
            const toAddress = (tx.recipient || '').toLowerCase();

            transactions.push({
              id: `eth-${tx.hash}`,
              blockchain: 'Ethereum',
              symbol: 'ETH',
              amount: valueEth,
              amountUsd: valueUsd,
              from: {
                address: fromAddress,
                owner: EXCHANGE_ADDRESSES[fromAddress],
                ownerType: EXCHANGE_ADDRESSES[fromAddress] ? 'exchange' : 'whale',
              },
              to: {
                address: toAddress,
                owner: EXCHANGE_ADDRESSES[toAddress],
                ownerType: EXCHANGE_ADDRESSES[toAddress] ? 'exchange' : 'whale',
              },
              hash: tx.hash,
              timestamp: new Date(tx.time).getTime(),
              transactionType: determineTransactionType(fromAddress, toAddress),
              significance: determineSignificance('ETH', valueUsd),
            });
          }
        }
      }
    }
  } catch (error) {
    console.error('Error fetching Ethereum whale transactions:', error);
  }

  return transactions;
}

/**
 * Fetch large Bitcoin transactions from Blockchain.com API
 */
async function fetchBitcoinWhaleTransactions(minValueUsd: number): Promise<WhaleTransaction[]> {
  const transactions: WhaleTransaction[] = [];

  try {
    // Get current BTC price
    const priceResponse = await fetch(
      `${COINGECKO_BASE}/simple/price?ids=bitcoin&vs_currencies=usd`,
      { next: { revalidate: 60 } },
    );
    const priceData = await priceResponse.json();
    const btcPrice = priceData.bitcoin?.usd || 95000;

    // Fetch large BTC transactions from Blockchair
    const response = await resilientFetchResponse(
      'https://api.blockchair.com/bitcoin/transactions?limit=25&s=output_total(desc)',
      { service: 'blockchair', timeoutMs: 8000, retries: 1, next: { revalidate: 60 } },
    );

    if (response.ok) {
      const data = await response.json();

      if (data.data && Array.isArray(data.data)) {
        for (const tx of data.data) {
          const valueBtc = tx.output_total / 1e8;
          const valueUsd = valueBtc * btcPrice;

          if (valueUsd >= minValueUsd) {
            transactions.push({
              id: `btc-${tx.hash}`,
              blockchain: 'Bitcoin',
              symbol: 'BTC',
              amount: valueBtc,
              amountUsd: valueUsd,
              from: {
                address: tx.input_count > 0 ? 'Multiple Inputs' : 'Unknown',
                ownerType: 'unknown',
              },
              to: {
                address: tx.output_count > 0 ? 'Multiple Outputs' : 'Unknown',
                ownerType: 'unknown',
              },
              hash: tx.hash,
              timestamp: new Date(tx.time).getTime(),
              transactionType: 'whale_transfer',
              significance: determineSignificance('BTC', valueUsd),
            });
          }
        }
      }
    }

    // Also try Blockchain.info API for unconfirmed transactions
    const mempoolResponse = await resilientFetchResponse(
      'https://blockchain.info/unconfirmed-transactions?format=json',
      { service: 'blockchain-info', timeoutMs: 8000, retries: 1, next: { revalidate: 30 } },
    );

    if (mempoolResponse.ok) {
      const mempoolData = await mempoolResponse.json();

      if (mempoolData.txs && Array.isArray(mempoolData.txs)) {
        for (const tx of mempoolData.txs.slice(0, 50)) {
          const totalOutput =
            tx.out?.reduce((sum: number, out: { value: number }) => sum + out.value, 0) || 0;
          const valueBtc = totalOutput / 1e8;
          const valueUsd = valueBtc * btcPrice;

          if (valueUsd >= minValueUsd && !transactions.find((t) => t.hash === tx.hash)) {
            transactions.push({
              id: `btc-${tx.hash}`,
              blockchain: 'Bitcoin',
              symbol: 'BTC',
              amount: valueBtc,
              amountUsd: valueUsd,
              from: {
                address: tx.inputs?.[0]?.prev_out?.addr || 'Unknown',
                ownerType: 'unknown',
              },
              to: {
                address: tx.out?.[0]?.addr || 'Unknown',
                ownerType: 'unknown',
              },
              hash: tx.hash,
              timestamp: tx.time * 1000,
              transactionType: 'whale_transfer',
              significance: determineSignificance('BTC', valueUsd),
            });
          }
        }
      }
    }
  } catch (error) {
    console.error('Error fetching Bitcoin whale transactions:', error);
  }

  return transactions;
}

function determineTransactionType(
  fromAddress: string,
  toAddress: string,
): WhaleTransaction['transactionType'] {
  const fromIsExchange = !!EXCHANGE_ADDRESSES[fromAddress.toLowerCase()];
  const toIsExchange = !!EXCHANGE_ADDRESSES[toAddress.toLowerCase()];

  if (fromIsExchange && !toIsExchange) return 'exchange_withdrawal';
  if (!fromIsExchange && toIsExchange) return 'exchange_deposit';
  if (!fromIsExchange && !toIsExchange) return 'whale_transfer';
  return 'unknown';
}

function determineSignificance(symbol: string, valueUsd: number): WhaleTransaction['significance'] {
  const thresholds =
    SIGNIFICANCE_THRESHOLDS[symbol as keyof typeof SIGNIFICANCE_THRESHOLDS] ||
    SIGNIFICANCE_THRESHOLDS.default;

  if (valueUsd >= thresholds.massive) return 'massive';
  if (valueUsd >= thresholds.notable) return 'notable';
  return 'normal';
}

function calculateSummary(transactions: WhaleTransaction[]): WhaleAlertsResponse['summary'] {
  const totalValueUsd = transactions.reduce((sum, tx) => sum + tx.amountUsd, 0);
  const exchangeDeposits = transactions.filter(
    (tx) => tx.transactionType === 'exchange_deposit',
  ).length;
  const exchangeWithdrawals = transactions.filter(
    (tx) => tx.transactionType === 'exchange_withdrawal',
  ).length;
  const largestTransaction =
    transactions.length > 0
      ? transactions.reduce((max, tx) => (tx.amountUsd > max.amountUsd ? tx : max))
      : null;

  return {
    totalTransactions: transactions.length,
    totalValueUsd,
    exchangeDeposits,
    exchangeWithdrawals,
    largestTransaction,
  };
}
