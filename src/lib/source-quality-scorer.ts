/**
 * Source Quality Scorer
 * 
 * AI-powered scoring of news sources based on:
 * - Accuracy: How often their predictions/claims are correct
 * - Speed: How early they break news
 * - Originality: Original reporting vs. rehashing
 * - Clickbait: Sensationalism level
 * - Market Impact: Correlation with price movements
 */

import { promptGroqJsonCached, isGroqConfigured } from './groq';

export interface SourceMetrics {
  sourceId: string;
  sourceName: string;
  
  // Quality scores (0-100)
  overallScore: number;
  accuracyScore: number;
  speedScore: number;
  originalityScore: number;
  clickbaitScore: number; // Lower is better
  
  // Stats
  articlesAnalyzed: number;
  firstToReport: number; // Count of times first to report
  exclusives: number;
  corrections: number;
  
  // Patterns
  strengths: string[];
  weaknesses: string[];
  bestFor: string[]; // Topics they excel at
  
  // Trust indicators
  trustLevel: 'high' | 'medium' | 'low';
  verificationStatus: 'verified' | 'unverified' | 'controversial';
  
  lastUpdated: string;
}

export interface ArticleQualityScore {
  title: string;
  source: string;
  
  // Scores
  overallQuality: number;
  informationDensity: number; // How much new info vs. filler
  clickbaitLevel: number;
  sentimentBias: number; // 0 = neutral, 1 = very biased
  
  // Flags
  isOriginalReporting: boolean;
  isOpinion: boolean;
  isSponsored: boolean;
  hasVerifiableClaims: boolean;
  
  // Issues
  redFlags: string[];
  positiveSignals: string[];
}

export interface SourceRanking {
  category: string;
  sources: Array<{
    name: string;
    score: number;
    rank: number;
    trend: 'up' | 'down' | 'stable';
  }>;
  generatedAt: string;
}

// Known high-quality sources (baseline)
const TRUSTED_SOURCES = [
  'CoinDesk', 'The Block', 'Decrypt', 'Blockworks',
  'Bloomberg Crypto', 'Reuters', 'WSJ', 'Financial Times'
];

const TABLOID_SOURCES = [
  // Sources known for clickbait - adjust scores accordingly
];

/**
 * Score individual article quality
 */
export async function scoreArticleQuality(
  title: string,
  description: string,
  source: string,
  content?: string
): Promise<ArticleQualityScore> {
  if (!isGroqConfigured()) {
    throw new Error('AI features require GROQ_API_KEY');
  }

  const systemPrompt = `You are a media quality analyst scoring crypto news articles.

Evaluate articles on:
1. Information density: New, valuable info vs. filler
2. Clickbait level: Sensationalism, misleading headlines
3. Sentiment bias: Neutral reporting vs. pushing narrative
4. Original reporting: Original sources vs. rehashing

Return JSON:
{
  "overallQuality": 0-100,
  "informationDensity": 0-100,
  "clickbaitLevel": 0-100,
  "sentimentBias": 0.0-1.0,
  "isOriginalReporting": boolean,
  "isOpinion": boolean,
  "isSponsored": boolean,
  "hasVerifiableClaims": boolean,
  "redFlags": ["list of concerns"],
  "positiveSignals": ["list of quality indicators"]
}`;

  const result = await promptGroqJsonCached<Omit<ArticleQualityScore, 'title' | 'source'>>(
    'article-quality',
    systemPrompt,
    `Source: ${source}
Title: ${title}
Description: ${description}
${content ? `Content: ${content.slice(0, 1000)}` : ''}

Score this article's quality.`,
    { maxTokens: 600, temperature: 0.3 }
  );

  return {
    title,
    source,
    ...result,
  };
}

/**
 * Analyze source quality based on recent articles
 */
