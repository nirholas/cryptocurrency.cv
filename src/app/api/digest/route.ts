/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getLatestNews, type NewsArticle } from '@/lib/crypto-news';
import { groqNotConfiguredResponse } from '@/app/api/_utils';
import { aiComplete, getAIConfigOrNull, AIAuthError } from '@/lib/ai-provider';
import { generateDigest, isDigestAIConfigured, DigestNoArticlesError } from '@/lib/digest-summary';

export const runtime = 'edge';
export const revalidate = 300; // 5 minute cache

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AiDigestSection {
  tag: string;
  headline: string;
  summary: string;
  article_count: number;
  top_articles: { title: string; url: string }[];
}

export interface AiDigestResponse {
  date: string;
  sections: AiDigestSection[];
  generated_at: string;
}

// ---------------------------------------------------------------------------
// Tag inference — keyword → canonical tag
// ---------------------------------------------------------------------------

const TAG_KEYWORDS: Record<string, string[]> = {
  bitcoin: ['bitcoin', 'btc', 'satoshi', 'lightning network', 'taproot', 'ordinals', 'runes'],
  ethereum: ['ethereum', 'eth', 'vitalik', 'eip', 'erc-20', 'erc20', 'layer2', 'layer 2', 'l2', 'blob', 'dencun', 'pectra', 'optimism', 'arbitrum', 'base'],
  defi: ['defi', 'decentralized finance', 'dex', 'uniswap', 'aave', 'compound', 'yield', 'liquidity', 'staking', 'lending', 'amm', 'swap', 'vault', 'protocol'],
  nft: ['nft', 'non-fungible', 'opensea', 'blur', 'collection', 'mint', 'floor price', 'jpeg', 'digital art'],
  regulation: ['regulation', 'sec', 'cftc', 'fca', 'government', 'law', 'bill', 'legislation', 'compliance', 'lawsuit', 'court', 'enforcement', 'ban', 'cbdc', 'policy'],
  solana: ['solana', 'sol', 'svm', 'pyth', 'jupiter', 'serum', 'raydium', 'phantom', 'drift'],
  altcoins: ['xrp', 'ripple', 'cardano', 'ada', 'polkadot', 'dot', 'chainlink', 'link', 'matic', 'polygon', 'avax', 'avalanche', 'bnb', 'binance', 'ton', 'tron', 'sui', 'aptos'],
  market: ['market', 'price', 'rally', 'bull', 'bear', 'dump', 'pump', 'ath', 'all-time high', 'correction', 'volatility', 'futures', 'options', 'etf', 'fund', 'institutional'],
};

function inferTag(article: NewsArticle): string {
  const text = `${article.title} ${article.description ?? ''}`.toLowerCase();
  for (const [tag, keywords] of Object.entries(TAG_KEYWORDS)) {
    if (keywords.some(kw => text.includes(kw))) return tag;
  }
  // Fall back to the article's own category
  return article.category?.toLowerCase() || 'general';
}

// ---------------------------------------------------------------------------
// In-memory cache for ai-digest results (key = YYYY-MM-DD ISO date)
// ---------------------------------------------------------------------------

interface CacheEntry {
  data: AiDigestResponse;
  expiresAt: number;
}

const digestCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

// ---------------------------------------------------------------------------
// AI-digest builder
// ---------------------------------------------------------------------------

const GROUP_SUMMARY_SYSTEM = `You are a concise crypto news editor. Given a list of news article headlines and descriptions on a specific topic, write a 2-3 sentence summary that captures the key developments. Be factual and direct. Do NOT use bullet points. Return only the summary text.`;

async function buildAiDigest(articles: NewsArticle[]): Promise<AiDigestResponse> {
  const today = new Date().toISOString().slice(0, 10);

  // Check cache
  const cached = digestCache.get(today);
  if (cached && cached.expiresAt > Date.now()) return cached.data;

  // Group articles by tag
  const groups = new Map<string, NewsArticle[]>();
  for (const article of articles) {
    const tag = inferTag(article);
    const bucket = groups.get(tag) ?? [];
    bucket.push(article);
    groups.set(tag, bucket);
  }

  // Sort groups by size descending, keep groups with ≥2 articles
  const qualifiedGroups = [...groups.entries()]
    .filter(([, arts]) => arts.length >= 2)
    .sort((a, b) => b[1].length - a[1].length);

  const hasAI = getAIConfigOrNull(true) !== null;

  const sections: AiDigestSection[] = await Promise.all(
    qualifiedGroups.map(async ([tag, arts]) => {
      const top = arts.slice(0, 5);
      const topArticles = top.map(a => ({ title: a.title, url: a.link }));
      const headline = top[0].title;

      let summary = top.map(a => a.description ?? a.title).join(' ').slice(0, 400);

      if (hasAI) {
        try {
          const articlesList = top
            .map(a => `- ${a.title}: ${a.description ?? ''}`)
            .join('\n');
          summary = await aiComplete(
            GROUP_SUMMARY_SYSTEM,
            `Topic: ${tag}\n\nArticles:\n${articlesList}`,
            { maxTokens: 200, temperature: 0.4, jsonMode: false },
            true // prefer Groq for speed
          );
        } catch {
          // keep the fallback summary
        }
      }

      return {
        tag,
        headline,
        summary: summary.trim(),
        article_count: arts.length,
        top_articles: topArticles.slice(0, 3),
      };
    })
  );

  const result: AiDigestResponse = {
    date: today,
    sections,
    generated_at: new Date().toISOString(),
  };

  digestCache.set(today, { data: result, expiresAt: Date.now() + CACHE_TTL_MS });
  return result;
}

