/**
 * Premium AI Features
 *
 * AI-powered analysis endpoints for premium subscribers.
 * Uses OpenRouter/Groq for LLM inference.
 *
 * @module premium-ai
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTopCoins, getCoinDetails } from '@/lib/market-data';
import { getLatestNews } from '@/lib/crypto-news';
import { validateQuery } from '@/lib/validation-middleware';
import { aiSignalsQuerySchema } from '@/lib/schemas';

// =============================================================================
// TYPES
// =============================================================================

interface SentimentResult {
  overall: 'bullish' | 'bearish' | 'neutral';
  score: number; // -1 to 1
  confidence: number; // 0 to 1
  factors: {
    news: number;
    social: number;
    technical: number;
  };
  summary: string;
  articles: Array<{
    title: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    source: string;
  }>;
}

interface TradingSignal {
  coin: string;
  action: 'buy' | 'sell' | 'hold';
  strength: 'strong' | 'moderate' | 'weak';
  confidence: number;
  reasoning: string;
  indicators: {
    trend: 'up' | 'down' | 'sideways';
    momentum: number;
    volume: 'high' | 'normal' | 'low';
  };
  entry?: number;
  target?: number;
  stopLoss?: number;
}

interface CoinComparison {
  coins: string[];
  recommendation: string;
  rankings: Array<{
    coin: string;
    score: number;
    strengths: string[];
    weaknesses: string[];
  }>;
  summary: string;
}

interface MarketSummary {
  coin: string;
  overview: string;
  priceAnalysis: string;
  recentNews: string;
  outlook: 'bullish' | 'bearish' | 'neutral';
  keyMetrics: {
    price: number;
    change24h: number;
    marketCap: number;
    volume: number;
  };
}

// =============================================================================
// HELPERS
// =============================================================================

function getSentimentFromChange(change: number): 'bullish' | 'bearish' | 'neutral' {
  if (change > 5) return 'bullish';
  if (change < -5) return 'bearish';
  return 'neutral';
}

function getSignalFromChange(change: number): 'buy' | 'sell' | 'hold' {
  if (change > 10) return 'buy';
  if (change < -10) return 'sell';
  return 'hold';
}

// =============================================================================
// PREMIUM AI HANDLERS
// =============================================================================

/**
 * Analyze market sentiment for a coin
 */
