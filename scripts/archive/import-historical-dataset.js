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
 * Import Historical Crypto News Dataset
 * 
 * Downloads 248k+ historical crypto news articles (2017-2025) and converts
 * them to the free-crypto-news archive format.
 * 
 * Source: https://github.com/soheilrahsaz/cryptoNewsDataset
 * 
 * Usage:
 *   node import-historical-dataset.js [options]
 * 
 * Options:
 *   --download    Download fresh RAR files (default: use existing if present)
 *   --start-date  Start date to import (YYYY-MM-DD)
 *   --end-date    End date to import (YYYY-MM-DD)
 *   --dry-run     Preview without writing files
 *   --resolve-urls  Resolve CryptoPanic URLs to real source URLs (slow but complete)
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const readline = require('readline');

// Configuration
const ARCHIVE_DIR = process.env.ARCHIVE_DIR || path.join(__dirname, '../../archive');
const TEMP_DIR = path.join(__dirname, '.temp-import');
const DATASET_BASE_URL = 'https://github.com/soheilrahsaz/cryptoNewsDataset/raw/main/csvOutput';
const RESOLVED_CACHE_PATH = path.join(TEMP_DIR, 'resolved-urls.json');

// Resolved URL cache (loaded at startup)
let resolvedUrlCache = {};

// RAR files to download (in order of preference for joined data)
const RAR_FILES = [
  'news_currencies_source_joinedResult.rar', // Best - has everything pre-joined
];

// Source mapping from dataset source names to our sourceKey
const SOURCE_MAP = {
  'CoinDesk': { sourceKey: 'coindesk', category: 'general' },
  'CoinTelegraph': { sourceKey: 'cointelegraph', category: 'general' },
  'Cointelegraph': { sourceKey: 'cointelegraph', category: 'general' },
  'Decrypt': { sourceKey: 'decrypt', category: 'general' },
  'The Block': { sourceKey: 'theblock', category: 'general' },
  'Bitcoin Magazine': { sourceKey: 'bitcoinmagazine', category: 'bitcoin' },
  'Blockworks': { sourceKey: 'blockworks', category: 'general' },
  'The Defiant': { sourceKey: 'defiant', category: 'defi' },
  'Bitcoinist': { sourceKey: 'bitcoinist', category: 'bitcoin' },
  'BeInCrypto': { sourceKey: 'beincrypto', category: 'trading' },
  'NewsBTC': { sourceKey: 'newsbtc', category: 'bitcoin' },
  'CryptoSlate': { sourceKey: 'cryptoslate', category: 'general' },
  'CryptoPotato': { sourceKey: 'cryptopotato', category: 'general' },
  'U.Today': { sourceKey: 'utoday', category: 'general' },
  'AMBCrypto': { sourceKey: 'ambcrypto', category: 'trading' },
  'DailyCoin': { sourceKey: 'dailycoin', category: 'general' },
  'Crypto Briefing': { sourceKey: 'cryptobriefing', category: 'general' },
  'CoinGape': { sourceKey: 'coingape', category: 'general' },
  'Investing.com': { sourceKey: 'investing', category: 'mainstream' },
  'Yahoo Finance': { sourceKey: 'yahoo', category: 'mainstream' },
  'Reuters': { sourceKey: 'reuters', category: 'mainstream' },
  'Bloomberg': { sourceKey: 'bloomberg', category: 'mainstream' },
  'CNBC': { sourceKey: 'cnbc', category: 'mainstream' },
  'Forbes': { sourceKey: 'forbes', category: 'mainstream' },
  'DeFi Pulse': { sourceKey: 'defipulse', category: 'defi' },
  'Glassnode': { sourceKey: 'glassnode', category: 'onchain' },
  'CryptoQuant': { sourceKey: 'cryptoquant', category: 'onchain' },
  'IntoTheBlock': { sourceKey: 'intotheblock', category: 'onchain' },
  'Santiment': { sourceKey: 'santiment', category: 'onchain' },
  'Messari': { sourceKey: 'messari', category: 'research' },
  'Delphi Digital': { sourceKey: 'delphi', category: 'research' },
  'Coin Metrics': { sourceKey: 'coinmetrics', category: 'onchain' },
  // Default for unknown sources
  'default': { sourceKey: 'historical', category: 'general' }
};

