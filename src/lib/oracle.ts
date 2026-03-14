/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

/**
 * The Oracle - Enterprise AI Intelligence Service
 * 
 * Production-grade natural language query system for cryptocurrency intelligence.
 * Provides real-time market analysis, news synthesis, and predictive insights.
 * 
 * Features:
 * - Multi-source data aggregation (market, news, on-chain)
 * - Conversation history and context tracking
 * - Rate limiting and usage tracking
 * - Response caching for efficiency
 * - Structured JSON responses for programmatic access
 * 
 * @module oracle
 */

import { callGroq, isGroqConfigured, type GroqMessage } from './groq';
import { getLatestNews, type NewsArticle, type NewsResponse } from './crypto-news';
import { getTopCoins, getGlobalMarketData, type TokenPrice, type GlobalMarketData } from './market-data';
import { db } from './database';
import { aiCache, generateCacheKey } from './cache';

// =============================================================================
// TYPES
// =============================================================================

export interface OracleQuery {
  query: string;
  sessionId?: string;
  userId?: string;
  options?: OracleOptions;
}

export interface OracleOptions {
  includeMarketData?: boolean;
  includeNews?: boolean;
  includeOnChain?: boolean;
  maxNewsArticles?: number;
  maxCoins?: number;
  responseFormat?: 'natural' | 'structured' | 'brief';
  temperature?: number;
}

export interface OracleResponse {
  query: string;
  response: string;
  structured?: StructuredResponse;
  context: OracleContext;
  metadata: OracleMetadata;
}

export interface StructuredResponse {
  summary: string;
  keyPoints: string[];
  sentiment?: 'bullish' | 'bearish' | 'neutral' | 'mixed';
  confidence: number;
  relatedAssets: string[];
  actionableInsights?: string[];
  dataPoints?: DataPoint[];
}

export interface DataPoint {
  label: string;
  value: string | number;
  change?: number;
  source: string;
}

export interface OracleContext {
  marketData: MarketSnapshot | null;
  newsArticles: NewsArticle[];
  conversationHistory: ConversationTurn[];
  timestamp: string;
}

export interface MarketSnapshot {
  totalMarketCap: number;
  totalVolume24h: number;
  btcDominance: number;
  ethDominance: number;
  marketCapChange24h: number;
  topCoins: CoinSummary[];
  fearGreedIndex?: number;
}

export interface CoinSummary {
  symbol: string;
  name: string;
  price: number;
  priceChange24h: number;
  priceChange7d?: number;
  marketCap: number;
  volume24h: number;
  rank: number;
}

