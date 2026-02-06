#!/usr/bin/env node
/**
 * Archive Collection Script
 * 
 * Fetches news, enriches articles, and appends to the archive.
 * Designed to be run hourly via GitHub Actions.
 * 
 * Features:
 * - Append-only JSONL format
 * - Deduplication by article ID
 * - Full enrichment (tickers, entities, sentiment, market context)
 * - Hourly trending snapshots
 */

const fs = require('fs');
const path = require('path');
const { enrichArticle, mergeArticle, generateArticleId } = require('./enrich');
const { getCachedMarketContext } = require('./market-context');

// Configuration
const ARCHIVE_DIR = process.env.ARCHIVE_DIR || path.join(__dirname, '../../archive');
const API_URL = process.env.API_URL || 'https://cryptocurrency.cv';

/**
 * Fetch news from API
 */
async function fetchNews(endpoint = '/api/news', limit = 100) {
  try {
    const url = `${API_URL}${endpoint}?limit=${limit}`;
    console.log(`Fetching from ${url}...`);
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'FreeCryptoNews-Archiver/2.0'
      }
    });
    
    if (!response.ok) {
      console.error(`API returned ${response.status}`);
      return [];
    }
    
    const data = await response.json();
    return data.articles || [];
  } catch (error) {
    console.error(`Fetch failed: ${error.message}`);
    return [];
  }
}

/**
 * Load existing articles from JSONL file
 */
function loadExistingArticles(filePath) {
  const articles = new Map();
  
  if (!fs.existsSync(filePath)) {
    return articles;
  }
  
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.trim().split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      try {
        const article = JSON.parse(line);
        if (article.id) {
          articles.set(article.id, article);
        }
      } catch {
        // Skip malformed lines
      }
    }
  } catch (error) {
    console.error(`Error loading ${filePath}: ${error.message}`);
  }
  
  return articles;
}

/**
 * Append articles to JSONL file
 */
function appendToJsonl(filePath, articles) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  const lines = articles.map(a => JSON.stringify(a)).join('\n') + '\n';
  fs.appendFileSync(filePath, lines);
}

/**
 * Write full JSONL file (for updates with merges)
 */
function writeJsonl(filePath, articles) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  const lines = articles.map(a => JSON.stringify(a)).join('\n') + '\n';
  fs.writeFileSync(filePath, lines);
}

/**
 * Generate hourly snapshot
 */
function generateSnapshot(articles, marketContext) {
  const now = new Date();
  
  // Count tickers across all articles
  const tickerCounts = {};
  const sourceCounts = {};
  const articleIds = [];
  
  for (const article of articles) {
    articleIds.push(article.id);
    
    for (const ticker of (article.tickers || [])) {
      tickerCounts[ticker] = (tickerCounts[ticker] || 0) + 1;
    }
    
    const source = article.source_key || article.source;
    sourceCounts[source] = (sourceCounts[source] || 0) + 1;
  }
  
  // Sort tickers by count
  const topTickers = Object.entries(tickerCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([ticker, count]) => ({ ticker, mention_count: count }));
  
  return {
    timestamp: now.toISOString(),
    hour: now.getUTCHours(),
    article_count: articles.length,
    top_articles: articleIds.slice(0, 50),
    top_tickers: topTickers,
    source_counts: sourceCounts,
    market_state: marketContext ? {
      btc_price: marketContext.btc_price,
      eth_price: marketContext.eth_price,
      fear_greed_index: marketContext.fear_greed_index
    } : null
  };
}

/**
 * Save hourly snapshot
 */
function saveSnapshot(snapshot) {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  const hour = String(now.getUTCHours()).padStart(2, '0');
  
  const snapshotDir = path.join(ARCHIVE_DIR, 'v2', 'snapshots', String(year), month, day);
  const snapshotPath = path.join(snapshotDir, `${hour}.json`);
  
  if (!fs.existsSync(snapshotDir)) {
    fs.mkdirSync(snapshotDir, { recursive: true });
  }
  
  fs.writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 2));
  console.log(`💾 Snapshot saved: ${snapshotPath}`);
}

