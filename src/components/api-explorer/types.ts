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
 * Shared shapes for the API explorer.
 *
 * Everything here is derived from the live OpenAPI document at build/render
 * time (see `normalize.ts`). No endpoint, parameter or price is written by
 * hand: if the spec changes, the explorer changes with it.
 */

/** A JSON Schema node as it appears inside the OpenAPI document. */
export interface SchemaNode {
  type?: string | string[];
  description?: string;
  format?: string;
  default?: unknown;
  const?: unknown;
  enum?: unknown[];
  properties?: Record<string, SchemaNode>;
  required?: string[];
  items?: SchemaNode;
  additionalProperties?: boolean | SchemaNode;
  oneOf?: SchemaNode[];
  anyOf?: SchemaNode[];
  allOf?: SchemaNode[];
  example?: unknown;
}

/** Where a parameter is carried. */
export type ParamLocation = 'path' | 'query' | 'header' | 'cookie';

/** A single request parameter, flattened out of the OpenAPI parameter object. */
export interface ApiParam {
  name: string;
  in: ParamLocation;
  required: boolean;
  /** Rendered type label, e.g. `string`, `number`, `string[]`. */
  type: string;
  description: string;
  /** Stringified default, when the spec declares one. */
  defaultValue?: string;
  /** Allowed values, when the spec constrains them. */
  enumValues?: string[];
}

/** One documented response for an operation. */
export interface ApiResponseDoc {
  status: string;
  description: string;
  mediaType?: string;
  schema?: SchemaNode;
}

/** A request body declaration. */
export interface ApiRequestBody {
  description: string;
  required: boolean;
  mediaType: string;
  schema?: SchemaNode;
}

/** How an endpoint is gated at runtime. */
export type AccessTier = 'free' | 'metered';

/** A single path + method pair: the unit the explorer navigates. */
export interface ApiOperation {
  /** Stable identifier, `<METHOD> <path>`. Used for React keys and selection. */
  id: string;
  path: string;
  /** Uppercase HTTP method. */
  method: string;
  tag: string;
  summary: string;
  operationId?: string;
  access: AccessTier;
  /** Decimal USD price for metered endpoints, e.g. `0.001`. */
  price?: string;
  /** True when the success response is a Server-Sent Events stream. */
  streaming: boolean;
  /** Security scheme names the operation accepts, e.g. `ApiKeyAuth`. */
  auth: string[];
  params: ApiParam[];
  requestBody?: ApiRequestBody;
  responses: ApiResponseDoc[];
}

/** A tag with the operations filed under it, in spec order. */
export interface ApiTagGroup {
  name: string;
  description?: string;
  operations: ApiOperation[];
}

/** The whole document, normalized for rendering. */
export interface ApiSpecModel {
  title: string;
  version: string;
  description: string;
  /** Absolute production base URL used by the generated code samples. */
  serverUrl: string;
  groups: ApiTagGroup[];
  operations: ApiOperation[];
  /** Method names present in the document, ordered by frequency. */
  methods: string[];
  counts: {
    operations: number;
    paths: number;
    free: number;
    metered: number;
  };
  /** Security schemes declared by the document, keyed by name. */
  securitySchemes: Record<string, { in?: string; name?: string; description?: string }>;
}
