/**
 * Coverage Gap Analysis
 * 
 * Analyzes news coverage to identify:
 * - Under-covered topics and assets
 * - Emerging stories that need more attention
 * - Coverage disparity across sources
 * - Trending topics with low coverage
 * 
 * @module coverage-gap
 */

import { getLatestNews, type NewsArticle } from './crypto-news';
import { getTopCoins } from './market-data';
import { db } from './database';

// =============================================================================
// TYPES
// =============================================================================

export interface CoverageData {
  topic: string;
  articleCount: number;
  sources: string[];
  lastCovered: string | null;
  averageAge: number; // hours since last coverage
  marketRelevance: number; // 0-100 based on market cap, volume
  coverageScore: number; // 0-100 (lower = more coverage gap)
}

export interface CoverageGap {
  id: string;
  topic: string;
  type: 'asset' | 'category' | 'event' | 'narrative';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  marketImpact: number; // -100 to 100
  suggestedAngle: string;
  relatedArticles: string[];
  detectedAt: string;
  lastChecked: string;
}

export interface CoverageReport {
  timestamp: string;
  period: '24h' | '7d' | '30d';
  totalArticles: number;
  totalTopics: number;
  gaps: CoverageGap[];
  underCovered: CoverageData[];
  overCovered: CoverageData[];
  sourceDistribution: Record<string, number>;
  categoryDistribution: Record<string, number>;
  recommendations: string[];
}

