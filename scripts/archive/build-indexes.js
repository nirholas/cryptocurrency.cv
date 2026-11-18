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
 * Build Archive V2 Indexes and Metadata
 * 
 * Generates all supporting files needed for the v2 archive API:
 * - meta/stats.json - Overall archive statistics
 * - index/by-source.json - Article IDs grouped by source
 * - index/by-ticker.json - Article IDs grouped by ticker
 * - index/by-date.json - Article IDs grouped by date
 * 
 * Run after importing data or after enrichment to update indexes.
 * 
 * Usage:
 *   node build-indexes.js [options]
 * 
 * Options:
 *   --verbose       Show detailed progress
 *   --full          Rebuild all indexes (default: incremental)
 *   --stats-only    Only generate stats.json
 */

const fs = require('fs');
const path = require('path');

const WORKSPACE = '/workspaces/free-crypto-news';
const ARCHIVE_DIR = path.join(WORKSPACE, 'archive/articles');
const META_DIR = path.join(WORKSPACE, 'archive/meta');
const INDEX_DIR = path.join(WORKSPACE, 'archive/indexes');

const args = process.argv.slice(2);
const VERBOSE = args.includes('--verbose') || args.includes('-v');
const STATS_ONLY = args.includes('--stats-only');

/**
 * Ensure directory exists
 */
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Stream articles from JSONL file
 */
function* streamArticles(filePath) {
  if (!fs.existsSync(filePath)) return;
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(Boolean);
  
  for (const line of lines) {
    try {
      yield JSON.parse(line);
    } catch {}
  }
}

/**
 * Format number with commas
 */
function fmt(n) {
  return n.toLocaleString();
}

/**
 * Main build function
 */
