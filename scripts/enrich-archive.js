#!/usr/bin/env node
/**
 * Batch-enrich archive articles with AI metadata
 *
 * Reads .jsonl files from archive/articles/, finds articles missing enrichment
 * fields (entities, categories, clickbait_score, or a real sentiment score),
 * and calls the Groq API — mirroring the logic that lives in:
 *   GET /api/sentiment   →  enrichSentiment()
 *   GET /api/entities    →  enrichEntities()
 *   POST /api/classify   →  enrichCategories()
 *   GET /api/clickbait   →  enrichClickbait()
 *
 * NOTE: /api/sentiment, /api/entities, and /api/clickbait only expose GET
 * handlers that fetch live news themselves, so this script calls the Groq
 * API directly with the same prompts rather than hitting those routes.
 * /api/classify does have a POST handler; this script replicates its logic
 * directly for the same reason (no running server required).
 *
 * Usage:
 *   node scripts/enrich-archive.js
 *   node scripts/enrich-archive.js --file=2025-01.jsonl
 *   node scripts/enrich-archive.js --limit=100
 *   node scripts/enrich-archive.js --dry-run
 *
 * Env vars:
 *   GROQ_API_KEY   — required (get a free key at https://console.groq.com/keys)
 *   API_BASE_URL   — optional override for local server (unused by default)
 */

'use strict';

const fs   = require('fs');
const path = require('path');

// ── Config ────────────────────────────────────────────────────────────────────

const ARCHIVE_DIR    = path.join(__dirname, '..', 'archive', 'articles');
const GROQ_API_URL   = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL     = 'llama-3.3-70b-versatile';
const BATCH_SIZE     = 10;
const BATCH_DELAY_MS = 500;

// Parse --key=value and --flag CLI args
const args = Object.fromEntries(
  process.argv.slice(2).map(a => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k.trim(), v !== undefined ? v : true];
  })
);

const TARGET_FILE = typeof args.file   === 'string' ? args.file   : null;
const LIMIT       = typeof args.limit  === 'string' ? parseInt(args.limit, 10) : Infinity;
const DRY_RUN     = !!args['dry-run'];

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Placeholder sentinel: articles imported with no real AI analysis yet */
function isPlaceholderSentiment(s) {
  return !s || (s.score === 0 && s.confidence === 0.5);
}

/**
 * Returns true if the article is missing one or more enrichment fields.
 * Skip logic: if all four are present (and sentiment is non-placeholder), skip.
 */
function needsEnrichment(article) {
  if (!isPlaceholderSentiment(article.sentiment) &&
      article.entities        !== undefined &&
      article.categories      !== undefined &&
      article.clickbait_score !== undefined) {
    return false;
  }
  return true;
}

const sleep = (ms) => new Promise(res => setTimeout(res, ms));

/**
 * Call the Groq API and expect a JSON response.
 * Mirrors promptGroqJson() from src/lib/groq.ts.
 */
async function callGroqJson(systemPrompt, userPrompt, maxTokens = 512) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY not set. Get a free key at https://console.groq.com/keys');
  }

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
      max_tokens: maxTokens,
      response_format: { type: 'json_object' },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Groq API ${res.status}: ${text.slice(0, 200)}`);
  }

  const json = await res.json();
  return JSON.parse(json.choices[0].message.content);
}

// ── Per-field enrichment (mirrors the route logic) ────────────────────────────

/**
 * Mirrors GET /api/sentiment — called here as POST { text: article.title }
 * Returns { score, label, confidence, reasoning }
 */
async function enrichSentiment(article) {
  const text = [
    article.title,
    article.tickers?.length ? `(${article.tickers.join(', ')})` : '',
  ].filter(Boolean).join(' ');

  const result = await callGroqJson(
    `You are a cryptocurrency market sentiment analyst.
Analyse the headline and return JSON with exactly these fields:
{ "score": <integer -100 to 100>, "label": <"very_bullish"|"bullish"|"neutral"|"bearish"|"very_bearish">, "confidence": <float 0-1>, "reasoning": "<one sentence>" }`,
    `Headline: ${text}`,
    256,
  );

  return {
    score:      typeof result.score      === 'number' ? result.score      : 0,
    label:      typeof result.label      === 'string' ? result.label      : 'neutral',
    confidence: typeof result.confidence === 'number' ? result.confidence : 0.5,
    reasoning:  typeof result.reasoning  === 'string' ? result.reasoning  : '',
  };
}

/**
 * Mirrors GET /api/entities — called here as POST { text: article.title }
 * Returns Array<{ name, type, sentiment }>
 */
async function enrichEntities(article) {
  const result = await callGroqJson(
    `You are a named entity recognition (NER) system specialised in cryptocurrency news.