// Category detection based on keywords in title
const CATEGORY_KEYWORDS = {
  'bitcoin': ['bitcoin', 'btc', 'satoshi', 'lightning network', 'halving'],
  'ethereum': ['ethereum', 'eth', 'vitalik', 'erc-20', 'erc20', 'gas fee'],
  'defi': ['defi', 'aave', 'uniswap', 'compound', 'yield', 'liquidity', 'tvl', 'lending', 'sushiswap', 'curve'],
  'nft': ['nft', 'opensea', 'bayc', 'cryptopunk', 'azuki', 'blur'],
  'trading': ['price', 'pump', 'dump', 'bull', 'bear', 'rally', 'crash', 'surge', 'plunge'],
  'regulation': ['sec', 'cftc', 'regulation', 'lawsuit', 'congress', 'legal', 'ban', 'law'],
  'altcoin': ['solana', 'sol', 'cardano', 'ada', 'xrp', 'ripple', 'dogecoin', 'doge', 'shiba'],
  'exchange': ['binance', 'coinbase', 'kraken', 'ftx', 'exchange', 'cex', 'dex'],
  'stablecoin': ['usdt', 'usdc', 'tether', 'stablecoin', 'circle', 'dai'],
  'mining': ['mining', 'miner', 'hashrate', 'difficulty', 'asic'],
  'layer2': ['layer 2', 'l2', 'rollup', 'optimism', 'arbitrum', 'polygon', 'zksync'],
};

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = {
    download: false,
    startDate: null,
    endDate: null,
    dryRun: false,
    verbose: false,
  };
  
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    switch (argv[i]) {
      case '--download':
        args.download = true;
        break;
      case '--start-date':
        args.startDate = argv[++i];
        break;
      case '--end-date':
        args.endDate = argv[++i];
        break;
      case '--dry-run':
        args.dryRun = true;
        break;
      case '--verbose':
      case '-v':
        args.verbose = true;
        break;
      case '--help':
      case '-h':
        console.log(`
Import Historical Crypto News Dataset - 248k+ articles

Usage:
  node import-historical-dataset.js [options]

Options:
  --download      Download fresh RAR files
  --start-date    Start date to import (YYYY-MM-DD)
  --end-date      End date to import (YYYY-MM-DD)
  --dry-run       Preview without writing files
  --verbose, -v   Verbose output
  --help, -h      Show this help
`);
        process.exit(0);
    }
  }
  
  return args;
}

/**
 * Ensure temp directory exists
 */
function ensureTempDir() {
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }
}

/**
 * Download RAR file from GitHub
 */
async function downloadRarFile(filename) {
  const url = `${DATASET_BASE_URL}/${filename}`;
  const outputPath = path.join(TEMP_DIR, filename);
  
  if (fs.existsSync(outputPath)) {
    console.log(`Using existing ${filename}`);
    return outputPath;
  }
  
  console.log(`Downloading ${filename}...`);
  try {
    execFileSync('curl', ['-L', '-o', outputPath, url], { 
      stdio: 'inherit',
      cwd: TEMP_DIR 
    });
    return outputPath;
  } catch (error) {
    console.error(`Failed to download ${filename}: ${error.message}`);
    return null;
  }
}

/**
 * Extract RAR file
 */
function extractRarFile(rarPath) {
  const extractDir = path.join(TEMP_DIR, 'extracted');
  if (!fs.existsSync(extractDir)) {
    fs.mkdirSync(extractDir, { recursive: true });
  }
  
  console.log(`Extracting ${path.basename(rarPath)}...`);
  try {
    // Try unrar first (most common)
    execFileSync('unrar', ['x', '-o+', rarPath, `${extractDir}/`], { 
      stdio: 'pipe',
      cwd: TEMP_DIR 
    });
  } catch {
    try {
      // Try 7z as fallback
      execFileSync('7z', ['x', '-y', `-o${extractDir}`, rarPath], { 
        stdio: 'pipe',
        cwd: TEMP_DIR 
      });
    } catch {
      try {
        // Try unar as another fallback (macOS)
        execFileSync('unar', ['-o', extractDir, rarPath], { 
          stdio: 'pipe',
          cwd: TEMP_DIR 
        });
      } catch (error) {
        console.error(`Failed to extract RAR. Install unrar, 7z, or unar.`);
        console.error(`  Ubuntu/Debian: sudo apt install unrar`);
        console.error(`  macOS: brew install unrar`);
        throw error;
      }
    }
  }
  
  return extractDir;
}

/**
 * Find CSV files in extracted directory
 */
