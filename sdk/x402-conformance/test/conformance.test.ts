/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 */

/**
 * Every test here is a bug that has actually shipped on a live x402 origin.
 * The auditor exists because each of them validates perfectly on its own and
 * only shows up when the document and the wire are read side by side.
 */

import { describe, it, expect } from 'vitest';
import { audit } from '../src/audit';
import { auditChallenge, readChallenge } from '../src/probe';
import { crossCheck } from '../src/crosscheck';
import { readOperations, auditDocument } from '../src/document';
import { auditOperations } from '../src/operation';
import { diffReports, renderSarif, renderText } from '../src/report';
import { impliedDecimals, atomicToDecimal, isPlausibleDecimals } from '../src/money';
import { isUnspendable, isCaip2, canonicalNetwork } from '../src/networks';
import type { ConformanceReport, DeclaredOperation } from '../src/types';

const ORIGIN = 'https://api.example.com';

/** A discovery document that gets everything right. */
function goodDocument(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    openapi: '3.1.0',
    info: {
      title: 'Example API',
      version: '1.0.0',
      'x-guidance': 'Use GET /api/search for neural web search. It takes a q parameter and returns results.',
      contact: { email: 'ops@example.com' },
    },
    servers: [{ url: ORIGIN }],
    paths: {
      '/api/search': {
        get: {
          operationId: 'search',
          summary: 'Neural search across the web',
          'x-payment-info': {
            price: { mode: 'fixed', currency: 'USD', amount: '0.010000' },
            protocols: [{ x402: {} }],
          },
          parameters: [{ name: 'q', in: 'query', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { content: { 'application/json': { schema: { type: 'object' } } } },
            '402': { description: 'Payment Required' },
          },
        },
      },
      '/api/health': {
        get: {
          operationId: 'health',
          summary: 'Liveness probe',
          security: [],
          parameters: [{ name: 'verbose', in: 'query', schema: { type: 'string' } }],
          responses: { '200': { content: { 'application/json': { schema: { type: 'object' } } } } },
        },
      },
    },
    ...overrides,
  };
}

/** A 402 body in the shape a v2 reader can actually resolve. */
function goodChallenge(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  const inputSchema = { type: 'object', properties: { q: { type: 'string' } } };
  const outputSchema = { type: 'object', properties: { results: { type: 'array' } } };
  return {
    x402Version: 2,
    error: 'Payment Required',
    accepts: [
      {
        scheme: 'exact',
        network: 'eip155:8453',
        amount: '10000',
        asset: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        payTo: '0x1111111111111111111111111111111111111111',
        maxTimeoutSeconds: 60,
        extra: { name: 'USD Coin', version: '2' },
        outputSchema: { input: inputSchema, output: outputSchema },
      },
    ],
    resource: { url: `${ORIGIN}/api/search`, description: 'Neural search', mimeType: 'application/json' },
    extensions: {
      bazaar: {
        schema: {
          type: 'object',
          properties: {
            input: { type: 'object', properties: { queryParams: inputSchema } },
            output: { type: 'object', properties: { example: outputSchema } },
          },
        },
      },
    },
    ...overrides,
  };
}

/** Build a fetch stub that serves one document and one challenge per path. */
function stubFetch(routes: Record<string, { status: number; body?: unknown }>): typeof fetch {
  return (async (input: string | URL | Request) => {
    const url = typeof input === 'string' ? input : input.toString();
    const path = new URL(url).pathname;
    const route = routes[path] ?? { status: 404, body: { error: 'not found' } };
    return {
      status: route.status,
      headers: new Headers({ 'content-type': 'application/json' }),
      text: async () => JSON.stringify(route.body ?? {}),
    } as unknown as Response;
  }) as unknown as typeof fetch;
}

/** Reach one operation in a fixture document so a test can mutate a field. */
function op(document: Record<string, unknown>, path: string, method = 'get'): Record<string, unknown> {
  const paths = document.paths as Record<string, Record<string, Record<string, unknown>>>;
  return paths[path]![method]!;
}

/** Reach the first accepts entry of a fixture challenge. */
function accept(body: Record<string, unknown>): Record<string, unknown> {
  return (body.accepts as Record<string, unknown>[])[0]!;
}

