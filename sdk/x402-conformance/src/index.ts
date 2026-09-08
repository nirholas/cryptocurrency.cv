/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 */

/**
 * x402 conformance auditor.
 *
 * Reads an origin's OpenAPI discovery document, probes the payment challenges
 * it actually returns, and reports where the two disagree. No payment is ever
 * sent: a challenge is what a server hands an anonymous caller, and reading it
 * is exactly what a paying client does first.
 *
 * ```ts
 * import { audit, renderText } from '@nirholas/x402-conformance';
 *
 * const report = await audit('https://cryptocurrency.cv');
 * console.log(renderText(report, { color: true }));
 * if (report.score.errors > 0) process.exit(1);
 * ```
 *
 * @packageDocumentation
 */

export { audit, normaliseOrigin, selectProbeTargets, CHECK_COUNT } from './audit';
export { auditDocument, readOperations, SPEC_CANDIDATES } from './document';
export { auditOperations } from './operation';
export { auditChallenge, readChallenge } from './probe';
export { crossCheck, type ProbePair } from './crosscheck';
export { scoreFindings, gradeFor } from './grade';
export {
  renderText,
  renderSarif,
  diffReports,
  sortFindings,
  type RenderOptions,
  type Regression,
} from './report';
export {
  atomicToDecimal,
  formatUsd,
  impliedDecimals,
  isAtomicInteger,
  isPlausibleDecimals,
  knownAsset,
  looksLikeDecimal,
} from './money';
export {
  canonicalNetwork,
  isCaip2,
  isEvmNetwork,
  isPlausibleAddress,
  isUnspendable,
  legacyAliasFor,
  networkName,
} from './networks';
export type {
  AuditOptions,
  ConformanceReport,
  DeclaredOperation,
  Finding,
  Grade,
  Layer,
  Location,
  ObservedChallenge,
  Score,
  Severity,
} from './types';
