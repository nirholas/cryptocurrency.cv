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
 * x402 "Payment Required" body builder.
 *
 * Produces the 402 challenge that x402scan probes and that every x402 client
 * reads to construct a payment. Runtime 402 behaviour is authoritative over
 * the static OpenAPI document, so this is the file that decides whether an
 * endpoint is actually invocable by a paying agent.
 *
 * It lives outside `middleware/` and imports no request-plumbing so the shape
 * can be asserted directly in tests.
 *
 * @see https://x402scan.com/discovery/spec
 * @module lib/x402/payment-required
 */

import {
  API_PRICING,
  PREMIUM_PRICING,
  ENDPOINT_METADATA,
  usdToUsdc,
} from '@/lib/x402/pricing';
import {
  RECEIVE_ADDRESS,
  CURRENT_NETWORK,
  USDC_ADDRESSES,
} from '@/lib/x402/config';
import { ENDPOINT_METADATA_FULL } from '@/lib/openapi/endpoint-metadata.generated';

const USDC_ASSET =
  USDC_ADDRESSES[CURRENT_NETWORK as keyof typeof USDC_ADDRESSES] ??
  USDC_ADDRESSES['eip155:42161'];

/** Arbitrum USDC (6 decimals, EIP-3009) */
export const ARBITRUM_USDC = {
  address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
  name: 'USD Coin',
  version: '2',
  decimals: 6,
};


export const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://cryptocurrency.cv';

/**
 * Hostnames this deployment will name in a payment document.
 *
 * A reflected `Host` header must never reach a challenge body: it is the field
 * a client reads to decide what it is paying for. Only hosts the operator has
 * vouched for are honoured, everything else falls back to the configured
 * origin.
 */
const ALLOWED_HOSTS: ReadonlySet<string> = new Set(
  [
    safeHost(BASE_URL),
    ...(process.env.X402_ALLOWED_ORIGINS ?? '')
      .split(',')
      .map((entry) => safeHost(entry.trim()))
      .filter(Boolean),
    // A dev server is never the origin an attacker is trying to substitute.
    ...(process.env.NODE_ENV === 'production' ? [] : ['localhost', '127.0.0.1', '[::1]']),
  ].filter((host): host is string => Boolean(host)),
);

function safeHost(value: string): string | undefined {
  if (!value) return undefined;
  try {
    return new URL(value.includes('://') ? value : `https://${value}`).hostname;
  } catch {
    return undefined;
  }
}

/**
 * The public origin to name in a challenge for this request.
 *
 * `NEXT_PUBLIC_APP_URL` is inlined at build time, so an image built once and
 * deployed to a second hostname keeps naming the first one in every challenge
 * it issues. Self-hosters hit that immediately, and the symptom is a client
 * paying for a resource URL that is not the one it called. Read the host off
 * the request instead, and only trust it when the operator has allowed it.
 */
export function resolveOrigin(request?: {
  headers: { get(name: string): string | null };
  nextUrl?: { origin: string; protocol?: string };
}): string {
  if (!request) return BASE_URL;

  const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim();
  const host = forwardedHost || request.headers.get('host')?.trim();
  if (!host) return BASE_URL;

  const hostname = safeHost(host);
  if (!hostname || !ALLOWED_HOSTS.has(hostname)) return BASE_URL;

  const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim();
  const protocol = forwardedProto || request.nextUrl?.protocol?.replace(':', '') || 'https';
  return `${protocol}://${host}`;
}

