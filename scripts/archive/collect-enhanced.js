#!/usr/bin/env node
/**
 * Enhanced Archive Collection Script v2
 * 
 * Full-featured collection with all intelligence services:
 * - Comprehensive market data (CoinGecko + DeFiLlama)
 * - On-chain events
 * - Social signals (X/Twitter via XActions)
 * - Prediction markets (Polymarket + Manifold)
 * - Story clustering
 * - Source reliability tracking
 * 
 * Run hourly via GitHub Actions for maximum value capture.
 */

const fs = require('fs');
const path = require('path');
const { enrichArticle, mergeArticle, generateArticleId } = require('./enrich');
const { MarketDataService } = require('./services/market-data');
const { OnChainService } = require('./services/onchain-events');
const { SocialService } = require('./services/x-signals');
const { PredictionService } = require('./services/prediction-markets');
const { ClusteringService } = require('./services/story-clustering');
const { ReliabilityService } = require('./services/source-reliability');

// Configuration
const ARCHIVE_DIR = process.env.ARCHIVE_DIR || path.join(__dirname, '../../archive');
const API_URL = process.env.API_URL || 'https://cryptocurrency.cv';

// Feature flags (can be disabled for faster runs)
const FEATURES = {
  marketData: process.env.FEATURE_MARKET !== 'false',
  onChain: process.env.FEATURE_ONCHAIN !== 'false',
  social: process.env.FEATURE_SOCIAL !== 'false',
  predictions: process.env.FEATURE_PREDICTIONS !== 'false',
  clustering: process.env.FEATURE_CLUSTERING !== 'false',
  reliability: process.env.FEATURE_RELIABILITY !== 'false'
};

// =============================================================================
// CORE FUNCTIONS
// =============================================================================

async function fetchNews(endpoint = '/api/news', limit = 100) {
  try {
    const url = `${API_URL}${endpoint}?limit=${limit}`;
    console.log(`  📡 ${endpoint}...`);
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'FreeCryptoNews-Archiver/2.1'
      }
    });
    
    if (!response.ok) return [];
    
    const data = await response.json();
    return data.articles || [];
  } catch (error) {
    console.error(`  ⚠️ ${endpoint} failed: ${error.message}`);
    return [];
  }
}

function loadExistingArticles(filePath) {
  const articles = new Map();
  
  if (!fs.existsSync(filePath)) return articles;
  
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.trim().split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      try {
        const article = JSON.parse(line);
        if (article.id) articles.set(article.id, article);
      } catch {}
    }
  } catch (error) {
    console.error(`Error loading ${filePath}: ${error.message}`);
  }
  
  return articles;
}

function writeJsonl(filePath, articles) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  
  const lines = articles.map(a => JSON.stringify(a)).join('\n') + '\n';
  fs.writeFileSync(filePath, lines);
}

function appendJsonl(filePath, data) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  
  fs.appendFileSync(filePath, JSON.stringify(data) + '\n');
}

// =============================================================================
// SNAPSHOT GENERATION
// =============================================================================

function generateEnhancedSnapshot(articles, data) {
  const now = new Date();
  
  // Article stats
  const tickerCounts = {};
  const sourceCounts = {};
  const sentimentCounts = { bullish: 0, bearish: 0, neutral: 0 };
  
  for (const article of articles) {
    for (const ticker of (article.tickers || [])) {
      tickerCounts[ticker] = (tickerCounts[ticker] || 0) + 1;
    }
    
    const source = article.source_key || article.source;
    sourceCounts[source] = (sourceCounts[source] || 0) + 1;
    
    if (article.sentiment) {
      sentimentCounts[article.sentiment]++;
    }
  }
  
  const topTickers = Object.entries(tickerCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .map(([ticker, count]) => ({ ticker, count }));

  return {
    schema_version: '2.1.0',
    timestamp: now.toISOString(),
    hour: now.getUTCHours(),
    
    // Article overview
    articles: {
      count: articles.length,
      top_tickers: topTickers,
      source_counts: sourceCounts,
      sentiment: sentimentCounts
    },
    
    // Market state (full snapshot)
    market: data.market || null,
    
    // On-chain data
    onchain: data.onchain || null,
    
    // Social signals
    social: data.social ? {
      reddit: {
        total_active_users: data.social.reddit?.total_active_users,
        overall_sentiment: data.social.reddit?.overall_sentiment,
        trending_tickers: data.social.reddit?.trending_tickers,
        top_posts: data.social.reddit?.top_posts?.slice(0, 5)
      }
    } : null,
    
    // Prediction markets
    predictions: data.predictions ? {
      polymarket_count: data.predictions.polymarket?.market_count,
      manifold_count: data.predictions.manifold?.market_count,
      btc_predictions: data.predictions.highlights?.btc_predictions?.slice(0, 3),
      eth_predictions: data.predictions.highlights?.eth_predictions?.slice(0, 3)
    } : null,
    
    // Clustering results
    clustering: data.clustering ? {
      total_clusters: data.clustering.stats?.total_clusters,
      mega_stories: data.clustering.stats?.mega_stories,
      coordinated_count: data.clustering.stats?.coordinated_count,
      top_stories: data.clustering.clusters?.slice(0, 5).map(c => ({
        title: c.canonical_title,
        sources: c.source_count,
        first_mover: c.first_mover?.source
      }))
    } : null
  };
}

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
  console.log(`💾 Enhanced snapshot saved: ${snapshotPath}`);
}