Extract all entities from the headline. Return JSON:
{ "entities": [ { "name": "<string>", "type": <"ticker"|"person"|"company"|"protocol"|"exchange"|"regulator"|"event">, "sentiment": <"positive"|"negative"|"neutral"> } ] }
Return an empty entities array if none are found.`,
    `Headline: ${article.title}`,
    512,
  );

  return Array.isArray(result.entities) ? result.entities : [];
}

/**
 * Mirrors POST /api/classify — { title, content }
 * Returns { eventType, confidence, urgency, marketRelevance }
 */
async function enrichCategories(article) {
  const text = article.title;

  const result = await callGroqJson(
    `You are a crypto news event classifier.
Classify the event and return JSON:
{ "eventType": <"funding_round"|"hack_exploit"|"regulation"|"product_launch"|"partnership"|"listing"|"airdrop"|"network_upgrade"|"legal_action"|"market_movement"|"executive_change"|"acquisition"|"general">, "confidence": <float 0-1>, "urgency": <"breaking"|"important"|"routine">, "marketRelevance": <"high"|"medium"|"low"> }`,
    `Title: ${text}`,
    256,
  );

  return {
    eventType:       typeof result.eventType       === 'string' ? result.eventType       : 'general',
    confidence:      typeof result.confidence      === 'number' ? result.confidence      : 0.5,
    urgency:         typeof result.urgency         === 'string' ? result.urgency         : 'routine',
    marketRelevance: typeof result.marketRelevance === 'string' ? result.marketRelevance : 'low',
  };
}

/**
 * Mirrors GET /api/clickbait — called here as POST { title: article.title }
 * Returns { clickbait_score, emotional_tone, accuracy }
 */
async function enrichClickbait(article) {
  const result = await callGroqJson(
    `You are a media literacy expert analysing cryptocurrency news headlines for clickbait.