export async function analyzeSentiment(request: NextRequest): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams;
  const coin = searchParams.get('coin') || 'bitcoin';

  try {
    // Get market data and news
    const [coinData, news] = await Promise.all([
      getCoinDetails(coin),
      getLatestNews(10),
    ]);

    if (!coinData) {
      return NextResponse.json(
        { error: 'Coin not found' },
        { status: 404 }
      );
    }

    const change24h = coinData.market_data?.price_change_percentage_24h || 0;
    const change7d = coinData.market_data?.price_change_percentage_7d || 0;

    // Analyze news sentiment (simplified)
    const newsArticles = news.articles.slice(0, 5).map((article) => ({
      title: article.title,
      sentiment: (article.title.toLowerCase().includes('surge') ||
        article.title.toLowerCase().includes('rally') ||
        article.title.toLowerCase().includes('bullish')
        ? 'positive'
        : article.title.toLowerCase().includes('crash') ||
          article.title.toLowerCase().includes('drop') ||
          article.title.toLowerCase().includes('bearish')
        ? 'negative'
        : 'neutral') as 'positive' | 'negative' | 'neutral',
      source: article.source,
    }));

    const positiveNews = newsArticles.filter((a) => a.sentiment === 'positive').length;
    const negativeNews = newsArticles.filter((a) => a.sentiment === 'negative').length;
    const newsSentiment = (positiveNews - negativeNews) / Math.max(newsArticles.length, 1);

    const technicalScore = (change24h + change7d) / 20; // Normalized

    const overallScore = (newsSentiment + technicalScore) / 2;

    // Calculate confidence based on data quality:
    // - More news articles = higher confidence (up to +0.2 for 5+ articles)
    // - News agreement = higher confidence (all same sentiment = +0.15)
    // - Strong price signal = higher confidence (>10% move = +0.15)
    // Base confidence starts at 0.5
    let confidence = 0.5;
    
    // Article count factor (more data = more confident)
    const articleCountFactor = Math.min(newsArticles.length / 5, 1) * 0.2;
    confidence += articleCountFactor;
    
    // Sentiment agreement factor (all articles agree = higher confidence)
    const totalClassified = positiveNews + negativeNews;
    const agreementRatio = totalClassified > 0 
      ? Math.max(positiveNews, negativeNews) / totalClassified 
      : 0.5;
    confidence += (agreementRatio - 0.5) * 0.3;
    
    // Price signal strength factor (strong moves = higher confidence)
    const priceSignalStrength = Math.min(Math.abs(change24h) / 10, 1) * 0.15;
    confidence += priceSignalStrength;
    
    // Ensure confidence is within valid range [0.35, 0.95]
    confidence = Math.max(0.35, Math.min(0.95, confidence));

    const result: SentimentResult = {
      overall: getSentimentFromChange(overallScore * 10),
      score: Math.max(-1, Math.min(1, overallScore)),
      confidence,
      factors: {
        news: Math.max(-1, Math.min(1, newsSentiment)),
        social: 0, // Would require social API
        technical: Math.max(-1, Math.min(1, technicalScore)),
      },
      summary: `${coinData.name} shows ${getSentimentFromChange(overallScore * 10)} sentiment based on recent price action (${change24h > 0 ? '+' : ''}${change24h.toFixed(2)}% 24h) and news coverage.`,
      articles: newsArticles,
    };

    return NextResponse.json({
      data: result,
      premium: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error analyzing sentiment:', error);
    return NextResponse.json(
      { error: 'Failed to analyze sentiment', message: String(error) },
      { status: 500 }
    );
  }
}

/**
 * Generate trading signals
 */
export async function generateSignals(request: NextRequest): Promise<NextResponse> {
  // Validate query parameters - note: using 'coins' instead of 'coin' for backwards compatibility
  const searchParams = request.nextUrl.searchParams;
  const coinsParam = searchParams.get('coins');
  const coins = coinsParam?.split(',') || ['bitcoin', 'ethereum'];
  
  // Validate individual coin parameter if provided
  const coinParam = searchParams.get('coin');
  if (coinParam) {
    // Use the aiSignalsQuerySchema for single coin validation
    const validation = validateQuery(request, aiSignalsQuerySchema);
    if (!validation.success) {
      return validation.error;
    }
  }

  try {
    const topCoins = await getTopCoins(100);

    const signals: TradingSignal[] = [];

    for (const coinId of coins.slice(0, 10)) {
      const coin = topCoins.find((c) => c.id === coinId);

      if (coin) {
        const change = coin.price_change_percentage_24h;
        const change7d = coin.price_change_percentage_7d_in_currency || 0;

        // Calculate confidence based on market data consistency
        const trendConfidence = Math.abs(change7d) > 10 ? 0.8 : Math.abs(change7d) > 5 ? 0.7 : 0.6;
        const volumeConfidence = coin.total_volume > coin.market_cap * 0.1 ? 0.85 : 0.65;
        const confidence = (trendConfidence + volumeConfidence) / 2;

        signals.push({
          coin: coin.id,
          action: getSignalFromChange(change),
          strength: Math.abs(change) > 15 ? 'strong' : Math.abs(change) > 5 ? 'moderate' : 'weak',
          confidence,
          reasoning: `Based on ${change > 0 ? 'positive' : 'negative'} momentum of ${change.toFixed(2)}% in 24h`,
          indicators: {
            trend: change7d > 0 ? 'up' : change7d < 0 ? 'down' : 'sideways',
            momentum: Math.max(-100, Math.min(100, change * 5)),
            volume: coin.total_volume > coin.market_cap * 0.1 ? 'high' : 'normal',
          },
          entry: change < 0 ? coin.current_price : undefined,
          target: change > 0 ? coin.current_price * 1.1 : undefined,
          stopLoss: coin.current_price * 0.95,
        });
      }
    }

    return NextResponse.json({
      data: signals,
      premium: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error generating signals:', error);
    return NextResponse.json(
      { error: 'Failed to generate signals', message: String(error) },
      { status: 500 }
    );
  }
}

/**
 * Compare multiple coins
 */
export async function compareCoins(request: NextRequest): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams;
  const coinIds = searchParams.get('coins')?.split(',') || ['bitcoin', 'ethereum'];

  try {
    const topCoins = await getTopCoins(100);

    const rankings = coinIds.slice(0, 5).map((coinId) => {
      const coin = topCoins.find((c) => c.id === coinId);

      if (!coin) {
        return {
          coin: coinId,
          score: 0,
          strengths: [],
          weaknesses: ['Not found in top 100'],
        };
      }

      const strengths: string[] = [];
      const weaknesses: string[] = [];

      // Analyze strengths/weaknesses
      if (coin.market_cap_rank <= 10) strengths.push('Top 10 by market cap');
      if (coin.price_change_percentage_24h > 0) strengths.push('Positive 24h momentum');
      if (coin.total_volume > coin.market_cap * 0.05) strengths.push('High trading volume');

      if (coin.market_cap_rank > 50) weaknesses.push('Lower market cap ranking');
      if (coin.price_change_percentage_24h < 0) weaknesses.push('Negative 24h momentum');
      if (coin.ath_change_percentage < -50) weaknesses.push('Far from all-time high');

      const score =
        (100 - coin.market_cap_rank) +
        coin.price_change_percentage_24h +
        (100 + coin.ath_change_percentage) / 2;

      return {
        coin: coin.id,
        score: Math.max(0, Math.min(100, score)),
        strengths,
        weaknesses,
      };
    });

    rankings.sort((a, b) => b.score - a.score);

    const result: CoinComparison = {
      coins: coinIds,
      recommendation: `Based on current metrics, ${rankings[0]?.coin || 'unknown'} appears strongest.`,
      rankings,
      summary: `Comparison of ${coinIds.length} coins based on market cap, momentum, and trading volume.`,
    };

    return NextResponse.json({
      data: result,
      premium: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error comparing coins:', error);
    return NextResponse.json(
      { error: 'Failed to compare coins', message: String(error) },
      { status: 500 }
    );
  }
}

/**
 * Generate market summary for a coin
 */
export async function generateSummary(request: NextRequest): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams;
  const coin = searchParams.get('coin') || 'bitcoin';

  try {
    const [coinData, news] = await Promise.all([
      getCoinDetails(coin),
      getLatestNews(5),
    ]);

    if (!coinData) {
      return NextResponse.json(
        { error: 'Coin not found' },
        { status: 404 }
      );
    }

    const price = coinData.market_data?.current_price?.usd || 0;
    const change24h = coinData.market_data?.price_change_percentage_24h || 0;
    const marketCap = coinData.market_data?.market_cap?.usd || 0;
    const volume = coinData.market_data?.total_volume?.usd || 0;

    const result: MarketSummary = {
      coin: coinData.id,
      overview: coinData.description?.en?.slice(0, 500) || `${coinData.name} is a cryptocurrency.`,
      priceAnalysis: `${coinData.name} is currently trading at $${price.toLocaleString()} with a ${change24h > 0 ? 'gain' : 'loss'} of ${Math.abs(change24h).toFixed(2)}% in the last 24 hours.`,
      recentNews: news.articles.slice(0, 3).map((a) => a.title).join('. '),
      outlook: getSentimentFromChange(change24h),
      keyMetrics: {
        price,
        change24h,
        marketCap,
        volume,
      },
    };

    return NextResponse.json({
      data: result,
      premium: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error generating summary:', error);
    return NextResponse.json(
      { error: 'Failed to generate summary', message: String(error) },
      { status: 500 }
    );
  }
}
