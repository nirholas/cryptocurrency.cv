/**
 * @fileoverview Full Article Extraction Endpoint
 * Extracts full article content from URLs using multiple strategies
 */

import { NextRequest, NextResponse } from 'next/server';

interface ExtractionResult {
  url: string;
  title: string;
  content: string;
  textContent: string;
  excerpt: string;
  author: string | null;
  publishedTime: string | null;
  siteName: string | null;
  wordCount: number;
  readingTime: number;
  images: string[];
  links: string[];
  success: boolean;
  method: string;
  extractedAt: string;
}

/**
 * Extract full article content from a URL
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json(
      { error: 'URL parameter required' },
      { status: 400 }
    );
  }

  try {
    // Validate URL
    new URL(url);
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  try {
    const result = await extractArticle(url);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Extraction failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        url,
      },
      { status: 500 }
    );
  }
}

/**
 * Extract article using multiple strategies
 */
async function extractArticle(url: string): Promise<ExtractionResult> {
  // Try strategies in order of preference
  const strategies = [
    { name: 'mercury', fn: extractWithMercury },
    { name: 'readability', fn: extractWithReadability },
    { name: 'opengraph', fn: extractWithOpenGraph },
    { name: 'basic', fn: extractBasic },
  ];

  let lastError: Error | null = null;

  for (const strategy of strategies) {
    try {
      const result = await strategy.fn(url);
      if (result.content && result.content.length > 100) {
        return {
          ...result,
          method: strategy.name,
          extractedAt: new Date().toISOString(),
        };
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
    }
  }

  throw lastError || new Error('All extraction methods failed');
}

/**
 * Extract using Mercury Parser API (if available)
 */
async function extractWithMercury(
  url: string
): Promise<Omit<ExtractionResult, 'method' | 'extractedAt'>> {
  // Mercury is a popular extraction library
  // In production, you'd run mercury-parser or use a hosted service
  throw new Error('Mercury parser not configured');
}

/**
 * Extract using Readability-style parsing
 */
async function extractWithReadability(
  url: string
): Promise<Omit<ExtractionResult, 'method' | 'extractedAt'>> {
  const response = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (compatible; FCN-Bot/1.0; +https://cryptocurrency.cv)',
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const html = await response.text();

  // Parse HTML
  const title = extractTag(html, 'title') || extractMeta(html, 'og:title') || '';
  const description = extractMeta(html, 'description') || extractMeta(html, 'og:description') || '';
  const author = extractMeta(html, 'author') || extractMeta(html, 'article:author');
  const publishedTime = extractMeta(html, 'article:published_time') || extractMeta(html, 'datePublished');
  const siteName = extractMeta(html, 'og:site_name');

  // Extract main content
  const content = extractMainContent(html);
  const textContent = stripHtml(content);
  const wordCount = textContent.split(/\s+/).filter(Boolean).length;

  // Extract images
  const images = extractImages(html, url);

  // Extract links
  const links = extractLinks(html, url);

  return {
    url,
    title,
    content,
    textContent,
    excerpt: description || textContent.slice(0, 200) + '...',
    author,
    publishedTime,
    siteName,
    wordCount,
    readingTime: Math.ceil(wordCount / 200),
    images,
    links,
    success: true,
  };
}

/**
 * Extract using OpenGraph/Meta tags only
 */
async function extractWithOpenGraph(
  url: string
): Promise<Omit<ExtractionResult, 'method' | 'extractedAt'>> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'FCN-Bot/1.0',
    },
  });

  const html = await response.text();

  const title = extractMeta(html, 'og:title') || extractTag(html, 'title') || '';
  const description = extractMeta(html, 'og:description') || extractMeta(html, 'description') || '';
  const image = extractMeta(html, 'og:image');

  return {
    url,
    title,
    content: description,
    textContent: description,
    excerpt: description,
    author: extractMeta(html, 'author'),
    publishedTime: extractMeta(html, 'article:published_time'),
    siteName: extractMeta(html, 'og:site_name'),
    wordCount: description.split(/\s+/).length,
    readingTime: 1,
    images: image ? [image] : [],
    links: [],
    success: true,
  };
}

/**
 * Basic extraction fallback
 */
async function extractBasic(
  url: string
): Promise<Omit<ExtractionResult, 'method' | 'extractedAt'>> {
  const response = await fetch(url);
  const html = await response.text();

  const title = extractTag(html, 'title') || '';
  const body = extractTag(html, 'body') || '';
  const textContent = stripHtml(body).slice(0, 5000);

  return {
    url,
    title,
    content: body.slice(0, 10000),
    textContent,
    excerpt: textContent.slice(0, 200) + '...',
    author: null,
    publishedTime: null,
    siteName: null,
    wordCount: textContent.split(/\s+/).length,
    readingTime: Math.ceil(textContent.split(/\s+/).length / 200),
    images: extractImages(html, url),
    links: extractLinks(html, url),
    success: true,
  };
}

// Helper functions
function extractTag(html: string, tag: string): string | null {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const match = html.match(regex);
  return match ? match[1].trim() : null;
}

function extractMeta(html: string, name: string): string | null {
  // Try property attribute
  let regex = new RegExp(
    `<meta[^>]+property=["']${name}["'][^>]+content=["']([^"']+)["']`,
    'i'
  );
  let match = html.match(regex);
  if (match) return match[1];

  // Try name attribute
  regex = new RegExp(
    `<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["']`,
    'i'
  );
  match = html.match(regex);
  if (match) return match[1];

  // Try reverse order
  regex = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${name}["']`,
    'i'
  );
  match = html.match(regex);
  return match ? match[1] : null;
}

function extractMainContent(html: string): string {
  // Remove scripts and styles
  let content = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<aside[\s\S]*?<\/aside>/gi, '');

  // Try to find article content
  const articleMatch = content.match(/<article[\s\S]*?<\/article>/i);
  if (articleMatch) return articleMatch[0];

  // Try main content
  const mainMatch = content.match(/<main[\s\S]*?<\/main>/i);
  if (mainMatch) return mainMatch[0];

  // Try common content selectors
  const contentMatch = content.match(
    /<div[^>]+(?:class|id)=["'][^"']*(?:content|article|post|entry)[^"']*["'][\s\S]*?<\/div>/i
  );
  if (contentMatch) return contentMatch[0];

  // Fallback to body
  const bodyMatch = content.match(/<body[\s\S]*?<\/body>/i);
  return bodyMatch ? bodyMatch[0] : content;
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();
}

function extractImages(html: string, baseUrl: string): string[] {
  const images: string[] = [];
  const regex = /<img[^>]+src=["']([^"']+)["']/gi;
  let match;

  while ((match = regex.exec(html)) !== null) {
    try {
      const imgUrl = new URL(match[1], baseUrl).href;
      if (!images.includes(imgUrl)) {
        images.push(imgUrl);
      }
    } catch {
      // Invalid URL, skip
    }
  }

  return images.slice(0, 10);
}

function extractLinks(html: string, baseUrl: string): string[] {
  const links: string[] = [];
  const regex = /<a[^>]+href=["']([^"']+)["']/gi;
  let match;

  while ((match = regex.exec(html)) !== null) {
    try {
      const linkUrl = new URL(match[1], baseUrl).href;
      if (
        !links.includes(linkUrl) &&
        linkUrl.startsWith('http') &&
        !linkUrl.includes(new URL(baseUrl).hostname)
      ) {
        links.push(linkUrl);
      }
    } catch {
      // Invalid URL, skip
    }
  }

  return links.slice(0, 20);
}
