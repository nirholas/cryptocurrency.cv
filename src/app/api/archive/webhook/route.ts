/**
 * Archive Webhook - Save to GitHub via API
 *
 * POST /api/archive/webhook - Archive news and optionally commit to GitHub
 *
 * ═══════════════════════════════════════════════════════════════
 * ZERO DEPENDENCIES MODE - Works without any configuration!
 * ═══════════════════════════════════════════════════════════════
 *
 * This endpoint can be triggered by:
 * 1. External cron services (cron-job.org, Uptime Robot - FREE)
 * 2. Manual curl/fetch requests
 * 3. Browser (GET request also supported)
 * 4. Zapier/Make/n8n webhooks
 *
 * Environment Variables (ALL OPTIONAL):
 * - CRON_SECRET: If set, requires authentication. If not set, endpoint is public.
 * - GITHUB_TOKEN: If set, commits to GitHub. If not set, just returns articles.
 *
 * @example
 * // Zero-config mode (no env vars needed)
 * curl -X POST "https://free-crypto-news.vercel.app/api/archive/webhook"
 *
 * // With authentication (if CRON_SECRET is set)
 * curl -X POST "https://free-crypto-news.vercel.app/api/archive/webhook" \
 *   -H "Authorization: Bearer YOUR_CRON_SECRET"
 */

import { NextRequest, NextResponse } from 'next/server';
import { getLatestNews, type NewsArticle } from '@/lib/crypto-news';

export const runtime = 'nodejs';
export const maxDuration = 60;

interface ArchiveArticle {
  id: string;
  slug: string;  // SEO-friendly URL slug
  schema_version: string;
  title: string;
  link: string;
  description?: string;
  source: string;
  source_key: string;
  category?: string;
  pub_date: string;
  first_seen: string;
  tickers: string[];
}

/**
 * Verify webhook authorization
 * If CRON_SECRET is not set, endpoint is PUBLIC (zero-config mode)
 */
function verifyAuth(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;

  // ZERO-CONFIG MODE: If no secret, allow all requests
  if (!cronSecret) {
    return true;
  }

  const authHeader = request.headers.get('Authorization');
  if (authHeader === `Bearer ${cronSecret}`) {
    return true;
  }

  // Also check query param for convenience
  const querySecret = request.nextUrl.searchParams.get('secret');
  if (querySecret === cronSecret) {
    return true;
  }

  return false;
}

/**
 * Generate article ID from URL
 */
function generateId(url: string): string {
  const normalized = url.replace(/[?#].*$/, '').replace(/\/+$/, '').toLowerCase();
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = ((hash << 5) - hash) + normalized.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(16, '0');
}

/**
 * Extract tickers from text
 */
function extractTickers(text: string): string[] {
  const patterns = [
    /\$([A-Z]{2,5})\b/g,
    /\b(BTC|ETH|SOL|XRP|ADA|DOT|DOGE|SHIB|MATIC|AVAX|LINK|UNI|ATOM|BNB|NEAR|APT|ARB|OP)\b/gi,
  ];

  const tickers = new Set<string>();
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      tickers.add(match[1].toUpperCase());
    }
  }
  return Array.from(tickers);
}

/**
 * Generate SEO-friendly slug from article title and date
 */
