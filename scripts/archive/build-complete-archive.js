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
 * Complete Historical Archive Builder
 * 
 * Downloads the CryptoPanic dataset, resolves all URLs, and builds
 * a unified archive with full enrichment.
 * 
 * This is the FULL implementation - no shortcuts.
 * 
 * Steps:
 * 1. Download dataset from GitHub (soheilrahsaz/cryptoNewsDataset)
 * 2. Extract CSV from RAR
 * 3. Resolve ALL CryptoPanic URLs to real source URLs
 * 4. Import all articles into unified format
 * 5. Enrich all articles (sentiment, tickers, entities)
 * 6. Build comprehensive index
 * 
 * Usage:
 *   node build-complete-archive.js              # Full run
 *   node build-complete-archive.js --skip-download  # Skip download if CSV exists
 *   node build-complete-archive.js --skip-resolve   # Skip URL resolution if cache exists
 *   node build-complete-archive.js --dry-run        # Preview without writing
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createReadStream } from 'fs';
import { createInterface } from 'readline';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WORKSPACE_ROOT = path.join(__dirname, '..', '..');

// ============================================================
// CONFIGURATION
// ============================================================

const CONFIG = {
  // Paths
  tempDir: path.join(WORKSPACE_ROOT, '.temp-import'),
  archiveDir: path.join(WORKSPACE_ROOT, 'archive'),
  cacheDir: path.join(WORKSPACE_ROOT, '.temp-import', 'cache'),
  
  // Dataset
  datasetRepo: 'soheilrahsaz/cryptoNewsDataset',
  rarFileName: 'news_currencies_source_joinedResult.rar',
  csvFileName: 'news_currencies_source_joinedResult.csv',
  
  // URL Resolution
  urlCachePath: path.join(WORKSPACE_ROOT, '.temp-import', 'cache', 'resolved-urls.json'),
  concurrency: 30,
  requestDelay: 50,
  maxRetries: 3,
  timeout: 10000,
  
  // Enrichment lexicons
  sentimentLexicon: {
    bullish: ['bullish', 'surge', 'soar', 'rally', 'gain', 'rise', 'jump', 'spike', 'moon', 'pump', 
              'breakout', 'all-time high', 'ath', 'green', 'buy', 'long', 'upgrade', 'adoption',
              'partnership', 'launch', 'milestone', 'record', 'growth', 'profit', 'boom', 'support'],
    bearish: ['bearish', 'crash', 'plunge', 'dump', 'drop', 'fall', 'decline', 'sink', 'tank',
              'selloff', 'sell-off', 'correction', 'red', 'sell', 'short', 'downgrade', 'hack',
              'scam', 'fraud', 'lawsuit', 'ban', 'warning', 'risk', 'loss', 'fear', 'resistance']
  },
  
  // Top cryptocurrencies for ticker extraction
  cryptoTickers: new Map([
    ['bitcoin', 'BTC'], ['btc', 'BTC'],
    ['ethereum', 'ETH'], ['eth', 'ETH'], ['ether', 'ETH'],
    ['solana', 'SOL'], ['sol', 'SOL'],
    ['cardano', 'ADA'], ['ada', 'ADA'],
    ['ripple', 'XRP'], ['xrp', 'XRP'],
    ['dogecoin', 'DOGE'], ['doge', 'DOGE'],
    ['polkadot', 'DOT'], ['dot', 'DOT'],
    ['avalanche', 'AVAX'], ['avax', 'AVAX'],
    ['chainlink', 'LINK'], ['link', 'LINK'],
    ['polygon', 'MATIC'], ['matic', 'MATIC'],
    ['uniswap', 'UNI'], ['uni', 'UNI'],
    ['litecoin', 'LTC'], ['ltc', 'LTC'],
    ['shiba', 'SHIB'], ['shib', 'SHIB'], ['shiba inu', 'SHIB'],
    ['tron', 'TRX'], ['trx', 'TRX'],
    ['cosmos', 'ATOM'], ['atom', 'ATOM'],
    ['near', 'NEAR'], ['near protocol', 'NEAR'],
    ['aptos', 'APT'], ['apt', 'APT'],
    ['arbitrum', 'ARB'], ['arb', 'ARB'],
    ['optimism', 'OP'], ['op', 'OP'],
    ['sui', 'SUI'],
    ['binance', 'BNB'], ['bnb', 'BNB'],
    ['tether', 'USDT'], ['usdt', 'USDT'],
    ['usdc', 'USDC'], ['usd coin', 'USDC'],
    ['pepe', 'PEPE'],
    ['apecoin', 'APE'], ['ape', 'APE'],
  ]),
  
  // Entity patterns
  entityPatterns: {
    exchange: /\b(binance|coinbase|kraken|ftx|gemini|bitstamp|kucoin|okx|bybit|huobi|bitfinex)\b/gi,
    company: /\b(tesla|microstrategy|blackrock|fidelity|grayscale|ark invest|galaxy digital|square|paypal)\b/gi,
    person: /\b(satoshi|vitalik|cz|sbf|elon musk|michael saylor|cathie wood|gary gensler)\b/gi,
    regulator: /\b(sec|cftc|fed|federal reserve|treasury|doj|fbi|irs|fca|esma)\b/gi,
  }
};

