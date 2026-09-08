/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

import { Suspense } from 'react';
import { setRequestLocale } from 'next-intl/server';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { generateSEOMetadata } from '@/lib/seo';
import { getAllTags } from '@/lib/tags';
import { loadTagScoresFromFile } from '@/lib/tagScoring';
import { getFullKnowledgeGraph } from '@/lib/ai-knowledge-graph';
import { Skeleton } from '@/components/ui/Skeleton';
import type { Metadata } from 'next';
import ExploreClient from './ExploreClient';

export const revalidate = 300;

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Props = {
  params: Promise<{ locale: string }>;
};

/* ------------------------------------------------------------------ */
/*  Data loaders                                                       */
/* ------------------------------------------------------------------ */

// Both sources are in-process (the tag catalogue and the knowledge graph
// singleton), so read them directly instead of round-tripping through the
// public /api/tags and /api/knowledge-graph routes.

interface TagData {
  name: string;
  slug: string;
  count: number;
  category?: string;
}

interface TrendingPair {
  source: string;
  sourceLabel: string;
  target: string;
  targetLabel: string;
  strength: number;
}

function loadTags(): TagData[] {
  try {
    // The tag cloud sizes entries by `count`; the catalogue carries no per-tag
    // article count, so use the pre-computed relevance score (0-1) like /api/tags.
    const scores = loadTagScoresFromFile();
    return getAllTags()
      .slice(0, 60)
      .map((tag) => ({
        name: tag.name,
        slug: tag.slug,
        category: tag.category,
        count: scores[tag.slug] ?? 0.7,
      }));
  } catch {
    return [];
  }
}

function loadTrendingConnections(): TrendingPair[] {
  try {
    const data = getFullKnowledgeGraph();
    // Build trending connections from relationships sorted by weight
    const entities = new Map<string, string>(data.entities.map((e) => [e.id, e.name]));
    return [...data.relationships]
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 10)
      .map((r) => ({
        source: r.source,
        sourceLabel: entities.get(r.source) ?? r.source,
        target: r.target,
        targetLabel: entities.get(r.target) ?? r.target,
        strength: Math.round(Math.min(100, r.weight)),
      }));
  } catch {
    return [];
  }
}

/* ------------------------------------------------------------------ */
/*  Metadata                                                           */
/* ------------------------------------------------------------------ */

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generateSEOMetadata({
    title: 'Knowledge Graph Explorer — Crypto Vision News',
    description:
      'Explore entity relationships across crypto news — interactive force-directed knowledge graph showing connections between coins, people, companies, and protocols.',
    path: '/explore',
    locale,
    tags: [
      'crypto knowledge graph',
      'entity relationships',
      'bitcoin connections',
      'crypto network',
      'blockchain entities',
      'crypto visualization',
    ],
  });
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default async function ExplorePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const tags = loadTags();
  const trendingConnections = loadTrendingConnections();

  return (
    <>
      <Header />
      <main id="main-content" className="container-main py-6 md:py-10">
        {/* Page heading */}
        <div className="mb-8">
          <h1 className="text-text-primary mb-2 text-3xl font-bold md:text-4xl">
            Knowledge Graph Explorer
          </h1>
          <p className="text-text-secondary max-w-2xl">
            Visualize connections between entities in crypto news — coins, people, companies, and
            protocols. Click nodes to inspect, drag to rearrange, scroll to zoom.
          </p>
        </div>

        <Suspense
          fallback={
            <div className="space-y-6">
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-150 w-full rounded-2xl" />
            </div>
          }
        >
          <ExploreClient tags={tags} trendingConnections={trendingConnections} />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
