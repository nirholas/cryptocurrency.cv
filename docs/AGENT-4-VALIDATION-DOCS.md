# 🤖 AGENT 4: Schema Validation & API Documentation

**Mission**: Implement type-safe schema validation, generate OpenAPI documentation, and create developer experience improvements for the API.

**Priority**: MEDIUM - Works in parallel with Agents 2 & 3

**Estimated Time**: 2.5-3 hours

**Dependencies**: 
- None - can start immediately
- Will integrate with Agent 2's error system when ready

**Coordination**: Provides validation schemas that Agent 2/3 use in route updates

---

## 🎯 OBJECTIVES

### Primary Goals
1. ✅ Add Zod schema validation for all API endpoints
2. ✅ Generate OpenAPI 3.0 specification automatically
3. ✅ Create interactive API documentation
4. ✅ Add request/response validation middleware
5. ✅ Improve developer experience with better types

### Success Criteria
- [ ] Zod schemas defined for all major endpoints
- [ ] OpenAPI spec auto-generated from schemas
- [ ] Validation catches bad requests before processing
- [ ] Interactive docs available at `/docs/api`
- [ ] Better TypeScript types for API responses
- [ ] Example requests in documentation

---

## 📁 FILES TO CREATE

### 1. `/src/lib/schemas/index.ts` (NEW)
**Purpose**: Central schema registry with Zod

```typescript
/**
 * API Schema Definitions
 * 
 * Centralized Zod schemas for:
 * - Request validation
 * - Response validation
 * - Type generation
 * - OpenAPI generation
 */

import { z } from 'zod';

// =============================================================================
// COMMON SCHEMAS
// =============================================================================

/**
 * Pagination parameters
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(20),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

/**
 * Date range parameters
 */
export const dateRangeSchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

/**
 * Language parameter
 */
export const languageSchema = z.enum([
  'en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh', 'ar',
]);

/**
 * Coin ID parameter
 */
export const coinIdSchema = z.string()
  .min(1)
  .max(50)
  .regex(/^[a-z0-9-]+$/, 'Coin ID must be lowercase alphanumeric with hyphens');

// =============================================================================
// NEWS API SCHEMAS
// =============================================================================

export const newsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(10),
  source: z.string().optional(),
  category: z.enum([
    'general', 'bitcoin', 'defi', 'nft', 'research', 'institutional',
    'etf', 'derivatives', 'onchain', 'fintech', 'macro', 'quant',
    'journalism', 'ethereum', 'asia', 'tradfi', 'mainstream', 'mining',
    'gaming', 'altl1', 'stablecoin',
  ]).optional(),
  lang: languageSchema.default('en'),
  from: z.string().optional(),
  to: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  per_page: z.coerce.number().int().min(1).max(100).optional(),
});

export const articleSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  url: z.string().url(),
  source: z.string(),
  category: z.string(),
  publishedAt: z.string().datetime(),
  imageUrl: z.string().url().nullable().optional(),
  author: z.string().nullable().optional(),
  sentiment: z.enum(['positive', 'negative', 'neutral']).optional(),
});

export const newsResponseSchema = z.object({
  articles: z.array(articleSchema),
  total: z.number().int(),
  page: z.number().int().optional(),
  perPage: z.number().int().optional(),
  hasMore: z.boolean().optional(),
});

// =============================================================================
// V1 API SCHEMAS
// =============================================================================

export const v1CoinsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  per_page: z.coerce.number().int().min(1).max(250).default(100),
  order: z.enum([
    'market_cap_desc', 'market_cap_asc',
    'volume_desc', 'volume_asc',
    'id_asc', 'id_desc',
  ]).default('market_cap_desc'),
  ids: z.string().optional(), // Comma-separated
  sparkline: z.enum(['true', 'false']).default('false'),
});

export const coinSchema = z.object({
  id: z.string(),
  symbol: z.string(),
  name: z.string(),
  current_price: z.number(),
  market_cap: z.number(),
  market_cap_rank: z.number().nullable(),
  total_volume: z.number(),
  price_change_24h: z.number(),
  price_change_percentage_24h: z.number(),
  circulating_supply: z.number(),
  total_supply: z.number().nullable(),
  max_supply: z.number().nullable(),
  ath: z.number(),
  atl: z.number(),
  image: z.string().url(),
});

// =============================================================================
// PREMIUM API SCHEMAS
// =============================================================================

export const aiSignalsQuerySchema = z.object({
  coin: coinIdSchema,
  timeframe: z.enum(['1h', '4h', '1d', '1w']).default('1d'),
  indicators: z.array(z.string()).optional(),
});

export const aiSignalSchema = z.object({
  coin: z.string(),
  signal: z.enum(['strong_buy', 'buy', 'hold', 'sell', 'strong_sell']),
  confidence: z.number().min(0).max(1),
  price: z.number(),
  timestamp: z.string().datetime(),
  indicators: z.record(z.unknown()).optional(),
  reasoning: z.string().optional(),
});

export const portfolioAnalyticsRequestSchema = z.object({
  holdings: z.array(z.object({
    coinId: z.string(),
    amount: z.number().positive(),
    purchasePrice: z.number().positive().optional(),
  })),
  currency: z.enum(['usd', 'eur', 'gbp', 'jpy']).default('usd'),
  period: z.enum(['24h', '7d', '30d', '90d', '1y']).default('30d'),
});

// =============================================================================
// MARKET API SCHEMAS
// =============================================================================

export const marketCompareQuerySchema = z.object({
  coins: z.string().regex(/^[a-z0-9-,]+$/, 'Must be comma-separated coin IDs'),
  metrics: z.array(z.enum([
    'price', 'market_cap', 'volume', 'volatility', 'correlation',
  ])).optional(),
});

export const ohlcQuerySchema = z.object({
  coinId: coinIdSchema,
  days: z.enum(['1', '7', '14', '30', '90', '180', '365', 'max']).default('7'),
  vs_currency: z.string().default('usd'),
});

// =============================================================================
// ADMIN API SCHEMAS
// =============================================================================

export const adminStatsQuerySchema = z.object({
  period: z.enum(['1h', '24h', '7d', '30d']).default('24h'),
  groupBy: z.enum(['hour', 'day', 'endpoint']).optional(),
});

// =============================================================================
// WEBHOOK SCHEMAS
// =============================================================================

export const webhookCreateSchema = z.object({
  url: z.string().url(),
  events: z.array(z.enum([
    'news.published',
    'price.alert',
    'whale.alert',
    'signal.generated',
  ])),
  secret: z.string().min(16).optional(),
  enabled: z.boolean().default(true),
});

// =============================================================================
// EXPORT TYPE HELPERS
// =============================================================================

// Export inferred types for TypeScript
export type PaginationQuery = z.infer<typeof paginationSchema>;
export type NewsQuery = z.infer<typeof newsQuerySchema>;
export type Article = z.infer<typeof articleSchema>;
export type NewsResponse = z.infer<typeof newsResponseSchema>;
export type V1CoinsQuery = z.infer<typeof v1CoinsQuerySchema>;
export type Coin = z.infer<typeof coinSchema>;
export type AiSignalsQuery = z.infer<typeof aiSignalsQuerySchema>;
export type AiSignal = z.infer<typeof aiSignalSchema>;
export type PortfolioAnalyticsRequest = z.infer<typeof portfolioAnalyticsRequestSchema>;
```

