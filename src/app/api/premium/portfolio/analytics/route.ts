/**
 * Premium API - Detailed Portfolio Analytics
 *
 * POST /api/premium/portfolio/analytics
 *
 * Advanced portfolio analytics including:
 * - Correlation matrix between assets
 * - Risk metrics (Sharpe ratio, VaR, max drawdown)
 * - Diversification score
 * - Rebalancing suggestions
 * - Historical performance attribution
 *
 * Price: $0.02 per request
 *
 * @module api/premium/portfolio/analytics
 */

import { NextRequest, NextResponse } from 'next/server';
import { withX402 } from '@x402/next';
import { x402Server, getRouteConfig } from '@/lib/x402-server';
import { getHistoricalPrices, getCoinDetails } from '@/lib/market-data';

export const runtime = 'nodejs';

interface PortfolioHolding {
  coinId: string;
  amount: number;
  entryPrice?: number;
}

interface PortfolioAnalyticsRequest {
  holdings: PortfolioHolding[];
  currency?: string;
  period?: '7d' | '30d' | '90d' | '365d';
}

interface AssetMetrics {
  coinId: string;
  name: string;
  currentPrice: number;
  value: number;
  weight: number;
  return: number;
  volatility: number;
  sharpeRatio: number;
  contribution: number;
}

interface CorrelationPair {
  asset1: string;
  asset2: string;
  correlation: number;
}

interface RiskMetrics {
  portfolioVolatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  valueAtRisk95: number;
  betaToMarket: number;
  diversificationScore: number;
}

interface RebalanceSuggestion {
  coinId: string;
  currentWeight: number;
  targetWeight: number;
  action: 'buy' | 'sell' | 'hold';
  amount: number;
  rationale: string;
}

interface PortfolioAnalyticsResponse {
  totalValue: number;
  totalReturn: number;
  assets: AssetMetrics[];
  correlations: CorrelationPair[];
  riskMetrics: RiskMetrics;
  rebalancing: RebalanceSuggestion[];
  premium: true;
  metadata: {
    generatedAt: string;
    period: string;
    currency: string;
    holdingsCount: number;
  };
}

/**
 * Calculate returns from price array
 */
function calculateReturns(prices: number[]): number[] {
  const returns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
  }
  return returns;
}

/**
 * Calculate correlation between two return series
 */
function calculateCorrelation(returns1: number[], returns2: number[]): number {
  const n = Math.min(returns1.length, returns2.length);
  if (n < 2) return 0;

  const mean1 = returns1.slice(0, n).reduce((a, b) => a + b, 0) / n;
  const mean2 = returns2.slice(0, n).reduce((a, b) => a + b, 0) / n;

  let cov = 0;
  let var1 = 0;
  let var2 = 0;

  for (let i = 0; i < n; i++) {
    const d1 = returns1[i] - mean1;
    const d2 = returns2[i] - mean2;
    cov += d1 * d2;
    var1 += d1 * d1;
    var2 += d2 * d2;
  }

  if (var1 === 0 || var2 === 0) return 0;
  return cov / Math.sqrt(var1 * var2);
}

/**
 * Calculate volatility (annualized standard deviation)
 */
function calculateVolatility(returns: number[]): number {
  if (returns.length < 2) return 0;
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
  return Math.sqrt(variance) * Math.sqrt(365) * 100; // Annualized %
}

/**
 * Calculate Sharpe Ratio
 */
function calculateSharpeRatio(returns: number[], riskFreeRate: number = 0.04): number {
  if (returns.length < 2) return 0;
  const meanReturn = (returns.reduce((a, b) => a + b, 0) / returns.length) * 365; // Annualized
  const volatility = calculateVolatility(returns) / 100;
  if (volatility === 0) return 0;
  return (meanReturn - riskFreeRate) / volatility;
}

/**
 * Calculate Maximum Drawdown
 */
function calculateMaxDrawdown(prices: number[]): number {
  if (prices.length < 2) return 0;

  let maxDD = 0;
  let peak = prices[0];

  for (const price of prices) {
    if (price > peak) peak = price;
    const dd = (peak - price) / peak;
    if (dd > maxDD) maxDD = dd;
  }

  return maxDD * 100;
}

