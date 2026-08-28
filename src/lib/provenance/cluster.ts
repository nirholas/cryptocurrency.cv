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
 * Grouping articles into stories, and deciding who published first.
 *
 * The grouping is the easy half. The hard half is the claim: saying "this
 * outlet broke it and these forty followed" is an accusation of derivativeness,
 * and RSS timestamps are not good enough to make that claim casually.
 *
 * What feeds actually do:
 *  - omit a date entirely, so the aggregator infers one from fetch time
 *  - publish a future date, sometimes days ahead
 *  - backdate on edit, so a story updated at noon claims it was published at 6am
 *  - use the channel's build date for every item
 *
 * Any of those, taken at face value, hands the "first" crown to whoever lies
 * best. So this module refuses to credit an originator whose timestamp it does
 * not trust, and every story carries a confidence level and the sentence
 * explaining it. An honest "we cannot attribute this one" is the correct output
 * far more often than the interesting one.
 *
 * @module lib/provenance/cluster
 */

import { tokenise } from './text';
import { candidatePairs, signature } from './minhash';
import { buildIdf, idfNorm, informativeFloor, overlap } from './similarity';
import type {
  ProvenanceConfidence,
  ProvenanceInput,
  ProvenanceReport,
  Story,
  StoryAppearance,
} from './types';

/**
 * Default similarity for "same story".
 *
 * Calibrated, not guessed. `__tests__/fixtures.ts` holds a labelled corpus of
 * real-shaped articles and `__tests__/calibration.test.ts` sweeps the threshold
 * across it. The measured curve:
 *
 *   t=0.15  P=0.844  R=1.000     too loose: 5 false pairs
 *   t=0.25  P=1.000  R=1.000     plateau begins
 *   t=0.30  P=1.000  R=1.000     shipped
 *   t=0.35  P=1.000  R=1.000     plateau ends
 *   t=0.40  P=1.000  R=0.852     too tight: real clusters start splitting
 *
 * 0.3 is the middle of the perfect plateau rather than its edge, so a change in
 * tokenisation that shifts scores slightly in either direction degrades nothing.
 * Move this number and the calibration test tells you exactly what it costs.
 */
export const DEFAULT_THRESHOLD = 0.3;

/**
 * How far apart two articles can publish and still be one story. Rewrites and
 * follow-ups land within a day; beyond that, matching text is usually a
 * recurring format ("Bitcoin price analysis") rather than one event.
 */
export const DEFAULT_WINDOW_MS = 36 * 60 * 60 * 1000;

/**
 * A timestamp this far ahead of the corpus's own clock is a feed error, not a
 * scoop. Small positive skew is tolerated because publishers and our clock
 * disagree by seconds routinely.
 */
const FUTURE_TOLERANCE_MS = 10 * 60 * 1000;

/**
 * A lead this short is inside the noise floor of RSS polling and clock skew, so
 * it is not evidence that anyone broke anything.
 */
const MEANINGFUL_LEAD_MS = 60 * 1000;

/** A lead this long, from a credible timestamp, is a real scoop. */
const STRONG_LEAD_MS = 15 * 60 * 1000;

/**
 * Similarity the LSH filter is tuned for. Lower than the decision threshold on
 * purpose: this stage only has to avoid missing a real pair, and anything it
 * lets through is scored exactly afterwards.
 */
const CANDIDATE_THRESHOLD = 0.12;

interface Prepared {
  article: ProvenanceInput;
  /** Distinct content terms; the unit similarity is measured over. */
  terms: Set<string>;
  /** L2 norm of this document's IDF vector, precomputed for pair scoring. */
  norm: number;
  publishedMs: number;
  /** False when the feed's date was inferred, future-dated, or unparseable. */
  timingCredible: boolean;
}

