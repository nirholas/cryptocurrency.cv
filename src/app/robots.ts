/**
 * Robots.txt Generator
 * 
 * Controls search engine crawling behavior
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots
 */

import { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/constants';

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
          '/*.json',         // JSON files (except sitemap)
        ],
      },
      // OpenAI bots
      {
        userAgent: 'GPTBot',
        allow: ['/api/news', '/api/search', '/api/trending', '/api/llms.txt', '/llms.txt', '/llms-full.txt', '/api/llms-full.txt'],
      },
      {
        userAgent: 'ChatGPT-User',
        allow: ['/api/news', '/api/search', '/api/trending', '/api/llms.txt', '/llms.txt'],
      },
      // Anthropic bots (Claude)
      {
        userAgent: 'Claude-Web',
        allow: ['/api/news', '/api/search', '/api/trending', '/api/llms.txt', '/llms.txt', '/llms-full.txt', '/api/llms-full.txt'],
      },
      {
        userAgent: 'ClaudeBot',
        allow: ['/api/news', '/api/search', '/api/trending', '/api/llms.txt', '/llms.txt', '/llms-full.txt', '/api/llms-full.txt'],
      },
      {
        userAgent: 'anthropic-ai',
        allow: ['/api/news', '/api/search', '/api/trending', '/api/llms.txt', '/llms.txt', '/llms-full.txt', '/api/llms-full.txt'],
      },
      // xAI bots (Grok)
      {
        userAgent: 'Grok',
        allow: ['/api/news', '/api/search', '/api/trending', '/api/llms.txt', '/llms.txt', '/llms-full.txt', '/api/llms-full.txt'],
      },
      {
        userAgent: 'xAI-Grok',
        allow: ['/api/news', '/api/search', '/api/trending', '/api/llms.txt', '/llms.txt'],
      },
      // Google AI bots (Gemini)
      {
        userAgent: 'Google-Extended',
        allow: ['/api/news', '/api/search', '/api/trending', '/api/llms.txt', '/llms.txt', '/llms-full.txt', '/api/llms-full.txt'],
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
        allow: ['/api/news', '/api/search', '/api/trending', '/api/llms.txt', '/llms.txt', '/llms-full.txt', '/api/llms-full.txt'],
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
      // Mistral AI
      {
        userAgent: 'mistral-crawler',
        allow: ['/api/news', '/api/search', '/api/trending', '/api/llms.txt', '/llms.txt', '/llms-full.txt', '/api/llms-full.txt'],
      },
      // Amazon AI
      {
        userAgent: 'Amazonbot',
        allow: ['/api/news', '/api/search', '/api/trending', '/api/llms.txt', '/llms.txt'],
      },
      // Apple AI
      {
        userAgent: 'Applebot-Extended',
        allow: ['/api/news', '/api/search', '/api/trending', '/api/llms.txt', '/llms.txt', '/llms-full.txt', '/api/llms-full.txt'],
      },
      // ByteDance/TikTok AI
      {
        userAgent: 'Bytespider',
        allow: ['/api/news', '/api/search', '/api/trending', '/api/llms.txt', '/llms.txt'],
      },
      // OpenAI SearchGPT
      {
        userAgent: 'OAI-SearchBot',
        allow: ['/api/news', '/api/search', '/api/trending', '/api/llms.txt', '/llms.txt', '/llms-full.txt', '/api/llms-full.txt'],
      },
      // Common Crawl (training data)
      {
        userAgent: 'CCBot',
        allow: ['/api/news', '/api/search', '/api/trending', '/llms.txt', '/llms-full.txt', '/api/llms-full.txt'],
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
      `${SITE_URL}/sitemap.xml`,
      `${SITE_URL}/news-sitemap.xml`,
    ],
    host: SITE_URL,
  };
}