function generateSlug(title: string, date?: string): string {
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
 * Transform raw article to archive format
 */
function transformArticle(article: NewsArticle): ArchiveArticle {
  const now = new Date().toISOString();
  const text = `${article.title} ${article.description || ''}`;

  return {
    id: generateId(article.link),
    slug: generateSlug(article.title, article.pubDate),
    schema_version: '2.0.0',
    title: article.title,
    link: article.link,
    description: article.description,
    source: article.source,
    source_key: article.source.toLowerCase().replace(/\s+/g, ''),
    category: article.category,
    pub_date: article.pubDate,
    first_seen: now,
    tickers: extractTickers(text),
  };
}

/**
 * Commit archive to GitHub (if GITHUB_TOKEN is set)
 */
async function commitToGitHub(
  articles: ArchiveArticle[],
  date: string
): Promise<{ success: boolean; message: string; sha?: string }> {
  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    return {
      success: false,
      message: 'GITHUB_TOKEN not configured - articles returned in response only',
    };
  }

  const owner = 'nirholas';
  const repo = 'free-crypto-news';
  const [year, month] = date.split('-');
  const filePath = `archive/v2/articles/${year}-${month}.jsonl`;

  try {
    // Get current file (if exists)
    const getResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );

    let existingContent = '';
    let existingSha: string | undefined;

    if (getResponse.ok) {
      const data = await getResponse.json();
      existingSha = data.sha;
      existingContent = Buffer.from(data.content, 'base64').toString('utf-8');
    }

    // Parse existing articles to deduplicate
    const existingIds = new Set<string>();
    if (existingContent) {
      for (const line of existingContent.split('\n')) {
        if (line.trim()) {
          try {
            const article = JSON.parse(line);
            if (article.id) existingIds.add(article.id);
          } catch {}
        }
      }
    }

    // Filter out duplicates
    const newArticles = articles.filter(a => !existingIds.has(a.id));

    if (newArticles.length === 0) {
      return {
        success: true,
        message: 'No new articles to archive (all duplicates)',
      };
    }

    // Append new articles
    const newLines = newArticles.map(a => JSON.stringify(a)).join('\n');
    const newContent = existingContent
      ? existingContent.trimEnd() + '\n' + newLines + '\n'
      : newLines + '\n';

    // Commit to GitHub
    const commitResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `📰 Archive ${newArticles.length} articles - ${date}`,
          content: Buffer.from(newContent).toString('base64'),
          sha: existingSha,
          branch: 'main',
        }),
      }
    );

    if (!commitResponse.ok) {
      const error = await commitResponse.text();
      return {
        success: false,
        message: `GitHub commit failed: ${error}`,
      };
    }

    const commitData = await commitResponse.json();

    return {
      success: true,
      message: `Committed ${newArticles.length} new articles to ${filePath}`,
      sha: commitData.commit?.sha,
    };
  } catch (error) {
    return {
      success: false,
      message: `GitHub error: ${error instanceof Error ? error.message : 'Unknown'}`,
    };
  }
}

/**
 * POST /api/archive/webhook
 */
export async function POST(request: NextRequest) {
  if (!verifyAuth(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const startTime = Date.now();
  const now = new Date();
  const today = now.toISOString().split('T')[0];

  try {
    // Fetch news
    console.log('📰 Fetching news...');
    const newsResponse = await getLatestNews(50);
    const rawArticles = newsResponse.articles;

    if (rawArticles.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No articles fetched',
        timestamp: now.toISOString(),
      });
    }

    // Transform to archive format
    const articles = rawArticles.map(transformArticle);

    // Try to commit to GitHub
    const githubResult = await commitToGitHub(articles, today);

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      duration: Date.now() - startTime,
      stats: {
        fetched: rawArticles.length,
        processed: articles.length,
        sources: [...new Set(rawArticles.map(a => a.source))],
      },
      github: githubResult,
      // Include articles for external processing if GitHub commit failed
      articles: githubResult.success ? undefined : articles,
    });
  } catch (error) {
    console.error('Webhook error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: now.toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * GET - Return setup instructions
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/archive/webhook',
    method: 'POST',
    authentication: 'Bearer token via Authorization header',
    envRequired: ['CRON_SECRET'],
    envOptional: ['GITHUB_TOKEN (for automatic commits to repo)'],
    externalCronServices: [
      {
        name: 'cron-job.org',
        url: 'https://cron-job.org',
        free: true,
        setup: 'Create account, add job with POST request, set Authorization header',
      },
      {
        name: 'Uptime Robot',
        url: 'https://uptimerobot.com',
        free: true,
        setup: 'Create monitor with HTTP(s) keyword, set custom headers',
      },
      {
        name: 'EasyCron',
        url: 'https://easycron.com',
        free: '200 runs/month',
        setup: 'Create cron job with POST method and headers',
      },
      {
        name: 'Pipedream',
        url: 'https://pipedream.com',
        free: true,
        setup: 'Create workflow with schedule trigger',
      },
    ],
    example: {
      curl: 'curl -X POST "https://free-crypto-news.vercel.app/api/archive/webhook" -H "Authorization: Bearer YOUR_CRON_SECRET"',
    },
  });
}
