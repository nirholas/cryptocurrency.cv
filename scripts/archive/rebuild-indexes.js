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
 * Rebuild Archive Indexes and Stats
 * 
 * Rebuilds the stats.json and index files from the source JSONL data.
 * Run this when indexes/stats get out of sync with the actual archive.
 * 
 * Usage: node rebuild-indexes.js
 */

const fs = require('fs');
const path = require('path');

const ARCHIVE_DIR = process.env.ARCHIVE_DIR || path.join(__dirname, '../../archive');

/**
 * Load all articles from JSONL files
 */
function loadAllArticles() {
  const articlesDir = path.join(ARCHIVE_DIR, 'v2', 'articles');
  const allArticles = new Map();
  
  if (!fs.existsSync(articlesDir)) {
    console.log('No articles directory found');
    return allArticles;
  }
  
  const files = fs.readdirSync(articlesDir).filter(f => f.endsWith('.jsonl'));
  
  for (const file of files) {
    const filePath = path.join(articlesDir, file);
    console.log(`Loading ${file}...`);
    
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.trim().split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        try {
          const article = JSON.parse(line);
          if (article.id) {
            allArticles.set(article.id, article);
          }
        } catch (e) {
          // Skip malformed lines
        }
      }
    } catch (error) {
      console.error(`Error reading ${file}: ${error.message}`);
    }
  }
  
  return allArticles;
}

/**
 * Rebuild indexes from articles
 */
function rebuildIndexes(articles) {
  const indexDir = path.join(ARCHIVE_DIR, 'v2', 'index');
  if (!fs.existsSync(indexDir)) {
    fs.mkdirSync(indexDir, { recursive: true });
  }
  
  const bySource = {};
  const byTicker = {};
  const byDate = {};
  
  for (const [id, article] of articles) {
    // By source
    const source = article.source_key || 'unknown';
    if (!bySource[source]) bySource[source] = [];
    bySource[source].push(id);
    
    // By ticker
    for (const ticker of (article.tickers || [])) {
      if (!byTicker[ticker]) byTicker[ticker] = [];
      byTicker[ticker].push(id);
    }
    
    // By date - use pub_date if available, otherwise first_seen
    const pubDate = article.pub_date || article.first_seen;
    const date = pubDate ? pubDate.split('T')[0] : 'unknown';
    if (!byDate[date]) byDate[date] = [];
    byDate[date].push(id);
  }
  
  // Write indexes
  fs.writeFileSync(
    path.join(indexDir, 'by-source.json'),
    JSON.stringify(bySource, null, 2)
  );
  fs.writeFileSync(
    path.join(indexDir, 'by-ticker.json'),
    JSON.stringify(byTicker, null, 2)
  );
  fs.writeFileSync(
    path.join(indexDir, 'by-date.json'),
    JSON.stringify(byDate, null, 2)
  );
  
  return { bySource, byTicker, byDate };
}

/**
 * Rebuild stats from articles
 */
function rebuildStats(articles, indexes) {
  const metaDir = path.join(ARCHIVE_DIR, 'v2', 'meta');
  if (!fs.existsSync(metaDir)) {
    fs.mkdirSync(metaDir, { recursive: true });
  }
  
  // Calculate stats from articles
  let earliestDate = null;
  let latestDate = null;
  const dailyCounts = {};
  const sourceCounts = {};
  const tickerCounts = {};
  
  for (const [, article] of articles) {
    // Track dates
    const firstSeen = article.first_seen || article.pub_date;
    if (firstSeen) {
      const date = new Date(firstSeen);
      if (!earliestDate || date < earliestDate) earliestDate = date;
      if (!latestDate || date > latestDate) latestDate = date;
      
      const dateStr = firstSeen.split('T')[0];
      dailyCounts[dateStr] = (dailyCounts[dateStr] || 0) + 1;
    }
    
    // Track sources
    const source = article.source_key || 'unknown';
    sourceCounts[source] = (sourceCounts[source] || 0) + 1;
    
    // Track tickers
    for (const ticker of (article.tickers || [])) {
      tickerCounts[ticker] = (tickerCounts[ticker] || 0) + 1;
    }
  }
  
  // Get the top tickers
  const topTickers = Object.entries(tickerCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 50)
    .reduce((obj, [ticker, count]) => {
      obj[ticker] = count;
      return obj;
    }, {});
  
  const stats = {
    version: '2.1.0',
    rebuilt_at: new Date().toISOString(),
    total_articles: articles.size,
    total_sources: Object.keys(sourceCounts).length,
    total_dates: Object.keys(dailyCounts).length,
    first_article: earliestDate?.toISOString() || null,
    last_article: latestDate?.toISOString() || null,
    daily_counts: dailyCounts,
    sources: sourceCounts,
    tickers: topTickers,
    index_stats: {
      sources: Object.keys(indexes.bySource).length,
      tickers: Object.keys(indexes.byTicker).length,
      dates: Object.keys(indexes.byDate).length,
    }
  };
  
  fs.writeFileSync(
    path.join(metaDir, 'stats.json'),
    JSON.stringify(stats, null, 2)
  );
  
  return stats;
}

/**
 * Main rebuild function
 */
function rebuild() {
  console.log('═'.repeat(60));
  console.log('🔧 REBUILDING ARCHIVE INDEXES AND STATS');
  console.log('═'.repeat(60));
  console.log(`📁 Archive: ${ARCHIVE_DIR}`);
  console.log('');
  
  // Load all articles
  console.log('📖 Loading all articles...');
  const articles = loadAllArticles();
  console.log(`   Found ${articles.size} articles`);
  console.log('');
  
  // Rebuild indexes
  console.log('📇 Rebuilding indexes...');
  const indexes = rebuildIndexes(articles);
  console.log(`   Sources: ${Object.keys(indexes.bySource).length}`);
  console.log(`   Tickers: ${Object.keys(indexes.byTicker).length}`);
  console.log(`   Dates: ${Object.keys(indexes.byDate).length}`);
  console.log('');
  
  // Rebuild stats
  console.log('📊 Rebuilding stats...');
  const stats = rebuildStats(articles, indexes);
  console.log(`   Total articles: ${stats.total_articles}`);
  console.log(`   Date range: ${stats.first_article?.split('T')[0] || 'N/A'} to ${stats.last_article?.split('T')[0] || 'N/A'}`);
  console.log('');
  
  console.log('═'.repeat(60));
  console.log('✅ REBUILD COMPLETE');
  console.log('═'.repeat(60));
  
  return stats;
}

// CLI
if (require.main === module) {
  rebuild();
}

module.exports = { rebuild, loadAllArticles, rebuildIndexes, rebuildStats };
