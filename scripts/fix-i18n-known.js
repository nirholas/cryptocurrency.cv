#!/usr/bin/env node

/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/cryptocurrency.cv
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

/**
 * Fix known-translatable hardcoded strings found by i18n-audit.js.
 * Wraps them with t('common.*') calls and adds useTranslations import/hook.
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const report = require(path.join(rootDir, 'i18n-audit-report.json'));

const keyMap = {
  Previous: 'previous',
  Next: 'next',
  Refresh: 'refresh',
  Edit: 'edit',
  Cancel: 'cancel',
  Copy: 'copy',
  Share: 'share',
  Close: 'close',
  Search: 'search',
  'View all': 'viewAll',
};

const knownFindings = report.findings.filter(f => f.isKnownTranslatable);

// Group by file
const byFile = {};
knownFindings.forEach(f => {
  (byFile[f.file] = byFile[f.file] || []).push(f);
});

let totalFiles = 0;
let totalChanges = 0;

Object.entries(byFile).forEach(([relFile, findings]) => {
  const filePath = path.join(rootDir, relFile);
  let original;
  try {
    original = fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
    console.log(`SKIP (not found): ${relFile}`);
    return;
  }

  const lines = original.split('\n');
  let changed = false;

  console.log(`\n${relFile}`);

  // Apply replacements at specific line numbers
  findings.forEach(({ line, string: str, type }) => {
    const lineIdx = line - 1;
    const lineContent = lines[lineIdx];
    const key = keyMap[str];
    if (!key) {
      console.log(`  L${line}: no key mapping for "${str}"`);
      return;
    }

    let newLine;
    let matchedIdx = lineIdx;
    const escaped = str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    if (type === 'JSX text') {
      // Try 1: same-line inline: >Previous< or > Previous < etc.
      const jsxPattern = new RegExp(`(>\\s*)${escaped}(\\s*<)`);
      if (jsxPattern.test(lineContent)) {
        newLine = lineContent.replace(jsxPattern, `$1{t('common.${key}')}$2`);
      }
      // Try 2: standalone text node on the NEXT line (audit reports the closing `>` line)
      if (!newLine) {
        for (const candidateIdx of [lineIdx + 1, lineIdx + 2]) {
          const candidate = lines[candidateIdx] ?? '';
          const standalonePattern = new RegExp(`^(\\s*)${escaped}(\\s*)$`);
          if (standalonePattern.test(candidate)) {
            newLine = candidate.replace(standalonePattern, `$1{t('common.${key}')}$2`);
            matchedIdx = candidateIdx;
            break;
          }
        }
      }
    } else if (type === 'String prop') {
      // Match as a string prop value: ="str" or ='str'
      const propPattern = new RegExp(`(=["'])${escaped}(["'])`, 'g');
      if (propPattern.test(lineContent)) {
        newLine = lineContent.replace(propPattern, `={t('common.${key}')}`);
      }
    }

    if (newLine && newLine !== lines[matchedIdx]) {
      lines[matchedIdx] = newLine;
      changed = true;
      totalChanges++;
      console.log(`  ✅ L${line}${matchedIdx !== lineIdx ? `(→L${matchedIdx + 1})` : ''}: "${str}" → {t('common.${key}')}`);
    } else {
      console.log(`  ⚠️  L${line}: "${str}" not matched (${type}) → ${lineContent.trim().slice(0, 80)}`);
    }
  });

  if (!changed) return;

  let content = lines.join('\n');

  // ── 1. Ensure useTranslations is imported ────────────────────────────────
  if (!content.includes('useTranslations')) {
    const nextIntlImport = content.match(/import\s*\{([^}]+)\}\s*from\s*['"]next-intl['"]/);
    if (nextIntlImport) {
      // Append to existing next-intl import
      content = content.replace(
        /import\s*\{([^}]+)\}\s*from\s*['"]next-intl['"]/,
        (match, imp) => {
          const trimmed = imp.replace(/,\s*$/, '').trimEnd();
          return match.replace(imp, `${trimmed}, useTranslations`);
        }
      );
    } else {
      // Add new import after the very first import line
      content = content.replace(/^(import .+)/m, `$1\nimport { useTranslations } from 'next-intl';`);
    }
    console.log(`  + added useTranslations import`);
  }

  // ── 2. Ensure const t = useTranslations('common') exists ────────────────
  if (!content.match(/const\s+t\s*=\s*useTranslations\(['"]common['"]\)/)) {
    // Insert before the first `return (` that is inside a function body
    const returnRe = /(\n([ \t]+))(return\s*\()/;
    if (returnRe.test(content)) {
      content = content.replace(returnRe, (match, nl, indent, ret) => {
        return `\n${indent}const t = useTranslations('common');\n${indent}${ret}`;
      });
      console.log(`  + added const t = useTranslations('common')`);
    } else {
      console.log(`  ⚠️  could not find insertion point for const t`);
    }
  }

  fs.writeFileSync(filePath, content, 'utf8');
  totalFiles++;
  console.log(`  → written`);
});

console.log(`\n══════════════════════════════`);
console.log(`Files updated: ${totalFiles}`);
console.log(`String replacements: ${totalChanges}`);
