/**
 * Robots.txt Generator
 * 
 * Controls search engine crawling behavior
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots
 */

import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://free-crypto-news.vercel.app';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',           // Protect API endpoints from indexing
          '/admin/',         // Admin pages
          '/_next/',         // Next.js internals
          '/private/',       // Any private pages
          '/*.json$',        // JSON files (except sitemap)
        ],
      },
      {
        userAgent: 'GPTBot',
        allow: ['/api/news', '/api/search', '/api/trending'], // Allow AI to access public APIs
      },
      {
        userAgent: 'ChatGPT-User',
        allow: ['/api/news', '/api/search', '/api/trending'],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        crawlDelay: 1,
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
        crawlDelay: 2,
      },
    ],
    sitemap: [
      `${BASE_URL}/sitemap.xml`,
      `${BASE_URL}/news-sitemap.xml`,
    ],
    host: BASE_URL,
  };
}
