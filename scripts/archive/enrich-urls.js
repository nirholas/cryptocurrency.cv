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
 * URL Enrichment Script for v2 Archive Articles
 * 
 * Attempts to resolve missing URLs for archived articles using:
 * 1. Wayback Machine CDX API
 * 2. URL pattern reconstruction from domain + title
 * 3. Search API (optional, requires API key)
 * 
 * Usage:
 *   node enrich-urls.js [options]
 * 
 * Options:
 *   --month YYYY-MM    Process specific month file
 *   --batch-size N     Articles per batch (default: 100)
 *   --delay MS         Delay between requests (default: 500)
 *   --dry-run          Preview without writing
 *   --wayback-only     Only use Wayback Machine
 *   --verbose          Show detailed output
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Paths
const WORKSPACE = '/workspaces/free-crypto-news';
const ARCHIVE_DIR = path.join(WORKSPACE, 'archive/articles');
const ENRICHMENT_CACHE_PATH = path.join(WORKSPACE, '.temp-import/enrichment-cache.json');
const ENRICHMENT_LOG_PATH = path.join(WORKSPACE, '.temp-import/enrichment-log.json');

// Parse CLI args
const args = process.argv.slice(2);
const MONTH = args.find((a, i) => args[i-1] === '--month');
const BATCH_SIZE = parseInt(args.find((a, i) => args[i-1] === '--batch-size') || '100');
const DELAY = parseInt(args.find((a, i) => args[i-1] === '--delay') || '500');
const DRY_RUN = args.includes('--dry-run');
const WAYBACK_ONLY = args.includes('--wayback-only');
const VERBOSE = args.includes('--verbose') || args.includes('-v');

// URL construction patterns by domain
const URL_PATTERNS = {
  'coindesk': (title, date) => {
    const slug = slugify(title);
    const year = new Date(date).getFullYear();
    return [`https://www.coindesk.com/${slug}`, `https://www.coindesk.com/${year}/${slug}`];
  },
  'cointelegraph': (title, date) => {
    const slug = slugify(title);
    return [`https://cointelegraph.com/news/${slug}`];
  },
  'decrypt': (title, date) => {
    const slug = slugify(title);
    return [`https://decrypt.co/${slug}`, `https://decrypt.co/news/${slug}`];
  },
  'bitcoinmagazine': (title, date) => {
    const slug = slugify(title);
    return [`https://bitcoinmagazine.com/${slug}`, `https://bitcoinmagazine.com/articles/${slug}`];
  },
  'theblock': (title, date) => {
    const slug = slugify(title);
    return [`https://www.theblock.co/${slug}`, `https://www.theblock.co/post/${slug}`];
  },
  'utoday': (title, date) => {
    const slug = slugify(title);
    return [`https://u.today/${slug}`];
  },
  'newsbtc': (title, date) => {
    const slug = slugify(title);
    return [`https://www.newsbtc.com/${slug}`, `https://www.newsbtc.com/news/${slug}`];
  },
  'beincrypto': (title, date) => {
    const slug = slugify(title);
    return [`https://beincrypto.com/${slug}`];
  },
  'cryptoslate': (title, date) => {
    const slug = slugify(title);
    return [`https://cryptoslate.com/${slug}`, `https://cryptoslate.com/news/${slug}`];
  },
  'ambcrypto': (title, date) => {
    const slug = slugify(title);
    return [`https://ambcrypto.com/${slug}`];
  },
  'dailyhodl': (title, date) => {
    const slug = slugify(title);
    return [`https://dailyhodl.com/${slug}`, `https://dailyhodl.com/news/${slug}`];
  },
  'cryptopotato': (title, date) => {
    const slug = slugify(title);
    return [`https://cryptopotato.com/${slug}`];
  },
};

/**
 * Convert title to URL slug
 */
function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 80)
    .replace(/-$/, '');
}

/**
 * Load enrichment cache
 */
function loadCache() {
  if (fs.existsSync(ENRICHMENT_CACHE_PATH)) {
    try {
      return JSON.parse(fs.readFileSync(ENRICHMENT_CACHE_PATH, 'utf-8'));
    } catch {
      return {};
    }
  }
  return {};
}

/**
 * Save enrichment cache
 */
function saveCache(cache) {
  fs.writeFileSync(ENRICHMENT_CACHE_PATH, JSON.stringify(cache, null, 2));
}

/**
 * Parse a URL and require a public http(s) target (no loopback/private hosts).
 */
function toPublicHttpUrl(url) {
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error(`Refusing non-http(s) URL: ${parsed.protocol}`);
  }
  const host = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host.endsWith('.local') ||
    host.endsWith('.internal') ||
    host === '0.0.0.0' ||
    host === '::' ||
    host === '::1' ||
    /^127\./.test(host) ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^169\.254\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
    (host.includes(':') && /^(fc|fd|fe80|::ffff:)/.test(host))
  ) {
    throw new Error(`Refusing private or loopback host: ${host}`);
  }
  return parsed;
}

