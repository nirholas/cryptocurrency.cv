#!/usr/bin/env node
/**
 * Backfill PostgreSQL from archive/ JSON/JSONL files
 *
 * Usage:
 *   DATABASE_URL=postgres://... npx tsx scripts/backfill-postgres.ts
 *   DATABASE_URL=postgres://... npx tsx scripts/backfill-postgres.ts --articles-only
 *   DATABASE_URL=postgres://... npx tsx scripts/backfill-postgres.ts --prices-only
 *
 * This script reads from the archive/ directory and inserts into PostgreSQL.
 * It's idempotent — re-running skips existing rows (ON CONFLICT DO NOTHING).
 */

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../src/lib/db/schema';
import { sql } from 'drizzle-orm';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as readline from 'node:readline';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('ERROR: DATABASE_URL environment variable is required');
  process.exit(1);
}

const client = neon(DATABASE_URL);
const db = drizzle(client, { schema });

const BATCH_SIZE = 500;
const ARCHIVE_DIR = path.resolve(__dirname, '../archive');

// ============================================================================
// HELPERS
// ============================================================================

async function* readJsonl(filePath: string): AsyncGenerator<Record<string, unknown>> {
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });
  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('//')) continue;
    try {
      yield JSON.parse(trimmed);
    } catch {
      // skip malformed lines
    }
  }
}

function readJson(filePath: string): unknown {
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw);
}

function findFiles(dir: string, ext: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const entries: string[] = [];
  const walk = (d: string) => {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith(ext)) entries.push(full);
    }
  };
  walk(dir);
  return entries.sort();
}

// ============================================================================
// ARTICLE BACKFILL
// ============================================================================

async function backfillArticles() {
  console.log('\n📰 Backfilling articles...');
  const files = findFiles(path.join(ARCHIVE_DIR, 'articles'), '.jsonl');
  if (files.length === 0) {
    console.log('  No article JSONL files found in archive/articles/');
    return;
  }

  let total = 0;
  let inserted = 0;

  for (const file of files) {
    const batch: (typeof schema.articles.$inferInsert)[] = [];

    for await (const raw of readJsonl(file)) {
      total++;
      const row: typeof schema.articles.$inferInsert = {
        id: String(raw.id ?? ''),
        slug: raw.slug ? String(raw.slug) : null,
        title: String(raw.title ?? ''),
        link: String(raw.link ?? ''),
        canonicalLink: raw.canonicalLink ? String(raw.canonicalLink) : null,
        description: raw.description ? String(raw.description) : null,
        source: String(raw.source ?? ''),
        sourceKey: String(raw.sourceKey ?? raw.source_key ?? ''),
        category: String(raw.category ?? 'general'),
        pubDate: raw.pubDate ? new Date(String(raw.pubDate)) : null,
        firstSeen: new Date(String(raw.firstSeen ?? raw.first_seen ?? new Date().toISOString())),
        lastSeen: new Date(String(raw.lastSeen ?? raw.last_seen ?? new Date().toISOString())),
        fetchCount: Number(raw.fetchCount ?? raw.fetch_count ?? 1),
        tickers: Array.isArray(raw.tickers) ? raw.tickers.map(String) : [],
        tags: Array.isArray(raw.tags) ? raw.tags.map(String) : [],
        sentimentScore: raw.sentimentScore != null ? Number(raw.sentimentScore) : 0,
        sentimentLabel: String(raw.sentimentLabel ?? raw.sentiment_label ?? 'neutral'),
        sentimentConfidence: raw.sentimentConfidence != null ? Number(raw.sentimentConfidence) : 0.5,
        marketContext: raw.marketContext as typeof schema.articles.$inferInsert['marketContext'] ?? null,
        contentHash: raw.contentHash ? String(raw.contentHash) : null,
      };

      if (!row.id || !row.title || !row.link) continue;
      batch.push(row);

      if (batch.length >= BATCH_SIZE) {
        const result = await db
          .insert(schema.articles)
          .values(batch)
          .onConflictDoNothing({ target: schema.articles.id });
        inserted += batch.length;
        batch.length = 0;
        process.stdout.write(`\r  Processed ${total} articles, inserted ~${inserted}`);
      }
    }

    if (batch.length > 0) {
      await db.insert(schema.articles).values(batch).onConflictDoNothing({ target: schema.articles.id });
      inserted += batch.length;
    }
  }

  console.log(`\n  ✅ Articles: ${total} processed, ~${inserted} inserted from ${files.length} files`);
}

