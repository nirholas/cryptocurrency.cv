/**
 * AI Enhancement Utilities
 * Advanced AI capabilities for news analysis
 */

import { aiCache, withCache } from './cache';
import { aiComplete, getAIConfigOrNull } from './ai-provider';

/**
 * Summarize an article
 */
export async function summarizeArticle(
  title: string,
  content: string,
  options?: { length?: 'short' | 'medium' | 'long' }
): Promise<string> {
  const cacheKey = `ai:summary:${Buffer.from(title).toString('base64').slice(0, 30)}`;
  
  return withCache(aiCache, cacheKey, 86400, async () => {
    const lengthGuide = {
      short: '2-3 crisp sentences (60-80 words). Lead with the single most important fact.',
      medium: '3-4 sentences (100-140 words). Cover the who, what, why, and market impact.',
      long: '5-7 sentences (180-250 words). Cover context, key figures, market implications, and what to watch next.',
    };

    const systemPrompt = `You are a senior crypto news analyst at a top-tier financial publication. Write clear, factual summaries that a professional investor would appreciate.
- Lead with the most market-relevant fact
- Include key numbers, names, and dates when present
- State what this means for the market in plain terms
- Avoid filler phrases like "In conclusion" or "This article discusses"
- Be neutral: no hype, no FUD`;

    const userPrompt = `Summarize this crypto news article. Target length: ${lengthGuide[options?.length || 'medium']}

Title: ${title}

Content: ${content.slice(0, 8000)}`;

    return aiComplete(systemPrompt, userPrompt, { maxTokens: options?.length === 'long' ? 400 : options?.length === 'short' ? 150 : 250 });
  });
}

/**
 * Analyze sentiment of an article
 */
export interface SentimentAnalysis {
  sentiment: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  reasoning: string;
  marketImpact: 'high' | 'medium' | 'low';
  timeframe?: 'immediate' | 'short-term' | 'long-term';
  affectedAssets: string[];
}

export async function analyzeSentiment(
  title: string,
  content: string
): Promise<SentimentAnalysis> {
  const cacheKey = `ai:sentiment:${Buffer.from(title).toString('base64').slice(0, 30)}`;
  
  return withCache(aiCache, cacheKey, 86400, async () => {
    const systemPrompt = `You are a quantitative crypto market analyst. Assess news sentiment precisely — avoid defaulting to "neutral" unless the article truly has no market signal.

Consider:
- Direct price signals (funding rates, liquidations, buying/selling language)
- Regulatory signals (positive = clear framework, negative = ban/restriction)
- Adoption signals (partnerships, integrations, TVL growth)
- Risk signals (hacks, exploits, legal issues, insider selling)
- Macro context (Fed policy, ETF flows, institutional moves)

Respondent in this exact JSON format (no extra text):
{
  "sentiment": "bullish" | "bearish" | "neutral",
  "confidence": 0.0 to 1.0,
  "reasoning": "2-3 sentence explanation citing specific evidence from the article",
  "marketImpact": "high" | "medium" | "low",
  "timeframe": "immediate" | "short-term" | "long-term",
  "affectedAssets": ["BTC", "ETH", ...]
}`;

    const userPrompt = `Analyze the market sentiment of this crypto news:

Title: ${title}

Content: ${content.slice(0, 6000)}`;

    const response = await aiComplete(systemPrompt, userPrompt, { 
      maxTokens: 450,
      temperature: 0.15,
      jsonMode: true,
    });

    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('No JSON found in response');
    } catch {
      // Return neutral sentiment on parse error
      return {
        sentiment: 'neutral',
        confidence: 0.5,
        reasoning: 'Unable to determine sentiment',
        marketImpact: 'low',
        timeframe: 'immediate' as const,
        affectedAssets: [],
      };
    }
  });
}

/**
 * Extract key facts from an article
 */
