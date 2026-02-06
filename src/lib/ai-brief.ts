/**
 * AI Daily Brief Generator
 * Generates comprehensive daily digest of crypto news
 */

import { aiCache, withCache } from './cache';
import { getLatestNews, NewsArticle } from './crypto-news';
import { getFearGreedIndex, getGlobalMarketData, getSimplePrices } from './market-data';

// Types
export interface DailyBrief {
  date: string;
  executiveSummary: string;
  marketOverview: {
    sentiment: 'bullish' | 'bearish' | 'neutral';
    btcTrend: string;
    keyMetrics: {
      fearGreedIndex: number;
      btcDominance: number;
      totalMarketCap: string;
    };
  };
  topStories: {
    headline: string;
    summary: string;
    impact: 'high' | 'medium' | 'low';
    relatedTickers: string[];
  }[];
  sectorsInFocus: {
    sector: string;
    trend: 'up' | 'down' | 'stable';
    reason: string;
  }[];
  upcomingEvents: {
    event: string;
    date: string;
    potentialImpact: string;
  }[];
  riskAlerts: string[];
  generatedAt: string;
}

export type BriefFormat = 'full' | 'summary';

// AI Provider Configuration (reused from ai-enhanced.ts pattern)
type AIProvider = 'openai' | 'anthropic' | 'groq' | 'openrouter';

interface AIConfig {
  provider: AIProvider;
  model: string;
  apiKey: string;
  baseUrl?: string;
}

function getAIConfig(): AIConfig {
  if (process.env.OPENAI_API_KEY) {
    return {
      provider: 'openai',
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      apiKey: process.env.OPENAI_API_KEY,
    };
  }

  if (process.env.ANTHROPIC_API_KEY) {
    return {
      provider: 'anthropic',
      model: process.env.ANTHROPIC_MODEL || 'claude-3-haiku-20240307',
      apiKey: process.env.ANTHROPIC_API_KEY,
    };
  }

  if (process.env.GROQ_API_KEY) {
    return {
      provider: 'groq',
      model: process.env.GROQ_MODEL || 'mixtral-8x7b-32768',
      apiKey: process.env.GROQ_API_KEY,
      baseUrl: 'https://api.groq.com/openai/v1',
    };
  }

  if (process.env.OPENROUTER_API_KEY) {
    return {
      provider: 'openrouter',
      model: process.env.OPENROUTER_MODEL || 'meta-llama/llama-3-8b-instruct',
      apiKey: process.env.OPENROUTER_API_KEY,
      baseUrl: 'https://openrouter.ai/api/v1',
    };
  }

  throw new Error('No AI provider configured');
}

