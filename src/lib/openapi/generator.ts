/**
 * OpenAPI Specification Generator
 * 
 * Automatically generates OpenAPI 3.0 spec from Zod schemas
 */

import { z } from 'zod';

interface OpenAPIPath {
  summary?: string;
  description?: string;
  tags?: string[];
  parameters?: Array<{
    name: string;
    in: 'query' | 'path' | 'header';
    required?: boolean;
    schema: unknown;
    description?: string;
  }>;
  requestBody?: {
    required: boolean;
    content: {
      'application/json': {
        schema: unknown;
      };
    };
  };
  responses: Record<string, {
    description: string;
    content?: {
      'application/json': {
        schema: unknown;
        example?: unknown;
      };
    };
  }>;
  security?: Array<Record<string, string[]>>;
}

interface OpenAPISpec {
  openapi: '3.0.0';
  info: {
    title: string;
    version: string;
    description: string;
    contact: {
      name: string;
      url: string;
    };
    license: {
      name: string;
      url: string;
    };
  };
  servers: Array<{
    url: string;
    description: string;
  }>;
  paths: Record<string, Record<string, OpenAPIPath>>;
  components: {
    schemas: Record<string, unknown>;
    securitySchemes: Record<string, unknown>;
  };
  tags: Array<{
    name: string;
    description: string;
  }>;
}

/**
 * Generate OpenAPI spec for the API
 */