// =============================================================================
// MAIN COLLECTION
// =============================================================================

async function collectEnhanced() {
  console.log('═'.repeat(60));
  console.log('🚀 ENHANCED ARCHIVE COLLECTION v2.1');
  console.log('═'.repeat(60));
  console.log(`📁 Archive: ${ARCHIVE_DIR}`);
  console.log(`🌐 API: ${API_URL}`);
  console.log(`⏰ Time: ${new Date().toISOString()}`);
  console.log('─'.repeat(60));
  
  const startTime = Date.now();
  const collectedData = {};
  
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  
  // File paths
  const articlesDir = path.join(ARCHIVE_DIR, 'v2', 'articles');
  const jsonlPath = path.join(articlesDir, `${year}-${month}.jsonl`);
  const marketPath = path.join(ARCHIVE_DIR, 'v2', 'market', `${year}-${month}.jsonl`);
  const onchainPath = path.join(ARCHIVE_DIR, 'v2', 'onchain', `${year}-${month}.jsonl`);
  const socialPath = path.join(ARCHIVE_DIR, 'v2', 'social', `${year}-${month}.jsonl`);
  const predictionsPath = path.join(ARCHIVE_DIR, 'v2', 'predictions', `${year}-${month}.jsonl`);
  
  // ==========================================================================
  // PHASE 1: Fetch all external data in parallel
  // ==========================================================================
  
  console.log('\n📊 PHASE 1: Fetching external data...');
  
  const dataPromises = [];
  
  // Market data
  if (FEATURES.marketData) {
    dataPromises.push(
      MarketDataService.getCompleteSnapshot()
        .then(data => { collectedData.market = data; })
        .catch(e => console.error('  ⚠️ Market data failed:', e.message))
    );
  }
  
  // On-chain data
  if (FEATURES.onChain) {
    dataPromises.push(
      OnChainService.getOnChainSnapshot()
        .then(data => { collectedData.onchain = data; })
        .catch(e => console.error('  ⚠️ On-chain data failed:', e.message))
    );
  }
  
  // Social signals
  if (FEATURES.social) {
    dataPromises.push(
      SocialService.getSocialSnapshot()
        .then(data => { collectedData.social = data; })
        .catch(e => console.error('  ⚠️ Social data failed:', e.message))
    );
  }
  
  // Prediction markets
  if (FEATURES.predictions) {
    dataPromises.push(
      PredictionService.getPredictionSnapshot()
        .then(data => { collectedData.predictions = data; })
        .catch(e => console.error('  ⚠️ Predictions failed:', e.message))
    );
  }
  
  await Promise.all(dataPromises);
  
  // ==========================================================================
  // PHASE 2: Fetch news articles
  // ==========================================================================
  
  console.log('\n📰 PHASE 2: Fetching news articles...');
  
  const [generalNews, bitcoinNews, defiNews, trendingNews, breakingNews] = await Promise.all([
    fetchNews('/api/news', 100),
    fetchNews('/api/bitcoin', 50),
    fetchNews('/api/defi', 50),
    fetchNews('/api/trending', 50),
    fetchNews('/api/breaking', 30)
  ]);
  
  // Combine and deduplicate
  const allNews = new Map();
  for (const article of [...generalNews, ...bitcoinNews, ...defiNews, ...trendingNews, ...breakingNews]) {
    if (article.link) {
      const id = generateArticleId(article.link);
      if (!allNews.has(id)) {
        allNews.set(id, article);
      }
    }
  }
  
  console.log(`  ✅ Found ${allNews.size} unique articles`);
  
  // ==========================================================================
  // PHASE 3: Process and enrich articles
  // ==========================================================================
  
  console.log('\n🔧 PHASE 3: Processing articles...');
  
  const existing = loadExistingArticles(jsonlPath);
  console.log(`  📂 Existing in archive: ${existing.size}`);
  
  // Create simple market context for enrichment
  const marketContext = collectedData.market ? {
    btc_price: collectedData.market.prices?.summary?.btc?.price,
    eth_price: collectedData.market.prices?.summary?.eth?.price,
    sol_price: collectedData.market.prices?.summary?.sol?.price,
    fear_greed_index: collectedData.market.sentiment?.fear_greed,
    total_market_cap: collectedData.market.global?.total_market_cap_usd,
    btc_dominance: collectedData.market.global?.btc_dominance
  } : null;
  
  const newArticles = [];
  const updatedArticles = [];
  const allProcessed = [];
  
  for (const [id, rawArticle] of allNews) {
    const enriched = enrichArticle(rawArticle, marketContext);
    
    if (existing.has(id)) {
      const merged = mergeArticle(existing.get(id), enriched);
      existing.set(id, merged);
      updatedArticles.push(merged);
      allProcessed.push(merged);
    } else {
      newArticles.push(enriched);
      existing.set(id, enriched);
      allProcessed.push(enriched);
    }
  }
  
  console.log(`  ✨ New: ${newArticles.length}`);
  console.log(`  🔄 Updated: ${updatedArticles.length}`);
  
  // ==========================================================================
  // PHASE 4: Clustering and reliability
  // ==========================================================================
  
  if (FEATURES.clustering && allProcessed.length > 0) {
    console.log('\n🔗 PHASE 4: Story clustering...');
    
    try {
      collectedData.clustering = ClusteringService.clusterArticles(allProcessed);
      
      console.log(`  📊 Clusters: ${collectedData.clustering.stats.total_clusters}`);
      console.log(`  🔥 Large stories: ${collectedData.clustering.stats.large_stories}`);
      
      // Update source reliability
      if (FEATURES.reliability) {
        await ReliabilityService.initialize();
        ReliabilityService.recordArticles(newArticles);
        ReliabilityService.processClusteringResults(collectedData.clustering);
        await ReliabilityService.save();
        console.log('  📈 Source reliability updated');
      }
    } catch (e) {
      console.error('  ⚠️ Clustering failed:', e.message);
    }
  }
  
  // ==========================================================================
  // PHASE 5: Save everything
  // ==========================================================================
  
  console.log('\n💾 PHASE 5: Saving data...');
  
  // Save articles
  if (newArticles.length > 0 || updatedArticles.length > 0) {
    writeJsonl(jsonlPath, Array.from(existing.values()));
    console.log(`  📄 Articles: ${jsonlPath}`);
  }
  
  // Save market data
  if (collectedData.market) {
    appendJsonl(marketPath, collectedData.market);
    console.log(`  📈 Market: ${marketPath}`);
  }
  
  // Save on-chain data
  if (collectedData.onchain) {
    appendJsonl(onchainPath, collectedData.onchain);
    console.log(`  ⛓️ On-chain: ${onchainPath}`);
  }
  
  // Save social data
  if (collectedData.social) {
    appendJsonl(socialPath, collectedData.social);
    console.log(`  📱 Social: ${socialPath}`);
  }
  
  // Save predictions
  if (collectedData.predictions) {
    appendJsonl(predictionsPath, collectedData.predictions);
    console.log(`  🎲 Predictions: ${predictionsPath}`);
  }
  
  // Generate and save enhanced snapshot
  const snapshot = generateEnhancedSnapshot(allProcessed, collectedData);
  saveSnapshot(snapshot);
  
  // Update stats (pass existing articles for accurate total count)
  updateEnhancedStats(newArticles.length, updatedArticles.length, collectedData, existing.size);
  
  // Update indexes with new articles only (append)
  if (newArticles.length > 0) {
    updateIndexes(newArticles);
  }
  
  // ==========================================================================
  // SUMMARY
  // ==========================================================================
  
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  
  console.log('\n' + '═'.repeat(60));
  console.log('✅ COLLECTION COMPLETE');
  console.log('═'.repeat(60));
  console.log(`⏱️ Duration: ${elapsed}s`);
  console.log(`📰 Articles: ${newArticles.length} new, ${updatedArticles.length} updated, ${existing.size} total`);
  
  if (collectedData.market) {
    console.log(`📊 Market: BTC $${collectedData.market.prices?.summary?.btc?.price?.toLocaleString() || 'N/A'}`);
  }
  if (collectedData.social?.reddit) {
    console.log(`📱 Social: ${collectedData.social.reddit.total_active_users?.toLocaleString() || 0} Reddit users online`);
  }
  if (collectedData.clustering) {
    console.log(`🔗 Clusters: ${collectedData.clustering.stats.total_clusters} story clusters`);
  }
  
  console.log('═'.repeat(60));
  
  return {
    new: newArticles.length,
    updated: updatedArticles.length,
    total: existing.size,
    duration: elapsed,
    features: Object.entries(FEATURES)
      .filter(([, enabled]) => enabled)
      .map(([name]) => name)
  };
}

