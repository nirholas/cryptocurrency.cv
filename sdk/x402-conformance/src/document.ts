/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 */

/**
 * Discovery-document fetching and static analysis.
 *
 * @module document
 */

import type { DeclaredOperation, Finding } from './types';
import { isCaip2 } from './networks';

/** Where a discovery document is conventionally served, in preference order. */
export const SPEC_CANDIDATES = ['/openapi.json', '/.well-known/openapi.json', '/openapi', '/api/openapi.json'];

const HTTP_METHODS = new Set(['get', 'put', 'post', 'delete', 'patch', 'head', 'options', 'trace']);
const ISO_4217 = /^[A-Z]{3}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Pull the protocol names out of the structured or legacy protocols field. */
function protocolNames(paymentInfo: Record<string, unknown>): string[] {
  const raw = paymentInfo.protocols;
  if (!Array.isArray(raw)) return [];
  const names: string[] = [];
  for (const entry of raw) {
    if (typeof entry === 'string') names.push(entry);
    else if (isRecord(entry)) names.push(...Object.keys(entry));
  }
  return names;
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

/** Read a 2xx JSON response schema, whichever success code it hangs off. */
function hasOutputSchema(operation: Record<string, unknown>): boolean {
  const responses = operation.responses;
  if (!isRecord(responses)) return false;
  for (const [status, response] of Object.entries(responses)) {
    if (!status.startsWith('2') || !isRecord(response)) continue;
    const content = response.content;
    if (!isRecord(content)) continue;
    for (const media of Object.values(content)) {
      if (isRecord(media) && isRecord(media.schema)) return true;
    }
  }
  return false;
}

function hasInputSchema(operation: Record<string, unknown>): boolean {
  const parameters = operation.parameters;
  if (Array.isArray(parameters) && parameters.length > 0) return true;
  const body = operation.requestBody;
  if (!isRecord(body) || !isRecord(body.content)) return false;
  for (const media of Object.values(body.content)) {
    if (isRecord(media) && isRecord(media.schema)) return true;
  }
  return false;
}

function parameterNames(operation: Record<string, unknown>): string[] {
  const names: string[] = [];
  const parameters = operation.parameters;
  if (Array.isArray(parameters)) {
    for (const parameter of parameters) {
      if (isRecord(parameter) && typeof parameter.name === 'string') names.push(parameter.name);
    }
  }
  const body = operation.requestBody;
  if (isRecord(body) && isRecord(body.content)) {
    for (const media of Object.values(body.content)) {
      if (!isRecord(media) || !isRecord(media.schema)) continue;
      const properties = media.schema.properties;
      if (isRecord(properties)) names.push(...Object.keys(properties));
    }
  }
  return [...new Set(names)];
}

/** Flatten an OpenAPI document into the operations an agent could call. */
export function readOperations(document: Record<string, unknown>): DeclaredOperation[] {
  const paths = document.paths;
  if (!isRecord(paths)) return [];

  const operations: DeclaredOperation[] = [];
  for (const [path, item] of Object.entries(paths)) {
    if (!isRecord(item)) continue;
    for (const [method, operation] of Object.entries(item)) {
      if (!HTTP_METHODS.has(method) || !isRecord(operation)) continue;

      const paymentInfo = isRecord(operation['x-payment-info']) ? operation['x-payment-info'] : undefined;
      const structuredPrice = paymentInfo && isRecord(paymentInfo.price) ? paymentInfo.price : undefined;
      const security = operation.security;

      // Legacy shape keeps the price and mode flat on x-payment-info itself.
      const priceUsd = structuredPrice
        ? asNumber(structuredPrice.amount)
        : paymentInfo
          ? asNumber(paymentInfo.price)
          : undefined;

      operations.push({
        path,
        method: method.toUpperCase(),
        operationId: typeof operation.operationId === 'string' ? operation.operationId : undefined,
        summary: typeof operation.summary === 'string' ? operation.summary : undefined,
        paid: Boolean(paymentInfo),
        priceUsd,
        priceMode: structuredPrice
          ? typeof structuredPrice.mode === 'string'
            ? structuredPrice.mode
            : undefined
          : typeof paymentInfo?.pricingMode === 'string'
            ? paymentInfo.pricingMode
            : undefined,
        currency: structuredPrice && typeof structuredPrice.currency === 'string' ? structuredPrice.currency : undefined,
        minUsd: structuredPrice ? asNumber(structuredPrice.min) : asNumber(paymentInfo?.minPrice),
        maxUsd: structuredPrice ? asNumber(structuredPrice.max) : asNumber(paymentInfo?.maxPrice),
        protocols: paymentInfo ? protocolNames(paymentInfo) : [],
        hasInputSchema: hasInputSchema(operation),
        hasOutputSchema: hasOutputSchema(operation),
        parameterNames: parameterNames(operation),
        explicitlyPublic: Array.isArray(security) && security.length === 0,
        declares402: isRecord(operation.responses) && '402' in operation.responses,
      });
    }
  }
  return operations;
}

/** Whole-document checks: the fields every reader needs before anything else. */
export function auditDocument(document: Record<string, unknown>, origin: string): Finding[] {
  const findings: Finding[] = [];
  const info = isRecord(document.info) ? document.info : undefined;

  if (typeof document.openapi !== 'string' || !/^3\./.test(document.openapi)) {
    findings.push({
      code: 'D01_OPENAPI_VERSION',
      severity: 'error',
      layer: 'document',
      title: 'Document does not declare an OpenAPI 3.x version',
      detail: `Found \`openapi: ${JSON.stringify(document.openapi)}\`.`,
      fix: 'Set `openapi` to "3.1.0" (or another 3.x version) at the top of the document.',
      location: { pointer: '/openapi' },
      evidence: { openapi: document.openapi },
    });
  }

  if (!info || typeof info.title !== 'string' || !info.title.trim()) {
    findings.push({
      code: 'D02_INFO_TITLE',
      severity: 'error',
      layer: 'document',
      title: 'Document has no `info.title`',
      detail: 'Listings and agent prompts use the title to name the API.',
      fix: 'Add `info.title` with the product name agents should see.',
      location: { pointer: '/info/title' },
    });
  }

  if (!info || typeof info.version !== 'string' || !info.version.trim()) {
    findings.push({
      code: 'D03_INFO_VERSION',
      severity: 'error',
      layer: 'document',
      title: 'Document has no `info.version`',
      detail: 'Consumers pin against the version to detect breaking changes.',
      fix: 'Add `info.version`, e.g. "1.0.0".',
      location: { pointer: '/info/version' },
    });
  }

  const guidance = info?.['x-guidance'];
  if (typeof guidance !== 'string' || guidance.trim().length < 40) {
    findings.push({
      code: 'D04_GUIDANCE_MISSING',
      severity: 'warn',
      layer: 'document',
      title: 'Document has no usable `info.x-guidance`',
      detail:
        'Agents are handed this block verbatim as context. Without it they have a route list and no idea which route answers their question.',
      fix: 'Add `info.x-guidance`: what the API is for, how payment works, and the two or three endpoints that answer the most common questions.',
      location: { pointer: '/info/x-guidance' },
    });
  }

  const contact = info && isRecord(info.contact) ? info.contact : undefined;
  if (!contact || (typeof contact.email !== 'string' && typeof contact.url !== 'string')) {
    findings.push({
      code: 'D05_CONTACT_MISSING',
      severity: 'warn',
      layer: 'document',
      title: 'Document has no reachable `info.contact`',
      detail:
        'Ownership of the origin cannot be verified, and nobody can be told when the API breaks or changes price.',
      fix: 'Add `info.contact.email` (preferred) or `info.contact.url`.',
      location: { pointer: '/info/contact' },
    });
  }

  const operations = readOperations(document);
  if (operations.length === 0) {
    findings.push({
      code: 'D06_NO_OPERATIONS',
      severity: 'error',
      layer: 'document',
      title: 'Document declares no operations',
      detail: 'A discovery document with an empty `paths` object lists nothing.',
      fix: 'Add the routes agents should be able to call under `paths`.',
      location: { pointer: '/paths' },
    });
  }

  const seenIds = new Map<string, string[]>();
  for (const operation of operations) {
    if (!operation.operationId) continue;
    const where = `${operation.method} ${operation.path}`;
    seenIds.set(operation.operationId, [...(seenIds.get(operation.operationId) ?? []), where]);
  }
  for (const [id, places] of seenIds) {
    if (places.length < 2) continue;
    findings.push({
      code: 'D07_OPERATION_ID_DUPLICATE',
      severity: 'warn',
      layer: 'document',
      title: `Duplicate operationId \`${id}\``,
      detail: `Declared by ${places.join(' and ')}. Generated clients collide on it and one of the two silently wins.`,
      fix: 'Give each operation a unique `operationId`, e.g. by suffixing the method.',
      location: { pointer: '/paths' },
      evidence: { operationId: id, operations: places },
    });
  }

  const servers = document.servers;
  const serverUrls = Array.isArray(servers)
    ? servers.filter(isRecord).map((s) => (typeof s.url === 'string' ? s.url : '')).filter(Boolean)
    : [];
  if (serverUrls.length === 0) {
    findings.push({
      code: 'D08_SERVERS_MISSING',
      severity: 'warn',
      layer: 'document',
      title: 'Document declares no `servers`',
      detail: 'A consumer that saved the document offline has no base URL to resolve paths against.',
      fix: `Add \`servers: [{ url: "${origin}" }]\`.`,
      location: { pointer: '/servers' },
    });
  } else if (!serverUrls.some((url) => url.replace(/\/$/, '') === origin.replace(/\/$/, ''))) {
    findings.push({
      code: 'D09_SERVER_ORIGIN_MISMATCH',
      severity: 'warn',
      layer: 'document',
      title: 'No declared server matches the origin serving this document',
      detail: `Served from ${origin}, but \`servers\` lists ${serverUrls.join(', ')}. An agent that trusts \`servers\` calls a different host than the one it discovered.`,
      fix: `Add \`${origin}\` to \`servers\`, or serve the document from the host it names.`,
      location: { pointer: '/servers' },
      evidence: { origin, serverUrls },
    });
  }

  // Currency is checked once per document rather than once per operation:
  // 400 identical findings help nobody.
  const badCurrencies = [
    ...new Set(
      operations
        .map((o) => o.currency)
        .filter((c): c is string => typeof c === 'string' && c !== '' && !ISO_4217.test(c)),
    ),
  ];
  for (const currency of badCurrencies) {
    findings.push({
      code: 'D10_CURRENCY_NOT_ISO4217',
      severity: 'warn',
      layer: 'document',
      title: `Price currency \`${currency}\` is not an ISO 4217 code`,
      detail: 'Budgeting agents convert through the currency code and cannot resolve a non-standard one.',
      fix: 'Use a three-letter ISO 4217 code such as USD.',
      location: { pointer: '/paths' },
      evidence: { currency },
    });
  }

  const components = isRecord(document.components) ? document.components : undefined;
  const schemes = components && isRecord(components.securitySchemes) ? components.securitySchemes : undefined;
  const referenced = new Set<string>();
  const paths = isRecord(document.paths) ? document.paths : {};
  for (const item of Object.values(paths)) {
    if (!isRecord(item)) continue;
    for (const [method, operation] of Object.entries(item)) {
      if (!HTTP_METHODS.has(method) || !isRecord(operation)) continue;
      const security = operation.security;
      if (!Array.isArray(security)) continue;
      for (const requirement of security) {
        if (isRecord(requirement)) for (const name of Object.keys(requirement)) referenced.add(name);
      }
    }
  }
  for (const name of referenced) {
    if (schemes && name in schemes) continue;
    findings.push({
      code: 'D11_SECURITY_SCHEME_UNDECLARED',
      severity: 'error',
      layer: 'document',
      title: `Security scheme \`${name}\` is referenced but never declared`,
      detail: 'An operation requires it, and `components.securitySchemes` does not define it, so a client cannot tell what to send.',
      fix: `Declare \`${name}\` under \`components.securitySchemes\`.`,
      location: { pointer: '/components/securitySchemes' },
      evidence: { scheme: name },
    });
  }

  const paid = operations.filter((o) => o.paid);
  if (operations.length > 0 && paid.length === 0) {
    findings.push({
      code: 'D12_NO_PAID_OPERATIONS',
      severity: 'info',
      layer: 'document',
      title: 'No operation is marked as paid',
      detail: 'Every route reads as free. Directories that list paid APIs will show nothing to charge for.',
      fix: 'Add `x-payment-info` to the operations that require payment.',
      location: { pointer: '/paths' },
    });
  }

  // Networks declared statically, if the document bothers to say. Optional, so
  // only the malformed case is reported.
  const declaredNetwork = isRecord(document['x-payment-networks']) ? undefined : document['x-payment-network'];
  if (typeof declaredNetwork === 'string' && !isCaip2(declaredNetwork)) {
    findings.push({
      code: 'D13_NETWORK_NOT_CAIP2',
      severity: 'warn',
      layer: 'document',
      title: `Declared network \`${declaredNetwork}\` is not a CAIP-2 identifier`,
      detail: 'Clients route by CAIP-2. A bare chain name has to be guessed at.',
      fix: 'Use the CAIP-2 form, e.g. `eip155:8453` for Base.',
      location: { pointer: '/x-payment-network' },
    });
  }

  return findings;
}
