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
 * Scoring outlets on what they actually do: break stories, or follow them.
 *
 * Every "top crypto news sources" list is either a popularity poll or an SEO
 * traffic estimate. Neither measures journalism. This does, from one narrow but
 * checkable angle: across the stories in a window, how often did an outlet
 * publish first, and when it did not, how far behind was it?
 *
 * The numbers are deliberately conservative:
 *  - Only stories with a credible originator count toward origination.
 *  - An exclusive (nobody else covered it) is counted separately and never as
 *    an origination, because a story nobody corroborated is not a proven scoop.
 *  - An outlet with too few stories gets a null rate rather than a flattering
 *    100% off two articles.
 *
 * What this is not: a quality or accuracy ranking. Publishing first is one
 * measurable virtue among many, and the API says so wherever it reports these.
 *
 * @module lib/provenance/leaderboard
 */

import { formatLag } from './cluster';
import type { ProvenanceInput, SourceScore, Story } from './types';

/**
 * Below this many clustered stories, an outlet's origination rate is noise, so
 * it is reported as null rather than as a number people would rank on.
 */
export const MIN_STORIES_FOR_RATE = 5;

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

/**
 * Build the per-outlet scoreboard from a clustered corpus.
 *
 * @param stories  clustered stories, from `clusterStories`
 * @param articles the corpus those stories came from, so outlets that published
 *                 into the window but never clustered still appear with an
 *                 honest zero rather than vanishing from the board
 */
export function buildLeaderboard(
  stories: readonly Story[],
  articles: readonly ProvenanceInput[] = [],
): SourceScore[] {
  interface Acc {
    source: string;
    sourceKey: string;
    originated: number;
    followed: number;
    soloed: number;
    lags: number[];
    stories: number;
    articles: number;
  }

  const acc = new Map<string, Acc>();
  const ensure = (source: string, sourceKey: string): Acc => {
    let entry = acc.get(sourceKey);
    if (!entry) {
      entry = {
        source,
        sourceKey,
        originated: 0,
        followed: 0,
        soloed: 0,
        lags: [],
        stories: 0,
        articles: 0,
      };
      acc.set(sourceKey, entry);
    }
    return entry;
  };

  for (const article of articles) ensure(article.source, article.sourceKey).articles++;

  for (const story of stories) {
    const originKey = story.originator?.sourceKey ?? null;
    // A one-outlet cluster is an exclusive: real, but nobody corroborated it.
    const exclusive = story.outletCount === 1;

    for (const appearance of story.appearances) {
      const entry = ensure(appearance.source, appearance.sourceKey);
      entry.stories++;
      if (exclusive) {
        entry.soloed++;
        continue;
      }
      if (originKey && appearance.sourceKey === originKey) {
        entry.originated++;
      } else if (originKey) {
        entry.followed++;
        if (!appearance.dateEstimated && appearance.lagMs > 0) entry.lags.push(appearance.lagMs);
      }
      // With no credible originator nobody is credited either way, which is the
      // honest outcome: the story happened, but who was first is unknown.
    }
  }

  const scores: SourceScore[] = [...acc.values()].map((entry) => {
    const decided = entry.originated + entry.followed;
    const medianLagMs = median(entry.lags);
    return {
      source: entry.source,
      sourceKey: entry.sourceKey,
      originated: entry.originated,
      followed: entry.followed,
      soloed: entry.soloed,
      originationRate:
        decided >= MIN_STORIES_FOR_RATE ? Number((entry.originated / decided).toFixed(3)) : null,
      medianLagMs,
      medianLag: medianLagMs === null ? null : formatLag(medianLagMs),
      storiesCovered: entry.stories,
      articles: entry.articles,
    };
  });

  // Outlets with a measurable rate first, best rate first, ties broken by the
  // outlet that originated more stories in absolute terms. Outlets without
  // enough evidence sort last rather than being hidden: their absence from the
  // ranking is itself information.
  return scores.sort((a, b) => {
    if (a.originationRate === null && b.originationRate === null) {
      return b.storiesCovered - a.storiesCovered;
    }
    if (a.originationRate === null) return 1;
    if (b.originationRate === null) return -1;
    return b.originationRate - a.originationRate || b.originated - a.originated;
  });
}