const codes = (report: ConformanceReport): string[] => report.findings.map((f) => f.code);

describe('money', () => {
  it('recovers the token decimals from an honest price pair', () => {
    // $0.001 charged as 1000 atomic units is a 6-decimal token, i.e. USDC.
    expect(impliedDecimals(0.001, '1000')).toBe(6);
    expect(impliedDecimals(0.05, '50000')).toBe(6);
    expect(impliedDecimals(1, '1000000000000000000')).toBe(18);
  });

  it('refuses a pair that is not one number in two units', () => {
    expect(impliedDecimals(0.001, '1337')).toBeNull();
    expect(impliedDecimals(0.001, '0.001')).toBeNull();
  });

  it('rejects decimal counts no settlement token uses', () => {
    expect(isPlausibleDecimals(6)).toBe(true);
    expect(isPlausibleDecimals(7)).toBe(false);
  });

  it('converts atomic units back to a readable amount', () => {
    expect(atomicToDecimal('1000', 6)).toBe('0.001');
    expect(atomicToDecimal('50000', 6)).toBe('0.05');
    expect(atomicToDecimal('1000000', 6)).toBe('1');
  });
});

describe('networks', () => {
  it('knows which addresses swallow funds', () => {
    expect(isUnspendable('0x0000000000000000000000000000000000000000')).toBe(true);
    expect(isUnspendable('0x000000000000000000000000000000000000dEaD')).toBe(true);
    expect(isUnspendable('0x1111111111111111111111111111111111111111')).toBe(false);
  });

  it('normalises pre-CAIP-2 chain names so two networks can be compared', () => {
    expect(isCaip2('eip155:8453')).toBe(true);
    expect(isCaip2('base')).toBe(false);
    expect(canonicalNetwork('base')).toBe('eip155:8453');
  });
});

describe('document analysis', () => {
  it('accepts a well-formed document', () => {
    expect(auditDocument(goodDocument(), ORIGIN)).toEqual([]);
  });

  it('reads the structured price shape', () => {
    const [search] = readOperations(goodDocument());
    expect(search!.paid).toBe(true);
    expect(search!.priceUsd).toBe(0.01);
    expect(search!.priceMode).toBe('fixed');
    expect(search!.protocols).toEqual(['x402']);
  });

  it('still reads the legacy flat price shape', () => {
    const document = goodDocument();
    const search = op(document, '/api/search');
    search['x-payment-info'] = { protocols: ['x402'], pricingMode: 'fixed', price: '0.01' };
    const [operation] = readOperations(document);
    expect(operation!.priceUsd).toBe(0.01);
    expect(operation!.priceMode).toBe('fixed');
  });

  it('catches a security scheme that is required but never defined', () => {
    const document = goodDocument();
    op(document, '/api/search').security = [{ ApiKeyAuth: [] }];
    expect(auditDocument(document, ORIGIN).map((f) => f.code)).toContain('D11_SECURITY_SCHEME_UNDECLARED');
  });

  it('catches a servers list that points somewhere else', () => {
    const document = goodDocument({ servers: [{ url: 'https://elsewhere.example' }] });
    expect(auditDocument(document, ORIGIN).map((f) => f.code)).toContain('D09_SERVER_ORIGIN_MISMATCH');
  });

  it('catches duplicate operationIds', () => {
    const document = goodDocument();
    op(document, '/api/health').operationId = 'search';
    expect(auditDocument(document, ORIGIN).map((f) => f.code)).toContain('D07_OPERATION_ID_DUPLICATE');
  });
});

