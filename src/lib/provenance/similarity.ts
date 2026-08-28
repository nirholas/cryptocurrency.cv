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
 * How similar are two articles, really.
 *
 * The first cut of this used word-order shingles, on the theory that word order
 * is what separates "SEC approves ETF" from "ETF approves SEC". Measured against
 * real rewrites of the same event, it did not work, and the measurement is worth
 * keeping because it explains the design:
 *
 *   same story, 5 pairs:      0.30 0.00 0.21 0.18 0.11
 *   different story, 5 pairs: 0.00 0.00 0.00 0.00 0.33
 *
 * There is no threshold in that data. Two outlets writing up one event reorder
 * and re-word almost everything, so shared 3-word phrases are rare; meanwhile
 * two *unrelated* stories sharing a template ("Bitcoin price analysis: BTC eyes
 * $70,000" versus "...BTC targets $65,000") share phrases in abundance. Order
 * sensitivity was measuring house style, not subject matter.
 *
 * What actually identifies a story is which *rare* terms co-occur. Both ETF
 * write-ups contain "blackrock", "inflow" and the same canonicalised dollar
 * figure; the two price templates share only "bitcoin", "price", "btc",
 * "analysis", which nearly every article in the corpus contains. So similarity
 * here is cosine over IDF-weighted terms, computed against the corpus being
 * clustered: a term's weight is set by how unusual it is *today*, which makes
 * the measure adapt to whatever the news cycle is saturated with.
 *
 * @module lib/provenance/similarity
 */

/**
 * A term appearing in more than this share of the corpus is treated as topic
 * furniture rather than evidence.
 *
 * A fixed weight cannot do this job: in a week dominated by ETF news "etf" is a
 * near-stopword, and in a quiet week it is a strong signal. Measuring against
 * the corpus makes "informative" mean "unusual here, today", which is exactly
 * the question. On real pairs this is what separates two write-ups of one event
 * (which share entities: `blackrock`, `ishare`, `trust`) from two instances of a
 * recurring template (which share only topic words: `bitcoin`, `price`, `btc`).
 *
 * A quarter of the corpus is deliberately generous. The aim is to disqualify
 * the handful of words every crypto headline contains, not to demand that two
 * articles share something nobody else mentioned.
 */
const MAX_DOCUMENT_FREQUENCY = 0.25;

/**
 * A match must rest on at least this many informative shared terms. One rare
 * token in common is a coincidence (two unrelated stories both mentioning
 * "Paradigm"); three is a subject.
 */
export const MIN_SHARED_TERMS = 3;

/** A document reduced to its distinct terms. */
export type TermSet = ReadonlySet<string>;

/**
 * Inverse document frequency across the corpus, smoothed.
 *
 * `ln(1 + N / df)`: a term in every document lands near ln(2), a term in one
 * document out of 200 lands near ln(201). The ratio between those is what makes
 * "blackrock" outweigh "bitcoin" without either being hand-listed anywhere.
 */
export function buildIdf(documents: readonly TermSet[]): Map<string, number> {
  const df = new Map<string, number>();
  for (const doc of documents) {
    for (const term of doc) df.set(term, (df.get(term) ?? 0) + 1);
  }
  const n = Math.max(1, documents.length);
  const idf = new Map<string, number>();
  for (const [term, count] of df) idf.set(term, Math.log(1 + n / count));
  return idf;
}

/**
 * The IDF a shared term must reach to count as evidence in this corpus.
 *
 * Derived from {@link MAX_DOCUMENT_FREQUENCY} by inverting the IDF formula, so
 * the two definitions can never drift apart. Returns 0 for a corpus too small
 * to have a meaningful frequency distribution: with a handful of documents
 * there is no basis for calling any term unremarkable, and a bar computed from
 * that little evidence would reject everything.
 */
export function informativeFloor(documentCount: number): number {
  if (documentCount < 12) return 0;
  return Math.log(1 + 1 / MAX_DOCUMENT_FREQUENCY);
}

/**
 * The L2 norm of a document's IDF vector, precomputed once per document because
 * every pair comparison would otherwise recompute both sides.
 */
export function idfNorm(doc: TermSet, idf: Map<string, number>): number {
  let sum = 0;
  for (const term of doc) {
    const w = idf.get(term) ?? 0;
    sum += w * w;
  }
  return Math.sqrt(sum);
}

/** What two documents share, and how strongly. */
export interface Overlap {
  /** Cosine similarity of the IDF-weighted term vectors, 0 to 1. */
  score: number;
  /** Shared terms carrying real signal, heaviest first. */
  terms: string[];
}

/**
 * Compare two documents.
 *
 * Returns a zero score when the overlap rests on fewer than
 * {@link MIN_SHARED_TERMS} informative terms, however high the cosine gets:
 * a short headline pair can reach a high cosine off two shared words, and a
 * provenance claim must not be built on that.
 */
export function overlap(
  a: TermSet,
  b: TermSet,
  idf: Map<string, number>,
  normA: number,
  normB: number,
  floor = 0,
): Overlap {
  if (normA === 0 || normB === 0) return { score: 0, terms: [] };

  // Iterate the smaller set: the cost of a pass is set by the shorter document.
  const [small, large] = a.size <= b.size ? [a, b] : [b, a];
  let dot = 0;
  const shared: Array<{ term: string; weight: number }> = [];
  for (const term of small) {
    if (!large.has(term)) continue;
    const w = idf.get(term) ?? 0;
    dot += w * w;
    if (w >= floor) shared.push({ term, weight: w });
  }

  if (shared.length < MIN_SHARED_TERMS) return { score: 0, terms: [] };

  const score = dot / (normA * normB);
  shared.sort((x, y) => y.weight - x.weight || x.term.localeCompare(y.term));
  return {
    score: Math.min(1, Number(score.toFixed(4))),
    terms: shared.map((s) => s.term),
  };
}
