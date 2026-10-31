/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/cryptocurrency.cv
 */

/**
 * Narrative shapes shared by GET /api/narratives, plus the keyword reading
 * that answers when no AI provider can.
 *
 * The AI analysis is the primary path. When every provider is out of quota or
 * refused by billing, the route used to answer 503 and the narratives panels
 * stayed empty. It now groups the same headlines by their topic, event,
 * technology and entity tags instead, flagged as `method: "keyword"` so a
 * caller can tell the two apart.
 *
 * @module lib/keyword-narratives
 */

import { extractTickers } from '@/lib/anomaly-detector';
import type { NewsArticle } from '@/lib/crypto-news';
import { keywordSentiment, labelForScore } from '@/lib/news-sentiment';
import { extractTagsFromArticle, type Tag } from '@/lib/tags';

export interface Narrative {
  id: string;
  name: string;
  description: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  /** 0-100, how dominant this narrative is in the analysed batch. */
  strength: number;
  articles: {
    title: string;
    link: string;
    source: string;
  }[];
  relatedTickers: string[];
  keyPhrases: string[];
  /** True when the narrative is concentrated in the newer half of the batch. */
  emerging: boolean;
}

/** Tag categories that describe a theme. Asset and sentiment tags do not. */
const THEME_CATEGORIES: ReadonlySet<Tag['category']> = new Set(['topic', 'event', 'technology', 'entity']);

/** Most narratives returned, matching the 3-7 the AI prompt asks for. */
export const MAX_KEYWORD_NARRATIVES = 7;

/** Articles listed per narrative. */
const MAX_ARTICLES_PER_NARRATIVE = 8;
const MAX_TICKERS_PER_NARRATIVE = 5;
const MAX_PHRASES_PER_NARRATIVE = 5;

/**
 * A group whose articles are mostly already covered by a stronger group is
 * the same story under another tag (airdrop/airdrops, hack/exploit), so it is
 * dropped rather than listed twice.
 */
const OVERLAP_DROP_RATIO = 0.8;

/** Share of a group's dated articles that must be in the newer half to count as emerging. */
const EMERGING_SHARE = 2 / 3;

interface Group {
  tag: Tag;
  indexes: number[];
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function articleText(article: NewsArticle): string {
  return `${article.title} ${article.description ?? ''}`;
}

/** Fewest articles a tag needs before it reads as a narrative rather than a mention. */
function minimumGroupSize(total: number): number {
  return Math.max(2, Math.ceil(total * 0.05));
}

function sentimentFor(articles: NewsArticle[]): Narrative['sentiment'] {
  const label = labelForScore(keywordSentiment(articles).market.score / 100);
  if (label === 'very_bullish' || label === 'bullish') return 'bullish';
  if (label === 'very_bearish' || label === 'bearish') return 'bearish';
  return 'neutral';
}

/** Tag keywords that actually occur in the group's text, most frequent first. */
function matchedPhrases(tag: Tag, texts: string[]): string[] {
  return tag.keywords
    .map((keyword) => {
      const regex = new RegExp(`\\b${escapeRegExp(keyword)}\\b`, 'i');
      return { keyword, hits: texts.filter((text) => regex.test(text)).length };
    })
    .filter((k) => k.hits > 0)
    .sort((a, b) => b.hits - a.hits)
    .slice(0, MAX_PHRASES_PER_NARRATIVE)
    .map((k) => k.keyword);
}

function tickersFor(texts: string[]): string[] {
  const counts = new Map<string, number>();
  for (const text of texts) {
    for (const ticker of extractTickers(text)) {
      counts.set(ticker, (counts.get(ticker) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_TICKERS_PER_NARRATIVE)
    .map(([ticker]) => ticker);
}

function publishedAt(article: NewsArticle): number | null {
  if (article.dateEstimated) return null;
  const time = Date.parse(article.pubDate);
  return Number.isFinite(time) ? time : null;
}

function medianTime(articles: NewsArticle[]): number | null {
  const times = articles
    .map(publishedAt)
    .filter((t): t is number => t !== null)
    .sort((a, b) => a - b);
  if (times.length === 0) return null;
  const mid = Math.floor(times.length / 2);
  return times.length % 2 === 0 ? (times[mid - 1] + times[mid]) / 2 : times[mid];
}

function isEmerging(group: NewsArticle[], median: number | null): boolean {
  if (median === null) return false;
  const dated = group.map(publishedAt).filter((t): t is number => t !== null);
  if (dated.length < 2) return false;
  return dated.filter((t) => t > median).length / dated.length >= EMERGING_SHARE;
}

/**
 * Group `articles` into the narratives they share, strongest first. Each
 * article can support several narratives, as on the AI path. Returns an empty
 * list when no theme reaches the minimum group size.
 */
export function keywordNarratives(articles: NewsArticle[]): Narrative[] {
  const total = articles.length;
  if (total === 0) return [];

  const groups = new Map<string, Group>();
  articles.forEach((article, index) => {
    for (const tag of extractTagsFromArticle(article)) {
      if (!THEME_CATEGORIES.has(tag.category)) continue;
      const group = groups.get(tag.slug) ?? { tag, indexes: [] };
      group.indexes.push(index);
      groups.set(tag.slug, group);
    }
  });

  const minSize = minimumGroupSize(total);
  const ranked = [...groups.values()]
    .filter((g) => g.indexes.length >= minSize)
    .sort((a, b) => b.indexes.length - a.indexes.length || b.tag.priority - a.tag.priority);

  const kept: Group[] = [];
  for (const group of ranked) {
    if (kept.length >= MAX_KEYWORD_NARRATIVES) break;
    const duplicate = kept.some((stronger) => {
      const covered = new Set(stronger.indexes);
      const shared = group.indexes.filter((i) => covered.has(i)).length;
      return shared / group.indexes.length >= OVERLAP_DROP_RATIO;
    });
    if (!duplicate) kept.push(group);
  }

  const median = medianTime(articles);

  return kept.map(({ tag, indexes }) => {
    const members = indexes.map((i) => articles[i]);
    const texts = members.map(articleText);
    return {
      id: tag.slug.replace(/-/g, '_'),
      name: tag.name,
      description: `${members.length} of ${total} recent headlines. ${tag.description}`,
      sentiment: sentimentFor(members),
      strength: Math.min(100, Math.round((members.length / total) * 100)),
      articles: members
        .slice(0, MAX_ARTICLES_PER_NARRATIVE)
        .map((a) => ({ title: a.title, link: a.link, source: a.source })),
      relatedTickers: tickersFor(texts),
      keyPhrases: matchedPhrases(tag, texts),
      emerging: isEmerging(members, median),
    };
  });
}
