/**
 * Source Credibility Scoring
 * 
 * Score news sources based on accuracy, consistency, and bias.
 * Uses statistical analysis of historical data to generate scores.
 */

import { newsCache, withCache } from './cache';
import { getLatestNews, NewsArticle } from './crypto-news';
import { calculateSentiment } from './headline-tracker';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface BiasMetrics {
  score: number;          // -1 to 1 (bearish to bullish)
  confidence: number;     // 0 to 1
}

export interface SourceMetrics {
  accuracy: number;       // Factual accuracy (0-100)
  timeliness: number;     // How fast they report (0-100)
  consistency: number;    // Consistency of reporting (0-100)
  bias: BiasMetrics;
  clickbait: number;      // 0-1, higher = more clickbait
}

export interface SourceCredibility {
  source: string;
  sourceKey: string;
  overallScore: number;   // 0-100
  metrics: SourceMetrics;
  articleCount: number;
  lastUpdated: string;
  trend: 'improving' | 'declining' | 'stable';
}

export interface CredibilityReport {
  sources: SourceCredibility[];
  averageScore: number;
  topSources: string[];
  bottomSources: string[];
  generatedAt: string;
}

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

// Clickbait patterns
const CLICKBAIT_PATTERNS = [
  /you won't believe/i,
  /shocking/i,
  /must see/i,
  /breaking:/i,
  /urgent:/i,
  /\d+\s*(reasons?|ways?|things?)/i,
  /what happens next/i,
  /this is (huge|massive|big)/i,
  /\?{2,}/,
  /!{2,}/,
  /here'?s? (why|what|how)/i,
  /the truth about/i,
  /exposed/i,
  /revealed/i,
  /secret/i,
];

// Known source characteristics (baseline scores)
const SOURCE_BASELINES: Record<string, Partial<SourceMetrics>> = {
  coindesk: { accuracy: 85, timeliness: 90, consistency: 85 },
  theblock: { accuracy: 88, timeliness: 85, consistency: 90 },
  decrypt: { accuracy: 82, timeliness: 80, consistency: 80 },
  cointelegraph: { accuracy: 75, timeliness: 85, consistency: 75 },
  bitcoinmagazine: { accuracy: 80, timeliness: 70, consistency: 85 },
  blockworks: { accuracy: 85, timeliness: 85, consistency: 82 },
  defiant: { accuracy: 82, timeliness: 75, consistency: 80 },
  bitcoinist: { accuracy: 70, timeliness: 75, consistency: 70 },
  cryptoslate: { accuracy: 75, timeliness: 80, consistency: 75 },
  newsbtc: { accuracy: 68, timeliness: 80, consistency: 70 },
  cryptonews: { accuracy: 72, timeliness: 78, consistency: 72 },
  cryptopotato: { accuracy: 70, timeliness: 75, consistency: 72 },
};

// ═══════════════════════════════════════════════════════════════
// IN-MEMORY STORAGE
// ═══════════════════════════════════════════════════════════════

interface SourceHistory {
  sourceKey: string;
  source: string;
  articles: Array<{
    title: string;
    pubDate: string;
    sentiment: number;
    clickbaitScore: number;
  }>;
  lastUpdated: string;
  previousScore?: number;
}

const sourceHistories = new Map<string, SourceHistory>();

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Calculate clickbait score for a headline (0-1)
 */
export function calculateClickbaitScore(title: string): number {
  let matches = 0;
  
  for (const pattern of CLICKBAIT_PATTERNS) {
    if (pattern.test(title)) {
      matches++;
    }
  }
  
  // All caps check
  const words = title.split(/\s+/);
  const capsWords = words.filter(w => w.length > 2 && w === w.toUpperCase()).length;
  if (capsWords > words.length * 0.3) {
    matches++;
  }
  
  // Normalize to 0-1
  return Math.min(matches / 3, 1);
}

/**
 * Calculate timeliness score based on publishing frequency
 */
