/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 */

/**
 * The audit orchestrator.
 *
 * @module audit
 */

import type { AuditOptions, ConformanceReport, DeclaredOperation, Finding, ObservedChallenge } from './types';
import { SPEC_CANDIDATES, auditDocument, readOperations } from './document';
import { auditOperations } from './operation';
import { auditChallenge, readChallenge } from './probe';
import { crossCheck, type ProbePair } from './crosscheck';
import { scoreFindings } from './grade';
import { safeFetch } from './http';

/** Total distinct checks the auditor can run, for the "passed" count. */
export const CHECK_COUNT = 46;

const DEFAULT_UA = 'x402-conformance/1.0 (+https://cryptocurrency.cv/x402/conformance)';

export function normaliseOrigin(input: string): string {
  const withScheme = /^https?:\/\//i.test(input) ? input : `https://${input}`;
  const url = new URL(withScheme);
  return `${url.protocol}//${url.host}`;
}

/**
 * Choose which operations to probe.
 *
 * Probing every route on a 400-endpoint API is slow and inconsiderate, and it
 * mostly re-tests the same code path. The sample is picked deterministically to
 * maximise variety instead: distinct price points first, then distinct methods,
 * then distinct top-level path families, so a systemic mistake in any one of
 * those dimensions is caught by the first run rather than the tenth.
 */
export function selectProbeTargets(operations: DeclaredOperation[], limit: number): DeclaredOperation[] {
  if (operations.length <= limit) return [...operations];

  const sorted = [...operations].sort((a, b) =>
    a.path === b.path ? a.method.localeCompare(b.method) : a.path.localeCompare(b.path),
  );

  const chosen: DeclaredOperation[] = [];
  const seenPrice = new Set<string>();
  const seenMethod = new Set<string>();
  const seenFamily = new Set<string>();
  const family = (op: DeclaredOperation) => op.path.split('/').slice(0, 3).join('/');

  // Always probe one free and one paid route: the two protection-agreement
  // failures are invisible unless both sides are sampled.
  for (const wantPaid of [true, false]) {
    const candidate = sorted.find((op) => op.paid === wantPaid);
    if (candidate && !chosen.includes(candidate)) chosen.push(candidate);
  }

  const rank = (op: DeclaredOperation): number => {
    let novelty = 0;
    if (!seenPrice.has(String(op.priceUsd))) novelty += 4;
    if (!seenMethod.has(op.method)) novelty += 3;
    if (!seenFamily.has(family(op))) novelty += 2;
    return novelty;
  };

  for (const op of chosen) {
    seenPrice.add(String(op.priceUsd));
    seenMethod.add(op.method);
    seenFamily.add(family(op));
  }

  while (chosen.length < limit) {
    let best: DeclaredOperation | undefined;
    let bestRank = -1;
    for (const op of sorted) {
      if (chosen.includes(op)) continue;
      const value = rank(op);
      if (value > bestRank) {
        bestRank = value;
        best = op;
      }
      if (value === 9) break; // novel on every dimension; nothing can beat it
    }
    if (!best) break;
    chosen.push(best);
    seenPrice.add(String(best.priceUsd));
    seenMethod.add(best.method);
    seenFamily.add(family(best));
  }

  return chosen;
}

/** Methods that carry a body, and therefore need one on a probe. */
const BODY_METHODS = new Set(['POST', 'PUT', 'PATCH']);

async function probeOnce(
  origin: string,
  operation: DeclaredOperation,
  options: Required<Pick<AuditOptions, 'timeoutMs' | 'fetchImpl' | 'userAgent'>>,
  query?: string,
): Promise<ObservedChallenge> {
  // A path template cannot be called as written. Substitute a value that is
  // valid for any `{id}`-shaped segment so the probe reaches the gate.
  const path = operation.path.replace(/\{[^}]+\}/g, 'probe');
  const url = `${origin}${path}${query ?? ''}`;
  const result = await safeFetch(url, {
    method: operation.method,
    timeoutMs: options.timeoutMs,
    fetchImpl: options.fetchImpl,
    userAgent: options.userAgent,
    body: BODY_METHODS.has(operation.method) ? '{}' : undefined,
    accept: 'application/json, text/event-stream',
  });

  if (result.error) {
    return {
      url,
      method: operation.method,
      status: 0,
      hasInputSchema: false,
      hasOutputSchema: false,
      inputPropertyNames: [],
      error: result.error,
    };
  }

  return readChallenge(url, operation.method, result.status, result.json, result.headers);
}

/**
 * Audit an origin's x402 discovery contract.
 *
 * Fetches the discovery document, reads every operation it declares, probes a
 * representative sample on the wire, and reports where the two disagree.
 * Nothing here spends money or sends a payment header.
 */
