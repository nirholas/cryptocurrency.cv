#!/usr/bin/env node
/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 */

/**
 * Command-line entry point.
 *
 * @module cli
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { audit } from './audit';
import { diffReports, renderSarif, renderText, sortFindings } from './report';
import type { ConformanceReport, Severity } from './types';

const USAGE = `
x402-conformance - audit an x402 origin's discovery contract

  Usage
    x402-conformance <origin> [options]

  Options
    --json                 Emit the full report as JSON
    --sarif                Emit SARIF 2.1.0 for code-scanning upload
    --out <file>           Write the chosen format to a file as well as stdout
    --probe <n>            Probe n operations on the wire (default 12)
    --probe-all            Probe every declared operation
    --no-probe             Audit the discovery document only, touch nothing live
    --baseline <file>      Compare against a saved JSON report and report drift
    --fail-on <level>      Exit 1 at error (default), warn, any, or never
    --timeout <ms>         Per-request timeout (default 10000)
    --verbose              Include info-level findings
    --no-color             Disable ANSI colour (also honours NO_COLOR)
    --help                 Show this message

  Examples
    x402-conformance https://cryptocurrency.cv
    x402-conformance cryptocurrency.cv --probe-all --json --out report.json
    x402-conformance https://example.com --baseline report.json --fail-on warn

  Nothing here sends a payment. Every probe is an ordinary unpaid request.
`;

interface Args {
  origin?: string;
  json: boolean;
  sarif: boolean;
  out?: string;
  probe?: number;
  probeAll: boolean;
  noProbe: boolean;
  baseline?: string;
  failOn: Severity | 'any' | 'never';
  timeout: number;
  verbose: boolean;
  color: boolean;
  help: boolean;
}

function parseArgs(argv: string[]): Args {
  const args: Args = {
    json: false,
    sarif: false,
    probeAll: false,
    noProbe: false,
    failOn: 'error',
    timeout: 10_000,
    verbose: false,
    color: process.stdout.isTTY === true && !process.env.NO_COLOR,
    help: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    switch (arg) {
      case '--help':
      case '-h':
        args.help = true;
        break;
      case '--json':
        args.json = true;
        break;
      case '--sarif':
        args.sarif = true;
        break;
      case '--out':
        args.out = argv[++i];
        break;
      case '--probe':
        args.probe = Number(argv[++i]);
        break;
      case '--probe-all':
        args.probeAll = true;
        break;
      case '--no-probe':
        args.noProbe = true;
        break;
      case '--baseline':
        args.baseline = argv[++i];
        break;
      case '--fail-on':
        args.failOn = (argv[++i] ?? 'error') as Args['failOn'];
        break;
      case '--timeout':
        args.timeout = Number(argv[++i]);
        break;
      case '--verbose':
      case '-v':
        args.verbose = true;
        break;
      case '--no-color':
        args.color = false;
        break;
      case '--color':
        args.color = true;
        break;
      default:
        if (!arg.startsWith('-') && !args.origin) args.origin = arg;
    }
  }
  return args;
}

/** True when the report contains something the caller asked to fail on. */
function shouldFail(report: ConformanceReport, failOn: Args['failOn']): boolean {
  if (failOn === 'never') return false;
  if (failOn === 'any') return report.findings.length > 0;
  if (failOn === 'warn') return report.score.errors > 0 || report.score.warnings > 0;
  return report.score.errors > 0;
}

function renderDrift(baselinePath: string, report: ConformanceReport, color: boolean): { text: string; regressed: boolean } {
  const baseline = JSON.parse(readFileSync(baselinePath, 'utf8')) as ConformanceReport;
  const drift = diffReports(baseline, report);
  const dim = color ? '\u001b[2m' : '';
  const red = color ? '\u001b[31m' : '';
  const green = color ? '\u001b[32m' : '';
  const reset = color ? '\u001b[0m' : '';

  const lines: string[] = ['', `  Drift against ${baselinePath}`, ''];
  const sign = drift.scoreDelta > 0 ? '+' : '';
  lines.push(
    `  Score ${baseline.score.value} -> ${report.score.value} (${sign}${drift.scoreDelta})`,
  );
  lines.push('');

  if (drift.introduced.length === 0 && drift.resolved.length === 0) {
    lines.push(`${dim}  No change. The contract holds.${reset}`);
    lines.push('');
    return { text: lines.join('\n'), regressed: false };
  }

  for (const finding of sortFindings(drift.resolved)) {
    lines.push(`  ${green}fixed${reset}    ${finding.code}  ${finding.location.path ?? ''}`);
  }
  for (const finding of sortFindings(drift.introduced)) {
    lines.push(`  ${red}NEW${reset}      ${finding.code}  ${finding.location.path ?? ''}  ${finding.title}`);
  }
  lines.push('');

  const regressed = drift.introduced.some((f) => f.severity === 'error');
  return { text: lines.join('\n'), regressed };
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (args.help || !args.origin) {
    process.stdout.write(USAGE);
    process.exit(args.origin ? 0 : 1);
  }

  const machineReadable = args.json || args.sarif;
  let lastPhase = '';

  const report = await audit(args.origin, {
    timeoutMs: args.timeout,
    documentOnly: args.noProbe,
    probeAll: args.probeAll,
    probeLimit: args.probe,
    onProgress: machineReadable
      ? undefined
      : (phase, done, total) => {
          if (!process.stderr.isTTY) return;
          if (phase !== lastPhase) lastPhase = phase;
          const label = phase === 'discovery' ? 'reading discovery document' : 'probing live challenges';
          process.stderr.write(`\r  ${label} ${done}/${total}   `);
          if (done === total) process.stderr.write('\r'.padEnd(60) + '\r');
        },
  });

  let body: string;
  if (args.sarif) body = renderSarif(report);
  else if (args.json) body = JSON.stringify(report, null, 2);
  else body = renderText(report, { color: args.color, verbose: args.verbose });

  process.stdout.write(body.endsWith('\n') ? body : `${body}\n`);
  if (args.out) writeFileSync(args.out, body.endsWith('\n') ? body : `${body}\n`, 'utf8');

  let regressed = false;
  if (args.baseline) {
    const drift = renderDrift(args.baseline, report, args.color && !machineReadable);
    if (!machineReadable) process.stdout.write(`${drift.text}\n`);
    regressed = drift.regressed;
  }

  process.exit(shouldFail(report, args.failOn) || regressed ? 1 : 0);
}

main().catch((error: unknown) => {
  process.stderr.write(`x402-conformance: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(2);
});
