/**
 * AI Research Agent
 * 
 * Deep-dive research on any crypto topic:
 * - Aggregates news from multiple sources
 * - Analyzes on-chain data implications
 * - Provides comprehensive investment thesis
 * - Identifies risks and opportunities
 */

import { promptGroqJsonCached, isGroqConfigured } from './groq';

export interface ResearchReport {
  topic: string;
  executiveSummary: string;
  
  // News Analysis
  newsAnalysis: {
    totalArticles: number;
    sentimentBreakdown: {
      bullish: number;
      bearish: number;
      neutral: number;
    };
    keyThemes: string[];
    recentDevelopments: Array<{
      date: string;
      event: string;
      significance: 'high' | 'medium' | 'low';
    }>;
  };
  
  // Investment Thesis
  investmentThesis: {
    bullCase: {
      summary: string;
      arguments: string[];
      priceTarget?: string;
      confidence: number;
    };
    bearCase: {
      summary: string;
      arguments: string[];
      priceTarget?: string;
      confidence: number;
    };
    verdict: 'bullish' | 'bearish' | 'neutral' | 'uncertain';
  };
  
  // Risk Analysis
  risks: Array<{
    risk: string;
    severity: 'high' | 'medium' | 'low';
    probability: number;
    mitigation: string;
  }>;
  
  // Opportunities
  opportunities: Array<{
    opportunity: string;
    timeframe: string;
    potentialReturn: string;
    confidence: number;
  }>;
  
  // Key Questions
  openQuestions: string[];
  
  // Data Sources
  sources: string[];
  
  // Meta
  generatedAt: string;
  confidence: number;
  disclaimer: string;
}

export interface QuickTake {
  topic: string;
  oneLineSummary: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  keyPoint: string;
  watchFor: string;
  generatedAt: string;
}

/**
 * Generate comprehensive research report
 */
export async function generateResearchReport(
  topic: string,
  headlines: string[],
  additionalContext?: {
    priceData?: { price: number; change24h: number; change7d: number };
    marketCap?: number;
    volume?: number;
  }
): Promise<ResearchReport> {
  if (!isGroqConfigured()) {
    throw new Error('AI features require GROQ_API_KEY');
  }

  const priceContext = additionalContext?.priceData
    ? `\nPrice: $${additionalContext.priceData.price.toLocaleString()} (24h: ${additionalContext.priceData.change24h > 0 ? '+' : ''}${additionalContext.priceData.change24h.toFixed(2)}%, 7d: ${additionalContext.priceData.change7d > 0 ? '+' : ''}${additionalContext.priceData.change7d.toFixed(2)}%)`
    : '';

  const marketContext = additionalContext?.marketCap
    ? `\nMarket Cap: $${(additionalContext.marketCap / 1e9).toFixed(2)}B`
    : '';

  const systemPrompt = `You are a senior crypto research analyst creating comprehensive investment research reports.

Your report should be:
1. Data-driven and objective
2. Clearly structured with bull/bear cases
3. Risk-aware with specific risk assessments
4. Actionable with specific opportunities
5. Honest about uncertainty

Return JSON:
{
  "executiveSummary": "2-3 sentence summary",
  "newsAnalysis": {
    "totalArticles": number,
    "sentimentBreakdown": {"bullish": %, "bearish": %, "neutral": %},
    "keyThemes": ["theme1", "theme2"],
    "recentDevelopments": [{"date": "recent/date", "event": "description", "significance": "high|medium|low"}]
  },
  "investmentThesis": {
    "bullCase": {
      "summary": "1-2 sentence bull case",
      "arguments": ["arg1", "arg2", "arg3"],
      "priceTarget": "optional target",
      "confidence": 0.0-1.0
    },
    "bearCase": {
      "summary": "1-2 sentence bear case", 
      "arguments": ["arg1", "arg2", "arg3"],
      "priceTarget": "optional target",
      "confidence": 0.0-1.0
    },
    "verdict": "bullish|bearish|neutral|uncertain"
  },
  "risks": [
    {"risk": "description", "severity": "high|medium|low", "probability": 0.0-1.0, "mitigation": "how to mitigate"}
  ],
  "opportunities": [
    {"opportunity": "description", "timeframe": "short/medium/long term", "potentialReturn": "estimate", "confidence": 0.0-1.0}
  ],
  "openQuestions": ["question1", "question2"],
  "confidence": 0.0-1.0
}`;

  const result = await promptGroqJsonCached<Partial<ResearchReport>>(
    'research',
    systemPrompt,
    `Research Topic: ${topic}
${priceContext}${marketContext}

Recent Headlines (${headlines.length} total):
${headlines.slice(0, 30).map((h, i) => `${i + 1}. ${h}`).join('\n')}

Generate a comprehensive research report on this topic.`,
    { maxTokens: 3000, temperature: 0.4 }
  );

  return {
    topic,
    executiveSummary: result.executiveSummary || '',
    newsAnalysis: result.newsAnalysis || {
      totalArticles: headlines.length,
      sentimentBreakdown: { bullish: 33, bearish: 33, neutral: 34 },
      keyThemes: [],
      recentDevelopments: [],
    },
    investmentThesis: result.investmentThesis || {
      bullCase: { summary: '', arguments: [], confidence: 0.5 },
      bearCase: { summary: '', arguments: [], confidence: 0.5 },
      verdict: 'uncertain',
    },
    risks: result.risks || [],
    opportunities: result.opportunities || [],
    openQuestions: result.openQuestions || [],
    sources: [...new Set(headlines.slice(0, 20).map(h => h.split(' - ')[0]))],
    generatedAt: new Date().toISOString(),
    confidence: result.confidence || 0.5,
    disclaimer: 'This is AI-generated research for informational purposes only. Not financial advice. Always do your own research.',
  };
}

