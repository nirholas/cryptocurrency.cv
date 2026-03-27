#!/usr/bin/env node

/**
 * Validate that every route in the manifest has endpoint metadata.
 *
 * Exit code 0 = all routes documented.
 * Exit code 1 = missing or invalid metadata.
 *
 * Run: node scripts/validate-endpoint-docs.js
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

// ─── Parse manifest routes ───────────────────────────────────────────────────

const manifestContent = fs.readFileSync(MANIFEST_PATH, "utf-8");
const routeRegex = /"path":\s*"([^"]+)"/g;
const manifestRoutes = new Set();
let m;
while ((m = routeRegex.exec(manifestContent)) !== null) {
  manifestRoutes.add(m[1]);
}

// ─── Parse metadata entries ──────────────────────────────────────────────────

const metadataContent = fs.readFileSync(METADATA_PATH, "utf-8");
const metaRegex = /^\s*"(\/api\/[^"]+)":\s*\{/gm;
const metadataRoutes = new Set();
while ((m = metaRegex.exec(metadataContent)) !== null) {
  metadataRoutes.add(m[1]);
}

// ─── Validate descriptions are non-empty ─────────────────────────────────────

const descRegex = /^\s*"(\/api\/[^"]+)":\s*\{[^}]*description:\s*"([^"]*)"/gm;
const emptyDescriptions = [];
while ((m = descRegex.exec(metadataContent)) !== null) {
  if (!m[2] || m[2].trim().length < 5) {
    emptyDescriptions.push(m[1]);
  }
}

// ─── Check coverage ──────────────────────────────────────────────────────────

const missingInMetadata = [...manifestRoutes].filter(
  (r) => !metadataRoutes.has(r)
);
const extraInMetadata = [...metadataRoutes].filter(
  (r) => !manifestRoutes.has(r)
);

// ─── Report ──────────────────────────────────────────────────────────────────

console.log("╔══════════════════════════════════════════════════════════════╗");
console.log("║           Endpoint Documentation Validation Report          ║");
console.log("╚══════════════════════════════════════════════════════════════╝");
console.log();
console.log(`  Manifest routes:    ${manifestRoutes.size}`);
console.log(`  Documented routes:  ${metadataRoutes.size}`);
console.log(
  `  Coverage:           ${((metadataRoutes.size / manifestRoutes.size) * 100).toFixed(1)}%`
);
console.log();

let hasErrors = false;

if (missingInMetadata.length > 0) {
  hasErrors = true;
  console.log(
    `  ✗ ${missingInMetadata.length} route(s) missing from endpoint metadata:`
  );
  for (const route of missingInMetadata.sort()) {
    console.log(`    - ${route}`);
  }
  console.log();
}

if (emptyDescriptions.length > 0) {
  hasErrors = true;
  console.log(
    `  ✗ ${emptyDescriptions.length} route(s) with empty/short descriptions:`
  );
  for (const route of emptyDescriptions.sort()) {
    console.log(`    - ${route}`);
  }
  console.log();
}

if (extraInMetadata.length > 0) {
  console.log(
    `  ⚠ ${extraInMetadata.length} extra route(s) in metadata not in manifest:`
  );
  for (const route of extraInMetadata.sort()) {
    console.log(`    - ${route}`);
  }
  console.log();
}

if (!hasErrors) {
  console.log("  ✓ All routes documented with valid descriptions");
  console.log("  ✓ 100% documentation coverage");
  console.log();
  process.exit(0);
} else {
  console.log("  Run: node scripts/generate-endpoint-metadata.js");
  console.log("  to regenerate metadata from route files.");
  console.log();
  process.exit(1);
}