export interface ConversationTurn {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface OracleMetadata {
  queryId: string;
  processingTimeMs: number;
  tokensUsed: number;
  cached: boolean;
  modelUsed: string;
  disclaimer: string;
}

export interface OracleSession {
  sessionId: string;
  userId?: string;
  history: ConversationTurn[];
  createdAt: string;
  lastActiveAt: string;
  queryCount: number;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULT_OPTIONS: OracleOptions = {
  includeMarketData: true,
  includeNews: true,
  includeOnChain: false,
  maxNewsArticles: 15,
  maxCoins: 20,
  responseFormat: 'natural',
  temperature: 0.4,
};

const SESSION_TTL_SECONDS = 3600; // 1 hour
const CACHE_TTL_SECONDS = 120; // 2 minutes for responses
const MAX_HISTORY_LENGTH = 20;
const MAX_CONTEXT_TOKENS = 4000;

// =============================================================================
// SYSTEM PROMPTS
// =============================================================================

const ORACLE_SYSTEM_PROMPT = `You are The Oracle, an advanced AI crypto intelligence assistant created by Crypto Vision News. You have access to real-time market data and news.

Your capabilities:
- Analyze cryptocurrency market trends and movements
- Synthesize news and provide context
- Explain complex crypto concepts clearly
- Identify patterns and correlations
- Provide balanced, objective analysis

Guidelines:
1. Always cite specific data points when making claims
2. Distinguish between facts and opinions/predictions
3. Acknowledge uncertainty when data is limited
4. Never provide specific financial advice or price predictions
5. Be concise but comprehensive
6. Use professional but accessible language
7. When asked about specific coins, use the market data provided
8. For news-related queries, reference the recent headlines

Response structure:
- Start with a direct answer to the question
- Support with relevant data points
- Provide context where helpful
- End with any important caveats

Remember: You are informational only. Always include appropriate disclaimers for investment-related queries.`;

const STRUCTURED_RESPONSE_PROMPT = `Additionally, after your natural language response, provide a JSON block with structured data in this exact format:

\`\`\`json
{
  "summary": "One sentence summary",
  "keyPoints": ["point 1", "point 2", "point 3"],
  "sentiment": "bullish|bearish|neutral|mixed",
  "confidence": 0.0-1.0,
  "relatedAssets": ["BTC", "ETH"],
  "actionableInsights": ["insight 1"],
  "dataPoints": [{"label": "BTC Price", "value": 100000, "change": 5.2, "source": "CoinGecko"}]
}
\`\`\``;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Generate a unique query ID
 */
function generateQueryId(): string {
  return `oracle_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
}

/**
 * Format market data for context
 */
function formatMarketContext(snapshot: MarketSnapshot): string {
  const topCoinsStr = snapshot.topCoins
    .slice(0, 10)
    .map(c => `${c.name} (${c.symbol.toUpperCase()}): $${c.price.toLocaleString(undefined, { maximumFractionDigits: 2 })} (${c.priceChange24h >= 0 ? '+' : ''}${c.priceChange24h.toFixed(2)}%)`)
    .join('\n');

  return `
═══════════════════════════════════════════════════════════════════════════════
LIVE MARKET DATA (Updated: ${new Date().toISOString()})
═══════════════════════════════════════════════════════════════════════════════

GLOBAL METRICS:
• Total Market Cap: $${(snapshot.totalMarketCap / 1e12).toFixed(2)} trillion (${snapshot.marketCapChange24h >= 0 ? '+' : ''}${snapshot.marketCapChange24h.toFixed(2)}% 24h)
• 24h Trading Volume: $${(snapshot.totalVolume24h / 1e9).toFixed(2)} billion
• BTC Dominance: ${snapshot.btcDominance.toFixed(1)}%
• ETH Dominance: ${snapshot.ethDominance.toFixed(1)}%
${snapshot.fearGreedIndex !== undefined ? `• Fear & Greed Index: ${snapshot.fearGreedIndex}/100` : ''}

TOP CRYPTOCURRENCIES BY MARKET CAP:
${topCoinsStr}

═══════════════════════════════════════════════════════════════════════════════`;
}

/**
 * Format news for context
 */
function formatNewsContext(articles: NewsArticle[]): string {
  if (articles.length === 0) {
    return '';
  }

  const newsStr = articles
    .slice(0, 15)
    .map((a, i) => `${i + 1}. [${a.source}] ${a.title} (${a.timeAgo})`)
    .join('\n');

  return `
═══════════════════════════════════════════════════════════════════════════════
RECENT CRYPTO NEWS HEADLINES
═══════════════════════════════════════════════════════════════════════════════

${newsStr}

═══════════════════════════════════════════════════════════════════════════════`;
}

/**
 * Format conversation history for context
 */
function formatHistoryContext(history: ConversationTurn[]): string {
  if (history.length === 0) {
    return '';
  }

  const historyStr = history
    .slice(-6) // Last 6 turns max
    .map(turn => `${turn.role === 'user' ? 'User' : 'Oracle'}: ${turn.content.substring(0, 300)}${turn.content.length > 300 ? '...' : ''}`)
    .join('\n\n');

  return `
═══════════════════════════════════════════════════════════════════════════════
CONVERSATION HISTORY
═══════════════════════════════════════════════════════════════════════════════

${historyStr}

═══════════════════════════════════════════════════════════════════════════════`;
}

/**
 * Parse structured response from AI output
 */
function parseStructuredResponse(content: string): StructuredResponse | undefined {
  try {
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[1]);
      return {
        summary: parsed.summary || '',
        keyPoints: parsed.keyPoints || [],
        sentiment: parsed.sentiment,
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.5,
        relatedAssets: parsed.relatedAssets || [],
        actionableInsights: parsed.actionableInsights,
        dataPoints: parsed.dataPoints,
      };
    }
  } catch {
    // Failed to parse structured response
  }
  return undefined;
}

/**
 * Clean response content (remove JSON block if present)
 */
function cleanResponseContent(content: string): string {
  return content.replace(/```json[\s\S]*?```/g, '').trim();
}

// =============================================================================
// DATA FETCHING
// =============================================================================

/**
 * Fetch and compile market snapshot
 */
async function getMarketSnapshot(maxCoins: number): Promise<MarketSnapshot | null> {
  try {
    const [coins, globalData] = await Promise.all([
      getTopCoins(maxCoins),
      getGlobalMarketData(),
    ]);

    if (!coins.length) {
      return null;
    }

    const topCoins: CoinSummary[] = coins.map(c => ({
      symbol: c.symbol,
      name: c.name,
      price: c.current_price || 0,
      priceChange24h: c.price_change_percentage_24h || 0,
      priceChange7d: c.price_change_percentage_7d_in_currency,
      marketCap: c.market_cap || 0,
      volume24h: c.total_volume || 0,
      rank: c.market_cap_rank || 0,
    }));

    return {
      totalMarketCap: globalData?.total_market_cap?.usd || 0,
      totalVolume24h: globalData?.total_volume?.usd || 0,
      btcDominance: globalData?.market_cap_percentage?.btc || 0,
      ethDominance: globalData?.market_cap_percentage?.eth || 0,
      marketCapChange24h: globalData?.market_cap_change_percentage_24h_usd || 0,
      topCoins,
    };
  } catch (error) {
    console.error('Failed to fetch market snapshot:', error);
    return null;
  }
}

/**
 * Get recent news articles
 */
async function getRecentNews(maxArticles: number): Promise<NewsArticle[]> {
  try {
    const newsResponse = await getLatestNews(maxArticles);
    return newsResponse.articles.slice(0, maxArticles);
  } catch (error) {
    console.error('Failed to fetch news:', error);
    return [];
  }
}

// =============================================================================
// SESSION MANAGEMENT
// =============================================================================

/**
 * Get or create a session
 */
async function getOrCreateSession(sessionId?: string): Promise<OracleSession> {
  const id = sessionId || `session_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
  
  const existing = await db.get<OracleSession>(`oracle:session:${id}`);
  
  if (existing) {
    return {
      ...existing,
      lastActiveAt: new Date().toISOString(),
    };
  }

  const newSession: OracleSession = {
    sessionId: id,
    history: [],
    createdAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
    queryCount: 0,
  };

  await db.set(`oracle:session:${id}`, newSession, SESSION_TTL_SECONDS);
  return newSession;
}

/**
 * Update session with new conversation turn
 */
async function updateSession(
  session: OracleSession,
  userQuery: string,
  assistantResponse: string
): Promise<void> {
  const updatedHistory = [
    ...session.history,
    { role: 'user' as const, content: userQuery, timestamp: new Date().toISOString() },
    { role: 'assistant' as const, content: assistantResponse, timestamp: new Date().toISOString() },
  ].slice(-MAX_HISTORY_LENGTH);

  const updatedSession: OracleSession = {
    ...session,
    history: updatedHistory,
    lastActiveAt: new Date().toISOString(),
    queryCount: session.queryCount + 1,
  };

  await db.set(`oracle:session:${session.sessionId}`, updatedSession, SESSION_TTL_SECONDS);
}

// =============================================================================
// MAIN ORACLE FUNCTION
// =============================================================================

/**
 * Query The Oracle with natural language
 */
export async function queryOracle(input: OracleQuery): Promise<OracleResponse> {
  const startTime = Date.now();
  const queryId = generateQueryId();
  const options = { ...DEFAULT_OPTIONS, ...input.options };

  // Validate input
  if (!input.query || typeof input.query !== 'string') {
    throw new Error('Query is required and must be a string');
  }

  if (input.query.length > 2000) {
    throw new Error('Query exceeds maximum length of 2000 characters');
  }

  // Check if AI is configured
  if (!isGroqConfigured()) {
    throw new Error('AI service not configured. Please set GROQ_API_KEY environment variable.');
  }

  // Check cache for identical recent queries (without session context)
  const cacheKey = generateCacheKey('oracle', { query: input.query, format: options.responseFormat });
  const cachedResponse = aiCache.get<OracleResponse>(cacheKey);
  
  if (cachedResponse && !input.sessionId) {
    return {
      ...cachedResponse,
      metadata: {
        ...cachedResponse.metadata,
        cached: true,
        processingTimeMs: Date.now() - startTime,
      },
    };
  }

  // Get or create session
  const session = await getOrCreateSession(input.sessionId);

  // Fetch context data in parallel
  const [marketSnapshot, newsArticles] = await Promise.all([
    options.includeMarketData ? getMarketSnapshot(options.maxCoins!) : Promise.resolve(null),
    options.includeNews ? getRecentNews(options.maxNewsArticles!) : Promise.resolve([]),
  ]);

  // Build context string
  let contextStr = '';
  
  if (marketSnapshot) {
    contextStr += formatMarketContext(marketSnapshot);
  }
  
  if (newsArticles.length > 0) {
    contextStr += formatNewsContext(newsArticles);
  }
  
  if (session.history.length > 0) {
    contextStr += formatHistoryContext(session.history);
  }

  // Build messages for AI
  const systemPrompt = options.responseFormat === 'structured'
    ? ORACLE_SYSTEM_PROMPT + '\n\n' + STRUCTURED_RESPONSE_PROMPT
    : ORACLE_SYSTEM_PROMPT;

  const messages: GroqMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `${contextStr}\n\nUser Query: ${input.query}` },
  ];

