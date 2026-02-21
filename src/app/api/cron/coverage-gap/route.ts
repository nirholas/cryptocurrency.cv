/**
 * Cron Job: Coverage Gap Auto-Detection (Vercel Cron)
 *
 * Runs every 6 hours to detect under-covered topics and write a gap report to
 * archive/meta/coverage-gaps-YYYY-MM-DD.json.
 *
 * @route GET /api/cron/coverage-gap
 * @schedule "0 * /6 * * *" (every 6 hours — cron: step notation)
 */

import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export const runtime = 'nodejs';
export const maxDuration = 120;
export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GapReportEntry {
  tag: string;
  gap_score: number;
  last_article_date: string | null;
  suggested_headline: string;
  context_summary: string;
}

interface GapReport {
  generated_at: string;
  date: string;
  window_days: number;
  gaps: GapReportEntry[];
}

// ---------------------------------------------------------------------------
// Auth helper (mirrors archive-kv cron)
// ---------------------------------------------------------------------------

function verifyCronAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('Authorization');
  if (authHeader === `Bearer ${process.env.CRON_SECRET}`) return true;
  if (request.headers.get('x-vercel-cron')) return true;
  if (process.env.NODE_ENV === 'development') return true;
  if (!process.env.CRON_SECRET) return true;
  const querySecret = request.nextUrl.searchParams.get('secret');
  if (querySecret === process.env.CRON_SECRET) return true;
  return false;
}

// ---------------------------------------------------------------------------
// Archive helpers
// ---------------------------------------------------------------------------

const ARCHIVE_ROOT = path.join(process.cwd(), 'archive');

/** Load archive/indexes/by-date.json which maps "YYYY-MM-DD" → article-id[] */
async function loadByDateIndex(): Promise<Record<string, string[]>> {
  try {
    const raw = await fs.readFile(
      path.join(ARCHIVE_ROOT, 'indexes', 'by-date.json'),
      'utf-8'
    );
    return JSON.parse(raw) as Record<string, string[]>;
  } catch {
    return {};
  }
}

/** Load archive/indexes/by-ticker.json which maps ticker/tag → article-id[] */
async function loadByTickerIndex(): Promise<Record<string, string[]>> {
  try {
    const raw = await fs.readFile(
      path.join(ARCHIVE_ROOT, 'indexes', 'by-ticker.json'),
      'utf-8'
    );
    return JSON.parse(raw) as Record<string, string[]>;
  } catch {
    return {};
  }
}

/**
 * Attempt to load a single article from the archive articles directory.
 * Articles are sharded under archive/articles/<XX>/<id>.json where <XX> is the
 * first two hex characters of the id.
 */
async function loadArticle(
  id: string
): Promise<{ title?: string; pubDate?: string; tags?: string[] } | null> {
  try {
    const shard = id.slice(0, 2);
    const filePath = path.join(ARCHIVE_ROOT, 'articles', shard, `${id}.json`);
    const raw = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Core analysis
// ---------------------------------------------------------------------------

/**
 * Return an array of YYYY-MM-DD strings for the last `days` days ending today.
 */
function lastNDays(days: number): string[] {
  const result: string[] = [];
  const now = new Date();
  for (let i = 0; i < days; i++) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i);
    result.push(d.toISOString().slice(0, 10));
  }
  return result;
}

interface TagStats {
  tag: string;
  /** article IDs seen in the last 7 days */
  idsLast7d: Set<string>;
  /** article IDs seen in the last 48 hours */
  idsLast48h: Set<string>;
  /** total historical article count from by-ticker index */
  historicalTotal: number;
  /** most recent known pubDate string */
  lastArticleDate: string | null;
}

