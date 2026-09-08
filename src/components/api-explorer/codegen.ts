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
 * Generates runnable client snippets for a single operation.
 *
 * Every snippet is built from the same `BuiltRequest` the "Try it" panel
 * fires, so what a reader copies is what the button just ran: same URL, same
 * query string, same headers, same body.
 */

import { BODY_METHODS, buildRequest } from './request';
import type { ApiOperation } from './types';

export interface CodeSample {
  id: string;
  label: string;
  /** Language key understood by `CodeBlock`'s highlighter. */
  language: string;
  code: string;
}

export interface SampleOptions {
  op: ApiOperation;
  serverUrl: string;
  values: Record<string, string>;
  /** Raw JSON body text, when the method carries one. */
  body: string;
  /** Optional API key; when present the snippets send `X-API-Key`. */
  apiKey: string;
}

/** Single-quote a value for a POSIX shell. */
function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

function goQuote(value: string): string {
  return JSON.stringify(value);
}

function pyQuote(value: string): string {
  return JSON.stringify(value);
}

/** Headers common to every snippet, in a stable order. */
function snippetHeaders(opts: SampleOptions, hasBody: boolean): [string, string][] {
  const { headers } = buildRequest(opts.op, opts.serverUrl, opts.values);
  const list: [string, string][] = Object.entries(headers);
  if (opts.apiKey.trim()) list.push(['X-API-Key', opts.apiKey.trim()]);
  if (hasBody) list.push(['Content-Type', 'application/json']);
  if (opts.op.streaming) list.push(['Accept', 'text/event-stream']);
  return list;
}

function curlSample(opts: SampleOptions): string {
  const { op } = opts;
  const { url } = buildRequest(op, opts.serverUrl, opts.values);
  const hasBody = BODY_METHODS.has(op.method) && opts.body.trim().length > 0;
  const lines: string[] = [];

  lines.push(`curl ${op.method === 'GET' ? '' : `-X ${op.method} `}${shellQuote(url)}`);
  for (const [key, value] of snippetHeaders(opts, hasBody)) {
    lines.push(`  -H ${shellQuote(`${key}: ${value}`)}`);
  }
  if (hasBody) lines.push(`  -d ${shellQuote(opts.body.replace(/\n\s*/g, ''))}`);
  if (op.streaming) lines.push('  --no-buffer');

  return lines.join(' \\\n');
}

function javascriptSample(opts: SampleOptions): string {
  const { op } = opts;
  const { url } = buildRequest(op, opts.serverUrl, opts.values);
  const hasBody = BODY_METHODS.has(op.method) && opts.body.trim().length > 0;
  const headers = snippetHeaders(opts, hasBody);

  const init: string[] = [];
  if (op.method !== 'GET') init.push(`  method: ${JSON.stringify(op.method)},`);
  if (headers.length) {
    init.push('  headers: {');
    for (const [key, value] of headers) init.push(`    ${JSON.stringify(key)}: ${JSON.stringify(value)},`);
    init.push('  },');
  }
  if (hasBody) init.push(`  body: JSON.stringify(${opts.body.replace(/\n/g, '\n  ')}),`);

  const initBlock = init.length ? `, {\n${init.join('\n')}\n}` : '';

  if (op.streaming) {
    return [
      `const response = await fetch(${JSON.stringify(url)}${initBlock});`,
      'const reader = response.body.getReader();',
      'const decoder = new TextDecoder();',
      '',
      'while (true) {',
      '  const { done, value } = await reader.read();',
      '  if (done) break;',
      '  console.info(decoder.decode(value));',
      '}',
    ].join('\n');
  }

  return [
    `const response = await fetch(${JSON.stringify(url)}${initBlock});`,
    '',
    'if (!response.ok) {',
    '  throw new Error(`Request failed: ${response.status}`);',
    '}',
    '',
    'const data = await response.json();',
    'console.info(data);',
  ].join('\n');
}

function pythonSample(opts: SampleOptions): string {
  const { op } = opts;
  const built = buildRequest(op, opts.serverUrl, opts.values);
  const hasBody = BODY_METHODS.has(op.method) && opts.body.trim().length > 0;
  const headers = snippetHeaders(opts, hasBody);

  const lines: string[] = ['import requests', ''];
  const basePath = `${opts.serverUrl.replace(/\/$/, '')}${built.path}`;
  lines.push(`url = ${pyQuote(basePath)}`);

  const args: string[] = ['url'];

  if (built.query.length) {
    lines.push('params = {');
    for (const [key, value] of built.query) lines.push(`    ${pyQuote(key)}: ${pyQuote(value)},`);
    lines.push('}');
    args.push('params=params');
  }
  if (headers.length) {
    lines.push('headers = {');
    for (const [key, value] of headers) lines.push(`    ${pyQuote(key)}: ${pyQuote(value)},`);
    lines.push('}');
    args.push('headers=headers');
  }
  if (hasBody) {
    lines.push(`payload = ${opts.body.replace(/\btrue\b/g, 'True').replace(/\bfalse\b/g, 'False').replace(/\bnull\b/g, 'None')}`);
    args.push('json=payload');
  }
  args.push('timeout=30');

  lines.push('');
  lines.push(`response = requests.${op.method.toLowerCase()}(${args.join(', ')})`);
  lines.push('response.raise_for_status()');
  lines.push('print(response.json())');

  return lines.join('\n');
}

function goSample(opts: SampleOptions): string {
  const { op } = opts;
  const { url } = buildRequest(op, opts.serverUrl, opts.values);
  const hasBody = BODY_METHODS.has(op.method) && opts.body.trim().length > 0;
  const headers = snippetHeaders(opts, hasBody);

  const imports = ['\t"fmt"', '\t"io"', '\t"net/http"'];
  if (hasBody) imports.unshift('\t"bytes"');

  const lines: string[] = [
    'package main',
    '',
    'import (',
    ...imports,
    ')',
    '',
    'func main() {',
  ];

  if (hasBody) {
    lines.push(`\tpayload := []byte(\`${opts.body}\`)`);
    lines.push(
      `\treq, err := http.NewRequest(${goQuote(op.method)}, ${goQuote(url)}, bytes.NewBuffer(payload))`,
    );
  } else {
    lines.push(`\treq, err := http.NewRequest(${goQuote(op.method)}, ${goQuote(url)}, nil)`);
  }

  lines.push('\tif err != nil {', '\t\tpanic(err)', '\t}');
  for (const [key, value] of headers) {
    lines.push(`\treq.Header.Set(${goQuote(key)}, ${goQuote(value)})`);
  }
  lines.push(
    '',
    '\tresp, err := http.DefaultClient.Do(req)',
    '\tif err != nil {',
    '\t\tpanic(err)',
    '\t}',
    '\tdefer resp.Body.Close()',
    '',
    '\tbody, err := io.ReadAll(resp.Body)',
    '\tif err != nil {',
    '\t\tpanic(err)',
    '\t}',
    '\tfmt.Println(resp.Status)',
    '\tfmt.Println(string(body))',
    '}',
  );

  return lines.join('\n');
}

/** Build every snippet for an operation, in tab order. */
export function buildSamples(opts: SampleOptions): CodeSample[] {
  return [
    { id: 'curl', label: 'cURL', language: 'bash', code: curlSample(opts) },
    { id: 'javascript', label: 'JavaScript', language: 'javascript', code: javascriptSample(opts) },
    { id: 'python', label: 'Python', language: 'python', code: pythonSample(opts) },
    { id: 'go', label: 'Go', language: 'go', code: goSample(opts) },
  ];
}