### 2. `/src/lib/validation-middleware.ts` (NEW)
**Purpose**: Middleware to validate requests using schemas

```typescript
/**
 * Validation Middleware
 * 
 * Validates requests against Zod schemas and returns
 * consistent error responses for validation failures
 */

import { NextRequest } from 'next/server';
import { z, ZodError } from 'zod';
import { ApiError, ValidationError } from './api-error';

/**
 * Validate query parameters against schema
 */
export function validateQuery<T extends z.ZodType>(
  request: NextRequest,
  schema: T
): { success: true; data: z.infer<T> } | { success: false; error: ReturnType<typeof ApiError.validation> } {
  try {
    // Convert URLSearchParams to object
    const params: Record<string, string> = {};
    request.nextUrl.searchParams.forEach((value, key) => {
      params[key] = value;
    });

    const result = schema.safeParse(params);

    if (!result.success) {
      return {
        success: false,
        error: ApiError.validation(
          'Query parameter validation failed',
          zodErrorToValidationErrors(result.error)
        ),
      };
    }

    return { success: true, data: result.data };
  } catch (error) {
    return {
      success: false,
      error: ApiError.badRequest('Failed to parse query parameters'),
    };
  }
}

/**
 * Validate request body against schema
 */
export async function validateBody<T extends z.ZodType>(
  request: NextRequest,
  schema: T
): Promise<{ success: true; data: z.infer<T> } | { success: false; error: ReturnType<typeof ApiError.validation> }> {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      return {
        success: false,
        error: ApiError.validation(
          'Request body validation failed',
          zodErrorToValidationErrors(result.error)
        ),
      };
    }

    return { success: true, data: result.data };
  } catch (error) {
    if (error instanceof SyntaxError) {
      return {
        success: false,
        error: ApiError.badRequest('Invalid JSON in request body'),
      };
    }

    return {
      success: false,
      error: ApiError.badRequest('Failed to parse request body'),
    };
  }
}

/**
 * Validate path parameter against schema
 */
export function validateParam<T extends z.ZodType>(
  value: string,
  schema: T,
  paramName: string
): { success: true; data: z.infer<T> } | { success: false; error: ReturnType<typeof ApiError.validation> } {
  const result = schema.safeParse(value);

  if (!result.success) {
    return {
      success: false,
      error: ApiError.validation(
        `Path parameter '${paramName}' validation failed`,
        zodErrorToValidationErrors(result.error)
      ),
    };
  }

  return { success: true, data: result.data };
}

/**
 * Convert Zod errors to ValidationError format
 */
function zodErrorToValidationErrors(error: ZodError): ValidationError[] {
  return error.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message,
    received: err.code === 'invalid_type' ? (err as any).received : undefined,
    expected: err.code === 'invalid_type' ? (err as any).expected : undefined,
  }));
}

/**
 * Higher-order function to wrap route handler with validation
 */
export function withQueryValidation<T extends z.ZodType>(
  schema: T,
  handler: (request: NextRequest, data: z.infer<T>) => Promise<Response>
) {
  return async (request: NextRequest) => {
    const validation = validateQuery(request, schema);
    
    if (!validation.success) {
      return validation.error;
    }
    
    return handler(request, validation.data);
  };
}

/**
 * Higher-order function to wrap route handler with body validation
 */
export function withBodyValidation<T extends z.ZodType>(
  schema: T,
  handler: (request: NextRequest, data: z.infer<T>) => Promise<Response>
) {
  return async (request: NextRequest) => {
    const validation = await validateBody(request, schema);
    
    if (!validation.success) {
      return validation.error;
    }
    
    return handler(request, validation.data);
  };
}
```