function findCsvFiles(extractDir) {
  const files = [];
  
  function scanDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (entry.name.endsWith('.csv')) {
        files.push(fullPath);
      }
    }
  }
  
  scanDir(extractDir);
  return files;
}

/**
 * Parse CSV line handling quoted fields
 */
function parseCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  
  return result;
}

/**
 * Read CSV file as stream and return articles
 */
async function* readCsvFile(csvPath) {
  const fileStream = fs.createReadStream(csvPath, { encoding: 'utf-8' });
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });
  
  let headers = null;
  let lineNumber = 0;
  
  for await (const line of rl) {
    lineNumber++;
    
    if (lineNumber === 1) {
      // Parse header row
      headers = parseCsvLine(line).map(h => h.trim().toLowerCase());
      continue;
    }
    
    if (!line.trim()) continue;
    
    try {
      const values = parseCsvLine(line);
      const row = {};
      
      for (let i = 0; i < headers.length; i++) {
        row[headers[i]] = values[i] || '';
      }
      
      yield row;
    } catch (error) {
      // Skip malformed lines
      if (lineNumber < 10) {
        console.warn(`Line ${lineNumber}: Parse error`);
      }
    }
  }
}

/**
 * Detect category from title
 */
function detectCategory(title, source) {
  const titleLower = title.toLowerCase();
  
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (titleLower.includes(keyword)) {
        return category;
      }
    }
  }
  
  // Use source-based category as fallback
  const sourceInfo = SOURCE_MAP[source] || SOURCE_MAP['default'];
  return sourceInfo.category;
}

/**
 * Get source info
 */
function getSourceInfo(sourceName) {
  // Try exact match first
  if (SOURCE_MAP[sourceName]) {
    return { source: sourceName, ...SOURCE_MAP[sourceName] };
  }
  
  // Try case-insensitive match
  for (const [key, value] of Object.entries(SOURCE_MAP)) {
    if (key.toLowerCase() === sourceName.toLowerCase()) {
      return { source: key, ...value };
    }
  }
  
  // Default
  return { 
    source: sourceName || 'Historical', 
    sourceKey: sourceName ? sourceName.toLowerCase().replace(/[^a-z0-9]/g, '') : 'historical',
    category: 'general' 
  };
}

/**
 * Check if description is valid (not empty, null-like, or placeholder)
 */
function isValidDescription(desc) {
  if (!desc) return false;
  const trimmed = desc.trim();
  if (!trimmed) return false;
  // Filter out placeholder values
  const invalidValues = ['null', 'none', 'n/a', '-', '--', '...', 'undefined'];
  if (invalidValues.includes(trimmed.toLowerCase())) return false;
  // Too short to be useful
  if (trimmed.length < 10) return false;
  return true;
}

// Domain to source name mapping
const DOMAIN_TO_SOURCE = {
  'cointelegraph.com': 'CoinTelegraph',
  'coindesk.com': 'CoinDesk',
  'decrypt.co': 'Decrypt',
  'theblock.co': 'The Block',
  'bitcoinmagazine.com': 'Bitcoin Magazine',
  'blockworks.co': 'Blockworks',
  'thedefiant.io': 'The Defiant',
  'bitcoinist.com': 'Bitcoinist',
  'beincrypto.com': 'BeInCrypto',
  'newsbtc.com': 'NewsBTC',
  'cryptoslate.com': 'CryptoSlate',
  'cryptopotato.com': 'CryptoPotato',
  'u.today': 'U.Today',
  'ambcrypto.com': 'AMBCrypto',
  'dailycoin.com': 'DailyCoin',
  'cryptobriefing.com': 'Crypto Briefing',
  'coingape.com': 'CoinGape',
  'investing.com': 'Investing.com',
  'finance.yahoo.com': 'Yahoo Finance',
  'reuters.com': 'Reuters',
  'bloomberg.com': 'Bloomberg',
  'cnbc.com': 'CNBC',
  'forbes.com': 'Forbes',
  'watcher.guru': 'Watcher Guru',
  'coinspeaker.com': 'CoinSpeaker',
  'cryptonews.com': 'CryptoNews',
  'fxstreet.com': 'FXStreet',
  'dailyhodl.com': 'The Daily Hodl',
  'zycrypto.com': 'ZyCrypto',
  'nulltx.com': 'NullTX',
  'blockonomi.com': 'Blockonomi',
  'cryptopanic.com': 'CryptoPanic',
  'benzinga.com': 'Benzinga',
  'cnn.com': 'CNN',
  'theguardian.com': 'The Guardian',
  'nytimes.com': 'NY Times',
  'wsj.com': 'WSJ',
  'coinjournal.net': 'CoinJournal',
  'cryptonewsz.com': 'CryptoNewsZ',
  'blockchainnews.com': 'Blockchain News',
  'coingecko.com': 'CoinGecko',
  'coinmarketcap.com': 'CoinMarketCap',
};

