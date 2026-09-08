/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 */

/**
 * Document-versus-wire cross-validation.
 *
 * Every other x402 tool checks the discovery document, then separately checks
 * a live challenge, and reports on each. Neither pass can see the failure that
 * actually costs money, which is the two disagreeing: an agent budgets from the
 * document, settles from the wire, and nothing in between ever compares them.
 *
 * @module crosscheck
 */

import type { DeclaredOperation, Finding, ObservedChallenge } from './types';
import { atomicToDecimal, formatUsd, impliedDecimals, isPlausibleDecimals, knownAsset } from './money';
import { canonicalNetwork, networkName } from './networks';

export interface ProbePair {
  declared: DeclaredOperation;
  observed: ObservedChallenge;
  /** A second challenge for the same operation, used for the stability check. */
  repeat?: ObservedChallenge;
  /** A challenge fetched with deliberately invalid arguments. */
  invalidArgs?: ObservedChallenge;
}

export function crossCheck(pairs: ProbePair[]): Finding[] {
  const findings: Finding[] = [];

  for (const { declared, observed, repeat, invalidArgs } of pairs) {
    const where = { path: declared.path, method: declared.method, url: observed.url };

    // Protection agreement. The wire is authoritative, so either direction is
    // a real defect: one overcharges the reader's expectations, the other
    // fails the endpoint at registration.
    if (declared.paid && observed.status !== 402 && !observed.error) {
      findings.push({
        code: 'X01_PAID_BUT_NOT_GATED',
        severity: 'error',
        layer: 'cross',
        title: 'Advertised as paid, served for free',
        detail: `The document prices ${declared.method} ${declared.path} at ${declared.priceUsd !== undefined ? formatUsd(declared.priceUsd) : 'a fee'}, but an unpaid request returned HTTP ${observed.status}. A directory probe reads this as "expected 402, got ${observed.status}" and refuses to list the endpoint.`,
        fix: 'Put the route behind the payment gate, or drop `x-payment-info` and its 402 so it lists as free.',
        location: where,
        evidence: { status: observed.status, declaredPriceUsd: declared.priceUsd },
      });
    }

    if (!declared.paid && observed.status === 402) {
      findings.push({
        code: 'X02_FREE_BUT_GATED',
        severity: 'error',
        layer: 'cross',
        title: 'Advertised as free, charges on call',
        detail: `The document declares no price for ${declared.method} ${declared.path}, but the endpoint answered with a payment challenge. An agent that planned a free call is billed without warning, or simply fails.`,
        fix: 'Add `x-payment-info` and a 402 response to the operation, or exempt the route from the payment gate.',
        location: where,
        evidence: { amountAtomic: observed.amountAtomic },
      });
    }

    if (observed.status !== 402 || !observed.amountAtomic) continue;

    // Price agreement. The two quotes are in different units by design, which
    // is exactly why nobody notices when they stop describing the same number.
    if (declared.priceUsd !== undefined && declared.priceUsd > 0 && declared.priceMode !== 'dynamic') {
      const asset = knownAsset(observed.asset);
      const implied = impliedDecimals(declared.priceUsd, observed.amountAtomic);

      if (asset) {
        const expected = Math.round(declared.priceUsd * 10 ** asset.decimals);
        if (String(expected) !== observed.amountAtomic) {
          const actualUsd = atomicToDecimal(observed.amountAtomic, asset.decimals);
          const ratio = Number(observed.amountAtomic) / expected;
          findings.push({
            code: 'X03_PRICE_DISAGREES',
            severity: 'error',
            layer: 'cross',
            title: `Document and challenge quote different prices (${ratio >= 2 || ratio <= 0.5 ? `${formatRatio(ratio)} apart` : 'rounding aside'})`,
            detail: `The document says ${formatUsd(declared.priceUsd)}; the challenge asks for ${observed.amountAtomic} atomic units of ${asset.symbol}, which is $${actualUsd}. An agent budgets from the first number and is charged the second.`,
            fix: `Quote ${expected} atomic units for ${formatUsd(declared.priceUsd)} of ${asset.symbol} (${asset.decimals} decimals), or correct the declared price.`,
            location: where,
            evidence: {
              declaredUsd: declared.priceUsd,
              observedAtomic: observed.amountAtomic,
              expectedAtomic: String(expected),
              asset: asset.symbol,
              decimals: asset.decimals,
            },
          });
        }
      } else if (implied === null) {
        findings.push({
          code: 'X04_PRICE_RATIO_IMPLAUSIBLE',
          severity: 'error',
          layer: 'cross',
          title: 'Declared price and charged amount are not the same number in two units',
          detail: `The document says ${formatUsd(declared.priceUsd)} and the challenge asks ${observed.amountAtomic}. Honest pairs differ by exactly a power of ten, the token’s decimals. These do not, so one of the two is wrong.`,
          fix: 'Make the atomic amount the declared price multiplied by 10^decimals of the settlement asset.',
          location: where,
          evidence: { declaredUsd: declared.priceUsd, observedAtomic: observed.amountAtomic },
        });
      } else if (!isPlausibleDecimals(implied)) {
        findings.push({
          code: 'X05_PRICE_DECIMALS_IMPLAUSIBLE',
          severity: 'warn',
          layer: 'cross',
          title: `Price ratio implies a ${implied}-decimal token`,
          detail: `${formatUsd(declared.priceUsd)} against ${observed.amountAtomic} atomic units only agrees if the asset has ${implied} decimals, which no common settlement token does.`,
          fix: 'Confirm the settlement asset’s decimals and recompute the atomic amount.',
          location: where,
          evidence: { impliedDecimals: implied, declaredUsd: declared.priceUsd, observedAtomic: observed.amountAtomic },
        });
      }
    }

    // Dynamic pricing has to stay inside the bounds it advertised, or the
    // bounds were never a budget an agent could rely on.
    if (declared.priceMode === 'dynamic' && declared.maxUsd !== undefined) {
      const asset = knownAsset(observed.asset);
      if (asset) {
        const quotedUsd = Number(atomicToDecimal(observed.amountAtomic, asset.decimals));
        if (Number.isFinite(quotedUsd) && quotedUsd > declared.maxUsd) {
          findings.push({
            code: 'X06_DYNAMIC_PRICE_ABOVE_MAX',
            severity: 'error',
            layer: 'cross',
            title: 'Dynamic quote exceeds the advertised ceiling',
            detail: `The document caps ${declared.method} ${declared.path} at ${formatUsd(declared.maxUsd)}; the challenge asks ${formatUsd(quotedUsd)}. An agent that pre-authorised the ceiling cannot pay.`,
            fix: 'Raise `x-payment-info.price.max` to the true ceiling, or cap the runtime quote at it.',
            location: where,
            evidence: { maxUsd: declared.maxUsd, quotedUsd },
          });
        }
      }
    }

    // Schema agreement. The document is what an agent reads before calling;
    // the challenge is what it reads at the door. Divergence means the call it
    // planned is not the call the endpoint accepts.
    if (declared.parameterNames.length > 0 && observed.inputPropertyNames.length > 0) {
      const runtime = new Set(observed.inputPropertyNames);
      const missing = declared.parameterNames.filter((name) => !runtime.has(name));
      const spec = new Set(declared.parameterNames);
      const extra = observed.inputPropertyNames.filter((name) => !spec.has(name));
      if (missing.length > 0 || extra.length > 0) {
        findings.push({
          code: 'X07_INPUT_SCHEMA_DIVERGES',
          severity: 'warn',
          layer: 'cross',
          title: 'Document and challenge describe different inputs',
          detail: [
            missing.length > 0 ? `the document declares ${missing.join(', ')} which the challenge omits` : '',
            extra.length > 0 ? `the challenge advertises ${extra.join(', ')} which the document omits` : '',
          ]
            .filter(Boolean)
            .join('; ')
            .replace(/^./, (c) => c.toUpperCase()) + '.',
          fix: 'Generate both schemas from one source so they cannot drift.',
          location: where,
          evidence: { declaredOnly: missing, runtimeOnly: extra },
        });
      }
    }

    // The document's 402 promise, kept.
    if (observed.status === 402 && !declared.declares402) {
      findings.push({
        code: 'X08_UNDOCUMENTED_CHALLENGE',
        severity: 'warn',
        layer: 'cross',
        title: 'Endpoint returns a 402 the document never mentions',
        detail: `${declared.method} ${declared.path} challenges callers, but its response list has no 402 for a generated client to branch on.`,
        fix: 'Declare the 402 response on the operation.',
        location: where,
      });
    }

    // Probe ordering, measured rather than assumed.
    if (invalidArgs && invalidArgs.status !== 402 && !invalidArgs.error) {
      findings.push({
        code: 'X09_GATE_AFTER_VALIDATION',
        severity: 'error',
        layer: 'cross',
        title: 'Payment gate runs after argument validation',
        detail: `An argument-free call to ${declared.method} ${declared.path} is challenged, but a call with unexpected arguments returned HTTP ${invalidArgs.status}. Registration probes send whatever they like; anything but a 402 fails them.`,
        fix: 'Run the payment gate before request validation, so the challenge is unconditional.',
        location: where,
        evidence: { invalidArgsStatus: invalidArgs.status },
      });
    }

    // Two identical requests, two different prices, and no declared dynamism.
    if (repeat && repeat.status === 402 && declared.priceMode !== 'dynamic') {
      if (repeat.amountAtomic !== observed.amountAtomic) {
        findings.push({
          code: 'X10_QUOTE_UNSTABLE',
          severity: 'error',
          layer: 'cross',
          title: 'Fixed-price endpoint quotes a different amount on each call',
          detail: `Two identical unpaid requests to ${declared.method} ${declared.path} were quoted ${observed.amountAtomic} and ${repeat.amountAtomic}. A client that signs the first and submits after the second is refused.`,
          fix: 'Return a stable quote, or declare `price.mode: "dynamic"` with min and max bounds.',
          location: where,
          evidence: { first: observed.amountAtomic, second: repeat.amountAtomic },
        });
      }
      if (repeat.payTo && observed.payTo && repeat.payTo !== observed.payTo) {
        findings.push({
          code: 'X11_PAYTO_UNSTABLE',
          severity: 'warn',
          layer: 'cross',
          title: 'Payment address changes between calls',
          detail: `${declared.method} ${declared.path} named ${observed.payTo} then ${repeat.payTo}. Rotation is legitimate, but a client that caches the first challenge pays a stale address.`,
          fix: 'Keep the address stable for at least the quoted `maxTimeoutSeconds`, or document the rotation.',
          location: where,
          evidence: { first: observed.payTo, second: repeat.payTo },
        });
      }
    }
  }

  // One network across the whole surface, or a client re-bridges per call.
  const networks = new Set(
    pairs
      .map((p) => canonicalNetwork(p.observed.network))
      .filter((n): n is string => Boolean(n)),
  );
  if (networks.size > 1) {
    findings.push({
      code: 'X12_NETWORKS_INCONSISTENT',
      severity: 'info',
      layer: 'cross',
      title: 'Endpoints settle on more than one chain',
      detail: `Probed endpoints asked for payment on ${[...networks].map((n) => networkName(n) ?? n).join(' and ')}. An agent funded on one has to bridge before it can call the other.`,
      fix: 'Settle the whole surface on one chain, or offer each chain as a separate `accepts` entry so a client can choose.',
      location: {},
      evidence: { networks: [...networks] },
    });
  }

  return findings;
}

function formatRatio(ratio: number): string {
  if (ratio >= 1) return `${ratio >= 1000 ? Math.round(ratio).toLocaleString('en-US') : ratio.toFixed(ratio < 10 ? 1 : 0)}x`;
  return `1/${Math.round(1 / ratio).toLocaleString('en-US')}`;
}
