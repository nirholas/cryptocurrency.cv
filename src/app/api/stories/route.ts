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
 * GET /api/stories
 *
 * The news, deduplicated into events, with who published each one first.
 *
 * Every other endpoint here hands you a firehose: 40 headlines about one ETF
 * inflow, from 40 outlets, in no particular relation to each other. This one
 * collapses that into a single story and shows the chain, so you can see that
 * one newsroom published at 09:14 and the other 39 followed over the next six
 * hours.
 *
 * Query:
 *   ?limit=150         articles to pull into the corpus (20-300)
 *   ?category=defi     restrict the corpus to one category
 *   ?minOutlets=2      smallest cluster to return; 1 includes exclusives
 *   ?threshold=0.3     similarity required to call two articles one story
 *   ?confidence=high   only stories whose attribution is at least this strong
 *
 * Every story carries a `confidence` and a `confidenceReason` in plain English,
 * and `evidence`: the terms the cluster actually shares. Attribution rests on
 * RSS timestamps, which are frequently wrong, so a story whose timing cannot be
 * trusted reports `originator: null` and says why rather than guessing.
 */

import { type NextRequest, NextResponse } from 'next/server';

import { analyseProvenance, type ProvenanceConfidence } from '@/lib/provenance';

export const runtime = 'nodejs';
export const revalidate = 300;

const CONFIDENCE_ORDER: ProvenanceConfidence[] = ['unattributed', 'low', 'medium', 'high'];

function clampNumber(raw: string | null, min: number, max: number, fallback: number): number {
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(n, min), max);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = clampNumber(searchParams.get('limit'), 20, 300, 150);
  const minOutlets = clampNumber(searchParams.get('minOutlets'), 1, 20, 2);
  const thresholdRaw = searchParams.get('threshold');
  const threshold = thresholdRaw === null ? undefined : clampNumber(thresholdRaw, 0.1, 0.9, 0.3);
  const category = searchParams.get('category') ?? undefined;
  const minConfidence = searchParams.get('confidence') as ProvenanceConfidence | null;

  try {
    const report = await analyseProvenance({
      limit,
      category,
      threshold,
      includeExclusives: minOutlets === 1,
    });

    let stories = report.stories;
    if (minOutlets > 1) stories = stories.filter((s) => s.outletCount >= minOutlets);
    if (minConfidence && CONFIDENCE_ORDER.includes(minConfidence)) {
      const floor = CONFIDENCE_ORDER.indexOf(minConfidence);
      stories = stories.filter((s) => CONFIDENCE_ORDER.indexOf(s.confidence) >= floor);
    }

    return NextResponse.json(
      {
        count: stories.length,
        stories,
        meta: {
          analysed: report.analysed,
          unclustered: report.unclustered,
          threshold: report.threshold,
          generatedAt: report.generatedAt,
          // Said once, here, so no consumer has to infer it from the shape.
          attribution:
            'Ordering comes from the timestamps outlets publish in their own feeds. A story whose timing cannot be verified reports originator: null and explains why in confidenceReason.',
        },
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=900',
          'Access-Control-Allow-Origin': '*',
        },
      },
    );
  } catch (error) {
    console.error('[stories] clustering failed:', error);
    return NextResponse.json(
      { error: 'stories_unavailable', message: 'The story index could not be built right now.' },
      { status: 503, headers: { 'Retry-After': '30' } },
    );
  }
}
