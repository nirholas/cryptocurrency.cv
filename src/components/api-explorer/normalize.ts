/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

/**
 * Turns the OpenAPI 3.1 document produced by `@/lib/openapi/generator` into the
 * flat, render-ready model the explorer consumes.
 *
 * This runs on the server so the client never parses 450 KB of spec: it
 * receives one array of operations already grouped, sorted and classified.
 *
 * Free vs metered is read straight off the document (`security: []` and the
 * absence of `x-payment-info` mean free). The generator derives both from
 * `FREE_TIER_PATTERNS` / `EXEMPT_PATTERNS` in `@/middleware/config`, which is
 * the same gate the Edge middleware enforces, so the badge in the UI and the
 * 402 at runtime can never disagree.
 */

import type {
  ApiOperation,
  ApiParam,
  ApiRequestBody,
  ApiResponseDoc,
  ApiSpecModel,
  ApiTagGroup,
  ParamLocation,
  SchemaNode,
} from './types';

/** HTTP methods an OpenAPI path item may declare. */
const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'] as const;

/** Display order for the method filter chips. */
const METHOD_ORDER = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

const PARAM_LOCATIONS = new Set<ParamLocation>(['path', 'query', 'header', 'cookie']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

/** Render a schema's type as a short label, e.g. `string`, `object[]`. */
export function schemaTypeLabel(schema: SchemaNode | undefined): string {
  if (!schema) return 'any';
  if (Array.isArray(schema.type)) return schema.type.join(' | ');
  if (schema.type === 'array') return `${schemaTypeLabel(schema.items)}[]`;
  if (schema.type) return schema.format ? `${schema.type} (${schema.format})` : schema.type;
  if (schema.oneOf?.length) return schema.oneOf.map((s) => schemaTypeLabel(s)).join(' | ');
  if (schema.anyOf?.length) return schema.anyOf.map((s) => schemaTypeLabel(s)).join(' | ');
  if (schema.allOf?.length) return 'object';
  if (schema.properties) return 'object';
  if (schema.const !== undefined) return JSON.stringify(schema.const);
  return 'any';
}

function toParam(raw: unknown): ApiParam | null {
  if (!isRecord(raw)) return null;
  const name = asString(raw.name);
  if (!name) return null;
  const location = asString(raw.in) as ParamLocation | undefined;
  const schema = isRecord(raw.schema) ? (raw.schema as SchemaNode) : undefined;
  const enumValues = Array.isArray(schema?.enum)
    ? schema.enum.map((v) => String(v))
    : undefined;

  return {
    name,
    in: location && PARAM_LOCATIONS.has(location) ? location : 'query',
    required: raw.required === true,
    type: schemaTypeLabel(schema),
    description: asString(raw.description) ?? '',
    defaultValue: schema?.default === undefined ? undefined : String(schema.default),
    enumValues: enumValues?.length ? enumValues : undefined,
  };
}

/** Pick the first media type from an OpenAPI `content` map. */
function firstContent(
  content: unknown,
): { mediaType: string; schema?: SchemaNode } | undefined {
  if (!isRecord(content)) return undefined;
  const [mediaType, body] = Object.entries(content)[0] ?? [];
  if (!mediaType) return undefined;
  const schema = isRecord(body) && isRecord(body.schema) ? (body.schema as SchemaNode) : undefined;
  return { mediaType, schema };
}

function toRequestBody(raw: unknown): ApiRequestBody | undefined {
  if (!isRecord(raw)) return undefined;
  const content = firstContent(raw.content);
  if (!content) return undefined;
  return {
    description: asString(raw.description) ?? 'Request payload',
    required: raw.required === true,
    mediaType: content.mediaType,
    schema: content.schema,
  };
}

function toResponses(raw: unknown): ApiResponseDoc[] {
  if (!isRecord(raw)) return [];
  return Object.entries(raw)
    .map(([status, value]) => {
      const body = isRecord(value) ? value : {};
      const content = firstContent(body.content);
      return {
        status,
        description: asString(body.description) ?? '',
        mediaType: content?.mediaType,
        schema: content?.schema,
      };
    })
    .sort((a, b) => a.status.localeCompare(b.status));
}

/** Read the decimal-USD amount out of an `x-payment-info` block. */
function toPrice(paymentInfo: unknown): string | undefined {
  if (!isRecord(paymentInfo)) return undefined;
  const price = paymentInfo.price;
  if (!isRecord(price)) return undefined;
  const amount = price.amount;
  if (typeof amount !== 'string' && typeof amount !== 'number') return undefined;
  const numeric = Number(amount);
  if (!Number.isFinite(numeric)) return undefined;
  // 0.001000 reads as noise; trim to the shortest exact decimal.
  return String(Number(numeric.toFixed(6)));
}

function toAuth(security: unknown): string[] {
  if (!Array.isArray(security)) return [];
  const names = new Set<string>();
  for (const entry of security) {
    if (!isRecord(entry)) continue;
    for (const key of Object.keys(entry)) names.add(key);
  }
  return [...names];
}

/**
 * Normalize a raw OpenAPI document.
 *
 * @param doc The document returned by `generateOpenAPISpec()`.
 * @returns A flat model with operations grouped by tag.
 */
export function normalizeSpec(doc: unknown): ApiSpecModel {
  if (!isRecord(doc)) throw new Error('OpenAPI document is not an object');

  const info = isRecord(doc.info) ? doc.info : {};
  const paths = isRecord(doc.paths) ? doc.paths : {};

  const servers = Array.isArray(doc.servers) ? doc.servers : [];
  const firstServer = servers.find(isRecord);
  const serverUrl = asString(firstServer?.url) ?? 'https://cryptocurrency.cv';

  const tagDescriptions = new Map<string, string>();
  if (Array.isArray(doc.tags)) {
    for (const tag of doc.tags) {
      if (!isRecord(tag)) continue;
      const name = asString(tag.name);
      if (name) tagDescriptions.set(name, asString(tag.description) ?? '');
    }
  }

  const operations: ApiOperation[] = [];
  const methodCounts = new Map<string, number>();

  for (const [path, pathItem] of Object.entries(paths)) {
    if (!isRecord(pathItem)) continue;

    for (const methodKey of HTTP_METHODS) {
      const raw = pathItem[methodKey];
      if (!isRecord(raw)) continue;

      const method = methodKey.toUpperCase();
      const paymentInfo = raw['x-payment-info'];
      const price = toPrice(paymentInfo);
      const auth = toAuth(raw.security);

      const params = Array.isArray(raw.parameters)
        ? raw.parameters.map(toParam).filter((p): p is ApiParam => p !== null)
        : [];

      const tags = Array.isArray(raw.tags) ? raw.tags.filter((t): t is string => typeof t === 'string') : [];

      operations.push({
        id: `${method} ${path}`,
        path,
        method,
        tag: tags[0] ?? 'Other',
        summary: asString(raw.summary) ?? asString(raw.description) ?? path,
        operationId: asString(raw.operationId),
        access: paymentInfo === undefined && auth.length === 0 ? 'free' : 'metered',
        price,
        streaming: raw['x-streaming'] === true,
        auth,
        params,
        requestBody: toRequestBody(raw.requestBody),
        responses: toResponses(raw.responses),
      });

      methodCounts.set(method, (methodCounts.get(method) ?? 0) + 1);
    }
  }

  operations.sort((a, b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method));

  const groupMap = new Map<string, ApiOperation[]>();
  for (const op of operations) {
    const bucket = groupMap.get(op.tag);
    if (bucket) bucket.push(op);
    else groupMap.set(op.tag, [op]);
  }

  const groups: ApiTagGroup[] = [...groupMap.entries()]
    .map(([name, ops]) => ({
      name,
      description: tagDescriptions.get(name) || undefined,
      operations: ops,
    }))
    .sort((a, b) => b.operations.length - a.operations.length || a.name.localeCompare(b.name));

  const securitySchemes: ApiSpecModel['securitySchemes'] = {};
  const components = isRecord(doc.components) ? doc.components : {};
  if (isRecord(components.securitySchemes)) {
    for (const [name, scheme] of Object.entries(components.securitySchemes)) {
      if (!isRecord(scheme)) continue;
      securitySchemes[name] = {
        in: asString(scheme.in),
        name: asString(scheme.name),
        description: asString(scheme.description),
      };
    }
  }

  const methods = [...methodCounts.keys()].sort(
    (a, b) => METHOD_ORDER.indexOf(a) - METHOD_ORDER.indexOf(b),
  );

  return {
    title: asString(info.title) ?? 'API Reference',
    version: asString(info.version) ?? '1.0.0',
    // info.description is one long marketing paragraph; the first sentence is
    // the only part that belongs in a page header.
    description: (asString(info.description) ?? '').split('. ')[0].trim(),
    serverUrl,
    groups,
    operations,
    methods,
    counts: {
      operations: operations.length,
      paths: Object.keys(paths).length,
      free: operations.filter((op) => op.access === 'free').length,
      metered: operations.filter((op) => op.access === 'metered').length,
    },
    securitySchemes,
  };
}
