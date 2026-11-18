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
 * Import CryptoPanic Historical Dataset to v2 Archive Format
 * 
 * Imports ~248k articles from the CryptoPanic dataset CSV.
 * Articles with URLs are fully imported; articles without URLs are imported
 * with metadata only and can be enriched later.
 * 
 * Usage:
 *   node import-cryptopanic-dataset.js [options]
 * 
 * Options:
 *   --dry-run      Preview without writing files
 *   --start-date   Start date filter (YYYY-MM-DD)
 *   --end-date     End date filter (YYYY-MM-DD)
 *   --verbose      Show detailed progress
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { createReadStream } = require('fs');
const { createInterface } = require('readline');

// Paths
const WORKSPACE = '/workspaces/free-crypto-news';
const TEMP_DIR = path.join(WORKSPACE, '.temp-import');
const CSV_PATH = path.join(TEMP_DIR, 'news_currencies_source_joinedResult.csv');
const ARCHIVE_DIR = path.join(WORKSPACE, 'archive/articles');
const RESOLVED_URLS_PATH = path.join(TEMP_DIR, 'resolved-urls.json');
const SEARCHED_URLS_PATH = path.join(TEMP_DIR, 'searched-urls.json');
const IMPORT_STATS_PATH = path.join(TEMP_DIR, 'import-stats.json');

// Parse CLI args
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const VERBOSE = args.includes('--verbose') || args.includes('-v');
const START_DATE = args.find((a, i) => args[i-1] === '--start-date');
const END_DATE = args.find((a, i) => args[i-1] === '--end-date');

// Source domain to metadata mapping
const SOURCE_MAP = {
  'coindesk.com': { source: 'CoinDesk', sourceKey: 'coindesk', category: 'general' },
  'cointelegraph.com': { source: 'CoinTelegraph', sourceKey: 'cointelegraph', category: 'general' },
  'decrypt.co': { source: 'Decrypt', sourceKey: 'decrypt', category: 'general' },
  'bitcoinmagazine.com': { source: 'Bitcoin Magazine', sourceKey: 'bitcoinmagazine', category: 'bitcoin' },
  'theblock.co': { source: 'The Block', sourceKey: 'theblock', category: 'general' },
  'theblockcrypto.com': { source: 'The Block', sourceKey: 'theblock', category: 'general' },
  'u.today': { source: 'U.Today', sourceKey: 'utoday', category: 'general' },
  'newsbtc.com': { source: 'NewsBTC', sourceKey: 'newsbtc', category: 'bitcoin' },
  'beincrypto.com': { source: 'BeInCrypto', sourceKey: 'beincrypto', category: 'trading' },
  'cryptoslate.com': { source: 'CryptoSlate', sourceKey: 'cryptoslate', category: 'general' },
  'ambcrypto.com': { source: 'AMBCrypto', sourceKey: 'ambcrypto', category: 'trading' },
  'dailyhodl.com': { source: 'The Daily Hodl', sourceKey: 'dailyhodl', category: 'general' },
  'cryptopotato.com': { source: 'CryptoPotato', sourceKey: 'cryptopotato', category: 'general' },
  'coingape.com': { source: 'CoinGape', sourceKey: 'coingape', category: 'general' },
  'bitcoinist.com': { source: 'Bitcoinist', sourceKey: 'bitcoinist', category: 'bitcoin' },
  'cryptobriefing.com': { source: 'Crypto Briefing', sourceKey: 'cryptobriefing', category: 'general' },
  'blockonomi.com': { source: 'Blockonomi', sourceKey: 'blockonomi', category: 'general' },
  'zycrypto.com': { source: 'ZyCrypto', sourceKey: 'zycrypto', category: 'general' },
  'nulltx.com': { source: 'NullTX', sourceKey: 'nulltx', category: 'general' },
  'cryptonews.com': { source: 'CryptoNews', sourceKey: 'cryptonews', category: 'general' },
  'forkast.news': { source: 'Forkast', sourceKey: 'forkast', category: 'general' },
  'coinpedia.org': { source: 'CoinPedia', sourceKey: 'coinpedia', category: 'general' },
  'newsroom.bankofamerica.com': { source: 'Bank of America', sourceKey: 'bankofamerica', category: 'mainstream' },
  'blog.kraken.com': { source: 'Kraken Blog', sourceKey: 'kraken', category: 'exchange' },
  'blog.coinbase.com': { source: 'Coinbase Blog', sourceKey: 'coinbase', category: 'exchange' },
  'blog.binance.com': { source: 'Binance Blog', sourceKey: 'binance', category: 'exchange' },
};

