/**
 * Premium API - AI-Powered Market Analysis
 *
 * POST /api/premium/ai/analyze
 *
 * Premium AI analysis endpoint powered by Groq:
 * - Technical analysis with pattern recognition
 * - Sentiment analysis from social/news
 * - Price prediction signals
 * - Portfolio optimization suggestions
 *
 * Price: $0.05 per request
 *
 * @module api/premium/ai/analyze
 */

import { NextRequest, NextResponse } from 'next/server';
import { withX402 } from '@/lib/x402';
import { getCoinDetails, getHistoricalPrices, getFearGreedIndex } from '@/lib/market-data';
import { callGroq, parseGroqJson, isGroqConfigured, type GroqMessage } from '@/lib/groq';

export const runtime = 'nodejs';

interface AnalysisRequest {
  coinId: string;
  analysisType: 'technical' | 'sentiment' | 'full';
  timeframe?: '1d' | '7d' | '30d' | '90d';
}

interface TechnicalIndicators {
  rsi: number;
  rsiSignal: 'overbought' | 'oversold' | 'neutral';
  sma20: number;
  sma50: number;
  smaSignal: 'bullish' | 'bearish' | 'neutral';
  volatility: number;
  volatilityLevel: 'low' | 'medium' | 'high' | 'extreme';
  support: number;
  resistance: number;
  trend: 'uptrend' | 'downtrend' | 'sideways';
  momentum: 'strong_bullish' | 'bullish' | 'neutral' | 'bearish' | 'strong_bearish';
}

interface SentimentData {
  fearGreedIndex: number;
  fearGreedLabel: string;
  socialScore: number;
  communityScore: number;
  developerScore: number;
  publicInterestScore: number;
  overallSentiment: 'very_bearish' | 'bearish' | 'neutral' | 'bullish' | 'very_bullish';
}

interface AIAnalysisResult {
  coinId: string;
  coinName: string;
  currentPrice: number;
  analysisType: string;
  timeframe: string;
  technical?: TechnicalIndicators;
  sentiment?: SentimentData;
  aiInsights: {
    summary: string;
    keyPoints: string[];
    signals: {
      type: 'buy' | 'hold' | 'sell';
      confidence: number;
      rationale: string;
    };
    risks: string[];
    opportunities: string[];
  };
  premium: true;
  metadata: {
    generatedAt: string;
    dataFreshness: string;
    model: string;
  };
}

/**
 * Calculate RSI from price data
 */
function calculateRSI(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) return 50;

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) gains += change;
    else losses -= change;
  }

  const avgGain = gains / period;
  const avgLoss = losses / period;

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

/**
 * Calculate Simple Moving Average
 */
function calculateSMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1] || 0;
  const slice = prices.slice(0, period);
  return slice.reduce((sum, p) => sum + p, 0) / period;
}

/**
 * Calculate volatility (standard deviation)
 */
function calculateVolatility(prices: number[]): number {
  if (prices.length < 2) return 0;
  const returns = prices.slice(1).map((p, i) => (p - prices[i]) / prices[i]);
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
  return Math.sqrt(variance) * Math.sqrt(365) * 100; // Annualized volatility %
}

/**
 * Find support and resistance levels
 */
function findSupportResistance(prices: number[]): { support: number; resistance: number } {
  const sorted = [...prices].sort((a, b) => a - b);
  const len = sorted.length;
  return {
    support: sorted[Math.floor(len * 0.1)] || sorted[0],
    resistance: sorted[Math.floor(len * 0.9)] || sorted[len - 1],
  };
}

/**
 * Determine trend direction
 */
function determineTrend(
  sma20: number,
  sma50: number,
  currentPrice: number
): 'uptrend' | 'downtrend' | 'sideways' {
  const diff = Math.abs(sma20 - sma50) / sma50;
  if (diff < 0.02) return 'sideways';
  if (sma20 > sma50 && currentPrice > sma20) return 'uptrend';
  if (sma20 < sma50 && currentPrice < sma20) return 'downtrend';
  return 'sideways';
}

/**
 * Generate AI analysis using Groq
 */
