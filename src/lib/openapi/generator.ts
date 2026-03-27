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
  '/api/webhooks',
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
      'x-guidance':
        'This API serves real-time cryptocurrency data across 350+ endpoints. ' +
        'All /api/* endpoints require x402 micropayment (USDC on Arbitrum) or an API key. ' +
        'Default price is $0.001/request; AI and premium endpoints cost more (see x-payment-info). ' +
        'Endpoints return JSON. Most accept GET with query parameters for filtering. ' +
        'Start with /api/v1/news for crypto news, /api/v1/coins for market data, ' +
        '/api/v1/sentiment for AI analysis. ' +
        'Deep data: /api/bitcoin/* for on-chain, /api/defi/* for DeFi, ' +
        '/api/derivatives/* for futures/options, /api/onchain/* for protocol data, ' +
        '/api/social/* for social signals, /api/solana/* for Solana ecosystem. ' +
        'Premium /api/premium/* endpoints offer advanced AI, whale tracking, and streaming.',
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
