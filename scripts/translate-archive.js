#!/usr/bin/env node
/**
 * Batch-translate archive article summaries into the top-10 most-trafficked locales
 *
 * Reads .jsonl files from archive/articles/, finds articles missing a "translations"
 * field (or missing specific locale keys within it), then calls the Groq API directly
 * to translate each article's summary (or title as fallback) into the target locales.
 *
 * The result is stored back into the JSONL in-place:
 *   article.translations = { "zh-CN": "...", "ja": "...", ... }
 *
 * Usage:
 *   node scripts/translate-archive.js
 *   node scripts/translate-archive.js --locale zh-CN
 *   node scripts/translate-archive.js --file 2025-01.jsonl
 *   node scripts/translate-archive.js --limit 200
 *   node scripts/translate-archive.js --dry-run
 *
 * Env vars:
 *   GROQ_API_KEY   — required (get a free key at https://console.groq.com/keys)
 */

'use strict';

const fs   = require('fs');
const path = require('path');

// ── Config ─────────────────────────────────────────────────────────────────────

const ARCHIVE_DIR    = path.join(__dirname, '..', 'archive', 'articles');
const GROQ_API_URL   = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL     = 'llama-3.3-70b-versatile';
const BATCH_SIZE     = 5;
const BATCH_DELAY_MS = 1000;

/** Top 10 most-trafficked locales (in priority order) */
const DEFAULT_LOCALES = ['zh-CN', 'ja', 'ko', 'es', 'de', 'fr', 'pt', 'ar', 'hi', 'ru'];

/** English display names for the target languages (used in the Groq prompt) */
const LOCALE_NAMES = {
  'zh-CN': 'Simplified Chinese',
  'ja':    'Japanese',
  'ko':    'Korean',
  'es':    'Spanish',
  'de':    'German',
  'fr':    'French',
  'pt':    'Portuguese',
  'ar':    'Arabic',
  'hi':    'Hindi',
  'ru':    'Russian',
};

// ── CLI args ───────────────────────────────────────────────────────────────────

const args = Object.fromEntries(
  process.argv.slice(2).map(a => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k.trim(), v !== undefined ? v : true];
  })
);

// Also support --locale zh-CN (space-separated rather than =)
let singleLocale = null;
{
  const localeIdx = process.argv.indexOf('--locale');
  if (localeIdx !== -1 && process.argv[localeIdx + 1]) {
    singleLocale = process.argv[localeIdx + 1];
  } else if (typeof args.locale === 'string') {
    singleLocale = args.locale;
  }
}

const TARGET_LOCALES = singleLocale ? [singleLocale] : DEFAULT_LOCALES;
const TARGET_FILE    = typeof args.file  === 'string' ? args.file  : null;
const LIMIT          = typeof args.limit === 'string' ? parseInt(args.limit, 10) : Infinity;
const DRY_RUN        = !!args['dry-run'];

// ── Helpers ────────────────────────────────────────────────────────────────────

const sleep = (ms) => new Promise(res => setTimeout(res, ms));

/**
 * Returns the text to translate for an article.
 * Uses article.summary if available, otherwise falls back to article.title.
 */
function getTranslatableText(article) {
  return (article.summary && typeof article.summary === 'string' && article.summary.trim())
    ? article.summary.trim()
    : (article.title || '').trim();
}

/**
 * Returns true if the article is missing translations for at least one target locale.
 */
function needsTranslation(article) {
  if (!article.translations || typeof article.translations !== 'object') return true;
  return TARGET_LOCALES.some(locale => !article.translations[locale]);
}

/**
 * Call the Groq API for a plain-text translation.
 * Returns the translated string, or the original text on error.
 */
async function translateWithGroq(text, localeCode) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY not set. Get a free key at https://console.groq.com/keys');
  }

  const targetLanguage = LOCALE_NAMES[localeCode] || localeCode;

  const systemPrompt =
    'You are a professional translator specializing in cryptocurrency and financial news. ' +
    'Translate the provided text accurately. Return only the translation with no additional commentary.';

  const userPrompt =
    `Translate the following cryptocurrency news text to ${targetLanguage}.\n` +
    `Preserve any numbers, ticker symbols (e.g. BTC, ETH), and proper nouns.\n` +
    `Return only the translated text.\n\n` +
    `Text:\n${text}`;

  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userPrompt   },
      ],
      temperature: 0.3,
      max_tokens: Math.min(Math.max(text.length * 3, 100), 1024),
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`  [Groq ${res.status}] ${body.slice(0, 200)}`);
    return text; // Return original on error
  }

  const json = await res.json();
  const translated = json.choices?.[0]?.message?.content?.trim();
  return translated || text;
}

// ── File processing ────────────────────────────────────────────────────────────

/**
 * Process a single JSONL file:
 * - Reads all lines
 * - Collects articles that need translation
 * - Translates in batches of BATCH_SIZE with BATCH_DELAY_MS delay between batches
 * - Writes back to the same file
 */