/**
 * Calculate Value at Risk (95%)
 */
function calculateVaR95(returns: number[], portfolioValue: number): number {
  if (returns.length < 20) return portfolioValue * 0.1;
  const sorted = [...returns].sort((a, b) => a - b);
  const index = Math.floor(returns.length * 0.05);
  return Math.abs(sorted[index] || 0) * portfolioValue;
}

/**
 * Generate rebalancing suggestions
 */
function generateRebalancingSuggestions(
  assets: AssetMetrics[],
  totalValue: number
): RebalanceSuggestion[] {
  const suggestions: RebalanceSuggestion[] = [];

  // Simple market-cap weighted target (simplified for demo)
  const targetWeights: Record<string, number> = {
    bitcoin: 0.5,
    ethereum: 0.3,
    // Others split remaining 20%
  };

  for (const asset of assets) {
    const targetWeight = targetWeights[asset.coinId] || 0.2 / Math.max(1, assets.length - 2);
    const weightDiff = targetWeight - asset.weight;
    const amount = Math.abs(weightDiff * totalValue);

    let action: 'buy' | 'sell' | 'hold' = 'hold';
    let rationale = 'Position is balanced';

    if (weightDiff > 0.05) {
      action = 'buy';
      rationale = `Underweight by ${(weightDiff * 100).toFixed(1)}%. Consider adding to position.`;
    } else if (weightDiff < -0.05) {
      action = 'sell';
      rationale = `Overweight by ${(Math.abs(weightDiff) * 100).toFixed(1)}%. Consider reducing position.`;
    }

    suggestions.push({
      coinId: asset.coinId,
      currentWeight: asset.weight,
      targetWeight,
      action,
      amount,
      rationale,
    });
  }

  return suggestions;
}

/**
 * Handler for portfolio analytics endpoint
 */