### 3. `/src/lib/openapi/generator.ts` (NEW)
**Purpose**: Generate OpenAPI specification from schemas

```typescript
/**
 * OpenAPI Specification Generator
 * 
 * Automatically generates OpenAPI 3.0 spec from Zod schemas
 */

import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

interface OpenAPIPath {
  summary?: string;
  description?: string;
  parameters?: Array<{
    name: string;
    in: 'query' | 'path' | 'header';
    required?: boolean;
    schema: unknown;
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
      description: 'Comprehensive cryptocurrency news and market data API with x402 micropayments',
    },
    servers: [
      {
        url: 'https://news-crypto.vercel.app',
        description: 'Production server',
      },
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    paths: {
      '/api/news': {
        get: {
          summary: 'Get latest cryptocurrency news',
          description: 'Returns paginated list of latest crypto news articles',
          parameters: [
            { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 } },
            { name: 'source', in: 'query', schema: { type: 'string' } },
            { name: 'category', in: 'query', schema: { type: 'string', enum: ['bitcoin', 'defi', 'nft', 'general'] } },
            { name: 'lang', in: 'query', schema: { type: 'string', default: 'en' } },
          ],
          responses: {
            '200': {
              description: 'Successful response',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      articles: { type: 'array', items: { type: 'object' } },
                      total: { type: 'integer' },
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
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1, default: 1 } },
            { name: 'per_page', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 250, default: 100 } },
          ],
          responses: {
            '200': { description: 'Successful response' },
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
          parameters: [
            { name: 'coin', in: 'query', required: true, schema: { type: 'string' } },
            { name: 'timeframe', in: 'query', schema: { type: 'string', enum: ['1h', '4h', '1d', '1w'], default: '1d' } },
          ],
          responses: {
            '200': { description: 'Successful response' },
            '402': { description: 'Payment required ($0.05)' },
          },
          security: [
            { X402Payment: [] },
          ],
        },
      },
      '/api/health': {
        get: {
          summary: 'Health check',
          description: 'Returns system health status',
          responses: {
            '200': {
              description: 'System healthy',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', enum: ['healthy', 'degraded', 'unhealthy'] },
                      checks: { type: 'object' },
                    },
                  },
                },
              },
            },
            '503': { description: 'System unhealthy' },
          },
        },
      },
    },
    components: {
      schemas: {},
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description: 'API key for authenticated access',
        },
        X402Payment: {
          type: 'apiKey',
          in: 'header',
          name: 'PAYMENT-SIGNATURE',
          description: 'x402 payment signature',
        },
      },
    },
  };
}
```

### 4. `/src/app/api/openapi.json/route.ts` (UPDATE)
**Purpose**: Serve auto-generated OpenAPI spec

```typescript
import { NextResponse } from 'next/server';
import { generateOpenAPISpec } from '@/lib/openapi/generator';

export const runtime = 'edge';

export async function GET() {
  const spec = generateOpenAPISpec();
  
  return NextResponse.json(spec, {
    headers: {
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
```

### 5. `/src/app/docs/api/page.tsx` (NEW)
**Purpose**: Interactive API documentation using Swagger UI

