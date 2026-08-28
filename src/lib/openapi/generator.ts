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
 * OpenAPI 3.1.0 Specification Generator
 *
 * Generates the canonical discovery document for x402scan registration.
 * Every paid endpoint includes x-payment-info with protocol and pricing.
 * Routes are auto-discovered from the generated route manifest.
 *
 * @see https://github.com/Merit-Systems/x402scan
 */

import { API_PRICING, PREMIUM_PRICING, ENDPOINT_METADATA } from '@/lib/x402/pricing';
import { getOwnershipProofs } from '@/lib/x402/config';
import { EXEMPT_PATTERNS, FREE_TIER_PATTERNS, matchesPattern } from '@/middleware/config';
import { ROUTE_MANIFEST, ROUTE_CATEGORIES } from './routes.generated';
import { ENDPOINT_METADATA_FULL } from './endpoint-metadata.generated';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build an x-payment-info block for a fixed-price endpoint.
 *
 * The structured shape is what x402scan's discovery parser reads: a `price`
 * object carrying the pricing mode, an ISO 4217 currency and a decimal-USD
 * amount, plus `protocols` as objects rather than bare protocol names. The
 * flat `{ protocols: ['x402'], pricingMode, price }` form this replaced is
 * still parsed, but only as a legacy fallback (L2_PAYMENT_INFO_LEGACY).
 *
 * The amount here is decimal USD. The runtime 402 challenge quotes the same
 * price in token atomic units (see `usdToUsdc`), which is the units mismatch
 * x402scan flags as MALFORMED_RUNTIME_AMOUNT when a server confuses the two.
 *
 * @see https://x402scan.com/discovery/spec
 */
function paymentInfo(usdPrice: string) {
  return {
    price: {
      mode: 'fixed' as const,
      currency: 'USD',
      amount: Number(usdPrice.replace('$', '')).toFixed(6),
    },
    protocols: [{ x402: {} }],
  };
}

/** Get price for a route — check pricing configs, default to $0.001 */
function getPrice(path: string): string {
  const v1Price = (API_PRICING as Record<string, string>)[path];
  if (v1Price) return v1Price.replace('$', '');

  const premiumConfig = (PREMIUM_PRICING as Record<string, { price: number }>)[path];
  if (premiumConfig) return `${premiumConfig.price}`;

  return '0.001';
}

/** Generate a unique operationId from path and method */
function pathToOperationId(path: string, method: string): string {
  const segments = path.replace(/^\/api\//, '').split('/').filter(Boolean);
  const camelCase = segments
    .map((s, i) => {
      const clean = s.replace(/[^a-zA-Z0-9]/g, '');
      return i === 0 ? clean : clean.charAt(0).toUpperCase() + clean.slice(1);
    })
    .join('');
  const prefix = method === 'GET' ? 'get' : method === 'POST' ? 'create' : method === 'PUT' ? 'update' : method === 'DELETE' ? 'delete' : method.toLowerCase();
  return `${prefix}${camelCase.charAt(0).toUpperCase()}${camelCase.slice(1)}`;
}

/** Path parameters for `{param}` segments, e.g. /api/coin/{id}. */
function pathParams(path: string) {
  return [...path.matchAll(/\{([^}]+)\}/g)].map((m) => ({
    name: m[1],
    in: 'path' as const,
    required: true,
    description: `The ${m[1]} path segment`,
    schema: { type: 'string' },
  }));
}

/** Convert ENDPOINT_METADATA parameters to OpenAPI parameters */
function toOpenAPIParams(
  params: Record<string, { type: string; description: string; required?: boolean; default?: string }> | undefined,
) {
  if (!params) return undefined;
  return Object.entries(params).map(([name, p]) => ({
    name,
    in: 'query' as const,
    required: p.required ?? false,
    description: p.description,
    schema: {
      type: p.type === 'number' ? 'number' : 'string',
      ...(p.default !== undefined ? { default: p.default } : {}),
    },
  }));
}

