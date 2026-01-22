/**
 * Anomaly Detection System
 * 
 * Detect unusual patterns in news flow:
 * - Volume spikes
 * - Coordinated publishing
 * - Sentiment shifts
 * - Ticker surges
 * - Source outages
 * - Unusual timing
 */

import { newsCache, withCache } from './cache';
import { getLatestNews, NewsArticle } from './crypto-news';
import { calculateSentiment, calculateSimilarity } from './headline-tracker';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export type AnomalyType = 
  | 'volume_spike' 
  | 'coordinated_publishing' 
  | 'sentiment_shift' 
  | 'ticker_surge' 
  | 'source_outage' 
  | 'unusual_timing';

export type AnomalySeverity = 'high' | 'medium' | 'low';

export interface AnomalyData {
  expected: number;
  actual: number;
  deviation: number;        // Standard deviations
  affectedEntities: string[];
}

export interface AnomalyEvent {
  id: string;
  type: AnomalyType;
  severity: AnomalySeverity;
  detectedAt: string;
  description: string;
  data: AnomalyData;
  possibleCauses: string[];
}

export interface SystemHealth {
  normalArticleRate: number;   // Articles per hour (baseline)
  currentRate: number;
  activeSources: number;
  totalSources: number;
}

export interface AnomalyReport {
  anomalies: AnomalyEvent[];
  systemHealth: SystemHealth;
  generatedAt: string;
}

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

/**
 * Anomaly detection rules and thresholds
 */
export const ANOMALY_RULES = {
  // Article volume spike (>3 std dev from mean)
  volumeSpike: {
    windowHours: 1,
    threshold: 3,  // standard deviations
  },
  
  // Multiple sources publish similar headline within 5 min
  coordinatedPublishing: {
    windowMinutes: 5,
    minSources: 3,
    similarityThreshold: 0.8,
  },
  
  // Sentiment shifts dramatically
  sentimentShift: {
    windowHours: 6,
    threshold: 0.4,  // shift in average sentiment
  },
  
  // Ticker mentions spike
  tickerSurge: {
    windowHours: 2,
    threshold: 5,  // multiplier vs baseline
  },
  
  // Source goes silent
  sourceOutage: {
    expectedIntervalHours: 4,
    silenceThresholdHours: 12,
  },
} as const;

// Common crypto tickers to track
const TRACKED_TICKERS = [
  'BTC', 'ETH', 'SOL', 'XRP', 'ADA', 'DOGE', 'AVAX', 'DOT', 'LINK', 'MATIC',
  'SHIB', 'LTC', 'BCH', 'UNI', 'ATOM', 'XLM', 'NEAR', 'APT', 'OP', 'ARB',
];

// Total sources we track
const TOTAL_SOURCES = 12;

// ═══════════════════════════════════════════════════════════════
// IN-MEMORY STORAGE
// ═══════════════════════════════════════════════════════════════

interface ArticleRecord {
  title: string;
  source: string;
  pubDate: string;
  sentiment: number;
  tickers: string[];
}

interface HistoricalMetrics {
  articlesPerHour: number[];  // Rolling hourly counts
  sentimentHistory: Array<{ timestamp: string; avg: number }>;
  tickerCounts: Record<string, number[]>;  // Ticker -> hourly counts
  lastSourceActivity: Record<string, string>;  // Source -> last activity timestamp
  lastUpdated: string;
}

const articleHistory: ArticleRecord[] = [];
const historicalMetrics: HistoricalMetrics = {
  articlesPerHour: [],
  sentimentHistory: [],
  tickerCounts: {},
  lastSourceActivity: {},
  lastUpdated: new Date().toISOString(),
};
const detectedAnomalies: AnomalyEvent[] = [];

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Generate unique anomaly ID
 */