export async function analyzeSourceQuality(
  sourceName: string,
  recentArticles: Array<{ title: string; description?: string; pubDate: string }>
): Promise<SourceMetrics> {
  if (!isGroqConfigured()) {
    throw new Error('AI features require GROQ_API_KEY');
  }

  const isTrusted = TRUSTED_SOURCES.some(s => 
    sourceName.toLowerCase().includes(s.toLowerCase())
  );

  const articlesContext = recentArticles.slice(0, 20).map((a, i) =>
    `${i + 1}. ${a.title}`
  ).join('\n');

  const systemPrompt = `You are a media quality analyst evaluating crypto news sources.

Analyze this source's recent articles to assess:
1. Accuracy: Reliability of reporting
2. Speed: Breaking news capability
3. Originality: Original reporting vs. aggregation
4. Clickbait: Sensationalism level (lower = better)

Return JSON:
{
  "overallScore": 0-100,
  "accuracyScore": 0-100,
  "speedScore": 0-100,
  "originalityScore": 0-100,
  "clickbaitScore": 0-100,
  "strengths": ["strength 1", "strength 2"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "bestFor": ["topic 1", "topic 2"],
  "trustLevel": "high|medium|low",
  "verificationStatus": "verified|unverified|controversial"
}`;

  const result = await promptGroqJsonCached<Partial<SourceMetrics>>(
    'source-quality',
    systemPrompt,
    `Source: ${sourceName}
Known trusted source: ${isTrusted ? 'Yes' : 'No'}

Recent articles:
${articlesContext}

Analyze this source's quality.`,
    { maxTokens: 800, temperature: 0.3 }
  );

  return {
    sourceId: sourceName.toLowerCase().replace(/\s+/g, '-'),
    sourceName,
    overallScore: result.overallScore || 50,
    accuracyScore: result.accuracyScore || 50,
    speedScore: result.speedScore || 50,
    originalityScore: result.originalityScore || 50,
    clickbaitScore: result.clickbaitScore || 50,
    articlesAnalyzed: recentArticles.length,
    firstToReport: 0,
    exclusives: 0,
    corrections: 0,
    strengths: result.strengths || [],
    weaknesses: result.weaknesses || [],
    bestFor: result.bestFor || [],
    trustLevel: result.trustLevel || 'medium',
    verificationStatus: result.verificationStatus || 'unverified',
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Rank sources within a category
 */
export async function rankSourcesByCategory(
  category: string,
  sourceArticles: Record<string, Array<{ title: string; description?: string }>>
): Promise<SourceRanking> {
  if (!isGroqConfigured()) {
    throw new Error('AI features require GROQ_API_KEY');
  }

  const sourceSummaries = Object.entries(sourceArticles)
    .map(([source, articles]) => {
      const headlines = articles.slice(0, 5).map(a => a.title).join('; ');
      return `${source}: ${headlines}`;
    })
    .join('\n');

  const systemPrompt = `You are ranking crypto news sources for quality in a specific category.

Rank sources by:
1. Depth of coverage in this category
2. Quality of analysis
3. Timeliness
4. Original reporting

Return JSON:
{
  "sources": [
    {"name": "source name", "score": 0-100, "rank": 1, "trend": "up|down|stable"}
  ]
}

Order by rank (1 = best).`;

  const result = await promptGroqJsonCached<{ sources: SourceRanking['sources'] }>(
    'source-ranking',
    systemPrompt,
    `Category: ${category}

Sources and recent headlines:
${sourceSummaries}

Rank these sources for ${category} coverage quality.`,
    { maxTokens: 800, temperature: 0.3 }
  );

  return {
    category,
    sources: result.sources || [],
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Detect if an article is likely clickbait
 */
export function detectClickbait(title: string): {
  isClickbait: boolean;
  score: number;
  reasons: string[];
} {
  const reasons: string[] = [];
  let score = 0;

  // Clickbait patterns
  const patterns = [
    { regex: /\b(BREAKING|URGENT|SHOCKING|INSANE)\b/i, reason: 'Sensational keywords', weight: 20 },
    { regex: /\b(you won't believe|this is why|here's why)\b/i, reason: 'Curiosity gap', weight: 25 },
    { regex: /\d+x|\d+%/i, reason: 'Specific returns promised', weight: 15 },
    { regex: /\b(millionaire|rich|retire)\b/i, reason: 'Get-rich messaging', weight: 20 },
    { regex: /^[A-Z\s!?]+$/, reason: 'All caps', weight: 30 },
    { regex: /!{2,}|\?{2,}/, reason: 'Excessive punctuation', weight: 15 },
    { regex: /\b(secret|hidden|they don't want you)\b/i, reason: 'Conspiracy framing', weight: 20 },
    { regex: /\b(to the moon|going to zero|dead)\b/i, reason: 'Extreme predictions', weight: 15 },
    { regex: /🚀|💰|🔥|💎|🙌/, reason: 'Emoji overuse', weight: 10 },
  ];

  for (const { regex, reason, weight } of patterns) {
    if (regex.test(title)) {
      score += weight;
      reasons.push(reason);
    }
  }

  // Cap at 100
  score = Math.min(score, 100);

  return {
    isClickbait: score >= 40,
    score,
    reasons,
  };
}

/**
 * Compare article to detect if it's original or rehashed
 */
export function detectRehash(
  article: { title: string; description?: string; pubDate: string },
  otherArticles: Array<{ title: string; description?: string; pubDate: string; source: string }>
): {
  isOriginal: boolean;
  similarArticles: Array<{ source: string; title: string; publishedBefore: boolean }>;
  originalSource?: string;
} {
  const articleTime = new Date(article.pubDate).getTime();
  const titleWords = new Set(article.title.toLowerCase().split(/\s+/).filter(w => w.length > 4));
  
  const similarArticles: Array<{ source: string; title: string; publishedBefore: boolean }> = [];

  for (const other of otherArticles) {
    const otherWords = new Set(other.title.toLowerCase().split(/\s+/).filter(w => w.length > 4));
    const intersection = [...titleWords].filter(w => otherWords.has(w));
    const similarity = intersection.length / Math.max(titleWords.size, 1);

    if (similarity > 0.5) {
      const otherTime = new Date(other.pubDate).getTime();
      similarArticles.push({
        source: other.source,
        title: other.title,
        publishedBefore: otherTime < articleTime,
      });
    }
  }

  const earlierArticles = similarArticles.filter(a => a.publishedBefore);
  const isOriginal = earlierArticles.length === 0;
  const originalSource = earlierArticles.length > 0 
    ? earlierArticles.sort((a, b) => a.title.localeCompare(b.title))[0]?.source
    : undefined;

  return {
    isOriginal,
    similarArticles,
    originalSource,
  };
}
