/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

/**
 * AI Analysis — an async server component that asks Groq (free LLM) to
 * summarize a coin from its live market data and recent headlines. Cached, and
 * degrades to null when Groq is unavailable so the page never breaks.
 */

import { aiComplete, isAIConfigured } from '@/lib/ai-provider';
import { parseGroqJson } from '@/lib/groq';
import { aiCache, generateCacheKey, withCache } from '@/lib/cache';
import { Sparkles } from 'lucide-react';

interface CoinAnalysis {
  summary: string;
  drivers: string[];
  outlook: 'bullish' | 'neutral' | 'bearish';
  risk: string;
}

interface AnalysisInput {
  name: string;
  symbol: string;
  price?: number;
  change24h?: number;
  change7d?: number;
  change30d?: number;
  marketCap?: number;
  rank?: number;
  athChange?: number;
  headlines: string[];
}

function num(n?: number): string {
  return n == null ? 'n/a' : n.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

export async function AiCoinAnalysis(input: AnalysisInput) {
  if (!isAIConfigured()) return null;

  const facts = [
    `Coin: ${input.name} (${input.symbol.toUpperCase()})`,
    input.rank != null ? `Market cap rank: #${input.rank}` : '',
    input.price != null ? `Price: $${num(input.price)}` : '',
    input.marketCap != null ? `Market cap: $${num(input.marketCap)}` : '',
    input.change24h != null ? `24h change: ${input.change24h.toFixed(2)}%` : '',
    input.change7d != null ? `7d change: ${input.change7d.toFixed(2)}%` : '',
    input.change30d != null ? `30d change: ${input.change30d.toFixed(2)}%` : '',
    input.athChange != null ? `From all-time high: ${input.athChange.toFixed(2)}%` : '',
  ]
    .filter(Boolean)
    .join('\n');

  const headlines = input.headlines.slice(0, 6).map((h) => `- ${h}`).join('\n');

  const systemPrompt = `You are a concise, neutral crypto market analyst. Given live market data and recent headlines for a cryptocurrency, produce a short factual briefing. Never give financial advice or price predictions. Base everything strictly on the data provided.

Respond as JSON only: {"summary": string (2-3 sentences on current state), "drivers": string[] (2-4 short bullet phrases explaining recent price action), "outlook": "bullish"|"neutral"|"bearish" (short-term technical read from the momentum data only), "risk": string (one sentence noting a key risk or caveat)}`;
  const userPrompt = `Market data:\n${facts}\n\nRecent headlines:\n${headlines || '(none available)'}`;

  // Cache per coin+data so repeated views don't re-spend tokens. aiComplete
  // chains providers (Groq -> OpenRouter -> ...) and skips any that are
  // rate-limited or out of quota, so a full free tier fails over instead of
  // dropping the section.
  let analysis: CoinAnalysis;
  try {
    const cacheKey = generateCacheKey('coin-analysis', {
      c: input.symbol.toLowerCase(),
      p: Math.round(input.price ?? 0),
      d: Math.round(input.change24h ?? 0),
    });
    analysis = await withCache(aiCache, cacheKey, 600, async () => {
      const raw = await aiComplete(
        systemPrompt,
        userPrompt,
        { temperature: 0.4, maxTokens: 500, jsonMode: true },
        true, // preferGroq: try the fast free tier first, then fail over
      );
      return parseGroqJson<CoinAnalysis>(raw);
    });
  } catch {
    return null;
  }

  if (!analysis?.summary) return null;

  const outlookStyle =
    analysis.outlook === 'bullish'
      ? 'bg-green-500/10 text-green-600 dark:text-green-400'
      : analysis.outlook === 'bearish'
        ? 'bg-red-500/10 text-red-600 dark:text-red-400'
        : 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400';

  return (
    <div className="mb-10">
      <div className="mb-4 flex items-center gap-2">
        <h2 className="text-text-primary font-serif text-xl font-bold">AI Analysis</h2>
        <Sparkles className="h-4 w-4 text-blue-500" aria-hidden />
        {analysis.outlook && (
          <span className={`ml-1 rounded-md px-2 py-0.5 text-xs font-medium capitalize ${outlookStyle}`}>
            {analysis.outlook}
          </span>
        )}
      </div>
      <div className="border-border rounded-xl border bg-(--color-bg-secondary) p-5">
        <p className="text-text-secondary leading-relaxed">{analysis.summary}</p>

        {analysis.drivers?.length > 0 && (
          <ul className="mt-4 space-y-1.5">
            {analysis.drivers.map((d, i) => (
              <li key={i} className="text-text-secondary flex gap-2 text-sm">
                <span className="text-blue-500">•</span>
                <span>{d}</span>
              </li>
            ))}
          </ul>
        )}

        {analysis.risk && (
          <p className="text-text-tertiary border-border mt-4 border-t pt-3 text-sm">
            <span className="font-medium">Risk:</span> {analysis.risk}
          </p>
        )}

        <p className="text-text-tertiary mt-4 text-xs">
          Generated by AI from live data and headlines. Not financial advice.
        </p>
      </div>
    </div>
  );
}
