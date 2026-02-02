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
import { withX402 } from '@/lib/x402';
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
 * Fetch real whale transactions from Whale Alert API
 */
async function fetchWhaleTransactions(
  coins: string[],
  coinPrices: Map<string, number>,
  minThreshold: number
): Promise<WhaleTransaction[]> {
  const transactions: WhaleTransaction[] = [];
  const apiKey = process.env.WHALE_ALERT_API_KEY;
  
  // Map coin names to Whale Alert symbols
  const coinToSymbol: Record<string, string> = {
    'bitcoin': 'btc',
    'ethereum': 'eth',
    'ripple': 'xrp',
    'tether': 'usdt',
    'usdc': 'usdc',
    'binancecoin': 'bnb',
    'dogecoin': 'doge',
    'cardano': 'ada',
    'solana': 'sol',
    'polkadot': 'dot',
  };
  
  if (apiKey) {
    // Use Whale Alert API
    try {
      const now = Math.floor(Date.now() / 1000);
      const response = await fetch(
        `https://api.whale-alert.io/v1/transactions?api_key=${apiKey}&min_value=${minThreshold}&start=${now - 86400}`,
        { next: { revalidate: 60 } }
      );
      
      if (response.ok) {
        const data = await response.json();
        for (const tx of data.transactions || []) {
          const coinId = Object.keys(coinToSymbol).find(k => coinToSymbol[k] === tx.symbol.toLowerCase());
          if (!coinId || !coins.includes(coinId)) continue;
          
          const price = coinPrices.get(coinId) || 1;
          const valueUsd = tx.amount_usd || tx.amount * price;
          
          if (valueUsd < minThreshold) continue;
          
          const fromType = tx.from?.owner_type === 'exchange' ? 'exchange' : 
                          tx.from?.owner_type === 'unknown' ? 'unknown' : 'whale';
          const toType = tx.to?.owner_type === 'exchange' ? 'exchange' : 
                        tx.to?.owner_type === 'unknown' ? 'unknown' : 'whale';
          
          let signal: 'bullish' | 'bearish' | 'neutral' = 'neutral';
          if (fromType === 'exchange' && toType !== 'exchange') signal = 'bullish';
          else if (fromType !== 'exchange' && toType === 'exchange') signal = 'bearish';
          
          const multiplier = valueUsd / minThreshold;
          const significance: 'low' | 'medium' | 'high' | 'critical' =
            multiplier > 8 ? 'critical' : multiplier > 5 ? 'high' : multiplier > 2 ? 'medium' : 'low';
          
          transactions.push({
            id: tx.id || `${tx.hash}-${tx.timestamp}`,
            coin: coinId,
            amount: tx.amount,
            valueUsd: Math.round(valueUsd),
            fromType: fromType as 'exchange' | 'whale' | 'unknown',
            toType: toType as 'exchange' | 'whale' | 'unknown',
            fromAddress: tx.from?.address || 'unknown',
            toAddress: tx.to?.address || 'unknown',
            timestamp: tx.timestamp * 1000,
            txHash: tx.hash || '',
            significance,
            signal,
          });
        }
      }
    } catch (error) {
      console.error('Whale Alert API error:', error);
    }
  }
  
  // Fallback to Blockchair API for Bitcoin and Ethereum if no Whale Alert data
  if (transactions.length === 0) {
    for (const coin of coins) {
      const price = coinPrices.get(coin) || 1;
      const minAmount = minThreshold / price;
      
      // Try Blockchair for large transactions
      try {
        const chain = coin === 'bitcoin' ? 'bitcoin' : coin === 'ethereum' ? 'ethereum' : null;
        if (!chain) continue;
        
        const response = await fetch(
          `https://api.blockchair.com/${chain}/transactions?a=time,value&q=value(${Math.floor(minAmount * 1e8)}..)&s=time(desc)&limit=10`,
          { next: { revalidate: 120 } }
        );
        
        if (response.ok) {
          const data = await response.json();
          for (const tx of data.data || []) {
            const amount = chain === 'bitcoin' ? tx.value / 1e8 : tx.value / 1e18;
            const valueUsd = amount * price;
            
            const multiplier = valueUsd / minThreshold;
            const significance: 'low' | 'medium' | 'high' | 'critical' =
              multiplier > 8 ? 'critical' : multiplier > 5 ? 'high' : multiplier > 2 ? 'medium' : 'low';
            
            transactions.push({
              id: `${coin}-${tx.time}-${transactions.length}`,
              coin,
              amount: Math.round(amount * 1000) / 1000,
              valueUsd: Math.round(valueUsd),
              fromType: 'unknown',
              toType: 'unknown',
              fromAddress: 'unknown',
              toAddress: 'unknown',
              timestamp: new Date(tx.time).getTime(),
              txHash: tx.hash || '',
              significance,
              signal: 'neutral',
            });
          }
        }
      } catch {
        // Blockchair may not respond
      }
    }
  }

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
 * Fetch real concentration data from on-chain APIs
 */
async function fetchConcentrationData(coin: string): Promise<ConcentrationData | null> {
  // Try IntoTheBlock API for holder concentration
  try {
    const apiKey = process.env.INTOTHEBLOCK_API_KEY;
    if (apiKey) {
      const response = await fetch(
        `https://api.intotheblock.com/v1/ownership/${coin}`,
        {
          headers: { 'Authorization': `Bearer ${apiKey}` },
          next: { revalidate: 3600 },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        return {
          top10HoldersPercent: data.top10Holders?.percentage || 0,
          top50HoldersPercent: data.top50Holders?.percentage || 0,
          top100HoldersPercent: data.top100Holders?.percentage || 0,
          concentrationTrend: data.trend || 'stable',
          giniCoefficient: data.giniCoefficient || 0,
        };
      }
    }
  } catch {
    // IntoTheBlock may not respond
  }
  
  // Try Nansen or Glassnode alternatives
  try {
    const apiKey = process.env.GLASSNODE_API_KEY;
    if (apiKey && (coin === 'bitcoin' || coin === 'ethereum')) {
      const symbol = coin === 'bitcoin' ? 'BTC' : 'ETH';
      const response = await fetch(
        `https://api.glassnode.com/v1/metrics/distribution/balance_1pct_holders?a=${symbol}&api_key=${apiKey}`,
        { next: { revalidate: 3600 } }
      );
      
      if (response.ok) {
        const data = await response.json();
        const latestData = data[data.length - 1];
        if (latestData) {
          return {
            top10HoldersPercent: latestData.v || 0,
            top50HoldersPercent: 0, // Not available from this endpoint
            top100HoldersPercent: 0,
            concentrationTrend: 'stable',
            giniCoefficient: 0,
          };
        }
      }
    }
  } catch {
    // Glassnode may not respond
  }
  
  // Return null if no data available
  return null;
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

    // Fetch real whale transactions
    const transactions = await fetchWhaleTransactions(coins, coinPrices, minThreshold);

    // Calculate stats for each coin
    const stats = coins.map((coin) => calculateWhaleStats(transactions, coin));

    // Fetch concentration data if requested
    const concentration = includeConcentration 
      ? await fetchConcentrationData(coins[0]) || undefined
      : undefined;

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
export const GET = withX402('/api/premium/alerts/whales', handler);