/**
 * Get source name from domain
 */
function getSourceNameFromDomain(domain) {
  if (!domain) return null;
  
  // Direct match
  if (DOMAIN_TO_SOURCE[domain]) {
    return DOMAIN_TO_SOURCE[domain];
  }
  
  // Try without www
  const cleanDomain = domain.replace(/^www\./, '');
  if (DOMAIN_TO_SOURCE[cleanDomain]) {
    return DOMAIN_TO_SOURCE[cleanDomain];
  }
  
  // Try to find partial match
  for (const [knownDomain, name] of Object.entries(DOMAIN_TO_SOURCE)) {
    if (cleanDomain.includes(knownDomain) || knownDomain.includes(cleanDomain.split('.')[0])) {
      return name;
    }
  }
  
  // Generate name from domain (capitalize first letter of each part)
  const parts = cleanDomain.split('.')[0].split('-');
  return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
}

/**
 * Check if a URL is valid (not NULL or placeholder)
 */
function isValidUrl(url) {
  if (!url) return false;
  const trimmed = url.trim().toLowerCase();
  if (!trimmed) return false;
  if (trimmed === 'null' || trimmed === 'none' || trimmed === '-') return false;
  if (!trimmed.startsWith('http')) return false;
  return true;
}

/**
 * Convert CSV row to our article format
 * 
 * Actual CSV columns (lowercased by parser):
 * - id, title, description, sourceid, sourcedomain, sourceurl, newsdatetime, url
 * - negative, positive, important, liked, disliked, lol, toxic, saved, comments
 * - currencies (comma-separated codes like "BTC,ETH")
 */
function convertToArticle(row) {
  // Get title (required)
  const title = row.title || '';
  if (!title || !title.trim()) {
    return null;
  }
  
  // Get article ID for cache lookup
  const articleId = row.id || '';
  
  // Priority: 1) Resolved URL from cache, 2) sourceurl from CSV
  let url = '';
  
  // Check resolved URL cache first (from running resolve-urls.js)
  if (articleId && resolvedUrlCache[articleId]) {
    url = resolvedUrlCache[articleId];
  }
  
  // Fall back to sourceurl from CSV if available
  if (!isValidUrl(url)) {
    url = row.sourceurl || '';
  }
  
  // Skip articles without valid source URLs
  if (!isValidUrl(url)) {
    return null;
  }
  
  // Parse datetime
  const datetime = row.newsdatetime || '';
  if (!datetime) {
    return null;
  }
  
  let pubDate;
  try {
    pubDate = new Date(datetime);
    if (isNaN(pubDate.getTime())) {
      return null;
    }
  } catch {
    return null;
  }
  
  // Get source from domain - prefer extracting from resolved URL, fall back to CSV domain
  let domain = row.sourcedomain || '';
  try {
    const urlObj = new URL(url);
    const urlDomain = urlObj.hostname.replace(/^www\./, '');
    if (urlDomain && !urlDomain.includes('cryptopanic')) {
      domain = urlDomain;
    }
  } catch (e) {
    // Keep CSV domain
  }
  const sourceName = getSourceNameFromDomain(domain);
  
  // Get description
  const rawDescription = row.description || '';
  
  // Get currencies
  const currencies = row.currencies || '';
  
  const sourceInfo = getSourceInfo(sourceName || '');
  const category = detectCategory(title, sourceName || '');
  
  // Build article
  const article = {
    title: title.trim(),
    link: url.trim(),
    pubDate: pubDate.toISOString(),
    source: sourceInfo.source,
    sourceKey: sourceInfo.sourceKey,
    category: category,
  };
  
  // Only add description if it's valid content
  if (isValidDescription(rawDescription)) {
    article.description = rawDescription.trim().slice(0, 500);
  }
  
  // Add cryptocurrency tags if available
  if (currencies) {
    article.currencies = currencies.split(',').map(c => c.trim()).filter(Boolean);
  }
  
  // Add sentiment if available
  const positive = parseInt(row.positive || '0');
  const negative = parseInt(row.negative || '0');
  if (positive > 0 || negative > 0) {
    article.votes = { positive, negative };
    if (positive > negative * 2) {
      article.sentiment = 'bullish';
    } else if (negative > positive * 2) {
      article.sentiment = 'bearish';
    }
  }
  
  return article;
}