describe('operation analysis', () => {
  const base: DeclaredOperation = {
    path: '/api/search',
    method: 'GET',
    paid: true,
    priceUsd: 0.01,
    priceMode: 'fixed',
    currency: 'USD',
    protocols: ['x402'],
    hasInputSchema: true,
    hasOutputSchema: true,
    parameterNames: ['q'],
    explicitlyPublic: false,
    declares402: true,
    summary: 'Search',
  };

  it('accepts a complete paid operation', () => {
    expect(auditOperations([base])).toEqual([]);
  });

  it('flags a paid operation with no 402 branch', () => {
    const codes = auditOperations([{ ...base, declares402: false }]).map((f) => f.code);
    expect(codes).toContain('O06_402_UNDECLARED');
  });

  it('flags dynamic pricing with no bounds to budget against', () => {
    const codes = auditOperations([
      { ...base, priceMode: 'dynamic', priceUsd: undefined },
    ]).map((f) => f.code);
    expect(codes).toContain('O03_DYNAMIC_BOUNDS_MISSING');
  });

  it('flags a free operation that never says it is free', () => {
    const codes = auditOperations([
      { ...base, paid: false, priceUsd: undefined, priceMode: undefined, protocols: [], declares402: false },
    ]).map((f) => f.code);
    expect(codes).toContain('O08_AUTH_MODE_UNDECLARED');
  });

  it('collapses one systemic mistake instead of printing it 400 times', () => {
    const many = Array.from({ length: 400 }, (_, i) => ({
      ...base,
      path: `/api/route-${i}`,
      hasOutputSchema: false,
    }));
    const findings = auditOperations(many);
    const listed = findings.filter((f) => f.code === 'O10_OUTPUT_SCHEMA_MISSING');
    const rollup = findings.find((f) => f.code === 'O10_OUTPUT_SCHEMA_MISSING_MORE');
    expect(listed).toHaveLength(5);
    expect(rollup?.evidence?.total).toBe(400);
  });
});

describe('runtime challenge analysis', () => {
  const parse = (body: unknown, status = 402) =>
    readChallenge(`${ORIGIN}/api/search`, 'GET', status, body, new Headers());

  it('accepts a well-formed v2 challenge', () => {
    expect(auditChallenge(parse(goodChallenge()))).toEqual([]);
  });

  it('resolves the schemas only where a v2 reader actually looks', () => {
    // A complete schema parked at `schema` instead of `schema.properties.input`
    // is invisible to every v2 client, which is the failure this catches.
    const body = goodChallenge({
      extensions: { bazaar: { schema: { type: 'object', properties: { q: { type: 'string' } } } } },
    });
    delete accept(body).outputSchema;
    const codes = auditChallenge(parse(body)).map((f) => f.code);
    expect(codes).toContain('R18_INPUT_SCHEMA_UNRESOLVABLE');
    expect(codes).toContain('R19_OUTPUT_SCHEMA_UNRESOLVABLE');
  });

  it('falls back to the v1 accepts schemas when the bazaar block is absent', () => {
    const body = goodChallenge();
    delete body.extensions;
    const challenge = parse(body);
    expect(challenge.hasInputSchema).toBe(true);
    expect(challenge.hasOutputSchema).toBe(true);
  });

  it('catches payment directed at an unspendable address', () => {
    const body = goodChallenge();
    accept(body).payTo = '0x0000000000000000000000000000000000000000';
    const finding = auditChallenge(parse(body)).find((f) => f.code === 'R09_PAYTO_UNSPENDABLE');
    expect(finding?.severity).toBe('error');
  });

  it('catches an amount quoted in dollars instead of atomic units', () => {
    const body = goodChallenge();
    accept(body).amount = '0.01';
    expect(auditChallenge(parse(body)).map((f) => f.code)).toContain('R06_AMOUNT_IS_DECIMAL');
  });

  it('catches an exact-EVM challenge with no EIP-712 domain to sign against', () => {
    const body = goodChallenge();
    delete accept(body).extra;
    expect(auditChallenge(parse(body)).map((f) => f.code)).toContain('R15_EIP3009_DOMAIN_MISSING');
  });

  it('distinguishes a bot block from a missing gate', () => {
    expect(auditChallenge(parse({}, 403)).map((f) => f.code)).toContain('R02_PROBE_BLOCKED');
    expect(auditChallenge(parse({}, 400)).map((f) => f.code)).toContain('R01_VALIDATION_BEFORE_PAYMENT');
    expect(auditChallenge(parse({}, 200)).map((f) => f.code)).toContain('R03_NO_CHALLENGE');
  });

  it('accepts a legacy named network but says so', () => {
    const body = goodChallenge();
    accept(body).network = 'base';
    const finding = auditChallenge(parse(body)).find((f) => f.code === 'R12_NETWORK_NOT_CAIP2');
    expect(finding?.severity).toBe('warn');
    expect(finding?.evidence?.caip2).toBe('eip155:8453');
  });
});

