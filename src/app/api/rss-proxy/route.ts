/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

/**
 * RSS Proxy — proxies external RSS/Atom feeds to bypass CORS restrictions.
 * Used by the frontend widgets and embeddable components.
 *
 * Only allows proxying feeds from known crypto news domains to prevent abuse.
 */

import { type NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';
export const revalidate = 300;

const ALLOWED_DOMAINS = new Set([
  'coindesk.com',
  'cointelegraph.com',
  'theblock.co',
  'decrypt.co',
  'bitcoinmagazine.com',
  'blockworks.co',
  'thedefiant.io',
  'bitcoinist.com',
  'beincrypto.com',
  'dailyhodl.com',
  'newsbtc.com',
  'watcherguru.com',
  'cryptopolitan.com',
  'unchainedcrypto.com',
  'dlnews.com',
  'protos.com',
  'forkast.news',
  'rekt.news',
  'nftplazas.com',
  'playtoearn.net',
  'globenewswire.com',
  'blog.coingecko.com',
  'blog.coinmarketcap.com',
  'blog.chain.link',
  'medium.com',
  'mirror.xyz',
  'paragraph.xyz',
  'cryptocurrency.cv',
  'feeds.feedburner.com',
]);

function isAllowedUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.replace(/^www\./, '');
    return (
      ALLOWED_DOMAINS.has(hostname) ||
      Array.from(ALLOWED_DOMAINS).some((d) => hostname.endsWith(`.${d}`))
    );
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  const feedUrl = request.nextUrl.searchParams.get('url');

  if (!feedUrl) {
    return NextResponse.json({ error: 'Missing required "url" query parameter' }, { status: 400 });
  }

  // Validate URL
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(feedUrl);
  } catch {
    return NextResponse.json({ error: 'Invalid URL provided' }, { status: 400 });
  }

  // Only allow http/https
  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    return NextResponse.json({ error: 'Only HTTP and HTTPS URLs are allowed' }, { status: 400 });
  }

  // Domain allowlist check
  if (!isAllowedUrl(feedUrl)) {
    return NextResponse.json(
      { error: 'Domain not in allowlist. Only known crypto news feeds can be proxied.' },
      { status: 403 },
    );
  }

  try {
    const response = await fetch(feedUrl, {
      headers: {
        'User-Agent': 'FreeCryptoNews/1.0 (+https://cryptocurrency.cv)',
        Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
      },
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Upstream feed returned ${response.status}` },
        { status: 502 },
      );
    }

    const contentType = response.headers.get('content-type') || 'application/xml';
    const body = await response.text();

    return new NextResponse(body, {
      headers: {
        'Content-Type': contentType.includes('xml')
          ? contentType
          : 'application/xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const isTimeout = message.includes('timeout') || message.includes('abort');

    return NextResponse.json(
      { error: isTimeout ? 'Feed request timed out' : 'Failed to fetch feed' },
      { status: isTimeout ? 504 : 502 },
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
