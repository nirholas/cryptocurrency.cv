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
 * GET /api/v1/whale-alerts
 *
 * Premium API v1 - Whale Alerts Endpoint
 * Monitors large cryptocurrency transactions across multiple blockchains.
 * Requires x402 payment or valid API key.
 *
 * @price $0.003 per request
 */

import { type NextRequest, NextResponse } from 'next/server';
import { hybridAuthMiddleware } from '@/lib/x402';
import { ApiError } from '@/lib/api-error';
import { createRequestLogger } from '@/lib/logger';
import { COINGECKO_BASE } from '@/lib/constants';

export const runtime = 'nodejs';
export const revalidate = 60;

const ENDPOINT = '/api/v1/whale-alerts';

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

// Known exchange addresses
const EXCHANGE_ADDRESSES: Record<string, string> = {
  '0x28c6c06298d514db089934071355e5743bf21d60': 'Binance',
  '0x21a31ee1afc51d94c2efccaa2092ad1028285549': 'Binance',
  '0xdfd5293d8e347dfe59e90efd55b2956a1343963d': 'Binance',
  '0x503828976d22510aad0339f595c3d6f0ea7b4a77': 'Coinbase',
  '0xddfabcdc4d8ffc6d5beaf154f18b778f892a0740': 'Coinbase',
  '0x71660c4005ba85c37ccec55d0c4493e66fe775d3': 'Coinbase',
  '0x2910543af39aba0cd09dbb2d50200b3e800a63d2': 'Kraken',
  '0x0a869d79a7052c7f1b55a8ebabbea3420f0d1e13': 'Kraken',
  '0x876eabf441b2ee5b5b0554fd502a8e0600950cfa': 'Bitfinex',
  '0xc6cde7c39eb2f0f0095f41570af89efc2c1ea828': 'Bitfinex',
  '0x6cc5f688a315f3dc28a7781717a9a798a59fda7b': 'OKX',
  '0xf89d7b9c864f589bbf53a82105107622b35eaa40': 'Bybit',
};

function determineTransactionType(from: string, to: string): WhaleTransaction['transactionType'] {
  const fromIsExchange = !!EXCHANGE_ADDRESSES[from];
  const toIsExchange = !!EXCHANGE_ADDRESSES[to];

  if (fromIsExchange && !toIsExchange) return 'exchange_withdrawal';
  if (!fromIsExchange && toIsExchange) return 'exchange_deposit';
  if (fromIsExchange && toIsExchange) return 'whale_transfer';
  return 'whale_transfer';
}

function determineSignificance(symbol: string, valueUsd: number): WhaleTransaction['significance'] {
  const thresholds = symbol === 'BTC'
    ? { notable: 10_000_000, massive: 50_000_000 }
    : symbol === 'ETH'
      ? { notable: 5_000_000, massive: 25_000_000 }
      : { notable: 1_000_000, massive: 10_000_000 };

  if (valueUsd >= thresholds.massive) return 'massive';
  if (valueUsd >= thresholds.notable) return 'notable';
  return 'normal';
}

async function fetchEthereumWhaleTransactions(minValueUsd: number): Promise<WhaleTransaction[]> {
  const transactions: WhaleTransaction[] = [];

  try {
    // Get current ETH price
    const priceResponse = await fetch(
      `${COINGECKO_BASE}/simple/price?ids=ethereum&vs_currencies=usd`,
      { next: { revalidate: 60 } }
    );
    const priceData = await priceResponse.json();
    const ethPrice = priceData.ethereum?.usd || 3000;

    // Fetch large transactions from public API
    const publicResponse = await fetch(
      'https://api.blockchair.com/ethereum/transactions?limit=25&s=value(desc)',
      { next: { revalidate: 60 } }
    );

    if (publicResponse.ok) {
      const publicData = await publicResponse.json();

      if (publicData.data && Array.isArray(publicData.data)) {
        for (const tx of publicData.data) {
          const valueEth = parseFloat(tx.value) / 1e18;
          const valueUsd = valueEth * ethPrice;

          if (valueUsd >= minValueUsd) {
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
              timestamp: new Date(tx.time || Date.now()).getTime(),
              transactionType: determineTransactionType(fromAddress, toAddress),
              significance: determineSignificance('ETH', valueUsd),
            });
          }
        }
      }
    }
  } catch {
    // Continue with empty results if API fails
  }

  return transactions;
}

