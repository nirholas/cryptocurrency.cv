#!/usr/bin/env node

/**
 * Generate docs/API.md from the endpoint metadata and route manifest.
 *
 * Produces a comprehensive, auto-generated API reference document
 * organized by category with parameters, methods, and descriptions.
 *
 * Run: node scripts/generate-api-docs.js
 */

const fs = require("fs");
const path = require("path");

const MANIFEST_PATH = path.join(
  __dirname,
  "..",
  "src",
  "lib",
  "openapi",
  "routes.generated.ts"
);
const METADATA_PATH = path.join(
  __dirname,
  "..",
  "src",
  "lib",
  "openapi",
  "endpoint-metadata.generated.ts"
);
const OUTPUT_PATH = path.join(__dirname, "..", "docs", "API.md");

// ─── Parse manifest ──────────────────────────────────────────────────────────

const manifestContent = fs.readFileSync(MANIFEST_PATH, "utf-8");
const entryRegex =
  /\{\s*"path":\s*"([^"]+)",\s*"category":\s*"([^"]+)"\s*\}/g;
const routes = [];
let m;
while ((m = entryRegex.exec(manifestContent)) !== null) {
  routes.push({ path: m[1], category: m[2] });
}

// ─── Parse metadata ──────────────────────────────────────────────────────────

const metadataContent = fs.readFileSync(METADATA_PATH, "utf-8");

function getMetadata(routePath) {
  // Find the entry for this path
  const escaped = routePath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(
    `"${escaped}":\\s*\\{([\\s\\S]*?)\\n  \\},`,
    "m"
  );
  const match = metadataContent.match(regex);
  if (!match) return { description: "Endpoint" };

  const block = match[1];

  // Extract description
  const descMatch = block.match(/description:\s*"([^"]+)"/);
  const description = descMatch ? descMatch[1] : "Endpoint";

  // Extract methods
  const methodsMatch = block.match(/methods:\s*\[([^\]]+)\]/);
  const methods = methodsMatch
    ? methodsMatch[1].match(/"(\w+)"/g)?.map((m) => m.replace(/"/g, "")) || [
        "GET",
      ]
    : ["GET"];

  // Extract streaming
  const streaming = block.includes("streaming: true");

  // Extract parameters
  const params = [];
  const paramsMatch = block.match(/parameters:\s*\{([\s\S]*?)\n    \},/);
  if (paramsMatch) {
    const paramsBlock = paramsMatch[1];
    const paramRegex =
      /(\w+):\s*\{[^}]*type:\s*"(\w+)"[^}]*description:\s*"([^"]*)"([^}]*)\}/g;
    let pm;
    while ((pm = paramRegex.exec(paramsBlock)) !== null) {
      const name = pm[1];
      const type = pm[2];
      const desc = pm[3];
      const rest = pm[4];
      const required = rest.includes("required: true");
      const defaultMatch = rest.match(/default:\s*"([^"]*)"/);
      params.push({
        name,
        type,
        description: desc,
        required,
        default: defaultMatch ? defaultMatch[1] : null,
      });
    }
  }

  return { description, methods, streaming, params };
}

// ─── Read pricing data ───────────────────────────────────────────────────────

const pricingPath = path.join(
  __dirname,
  "..",
  "src",
  "lib",
  "x402",
  "pricing.ts"
);
const pricingContent = fs.readFileSync(pricingPath, "utf-8");

function getPrice(routePath) {
  // Check API_PRICING
  const apiMatch = pricingContent.match(
    new RegExp(
      `"${routePath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}":\\s*"([^"]+)"`
    )
  );
  if (apiMatch) return apiMatch[1];

  // Check PREMIUM_PRICING
  const premMatch = pricingContent.match(
    new RegExp(
      `"${routePath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}":\\s*\\{[^}]*price:\\s*([\\d.]+)`
    )
  );
  if (premMatch) return `$${premMatch[1]}`;

  return "$0.001";
}

