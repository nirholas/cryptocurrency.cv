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
 * Robots.txt Generator
 * 
 * Controls search engine crawling behavior
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots
 */

import { type MetadataRoute } from 'next';
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
        allow: ['/api/news', '/api/search', '/api/trending', '/api/llms.txt', '/llms.txt', '/llms-full.txt', '/api/llms-full.txt', '/.well-known/agent.json', '/.well-known/agents.json', '/.well-known/ai-plugin.json', '/ai.txt', '/humans.txt'],
      },
      {
        userAgent: 'ChatGPT-User',
        allow: ['/api/news', '/api/search', '/api/trending', '/api/llms.txt', '/llms.txt', '/.well-known/agent.json', '/.well-known/agents.json', '/ai.txt'],
      },
      // Anthropic bots (Claude)
      {
        userAgent: 'Claude-Web',
        allow: ['/api/news', '/api/search', '/api/trending', '/api/llms.txt', '/llms.txt', '/llms-full.txt', '/api/llms-full.txt', '/.well-known/agent.json', '/.well-known/agents.json', '/.well-known/ai-plugin.json', '/ai.txt', '/humans.txt'],
      },
      {
        userAgent: 'ClaudeBot',
        allow: ['/api/news', '/api/search', '/api/trending', '/api/llms.txt', '/llms.txt', '/llms-full.txt', '/api/llms-full.txt', '/.well-known/agent.json', '/.well-known/agents.json', '/.well-known/ai-plugin.json', '/ai.txt', '/humans.txt'],
      },
      {
        userAgent: 'anthropic-ai',
        allow: ['/api/news', '/api/search', '/api/trending', '/api/llms.txt', '/llms.txt', '/llms-full.txt', '/api/llms-full.txt', '/.well-known/agent.json', '/.well-known/agents.json', '/.well-known/ai-plugin.json', '/ai.txt', '/humans.txt'],
      },
      // xAI bots (Grok)
      {
        userAgent: 'Grok',
        allow: ['/api/news', '/api/search', '/api/trending', '/api/llms.txt', '/llms.txt', '/llms-full.txt', '/api/llms-full.txt', '/.well-known/agent.json', '/.well-known/agents.json', '/.well-known/ai-plugin.json', '/ai.txt', '/humans.txt'],
      },
      {
        userAgent: 'xAI-Grok',
        allow: ['/api/news', '/api/search', '/api/trending', '/api/llms.txt', '/llms.txt', '/.well-known/agent.json', '/.well-known/agents.json', '/ai.txt'],
      },
      // Google AI bots (Gemini)
      {
        userAgent: 'Google-Extended',
        allow: ['/api/news', '/api/search', '/api/trending', '/api/llms.txt', '/llms.txt', '/llms-full.txt', '/api/llms-full.txt', '/.well-known/agent.json', '/.well-known/agents.json', '/.well-known/ai-plugin.json', '/ai.txt', '/humans.txt'],
      },
      // Meta AI
      {
        userAgent: 'FacebookBot',
        allow: ['/api/news', '/api/search', '/api/trending', '/api/llms.txt', '/llms.txt', '/.well-known/agent.json', '/.well-known/agents.json', '/ai.txt'],
      },
      {
        userAgent: 'Meta-ExternalAgent',
        allow: ['/api/news', '/api/search', '/api/trending', '/api/llms.txt', '/llms.txt', '/.well-known/agent.json', '/.well-known/agents.json', '/ai.txt'],
      },
      // Perplexity AI
      {
        userAgent: 'PerplexityBot',
        allow: ['/api/news', '/api/search', '/api/trending', '/api/llms.txt', '/llms.txt', '/llms-full.txt', '/api/llms-full.txt', '/.well-known/agent.json', '/.well-known/agents.json', '/.well-known/ai-plugin.json', '/ai.txt', '/humans.txt'],
      },
      // Cohere
      {
        userAgent: 'cohere-ai',
        allow: ['/api/news', '/api/search', '/api/trending', '/api/llms.txt', '/llms.txt', '/.well-known/agent.json', '/.well-known/agents.json', '/ai.txt'],
      },
      // You.com
      {
        userAgent: 'YouBot',
        allow: ['/api/news', '/api/search', '/api/trending', '/api/llms.txt', '/llms.txt', '/.well-known/agent.json', '/.well-known/agents.json', '/ai.txt'],
      },
      // Mistral AI
      {
        userAgent: 'mistral-crawler',
        allow: ['/api/news', '/api/search', '/api/trending', '/api/llms.txt', '/llms.txt', '/llms-full.txt', '/api/llms-full.txt', '/.well-known/agent.json', '/.well-known/agents.json', '/.well-known/ai-plugin.json', '/ai.txt', '/humans.txt'],
      },
      // Amazon AI
      {
        userAgent: 'Amazonbot',
        allow: ['/api/news', '/api/search', '/api/trending', '/api/llms.txt', '/llms.txt', '/.well-known/agent.json', '/.well-known/agents.json', '/ai.txt'],
      },
      // Apple AI
      {
        userAgent: 'Applebot-Extended',
        allow: ['/api/news', '/api/search', '/api/trending', '/api/llms.txt', '/llms.txt', '/llms-full.txt', '/api/llms-full.txt', '/.well-known/agent.json', '/.well-known/agents.json', '/.well-known/ai-plugin.json', '/ai.txt', '/humans.txt'],
      },
      // ByteDance/TikTok AI
      {
        userAgent: 'Bytespider',
        allow: ['/api/news', '/api/search', '/api/trending', '/api/llms.txt', '/llms.txt', '/.well-known/agent.json', '/.well-known/agents.json', '/ai.txt'],
      },
      // OpenAI SearchGPT
      {
        userAgent: 'OAI-SearchBot',
        allow: ['/api/news', '/api/search', '/api/trending', '/api/llms.txt', '/llms.txt', '/llms-full.txt', '/api/llms-full.txt', '/.well-known/agent.json', '/.well-known/agents.json', '/.well-known/ai-plugin.json', '/ai.txt', '/humans.txt'],
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
