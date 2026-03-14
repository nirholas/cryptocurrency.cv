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
 * @fileoverview Crypto Fear & Greed Index API
 * Fetches real-time market sentiment data from Alternative.me API
 * and provides historical trend analysis
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getPipelineFearGreed } from '@/lib/data-pipeline';
import { registry } from '@/lib/providers/registry';
import type { FearGreedIndex } from '@/lib/providers/adapters/fear-greed';
import { instrumented } from '@/lib/telemetry-middleware';

interface FearGreedData {
  value: number;
  valueClassification: 'Extreme Fear' | 'Fear' | 'Neutral' | 'Greed' | 'Extreme Greed';
  timestamp: number;
  timeUntilUpdate: string;
}

interface FearGreedResponse {
  current: FearGreedData;
  historical: FearGreedData[];
  trend: {
    direction: 'improving' | 'worsening' | 'stable';
    change7d: number;
    change30d: number;
    averageValue7d: number;
    averageValue30d: number;
  };
  breakdown: {
    volatility: { value: number; weight: number };
    marketMomentum: { value: number; weight: number };
    socialMedia: { value: number; weight: number };
    surveys: { value: number; weight: number };
    dominance: { value: number; weight: number };
    trends: { value: number; weight: number };
  };
  lastUpdated: string;
}

// Classification based on index value
function getClassification(value: number): FearGreedData['valueClassification'] {
  if (value <= 20) return 'Extreme Fear';
  if (value <= 40) return 'Fear';
  if (value <= 60) return 'Neutral';
  if (value <= 80) return 'Greed';
  return 'Extreme Greed';
}

