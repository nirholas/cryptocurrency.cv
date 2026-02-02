/**
 * Headline Evolution Tracker
 * 
 * Track how article headlines change over time.
 * Detects modifications, sentiment shifts, and clickbait adjustments.
 */

import { newsCache, withCache } from './cache';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface HeadlineChange {
  title: string;
  detectedAt: string;
  changeType: 'minor' | 'moderate' | 'major';
  sentiment_shift?: 'more_positive' | 'more_negative' | 'neutral';
}

export interface HeadlineEvolution {
  articleId: string;
  originalTitle: string;
  currentTitle: string;
  changes: HeadlineChange[];
  totalChanges: number;
  firstSeen: string;
  lastChecked: string;
  url: string;
  source: string;
}

export interface RecentChange {
  articleId: string;
  from: string;
  to: string;
  changedAt: string;
}

export interface HeadlineTrackingResult {
  tracked: HeadlineEvolution[];
  recentChanges: RecentChange[];
  stats: {
    totalTracked: number;
    withChanges: number;
    avgChangesPerArticle: number;
  };
  generatedAt: string;
}

interface TrackedArticle {
  articleId: string;
  url: string;
  source: string;
  originalTitle: string;
  currentTitle: string;
  changes: HeadlineChange[];
  firstSeen: string;
  lastChecked: string;
}

// ═══════════════════════════════════════════════════════════════
// IN-MEMORY STORAGE
// ═══════════════════════════════════════════════════════════════

// Store tracked articles by URL (use URL as unique identifier)
const trackedHeadlines = new Map<string, TrackedArticle>();

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Generate a unique article ID from URL
 */
export function generateArticleId(url: string): string {
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    const char = url.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `art_${Math.abs(hash).toString(36)}`;
}

/**
 * Calculate similarity between two strings (0-1)
 * Uses Levenshtein distance normalized by max length
 */
export function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 1;
  if (s1.length === 0 || s2.length === 0) return 0;
  
  // Create matrix for Levenshtein distance
  const matrix: number[][] = [];
  
  for (let i = 0; i <= s1.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= s2.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= s1.length; i++) {
    for (let j = 1; j <= s2.length; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }
  
  const distance = matrix[s1.length][s2.length];
  const maxLength = Math.max(s1.length, s2.length);
  
  return 1 - (distance / maxLength);
}

/**
 * Classify the magnitude of headline change
 */
export function classifyChangeType(
  oldTitle: string, 
  newTitle: string
): 'minor' | 'moderate' | 'major' {
  const similarity = calculateSimilarity(oldTitle, newTitle);
  
  if (similarity >= 0.9) return 'minor';    // Small typo fix, punctuation
  if (similarity >= 0.6) return 'moderate'; // Word changes, reordering
  return 'major';                            // Significant rewrite
}

/**
 * Simple sentiment analysis keywords
 */
const POSITIVE_WORDS = [
  'surge', 'soar', 'rally', 'gains', 'bullish', 'breakout', 'success',
  'adoption', 'growth', 'milestone', 'record', 'profit', 'win', 'boom',
  'upgrade', 'approval', 'partnership', 'launch', 'innovation'
];

const NEGATIVE_WORDS = [
  'crash', 'plunge', 'dump', 'bearish', 'loss', 'fail', 'scam', 'hack',
  'fraud', 'lawsuit', 'ban', 'warning', 'risk', 'collapse', 'fear',
  'panic', 'crisis', 'reject', 'denial', 'investigation'
];

/**
 * Simple sentiment score (-1 to 1)
 */
export function calculateSentiment(text: string): number {
  const words = text.toLowerCase().split(/\s+/);
  let score = 0;
  
  for (const word of words) {
    if (POSITIVE_WORDS.some(pw => word.includes(pw))) {
      score += 1;
    }
    if (NEGATIVE_WORDS.some(nw => word.includes(nw))) {
      score -= 1;
    }
  }
  
  // Normalize to -1 to 1
  if (score === 0) return 0;
  return score > 0 ? Math.min(score / 3, 1) : Math.max(score / 3, -1);
}

/**
 * Detect sentiment shift between headlines
 */
export function detectSentimentShift(
  oldTitle: string,
  newTitle: string
): 'more_positive' | 'more_negative' | 'neutral' | undefined {
  const oldSentiment = calculateSentiment(oldTitle);
  const newSentiment = calculateSentiment(newTitle);
  
  const shift = newSentiment - oldSentiment;
  
  if (Math.abs(shift) < 0.3) return 'neutral';
  return shift > 0 ? 'more_positive' : 'more_negative';
}

// ═══════════════════════════════════════════════════════════════
// CORE FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Track a new article or update existing tracking
 */