async function aiComplete(
  systemPrompt: string,
  userPrompt: string,
  options?: { maxTokens?: number; temperature?: number }
): Promise<string> {
  const config = getAIConfig();
  const { maxTokens = 2000, temperature = 0.3 } = options || {};

  if (config.provider === 'anthropic') {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    return data.content[0].text;
  }

  const baseUrl = config.baseUrl || 'https://api.openai.com/v1';

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
      ...(config.provider === 'openrouter' && {
        'HTTP-Referer': process.env.VERCEL_URL || 'https://cryptocurrency.cv',
        'X-Title': 'Crypto News AI',
      }),
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: maxTokens,
      temperature,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`AI API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

/**
 * Format market cap to human readable string
 */
function formatMarketCap(value: number): string {
  if (value >= 1e12) {
    return `$${(value / 1e12).toFixed(2)}T`;
  }
  if (value >= 1e9) {
    return `$${(value / 1e9).toFixed(2)}B`;
  }
  return `$${(value / 1e6).toFixed(2)}M`;
}

/**
 * Determine market sentiment from price change
 */
function determineSentiment(btcChange24h: number, fearGreedValue: number): 'bullish' | 'bearish' | 'neutral' {
  if (btcChange24h > 3 && fearGreedValue > 55) return 'bullish';
  if (btcChange24h < -3 && fearGreedValue < 45) return 'bearish';
  if (btcChange24h > 1 || fearGreedValue > 55) return 'bullish';
  if (btcChange24h < -1 || fearGreedValue < 45) return 'bearish';
  return 'neutral';
}

/**
 * Generate the daily brief
 */
export async function generateDailyBrief(
  date?: string,
  format: BriefFormat = 'full'
): Promise<DailyBrief> {
  const targetDate = date || new Date().toISOString().split('T')[0];
  const cacheKey = `ai:brief:${targetDate}:${format}`;
  
  // Cache briefs for 1 hour
  return withCache(aiCache, cacheKey, 3600, async () => {
    // Fetch news from last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const newsData = await getLatestNews(50, undefined, { from: twentyFourHoursAgo });
    const articles = newsData.articles;

    // Fetch market data
    const [fearGreed, globalData, prices] = await Promise.all([
      getFearGreedIndex(),
      getGlobalMarketData(),
      getSimplePrices(),
    ]);

    const fearGreedValue = fearGreed?.value ?? 50;
    const btcDominance = globalData?.market_cap_percentage?.btc || 0;
    const totalMarketCap = globalData?.total_market_cap?.usd || 0;
    const btcPrice = prices?.bitcoin?.usd || 0;
    const btcChange24h = prices?.bitcoin?.usd_24h_change || 0;

    // Prepare news context for AI
    const newsContext = articles.slice(0, 30).map((a: NewsArticle) => 
      `- ${a.title} (${a.source}): ${a.description || ''}`
    ).join('\n');

    const marketContext = `
Market Data:
- BTC Price: $${btcPrice.toLocaleString()}
- BTC 24h Change: ${btcChange24h.toFixed(2)}%
- Fear & Greed Index: ${fearGreedValue}
- BTC Dominance: ${btcDominance.toFixed(1)}%
- Total Market Cap: ${formatMarketCap(totalMarketCap)}
`;

    const systemPrompt = `You are a professional crypto market analyst creating a daily brief. 
Be objective, data-driven, and concise. Focus on actionable insights.
Always respond with valid JSON matching the exact schema provided.`;

    const userPrompt = `Generate a daily crypto brief for ${targetDate}.

${marketContext}

Recent News Headlines:
${newsContext}

Return a JSON object with this exact structure:
{
  "executiveSummary": "2-3 sentences summarizing the day",
  "topStories": [
    {
      "headline": "story headline",
      "summary": "brief summary",
      "impact": "high|medium|low",
      "relatedTickers": ["BTC", "ETH", etc]
    }
  ],
  "sectorsInFocus": [
    {
      "sector": "DeFi|NFTs|L2|etc",
      "trend": "up|down|stable",
      "reason": "brief reason"
    }
  ],
  "upcomingEvents": [
    {
      "event": "event name",
      "date": "date string",
      "potentialImpact": "brief impact description"
    }
  ],
  "riskAlerts": ["alert 1", "alert 2"]
}

Include 3-5 top stories, 2-4 sectors, 0-3 upcoming events, and 0-3 risk alerts based on the news.
${format === 'summary' ? 'Keep responses brief and focus on executive summary.' : 'Provide comprehensive analysis.'}`;

    const response = await aiComplete(systemPrompt, userPrompt, { 
      maxTokens: format === 'summary' ? 800 : 2000,
      temperature: 0.3 
    });

    // Parse AI response
    let aiData;
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        aiData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch {
      // Fallback data
      aiData = {
        executiveSummary: 'Crypto markets continue with mixed signals. Check individual stories for details.',
        topStories: articles.slice(0, 3).map((a: NewsArticle) => ({
          headline: a.title,
          summary: a.description || 'No summary available',
          impact: 'medium' as const,
          relatedTickers: ['BTC'],
        })),
        sectorsInFocus: [{ sector: 'General', trend: 'stable' as const, reason: 'Consolidation phase' }],
        upcomingEvents: [],
        riskAlerts: [],
      };
    }

    // Determine BTC trend
    let btcTrend = 'consolidating';
    if (btcChange24h > 5) btcTrend = 'strong rally';
    else if (btcChange24h > 2) btcTrend = 'upward';
    else if (btcChange24h > 0) btcTrend = 'slightly bullish';
    else if (btcChange24h > -2) btcTrend = 'slightly bearish';
    else if (btcChange24h > -5) btcTrend = 'downward';
    else btcTrend = 'sharp decline';

    return {
      date: targetDate,
      executiveSummary: aiData.executiveSummary,
      marketOverview: {
        sentiment: determineSentiment(btcChange24h, fearGreedValue),
        btcTrend,
        keyMetrics: {
          fearGreedIndex: fearGreedValue,
          btcDominance: Math.round(btcDominance * 10) / 10,
          totalMarketCap: formatMarketCap(totalMarketCap),
        },
      },
      topStories: aiData.topStories || [],
      sectorsInFocus: aiData.sectorsInFocus || [],
      upcomingEvents: aiData.upcomingEvents || [],
      riskAlerts: aiData.riskAlerts || [],
      generatedAt: new Date().toISOString(),
    };
  });
}

/**
 * Check if AI is configured
 */
export function isAIConfigured(): boolean {
  return !!(
    process.env.OPENAI_API_KEY ||
    process.env.ANTHROPIC_API_KEY ||
    process.env.GROQ_API_KEY ||
    process.env.OPENROUTER_API_KEY
  );
}
