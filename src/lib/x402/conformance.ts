/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/cryptocurrency.cv
 */

/**
 * The x402 conformance engine, as used by /api/x402/conformance and the
 * /x402/conformance page.
 *
 * The implementation lives in `sdk/x402-conformance`, which publishes as a
 * standalone package with no runtime dependencies. It is aliased rather than
 * copied so the grade this site reports and the grade `npx
 * @nirholas/x402-conformance` reports are produced by the same code.
 *
 * @module lib/x402/conformance
 * @see ../../../sdk/x402-conformance/README.md
 */

export {
  audit,
  auditChallenge,
  auditDocument,
  auditOperations,
  crossCheck,
  diffReports,
  gradeFor,
  normaliseOrigin,
  readChallenge,
  readOperations,
  renderSarif,
  renderText,
  scoreFindings,
  sortFindings,
} from '@x402-conformance';

export type {
  AuditOptions,
  ConformanceReport,
  DeclaredOperation,
  Finding,
  Grade,
  Layer,
  ObservedChallenge,
  Score,
  Severity,
} from '@x402-conformance';
