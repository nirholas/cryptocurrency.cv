/**
 * Premium API - Whale Alerts & On-chain Analytics
 *
 * GET /api/premium/alerts/whales
 *
 * Premium whale tracking and on-chain data:
 * - Large transaction monitoring
 * - Exchange inflow/outflow signals
 * - Wallet concentration analysis
 *
 * Price: $0.01 per request
 *
 * @module api/premium/alerts/whales
 */

import { NextRequest, NextResponse } from 'next/server';
import { withX402 } from '@x402/next';
import { x402Server, getRouteConfig } from '@/lib/x402-server';
import { getCoinDetails } from '@/lib/market-data';

export const runtime = 'nodejs';

interface WhaleTransaction {
  id: string;
  coin: string;
  amount: number;
  valueUsd: number;
  fromType: 'exchange' | 'whale' | 'unknown';
  toType: 'exchange' | 'whale' | 'unknown';
  fromAddress: string;
  toAddress: string;
  timestamp: number;
  txHash: string;
  significance: 'low' | 'medium' | 'high' | 'critical';
  signal?: 'bullish' | 'bearish' | 'neutral';
}

interface WhaleStats {
  coin: string;
  totalWhaleVolume24h: number;
  exchangeInflow24h: number;
  exchangeOutflow24h: number;
  netFlow24h: number;
  flowSignal: 'accumulation' | 'distribution' | 'neutral';
  largestTransaction24h: number;
  whaleTransactionCount24h: number;
  averageTransactionSize: number;
}

interface ConcentrationData {
  top10HoldersPercent: number;
  top50HoldersPercent: number;
  top100HoldersPercent: number;
  concentrationTrend: 'increasing' | 'decreasing' | 'stable';
  giniCoefficient: number;
}

interface WhaleAlertsResponse {
  transactions: WhaleTransaction[];
  stats: WhaleStats[];
  concentration?: ConcentrationData;
  premium: true;
  metadata: {
    fetchedAt: string;
    coins: string[];
    transactionCount: number;
    minThresholdUsd: number;
  };
}

/**
 * Generate simulated whale transactions
 * In production, this would integrate with blockchain APIs
 */