export function trackArticle(
  url: string,
  title: string,
  source: string
): { isNew: boolean; hasChanged: boolean; evolution?: HeadlineEvolution } {
  const now = new Date().toISOString();
  const articleId = generateArticleId(url);
  
  const existing = trackedHeadlines.get(url);
  
  if (!existing) {
    // New article - start tracking
    const tracked: TrackedArticle = {
      articleId,
      url,
      source,
      originalTitle: title,
      currentTitle: title,
      changes: [],
      firstSeen: now,
      lastChecked: now,
    };
    trackedHeadlines.set(url, tracked);
    
    return { isNew: true, hasChanged: false };
  }
  
  // Check if title has changed
  if (existing.currentTitle !== title) {
    const changeType = classifyChangeType(existing.currentTitle, title);
    const sentimentShift = detectSentimentShift(existing.currentTitle, title);
    
    const change: HeadlineChange = {
      title,
      detectedAt: now,
      changeType,
      sentiment_shift: sentimentShift,
    };
    
    existing.changes.push(change);
    existing.currentTitle = title;
    existing.lastChecked = now;
    trackedHeadlines.set(url, existing);
    
    return {
      isNew: false,
      hasChanged: true,
      evolution: toHeadlineEvolution(existing),
    };
  }
  
  // No change, just update last checked
  existing.lastChecked = now;
  trackedHeadlines.set(url, existing);
  
  return { isNew: false, hasChanged: false };
}

/**
 * Convert tracked article to HeadlineEvolution
 */
function toHeadlineEvolution(tracked: TrackedArticle): HeadlineEvolution {
  return {
    articleId: tracked.articleId,
    originalTitle: tracked.originalTitle,
    currentTitle: tracked.currentTitle,
    changes: tracked.changes,
    totalChanges: tracked.changes.length,
    firstSeen: tracked.firstSeen,
    lastChecked: tracked.lastChecked,
    url: tracked.url,
    source: tracked.source,
  };
}

/**
 * Get headline tracking results
 */
export async function getHeadlineTracking(options: {
  hours?: number;
  changesOnly?: boolean;
}): Promise<HeadlineTrackingResult> {
  const { hours = 24, changesOnly = false } = options;
  const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
  
  const cacheKey = `headline:tracking:${hours}:${changesOnly}`;
  
  return withCache(newsCache, cacheKey, 60, async () => {
    const tracked: HeadlineEvolution[] = [];
    const recentChanges: RecentChange[] = [];
    
    for (const article of trackedHeadlines.values()) {
      const firstSeenDate = new Date(article.firstSeen);
      
      // Filter by time window
      if (firstSeenDate < cutoffTime) continue;
      
      const evolution = toHeadlineEvolution(article);
      
      // If changesOnly, skip articles without changes
      if (changesOnly && evolution.totalChanges === 0) continue;
      
      tracked.push(evolution);
      
      // Add recent changes
      for (const change of article.changes) {
        const changeDate = new Date(change.detectedAt);
        if (changeDate >= cutoffTime) {
          const previousTitle = article.changes.indexOf(change) === 0
            ? article.originalTitle
            : article.changes[article.changes.indexOf(change) - 1].title;
          
          recentChanges.push({
            articleId: article.articleId,
            from: previousTitle,
            to: change.title,
            changedAt: change.detectedAt,
          });
        }
      }
    }
    
    // Sort by last checked (most recent first)
    tracked.sort((a, b) => 
      new Date(b.lastChecked).getTime() - new Date(a.lastChecked).getTime()
    );
    
    // Sort recent changes by time (most recent first)
    recentChanges.sort((a, b) => 
      new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime()
    );
    
    // Calculate stats
    const withChanges = tracked.filter(t => t.totalChanges > 0).length;
    const totalChanges = tracked.reduce((sum, t) => sum + t.totalChanges, 0);
    
    return {
      tracked,
      recentChanges,
      stats: {
        totalTracked: tracked.length,
        withChanges,
        avgChangesPerArticle: tracked.length > 0 
          ? parseFloat((totalChanges / tracked.length).toFixed(2))
          : 0,
      },
      generatedAt: new Date().toISOString(),
    };
  });
}

/**
 * Bulk track articles from news feed
 */
export function bulkTrackArticles(
  articles: Array<{ link: string; title: string; source: string }>
): { tracked: number; changed: number; new: number } {
  let trackedCount = 0;
  let changedCount = 0;
  let newCount = 0;
  
  for (const article of articles) {
    const result = trackArticle(article.link, article.title, article.source);
    trackedCount++;
    
    if (result.isNew) newCount++;
    if (result.hasChanged) changedCount++;
  }
  
  return { tracked: trackedCount, changed: changedCount, new: newCount };
}

/**
 * Get single article evolution
 */
export function getArticleEvolution(url: string): HeadlineEvolution | null {
  const tracked = trackedHeadlines.get(url);
  return tracked ? toHeadlineEvolution(tracked) : null;
}

/**
 * Clear tracking data (for testing)
 */
export function clearTracking(): void {
  trackedHeadlines.clear();
  // Also clear cache entries related to headline tracking
  newsCache.clear();
}

/**
 * Get tracking stats
 */
export function getTrackingStats(): {
  totalTracked: number;
  withChanges: number;
  sources: Record<string, number>;
} {
  const sources: Record<string, number> = {};
  let withChanges = 0;
  
  for (const article of trackedHeadlines.values()) {
    sources[article.source] = (sources[article.source] || 0) + 1;
    if (article.changes.length > 0) withChanges++;
  }
  
  return {
    totalTracked: trackedHeadlines.size,
    withChanges,
    sources,
  };
}
