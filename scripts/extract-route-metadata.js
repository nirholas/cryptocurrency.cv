#!/usr/bin/env node

/**
 * Extract metadata from all route.ts files in the manifest.
 * Reads each route file, extracts:
 * - HTTP methods (GET, POST, PUT, DELETE, PATCH)
 * - Query parameters (from searchParams.get() calls)
 * - JSDoc descriptions
 * - Whether it's a streaming endpoint
 *
 * Outputs JSON to stdout for use in generating endpoint-metadata.ts
 */

const fs = require("fs");
const path = require("path");

const API_DIR = path.join(__dirname, "..", "src", "app", "api");
const MANIFEST_PATH = path.join(
  __dirname,
  "..",
  "src",
  "lib",
  "openapi",
  "routes.generated.ts"
);

// Read the manifest to get all routes
const manifestContent = fs.readFileSync(MANIFEST_PATH, "utf-8");
const routeRegex = /"path":\s*"([^"]+)"/g;
const routes = [];
let match;
while ((match = routeRegex.exec(manifestContent)) !== null) {
  routes.push(match[1]);
}

// Convert API path to file path
function apiPathToFilePath(apiPath) {
  // /api/v1/coins -> src/app/api/v1/coins/route.ts
  const segments = apiPath.replace(/^\//, "").split("/");
  return path.join(API_DIR, "..", ...segments, "route.ts");
}

// Extract HTTP methods from a route file
function extractMethods(content) {
  const methods = [];
  const methodRegex =
    /export\s+(?:async\s+)?function\s+(GET|POST|PUT|DELETE|PATCH|OPTIONS)/g;
  let m;
  while ((m = methodRegex.exec(content)) !== null) {
    if (m[1] !== "OPTIONS") methods.push(m[1]);
  }
  return methods.length > 0 ? methods : ["GET"];
}

// Extract searchParams.get() parameter names
function extractSearchParams(content) {
  const params = new Set();

  // Pattern 1: searchParams.get("param") or searchParams.get('param')
  const getRegex = /searchParams\.get\(\s*["']([^"']+)["']\s*\)/g;
  let m;
  while ((m = getRegex.exec(content)) !== null) {
    params.add(m[1]);
  }

  // Pattern 2: searchParams.getAll("param")
  const getAllRegex = /searchParams\.getAll\(\s*["']([^"']+)["']\s*\)/g;
  while ((m = getAllRegex.exec(content)) !== null) {
    params.add(m[1]);
  }

  return [...params];
}

// Extract JSDoc description
function extractJSDoc(content) {
  // Look for the main function's JSDoc or file-level description after copyright
  const jsdocBlocks = content.match(/\/\*\*[\s\S]*?\*\//g) || [];

  for (const block of jsdocBlocks) {
    // Skip copyright blocks
    if (block.includes("@copyright") || block.includes("@license")) continue;
    // Skip auto-generated markers
    if (block.includes("AUTO-GENERATED")) continue;

    // Extract description lines (not @tags)
    const lines = block
      .split("\n")
      .map((l) => l.replace(/^\s*\*\s?/, "").trim())
      .filter(
        (l) =>
          l &&
          !l.startsWith("/**") &&
          !l.startsWith("*/") &&
          !l.startsWith("@") &&
          !l.startsWith("*")
      );

    if (lines.length > 0) {
      return lines.join(" ").trim();
    }
  }

  return null;
}

// Detect if endpoint is streaming (SSE)
function isStreaming(content) {
  return (
    content.includes("ReadableStream") ||
    content.includes("text/event-stream") ||
    content.includes("Server-Sent Events") ||
    content.includes("SSE")
  );
}

// Extract default values for parameters
function extractDefaults(content, paramName) {
  // Pattern: searchParams.get("param") || "default"
  const regex = new RegExp(
    `searchParams\\.get\\(\\s*["']${paramName}["']\\s*\\)\\s*\\|\\|\\s*["']([^"']+)["']`
  );
  const m = content.match(regex);
  if (m) return m[1];

  // Pattern: searchParams.get("param") ?? "default"
  const regex2 = new RegExp(
    `searchParams\\.get\\(\\s*["']${paramName}["']\\s*\\)\\s*\\?\\?\\s*["']([^"']+)["']`
  );
  const m2 = content.match(regex2);
  if (m2) return m2[1];

  return null;
}

// Detect if param is used as number
function isNumericParam(content, paramName) {
  const patterns = [
    new RegExp(`parseInt\\(.*${paramName}`),
    new RegExp(`Number\\(.*${paramName}`),
    new RegExp(`parseFloat\\(.*${paramName}`),
    new RegExp(`\\+\\s*${paramName}`),
    new RegExp(`Math\\.min\\(.*${paramName}`),
    new RegExp(`Math\\.max\\(.*${paramName}`),
  ];
  return patterns.some((p) => p.test(content));
}

// Process all routes
const results = [];
let found = 0;
let missing = 0;

for (const routePath of routes) {
  const filePath = apiPathToFilePath(routePath);

  if (!fs.existsSync(filePath)) {
    missing++;
    results.push({
      path: routePath,
      fileFound: false,
      methods: ["GET"],
      params: [],
      description: null,
      streaming: false,
    });
    continue;
  }

  found++;
  const content = fs.readFileSync(filePath, "utf-8");
  const methods = extractMethods(content);
  const paramNames = extractSearchParams(content);
  const description = extractJSDoc(content);
  const streaming = isStreaming(content);

  const params = paramNames.map((name) => ({
    name,
    type: isNumericParam(content, name) ? "number" : "string",
    default: extractDefaults(content, name),
  }));

  results.push({
    path: routePath,
    fileFound: true,
    methods,
    params,
    description,
    streaming,
  });
}

// Output
console.log(
  JSON.stringify(
    {
      totalRoutes: routes.length,
      filesFound: found,
      filesMissing: missing,
      routes: results,
    },
    null,
    2
  )
);
