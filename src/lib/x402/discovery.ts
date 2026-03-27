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
 * x402 Discovery Document Builder
 *
 * Builds the structured discovery document for /.well-known/x402.
 * Each resource includes an `accepts` array with payment requirements,
 * input/output schemas, and metadata — matching the x402 v2 format
 * expected by x402scan and other automated discovery tools.
 *
 * @module lib/x402/discovery
 * @see https://github.com/Merit-Systems/x402scan
 */

import { ROUTE_MANIFEST } from '@/lib/openapi/routes.generated';
import { ENDPOINT_METADATA_FULL } from '@/lib/openapi/endpoint-metadata.generated';
import {
  getOwnershipProofs,
  RECEIVE_ADDRESS,
  CURRENT_NETWORK,
  USDC_ADDRESSES,
} from '@/lib/x402/config';
import { API_PRICING, PREMIUM_PRICING, usdToUsdc, ENDPOINT_METADATA } from '@/lib/x402/pricing';
import { EXEMPT_PATTERNS, FREE_TIER_PATTERNS, matchesPattern } from '@/middleware/config';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://cryptocurrency.cv';
const NETWORK = CURRENT_NETWORK as string;

/** USDC contract address for the active network */
const USDC_ASSET =
  USDC_ADDRESSES[NETWORK as keyof typeof USDC_ADDRESSES] ?? USDC_ADDRESSES['eip155:42161'];

/** Returns true if a route is behind the x402 gate */
function isX402Protected(path: string): boolean {
  if (matchesPattern(path, EXEMPT_PATTERNS)) return false;
  if (matchesPattern(path, FREE_TIER_PATTERNS)) return false;
  return true;
}

/** Get the USD price string for a route */
function getRoutePrice(path: string): string {
  const v1Price = (API_PRICING as Record<string, string>)[path];
  if (v1Price) return v1Price;

  const premiumConfig = (PREMIUM_PRICING as Record<string, { price: number }>)[path];
  if (premiumConfig) return `$${premiumConfig.price}`;

  return '$0.001';
}

/** Get description for a route */
function getRouteDescription(path: string): string {
  const fullMeta = (ENDPOINT_METADATA_FULL as Record<string, { description?: string }>)[path];
  if (fullMeta?.description) return fullMeta.description;

  const legacyMeta = (ENDPOINT_METADATA as Record<string, { description?: string }>)[path];
  if (legacyMeta?.description) return legacyMeta.description;

  const premiumMeta = (PREMIUM_PRICING as Record<string, { description?: string }>)[path];
  if (premiumMeta?.description) return premiumMeta.description;

  return `API endpoint: ${path}`;
}

/** Build input schema from parameters */
function buildInputSchema(
  path: string,
  method: string,
): { method: string; type: string; url: string; parameters?: Record<string, unknown> } {
  const fullMeta = (
    ENDPOINT_METADATA_FULL as Record<
      string,
      {
        parameters?: Record<
          string,
          { type: string; description: string; required?: boolean; default?: string }
        >;
      }
    >
  )[path];
  const legacyMeta = (
    ENDPOINT_METADATA as Record<
      string,
      {
        parameters?: Record<
          string,
          { type: string; description: string; required?: boolean; default?: string }
        >;
      }
    >
  )[path];

  const params = fullMeta?.parameters ?? legacyMeta?.parameters;
  const schema: {
    method: string;
    type: string;
    url: string;
    parameters?: Record<string, unknown>;
  } = {
    method,
    type: 'http',
    url: `${BASE_URL}${path}`,
  };

  if (params) {
    schema.parameters = Object.fromEntries(
      Object.entries(params).map(([name, p]) => [
        name,
        {
          type: p.type,
          description: p.description,
          ...(p.required ? { required: true } : {}),
          ...(p.default != null ? { default: p.default } : {}),
        },
      ]),
    );
  }

  return schema;
}

