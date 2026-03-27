/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

/**
 * Videos API — Aggregates video content from YouTube RSS feeds of top crypto channels.
 *
 * GET /api/videos
 *   ?source=bankless        — Filter by source slug
 *   &category=news          — Filter by category
 *   &limit=20               — Number of results (default 20, max 100)
 *   &offset=0               — Pagination offset
 *
 * Caches responses for 15 minutes.
 */

import { type NextRequest, NextResponse } from 'next/server';
import {
  VIDEO_SOURCES,
  getYouTubeRssFeedUrl,
  type Video,
  type VideoSource,
  type VideoCategory,
} from '@/lib/video-sources';

export const runtime = 'edge';
export const revalidate = 900; // 15 minutes ISR

/* ── In-memory cache ─────────────────────────────────────── */

interface CacheEntry {
  videos: Video[];
  timestamp: number;
}

const CACHE_TTL = 15 * 60 * 1000; // 15 minutes
let cache: CacheEntry | null = null;

/* ── XML parsing helpers ─────────────────────────────────── */

function extractText(xml: string, tag: string): string {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
  return match ? match[1].trim() : '';
}

function extractAttr(xml: string, tag: string, attr: string): string {
  const match = xml.match(new RegExp(`<${tag}[^>]*${attr}="([^"]*)"[^>]*/?>`, 'i'));
  return match ? match[1] : '';
}

function parseVideoEntries(xml: string, source: VideoSource): Video[] {
  const entries: Video[] = [];
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let match;

  while ((match = entryRegex.exec(xml)) !== null) {
    const entry = match[1];
    const videoId = extractText(entry, 'yt:videoId');
    if (!videoId) continue;

    const title = extractText(entry, 'title');
    const published = extractText(entry, 'published');

    // Description from media:group > media:description
    const mediaGroup = entry.match(/<media:group>([\s\S]*?)<\/media:group>/)?.[1] ?? '';
    const description = extractText(mediaGroup, 'media:description').slice(0, 500);

    // Thumbnail from media:group > media:thumbnail
    const thumbnailUrl =
      extractAttr(mediaGroup, 'media:thumbnail', 'url') ||
      `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

    entries.push({
      id: videoId,
      title,
      description,
      thumbnailUrl,
      videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
      embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}`,
      publishedAt: published,
      source,
    });
  }

  return entries;
}

/* ── Fetch all video feeds ───────────────────────────────── */

async function fetchAllVideos(): Promise<Video[]> {
  // Return from cache if fresh
  if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
    return cache.videos;
  }

  const results = await Promise.allSettled(
    VIDEO_SOURCES.map(async (source) => {
      const feedUrl = getYouTubeRssFeedUrl(source.channelId);
      const res = await fetch(feedUrl, {
        next: { revalidate: 900 },
        headers: { 'User-Agent': 'FreeCryptoNews/1.0 (+https://freecryptonews.com)' },
      });
      if (!res.ok) return [];
      const xml = await res.text();
      return parseVideoEntries(xml, source);
    }),
  );

  const allVideos: Video[] = [];
  for (const result of results) {
    if (result.status === 'fulfilled') {
      allVideos.push(...result.value);
    }
  }

  // Sort by date descending
  allVideos.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  // Update cache
  cache = { videos: allVideos, timestamp: Date.now() };

  return allVideos;
}

/* ── GET handler ─────────────────────────────────────────── */

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const source = params.get('source');
  const category = params.get('category') as VideoCategory | null;
  const limit = Math.min(Math.max(parseInt(params.get('limit') || '20', 10) || 20, 1), 100);
  const offset = Math.max(parseInt(params.get('offset') || '0', 10) || 0, 0);

  try {
    let videos = await fetchAllVideos();

    // Filter by source slug
    if (source) {
      videos = videos.filter((v) => v.source.slug === source);
    }

    // Filter by category
    if (category) {
      videos = videos.filter((v) => v.source.category === category);
    }

    const total = videos.length;
    const paginated = videos.slice(offset, offset + limit);

    return NextResponse.json(
      {
        videos: paginated,
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=1800',
        },
      },
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch videos', timestamp: new Date().toISOString() },
      { status: 500 },
    );
  }
}
