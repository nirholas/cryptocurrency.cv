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
import { ROUTE_MANIFEST, ROUTE_CATEGORIES } from './routes.generated';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build an x-payment-info block for a fixed-price endpoint */
function paymentInfo(usdPrice: string) {
  return {
    protocols: ['x402'],
    pricingMode: 'fixed' as const,
    price: usdPrice.replace('$', ''),
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

/** Known POST routes */
const POST_ROUTES = new Set([
  '/api/premium/portfolio/analytics',
  '/api/premium/alerts/create',
  '/api/batch',
  '/api/rag/batch',
  '/api/rag/feedback',
  '/api/portfolio/holding',
]);

// ---------------------------------------------------------------------------
// Spec generator
// ---------------------------------------------------------------------------

export function generateOpenAPISpec() {
  const paths: Record<string, Record<string, unknown>> = {};

  for (const { path, category } of ROUTE_MANIFEST) {
    const price = getPrice(path);
    const meta = (ENDPOINT_METADATA as Record<string, { description?: string; parameters?: Record<string, { type: string; description: string; required?: boolean; default?: string }> }>)[path];
    const premiumMeta = (PREMIUM_PRICING as Record<string, { description?: string }>)[path];
    const description = meta?.description ?? premiumMeta?.description ?? `${category} endpoint`;
    const method = POST_ROUTES.has(path) ? 'post' : 'get';

    const operation: Record<string, unknown> = {
      summary: description,
      tags: [category],
      responses: {
        '200': { description: 'Successful response' },
        '402': { description: 'Payment Required' },
      },
      'x-payment-info': paymentInfo(price),
      security: [{ X402Payment: [] }],
    };

    if (meta?.parameters) {
      operation.parameters = toOpenAPIParams(meta.parameters);
    }

    // v1 + non-premium routes also accept API key auth
    if (!path.startsWith('/api/premium/')) {
      operation.security = [{ ApiKeyAuth: [] }, { X402Payment: [] }];
    }

    paths[path] = { [method]: operation };
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
        'All endpoints require x402 micropayment in USDC on Arbitrum (eip155:42161).',
        'Each operation has x-payment-info with the exact price.',
        'Default: $0.001/request. AI endpoints: $0.003-$0.01. Premium: $0.01-$0.20.',
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
        'GET /api/v1/breaking — breaking news only ($0.001)',
        'GET /api/search?q={keywords} — full-text search ($0.001)',
        '',
        '### Market data & prices',
        'GET /api/v1/coins — top coins with prices, market cap, volume ($0.001)',
        'GET /api/v1/market-data — global market overview ($0.002)',
        'GET /api/v1/trending — trending coins ($0.001)',
        'GET /api/v1/fear-greed — Fear & Greed Index ($0.002)',
        'GET /api/market/gainers — biggest gainers ($0.001)',
        'GET /api/market/losers — biggest losers ($0.001)',
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
        'GET /api/premium/stream/prices — real-time price SSE ($0.05)',
        '',
        '## Response format',
        'All endpoints return JSON. Most include { success: boolean, data: ... }.',
        'Pagination: ?page=1&per_page=100 or ?limit=50&offset=0.',
        'Errors: { error: string, code: string }.',
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