/**
 * HTTP GET request with timeout
 */
function httpGet(url, timeout = 10000) {
  return new Promise((resolve, reject) => {
    let target;
    try {
      target = toPublicHttpUrl(url);
    } catch (error) {
      reject(error);
      return;
    }
    const protocol = target.protocol === 'https:' ? https : http;
    
    const req = protocol.get(target.href, { 
      timeout,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ArchiveBot/1.0)' }
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        // Follow redirect
        resolve({ statusCode: res.statusCode, location: res.headers.location });
        return;
      }
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, data }));
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.on('error', reject);
  });
}

/**
 * Query Wayback Machine CDX API for archived URL
 */
async function searchWaybackMachine(domain, title, date) {
  const dateStr = new Date(date).toISOString().slice(0, 10).replace(/-/g, '');
  const titleWords = title.toLowerCase().split(/\s+/).slice(0, 5).join(' ');
  
  // Search for any archived page from this domain around the date
  const cdxUrl = `https://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(domain)}/*&matchType=prefix&from=${dateStr}&to=${dateStr}&output=json&limit=100`;
  
  try {
    const response = await httpGet(cdxUrl);
    if (response.statusCode !== 200) return null;
    
    const records = JSON.parse(response.data);
    if (records.length < 2) return null; // First row is headers
    
    // Find best match by comparing URLs to title
    const slug = slugify(title);
    
    for (let i = 1; i < records.length; i++) {
      const [, , originalUrl, mimeType, statusCode] = records[i];
      
      if (statusCode !== '200') continue;
      if (!mimeType.includes('text/html')) continue;
      
      const urlLower = originalUrl.toLowerCase();
      
      // Check if URL contains significant title words
      const matchScore = titleWords.split(' ').filter(w => urlLower.includes(w)).length;
      
      if (matchScore >= 2 || urlLower.includes(slug.substring(0, 30))) {
        return originalUrl;
      }
    }
    
    return null;
  } catch (error) {
    if (VERBOSE) console.error(`  Wayback error: ${error.message}`);
    return null;
  }
}

/**
 * Try to verify URL exists
 */
async function verifyUrl(url) {
  try {
    const response = await httpGet(url, 5000);
    return response.statusCode >= 200 && response.statusCode < 400;
  } catch {
    return false;
  }
}

/**
 * Reconstruct URL from domain patterns
 */
async function reconstructUrl(sourceKey, title, date) {
  const patternFn = URL_PATTERNS[sourceKey];
  if (!patternFn) return null;
  
  const candidates = patternFn(title, date);
  
  for (const url of candidates) {
    if (await verifyUrl(url)) {
      return url;
    }
    await sleep(300); // Rate limit
  }
  
  return null;
}

/**
 * Attempt to find URL for article
 */
async function findUrl(article, cache) {
  const cacheKey = article.content_hash;
  
  // Check cache first
  if (cache[cacheKey]) {
    return cache[cacheKey];
  }
  
  const domain = article.source_key;
  const title = article.title;
  const date = article.pub_date;
  
  let url = null;
  
  // 1. Try Wayback Machine
  url = await searchWaybackMachine(domain + '.com', title, date);
  if (url) {
    cache[cacheKey] = { url, source: 'wayback' };
    return cache[cacheKey];
  }
  
  await sleep(DELAY);
  
  // 2. Try URL reconstruction (if not wayback-only mode)
  if (!WAYBACK_ONLY) {
    url = await reconstructUrl(domain, title, date);
    if (url) {
      cache[cacheKey] = { url, source: 'reconstructed' };
      return cache[cacheKey];
    }
  }
  
  // Mark as not found
  cache[cacheKey] = { url: null, source: null, attempted: new Date().toISOString() };
  return null;
}

/**
 * Sleep helper
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Load articles from JSONL file
 */
function loadArticles(filePath) {
  if (!fs.existsSync(filePath)) {
    return [];
  }
  
  return fs.readFileSync(filePath, 'utf-8')
    .trim()
    .split('\n')
    .filter(Boolean)
    .map(line => {
      try { return JSON.parse(line); }
      catch { return null; }
    })
    .filter(Boolean);
}

/**
 * Save articles to JSONL file
 */
function saveArticles(filePath, articles) {
  const jsonl = articles.map(a => JSON.stringify(a)).join('\n');
  fs.writeFileSync(filePath, jsonl + '\n');
}

/**
 * Process a single month file
 */
