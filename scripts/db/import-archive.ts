#!/usr/bin/env node

/**
 * Import archive JSON / JSONL data into Postgres
 *
 * Usage:
 *   DATABASE_URL=postgres://... npx tsx scripts/db/import-archive.ts [--articles] [--market] [--tags] [--predictions]
 *
 * Without flags, imports everything. Pass individual flags to import selectively.
 * Safe to re-run — uses ON CONFLICT DO NOTHING for articles & tags.
 */

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../../src/lib/db/schema';
import * as fs from 'fs';
import * as path from 'path';

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

const ARCHIVE_ROOT = path.resolve(__dirname, '../../archive');
const BATCH_SIZE = 200; // rows per INSERT batch

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

function log(msg: string) {
  process.stdout.write(`[import] ${msg}\n`);
}

function parseJsonl<T = unknown>(filePath: string): T[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const items: T[] = [];
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      items.push(JSON.parse(trimmed));
    } catch {
      // skip malformed lines
    }
  }
  return items;
}

// ────────────────────────────────────────────────────────────────────────────
// Connection
// ────────────────────────────────────────────────────────────────────────────

const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!DATABASE_URL) {
  console.error('ERROR: DATABASE_URL environment variable is required.');
  process.exit(1);
}

const sql = neon(DATABASE_URL);
const db = drizzle(sql, { schema });

// ────────────────────────────────────────────────────────────────────────────
// Import: Articles  (archive/articles/*.jsonl)
// ────────────────────────────────────────────────────────────────────────────

interface RawArticle {
  id: string;
  slug?: string;
  schema_version?: string;
  title: string;
  link: string;
  canonical_link?: string;
  description?: string;
  source: string;
  source_key: string;
  category: string;
  pub_date?: string | null;
  first_seen: string;
  last_seen: string;
  fetch_count?: number;
  tickers?: string[];
  tags?: string[];
  entities?: { people: string[]; companies: string[]; protocols: string[] };
  sentiment?: { score: number; label: string; confidence: number };
  market_context?: Record<string, unknown> | null;
  content_hash?: string;
  meta?: Record<string, unknown>;
}

async function importArticles() {
  const articlesDir = path.join(ARCHIVE_ROOT, 'articles');
  if (!fs.existsSync(articlesDir)) {
    log('articles/ directory not found — skipping');
    return;
  }

  const files = fs.readdirSync(articlesDir).filter(f => f.endsWith('.jsonl')).sort();
  log(`Found ${files.length} JSONL article files`);

  let totalInserted = 0;

  for (const file of files) {
    const filePath = path.join(articlesDir, file);
    const articles = parseJsonl<RawArticle>(filePath);
    log(`  ${file}: ${articles.length} articles`);

    // Process in batches
    for (let i = 0; i < articles.length; i += BATCH_SIZE) {
      const batch = articles.slice(i, i + BATCH_SIZE);
      const rows = batch.map(a => ({
        id: a.id,
        slug: a.slug ?? null,
        schemaVersion: a.schema_version ?? '2.0.0',
        title: a.title,
        link: a.link,
        canonicalLink: a.canonical_link ?? null,
        description: a.description ?? null,
        source: a.source,
        sourceKey: a.source_key,
        category: a.category,
        pubDate: a.pub_date ? new Date(a.pub_date) : null,
        firstSeen: new Date(a.first_seen),
        lastSeen: new Date(a.last_seen),
        fetchCount: a.fetch_count ?? 1,
        tickers: a.tickers ?? [],
        tags: a.tags ?? [],
        entities: a.entities ?? null,
        sentimentScore: a.sentiment?.score ?? 0,
        sentimentLabel: a.sentiment?.label ?? 'neutral',
        sentimentConfidence: a.sentiment?.confidence ?? 0.5,
        marketContext: a.market_context ?? null,
        contentHash: a.content_hash ?? null,
        meta: a.meta ?? null,
      }));

      try {
        await db.insert(schema.articles).values(rows).onConflictDoNothing();
        totalInserted += rows.length;
        if (totalInserted % 2000 === 0) log(`    progress: ${totalInserted} rows`);
        await sleep(10); // small throttle for Neon
      } catch (err) {
        log(`    ⚠ batch error at offset ${i}: ${(err as Error).message}`);
      }
    }
  }

  log(`✓ Articles imported: ${totalInserted} rows`);
}