export interface TopicTrend {
  topic: string;
  trend: 'rising' | 'falling' | 'stable';
  currentMentions: number;
  previousMentions: number;
  changePercent: number;
  needsMoreCoverage: boolean;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const CACHE_TTL = 15 * 60 * 1000; // 15 minutes
const IMPORTANT_CATEGORIES = [
  'bitcoin', 'ethereum', 'defi', 'nft', 'regulation', 
  'security', 'exchange', 'stablecoin', 'layer2', 'web3'
];

const TOPIC_KEYWORDS: Record<string, string[]> = {
  bitcoin: ['bitcoin', 'btc', 'satoshi', 'halving'],
  ethereum: ['ethereum', 'eth', 'vitalik', 'eip'],
  defi: ['defi', 'lending', 'yield', 'liquidity', 'amm', 'dex'],
  nft: ['nft', 'opensea', 'blur', 'collectible', 'pfp'],
  regulation: ['regulation', 'sec', 'cftc', 'lawsuit', 'compliance'],
  security: ['hack', 'exploit', 'vulnerability', 'breach', 'rugpull'],
  exchange: ['binance', 'coinbase', 'kraken', 'exchange', 'listing'],
  stablecoin: ['usdt', 'usdc', 'stablecoin', 'tether', 'circle'],
  layer2: ['layer2', 'l2', 'rollup', 'arbitrum', 'optimism', 'zksync'],
  web3: ['web3', 'metaverse', 'gaming', 'social', 'decentralized'],
};

// In-memory cache
const coverageCache = new Map<string, { data: CoverageReport; expires: number }>();

// =============================================================================
// COVERAGE ANALYSIS FUNCTIONS
// =============================================================================

/**
 * Analyze coverage for a specific topic
 */
function analyzeTopicCoverage(
  topic: string,
  articles: NewsArticle[],
  keywords: string[]
): CoverageData {
  const matchingArticles = articles.filter(article => {
    const text = `${article.title} ${article.description || ''}`.toLowerCase();
    return keywords.some(kw => text.includes(kw.toLowerCase()));
  });

  const sources = [...new Set(matchingArticles.map(a => a.source))];
  
  const sortedByDate = matchingArticles.sort((a, b) => 
    new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
  );

  const lastCovered = sortedByDate[0]?.pubDate || null;
  
  const now = Date.now();
  const avgAge = matchingArticles.length > 0
    ? matchingArticles.reduce((sum, a) => sum + (now - new Date(a.pubDate).getTime()), 0) 
      / matchingArticles.length / (1000 * 60 * 60) // Convert to hours
    : 999;

  // Market relevance based on topic importance
  const baseRelevance = IMPORTANT_CATEGORIES.includes(topic) ? 80 : 50;
  const recencyBonus = lastCovered 
    ? Math.max(0, 20 - (now - new Date(lastCovered).getTime()) / (1000 * 60 * 60))
    : 0;
  const marketRelevance = Math.min(100, baseRelevance + recencyBonus);

  // Coverage score: lower means bigger gap
  const articleBonus = Math.min(50, matchingArticles.length * 5);
  const sourceBonus = Math.min(30, sources.length * 10);
  const ageScore = Math.max(0, 20 - avgAge / 24); // Decay over 24h
  const coverageScore = articleBonus + sourceBonus + ageScore;

  return {
    topic,
    articleCount: matchingArticles.length,
    sources,
    lastCovered,
    averageAge: Math.round(avgAge),
    marketRelevance,
    coverageScore: Math.min(100, coverageScore),
  };
}

/**
 * Detect coverage gaps in news data
 */
function detectCoverageGaps(
  coverageData: CoverageData[],
  articles: NewsArticle[]
): CoverageGap[] {
  const gaps: CoverageGap[] = [];
  const now = new Date().toISOString();

  for (const coverage of coverageData) {
    // Skip well-covered topics
    if (coverage.coverageScore >= 60) continue;

    // Determine severity based on market relevance and coverage gap
    let severity: CoverageGap['severity'];
    const gapScore = coverage.marketRelevance - coverage.coverageScore;
    
    if (gapScore >= 60) severity = 'critical';
    else if (gapScore >= 40) severity = 'high';
    else if (gapScore >= 20) severity = 'medium';
    else severity = 'low';

    // Generate suggested angle
    const suggestedAngle = generateSuggestedAngle(coverage);

    // Find related articles
    const keywords = TOPIC_KEYWORDS[coverage.topic] || [coverage.topic];
    const relatedArticles = articles
      .filter(a => {
        const text = `${a.title} ${a.description || ''}`.toLowerCase();
        return keywords.some(kw => text.includes(kw.toLowerCase()));
      })
      .slice(0, 3)
      .map(a => a.title);

    gaps.push({
      id: `gap_${coverage.topic}_${Date.now()}`,
      topic: coverage.topic,
      type: determinTopicType(coverage.topic),
      severity,
      description: generateGapDescription(coverage),
      marketImpact: Math.round((coverage.marketRelevance - 50) * 2),
      suggestedAngle,
      relatedArticles,
      detectedAt: now,
      lastChecked: now,
    });
  }

  return gaps.sort((a, b) => {
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
}

/**
 * Generate suggested angle for coverage
 */
function generateSuggestedAngle(coverage: CoverageData): string {
  const angles: Record<string, string[]> = {
    bitcoin: [
      'Institutional adoption updates',
      'Mining difficulty and hash rate analysis',
      'On-chain metrics deep dive',
    ],
    ethereum: [
      'Staking yields and validator economics',
      'Layer 2 ecosystem comparison',
      'EIP developments and roadmap updates',
    ],
    defi: [
      'New protocol launches and innovations',
      'TVL movements and yield opportunities',
      'Risk analysis and smart contract audits',
    ],
    regulation: [
      'Jurisdiction-specific regulatory updates',
      'Compliance requirements for projects',
      'Legal precedent analysis',
    ],
    security: [
      'Vulnerability disclosure and patches',
      'Best practices for protocol security',
      'Post-mortem analysis of recent exploits',
    ],
  };

  const topicAngles = angles[coverage.topic] || [
    `In-depth analysis of ${coverage.topic}`,
    `Market impact of ${coverage.topic} developments`,
    `Expert perspectives on ${coverage.topic} trends`,
  ];

  // Deterministic selection based on coverage data characteristics
  // Uses coverage score, article count, and source diversity to select the most relevant angle
  // This ensures consistent, reproducible suggestions based on actual gap severity
  let angleIndex = 0;
  
  if (coverage.coverageScore < 30) {
    // Low coverage - suggest foundational analysis
    angleIndex = 0;
  } else if (coverage.sources.length < 2) {
    // Limited source diversity - suggest expert perspectives for broader view
    angleIndex = Math.min(2, topicAngles.length - 1);
  } else if (coverage.averageAge > 48) {
    // Stale coverage - suggest market impact update
    angleIndex = Math.min(1, topicAngles.length - 1);
  } else {
    // Moderate coverage - rotate based on article count for variety
    angleIndex = coverage.articleCount % topicAngles.length;
  }

  return topicAngles[angleIndex];
}

/**
 * Generate description for coverage gap
 */
function generateGapDescription(coverage: CoverageData): string {
  const hoursSince = coverage.lastCovered 
    ? Math.round((Date.now() - new Date(coverage.lastCovered).getTime()) / (1000 * 60 * 60))
    : 999;

  if (hoursSince > 168) { // More than a week
    return `${coverage.topic} has not been covered in over a week despite high market relevance`;
  } else if (hoursSince > 72) {
    return `${coverage.topic} coverage is sparse - last article was ${hoursSince} hours ago`;
  } else if (coverage.sources.length < 2) {
    return `${coverage.topic} coverage is limited to ${coverage.sources.length} source(s) - needs broader coverage`;
  } else if (coverage.articleCount < 3) {
    return `${coverage.topic} has limited recent coverage with only ${coverage.articleCount} articles`;
  } else {
    return `${coverage.topic} could benefit from more in-depth analysis and expert perspectives`;
  }
}

/**
 * Determine topic type
 */
function determinTopicType(topic: string): CoverageGap['type'] {
  const assetTopics = ['bitcoin', 'ethereum', 'solana', 'xrp', 'cardano', 'dogecoin'];
  const categoryTopics = ['defi', 'nft', 'web3', 'layer2', 'stablecoin'];
  const eventTopics = ['halving', 'upgrade', 'launch', 'listing'];
  
  if (assetTopics.includes(topic)) return 'asset';
  if (categoryTopics.includes(topic)) return 'category';
  if (eventTopics.some(e => topic.includes(e))) return 'event';
  return 'narrative';
}

/**
 * Calculate topic trends
 */
function calculateTopicTrends(
  currentArticles: NewsArticle[],
  previousArticles: NewsArticle[]
): TopicTrend[] {
  const trends: TopicTrend[] = [];

  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    const countMentions = (articles: NewsArticle[]) =>
      articles.filter(a => {
        const text = `${a.title} ${a.description || ''}`.toLowerCase();
        return keywords.some(kw => text.includes(kw.toLowerCase()));
      }).length;

    const currentMentions = countMentions(currentArticles);
    const previousMentions = countMentions(previousArticles);
    
    const changePercent = previousMentions > 0
      ? ((currentMentions - previousMentions) / previousMentions) * 100
      : currentMentions > 0 ? 100 : 0;

    let trend: TopicTrend['trend'];
    if (changePercent > 20) trend = 'rising';
    else if (changePercent < -20) trend = 'falling';
    else trend = 'stable';

    // Needs more coverage if trending up but still low absolute coverage
    const needsMoreCoverage = trend === 'rising' && currentMentions < 5;

    trends.push({
      topic,
      trend,
      currentMentions,
      previousMentions,
      changePercent: Math.round(changePercent),
      needsMoreCoverage,
    });
  }

  return trends.sort((a, b) => b.changePercent - a.changePercent);
}

/**
 * Generate coverage recommendations
 */
function generateRecommendations(
  gaps: CoverageGap[],
  trends: TopicTrend[],
  sourceDistribution: Record<string, number>
): string[] {
  const recommendations: string[] = [];

  // Critical gaps
  const criticalGaps = gaps.filter(g => g.severity === 'critical');
  if (criticalGaps.length > 0) {
    recommendations.push(
      `🚨 Critical coverage gap: ${criticalGaps[0].topic} needs immediate attention`
    );
  }

  // Rising trends with low coverage
  const risingUnderCovered = trends.filter(t => t.needsMoreCoverage);
  if (risingUnderCovered.length > 0) {
    recommendations.push(
      `📈 Trending topic "${risingUnderCovered[0].topic}" is gaining traction but under-covered`
    );
  }

  // Source diversity
  const sourceCount = Object.keys(sourceDistribution).length;
  const maxSourceShare = Math.max(...Object.values(sourceDistribution));
  const totalArticles = Object.values(sourceDistribution).reduce((a, b) => a + b, 0);
  
  if (maxSourceShare / totalArticles > 0.5) {
    recommendations.push(
      '⚠️ Coverage is heavily weighted toward one source - diversify your news intake'
    );
  }

  if (sourceCount < 4) {
    recommendations.push(
      '📰 Limited source diversity - consider adding more news sources'
    );
  }

  // Category balance
  const categoryGaps = gaps.filter(g => g.type === 'category' && g.severity !== 'low');
  if (categoryGaps.length >= 3) {
    recommendations.push(
      `📊 Multiple category coverage gaps detected: ${categoryGaps.map(g => g.topic).join(', ')}`
    );
  }

  // Falling trends
  const fallingTrends = trends.filter(t => t.trend === 'falling' && t.previousMentions >= 5);
  if (fallingTrends.length > 0) {
    recommendations.push(
      `📉 Declining coverage on previously hot topic: ${fallingTrends[0].topic}`
    );
  }

  return recommendations;
}

// =============================================================================
// MAIN API FUNCTIONS
// =============================================================================

/**
 * Generate a full coverage report
 */
export async function generateCoverageReport(
  period: '24h' | '7d' | '30d' = '24h'
): Promise<CoverageReport> {
  const cacheKey = `coverage_report_${period}`;
  const cached = coverageCache.get(cacheKey);
  
  if (cached && cached.expires > Date.now()) {
    return cached.data;
  }

  // Fetch articles for the period
  const limitMap = { '24h': 100, '7d': 500, '30d': 1000 };
  const response = await getLatestNews(limitMap[period]);
  const articles = response.articles;

  // Calculate time boundaries for trend analysis
  const now = Date.now();
  const periodMs = { '24h': 24 * 60 * 60 * 1000, '7d': 7 * 24 * 60 * 60 * 1000, '30d': 30 * 24 * 60 * 60 * 1000 };
  const midpoint = now - (periodMs[period] / 2);

  const currentArticles = articles.filter(a => new Date(a.pubDate).getTime() >= midpoint);
  const previousArticles = articles.filter(a => new Date(a.pubDate).getTime() < midpoint);

  // Analyze coverage for all topics
  const coverageData: CoverageData[] = [];
  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    coverageData.push(analyzeTopicCoverage(topic, articles, keywords));
  }

  // Add top coins as topics
  try {
    const topCoins = await getTopCoins(20);
    for (const coin of topCoins) {
      if (!TOPIC_KEYWORDS[coin.symbol.toLowerCase()]) {
        const keywords = [coin.name.toLowerCase(), coin.symbol.toLowerCase()];
        coverageData.push(analyzeTopicCoverage(coin.symbol.toLowerCase(), articles, keywords));
      }
    }
  } catch {
    // Skip if market data unavailable
  }

  // Sort by coverage score (ascending - gaps first)
  coverageData.sort((a, b) => a.coverageScore - b.coverageScore);

  // Detect gaps
  const gaps = detectCoverageGaps(coverageData, articles);

  // Calculate trends
  const trends = calculateTopicTrends(currentArticles, previousArticles);

  // Calculate distributions
  const sourceDistribution: Record<string, number> = {};
  const categoryDistribution: Record<string, number> = {};

  for (const article of articles) {
    sourceDistribution[article.source] = (sourceDistribution[article.source] || 0) + 1;
    
    // Categorize by topic
    for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
      const text = `${article.title} ${article.description || ''}`.toLowerCase();
      if (keywords.some(kw => text.includes(kw.toLowerCase()))) {
        categoryDistribution[topic] = (categoryDistribution[topic] || 0) + 1;
      }
    }
  }

