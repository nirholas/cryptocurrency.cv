/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { ArrowUp, ArrowDown, RefreshCw } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

/**
 * One asset's sentiment, derived entirely from the classified articles
 * `/api/sentiment` returns.
 *
 * Social volume, a 24h sentiment delta and a 7-day trend used to sit here too,
 * filled with `Math.random()` because nothing on this deployment measures them.
 * A column of noise reads exactly like a measurement, so they are gone rather
 * than guessed.
 */
interface CoinSentiment {
  coin: string;
  symbol: string;
  /** 0-100, averaged over the article classifications for this asset. */
  score: number;
  /** Articles mentioning the asset in the window. */
  articles: number;
  bullish: number;
  bearish: number;
}

/** One classified article as `/api/sentiment` returns it. */
interface SentimentArticle {
  sentiment?: keyof typeof SENTIMENT_SCORES;
  affectedAssets?: string[];
}

/** The 0-100 score each classification contributes to an asset's average. */
const SENTIMENT_SCORES = {
  very_bullish: 90,
  bullish: 70,
  neutral: 50,
  bearish: 30,
  very_bearish: 10,
} as const;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getScoreColor(score: number): string {
  if (score >= 75) return 'bg-emerald-500';
  if (score >= 55) return 'bg-green-400';
  if (score >= 45) return 'bg-yellow-400';
  if (score >= 25) return 'bg-orange-400';
  return 'bg-red-500';
}

function getScoreLabel(score: number): string {
  if (score >= 75) return 'Very Bullish';
  if (score >= 55) return 'Bullish';
  if (score >= 45) return 'Neutral';
  if (score >= 25) return 'Bearish';
  return 'Very Bearish';
}

function getScoreTextColor(score: number): string {
  if (score >= 75) return 'text-emerald-600 dark:text-emerald-400';
  if (score >= 55) return 'text-green-500 dark:text-green-400';
  if (score >= 45) return 'text-yellow-500 dark:text-yellow-400';
  if (score >= 25) return 'text-orange-500 dark:text-orange-400';
  return 'text-red-500 dark:text-red-400';
}

/* ------------------------------------------------------------------ */
/*  SentimentTable Component                                           */
/* ------------------------------------------------------------------ */

export default function SentimentTable({ className }: { className?: string }) {
  const [coins, setCoins] = useState<CoinSentiment[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<'score' | 'articles'>('score');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const res = await fetch('/api/sentiment?limit=30');
        if (!res.ok) throw new Error(`sentiment responded ${res.status}`);
        const json = await res.json();
        const articles: SentimentArticle[] = Array.isArray(json.articles) ? json.articles : [];

        const byAsset = new Map<string, { scores: number[]; bullish: number; bearish: number }>();
        for (const article of articles) {
          const score = SENTIMENT_SCORES[article.sentiment ?? 'neutral'];
          if (score === undefined) continue;
          for (const ticker of article.affectedAssets ?? []) {
            const key = ticker.toUpperCase();
            const entry = byAsset.get(key) ?? { scores: [], bullish: 0, bearish: 0 };
            entry.scores.push(score);
            if (score > 55) entry.bullish += 1;
            if (score < 45) entry.bearish += 1;
            byAsset.set(key, entry);
          }
        }

        const mapped: CoinSentiment[] = Array.from(byAsset.entries()).map(([symbol, entry]) => ({
          coin: symbol,
          symbol,
          score: Math.round(entry.scores.reduce((sum, v) => sum + v, 0) / entry.scores.length),
          articles: entry.scores.length,
          bullish: entry.bullish,
          bearish: entry.bearish,
        }));

        if (!cancelled) setCoins(mapped);
      } catch {
        if (!cancelled) setCoins([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const sorted = [...coins].sort((a, b) => {
    const dir = sortDir === 'desc' ? -1 : 1;
    return (a[sortKey] - b[sortKey]) * dir;
  });

  function handleSort(key: typeof sortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  function SortIcon({ col }: { col: typeof sortKey }) {
    if (col !== sortKey) return null;
    return sortDir === 'desc' ? (
      <ArrowDown className="ml-0.5 inline h-3 w-3" />
    ) : (
      <ArrowUp className="ml-0.5 inline h-3 w-3" />
    );
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      <div className="-webkit-overflow-scrolling-touch overflow-x-auto">
        <table className="w-full min-w-120 text-sm">
          <thead>
            <tr className="border-border text-text-tertiary border-b text-left text-xs tracking-wider uppercase">
              <th className="px-4 py-3 font-medium">Coin</th>
              <th
                className="hover:text-text-primary cursor-pointer px-4 py-3 font-medium select-none"
                onClick={() => handleSort('score')}
              >
                Sentiment <SortIcon col="score" />
              </th>
              <th
                className="hover:text-text-primary hidden cursor-pointer px-4 py-3 font-medium select-none sm:table-cell"
                onClick={() => handleSort('articles')}
              >
                Articles <SortIcon col="articles" />
              </th>
              <th className="hidden px-4 py-3 font-medium md:table-cell">Bullish</th>
              <th className="hidden px-4 py-3 font-medium md:table-cell">Bearish</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-border border-b last:border-0">
                    {Array.from({ length: 4 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="bg-border h-4 w-16 animate-pulse rounded" />
                      </td>
                    ))}
                  </tr>
                ))
              : sorted.map((c) => (
                  <tr
                    key={c.symbol}
                    className="border-border border-b transition-colors last:border-0 hover:bg-(--color-surface-hover,var(--color-border))/30"
                  >
                    {/* Coin */}
                    <td className="text-text-primary px-4 py-3 font-medium">
                      <span className="font-semibold">{c.symbol}</span>
                      <span className="text-text-tertiary ml-1.5 hidden text-xs sm:inline">
                        {c.coin}
                      </span>
                    </td>

                    {/* Sentiment Score */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="bg-border h-2 w-16 overflow-hidden rounded-full">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all',
                              getScoreColor(c.score),
                            )}
                            style={{ width: `${c.score}%` }}
                          />
                        </div>
                        <span
                          className={cn(
                            'text-xs font-semibold tabular-nums',
                            getScoreTextColor(c.score),
                          )}
                        >
                          {c.score}
                        </span>
                        <span className="text-text-tertiary hidden text-[10px] md:inline">
                          {getScoreLabel(c.score)}
                        </span>
                      </div>
                    </td>

                    {/* Articles in the window */}
                    <td className="text-text-secondary hidden px-4 py-3 tabular-nums sm:table-cell">
                      {c.articles}
                    </td>

                    {/* Bullish / bearish split of those articles */}
                    <td className="hidden px-4 py-3 tabular-nums md:table-cell">
                      <span className="inline-flex items-center gap-0.5 text-xs font-medium text-green-500 dark:text-green-400">
                        <ArrowUp className="h-3 w-3" />
                        {c.bullish}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 tabular-nums md:table-cell">
                      <span className="inline-flex items-center gap-0.5 text-xs font-medium text-red-500 dark:text-red-400">
                        <ArrowDown className="h-3 w-3" />
                        {c.bearish}
                      </span>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {!loading && coins.length === 0 && (
        <div className="text-text-secondary p-12 text-center">
          <RefreshCw className="mx-auto mb-2 h-6 w-6 opacity-40" />
          No sentiment data available.
        </div>
      )}
    </Card>
  );
}
