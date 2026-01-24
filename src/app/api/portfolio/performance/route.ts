/**
 * @fileoverview Portfolio Performance Charts API
 * Generates chart data for portfolio performance visualization
 */

import { NextRequest, NextResponse } from 'next/server';

interface Holding {
  coinId: string;
  symbol: string;
  amount: number;
  buyPrice: number;
  buyDate: string;
}

interface PerformancePoint {
  date: string;
  value: number;
  change: number;
  changePercent: number;
}

interface AssetAllocation {
  symbol: string;
  value: number;
  percentage: number;
  color: string;
}

interface PerformanceData {
  timeframe: string;
  startDate: string;
  endDate: string;
  startValue: number;
  endValue: number;
  totalChange: number;
  totalChangePercent: number;
  highValue: number;
  lowValue: number;
  volatility: number;
  sharpeRatio: number;
  points: PerformancePoint[];
  allocation: AssetAllocation[];
  topPerformers: { symbol: string; change: number }[];
  worstPerformers: { symbol: string; change: number }[];
}

// Color palette for allocation chart
const COLORS = [
  '#f59e0b', // amber
  '#3b82f6', // blue
  '#10b981', // emerald
  '#8b5cf6', // violet
  '#ef4444', // red
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#f97316', // orange
  '#6366f1', // indigo
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { holdings, timeframe = '30d' } = body;

    if (!holdings || !Array.isArray(holdings) || holdings.length === 0) {
      return NextResponse.json(
        { error: 'Holdings array required' },
        { status: 400 }
      );
    }

    const performance = await calculatePerformance(
      holdings as Holding[],
      timeframe
    );

    return NextResponse.json(performance);
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to calculate performance',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

async function calculatePerformance(
  holdings: Holding[],
  timeframe: string
): Promise<PerformanceData> {
  // Calculate date range
  const endDate = new Date();
  const startDate = new Date();

  switch (timeframe) {
    case '7d':
      startDate.setDate(endDate.getDate() - 7);
      break;
    case '30d':
      startDate.setDate(endDate.getDate() - 30);
      break;
    case '90d':
      startDate.setDate(endDate.getDate() - 90);
      break;
    case '1y':
      startDate.setFullYear(endDate.getFullYear() - 1);
      break;
    case 'ytd':
      startDate.setMonth(0, 1);
      break;
    case 'all':
      // Find earliest buy date
      const earliest = holdings.reduce((min, h) => {
        const d = new Date(h.buyDate);
        return d < min ? d : min;
      }, new Date());
      startDate.setTime(earliest.getTime());
      break;
    default:
      startDate.setDate(endDate.getDate() - 30);
  }

  // Fetch historical prices for all coins
  const coinIds = [...new Set(holdings.map((h) => h.coinId))];
  const priceHistory = await fetchPriceHistory(coinIds, startDate, endDate);

  // Generate daily portfolio values
  const points: PerformancePoint[] = [];
  let prevValue = 0;

  const days = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const interval = days > 90 ? 7 : days > 30 ? 3 : 1;

  for (let i = 0; i <= days; i += interval) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];

    let totalValue = 0;
    for (const holding of holdings) {
      const price = getPriceForDate(priceHistory, holding.coinId, dateStr);
      totalValue += holding.amount * price;
    }

    const change = prevValue > 0 ? totalValue - prevValue : 0;
    const changePercent = prevValue > 0 ? (change / prevValue) * 100 : 0;

    points.push({
      date: dateStr,
      value: Math.round(totalValue * 100) / 100,
      change: Math.round(change * 100) / 100,
      changePercent: Math.round(changePercent * 100) / 100,
    });

    prevValue = totalValue;
  }

  // Calculate stats
  const values = points.map((p) => p.value);
  const startValue = values[0] || 0;
  const endValue = values[values.length - 1] || 0;
  const highValue = Math.max(...values);
  const lowValue = Math.min(...values);
  const totalChange = endValue - startValue;
  const totalChangePercent =
    startValue > 0 ? (totalChange / startValue) * 100 : 0;

  // Calculate volatility (standard deviation of daily returns)
  const returns = points
    .slice(1)
    .map((p, i) =>
      points[i].value > 0
        ? (p.value - points[i].value) / points[i].value
        : 0
    );
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance =
    returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) /
    returns.length;
  const volatility = Math.sqrt(variance) * Math.sqrt(365) * 100;

  // Simple Sharpe ratio (assuming risk-free rate of 4%)
  const riskFreeRate = 0.04;
  const annualizedReturn = totalChangePercent * (365 / days);
  const sharpeRatio =
    volatility > 0 ? (annualizedReturn - riskFreeRate) / volatility : 0;

  // Calculate current allocation
  const currentPrices = await fetchCurrentPrices(coinIds);
  const allocation: AssetAllocation[] = [];
  let totalPortfolioValue = 0;

  for (const holding of holdings) {
    const price = currentPrices[holding.coinId] || holding.buyPrice;
    const value = holding.amount * price;
    totalPortfolioValue += value;

    const existing = allocation.find((a) => a.symbol === holding.symbol);
    if (existing) {
      existing.value += value;
    } else {
      allocation.push({
        symbol: holding.symbol,
        value,
        percentage: 0,
        color: COLORS[allocation.length % COLORS.length],
      });
    }
  }

  // Calculate percentages
  allocation.forEach((a) => {
    a.percentage =
      totalPortfolioValue > 0 ? (a.value / totalPortfolioValue) * 100 : 0;
    a.value = Math.round(a.value * 100) / 100;
    a.percentage = Math.round(a.percentage * 10) / 10;
  });

  // Sort by value
  allocation.sort((a, b) => b.value - a.value);

  // Calculate individual coin performance
  const coinPerformance: { symbol: string; change: number }[] = [];
  for (const holding of holdings) {
    const currentPrice = currentPrices[holding.coinId] || holding.buyPrice;
    const change = ((currentPrice - holding.buyPrice) / holding.buyPrice) * 100;

    const existing = coinPerformance.find((c) => c.symbol === holding.symbol);
    if (!existing) {
      coinPerformance.push({
        symbol: holding.symbol,
        change: Math.round(change * 100) / 100,
      });
    }
  }

  coinPerformance.sort((a, b) => b.change - a.change);

  return {
    timeframe,
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    startValue: Math.round(startValue * 100) / 100,
    endValue: Math.round(endValue * 100) / 100,
    totalChange: Math.round(totalChange * 100) / 100,
    totalChangePercent: Math.round(totalChangePercent * 100) / 100,
    highValue: Math.round(highValue * 100) / 100,
    lowValue: Math.round(lowValue * 100) / 100,
    volatility: Math.round(volatility * 100) / 100,
    sharpeRatio: Math.round(sharpeRatio * 100) / 100,
    points,
    allocation,
    topPerformers: coinPerformance.slice(0, 3),
    worstPerformers: coinPerformance.slice(-3).reverse(),
  };
}

