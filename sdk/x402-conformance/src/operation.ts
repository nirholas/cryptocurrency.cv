/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 */

/**
 * Per-operation static checks.
 *
 * Every finding here is something a directory reads and an agent acts on
 * before a single request is made.
 *
 * @module operation
 */

import type { DeclaredOperation, Finding } from './types';

const KNOWN_MODES = new Set(['fixed', 'dynamic']);

/** Cap repeated findings so one systemic mistake does not bury the rest. */
const MAX_PER_CODE = 5;

function pointerFor(operation: DeclaredOperation, suffix = ''): string {
  const escaped = operation.path.replace(/~/g, '~0').replace(/\//g, '~1');
  return `/paths/${escaped}/${operation.method.toLowerCase()}${suffix}`;
}

export function auditOperations(operations: DeclaredOperation[]): Finding[] {
  const findings: Finding[] = [];
  const counts = new Map<string, number>();

  /** Record a finding, collapsing the tail of a repeated code into a summary. */
  const push = (finding: Finding): void => {
    const seen = counts.get(finding.code) ?? 0;
    counts.set(finding.code, seen + 1);
    if (seen < MAX_PER_CODE) findings.push(finding);
  };

  for (const operation of operations) {
    const where = { path: operation.path, method: operation.method };

    if (operation.paid) {
      if (!operation.priceMode || !KNOWN_MODES.has(operation.priceMode)) {
        push({
          code: 'O01_PRICE_MODE_UNKNOWN',
          severity: 'warn',
          layer: 'operation',
          title: `Unrecognised pricing mode \`${operation.priceMode ?? 'missing'}\``,
          detail: `${operation.method} ${operation.path} declares a price with no mode a reader understands.`,
          fix: 'Set `x-payment-info.price.mode` to "fixed" or "dynamic".',
          location: { ...where, pointer: pointerFor(operation, '/x-payment-info/price/mode') },
          evidence: { mode: operation.priceMode },
        });
      }

      if (operation.priceMode === 'fixed' && !(operation.priceUsd! > 0)) {
        push({
          code: 'O02_FIXED_PRICE_MISSING',
          severity: 'error',
          layer: 'operation',
          title: 'Fixed-price operation has no positive amount',
          detail: `${operation.method} ${operation.path} charges an unknown amount, so an agent cannot budget for it.`,
          fix: 'Set `x-payment-info.price.amount` to the decimal USD price, e.g. "0.010000".',
          location: { ...where, pointer: pointerFor(operation, '/x-payment-info/price/amount') },
          evidence: { amount: operation.priceUsd },
        });
      }

      if (operation.priceMode === 'dynamic') {
        if (operation.minUsd === undefined || operation.maxUsd === undefined) {
          push({
            code: 'O03_DYNAMIC_BOUNDS_MISSING',
            severity: 'error',
            layer: 'operation',
            title: 'Dynamic pricing declares no bounds',
            detail: `${operation.method} ${operation.path} prices dynamically without min and max, so an agent has no safe ceiling to pre-authorise.`,
            fix: 'Add `x-payment-info.price.min` and `.max` in decimal USD.',
            location: { ...where, pointer: pointerFor(operation, '/x-payment-info/price') },
          });
        } else if (operation.minUsd > operation.maxUsd) {
          push({
            code: 'O04_DYNAMIC_BOUNDS_INVERTED',
            severity: 'error',
            layer: 'operation',
            title: 'Dynamic pricing minimum exceeds its maximum',
            detail: `${operation.method} ${operation.path} declares min ${operation.minUsd} and max ${operation.maxUsd}.`,
            fix: 'Swap the bounds so min is the floor and max the ceiling.',
            location: { ...where, pointer: pointerFor(operation, '/x-payment-info/price') },
            evidence: { min: operation.minUsd, max: operation.maxUsd },
          });
        }
      }

      if (operation.protocols.length === 0) {
        push({
          code: 'O05_PROTOCOLS_MISSING',
          severity: 'warn',
          layer: 'operation',
          title: 'Paid operation declares no payment protocol',
          detail: `${operation.method} ${operation.path} costs money but never says how to pay for it.`,
          fix: 'Add `x-payment-info.protocols: [{ "x402": {} }]`.',
          location: { ...where, pointer: pointerFor(operation, '/x-payment-info/protocols') },
        });
      }

      if (!operation.declares402) {
        push({
          code: 'O06_402_UNDECLARED',
          severity: 'error',
          layer: 'operation',
          title: 'Paid operation does not declare a 402 response',
          detail: `${operation.method} ${operation.path} charges for access but its response list contains no 402, so a generated client has no branch for the challenge it will receive.`,
          fix: 'Add `responses["402"] = { description: "Payment Required" }`.',
          location: { ...where, pointer: pointerFor(operation, '/responses/402') },
        });
      }
    } else if (operation.declares402) {
      push({
        code: 'O07_402_ON_FREE_OPERATION',
        severity: 'warn',
        layer: 'operation',
        title: 'Free operation declares a 402 it never returns',
        detail: `${operation.method} ${operation.path} has no price but promises a payment challenge.`,
        fix: 'Remove the 402 response, or add `x-payment-info` if the route really is paid.',
        location: { ...where, pointer: pointerFor(operation, '/responses/402') },
      });
    }

    if (!operation.paid && !operation.explicitlyPublic) {
      push({
        code: 'O08_AUTH_MODE_UNDECLARED',
        severity: 'warn',
        layer: 'operation',
        title: 'Operation declares no auth mode',
        detail: `${operation.method} ${operation.path} has no price and no security requirement, so a reader cannot tell whether it is free or merely undocumented.`,
        fix: 'Set `security: []` to mark it explicitly public, or reference a security scheme.',
        location: { ...where, pointer: pointerFor(operation, '/security') },
      });
    }

    if (!operation.hasInputSchema) {
      push({
        code: 'O09_INPUT_SCHEMA_MISSING',
        severity: 'error',
        layer: 'operation',
        title: 'Operation has no input schema',
        detail: `${operation.method} ${operation.path} declares neither parameters nor a request body, so an agent has to guess the call shape.`,
        fix: 'Declare `parameters` for the query string, or `requestBody.content["application/json"].schema` for the body.',
        location: { ...where, pointer: pointerFor(operation, '/parameters') },
      });
    }

    if (!operation.hasOutputSchema) {
      push({
        code: 'O10_OUTPUT_SCHEMA_MISSING',
        severity: 'error',
        layer: 'operation',
        title: 'Operation has no output schema',
        detail: `${operation.method} ${operation.path} documents no 2xx response body, so a caller cannot tell what it bought before paying for it.`,
        fix: 'Add `responses["200"].content["application/json"].schema` describing the success payload.',
        location: { ...where, pointer: pointerFor(operation, '/responses/200/content') },
      });
    }

    if (!operation.summary) {
      push({
        code: 'O11_SUMMARY_MISSING',
        severity: 'info',
        layer: 'operation',
        title: 'Operation has no summary',
        detail: `${operation.method} ${operation.path} appears in listings as a bare path.`,
        fix: 'Add a one-line `summary` describing what the operation returns.',
        location: { ...where, pointer: pointerFor(operation, '/summary') },
      });
    }
  }

  // One rolled-up line per code that exceeded the cap, so the count is never lost.
  for (const [code, count] of counts) {
    if (count <= MAX_PER_CODE) continue;
    const template = findings.find((f) => f.code === code)!;
    findings.push({
      code: `${code}_MORE`,
      severity: template.severity,
      layer: 'operation',
      title: `${count - MAX_PER_CODE} more operations with ${code}`,
      detail: `${count} operations in total hit this check; the first ${MAX_PER_CODE} are listed above.`,
      fix: template.fix,
      location: { pointer: '/paths' },
      evidence: { code, total: count },
    });
  }

  return findings;
}