// =============================================================================
// HELPERS
// =============================================================================

function updateEnhancedStats(newCount, updatedCount, data, totalArticleCount) {
  const statsPath = path.join(ARCHIVE_DIR, 'v2', 'meta', 'stats.json');
  const metaDir = path.dirname(statsPath);
  
  if (!fs.existsSync(metaDir)) fs.mkdirSync(metaDir, { recursive: true });
  
  let stats = {
    version: '2.1.0',
    total_articles: 0,
    total_fetches: 0,
    first_fetch: null,
    last_fetch: null,
    daily_counts: {},
    features_used: {}
  };
  
  if (fs.existsSync(statsPath)) {
    try {
      const existing = JSON.parse(fs.readFileSync(statsPath, 'utf-8'));
      stats = { ...stats, ...existing };
    } catch {}
  }
  
  // Ensure required fields exist (for backward compatibility)
  if (!stats.features_used) stats.features_used = {};
  if (!stats.daily_counts) stats.daily_counts = {};
  
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  
  // Use actual article count as source of truth for total
  stats.total_articles = totalArticleCount;
  stats.total_fetches++;
  stats.last_fetch = now.toISOString();
  if (!stats.first_fetch) stats.first_fetch = now.toISOString();
  stats.daily_counts[today] = (stats.daily_counts[today] || 0) + newCount;
  
  // Track feature usage
  Object.entries(FEATURES).forEach(([feature, enabled]) => {
    if (enabled) {
      stats.features_used[feature] = (stats.features_used[feature] || 0) + 1;
    }
  });
  
  // Latest market snapshot
  if (data.market) {
    stats.latest_market = {
      btc_price: data.market.prices?.summary?.btc?.price,
      eth_price: data.market.prices?.summary?.eth?.price,
      fear_greed: data.market.sentiment?.fear_greed,
      total_tvl: data.market.defi?.total_tvl,
      timestamp: data.market.timestamp
    };
  }
  
  fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2));
}