function generateAnomalyId(type: AnomalyType): string {
  return `anomaly_${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Extract ticker symbols from text
 */
export function extractTickers(text: string): string[] {
  const found: string[] = [];
  const upperText = text.toUpperCase();
  
  for (const ticker of TRACKED_TICKERS) {
    // Look for ticker as whole word
    const regex = new RegExp(`\\b${ticker}\\b`);
    if (regex.test(upperText)) {
      found.push(ticker);
    }
  }
  
  // Also look for full names
  const nameMap: Record<string, string> = {
    'BITCOIN': 'BTC',
    'ETHEREUM': 'ETH',
    'SOLANA': 'SOL',
    'RIPPLE': 'XRP',
    'CARDANO': 'ADA',
    'DOGECOIN': 'DOGE',
  };
  
  for (const [name, ticker] of Object.entries(nameMap)) {
    if (upperText.includes(name) && !found.includes(ticker)) {
      found.push(ticker);
    }
  }
  
  return found;
}

/**
 * Calculate standard deviation
 */
export function calculateStdDev(values: number[]): { mean: number; stdDev: number } {
  if (values.length === 0) return { mean: 0, stdDev: 0 };
  
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  const stdDev = Math.sqrt(avgSquaredDiff);
  
  return { mean, stdDev };
}

/**
 * Determine severity based on deviation
 */
function determineSeverity(deviation: number): AnomalySeverity {
  if (deviation >= 5) return 'high';
  if (deviation >= 3) return 'medium';
  return 'low';
}

// ═══════════════════════════════════════════════════════════════
// DETECTION FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Detect volume spikes
 */
export function detectVolumeSpike(
  currentCount: number,
  historicalCounts: number[]
): AnomalyEvent | null {
  if (historicalCounts.length < 5) return null;
  
  const { mean, stdDev } = calculateStdDev(historicalCounts);
  if (stdDev === 0) return null;
  
  const deviation = (currentCount - mean) / stdDev;
  
  if (deviation >= ANOMALY_RULES.volumeSpike.threshold) {
    return {
      id: generateAnomalyId('volume_spike'),
      type: 'volume_spike',
      severity: determineSeverity(deviation),
      detectedAt: new Date().toISOString(),
      description: `Article volume is ${deviation.toFixed(1)} standard deviations above normal`,
      data: {
        expected: Math.round(mean),
        actual: currentCount,
        deviation: parseFloat(deviation.toFixed(2)),
        affectedEntities: ['all_sources'],
      },
      possibleCauses: [
        'Major market event or breaking news',
        'Multiple coordinated announcements',
        'Market crash or major price movement',
      ],
    };
  }
  
  return null;
}

/**
 * Detect coordinated publishing (similar headlines from multiple sources)
 */
export function detectCoordinatedPublishing(
  recentArticles: ArticleRecord[]
): AnomalyEvent | null {
  const { windowMinutes, minSources, similarityThreshold } = ANOMALY_RULES.coordinatedPublishing;
  const windowMs = windowMinutes * 60 * 1000;
  
  // Group articles by similar titles within time window
  const now = Date.now();
  const recentInWindow = recentArticles.filter(
    a => now - new Date(a.pubDate).getTime() <= windowMs
  );
  
  if (recentInWindow.length < minSources) return null;
  
  // Find clusters of similar headlines
  for (let i = 0; i < recentInWindow.length; i++) {
    const cluster: ArticleRecord[] = [recentInWindow[i]];
    const sources = new Set([recentInWindow[i].source]);
    
    for (let j = i + 1; j < recentInWindow.length; j++) {
      const similarity = calculateSimilarity(
        recentInWindow[i].title,
        recentInWindow[j].title
      );
      
      if (similarity >= similarityThreshold) {
        cluster.push(recentInWindow[j]);
        sources.add(recentInWindow[j].source);
      }
    }
    
    if (sources.size >= minSources) {
      return {
        id: generateAnomalyId('coordinated_publishing'),
        type: 'coordinated_publishing',
        severity: sources.size >= 5 ? 'high' : 'medium',
        detectedAt: new Date().toISOString(),
        description: `${sources.size} sources published similar headlines within ${windowMinutes} minutes`,
        data: {
          expected: 1,
          actual: sources.size,
          deviation: sources.size,
          affectedEntities: Array.from(sources),
        },
        possibleCauses: [
          'Press release distribution',
          'Major announcement from project or company',
          'Breaking regulatory news',
          'Significant market event',
        ],
      };
    }
  }
  
  return null;
}

/**
 * Detect sentiment shift
 */
export function detectSentimentShift(
  currentSentiment: number,
  historicalSentiments: Array<{ timestamp: string; avg: number }>
): AnomalyEvent | null {
  const { windowHours, threshold } = ANOMALY_RULES.sentimentShift;
  const cutoff = Date.now() - windowHours * 60 * 60 * 1000;
  
  const recentHistory = historicalSentiments.filter(
    s => new Date(s.timestamp).getTime() >= cutoff
  );
  
  if (recentHistory.length < 3) return null;
  
  // Get baseline from older entries
  const olderEntries = historicalSentiments.filter(
    s => new Date(s.timestamp).getTime() < cutoff
  ).slice(-10);
  
  if (olderEntries.length < 3) return null;
  
  const baselineSentiment = olderEntries.reduce((sum, s) => sum + s.avg, 0) / olderEntries.length;
  const shift = currentSentiment - baselineSentiment;
  
  if (Math.abs(shift) >= threshold) {
    const direction = shift > 0 ? 'positive' : 'negative';
    const severity: AnomalySeverity = Math.abs(shift) >= 0.6 ? 'high' : 'medium';
    
    return {
      id: generateAnomalyId('sentiment_shift'),
      type: 'sentiment_shift',
      severity,
      detectedAt: new Date().toISOString(),
      description: `Market sentiment shifted significantly ${direction} (${shift > 0 ? '+' : ''}${(shift * 100).toFixed(0)}%)`,
      data: {
        expected: parseFloat(baselineSentiment.toFixed(2)),
        actual: parseFloat(currentSentiment.toFixed(2)),
        deviation: parseFloat(Math.abs(shift / 0.1).toFixed(2)), // Normalize to ~std dev
        affectedEntities: ['market_sentiment'],
      },
      possibleCauses: shift > 0
        ? ['Bullish market news', 'Positive regulatory development', 'Major adoption announcement']
        : ['Bearish market news', 'Regulatory concerns', 'Security incident', 'Market downturn'],
    };
  }
  
  return null;
}

/**
 * Detect ticker mention surge
 */
export function detectTickerSurge(
  currentCounts: Record<string, number>,
  historicalCounts: Record<string, number[]>
): AnomalyEvent | null {
  const { threshold } = ANOMALY_RULES.tickerSurge;
  
  for (const [ticker, count] of Object.entries(currentCounts)) {
    const history = historicalCounts[ticker] || [];
    if (history.length < 5 || count < 3) continue;
    
    const { mean } = calculateStdDev(history);
    if (mean === 0) continue;
    
    const multiplier = count / mean;
    
    if (multiplier >= threshold) {
      const severity: AnomalySeverity = multiplier >= 10 ? 'high' : multiplier >= 7 ? 'medium' : 'low';
      
      return {
        id: generateAnomalyId('ticker_surge'),
        type: 'ticker_surge',
        severity,
        detectedAt: new Date().toISOString(),
        description: `${ticker} mentions surged ${multiplier.toFixed(1)}x above baseline`,
        data: {
          expected: Math.round(mean),
          actual: count,
          deviation: parseFloat(multiplier.toFixed(2)),
          affectedEntities: [ticker],
        },
        possibleCauses: [
          `Major ${ticker} news or announcement`,
          `Significant ${ticker} price movement`,
          `${ticker} partnership or listing`,
          `Regulatory news affecting ${ticker}`,
        ],
      };
    }
  }
  
  return null;
}

/**
 * Detect source outage (silence)
 */
export function detectSourceOutage(
  lastActivity: Record<string, string>,
  expectedSources: string[]
): AnomalyEvent[] {
  const { silenceThresholdHours } = ANOMALY_RULES.sourceOutage;
  const thresholdMs = silenceThresholdHours * 60 * 60 * 1000;
  const now = Date.now();
  
  const anomalies: AnomalyEvent[] = [];
  
  for (const source of expectedSources) {
    const lastSeen = lastActivity[source];
    if (!lastSeen) continue;
    
    const silenceMs = now - new Date(lastSeen).getTime();
    
    if (silenceMs >= thresholdMs) {
      const hoursAgo = Math.round(silenceMs / (60 * 60 * 1000));
      
      anomalies.push({
        id: generateAnomalyId('source_outage'),
        type: 'source_outage',
        severity: hoursAgo >= 24 ? 'high' : 'medium',
        detectedAt: new Date().toISOString(),
        description: `${source} has been silent for ${hoursAgo} hours`,
        data: {
          expected: ANOMALY_RULES.sourceOutage.expectedIntervalHours,
          actual: hoursAgo,
          deviation: hoursAgo / ANOMALY_RULES.sourceOutage.expectedIntervalHours,
          affectedEntities: [source],
        },
        possibleCauses: [
          'Source RSS feed may be down',
          'Source may have changed their feed URL',
          'Temporary publishing pause',
          'Technical issues with source website',
        ],
      });
    }
  }
  
  return anomalies;
}

// ═══════════════════════════════════════════════════════════════
// CORE FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Update historical data with new articles
 */
export function updateHistoricalData(articles: NewsArticle[]): void {
  const now = new Date();
  const hourKey = now.toISOString().slice(0, 13); // YYYY-MM-DDTHH
  
  for (const article of articles) {
    // Check if already recorded
    const exists = articleHistory.some(
      a => a.title === article.title && a.source === article.source
    );
    
    if (!exists) {
      const sentiment = calculateSentiment(article.title);
      const tickers = extractTickers(article.title);
      
      articleHistory.push({
        title: article.title,
        source: article.source,
        pubDate: article.pubDate,
        sentiment,
        tickers,
      });
      
      // Update last source activity
      historicalMetrics.lastSourceActivity[article.source] = article.pubDate;
    }
  }
  
  // Keep only last 1000 articles
  if (articleHistory.length > 1000) {
    articleHistory.splice(0, articleHistory.length - 1000);
  }
  
  // Update hourly article counts
  const currentHourArticles = articleHistory.filter(
    a => a.pubDate.slice(0, 13) === hourKey
  ).length;
  
  if (historicalMetrics.articlesPerHour.length === 0 ||
      historicalMetrics.lastUpdated.slice(0, 13) !== hourKey) {
    historicalMetrics.articlesPerHour.push(currentHourArticles);
    
    // Keep only last 168 hours (1 week)
    if (historicalMetrics.articlesPerHour.length > 168) {
      historicalMetrics.articlesPerHour.shift();
    }
  } else {
    historicalMetrics.articlesPerHour[historicalMetrics.articlesPerHour.length - 1] = currentHourArticles;
  }
  
  // Update sentiment history
  if (articles.length > 0) {
    const avgSentiment = articleHistory
      .slice(-50)
      .reduce((sum, a) => sum + a.sentiment, 0) / Math.min(articleHistory.length, 50);
    
    historicalMetrics.sentimentHistory.push({
      timestamp: now.toISOString(),
      avg: avgSentiment,
    });
    
    // Keep only last 100 sentiment readings
    if (historicalMetrics.sentimentHistory.length > 100) {
      historicalMetrics.sentimentHistory.shift();
    }
  }
  
  // Update ticker counts
  const tickerCounts: Record<string, number> = {};
  const recentArticles = articleHistory.filter(
    a => new Date(a.pubDate).getTime() >= now.getTime() - 2 * 60 * 60 * 1000
  );
  
  for (const article of recentArticles) {
    for (const ticker of article.tickers) {
      tickerCounts[ticker] = (tickerCounts[ticker] || 0) + 1;
    }
  }
  
  for (const [ticker, count] of Object.entries(tickerCounts)) {
    if (!historicalMetrics.tickerCounts[ticker]) {
      historicalMetrics.tickerCounts[ticker] = [];
    }
    historicalMetrics.tickerCounts[ticker].push(count);
    
    // Keep only last 50 readings
    if (historicalMetrics.tickerCounts[ticker].length > 50) {
      historicalMetrics.tickerCounts[ticker].shift();
    }
  }
  
  historicalMetrics.lastUpdated = now.toISOString();
}

/**
 * Run all anomaly detections
 */
export async function runAnomalyDetection(): Promise<AnomalyEvent[]> {
  const newAnomalies: AnomalyEvent[] = [];
  
  // Get current hour stats
  const now = new Date();
  const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  
  const currentHourArticles = articleHistory.filter(
    a => new Date(a.pubDate) >= hourAgo
  );
  
  // 1. Volume spike detection
  const volumeAnomaly = detectVolumeSpike(
    currentHourArticles.length,
    historicalMetrics.articlesPerHour.slice(0, -1) // Exclude current hour
  );
  if (volumeAnomaly) newAnomalies.push(volumeAnomaly);
  
  // 2. Coordinated publishing detection
  const coordAnomaly = detectCoordinatedPublishing(currentHourArticles);
  if (coordAnomaly) newAnomalies.push(coordAnomaly);
  
  // 3. Sentiment shift detection
  if (currentHourArticles.length > 0) {
    const currentSentiment = currentHourArticles.reduce(
      (sum, a) => sum + a.sentiment, 0
    ) / currentHourArticles.length;
    
    const sentimentAnomaly = detectSentimentShift(
      currentSentiment,
      historicalMetrics.sentimentHistory
    );
    if (sentimentAnomaly) newAnomalies.push(sentimentAnomaly);
  }
  
  // 4. Ticker surge detection
  const currentTickerCounts: Record<string, number> = {};
  for (const article of currentHourArticles) {
    for (const ticker of article.tickers) {
      currentTickerCounts[ticker] = (currentTickerCounts[ticker] || 0) + 1;
    }
  }
  
  const tickerAnomaly = detectTickerSurge(
    currentTickerCounts,
    historicalMetrics.tickerCounts
  );
  if (tickerAnomaly) newAnomalies.push(tickerAnomaly);
  
  // 5. Source outage detection
  const sources = Object.keys(historicalMetrics.lastSourceActivity);
  const outageAnomalies = detectSourceOutage(
    historicalMetrics.lastSourceActivity,
    sources
  );
  newAnomalies.push(...outageAnomalies);
  
  // Add to detected anomalies (avoid duplicates within 1 hour)
  for (const anomaly of newAnomalies) {
    const isDuplicate = detectedAnomalies.some(
      a => a.type === anomaly.type &&
           new Date(a.detectedAt).getTime() > now.getTime() - 60 * 60 * 1000
    );
    
    if (!isDuplicate) {
      detectedAnomalies.push(anomaly);
    }
  }
  
  // Keep only anomalies from last 7 days
  const weekAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
  const validAnomalies = detectedAnomalies.filter(
    a => new Date(a.detectedAt).getTime() >= weekAgo
  );
  detectedAnomalies.length = 0;
  detectedAnomalies.push(...validAnomalies);
  
  return newAnomalies;
}

/**
 * Get anomaly report
 */
export async function getAnomalyReport(options?: {
  hours?: number;
  severity?: AnomalySeverity;
}): Promise<AnomalyReport> {
  const { hours = 24, severity } = options || {};
  
  const cacheKey = `anomalies:${hours}:${severity || 'all'}`;
  
  return withCache(newsCache, cacheKey, 60, async () => {
    // Update with latest news
    try {
      const news = await getLatestNews(50);
      updateHistoricalData(news.articles);
      await runAnomalyDetection();
    } catch (error) {
      console.warn('Failed to update anomaly data:', error);
    }
    
    const cutoff = Date.now() - hours * 60 * 60 * 1000;
    
    let anomalies = detectedAnomalies.filter(
      a => new Date(a.detectedAt).getTime() >= cutoff
    );
    
    // Filter by severity if specified
    if (severity) {
      anomalies = anomalies.filter(a => a.severity === severity);
    }
    
    // Sort by time (most recent first)
    anomalies.sort(
      (a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime()
    );
    
    // Calculate system health
    const { mean } = calculateStdDev(historicalMetrics.articlesPerHour);
    const currentHour = articleHistory.filter(
      a => new Date(a.pubDate).getTime() >= Date.now() - 60 * 60 * 1000
    ).length;
    
    const activeSources = new Set(
      articleHistory
        .filter(a => new Date(a.pubDate).getTime() >= Date.now() - 12 * 60 * 60 * 1000)
        .map(a => a.source)
    ).size;
    
    return {
      anomalies,
      systemHealth: {
        normalArticleRate: parseFloat(mean.toFixed(1)),
        currentRate: currentHour,
        activeSources,
        totalSources: TOTAL_SOURCES,
      },
      generatedAt: new Date().toISOString(),
    };
  });
}

/**
 * Clear anomaly data (for testing)
 */
export function clearAnomalyData(): void {
  articleHistory.length = 0;
  historicalMetrics.articlesPerHour = [];
  historicalMetrics.sentimentHistory = [];
  historicalMetrics.tickerCounts = {};
  historicalMetrics.lastSourceActivity = {};
  historicalMetrics.lastUpdated = new Date().toISOString();
  detectedAnomalies.length = 0;
}

/**
 * Get detection stats (for debugging)
 */
export function getAnomalyStats(): {
  totalArticlesTracked: number;
  hoursOfHistory: number;
  anomaliesDetected: number;
  lastUpdate: string;
} {
  return {
    totalArticlesTracked: articleHistory.length,
    hoursOfHistory: historicalMetrics.articlesPerHour.length,
    anomaliesDetected: detectedAnomalies.length,
    lastUpdate: historicalMetrics.lastUpdated,
  };
}