/**
 * Group articles by date
 */
function groupByDate(articles) {
  const grouped = new Map();
  
  for (const article of articles) {
    const date = article.pubDate.split('T')[0];
    if (!grouped.has(date)) {
      grouped.set(date, []);
    }
    grouped.get(date).push(article);
  }
  
  return grouped;
}

/**
 * Write archive file for a specific date
 */
function writeArchiveFile(date, articles, dryRun = false) {
  const [year, month] = date.split('-');
  const dirPath = path.join(ARCHIVE_DIR, year, month);
  const filePath = path.join(dirPath, `${date}.json`);
  
  // Sort articles by date descending (newest first)
  articles.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
  
  const archiveEntry = {
    date,
    fetchedAt: new Date().toISOString(),
    articleCount: articles.length,
    source: 'historical-import',
    articles
  };
  
  if (dryRun) {
    console.log(`[DRY RUN] Would write ${filePath} (${articles.length} articles)`);
    return;
  }
  
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  
  // If file exists, merge articles (missing or corrupted file: overwrite)
  try {
    const existing = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const existingLinks = new Set(existing.articles.map(a => a.link));
    
    // Add only new articles
    const newArticles = articles.filter(a => !existingLinks.has(a.link));
    if (newArticles.length > 0) {
      archiveEntry.articles = [...existing.articles, ...newArticles];
      archiveEntry.articleCount = archiveEntry.articles.length;
      archiveEntry.mergedAt = new Date().toISOString();
      archiveEntry.articles.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
    } else {
      // No new articles, skip
      return 'skipped';
    }
  } catch {
    // Missing or corrupted file: write fresh
  }
  
  fs.writeFileSync(filePath, JSON.stringify(archiveEntry, null, 2));
  return 'written';
}

/**
 * Update archive index
 */
function updateArchiveIndex(dates, articleCounts, dryRun = false) {
  const indexPath = path.join(ARCHIVE_DIR, 'index.json');
  
  let existingIndex = {
    lastUpdated: new Date().toISOString(),
    totalArticles: 0,
    dateRange: { earliest: '', latest: '' },
    availableDates: []
  };
  
  // Load existing index (missing or corrupt file: use default)
  try {
    existingIndex = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
  } catch {
    // Use default
  }
  
  // Merge dates
  const allDates = [...new Set([...existingIndex.availableDates, ...dates])].sort();
  
  // Calculate total articles
  let totalArticles = 0;
  for (const date of allDates) {
    if (articleCounts.has(date)) {
      totalArticles += articleCounts.get(date);
    } else {
      // Try to read from file
      const [year, month] = date.split('-');
      const filePath = path.join(ARCHIVE_DIR, year, month, `${date}.json`);
      if (fs.existsSync(filePath)) {
        try {
          const entry = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
          totalArticles += entry.articleCount || 0;
        } catch {}
      }
    }
  }
  
  const newIndex = {
    lastUpdated: new Date().toISOString(),
    totalArticles,
    dateRange: {
      earliest: allDates[0],
      latest: allDates[allDates.length - 1]
    },
    availableDates: allDates
  };
  
  if (dryRun) {
    console.log(`[DRY RUN] Would update index.json:`);
    console.log(`  Total articles: ${totalArticles}`);
    console.log(`  Date range: ${newIndex.dateRange.earliest} to ${newIndex.dateRange.latest}`);
    console.log(`  Total dates: ${allDates.length}`);
    return;
  }
  
  fs.writeFileSync(indexPath, JSON.stringify(newIndex, null, 2));
  console.log(`Updated index.json`);
}

/**
 * Main import function
 */