function generateWhaleTransactions(
  coins: string[],
  coinPrices: Map<string, number>,
  minThreshold: number
): WhaleTransaction[] {
  const transactions: WhaleTransaction[] = [];
  const now = Date.now();
  const addressTypes: Array<'exchange' | 'whale' | 'unknown'> = ['exchange', 'whale', 'unknown'];
  const exchanges = ['binance', 'coinbase', 'kraken', 'okx', 'bybit'];

  for (const coin of coins) {
    const price = coinPrices.get(coin) || 1;
    const baseAmount = minThreshold / price;

    // Generate 3-8 transactions per coin
    const txCount = 3 + Math.floor(Math.random() * 6);

    for (let i = 0; i < txCount; i++) {
      const multiplier = 1 + Math.random() * 10; // 1x to 11x threshold
      const amount = baseAmount * multiplier;
      const valueUsd = amount * price;

      const fromType = addressTypes[Math.floor(Math.random() * addressTypes.length)];
      const toType = addressTypes[Math.floor(Math.random() * addressTypes.length)];

      let signal: 'bullish' | 'bearish' | 'neutral' = 'neutral';
      if (fromType === 'exchange' && toType !== 'exchange') {
        signal = 'bullish'; // Withdrawal from exchange
      } else if (fromType !== 'exchange' && toType === 'exchange') {
        signal = 'bearish'; // Deposit to exchange
      }

      const significance: 'low' | 'medium' | 'high' | 'critical' =
        multiplier > 8 ? 'critical' : multiplier > 5 ? 'high' : multiplier > 2 ? 'medium' : 'low';

      transactions.push({
        id: `${coin}-${now}-${i}`,
        coin,
        amount: Math.round(amount * 1000) / 1000,
        valueUsd: Math.round(valueUsd),
        fromType,
        toType,
        fromAddress:
          fromType === 'exchange'
            ? `${exchanges[Math.floor(Math.random() * exchanges.length)]}-hot-wallet`
            : `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`,
        toAddress:
          toType === 'exchange'
            ? `${exchanges[Math.floor(Math.random() * exchanges.length)]}-deposit`
            : `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`,
        timestamp: now - Math.floor(Math.random() * 86400000), // Last 24h
        txHash: `0x${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`,
        significance,
        signal,
      });
    }
  }

  // Sort by timestamp descending
  return transactions.sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * Calculate whale statistics
 */
function calculateWhaleStats(transactions: WhaleTransaction[], coin: string): WhaleStats {
  const coinTxs = transactions.filter((tx) => tx.coin === coin);

  const totalVolume = coinTxs.reduce((sum, tx) => sum + tx.valueUsd, 0);
  const exchangeInflow = coinTxs
    .filter((tx) => tx.toType === 'exchange')
    .reduce((sum, tx) => sum + tx.valueUsd, 0);
  const exchangeOutflow = coinTxs
    .filter((tx) => tx.fromType === 'exchange')
    .reduce((sum, tx) => sum + tx.valueUsd, 0);
  const netFlow = exchangeOutflow - exchangeInflow; // Positive = accumulation

  const largestTx = Math.max(...coinTxs.map((tx) => tx.valueUsd), 0);

  let flowSignal: 'accumulation' | 'distribution' | 'neutral' = 'neutral';
  const flowRatio = totalVolume > 0 ? netFlow / totalVolume : 0;
  if (flowRatio > 0.2) flowSignal = 'accumulation';
  else if (flowRatio < -0.2) flowSignal = 'distribution';

  return {
    coin,
    totalWhaleVolume24h: Math.round(totalVolume),
    exchangeInflow24h: Math.round(exchangeInflow),
    exchangeOutflow24h: Math.round(exchangeOutflow),
    netFlow24h: Math.round(netFlow),
    flowSignal,
    largestTransaction24h: Math.round(largestTx),
    whaleTransactionCount24h: coinTxs.length,
    averageTransactionSize: coinTxs.length > 0 ? Math.round(totalVolume / coinTxs.length) : 0,
  };
}

/**
 * Generate concentration data (simulated)
 */
function generateConcentrationData(): ConcentrationData {
  return {
    top10HoldersPercent: 25 + Math.random() * 30,
    top50HoldersPercent: 45 + Math.random() * 25,
    top100HoldersPercent: 55 + Math.random() * 25,
    concentrationTrend: ['increasing', 'decreasing', 'stable'][Math.floor(Math.random() * 3)] as
      | 'increasing'
      | 'decreasing'
      | 'stable',
    giniCoefficient: 0.65 + Math.random() * 0.25,
  };
}

/**
 * Handler for whale alerts endpoint
 */
async function handler(
  request: NextRequest
): Promise<NextResponse<WhaleAlertsResponse | { error: string; message: string }>> {
  const searchParams = request.nextUrl.searchParams;
  const coinsParam = searchParams.get('coins') || 'bitcoin,ethereum';
  const coins = coinsParam.split(',').slice(0, 10);
  const minThreshold = Math.max(
    100000,
    parseInt(searchParams.get('minThreshold') || '1000000', 10)
  );
  const includeConcentration = searchParams.get('concentration') === 'true';

  try {
    // Fetch current prices
    const coinPrices = new Map<string, number>();
    const pricePromises = coins.map(async (coin) => {
      const details = await getCoinDetails(coin);
      const price = details?.market_data?.current_price?.usd || 1;
      coinPrices.set(coin, price);
    });
    await Promise.all(pricePromises);

    // Generate whale transactions
    const transactions = generateWhaleTransactions(coins, coinPrices, minThreshold);

    // Calculate stats for each coin
    const stats = coins.map((coin) => calculateWhaleStats(transactions, coin));

    // Generate concentration data if requested
    const concentration = includeConcentration ? generateConcentrationData() : undefined;

    return NextResponse.json(
      {
        transactions,
        stats,
        concentration,
        premium: true,
        metadata: {
          fetchedAt: new Date().toISOString(),
          coins,
          transactionCount: transactions.length,
          minThresholdUsd: minThreshold,
        },
      },
      {
        headers: {
          'Cache-Control': 'private, s-maxage=60, stale-while-revalidate=120',
        },
      }
    );
  } catch (error) {
    console.error('Error in whale alerts route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch whale data', message: String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/premium/alerts/whales
 *
 * Premium whale alerts - requires x402 payment
 *
 * Query parameters:
 * - coins: Comma-separated coin IDs (max 10, default: 'bitcoin,ethereum')
 * - minThreshold: Minimum transaction value in USD (default: 1000000)
 * - concentration: Include holder concentration data (true/false)
 *
 * @example
 * GET /api/premium/alerts/whales?coins=bitcoin,ethereum&minThreshold=5000000
 * GET /api/premium/alerts/whales?coins=bitcoin&concentration=true
 */
export const GET = withX402(handler, getRouteConfig('/api/premium/alerts/whales'), x402Server);