async function processFile(filePath) {
  const fileName = path.basename(filePath);
  const raw = fs.readFileSync(filePath, 'utf8');
  const lines = raw.split('\n').filter(l => l.trim());

  // Parse all lines; keep originals for lines that fail to parse
  const parsed = lines.map((line, i) => {
    try {
      return { idx: i, line, article: JSON.parse(line) };
    } catch {
      return { idx: i, line, article: null };
    }
  });

  // Find articles that need translation
  const pending = parsed.filter(r => r.article && needsTranslation(r.article));

  if (pending.length === 0) {
    console.log(`  [${fileName}] All articles already translated – skipping.`);
    return { skipped: parsed.length, translated: 0, errors: 0 };
  }

  console.log(`  [${fileName}] ${pending.length} article(s) need translation (of ${parsed.length} total).`);

  if (DRY_RUN) {
    console.log(`  [${fileName}] DRY-RUN: would translate ${pending.length} article(s).`);
    return { skipped: 0, translated: 0, errors: 0 };
  }

  let translatedCount = 0;
  let errorCount = 0;
  let processed = 0;

  // Process in batches
  for (let i = 0; i < pending.length; i += BATCH_SIZE) {
    if (processed >= LIMIT) break;

    const batch = pending.slice(i, Math.min(i + BATCH_SIZE, pending.length));

    await Promise.all(batch.map(async ({ article, idx }) => {
      if (processed >= LIMIT) return;
      processed++;

      const text = getTranslatableText(article);
      if (!text) return; // Nothing to translate

      if (!article.translations || typeof article.translations !== 'object') {
        article.translations = {};
      }

      // Translate only missing locales for this article
      const missingLocales = TARGET_LOCALES.filter(loc => !article.translations[loc]);

      for (const locale of missingLocales) {
        try {
          const translation = await translateWithGroq(text, locale);
          article.translations[locale] = translation;
          translatedCount++;
        } catch (err) {
          console.error(`    Error translating ${article.id || 'unknown'} → ${locale}: ${err.message}`);
          errorCount++;
        }
      }

      // Write updated article back to its parsed slot
      parsed[idx].line = JSON.stringify(article);
    }));

    // Show progress
    const done = Math.min(i + BATCH_SIZE, pending.length);
    console.log(`    ${done}/${pending.length} articles processed in ${fileName}`);

    // Delay between batches (except after the last batch)
    if (i + BATCH_SIZE < pending.length) {
      await sleep(BATCH_DELAY_MS);
    }
  }

  // Write file back
  const output = parsed.map(r => r.line).join('\n') + '\n';
  fs.writeFileSync(filePath, output, 'utf8');

  return { skipped: parsed.length - pending.length, translated: translatedCount, errors: errorCount };
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║        free-crypto-news: Archive Translator          ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log(`Target locales : ${TARGET_LOCALES.join(', ')}`);
  console.log(`Batch size     : ${BATCH_SIZE} articles`);
  console.log(`Batch delay    : ${BATCH_DELAY_MS}ms`);
  console.log(`Limit          : ${isFinite(LIMIT) ? LIMIT : 'unlimited'}`);
  console.log(`Dry run        : ${DRY_RUN}`);
  if (TARGET_FILE) console.log(`File filter    : ${TARGET_FILE}`);
  console.log('');

  if (!process.env.GROQ_API_KEY && !DRY_RUN) {
    console.error('ERROR: GROQ_API_KEY environment variable is not set.');
    console.error('  Get a free key at https://console.groq.com/keys');
    process.exit(1);
  }

  // List all .jsonl files in archive/articles/
  const allFiles = fs.readdirSync(ARCHIVE_DIR)
    .filter(f => f.endsWith('.jsonl'))
    .sort()
    .map(f => path.join(ARCHIVE_DIR, f));

  const files = TARGET_FILE
    ? allFiles.filter(f => path.basename(f) === TARGET_FILE)
    : allFiles;

  if (files.length === 0) {
    console.error(TARGET_FILE
      ? `ERROR: File not found: ${TARGET_FILE}`
      : 'ERROR: No .jsonl files found in archive/articles/');
    process.exit(1);
  }

  console.log(`Processing ${files.length} file(s)...\n`);

  let totalTranslated = 0;
  let totalErrors     = 0;

  for (const filePath of files) {
    try {
      const { translated, errors } = await processFile(filePath);
      totalTranslated += translated;
      totalErrors     += errors;
    } catch (err) {
      console.error(`ERROR processing ${path.basename(filePath)}: ${err.message}`);
      totalErrors++;
    }
  }

  console.log('\n──────────────────────────────────────────────────────');
  console.log(`Total translations added : ${totalTranslated}`);
  console.log(`Total errors             : ${totalErrors}`);
  console.log('Done.');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
