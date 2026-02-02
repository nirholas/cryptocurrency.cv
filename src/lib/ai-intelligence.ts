/**
 * AI Intelligence Engine
 * 
 * Advanced AI-powered features for news analysis:
 * - Multi-source synthesis (combine duplicate articles)
 * - "Why is X trending?" explainer
 * - Portfolio news relevance scoring
 * - News-price correlation detection
 */

import { promptGroqJson, promptGroqJsonCached, isGroqConfigured } from './groq';

// Types
export interface NewsArticle {
  title: string;
  description?: string;
  source: string;
  pubDate: string;
  link: string;
  category?: string;
}

export interface SynthesizedStory {
  headline: string;
  summary: string;
  keyFacts: string[];
  sourceCount: number;
  sources: Array<{
    name: string;
    url: string;
    uniqueContribution?: string;
  }>;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  marketImpact: 'high' | 'medium' | 'low';
  relatedCoins: string[];
  timeline?: string;
  disagreements?: string[];
}

export interface TrendExplanation {
  topic: string;
  whyTrending: string;
  background: string;
  keyEvents: Array<{
    event: string;
    date?: string;
    significance: string;
  }>;
  marketImplications: string;
  sentiment: 'bullish' | 'bearish' | 'neutral' | 'mixed';
  priceContext?: string;
  whatToWatch: string[];
  relatedTopics: string[];
}

export interface PortfolioRelevanceScore {
  articleTitle: string;
  relevanceScore: number; // 0-100
  relevantHoldings: Array<{
    symbol: string;
    impact: 'positive' | 'negative' | 'neutral';
    reason: string;
  }>;
  urgency: 'immediate' | 'important' | 'informational';
  actionSuggestion?: string;
}

export interface NewsCluster {
  articles: NewsArticle[];
  similarity: number;
}

/**
 * Cluster similar articles together using simple text similarity
 */
export function clusterSimilarArticles(articles: NewsArticle[], threshold = 0.4): NewsCluster[] {
  const clusters: NewsCluster[] = [];
  const used = new Set<number>();

  for (let i = 0; i < articles.length; i++) {
    if (used.has(i)) continue;

    const cluster: NewsArticle[] = [articles[i]];
    used.add(i);

    for (let j = i + 1; j < articles.length; j++) {
      if (used.has(j)) continue;

      const similarity = calculateSimilarity(
        `${articles[i].title} ${articles[i].description || ''}`,
        `${articles[j].title} ${articles[j].description || ''}`
      );

      if (similarity >= threshold) {
        cluster.push(articles[j]);
        used.add(j);
      }
    }

    if (cluster.length > 1) {
      clusters.push({
        articles: cluster,
        similarity: cluster.length > 1 ? threshold : 1,
      });
    }
  }

  return clusters.sort((a, b) => b.articles.length - a.articles.length);
}

/**
 * Simple Jaccard similarity for text comparison
 */