async function fetchBitcoinWhaleTransactions(minValueUsd: number): Promise<WhaleTransaction[]> {
  const transactions: WhaleTransaction[] = [];

  try {
    const priceResponse = await fetch(
      `${COINGECKO_BASE}/simple/price?ids=bitcoin&vs_currencies=usd`,
      { next: { revalidate: 60 } }
    );
    const priceData = await priceResponse.json();
    const btcPrice = priceData.bitcoin?.usd || 60000;

    const publicResponse = await fetch(
      'https://api.blockchair.com/bitcoin/transactions?limit=25&s=output_total(desc)',
      { next: { revalidate: 60 } }
    );

    if (publicResponse.ok) {
      const publicData = await publicResponse.json();

      if (publicData.data && Array.isArray(publicData.data)) {
        for (const tx of publicData.data) {
          const valueBtc = (tx.output_total || 0) / 1e8;
          const valueUsd = valueBtc * btcPrice;

          if (valueUsd >= minValueUsd) {
            transactions.push({
              id: `btc-${tx.hash}`,
              blockchain: 'Bitcoin',
              symbol: 'BTC',
              amount: valueBtc,
              amountUsd: valueUsd,
              from: { address: 'multiple-inputs', ownerType: 'unknown' },
              to: { address: 'multiple-outputs', ownerType: 'unknown' },
              hash: tx.hash,
              timestamp: new Date(tx.time || Date.now()).getTime(),
              transactionType: 'whale_transfer',
              significance: determineSignificance('BTC', valueUsd),
            });
          }
        }
      }
    }
  } catch {
    // Continue with empty results if API fails
  }

  return transactions;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const logger = createRequestLogger(request);
  const startTime = Date.now();

  // Check authentication
  const authResponse = await hybridAuthMiddleware(request, ENDPOINT);
  if (authResponse) return authResponse;

  const { searchParams } = new URL(request.url);
  const blockchain = searchParams.get('blockchain') || 'all';
  const minValue = parseInt(searchParams.get('minValue') || '100000');
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);

  try {
    logger.info('Fetching whale alerts', { blockchain, minValue, limit });

    const [ethTransactions, btcTransactions] = await Promise.all([
      blockchain === 'all' || blockchain === 'ethereum'
        ? fetchEthereumWhaleTransactions(minValue)
        : Promise.resolve([]),
      blockchain === 'all' || blockchain === 'bitcoin'
        ? fetchBitcoinWhaleTransactions(minValue)
        : Promise.resolve([]),
    ]);

    const allTransactions = [...ethTransactions, ...btcTransactions]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);

    const totalValueUsd = allTransactions.reduce((sum, t) => sum + t.amountUsd, 0);
    const exchangeDeposits = allTransactions.filter(t => t.transactionType === 'exchange_deposit').length;
    const exchangeWithdrawals = allTransactions.filter(t => t.transactionType === 'exchange_withdrawal').length;
    const largestTransaction = allTransactions.length > 0
      ? allTransactions.reduce((max, t) => t.amountUsd > max.amountUsd ? t : max)
      : null;

    logger.request(request.method, request.nextUrl.pathname, 200, Date.now() - startTime);

    return NextResponse.json(
      {
        alerts: allTransactions,
        summary: {
          totalTransactions: allTransactions.length,
          totalValueUsd,
          exchangeDeposits,
          exchangeWithdrawals,
          largestTransaction,
        },
        lastUpdated: new Date().toISOString(),
        version: 'v1',
        meta: {
          endpoint: ENDPOINT,
          blockchain,
          minValue,
          timestamp: new Date().toISOString(),
        },
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
          'Access-Control-Allow-Origin': '*',
          'X-Data-Source': 'Blockchair',
        },
      }
    );
  } catch (error) {
    logger.error('Failed to fetch whale alerts', error);
    return ApiError.internal('Failed to fetch whale alerts', error);
  }
}