// ---------------------------------------------------------------------------
// Discovery-exempt routes (free endpoints not behind x402 gate)
// ---------------------------------------------------------------------------

const DISCOVERY_EXCLUDED = new Set([
  '/api/.well-known/x402',
  '/api/health',
  '/api/sample',
  '/api/register',
  '/api/cron',
]);

/**
 * True when a route sits behind the x402 gate at runtime.
 *
 * Read from the same patterns the middleware gate uses, never from a list kept
 * in parallel. x402scan treats the live 402 as authoritative over the spec, so
 * a route advertised as paid that answers 200 to an unpaid probe fails
 * registration. The free tier (news, prices, market data, the MCP endpoint,
 * discovery) is large here, and it used to be advertised at $0.001 a call.
 */
function isPaidRoute(path: string): boolean {
  return !matchesPattern(path, EXEMPT_PATTERNS) && !matchesPattern(path, FREE_TIER_PATTERNS);
}

/** Default query parameters for GET endpoints without explicit schemas */
const DEFAULT_GET_PARAMS: Record<string, { type: string; description: string; required?: boolean; default?: string }> = {
  limit: { type: 'number', description: 'Maximum number of results to return', default: '50' },
  offset: { type: 'number', description: 'Number of results to skip for pagination', default: '0' },
};

/** Default request body schema for endpoints without explicit schemas */
const DEFAULT_POST_BODY = {
  type: 'object' as const,
  properties: {
    data: { type: 'object', description: 'Request payload' },
  },
};

/** HTTP methods that carry a JSON request body. DELETE takes query params. */
const BODY_METHODS = new Set(['post', 'put', 'patch']);

/**
 * Response schema for a route whose success body could not be derived from its
 * handler (it proxies an upstream payload, or builds the body dynamically).
 * Claiming a concrete property list here would be fiction; "a JSON object" is
 * what the route actually guarantees.
 */
const GENERIC_JSON_OBJECT = {
  type: 'object' as const,
  description: 'JSON response payload',
  additionalProperties: true,
};

/**
 * Operations whose input is neither a query string nor a JSON payload the
 * metadata generator can read off the handler.
 *
 * `/api/mcp` speaks MCP Streamable HTTP: POST carries a JSON-RPC envelope,
 * while GET (stream reattach) and DELETE (session teardown) identify the
 * session with the `Mcp-Session-Id` header and send no body at all. Without
 * this, DELETE advertised no input schema and POST advertised a generic
 * `{ data }` body that no MCP client would ever send.
 *
 * @see https://modelcontextprotocol.io/specification/basic/transports
 */
const MCP_SESSION_HEADER = {
  name: 'Mcp-Session-Id',
  in: 'header' as const,
  required: false,
  description: 'Session identifier returned by the initialize response',
  schema: { type: 'string' },
};

const MANUAL_OPERATIONS: Record<
  string,
  Record<string, { parameters?: unknown[]; requestBody?: unknown }>
> = {
  '/api/mcp': {
    get: { parameters: [MCP_SESSION_HEADER] },
    delete: { parameters: [MCP_SESSION_HEADER] },
    post: {
      parameters: [MCP_SESSION_HEADER],
      requestBody: {
        required: true,
        description: 'JSON-RPC 2.0 request envelope',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                jsonrpc: { type: 'string', const: '2.0' },
                id: { description: 'Request id (omitted for notifications)' },
                method: {
                  type: 'string',
                  description: 'MCP method, e.g. tools/list, tools/call, resources/read',
                },
                params: { type: 'object', description: 'Method parameters' },
              },
              required: ['jsonrpc', 'method'],
            },
          },
        },
      },
    },
  },
};

/** Response schema for Server-Sent Events routes. */
const SSE_STREAM_SCHEMA = {
  type: 'string' as const,
  description: 'Server-Sent Events stream: one `data: <json>` frame per update',
};

