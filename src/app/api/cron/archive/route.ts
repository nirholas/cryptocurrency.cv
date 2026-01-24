/**
 * Cron Job: Archive News
 *
 * GET /api/cron/archive - Fetch and archive current news articles
 *
 * ═══════════════════════════════════════════════════════════════
 * ZERO DEPENDENCIES - Works without any API keys or external services!
 * ═══════════════════════════════════════════════════════════════
 *
 * Trigger Options (no GitHub Actions required):
 * 1. External cron services (cron-job.org, Uptime Robot - both FREE)
 * 2. Manual API call or browser visit
 * 3. Vercel Cron (add to vercel.json if you enable it later)
 *
 * Storage: Returns archived articles in JSON response for external storage
 *
 * Security: 
 * - If CRON_SECRET is set → requires authentication
 * - If CRON_SECRET is NOT set → endpoint is public (for easy testing)
 *
 * @example
 * // No auth needed if CRON_SECRET not set
 * curl "https://free-crypto-news.vercel.app/api/cron/archive"
 *
 * // With auth (if CRON_SECRET is set)
 * curl "https://free-crypto-news.vercel.app/api/cron/archive?secret=YOUR_SECRET"
 */

import { NextRequest, NextResponse } from 'next/server';
import { getLatestNews, type NewsArticle } from '@/lib/crypto-news';

export const runtime = 'nodejs';
export const maxDuration = 60;

// In-memory storage for serverless (will reset between cold starts)
// For production, use KV store or database
interface ArchiveEntry {
  id: string;
  slug: string;
  title: string;
  link: string;
  source: string;
  pubDate: string;
  description?: string;
  category?: string;
  archivedAt: string;
}

interface ArchiveSession {
  lastRun: string;
  articlesArchived: number;
  recentArticles: ArchiveEntry[];
}

// Simple in-memory cache (resets on cold start)
let archiveSession: ArchiveSession | null = null;

/**
 * Verify cron request authorization
 * If CRON_SECRET is not set, endpoint is PUBLIC (zero-config mode)
 */
function verifyCronAuth(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;

  // ZERO-CONFIG MODE: If no secret configured, allow all requests
  // This makes it easy to get started without any configuration
  if (!cronSecret) {
    return true;
  }

  // Check Authorization header
  const authHeader = request.headers.get('Authorization');
  if (authHeader === `Bearer ${cronSecret}`) {
    return true;
  }

  // Check query param (for simple cron services)
  const querySecret = request.nextUrl.searchParams.get('secret');
  if (querySecret === cronSecret) {
    return true;
  }

  return false;
}

/**
 * Generate SEO-friendly slug from article title and date
 */
function generateArticleSlug(title: string, date?: string): string {
  let slug = title
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
    .replace(/-$/, '');
  
  if (date) {
    const dateStr = new Date(date).toISOString().split('T')[0];
    slug = `${slug}-${dateStr}`;
  }
  
  return slug || 'untitled';
}

/**
 * Generate a unique ID for an article (legacy, for backwards compatibility)
 */
function generateArticleId(article: NewsArticle): string {
  const normalizedUrl = article.link
    .replace(/[?#].*$/, '')
    .replace(/\/+$/, '')
    .toLowerCase();

  // Simple hash function
  let hash = 0;
  for (let i = 0; i < normalizedUrl.length; i++) {
    const char = normalizedUrl.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(16, '0');
}

/**
 * Extract tickers from article text
 */
function extractTickers(text: string): string[] {
  const tickerPatterns = [
    /\$([A-Z]{2,5})\b/g,           // $BTC, $ETH
    /\b(BTC|ETH|SOL|XRP|ADA|DOT|DOGE|SHIB|MATIC|AVAX|LINK|UNI|ATOM)\b/g,
  ];

  const tickers = new Set<string>();
  for (const pattern of tickerPatterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      tickers.add(match[1].toUpperCase());
    }
  }

  return Array.from(tickers);
}

/**
 * Archive articles to KV store (if configured) or return for external storage
 */
async function archiveArticles(articles: NewsArticle[]): Promise<{
  archived: number;
  duplicates: number;
  entries: ArchiveEntry[];
}> {
  const now = new Date().toISOString();
  const entries: ArchiveEntry[] = [];
  const seenIds = new Set<string>();
  let duplicates = 0;

  for (const article of articles) {
    const id = generateArticleId(article);
    const slug = generateArticleSlug(article.title, article.pubDate);

    if (seenIds.has(id)) {
      duplicates++;
      continue;
    }
    seenIds.add(id);

    entries.push({
      id,
      slug,
      title: article.title,
      link: article.link,
      source: article.source,
      pubDate: article.pubDate,
      description: article.description,
      category: article.category,
      archivedAt: now,
    });
  }

  // Try to persist to Vercel KV if available
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    try {
      // Dynamic import to avoid build errors if not installed
      const { kv } = await import('@vercel/kv');

      // Get existing archive for today
      const today = now.split('T')[0];
      const key = `archive:${today}`;

      const existing = await kv.get<ArchiveEntry[]>(key) || [];
      const existingIds = new Set(existing.map(e => e.id));

      // Filter out duplicates
      const newEntries = entries.filter(e => !existingIds.has(e.id));

      if (newEntries.length > 0) {
        // Append to today's archive
        await kv.set(key, [...existing, ...newEntries], {
          ex: 60 * 60 * 24 * 90, // Expire after 90 days
        });

        // Update index
        const indexKey = 'archive:index';
        const index = await kv.get<string[]>(indexKey) || [];
        if (!index.includes(today)) {
          await kv.set(indexKey, [...index, today].sort());
        }
      }

      return {
        archived: newEntries.length,
        duplicates: duplicates + (entries.length - newEntries.length),
        entries: newEntries,
      };
    } catch (error) {
      console.error('KV storage failed, falling back to response-only:', error);
    }
  }

  // Update in-memory session
  archiveSession = {
    lastRun: now,
    articlesArchived: entries.length,
    recentArticles: entries.slice(0, 50),
  };

  return {
    archived: entries.length,
    duplicates,
    entries,
  };
}

/**
 * GET /api/cron/archive
 */
export async function GET(request: NextRequest) {
  // Verify authorization
  if (!verifyCronAuth(request)) {
    return NextResponse.json(
      { error: 'Unauthorized. Provide CRON_SECRET via Authorization header or secret query param.' },
      { status: 401 }
    );
  }

  const startTime = Date.now();

  try {
    // Fetch current news
    console.log('📰 Fetching news for archive...');
    const newsResponse = await getLatestNews(50);
    const articles = newsResponse.articles;

    if (articles.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No articles fetched',
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
      });
    }

    // Archive articles
    const result = await archiveArticles(articles);

    // Prepare response
    const archiveResponse = {
      success: true,
      timestamp: new Date().toISOString(),
      stats: {
        fetched: articles.length,
        archived: result.archived,
        duplicates: result.duplicates,
        sources: [...new Set(articles.map(a => a.source))],
      },
      duration: Date.now() - startTime,
      storage: process.env.KV_REST_API_URL ? 'vercel-kv' : 'memory-only',
      // Include articles for external archiving (e.g., save to GitHub, S3, etc.)
      articles: result.entries.slice(0, 100),
    };

    console.log(`✅ Archived ${result.archived} articles in ${archiveResponse.duration}ms`);

    return NextResponse.json(archiveResponse);
  } catch (error) {
    console.error('Archive cron failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cron/archive
 * Same as GET but allows webhook-style triggers
 */
export async function POST(request: NextRequest) {
  return GET(request);
}