Rate the headline and return JSON:
{ "clickbait_score": <integer 0-100>, "emotional_tone": <"fear"|"greed"|"excitement"|"neutral"|"urgency">, "accuracy": <"likely_accurate"|"possibly_exaggerated"|"needs_verification"> }`,
    `Headline: ${article.title}`,
    256,
  );

  return {
    clickbait_score: typeof result.clickbait_score === 'number' ? result.clickbait_score : 0,
    emotional_tone:  typeof result.emotional_tone  === 'string' ? result.emotional_tone  : 'neutral',
    accuracy:        typeof result.accuracy        === 'string' ? result.accuracy        : 'likely_accurate',
  };
}

// ── Article enrichment ────────────────────────────────────────────────────────

/**
 * Enrich a single article in-place.
 * Only calls the API for fields that are missing or placeholder.
 */
async function enrichArticle(article) {
  const needsSentiment  = isPlaceholderSentiment(article.sentiment);
  const needsEntities   = article.entities        === undefined;
  const needsCategories = article.categories      === undefined;
  const needsClickbait  = article.clickbait_score === undefined;

  const [sentResult, entResult, catResult, cbResult] = await Promise.allSettled([
    needsSentiment  ? enrichSentiment(article)  : Promise.resolve(null),
    needsEntities   ? enrichEntities(article)   : Promise.resolve(null),
    needsCategories ? enrichCategories(article) : Promise.resolve(null),
    needsClickbait  ? enrichClickbait(article)  : Promise.resolve(null),
  ]);

  // Merge results — only overwrite if the API call succeeded
  if (sentResult.status === 'fulfilled' && sentResult.value !== null) {
    article.sentiment = sentResult.value;
  } else if (sentResult.status === 'rejected') {
    process.stderr.write(`    [sentiment] ${sentResult.reason?.message}\n`);
  }

  if (entResult.status === 'fulfilled' && entResult.value !== null) {
    article.entities = entResult.value;
  } else if (entResult.status === 'rejected') {
    process.stderr.write(`    [entities] ${entResult.reason?.message}\n`);
  }

  if (catResult.status === 'fulfilled' && catResult.value !== null) {
    article.categories = catResult.value;
  } else if (catResult.status === 'rejected') {
    process.stderr.write(`    [categories] ${catResult.reason?.message}\n`);
  }

  if (cbResult.status === 'fulfilled' && cbResult.value !== null) {
    const cb = cbResult.value;
    article.clickbait_score = cb.clickbait_score;
    article.emotional_tone  = cb.emotional_tone;
    article.accuracy        = cb.accuracy;
  } else if (cbResult.status === 'rejected') {
    process.stderr.write(`    [clickbait] ${cbResult.reason?.message}\n`);
  }

  article.enriched_at = new Date().toISOString();
}

// ── File processing ───────────────────────────────────────────────────────────

/**
 * Process one .jsonl file: find articles that need enrichment, run them in
 * batches of BATCH_SIZE with BATCH_DELAY_MS between batches, then write back.
 *
 * @returns {{ total: number, enriched: number }}
 */
async function processFile(filePath) {
  const raw      = fs.readFileSync(filePath, 'utf8');
  const lines    = raw.split('\n').filter(l => l.trim() !== '');
  const articles = [];

  for (const line of lines) {
    try {
      articles.push(JSON.parse(line));
    } catch {
      // Preserve malformed lines as-is by keeping as string sentinel
      articles.push(line);
    }
  }

  const toEnrich = articles.filter(a => typeof a === 'object' && needsEnrichment(a));

  if (toEnrich.length === 0) {
    console.log(`  ✓ ${path.basename(filePath)} — all ${articles.length} articles already enriched`);
    return { total: articles.length, enriched: 0 };
  }

  console.log(`  → ${path.basename(filePath)}: ${toEnrich.length} of ${articles.length} need enrichment`);

  if (DRY_RUN) {
    return { total: articles.length, enriched: toEnrich.length };
  }

  let done = 0;

  for (let i = 0; i < toEnrich.length; i += BATCH_SIZE) {
    const batch = toEnrich.slice(i, i + BATCH_SIZE);

    await Promise.allSettled(
      batch.map(article =>
        enrichArticle(article).catch(err => {
          process.stderr.write(
            `    ✗ Failed: "${String(article.title).slice(0, 60)}" — ${err.message}\n`
          );
        })
      )
    );

    done += batch.length;
    console.log(`    Enriched ${done}/${toEnrich.length} articles`);

    if (i + BATCH_SIZE < toEnrich.length) {
      await sleep(BATCH_DELAY_MS);
    }
  }

  // Rebuild JSONL: objects serialized back to JSON, raw strings preserved
  const output = articles
    .map(a => (typeof a === 'string' ? a : JSON.stringify(a)))
    .join('\n') + '\n';

  fs.writeFileSync(filePath, output, 'utf8');

  return { total: articles.length, enriched: done };
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  if (!process.env.GROQ_API_KEY && !DRY_RUN) {
    console.error('❌  GROQ_API_KEY is not set.');
    console.error('    Get a free key at https://console.groq.com/keys');
    console.error('    Then re-run: GROQ_API_KEY=<key> node scripts/enrich-archive.js');
    process.exit(1);
  }

  if (!fs.existsSync(ARCHIVE_DIR)) {
    console.error(`❌  Archive directory not found: ${ARCHIVE_DIR}`);
    process.exit(1);
  }

  const allFiles = fs
    .readdirSync(ARCHIVE_DIR)
    .filter(f => f.endsWith('.jsonl'))
    .sort()
    .map(f => path.join(ARCHIVE_DIR, f));

  const files = TARGET_FILE
    ? allFiles.filter(f => path.basename(f) === TARGET_FILE || f.endsWith(TARGET_FILE))
    : allFiles;

  if (files.length === 0) {
    console.error(
      `❌  No .jsonl files found${TARGET_FILE ? ` matching "${TARGET_FILE}"` : ''} in ${ARCHIVE_DIR}`
    );
    process.exit(1);
  }

  console.log(`📦  Found ${files.length} .jsonl file(s) to process${DRY_RUN ? ' [DRY RUN — files will not be modified]' : ''}\n`);

  let totalArticles = 0;
  let totalEnriched = 0;
  let filesProcessed = 0;

  for (const file of files) {
    if (totalEnriched >= LIMIT) {
      console.log(`\nReached --limit=${LIMIT}. Stopping.`);
      break;
    }

    const { total, enriched } = await processFile(file);
    totalArticles  += total;
    totalEnriched  += enriched;
    filesProcessed += 1;

    console.log(`  Progress: Enriched ${totalEnriched} article(s) across ${filesProcessed}/${files.length} file(s)\n`);
  }

  console.log(
    `✅  Done. Enriched ${totalEnriched} / ${totalArticles} article(s) across ${filesProcessed} file(s).`
  );

  if (DRY_RUN) {
    console.log('    (dry-run mode — no files were modified)');
  }
}

main().catch(err => {
  console.error('❌  Fatal error:', err.message);
  process.exit(1);
});
