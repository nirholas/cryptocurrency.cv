# 43 — Tighten Knip Dead Code Detection

## Goal

Tighten the Knip configuration to catch more unused files, exports, and dependencies. The current config has broad ignore patterns that let dead code accumulate undetected.

## Context

- **Tool:** Knip v5 — detects unused files, exports, dependencies, and types
- **Config:** `knip.json`
- **Run command:** `bun run audit:unused` (runs `npx knip`)
- **Package manager:** pnpm workspace

### Current knip.json

```json
{
  "$schema": "https://unpkg.com/knip@5/schema.json",
  "entry": [
    "src/app/**/*.tsx",
    "src/app/**/*.ts",
    "src/components/**/*.tsx",
    "src/lib/**/*.ts"
  ],
  "project": [
    "src/**/*.{ts,tsx}"
  ],
  "ignore": [
    "examples/**",
    "sdk/**",
    "widget/**",
    "mcp/**",
    "scripts/**",
    "public/**"
  ],
  "ignoreDependencies": [
    "@axe-core/cli",
    "eslint-plugin-jsx-a11y",
    "lighthouse",
    "pa11y",
    "stylelint",
    "stylelint-config-standard",
    "@typescript-eslint/parser",
    "@typescript-eslint/eslint-plugin",
    "@eslint/eslintrc"
  ]
}
```

## Issues with Current Config

1. **`scripts/**` is ignored** — Scripts can accumulate unused files without detection
2. **No workspace plugin** — pnpm workspace packages aren't analyzed
3. **`ignoreDependencies` is too broad** — Some of these may actually be unused
4. **No `ignoreExportsUsedInFile` setting** — Internal-only exports aren't flagged
5. **No reporters configured** — Only console output, no CI-friendly format
6. **Missing entry points** — `middleware.ts`, `instrumentation.ts`, `ws-server.js`, and config files aren't listed

## Task

### 1. Run Current Knip Audit

```bash
bun run audit:unused
```

Capture the output to understand what Knip currently reports. Note all findings.

### 2. Update knip.json

```json
{
  "$schema": "https://unpkg.com/knip@5/schema.json",
  "entry": [
    "src/app/**/*.tsx",
    "src/app/**/*.ts",
    "src/components/**/*.tsx",
    "src/lib/**/*.ts",
    "middleware.ts",
    "instrumentation.ts",
    "ws-server.js",
    "next.config.js",
    "vitest.config.ts",
    "vitest.setup.ts",
    "drizzle.config.ts",
    "eslint.config.mjs",
    "postcss.config.js",
    "tailwind.config.js",
    "playwright.config.ts"
  ],
  "project": [
    "src/**/*.{ts,tsx}",
    "scripts/**/*.{ts,js,mjs,sh}",
    "e2e/**/*.{ts,tsx}"
  ],
  "ignore": [
    "examples/**",
    "sdk/**",
    "widget/**",
    "mcp/**",
    "public/**",
    "archive/**",
    "cli/**",
    "copilot-extension/**",
    "mobile/**",
    "telegram/**",
    "contracts/**"
  ],
  "ignoreDependencies": [
    "@axe-core/cli",
    "lighthouse",
    "pa11y",
    "stylelint",
    "stylelint-config-standard"
  ],
  "ignoreWorkspaces": [
    "sdk/*",
    "mcp",
    "cli",
    "widget",
    "copilot-extension"
  ],
  "rules": {
    "files": "warn",
    "dependencies": "error",
    "devDependencies": "warn",
    "optionalPeerDependencies": "off",
    "unlisted": "warn",
    "binaries": "warn",
    "unresolved": "error",
    "exports": "warn",
    "types": "warn",
    "duplicates": "warn"
  },
  "paths": {
    "@/*": ["./src/*"]
  }
}
```

### 3. Run Updated Audit

```bash
bun run audit:unused
```

Review the new findings. For each finding:
- **Unused files:** Evaluate if they can be deleted or need to be added to ignore
- **Unused exports:** Remove exports that aren't used anywhere, or mark as intentionally public API
- **Unused dependencies:** Remove with `pnpm remove <package>`
- **Unlisted dependencies:** Add with `pnpm add <package>` or `pnpm add -D <package>`

### 4. Clean Up Findings

For each category of findings:

**Unused dependencies (remove them):**
```bash
pnpm remove <package-name>
```

**Unused exports (remove the export keyword):**
- Change `export function foo()` to `function foo()` if only used locally
- Or delete the function entirely if unused

**Unused files (delete them):**
```bash
rm src/lib/unused-module.ts
```

**False positives (add to ignore):**
- If a file is dynamically imported or used in unusual ways, add it to the `ignore` array
- Document WHY it's ignored with a comment (Knip supports `// knip:ignore` comments)

### 5. Add JSON Reporter for Tracking

Create a script `scripts/knip-report.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

echo "🔍 Running dead code analysis..."
bunx knip --reporter json > coverage/knip-report.json 2>/dev/null || true
bunx knip --reporter compact

ISSUES=$(node -e "const r = require('./coverage/knip-report.json'); console.log(r.issues?.length || 0)" 2>/dev/null || echo "?")
echo ""
echo "📊 Total issues: $ISSUES"
```

### 6. Add to Quality Gate

Read `scripts/quality-gate.sh` and add:

```bash
echo "▸ Checking for unused code..."
bunx knip --no-exit-code || echo "⚠️  Knip found unused code (non-blocking)"
```

## Requirements

- Do NOT delete any files without confirming they're truly unused (check dynamic imports, script usage)
- Do NOT remove dependencies that are used at runtime but not statically imported (e.g., PostCSS plugins, CLI tools)
- The updated `knip.json` must include all config files as entry points
- Scripts directory should now be included in the project (not ignored)
- Run `bun run build` after any deletions to confirm nothing breaks

## Success Criteria

- `bun run audit:unused` reports fewer false positives
- At least 5 truly unused dependencies are identified and removed
- At least 10 unused exports are cleaned up
- All entry points (middleware, config files) are properly tracked
- `bun run build` still succeeds after cleanup
- The quality gate includes a dead code check