async function generateAIInsights(
  coinName: string,
  technical: TechnicalIndicators | null,
  sentiment: SentimentData | null,
  priceChange24h: number
): Promise<AIAnalysisResult['aiInsights']> {
  const technicalContext = technical
    ? `
Technical Indicators:
- RSI: ${technical.rsi.toFixed(1)} (${technical.rsiSignal})
- Trend: ${technical.trend}
- Momentum: ${technical.momentum}
- Volatility: ${technical.volatility.toFixed(1)}% (${technical.volatilityLevel})
- SMA20 vs SMA50: ${technical.smaSignal}
- Support: $${technical.support.toFixed(2)}, Resistance: $${technical.resistance.toFixed(2)}
`
    : '';

  const sentimentContext = sentiment
    ? `
Sentiment Indicators:
- Fear & Greed Index: ${sentiment.fearGreedIndex} (${sentiment.fearGreedLabel})
- Community Score: ${sentiment.communityScore}
- Developer Score: ${sentiment.developerScore}
- Overall Sentiment: ${sentiment.overallSentiment}
`
    : '';

  const prompt = `Analyze ${coinName} cryptocurrency based on the following data:

24h Price Change: ${priceChange24h > 0 ? '+' : ''}${priceChange24h.toFixed(2)}%

${technicalContext}
${sentimentContext}

Provide a JSON response with:
1. A 2-3 sentence summary
2. 3-5 key points
3. Trading signal (buy/hold/sell) with confidence (0-100) and rationale
4. 2-3 risks
5. 2-3 opportunities

Response format:
{
  "summary": "...",
  "keyPoints": ["...", "..."],
  "signal": { "type": "hold", "confidence": 65, "rationale": "..." },
  "risks": ["...", "..."],
  "opportunities": ["...", "..."]
}`;

  if (!isGroqConfigured) {
    // Return default analysis if Groq not configured
    return {
      summary: `${coinName} analysis based on technical and sentiment indicators. The market shows ${technical?.trend || 'mixed'} conditions with ${sentiment?.overallSentiment || 'neutral'} sentiment.`,
      keyPoints: [
        `RSI at ${technical?.rsi?.toFixed(1) || 'N/A'} indicates ${technical?.rsiSignal || 'neutral'} conditions`,
        `Current trend is ${technical?.trend || 'sideways'}`,
        `Fear & Greed Index at ${sentiment?.fearGreedIndex || 'N/A'}`,
      ],
      signals: {
        type: 'hold',
        confidence: 50,
        rationale: 'Limited data for high-confidence signal',
      },
      risks: ['Market volatility remains a concern', 'Macro conditions may affect crypto markets'],
      opportunities: [
        'Long-term fundamentals remain strong',
        'Current levels may offer entry points for patient investors',
      ],
    };
  }

  try {
    const response = await callGroq(
      [
        {
          role: 'system',
          content: 'You are a cryptocurrency analyst. Respond only with valid JSON.',
        },
        { role: 'user', content: prompt },
      ],
      {
        model: 'llama-3.3-70b-versatile',
        temperature: 0.3,
        maxTokens: 1000,
        jsonMode: true,
      }
    );

    const content = response.content || '{}';
    const parsed = JSON.parse(content);

    return {
      summary: parsed.summary || 'Analysis unavailable',
      keyPoints: parsed.keyPoints || [],
      signals: {
        type: parsed.signal?.type || 'hold',
        confidence: parsed.signal?.confidence || 50,
        rationale: parsed.signal?.rationale || 'Insufficient data',
      },
      risks: parsed.risks || [],
      opportunities: parsed.opportunities || [],
    };
  } catch (error) {
    console.error('AI analysis error:', error);
    return {
      summary: 'AI analysis temporarily unavailable',
      keyPoints: ['Technical indicators processed', 'Sentiment data analyzed'],
      signals: { type: 'hold', confidence: 0, rationale: 'Error in AI processing' },
      risks: ['Analysis incomplete'],
      opportunities: ['Retry analysis'],
    };
  }
}

/**
 * Handler for AI analysis endpoint
 */