```tsx
'use client';

import { useEffect, useRef } from 'react';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';

export default function ApiDocsPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">API Documentation</h1>
        <p className="text-gray-600">
          Complete reference for Free Crypto News API with interactive examples
        </p>
      </div>
      
      <SwaggerUI url="/api/openapi.json" />
    </div>
  );
}
```

---

## 📝 PACKAGES TO ADD

Add to `/package.json`:
```json
{
  "dependencies": {
    "zod": "^3.22.4",
    "zod-to-json-schema": "^3.22.4",
    "swagger-ui-react": "^5.11.0"
  },
  "devDependencies": {
    "@types/swagger-ui-react": "^4.18.3"
  }
}
```

---

## ✅ EXAMPLE ROUTE UPDATES

### Before (No validation):
```typescript
export async function GET(request: NextRequest) {
  const limit = parseInt(request.nextUrl.searchParams.get('limit') || '10');
  const category = request.nextUrl.searchParams.get('category');
  
  // No validation - could crash!
  const data = await getNews(limit, category);
  return NextResponse.json(data);
}
```

### After (With validation):
```typescript
import { validateQuery } from '@/lib/validation-middleware';
import { newsQuerySchema } from '@/lib/schemas';

export async function GET(request: NextRequest) {
  // Validate query params
  const validation = validateQuery(request, newsQuerySchema);
  if (!validation.success) {
    return validation.error;
  }
  
  const { limit, category, lang } = validation.data;
  
  // Type-safe and validated!
  const data = await getNews(limit, category);
  return NextResponse.json(data);
}
```

---

## 🎯 ROUTE UPDATE PRIORITY

Update these routes with validation (in order):

### Phase 1: High-traffic routes (1 hour)
1. `/api/news/route.ts` - Add `newsQuerySchema`
2. `/api/v1/coins/route.ts` - Add `v1CoinsQuerySchema`
3. `/api/market/coins/route.ts` - Add validation
4. `/api/breaking/route.ts` - Add validation

### Phase 2: Premium routes (1 hour)
5. `/api/premium/ai/signals/route.ts` - Add `aiSignalsQuerySchema`
6. `/api/premium/ai/analyze/route.ts` - Add body validation
7. `/api/premium/portfolio/analytics/route.ts` - Add `portfolioAnalyticsRequestSchema`

### Phase 3: Documentation (30 min)
8. Enhance OpenAPI spec with more endpoints
9. Add request/response examples
10. Test interactive docs

---

## ✅ TESTING CHECKLIST

### Schema Validation Tests
```typescript
// Create: src/__tests__/validation.test.ts

import { newsQuerySchema, v1CoinsQuerySchema } from '@/lib/schemas';

describe('Schema Validation', () => {
  it('should validate valid news query', () => {
    const result = newsQuerySchema.safeParse({
      limit: '10',
      category: 'bitcoin',
      lang: 'en',
    });
    expect(result.success).toBe(true);
  });
  
  it('should reject invalid limit', () => {
    const result = newsQuerySchema.safeParse({
      limit: '999', // exceeds max
    });
    expect(result.success).toBe(false);
  });
  
  it('should use defaults', () => {
    const result = newsQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    expect(result.data.limit).toBe(10);
  });
});
```

### OpenAPI Tests
```bash
# Test OpenAPI endpoint
curl http://localhost:3000/api/openapi.json

# Validate against OpenAPI spec
npx @redocly/cli lint /api/openapi.json
```

---

## 🚀 DELIVERABLES

1. ✅ `/src/lib/schemas/index.ts` - Complete schema registry
2. ✅ `/src/lib/validation-middleware.ts` - Validation helpers
3. ✅ `/src/lib/openapi/generator.ts` - OpenAPI generator
4. ✅ Updated `/api/openapi.json/route.ts` - Serving spec
5. ✅ New `/docs/api` page - Interactive docs
6. ✅ ~20 high-priority routes with validation
7. ✅ Tests for validation system
8. ✅ Documentation on using schemas

---

## 📊 SUCCESS METRICS

After completion:
- [ ] Zod installed and configured
- [ ] 30+ API schemas defined
- [ ] Validation middleware working
- [ ] OpenAPI spec auto-generated
- [ ] Interactive docs accessible
- [ ] ~20 routes using validation
- [ ] Type safety improved
- [ ] Better error messages for bad input

---

## 💬 COORDINATION

**Works independently but:**
- Uses `ApiError` from Agent 2 (when ready)
- Provides schemas for Agent 2/3 to use
- Validation can be added to routes as they're updated

**You provide:**
- Schema definitions
- Validation utilities
- OpenAPI spec
- Interactive documentation

---

## 🚀 READY TO START?

**Agent 4, begin with creating schemas, then add validation to high-priority routes. The interactive docs will make integration much easier! Report progress every hour. Good luck! 🎯**
