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
 * curl -X POST "https://cryptocurrency.cv/api/archive/webhook"
 *
 * // With authentication (if CRON_SECRET is set)
 * curl -X POST "https://cryptocurrency.cv/api/archive/webhook" \
 *   -H "Authorization: Bearer YOUR_CRON_SECRET"
 */

import { NextRequest, NextResponse } from 'next/server';
import { getLatestNews, type NewsArticle } from '@/lib/crypto-news';
import { notifyIndexNow } from '@/lib/indexnow';
import { callGroq, isGroqConfigured } from '@/lib/groq';

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
  // AI-enriched fields (populated when GROQ_API_KEY is set)
  ai_summary?: string;
  sentiment?: {
    label: 'positive' | 'negative' | 'neutral';
    score: number; // -1.0 to 1.0
  };
  is_breaking?: boolean;
  entities?: {
    people: string[];
    companies: string[];
    protocols: string[];
  };
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
 * AI enrichment: batch-enrich up to 50 articles in a single Groq call.
 * Returns a map of article ID -> enrichment data.
 * Never throws — enrichment is best-effort.
 */
async function enrichBatchWithAI(
  articles: ArchiveArticle[]
): Promise<Map<string, Partial<ArchiveArticle>>> {
  const result = new Map<string, Partial<ArchiveArticle>>();

  if (!isGroqConfigured() || articles.length === 0) return result;

  // Limit to 50 per call to stay within token budget
  const batch = articles.slice(0, 50);

  const articleList = batch
    .map((a, i) => `${i + 1}. [${a.id}] ${a.title}${a.description ? ` — ${a.description.slice(0, 120)}` : ''}`)
    .join('\n');

  const prompt = `You are a crypto news analyst. For each article below, return a JSON array with one object per article.

Each object must have:
- "id": the article ID in brackets (copy exactly)
- "summary": one crisp sentence (max 20 words) summarising the news
- "sentiment": "positive", "negative", or "neutral" from a crypto investor perspective
- "score": float from -1.0 (very negative) to 1.0 (very positive)
- "is_breaking": true if this is urgent breaking news (regulatory action, major hack, exchange collapse, ATH/ATL, war), false otherwise
- "people": array of named people mentioned (max 3)
- "companies": array of companies/exchanges mentioned (max 3)
- "protocols": array of crypto protocols/chains mentioned (max 3)

Return ONLY a valid JSON array. No markdown. No explanation.

Articles:
${articleList}`;

  try {
    const response = await callGroq(
      [{ role: 'user', content: prompt }],
      { maxTokens: 4096, temperature: 0.1, jsonMode: true }
    );

    // Parse — the model returns a JSON object with an array, or directly an array
    let parsed: Array<{
      id: string;
      summary: string;
      sentiment: 'positive' | 'negative' | 'neutral';
      score: number;
      is_breaking: boolean;
      people?: string[];
      companies?: string[];
      protocols?: string[];
    }>;

    const raw = response.content.trim();
    const maybeObj = JSON.parse(raw);
    parsed = Array.isArray(maybeObj) ? maybeObj : (maybeObj.articles || maybeObj.data || Object.values(maybeObj)[0] as typeof parsed);

    for (const item of parsed) {
      if (!item.id) continue;
      result.set(item.id, {
        ai_summary: item.summary,
        sentiment: {
          label: item.sentiment || 'neutral',
          score: typeof item.score === 'number' ? Math.max(-1, Math.min(1, item.score)) : 0,
        },
        is_breaking: !!item.is_breaking,
        entities: {
          people: item.people || [],
          companies: item.companies || [],
          protocols: item.protocols || [],
        },
      });
    }

    console.log(`[AI Enrichment] Enriched ${result.size}/${batch.length} articles`);
  } catch (err) {
    console.warn('[AI Enrichment] Batch enrichment failed (non-fatal):', err);
  }

  return result;
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
  const filePath = `archive/articles/${year}-${month}.jsonl`;

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
          } catch {
            // Malformed JSONL line in existing archive file — skip and continue
          }
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
    let articles = rawArticles.map(transformArticle);

    // AI enrichment: add sentiment, summary, entities, is_breaking
    if (isGroqConfigured()) {
      const enrichments = await enrichBatchWithAI(articles);
      articles = articles.map(a => {
        const enrichment = enrichments.get(a.id);
        return enrichment ? { ...a, ...enrichment } : a;
      });
      console.log(`[Webhook] AI-enriched ${enrichments.size}/${articles.length} articles`);
    }

    // Try to commit to GitHub
    const githubResult = await commitToGitHub(articles, today);

    // Notify IndexNow about newly archived articles (best-effort, production only)
    if (githubResult.success) {
      const articleUrls = articles.map(
        a => `https://cryptocurrency.cv/en/article/${a.id}`
      );
      notifyIndexNow(articleUrls);
    }

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
      curl: 'curl -X POST "https://cryptocurrency.cv/api/archive/webhook" -H "Authorization: Bearer YOUR_CRON_SECRET"',
    },
  });
}
