#!/usr/bin/env node

/**
 * Translation Freshness Checker
 * Compares modification dates of translated files against their English source.
 * Reports which translations are stale and need updating.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const STALE_THRESHOLD_DAYS = parseInt(
  process.env.STALE_THRESHOLD_DAYS || '30',
  10
);

// ─── README translations ───
const README_SOURCE = 'README.md';
const README_TRANSLATIONS = fs
  .readdirSync('.')
  .filter((f) => f.match(/^README\..+\.md$/) && f !== 'README.md');

// ─── i18n message translations ───
const MESSAGES_DIR = 'messages';
const MESSAGES_SOURCE = path.join(MESSAGES_DIR, 'en.json');

function getLastModifiedDate(filePath) {
  try {
    const date = execSync(`git log -1 --format=%aI -- "${filePath}"`, {
      encoding: 'utf-8',
    }).trim();
    return date ? new Date(date) : null;
  } catch {
    return null;
  }
}

function daysBetween(date1, date2) {
  return Math.floor(Math.abs(date2 - date1) / (1000 * 60 * 60 * 24));
}

function checkFreshness(sourceFile, translationFiles) {
  const sourceDate = getLastModifiedDate(sourceFile);
  if (!sourceDate) {
    console.error(
      `  ⚠️  Could not determine last modified date for ${sourceFile}`
    );
    return { fresh: [], stale: [], unknown: translationFiles };
  }

  const results = { fresh: [], stale: [], unknown: [] };

  for (const file of translationFiles) {
    const translationDate = getLastModifiedDate(file);

    if (!translationDate) {
      results.unknown.push({ file, reason: 'no git history' });
      continue;
    }

    const daysOld = daysBetween(translationDate, sourceDate);

    if (translationDate >= sourceDate) {
      results.fresh.push({ file, daysOld: 0 });
    } else if (daysOld <= STALE_THRESHOLD_DAYS) {
      results.fresh.push({ file, daysOld });
    } else {
      results.stale.push({
        file,
        daysOld,
        lastUpdated: translationDate.toISOString().split('T')[0],
        sourceUpdated: sourceDate.toISOString().split('T')[0],
      });
    }
  }

  return results;
}

// Utility: recursively get all keys from nested JSON
function getAllKeys(obj, prefix = '') {
  let keys = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      keys = keys.concat(getAllKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

// ─── Main ───
console.log('╔═══════════════════════════════════════╗');
console.log('║   Translation Freshness Report        ║');
console.log('╚═══════════════════════════════════════╝');
console.log(`Stale threshold: ${STALE_THRESHOLD_DAYS} days\n`);

// Check READMEs
console.log(`📄 README Translations (source: ${README_SOURCE})`);
console.log('─'.repeat(60));
const readmeResults = checkFreshness(README_SOURCE, README_TRANSLATIONS);

if (readmeResults.stale.length > 0) {
  console.log(`\n  ⚠️  ${readmeResults.stale.length} stale translations:`);
  readmeResults.stale
    .sort((a, b) => b.daysOld - a.daysOld)
    .forEach(({ file, daysOld, lastUpdated }) => {
      console.log(
        `     ${file.padEnd(20)} ${daysOld} days old (last: ${lastUpdated})`
      );
    });
}

console.log(`\n  ✅ ${readmeResults.fresh.length} fresh`);
console.log(`  ⚠️  ${readmeResults.stale.length} stale`);
if (readmeResults.unknown.length > 0) {
  console.log(`  ❓ ${readmeResults.unknown.length} unknown`);
}

// Check i18n messages
let msgStaleCount = 0;
if (fs.existsSync(MESSAGES_DIR)) {
  const messageFiles = fs
    .readdirSync(MESSAGES_DIR)
    .filter((f) => f.endsWith('.json') && f !== 'en.json')
    .map((f) => path.join(MESSAGES_DIR, f));

  console.log(`\n📝 i18n Message Files (source: ${MESSAGES_SOURCE})`);
  console.log('─'.repeat(60));

  // Also check key completeness
  let sourceKeys = [];
  try {
    const sourceData = JSON.parse(fs.readFileSync(MESSAGES_SOURCE, 'utf-8'));
    sourceKeys = getAllKeys(sourceData);
  } catch {}

  const msgResults = checkFreshness(MESSAGES_SOURCE, messageFiles);
  msgStaleCount = msgResults.stale.length;

  if (msgResults.stale.length > 0) {
    console.log(`\n  ⚠️  ${msgResults.stale.length} stale translations:`);
    msgResults.stale
      .sort((a, b) => b.daysOld - a.daysOld)
      .forEach(({ file, daysOld }) => {
        // Check key completeness
        let missingKeys = 0;
        try {
          const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
          const translationKeys = getAllKeys(data);
          missingKeys = sourceKeys.filter(
            (k) => !translationKeys.includes(k)
          ).length;
        } catch {}

        const keyInfo = missingKeys > 0 ? ` (${missingKeys} missing keys)` : '';
        console.log(
          `     ${path.basename(file).padEnd(15)} ${daysOld} days old${keyInfo}`
        );
      });
  }

  console.log(`\n  ✅ ${msgResults.fresh.length} fresh`);
  console.log(`  ⚠️  ${msgResults.stale.length} stale`);
  if (msgResults.unknown.length > 0) {
    console.log(`  ❓ ${msgResults.unknown.length} unknown`);
  }
}

// Summary
const totalStale = readmeResults.stale.length + msgStaleCount;
console.log('\n' + '═'.repeat(60));
if (totalStale > 0) {
  console.log(`\n📋 Action needed: ${totalStale} translation(s) are stale.`);
  if (readmeResults.stale.length > 0) {
    console.log('   Run: bun run docs:translate');
  }
  if (msgStaleCount > 0) {
    console.log('   Run: bun run i18n:translate');
  }
  process.exit(1); // Non-zero exit for CI integration
} else {
  console.log('\n✅ All translations are fresh!');
}
