/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/cryptocurrency.cv
 */

/**
 * News sentiment shapes shared by GET /api/sentiment, plus the keyword
 * reading that answers when no AI provider can.
 *
 * The AI analysis is the primary path. When every provider is out of quota or
 * refused by billing, the route used to answer 503 to every poll; it now
 * answers from the headline lexicon in headline-tracker instead, flagged as
 * `method: "keyword"` with a capped confidence so a caller can tell the two
 * apart and weigh them accordingly.
 *
 * @module lib/news-sentiment
 */

import type { NewsArticle } from '@/lib/crypto-news';
import { calculateSentiment, sentimentTerms } from '@/lib/headline-tracker';
import { extractTickers } from '@/lib/anomaly-detector';

export type SentimentLabel = 'very_bullish' | 'bullish' | 'neutral' | 'bearish' | 'very_bearish';

export interface SentimentArticle {
  title: string;
  link: string;
  source: string;
  sentiment: SentimentLabel;
  /** 0-100 */
  confidence: number;
  reasoning: string;
  impactLevel: 'high' | 'medium' | 'low';
  timeHorizon: 'immediate' | 'short_term' | 'long_term';
  affectedAssets: string[];
}

export interface MarketSentiment {
  overall: SentimentLabel;
  /** -100 to 100 */
  score: number;
  confidence: number;
  summary: string;
  keyDrivers: string[];
}

export interface SentimentAnalysis {
  articles: SentimentArticle[];
  market: MarketSentiment;
  articlesAnalyzed: number;
  analyzedAt: string;
  method: 'ai' | 'keyword';
}

/**
 * Highest confidence (0-100) a keyword reading may claim. A lexicon match is
 * evidence, not analysis, so it never reports the certainty the AI path can.
 */
export const KEYWORD_CONFIDENCE_CAP = 40;

/** Longest asset symbol accepted from `?asset=`. */
const MAX_ASSET_LENGTH = 15;

/**
 * Normalise a caller-supplied `?asset=` value to an uppercase symbol, or
 * return null when it cannot be a ticker (so the route can answer 400 instead
 * of filtering on garbage).
 */
export function normalizeAsset(raw: string | null): string | null | undefined {
  if (raw === null) return undefined;
  const symbol = raw.trim().replace(/^\$/, '').toUpperCase();
  if (symbol.length === 0) return undefined;
  if (symbol.length > MAX_ASSET_LENGTH || !/^[A-Z0-9]+$/.test(symbol)) return null;
  return symbol;
}

/** Map a -1..1 score onto the five sentiment labels. */
export function labelForScore(score: number): SentimentLabel {
  if (score >= 0.6) return 'very_bullish';
  if (score > 0.1) return 'bullish';
  if (score <= -0.6) return 'very_bearish';
  if (score < -0.1) return 'bearish';
  return 'neutral';
}

/** True when `text` names `asset` as a whole word, ignoring case. */
export function mentionsAsset(text: string, asset: string): boolean {
  const escaped = asset.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^A-Za-z0-9])\\$?${escaped}([^A-Za-z0-9]|$)`, 'i').test(text);
}

/**
 * True when an analysed article is tagged with `asset`. Matching is exact on
 * the symbol: a substring test let a one-letter ticker match every article.
 */
export function articleAffectsAsset(article: Pick<SentimentArticle, 'affectedAssets'>, asset: string): boolean {
  if (!Array.isArray(article.affectedAssets)) return false;
  return article.affectedAssets.some(
    (ticker) => typeof ticker === 'string' && ticker.trim().replace(/^\$/, '').toUpperCase() === asset,
  );
}

function describeTerms(positive: string[], negative: string[]): string {
  if (positive.length === 0 && negative.length === 0) {
    return 'No market-moving terms in the headline.';
  }
  const parts: string[] = [];
  if (positive.length > 0) parts.push(`positive: ${positive.join(', ')}`);
  if (negative.length > 0) parts.push(`negative: ${negative.join(', ')}`);
  return `Keyword reading (${parts.join('; ')}).`;
}

function readArticle(article: NewsArticle, asset: string | undefined): { article: SentimentArticle; score: number } {
  const text = `${article.title} ${article.description ?? ''}`;
  const score = calculateSentiment(text);
  const { positive, negative } = sentimentTerms(text);

  const affectedAssets = extractTickers(text);
  if (asset && !affectedAssets.includes(asset) && mentionsAsset(text, asset)) {
    affectedAssets.push(asset);
  }

  return {
    article: {
      title: article.title,
      link: article.link,
      source: article.source,
      sentiment: labelForScore(score),
      confidence: Math.round(Math.min(1, Math.abs(score)) * KEYWORD_CONFIDENCE_CAP),
      reasoning: describeTerms(positive, negative),
      impactLevel: score === 0 ? 'low' : 'medium',
      timeHorizon: 'short_term',
      affectedAssets,
    },
    score,
  };
}

/**
 * Score `articles` from their headline and summary terms. `asset` (an
 * already-normalised symbol) is tagged on every article that names it, so the
 * route's asset filter works the same way it does on the AI path.
 */
export function keywordSentiment(articles: NewsArticle[], asset?: string): SentimentAnalysis {
  const read = articles.map((article) => readArticle(article, asset));

  const meanScore = read.length > 0 ? read.reduce((sum, a) => sum + a.score, 0) / read.length : 0;
  const withSignal = read.filter((a) => a.score !== 0);
  const bullish = read.filter((a) => a.score > 0).length;
  const bearish = read.filter((a) => a.score < 0).length;
  const neutral = read.length - bullish - bearish;

  const keyDrivers = [...withSignal]
    .sort((a, b) => Math.abs(b.score) - Math.abs(a.score))
    .slice(0, 3)
    .map((a) => a.article.title);

  return {
    articles: read.map((a) => a.article),
    market: {
      overall: labelForScore(meanScore),
      score: Math.round(meanScore * 100),
      confidence: read.length > 0 ? Math.round((withSignal.length / read.length) * KEYWORD_CONFIDENCE_CAP) : 0,
      summary: `Keyword reading of ${read.length} headlines: ${bullish} bullish, ${bearish} bearish, ${neutral} neutral. AI analysis is temporarily unavailable, so this is a coarser signal.`,
      keyDrivers,
    },
    articlesAnalyzed: read.length,
    analyzedAt: new Date().toISOString(),
    method: 'keyword',
  };
}