/**
 * Update archive statistics
 */
function updateStats(newArticles, updatedArticles, totalArticleCount) {
  const statsPath = path.join(ARCHIVE_DIR, 'v2', 'meta', 'stats.json');
  const metaDir = path.dirname(statsPath);
  
  if (!fs.existsSync(metaDir)) {
    fs.mkdirSync(metaDir, { recursive: true });
  }
  
  let stats = {
    version: '2.0.0',
    total_articles: 0,
    total_fetches: 0,
    first_fetch: null,
    last_fetch: null,
    sources: {},
    tickers: {},
    daily_counts: {}
  };
  
  if (fs.existsSync(statsPath)) {
    try {
      stats = JSON.parse(fs.readFileSync(statsPath, 'utf-8'));
    } catch {}
  }
  
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  
  // Use actual article count as source of truth for total
  stats.total_articles = totalArticleCount;
  stats.total_fetches++;
  stats.last_fetch = now.toISOString();
  if (!stats.first_fetch) {
    stats.first_fetch = now.toISOString();
  }
  stats.daily_counts[today] = (stats.daily_counts[today] || 0) + newArticles;
  
  fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2));
}

/**
 * Update indexes for fast lookups
 */
function updateIndexes(articles) {
  const indexDir = path.join(ARCHIVE_DIR, 'v2', 'index');
  
  if (!fs.existsSync(indexDir)) {
    fs.mkdirSync(indexDir, { recursive: true });
  }
  
  // Load existing indexes
  let bySource = {};
  let byTicker = {};
  let byDate = {};
  
  const bySourcePath = path.join(indexDir, 'by-source.json');
  const byTickerPath = path.join(indexDir, 'by-ticker.json');
  const byDatePath = path.join(indexDir, 'by-date.json');
  
  try {
    if (fs.existsSync(bySourcePath)) bySource = JSON.parse(fs.readFileSync(bySourcePath, 'utf-8'));
    if (fs.existsSync(byTickerPath)) byTicker = JSON.parse(fs.readFileSync(byTickerPath, 'utf-8'));
    if (fs.existsSync(byDatePath)) byDate = JSON.parse(fs.readFileSync(byDatePath, 'utf-8'));
  } catch {}
  
  // Update indexes with new articles
  for (const article of articles) {
    const source = article.source_key || 'unknown';
    const date = article.first_seen?.split('T')[0] || new Date().toISOString().split('T')[0];
    
    // By source
    if (!bySource[source]) bySource[source] = [];
    if (!bySource[source].includes(article.id)) {
      bySource[source].push(article.id);
    }
    
    // By ticker
    for (const ticker of (article.tickers || [])) {
      if (!byTicker[ticker]) byTicker[ticker] = [];
      if (!byTicker[ticker].includes(article.id)) {
        byTicker[ticker].push(article.id);
      }
    }
    
    // By date
    if (!byDate[date]) byDate[date] = [];
    if (!byDate[date].includes(article.id)) {
      byDate[date].push(article.id);
    }
  }
  
  // Save indexes
  fs.writeFileSync(bySourcePath, JSON.stringify(bySource, null, 2));
  fs.writeFileSync(byTickerPath, JSON.stringify(byTicker, null, 2));
  fs.writeFileSync(byDatePath, JSON.stringify(byDate, null, 2));
  
  console.log(`📇 Indexes updated`);
}

/**
 * Main collection function
 */