// ============================================================
// UTILITIES
// ============================================================

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function formatTime(seconds) {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  const hours = Math.floor(seconds / 3600);
  const mins = Math.round((seconds % 3600) / 60);
  return `${hours}h ${mins}m`;
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function parseCSVLine(line) {
  const fields = [];
  let field = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        field += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      fields.push(field);
      field = '';
    } else {
      field += char;
    }
  }
  fields.push(field);
  return fields;
}

// ============================================================
// STEP 1: DOWNLOAD DATASET
// ============================================================

async function downloadDataset(args) {
  console.log('\n========================================');
  console.log('STEP 1: Download Dataset');
  console.log('========================================\n');
  
  ensureDir(CONFIG.tempDir);
  ensureDir(CONFIG.cacheDir);
  
  const csvPath = path.join(CONFIG.tempDir, CONFIG.csvFileName);
  
  // Check if CSV already exists
  if (fs.existsSync(csvPath) && args.skipDownload) {
    console.log(`CSV already exists: ${csvPath}`);
    console.log('Skipping download (--skip-download flag)');
    return csvPath;
  }
  
  // Get download URL from GitHub API
  console.log(`Fetching download URL from ${CONFIG.datasetRepo}...`);
  
  try {
    const { stdout } = await execAsync(
      `gh api repos/${CONFIG.datasetRepo}/releases/latest --jq '.assets[0].browser_download_url'`
    );
    const downloadUrl = stdout.trim();
    
    if (!downloadUrl) {
      throw new Error('No download URL found');
    }
    
    console.log(`Download URL: ${downloadUrl}`);
    
    // Download RAR file
    const rarPath = path.join(CONFIG.tempDir, CONFIG.rarFileName);
    console.log(`\nDownloading to ${rarPath}...`);
    
    await execAsync(`curl -L -o "${rarPath}" "${downloadUrl}"`, { maxBuffer: 1024 * 1024 * 100 });
    
    console.log('Download complete!');
    
    // Extract RAR
    console.log('\nExtracting RAR file...');
    await execAsync(`cd "${CONFIG.tempDir}" && unrar x -o+ "${CONFIG.rarFileName}"`);
    
    // Find CSV
    const { stdout: findResult } = await execAsync(`find "${CONFIG.tempDir}" -name "*.csv" | head -1`);
    const foundCsv = findResult.trim();
    
    if (!foundCsv) {
      throw new Error('No CSV found after extraction');
    }
    
    // Move to expected location
    if (foundCsv !== csvPath) {
      await execAsync(`mv "${foundCsv}" "${csvPath}"`);
    }
    
    console.log(`Extracted: ${csvPath}`);
    return csvPath;
    
  } catch (error) {
    console.error('Download failed:', error.message);
    
    // Try alternative: direct gh release download
    console.log('\nTrying alternative download method...');
    try {
      await execAsync(`gh release download -R ${CONFIG.datasetRepo} -p "*.rar" -D "${CONFIG.tempDir}"`);
      await execAsync(`cd "${CONFIG.tempDir}" && unrar x -o+ *.rar`);
      
      const { stdout: findResult } = await execAsync(`find "${CONFIG.tempDir}" -name "*.csv" | head -1`);
      const foundCsv = findResult.trim();
      
      if (foundCsv) {
        if (foundCsv !== csvPath) {
          await execAsync(`mv "${foundCsv}" "${csvPath}"`);
        }
        console.log(`Extracted: ${csvPath}`);
        return csvPath;
      }
    } catch {
      // Continue to manual instructions
    }
    
    console.log('\n===========================================');
    console.log('MANUAL DOWNLOAD REQUIRED');
    console.log('===========================================');
    console.log('1. Go to: https://github.com/soheilrahsaz/cryptoNewsDataset/releases');
    console.log('2. Download the latest .rar file');
    console.log(`3. Extract to: ${CONFIG.tempDir}`);
    console.log(`4. Ensure CSV is at: ${csvPath}`);
    console.log('5. Run this script again with --skip-download');
    process.exit(1);
  }
}

