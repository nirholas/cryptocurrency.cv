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
 * Builds the concrete HTTP request an operation describes.
 *
 * One builder feeds both the code samples and the live "Try it" call, so the
 * cURL a reader copies is byte-for-byte the request the button fires.
 */

import type { ApiOperation, ApiParam, SchemaNode } from './types';

/** Methods that carry a JSON request body. */
export const BODY_METHODS = new Set(['POST', 'PUT', 'PATCH']);

export interface BuiltRequest {
  /** Path with `{param}` segments substituted, e.g. `/api/coin/bitcoin`. */
  path: string;
  /** Full absolute URL including the query string. */
  url: string;
  /** Query pairs actually sent, in declaration order. */
  query: [string, string][];
  /** Request headers, excluding ones the runtime adds itself. */
  headers: Record<string, string>;
  /** Whether any path parameter is still unfilled. */
  missingPathParams: string[];
}

/**
 * Fill an operation's parameters with the reader's values.
 *
 * @param op The operation being previewed or called.
 * @param baseUrl Origin the request targets (production for samples, the
 *   current origin for the live call so it stays same-origin).
 * @param values Reader-supplied values keyed by `<in>:<name>`.
 */
export function buildRequest(
  op: ApiOperation,
  baseUrl: string,
  values: Record<string, string>,
): BuiltRequest {
  const missingPathParams: string[] = [];

  const path = op.path.replace(/\{([^}]+)\}/g, (_match, name: string) => {
    const value = values[`path:${name}`]?.trim();
    if (!value) {
      missingPathParams.push(name);
      return `{${name}}`;
    }
    return encodeURIComponent(value);
  });

  const query: [string, string][] = [];
  const headers: Record<string, string> = {};

  for (const param of op.params) {
    const value = values[`${param.in}:${param.name}`]?.trim();
    if (!value) continue;
    if (param.in === 'query') query.push([param.name, value]);
    else if (param.in === 'header') headers[param.name] = value;
  }

  const search = query.length
    ? `?${query.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&')}`
    : '';

  return {
    path,
    url: `${baseUrl.replace(/\/$/, '')}${path}${search}`,
    query,
    headers,
    missingPathParams,
  };
}

/** Seed a value map from the parameter defaults the spec declares. */
export function defaultValues(params: ApiParam[]): Record<string, string> {
  const values: Record<string, string> = {};
  for (const param of params) {
    if (param.defaultValue !== undefined) values[`${param.in}:${param.name}`] = param.defaultValue;
  }
  return values;
}

/** A placeholder value for a schema leaf, used to seed the request body editor. */
function sampleValue(schema: SchemaNode | undefined, depth = 0): unknown {
  if (!schema || depth > 4) return null;
  if (schema.const !== undefined) return schema.const;
  if (schema.default !== undefined) return schema.default;
  if (schema.example !== undefined) return schema.example;
  if (Array.isArray(schema.enum) && schema.enum.length > 0) return schema.enum[0];

  const type = Array.isArray(schema.type) ? schema.type[0] : schema.type;
  switch (type) {
    case 'string':
      return '';
    case 'number':
    case 'integer':
      return 0;
    case 'boolean':
      return false;
    case 'array':
      return [sampleValue(schema.items, depth + 1)];
    case 'object':
    default: {
      if (!schema.properties) return {};
      const out: Record<string, unknown> = {};
      for (const [key, child] of Object.entries(schema.properties)) {
        out[key] = sampleValue(child, depth + 1);
      }
      return out;
    }
  }
}

/** Pretty-printed starter JSON body for an operation, or an empty string. */
export function defaultBody(op: ApiOperation): string {
  if (!BODY_METHODS.has(op.method) || !op.requestBody?.schema) return '';
  return JSON.stringify(sampleValue(op.requestBody.schema), null, 2);
}
