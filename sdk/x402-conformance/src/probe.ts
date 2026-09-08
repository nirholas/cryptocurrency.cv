/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 */

/**
 * Runtime payment-challenge probing.
 *
 * Nothing here spends money. A probe is an ordinary unpaid request: the
 * challenge a server returns to an anonymous caller is the whole contract, and
 * reading it is exactly what a paying client does first.
 *
 * @module probe
 */

import type { Finding, ObservedChallenge } from './types';
import {
  isPlausibleAddress,
  isUnspendable,
  isCaip2,
  legacyAliasFor,
  networkName,
  isEvmNetwork,
} from './networks';
import { isAtomicInteger, looksLikeDecimal, knownAsset } from './money';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function firstString(...values: unknown[]): string | undefined {
  for (const value of values) if (typeof value === 'string' && value) return value;
  return undefined;
}

/**
 * Locate the input schema a v2 reader resolves.
 *
 * The lookup path is exact: `extensions.bazaar.schema.properties.input`, then
 * `.properties.body` or `.properties.queryParams`. A server that puts a
 * perfectly good schema anywhere else has, as far as every v2 client is
 * concerned, published no schema at all.
 */
function readBazaarSchemas(body: unknown): { input?: Record<string, unknown>; output?: Record<string, unknown> } {
  if (!isRecord(body)) return {};
  const extensions = isRecord(body.extensions) ? body.extensions : undefined;
  const bazaar = extensions && isRecord(extensions.bazaar) ? extensions.bazaar : undefined;
  const schema = bazaar && isRecord(bazaar.schema) ? bazaar.schema : undefined;
  const properties = schema && isRecord(schema.properties) ? schema.properties : undefined;
  if (!properties) return {};

  const inputNode = isRecord(properties.input) ? properties.input : undefined;
  const inputProps = inputNode && isRecord(inputNode.properties) ? inputNode.properties : undefined;
  const input =
    inputProps && isRecord(inputProps.body)
      ? inputProps.body
      : inputProps && isRecord(inputProps.queryParams)
        ? inputProps.queryParams
        : undefined;

  const outputNode = isRecord(properties.output) ? properties.output : undefined;
  const outputProps = outputNode && isRecord(outputNode.properties) ? outputNode.properties : undefined;
  const output = outputProps && isRecord(outputProps.example) ? outputProps.example : undefined;

  return { input, output };
}

/** The v1 shape keeps both schemas on the first accepts entry. */
function readAcceptsSchemas(accept: Record<string, unknown> | undefined): {
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
} {
  if (!accept || !isRecord(accept.outputSchema)) return {};
  const schema = accept.outputSchema;
  return {
    input: isRecord(schema.input) ? schema.input : undefined,
    output: isRecord(schema.output) ? schema.output : undefined,
  };
}

function schemaPropertyNames(schema: Record<string, unknown> | undefined): string[] {
  if (!schema) return [];
  if (isRecord(schema.properties)) return Object.keys(schema.properties);
  // The v1 input node nests the call shape under `parameters`.
  if (isRecord(schema.parameters)) return Object.keys(schema.parameters);
  return [];
}

/** Parse a 402 response into the fields every check reads. */
export function readChallenge(url: string, method: string, status: number, body: unknown, headers: Headers | undefined): ObservedChallenge {
  const record = isRecord(body) ? body : undefined;
  const accepts = record && Array.isArray(record.accepts) ? record.accepts.filter(isRecord) : [];
  const first = accepts[0];
  const resource = record && isRecord(record.resource) ? record.resource : undefined;

  const bazaar = readBazaarSchemas(record);
  const legacy = readAcceptsSchemas(first);
  const input = bazaar.input ?? legacy.input;
  const output = bazaar.output ?? legacy.output;

  return {
    url,
    method,
    status,
    x402Version: typeof record?.x402Version === 'number' ? record.x402Version : undefined,
    // v2 calls it `amount`; v1 called it `maxAmountRequired`.
    amountAtomic: firstString(first?.amount, first?.maxAmountRequired),
    asset: firstString(first?.asset),
    network: firstString(first?.network),
    payTo: firstString(first?.payTo, first?.payToAddress),
    scheme: firstString(first?.scheme),
    maxTimeoutSeconds: typeof first?.maxTimeoutSeconds === 'number' ? first.maxTimeoutSeconds : undefined,
    extra: isRecord(first?.extra) ? first.extra : undefined,
    hasInputSchema: Boolean(input),
    hasOutputSchema: Boolean(output),
    inputPropertyNames: schemaPropertyNames(input),
    resourceUrl: firstString(resource?.url, first?.resource),
    wwwAuthenticate: headers?.get('www-authenticate') ?? undefined,
    body,
  };
}