// ============================================================
// STEP 2: EXTRACT UNIQUE ARTICLES
// ============================================================

async function extractUniqueArticles(csvPath) {
  console.log('\n========================================');
  console.log('STEP 2: Extract Unique Articles');
  console.log('========================================\n');
  
  const articles = new Map(); // id -> article data
  
  const fileStream = createReadStream(csvPath);
  const rl = createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });
  
  let lineNum = 0;
  let headers = [];
  
  for await (const line of rl) {
    lineNum++;
    
    if (lineNum === 1) {
      headers = line.toLowerCase().split(',');
      continue;
    }
    
    const fields = parseCSVLine(line);
    const row = {};
    headers.forEach((h, i) => {
      row[h] = fields[i] || '';
    });
    
    const id = row.id;
    if (!id) continue;
    
    // If we haven't seen this article, store it
    if (!articles.has(id)) {
      articles.set(id, {
        id,
        title: row.title || '',
        description: row.description || '',
        sourceDomain: row.sourcedomain || '',
        sourceUrl: row.sourceurl || '',
        cryptopanicUrl: row.url || '',
        datetime: row.newsdatetime || '',
        votes: {
          negative: parseInt(row.negative) || 0,
          positive: parseInt(row.positive) || 0,
          important: parseInt(row.important) || 0,
          liked: parseInt(row.liked) || 0,
          disliked: parseInt(row.disliked) || 0,
          lol: parseInt(row.lol) || 0,
          toxic: parseInt(row.toxic) || 0,
          saved: parseInt(row.saved) || 0,
          comments: parseInt(row.comments) || 0,
        },
        currencies: []
      });
    }
    
    // Add currency tag
    const currency = row.currencies?.toUpperCase();
    if (currency && !articles.get(id).currencies.includes(currency)) {
      articles.get(id).currencies.push(currency);
    }
    
    if (lineNum % 100000 === 0) {
      console.log(`  Processed ${lineNum.toLocaleString()} rows, ${articles.size.toLocaleString()} unique articles...`);
    }
  }
  
  console.log(`\nFound ${articles.size.toLocaleString()} unique articles from ${lineNum.toLocaleString()} rows`);
  
  return articles;
}

// ============================================================
// STEP 3: RESOLVE CRYPTOPANIC URLs
// ============================================================

/**
 * True when a URL points at cryptopanic.com (or a subdomain). Relative
 * redirect locations resolve against cryptopanic.com and count as internal.
 */
function isCryptoPanicUrl(value) {
  let hostname;
  try {
    hostname = new URL(value, 'https://cryptopanic.com/').hostname.toLowerCase();
  } catch {
    return false;
  }
  return hostname === 'cryptopanic.com' || hostname.endsWith('.cryptopanic.com');
}

async function resolveUrl(articleId, retryCount = 0) {
  const clickUrl = `https://cryptopanic.com/news/click/${articleId}/`;
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.timeout);
    
    const response = await fetch(clickUrl, {
      method: 'HEAD',
      redirect: 'manual',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CryptoNewsArchiver/1.0)',
      }
    });
    
    clearTimeout(timeoutId);
    
    if (response.status === 302 || response.status === 301) {
      const location = response.headers.get('location');
      if (location && !isCryptoPanicUrl(location)) {
        return { id: articleId, url: location, status: 'resolved' };
      }
    }
    
    if (response.status === 404) {
      return { id: articleId, url: null, status: 'not_found' };
    }
    
    if (response.status === 429) {
      if (retryCount < CONFIG.maxRetries) {
        await sleep(CONFIG.retryDelay * Math.pow(2, retryCount));
        return resolveUrl(articleId, retryCount + 1);
      }
      return { id: articleId, url: null, status: 'rate_limited' };
    }
    
    // Try GET request as fallback
    const getResponse = await fetch(clickUrl, {
      method: 'GET',
      redirect: 'manual',
      signal: AbortSignal.timeout(CONFIG.timeout),
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CryptoNewsArchiver/1.0)',
      }
    });
    
    if (getResponse.status === 302 || getResponse.status === 301) {
      const location = getResponse.headers.get('location');
      if (location && !isCryptoPanicUrl(location)) {
        return { id: articleId, url: location, status: 'resolved' };
      }
    }
    
    return { id: articleId, url: null, status: `http_${response.status}` };
    
  } catch (error) {
    if (retryCount < CONFIG.maxRetries) {
      await sleep(CONFIG.retryDelay * Math.pow(2, retryCount));
      return resolveUrl(articleId, retryCount + 1);
    }
    return { id: articleId, url: null, status: 'error' };
  }
}

