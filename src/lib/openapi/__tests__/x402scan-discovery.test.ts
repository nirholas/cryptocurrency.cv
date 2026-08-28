/**
 * x402scan discovery contract.
 *
 * x402scan reads two sources and treats runtime behaviour as authoritative:
 * the OpenAPI document at /openapi.json, then the live 402 challenge. Both
 * used to drift from what its parser reads, and the failures were invisible
 * from the outside: every operation carried a price and an input schema, but
 * in shapes the parser resolved to nothing, so endpoints listed without
 * schemas and registration probes reported them as missing.
 *
 * These tests pin the exact shapes the parser looks up.
 *
 * @see https://x402scan.com/discovery/spec
 */

import { describe, it, expect } from 'vitest';
import { generateOpenAPISpec } from '../generator';
import { buildPaymentRequiredBody } from '@/lib/x402/payment-required';
import { EXEMPT_PATTERNS, FREE_TIER_PATTERNS, matchesPattern } from '@/middleware/config';

type Operation = {
  summary?: string;
  security?: Record<string, unknown[]>[];
  parameters?: { name: string; in: string }[];
  requestBody?: { content: Record<string, { schema: unknown }> };
  responses: Record<string, { content?: Record<string, { schema: unknown }> }>;
  'x-payment-info'?: {
    price?: { mode?: string; currency?: string; amount?: string };
    protocols?: Record<string, unknown>[];
  };
};

const spec = generateOpenAPISpec() as unknown as {
  openapi: string;
  info: { title: string; version: string; contact?: { email?: string }; 'x-guidance': string };
  paths: Record<string, Record<string, Operation>>;
};

const operations = Object.entries(spec.paths).flatMap(([path, item]) =>
  Object.entries(item).map(([method, operation]) => ({ path, method, operation })),
);

/** Behind the x402 gate at runtime, per the patterns the middleware reads. */
const isPaid = (path: string) =>
  !matchesPattern(path, EXEMPT_PATTERNS) && !matchesPattern(path, FREE_TIER_PATTERNS);

const paidOperations = operations.filter(({ path }) => isPaid(path));
const freeOperations = operations.filter(({ path }) => !isPaid(path));

describe('OpenAPI discovery document', () => {
  it('declares every top-level field the parser requires', () => {
    expect(spec.openapi).toMatch(/^3\./);
    expect(spec.info.title).toBeTruthy();
    expect(spec.info.version).toBeTruthy();
    expect(spec.info['x-guidance']).toBeTruthy();
    expect(Object.keys(spec.paths).length).toBeGreaterThan(300);
  });

  it('publishes a reachable contact so origin ownership can be verified', () => {
    expect(spec.info.contact?.email).toMatch(/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i);
  });

  it('has both paid and free operations to check', () => {
    expect(paidOperations.length).toBeGreaterThan(200);
    expect(freeOperations.length).toBeGreaterThan(0);
  });

  it('prices every paid operation in the structured x-payment-info format', () => {
    for (const { path, method, operation } of paidOperations) {
      const info = operation['x-payment-info'];
      expect(info, `${method} ${path} x-payment-info`).toBeDefined();
      // A flat `{ price: "0.001", pricingMode: "fixed" }` still parses, but
      // only through the legacy fallback the audit flags.
      expect(info!.price, `${method} ${path} price`).toBeTypeOf('object');
      expect(info!.price!.mode).toBe('fixed');
      expect(info!.price!.currency).toBe('USD');
      expect(Number(info!.price!.amount)).toBeGreaterThan(0);
    }
  });

  it('declares protocols as objects, not bare names', () => {
    for (const { path, method, operation } of paidOperations) {
      const protocols = operation['x-payment-info']!.protocols;
      expect(Array.isArray(protocols), `${method} ${path} protocols`).toBe(true);
      // `{ x402: {} }` is canonical; `"x402"` or `{ x402: true }` is malformed.
      for (const entry of protocols!) {
        expect(entry.x402).toBeTypeOf('object');
        expect(Array.isArray(entry.x402)).toBe(false);
      }
    }
  });

  it('gives every operation both an input and an output schema', () => {
    for (const { path, method, operation } of operations) {
      const hasParameters = (operation.parameters ?? []).length > 0;
      const hasBody = Boolean(operation.requestBody?.content?.['application/json']?.schema);
      expect(hasParameters || hasBody, `${method} ${path} input schema`).toBe(true);

      const ok = operation.responses['200'];
      expect(ok?.content, `${method} ${path} output schema`).toBeDefined();
      const [mediaType] = Object.values(ok!.content!);
      expect(mediaType.schema).toBeTypeOf('object');
    }
  });

  it('advertises a 402 on every paid operation', () => {
    for (const { path, method, operation } of paidOperations) {
      expect(operation.responses['402'], `${method} ${path} 402`).toBeDefined();
    }
  });

  it('never advertises payment on a route the gate lets through free', () => {
    // The runtime 402 overrules the spec, so a free route that claims a price
    // fails its registration probe with "expected 402, got 200".
    for (const { path, method, operation } of freeOperations) {
      expect(operation['x-payment-info'], `${method} ${path} x-payment-info`).toBeUndefined();
      expect(operation.responses['402'], `${method} ${path} 402`).toBeUndefined();
      // An empty security array is the explicit "public" declaration.
      expect(operation.security, `${method} ${path} security`).toEqual([]);
    }
  });
});