export interface ExtractedFacts {
  keyPoints: string[];
  entities: { name: string; type: 'person' | 'company' | 'crypto' | 'organization' }[];
  numbers: { value: string; context: string }[];
  dates: { date: string; event: string }[];
}

export async function extractFacts(
  title: string,
  content: string
): Promise<ExtractedFacts> {
  const cacheKey = `ai:facts:${Buffer.from(title).toString('base64').slice(0, 30)}`;
  
  return withCache(aiCache, cacheKey, 86400, async () => {
    const systemPrompt = `You are a structured data extractor for a financial intelligence platform. Extract precise, machine-readable information from crypto news.

Rules:
- keyPoints: 4-6 bullet points, each a complete, self-contained fact (not vague summaries)
- entities: all named people, companies, exchanges, protocols, blockchains, and tokens mentioned
- numbers: every notable number (prices, percentages, market caps, TVL, volumes, dates)
- dates: explicit dates and timeframes mentioned with their associated event

Respond in this exact JSON format (no extra text):
{
  "keyPoints": ["Fact 1 with specifics", "Fact 2 with specifics", ...],
  "entities": [{"name": "...", "type": "person|company|crypto|organization|exchange|protocol"}, ...],
  "numbers": [{"value": "$10B", "context": "quarterly trading volume on Binance"}, ...],
  "dates": [{"date": "2024-01-15", "event": "Spot Bitcoin ETF approval by SEC"}, ...]
}`;

    const userPrompt = `Extract structured facts from this crypto news:

Title: ${title}

Content: ${content.slice(0, 7000)}`;

    const response = await aiComplete(systemPrompt, userPrompt, { maxTokens: 900, jsonMode: true });

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('No JSON found');
    } catch {
      return {
        keyPoints: [],
        entities: [],
        numbers: [],
        dates: [],
      };
    }
  });
}

/**
 * Fact-check claims in an article
 */
export interface FactCheckResult {
  claims: {
    claim: string;
    verdict: 'verified' | 'unverified' | 'disputed' | 'false';
    explanation: string;
  }[];
  overallCredibility: 'high' | 'medium' | 'low';
  warnings: string[];
}

export async function factCheck(
  title: string,
  content: string
): Promise<FactCheckResult> {
  const cacheKey = `ai:factcheck:${Buffer.from(title).toString('base64').slice(0, 30)}`;
  
  return withCache(aiCache, cacheKey, 86400, async () => {
    const systemPrompt = `You are a senior fact-checker at a financial journalism outlet specializing in crypto. Your job is to identify verifiable claims and assess their likely accuracy based on what is publicly known.

Guidelines:
- Distinguish factual claims from opinions and predictions
- "verified": claim is consistent with well-established public knowledge
- "unverified": claim may be true but cannot be confirmed from the article alone
- "disputed": claim is contested by credible sources or contradicts known facts
- "false": claim directly contradicts established facts
- Flag potential conflicts of interest, unsourced statistics, and promotional language

Respond in this exact JSON format (no extra text):
{
  "claims": [
    {"claim": "exact quote or close paraphrase", "verdict": "verified|unverified|disputed|false", "explanation": "reasoning in 1-2 sentences"}
  ],
  "overallCredibility": "high|medium|low",
  "warnings": ["specific concern 1", ...],
  "sourcingScore": 0 to 10
}`;

    const userPrompt = `Fact-check this crypto news article. Extract 3-6 key claims and evaluate each:

Title: ${title}

Content: ${content.slice(0, 6000)}`;

    const response = await aiComplete(systemPrompt, userPrompt, { maxTokens: 900, temperature: 0.1, jsonMode: true });

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('No JSON found');
    } catch {
      return {
        claims: [],
        overallCredibility: 'medium',
        warnings: ['Unable to perform fact-check'],
        sourcingScore: 5,
      };
    }
  });
}

/**
 * Generate related questions
 */
