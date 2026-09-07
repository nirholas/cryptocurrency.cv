/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

/**
 * Video source configuration and types for the Videos Hub.
 * Aggregates crypto video content from top YouTube channels.
 */

export interface VideoSource {
  name: string;
  slug: string;
  channelId: string;
  channelUrl: string;
  category: VideoCategory;
}

export type VideoCategory = 'news' | 'education' | 'analysis' | 'interviews' | 'defi';

export interface Video {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  videoUrl: string;
  embedUrl: string;
  publishedAt: string;
  source: VideoSource;
}

export const VIDEO_CATEGORIES: { value: VideoCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'news', label: 'News' },
  { value: 'education', label: 'Education' },
  { value: 'analysis', label: 'Analysis' },
  { value: 'interviews', label: 'Interviews' },
  { value: 'defi', label: 'DeFi' },
];

/**
 * The channels the video feed reads, by YouTube channel ID.
 *
 * Five of these six IDs were wrong and their RSS feeds answered 404, so
 * /videos/coindesk, /videos/cointelegraph, /videos/bankless,
 * /videos/real-vision and /videos/unchained each rendered "No videos found"
 * while the pages themselves looked healthy. Verify an ID against
 * `https://www.youtube.com/feeds/videos.xml?channel_id=<id>` before changing
 * one: a handle in `channelUrl` is not what the feed keys on.
 */
export const VIDEO_SOURCES: VideoSource[] = [
  {
    name: 'CoinDesk',
    slug: 'coindesk',
    channelId: 'UC7TghOL755nBk7HelHoi9LQ',
    channelUrl: 'https://www.youtube.com/@CoinDesk',
    category: 'news',
  },
  {
    name: 'Cointelegraph',
    slug: 'cointelegraph',
    channelId: 'UCRqBu-grVX1p97WaX4d-OuQ',
    channelUrl: 'https://www.youtube.com/@Cointelegraph',
    category: 'news',
  },
  {
    name: 'Bankless',
    slug: 'bankless',
    channelId: 'UCAl9Ld79qaZxp9JzEOwd3aA',
    channelUrl: 'https://www.youtube.com/@Bankless',
    category: 'education',
  },
  {
    name: 'The Defiant',
    slug: 'the-defiant',
    channelId: 'UCL0J4MLEdLP0-UyLu0hCktg',
    channelUrl: 'https://www.youtube.com/@TheDefiant',
    category: 'defi',
  },
  {
    name: 'Real Vision',
    slug: 'real-vision',
    channelId: 'UCGXWKlq1Oxr3ddEtmKhAkPg',
    channelUrl: 'https://www.youtube.com/@RealVisionFinance',
    category: 'interviews',
  },
  {
    name: 'Unchained',
    slug: 'unchained',
    channelId: 'UCWiiMnsnw5Isc2PP1to9nNw',
    channelUrl: 'https://www.youtube.com/@UnchainedCrypto',
    category: 'analysis',
  },
];

export function getVideoSourceBySlug(slug: string): VideoSource | undefined {
  return VIDEO_SOURCES.find((s) => s.slug === slug);
}

export function getVideoSourcesByCategory(category: VideoCategory): VideoSource[] {
  return VIDEO_SOURCES.filter((s) => s.category === category);
}

export function getYouTubeRssFeedUrl(channelId: string): string {
  return `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`;
}