/** Build input schema for the accepts[].outputSchema.input field (x402scan format) */
export function buildInputSchemaForAccepts(
  path: string,
  method: string,
  origin: string = BASE_URL,
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
    url: `${origin}${path}`,
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

/** Get the USD price string for a route path */
export function getRoutePrice(path: string): string {
  const v1Price = (API_PRICING as Record<string, string>)[path];
  if (v1Price) return v1Price;
  const premiumConfig = (PREMIUM_PRICING as Record<string, { price: number }>)[path];
  if (premiumConfig) return `$${premiumConfig.price}`;
  return '$0.001';
}

/**
 * Response schema for a route whose success body is not statically derivable
 * (it proxies an upstream payload, or assembles the body at runtime). Naming
 * properties it might not return would be worse than admitting it is an
 * open JSON object.
 */
export const GENERIC_OUTPUT_SCHEMA = {
  type: 'object',
  description: 'JSON response payload',
  additionalProperties: true,
};

/** Get endpoint metadata (parameters, description) for Bazaar schema */
export function getEndpointMeta(
  path: string,
  method?: string,
): {
  description: string;
  methods: string[];
  parameters?: Record<
    string,
    { type: string; description: string; required?: boolean; default?: string }
  >;
  outputSchema?: object;
} {
  const full = (
    ENDPOINT_METADATA_FULL as Record<
      string,
      {
        description?: string;
        methods?: string[];
        parameters?: Record<
          string,
          { type: string; description: string; required?: boolean; default?: string }
        >;
        outputSchema?: object;
        outputSchemas?: Record<string, object>;
      }
    >
  )[path];
  const legacy = (
    ENDPOINT_METADATA as Record<
      string,
      {
        description?: string;
        parameters?: Record<
          string,
          { type: string; description: string; required?: boolean; default?: string }
        >;
        outputSchema?: object;
      }
    >
  )[path];
  const derived = method ? full?.outputSchemas?.[method.toUpperCase()] : undefined;
  return {
    description: full?.description ?? legacy?.description ?? `API endpoint: ${path}`,
    methods: full?.methods ?? ['GET'],
    parameters: full?.parameters ?? legacy?.parameters,
    outputSchema: derived ?? legacy?.outputSchema ?? full?.outputSchema,
  };
}

/**
 * Build the extensions.bazaar block for a 402 response.
 *
 * `info` is the human/UI-facing view. `schema` is what an x402 v2 validator
 * reads, and its shape is exact: the input schema is looked up at
 * `schema.properties.input.properties.body` (falling back to `.queryParams`)
 * and the output schema at `schema.properties.output.properties.example`.
 * A flat parameter schema at `schema` (which this used to emit) resolves to
 * neither, so a probe reported SCHEMA_INPUT_MISSING and SCHEMA_OUTPUT_MISSING
 * against every endpoint even though both schemas were present in the body.
 *
 * @see https://x402scan.com/discovery/spec
 */
export function buildBazaarExtensions(path: string, method: string, origin: string = BASE_URL) {
  const meta = getEndpointMeta(path, method);
  const params = meta.parameters;
  const carriesBody = method === 'POST' || method === 'PUT' || method === 'PATCH';

  const properties: Record<string, { type: string; description: string }> = {};
  const required: string[] = [];
  for (const [name, p] of Object.entries(params ?? {})) {
    properties[name] = {
      type: p.type === 'number' ? 'number' : 'string',
      description: p.description,
    };
    if (p.required) required.push(name);
  }
  const inputSchema = {
    type: 'object',
    properties,
    ...(required.length > 0 ? { required } : {}),
  };

  const inputInfo: Record<string, unknown> = { type: 'http', method };
  if (carriesBody) {
    inputInfo.bodyType = 'json';
    inputInfo.body = inputSchema;
  } else {
    inputInfo.queryParams = inputSchema;
  }

  const outputSchema = meta.outputSchema ?? GENERIC_OUTPUT_SCHEMA;

  return {
    bazaar: {
      info: {
        input: inputInfo,
        output: outputSchema,
      },
      schema: {
        type: 'object',
        properties: {
          input: {
            type: 'object',
            properties: carriesBody
              ? { body: inputSchema }
              : { queryParams: inputSchema },
          },
          output: {
            type: 'object',
            properties: { example: outputSchema },
          },
        },
      },
    },
  };
}

/**
 * Build a proper MPP WWW-Authenticate challenge header value.
 * Includes all required parameters: id, method, intent, realm, expires, request.
 */
export function buildMppChallenge(pathname: string, amountAtomic: string, origin: string = BASE_URL): string {
  const id = `ch_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const expires = new Date(Date.now() + 300_000).toISOString(); // 5 minutes
  const requestObj = {
    currency: USDC_ASSET,
    amount: amountAtomic,
    recipient: RECEIVE_ADDRESS,
  };
  // Base64url-encode the request JSON
  const requestB64 = Buffer.from(JSON.stringify(requestObj)).toString('base64url');
  return `Payment id="${id}" method="tempo" intent="charge" realm="${origin}" expires="${expires}" request='${requestB64}'`;
}

/**
 * Build a standards-compliant x402 v2 402 response with accepts array,
 * extensions.bazaar schema, and MPP WWW-Authenticate challenge.
 *
 * Used as fallback when the SDK proxy cannot initialise, and as the
 * safety net when the proxy throws at request time.
 *
 * @see https://x402scan.com/discovery/spec
 */
export function buildPaymentRequiredBody(
  pathname: string,
  method: string,
  origin: string = BASE_URL,
): Record<string, unknown> {
  const meta = getEndpointMeta(pathname, method);
  const inputSchema = buildInputSchemaForAccepts(pathname, method, origin);
  const outputSchema = meta.outputSchema ?? GENERIC_OUTPUT_SCHEMA;

  return {
    x402Version: 2,
    error: 'Payment Required',
    accepts: [
      {
        scheme: 'exact',
        network: CURRENT_NETWORK,
        // Atomic token units, never decimal dollars. The OpenAPI spec quotes
        // the same price in decimal USD; mixing the two is the mismatch
        // x402scan reports as a malformed runtime amount.
        amount: usdToUsdc(getRoutePrice(pathname)),
        asset: USDC_ASSET,
        payTo: RECEIVE_ADDRESS,
        maxTimeoutSeconds: 60,
        extra: {
          name: ARBITRUM_USDC.name,
          version: ARBITRUM_USDC.version,
        },
        outputSchema: {
          input: inputSchema,
          output: outputSchema,
        },
      },
    ],
    resource: {
      url: `${origin}${pathname}`,
      description: meta.description,
      mimeType: 'application/json',
    },
    extensions: buildBazaarExtensions(pathname, method, origin),
  };
}