async function main() {
  console.log('═'.repeat(70));
  console.log('  BUILD ARCHIVE V2 INDEXES');
  console.log('═'.repeat(70));
  console.log();
  
  ensureDir(META_DIR);
  ensureDir(INDEX_DIR);
  
  // Get all JSONL files
  const files = fs.readdirSync(ARCHIVE_DIR)
    .filter(f => f.endsWith('.jsonl'))
    .sort();
  
  console.log(`Found ${files.length} archive files\n`);
  
  // Initialize stats and indexes
  const stats = {
    version: '2.0.0',
    total_articles: 0,
    total_with_url: 0,
    total_with_date: 0,
    total_with_description: 0,
    first_article_date: null,
    last_article_date: null,
    sources: {},
    tickers: {},
    categories: {},
    monthly_counts: {},
    last_updated: new Date().toISOString()
  };
  
  const indexBySource = {};
  const indexByTicker = {};
  const indexByDate = {};
  
  // Process each file
  for (const file of files) {
    const filePath = path.join(ARCHIVE_DIR, file);
    const month = file.replace('.jsonl', '');
    
    if (VERBOSE) process.stdout.write(`Processing ${file}...`);
    
    let count = 0;
    
    for (const article of streamArticles(filePath)) {
      stats.total_articles++;
      count++;
      
      // URL coverage
      if (article.link) stats.total_with_url++;
      
      // Date coverage
      if (article.meta?.has_valid_date) stats.total_with_date++;
      
      // Description coverage
      if (article.description && article.description.length > 20) {
        stats.total_with_description++;
      }
      
      // Date range
      const date = article.pub_date || article.first_seen;
      if (date) {
        if (!stats.first_article_date || date < stats.first_article_date) {
          stats.first_article_date = date;
        }
        if (!stats.last_article_date || date > stats.last_article_date) {
          stats.last_article_date = date;
        }
      }
      
      // Source counts
      const source = article.source_key || article.source || 'unknown';
      stats.sources[source] = (stats.sources[source] || 0) + 1;
      
      // Ticker counts
      if (article.tickers && Array.isArray(article.tickers)) {
        for (const ticker of article.tickers) {
          stats.tickers[ticker] = (stats.tickers[ticker] || 0) + 1;
        }
      }
      
      // Category counts
      const cat = article.category || 'general';
      stats.categories[cat] = (stats.categories[cat] || 0) + 1;
      
      // Monthly counts
      if (month !== 'unknown-date') {
        stats.monthly_counts[month] = (stats.monthly_counts[month] || 0) + 1;
      }
      
      // Build indexes (except for stats-only mode)
      if (!STATS_ONLY) {
        const id = article.id || article.content_hash;
        
        // By source
        if (!indexBySource[source]) indexBySource[source] = [];
        indexBySource[source].push(id);
        
        // By ticker
        if (article.tickers && Array.isArray(article.tickers)) {
          for (const ticker of article.tickers) {
            if (!indexByTicker[ticker]) indexByTicker[ticker] = [];
            indexByTicker[ticker].push(id);
          }
        }
        
        // By date (only if has valid date)
        if (article.pub_date && article.meta?.has_valid_date) {
          const dateKey = article.pub_date.substring(0, 10);
          if (!indexByDate[dateKey]) indexByDate[dateKey] = [];
          indexByDate[dateKey].push(id);
        }
      }
    }
    
    if (VERBOSE) console.log(` ${fmt(count)} articles`);
  }
  
  // Sort sources and tickers by count (top 100)
  const sortedSources = Object.entries(stats.sources)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 100);
  stats.sources = Object.fromEntries(sortedSources);
  
  const sortedTickers = Object.entries(stats.tickers)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 200);
  stats.tickers = Object.fromEntries(sortedTickers);
  
  // Write stats
  const statsPath = path.join(META_DIR, 'stats.json');
  fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2));
  console.log(`\n✓ Saved stats to ${statsPath}`);
  
  // Write indexes (if not stats-only)
  if (!STATS_ONLY) {
    // Sort index arrays to ensure consistency
    for (const source of Object.keys(indexBySource)) {
      indexBySource[source] = indexBySource[source].slice(0, 10000); // Limit to 10k per source
    }
    for (const ticker of Object.keys(indexByTicker)) {
      indexByTicker[ticker] = indexByTicker[ticker].slice(0, 5000); // Limit to 5k per ticker
    }
    
    // Write by-source index
    const sourcePath = path.join(INDEX_DIR, 'by-source.json');
    fs.writeFileSync(sourcePath, JSON.stringify(indexBySource, null, 2));
    console.log(`✓ Saved source index to ${sourcePath} (${Object.keys(indexBySource).length} sources)`);
    
    // Write by-ticker index
    const tickerPath = path.join(INDEX_DIR, 'by-ticker.json');
    fs.writeFileSync(tickerPath, JSON.stringify(indexByTicker, null, 2));
    console.log(`✓ Saved ticker index to ${tickerPath} (${Object.keys(indexByTicker).length} tickers)`);
    
    // Write by-date index
    const datePath = path.join(INDEX_DIR, 'by-date.json');
    fs.writeFileSync(datePath, JSON.stringify(indexByDate, null, 2));
    console.log(`✓ Saved date index to ${datePath} (${Object.keys(indexByDate).length} dates)`);
  }
  
  // Print summary
  console.log(`
═══════════════════════════════════════════════════════════════════════
  ARCHIVE V2 STATISTICS
═══════════════════════════════════════════════════════════════════════

Total Articles:        ${fmt(stats.total_articles)}
  With URL:            ${fmt(stats.total_with_url)} (${((stats.total_with_url / stats.total_articles) * 100).toFixed(1)}%)
  With Valid Date:     ${fmt(stats.total_with_date)} (${((stats.total_with_date / stats.total_articles) * 100).toFixed(1)}%)
  With Description:    ${fmt(stats.total_with_description)} (${((stats.total_with_description / stats.total_articles) * 100).toFixed(1)}%)

Date Range:            ${stats.first_article_date?.substring(0, 10) || 'N/A'} to ${stats.last_article_date?.substring(0, 10) || 'N/A'}
Unique Sources:        ${Object.keys(stats.sources).length}
Unique Tickers:        ${Object.keys(stats.tickers).length}
Categories:            ${Object.keys(stats.categories).length}

TOP 10 SOURCES
──────────────────────────────────────────────────────────────────────`);
  
  sortedSources.slice(0, 10).forEach(([source, count]) => {
    console.log(`  ${source.padEnd(25)} ${fmt(count).padStart(10)}`);
  });

  console.log(`
TOP 10 TICKERS
──────────────────────────────────────────────────────────────────────`);
  
  sortedTickers.slice(0, 10).forEach(([ticker, count]) => {
    console.log(`  ${ticker.padEnd(10)} ${fmt(count).padStart(10)}`);
  });

  console.log(`
MONTHLY DISTRIBUTION
──────────────────────────────────────────────────────────────────────`);
  
  const months = Object.entries(stats.monthly_counts).sort((a, b) => b[0].localeCompare(a[0]));
  months.slice(0, 12).forEach(([month, count]) => {
    const bar = '█'.repeat(Math.round(count / Math.max(...Object.values(stats.monthly_counts)) * 30));
    console.log(`  ${month}  ${bar} ${fmt(count)}`);
  });
  
  console.log(`
═══════════════════════════════════════════════════════════════════════
  BUILD COMPLETE
═══════════════════════════════════════════════════════════════════════
`);
}

main().catch(console.error);
