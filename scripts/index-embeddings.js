#!/usr/bin/env node
/**
 * scripts/index-embeddings.js
 *
 * Pre-compute and store OpenAI text-embedding-3-small vectors for articles
 * in archive/articles/*.jsonl into Vercel KV.
 *
 * Stored key format: "article_emb:{article_id}"
 * Stored value     : { embedding: number[], title, url, date, tags }
 *
 * Usage:
 *   node scripts/index-embeddings.js [--offset <n>]
 *
 * Environment variables required:
 *   OPENAI_API_KEY       — OpenAI secret key
 *   KV_REST_API_URL      — Vercel KV REST endpoint
 *   KV_REST_API_TOKEN    — Vercel KV REST token
 *
 * Cost reference:
 *   text-embedding-3-small: $0.02 / 1M tokens
 *   ~15 tokens/article → 100 articles ≈ 1,500 tokens ≈ $0.00003
 */

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const BATCH_SIZE = 100;
const ARTICLES_DIR = path.join(__dirname, '..', 'archive', 'articles');
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const EMBEDDING_MODEL = 'text-embedding-3-small';
// text-embedding-3-small: $0.02 per 1M tokens
const COST_PER_TOKEN = 0.02 / 1_000_000;
// Rough approximation: 4 chars ≈ 1 token
const CHARS_PER_TOKEN = 4;

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

function parseArgs() {
  const args = process.argv.slice(2);
  let offset = 0;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--offset' && args[i + 1] !== undefined) {
      offset = parseInt(args[i + 1], 10);
      if (isNaN(offset) || offset < 0) {
        console.error('--offset must be a non-negative integer');
        process.exit(1);
      }
      i++;
    }
  }
  return { offset };
}

// ---------------------------------------------------------------------------
// Article loading
// ---------------------------------------------------------------------------

/**
 * Read all .jsonl files from archive/articles/ and return a flat array of
 * article objects, sorted by pub_date descending (newest first).
 */
function loadAllArticles() {
  const files = fs
    .readdirSync(ARTICLES_DIR)
    .filter((f) => f.endsWith('.jsonl'))
    .sort()
    .reverse(); // newest months first

  const articles = [];
  for (const file of files) {
    const filePath = path.join(ARTICLES_DIR, file);
    const lines = fs.readFileSync(filePath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        articles.push(JSON.parse(trimmed));
      } catch {
        // skip malformed lines
      }
    }
  }
  return articles;
}

/**
 * Build the embeddable text for an article.
 * Uses: title + " " + summary/description (first 500 chars).
 * Falls back to title + tags + category when no summary field exists.
 */
function buildEmbeddableText(article) {
  const title = (article.title || '').trim();
  const summary = (
    article.summary ||
    article.description ||
    article.content ||
    ''
  )
    .trim()
    .slice(0, 500);

  const parts = [title];
  if (summary) {
    parts.push(summary);
  } else {
    // Augment with tags and category for better semantic coverage
    if (article.category) parts.push(article.category);
    if (Array.isArray(article.tickers) && article.tickers.length)
      parts.push(article.tickers.join(' '));
    if (Array.isArray(article.tags) && article.tags.length)
      parts.push(article.tags.join(' '));
  }

  return parts.join(' ').slice(0, 8000);
}

// ---------------------------------------------------------------------------
// OpenAI embeddings (batch up to 100 at a time)
// ---------------------------------------------------------------------------

async function generateEmbeddingsBatch(texts) {
  if (!OPENAI_API_KEY) {
    throw new Error(
      'OPENAI_API_KEY is not set. Export it before running this script.'
    );
  }

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: texts,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  // data.data is sorted by index
  return data.data.map((item) => item.embedding);
}

// ---------------------------------------------------------------------------
// KV helpers (uses @vercel/kv via dynamic import)
// ---------------------------------------------------------------------------

let _kv = null;

