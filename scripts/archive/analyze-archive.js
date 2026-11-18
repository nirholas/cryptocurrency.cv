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
 * Archive Data Quality Analyzer
 * 
 * Comprehensive analysis of v2 archive quality:
 * - URL coverage by source
 * - Date distribution and quality
 * - Content quality (title length, description presence)
 * - Enrichment priority recommendations
 * 
 * Usage:
 *   node analyze-archive.js [options]
 * 
 * Options:
 *   --detailed          Show per-file breakdown
 *   --export            Export detailed report to JSON
 *   --sources           Show top sources analysis
 */

const fs = require('fs');
const path = require('path');

const WORKSPACE = '/workspaces/free-crypto-news';
const ARCHIVE_DIR = path.join(WORKSPACE, 'archive/articles');
const REPORT_DIR = path.join(WORKSPACE, '.temp-import');

const args = process.argv.slice(2);
const DETAILED = args.includes('--detailed');
const EXPORT = args.includes('--export');
const SOURCES = args.includes('--sources');

/**
 * Load articles from JSONL file (streaming for large files)
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
 * Analyze a single file
 */
function analyzeFile(fileKey) {
  const filePath = path.join(ARCHIVE_DIR, `${fileKey}.jsonl`);
  
  const stats = {
    file: fileKey,
    total: 0,
    withUrl: 0,
    withDescription: 0,
    withTickers: 0,
    withValidDate: 0,
    sources: {},
    categories: {},
    sentimentPositive: 0,
    sentimentNegative: 0,
    sentimentNeutral: 0,
    titleLengths: [],
    urlSources: { csv: 0, wayback: 0, reconstructed: 0, commoncrawl: 0, verified: 0, none: 0 },
  };
  
  for (const article of streamArticles(filePath)) {
    stats.total++;
    
    // URL coverage
    if (article.link) {
      stats.withUrl++;
      const urlSource = article.meta?.url_source || 'csv';
      stats.urlSources[urlSource] = (stats.urlSources[urlSource] || 0) + 1;
    } else {
      stats.urlSources.none++;
    }
    
    // Content quality
    if (article.description && article.description.length > 20) stats.withDescription++;
    if (article.tickers && article.tickers.length > 0) stats.withTickers++;
    if (article.meta?.has_valid_date) stats.withValidDate++;
    
    // Title length
    stats.titleLengths.push(article.title?.length || 0);
    
    // Source distribution
    const source = article.source_key || 'unknown';
    stats.sources[source] = (stats.sources[source] || 0) + 1;
    
    // Category distribution
    const cat = article.category || 'general';
    stats.categories[cat] = (stats.categories[cat] || 0) + 1;
    
    // Sentiment
    const sentiment = article.sentiment?.label || 'neutral';
    if (sentiment === 'positive') stats.sentimentPositive++;
    else if (sentiment === 'negative') stats.sentimentNegative++;
    else stats.sentimentNeutral++;
  }
  
  // Calculate averages
  stats.avgTitleLength = stats.titleLengths.length > 0 
    ? Math.round(stats.titleLengths.reduce((a, b) => a + b, 0) / stats.titleLengths.length)
    : 0;
  delete stats.titleLengths;
  
  return stats;
}

/**
 * Format number with commas
 */
function fmt(n) {
  return n.toLocaleString();
}

/**
 * Format percentage
 */
function pct(n, total) {
  if (total === 0) return '0%';
  return `${((n / total) * 100).toFixed(1)}%`;
}

/**
 * Main analysis
 */
