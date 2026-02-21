/**
 * Cron Job: Enrich Articles
 *
 * GET /api/cron/enrich-articles
 *
 * Runs every 5 minutes. Fetches the latest 200 articles, finds the ones
 * not yet enriched (or whose enrichment is stale), and calls Groq once
 * per batch of 20 articles to produce:
 *   - tldr         (one-sentence AI summary)
 *   - sentiment    (bullish | bearish | neutral)
 *   - tickers      (crypto symbols mentioned)
 *   - impactScore  (0-10 market significance)
 *
 * Results are stored in Vercel KV with a 24-hour TTL.
 *
 * Security: Protected by CRON_SECRET environment variable.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getLatestNews } from '@/lib/crypto-news';
import {
  getBulkEnrichment,
  enrichArticlesBatch,
  saveEnrichments,
  BATCH_SIZE,
} from '@/lib/article-enrichment';

export const runtime = 'nodejs';
export const maxDuration = 60;

function verifyCronAuth(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return process.env.NODE_ENV !== 'production';

  const authHeader = request.headers.get('Authorization');
  if (authHeader === `Bearer ${cronSecret}`) return true;

  const querySecret = request.nextUrl.searchParams.get('secret');
  if (querySecret === cronSecret) return true;

  return false;
}

export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startedAt = Date.now();
  const stats = { total: 0, alreadyEnriched: 0, enriched: 0, failed: 0, batches: 0 };

  try {
    // 1. Fetch latest articles
    const { articles } = await getLatestNews(200);
    stats.total = articles.length;

    // 2. Check which ones are already enriched (bulk KV read)
    const urls = articles.map(a => a.link);
    const existing = await getBulkEnrichment(urls);

    const needsEnrichment = articles.filter(a => existing.get(a.link) === null);
    stats.alreadyEnriched = stats.total - needsEnrichment.length;

    // 3. Process in batches
    for (let i = 0; i < needsEnrichment.length; i += BATCH_SIZE) {
      // Abort if we're getting close to execution limit
      if (Date.now() - startedAt > 50_000) break;

      const batch = needsEnrichment.slice(i, i + BATCH_SIZE);
      stats.batches++;

      try {
        const enrichmentMap = await enrichArticlesBatch(
          batch.map(a => ({
            url: a.link,
            title: a.title,
            description: a.description,
            source: a.source,
          }))
        );

        const toSave = Array.from(enrichmentMap.entries()).map(([url, enrichment]) => ({
          url,
          enrichment,
        }));

        await saveEnrichments(toSave);
        stats.enriched += toSave.length;
        stats.failed += batch.length - toSave.length;
      } catch {
        stats.failed += batch.length;
      }
    }

    return NextResponse.json({
      success: true,
      durationMs: Date.now() - startedAt,
      stats,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Enrichment cron failed', details: String(error), stats },
      { status: 500 }
    );
  }
}
