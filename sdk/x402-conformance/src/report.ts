/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 */

/**
 * Report renderers: terminal, SARIF, and a regression diff.
 *
 * @module report
 */

import type { ConformanceReport, Finding, Severity } from './types';

const SEVERITY_ORDER: Record<Severity, number> = { error: 0, warn: 1, info: 2 };

export interface RenderOptions {
  /** Emit ANSI colour. Defaults to off, so piped output stays clean. */
  color?: boolean;
  /** Show info-level findings. @default false */
  verbose?: boolean;
  /** Terminal width for rules and wrapping. @default 78 */
  width?: number;
}

/** CSI introducer, written as an escape so the source holds no raw control byte. */
const ESC = '\u001b[';
const ANSI = {
  reset: `${ESC}0m`,
  dim: `${ESC}2m`,
  bold: `${ESC}1m`,
  red: `${ESC}31m`,
  yellow: `${ESC}33m`,
  blue: `${ESC}34m`,
  green: `${ESC}32m`,
  gray: `${ESC}90m`,
};

function paint(text: string, codes: string[], enabled: boolean): string {
  return enabled ? `${codes.join('')}${text}${ANSI.reset}` : text;
}

function wrap(text: string, width: number, indent: string): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    if (line && line.length + 1 + word.length > width) {
      lines.push(line);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  }
  if (line) lines.push(line);
  return lines.map((l, i) => (i === 0 ? l : indent + l));
}

export function sortFindings(findings: Finding[]): Finding[] {
  return [...findings].sort((a, b) => {
    const bySeverity = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
    if (bySeverity !== 0) return bySeverity;
    return a.code.localeCompare(b.code);
  });
}

const LAYER_TITLE: Record<Finding['layer'], string> = {
  document: 'Discovery document',
  operation: 'Declared operations',
  runtime: 'Live payment challenges',
  cross: 'Document versus wire',
};

/** Render a human-facing report for a terminal. */
export function renderText(report: ConformanceReport, options: RenderOptions = {}): string {
  const color = options.color ?? false;
  const width = options.width ?? 78;
  const verbose = options.verbose ?? false;
  const out: string[] = [];
  const rule = '-'.repeat(width);

  const gradeColor =
    report.score.grade === 'A' || report.score.grade === 'B'
      ? ANSI.green
      : report.score.grade === 'C'
        ? ANSI.yellow
        : ANSI.red;

  out.push('');
  out.push(paint(`  x402 conformance  ${report.origin}`, [ANSI.bold], color));
  out.push(paint(`  ${rule}`, [ANSI.gray], color));
  out.push('');
  out.push(
    `  ${paint(`[ ${report.score.grade} ]`, [gradeColor, ANSI.bold], color)}  ${paint(
      `${report.score.value}/100`,
      [ANSI.bold],
      color,
    )}   ${report.score.errors} errors, ${report.score.warnings} warnings, ${report.score.infos} notes`,
  );
  out.push('');

  if (report.apiTitle) out.push(`  ${paint('API', [ANSI.gray], color)}        ${report.apiTitle}`);
  if (report.specUrl) out.push(`  ${paint('Document', [ANSI.gray], color)}   ${report.specUrl}`);
  out.push(
    `  ${paint('Operations', [ANSI.gray], color)} ${report.operations.total} (${report.operations.paid} paid, ${report.operations.free} free)`,
  );
  if (report.probes.attempted > 0) {
    out.push(
      `  ${paint('Probed', [ANSI.gray], color)}     ${report.probes.attempted} live${
        report.probes.challenged ? `, ${report.probes.challenged} challenged` : ''
      }${report.probes.failed ? `, ${report.probes.failed} unreachable` : ''}`,
    );
  }
  out.push('');

  const shown = sortFindings(report.findings).filter((f) => verbose || f.severity !== 'info');

  if (shown.length === 0) {
    out.push(paint('  Nothing to fix. Every check passed.', [ANSI.green], color));
    out.push('');
    return out.join('\n');
  }

  let lastLayer: Finding['layer'] | undefined;
  for (const finding of shown) {
    if (finding.layer !== lastLayer) {
      out.push(paint(`  ${LAYER_TITLE[finding.layer]}`, [ANSI.bold], color));
      out.push('');
      lastLayer = finding.layer;
    }

    const badge =
      finding.severity === 'error'
        ? paint('error', [ANSI.red, ANSI.bold], color)
        : finding.severity === 'warn'
          ? paint('warn ', [ANSI.yellow], color)
          : paint('note ', [ANSI.blue], color);

    const where = finding.location.method
      ? `${finding.location.method} ${finding.location.path ?? finding.location.url ?? ''}`.trim()
      : (finding.location.pointer ?? finding.location.url ?? '');

    out.push(`  ${badge}  ${paint(finding.title, [ANSI.bold], color)}`);
    out.push(
      `         ${paint(finding.code, [ANSI.gray], color)}${where ? paint(`  ${where}`, [ANSI.gray], color) : ''}`,
    );
    for (const line of wrap(finding.detail, width - 11, '         ')) out.push(`         ${line}`);
    for (const line of wrap(`Fix: ${finding.fix}`, width - 11, '         ')) {
      out.push(`         ${paint(line, [ANSI.dim], color)}`);
    }
    out.push('');
  }

  const hidden = report.findings.length - shown.length;
  if (hidden > 0) out.push(paint(`  ${hidden} notes hidden. Re-run with --verbose to see them.`, [ANSI.gray], color));
  out.push('');
  return out.join('\n');
}

