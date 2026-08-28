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
 * The shapes the provenance engine speaks in.
 *
 * @module lib/provenance/types
 */

/** The minimum an article must carry to be clustered. Mirrors NewsArticle. */
export interface ProvenanceInput {
  title: string;
  link: string;
  description?: string;
  pubDate: string;
  /** True when the feed gave no usable date and `pubDate` was inferred. */
  dateEstimated?: boolean;
  source: string;
  sourceKey: string;
  category?: string;
  imageUrl?: string;
}

/** One outlet's appearance in a story. */
export interface StoryAppearance {
  source: string;
  sourceKey: string;
  title: string;
  link: string;
  publishedAt: string;
  /** Milliseconds after the story's first credible publication. 0 for the originator. */
  lagMs: number;
  /** Human-readable form of `lagMs`, e.g. "1h 12m after". */
  lag: string;
  /** True when this outlet's timestamp was inferred rather than published. */
  dateEstimated: boolean;
  /** Exact Jaccard similarity to the originating article's text. */
  similarity: number;
}

/** Why a story's originator is or is not trustworthy as a claim. */
export type ProvenanceConfidence = 'high' | 'medium' | 'low' | 'unattributed';

/** A cluster of articles that all cover one event. */
export interface Story {
  /** Stable across runs: derived from the originating article's link. */
  id: string;
  /** The originating article's headline. */
  title: string;
  /** Best available image from any member. */
  imageUrl?: string;
  category?: string;
  /** Distinct outlets covering this story. */
  outletCount: number;
  /** First credible publication time across the cluster. */
  firstPublishedAt: string;
  /** Most recent publication time across the cluster. */
  lastPublishedAt: string;
  /** Milliseconds between the first and last outlet to publish. */
  spreadMs: number;
  /** The outlet credited with publishing first, when one can be credited. */
  originator: StoryAppearance | null;
  confidence: ProvenanceConfidence;
  /** Why the confidence is what it is, in one sentence a reader can check. */
  confidenceReason: string;
  /** Every appearance, originator first, then by publication time. */
  appearances: StoryAppearance[];
  /** Phrases shared across the cluster: the evidence for grouping these together. */
  evidence: string[];
}

/** One outlet's record across a corpus of stories. */
export interface SourceScore {
  source: string;
  sourceKey: string;
  /** Stories where this outlet published first, with credible timing. */
  originated: number;
  /** Stories this outlet joined after someone else published. */
  followed: number;
  /** Stories only this outlet covered. Exclusive, but unverified by anyone else. */
  soloed: number;
  /** originated / (originated + followed), or null with too little evidence. */
  originationRate: number | null;
  /** Median milliseconds behind the originator when following. Null when never following. */
  medianLagMs: number | null;
  /** Human-readable median lag. */
  medianLag: string | null;
  /** Total clustered stories this outlet appears in. */
  storiesCovered: number;
  /** Articles this outlet contributed to the corpus. */
  articles: number;
}

/** The corpus-level result. */
export interface ProvenanceReport {
  stories: Story[];
  /** Articles that matched nothing else in the window. */
  unclustered: number;
  /** Articles considered. */
  analysed: number;
  /** Similarity threshold used to group. */
  threshold: number;
  generatedAt: string;
}