async function resolveAllUrls(articles, args) {
  console.log('\n========================================');
  console.log('STEP 3: Resolve CryptoPanic URLs');
  console.log('========================================\n');
  
  // Load cache
  let cache = {};
  try {
    cache = JSON.parse(fs.readFileSync(CONFIG.urlCachePath, 'utf-8'));
    console.log(`Loaded ${Object.keys(cache).length.toLocaleString()} cached URLs`);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.log('Starting with fresh cache');
    }
  }
  
  // Filter articles that need URL resolution
  const needsResolution = [];
  let alreadyHasUrl = 0;
  let alreadyCached = 0;
  
  for (const [id, article] of articles) {
    // If already has sourceUrl from CSV, use that
    if (article.sourceUrl && !isCryptoPanicUrl(article.sourceUrl)) {
      alreadyHasUrl++;
      continue;
    }
    
    // If already in cache
    if (cache[id] !== undefined) {
      alreadyCached++;
      article.resolvedUrl = cache[id];
      continue;
    }
    
    needsResolution.push(id);
  }
  
  console.log(`Articles with sourceUrl: ${alreadyHasUrl.toLocaleString()}`);
  console.log(`Already cached: ${alreadyCached.toLocaleString()}`);
  console.log(`Need resolution: ${needsResolution.toLocaleString()}`);
  
  if (args.skipResolve && needsResolution.length > 0) {
    console.log('\n--skip-resolve flag set, skipping URL resolution');
    console.log('WARNING: Some articles will not have URLs');
    return cache;
  }
  
  if (needsResolution.length === 0) {
    console.log('\nNo URLs need resolution!');
    return cache;
  }
  
  // Resolve URLs in batches
  console.log(`\nResolving ${needsResolution.length.toLocaleString()} URLs...`);
  console.log(`Concurrency: ${CONFIG.concurrency}, Delay: ${CONFIG.requestDelay}ms`);
  console.log(`Estimated time: ${formatTime(needsResolution.length / CONFIG.concurrency * (CONFIG.requestDelay / 1000 + 0.3))}`);
  console.log();
  
  const startTime = Date.now();
  let resolved = 0;
  let failed = 0;
  let lastSave = 0;
  
  for (let i = 0; i < needsResolution.length; i += CONFIG.concurrency) {
    const batch = needsResolution.slice(i, i + CONFIG.concurrency);
    const results = await Promise.all(batch.map(id => resolveUrl(id)));
    
    for (const result of results) {
      cache[result.id] = result.url;
      if (result.status === 'resolved') {
        resolved++;
        articles.get(result.id).resolvedUrl = result.url;
      } else {
        failed++;
      }
    }
    
    const processed = i + batch.length;
    const elapsed = (Date.now() - startTime) / 1000;
    const rate = processed / elapsed;
    const remaining = (needsResolution.length - processed) / rate;
    
    if (processed % 500 === 0 || processed === needsResolution.length) {
      const pct = ((processed / needsResolution.length) * 100).toFixed(1);
      console.log(
        `Progress: ${processed.toLocaleString()}/${needsResolution.length.toLocaleString()} (${pct}%) | ` +
        `Resolved: ${resolved.toLocaleString()} | Failed: ${failed.toLocaleString()} | ` +
        `Rate: ${rate.toFixed(1)}/s | ETA: ${formatTime(remaining)}`
      );
    }
    
    // Save cache periodically
    if (resolved - lastSave >= 1000) {
      fs.writeFileSync(CONFIG.urlCachePath, JSON.stringify(cache, null, 2));
      lastSave = resolved;
    }
    
    await sleep(CONFIG.requestDelay);
  }
  
  // Final save
  fs.writeFileSync(CONFIG.urlCachePath, JSON.stringify(cache, null, 2));
  
  console.log(`\nResolution complete! Resolved: ${resolved.toLocaleString()}, Failed: ${failed.toLocaleString()}`);
  
  return cache;
}

