/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/cryptocurrency.cv
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

/**
 * Story provenance: who broke it, and who followed.
 *
 * An aggregator with 200+ sources sees the same event arrive 40 times. Every
 * other reader of that firehose gets 40 headlines. This turns them into one
 * story with a timeline: the outlet that published first, then everyone who
 * followed and how far behind they were.
 *
 * ```ts
 * import { analyseProvenance } from '@/lib/provenance';
 *
 * const report = await analyseProvenance({ limit: 200 });
 * report.stories[0].originator?.source;   // "The Block"
 * report.stories[0].appearances.length;   // 23
 * report.stories[0].confidence;           // "high"
 * ```
 *
 * The engine is pure and deterministic (see ./cluster); this module is the thin
 * layer that feeds it the live corpus and caches the result, because clustering
 * a few hundred articles is cheap but not free and the answer changes on the
 * timescale that news arrives, not per request.
 *
 * @module lib/provenance
 */

import { getLatestNews } from '@/lib/crypto-news';
import { withCache, newsCache } from '@/lib/cache';

import { clusterStories, DEFAULT_THRESHOLD, DEFAULT_WINDOW_MS } from './cluster';
import { buildLeaderboard } from './leaderboard';
import type { ProvenanceInput, ProvenanceReport, SourceScore, Story } from './types';

export {
  clusterStories,
  DEFAULT_THRESHOLD,
  DEFAULT_WINDOW_MS,
  formatLag,
  storyId,
} from './cluster';
export { buildLeaderboard, MIN_STORIES_FOR_RATE } from './leaderboard';
export { tokenise } from './text';
export { buildIdf, idfNorm, informativeFloor, overlap, MIN_SHARED_TERMS } from './similarity';
export { estimateSimilarity, signature } from './minhash';
export type {
  ProvenanceConfidence,
  ProvenanceInput,
  ProvenanceReport,
  SourceScore,
  Story,
  StoryAppearance,
} from './types';

/** Clustering is stable for a few minutes; news does not arrive faster than this matters. */
const CACHE_TTL_SECONDS = 300;

/** How many articles to pull when the caller does not say. */
const DEFAULT_CORPUS = 150;

/**
 * Widest corpus a single request may ask for. Clustering is near-linear, but the
 * upstream fetch behind it is not free, and an unbounded `limit` is an invitation
 * to make this endpoint the most expensive one on the site.
 */
const MAX_CORPUS = 300;

export interface AnalyseOptions {
  /** Articles to pull into the corpus (clamped to MAX_CORPUS). */
  limit?: number;
  /** Restrict the corpus to one category slug. */
  category?: string;
  /** Similarity required to call two articles one story. */
  threshold?: number;
  /** How far apart two articles may publish and still group. */
  windowMs?: number;
  /** Keep single-outlet stories, which are exclusives rather than clusters. */
  includeExclusives?: boolean;
  /** Injected clock, for determinism in tests. */
  now?: Date;
}

/**
 * Pull a corpus from the live aggregate feed and cluster it.
 *
 * Cached for {@link CACHE_TTL_SECONDS} on the option set, so a burst of
 * requests for the same view shares one clustering pass.
 */
export async function analyseProvenance(opts: AnalyseOptions = {}): Promise<ProvenanceReport> {
  const limit = Math.min(Math.max(20, opts.limit ?? DEFAULT_CORPUS), MAX_CORPUS);
  const threshold = opts.threshold ?? DEFAULT_THRESHOLD;
  const windowMs = opts.windowMs ?? DEFAULT_WINDOW_MS;
  const minOutlets = opts.includeExclusives ? 1 : 2;
  const key = `provenance:${limit}:${opts.category ?? 'all'}:${threshold}:${windowMs}:${minOutlets}`;

  return withCache(
    newsCache,
    key,
    CACHE_TTL_SECONDS,
    async () => {
      const news = await getLatestNews(
        limit,
        undefined,
        opts.category ? { category: opts.category } : undefined,
      );
      const corpus: ProvenanceInput[] = news.articles.map((a) => ({
        title: a.title,
        link: a.link,
        description: a.description,
        pubDate: a.pubDate,
        dateEstimated: a.dateEstimated,
        source: a.source,
        sourceKey: a.sourceKey,
        category: a.category,
        imageUrl: a.imageUrl,
      }));
      return clusterStories(corpus, { threshold, windowMs, minOutlets, now: opts.now });
    },
    // An upstream blip should leave the last clustering standing rather than
    // emptying a page that was full a minute ago, and an empty corpus must
    // never be cached over a good one.
    { serveStaleOnError: true, shouldCache: (report) => report.analysed > 0 },
  );
}

/**
 * One story by id, or null when it has aged out of the current window.
 *
 * Story ids are derived from the originating article's link and are stable while
 * that story stays in the window; they are not permanent identifiers, and the
 * API says so rather than pretending to an archive it does not keep.
 */
export async function getStory(id: string, opts: AnalyseOptions = {}): Promise<Story | null> {
  const report = await analyseProvenance({ ...opts, limit: opts.limit ?? MAX_CORPUS });
  return report.stories.find((s) => s.id === id) ?? null;
}

/**
 * The outlet scoreboard over a freshly clustered corpus.
 *
 * Exclusives are included in the corpus here (`includeExclusives`) so an
 * outlet's solo coverage is visible in its row rather than silently dropped.
 */
export async function getSourceLeaderboard(opts: AnalyseOptions = {}): Promise<{
  scores: SourceScore[];
  report: ProvenanceReport;
}> {
  const report = await analyseProvenance({
    ...opts,
    includeExclusives: true,
    limit: opts.limit ?? MAX_CORPUS,
  });
  const corpus: ProvenanceInput[] = report.stories.flatMap((s) =>
    s.appearances.map((a) => ({
      title: a.title,
      link: a.link,
      pubDate: a.publishedAt,
      source: a.source,
      sourceKey: a.sourceKey,
    })),
  );
  return { scores: buildLeaderboard(report.stories, corpus), report };
}