async function handler(
  request: NextRequest
): Promise<NextResponse<PortfolioAnalyticsResponse | { error: string; message: string }>> {
  if (request.method !== 'POST') {
    return NextResponse.json(
      { error: 'Method not allowed', message: 'Use POST request' },
      { status: 405 }
    );
  }

  let body: PortfolioAnalyticsRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON', message: 'Request body must be valid JSON' },
      { status: 400 }
    );
  }

  const { holdings, currency = 'usd', period = '30d' } = body;

  if (!holdings || !Array.isArray(holdings) || holdings.length === 0) {
    return NextResponse.json(
      { error: 'Invalid holdings', message: 'holdings array is required' },
      { status: 400 }
    );
  }

  if (holdings.length > 50) {
    return NextResponse.json(
      { error: 'Too many holdings', message: 'Maximum 50 holdings allowed' },
      { status: 400 }
    );
  }

  try {
    const days = period === '7d' ? 7 : period === '90d' ? 90 : period === '365d' ? 365 : 30;

    // Fetch data for all holdings in parallel
    const holdingDataPromises = holdings.map(async (h) => {
      const [details, history] = await Promise.all([
        getCoinDetails(h.coinId),
        getHistoricalPrices(h.coinId, days),
      ]);
      return { holding: h, details, history };
    });

    const holdingData = await Promise.all(holdingDataPromises);

    // Calculate asset metrics
    const assetReturns: Map<string, number[]> = new Map();
    const assets: AssetMetrics[] = [];
    let totalValue = 0;

    for (const { holding, details, history } of holdingData) {
      if (!details || !history?.prices) continue;

      const prices = history.prices.map(([, p]: [number, number]) => p).reverse();
      const currentPrice = details.market_data?.current_price?.usd || prices[0] || 0;
      const value = holding.amount * currentPrice;
      totalValue += value;

      const returns = calculateReturns(prices);
      assetReturns.set(holding.coinId, returns);

      const volatility = calculateVolatility(returns);
      const sharpeRatio = calculateSharpeRatio(returns);
      const returnPct =
        prices.length >= 2
          ? ((prices[0] - prices[prices.length - 1]) / prices[prices.length - 1]) * 100
          : 0;

      assets.push({
        coinId: holding.coinId,
        name: details.name || holding.coinId,
        currentPrice,
        value,
        weight: 0, // Will calculate after total
        return: returnPct,
        volatility,
        sharpeRatio,
        contribution: 0, // Will calculate after
      });
    }

    // Calculate weights and contributions
    for (const asset of assets) {
      asset.weight = totalValue > 0 ? asset.value / totalValue : 0;
      asset.contribution = asset.return * asset.weight;
    }

    // Calculate correlations
    const correlations: CorrelationPair[] = [];
    const coinIds = Array.from(assetReturns.keys());

    for (let i = 0; i < coinIds.length; i++) {
      for (let j = i + 1; j < coinIds.length; j++) {
        const returns1 = assetReturns.get(coinIds[i]) || [];
        const returns2 = assetReturns.get(coinIds[j]) || [];
        const correlation = calculateCorrelation(returns1, returns2);
        correlations.push({
          asset1: coinIds[i],
          asset2: coinIds[j],
          correlation: Math.round(correlation * 1000) / 1000,
        });
      }
    }

    // Calculate portfolio-level metrics
    // Simplified portfolio volatility (assuming equal weights for simplicity)
    const allReturns: number[][] = Array.from(assetReturns.values());
    const minLen = Math.min(...allReturns.map((r) => r.length));
    const portfolioReturns: number[] = [];

    for (let i = 0; i < minLen; i++) {
      let dailyReturn = 0;
      for (const asset of assets) {
        const returns = assetReturns.get(asset.coinId) || [];
        dailyReturn += (returns[i] || 0) * asset.weight;
      }
      portfolioReturns.push(dailyReturn);
    }

    // Calculate diversification score based on correlations
    const avgCorrelation =
      correlations.length > 0
        ? correlations.reduce((sum, c) => sum + Math.abs(c.correlation), 0) / correlations.length
        : 1;
    const diversificationScore = Math.round((1 - avgCorrelation) * 100);

    const riskMetrics: RiskMetrics = {
      portfolioVolatility: calculateVolatility(portfolioReturns),
      sharpeRatio: calculateSharpeRatio(portfolioReturns),
      maxDrawdown: calculateMaxDrawdown(
        portfolioReturns.reduce((acc: number[], r, i) => {
          acc.push((acc[i - 1] || 1000) * (1 + r));
          return acc;
        }, [])
      ),
      valueAtRisk95: calculateVaR95(portfolioReturns, totalValue),
      betaToMarket: 1.0, // Would need BTC/market data to calculate properly
      diversificationScore,
    };

    // Generate rebalancing suggestions
    const rebalancing = generateRebalancingSuggestions(assets, totalValue);

    const totalReturn = assets.reduce((sum, a) => sum + a.contribution, 0);

    return NextResponse.json(
      {
        totalValue,
        totalReturn,
        assets,
        correlations,
        riskMetrics,
        rebalancing,
        premium: true,
        metadata: {
          generatedAt: new Date().toISOString(),
          period,
          currency,
          holdingsCount: holdings.length,
        },
      },
      {
        headers: {
          'Cache-Control': 'private, no-store',
        },
      }
    );
  } catch (error) {
    console.error('Error in premium portfolio analytics:', error);
    return NextResponse.json(
      { error: 'Analytics failed', message: String(error) },
      { status: 500 }
    );
  }
}

/**
 * POST /api/premium/portfolio/analytics
 *
 * Premium portfolio analytics - requires x402 payment
 *
 * Request body:
 * {
 *   "holdings": [
 *     { "coinId": "bitcoin", "amount": 0.5, "entryPrice": 40000 },
 *     { "coinId": "ethereum", "amount": 5, "entryPrice": 2500 }
 *   ],
 *   "currency": "usd",
 *   "period": "30d"
 * }
 *
 * @example
 * POST /api/premium/portfolio/analytics
 * Body: { "holdings": [...], "period": "90d" }
 */
export const POST = withX402(
  handler,
  getRouteConfig('/api/premium/portfolio/analytics'),
  x402Server
);