async function collect() {
  console.log('🚀 Starting archive collection...');
  console.log(`📁 Archive directory: ${ARCHIVE_DIR}`);
  
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  
  // Determine JSONL file for this month
  const articlesDir = path.join(ARCHIVE_DIR, 'v2', 'articles');
  const jsonlPath = path.join(articlesDir, `${year}-${month}.jsonl`);
  
  // Get market context first (cached)
  console.log('📊 Fetching market context...');
  const marketContext = await getCachedMarketContext();
  if (marketContext) {
    console.log(`  BTC: $${marketContext.btc_price?.toLocaleString() || 'N/A'}`);
    console.log(`  ETH: $${marketContext.eth_price?.toLocaleString() || 'N/A'}`);
    console.log(`  Fear/Greed: ${marketContext.fear_greed_index || 'N/A'}`);
  } else {
    console.log('  ⚠️ Market context unavailable');
  }
  
  // Fetch news from multiple endpoints
  console.log('\n📰 Fetching news...');
  const [generalNews, bitcoinNews, defiNews, trendingNews] = await Promise.all([
    fetchNews('/api/news', 100),
    fetchNews('/api/bitcoin', 50),
    fetchNews('/api/defi', 50),
    fetchNews('/api/trending', 50)
  ]);
  
  // Combine and deduplicate by link
  const allNews = new Map();
  for (const article of [...generalNews, ...bitcoinNews, ...defiNews, ...trendingNews]) {
    if (article.link) {
      const id = generateArticleId(article.link);
      if (!allNews.has(id)) {
        allNews.set(id, article);
      }
    }
  }
  
  console.log(`  Found ${allNews.size} unique articles from API`);
  
  // Load existing articles
  const existing = loadExistingArticles(jsonlPath);
  console.log(`  Existing articles in archive: ${existing.size}`);
  
  // Process articles
  const newArticles = [];
  const updatedArticles = [];
  const allProcessed = [];
  
  for (const [id, rawArticle] of allNews) {
    const enriched = enrichArticle(rawArticle, marketContext);
    
    if (existing.has(id)) {
      // Article exists - merge (update last_seen, fetch_count)
      const merged = mergeArticle(existing.get(id), enriched);
      existing.set(id, merged);
      updatedArticles.push(merged);
      allProcessed.push(merged);
    } else {
      // New article
      newArticles.push(enriched);
      existing.set(id, enriched);
      allProcessed.push(enriched);
    }
  }
  
  console.log(`\n✨ New articles: ${newArticles.length}`);
  console.log(`🔄 Updated articles: ${updatedArticles.length}`);
  
  // Write updated JSONL file
  if (newArticles.length > 0 || updatedArticles.length > 0) {
    // Rewrite the full file to include updates
    writeJsonl(jsonlPath, Array.from(existing.values()));
    console.log(`💾 Archive saved: ${jsonlPath}`);
    
    // Update stats (pass total article count for accuracy)
    updateStats(newArticles.length, updatedArticles.length, existing.size);
    
    // Update indexes with new articles only (append)
    if (newArticles.length > 0) {
      updateIndexes(newArticles);
    }
  } else {
    console.log('ℹ️ No changes to archive');
  }
  
  // Generate and save hourly snapshot
  const snapshot = generateSnapshot(allProcessed, marketContext);
  saveSnapshot(snapshot);
  
  // Save market context separately for historical tracking
  const marketDir = path.join(ARCHIVE_DIR, 'v2', 'market');
  const marketPath = path.join(marketDir, `${year}-${month}.jsonl`);
  if (!fs.existsSync(marketDir)) {
    fs.mkdirSync(marketDir, { recursive: true });
  }
  if (marketContext) {
    fs.appendFileSync(marketPath, JSON.stringify(marketContext) + '\n');
  }
  
  console.log('\n✅ Collection complete!');
  
  return {
    new: newArticles.length,
    updated: updatedArticles.length,
    total: existing.size
  };
}

// ============================================================================
// CLI
// ============================================================================

if (require.main === module) {
  collect()
    .then(result => {
      console.log(`\n📈 Summary: ${result.new} new, ${result.updated} updated, ${result.total} total`);
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Collection failed:', error);
      process.exit(1);
    });
}

module.exports = { collect };
