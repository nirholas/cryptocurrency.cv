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
import { SITE_URL } from '@/lib/constants';
import { Skeleton } from '@/components/ui/Skeleton';
import type { Metadata } from 'next';
import ExploreClient from './ExploreClient';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Props = {
  params: Promise<{ locale: string }>;
};

/* ------------------------------------------------------------------ */
/*  Data fetchers                                                      */
/* ------------------------------------------------------------------ */

const BASE = SITE_URL;

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

async function fetchTags(): Promise<TagData[]> {
  try {
    const res = await fetch(`${BASE}/api/tags`, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    const data = await res.json();
    // Flatten grouped tags into a single array
    const tags: TagData[] = [];
    if (data.tags && Array.isArray(data.tags)) {
      return data.tags.slice(0, 60);
    }
    if (data.categories) {
      for (const cat of Object.values(data.categories) as TagData[][]) {
        if (Array.isArray(cat)) {
          for (const t of cat) {
            tags.push(t);
          }
        }
      }
      return tags.slice(0, 60);
    }
    return [];
  } catch {
    return [];
  }
}

async function fetchTrendingConnections(): Promise<TrendingPair[]> {
  try {
    const res = await fetch(`${BASE}/api/knowledge-graph`, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    const data = await res.json();
    // Build trending connections from relationships sorted by weight
    const entities = new Map<string, string>(
      (data.entities || []).map((e: { id: string; name: string }) => [e.id, e.name] as [string, string]),
    );
    const relationships = (data.relationships || []) as {
      source: string;
      target: string;
      weight: number;
    }[];
    return relationships
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 10)
      .map(r => ({
        source: r.source,
        sourceLabel: String(entities.get(r.source) ?? r.source),
        target: r.target,
        targetLabel: String(entities.get(r.target) ?? r.target),
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

  const [tags, trendingConnections] = await Promise.all([
    fetchTags(),
    fetchTrendingConnections(),
  ]);

  return (
    <>
      <Header />
      <main id="main-content" className="container-main py-6 md:py-10">
        {/* Page heading */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-2">
            Knowledge Graph Explorer
          </h1>
          <p className="text-text-secondary max-w-2xl">
            Visualize connections between entities in crypto news — coins, people,
            companies, and protocols. Click nodes to inspect, drag to rearrange,
            scroll to zoom.
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
          <ExploreClient
            tags={tags}
            trendingConnections={trendingConnections}
          />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
