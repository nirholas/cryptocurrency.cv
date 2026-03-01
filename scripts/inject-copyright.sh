#!/usr/bin/env bash
# inject-copyright.sh — Adds copyright/license headers to all project source files.
# Safe to re-run: skips files that already have the header.
# Does NOT modify: node_modules, .next, dist, build, coverage, .git, *.d.ts (generated)

set -euo pipefail

OWNER="nirholas"
YEARS="2024-2026"
REPO="https://github.com/nirholas/free-crypto-news"
LICENSE_LINE="SPDX-License-Identifier: SEE LICENSE IN LICENSE"

# ── JS/TS/TSX/MJS/JSX comment block ──────────────────────────────────────────
JS_HEADER="/**
 * @copyright ${YEARS} ${OWNER}. All rights reserved.
 * @license ${LICENSE_LINE}
 * @see ${REPO}
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */"

# ── Python comment block ─────────────────────────────────────────────────────
PY_HEADER="# Copyright ${YEARS} ${OWNER}. All rights reserved.
# SPDX-License-Identifier: SEE LICENSE IN LICENSE
# ${REPO}
#
# This file is part of free-crypto-news.
# Unauthorized copying, modification, or distribution is strictly prohibited.
# For licensing inquiries: nirholas@users.noreply.github.com"

# ── Go comment block ─────────────────────────────────────────────────────────
GO_HEADER="// Copyright ${YEARS} ${OWNER}. All rights reserved.
// SPDX-License-Identifier: SEE LICENSE IN LICENSE
// ${REPO}
//
// This file is part of free-crypto-news.
// Unauthorized copying, modification, or distribution is strictly prohibited.
// For licensing inquiries: nirholas@users.noreply.github.com"

# ── PHP comment block ────────────────────────────────────────────────────────
PHP_HEADER="/**
 * @copyright ${YEARS} ${OWNER}. All rights reserved.
 * @license ${LICENSE_LINE}
 * @see ${REPO}
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */"

# ── CSS comment block ────────────────────────────────────────────────────────
CSS_HEADER="/*
 * @copyright ${YEARS} ${OWNER}. All rights reserved.
 * @license ${LICENSE_LINE}
 * @see ${REPO}
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 */"

# ── Shell comment block ──────────────────────────────────────────────────────
SH_HEADER="# Copyright ${YEARS} ${OWNER}. All rights reserved.
# SPDX-License-Identifier: SEE LICENSE IN LICENSE
# ${REPO}
#
# This file is part of free-crypto-news.
# Unauthorized copying, modification, or distribution is strictly prohibited."

# ── SQL comment block ────────────────────────────────────────────────────────
SQL_HEADER="-- Copyright ${YEARS} ${OWNER}. All rights reserved.
-- SPDX-License-Identifier: SEE LICENSE IN LICENSE
-- ${REPO}
--
-- This file is part of free-crypto-news.
-- Unauthorized copying, modification, or distribution is strictly prohibited."

# ── Solidity comment block ───────────────────────────────────────────────────
SOL_HEADER="// SPDX-License-Identifier: SEE LICENSE IN LICENSE
// Copyright ${YEARS} ${OWNER}. All rights reserved.
// ${REPO}
//
// This file is part of free-crypto-news.
// Unauthorized copying, modification, or distribution is strictly prohibited."

MARKER="@copyright"
MARKER_ALT="This file is part of free-crypto-news"
COUNT=0
SKIPPED=0

inject_header() {
  local file="$1"
  local header="$2"
  local ext="$3"

  # Skip if already has our copyright header
  if head -20 "$file" | grep -q "$MARKER" 2>/dev/null || head -20 "$file" | grep -q "$MARKER_ALT" 2>/dev/null; then
    ((SKIPPED++))
    return
  fi

  local tmpfile
  tmpfile=$(mktemp)

  # Handle shebang lines — preserve them at the top
  if head -1 "$file" | grep -q '^#!'; then
    head -1 "$file" > "$tmpfile"
    echo "" >> "$tmpfile"
    echo "$header" >> "$tmpfile"
    echo "" >> "$tmpfile"
    tail -n +2 "$file" >> "$tmpfile"
  # Handle 'use client' / 'use server' directives — must stay at top
  elif head -1 "$file" | grep -qE "^['\"]use (client|server)['\"];?\s*$"; then
    head -1 "$file" > "$tmpfile"
    echo "" >> "$tmpfile"
    echo "$header" >> "$tmpfile"
    echo "" >> "$tmpfile"
    tail -n +2 "$file" >> "$tmpfile"
  # Handle PHP opening tag
  elif [ "$ext" = "php" ] && head -1 "$file" | grep -q '^<?php'; then
    head -1 "$file" > "$tmpfile"
    echo "" >> "$tmpfile"
    echo "$header" >> "$tmpfile"
    echo "" >> "$tmpfile"
    tail -n +2 "$file" >> "$tmpfile"
  # Handle Go package declaration — header goes before it
  elif [ "$ext" = "go" ]; then
    echo "$header" > "$tmpfile"
    echo "" >> "$tmpfile"
    cat "$file" >> "$tmpfile"
  # Handle Python with encoding declarations
  elif [ "$ext" = "py" ] && head -1 "$file" | grep -q '^# -\*-'; then
    head -1 "$file" > "$tmpfile"
    echo "" >> "$tmpfile"
    echo "$header" >> "$tmpfile"
    echo "" >> "$tmpfile"
    tail -n +2 "$file" >> "$tmpfile"
  else
    echo "$header" > "$tmpfile"
    echo "" >> "$tmpfile"
    cat "$file" >> "$tmpfile"
  fi

  mv "$tmpfile" "$file"
  ((COUNT++))
}

# Directories and patterns to EXCLUDE
EXCLUDE_DIRS="node_modules|\.next|dist|build|coverage|\.git|\.turbo|\.vercel|__pycache__"
EXCLUDE_FILES="\.d\.ts$|\.min\.js$|\.min\.css$|\.map$|\.lock$|\.snap$"

echo "🔒 Injecting copyright headers into source files..."
echo ""

# Find and process all relevant files
while IFS= read -r -d '' file; do
  # Skip excluded paths
  if echo "$file" | grep -qE "($EXCLUDE_DIRS)"; then
    continue
  fi
  # Skip excluded file types
  if echo "$file" | grep -qE "($EXCLUDE_FILES)"; then
    continue
  fi

  # Determine file extension and header
  ext="${file##*.}"
  case "$ext" in
    ts|tsx|js|jsx|mjs)
      inject_header "$file" "$JS_HEADER" "$ext"
      ;;
    py)
      inject_header "$file" "$PY_HEADER" "$ext"
      ;;
    go)
      inject_header "$file" "$GO_HEADER" "$ext"
      ;;
    php)
      inject_header "$file" "$PHP_HEADER" "$ext"
      ;;
    css)
      inject_header "$file" "$CSS_HEADER" "$ext"
      ;;
    sh)
      inject_header "$file" "$SH_HEADER" "$ext"
      ;;
    sql)
      inject_header "$file" "$SQL_HEADER" "$ext"
      ;;
    sol)
      inject_header "$file" "$SOL_HEADER" "$ext"
      ;;
  esac
done < <(find . -type f \( \
  -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.mjs" \
  -o -name "*.py" -o -name "*.go" -o -name "*.php" \
  -o -name "*.css" -o -name "*.sh" -o -name "*.sql" -o -name "*.sol" \
  \) -print0 2>/dev/null)

echo "✅ Done! Injected headers into $COUNT files ($SKIPPED already had headers)"