/** Render a duration the way a person would say it. */
export function formatLag(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return 'first';
  // Floor, not round: 30 seconds is under a minute, and rounding it up to "1m"
  // overstates a lag that is already inside the polling noise floor.
  const minutes = Math.floor(ms / 60000);
  if (minutes < 1) return 'under a minute after';
  if (minutes < 60) return `${minutes}m after`;
  const hours = Math.floor(minutes / 60);
  const rem = minutes % 60;
  if (hours < 24) return rem ? `${hours}h ${rem}m after` : `${hours}h after`;
  const days = Math.floor(hours / 24);
  const remH = hours % 24;
  return remH ? `${days}d ${remH}h after` : `${days}d after`;
}

/**
 * A story id that is stable across runs and servers.
 *
 * Derived from the originating article's link, which is the one field that
 * identifies the story and does not move between two runs over the same corpus.
 * Deliberately not a content hash: an outlet editing its headline would
 * otherwise renumber the story and break every link to it.
 */
export function storyId(originLink: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < originLink.length; i++) {
    const c = originLink.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 0x01000193) >>> 0;
    h2 = Math.imul(h2 ^ c, 0x85ebca6b) >>> 0;
  }
  return (h1.toString(36) + h2.toString(36)).slice(0, 12);
}

function prepare(
  articles: readonly ProvenanceInput[],
  nowMs: number,
): { prepared: Prepared[]; idf: Map<string, number>; floor: number } {
  const staged = articles.map((article) => {
    const terms = new Set(tokenise(article.title, article.description));
    const parsed = Date.parse(article.pubDate);
    const valid = Number.isFinite(parsed);
    const future = valid && parsed > nowMs + FUTURE_TOLERANCE_MS;
    return {
      article,
      terms,
      // A future or unparseable date still needs a position in time for
      // ordering; clamping to now keeps it last rather than first, which is the
      // safe direction for a claim about who was earliest.
      publishedMs: valid && !future ? parsed : nowMs,
      timingCredible: valid && !future && !article.dateEstimated,
    };
  });

  // Term weights come from this corpus, so "unusual" means unusual in the news
  // being clustered rather than in some frozen background model.
  const idf = buildIdf(staged.map((p) => p.terms));
  const floor = informativeFloor(staged.length);
  const prepared: Prepared[] = staged.map((p) => ({ ...p, norm: idfNorm(p.terms, idf) }));
  return { prepared, idf, floor };
}

/**
 * Union-find over candidate pairs. Transitive by design: if A matches B and B
 * matches C, all three are one story even when A and C never scored above the
 * threshold directly, which is how a story that drifts as it is rewritten stays
 * in one cluster.
 */
function union(size: number, pairs: Array<[number, number]>): number[] {
  const parent = Array.from({ length: size }, (_, i) => i);
  const find = (x: number): number => {
    let root = x;
    while (parent[root] !== root) root = parent[root];
    while (parent[x] !== root) {
      const next = parent[x];
      parent[x] = root;
      x = next;
    }
    return root;
  };
  for (const [i, j] of pairs) {
    const ri = find(i);
    const rj = find(j);
    if (ri !== rj) parent[ri] = rj;
  }
  return parent.map((_, i) => find(i));
}

/**
 * Decide who, if anyone, gets credit for a story, and how sure we are.
 *
 * The rules, in order:
 *  - Nobody whose timestamp we do not trust can be the originator, ever.
 *  - A single outlet is not a provenance claim, it is one article.
 *  - A lead inside the polling noise floor is not a scoop.
 *  - Everything else is graded by how big the lead is and how much of the
 *    cluster has credible timing to compare against.
 */
