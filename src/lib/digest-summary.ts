/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * AI daily digest generation, shared by `/api/digest` and the `/digest` page
 * so the page calls the generator in-process instead of fetching its own
 * public API route over HTTP.
 */

import { getLatestNews } from '@/lib/crypto-news';
import { isAIConfigured, promptAIJson } from '@/lib/ai-provider';

export type DigestPeriod = '6h' | '12h' | '24h';
export type DigestFormat = 'full' | 'brief' | 'newsletter';

export interface DigestSection {
  title: string;
  summary: string;
  articles: string[];
}

export interface DigestResponse {
  headline: string;
  tldr: string;
  marketSentiment: {
    overall: 'bullish' | 'bearish' | 'neutral' | 'mixed';
    reasoning: string;
  };
  sections: DigestSection[];
  mustRead: {
    title: string;
    source: string;
    why: string;
  }[];
  tickers: {
    symbol: string;
    mentions: number;
    sentiment: 'bullish' | 'bearish' | 'neutral';
  }[];
}

export interface DigestResult {
  digest: DigestResponse;
  meta: {
    period: string;
    format: string;
    articlesAnalyzed: number;
    generatedAt: string;
  };
}

/** Thrown when the feed returned nothing to summarise. */
export class DigestNoArticlesError extends Error {
  constructor() {
    super('No articles available for digest');
    this.name = 'DigestNoArticlesError';
  }
}

const SYSTEM_PROMPT = `You are a crypto news editor creating a daily digest. Analyze the provided articles and create a structured summary.

Create a digest with:
1. headline: A catchy headline summarizing the day's biggest story
2. tldr: 2-3 sentence summary of what happened today
3. marketSentiment: Overall market mood with reasoning
4. sections: Group related news into 3-5 themed sections (e.g., "Bitcoin & ETFs", "DeFi Updates", "Regulatory News")
5. mustRead: Top 2-3 must-read articles with reasons why they matter
6. tickers: Most mentioned cryptocurrencies with sentiment

Respond with valid JSON matching this structure.`;

const PERIOD_HOURS: Record<string, number> = { '6h': 6, '12h': 12, '24h': 24 };

const FORMAT_INSTRUCTIONS: Record<string, string> = {
  full: 'Create a comprehensive digest with all sections.',
  brief: 'Create a brief digest with just headline, tldr, and top 3 tickers.',
  newsletter: 'Format for email newsletter - make it engaging and readable.',
};

/** True when Groq or any fallback provider can produce a digest. */
export function isDigestAIConfigured(): boolean {
  return isAIConfigured();
}

export async function generateDigest(
  period: string = '24h',
  format: string = 'full',
): Promise<DigestResult> {
  const hours = PERIOD_HOURS[period] || 24;
  const limit = Math.min(hours * 5, 100); // ~5 articles per hour

  const data = await getLatestNews(limit);
  if (data.articles.length === 0) throw new DigestNoArticlesError();

  // Filter to articles within the time period
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
  const recentArticles = data.articles.filter((a) => new Date(a.pubDate) >= cutoff);
  const articlesForDigest = recentArticles.length > 0 ? recentArticles : data.articles.slice(0, 20);

  const articlesText = articlesForDigest
    .map((a) => `- [${a.source}] ${a.title}: ${a.description || 'No description'}`)
    .join('\n');

  const formatInstructions = FORMAT_INSTRUCTIONS[format] || FORMAT_INSTRUCTIONS.full;

  const userPrompt = `${formatInstructions}

Period: Last ${hours} hours
Total articles: ${articlesForDigest.length}

Articles:
${articlesText}`;

  // Groq first, then every other configured provider: an exhausted Groq quota
  // used to surface as a 503 even with a working fallback key.
  const digest = await promptAIJson<DigestResponse>(
    SYSTEM_PROMPT,
    userPrompt,
    { maxTokens: 3000, temperature: 0.5 },
    true,
  );

  return {
    digest,
    meta: {
      period,
      format,
      articlesAnalyzed: articlesForDigest.length,
      generatedAt: new Date().toISOString(),
    },
  };
}
