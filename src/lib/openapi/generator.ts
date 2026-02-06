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
