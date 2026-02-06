/**
 * AI Enhancement Utilities
 * Advanced AI capabilities for news analysis
 */

import { aiCache, withCache } from './cache';

// Provider types
type AIProvider = 'openai' | 'anthropic' | 'groq' | 'openrouter';

interface AIConfig {
  provider: AIProvider;
  model: string;
  apiKey: string;
  baseUrl?: string;
}

// Get AI configuration from environment
function getAIConfig(): AIConfig {
  // Priority: OpenAI > Anthropic > Groq > OpenRouter
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

  throw new Error('No AI provider configured. Set OPENAI_API_KEY, ANTHROPIC_API_KEY, GROQ_API_KEY, or OPENROUTER_API_KEY');
}

// Generic AI completion request
async function aiComplete(
  systemPrompt: string,
  userPrompt: string,
  options?: { maxTokens?: number; temperature?: number }
): Promise<string> {
  const config = getAIConfig();
  const { maxTokens = 500, temperature = 0.3 } = options || {};

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

  // OpenAI-compatible API (OpenAI, Groq, OpenRouter)
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
      short: '1-2 sentences (max 50 words)',
      medium: '2-3 sentences (max 100 words)',
      long: '3-5 sentences (max 200 words)',
    };

    const systemPrompt = `You are a crypto news summarizer. Create concise, accurate summaries that capture the key points. Be neutral and factual. Avoid speculation.`;

    const userPrompt = `Summarize this crypto news article in ${lengthGuide[options?.length || 'medium']}:

Title: ${title}

Content: ${content.slice(0, 3000)}`;

    return aiComplete(systemPrompt, userPrompt, { maxTokens: 250 });
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
  affectedAssets: string[];
}

export async function analyzeSentiment(
  title: string,
  content: string
): Promise<SentimentAnalysis> {
  const cacheKey = `ai:sentiment:${Buffer.from(title).toString('base64').slice(0, 30)}`;
  
  return withCache(aiCache, cacheKey, 86400, async () => {
    const systemPrompt = `You are a crypto market sentiment analyst. Analyze news articles and provide structured sentiment analysis. Be objective and consider market implications.

Respond in this exact JSON format:
{
  "sentiment": "bullish" | "bearish" | "neutral",
  "confidence": 0.0 to 1.0,
  "reasoning": "brief explanation",
  "marketImpact": "high" | "medium" | "low",
  "affectedAssets": ["BTC", "ETH", etc.]
}`;

    const userPrompt = `Analyze the market sentiment of this crypto news:

Title: ${title}

Content: ${content.slice(0, 2000)}`;

    const response = await aiComplete(systemPrompt, userPrompt, { 
      maxTokens: 300,
      temperature: 0.2 
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
    const systemPrompt = `You are a fact extractor for crypto news. Extract structured information from articles.

Respond in this exact JSON format:
{
  "keyPoints": ["point 1", "point 2", ...],
  "entities": [{"name": "...", "type": "person|company|crypto|organization"}, ...],
  "numbers": [{"value": "$10B", "context": "market cap"}, ...],
  "dates": [{"date": "2024-01-15", "event": "..."}, ...]
}`;

    const userPrompt = `Extract key facts from this crypto news:

Title: ${title}

Content: ${content.slice(0, 2500)}`;

    const response = await aiComplete(systemPrompt, userPrompt, { maxTokens: 500 });

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
    const systemPrompt = `You are a crypto news fact-checker. Identify and evaluate factual claims in articles. Be careful not to confuse opinions with facts.

Respond in this exact JSON format:
{
  "claims": [
    {"claim": "...", "verdict": "verified|unverified|disputed|false", "explanation": "..."}
  ],
  "overallCredibility": "high|medium|low",
  "warnings": ["potential issues", ...]
}`;

    const userPrompt = `Fact-check this crypto news article. Identify key claims and evaluate their accuracy:

Title: ${title}

Content: ${content.slice(0, 2500)}`;

    const response = await aiComplete(systemPrompt, userPrompt, { maxTokens: 600 });

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
    const systemPrompt = `Generate thoughtful follow-up questions that readers might have after reading crypto news. Questions should be relevant and help deepen understanding.`;

    const userPrompt = `Generate 3-5 follow-up questions for this crypto news:

Title: ${title}

Content: ${content.slice(0, 1500)}

Return only the questions, one per line.`;

    const response = await aiComplete(systemPrompt, userPrompt, { maxTokens: 200 });
    
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
    const systemPrompt = `Categorize crypto news articles. Available categories: bitcoin, ethereum, defi, nft, regulation, market, technology, adoption, security, altcoins.

Respond in JSON:
{
  "primaryCategory": "main category",
  "secondaryCategories": ["other", "categories"],
  "tags": ["specific", "tags"],
  "topics": ["main", "topics", "discussed"]
}`;

    const userPrompt = `Categorize this crypto news:

Title: ${title}

Content: ${content.slice(0, 1500)}`;

    const response = await aiComplete(systemPrompt, userPrompt, { maxTokens: 200 });

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
    const systemPrompt = `You are a professional translator specializing in cryptocurrency and financial content. Translate accurately while maintaining technical terminology. Preserve formatting.`;

    const userPrompt = `Translate the following crypto news content to ${targetLanguage}:

${content.slice(0, 3000)}`;

    return aiComplete(systemPrompt, userPrompt, { maxTokens: 4000 });
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
  try {
    const config = getAIConfig();
    return { provider: config.provider, model: config.model };
  } catch {
    return null;
  }
}