function calculateTimeliness(articles: Array<{ pubDate: string }>): number {
  if (articles.length < 2) return 50;
  
  // Sort by date
  const sorted = [...articles].sort(
    (a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
  );
  
  // Calculate average time between articles (in hours)
  let totalGap = 0;
  for (let i = 0; i < sorted.length - 1; i++) {
    const gap = new Date(sorted[i].pubDate).getTime() - 
                new Date(sorted[i + 1].pubDate).getTime();
    totalGap += gap / (1000 * 60 * 60); // Convert to hours
  }
  
  const avgGap = totalGap / (sorted.length - 1);
  
  // Score: 1-4 hours avg = 100, 24+ hours = 50
  if (avgGap <= 1) return 100;
  if (avgGap <= 4) return 90;
  if (avgGap <= 8) return 80;
  if (avgGap <= 12) return 70;
  if (avgGap <= 24) return 60;
  return 50;
}

/**
 * Calculate consistency score based on article quality variance
 */
function calculateConsistency(
  articles: Array<{ clickbaitScore: number; sentiment: number }>
): number {
  if (articles.length < 3) return 70;
  
  // Calculate variance in clickbait scores
  const clickbaitScores = articles.map(a => a.clickbaitScore);
  const clickbaitMean = clickbaitScores.reduce((a, b) => a + b, 0) / clickbaitScores.length;
  const clickbaitVariance = clickbaitScores.reduce(
    (sum, score) => sum + Math.pow(score - clickbaitMean, 2), 0
  ) / clickbaitScores.length;
  
  // Calculate variance in sentiment
  const sentiments = articles.map(a => a.sentiment);
  const sentimentMean = sentiments.reduce((a, b) => a + b, 0) / sentiments.length;
  const sentimentVariance = sentiments.reduce(
    (sum, score) => sum + Math.pow(score - sentimentMean, 2), 0
  ) / sentiments.length;
  
  // Lower variance = higher consistency
  // Max variance for clickbait is ~0.25, for sentiment ~1
  const normalizedClickbaitVar = Math.min(clickbaitVariance / 0.25, 1);
  const normalizedSentimentVar = Math.min(sentimentVariance / 1, 1);
  
  const consistencyScore = 100 - ((normalizedClickbaitVar + normalizedSentimentVar) / 2 * 50);
  
  return Math.max(50, Math.min(100, consistencyScore));
}

/**
 * Calculate bias metrics from article sentiments
 */
function calculateBias(
  articles: Array<{ sentiment: number }>
): BiasMetrics {
  if (articles.length === 0) {
    return { score: 0, confidence: 0 };
  }
  
  const sentiments = articles.map(a => a.sentiment);
  const avgSentiment = sentiments.reduce((a, b) => a + b, 0) / sentiments.length;
  
  // Confidence based on sample size and consistency
  const confidence = Math.min(articles.length / 20, 1) * 
                     (1 - Math.abs(sentiments.reduce(
                       (sum, s) => sum + Math.pow(s - avgSentiment, 2), 0
                     ) / sentiments.length));
  
  return {
    score: parseFloat(avgSentiment.toFixed(2)),
    confidence: parseFloat(Math.max(0, confidence).toFixed(2)),
  };
}

/**
 * Determine trend based on score history
 */
function determineTrend(
  currentScore: number,
  previousScore?: number
): 'improving' | 'declining' | 'stable' {
  if (previousScore === undefined) return 'stable';
  
  const diff = currentScore - previousScore;
  if (diff > 5) return 'improving';
  if (diff < -5) return 'declining';
  return 'stable';
}

// ═══════════════════════════════════════════════════════════════
// CORE FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Update source history with new articles
 */
export function updateSourceHistory(articles: NewsArticle[]): void {
  for (const article of articles) {
    const history = sourceHistories.get(article.sourceKey) || {
      sourceKey: article.sourceKey,
      source: article.source,
      articles: [],
      lastUpdated: new Date().toISOString(),
    };
    
    // Check if article already exists
    const exists = history.articles.some(
      a => a.title === article.title && a.pubDate === article.pubDate
    );
    
    if (!exists) {
      history.articles.push({
        title: article.title,
        pubDate: article.pubDate,
        sentiment: calculateSentiment(article.title),
        clickbaitScore: calculateClickbaitScore(article.title),
      });
      
      // Keep only last 100 articles per source
      if (history.articles.length > 100) {
        history.articles = history.articles.slice(-100);
      }
      
      history.lastUpdated = new Date().toISOString();
      sourceHistories.set(article.sourceKey, history);
    }
  }
}

/**
 * Calculate credibility for a single source
 */
export function calculateSourceCredibility(sourceKey: string): SourceCredibility | null {
  const history = sourceHistories.get(sourceKey);
  const baseline = SOURCE_BASELINES[sourceKey];
  
  if (!history && !baseline) {
    return null;
  }
  
  const articles = history?.articles || [];
  const now = new Date().toISOString();
  
  // Calculate metrics
  const avgClickbait = articles.length > 0
    ? articles.reduce((sum, a) => sum + a.clickbaitScore, 0) / articles.length
    : 0.2;
  
  // Get baseline or default values
  const baseAccuracy = baseline?.accuracy || 70;
  const baseTimeliness = baseline?.timeliness || 70;
  const baseConsistency = baseline?.consistency || 70;
  
  // Calculate live metrics
  const timeliness = articles.length >= 2
    ? calculateTimeliness(articles)
    : baseTimeliness;
  
  const consistency = articles.length >= 3
    ? calculateConsistency(articles)
    : baseConsistency;
  
  // Accuracy is harder to measure without fact-checking
  // We use baseline + penalty for high clickbait
  const accuracy = Math.max(50, baseAccuracy - (avgClickbait * 20));
  
  const bias = calculateBias(articles);
  
  const metrics: SourceMetrics = {
    accuracy: Math.round(accuracy),
    timeliness: Math.round(timeliness),
    consistency: Math.round(consistency),
    bias,
    clickbait: parseFloat(avgClickbait.toFixed(2)),
  };
  
  // Calculate overall score (weighted average)
  const overallScore = Math.round(
    metrics.accuracy * 0.35 +
    metrics.timeliness * 0.20 +
    metrics.consistency * 0.25 +
    (100 - metrics.clickbait * 100) * 0.20
  );
  
  const previousScore = history?.previousScore;
  const trend = determineTrend(overallScore, previousScore);
  
  // Update previous score for next comparison
  if (history) {
    history.previousScore = overallScore;
    sourceHistories.set(sourceKey, history);
  }
  
  return {
    source: history?.source || sourceKey,
    sourceKey,
    overallScore,
    metrics,
    articleCount: articles.length,
    lastUpdated: history?.lastUpdated || now,
    trend,
  };
}

/**
 * Get credibility scores for all sources
 */
export async function getSourceCredibility(options?: {
  source?: string;
  sortBy?: 'score' | 'accuracy' | 'timeliness';
}): Promise<CredibilityReport> {
  const { source, sortBy = 'score' } = options || {};
  
  const cacheKey = `credibility:${source || 'all'}:${sortBy}`;
  
  return withCache(newsCache, cacheKey, 3600, async () => {
    // First, update history with latest news
    try {
      const news = await getLatestNews(50);
      updateSourceHistory(news.articles);
    } catch (error) {
      console.warn('Failed to fetch latest news for credibility update:', error);
    }
    
    let sources: SourceCredibility[] = [];
    
    if (source) {
      // Single source
      const cred = calculateSourceCredibility(source);
      if (cred) sources = [cred];
    } else {
      // All sources with baselines
      for (const sourceKey of Object.keys(SOURCE_BASELINES)) {
        const cred = calculateSourceCredibility(sourceKey);
        if (cred) sources.push(cred);
      }
      
      // Also include any sources we have history for
      for (const [sourceKey] of sourceHistories) {
        if (!sources.some(s => s.sourceKey === sourceKey)) {
          const cred = calculateSourceCredibility(sourceKey);
          if (cred) sources.push(cred);
        }
      }
    }
    
    // Sort based on option
    switch (sortBy) {
      case 'accuracy':
        sources.sort((a, b) => b.metrics.accuracy - a.metrics.accuracy);
        break;
      case 'timeliness':
        sources.sort((a, b) => b.metrics.timeliness - a.metrics.timeliness);
        break;
      default:
        sources.sort((a, b) => b.overallScore - a.overallScore);
    }
    
    const averageScore = sources.length > 0
      ? sources.reduce((sum, s) => sum + s.overallScore, 0) / sources.length
      : 0;
    
    return {
      sources,
      averageScore: parseFloat(averageScore.toFixed(1)),
      topSources: sources.slice(0, 3).map(s => s.source),
      bottomSources: sources.slice(-3).reverse().map(s => s.source),
      generatedAt: new Date().toISOString(),
    };
  });
}

/**
 * Get credibility for a specific source
 */
export async function getSourceScore(sourceKey: string): Promise<SourceCredibility | null> {
  // Update history first
  try {
    const news = await getLatestNews(20, sourceKey);
    updateSourceHistory(news.articles);
  } catch (error) {
    console.warn(`Failed to fetch news for source ${sourceKey}:`, error);
  }
  
  return calculateSourceCredibility(sourceKey);
}

/**
 * Clear history (for testing)
 */
export function clearCredibilityHistory(): void {
  sourceHistories.clear();
}

/**
 * Get history stats (for debugging)
 */
export function getCredibilityStats(): {
  sourcesTracked: number;
  totalArticles: number;
  sources: Record<string, number>;
} {
  const sources: Record<string, number> = {};
  let totalArticles = 0;
  
  for (const [key, history] of sourceHistories) {
    sources[key] = history.articles.length;
    totalArticles += history.articles.length;
  }
  
  return {
    sourcesTracked: sourceHistories.size,
    totalArticles,
    sources,
  };
}
