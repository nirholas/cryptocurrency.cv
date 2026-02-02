/**
 * Cross-Lingual Intelligence
 * 
 * Detects information asymmetries across language regions:
 * - News that breaks in Asia before the West
 * - Regional sentiment divergence
 * - International alpha signals
 */

import { promptGroqJsonCached, isGroqConfigured } from './groq';

// Region definitions
export const REGIONS = {
  asia: ['ko', 'ja', 'zh', 'zh-CN', 'zh-TW', 'th', 'vi', 'id'],
  europe: ['de', 'fr', 'it', 'nl', 'pl', 'ru', 'tr'],
  latam: ['es', 'pt'],
  mena: ['ar', 'fa'],
  anglosphere: ['en'],
} as const;

export type Region = keyof typeof REGIONS;

export interface RegionalArticle {
  title: string;
  titleEnglish?: string;
  description?: string;
  source: string;
  language: string;
  region: Region;
  pubDate: string;
  link: string;
}

export interface AlphaSignal {
  topic: string;
  firstRegion: Region;
  firstSource: string;
  firstPublished: string;
  westernPickupTime?: string;
  leadTimeMinutes?: number;
  confidence: number;
  potentialImpact: 'high' | 'medium' | 'low';
  summary: string;
  relatedCoins: string[];
}

export interface RegionalSentiment {
  region: Region;
  overallSentiment: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  topTopics: string[];
  divergenceFromGlobal: number; // -1 to 1, negative = more bearish than global
}

export interface CrossLingualAnalysis {
  alphaSignals: AlphaSignal[];
  regionalSentiments: RegionalSentiment[];
  divergenceAlerts: Array<{
    topic: string;
    asianSentiment: string;
    westernSentiment: string;
    significance: string;
  }>;
  summary: string;
  generatedAt: string;
}

/**
 * Determine region from language code
 */
export function getRegionFromLanguage(lang: string): Region {
  for (const [region, languages] of Object.entries(REGIONS)) {
    if (languages.includes(lang as never)) {
      return region as Region;
    }
  }
  return 'anglosphere';
}

/**
 * Detect if Asian sources published news before Western sources
 */
export function detectEarlyAsianNews(
  articles: RegionalArticle[],
  topicPattern: RegExp,
  windowHours = 24
): AlphaSignal | null {
  const cutoff = new Date(Date.now() - windowHours * 60 * 60 * 1000);
  
  // Filter relevant articles
  const relevant = articles.filter(a => 
    new Date(a.pubDate) > cutoff &&
    (topicPattern.test(a.title) || topicPattern.test(a.titleEnglish || ''))
  );

  if (relevant.length === 0) return null;

  // Sort by publication time
  relevant.sort((a, b) => new Date(a.pubDate).getTime() - new Date(b.pubDate).getTime());

  // Find first Asian and first Western
  const firstAsian = relevant.find(a => REGIONS.asia.includes(a.language as never));
  const firstWestern = relevant.find(a => a.language === 'en');

  if (!firstAsian || !firstWestern) return null;

  const asianTime = new Date(firstAsian.pubDate).getTime();
  const westernTime = new Date(firstWestern.pubDate).getTime();
  const leadTimeMinutes = Math.round((westernTime - asianTime) / 60000);

  // Only significant if Asian was at least 30 minutes earlier
  if (leadTimeMinutes < 30) return null;

  return {
    topic: firstAsian.titleEnglish || firstAsian.title,
    firstRegion: getRegionFromLanguage(firstAsian.language),
    firstSource: firstAsian.source,
    firstPublished: firstAsian.pubDate,
    westernPickupTime: firstWestern.pubDate,
    leadTimeMinutes,
    confidence: leadTimeMinutes > 120 ? 0.9 : leadTimeMinutes > 60 ? 0.7 : 0.5,
    potentialImpact: leadTimeMinutes > 180 ? 'high' : leadTimeMinutes > 60 ? 'medium' : 'low',
    summary: `First reported by ${firstAsian.source} (${firstAsian.language}) ${leadTimeMinutes} minutes before English sources`,
    relatedCoins: [],
  };
}

/**
 * Analyze regional sentiment divergence
 */
export async function analyzeRegionalSentiment(
  articlesByRegion: Record<Region, RegionalArticle[]>
): Promise<CrossLingualAnalysis> {
  if (!isGroqConfigured()) {
    throw new Error('AI features require GROQ_API_KEY');
  }

  const regionSummaries = Object.entries(articlesByRegion)
    .filter(([_, articles]) => articles.length > 0)
    .map(([region, articles]) => {
      const headlines = articles.slice(0, 10).map(a => 
        a.titleEnglish || a.title
      ).join('\n');
      return `[${region.toUpperCase()}] (${articles.length} articles):\n${headlines}`;
    })
    .join('\n\n');

  const systemPrompt = `You are a global crypto market analyst specializing in cross-regional analysis.

Analyze news from different regions to identify:
1. Alpha signals: News that appeared in one region significantly before others
2. Sentiment divergence: Where regional sentiment differs from global
3. Arbitrage opportunities: Information asymmetries

Return JSON:
{
  "alphaSignals": [
    {
      "topic": "topic description",
      "firstRegion": "asia|europe|latam|mena|anglosphere",
      "confidence": 0.0-1.0,
      "potentialImpact": "high|medium|low",
      "summary": "brief description",
      "relatedCoins": ["BTC", "ETH", ...]
    }
  ],
  "regionalSentiments": [
    {
      "region": "asia|europe|latam|mena|anglosphere",
      "overallSentiment": "bullish|bearish|neutral",
      "confidence": 0.0-1.0,
      "topTopics": ["topic1", "topic2"],
      "divergenceFromGlobal": -1.0 to 1.0
    }
  ],
  "divergenceAlerts": [
    {
      "topic": "topic",
      "asianSentiment": "bullish/bearish/neutral",
      "westernSentiment": "bullish/bearish/neutral",
      "significance": "why this matters"
    }
  ],
  "summary": "one paragraph summary of global sentiment and notable divergences"
}`;

  const result = await promptGroqJsonCached<Omit<CrossLingualAnalysis, 'generatedAt'>>(
    'cross-lingual',
    systemPrompt,
    `Analyze these regional news headlines for sentiment and alpha signals:\n\n${regionSummaries}`,
    { maxTokens: 2000, temperature: 0.4 }
  );

  return {
    ...result,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Get timezone-adjusted publication time analysis
 */
export function analyzePublicationTiming(articles: RegionalArticle[]): {
  asianTradingHours: RegionalArticle[];
  europeanTradingHours: RegionalArticle[];
  usTradingHours: RegionalArticle[];
  offHours: RegionalArticle[];
} {
  const categorize = (article: RegionalArticle) => {
    const hour = new Date(article.pubDate).getUTCHours();
    
    // Asian trading hours: 00:00-08:00 UTC (Tokyo 9am-5pm)
    if (hour >= 0 && hour < 8) return 'asian';
    // European trading hours: 07:00-16:00 UTC (London 7am-4pm)
    if (hour >= 7 && hour < 16) return 'european';
    // US trading hours: 13:30-21:00 UTC (NYC 9:30am-4pm)
    if (hour >= 13 && hour < 21) return 'us';
    return 'off';
  };

  return {
    asianTradingHours: articles.filter(a => categorize(a) === 'asian'),
    europeanTradingHours: articles.filter(a => categorize(a) === 'european'),
    usTradingHours: articles.filter(a => categorize(a) === 'us'),
    offHours: articles.filter(a => categorize(a) === 'off'),
  };
}