/** Build output schema for a route */
function buildOutputSchema(path: string): object | null {
  const legacyMeta = (ENDPOINT_METADATA as Record<string, { outputSchema?: object }>)[path];
  if (legacyMeta?.outputSchema) return legacyMeta.outputSchema;

  const fullMeta = (ENDPOINT_METADATA_FULL as Record<string, { outputSchema?: object }>)[path];
  if (fullMeta?.outputSchema) return fullMeta.outputSchema;

  return null;
}

export interface X402Resource {
  resource: string;
  type: string;
  x402Version: number;
  accepts: X402Accept[];
  lastUpdated: string;
  metadata: Record<string, unknown>;
}

export interface X402Accept {
  scheme: string;
  network: string;
  maxAmountRequired: string;
  asset: string;
  payTo: string;
  resource: string;
  description: string;
  mimeType: string;
  maxTimeoutSeconds: number;
  extra: { name: string; version: string };
  outputSchema: {
    input: { method: string; type: string; url: string; parameters?: Record<string, unknown> };
    output: object | null;
  };
}

export interface X402Discovery {
  x402Version: number;
  resources: X402Resource[];
  ownershipProofs?: string[];
}

/**
 * x402 Well-Known v1 Discovery response shape.
 */
export interface X402WellKnownV1 {
  version: 1;
  name?: string;
  description?: string;
  resources: string[];
  ownershipProofs?: string[];
}

/**
 * Build the v1 well-known discovery document for x402scan compatibility.
 *
 * Returns the format expected by x402scan:
 * ```json
 * { "version": 1, "resources": ["https://cryptocurrency.cv/api/v1/coins", ...], "ownershipProofs": ["0x..."] }
 * ```
 *
 * @see https://github.com/Merit-Systems/x402scan
 */
export function buildX402WellKnownV1(): X402WellKnownV1 {
  const seen = new Set<string>();
  const resources: string[] = [];

  for (const { path } of ROUTE_MANIFEST) {
    if (!isX402Protected(path)) continue;
    const url = `${BASE_URL}${path}`;
    if (seen.has(url)) continue;
    seen.add(url);
    resources.push(url);
  }

  const ownershipProofs = getOwnershipProofs();

  return {
    version: 1,
    name: 'Crypto Vision — Live Crypto Prices, Breaking News & Market Intelligence',
    description:
      'Live cryptocurrency prices, breaking news, and market analysis. 350+ free API endpoints, developer SDKs, embeddable widgets, and AI integrations. Bitcoin, Ethereum, DeFi & more — updated every minute.',
    resources,
    ...(ownershipProofs && { ownershipProofs }),
  };
}

/**
 * Build the complete x402 discovery document (v2).
 * Returns structured resources with accepts arrays, schemas, and payment details.
 */
export function buildX402Discovery(): X402Discovery {
  const now = new Date().toISOString();
  const resources: X402Resource[] = [];

  for (const { path } of ROUTE_MANIFEST) {
    if (!isX402Protected(path)) continue;

    const meta = (ENDPOINT_METADATA_FULL as Record<string, { methods?: string[] }>)[path];
    const methods = meta?.methods ?? ['GET'];
    const description = getRouteDescription(path);
    const price = getRoutePrice(path);
    const maxAmountRequired = usdToUsdc(price);

    for (const method of methods) {
      const fullUrl = `${BASE_URL}${path}`;
      const inputSchema = buildInputSchema(path, method);
      const outputSchema = buildOutputSchema(path);

      resources.push({
        resource: fullUrl,
        type: 'http',
        x402Version: 2,
        accepts: [
          {
            scheme: 'exact',
            network: NETWORK,
            maxAmountRequired,
            asset: USDC_ASSET,
            payTo: RECEIVE_ADDRESS,
            resource: fullUrl,
            description,
            mimeType: 'application/json',
            maxTimeoutSeconds: 60,
            extra: { name: 'USD Coin', version: '2' },
            outputSchema: {
              input: inputSchema,
              output: outputSchema,
            },
          },
        ],
        lastUpdated: now,
        metadata: {
          price,
          path,
          method,
        },
      });
    }
  }

  const ownershipProofs = getOwnershipProofs();

  return {
    x402Version: 2,
    resources,
    ...(ownershipProofs && { ownershipProofs }),
  };
}