export const GET = instrumented(async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

    // Pipeline cache-first: serve pre-fetched data if available
    if (days <= 30) {
      try {
        const pipelineData = await getPipelineFearGreed();
        if (pipelineData?.current) {
          return NextResponse.json({
            ...pipelineData,
            _cache: 'pipeline',
          });
        }
      } catch { /* pipeline miss — fetch upstream */ }
    }

    // Provider framework: circuit breakers, caching, fallback between Alternative.me + CoinStats
    try {
      const result = await registry.fetch<FearGreedIndex>('fear-greed', { limit: Math.min(days, 365) });
      const fgData = result.data;

      const current: FearGreedData = {
        value: fgData.value,
        valueClassification: getClassification(fgData.value),
        timestamp: new Date(fgData.timestamp).getTime(),
        timeUntilUpdate: 'Unknown',
      };

      const trend = calculateTrend([current]);
      const breakdown = await calculateBreakdown();

      return NextResponse.json({
        current,
        historical: [current],
        trend,
        breakdown,
        lastUpdated: fgData.lastUpdated,
        _provider: result.lineage.provider,
        _confidence: result.lineage.confidence,
        _cached: result.cached,
      });
    } catch { /* provider chain miss — fall through to direct fetch */ }

    // Fallback: direct API call (legacy path — kept for resilience)
    const [currentResponse, historicalResponse] = await Promise.all([
      fetch('https://api.alternative.me/fng/', { next: { revalidate: 300 } }),
      fetch(`https://api.alternative.me/fng/?limit=${Math.min(days, 365)}`, {
        next: { revalidate: 3600 },
      }),
    ]);

    if (!currentResponse.ok || !historicalResponse.ok) {
      throw new Error('Failed to fetch Fear & Greed data');
    }

    const currentData = await currentResponse.json();
    const historicalData = await historicalResponse.json();

    if (!currentData.data?.[0] || !historicalData.data) {
      throw new Error('Invalid response from Fear & Greed API');
    }

    // Parse current value
    const current: FearGreedData = {
      value: parseInt(currentData.data[0].value),
      valueClassification: getClassification(parseInt(currentData.data[0].value)),
      timestamp: parseInt(currentData.data[0].timestamp) * 1000,
      timeUntilUpdate: currentData.data[0].time_until_update || 'Unknown',
    };

    // Parse historical data
    const historical: FearGreedData[] = historicalData.data.map(
      (item: { value: string; timestamp: string; time_until_update?: string }) => ({
        value: parseInt(item.value),
        valueClassification: getClassification(parseInt(item.value)),
        timestamp: parseInt(item.timestamp) * 1000,
        timeUntilUpdate: item.time_until_update || '',
      })
    );

    // Calculate trend analysis
    const trend = calculateTrend(historical);

    // Calculate breakdown (estimated based on market data)
    const breakdown = await calculateBreakdown();

    const response: FearGreedResponse = {
      current,
      historical,
      trend,
      breakdown,
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Fear & Greed API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch Fear & Greed index',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

function calculateTrend(historical: FearGreedData[]): FearGreedResponse['trend'] {
  const current = historical[0]?.value || 50;
  
  // Get 7-day and 30-day data
  const data7d = historical.slice(0, 7);
  const data30d = historical.slice(0, 30);

  const avg7d = data7d.length > 0
    ? data7d.reduce((sum, d) => sum + d.value, 0) / data7d.length
    : current;

  const avg30d = data30d.length > 0
    ? data30d.reduce((sum, d) => sum + d.value, 0) / data30d.length
    : current;

  const value7dAgo = historical[6]?.value || current;
  const value30dAgo = historical[29]?.value || current;

  const change7d = current - value7dAgo;
  const change30d = current - value30dAgo;

  // Determine trend direction
  let direction: 'improving' | 'worsening' | 'stable';
  if (change7d > 5) {
    direction = 'improving';
  } else if (change7d < -5) {
    direction = 'worsening';
  } else {
    direction = 'stable';
  }

  return {
    direction,
    change7d: Math.round(change7d),
    change30d: Math.round(change30d),
    averageValue7d: Math.round(avg7d),
    averageValue30d: Math.round(avg30d),
  };
}

async function calculateBreakdown(): Promise<FearGreedResponse['breakdown']> {
  try {
    // Fetch real market data to estimate breakdown
    const [btcData, marketData] = await Promise.all([
      fetch(
        'https://api.coingecko.com/api/v3/coins/bitcoin?localization=false&tickers=false&community_data=false&developer_data=false',
        { next: { revalidate: 300 } }
      ),
      fetch(
        'https://api.coingecko.com/api/v3/global',
        { next: { revalidate: 300 } }
      ),
    ]);

    const btc = btcData.ok ? await btcData.json() : null;
    const market = marketData.ok ? await marketData.json() : null;

    // Calculate volatility component (based on 24h change)
    const priceChange24h = btc?.market_data?.price_change_percentage_24h || 0;
    const volatilityValue = Math.max(0, Math.min(100, 50 + priceChange24h * 2));

    // Calculate momentum (based on 7d and 30d price changes)
    const priceChange7d = btc?.market_data?.price_change_percentage_7d || 0;
    const momentumValue = Math.max(0, Math.min(100, 50 + priceChange7d * 3));

    // Calculate dominance component
    const btcDominance = market?.data?.market_cap_percentage?.btc || 50;
    const dominanceValue = btcDominance > 50 ? 40 + (btcDominance - 50) : 60 - (50 - btcDominance);

    // Market cap change as proxy for social/trends
    const marketCapChange = market?.data?.market_cap_change_percentage_24h_usd || 0;
    const socialValue = Math.max(0, Math.min(100, 50 + marketCapChange * 5));
    const trendsValue = Math.max(0, Math.min(100, 50 + marketCapChange * 3));

    return {
      volatility: { value: Math.round(volatilityValue), weight: 25 },
      marketMomentum: { value: Math.round(momentumValue), weight: 25 },
      socialMedia: { value: Math.round(socialValue), weight: 15 },
      // Surveys: Set to neutral (50) as proprietary survey data is not publicly available.
      // The neutral value ensures this component doesn't skew the index while maintaining
      // the weighted calculation structure. Weight of 15% reflects reduced confidence.
      surveys: { value: 50, weight: 15 },
      dominance: { value: Math.round(dominanceValue), weight: 10 },
      trends: { value: Math.round(trendsValue), weight: 10 },
    };
  } catch {
    // Return neutral values on error
    return {
      volatility: { value: 50, weight: 25 },
      marketMomentum: { value: 50, weight: 25 },
      socialMedia: { value: 50, weight: 15 },
      surveys: { value: 50, weight: 15 },
      dominance: { value: 50, weight: 10 },
      trends: { value: 50, weight: 10 },
    };
  }
}
