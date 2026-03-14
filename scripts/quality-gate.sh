#!/usr/bin/env bash

# Copyright 2024-2026 nirholas. All rights reserved.
# SPDX-License-Identifier: SEE LICENSE IN LICENSE
# https://github.com/nirholas/free-crypto-news
#
# This file is part of free-crypto-news.
# Unauthorized copying, modification, or distribution is strictly prohibited.
# For licensing inquiries: nirholas@users.noreply.github.com

#
# Quality Gate — local pre-push verification
#
# Runs nine checks in order. Exits non-zero on the first failure unless
# --continue-on-error is passed, in which case every check runs and the
# script exits non-zero if ANY check failed.
#
# Usage:
#   ./scripts/quality-gate.sh                   # fail-fast mode (default)
#   ./scripts/quality-gate.sh --continue        # run all checks, report summary
#   ./scripts/quality-gate.sh --skip-e2e        # skip Playwright E2E tests
#   ./scripts/quality-gate.sh --skip-e2e --continue
#
# The nine gates:
#   1. TypeScript type-check       (tsc --noEmit)
#   2. ESLint                      (eslint src/)
#   3. Prettier formatting         (prettier --check)
#   4. Vitest unit tests + coverage (vitest run --coverage)
#   5. Playwright critical E2E     (playwright test)
#   6. OpenAPI spec validation     (swagger-cli validate)
#   7. Secret detection            (secretlint)
#   8. npm dependency audit        (npm audit --audit-level=high)
#   9. i18n key validation         (node scripts/i18n-check.js)
#

set -uo pipefail

# ── Colours ──────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No colour

# ── Paths ────────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

# ── Args ─────────────────────────────────────────────────────────────────
CONTINUE_ON_ERROR=false
SKIP_E2E=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --continue|--continue-on-error) CONTINUE_ON_ERROR=true; shift ;;
    --skip-e2e) SKIP_E2E=true; shift ;;
    -h|--help)
      echo "Usage: $0 [--continue] [--skip-e2e]"
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}" >&2
      exit 1
      ;;
  esac
done

# ── State ────────────────────────────────────────────────────────────────
TOTAL=10
PASSED=0
FAILED=0
SKIPPED=0
GATE_RESULTS=()
START_TIME=$(date +%s)

# ── Helpers ──────────────────────────────────────────────────────────────
banner() {
  local step=$1 label=$2
  echo ""
  echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BOLD}  [${step}/${TOTAL}] ${label}${NC}"
  echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

run_gate() {
  local step=$1 label=$2
  shift 2
  local cmd=("$@")

  banner "$step" "$label"

  local gate_start
  gate_start=$(date +%s)

  if "${cmd[@]}"; then
    local gate_end
    gate_end=$(date +%s)
    local elapsed=$((gate_end - gate_start))
    echo -e "${GREEN}  ✔ ${label} passed${NC} ${BLUE}(${elapsed}s)${NC}"
    PASSED=$((PASSED + 1))
    GATE_RESULTS+=("${GREEN}✔${NC} ${label} (${elapsed}s)")
    return 0
  else
    local gate_end
    gate_end=$(date +%s)
    local elapsed=$((gate_end - gate_start))
    echo -e "${RED}  ✘ ${label} FAILED${NC} ${BLUE}(${elapsed}s)${NC}"
    FAILED=$((FAILED + 1))
    GATE_RESULTS+=("${RED}✘${NC} ${label} (${elapsed}s)")
    if [[ "$CONTINUE_ON_ERROR" == false ]]; then
      echo ""
      echo -e "${RED}${BOLD}Quality gate aborted — ${label} failed.${NC}"
      echo -e "${YELLOW}Tip: pass --continue to run all gates and see a full report.${NC}"
      exit 1
    fi
    return 1
  fi
}

skip_gate() {
  local step=$1 label=$2
  banner "$step" "$label"
  echo -e "${YELLOW}  ⊘ ${label} SKIPPED${NC}"
  SKIPPED=$((SKIPPED + 1))
  GATE_RESULTS+=("${YELLOW}⊘${NC} ${label} (skipped)")
}

# ── Header ───────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}${CYAN}╔══════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${CYAN}║              free-crypto-news — Quality Gate                        ║${NC}"
echo -e "${BOLD}${CYAN}╚══════════════════════════════════════════════════════════════════════╝${NC}"
echo -e "  ${BLUE}Mode:${NC} $(if $CONTINUE_ON_ERROR; then echo 'continue-on-error'; else echo 'fail-fast'; fi)"
echo -e "  ${BLUE}E2E:${NC}  $(if $SKIP_E2E; then echo 'skipped'; else echo 'enabled'; fi)"