function judge(members: Prepared[]): {
  origin: Prepared | null;
  confidence: ProvenanceConfidence;
  reason: string;
} {
  const credible = members
    .filter((m) => m.timingCredible)
    .sort((a, b) => a.publishedMs - b.publishedMs);
  const outlets = new Set(members.map((m) => m.article.sourceKey));

  if (outlets.size < 2) {
    return {
      origin: null,
      confidence: 'unattributed',
      reason: 'Only one outlet covered this, so there is nothing to compare it against.',
    };
  }
  if (credible.length === 0) {
    return {
      origin: null,
      confidence: 'unattributed',
      reason:
        'No outlet in this story published a usable timestamp, so first publication cannot be established.',
    };
  }
  if (credible.length === 1) {
    return {
      origin: credible[0],
      confidence: 'low',
      reason: `Only ${credible[0].article.source} published a usable timestamp, so its lead is unverified against the others.`,
    };
  }

  const first = credible[0];
  const second = credible[1];
  const lead = second.publishedMs - first.publishedMs;

  if (lead < MEANINGFUL_LEAD_MS) {
    return {
      origin: first,
      confidence: 'low',
      reason: `${first.article.source} and ${second.article.source} published within a minute of each other, which is inside feed-polling noise.`,
    };
  }

  const credibleShare = credible.length / members.length;
  if (lead >= STRONG_LEAD_MS && credibleShare >= 0.5) {
    return {
      origin: first,
      confidence: 'high',
      reason: `${first.article.source} published ${formatLag(lead)} the next outlet, with usable timestamps on ${credible.length} of ${members.length} articles.`,
    };
  }

  return {
    origin: first,
    confidence: 'medium',
    reason: `${first.article.source} led by ${formatLag(lead)}, with usable timestamps on ${credible.length} of ${members.length} articles.`,
  };
}

function toAppearance(
  member: Prepared,
  origin: Prepared | null,
  anchor: Prepared,
  idf: Map<string, number>,
  floor: number,
): StoryAppearance {
  const lagMs = origin ? Math.max(0, member.publishedMs - origin.publishedMs) : 0;
  return {
    source: member.article.source,
    sourceKey: member.article.sourceKey,
    title: member.article.title,
    link: member.article.link,
    publishedAt: new Date(member.publishedMs).toISOString(),
    lagMs,
    lag: origin && member !== origin ? formatLag(lagMs) : 'first',
    dateEstimated: !member.timingCredible,
    similarity:
      member === anchor
        ? 1
        : overlap(anchor.terms, member.terms, idf, anchor.norm, member.norm, floor).score,
  };
}

/**
 * Cluster a corpus into stories with provenance.
 *
 * Pure: the same articles and the same `now` always produce the same report, so
 * this is testable against fixtures and two servers agree.
 *
 * @param articles the corpus, typically one time window of the aggregate feed
 * @param opts.threshold  similarity required to call two articles one story
 * @param opts.windowMs   how far apart two articles may publish and still group
 * @param opts.now        the clock, injected so tests are not time-dependent
 * @param opts.minOutlets stories with fewer distinct outlets are dropped from
 *                        `stories` and counted in `unclustered`; 1 keeps singles
 */
