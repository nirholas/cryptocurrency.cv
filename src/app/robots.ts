/**
 * Robots.txt Generator
 * 
 * Controls search engine crawling behavior
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots
 */

import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://news-crypto.vercel.app';

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
      // OpenAI bots
      {
        userAgent: 'GPTBot',
        allow: ['/api/news', '/api/search', '/api/trending', '/api/llms.txt', '/llms.txt', '/llms-full.txt'],
      },
      {
        userAgent: 'ChatGPT-User',
        allow: ['/api/news', '/api/search', '/api/trending', '/api/llms.txt', '/llms.txt'],
      },
      // Anthropic bots (Claude)
      {
        userAgent: 'Claude-Web',
        allow: ['/api/news', '/api/search', '/api/trending', '/api/llms.txt', '/llms.txt', '/llms-full.txt'],
      },
      {
        userAgent: 'ClaudeBot',
        allow: ['/api/news', '/api/search', '/api/trending', '/api/llms.txt', '/llms.txt', '/llms-full.txt'],
      },
      {
        userAgent: 'anthropic-ai',
        allow: ['/api/news', '/api/search', '/api/trending', '/api/llms.txt', '/llms.txt', '/llms-full.txt'],
      },
      // xAI bots (Grok)
      {
        userAgent: 'Grok',
        allow: ['/api/news', '/api/search', '/api/trending', '/api/llms.txt', '/llms.txt', '/llms-full.txt'],
      },
      {
        userAgent: 'xAI-Grok',
        allow: ['/api/news', '/api/search', '/api/trending', '/api/llms.txt', '/llms.txt'],
      },
      // Google AI bots (Gemini)
      {
        userAgent: 'Google-Extended',
        allow: ['/api/news', '/api/search', '/api/trending', '/api/llms.txt', '/llms.txt', '/llms-full.txt'],
      },
      // Meta AI
      {
        userAgent: 'FacebookBot',
        allow: ['/api/news', '/api/search', '/api/trending', '/api/llms.txt', '/llms.txt'],
      },
      {
        userAgent: 'Meta-ExternalAgent',
        allow: ['/api/news', '/api/search', '/api/trending', '/api/llms.txt', '/llms.txt'],
      },
      // Perplexity AI
      {
        userAgent: 'PerplexityBot',
        allow: ['/api/news', '/api/search', '/api/trending', '/api/llms.txt', '/llms.txt', '/llms-full.txt'],
      },
      // Cohere
      {
        userAgent: 'cohere-ai',
        allow: ['/api/news', '/api/search', '/api/trending', '/api/llms.txt', '/llms.txt'],
      },
      // You.com
      {
        userAgent: 'YouBot',
        allow: ['/api/news', '/api/search', '/api/trending', '/api/llms.txt', '/llms.txt'],
      },
      // Search engines
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
