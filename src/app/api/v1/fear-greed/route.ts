/**
 * GET /api/v1/fear-greed
 *
 * Premium API v1 - Crypto Fear & Greed Index Endpoint
 * Returns real-time market sentiment data with historical trend analysis
 * from the Alternative.me Fear & Greed API.
 * Requires x402 payment or valid API key.
 *
 * @price $0.002 per request
 */

import { NextRequest, NextResponse } from 'next/server';
import { hybridAuthMiddleware } from '@/lib/x402';
import { ApiError } from '@/lib/api-error';
import { createRequestLogger } from '@/lib/logger';

export const runtime = 'edge';
export const revalidate = 300;

const ENDPOINT = '/api/v1/fear-greed';

interface FearGreedData {
  value: number;
  valueClassification: 'Extreme Fear' | 'Fear' | 'Neutral' | 'Greed' | 'Extreme Greed';
  timestamp: number;
  timeUntilUpdate: string;
}

function getClassification(value: number): FearGreedData['valueClassification'] {
  if (value <= 20) return 'Extreme Fear';
  if (value <= 40) return 'Fear';
  if (value <= 60) return 'Neutral';
  if (value <= 80) return 'Greed';
  return 'Extreme Greed';
}

function calculateTrend(historical: FearGreedData[]) {
  const current = historical[0]?.value || 50;
  const data7d = historical.slice(0, 7);
  const data30d = historical.slice(0, 30);

  const avg7d = data7d.length > 0
    ? data7d.reduce((sum, d: FearGreedData) => sum + d.value, 0) / data7d.length
    : current;

  const avg30d = data30d.length > 0
    ? data30d.reduce((sum, d: FearGreedData) => sum + d.value, 0) / data30d.length
    : current;

  const value7dAgo = historical[6]?.value || current;
  const value30dAgo = historical[29]?.value || current;

  const change7d = current - value7dAgo;
  const change30d = current - value30dAgo;

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

export async function GET(request: NextRequest): Promise<NextResponse> {
  const logger = createRequestLogger(request);
  const startTime = Date.now();

  // Check authentication
  const authResponse = await hybridAuthMiddleware(request, ENDPOINT);
  if (authResponse) return authResponse;

  const { searchParams } = new URL(request.url);
  const days = Math.min(parseInt(searchParams.get('days') || '30'), 365);

  try {
    logger.info('Fetching Fear & Greed index', { days });

    const [currentResponse, historicalResponse] = await Promise.all([
      fetch('https://api.alternative.me/fng/', { next: { revalidate: 300 } }),
      fetch(`https://api.alternative.me/fng/?limit=${days}`, { next: { revalidate: 3600 } }),
    ]);

    if (!currentResponse.ok || !historicalResponse.ok) {
      throw new Error('Failed to fetch Fear & Greed data');
    }

    const currentData = await currentResponse.json();
    const historicalData = await historicalResponse.json();

    if (!currentData.data?.[0] || !historicalData.data) {
      throw new Error('Invalid response from Fear & Greed API');
    }

    const current: FearGreedData = {
      value: parseInt(currentData.data[0].value),
      valueClassification: getClassification(parseInt(currentData.data[0].value)),
      timestamp: parseInt(currentData.data[0].timestamp) * 1000,
      timeUntilUpdate: currentData.data[0].time_until_update || 'Unknown',
    };

    const historical: FearGreedData[] = historicalData.data.map(
      (item: { value: string; timestamp: string; time_until_update?: string }) => ({
        value: parseInt(item.value),
        valueClassification: getClassification(parseInt(item.value)),
        timestamp: parseInt(item.timestamp) * 1000,
        timeUntilUpdate: item.time_until_update || '',
      })
    );

    const trend = calculateTrend(historical);

    logger.request(request.method, request.nextUrl.pathname, 200, Date.now() - startTime);

    return NextResponse.json(
      {
        current,
        historical,
        trend,
        lastUpdated: new Date().toISOString(),
        version: 'v1',
        meta: {
          endpoint: ENDPOINT,
          days,
          dataPoints: historical.length,
          timestamp: new Date().toISOString(),
        },
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          'Access-Control-Allow-Origin': '*',
          'X-Data-Source': 'Alternative.me',
        },
      }
    );
  } catch (error) {
    logger.error('Failed to fetch Fear & Greed index', error);
    return ApiError.internal('Failed to fetch Fear & Greed index', error);
  }
}