async function handler(
  request: NextRequest
): Promise<NextResponse<AIAnalysisResult | { error: string; message: string }>> {
  if (request.method !== 'POST') {
    return NextResponse.json(
      { error: 'Method not allowed', message: 'Use POST request' },
      { status: 405 }
    );
  }

  let body: AnalysisRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON', message: 'Request body must be valid JSON' },
      { status: 400 }
    );
  }

  const { coinId, analysisType = 'full', timeframe = '30d' } = body;

  if (!coinId) {
    return NextResponse.json(
      { error: 'Missing parameter', message: 'coinId is required' },
      { status: 400 }
    );
  }

  try {
    // Fetch coin data
    const [coinDetails, historicalData, fearGreed] = await Promise.all([
      getCoinDetails(coinId),
      getHistoricalPrices(
        coinId,
        timeframe === '1d' ? 1 : timeframe === '7d' ? 7 : timeframe === '90d' ? 90 : 30
      ),
      getFearGreedIndex(),
    ]);

    if (!coinDetails) {
      return NextResponse.json(
        { error: 'Coin not found', message: `Could not find coin with ID: ${coinId}` },
        { status: 404 }
      );
    }

    const currentPrice = coinDetails.market_data?.current_price?.usd || 0;
    const priceChange24h = coinDetails.market_data?.price_change_percentage_24h || 0;

    // Calculate technical indicators
    let technical: TechnicalIndicators | null = null;
    if (analysisType === 'technical' || analysisType === 'full') {
      const prices = (historicalData?.prices || [])
        .map(([, price]: [number, number]) => price)
        .reverse();

      const rsi = calculateRSI(prices);
      const sma20 = calculateSMA(prices, 20);
      const sma50 = calculateSMA(prices, 50);
      const volatility = calculateVolatility(prices);
      const { support, resistance } = findSupportResistance(prices);
      const trend = determineTrend(sma20, sma50, currentPrice);

      technical = {
        rsi,
        rsiSignal: rsi > 70 ? 'overbought' : rsi < 30 ? 'oversold' : 'neutral',
        sma20,
        sma50,
        smaSignal: sma20 > sma50 ? 'bullish' : sma20 < sma50 ? 'bearish' : 'neutral',
        volatility,
        volatilityLevel:
          volatility > 100
            ? 'extreme'
            : volatility > 60
              ? 'high'
              : volatility > 30
                ? 'medium'
                : 'low',
        support,
        resistance,
        trend,
        momentum:
          rsi > 70 && trend === 'uptrend'
            ? 'strong_bullish'
            : rsi > 55 && trend === 'uptrend'
              ? 'bullish'
              : rsi < 30 && trend === 'downtrend'
                ? 'strong_bearish'
                : rsi < 45 && trend === 'downtrend'
                  ? 'bearish'
                  : 'neutral',
      };
    }

    // Calculate sentiment
    let sentiment: SentimentData | null = null;
    if (analysisType === 'sentiment' || analysisType === 'full') {
      const fgIndex = fearGreed?.value || 50;
      const socialScore = coinDetails.community_score || 0;
      const communityScore = coinDetails.community_data?.twitter_followers || 0;
      const developerScore = coinDetails.developer_score || 0;
      const publicInterestScore = coinDetails.public_interest_score || 0;

      // Calculate overall sentiment
      const avgScore = (fgIndex + socialScore * 10 + developerScore * 10) / 3;
      const overallSentiment =
        avgScore >= 80
          ? 'very_bullish'
          : avgScore >= 60
            ? 'bullish'
            : avgScore >= 40
              ? 'neutral'
              : avgScore >= 20
                ? 'bearish'
                : 'very_bearish';

      sentiment = {
        fearGreedIndex: fgIndex,
        fearGreedLabel:
          fgIndex >= 80
            ? 'Extreme Greed'
            : fgIndex >= 60
              ? 'Greed'
              : fgIndex >= 40
                ? 'Neutral'
                : fgIndex >= 20
                  ? 'Fear'
                  : 'Extreme Fear',
        socialScore,
        communityScore: communityScore > 1000000 ? 10 : Math.round((communityScore / 1000000) * 10),
        developerScore,
        publicInterestScore,
        overallSentiment,
      };
    }

    // Generate AI insights
    const aiInsights = await generateAIInsights(
      coinDetails.name || coinId,
      technical,
      sentiment,
      priceChange24h
    );

    return NextResponse.json(
      {
        coinId,
        coinName: coinDetails.name || coinId,
        currentPrice,
        analysisType,
        timeframe,
        technical: technical || undefined,
        sentiment: sentiment || undefined,
        aiInsights,
        premium: true,
        metadata: {
          generatedAt: new Date().toISOString(),
          dataFreshness: 'real-time',
          model: isGroqConfigured() ? 'llama-3.3-70b-versatile' : 'rule-based',
        },
      },
      {
        headers: {
          'Cache-Control': 'private, no-store',
        },
      }
    );
  } catch (error) {
    console.error('Error in premium AI analysis route:', error);
    return NextResponse.json({ error: 'Analysis failed', message: String(error) }, { status: 500 });
  }
}

/**
 * POST /api/premium/ai/analyze
 *
 * Premium AI analysis endpoint - requires x402 payment
 *
 * Request body:
 * {
 *   "coinId": "bitcoin",           // Required: Coin ID
 *   "analysisType": "full",        // 'technical', 'sentiment', or 'full'
 *   "timeframe": "30d"             // '1d', '7d', '30d', or '90d'
 * }
 *
 * @example
 * POST /api/premium/ai/analyze
 * Body: { "coinId": "bitcoin", "analysisType": "full", "timeframe": "30d" }
 */
export const POST = withX402('/api/premium/ai/analyze', handler);