// Category keywords for detection
const CATEGORY_KEYWORDS = {
  bitcoin: ['bitcoin', 'btc', 'satoshi', 'lightning network', 'halving', 'mining'],
  ethereum: ['ethereum', 'eth', 'vitalik', 'erc-20', 'erc20', 'gas fee', 'merge'],
  defi: ['defi', 'aave', 'uniswap', 'compound', 'yield', 'liquidity', 'tvl', 'lending', 'dex'],
  nft: ['nft', 'opensea', 'bayc', 'cryptopunk', 'azuki', 'blur', 'non-fungible'],
  trading: ['price', 'pump', 'dump', 'bull', 'bear', 'rally', 'crash', 'surge', 'plunge'],
  regulation: ['sec', 'cftc', 'regulation', 'lawsuit', 'congress', 'legal', 'ban', 'law'],
  exchange: ['binance', 'coinbase', 'kraken', 'ftx', 'exchange', 'listing', 'delist'],
  stablecoin: ['usdt', 'usdc', 'tether', 'stablecoin', 'circle', 'dai', 'peg'],
  layer2: ['layer 2', 'l2', 'rollup', 'optimism', 'arbitrum', 'polygon', 'zksync'],
};

// Tag extraction keywords
const TAG_KEYWORDS = {
  'hack': ['hack', 'exploit', 'breach', 'attack', 'vulnerability', 'stolen'],
  'partnership': ['partner', 'partnership', 'collaborate', 'team up', 'alliance'],
  'funding': ['funding', 'raise', 'investment', 'series a', 'series b', 'seed round', 'vc'],
  'regulation': ['sec', 'cftc', 'regulation', 'lawsuit', 'legal', 'compliance'],
  'exchange': ['binance', 'coinbase', 'kraken', 'exchange', 'trading'],
  'institutional': ['institutional', 'blackrock', 'fidelity', 'grayscale', 'etf'],
  'defi': ['defi', 'lending', 'borrowing', 'yield', 'liquidity'],
  'nft': ['nft', 'opensea', 'collection', 'mint'],
  'price': ['price', 'ath', 'atl', 'surge', 'drop', 'crash', 'rally'],
  'stablecoin': ['usdt', 'usdc', 'stablecoin', 'tether', 'circle'],
  'layer2': ['layer 2', 'l2', 'rollup', 'optimism', 'arbitrum'],
  'whale': ['whale', 'large holder', 'big investor'],
  'airdrop': ['airdrop', 'token distribution', 'free tokens'],
  'breaking': ['breaking', 'just in', 'urgent', 'alert'],
};

/**
 * Load any pre-resolved URLs from cache files
 */
function loadResolvedUrls() {
  const urls = {};
  
  // Load from resolved-urls.json
  if (fs.existsSync(RESOLVED_URLS_PATH)) {
    try {
      const data = JSON.parse(fs.readFileSync(RESOLVED_URLS_PATH, 'utf-8'));
      Object.assign(urls, data);
    } catch (e) {
      console.warn('Warning: Could not load resolved-urls.json');
    }
  }
  
  // Load from searched-urls.json
  if (fs.existsSync(SEARCHED_URLS_PATH)) {
    try {
      const data = JSON.parse(fs.readFileSync(SEARCHED_URLS_PATH, 'utf-8'));
      Object.assign(urls, data);
    } catch (e) {
      console.warn('Warning: Could not load searched-urls.json');
    }
  }
  
  return urls;
}