function updateIndexes(articles) {
  const indexDir = path.join(ARCHIVE_DIR, 'v2', 'index');
  if (!fs.existsSync(indexDir)) fs.mkdirSync(indexDir, { recursive: true });
  
  let bySource = {}, byTicker = {}, byDate = {};
  
  const paths = {
    source: path.join(indexDir, 'by-source.json'),
    ticker: path.join(indexDir, 'by-ticker.json'),
    date: path.join(indexDir, 'by-date.json')
  };
  
  // Load existing indexes
  try {
    if (fs.existsSync(paths.source)) bySource = JSON.parse(fs.readFileSync(paths.source, 'utf-8'));
    if (fs.existsSync(paths.ticker)) byTicker = JSON.parse(fs.readFileSync(paths.ticker, 'utf-8'));
    if (fs.existsSync(paths.date)) byDate = JSON.parse(fs.readFileSync(paths.date, 'utf-8'));
  } catch {}
  
  // Append new articles to indexes
  for (const article of articles) {
    const source = article.source_key || 'unknown';
    const pubDate = article.pub_date || article.first_seen;
    const date = pubDate?.split('T')[0] || new Date().toISOString().split('T')[0];
    
    if (!bySource[source]) bySource[source] = [];
    if (!bySource[source].includes(article.id)) bySource[source].push(article.id);
    
    for (const ticker of (article.tickers || [])) {
      if (!byTicker[ticker]) byTicker[ticker] = [];
      if (!byTicker[ticker].includes(article.id)) byTicker[ticker].push(article.id);
    }
    
    if (!byDate[date]) byDate[date] = [];
    if (!byDate[date].includes(article.id)) byDate[date].push(article.id);
  }
  
  fs.writeFileSync(paths.source, JSON.stringify(bySource, null, 2));
  fs.writeFileSync(paths.ticker, JSON.stringify(byTicker, null, 2));
  fs.writeFileSync(paths.date, JSON.stringify(byDate, null, 2));
  
  console.log('  📇 Indexes updated');
}

// =============================================================================
// CLI
// =============================================================================

if (require.main === module) {
  console.log('\n');
  collectEnhanced()
    .then(result => {
      console.log(`\n📋 Result: ${JSON.stringify(result)}`);
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ COLLECTION FAILED:', error);
      console.error(error.stack);
      process.exit(1);
    });
}

module.exports = { collectEnhanced };