describe('cross-validation', () => {
  const declared: DeclaredOperation = {
    path: '/api/search',
    method: 'GET',
    paid: true,
    priceUsd: 0.01,
    priceMode: 'fixed',
    currency: 'USD',
    protocols: ['x402'],
    hasInputSchema: true,
    hasOutputSchema: true,
    parameterNames: ['q'],
    explicitlyPublic: false,
    declares402: true,
  };
  const observed = readChallenge(`${ORIGIN}/api/search`, 'GET', 402, goodChallenge(), new Headers());

  it('passes when the document and the wire agree', () => {
    expect(crossCheck([{ declared, observed }])).toEqual([]);
  });

  it('catches the million-fold overcharge the two units invite', () => {
    // $0.01 declared, but the wire asks for 10000000000 atomic units: the
    // server multiplied by 10^12 instead of 10^6. Both sides validate alone.
    const body = goodChallenge();
    accept(body).amount = '10000000000';
    const wrong = readChallenge(`${ORIGIN}/api/search`, 'GET', 402, body, new Headers());
    const finding = crossCheck([{ declared, observed: wrong }]).find((f) => f.code === 'X03_PRICE_DISAGREES');
    expect(finding?.severity).toBe('error');
    expect(finding?.evidence?.expectedAtomic).toBe('10000');
    expect(finding?.title).toContain('1,000,000x');
  });

  it('catches a route advertised as paid that anyone can call free', () => {
    const free = readChallenge(`${ORIGIN}/api/search`, 'GET', 200, { ok: true }, new Headers());
    expect(crossCheck([{ declared, observed: free }]).map((f) => f.code)).toContain('X01_PAID_BUT_NOT_GATED');
  });

  it('catches a route advertised as free that charges on call', () => {
    const freeSpec = { ...declared, paid: false, priceUsd: undefined, declares402: false };
    expect(crossCheck([{ declared: freeSpec, observed }]).map((f) => f.code)).toContain('X02_FREE_BUT_GATED');
  });

  it('catches a fixed price that changes between two identical calls', () => {
    const body = goodChallenge();
    accept(body).amount = '20000';
    const repeat = readChallenge(`${ORIGIN}/api/search`, 'GET', 402, body, new Headers());
    expect(crossCheck([{ declared, observed, repeat }]).map((f) => f.code)).toContain('X10_QUOTE_UNSTABLE');
  });

  it('catches validation running ahead of the payment gate', () => {
    const invalidArgs = readChallenge(`${ORIGIN}/api/search?x=1`, 'GET', 400, { error: 'bad' }, new Headers());
    expect(crossCheck([{ declared, observed, invalidArgs }]).map((f) => f.code)).toContain('X09_GATE_AFTER_VALIDATION');
  });

  it('catches a dynamic quote above its own advertised ceiling', () => {
    const dynamic = { ...declared, priceMode: 'dynamic', priceUsd: undefined, minUsd: 0.001, maxUsd: 0.005 };
    expect(crossCheck([{ declared: dynamic, observed }]).map((f) => f.code)).toContain('X06_DYNAMIC_PRICE_ABOVE_MAX');
  });

  it('catches the document and the challenge describing different inputs', () => {
    const drifted = { ...declared, parameterNames: ['query', 'limit'] };
    const finding = crossCheck([{ declared: drifted, observed }]).find((f) => f.code === 'X07_INPUT_SCHEMA_DIVERGES');
    expect(finding?.evidence?.declaredOnly).toEqual(['query', 'limit']);
    expect(finding?.evidence?.runtimeOnly).toEqual(['q']);
  });
});