async function main() {
  const args = parseArgs();
  
  console.log('='.repeat(60));
  console.log('Historical Crypto News Import Tool');
  console.log('Importing 248k+ historical crypto news articles');
  console.log('='.repeat(60));
  console.log();
  
  ensureTempDir();
  
  // Load resolved URL cache if available
  if (fs.existsSync(RESOLVED_CACHE_PATH)) {
    try {
      resolvedUrlCache = JSON.parse(fs.readFileSync(RESOLVED_CACHE_PATH, 'utf-8'));
      const cacheSize = Object.keys(resolvedUrlCache).length;
      console.log(`Loaded resolved URL cache: ${cacheSize.toLocaleString()} URLs`);
    } catch (e) {
      console.warn('Warning: Failed to load resolved URL cache:', e.message);
      resolvedUrlCache = {};
    }
  } else {
    console.log('Note: No resolved URL cache found. Run resolve-urls.js first for best results.');
    console.log('      Articles without sourceUrl will be skipped otherwise.');
  }
  console.log();
  
  // Step 1: Download or locate RAR file
  let csvPath = null;
  
  // Check if CSV already exists
  const existingExtractDir = path.join(TEMP_DIR, 'extracted');
  if (fs.existsSync(existingExtractDir) && !args.download) {
    const csvFiles = findCsvFiles(existingExtractDir);
    if (csvFiles.length > 0) {
      console.log(`Found existing extracted CSV files`);
      csvPath = csvFiles[0];
    }
  }
  
  if (!csvPath) {
    // Download and extract
    for (const rarFile of RAR_FILES) {
      const rarPath = await downloadRarFile(rarFile);
      if (rarPath) {
        const extractDir = extractRarFile(rarPath);
        const csvFiles = findCsvFiles(extractDir);
        if (csvFiles.length > 0) {
          csvPath = csvFiles[0];
          break;
        }
      }
    }
  }
  
  if (!csvPath) {
    console.error('Failed to find CSV data');
    process.exit(1);
  }
  
  console.log(`Using CSV: ${path.basename(csvPath)}`);
  console.log();
  
  // Step 2: Parse CSV and convert articles
  console.log('Parsing articles...');
  const allArticles = [];
  let parsed = 0;
  let skipped = 0;
  
  for await (const row of readCsvFile(csvPath)) {
    const article = convertToArticle(row);
    
    if (article) {
      // Apply date filter if specified
      const date = article.pubDate.split('T')[0];
      if (args.startDate && date < args.startDate) {
        skipped++;
        continue;
      }
      if (args.endDate && date > args.endDate) {
        skipped++;
        continue;
      }
      
      allArticles.push(article);
      parsed++;
      
      if (parsed % 10000 === 0) {
        console.log(`  Parsed ${parsed.toLocaleString()} articles...`);
      }
    } else {
      skipped++;
    }
  }
  
  console.log(`Parsed ${parsed.toLocaleString()} articles (${skipped.toLocaleString()} skipped)`);
  console.log();
  
  // Step 3: Group by date
  console.log('Grouping articles by date...');
  const grouped = groupByDate(allArticles);
  const dates = [...grouped.keys()].sort();
  
  console.log(`Found articles across ${dates.length} days`);
  console.log(`Date range: ${dates[0]} to ${dates[dates.length - 1]}`);
  console.log();
  
  // Step 4: Write archive files
  console.log('Writing archive files...');
  let written = 0;
  let skippedFiles = 0;
  const articleCounts = new Map();
  
  for (const [date, articles] of grouped) {
    const result = writeArchiveFile(date, articles, args.dryRun);
    articleCounts.set(date, articles.length);
    
    if (result === 'skipped') {
      skippedFiles++;
    } else {
      written++;
    }
    
    if ((written + skippedFiles) % 100 === 0) {
      console.log(`  Processed ${written + skippedFiles}/${dates.length} dates...`);
    }
  }
  
  console.log(`Written ${written} archive files (${skippedFiles} skipped - already had data)`);
  console.log();
  
  // Step 5: Update index
  console.log('Updating archive index...');
  updateArchiveIndex(dates, articleCounts, args.dryRun);
  
  // Summary
  console.log();
  console.log('='.repeat(60));
  console.log('Import Complete!');
  console.log('='.repeat(60));
  console.log(`Total articles imported: ${parsed.toLocaleString()}`);
  console.log(`Date range: ${dates[0]} to ${dates[dates.length - 1]}`);
  console.log(`Archive files created: ${written}`);
  console.log();
  console.log('You can now query historical data via:');
  console.log(`  GET /api/archive?start_date=${dates[0]}&end_date=${dates[dates.length - 1]}`);
  
  // Cleanup reminder
  if (!args.dryRun) {
    console.log();
    console.log('To clean up temporary files:');
    console.log(`  rm -rf "${TEMP_DIR}"`);
  }
}

// Run
main().catch(error => {
  console.error('Import failed:', error);
  process.exit(1);
});