export function generateOpenAPISpec(): OpenAPISpec {
  return {
    openapi: '3.0.0',
    info: {
      title: 'Free Crypto News API',
      version: '1.0.0',
      description: 'Comprehensive cryptocurrency news and market data API with x402 micropayments. Access real-time crypto news, market data, AI trading signals, and portfolio analytics.',
      contact: {
        name: 'Free Crypto News',
        url: 'https://github.com/nirholas/free-crypto-news',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'https://cryptocurrency.cv',
        description: 'Production server',
      },
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    tags: [
      { name: 'News', description: 'Cryptocurrency news endpoints' },
      { name: 'Market Data', description: 'Real-time market data' },
      { name: 'Premium', description: 'Premium endpoints (requires payment)' },
      { name: 'Admin', description: 'Administrative endpoints' },
      { name: 'System', description: 'System health and status' },
    ],
    paths: {
      '/api/news': {
        get: {
          summary: 'Get latest cryptocurrency news',
          description: 'Returns paginated list of latest crypto news articles from multiple sources',
          tags: ['News'],
          parameters: [
            { 
              name: 'limit', 
              in: 'query', 
              description: 'Number of articles to return',
              schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 } 
            },
            { 
              name: 'source', 
              in: 'query', 
              description: 'Filter by news source',
              schema: { type: 'string' } 
            },
            { 
              name: 'category', 
              in: 'query', 
              description: 'Filter by category',
              schema: { 
                type: 'string', 
                enum: ['general', 'bitcoin', 'defi', 'nft', 'research', 'institutional', 'etf']
              } 
            },
            { 
              name: 'lang', 
              in: 'query', 
              description: 'Language code',
              schema: { type: 'string', default: 'en' } 
            },
            { 
              name: 'page', 
              in: 'query', 
              description: 'Page number for pagination',
              schema: { type: 'integer', minimum: 1, default: 1 } 
            },
          ],
          responses: {
            '200': {
              description: 'Successful response',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      articles: { 
                        type: 'array', 
                        items: { 
                          type: 'object',
                          properties: {
                            id: { type: 'string' },
                            title: { type: 'string' },
                            description: { type: 'string', nullable: true },
                            url: { type: 'string' },
                            source: { type: 'string' },
                            publishedAt: { type: 'string', format: 'date-time' },
                          }
                        } 
                      },
                      total: { type: 'integer' },
                      page: { type: 'integer' },
                    },
                  },
                  example: {
                    articles: [
                      {
                        id: '123',
                        title: 'Bitcoin Reaches New High',
                        description: 'BTC surpasses previous ATH',
                        url: 'https://example.com/article',
                        source: 'CoinDesk',
                        publishedAt: '2026-02-02T10:00:00Z',
                      }
                    ],
                    total: 100,
                    page: 1,
                  }
                },
              },
            },
            '400': { description: 'Bad request - validation error' },
            '500': { description: 'Internal server error' },
          },
        },
      },
      '/api/breaking': {
        get: {
          summary: 'Get breaking news',
          description: 'Returns latest breaking cryptocurrency news',
          tags: ['News'],
          parameters: [
            { 
              name: 'limit', 
              in: 'query', 
              schema: { type: 'integer', minimum: 1, maximum: 50, default: 10 } 
            },
            { 
              name: 'priority', 
              in: 'query', 
              schema: { type: 'string', enum: ['high', 'critical'] } 
            },
          ],
          responses: {
            '200': { description: 'Successful response' },
          },
        },
      },
      '/api/search': {
        get: {
          summary: 'Search crypto news',
          description: 'Full-text search across all aggregated news articles from 130+ sources. Returns articles matching keyword(s).',
          tags: ['News'],
          parameters: [
            {
              name: 'q',
              in: 'query',
              required: true,
              description: 'Comma-separated keywords or phrase (e.g. "bitcoin ETF,blackrock")',
              schema: { type: 'string' },
            },
            {
              name: 'limit',
              in: 'query',
              description: 'Maximum results to return',
              schema: { type: 'integer', minimum: 1, maximum: 50, default: 10 },
            },
            {
              name: 'from',
              in: 'query',
              description: 'Earliest publish date (ISO 8601)',
              schema: { type: 'string', format: 'date-time' },
            },
            {
              name: 'to',
              in: 'query',
              description: 'Latest publish date (ISO 8601)',
              schema: { type: 'string', format: 'date-time' },
            },
            {
              name: 'source',
              in: 'query',
              description: 'Filter by source key (e.g. coindesk, decrypt)',
              schema: { type: 'string' },
            },
          ],
          responses: {
            '200': {
              description: 'Search results',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      articles: { type: 'array', items: { $ref: '#/components/schemas/Article' } },
                      total: { type: 'integer' },
                      query: { type: 'string' },
                    },
                  },
                },
              },
            },
            '400': { description: 'Missing required parameter q' },
          },
        },
      },
      '/api/bitcoin': {
        get: {
          summary: 'Get Bitcoin news',
          description: 'Returns news specifically about Bitcoin, Lightning Network, miners, and Bitcoin ETFs.',
          tags: ['News'],
          parameters: [
            { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 } },
            { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1, default: 1 } },
          ],
          responses: { '200': { description: 'Bitcoin news articles' } },
        },
      },
      '/api/defi': {
        get: {
          summary: 'Get DeFi news',
          description: 'Returns news about DeFi protocols, yield farming, DEXs, lending, TVL, and hacks.',
          tags: ['News'],
          parameters: [
            { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 } },
            { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1, default: 1 } },
          ],
          responses: { '200': { description: 'DeFi news articles' } },
        },
      },
      '/api/sources': {
        get: {
          summary: 'List all news sources',
          description: 'Returns all 130+ aggregated news sources with their status, category, and metadata.',
          tags: ['News'],
          responses: {
            '200': {
              description: 'List of news sources',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      sources: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            key: { type: 'string' },
                            name: { type: 'string' },
                            url: { type: 'string', format: 'uri' },
                            category: { type: 'string' },
                            language: { type: 'string' },
                            status: { type: 'string', enum: ['active', 'degraded', 'unavailable'] },
                          },
                        },
                      },
                      totalActive: { type: 'integer' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/trending': {
        get: {
          summary: 'Get trending topics',
          description: 'Returns the most-mentioned keywords and topics across all crypto news in the last 24 hours.',
          tags: ['News'],
          parameters: [
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
            {
              name: 'period',
              in: 'query',
              description: 'Time window for trend calculation',
              schema: { type: 'string', enum: ['1h', '6h', '24h', '7d'], default: '24h' },
            },
          ],
          responses: {
            '200': {
              description: 'Trending topics with counts and sentiment',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      trending: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            keyword: { type: 'string' },
                            count: { type: 'integer' },
                            change: { type: 'string' },
                            sentiment: { type: 'string', enum: ['bullish', 'bearish', 'neutral'] },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/sentiment': {
        get: {
          summary: 'Market sentiment analysis',
          description: 'AI-powered sentiment analysis aggregated from all news sources. Returns bullish/bearish/neutral breakdown per asset.',
          tags: ['Market Data'],
          parameters: [
            {
              name: 'asset',
              in: 'query',
              description: 'Crypto asset symbol (e.g. BTC, ETH, SOL). Omit for overall market.',
              schema: { type: 'string' },
            },
            {
              name: 'period',
              in: 'query',
              schema: { type: 'string', enum: ['1h', '24h', '7d', '30d'], default: '24h' },
            },
          ],
          responses: {
            '200': {
              description: 'Sentiment breakdown',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      overall: { type: 'string', enum: ['bullish', 'bearish', 'neutral'] },
                      score: { type: 'number', minimum: -1, maximum: 1 },
                      breakdown: {
                        type: 'object',
                        properties: {
                          bullish: { type: 'integer' },
                          neutral: { type: 'integer' },
                          bearish: { type: 'integer' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/fear-greed': {
        get: {
          summary: 'Crypto Fear & Greed Index',
          description: 'Returns the current Crypto Fear & Greed Index value (0=Extreme Fear, 100=Extreme Greed).',
          tags: ['Market Data'],
          responses: {
            '200': {
              description: 'Fear & Greed Index',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      value: { type: 'integer', minimum: 0, maximum: 100 },
                      classification: { type: 'string', enum: ['Extreme Fear', 'Fear', 'Neutral', 'Greed', 'Extreme Greed'] },
                      previousValue: { type: 'integer' },
                      timestamp: { type: 'string', format: 'date-time' },
                    },
                  },
                  example: { value: 72, classification: 'Greed', previousValue: 68, timestamp: '2026-02-21T00:00:00Z' },
                },
              },
            },
          },
        },
      },
      '/api/rss': {
        get: {
          summary: 'RSS 2.0 feed',
          description: 'Returns latest crypto news as RSS 2.0 XML feed. Compatible with all RSS readers.',
          tags: ['News'],
          parameters: [
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
            { name: 'source', in: 'query', schema: { type: 'string' } },
            { name: 'category', in: 'query', schema: { type: 'string' } },
          ],
          responses: {
            '200': {
              description: 'RSS XML feed',
              content: { 'application/rss+xml': { schema: { type: 'string' } } } as any,
            },
          },
        },
      },
      '/api/atom': {
        get: {
          summary: 'Atom 1.0 feed',
          description: 'Returns latest crypto news as Atom 1.0 XML feed.',
          tags: ['News'],
          parameters: [
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          ],
          responses: {
            '200': {
              description: 'Atom XML feed',
              content: { 'application/atom+xml': { schema: { type: 'string' } } } as any,
            },
          },
        },
      },
      '/api/ask': {
        get: {
          summary: 'Ask about crypto news (NLP)',
          description: 'Natural language Q&A over the crypto news corpus. Ask any question about current crypto events.',
          tags: ['News'],
          parameters: [
            {
              name: 'q',
              in: 'query',
              required: true,
              description: 'Natural language question (e.g. "What happened to Bitcoin this week?")',
              schema: { type: 'string' },
            },
          ],
          responses: {
            '200': {
              description: 'AI-generated answer with source articles',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      answer: { type: 'string' },
                      sources: { type: 'array', items: { $ref: '#/components/schemas/Article' } },
                      confidence: { type: 'number' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/v1/coins': {
        get: {
          summary: 'List cryptocurrencies',
          description: 'Returns paginated list of cryptocurrencies with market data. Requires API key or x402 payment.',
          tags: ['Market Data'],
          parameters: [
            { 
              name: 'page', 
              in: 'query', 
              description: 'Page number',
              schema: { type: 'integer', minimum: 1, default: 1 } 
            },
            { 
              name: 'per_page', 
              in: 'query', 
              description: 'Results per page',
              schema: { type: 'integer', minimum: 1, maximum: 250, default: 100 } 
            },
            { 
              name: 'order', 
              in: 'query', 
              description: 'Sort order',
              schema: { 
                type: 'string', 
                enum: ['market_cap_desc', 'market_cap_asc', 'volume_desc', 'volume_asc'],
                default: 'market_cap_desc'
              } 
            },
          ],
          responses: {
            '200': { 
              description: 'Successful response',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        symbol: { type: 'string' },
                        name: { type: 'string' },
                        current_price: { type: 'number' },
                        market_cap: { type: 'number' },
                        price_change_percentage_24h: { type: 'number' },
                      }
                    }
                  }
                }
              }
            },
            '402': { description: 'Payment required' },
            '429': { description: 'Rate limit exceeded' },
          },
          security: [
            { ApiKeyAuth: [] },
            { X402Payment: [] },
          ],
        },
      },
      '/api/premium/ai/signals': {
        get: {
          summary: 'Get AI trading signals',
          description: 'AI-generated buy/sell signals. Requires x402 payment of $0.05 per request.',
          tags: ['Premium'],
          parameters: [
            { 
              name: 'coin', 
              in: 'query', 
              required: true, 
              description: 'Coin ID (e.g., bitcoin, ethereum)',
              schema: { type: 'string' } 
            },
            { 
              name: 'timeframe', 
              in: 'query', 
              description: 'Timeframe for analysis',
              schema: { type: 'string', enum: ['1h', '4h', '1d', '1w'], default: '1d' } 
            },
          ],
          responses: {
            '200': { 
              description: 'Successful response',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      coin: { type: 'string' },
                      signal: { type: 'string', enum: ['strong_buy', 'buy', 'hold', 'sell', 'strong_sell'] },
                      confidence: { type: 'number', minimum: 0, maximum: 1 },
                      price: { type: 'number' },
                      reasoning: { type: 'string' },
                    }
                  }
                }
              }
            },
            '402': { description: 'Payment required ($0.05)' },
          },
          security: [
            { X402Payment: [] },
          ],
        },
      },
      '/api/premium/portfolio/analytics': {
        post: {
          summary: 'Analyze portfolio',
          description: 'Get AI-powered portfolio analytics and insights',
          tags: ['Premium'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['holdings'],
                  properties: {
                    holdings: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          coinId: { type: 'string' },
                          amount: { type: 'number' },
                          purchasePrice: { type: 'number' },
                        }
                      }
                    },
                    currency: { type: 'string', default: 'usd' },
                    period: { type: 'string', enum: ['24h', '7d', '30d', '90d', '1y'], default: '30d' },
                  }
                }
              }
            }
          },
          responses: {
            '200': { description: 'Successful response' },
            '402': { description: 'Payment required' },
          },
          security: [
            { X402Payment: [] },
          ],
        },
      },
      '/api/market/compare': {
        get: {
          summary: 'Compare cryptocurrencies',
          description: 'Compare multiple cryptocurrencies side-by-side',
          tags: ['Market Data'],
          parameters: [
            { 
              name: 'coins', 
              in: 'query', 
              required: true,
              description: 'Comma-separated coin IDs',
              schema: { type: 'string' } 
            },
          ],
          responses: {
            '200': { description: 'Successful response' },
          },
        },
      },
      '/api/health': {
        get: {
          summary: 'Health check',
          description: 'Returns system health status and service availability',
          tags: ['System'],
          responses: {
            '200': {
              description: 'System healthy',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', enum: ['healthy', 'degraded', 'unhealthy'] },
                      checks: { 
                        type: 'object',
                        properties: {
                          database: { type: 'boolean' },
                          cache: { type: 'boolean' },
                          upstream: { type: 'boolean' },
                        }
                      },
                      uptime: { type: 'number' },
                      timestamp: { type: 'string', format: 'date-time' },
                    },
                  },
                },
              },
            },
            '503': { description: 'System unhealthy' },
          },
        },
      },
      '/api/openapi.json': {
        get: {
          summary: 'OpenAPI specification',
          description: 'Returns the OpenAPI 3.0 specification for this API',
          tags: ['System'],
          responses: {
            '200': {
              description: 'OpenAPI spec',
              content: {
                'application/json': {
                  schema: { type: 'object' }
                }
              }
            },
          },
        },
      },
    },
    components: {
      schemas: {
        Article: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string', nullable: true },
            url: { type: 'string', format: 'uri' },
            source: { type: 'string' },
            category: { type: 'string' },
            publishedAt: { type: 'string', format: 'date-time' },
            sentiment: { type: 'string', enum: ['positive', 'negative', 'neutral'] },
          }
        },
        Coin: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            symbol: { type: 'string' },
            name: { type: 'string' },
            current_price: { type: 'number' },
            market_cap: { type: 'number' },
            price_change_percentage_24h: { type: 'number' },
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            code: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' },
            validationErrors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string' },
                  message: { type: 'string' },
                }
              }
            }
          }
        }
      },
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description: 'API key for authenticated access. Get your key at /settings',
        },
        X402Payment: {
          type: 'apiKey',
          in: 'header',
          name: 'PAYMENT-SIGNATURE',
          description: 'x402 micropayment signature. See /docs/x402 for details',
        },
      },
    },
  };
}