export async function audit(originInput: string, options: AuditOptions = {}): Promise<ConformanceReport> {
  const origin = normaliseOrigin(originInput);
  const settings = {
    timeoutMs: options.timeoutMs ?? 10_000,
    fetchImpl: options.fetchImpl ?? globalThis.fetch,
    userAgent: options.userAgent ?? DEFAULT_UA,
  };
  const checkedAt = options.now ?? new Date().toISOString();
  const report = (extra: Partial<ConformanceReport>): ConformanceReport => {
    const findings = extra.findings ?? [];
    return {
      origin,
      checkedAt,
      documentFound: false,
      operations: { total: 0, paid: 0, free: 0 },
      probes: { attempted: 0, challenged: 0, failed: 0 },
      findings,
      score: scoreFindings(findings, CHECK_COUNT),
      ...extra,
    } as ConformanceReport;
  };

  if (typeof settings.fetchImpl !== 'function') {
    throw new TypeError('No fetch implementation available. Pass `fetchImpl` or run on Node 18+.');
  }

  // 1. Find the discovery document.
  options.onProgress?.('discovery', 0, 1);
  let specUrl: string | undefined;
  let document: Record<string, unknown> | undefined;
  for (const candidate of SPEC_CANDIDATES) {
    const result = await safeFetch(`${origin}${candidate}`, settings);
    if (result.status === 200 && result.json && typeof result.json === 'object' && !Array.isArray(result.json)) {
      const parsed = result.json as Record<string, unknown>;
      if ('openapi' in parsed || 'paths' in parsed) {
        specUrl = `${origin}${candidate}`;
        document = parsed;
        break;
      }
    }
  }
  options.onProgress?.('discovery', 1, 1);

  if (!document) {
    return report({
      findings: [
        {
          code: 'D00_NO_DISCOVERY_DOCUMENT',
          severity: 'error',
          layer: 'document',
          title: 'No discovery document found',
          detail: `Tried ${SPEC_CANDIDATES.map((c) => origin + c).join(', ')}. Without one, an agent has no machine-readable contract and the origin cannot be listed.`,
          fix: `Serve an OpenAPI 3.1 document at ${origin}/openapi.json.`,
          location: { url: `${origin}/openapi.json` },
        },
      ],
    });
  }

  // 2. Static analysis.
  const operations = readOperations(document);
  const findings: Finding[] = [...auditDocument(document, origin), ...auditOperations(operations)];
  const info = document.info as Record<string, unknown> | undefined;

  if (options.documentOnly || operations.length === 0) {
    return report({
      specUrl,
      apiTitle: typeof info?.title === 'string' ? info.title : undefined,
      documentFound: true,
      operations: {
        total: operations.length,
        paid: operations.filter((o) => o.paid).length,
        free: operations.filter((o) => !o.paid).length,
      },
      findings,
    });
  }

  // 3. Probe the wire.
  const limit = options.probeAll ? operations.length : Math.max(1, options.probeLimit ?? 12);
  const targets = selectProbeTargets(operations, limit);
  const pairs: ProbePair[] = [];

  for (const [index, operation] of targets.entries()) {
    options.onProgress?.('probe', index, targets.length);
    const observed = await probeOnce(origin, operation, settings);
    const pair: ProbePair = { declared: operation, observed };

    // Two extra probes, but only where they can teach us something: a second
    // identical call to test quote stability, and one with junk arguments to
    // test whether validation runs ahead of the gate.
    if (observed.status === 402) {
      pair.repeat = await probeOnce(origin, operation, settings);
      pair.invalidArgs = await probeOnce(origin, operation, settings, '?__x402_conformance_probe=1');
    }
    pairs.push(pair);
  }
  options.onProgress?.('probe', targets.length, targets.length);

  for (const pair of pairs) {
    // A free route answering 200 is the expected case, not a finding.
    if (!pair.declared.paid && pair.observed.status !== 402 && !pair.observed.error) continue;
    findings.push(...auditChallenge(pair.observed));
  }
  findings.push(...crossCheck(pairs));

  const challenged = pairs.filter((p) => p.observed.status === 402).length;
  const failed = pairs.filter((p) => p.observed.error).length;

  return report({
    specUrl,
    apiTitle: typeof info?.title === 'string' ? info.title : undefined,
    documentFound: true,
    operations: {
      total: operations.length,
      paid: operations.filter((o) => o.paid).length,
      free: operations.filter((o) => !o.paid).length,
    },
    probes: { attempted: pairs.length, challenged, failed },
    findings,
  });
}