/**
 * Get source info from domain
 */
function getSourceInfo(domain) {
  if (!domain || domain === 'NULL') {
    return { source: 'Unknown', sourceKey: 'unknown', category: 'general' };
  }
  
  const cleanDomain = domain.toLowerCase().replace(/^www\./, '');
  
  if (SOURCE_MAP[cleanDomain]) {
    return SOURCE_MAP[cleanDomain];
  }
  
  // Generate from domain name
  const name = cleanDomain.split('.')[0];
  const formatted = name.charAt(0).toUpperCase() + name.slice(1);
  return {
    source: formatted,
    sourceKey: name.replace(/[^a-z0-9]/g, ''),
    category: 'general'
  };
}

/**
 * Detect category from title content
 */
function detectCategory(title, defaultCategory) {
  const titleLower = title.toLowerCase();
  
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (titleLower.includes(keyword)) {
        return category;
      }
    }
  }
  
  return defaultCategory;
}

/**
 * Extract tags from title
 */
function extractTags(title) {
  const tags = [];
  const titleLower = title.toLowerCase();
  
  for (const [tag, keywords] of Object.entries(TAG_KEYWORDS)) {
    for (const keyword of keywords) {
      if (titleLower.includes(keyword)) {
        tags.push(tag);
        break;
      }
    }
  }
  
  return [...new Set(tags)].slice(0, 5);
}

/**
 * Extract entities (basic implementation)
 */
function extractEntities(title, description) {
  const text = `${title} ${description || ''}`.toLowerCase();
  const entities = { people: [], companies: [], protocols: [] };
  
  // Known companies
  const companies = ['binance', 'coinbase', 'kraken', 'gemini', 'ftx', 'circle', 'tether', 'ripple', 'consensys', 'chainalysis', 'fireblocks', 'blockfi', 'celsius', 'opensea', 'blur'];
  for (const company of companies) {
    if (text.includes(company)) {
      entities.companies.push(company.charAt(0).toUpperCase() + company.slice(1));
    }
  }
  
  // Known protocols
  const protocols = ['bitcoin', 'ethereum', 'solana', 'cardano', 'polkadot', 'avalanche', 'polygon', 'arbitrum', 'optimism', 'uniswap', 'aave', 'compound', 'maker', 'curve', 'lido', 'chainlink'];
  for (const protocol of protocols) {
    if (text.includes(protocol)) {
      entities.protocols.push(protocol.charAt(0).toUpperCase() + protocol.slice(1));
    }
  }
  
  // Known people (simplified)
  const people = [
    { name: 'Vitalik Buterin', patterns: ['vitalik', 'buterin'] },
    { name: 'CZ', patterns: ['changpeng zhao', 'cz binance'] },
    { name: 'Sam Bankman-Fried', patterns: ['sbf', 'sam bankman', 'bankman-fried'] },
    { name: 'Brian Armstrong', patterns: ['brian armstrong'] },
    { name: 'Michael Saylor', patterns: ['michael saylor', 'saylor'] },
    { name: 'Gary Gensler', patterns: ['gary gensler', 'gensler'] },
  ];
  for (const person of people) {
    for (const pattern of person.patterns) {
      if (text.includes(pattern)) {
        entities.people.push(person.name);
        break;
      }
    }
  }
  
  return entities;
}

/**
 * Calculate sentiment from votes
 */