  // Generate recommendations
  const recommendations = generateRecommendations(gaps, trends, sourceDistribution);

  const report: CoverageReport = {
    timestamp: new Date().toISOString(),
    period,
    totalArticles: articles.length,
    totalTopics: coverageData.length,
    gaps,
    underCovered: coverageData.filter(c => c.coverageScore < 40),
    overCovered: coverageData.filter(c => c.coverageScore > 80),
    sourceDistribution,
    categoryDistribution,
    recommendations,
  };

  // Cache the report
  coverageCache.set(cacheKey, {
    data: report,
    expires: Date.now() + CACHE_TTL,
  });

  return report;
}

/**
 * Get coverage gaps only
 */
export async function getCoverageGaps(
  minSeverity: CoverageGap['severity'] = 'low'
): Promise<CoverageGap[]> {
  const report = await generateCoverageReport('24h');
  
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  const minLevel = severityOrder[minSeverity];
  
  return report.gaps.filter(g => severityOrder[g.severity] <= minLevel);
}

/**
 * Get topic trends
 */
export async function getTopicTrends(): Promise<TopicTrend[]> {
  const response = await getLatestNews(200);
  const articles = response.articles;
  const midpoint = Date.now() - (24 * 60 * 60 * 1000);

  const currentArticles = articles.filter(a => new Date(a.pubDate).getTime() >= midpoint);
  const previousArticles = articles.filter(a => new Date(a.pubDate).getTime() < midpoint);

  return calculateTopicTrends(currentArticles, previousArticles);
}