// ============================================================
// STEP 4: ENRICH ARTICLES
// ============================================================

function analyzeSentiment(text) {
  const lowerText = text.toLowerCase();
  let bullishScore = 0;
  let bearishScore = 0;
  
  for (const word of CONFIG.sentimentLexicon.bullish) {
    if (lowerText.includes(word)) bullishScore++;
  }
  for (const word of CONFIG.sentimentLexicon.bearish) {
    if (lowerText.includes(word)) bearishScore++;
  }
  
  if (bullishScore > bearishScore + 1) return 'bullish';
  if (bearishScore > bullishScore + 1) return 'bearish';
  return 'neutral';
}

function extractTickers(text) {
  const tickers = new Set();
  const lowerText = text.toLowerCase();
  
  for (const [keyword, ticker] of CONFIG.cryptoTickers) {
    if (lowerText.includes(keyword)) {
      tickers.add(ticker);
    }
  }
  
  // Also look for $TICKER patterns
  const tickerMatches = text.match(/\$([A-Z]{2,10})\b/g) || [];
  for (const match of tickerMatches) {
    tickers.add(match.slice(1));
  }
  
  return [...tickers];
}

function extractEntities(text) {
  const entities = {
    exchanges: [],
    companies: [],
    people: [],
    regulators: []
  };
  
  for (const [type, pattern] of Object.entries(CONFIG.entityPatterns)) {
    const matches = text.match(pattern) || [];
    const unique = [...new Set(matches.map(m => m.toLowerCase()))];
    entities[type + (type.endsWith('s') ? '' : 's')] = unique;
  }
  
  return entities;
}

function categorizeArticle(text, currencies) {
  const lowerText = text.toLowerCase();
  
  if (currencies.includes('BTC') || lowerText.includes('bitcoin')) return 'bitcoin';
  if (currencies.includes('ETH') || lowerText.includes('ethereum')) return 'ethereum';
  if (lowerText.includes('defi') || lowerText.includes('yield') || lowerText.includes('lending')) return 'defi';
  if (lowerText.includes('nft') || lowerText.includes('opensea') || lowerText.includes('collectible')) return 'nft';
  if (lowerText.includes('regulation') || lowerText.includes('sec') || lowerText.includes('lawsuit')) return 'regulation';
  if (currencies.length > 0) return 'altcoin';
  return 'general';
}

function getSourceNameFromDomain(domain) {
  const sourceMap = {
    'cointelegraph.com': 'CoinTelegraph',
    'coindesk.com': 'CoinDesk',
    'decrypt.co': 'Decrypt',
    'bitcoinist.com': 'Bitcoinist',
    'dailyhodl.com': 'The Daily Hodl',
    'newsbtc.com': 'NewsBTC',
    'u.today': 'U.Today',
    'beincrypto.com': 'BeInCrypto',
    'cryptoslate.com': 'CryptoSlate',
    'blockonomi.com': 'Blockonomi',
    'ambcrypto.com': 'AMBCrypto',
    'coingape.com': 'CoinGape',
    'cryptopotato.com': 'CryptoPotato',
    'theblockcrypto.com': 'The Block',
    'theblock.co': 'The Block',
    'bloomberg.com': 'Bloomberg',
    'reuters.com': 'Reuters',
    'cnbc.com': 'CNBC',
    'forbes.com': 'Forbes',
    'watcher.guru': 'Watcher.Guru',
    'zycrypto.com': 'ZyCrypto',
  };
  
  return sourceMap[domain] || domain.replace(/^www\./, '').split('.')[0];
}

function enrichArticle(article) {
  const text = `${article.title} ${article.description}`;
  
  return {
    sentiment: analyzeSentiment(text),
    tickers: extractTickers(text),
    entities: extractEntities(text),
    category: categorizeArticle(text, article.currencies),
  };
}

// ============================================================
// STEP 5: BUILD UNIFIED ARCHIVE
// ============================================================