async function processMonth(month, cache) {
  const filePath = path.join(ARCHIVE_DIR, `${month}.jsonl`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`  File not found: ${month}.jsonl`);
    return { processed: 0, found: 0, failed: 0 };
  }
  
  console.log(`\nProcessing ${month}...`);
  
  const articles = loadArticles(filePath);
  const needsUrl = articles.filter(a => !a.link);
  
  console.log(`  Total: ${articles.length}, Missing URL: ${needsUrl.length}`);
  
  if (needsUrl.length === 0) {
    return { processed: 0, found: 0, failed: 0 };
  }
  
  const stats = { processed: 0, found: 0, failed: 0 };
  let modified = false;
  
  // Process in batches
  for (let i = 0; i < needsUrl.length && i < BATCH_SIZE; i++) {
    const article = needsUrl[i];
    stats.processed++;
    
    if (VERBOSE) {
      console.log(`  [${i + 1}/${Math.min(needsUrl.length, BATCH_SIZE)}] ${article.title.substring(0, 50)}...`);
    }
    
    const result = await findUrl(article, cache);
    
    if (result && result.url) {
      stats.found++;
      modified = true;
      
      // Update article
      article.link = result.url;
      article.canonical_link = result.url;
      article.meta.has_url = true;
      article.meta.url_source = result.source;
      article.meta.url_resolved_at = new Date().toISOString();
      
      console.log(`  ✓ Found URL (${result.source}): ${result.url.substring(0, 60)}`);
    } else {
      stats.failed++;
      if (VERBOSE) console.log(`  ✗ No URL found`);
    }
    
    // Rate limiting
    await sleep(DELAY);
    
    // Save cache periodically
    if (stats.processed % 10 === 0) {
      saveCache(cache);
    }
  }
  
  // Save updated articles
  if (modified && !DRY_RUN) {
    saveArticles(filePath, articles);
    console.log(`  Saved ${stats.found} URL updates to ${month}.jsonl`);
  } else if (modified && DRY_RUN) {
    console.log(`  [DRY RUN] Would save ${stats.found} URL updates to ${month}.jsonl`);
  }
  
  return stats;
}

/**
 * Main function
 */
async function main() {
  console.log('═'.repeat(60));
  console.log('v2 Archive URL Enrichment');
  console.log('═'.repeat(60));
  
  if (DRY_RUN) {
    console.log('🔍 DRY RUN MODE\n');
  }
  
  console.log(`Batch size: ${BATCH_SIZE}`);
  console.log(`Request delay: ${DELAY}ms`);
  console.log(`Mode: ${WAYBACK_ONLY ? 'Wayback Machine only' : 'Wayback + URL reconstruction'}`);
  
  // Load cache
  const cache = loadCache();
  console.log(`\nLoaded cache with ${Object.keys(cache).length} entries`);
  
  // Get month files to process
  let months = [];
  
  if (MONTH) {
    months = [MONTH];
  } else {
    // Get all month files
    months = fs.readdirSync(ARCHIVE_DIR)
      .filter(f => f.match(/^\d{4}-\d{2}\.jsonl$/))
      .map(f => f.replace('.jsonl', ''))
      .sort();
  }
  
  if (months.length === 0) {
    console.log('No archive files found');
    return;
  }
  
  console.log(`\nWill process ${months.length} month(s): ${months.join(', ')}`);
  
  // Process each month
  const totalStats = { processed: 0, found: 0, failed: 0 };
  
  for (const month of months) {
    try {
      const stats = await processMonth(month, cache);
      totalStats.processed += stats.processed;
      totalStats.found += stats.found;
      totalStats.failed += stats.failed;
    } catch (error) {
      console.error(`  Error processing ${month}: ${error.message}`);
    }
    
    // Save cache after each month
    saveCache(cache);
  }
  
  // Final summary
  console.log(`\n${'═'.repeat(60)}`);
  console.log('Enrichment Complete!');
  console.log('═'.repeat(60));
  console.log(`Articles processed: ${totalStats.processed}`);
  console.log(`URLs found:         ${totalStats.found}`);
  console.log(`URLs not found:     ${totalStats.failed}`);
  console.log(`Success rate:       ${totalStats.processed > 0 ? ((totalStats.found / totalStats.processed) * 100).toFixed(1) : 0}%`);
  
  // Save log
  const log = {
    timestamp: new Date().toISOString(),
    stats: totalStats,
    months: months.length,
    cacheSize: Object.keys(cache).length,
  };
  
  if (!DRY_RUN) {
    fs.writeFileSync(ENRICHMENT_LOG_PATH, JSON.stringify(log, null, 2));
    console.log(`\nLog saved to: ${ENRICHMENT_LOG_PATH}`);
  }
}

// Run
main().catch(error => {
  console.error('Enrichment failed:', error);
  process.exit(1);
});