async function fetchPriceHistory(
  coinIds: string[],
  startDate: Date,
  endDate: Date
): Promise<Record<string, Record<string, number>>> {
  const history: Record<string, Record<string, number>> = {};

  // Calculate days for CoinGecko API (determines data granularity)
  const days = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Fetch historical data for each coin from CoinGecko
  const fetchPromises = coinIds.map(async (coinId) => {
    try {
      // CoinGecko market_chart API - returns prices for the specified range
      // For 1-90 days: hourly data, 90+ days: daily data
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=${days}&interval=daily`,
        { 
          next: { revalidate: 300 }, // Cache for 5 minutes
          headers: {
            'Accept': 'application/json',
          }
        }
      );

      if (!response.ok) {
        console.error(`CoinGecko API error for ${coinId}: ${response.status}`);
        return { coinId, data: null };
      }

      const data = await response.json();
      return { coinId, data };
    } catch (error) {
      console.error(`Failed to fetch history for ${coinId}:`, error);
      return { coinId, data: null };
    }
  });

  // Process all responses
  const results = await Promise.all(fetchPromises);

  for (const { coinId, data } of results) {
    history[coinId] = {};
    
    if (data && data.prices && Array.isArray(data.prices)) {
      // CoinGecko returns [timestamp, price] pairs
      for (const [timestamp, price] of data.prices) {
        const date = new Date(timestamp);
        const dateStr = date.toISOString().split('T')[0];
        history[coinId][dateStr] = price;
      }
    } else {
      // If API fails, fetch current price and extrapolate back
      // This is a fallback for rate limiting, not mock data
      console.warn(`Using fallback price data for ${coinId}`);
      try {
        const priceResponse = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`,
          { next: { revalidate: 60 } }
        );
        
        if (priceResponse.ok) {
          const priceData = await priceResponse.json();
          const currentPrice = priceData[coinId]?.usd || 0;
          
          // Fill history with current price (no false returns shown)
          for (let i = 0; i <= days; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            const dateStr = date.toISOString().split('T')[0];
            history[coinId][dateStr] = currentPrice;
          }
        }
      } catch (fallbackError) {
        console.error(`Fallback also failed for ${coinId}:`, fallbackError);
      }
    }
  }

  return history;
}

function getPriceForDate(
  priceHistory: Record<string, Record<string, number>>,
  coinId: string,
  date: string
): number {
  const coinHistory = priceHistory[coinId];
  if (!coinHistory) return 0;

  if (coinHistory[date]) return coinHistory[date];

  // Find closest date
  const dates = Object.keys(coinHistory).sort();
  for (let i = dates.length - 1; i >= 0; i--) {
    if (dates[i] <= date) {
      return coinHistory[dates[i]];
    }
  }

  return Object.values(coinHistory)[0] || 0;
}

async function fetchCurrentPrices(
  coinIds: string[]
): Promise<Record<string, number>> {
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinIds.join(',')}&vs_currencies=usd`,
      { next: { revalidate: 60 } }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch prices');
    }

    const data = await response.json();
    const prices: Record<string, number> = {};

    for (const coinId of coinIds) {
      prices[coinId] = data[coinId]?.usd || 0;
    }

    return prices;
  } catch (error) {
    console.error('Failed to fetch prices from CoinGecko:', error);
    // Return zeros on error - no fake data
    return coinIds.reduce(
      (acc, id) => {
        acc[id] = 0;
        return acc;
      },
      {} as Record<string, number>
    );
  }
}