async function buildUnifiedArchive(articles, urlCache, args) {
  console.log('\n========================================');
  console.log('STEP 5: Build Unified Archive');
  console.log('========================================\n');
  
  // Group articles by date
  const byDate = new Map();
  let skipped = 0;
  let processed = 0;
  
  for (const [id, article] of articles) {
    // Determine final URL
    let finalUrl = article.sourceUrl;
    if (!finalUrl || isCryptoPanicUrl(finalUrl)) {
      finalUrl = article.resolvedUrl || urlCache[id];
    }
    
    // Skip if no valid URL
    if (!finalUrl) {
      skipped++;
      continue;
    }
    
    // Parse date
    const datetime = article.datetime;
    if (!datetime) {
      skipped++;
      continue;
    }
    
    let pubDate;
    try {
      pubDate = new Date(datetime);
      if (isNaN(pubDate.getTime())) {
        skipped++;
        continue;
      }
    } catch {
      skipped++;
      continue;
    }
    
    const dateStr = pubDate.toISOString().split('T')[0];
    
    if (!byDate.has(dateStr)) {
      byDate.set(dateStr, []);
    }
    
    // Get source from URL
    let domain = article.sourceDomain || '';
    try {
      const urlObj = new URL(finalUrl);
      domain = urlObj.hostname.replace(/^www\./, '');
    } catch {
      // Keep CSV domain
    }
    
    // Enrich article
    const enrichment = enrichArticle(article);
    
    // Build unified article object
    const unifiedArticle = {
      id: article.id,
      title: article.title,
      link: finalUrl,
      pubDate: pubDate.toISOString(),
      source: getSourceNameFromDomain(domain),
      sourceKey: domain.replace(/\./g, '').toLowerCase(),
      category: enrichment.category,
      description: article.description || '',
      currencies: article.currencies.length > 0 ? article.currencies : enrichment.tickers,
      votes: {
        positive: article.votes.positive + article.votes.liked,
        negative: article.votes.negative + article.votes.disliked,
      },
      sentiment: enrichment.sentiment,
      // Enrichment fields
      tickers: enrichment.tickers,
      entities: enrichment.entities,
      engagement: {
        important: article.votes.important,
        saved: article.votes.saved,
        comments: article.votes.comments,
      }
    };
    
    byDate.get(dateStr).push(unifiedArticle);
    processed++;
    
    if (processed % 10000 === 0) {
      console.log(`  Processed ${processed.toLocaleString()} articles...`);
    }
  }
  
  console.log(`\nProcessed: ${processed.toLocaleString()}`);
  console.log(`Skipped (no URL): ${skipped.toLocaleString()}`);
  console.log(`Unique dates: ${byDate.size.toLocaleString()}`);
  
  // Sort dates and articles
  const sortedDates = [...byDate.keys()].sort();
  
  if (args.dryRun) {
    console.log('\n--dry-run flag set, not writing files');
    return { dates: sortedDates, articleCounts: new Map() };
  }
  
  // Write archive files
  console.log('\nWriting archive files...');
  const articleCounts = new Map();
  let written = 0;
  
  for (const date of sortedDates) {
    const articles = byDate.get(date);
    
    // Sort by pubDate descending
    articles.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
    
    // Create directory structure
    const [year, month] = date.split('-');
    const dirPath = path.join(CONFIG.archiveDir, year, month);
    ensureDir(dirPath);
    
    // Build archive entry
    const archiveEntry = {
      date,
      fetchedAt: new Date().toISOString(),
      articleCount: articles.length,
      source: 'historical-import-v3',
      articles
    };
    
    // Write file
    const filePath = path.join(dirPath, `${date}.json`);
    fs.writeFileSync(filePath, JSON.stringify(archiveEntry, null, 2));
    
    articleCounts.set(date, articles.length);
    written++;
    
    if (written % 100 === 0) {
      console.log(`  Written ${written.toLocaleString()}/${sortedDates.length.toLocaleString()} files...`);
    }
  }
  
  console.log(`\nWritten ${written.toLocaleString()} archive files`);
  
  return { dates: sortedDates, articleCounts };
}

// ============================================================
// STEP 6: BUILD INDEX
// ============================================================