describe('audit', () => {
  it('grades a clean origin an A and probes the wire', async () => {
    const report = await audit(ORIGIN, {
      now: '2026-01-01T00:00:00.000Z',
      fetchImpl: stubFetch({
        '/openapi.json': { status: 200, body: goodDocument() },
        '/api/search': { status: 402, body: goodChallenge() },
        '/api/health': { status: 200, body: { ok: true } },
      }),
    });

    expect(report.documentFound).toBe(true);
    expect(report.operations).toEqual({ total: 2, paid: 1, free: 1 });
    expect(report.probes.challenged).toBe(1);
    expect(report.findings).toEqual([]);
    expect(report.score.grade).toBe('A');
    expect(report.score.value).toBe(100);
  });

  it('reports an origin with no discovery document at all', async () => {
    const report = await audit(ORIGIN, {
      now: '2026-01-01T00:00:00.000Z',
      fetchImpl: stubFetch({}),
    });
    expect(codes(report)).toEqual(['D00_NO_DISCOVERY_DOCUMENT']);
    expect(report.score.grade).toBe('F');
  });

  it('caps the grade when payment goes somewhere unrecoverable', async () => {
    const body = goodChallenge();
    accept(body).payTo = '0x0000000000000000000000000000000000000000';
    const report = await audit(ORIGIN, {
      now: '2026-01-01T00:00:00.000Z',
      fetchImpl: stubFetch({
        '/openapi.json': { status: 200, body: goodDocument() },
        '/api/search': { status: 402, body },
        '/api/health': { status: 200, body: { ok: true } },
      }),
    });
    expect(codes(report)).toContain('R09_PAYTO_UNSPENDABLE');
    // However good the rest is, an origin that burns funds cannot pass.
    expect(report.score.value).toBeLessThanOrEqual(65);
  });

  it('leaves the wire alone when asked to', async () => {
    let probes = 0;
    const inner = stubFetch({ '/openapi.json': { status: 200, body: goodDocument() } });
    const report = await audit(ORIGIN, {
      now: '2026-01-01T00:00:00.000Z',
      documentOnly: true,
      fetchImpl: ((url: string) => {
        if (!String(url).endsWith('/openapi.json')) probes++;
        return inner(url as never);
      }) as unknown as typeof fetch,
    });
    expect(probes).toBe(0);
    expect(report.probes.attempted).toBe(0);
    expect(report.documentFound).toBe(true);
  });
});

describe('reporting', () => {
  const baseReport: ConformanceReport = {
    origin: ORIGIN,
    checkedAt: '2026-01-01T00:00:00.000Z',
    documentFound: true,
    operations: { total: 2, paid: 1, free: 1 },
    probes: { attempted: 1, challenged: 1, failed: 0 },
    findings: [
      {
        code: 'R09_PAYTO_UNSPENDABLE',
        severity: 'error',
        layer: 'runtime',
        title: 'Payments are directed to an unspendable address',
        detail: 'payTo is the zero address.',
        fix: 'Set the receiving wallet.',
        location: { path: '/api/search', method: 'GET' },
      },
    ],
    score: { value: 60, grade: 'D', errors: 1, warnings: 0, infos: 0, passed: 45 },
  };

  it('renders a report a human can act on without the JSON', () => {
    const text = renderText(baseReport);
    expect(text).toContain('[ D ]');
    expect(text).toContain('R09_PAYTO_UNSPENDABLE');
    expect(text).toContain('Fix: Set the receiving wallet.');
  });

  it('renders SARIF that a code-scanning upload accepts', () => {
    const sarif = JSON.parse(renderSarif(baseReport));
    expect(sarif.version).toBe('2.1.0');
    expect(sarif.runs[0].tool.driver.rules[0].id).toBe('R09_PAYTO_UNSPENDABLE');
    expect(sarif.runs[0].results[0].level).toBe('error');
  });

  it('separates a fixed problem from a newly introduced one', () => {
    const current: ConformanceReport = {
      ...baseReport,
      findings: [
        {
          code: 'X03_PRICE_DISAGREES',
          severity: 'error',
          layer: 'cross',
          title: 'Document and challenge quote different prices',
          detail: '',
          fix: '',
          location: { path: '/api/search', method: 'GET' },
        },
      ],
      score: { ...baseReport.score, value: 55 },
    };
    const drift = diffReports(baseReport, current);
    expect(drift.resolved.map((f) => f.code)).toEqual(['R09_PAYTO_UNSPENDABLE']);
    expect(drift.introduced.map((f) => f.code)).toEqual(['X03_PRICE_DISAGREES']);
    expect(drift.scoreDelta).toBe(-5);
  });
});