// ────────────────────────────────────────────────────────────────────────────
// Import: Market / Prices  (archive/market/*.jsonl)
// ────────────────────────────────────────────────────────────────────────────

interface RawMarketEntry {
  timestamp: string;
  btc_price?: number;
  eth_price?: number;
  sol_price?: number;
  total_market_cap?: number;
  btc_dominance?: number;
  fear_greed_index?: number;
}

async function importMarket() {
  const marketDir = path.join(ARCHIVE_ROOT, 'market');
  if (!fs.existsSync(marketDir)) {
    log('market/ directory not found — skipping');
    return;
  }

  const files = fs.readdirSync(marketDir).filter(f => f.endsWith('.jsonl')).sort();
  log(`Found ${files.length} market JSONL files`);
  let total = 0;

  for (const file of files) {
    const entries = parseJsonl<RawMarketEntry>(path.join(marketDir, file));
    const rows: Array<typeof schema.pricesHistory.$inferInsert> = [];

    for (const e of entries) {
      const ts = new Date(e.timestamp);
      if (e.btc_price != null) rows.push({ ticker: 'BTC', price: e.btc_price, timestamp: ts, source: 'archive' });
      if (e.eth_price != null) rows.push({ ticker: 'ETH', price: e.eth_price, timestamp: ts, source: 'archive' });
      if (e.sol_price != null) rows.push({ ticker: 'SOL', price: e.sol_price, timestamp: ts, source: 'archive' });
    }

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      try {
        await db.insert(schema.pricesHistory).values(batch);
        total += batch.length;
      } catch (err) {
        log(`    ⚠ batch error: ${(err as Error).message}`);
      }
    }
  }

  log(`✓ Prices imported: ${total} rows`);
}

// ────────────────────────────────────────────────────────────────────────────
// Import: Tag Scores  (archive/meta/tag-scores.json)
// ────────────────────────────────────────────────────────────────────────────

async function importTagScores() {
  const tagFile = path.join(ARCHIVE_ROOT, 'meta', 'tag-scores.json');
  if (!fs.existsSync(tagFile)) {
    log('meta/tag-scores.json not found — skipping');
    return;
  }

  const raw = JSON.parse(fs.readFileSync(tagFile, 'utf-8'));
  const scores: Record<string, number> = raw.scores ?? raw;

  const rows: Array<typeof schema.tagScores.$inferInsert> = Object.entries(scores).map(
    ([tag, score]) => ({ tag, score: score as number })
  );

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    await db.insert(schema.tagScores).values(batch).onConflictDoNothing();
  }

  log(`✓ Tag scores imported: ${rows.length} tags`);
}

// ────────────────────────────────────────────────────────────────────────────
// Import: Predictions  (archive/predictions/*.jsonl)
// ────────────────────────────────────────────────────────────────────────────

async function importPredictions() {
  const predDir = path.join(ARCHIVE_ROOT, 'predictions');
  if (!fs.existsSync(predDir)) {
    log('predictions/ directory not found — skipping');
    return;
  }

  const files = fs.readdirSync(predDir).filter(f => f.endsWith('.jsonl')).sort();
  log(`Found ${files.length} prediction JSONL files`);
  let total = 0;

  for (const file of files) {
    const entries = parseJsonl<Record<string, unknown>>(path.join(predDir, file));

    const rows: Array<typeof schema.predictions.$inferInsert> = entries.map(e => ({
      ticker: 'MARKET', // prediction files are market-level snapshots
      predictionType: 'market_snapshot',
      source: 'archive',
      meta: e as Record<string, unknown>,
      timestamp: new Date((e.timestamp as string) || new Date().toISOString()),
    }));

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      try {
        await db.insert(schema.predictions).values(batch);
        total += batch.length;
      } catch (err) {
        log(`    ⚠ batch error: ${(err as Error).message}`);
      }
    }
  }

  log(`✓ Predictions imported: ${total} rows`);
}

// ────────────────────────────────────────────────────────────────────────────
// Main
// ────────────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const all = args.length === 0;

  log('Starting archive → Postgres import');
  log(`Archive root: ${ARCHIVE_ROOT}`);

  if (all || args.includes('--articles'))    await importArticles();
  if (all || args.includes('--market'))      await importMarket();
  if (all || args.includes('--tags'))        await importTagScores();
  if (all || args.includes('--predictions')) await importPredictions();

  log('Import complete ✓');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