async function buildIndex(dates, articleCounts, args) {
  console.log('\n========================================');
  console.log('STEP 6: Build Archive Index');
  console.log('========================================\n');
  
  if (args.dryRun) {
    console.log('--dry-run flag set, not writing index');
    return;
  }
  
  // Also include any dates not in our import (from v2 or existing data)
  const existingDates = new Set(dates);
  
  // Scan archive directory for additional dates
  const years = fs.readdirSync(CONFIG.archiveDir)
    .filter(f => /^\d{4}$/.test(f));
  
  for (const year of years) {
    const yearPath = path.join(CONFIG.archiveDir, year);
    if (!fs.statSync(yearPath).isDirectory()) continue;
    
    const months = fs.readdirSync(yearPath).filter(f => /^\d{2}$/.test(f));
    for (const month of months) {
      const monthPath = path.join(yearPath, month);
      if (!fs.statSync(monthPath).isDirectory()) continue;
      
      const files = fs.readdirSync(monthPath).filter(f => f.endsWith('.json'));
      for (const file of files) {
        const date = file.replace('.json', '');
        if (!existingDates.has(date)) {
          existingDates.add(date);
          // Get article count from file
          try {
            const data = JSON.parse(fs.readFileSync(path.join(monthPath, file), 'utf-8'));
            articleCounts.set(date, data.articleCount || 0);
          } catch {
            articleCounts.set(date, 0);
          }
        }
      }
    }
  }
  
  const allDates = [...existingDates].sort();
  const totalArticles = [...articleCounts.values()].reduce((a, b) => a + b, 0);
  
  const index = {
    lastUpdated: new Date().toISOString(),
    totalArticles,
    dateRange: {
      earliest: allDates[0],
      latest: allDates[allDates.length - 1]
    },
    availableDates: allDates
  };
  
  const indexPath = path.join(CONFIG.archiveDir, 'index.json');
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
  
  console.log(`Index written: ${indexPath}`);
  console.log(`Total dates: ${allDates.length.toLocaleString()}`);
  console.log(`Total articles: ${totalArticles.toLocaleString()}`);
  console.log(`Date range: ${index.dateRange.earliest} to ${index.dateRange.latest}`);
}

// ============================================================
// STEP 7: CLEANUP
// ============================================================

async function cleanup(args) {
  console.log('\n========================================');
  console.log('STEP 7: Cleanup');
  console.log('========================================\n');
  
  if (args.dryRun) {
    console.log('--dry-run flag set, skipping cleanup');
    return;
  }
  
  // Remove v2 folder
  const v2Path = path.join(CONFIG.archiveDir, 'v2');
  if (fs.existsSync(v2Path)) {
    console.log('Removing v2 folder (merged into unified format)...');
    fs.rmSync(v2Path, { recursive: true, force: true });
    console.log('v2 folder removed');
  } else {
    console.log('v2 folder does not exist, nothing to remove');
  }
  
  // Optionally cleanup temp files
  if (args.cleanupTemp) {
    console.log('\nRemoving temp import files...');
    fs.rmSync(CONFIG.tempDir, { recursive: true, force: true });
    console.log('Temp files removed');
  } else {
    console.log('\nKeeping temp files (URL cache) for future use');
    console.log(`Cache location: ${CONFIG.cacheDir}`);
  }
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║        COMPLETE HISTORICAL ARCHIVE BUILDER                  ║');
  console.log('║        Full Implementation - No Shortcuts                   ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log();
  
  const args = process.argv.slice(2).reduce((acc, arg) => {
    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=');
      const camelKey = key.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
      acc[camelKey] = value === undefined ? true : value;
    }
    return acc;
  }, {});
  
  console.log('Arguments:', args);
  console.log();
  
  const startTime = Date.now();
  
  try {
    // Step 1: Download dataset
    const csvPath = await downloadDataset(args);
    
    // Step 2: Extract unique articles
    const articles = await extractUniqueArticles(csvPath);
    
    // Step 3: Resolve CryptoPanic URLs
    const urlCache = await resolveAllUrls(articles, args);
    
    // Step 4 & 5: Enrich and build unified archive
    const { dates, articleCounts } = await buildUnifiedArchive(articles, urlCache, args);
    
    // Step 6: Build index
    await buildIndex(dates, articleCounts, args);
    
    // Step 7: Cleanup
    await cleanup(args);
    
    const totalTime = (Date.now() - startTime) / 1000;
    
    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║                    BUILD COMPLETE!                          ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log();
    console.log(`Total time: ${formatTime(totalTime)}`);
    console.log();
    console.log('Next steps:');
    console.log('1. Verify data: node scripts/archive/verify-archive.js');
    console.log('2. Test API: curl "http://localhost:3000/api/archive?date=2023-01-15"');
    console.log('3. Commit changes: git add archive/ && git commit -m "Add historical archive"');
    
  } catch (error) {
    console.error('\n❌ BUILD FAILED:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