// ---------------------------------------------------------------------------
// HTML escaping — prevent XSS from upstream RSS content
// ---------------------------------------------------------------------------

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return escapeHtml(url);
    }
  } catch { /* invalid URL */ }
  return '#';
}

// ---------------------------------------------------------------------------
// HTML renderer
// ---------------------------------------------------------------------------

function renderDigestHtml(digest: AiDigestResponse): string {
  const sectionHtml = digest.sections
    .map(
      s => `
  <div style="background:#1a1a2e;border-radius:12px;padding:20px;margin-bottom:16px;">
    <span style="background:#6c63ff;color:#fff;padding:3px 10px;border-radius:20px;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">${escapeHtml(s.tag)}</span>
    <h2 style="color:#e0e0e0;font-size:16px;margin:12px 0 8px;">${escapeHtml(s.headline)}</h2>
    <p style="color:#a0a0b0;font-size:14px;line-height:1.6;margin:0 0 12px;">${escapeHtml(s.summary)}</p>
    <p style="color:#6c63ff;font-size:12px;margin:0 0 8px;">${s.article_count} articles</p>
    <ul style="padding-left:16px;margin:0;">
      ${s.top_articles.map(a => `<li style="margin-bottom:6px;"><a href="${sanitizeUrl(a.url)}" style="color:#7c8cf8;text-decoration:none;font-size:13px;">${escapeHtml(a.title)}</a></li>`).join('')}
    </ul>
  </div>`
    )
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Crypto Daily Digest — ${escapeHtml(digest.date)}</title>
</head>
<body style="margin:0;padding:0;background:#0d0d1a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:32px 16px;">
    <h1 style="color:#fff;font-size:24px;margin:0 0 4px;">🗞 Crypto Daily Digest</h1>
    <p style="color:#6c63ff;font-size:13px;margin:0 0 24px;">${escapeHtml(digest.date)} · ${digest.sections.length} topics</p>
    ${sectionHtml}
    <div style="text-align:center;margin-top:32px;">
      <a href="/newsletter" style="background:#6c63ff;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">Subscribe for daily email</a>
    </div>
    <p style="color:#444;font-size:11px;text-align:center;margin-top:24px;">Generated at ${escapeHtml(digest.generated_at)}</p>
  </div>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Original Groq-based full/brief/newsletter prompt
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const period = searchParams.get('period') || '24h'; // 24h, 12h, 6h
  const format = searchParams.get('format') || 'full'; // full, brief, newsletter, ai-digest, html

  // --- New: ai-digest / html formats ---
  if (format === 'ai-digest' || format === 'html') {
    try {
      const hours = 24;
      const data = await getLatestNews(50);
      const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
      const recent = data.articles.filter(a => new Date(a.pubDate) >= cutoff);
      const articlesForDigest = recent.length >= 5 ? recent : data.articles.slice(0, 50);

      const digest = await buildAiDigest(articlesForDigest);

      if (format === 'html') {
        const html = renderDigestHtml(digest);
        return new Response(html, {
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      return NextResponse.json(digest, {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
          'Access-Control-Allow-Origin': '*',
        },
      });
    } catch (error) {
      console.error('AI digest error:', error);

      // If every AI provider is unavailable — bad key, or a spent quota, which
      // is what a free Groq tier does after 1000 requests in a day — that is an
      // upstream availability problem and gets a 503, not a 500.
      const name = (error as Error).name;
      if (
        error instanceof AIAuthError ||
        name === 'AIAuthError' ||
        name === 'GroqAuthError' ||
        name === 'GroqRateLimitError' ||
        name === 'AIRateLimitError' ||
        name === 'AIProviderUnavailableError'
      ) {
        return NextResponse.json(
          {
            error: 'AI service temporarily unavailable',
            details: 'All configured AI providers failed authentication. Please check API keys.',
          },
          { status: 503 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to generate AI digest', details: process.env.NODE_ENV === 'development' ? String(error) : 'Internal server error' },
        { status: 500 }
      );
    }
  }

  // --- Original Groq-based formats ---
  if (!isDigestAIConfigured()) return groqNotConfiguredResponse();

  try {
    const result = await generateDigest(period, format);

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    if (error instanceof DigestNoArticlesError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error('Digest error:', error);

    // Same as the AI-format branch above: an unusable or exhausted provider is
    // an upstream availability problem, so it gets a 503, not a 500.
    const errName = (error as Error).name;
    if (
      error instanceof AIAuthError ||
      errName === 'AIAuthError' ||
      errName === 'GroqAuthError' ||
      errName === 'GroqRateLimitError' ||
      errName === 'AIRateLimitError' ||
      errName === 'AIProviderUnavailableError'
    ) {
      return NextResponse.json(
        {
          error: 'AI service temporarily unavailable',
          details: 'No configured AI provider could serve this request.',
        },
        { status: 503, headers: { 'Retry-After': '120' } }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate digest', details: process.env.NODE_ENV === 'development' ? String(error) : 'Internal server error' },
      { status: 500 }
    );
  }
}