async function main() {
  console.log('═'.repeat(70));
  console.log('  V2 ARCHIVE DATA QUALITY ANALYSIS');
  console.log('═'.repeat(70));
  console.log();
  
  // Get all files
  const files = fs.readdirSync(ARCHIVE_DIR)
    .filter(f => f.endsWith('.jsonl'))
    .map(f => f.replace('.jsonl', ''))
    .sort();
  
  console.log(`Analyzing ${files.length} files...\n`);
  
  // Aggregate stats
  const aggregate = {
    totalArticles: 0,
    withUrl: 0,
    withDescription: 0,
    withTickers: 0,
    withValidDate: 0,
    sources: {},
    categories: {},
    urlSources: {},
    fileStats: [],
    sentimentPositive: 0,
    sentimentNegative: 0,
    sentimentNeutral: 0,
  };
  
  // Analyze each file
  for (const fileKey of files) {
    process.stdout.write(`  Analyzing ${fileKey}...`);
    
    const stats = analyzeFile(fileKey);
    aggregate.fileStats.push(stats);
    
    aggregate.totalArticles += stats.total;
    aggregate.withUrl += stats.withUrl;
    aggregate.withDescription += stats.withDescription;
    aggregate.withTickers += stats.withTickers;
    aggregate.withValidDate += stats.withValidDate;
    aggregate.sentimentPositive += stats.sentimentPositive;
    aggregate.sentimentNegative += stats.sentimentNegative;
    aggregate.sentimentNeutral += stats.sentimentNeutral;
    
    // Merge sources
    for (const [source, count] of Object.entries(stats.sources)) {
      aggregate.sources[source] = (aggregate.sources[source] || 0) + count;
    }
    
    // Merge categories
    for (const [cat, count] of Object.entries(stats.categories)) {
      aggregate.categories[cat] = (aggregate.categories[cat] || 0) + count;
    }
    
    // Merge URL sources
    for (const [src, count] of Object.entries(stats.urlSources)) {
      aggregate.urlSources[src] = (aggregate.urlSources[src] || 0) + count;
    }
    
    process.stdout.write(` ${fmt(stats.total)} articles\n`);
  }
  
  // Print summary
  console.log('\n' + '═'.repeat(70));
  console.log('  SUMMARY');
  console.log('═'.repeat(70));
  
  console.log(`
OVERALL STATISTICS
──────────────────────────────────────────────────────────────────────
  Total Articles:       ${fmt(aggregate.totalArticles)}
  With Valid Date:      ${fmt(aggregate.withValidDate)} (${pct(aggregate.withValidDate, aggregate.totalArticles)})
  Without Date:         ${fmt(aggregate.totalArticles - aggregate.withValidDate)} (${pct(aggregate.totalArticles - aggregate.withValidDate, aggregate.totalArticles)})
  
  With URL:             ${fmt(aggregate.withUrl)} (${pct(aggregate.withUrl, aggregate.totalArticles)})
  Without URL:          ${fmt(aggregate.totalArticles - aggregate.withUrl)} (${pct(aggregate.totalArticles - aggregate.withUrl, aggregate.totalArticles)})
  
  With Description:     ${fmt(aggregate.withDescription)} (${pct(aggregate.withDescription, aggregate.totalArticles)})
  With Tickers:         ${fmt(aggregate.withTickers)} (${pct(aggregate.withTickers, aggregate.totalArticles)})
`);

  console.log(`URL SOURCES
──────────────────────────────────────────────────────────────────────`);
  const sortedUrlSources = Object.entries(aggregate.urlSources)
    .sort((a, b) => b[1] - a[1]);
  for (const [source, count] of sortedUrlSources) {
    console.log(`  ${source.padEnd(20)} ${fmt(count).padStart(10)} (${pct(count, aggregate.totalArticles)})`);
  }

  console.log(`
SENTIMENT DISTRIBUTION
──────────────────────────────────────────────────────────────────────
  Positive:             ${fmt(aggregate.sentimentPositive)} (${pct(aggregate.sentimentPositive, aggregate.totalArticles)})
  Negative:             ${fmt(aggregate.sentimentNegative)} (${pct(aggregate.sentimentNegative, aggregate.totalArticles)})
  Neutral:              ${fmt(aggregate.sentimentNeutral)} (${pct(aggregate.sentimentNeutral, aggregate.totalArticles)})
`);

  // Top sources analysis
  if (SOURCES) {
    console.log('TOP 30 SOURCES (by article count)');
    console.log('──────────────────────────────────────────────────────────────────────');
    
    const sortedSources = Object.entries(aggregate.sources)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30);
    
    // Calculate URL rate per source
    const sourceUrlRates = {};
    for (const stats of aggregate.fileStats) {
      for (const [source, count] of Object.entries(stats.sources)) {
        if (!sourceUrlRates[source]) {
          sourceUrlRates[source] = { total: 0, withUrl: 0 };
        }
        sourceUrlRates[source].total += count;
      }
    }
    
    // We need to re-scan for URL rates by source (more expensive)
    console.log('  Source               Articles    URL Rate  Enrichable');
    console.log('  ─────────────────────────────────────────────────────');
    
    for (const [source, count] of sortedSources) {
      // Estimate enrichability based on source type
      const isSocial = ['twitter', 'x', 'reddit', 'telegram', 'discord', 'unknown'].includes(source.toLowerCase());
      const enrichable = isSocial ? 'No (social)' : 'Yes';
      
      console.log(`  ${source.substring(0, 20).padEnd(20)} ${fmt(count).padStart(8)}    N/A       ${enrichable}`);
    }
    console.log();
  }

  console.log('CATEGORY DISTRIBUTION');
  console.log('──────────────────────────────────────────────────────────────────────');
  const sortedCats = Object.entries(aggregate.categories)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  for (const [cat, count] of sortedCats) {
    console.log(`  ${cat.padEnd(20)} ${fmt(count).padStart(10)} (${pct(count, aggregate.totalArticles)})`);
  }

  // Enrichment priorities
  console.log(`
═══════════════════════════════════════════════════════════════════════
  ENRICHMENT PRIORITIES
═══════════════════════════════════════════════════════════════════════

1. HIGHEST PRIORITY - Date Recovery (unknown-date.jsonl)
   Articles without dates: ${fmt(aggregate.totalArticles - aggregate.withValidDate)}
   → Run: node enrichment-pipeline.js --mode dates --target unknown-date --batch-size 100

2. HIGH PRIORITY - URL Enrichment for dated articles
   Dated articles without URL: ~${fmt(Math.round((aggregate.withValidDate) * (1 - aggregate.withUrl/aggregate.totalArticles)))}
   → Run: node enrichment-pipeline.js --mode urls --priority dated --batch-size 50

3. MEDIUM PRIORITY - Full enrichment pass
   → Run: node enrichment-pipeline.js --mode all --max-batches 0 --batch-size 100

ESTIMATED ENRICHABLE ARTICLES
──────────────────────────────────────────────────────────────────────
  Social media (Twitter, Reddit, etc) - NOT enrichable
  News sites with known URL patterns - HIGH enrichability
  Other news sites - MEDIUM enrichability via Wayback/CommonCrawl
`);

  // Export if requested
  if (EXPORT) {
    const reportPath = path.join(REPORT_DIR, 'archive-quality-report.json');
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      summary: {
        totalArticles: aggregate.totalArticles,
        withUrl: aggregate.withUrl,
        withValidDate: aggregate.withValidDate,
        withDescription: aggregate.withDescription,
        withTickers: aggregate.withTickers,
      },
      sources: aggregate.sources,
      categories: aggregate.categories,
      urlSources: aggregate.urlSources,
      fileStats: aggregate.fileStats,
    }, null, 2));
    console.log(`\nDetailed report exported to: ${reportPath}`);
  }

  // Detailed file breakdown
  if (DETAILED) {
    console.log('\nDETAILED FILE BREAKDOWN');
    console.log('──────────────────────────────────────────────────────────────────────');
    console.log('File            Articles    With URL   With Date  With Desc');
    console.log('──────────────────────────────────────────────────────────────────────');
    
    for (const stats of aggregate.fileStats) {
      console.log(
        `${stats.file.padEnd(15)} ${fmt(stats.total).padStart(8)} ` +
        `${pct(stats.withUrl, stats.total).padStart(10)} ` +
        `${pct(stats.withValidDate, stats.total).padStart(10)} ` +
        `${pct(stats.withDescription, stats.total).padStart(10)}`
      );
    }
  }
}

main().catch(console.error);