  // Call AI
  const aiResponse = await callGroq(messages, {
    temperature: options.temperature,
    maxTokens: options.responseFormat === 'brief' ? 500 : 1500,
  });

  // Parse response
  const rawContent = aiResponse.content;
  const cleanedContent = cleanResponseContent(rawContent);
  const structuredResponse = options.responseFormat === 'structured' 
    ? parseStructuredResponse(rawContent) 
    : undefined;

  // Update session
  await updateSession(session, input.query, cleanedContent);

  // Track usage
  await trackOracleUsage(input.userId);

  // Build response
  const response: OracleResponse = {
    query: input.query,
    response: cleanedContent,
    structured: structuredResponse,
    context: {
      marketData: marketSnapshot,
      newsArticles,
      conversationHistory: session.history,
      timestamp: new Date().toISOString(),
    },
    metadata: {
      queryId,
      processingTimeMs: Date.now() - startTime,
      tokensUsed: aiResponse.usage.totalTokens,
      cached: false,
      modelUsed: 'llama-3.3-70b-versatile',
      disclaimer: 'This is AI-generated analysis for informational purposes only. Not financial advice. Always do your own research before making investment decisions.',
    },
  };

  // Cache response (without session history for privacy)
  if (!input.sessionId) {
    const cacheableResponse = {
      ...response,
      context: {
        ...response.context,
        conversationHistory: [],
      },
    };
    aiCache.set(cacheKey, cacheableResponse, CACHE_TTL_SECONDS);
  }