function calculateSimilarity(text1: string, text2: string): number {
  const words1 = new Set(text1.toLowerCase().split(/\s+/).filter(w => w.length > 3));
  const words2 = new Set(text2.toLowerCase().split(/\s+/).filter(w => w.length > 3));
  
  const intersection = new Set([...words1].filter(w => words2.has(w)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
}

/**
 * Synthesize multiple articles about the same story into one comprehensive summary
 */
export async function synthesizeStory(articles: NewsArticle[]): Promise<SynthesizedStory> {
  if (!isGroqConfigured()) {
    throw new Error('AI features require GROQ_API_KEY');
  }

  if (articles.length === 0) {
    throw new Error('No articles provided');
  }

  if (articles.length === 1) {
    // Single article - still provide synthesis format
    return {
      headline: articles[0].title,
      summary: articles[0].description || articles[0].title,
      keyFacts: [articles[0].description || articles[0].title],
      sourceCount: 1,
      sources: [{ name: articles[0].source, url: articles[0].link }],
      sentiment: 'neutral',
      confidence: 0.5,
      marketImpact: 'low',
      relatedCoins: [],
    };
  }

  const articlesContext = articles.map((a, i) => 
    `[Source ${i + 1}: ${a.source}]\nTitle: ${a.title}\nDescription: ${a.description || 'N/A'}\nPublished: ${a.pubDate}`
  ).join('\n\n');

  const systemPrompt = `You are a senior crypto news analyst. Synthesize multiple articles about the same story into one authoritative summary.

Your synthesis should:
1. Combine all unique facts from every source
2. Identify the most accurate/complete version of events
3. Note where sources disagree
4. Assess market impact
5. Identify related cryptocurrencies

Return JSON matching this exact structure:
{
  "headline": "Clear, factual headline",
  "summary": "2-3 sentence comprehensive summary",
  "keyFacts": ["fact 1", "fact 2", ...],
  "sentiment": "bullish" | "bearish" | "neutral",
  "confidence": 0.0-1.0,
  "marketImpact": "high" | "medium" | "low",
  "relatedCoins": ["BTC", "ETH", ...],
  "timeline": "optional timeline of events",
  "disagreements": ["where sources conflict", ...]
}`;

  const result = await promptGroqJsonCached<Omit<SynthesizedStory, 'sourceCount' | 'sources'>>(
    'synthesis',
    systemPrompt,
    `Synthesize these ${articles.length} articles about the same story:\n\n${articlesContext}`,
    { maxTokens: 1500, temperature: 0.3 }
  );

  return {
    ...result,
    sourceCount: articles.length,
    sources: articles.map(a => ({
      name: a.source,
      url: a.link,
    })),
  };
}

/**
 * Explain why a topic is trending with full context
 */
export async function explainTrending(
  topic: string,
  recentHeadlines: string[],
  mentionCount: number,
  priceChange24h?: number
): Promise<TrendExplanation> {
  if (!isGroqConfigured()) {
    throw new Error('AI features require GROQ_API_KEY');
  }

  const priceContext = priceChange24h !== undefined
    ? `\nPrice change (24h): ${priceChange24h > 0 ? '+' : ''}${priceChange24h.toFixed(2)}%`
    : '';

  const systemPrompt = `You are a crypto market analyst explaining why topics trend in the news.

Provide comprehensive context including:
1. What triggered the current attention
2. Historical background
3. Key recent events
4. Market implications
5. What traders/investors should watch

Return JSON matching this exact structure:
{
  "topic": "topic name",
  "whyTrending": "1-2 sentence explanation of current attention",
  "background": "2-3 sentence historical context",
  "keyEvents": [
    {"event": "description", "date": "if known", "significance": "why it matters"}
  ],
  "marketImplications": "how this affects crypto markets",
  "sentiment": "bullish" | "bearish" | "neutral" | "mixed",
  "priceContext": "optional price analysis",
  "whatToWatch": ["key thing 1", "key thing 2"],
  "relatedTopics": ["related topic 1", "related topic 2"]
}`;

  const userPrompt = `Topic: ${topic}
Mention count in last 24h: ${mentionCount}${priceContext}

Recent headlines about this topic:
${recentHeadlines.slice(0, 10).map((h, i) => `${i + 1}. ${h}`).join('\n')}

Explain why "${topic}" is trending and provide context.`;

  return promptGroqJsonCached<TrendExplanation>(
    'trending',
    systemPrompt,
    userPrompt,
    { maxTokens: 1200, temperature: 0.4 }
  );
}

/**
 * Score articles by relevance to user's portfolio holdings
 */
export async function scorePortfolioRelevance(
  articles: NewsArticle[],
  holdings: Array<{ symbol: string; name: string; allocation: number }>
): Promise<PortfolioRelevanceScore[]> {
  if (!isGroqConfigured()) {
    throw new Error('AI features require GROQ_API_KEY');
  }

  if (articles.length === 0 || holdings.length === 0) {
    return [];
  }

  const holdingsContext = holdings
    .sort((a, b) => b.allocation - a.allocation)
    .slice(0, 20) // Top 20 holdings
    .map(h => `${h.symbol} (${h.name}): ${(h.allocation * 100).toFixed(1)}%`)
    .join('\n');

  const articlesContext = articles.slice(0, 15).map((a, i) =>
    `[${i + 1}] ${a.title}`
  ).join('\n');

  const systemPrompt = `You are a portfolio-aware news analyst. Score each article's relevance to a user's crypto holdings.

Consider:
1. Direct mention of held assets
2. Indirect impact (e.g., ETF news affects BTC holdings)
3. Sector/category impact
4. Market-wide implications

Return JSON array:
[
  {
    "articleTitle": "exact title from input",
    "relevanceScore": 0-100,
    "relevantHoldings": [
      {"symbol": "BTC", "impact": "positive|negative|neutral", "reason": "brief reason"}
    ],
    "urgency": "immediate|important|informational",
    "actionSuggestion": "optional brief action if needed"
  }
]

Only include articles with relevanceScore > 20.`;

  const userPrompt = `Portfolio Holdings:
${holdingsContext}

News Articles:
${articlesContext}

Score each article's relevance to this portfolio.`;

  return promptGroqJsonCached<PortfolioRelevanceScore[]>(
    'portfolio-relevance',
    systemPrompt,
    userPrompt,
    { maxTokens: 2000, temperature: 0.3 }
  );
}

/**
 * Detect potential news-price correlation
 */
export async function detectNewsPriceCorrelation(
  articles: NewsArticle[],
  priceData: { symbol: string; change1h: number; change24h: number; price: number }[]
): Promise<{
  correlations: Array<{
    article: string;
    coin: string;
    priceMove: number;
    confidence: number;
    explanation: string;
    timing: string;
  }>;
  summary: string;
}> {
  if (!isGroqConfigured()) {
    throw new Error('AI features require GROQ_API_KEY');
  }

  const priceContext = priceData
    .filter(p => Math.abs(p.change1h) > 2 || Math.abs(p.change24h) > 5)
    .slice(0, 10)
    .map(p => `${p.symbol}: $${p.price.toLocaleString()} (1h: ${p.change1h > 0 ? '+' : ''}${p.change1h.toFixed(2)}%, 24h: ${p.change24h > 0 ? '+' : ''}${p.change24h.toFixed(2)}%)`)
    .join('\n');

  const articlesContext = articles.slice(0, 20).map((a, i) =>
    `[${i + 1}] ${a.title} (${a.source}, ${new Date(a.pubDate).toLocaleTimeString()})`
  ).join('\n');

  const systemPrompt = `You are a quantitative analyst detecting potential correlations between news and price movements.

Analyze if any recent articles may have caused or predicted price movements. Be conservative - only flag high-confidence correlations.

Return JSON:
{
  "correlations": [
    {
      "article": "article title",
      "coin": "symbol",
      "priceMove": percentage,
      "confidence": 0.0-1.0,
      "explanation": "why this news likely affected price",
      "timing": "news came X mins before/after price move"
    }
  ],
  "summary": "overall market-news relationship summary"
}`;

  const userPrompt = `Significant Price Movements:
${priceContext || 'No significant moves detected'}

Recent News:
${articlesContext}

Detect potential news-price correlations.`;

  return promptGroqJsonCached(
    'correlation',
    systemPrompt,
    userPrompt,
    { maxTokens: 1500, temperature: 0.3 }
  );
}

/**
 * Generate a "flash briefing" - ultra-short summary of top stories
 */
export async function generateFlashBriefing(
  articles: NewsArticle[],
  maxStories = 5
): Promise<{
  briefing: string;
  stories: Array<{
    headline: string;
    oneLineSummary: string;
    sentiment: 'bullish' | 'bearish' | 'neutral';
  }>;
  marketMood: string;
  generatedAt: string;
}> {
  if (!isGroqConfigured()) {
    throw new Error('AI features require GROQ_API_KEY');
  }

  const articlesContext = articles.slice(0, 30).map(a =>
    `- ${a.title} (${a.source})`
  ).join('\n');

  const systemPrompt = `You are a crypto news anchor creating a 30-second flash briefing.

Create an ultra-concise summary of the top ${maxStories} stories. Write as if for audio delivery.

Return JSON:
{
  "briefing": "2-3 sentence spoken intro covering market mood",
  "stories": [
    {
      "headline": "short punchy headline",
      "oneLineSummary": "one sentence max",
      "sentiment": "bullish|bearish|neutral"
    }
  ],
  "marketMood": "one word: bullish/bearish/cautious/excited/uncertain"
}`;

  const result = await promptGroqJsonCached<Omit<ReturnType<typeof generateFlashBriefing> extends Promise<infer T> ? T : never, 'generatedAt'>>(
    'flash-briefing',
    systemPrompt,
    `Create a flash briefing from these headlines:\n${articlesContext}`,
    { maxTokens: 800, temperature: 0.5 }
  );

  return {
    ...result,
    generatedAt: new Date().toISOString(),
  };
}