/**
 * Get coverage for a specific topic
 */
export async function getTopicCoverage(topic: string): Promise<CoverageData | null> {
  const response = await getLatestNews(500);
  const articles = response.articles;
  const keywords = TOPIC_KEYWORDS[topic.toLowerCase()] || [topic.toLowerCase()];
  
  const coverage = analyzeTopicCoverage(topic.toLowerCase(), articles, keywords);
  return coverage.articleCount > 0 ? coverage : null;
}

/**
 * Get source diversity analysis
 */
export async function getSourceDiversity(): Promise<{
  sources: Array<{ name: string; count: number; percentage: number }>;
  diversity: number; // 0-100
  recommendations: string[];
}> {
  const response = await getLatestNews(200);
  const articles = response.articles;
  
  const sourceCount: Record<string, number> = {};
  for (const article of articles) {
    sourceCount[article.source] = (sourceCount[article.source] || 0) + 1;
  }

  const total = articles.length;
  const sources = Object.entries(sourceCount)
    .map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.count - a.count);

  // Calculate diversity score (based on entropy)
  const entropy = sources.reduce((sum, s) => {
    const p = s.count / total;
    return sum - (p > 0 ? p * Math.log2(p) : 0);
  }, 0);
  
  const maxEntropy = Math.log2(sources.length);
  const diversity = maxEntropy > 0 ? Math.round((entropy / maxEntropy) * 100) : 0;

  const recommendations: string[] = [];
  if (diversity < 50) {
    recommendations.push('Add more news sources to improve coverage diversity');
  }
  if (sources[0]?.percentage > 40) {
    recommendations.push(`${sources[0].name} dominates coverage - consider balancing sources`);
  }

  return { sources, diversity, recommendations };
}

// =============================================================================
// DATABASE OPERATIONS
// =============================================================================

/**
 * Store a coverage gap for tracking
 */
export async function storeGap(gap: CoverageGap): Promise<void> {
  await db.set(`coverage_gap:${gap.id}`, gap);
  
  // Add to gap index
  const index = await db.get<string[]>('coverage_gaps:index') || [];
  if (!index.includes(gap.id)) {
    index.push(gap.id);
    await db.set('coverage_gaps:index', index);
  }
}

/**
 * Get stored gaps
 */
export async function getStoredGaps(limit = 20): Promise<CoverageGap[]> {
  const index = await db.get<string[]>('coverage_gaps:index') || [];
  const gaps: CoverageGap[] = [];
  
  for (const id of index.slice(-limit)) {
    const gap = await db.get<CoverageGap>(`coverage_gap:${id}`);
    if (gap) gaps.push(gap);
  }
  
  return gaps.reverse();
}

// =============================================================================
// EXPORTS
// =============================================================================

export const coverageAnalysis = {
  generateCoverageReport,
  getCoverageGaps,
  getTopicTrends,
  getTopicCoverage,
  getSourceDiversity,
  storeGap,
  getStoredGaps,
};

export default coverageAnalysis;