/**
 * Render SARIF 2.1.0 so a CI run can surface findings as code-scanning
 * annotations rather than as text nobody reads.
 */
export function renderSarif(report: ConformanceReport): string {
  const rules = new Map<string, Finding>();
  for (const finding of report.findings) if (!rules.has(finding.code)) rules.set(finding.code, finding);

  const sarif = {
    $schema: 'https://json.schemastore.org/sarif-2.1.0.json',
    version: '2.1.0',
    runs: [
      {
        tool: {
          driver: {
            name: 'x402-conformance',
            informationUri: 'https://cryptocurrency.cv/x402/conformance',
            version: '1.0.0',
            rules: [...rules.values()].map((finding) => ({
              id: finding.code,
              name: finding.code,
              shortDescription: { text: finding.title },
              fullDescription: { text: finding.detail },
              help: { text: finding.fix },
              defaultConfiguration: {
                level:
                  finding.severity === 'error' ? 'error' : finding.severity === 'warn' ? 'warning' : 'note',
              },
            })),
          },
        },
        results: report.findings.map((finding) => ({
          ruleId: finding.code,
          level: finding.severity === 'error' ? 'error' : finding.severity === 'warn' ? 'warning' : 'note',
          message: { text: `${finding.detail} Fix: ${finding.fix}` },
          locations: [
            {
              physicalLocation: {
                artifactLocation: { uri: report.specUrl ?? report.origin },
                region: { startLine: 1 },
              },
              logicalLocations: finding.location.path
                ? [{ name: `${finding.location.method ?? ''} ${finding.location.path}`.trim(), kind: 'function' }]
                : undefined,
            },
          ],
          properties: { layer: finding.layer, ...finding.evidence },
        })),
      },
    ],
  };
  return JSON.stringify(sarif, null, 2);
}

export interface Regression {
  introduced: Finding[];
  resolved: Finding[];
  scoreDelta: number;
}

/** Fingerprint a finding so the same problem matches across runs. */
function fingerprint(finding: Finding): string {
  return [
    finding.code,
    finding.location.method ?? '',
    finding.location.path ?? finding.location.pointer ?? '',
  ].join('|');
}

/**
 * Compare a report against a stored baseline.
 *
 * A conformance grade only stays useful if a regression is loud. Comparing runs
 * turns the auditor from a one-off score into a gate: a deploy that introduces
 * a new error fails, and one that only fixes things passes even while the
 * absolute score is still poor.
 */
export function diffReports(baseline: ConformanceReport, current: ConformanceReport): Regression {
  const before = new Map(baseline.findings.map((f) => [fingerprint(f), f]));
  const after = new Map(current.findings.map((f) => [fingerprint(f), f]));

  const introduced = [...after].filter(([key]) => !before.has(key)).map(([, f]) => f);
  const resolved = [...before].filter(([key]) => !after.has(key)).map(([, f]) => f);

  return {
    introduced: sortFindings(introduced),
    resolved: sortFindings(resolved),
    scoreDelta: current.score.value - baseline.score.value,
  };
}
