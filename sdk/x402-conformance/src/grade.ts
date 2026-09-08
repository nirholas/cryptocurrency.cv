/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 */

/**
 * Scoring.
 *
 * A grade is only useful if it is hard to game and easy to act on. Errors are
 * weighted by what they cost a paying agent, not by how many times they repeat:
 * one systemic mistake across 400 operations is one problem to fix, so repeats
 * of the same code decay rather than compounding into an automatic F.
 *
 * @module grade
 */

import type { Finding, Grade, Score } from './types';

const WEIGHT: Record<Finding['severity'], number> = {
  error: 12,
  warn: 3,
  info: 0.5,
};

/**
 * Findings that leave nothing to grade. There is no partial credit for an
 * origin an agent cannot discover at all.
 */
const FATAL = new Set(['D00_NO_DISCOVERY_DOCUMENT', 'D06_NO_OPERATIONS']);

/**
 * Findings that make the endpoint unusable or unsafe no matter how good the
 * rest of the surface is. Any one of these caps the grade at D.
 *
 * Each of these costs a paying agent real money rather than convenience: funds
 * sent somewhere unrecoverable, or a settlement amount that is not the price
 * the agent agreed to.
 */
const DISQUALIFYING = new Set([
  'R09_PAYTO_UNSPENDABLE',
  'R06_AMOUNT_IS_DECIMAL',
  'X03_PRICE_DISAGREES',
  'X04_PRICE_RATIO_IMPLAUSIBLE',
  'X06_DYNAMIC_PRICE_ABOVE_MAX',
]);

/** Repeats of one code are the same bug; charge less for each additional hit. */
function decayedWeight(severity: Finding['severity'], occurrence: number): number {
  return WEIGHT[severity] / Math.sqrt(occurrence);
}

export function scoreFindings(findings: Finding[], checksRun: number): Score {
  const occurrences = new Map<string, number>();
  let penalty = 0;
  let capped = false;
  let fatal = false;

  for (const finding of findings) {
    const seen = (occurrences.get(finding.code) ?? 0) + 1;
    occurrences.set(finding.code, seen);
    penalty += decayedWeight(finding.severity, seen);
    if (DISQUALIFYING.has(finding.code)) capped = true;
    if (FATAL.has(finding.code)) fatal = true;
  }

  const errors = findings.filter((f) => f.severity === 'error').length;
  const warnings = findings.filter((f) => f.severity === 'warn').length;
  const infos = findings.filter((f) => f.severity === 'info').length;

  let value = fatal ? 0 : Math.max(0, Math.round(100 - penalty));
  if (capped) value = Math.min(value, 65);

  return {
    value,
    grade: gradeFor(value),
    errors,
    warnings,
    infos,
    passed: Math.max(0, checksRun - occurrences.size),
  };
}

export function gradeFor(value: number): Grade {
  if (value >= 95) return 'A';
  if (value >= 85) return 'B';
  if (value >= 70) return 'C';
  if (value >= 50) return 'D';
  return 'F';
}