function calculateSentiment(positive, negative) {
  const total = positive + negative;
  if (total === 0) {
    return { score: 0, label: 'neutral', confidence: 0.5 };
  }
  
  const score = (positive - negative) / total;
  let label = 'neutral';
  let confidence = 0.5;
  
  if (score > 0.3) {
    label = 'positive';
    confidence = Math.min(0.9, 0.5 + score * 0.4);
  } else if (score < -0.3) {
    label = 'negative';
    confidence = Math.min(0.9, 0.5 + Math.abs(score) * 0.4);
  }
  
  return {
    score: Math.round(score * 100) / 100,
    label,
    confidence: Math.round(confidence * 100) / 100
  };
}

/**
 * Generate unique ID from title and date
 */
function generateId(title, datetime) {
  const hash = crypto.createHash('md5').update(`${title}|${datetime}`).digest('hex');
  return hash.substring(0, 16);
}

/**
 * Generate content hash for deduplication
 */
function generateContentHash(title) {
  return crypto.createHash('md5').update(title.toLowerCase().trim()).digest('hex').substring(0, 16);
}

/**
 * Parse CSV line handling quoted fields
 */
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

/**
 * Validate a date is reasonable (2017-2026 range for crypto news)
 */
function isValidDate(date) {
  if (!date || isNaN(date.getTime())) return false;
  const year = date.getFullYear();
  return year >= 2017 && year <= 2026;
}

/**
 * Extract domain from URL
 */
