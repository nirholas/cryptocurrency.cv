/**
 * Tag Score Cron Job
 *
 * Recomputes relevance scores for all known tags and updates Vercel KV.
 * Runs every 6 hours via vercel.json cron schedule: "0 *-slash-6 * * *"
 *
 * Example vercel.json entry:
 * {
 *   "crons": [{ "path": "/api/cron/tag-scores", "schedule": "every 6 hours" }]
 * }
 *
 * Environment variables:
 *   CRON_SECRET – Bearer token to authenticate the request (recommended)
 */

import { NextRequest, NextResponse } from 'next/server';
import { computeAllTagScores } from '@/lib/tagScoring';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 1 minute – scoring is fast with KV write

export async function GET(request: NextRequest) {
  // ── Auth check ─────────────────────────────────────────────────────────────
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get('authorization');
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const startedAt = Date.now();

  try {
    // Compute scores for every tag defined in src/lib/tags.ts
    const scores = await computeAllTagScores();

    const tagCount = Object.keys(scores).length;
    const scoreValues = Object.values(scores);
    const avg = scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length;

    // Persist a lightweight manifest to KV so other routes can query without
    // hitting the filesystem.
    try {
      const { kv } = await import('@vercel/kv');
      await kv.set(
        'tag_scores:all',
        { scores, computed_at: new Date().toISOString() },
        { ex: 6 * 60 * 60 }, // 6 hours
      );
    } catch {
      // KV not configured – scores are still cached per-tag inside computeTagScore
    }

    return NextResponse.json({
      success: true,
      tagCount,
      durationMs: Date.now() - startedAt,
      stats: {
        min: Math.min(...scoreValues).toFixed(3),
        max: Math.max(...scoreValues).toFixed(3),
        avg: avg.toFixed(3),
      },
      computed_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[cron/tag-scores] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        durationMs: Date.now() - startedAt,
      },
      { status: 500 },
    );
  }
}