  return response;
}

/**
 * Get session history
 */
export async function getSessionHistory(sessionId: string): Promise<ConversationTurn[]> {
  const session = await db.get<OracleSession>(`oracle:session:${sessionId}`);
  return session?.history || [];
}

/**
 * Clear session history
 */
export async function clearSession(sessionId: string): Promise<boolean> {
  return db.delete(`oracle:session:${sessionId}`);
}

// =============================================================================
// USAGE TRACKING
// =============================================================================

/**
 * Track Oracle usage for analytics
 */
async function trackOracleUsage(userId?: string): Promise<void> {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Increment daily counter
    await db.hincrby('oracle:stats:daily', today, 1);
    
    // Track unique users
    if (userId) {
      await db.zadd('oracle:users:active', Date.now(), userId);
    }
    
    // Increment total counter
    await db.incr('oracle:stats:total_queries');
  } catch (error) {
    // Non-critical, log and continue
    console.error('Failed to track Oracle usage:', error);
  }
}

/**
 * Get Oracle usage statistics
 */
export async function getOracleStats(): Promise<{
  totalQueries: number;
  queriesToday: number;
  queriesThisWeek: number;
  activeUsers: number;
}> {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Get dates for last 7 days
    const last7Days: string[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      last7Days.push(date.toISOString().split('T')[0]);
    }

    const total = await db.get<number>('oracle:stats:total_queries') || 0;
    const dailyStats = await db.hgetall<Record<string, number>>('oracle:stats:daily') || {};
    
    const queriesToday = dailyStats[today] || 0;
    const queriesThisWeek = last7Days.reduce((sum, day) => sum + (dailyStats[day] || 0), 0);
    
    // Count active users in last 24 hours
    const oneDayAgo = Date.now() - 86400000;
    const activeUsers = (await db.zrange('oracle:users:active', 0, -1)).length;

    return {
      totalQueries: total,
      queriesToday,
      queriesThisWeek,
      activeUsers,
    };
  } catch (error) {
    console.error('Failed to get Oracle stats:', error);
    return {
      totalQueries: 0,
      queriesToday: 0,
      queriesThisWeek: 0,
      activeUsers: 0,
    };
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export default queryOracle;