export async function generateQuestions(
  title: string,
  content: string
): Promise<string[]> {
  const cacheKey = `ai:questions:${Buffer.from(title).toString('base64').slice(0, 30)}`;
  
  return withCache(aiCache, cacheKey, 86400, async () => {
    const systemPrompt = `You are a financial educator and crypto expert. Generate insightful follow-up questions that help readers think critically about a news story.

Question types to include:
- "What does this mean for X?"
- "Why did Y happen?"
- "What are the risks of Z?"
- "How does this compare to...?"
- "What should a holder of X do now?"

Questions should be specific to this article, intellectually curious, and answerable with research.`;

    const userPrompt = `Generate 5 thoughtful follow-up questions for an investor or trader who just read this crypto news:

Title: ${title}

Content: ${content.slice(0, 4000)}

Return only the questions, numbered, one per line.`;

    const response = await aiComplete(systemPrompt, userPrompt, { maxTokens: 350 });
    
    return response
      .split('\n')
      .map(q => q.replace(/^\d+\.\s*/, '').trim())
      .filter(q => q.length > 10 && q.endsWith('?'));
  });
}

/**
 * Categorize article topics
 */
export async function categorizeArticle(
  title: string,
  content: string
): Promise<{
  primaryCategory: string;
  secondaryCategories: string[];
  tags: string[];
  topics: string[];
}> {
  const cacheKey = `ai:categorize:${Buffer.from(title).toString('base64').slice(0, 30)}`;
  
  return withCache(aiCache, cacheKey, 86400, async () => {
    const systemPrompt = `Categorize crypto news articles into structured taxonomy for a professional news aggregator.

Available primary categories: bitcoin, ethereum, defi, nft, regulation, market-data, technology, adoption, security, altcoins, macro, institutional
Tags should be lowercase hyphenated terms (e.g., "spot-etf", "layer-2", "sec-lawsuit")

Respond in JSON (no extra text):
{
  "primaryCategory": "most relevant category",
  "secondaryCategories": ["other", "relevant", "categories"],
  "tags": ["specific-tag-1", "specific-tag-2", "specific-tag-3"],
  "topics": ["Main topic discussed", "Secondary topic"],
  "contentType": "breaking-news|analysis|tutorial|opinion|partnership|price-update|regulatory"
}`;

    const userPrompt = `Categorize this crypto news:

Title: ${title}

Content: ${content.slice(0, 3000)}`;

    const response = await aiComplete(systemPrompt, userPrompt, { maxTokens: 300, jsonMode: true });

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('No JSON found');
    } catch {
      return {
        primaryCategory: 'general',
        secondaryCategories: [],
        tags: [],
        topics: [],
      };
    }
  });
}

/**
 * Translate article content
 */
export async function translateContent(
  content: string,
  targetLanguage: string
): Promise<string> {
  const cacheKey = `ai:translate:${targetLanguage}:${Buffer.from(content.slice(0, 100)).toString('base64')}`;
  
  return withCache(aiCache, cacheKey, 86400, async () => {
    const systemPrompt = `You are a professional financial translator specializing in cryptocurrency, DeFi, and blockchain content. Translate with precision and preserve all technical terminology, proper nouns, token names, protocol names, and numerical values.

Rules:
- Keep DEX, DeFi, NFT, DAO as-is (internationally recognized acronyms)
- Keep token tickers (BTC, ETH, SOL) as-is
- Preserve all numbers, percentages, and dollar amounts exactly
- Preserve formatting (line breaks, bullets)
- Use formal financial register appropriate for professional media`;

    const userPrompt = `Translate the following crypto news content to ${targetLanguage}:

${content.slice(0, 8000)}`;

    return aiComplete(systemPrompt, userPrompt, { maxTokens: 6000 });
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

/**
 * Get current AI provider info
 */
export function getAIProviderInfo(): { provider: string; model: string } | null {
  const config = getAIConfigOrNull();
  if (!config) return null;
  return { provider: config.provider, model: config.model };
}