/**
 * Generate quick take on a topic
 */
export async function generateQuickTake(
  topic: string,
  headlines: string[]
): Promise<QuickTake> {
  if (!isGroqConfigured()) {
    throw new Error('AI features require GROQ_API_KEY');
  }

  const systemPrompt = `You are a crypto analyst giving quick, actionable takes.

Be concise and direct. No fluff.

Return JSON:
{
  "oneLineSummary": "one sentence summary",
  "sentiment": "bullish|bearish|neutral",
  "confidence": 0.0-1.0,
  "keyPoint": "the most important thing to know",
  "watchFor": "what to monitor next"
}`;

  const result = await promptGroqJsonCached<Omit<QuickTake, 'topic' | 'generatedAt'>>(
    'quick-take',
    systemPrompt,
    `Topic: ${topic}

Headlines:
${headlines.slice(0, 15).join('\n')}

Give a quick take.`,
    { maxTokens: 300, temperature: 0.5 }
  );

  return {
    topic,
    ...result,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Compare two assets/topics
 */
export async function compareAssets(
  asset1: { name: string; headlines: string[] },
  asset2: { name: string; headlines: string[] }
): Promise<{
  comparison: {
    winner: string;
    reasoning: string;
    confidence: number;
  };
  asset1Analysis: {
    sentiment: string;
    strength: number;
    keyNarrative: string;
  };
  asset2Analysis: {
    sentiment: string;
    strength: number;
    keyNarrative: string;
  };
  tradingIdea?: string;
  generatedAt: string;
}> {
  if (!isGroqConfigured()) {
    throw new Error('AI features require GROQ_API_KEY');
  }

  const systemPrompt = `You are a crypto analyst comparing two assets based on news sentiment and narratives.

Return JSON:
{
  "comparison": {
    "winner": "asset name with stronger narrative",
    "reasoning": "why this asset has momentum",
    "confidence": 0.0-1.0
  },
  "asset1Analysis": {
    "sentiment": "bullish|bearish|neutral",
    "strength": 0-100,
    "keyNarrative": "main story"
  },
  "asset2Analysis": {
    "sentiment": "bullish|bearish|neutral", 
    "strength": 0-100,
    "keyNarrative": "main story"
  },
  "tradingIdea": "optional pair trade idea"
}`;

  const result = await promptGroqJsonCached(
    'compare-assets',
    systemPrompt,
    `Compare these two assets based on recent news:

[${asset1.name}]
${asset1.headlines.slice(0, 10).join('\n')}

[${asset2.name}]
${asset2.headlines.slice(0, 10).join('\n')}

Which has stronger momentum based on news?`,
    { maxTokens: 600, temperature: 0.4 }
  );

  return {
    ...result as Awaited<ReturnType<typeof compareAssets>>,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Identify contrarian opportunities
 */
export async function findContrarianOpportunities(
  headlines: string[],
  marketSentiment: 'fearful' | 'neutral' | 'greedy'
): Promise<{
  opportunities: Array<{
    asset: string;
    contraPerspective: string;
    reasoning: string;
    risk: string;
    confidence: number;
  }>;
  marketContext: string;
  generatedAt: string;
}> {
  if (!isGroqConfigured()) {
    throw new Error('AI features require GROQ_API_KEY');
  }

  const systemPrompt = `You are a contrarian crypto investor looking for opportunities where the crowd is wrong.

Based on the overall market sentiment, find assets where:
- If market is fearful: quality assets being oversold
- If market is greedy: overextended assets due for correction
- If neutral: misunderstood or overlooked opportunities

Return JSON:
{
  "opportunities": [
    {
      "asset": "asset name or theme",
      "contraPerspective": "the contrarian view",
      "reasoning": "why the crowd might be wrong",
      "risk": "main risk of this trade",
      "confidence": 0.0-1.0
    }
  ],
  "marketContext": "overall market read"
}`;

  const result = await promptGroqJsonCached(
    'contrarian',
    systemPrompt,
    `Market Sentiment: ${marketSentiment}

Recent Headlines:
${headlines.slice(0, 30).join('\n')}

Find contrarian opportunities.`,
    { maxTokens: 1000, temperature: 0.5 }
  );

  return {
    ...result as Omit<Awaited<ReturnType<typeof findContrarianOpportunities>>, 'generatedAt'>,
    generatedAt: new Date().toISOString(),
  };
}