export function clusterStories(
  articles: readonly ProvenanceInput[],
  opts: { threshold?: number; windowMs?: number; now?: Date; minOutlets?: number } = {},
): ProvenanceReport {
  const threshold = opts.threshold ?? DEFAULT_THRESHOLD;
  const windowMs = opts.windowMs ?? DEFAULT_WINDOW_MS;
  const now = opts.now ?? new Date();
  const nowMs = now.getTime();
  const minOutlets = opts.minOutlets ?? 2;

  const { prepared: all, idf, floor } = prepare(articles, nowMs);
  const prepared = all.filter((p) => p.terms.size > 0);
  const generatedAt = now.toISOString();

  if (prepared.length === 0) {
    return {
      stories: [],
      unclustered: articles.length,
      analysed: articles.length,
      threshold,
      generatedAt,
    };
  }

  // MinHash over the term sets proposes candidates cheaply. Its band
  // configuration is chosen for a lower similarity than the decision threshold
  // because it estimates unweighted Jaccard while the decision uses IDF-weighted
  // cosine: two write-ups of one event share few words overall but the words
  // they do share carry most of the weight, so the estimate reads lower than the
  // score. Recall at this stage matters more than precision, since every
  // candidate is scored exactly below.
  const signatures = prepared.map((p) => signature([...p.terms]));
  const confirmed: Array<[number, number]> = [];
  for (const [i, j] of candidatePairs(signatures, CANDIDATE_THRESHOLD)) {
    // Same outlet twice is a re-post or a live-blog update, not corroboration.
    if (prepared[i].article.sourceKey === prepared[j].article.sourceKey) continue;
    if (Math.abs(prepared[i].publishedMs - prepared[j].publishedMs) > windowMs) continue;
    const { score } = overlap(
      prepared[i].terms,
      prepared[j].terms,
      idf,
      prepared[i].norm,
      prepared[j].norm,
      floor,
    );
    if (score < threshold) continue;
    confirmed.push([i, j]);
  }

  const roots = union(prepared.length, confirmed);
  const groups = new Map<number, Prepared[]>();
  for (let i = 0; i < prepared.length; i++) {
    const root = roots[i];
    const group = groups.get(root);
    if (group) group.push(prepared[i]);
    else groups.set(root, [prepared[i]]);
  }

  const stories: Story[] = [];
  let unclustered = articles.length - prepared.length;

  for (const members of groups.values()) {
    const outlets = new Set(members.map((m) => m.article.sourceKey));
    if (outlets.size < minOutlets) {
      unclustered += members.length;
      continue;
    }

    const { origin, confidence, reason } = judge(members);
    const anchor = origin ?? members.slice().sort((a, b) => a.publishedMs - b.publishedMs)[0];

    const appearances = members
      .map((m) => toAppearance(m, origin, anchor, idf, floor))
      .sort((a, b) => {
        if (origin) {
          if (a.link === origin.article.link) return -1;
          if (b.link === origin.article.link) return 1;
        }
        return Date.parse(a.publishedAt) - Date.parse(b.publishedAt);
      });

    const times = members.map((m) => m.publishedMs).sort((a, b) => a - b);
    // The receipt: the terms this cluster actually shares. A provenance claim
    // that cannot show its evidence is just an assertion.
    //
    // Ranked by how much of the cluster carries a term, then by how unusual it
    // is. Weight alone surfaced the wrong words: a term appearing in only two
    // of five members scores higher than the entity all five name, so a story
    // about BlackRock offered "session" and "since" as its evidence. Coverage
    // first puts the shared subject at the top, which is what a reader checks.
    const coverage = new Map<string, number>();
    for (const member of members) {
      const shared =
        member === anchor
          ? [...anchor.terms].filter((t) => (idf.get(t) ?? 0) >= floor)
          : overlap(anchor.terms, member.terms, idf, anchor.norm, member.norm, floor).terms;
      for (const term of shared) coverage.set(term, (coverage.get(term) ?? 0) + 1);
    }
    const evidence = [...coverage.entries()]
      // A term only the anchor carries is not shared evidence.
      .filter(([, count]) => count > 1)
      .sort(
        (a, b) =>
          b[1] - a[1] || (idf.get(b[0]) ?? 0) - (idf.get(a[0]) ?? 0) || a[0].localeCompare(b[0]),
      )
      .map(([term]) => term);

    stories.push({
      id: storyId(anchor.article.link),
      title: anchor.article.title,
      imageUrl: members.find((m) => m.article.imageUrl)?.article.imageUrl,
      category: anchor.article.category,
      outletCount: outlets.size,
      firstPublishedAt: new Date(times[0]).toISOString(),
      lastPublishedAt: new Date(times[times.length - 1]).toISOString(),
      spreadMs: times[times.length - 1] - times[0],
      originator: origin ? toAppearance(origin, origin, anchor, idf, floor) : null,
      confidence,
      confidenceReason: reason,
      appearances,
      evidence: [...new Set(evidence)].slice(0, 6),
    });
  }

  // Widest coverage first: the stories the whole industry picked up are the
  // ones where provenance is most interesting and best evidenced.
  stories.sort(
    (a, b) =>
      b.outletCount - a.outletCount ||
      Date.parse(b.firstPublishedAt) - Date.parse(a.firstPublishedAt),
  );

  return { stories, unclustered, analysed: articles.length, threshold, generatedAt };
}