/** Checks that read only the challenge, with no reference to the document. */
export function auditChallenge(challenge: ObservedChallenge): Finding[] {
  const findings: Finding[] = [];
  const where = { url: challenge.url, method: challenge.method };

  if (challenge.error) {
    findings.push({
      code: 'R00_PROBE_FAILED',
      severity: 'error',
      layer: 'runtime',
      title: 'Probe could not reach the endpoint',
      detail: `${challenge.method} ${challenge.url}: ${challenge.error}`,
      fix: 'Make the endpoint reachable over the public internet, without a bot filter in front of the payment challenge.',
      location: where,
    });
    return findings;
  }

  if (challenge.status !== 402) {
    // 400 is worth its own message: it is the single most common registration
    // failure, and the cause is always the same ordering mistake.
    if (challenge.status === 400 || challenge.status === 422) {
      findings.push({
        code: 'R01_VALIDATION_BEFORE_PAYMENT',
        severity: 'error',
        layer: 'runtime',
        title: `Argument validation runs before the payment gate (HTTP ${challenge.status})`,
        detail: `${challenge.method} ${challenge.url} rejected an unpaid probe for having no arguments, so the caller never sees a price.`,
        fix: 'Move the payment gate ahead of body and query validation so an argument-free request still returns 402.',
        location: where,
        evidence: { status: challenge.status },
      });
    } else if (challenge.status === 403 || challenge.status === 401) {
      findings.push({
        code: 'R02_PROBE_BLOCKED',
        severity: 'error',
        layer: 'runtime',
        title: `Unpaid callers are blocked outright (HTTP ${challenge.status})`,
        detail: `${challenge.method} ${challenge.url} answered ${challenge.status}. A bot filter or auth check in front of the payment gate makes the endpoint undiscoverable: the challenge is how a client learns what to pay.`,
        fix: 'Allow unauthenticated requests through to the payment gate. Rate-limit them if needed, but answer 402, not 403.',
        location: where,
        evidence: { status: challenge.status },
      });
    } else {
      findings.push({
        code: 'R03_NO_CHALLENGE',
        severity: 'error',
        layer: 'runtime',
        title: `Expected a 402 challenge, got HTTP ${challenge.status}`,
        detail: `${challenge.method} ${challenge.url} served an unpaid caller without asking for payment.`,
        fix: 'Return a 402 with an `accepts` array to unpaid callers, or stop advertising the operation as paid.',
        location: where,
        evidence: { status: challenge.status },
      });
    }
    return findings;
  }

  if (challenge.x402Version === undefined) {
    findings.push({
      code: 'R04_VERSION_MISSING',
      severity: 'error',
      layer: 'runtime',
      title: 'Challenge does not declare `x402Version`',
      detail: 'Clients branch on the version to know where to read the amount and the schemas.',
      fix: 'Add `x402Version: 2` to the 402 body.',
      location: { ...where, pointer: '/x402Version' },
    });
  }

  if (!challenge.amountAtomic) {
    findings.push({
      code: 'R05_ACCEPTS_EMPTY',
      severity: 'error',
      layer: 'runtime',
      title: 'Challenge carries no payment requirement',
      detail: 'The `accepts` array is missing or empty, so there is nothing for a client to pay.',
      fix: 'Populate `accepts` with at least one entry: scheme, network, amount, asset and payTo.',
      location: { ...where, pointer: '/accepts' },
    });
    return findings;
  }

  if (looksLikeDecimal(challenge.amountAtomic)) {
    findings.push({
      code: 'R06_AMOUNT_IS_DECIMAL',
      severity: 'error',
      layer: 'runtime',
      title: 'Runtime amount is decimal dollars, not atomic units',
      detail: `\`accepts[0].amount\` is "${challenge.amountAtomic}". Runtime amounts are token atomic units: $0.01 of 6-decimal USDC is "10000", not "0.01". A client that takes this literally underpays by a factor of a million and the settlement fails.`,
      fix: 'Multiply the price by 10^decimals and send an integer string.',
      location: { ...where, pointer: '/accepts/0/amount' },
      evidence: { amount: challenge.amountAtomic },
    });
  } else if (!isAtomicInteger(challenge.amountAtomic)) {
    findings.push({
      code: 'R07_AMOUNT_MALFORMED',
      severity: 'error',
      layer: 'runtime',
      title: 'Runtime amount is not an integer string',
      detail: `\`accepts[0].amount\` is "${challenge.amountAtomic}". Atomic amounts must be a plain base-10 integer with no sign, separator or exponent.`,
      fix: 'Send the amount as an unsigned integer string, e.g. "10000".',
      location: { ...where, pointer: '/accepts/0/amount' },
      evidence: { amount: challenge.amountAtomic },
    });
  } else if (challenge.amountAtomic === '0') {
    findings.push({
      code: 'R08_AMOUNT_ZERO',
      severity: 'warn',
      layer: 'runtime',
      title: 'Challenge asks for zero',
      detail: 'A 402 quoting an amount of 0 is a paywall that charges nothing; clients will either error or pay nothing and be refused.',
      fix: 'Charge a positive amount, or serve the route without a payment gate.',
      location: { ...where, pointer: '/accepts/0/amount' },
    });
  }

  // The check that matters most, and that no other tool runs.
  if (isUnspendable(challenge.payTo)) {
    findings.push({
      code: 'R09_PAYTO_UNSPENDABLE',
      severity: 'error',
      layer: 'runtime',
      title: 'Payments are directed to an unspendable address',
      detail: `\`accepts[0].payTo\` is ${challenge.payTo}. Every field in this challenge validates, and any agent that honours it burns its funds with no way to recover them and no way to unlock the endpoint. This is what an unset payment-address environment variable looks like from the outside.`,
      fix: 'Set the receiving wallet address on the deployed service before advertising the endpoint.',
      location: { ...where, pointer: '/accepts/0/payTo' },
      evidence: { payTo: challenge.payTo },
    });
  } else if (!isPlausibleAddress(challenge.payTo, challenge.network)) {
    findings.push({
      code: 'R10_PAYTO_MALFORMED',
      severity: 'error',
      layer: 'runtime',
      title: 'Payment address is not valid for the declared network',
      detail: `\`payTo\` is ${JSON.stringify(challenge.payTo)} on ${challenge.network ?? 'an undeclared network'}. A client cannot construct a transfer to it.`,
      fix: 'Send an address in the network’s own address format.',
      location: { ...where, pointer: '/accepts/0/payTo' },
      evidence: { payTo: challenge.payTo, network: challenge.network },
    });
  }

  if (!challenge.network) {
    findings.push({
      code: 'R11_NETWORK_MISSING',
      severity: 'error',
      layer: 'runtime',
      title: 'Challenge names no network',
      detail: 'Without a chain identifier a client cannot tell which chain to settle on.',
      fix: 'Add `accepts[0].network` as a CAIP-2 identifier, e.g. `eip155:8453`.',
      location: { ...where, pointer: '/accepts/0/network' },
    });
  } else if (!isCaip2(challenge.network)) {
    const alias = legacyAliasFor(challenge.network);
    findings.push({
      code: 'R12_NETWORK_NOT_CAIP2',
      severity: alias ? 'warn' : 'error',
      layer: 'runtime',
      title: `Network \`${challenge.network}\` is not a CAIP-2 identifier`,
      detail: alias
        ? `This is the pre-CAIP-2 name for ${alias}. Clients built against CAIP-2 have to special-case it, and most do not.`
        : 'The value matches no known chain identifier, so a client cannot route the payment.',
      fix: `Send \`${alias ?? 'the CAIP-2 identifier for this chain'}\` instead.`,
      location: { ...where, pointer: '/accepts/0/network' },
      evidence: { network: challenge.network, caip2: alias },
    });
  }

  if (!challenge.asset) {
    findings.push({
      code: 'R13_ASSET_MISSING',
      severity: 'error',
      layer: 'runtime',
      title: 'Challenge names no asset',
      detail: 'A client has no token contract to transfer.',
      fix: 'Add `accepts[0].asset` with the token contract address.',
      location: { ...where, pointer: '/accepts/0/asset' },
    });
  } else if (!isPlausibleAddress(challenge.asset, challenge.network)) {
    findings.push({
      code: 'R14_ASSET_MALFORMED',
      severity: 'error',
      layer: 'runtime',
      title: 'Asset address is not valid for the declared network',
      detail: `\`asset\` is ${JSON.stringify(challenge.asset)} on ${challenge.network ?? 'an undeclared network'}.`,
      fix: 'Send the token contract address in the network’s own address format.',
      location: { ...where, pointer: '/accepts/0/asset' },
      evidence: { asset: challenge.asset, network: challenge.network },
    });
  }

  if (challenge.scheme === 'exact' && isEvmNetwork(challenge.network)) {
    const extra = challenge.extra ?? {};
    if (typeof extra.name !== 'string' || typeof extra.version !== 'string') {
      findings.push({
        code: 'R15_EIP3009_DOMAIN_MISSING',
        severity: 'error',
        layer: 'runtime',
        title: 'Exact-EVM challenge omits the EIP-712 domain fields',
        detail:
          '`exact` on an EVM chain settles through an EIP-3009 authorisation, and the signature is bound to the token’s EIP-712 domain. Without `extra.name` and `extra.version` a wallet signs against the wrong domain and the transfer reverts.',
        fix: 'Add `accepts[0].extra = { name: "<token name>", version: "<token EIP-712 version>" }`.',
        location: { ...where, pointer: '/accepts/0/extra' },
        evidence: { extra },
      });
    }
  }

  if (challenge.maxTimeoutSeconds === undefined) {
    findings.push({
      code: 'R16_TIMEOUT_MISSING',
      severity: 'warn',
      layer: 'runtime',
      title: 'Challenge declares no `maxTimeoutSeconds`',
      detail: 'A client cannot tell how long its signed authorisation stays valid.',
      fix: 'Add `accepts[0].maxTimeoutSeconds`, typically 60.',
      location: { ...where, pointer: '/accepts/0/maxTimeoutSeconds' },
    });
  } else if (challenge.maxTimeoutSeconds < 5 || challenge.maxTimeoutSeconds > 3600) {
    findings.push({
      code: 'R17_TIMEOUT_IMPLAUSIBLE',
      severity: 'warn',
      layer: 'runtime',
      title: `Payment window of ${challenge.maxTimeoutSeconds}s is outside the usable range`,
      detail:
        'Under five seconds no client can sign and submit in time; over an hour the quote outlives any sane price.',
      fix: 'Use a window between 5 and 3600 seconds.',
      location: { ...where, pointer: '/accepts/0/maxTimeoutSeconds' },
      evidence: { maxTimeoutSeconds: challenge.maxTimeoutSeconds },
    });
  }

  if (!challenge.hasInputSchema) {
    findings.push({
      code: 'R18_INPUT_SCHEMA_UNRESOLVABLE',
      severity: 'error',
      layer: 'runtime',
      title: 'No input schema at the path a reader resolves',
      detail:
        'A v2 reader looks at `extensions.bazaar.schema.properties.input.properties.body`, then `.queryParams`; a v1 reader looks at `accepts[0].outputSchema.input`. Neither resolved. A schema anywhere else in the body is invisible.',
      fix: 'Nest the input schema at `extensions.bazaar.schema.properties.input.properties.queryParams` (or `.body` for a JSON payload).',
      location: { ...where, pointer: '/extensions/bazaar/schema/properties/input' },
    });
  }

  if (!challenge.hasOutputSchema) {
    findings.push({
      code: 'R19_OUTPUT_SCHEMA_UNRESOLVABLE',
      severity: 'error',
      layer: 'runtime',
      title: 'No output schema at the path a reader resolves',
      detail:
        'A v2 reader looks at `extensions.bazaar.schema.properties.output.properties.example`; a v1 reader looks at `accepts[0].outputSchema.output`. Neither resolved, so a caller cannot tell what it is buying.',
      fix: 'Nest the response schema at `extensions.bazaar.schema.properties.output.properties.example`.',
      location: { ...where, pointer: '/extensions/bazaar/schema/properties/output' },
    });
  }

  if (challenge.resourceUrl) {
    const declared = challenge.resourceUrl.split('?')[0];
    const probed = challenge.url.split('?')[0];
    if (declared !== probed) {
      findings.push({
        code: 'R20_RESOURCE_URL_MISMATCH',
        severity: 'warn',
        layer: 'runtime',
        title: 'Challenge names a different resource than the one called',
        detail: `Called ${probed}, challenge names ${declared}. A client that pays for the named resource pays for the wrong thing.`,
        fix: 'Build `resource.url` from the request path rather than a fixed value.',
        location: { ...where, pointer: '/resource/url' },
        evidence: { probed, declared },
      });
    }
  }

  if (challenge.asset && !knownAsset(challenge.asset) && challenge.network) {
    findings.push({
      code: 'R21_ASSET_UNRECOGNISED',
      severity: 'info',
      layer: 'runtime',
      title: 'Settlement asset is not a well-known stablecoin',
      detail: `${challenge.asset} on ${networkName(challenge.network) ?? challenge.network} is not in the recognised set. Agents holding only USDC cannot pay.`,
      fix: 'Accept a widely held stablecoin, or add an alternative `accepts` entry that does.',
      location: { ...where, pointer: '/accepts/0/asset' },
      evidence: { asset: challenge.asset, network: challenge.network },
    });
  }

  return findings;
}
