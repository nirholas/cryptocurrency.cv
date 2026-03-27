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

export const VIDEO_SOURCES: VideoSource[] = [
  {
    name: 'CoinDesk',
    slug: 'coindesk',
    channelId: 'UCwF1NqjABYGOpOTC1JF-_rA',
    channelUrl: 'https://www.youtube.com/@CoinDesk',
    category: 'news',
  },
  {
    name: 'Cointelegraph',
    slug: 'cointelegraph',
    channelId: 'UCRqBu-grVSxK0B0iGhfeJBg',
    channelUrl: 'https://www.youtube.com/@caborsky',
    category: 'news',
  },
  {
    name: 'Bankless',
    slug: 'bankless',
    channelId: 'UCAl9Ld79qaZxp9JzTOBiZQQ',
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
    channelId: 'UCXMHZ9oeimRJiPqagWo1Tpw',
    channelUrl: 'https://www.youtube.com/@RealVisionFinance',
    category: 'interviews',
  },
  {
    name: 'Unchained',
    slug: 'unchained',
    channelId: 'UCWiiMnsnw5Isc2PP1wFHGnQ',
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