async function analyzeGaps(): Promise<GapReportEntry[]> {
  const [byDate, byTicker] = await Promise.all([
    loadByDateIndex(),
    loadByTickerIndex(),
  ]);

  const days7 = new Set(lastNDays(7));
  const days2 = new Set(lastNDays(2));

  // Build per-date sets
  const idsIn7d = new Set<string>();
  const idsIn48h = new Set<string>();

  for (const [date, ids] of Object.entries(byDate)) {
    if (days7.has(date)) ids.forEach((id) => idsIn7d.add(id));
    if (days2.has(date)) ids.forEach((id) => idsIn48h.add(id));
  }

  // Build tag stats using by-ticker index
  const tagStatsMap = new Map<string, TagStats>();

  for (const [tag, allIds] of Object.entries(byTicker)) {
    const normalised = tag.toLowerCase();
    if (!tagStatsMap.has(normalised)) {
      tagStatsMap.set(normalised, {
        tag: normalised,
        idsLast7d: new Set(),
        idsLast48h: new Set(),
        historicalTotal: 0,
        lastArticleDate: null,
      });
    }
    const stats = tagStatsMap.get(normalised)!;
    stats.historicalTotal += allIds.length;
    for (const id of allIds) {
      if (idsIn7d.has(id)) stats.idsLast7d.add(id);
      if (idsIn48h.has(id)) stats.idsLast48h.add(id);
    }
  }

  // Build a lookup: article id → latest date from by-date index
  const idToDate = new Map<string, string>();
  for (const [date, ids] of Object.entries(byDate)) {
    for (const id of ids) {
      const existing = idToDate.get(id);
      if (!existing || date > existing) idToDate.set(id, date);
    }
  }

  // Populate lastArticleDate for each tag
  for (const stats of tagStatsMap.values()) {
    const allTagIds = byTicker[stats.tag] ?? [];
    let latest: string | null = null;
    for (const id of allTagIds) {
      const d = idToDate.get(id) ?? null;
      if (d && (!latest || d > latest)) latest = d;
    }
    stats.lastArticleDate = latest;
  }

  // Estimate average weekly volume: historicalTotal / (total archived weeks)
  // We use the date range from the by-date index
  const allDates = Object.keys(byDate).sort();
  const oldestDate = allDates[0];
  const newestDate = allDates[allDates.length - 1];
  let totalWeeks = 1;
  if (oldestDate && newestDate) {
    const ms =
      new Date(newestDate).getTime() - new Date(oldestDate).getTime();
    totalWeeks = Math.max(1, ms / (7 * 24 * 60 * 60 * 1000));
  }

  // Filter to gaps: < 2 articles in last 48 h AND historical avg > 10/week
  const gaps: TagStats[] = [];
  for (const stats of tagStatsMap.values()) {
    const avgPerWeek = stats.historicalTotal / totalWeeks;
    const recentCount = stats.idsLast48h.size;
    if (recentCount < 2 && avgPerWeek > 10) {
      gaps.push(stats);
    }
  }

  // Sort by gap_score descending: higher avgPerWeek with fewer recent articles
  // means a bigger gap.
  gaps.sort((a, b) => {
    const scoreA =
      a.historicalTotal / totalWeeks / Math.max(1, a.idsLast48h.size);
    const scoreB =
      b.historicalTotal / totalWeeks / Math.max(1, b.idsLast48h.size);
    return scoreB - scoreA;
  });

  // For each gap, generate a context summary via /api/ai/summarize
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000');

  const results: GapReportEntry[] = [];

  for (const stats of gaps.slice(0, 20)) {
    const avgPerWeek = stats.historicalTotal / totalWeeks;
    const gapScore = Math.round(
      (avgPerWeek / Math.max(1, stats.idsLast48h.size)) * 10
    );

    // Try to find a recent article title from the last 7d to ground the summary
    let sampleTitle = '';
    for (const id of Array.from(stats.idsLast7d).slice(0, 3)) {
      const article = await loadArticle(id);
      if (article?.title) {
        sampleTitle = article.title;
        break;
      }
    }

    // Generate context summary
    let contextSummary = '';
    const promptText = sampleTitle
      ? `What's new in ${stats.tag}? The most recent article is: "${sampleTitle}". Summarise in 2–3 sentences for a journalist looking for follow-up angles.`
      : `What's new in ${stats.tag} in the crypto world? Summarise recent developments in 2–3 sentences.`;

    try {
      const summarizeRes = await fetch(`${baseUrl}/api/ai/summarize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: promptText, type: 'paragraph' }),
      });
      if (summarizeRes.ok) {
        const data = await summarizeRes.json();
        contextSummary =
          data?.summary ?? data?.data?.summary ?? data?.text ?? '';
      }
    } catch {
      // Summarize is optional — proceed without it
    }

    const suggestedHeadline = `Coverage gap detected: "${stats.tag}" — ${stats.idsLast48h.size} article${stats.idsLast48h.size === 1 ? '' : 's'} in last 48 h (avg ${avgPerWeek.toFixed(1)}/week)`;

    results.push({
      tag: stats.tag,
      gap_score: gapScore,
      last_article_date: stats.lastArticleDate,
      suggested_headline: suggestedHeadline,
      context_summary: contextSummary,
    });
  }

  return results;
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const startTime = Date.now();
  console.log('📰 Starting coverage-gap cron job...');

  try {
    const gaps = await analyzeGaps();

    const today = new Date().toISOString().slice(0, 10);
    const report: GapReport = {
      generated_at: new Date().toISOString(),
      date: today,
      window_days: 7,
      gaps,
    };

    // Write gap report to archive/meta/coverage-gaps-YYYY-MM-DD.json
    const metaDir = path.join(process.cwd(), 'archive', 'meta');
    await fs.mkdir(metaDir, { recursive: true });
    const reportPath = path.join(metaDir, `coverage-gaps-${today}.json`);
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf-8');

    const elapsed = Date.now() - startTime;
    console.log(
      `✅ Coverage-gap cron done in ${elapsed}ms. Found ${gaps.length} gap(s). Report: ${reportPath}`
    );

    return NextResponse.json({
      success: true,
      timestamp: report.generated_at,
      elapsed_ms: elapsed,
      gaps_found: gaps.length,
      report_path: `archive/meta/coverage-gaps-${today}.json`,
      data: report,
    });
  } catch (error) {
    console.error('Coverage-gap cron error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Coverage gap analysis failed',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
