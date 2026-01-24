/**
 * Dynamic Sitemap Generator
 * 
 * Generates sitemap.xml for search engine discovery
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap
 */

import { MetadataRoute } from 'next';
import { getAllSlugs, CATEGORIES } from '@/lib/blog';
import { getAllTags } from '@/lib/tags';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://free-crypto-news.vercel.app';

// Supported locales
const locales = ['en', 'es', 'fr', 'de', 'ja', 'ko', 'zh-CN', 'zh-TW', 'pt', 'ru', 'ar', 'it', 'nl', 'pl', 'tr', 'id', 'th', 'vi'];

// Static pages with their update frequencies
const staticPages = [
  { path: '', changeFrequency: 'always' as const, priority: 1.0 },
  { path: '/markets', changeFrequency: 'hourly' as const, priority: 0.9 },
  { path: '/trending', changeFrequency: 'hourly' as const, priority: 0.9 },
  { path: '/movers', changeFrequency: 'hourly' as const, priority: 0.8 },
  { path: '/heatmap', changeFrequency: 'hourly' as const, priority: 0.8 },
  { path: '/sentiment', changeFrequency: 'hourly' as const, priority: 0.8 },
  { path: '/defi', changeFrequency: 'hourly' as const, priority: 0.8 },
  { path: '/gas', changeFrequency: 'always' as const, priority: 0.7 },
  { path: '/funding', changeFrequency: 'hourly' as const, priority: 0.8 },
  { path: '/liquidations', changeFrequency: 'hourly' as const, priority: 0.8 },
  { path: '/screener', changeFrequency: 'daily' as const, priority: 0.7 },
  { path: '/calculator', changeFrequency: 'monthly' as const, priority: 0.5 },
  { path: '/dominance', changeFrequency: 'daily' as const, priority: 0.7 },
  { path: '/correlation', changeFrequency: 'daily' as const, priority: 0.6 },
  { path: '/charts', changeFrequency: 'daily' as const, priority: 0.6 },
  { path: '/buzz', changeFrequency: 'hourly' as const, priority: 0.7 },
  // Category pages
  { path: '/category/bitcoin', changeFrequency: 'hourly' as const, priority: 0.9 },
  { path: '/category/ethereum', changeFrequency: 'hourly' as const, priority: 0.9 },
  { path: '/category/defi', changeFrequency: 'hourly' as const, priority: 0.8 },
  { path: '/category/nft', changeFrequency: 'hourly' as const, priority: 0.7 },
  { path: '/category/regulation', changeFrequency: 'daily' as const, priority: 0.8 },
  { path: '/category/technology', changeFrequency: 'daily' as const, priority: 0.7 },
  // AI Features
  { path: '/ai/oracle', changeFrequency: 'hourly' as const, priority: 0.8 },
  { path: '/ai/brief', changeFrequency: 'hourly' as const, priority: 0.7 },
  { path: '/ai/debate', changeFrequency: 'daily' as const, priority: 0.6 },
  { path: '/ai/counter', changeFrequency: 'daily' as const, priority: 0.6 },
  // Premium features
  { path: '/portfolio', changeFrequency: 'daily' as const, priority: 0.7 },
  { path: '/alerts', changeFrequency: 'daily' as const, priority: 0.7 },
  { path: '/watchlist', changeFrequency: 'daily' as const, priority: 0.7 },
  { path: '/regulatory', changeFrequency: 'daily' as const, priority: 0.8 },
  { path: '/unlocks', changeFrequency: 'daily' as const, priority: 0.8 },
  { path: '/smart-money', changeFrequency: 'hourly' as const, priority: 0.8 },
  { path: '/exchange-flows', changeFrequency: 'hourly' as const, priority: 0.8 },
  // Docs & Developer
  { path: '/developers', changeFrequency: 'weekly' as const, priority: 0.6 },
  { path: '/developers/api', changeFrequency: 'weekly' as const, priority: 0.7 },
  { path: '/developers/sdk', changeFrequency: 'weekly' as const, priority: 0.6 },
  { path: '/developers/examples', changeFrequency: 'weekly' as const, priority: 0.6 },
];

// Top coins to include in sitemap
const topCoins = [
  'bitcoin', 'ethereum', 'binancecoin', 'solana', 'ripple', 'cardano',
  'dogecoin', 'polkadot', 'avalanche-2', 'chainlink', 'polygon',
  'uniswap', 'litecoin', 'cosmos', 'near', 'arbitrum', 'optimism',
  'aptos', 'sui', 'injective', 'render-token', 'immutable-x',
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];

  // Add static pages for each locale
  for (const locale of locales) {
    for (const page of staticPages) {
      entries.push({
        url: `${BASE_URL}/${locale}${page.path}`,
        lastModified: now,
        changeFrequency: page.changeFrequency,
        priority: page.priority,
      });
    }

    // Add coin pages
    for (const coin of topCoins) {
      entries.push({
        url: `${BASE_URL}/${locale}/coin/${coin}`,
        lastModified: now,
        changeFrequency: 'hourly',
        priority: 0.7,
      });
    }
  }

  // Add API documentation (not localized)
  entries.push({
    url: `${BASE_URL}/api/openapi.json`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.5,
  });

  // Add blog pages for each locale
  const blogSlugs = getAllSlugs();
  for (const locale of locales) {
    // Blog index
    entries.push({
      url: `${BASE_URL}/${locale}/blog`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    });
    
    // Individual blog posts (high priority for SEO)
    for (const slug of blogSlugs) {
      entries.push({
        url: `${BASE_URL}/${locale}/blog/${slug}`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.9,
      });
    }
    
    // Blog categories
    for (const category of Object.keys(CATEGORIES)) {
      entries.push({
        url: `${BASE_URL}/${locale}/blog/category/${category}`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    }
  }
  
  // Blog RSS feed
  entries.push({
    url: `${BASE_URL}/blog/feed.xml`,
    lastModified: now,
    changeFrequency: 'daily',
    priority: 0.6,
  });

  // Add tag pages for SEO
  const allTags = getAllTags();
  for (const locale of locales) {
    // Tags index page
    entries.push({
      url: `${BASE_URL}/${locale}/tags`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    });
    
    // Individual tag pages (important for SEO)
    for (const tag of allTags) {
      entries.push({
        url: `${BASE_URL}/${locale}/tags/${tag.slug}`,
        lastModified: now,
        changeFrequency: 'hourly',
        priority: Math.min(0.9, 0.6 + (tag.priority / 250)), // Higher priority tags get higher sitemap priority
      });
    }
  }

  return entries;
}