# ─────────────────────────────────────────────────────────────────────────
# Gate 1 — TypeScript type-check
# ─────────────────────────────────────────────────────────────────────────
run_gate 1 "TypeScript type-check" bunx tsc --noEmit

# ─────────────────────────────────────────────────────────────────────────
# Gate 2 — ESLint
# ─────────────────────────────────────────────────────────────────────────
run_gate 2 "ESLint" bun run lint

# ─────────────────────────────────────────────────────────────────────────
# Gate 3 — Prettier formatting check
# ─────────────────────────────────────────────────────────────────────────
run_gate 3 "Prettier formatting" bunx prettier --check "src/**/*.{ts,tsx,css}"

# ─────────────────────────────────────────────────────────────────────────
# Gate 4 — Vitest unit tests + coverage thresholds
# ─────────────────────────────────────────────────────────────────────────
run_gate 4 "Vitest (unit tests + coverage)" bun run test:coverage

# ─────────────────────────────────────────────────────────────────────────
# Gate 5 — Playwright critical E2E specs
# ─────────────────────────────────────────────────────────────────────────
if [[ "$SKIP_E2E" == true ]]; then
  skip_gate 5 "Playwright E2E tests"
else
  run_gate 5 "Playwright E2E tests (critical)" bunx playwright test \
    --project=chromium \
    e2e/home.spec.ts \
    e2e/api.spec.ts \
    e2e/navigation.spec.ts \
    e2e/status.spec.ts
fi

# ─────────────────────────────────────────────────────────────────────────
# Gate 6 — OpenAPI spec validation
# ─────────────────────────────────────────────────────────────────────────
validate_openapi() {
  local spec="chatgpt/openapi.yaml"
  if [[ ! -f "$spec" ]]; then
    echo -e "${RED}  OpenAPI spec not found at $spec${NC}" >&2
    return 1
  fi
  # Use bunx to run swagger-cli without requiring a global install
  bunx --bun @apidevtools/swagger-cli validate "$spec"
}
run_gate 6 "OpenAPI spec validation" validate_openapi

# ─────────────────────────────────────────────────────────────────────────
# Gate 7 — Secret detection (secretlint)
# ─────────────────────────────────────────────────────────────────────────
run_gate 7 "Secret detection (secretlint)" bunx secretlint "**/*"

# ─────────────────────────────────────────────────────────────────────────
# Gate 8 — npm dependency audit
# ─────────────────────────────────────────────────────────────────────────
audit_deps() {
  # Only fail on high/critical severity vulnerabilities
  npm audit --audit-level=high 2>/dev/null || {
    echo -e "${YELLOW}  ⚠ npm audit found high/critical vulnerabilities${NC}"
    return 1
  }
}
run_gate 8 "npm dependency audit" audit_deps

# ─────────────────────────────────────────────────────────────────────────
# Gate 9 — i18n key validation
# ─────────────────────────────────────────────────────────────────────────
run_gate 9 "i18n key validation" node scripts/i18n-check.js

# ─────────────────────────────────────────────────────────────────────────
# Gate 10 — Translation freshness (non-blocking)
# ─────────────────────────────────────────────────────────────────────────
check_translation_freshness() {
  node scripts/translation-freshness.js || {
    echo -e "${YELLOW}  ⚠ Some translations are stale (non-blocking)${NC}"
    return 0
  }
}
run_gate 10 "Translation freshness (non-blocking)" check_translation_freshness

# ── Summary ──────────────────────────────────────────────────────────────
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}  Quality Gate Summary${NC}  (${DURATION}s total)"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
for result in "${GATE_RESULTS[@]}"; do
  echo -e "  $result"
done
echo ""
echo -e "  ${GREEN}Passed: ${PASSED}${NC}  ${RED}Failed: ${FAILED}${NC}  ${YELLOW}Skipped: ${SKIPPED}${NC}"
echo ""

if [[ "$FAILED" -gt 0 ]]; then
  echo -e "${RED}${BOLD}  ✘ Quality gate FAILED — $FAILED check(s) did not pass.${NC}"
  echo ""
  exit 1
else
  echo -e "${GREEN}${BOLD}  ✔ All quality gates passed!${NC}"
  echo ""
  exit 0
fi