describe('info.x-guidance', () => {
  // The guidance is injected into agent context verbatim. A path that 404s or
  // a price on a route that is actually free costs an agent a wasted call, and
  // nothing else in the build checks it.
  const cited = [...spec.info['x-guidance'].matchAll(/(?:GET|POST|PUT|DELETE) (\/api\/\S*)/g)]
    .map((m) => m[1].replace(/[?,.]$/, ''))
    .filter((path, index, all) => all.indexOf(path) === index);

  // `/api/solana/*` is a family, not a route: assert the family is non-empty.
  const families = cited.filter((path) => path.endsWith('*'));
  const referenced = cited.filter((path) => !path.endsWith('*') && !path.includes('?'));

  it('names endpoints that exist', () => {
    expect(referenced.length).toBeGreaterThan(20);
    for (const path of referenced) {
      expect(spec.paths[path], `x-guidance references ${path}`).toBeDefined();
    }
  });

  it('names route families that have members', () => {
    expect(families.length).toBeGreaterThan(0);
    for (const family of families) {
      const prefix = family.slice(0, -1);
      const members = Object.keys(spec.paths).filter((path) => path.startsWith(prefix));
      expect(members.length, `x-guidance references ${family}`).toBeGreaterThan(0);
    }
  });

  it('never quotes a price for a route the gate serves free', () => {
    const guidance = spec.info['x-guidance'];
    for (const path of referenced.filter((p) => !isPaid(p))) {
      const line = guidance.split('\n').find((l) => l.includes(`${path} `)) ?? '';
      expect(line, `${path} is free but quoted a price`).not.toMatch(/\(\$[\d.]+\)/);
    }
  });
});

describe('runtime 402 challenge', () => {
  const body = buildPaymentRequiredBody('/api/v1/news', 'GET') as {
    x402Version: number;
    accepts: { amount: string; network: string; asset: string; outputSchema: unknown }[];
    extensions: {
      bazaar: {
        schema: {
          properties: {
            input: { properties: Record<string, unknown> };
            output: { properties: { example?: unknown } };
          };
        };
      };
    };
  };

  it('speaks x402 v2', () => {
    expect(body.x402Version).toBe(2);
    expect(body.accepts.length).toBeGreaterThan(0);
  });

  it('quotes the amount in token atomic units, not decimal dollars', () => {
    // $0.001 of 6-decimal USDC is 1000 atomic units. "0.001" here is the
    // malformed-runtime-amount failure.
    expect(body.accepts[0].amount).toBe('1000');
    expect(body.accepts[0].amount).toMatch(/^\d+$/);
  });

  it('exposes the input schema where a v2 validator looks it up', () => {
    const input = body.extensions.bazaar.schema.properties.input.properties;
    // Resolution order is body, then queryParams. A GET has the latter.
    const resolved = input.body ?? input.queryParams;
    expect(resolved, 'schema.properties.input.properties.{body,queryParams}').toBeTypeOf('object');
  });

  it('exposes the output schema where a v2 validator looks it up', () => {
    const example = body.extensions.bazaar.schema.properties.output.properties.example;
    expect(example, 'schema.properties.output.properties.example').toBeTypeOf('object');
  });

  it('carries the legacy accepts[].outputSchema pair for v1 readers', () => {
    expect(body.accepts[0].outputSchema).toMatchObject({
      input: expect.any(Object),
      output: expect.any(Object),
    });
  });
});
