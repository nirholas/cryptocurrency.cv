/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

import { NextResponse } from 'next/server';
import DOMPurify from 'isomorphic-dompurify';
import { aiComplete, getAIConfigOrNull } from '@/lib/ai-provider';
import { safeFetch, UnsafeUrlError } from '@/lib/safe-fetch';

const MAX_RESPONSE_BYTES = 5 * 1024 * 1024; // 5 MB
const FETCH_TIMEOUT_MS = 10_000; // 10 seconds

interface ArticleContent {
  url: string;
  title: string;
  source: string;
  content: string;
  summary: string;
  keyPoints: string[];
  sentiment: 'bullish' | 'bearish' | 'neutral';
  fetchedAt: string;
  /** Pre-generated translated summaries keyed by locale code (e.g. "zh-CN", "ja").
   *  Populated by the translate-archive script; empty object when not yet generated. */
  translations: Record<string, string>;
}

/**
 * Extract article content from URL by fetching the page
 */
async function fetchArticleContent(url: string): Promise<string> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    // safeFetch refuses private and internal targets, including via redirects.
    const response = await safeFetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; FreeCryptoNews/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error(`Rate limited by source (429). Try again later.`);
      }
      throw new Error(`Failed to fetch: ${response.status}`);
    }

    // Validate Content-Type is HTML
    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml+xml')) {
      throw new Error(`Unexpected content type: ${contentType}`);
    }

    // Enforce response size limit
    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > MAX_RESPONSE_BYTES) {
      throw new Error('Response too large');
    }

    const html = await response.text();
    if (html.length > MAX_RESPONSE_BYTES) {
      throw new Error('Response too large');
    }

    // Extract article/main content if available, otherwise use full body
    const articleMatch = html.match(/<(article|main)[^>]*>([\s\S]*?)<\/\1>/i);
    const rawSection = articleMatch?.[2] ?? html;

    // Sanitize HTML with DOMPurify – only allow safe formatting tags
    const cleanHtml = DOMPurify.sanitize(rawSection, {
      ALLOWED_TAGS: ['p', 'br', 'b', 'i', 'em', 'strong', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3'],
      ALLOWED_ATTR: ['href'],
    });

    // Strip remaining tags to get plain text for downstream analysis
    const content = cleanHtml
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();

    // Limit content length for API
    return content.slice(0, 8000);
  } catch (error) {
    console.error('Error fetching article:', error);
    throw error;
  }
}

/**
 * Use Groq to summarize and analyze article content
 */
async function analyzeWithGroq(content: string, title: string, source: string): Promise<{
  summary: string;
  keyPoints: string[];
  sentiment: 'bullish' | 'bearish' | 'neutral';
}> {
  if (!getAIConfigOrNull(true)) {
    // Fallback without AI provider
    return {
      summary: content.slice(0, 500) + '...',
      keyPoints: ['Full content extracted from source'],
      sentiment: 'neutral',
    };
  }

  const systemPrompt = 'You are a crypto news analyst. Analyze articles and respond only with valid JSON.';
  const userPrompt = `Analyze this article and provide:
1. A clear, informative summary (2-3 paragraphs)
2. 3-5 key points/takeaways as bullet points
3. Market sentiment: bullish, bearish, or neutral

Article Title: ${title}
Source: ${source}

Article Content:
${content}

Respond in this exact JSON format:
{
  "summary": "Your summary here...",
  "keyPoints": ["Point 1", "Point 2", "Point 3"],
  "sentiment": "bullish|bearish|neutral"
}`;

  try {
    const raw = await aiComplete(systemPrompt, userPrompt, {
      temperature: 0.3,
      maxTokens: 1000,
      jsonMode: true,
    }, true /* preferGroq */);

    const result = JSON.parse(raw);
    return {
      summary: result.summary || content.slice(0, 500),
      keyPoints: result.keyPoints || [],
      sentiment: result.sentiment || 'neutral',
    };
  } catch (error) {
    console.error('AI analysis error:', error);
    // Fallback
    return {
      summary: content.slice(0, 500) + '...',
      keyPoints: ['Content extracted from source'],
      sentiment: 'neutral',
    };
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  const title = searchParams.get('title') || 'Untitled';
  const source = searchParams.get('source') || 'Unknown';

  if (!url) {
    return NextResponse.json(
      { error: 'Missing url parameter' },
      { status: 400 }
    );
  }

  // Strip CDATA wrappers that may leak from RSS feed XML
  const cleanUrl = url.replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, '').trim();

  // Validate the cleaned URL
  try {
    new URL(cleanUrl);
  } catch {
    return NextResponse.json(
      { error: 'Invalid url parameter' },
      { status: 400 }
    );
  }

  try {
    // Fetch article content
    const content = await fetchArticleContent(cleanUrl);

    // Analyze with Groq
    const analysis = await analyzeWithGroq(content, title, source);

    const articleContent: ArticleContent = {
      url: cleanUrl,
      title,
      source,
      content: content.slice(0, 3000), // Include some raw content
      summary: analysis.summary,
      keyPoints: analysis.keyPoints,
      sentiment: analysis.sentiment,
      fetchedAt: new Date().toISOString(),
      translations: {}, // Populated offline by scripts/translate-archive.js
    };

    return NextResponse.json(articleContent, {
      headers: {
        'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
      },
    });
  } catch (error) {
    if (error instanceof UnsafeUrlError) {
      return NextResponse.json({ error: 'url must point to a public web page' }, { status: 400 });
    }
    console.error('Article fetch error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch article content';
    const is429 = message.includes('429');
    return NextResponse.json(
      { error: is429 ? 'Source is rate-limiting requests. Try again later.' : 'Failed to fetch article content' },
      {
        status: is429 ? 429 : 500,
        headers: is429 ? { 'Retry-After': '60' } : {},
      },
    );
  }
}
