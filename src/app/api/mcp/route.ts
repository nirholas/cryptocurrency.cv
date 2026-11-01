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
 * Hosted MCP endpoint (Streamable HTTP, stateless).
 *
 * Any MCP client can point at `https://cryptocurrency.cv/api/mcp` with zero
 * install. Each POST carries one JSON-RPC message; a fresh server + transport
 * pair is built per request, so the route needs no session state and scales
 * horizontally. Tools proxy the public REST API on this origin with the same
 * auth and x402 rules as any other anonymous caller.
 *
 * @module app/api/mcp
 */

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import {
  type CallToolResult,
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import {
  DEFAULT_API_BASE,
  MCP_SERVER_NAME,
  MCP_SERVER_VERSION,
  MCP_TOOLS,
  executeTool,
  getTool,
  toolDescriptor,
} from '@/lib/mcp/tools';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const USER_AGENT = 'cryptocurrency.cv-mcp/1.0';

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept, Authorization, Mcp-Session-Id, Mcp-Protocol-Version, Last-Event-ID',
  'Access-Control-Expose-Headers': 'Mcp-Session-Id, Mcp-Protocol-Version',
  'Access-Control-Max-Age': '86400',
};

const RESOURCES = [
  {
    uri: 'cryptocurrency.cv://llms.txt',
    name: 'llms.txt',
    title: 'API guide for LLM agents',
    description: 'Compact guide to the cryptocurrency.cv API: key endpoints, pricing, x402 payment flow.',
    mimeType: 'text/plain',
  },
  {
    uri: 'cryptocurrency.cv://openapi',
    name: 'openapi',
    title: 'OpenAPI 3.1 specification',
    description: 'Machine-readable spec for every REST endpoint, including x402 payment metadata.',
    mimeType: 'application/json',
  },
] as const;

function apiBase(): string {
  return process.env.NEXT_PUBLIC_APP_URL || DEFAULT_API_BASE;
}

async function readLlmsTxt(): Promise<string> {
  try {
    return await readFile(path.join(process.cwd(), 'public', 'llms.txt'), 'utf8');
  } catch {
    const response = await fetch(new URL('/llms.txt', apiBase()), {
      headers: { 'User-Agent': USER_AGENT, Accept: 'text/plain' },
    });
    if (!response.ok) throw new Error(`llms.txt unavailable (HTTP ${response.status})`);
    return response.text();
  }
}

async function readOpenApi(): Promise<string> {
  const response = await fetch(new URL('/api/openapi.json', apiBase()), {
    headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
  });
  if (!response.ok) throw new Error(`openapi.json unavailable (HTTP ${response.status})`);
  return response.text();
}

function createServer(): Server {
  const server = new Server(
    { name: MCP_SERVER_NAME, version: MCP_SERVER_VERSION },
    {
      capabilities: { tools: {}, resources: {} },
      instructions:
        'Crypto news and market data from cryptocurrency.cv. Free tools cover headlines, prices, fear & greed, trending topics, unlocks and exchanges. Tools marked x402 are paid per request; without payment they return a "Payment required" message with the price.',
    },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: MCP_TOOLS.map(toolDescriptor),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request): Promise<CallToolResult> => {
    const tool = getTool(request.params.name);
    if (!tool) {
      return { content: [{ type: 'text', text: `Unknown tool: ${request.params.name}` }], isError: true };
    }
    const result = await executeTool(tool, request.params.arguments ?? {}, { apiBase: apiBase(), userAgent: USER_AGENT });
    return { content: result.content, isError: result.isError };
  });

  server.setRequestHandler(ListResourcesRequestSchema, async () => ({
    resources: RESOURCES.map((resource) => ({ ...resource })),
  }));

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;
    if (uri === RESOURCES[0].uri) {
      return { contents: [{ uri, mimeType: RESOURCES[0].mimeType, text: await readLlmsTxt() }] };
    }
    if (uri === RESOURCES[1].uri) {
      return { contents: [{ uri, mimeType: RESOURCES[1].mimeType, text: await readOpenApi() }] };
    }
    throw new Error(`Unknown resource: ${uri}`);
  });

  return server;
}

function withCors(response: Response): Response {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(CORS_HEADERS)) headers.set(key, value);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

async function handle(request: Request): Promise<Response> {
  const server = createServer();
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  try {
    await server.connect(transport);
    const response = await transport.handleRequest(request);
    return withCors(response);
  } catch (error) {
    console.error('[mcp] request failed:', error);
    return withCors(
      Response.json(
        { jsonrpc: '2.0', error: { code: -32603, message: 'Internal error' }, id: null },
        { status: 500 },
      ),
    );
  } finally {
    // Stateless: tear down after the response has been produced. JSON mode
    // has fully materialised the body by this point.
    void transport.close().catch(() => undefined);
  }
}

export async function POST(request: Request): Promise<Response> {
  return handle(request);
}

export async function GET(request: Request): Promise<Response> {
  return handle(request);
}

export async function DELETE(request: Request): Promise<Response> {
  return handle(request);
}

export function OPTIONS(): Response {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}