// ============================================================================
// PRICE BACKFILL
// ============================================================================

async function backfillPrices() {
  console.log('\n💰 Backfilling price history...');
  const files = findFiles(path.join(ARCHIVE_DIR, 'market'), '.jsonl');
  if (files.length === 0) {
    console.log('  No market JSONL files found in archive/market/');
    return;
  }

  let total = 0;
  let inserted = 0;

  for (const file of files) {
    const batch: (typeof schema.pricesHistory.$inferInsert)[] = [];

    for await (const raw of readJsonl(file)) {
      total++;

      // Market files can have different shapes — handle both flat and nested
      const tickers = raw.prices
        ? Object.entries(raw.prices as Record<string, { price: number; market_cap?: number; volume_24h?: number; change_24h?: number }>)
        : [[String(raw.ticker ?? 'BTC'), raw]];

      for (const [ticker, data] of tickers) {
        const d = data as Record<string, unknown>;
        batch.push({
          ticker: String(ticker).toUpperCase(),
          price: Number(d.price ?? d.current_price ?? 0),
          marketCap: d.market_cap != null ? Number(d.market_cap) : null,
          volume24h: d.volume_24h != null ? Number(d.volume_24h) : null,
          change24h: d.change_24h != null ? Number(d.change_24h) : null,
          timestamp: new Date(String(raw.timestamp ?? raw.date ?? new Date().toISOString())),
          source: String(raw.source ?? 'archive'),
        });
      }

      if (batch.length >= BATCH_SIZE) {
        await db.insert(schema.pricesHistory).values(batch).onConflictDoNothing();
        inserted += batch.length;
        batch.length = 0;
        process.stdout.write(`\r  Processed ${total} market entries, inserted ~${inserted} prices`);
      }
    }

    if (batch.length > 0) {
      await db.insert(schema.pricesHistory).values(batch).onConflictDoNothing();
      inserted += batch.length;
    }
  }

  console.log(`\n  ✅ Prices: ${total} entries processed, ~${inserted} rows inserted`);
}

// ============================================================================
// PREDICTIONS BACKFILL
// ============================================================================

async function backfillPredictions() {
  console.log('\n🔮 Backfilling predictions...');
  const files = findFiles(path.join(ARCHIVE_DIR, 'predictions'), '.jsonl');
  if (files.length === 0) {
    console.log('  No prediction files found');
    return;
  }

  let total = 0;
  for (const file of files) {
    const batch: (typeof schema.predictions.$inferInsert)[] = [];
    for await (const raw of readJsonl(file)) {
      total++;
      batch.push({
        ticker: String(raw.ticker ?? 'BTC'),
        predictionType: String(raw.prediction_type ?? raw.type ?? 'price'),
        direction: raw.direction ? String(raw.direction) : null,
        confidence: raw.confidence != null ? Number(raw.confidence) : null,
        source: raw.source ? String(raw.source) : null,
        reasoning: raw.reasoning ? String(raw.reasoning) : null,
        targetPrice: raw.target_price != null ? Number(raw.target_price) : null,
        targetDate: raw.target_date ? new Date(String(raw.target_date)) : null,
        outcome: raw.outcome ? String(raw.outcome) : null,
        timestamp: new Date(String(raw.timestamp ?? new Date().toISOString())),
      });

      if (batch.length >= BATCH_SIZE) {
        await db.insert(schema.predictions).values(batch).onConflictDoNothing();
        batch.length = 0;
      }
    }
    if (batch.length > 0) {
      await db.insert(schema.predictions).values(batch).onConflictDoNothing();
    }
  }
  console.log(`  ✅ Predictions: ${total} processed`);
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const articlesOnly = args.includes('--articles-only');
  const pricesOnly = args.includes('--prices-only');
  const predictionsOnly = args.includes('--predictions-only');
  const all = !articlesOnly && !pricesOnly && !predictionsOnly;

  console.log('🚀 PostgreSQL Backfill from archive/');
  console.log(`   Database: ${DATABASE_URL?.replace(/\/\/[^@]+@/, '//***@')}`);
  console.log(`   Archive:  ${ARCHIVE_DIR}`);

  const start = Date.now();

  if (all || articlesOnly) await backfillArticles();
  if (all || pricesOnly) await backfillPrices();
  if (all || predictionsOnly) await backfillPredictions();

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\n✅ Backfill complete in ${elapsed}s`);
}

main().catch((err) => {
  console.error('❌ Backfill failed:', err);
  process.exit(1);
});