async function getKV() {
  if (_kv) return _kv;
  try {
    const mod = await import('@vercel/kv');
    _kv = mod.kv;
    return _kv;
  } catch (err) {
    throw new Error(
      `Could not load @vercel/kv: ${err.message}\n` +
        'Ensure KV_REST_API_URL and KV_REST_API_TOKEN are set.'
    );
  }
}

async function isAlreadyIndexed(kv, articleId) {
  try {
    const existing = await kv.get(`article_emb:${articleId}`);
    return existing !== null;
  } catch {
    return false;
  }
}

async function storeArticleEmbedding(kv, article, embedding) {
  const key = `article_emb:${article.id}`;
  const value = {
    embedding,
    title: article.title || '',
    url: article.canonical_link || article.link || '',
    date: article.pub_date || article.first_seen || '',
    tags: [
      ...(Array.isArray(article.tags) ? article.tags : []),
      ...(Array.isArray(article.tickers) ? article.tickers : []),
      ...(article.category ? [article.category] : []),
    ],
  };
  // Store with 90-day expiry (embeddings are stable, but keep storage bounded)
  await kv.set(key, value, { ex: 60 * 60 * 24 * 90 });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const { offset } = parseArgs();

  console.log('Loading articles from archive/articles/...');
  const allArticles = loadAllArticles();
  console.log(`Total articles found: ${allArticles.length}`);

  const slice = allArticles.slice(offset, offset + BATCH_SIZE);
  if (slice.length === 0) {
    console.log(`No articles at offset ${offset}. All done!`);
    return;
  }

  console.log(
    `Processing articles ${offset}–${offset + slice.length - 1} (${slice.length} total)`
  );

  // Initialise KV client
  const kv = await getKV();
  console.log('Connected to Vercel KV.');

  // Filter out already-indexed articles
  console.log('Checking for already-indexed articles...');
  const toIndex = [];
  for (const article of slice) {
    if (!article.id) continue;
    const skip = await isAlreadyIndexed(kv, article.id);
    if (skip) {
      process.stdout.write('.');
    } else {
      toIndex.push(article);
    }
  }
  console.log(
    `\nAlready indexed: ${slice.length - toIndex.length}, to index: ${toIndex.length}`
  );

  if (toIndex.length === 0) {
    console.log('Nothing to index in this batch. Try a higher --offset.');
    return;
  }

  // Build embeddable texts and estimate cost
  const texts = toIndex.map(buildEmbeddableText);
  const totalChars = texts.reduce((sum, t) => sum + t.length, 0);
  const estimatedTokens = Math.ceil(totalChars / CHARS_PER_TOKEN);
  const estimatedCost = (estimatedTokens * COST_PER_TOKEN).toFixed(6);
  console.log(
    `Estimated tokens: ~${estimatedTokens}, estimated cost: ~$${estimatedCost}`
  );

  // Generate embeddings in sub-batches of 100 (OpenAI limit)
  console.log('Generating embeddings...');
  const SUB_BATCH = 100;
  const allEmbeddings = [];
  for (let i = 0; i < texts.length; i += SUB_BATCH) {
    const batchTexts = texts.slice(i, i + SUB_BATCH);
    const embeddings = await generateEmbeddingsBatch(batchTexts);
    allEmbeddings.push(...embeddings);
    process.stdout.write(`  Generated ${Math.min(i + SUB_BATCH, texts.length)}/${texts.length}\r`);
  }
  console.log('\nEmbeddings generated.');

  // Store in KV
  console.log('Storing in Vercel KV...');
  let stored = 0;
  for (let i = 0; i < toIndex.length; i++) {
    await storeArticleEmbedding(kv, toIndex[i], allEmbeddings[i]);
    stored++;
    if (stored % 10 === 0) {
      process.stdout.write(`  Stored ${stored}/${toIndex.length}\r`);
    }
  }
  console.log(`\nDone. Stored ${stored} embeddings.`);

  console.log(
    `\nTo index the next batch, run:\n  node scripts/index-embeddings.js --offset ${offset + BATCH_SIZE}`
  );
}

main().catch((err) => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