function extractDomainFromUrl(url) {
  if (!url || url === 'NULL' || !url.startsWith('http')) return null;
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

/**
 * Convert CSV row to v2 article format
 * IMPORTS ALL DATA - no skipping, uses fallbacks for missing values
 * @param {object} row - CSV row data
 * @param {object} resolvedUrls - Map of resolved URLs
 */
function convertToV2Article(row, resolvedUrls) {
  const id = row.id;
  const title = row.title;
  const description = row.description;
  let domain = row.sourceDomain;
  const datetime = row.newsDatetime;
  const csvSourceUrl = row.sourceUrl;
  const currencies = row.currencies;
  const positive = parseInt(row.positive || '0');
  const negative = parseInt(row.negative || '0');
  const important = row.important === '1';
  
  // Use fallback values instead of skipping
  const actualTitle = (!title || title === 'NULL') ? `[No title - ID: ${id}]` : title;
  const hasValidTitle = title && title !== 'NULL';
  
  // Fix domain - extract from sourceUrl if domain looks wrong (numeric or missing)
  if (!domain || domain === 'NULL' || /^\d+$/.test(domain)) {
    const extractedDomain = extractDomainFromUrl(csvSourceUrl);
    if (extractedDomain) {
      domain = extractedDomain;
    }
  }
  
  // Parse date - strict validation, no interpolation
  let pubDate = null;
  let hasValidDate = false;
  
  // Check if datetime field is valid (not NULL, not a URL, valid date format)
  if (datetime && datetime !== 'NULL' && !datetime.startsWith('http')) {
    // Must match date pattern YYYY-MM-DD or similar
    if (/^\d{4}-\d{2}-\d{2}/.test(datetime) || /^\d{4}\/\d{2}\/\d{2}/.test(datetime)) {
      try {
        const d = new Date(datetime);
        if (isValidDate(d)) {
          pubDate = d;
          hasValidDate = true;
        }
      } catch {
        // Invalid date
      }
    }
  }
  
  // Date filters only apply if explicitly requested AND article has valid date
  // By default, NOTHING is skipped
  if (hasValidDate && pubDate && START_DATE) {
    const start = new Date(START_DATE);
    if (pubDate < start) return { filtered: true };
  }
  if (hasValidDate && pubDate && END_DATE) {
    const end = new Date(END_DATE);
    if (pubDate > end) return { filtered: true };
  }
  
  // Determine URL
  let url = null;
  let urlSource = null;
  
  // Priority: 1) CSV sourceUrl, 2) resolved cache
  if (csvSourceUrl && csvSourceUrl !== 'NULL' && csvSourceUrl.startsWith('http')) {
    url = csvSourceUrl;
    urlSource = 'csv';
  } else if (resolvedUrls[id]) {
    url = resolvedUrls[id];
    urlSource = 'resolved';
  }
  
  const sourceInfo = getSourceInfo(domain);
  const category = detectCategory(actualTitle, sourceInfo.category);
  
  // Build v2 article
  const article = {
    id: generateId(actualTitle, datetime || id),
    schema_version: '2.0.0',
    title: actualTitle.trim(),
    pub_date: pubDate ? pubDate.toISOString() : null,
    first_seen: pubDate ? pubDate.toISOString() : null,
    last_seen: pubDate ? pubDate.toISOString() : null,
    fetch_count: 1,
    source: sourceInfo.source,
    source_key: sourceInfo.sourceKey,
    category,
  };
  
  // Add URL fields if we have a URL  
  if (url) {
    article.link = url;
    article.canonical_link = url;
  }
  
  // Add description if valid
  if (description && description !== 'NULL' && description.length > 10) {
    article.description = description.substring(0, 500).trim();
  }
  
  // Add tickers from currencies
  if (currencies && currencies !== 'NULL') {
    const tickers = currencies.split(',')
      .map(c => c.trim().toUpperCase())
      .filter(c => c && c.length <= 10);
    if (tickers.length > 0) {
      article.tickers = tickers.slice(0, 10);
    }
  }
  
  // Add entities
  const entities = extractEntities(actualTitle, description);
  if (entities.people.length || entities.companies.length || entities.protocols.length) {
    article.entities = entities;
  }
  
  // Add tags
  const tags = extractTags(actualTitle);
  if (tags.length > 0) {
    article.tags = tags;
  }
  
  // Add sentiment
  article.sentiment = calculateSentiment(positive, negative);
  
  // Market context (null for historical data)
  article.market_context = null;
  
  // Content hash for deduplication
  article.content_hash = generateContentHash(actualTitle);
  
  // Meta information
  const wordCount = actualTitle.split(/\s+/).length + (description ? description.split(/\s+/).length : 0);
  article.meta = {
    word_count: wordCount,
    has_numbers: /\d/.test(actualTitle),
    is_breaking: important || tags.includes('breaking'),
    is_opinion: false,
    has_url: !!url,
    url_source: urlSource,
    original_id: id,
    import_source: 'cryptopanic-dataset',
    has_valid_title: hasValidTitle,
    has_valid_date: hasValidDate,
  };
  
  return article;
}

/**
 * Write articles to JSONL file for a specific month
 */
function writeMonthFile(month, articles, existingArticles) {
  const filePath = path.join(ARCHIVE_DIR, `${month}.jsonl`);
  
  // Merge with existing, deduplicate by content_hash
  const existingHashes = new Set(existingArticles.map(a => a.content_hash));
  const newArticles = articles.filter(a => !existingHashes.has(a.content_hash));
  const merged = [...existingArticles, ...newArticles];
  
  // Sort by date descending (null dates at end)
  merged.sort((a, b) => {
    if (!a.pub_date && !b.pub_date) return 0;
    if (!a.pub_date) return 1;
    if (!b.pub_date) return -1;
    return new Date(b.pub_date) - new Date(a.pub_date);
  });
  
  if (DRY_RUN) {
    console.log(`[DRY RUN] Would write ${newArticles.length} new articles to ${month}.jsonl`);
    return { written: 0, skipped: articles.length - newArticles.length };
  }
  
  // Write JSONL
  const jsonl = merged.map(a => JSON.stringify(a)).join('\n');
  fs.writeFileSync(filePath, jsonl + '\n');
  
  return { written: newArticles.length, skipped: articles.length - newArticles.length };
}

/**
 * Load existing articles from JSONL file
 */
function loadExistingArticles(month) {
  const filePath = path.join(ARCHIVE_DIR, `${month}.jsonl`);
  
  if (!fs.existsSync(filePath)) {
    return [];
  }
  
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return content.trim().split('\n')
      .filter(Boolean)
      .map(line => {
        try { return JSON.parse(line); }
        catch { return null; }
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * Main import function
 */
async function main() {
  console.log('═'.repeat(60));
  console.log('CryptoPanic Dataset Import to v2 Archive');
  console.log('═'.repeat(60));
  console.log();
  
  if (DRY_RUN) {
    console.log('🔍 DRY RUN MODE - No files will be written\n');
  }
  
  // Check CSV exists
  if (!fs.existsSync(CSV_PATH)) {
    console.error(`Error: CSV not found at ${CSV_PATH}`);
    console.error('Please ensure the dataset is extracted to .temp-import/');
    process.exit(1);
  }
  
  // Ensure output directory exists
  if (!fs.existsSync(ARCHIVE_DIR)) {
    fs.mkdirSync(ARCHIVE_DIR, { recursive: true });
  }
  
  // Load resolved URLs
  console.log('Loading resolved URL caches...');
  const resolvedUrls = loadResolvedUrls();
  console.log(`  Loaded ${Object.keys(resolvedUrls).length.toLocaleString()} resolved URLs\n`);
  
  // Process CSV - single pass, dedupe by content hash
  console.log('Processing CSV...');
  const byMonth = new Map();
  const seenContentHashes = new Set(); // Dedupe by content, not ID
  const seenArticleIds = new Set(); // Track IDs for reporting
  
  const stats = {
    totalRows: 0,
    duplicateIds: 0,
    duplicateContent: 0,
    unique: 0,
    withUrl: 0,
    withUrlFromCsv: 0,
    withUrlFromResolved: 0,
    withoutUrl: 0,
    withValidTitle: 0,
    withValidDate: 0,
    withoutDate: 0,
    skipped: 0,
    byDomain: {},
    byMonth: {},
  };
  
  const fileStream = createReadStream(CSV_PATH);
  const rl = createInterface({ input: fileStream, crlfDelay: Infinity });
  
  let headers = [];
  let lineNum = 0;
  
  for await (const line of rl) {
    lineNum++;
    
    if (lineNum === 1) {
      headers = parseCSVLine(line);
      continue;
    }
    
    if (lineNum % 50000 === 0) {
      console.log(`  Processed ${lineNum.toLocaleString()} rows...`);
    }
    
    const fields = parseCSVLine(line);
    const row = {};
    headers.forEach((h, i) => row[h] = fields[i] || '');
    
    stats.totalRows++;
    
    // Track duplicate IDs (same article, different currency tag)
    const originalId = row.id;
    if (seenArticleIds.has(originalId)) {
      stats.duplicateIds++;
      continue;
    }
    seenArticleIds.add(originalId);
    
    // Convert to v2 article
    const article = convertToV2Article(row, resolvedUrls);
    
    // Skip if date filter was applied
    if (article.filtered) {
      stats.skipped++;
      continue;
    }
    
    // Deduplicate by content hash (catches same title with different IDs)
    if (seenContentHashes.has(article.content_hash)) {
      stats.duplicateContent++;
      continue;
    }
    seenContentHashes.add(article.content_hash);
    
    stats.unique++;
    
    // Track validity stats
    if (article.meta.has_valid_title) stats.withValidTitle++;
    if (article.meta.has_valid_date) stats.withValidDate++;
    if (!article.pub_date) stats.withoutDate++;
    
    // Track URL stats
    if (article.link) {
      stats.withUrl++;
      if (article.meta.url_source === 'csv') stats.withUrlFromCsv++;
      else if (article.meta.url_source === 'resolved') stats.withUrlFromResolved++;
    } else {
      stats.withoutUrl++;
    }
    
    // Track domain stats  
    const domain = article.source_key || 'unknown';
    stats.byDomain[domain] = (stats.byDomain[domain] || 0) + 1;
    
    // Group by month (unknown dates go to "unknown-date")
    const monthKey = article.pub_date ? article.pub_date.substring(0, 7) : 'unknown-date';
    if (!byMonth.has(monthKey)) {
      byMonth.set(monthKey, []);
    }
    byMonth.get(monthKey).push(article);
    stats.byMonth[monthKey] = (stats.byMonth[monthKey] || 0) + 1;
  }
  
  console.log(`\n${'─'.repeat(60)}`);
  console.log('CSV Processing Complete');
  console.log('─'.repeat(60));
  console.log(`Total rows:           ${stats.totalRows.toLocaleString()}`);
  console.log(`Duplicate IDs:        ${stats.duplicateIds.toLocaleString()} (same article, diff currency)`);
  console.log(`Duplicate content:    ${stats.duplicateContent.toLocaleString()} (same title, diff ID)`);
  console.log(`Unique articles:      ${stats.unique.toLocaleString()}`);
  console.log(`  With valid title:   ${stats.withValidTitle.toLocaleString()} (${((stats.withValidTitle/stats.unique)*100).toFixed(1)}%)`);
  console.log(`  With valid date:    ${stats.withValidDate.toLocaleString()} (${((stats.withValidDate/stats.unique)*100).toFixed(1)}%)`);
  console.log(`  Without date:       ${stats.withoutDate.toLocaleString()} (${((stats.withoutDate/stats.unique)*100).toFixed(1)}%)`);
  console.log(`  With URL:           ${stats.withUrl.toLocaleString()} (${((stats.withUrl/stats.unique)*100).toFixed(1)}%)`);
  console.log(`    From CSV:         ${stats.withUrlFromCsv.toLocaleString()}`);
  console.log(`    From resolved:    ${stats.withUrlFromResolved.toLocaleString()}`);
  console.log(`  Without URL:        ${stats.withoutUrl.toLocaleString()} (${((stats.withoutUrl/stats.unique)*100).toFixed(1)}%)`);
  console.log(`Skipped (filtered):   ${stats.skipped.toLocaleString()}`);
  console.log();
  
  // Write files by month
  console.log(`Writing ${byMonth.size} monthly archive files...`);
  const months = [...byMonth.keys()].sort();
  
  let totalWritten = 0;
  let totalSkipped = 0;
  
  for (const month of months) {
    const articles = byMonth.get(month);
    const existing = loadExistingArticles(month);
    const result = writeMonthFile(month, articles, existing);
    
    totalWritten += result.written;
    totalSkipped += result.skipped;
    
    if (VERBOSE || result.written > 0) {
      console.log(`  ${month}: ${result.written} new, ${result.skipped} duplicates, ${existing.length} existing`);
    }
  }
  
  console.log(`\n${'═'.repeat(60)}`);
  console.log('Import Complete!');
  console.log('═'.repeat(60));
  console.log(`New articles written: ${totalWritten.toLocaleString()}`);
  console.log(`Duplicates skipped:   ${totalSkipped.toLocaleString()}`);
  console.log(`Date range: ${months[0]} to ${months[months.length - 1]}`);
  console.log(`Archive location: ${ARCHIVE_DIR}`);
  
  // Save import stats
  const importStats = {
    timestamp: new Date().toISOString(),
    stats,
    months: months.length,
    totalWritten,
    totalSkipped,
  };
  
  if (!DRY_RUN) {
    fs.writeFileSync(IMPORT_STATS_PATH, JSON.stringify(importStats, null, 2));
    console.log(`\nImport stats saved to: ${IMPORT_STATS_PATH}`);
  }
  
  // Top domains
  console.log('\nTop 10 source domains:');
  const topDomains = Object.entries(stats.byDomain)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  for (const [domain, count] of topDomains) {
    console.log(`  ${domain}: ${count.toLocaleString()}`);
  }
}

// Run
main().catch(error => {
  console.error('Import failed:', error);
  process.exit(1);
});