// ---------------------------------------------------------------------------
// Spec generator
// ---------------------------------------------------------------------------

export function generateOpenAPISpec() {
  const paths: Record<string, Record<string, unknown>> = {};

  for (const { path, category } of ROUTE_MANIFEST) {
    // Skip discovery/internal endpoints — they are free and not behind x402
    if (DISCOVERY_EXCLUDED.has(path)) continue;

    const paid = isPaidRoute(path);
    const price = getPrice(path);

    // Use comprehensive metadata (generated), fall back to legacy pricing metadata
    const fullMeta = (ENDPOINT_METADATA_FULL as Record<string, {
      description?: string;
      methods?: string[];
      streaming?: boolean;
      parameters?: Record<string, { type: string; description: string; required?: boolean; default?: string }>;
      outputSchema?: object;
      outputSchemas?: Record<string, object>;
    }>)[path];
    const legacyMeta = (ENDPOINT_METADATA as Record<string, { description?: string; parameters?: Record<string, { type: string; description: string; required?: boolean; default?: string }>; outputSchema?: object }>)[path];
    const premiumMeta = (PREMIUM_PRICING as Record<string, { description?: string }>)[path];

    const description = fullMeta?.description ?? legacyMeta?.description ?? premiumMeta?.description ?? `${category} endpoint`;
    const params = fullMeta?.parameters ?? legacyMeta?.parameters;
    const outputSchema = legacyMeta?.outputSchema ?? fullMeta?.outputSchema;

    // Determine HTTP methods from comprehensive metadata
    const methods = fullMeta?.methods ?? ['GET'];

    // Build path item with all methods
    const pathItem: Record<string, unknown> = {};

    for (const method of methods) {
      const methodLower = method.toLowerCase();

      // Every operation carries a response schema. x402scan errors an operation
      // with none ("Operation has no input or output schema"), so a route whose
      // body could not be derived from its handler advertises the honest
      // permissive shape rather than inventing properties it never returns.
      const methodOutput = fullMeta?.outputSchemas?.[method] ?? outputSchema ?? GENERIC_JSON_OBJECT;

      const operation: Record<string, unknown> = {
        summary: description,
        operationId: pathToOperationId(path, method),
        tags: [category],
        responses: {
          '200': fullMeta?.streaming
            ? {
                description: 'Server-Sent Events stream',
                content: { 'text/event-stream': { schema: SSE_STREAM_SCHEMA } },
              }
            : {
                description: 'Successful response',
                content: { 'application/json': { schema: methodOutput } },
              },
          // A 402 on a free route is a promise the runtime never keeps.
          ...(paid ? { '402': { description: 'Payment Required' } } : {}),
        },
        ...(paid ? { 'x-payment-info': paymentInfo(price) } : {}),
        // `security: []` marks a route as explicitly public. Omitting it
        // entirely reads as an undeclared auth mode, not as "free".
        security: paid ? [{ X402Payment: [] }] : [],
      };

      // Path parameters apply to every method: DELETE /api/alerts/{id} needs
      // {id} declared just as much as the GET does. Query parameters do too:
      // the DELETE handlers read `searchParams`, so scoping them to GET left
      // DELETE /api/keys and eight siblings with no input schema at all.
      const inPath = pathParams(path);
      operation.parameters = [
        ...inPath,
        ...(toOpenAPIParams(params ?? (methodLower === 'get' ? DEFAULT_GET_PARAMS : undefined)) ?? []),
      ];
      if ((operation.parameters as unknown[]).length === 0) delete operation.parameters;

      // Methods that carry a JSON body also declare one.
      if (BODY_METHODS.has(methodLower)) {
        if (params) {
          operation.requestBody = {
            description: 'Request payload',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: Object.fromEntries(
                    Object.entries(params).map(([name, p]) => [
                      name,
                      {
                        type: p.type === 'number' ? 'number' : 'string',
                        description: p.description,
                        ...(p.default !== undefined ? { default: p.default } : {}),
                      },
                    ]),
                  ),
                },
              },
            },
          };
        } else {
          operation.requestBody = {
            description: 'Request payload',
            content: {
              'application/json': { schema: DEFAULT_POST_BODY },
            },
          };
        }
      }

      // Curated overrides win: they describe transports the handler scan
      // cannot infer (see MANUAL_OPERATIONS).
      const manual = MANUAL_OPERATIONS[path]?.[methodLower];
      if (manual?.parameters) operation.parameters = manual.parameters;
      if (manual?.requestBody) operation.requestBody = manual.requestBody;

      // Mark streaming endpoints
      if (fullMeta?.streaming) {
        operation['x-streaming'] = true;
      }

      // v1 + non-premium paid routes also accept API key auth
      if (paid && !path.startsWith('/api/premium/')) {
        operation.security = [{ ApiKeyAuth: [] }, { X402Payment: [] }];
      }

      pathItem[methodLower] = operation;
    }

    paths[path] = pathItem;
  }

  // Build tags from categories
  const tags = ROUTE_CATEGORIES.map(cat => ({ name: cat, description: cat }));

  return {
    openapi: '3.1.0',
    info: {
      title: 'Crypto Vision News API',
      version: '1.0.0',
      description:
        'Comprehensive cryptocurrency news and market data API with x402 micropayments. ' +
        '350+ endpoints covering news, market data, DeFi, derivatives, on-chain analytics, ' +
        'AI analysis, social intelligence, NFTs, multi-chain data (EVM, Solana, Aptos, Sui), ' +
        'and premium features. Pay per request with USDC via x402.',
      contact: {
        name: 'Crypto Vision News',
        // x402scan uses info.contact.email to verify origin ownership and to
        // reach operators about outages, pricing changes and schema breaks.
        email: process.env.X402_CONTACT_EMAIL || 'support@cryptocurrency.cv',
        url: 'https://github.com/nirholas/free-crypto-news',
      },
      license: {
        name: 'SEE LICENSE IN LICENSE',
        url: 'https://github.com/nirholas/free-crypto-news/blob/main/LICENSE',
      },
      'x-guidance': [
        '# Crypto Vision News API — Agent Guide',
        '',
        '## Payment',
        'Operations carrying x-payment-info require an x402 micropayment in USDC',
        'on Arbitrum (eip155:42161); that block holds the exact price.',
        'Default: $0.001/request. AI endpoints: $0.003-$0.01. Premium: $0.01-$0.20.',
        'Operations with security: [] are free and need no payment or key: the',
        'news, market, archive, RSS/Atom and discovery surfaces (see Free below).',
        'Use @x402/fetch (npm), x402-client (Python/Go), or any x402-compatible SDK.',
        'The facilitator verifies payment signatures automatically.',
        '',
        '## Quick start for agents',
        '1. Install: npx agentcash install (gives you fetch_with_auth tool)',
        '2. Or use @x402/fetch: import { payFetch } from "@x402/fetch"',
        '3. Call any endpoint — the SDK handles payment automatically',
        '',
        '## Recommended endpoints by task',
        '',
        '### Get current crypto news',
        'GET /api/v1/news — latest headlines from 300+ sources ($0.001)',
        'GET /api/breaking — breaking news only ($0.001)',
        'GET /api/search?q={keywords} — full-text search ($0.001)',
        '',
        '### Market data & prices',
        'GET /api/v1/coins — top coins with prices, market cap, volume ($0.001)',
        'GET /api/v1/market-data — global market overview ($0.002)',
        'GET /api/v1/trending — trending coins ($0.001)',
        'GET /api/v1/fear-greed — Fear & Greed Index ($0.002)',
        'GET /api/market/gainers — biggest gainers (free)',
        'GET /api/market/losers — biggest losers (free)',
        '',
        '### AI analysis',
        'GET /api/v1/sentiment?asset=BTC — sentiment analysis ($0.005)',
        'GET /api/v1/ask?q={question} — ask anything about crypto ($0.005)',
        'GET /api/v1/forecast?coinId=bitcoin — price forecast ($0.005)',
        'GET /api/ai/research?topic={topic} — deep research report ($0.01)',
        'GET /api/v1/digest — daily market digest ($0.005)',
        '',
        '### DeFi & on-chain',
        'GET /api/defi — DeFi protocol overview ($0.001)',
        'GET /api/defi/yields — yield farming opportunities ($0.001)',
        'GET /api/v1/whale-alerts — large transactions ($0.003)',
        'GET /api/onchain/exchange-flows — exchange in/outflows ($0.001)',
        '',
        '### Derivatives & trading',
        'GET /api/derivatives — futures/options overview ($0.001)',
        'GET /api/v1/signals — trading signals ($0.005)',
        'GET /api/v1/liquidations — liquidation data ($0.003)',
        'GET /api/funding-rates — funding rates across exchanges ($0.001)',
        '',
        '### Multi-chain',
        'GET /api/solana/* — Solana tokens, DeFi, NFTs, wallet data',
        'GET /api/bitcoin/* — blocks, mempool, difficulty, addresses',
        'GET /api/aptos/* — Aptos transactions, resources, events',
        'GET /api/sui/* — Sui balances, objects, transactions',
        'GET /api/l2/* — Layer 2 activity, projects, risk scores',
        '',
        '### Social intelligence',
        'GET /api/social/sentiment — social media sentiment ($0.001)',
        'GET /api/social/trending-narratives — trending market narratives ($0.001)',
        'GET /api/social/x/sentiment — X/Twitter crypto sentiment ($0.001)',
        '',
        '### Premium (higher value)',
        'GET /api/premium/ai/signals — AI trading signals ($0.05)',
        'GET /api/premium/ai/analyze — deep market analysis ($0.05)',
        'GET /api/premium/whales/transactions — whale tracking ($0.05)',
        'GET /api/premium/smart-money — institutional flows ($0.05)',
        'GET /api/premium/market/history — deep historical market data ($0.05)',
        '',
        '## Response format',
        'All endpoints return JSON. Most include { success: boolean, data: ... }.',
        'Pagination: ?page=1&per_page=100 or ?limit=50&offset=0.',
        'Errors: { error: string, code: string }.',
        '',
        '### Free (no payment, no key)',
        'GET /api/news — headlines, the core free feed',
        'GET /api/market/* — prices, gainers, losers, dominance, heatmap, tickers',
        'GET /api/market/coins — coin list and metadata',
        'GET /api/fear-greed — Fear & Greed Index',
        'GET /api/trending — trending topics',
        'GET /api/archive/* — historical news archive',
        'GET /api/article, /api/articles — individual and listed articles',
        'GET /api/rss, /api/atom — feeds',
        'POST /api/mcp — hosted MCP server (Streamable HTTP)',
        '',
        '## Discovery endpoints (free, no payment)',
        'GET /openapi.json — this OpenAPI spec',
        'GET /.well-known/x402 — x402 resource discovery',
        'GET /llms.txt — LLM-friendly API summary',
        'GET /llms-full.txt — comprehensive LLM reference with examples',
        'GET /.well-known/agents.json — agent capabilities and skills',
      ].join('\n'),
    },
    servers: [
      { url: 'https://cryptocurrency.cv', description: 'Production' },
    ],
    ...(getOwnershipProofs() && {
      'x-discovery': { ownershipProofs: getOwnershipProofs() },
    }),
    tags,
    paths,
    components: {
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
          name: 'X-PAYMENT',
          description: 'x402 micropayment header (USDC on Arbitrum)',
        },
      },
    },
  };
}
