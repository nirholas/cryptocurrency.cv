/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 */

/**
 * Core types for the x402 conformance auditor.
 *
 * @module types
 */

/** How badly a finding breaks the contract with a paying agent. */
export type Severity = 'error' | 'warn' | 'info';

/** Which layer a check inspects. */
export type Layer =
  /** The OpenAPI discovery document as a whole. */
  | 'document'
  /** A single declared operation, read statically. */
  | 'operation'
  /** A live payment challenge, read from the wire. */
  | 'runtime'
  /** Agreement between what the document promises and what the wire does. */
  | 'cross';

/** Where a finding lives, precisely enough to jump to it. */
export interface Location {
  /** Route path as written in the document, e.g. `/api/v1/news`. */
  path?: string;
  /** Uppercase HTTP method. */
  method?: string;
  /** JSON pointer into the document or the challenge body. */
  pointer?: string;
  /** The exact URL probed, when the finding came off the wire. */
  url?: string;
}

/** One conformance problem, with everything needed to fix it. */
export interface Finding {
  /** Stable machine code, e.g. `X01_PRICE_DISAGREES`. */
  code: string;
  severity: Severity;
  layer: Layer;
  /** One line, no trailing period. */
  title: string;
  /** What is wrong here specifically, with the observed values. */
  detail: string;
  /** What to change. Imperative, concrete, no "consider". */
  fix: string;
  location: Location;
  /** Raw observed values, for tooling and for the JSON report. */
  evidence?: Record<string, unknown>;
}

/** A route as the discovery document declares it. */
export interface DeclaredOperation {
  path: string;
  method: string;
  operationId?: string;
  summary?: string;
  /** True when the document says this operation costs money. */
  paid: boolean;
  /** Decimal USD, as declared. Absent for free or dynamic-without-bounds. */
  priceUsd?: number;
  priceMode?: string;
  currency?: string;
  minUsd?: number;
  maxUsd?: number;
  protocols: string[];
  hasInputSchema: boolean;
  hasOutputSchema: boolean;
  /** Declared query/path parameter names. */
  parameterNames: string[];
  /** True when `security: []` explicitly marks the operation public. */
  explicitlyPublic: boolean;
  declares402: boolean;
}

/** A payment challenge as the wire actually returned it. */
export interface ObservedChallenge {
  url: string;
  method: string;
  status: number;
  x402Version?: number;
  /** Atomic-unit amount string from the first accepts entry. */
  amountAtomic?: string;
  asset?: string;
  network?: string;
  payTo?: string;
  scheme?: string;
  maxTimeoutSeconds?: number;
  extra?: Record<string, unknown>;
  hasInputSchema: boolean;
  hasOutputSchema: boolean;
  /** Input property names the challenge advertises. */
  inputPropertyNames: string[];
  resourceUrl?: string;
  wwwAuthenticate?: string;
  /** Parsed body, kept for evidence. */
  body?: unknown;
  /** Transport-level failure, when the probe never got a usable response. */
  error?: string;
}

/** Letter grade derived from the weighted score. */
export type Grade = 'A' | 'B' | 'C' | 'D' | 'F';

export interface Score {
  /** 0-100, weighted by severity and by how many checks ran. */
  value: number;
  grade: Grade;
  errors: number;
  warnings: number;
  infos: number;
  /** Number of distinct checks that produced no finding. */
  passed: number;
}

export interface ConformanceReport {
  origin: string;
  /** ISO timestamp. Supplied by the caller in deterministic mode. */
  checkedAt: string;
  /** Where the discovery document was found, if anywhere. */
  specUrl?: string;
  apiTitle?: string;
  documentFound: boolean;
  operations: {
    total: number;
    paid: number;
    free: number;
  };
  probes: {
    attempted: number;
    challenged: number;
    failed: number;
  };
  findings: Finding[];
  score: Score;
}

export interface AuditOptions {
  /**
   * How many operations to probe on the wire. Probing every route on a large
   * API is slow and rude; the sample is chosen deterministically to cover
   * distinct price points, methods and path families.
   *
   * @default 12
   */
  probeLimit?: number;
  /** Probe every declared operation. Overrides `probeLimit`. */
  probeAll?: boolean;
  /** Skip the wire entirely and audit the document only. */
  documentOnly?: boolean;
  /** Per-request timeout in milliseconds. @default 10000 */
  timeoutMs?: number;
  /** Injected for tests and for server-side use behind a proxy. */
  fetchImpl?: typeof fetch;
  /** Injected so reports are reproducible. @default new Date().toISOString() */
  now?: string;
  /** Sent on every probe so operators can identify the traffic. */
  userAgent?: string;
  /** Called as each phase completes, for CLI progress. */
  onProgress?: (phase: string, done: number, total: number) => void;
}