// ─── Group by category ───────────────────────────────────────────────────────

const categories = {};
for (const { path: routePath, category } of routes) {
  if (!categories[category]) categories[category] = [];
  categories[category].push(routePath);
}

// ─── Generate markdown ───────────────────────────────────────────────────────

const lines = [];

lines.push(`# Crypto Vision API Reference`);
lines.push(``);
lines.push(
  `> Auto-generated from endpoint metadata. Do not edit manually.`
);
lines.push(`> Run: \`node scripts/generate-api-docs.js\``);
lines.push(`>`);
lines.push(`> Generated: ${new Date().toISOString()}`);
lines.push(`> Total endpoints: ${routes.length}`);
lines.push(``);
lines.push(`## Overview`);
lines.push(``);
lines.push(
  `This API provides ${routes.length} endpoints across ${Object.keys(categories).length} categories covering cryptocurrency news, market data, DeFi, derivatives, on-chain analytics, AI analysis, social intelligence, NFTs, multi-chain data, and premium features.`
);
lines.push(``);
lines.push(`**Base URL:** \`https://cryptocurrency.cv\``);
lines.push(``);
lines.push(`**Authentication:** All endpoints require either an API key (\`X-API-Key\` header) or x402 micropayment (\`X-PAYMENT\` header).`);
lines.push(``);
lines.push(`---`);
lines.push(``);
lines.push(`## Table of Contents`);
lines.push(``);

const sortedCategories = Object.keys(categories).sort();
for (const cat of sortedCategories) {
  const anchor = cat.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  lines.push(`- [${cat}](#${anchor}) (${categories[cat].length} endpoints)`);
}

lines.push(``);
lines.push(`---`);
lines.push(``);

// ─── Render each category ────────────────────────────────────────────────────

for (const cat of sortedCategories) {
  lines.push(`## ${cat}`);
  lines.push(``);

  for (const routePath of categories[cat].sort()) {
    const meta = getMetadata(routePath);
    const price = getPrice(routePath);

    // Endpoint header
    for (const method of meta.methods) {
      lines.push(
        `### \`${method} ${routePath}\``
      );
    }
    lines.push(``);
    lines.push(`${meta.description}`);
    lines.push(``);

    // Price badge
    lines.push(`**Price:** \`${price}/request\``);
    if (meta.streaming) {
      lines.push(`  \n**Type:** Server-Sent Events (streaming)`);
    }
    lines.push(``);

    // Parameters table
    if (meta.params && meta.params.length > 0) {
      lines.push(`| Parameter | Type | Required | Default | Description |`);
      lines.push(`|-----------|------|----------|---------|-------------|`);
      for (const p of meta.params) {
        lines.push(
          `| \`${p.name}\` | ${p.type} | ${p.required ? "Yes" : "No"} | ${p.default ? `\`${p.default}\`` : "—"} | ${p.description} |`
        );
      }
      lines.push(``);
    }

    lines.push(`---`);
    lines.push(``);
  }
}

// ─── Summary ─────────────────────────────────────────────────────────────────

lines.push(`## Summary`);
lines.push(``);
lines.push(`| Category | Endpoints |`);
lines.push(`|----------|-----------|`);
for (const cat of sortedCategories) {
  lines.push(`| ${cat} | ${categories[cat].length} |`);
}
lines.push(`| **Total** | **${routes.length}** |`);
lines.push(``);
lines.push(`---`);
lines.push(``);
lines.push(
  `*Generated by [scripts/generate-api-docs.js](../scripts/generate-api-docs.js) from [endpoint-metadata.generated.ts](../src/lib/openapi/endpoint-metadata.generated.ts)*`
);

// ─── Write output ────────────────────────────────────────────────────────────

fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
fs.writeFileSync(OUTPUT_PATH, lines.join("\n"), "utf-8");

console.log(`✓ Generated ${OUTPUT_PATH}`);
console.log(`  ${routes.length} endpoints across ${sortedCategories.length} categories`);
