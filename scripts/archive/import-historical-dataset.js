#!/usr/bin/env node
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
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

// Configuration
const ARCHIVE_DIR = process.env.ARCHIVE_DIR || path.join(__dirname, '../../archive');
const TEMP_DIR = path.join(__dirname, '.temp-import');
const DATASET_BASE_URL = 'https://github.com/soheilrahsaz/cryptoNewsDataset/raw/main/csvOutput';

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
    execSync(`curl -L -o "${outputPath}" "${url}"`, { 
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
    execSync(`unrar x -o+ "${rarPath}" "${extractDir}/"`, { 
      stdio: 'pipe',
      cwd: TEMP_DIR 
    });
  } catch {
    try {
      // Try 7z as fallback
      execSync(`7z x -y -o"${extractDir}" "${rarPath}"`, { 
        stdio: 'pipe',
        cwd: TEMP_DIR 
      });
    } catch {
      try {
        // Try unar as another fallback (macOS)
        execSync(`unar -o "${extractDir}" "${rarPath}"`, { 
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
 * Convert CSV row to our article format
 * 
 * Expected columns from the dataset:
 * - id, title, url, newsDatetime, positive, negative, important, liked, disliked, lol, toxic, saved, comments
 * - For joined: also has source_name, source_url, currency_codes
 */
function convertToArticle(row) {
  // Determine which CSV format we have
  const title = row.title || row.news_title || '';
  const url = row.url || row.news_url || row.link || '';
  const datetime = row.newsdatetime || row.news_datetime || row.datetime || row.published || row.date || '';
  const sourceName = row.source_name || row.source || row.sourcename || '';
  const description = row.description || row.summary || row.content || '';
  const currencies = row.currency_codes || row.currencies || row.coins || '';
  
  if (!title || !datetime) {
    return null;
  }
  
  // Parse date
  let pubDate;
  try {
    pubDate = new Date(datetime);
    if (isNaN(pubDate.getTime())) {
      return null;
    }
  } catch {
    return null;
  }
  
  const sourceInfo = getSourceInfo(sourceName);
  const category = detectCategory(title, sourceName);
  
  // Build article
  const article = {
    title: title.trim(),
    link: url.trim(),
    pubDate: pubDate.toISOString(),
    source: sourceInfo.source,
    sourceKey: sourceInfo.sourceKey,
    category: category,
  };
  
  if (description) {
    article.description = description.trim().slice(0, 500);
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
  
  // If file exists, merge articles
  if (fs.existsSync(filePath)) {
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
      // If existing file is corrupted, overwrite
    }
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
  
  // Load existing index
  if (fs.existsSync(indexPath)) {
    try {
      existingIndex = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
    } catch {
      // Use default
    }
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
  
  // Step 1: Download or locate RAR file
  let csvPath = null;
  let extractDir = null;
  
  // Check if CSV already exists
  const existingExtractDir = path.join(TEMP_DIR, 'extracted');
  if (fs.existsSync(existingExtractDir) && !args.download) {
    const csvFiles = findCsvFiles(existingExtractDir);
    if (csvFiles.length > 0) {
      console.log(`Found existing extracted CSV files`);
      extractDir = existingExtractDir;
      csvPath = csvFiles[0];
    }
  }
  
  if (!csvPath) {
    // Download and extract
    for (const rarFile of RAR_FILES) {
      const rarPath = await downloadRarFile(rarFile);
      if (rarPath) {
        extractDir = extractRarFile(rarPath);
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
