#!/usr/bin/env bash
set -euo pipefail

# Copyright 2024-2026 nirholas. All rights reserved.
# SPDX-License-Identifier: SEE LICENSE IN LICENSE
# https://github.com/nirholas/free-crypto-news
#
# This file is part of free-crypto-news.
# Unauthorized copying, modification, or distribution is strictly prohibited.
# For licensing inquiries: nirholas@users.noreply.github.com

#
# Coverage Ratchet — prevents test coverage from decreasing
# Updates vitest.config.ts thresholds to match current coverage (rounded down to nearest integer)
#
# Usage:
#   ./scripts/coverage-ratchet.sh              # check mode (default)
#   ./scripts/coverage-ratchet.sh --check      # verify coverage meets thresholds
#   ./scripts/coverage-ratchet.sh --update     # ratchet thresholds up to current coverage
#

MODE="${1:---check}"
COVERAGE_JSON="coverage/coverage-summary.json"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

echo "╔═══════════════════════════════════╗"
echo "║     Coverage Ratchet Check        ║"
echo "╚═══════════════════════════════════╝"

# 1. Run coverage if summary doesn't exist
if [ ! -f "$COVERAGE_JSON" ]; then
  echo "📊 Running test coverage..."
  bun run test:coverage 2>/dev/null || true
fi

if [ ! -f "$COVERAGE_JSON" ]; then
  echo "❌ Coverage summary not found at $COVERAGE_JSON"
  echo "   Run 'bun run test:coverage' first"
  exit 1
fi

# 2. Extract current coverage percentages from JSON summary
LINES=$(node -e "const c = require('./$COVERAGE_JSON'); console.log(Math.floor(c.total.lines.pct))")
BRANCHES=$(node -e "const c = require('./$COVERAGE_JSON'); console.log(Math.floor(c.total.branches.pct))")
FUNCTIONS=$(node -e "const c = require('./$COVERAGE_JSON'); console.log(Math.floor(c.total.functions.pct))")
STATEMENTS=$(node -e "const c = require('./$COVERAGE_JSON'); console.log(Math.floor(c.total.statements.pct))")

echo "📊 Current coverage:"
echo "   Lines:      ${LINES}%"
echo "   Branches:   ${BRANCHES}%"
echo "   Functions:  ${FUNCTIONS}%"
echo "   Statements: ${STATEMENTS}%"

# 3. Extract current thresholds from vitest.config.ts
THRESH_LINES=$(grep -oP 'lines:\s*\K\d+' vitest.config.ts)
THRESH_BRANCHES=$(grep -oP 'branches:\s*\K\d+' vitest.config.ts)
THRESH_FUNCTIONS=$(grep -oP 'functions:\s*\K\d+' vitest.config.ts)
THRESH_STATEMENTS=$(grep -oP 'statements:\s*\K\d+' vitest.config.ts)

echo ""
echo "📏 Current thresholds:"
echo "   Lines:      ${THRESH_LINES}%"
echo "   Branches:   ${THRESH_BRANCHES}%"
echo "   Functions:  ${THRESH_FUNCTIONS}%"
echo "   Statements: ${THRESH_STATEMENTS}%"

# 4. Check mode — verify coverage hasn't dropped
if [ "$MODE" = "--check" ]; then
  FAILED=false

  if [ "$LINES" -lt "$THRESH_LINES" ]; then
    echo "❌ Lines coverage dropped: ${LINES}% < ${THRESH_LINES}% threshold"
    FAILED=true
  fi
  if [ "$BRANCHES" -lt "$THRESH_BRANCHES" ]; then
    echo "❌ Branches coverage dropped: ${BRANCHES}% < ${THRESH_BRANCHES}% threshold"
    FAILED=true
  fi
  if [ "$FUNCTIONS" -lt "$THRESH_FUNCTIONS" ]; then
    echo "❌ Functions coverage dropped: ${FUNCTIONS}% < ${THRESH_FUNCTIONS}% threshold"
    FAILED=true
  fi
  if [ "$STATEMENTS" -lt "$THRESH_STATEMENTS" ]; then
    echo "❌ Statements coverage dropped: ${STATEMENTS}% < ${THRESH_STATEMENTS}% threshold"
    FAILED=true
  fi

  if [ "$FAILED" = true ]; then
    echo ""
    echo "💡 Coverage has regressed. Add tests to restore coverage before pushing."
    exit 1
  fi

  echo ""
  echo "✅ Coverage meets or exceeds all thresholds"
  exit 0
fi

# 5. Update mode — ratchet thresholds up to current coverage
if [ "$MODE" = "--update" ]; then
  echo ""
  echo "🔧 Updating thresholds in vitest.config.ts..."

  # Only ratchet UP, never down
  NEW_LINES=$((LINES > THRESH_LINES ? LINES : THRESH_LINES))
  NEW_BRANCHES=$((BRANCHES > THRESH_BRANCHES ? BRANCHES : THRESH_BRANCHES))
  NEW_FUNCTIONS=$((FUNCTIONS > THRESH_FUNCTIONS ? FUNCTIONS : THRESH_FUNCTIONS))
  NEW_STATEMENTS=$((STATEMENTS > THRESH_STATEMENTS ? STATEMENTS : THRESH_STATEMENTS))

  sed -i "s/lines: $THRESH_LINES/lines: $NEW_LINES/" vitest.config.ts
  sed -i "s/branches: $THRESH_BRANCHES/branches: $NEW_BRANCHES/" vitest.config.ts
  sed -i "s/functions: $THRESH_FUNCTIONS/functions: $NEW_FUNCTIONS/" vitest.config.ts
  sed -i "s/statements: $THRESH_STATEMENTS/statements: $NEW_STATEMENTS/" vitest.config.ts

  echo "✅ Thresholds updated:"
  echo "   Lines:      ${THRESH_LINES}% → ${NEW_LINES}%"
  echo "   Branches:   ${THRESH_BRANCHES}% → ${NEW_BRANCHES}%"
  echo "   Functions:  ${THRESH_FUNCTIONS}% → ${NEW_FUNCTIONS}%"
  echo "   Statements: ${THRESH_STATEMENTS}% → ${NEW_STATEMENTS}%"
  echo ""
  echo "📝 Don't forget to commit vitest.config.ts"
fi
