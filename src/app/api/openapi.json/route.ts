import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const host = request.headers.get('host') || 'free-crypto-news.vercel.app';
  const baseUrl = `https://${host}`;
  
  const openApiSpec = {
    openapi: '3.1.0',
    info: {
      title: 'Free Crypto News API',
      description: '🆓 100% FREE crypto news API. No API keys required! Aggregates real-time news from 7 major crypto sources.',
      version: '1.0.0',
      contact: {
        name: 'GitHub',
        url: 'https://github.com/nirholas/free-crypto-news',
      },
    },
    servers: [{ url: baseUrl }],
    paths: {
      '/api/news': {
        get: {
          operationId: 'getLatestNews',
          summary: 'Get latest crypto news',
          description: 'Fetch the latest news from all 7 crypto news sources',
          tags: ['News'],
          parameters: [
            {
              name: 'limit',
              in: 'query',
              description: 'Maximum number of articles (1-50)',
              schema: { type: 'integer', default: 10, minimum: 1, maximum: 50 },
            },
            {
              name: 'source',
              in: 'query',
              description: 'Filter by source',
              schema: {
                type: 'string',
                enum: ['coindesk', 'theblock', 'decrypt', 'cointelegraph', 'bitcoinmagazine', 'blockworks', 'defiant'],
              },
            },
          ],
          responses: {
            '200': {
              description: 'Success',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/NewsResponse' } } },
            },
          },
        },
      },
      '/api/search': {
        get: {
          operationId: 'searchNews',
          summary: 'Search news by keywords',
          tags: ['News'],
          parameters: [
            { name: 'q', in: 'query', required: true, description: 'Search keywords', schema: { type: 'string' } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          ],
          responses: { '200': { description: 'Success', content: { 'application/json': { schema: { $ref: '#/components/schemas/NewsResponse' } } } } },
        },
      },
      '/api/defi': {
        get: {
          operationId: 'getDefiNews',
          summary: 'Get DeFi news',
          tags: ['News'],
          parameters: [{ name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } }],
          responses: { '200': { description: 'Success', content: { 'application/json': { schema: { $ref: '#/components/schemas/NewsResponse' } } } } },
        },
      },
      '/api/bitcoin': {
        get: {
          operationId: 'getBitcoinNews',
          summary: 'Get Bitcoin news',
          tags: ['News'],
          parameters: [{ name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } }],
          responses: { '200': { description: 'Success', content: { 'application/json': { schema: { $ref: '#/components/schemas/NewsResponse' } } } } },
        },
      },
      '/api/breaking': {
        get: {
          operationId: 'getBreakingNews',
          summary: 'Get breaking news (last 2 hours)',
          tags: ['News'],
          parameters: [{ name: 'limit', in: 'query', schema: { type: 'integer', default: 5 } }],
          responses: { '200': { description: 'Success', content: { 'application/json': { schema: { $ref: '#/components/schemas/NewsResponse' } } } } },
        },
      },
      '/api/sources': {
        get: {
          operationId: 'getSources',
          summary: 'List all news sources',
          tags: ['Meta'],
          responses: { '200': { description: 'Success', content: { 'application/json': { schema: { $ref: '#/components/schemas/SourcesResponse' } } } } },
        },
      },
      '/api/health': {
        get: {
          operationId: 'getHealth',
          summary: 'Check API health',
          tags: ['Meta'],
          responses: { '200': { description: 'Success', content: { 'application/json': { schema: { $ref: '#/components/schemas/HealthResponse' } } } } },
        },
      },
      '/api/rss': {
        get: {
          operationId: 'getRSSFeed',
          summary: 'Get aggregated RSS feed',
          tags: ['Meta'],
          parameters: [
            { name: 'feed', in: 'query', schema: { type: 'string', enum: ['all', 'defi', 'bitcoin'], default: 'all' } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          ],
          responses: { '200': { description: 'RSS XML feed', content: { 'application/rss+xml': {} } } },
        },
      },
    },
    components: {
      schemas: {
        NewsArticle: {
          type: 'object',
          properties: {
            title: { type: 'string', example: 'Bitcoin Hits New ATH' },
            link: { type: 'string', example: 'https://coindesk.com/...' },
            description: { type: 'string' },
            pubDate: { type: 'string', format: 'date-time' },
            source: { type: 'string', example: 'CoinDesk' },
            sourceKey: { type: 'string', example: 'coindesk' },
            category: { type: 'string', example: 'general' },
            timeAgo: { type: 'string', example: '2h ago' },
          },
        },
        NewsResponse: {
          type: 'object',
          properties: {
            articles: { type: 'array', items: { $ref: '#/components/schemas/NewsArticle' } },
            totalCount: { type: 'integer' },
            sources: { type: 'array', items: { type: 'string' } },
            fetchedAt: { type: 'string', format: 'date-time' },
          },
        },
        SourcesResponse: {
          type: 'object',
          properties: {
            sources: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  key: { type: 'string' },
                  name: { type: 'string' },
                  url: { type: 'string' },
                  category: { type: 'string' },
                  status: { type: 'string', enum: ['active', 'unavailable'] },
                },
              },
            },
          },
        },
        HealthResponse: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['healthy', 'degraded', 'down'] },
            timestamp: { type: 'string', format: 'date-time' },
            summary: {
              type: 'object',
              properties: {
                healthy: { type: 'integer' },
                degraded: { type: 'integer' },
                down: { type: 'integer' },
                total: { type: 'integer' },
              },
            },
          },
        },
      },
    },
    tags: [
      { name: 'News', description: 'News endpoints' },
      { name: 'Meta', description: 'API metadata and health' },
    ],
  };

  return NextResponse.json(openApiSpec, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
