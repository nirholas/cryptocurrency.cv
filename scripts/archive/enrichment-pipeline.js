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
 * Production Enrichment Pipeline for v2 Archive
 * 
 * Comprehensive enrichment system that:
 * 1. Finds missing URLs via multiple sources (Wayback, Common Crawl, URL reconstruction)
 * 2. Verifies/finds dates via search engines (DuckDuckGo, Brave, Bing)
 * 3. Redistributes articles from unknown-date.jsonl to correct month files
 * 4. Tracks progress and supports resumable batch processing
 * 
 * This is the MASTER orchestrator - run this for full enrichment.
 * 
 * Usage:
 *   node enrichment-pipeline.js [options]
 * 
 * Options:
 *   --mode <mode>        Mode: 'urls', 'dates', 'all' (default: 'all')
 *   --target <file>      Process specific file (e.g., 'unknown-date' or '2023-01')
 *   --batch-size <n>     Articles per batch (default: 50)
 *   --max-batches <n>    Maximum batches to process (0 = all, default: 10)
 *   --delay <ms>         Delay between API calls (default: 1000)
 *   --parallel <n>       Concurrent requests (default: 3)
 *   --dry-run            Preview without saving
 *   --verbose            Detailed output
 *   --priority <type>    Priority: 'dated', 'undated', 'urls' (default: 'undated')
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// ============================================================================
// Configuration
// ============================================================================

const WORKSPACE = '/workspaces/free-crypto-news';
const ARCHIVE_DIR = path.join(WORKSPACE, 'archive/articles');
const CACHE_DIR = path.join(WORKSPACE, '.temp-import');
const PROGRESS_FILE = path.join(CACHE_DIR, 'enrichment-progress.json');
const URL_CACHE_FILE = path.join(CACHE_DIR, 'enrichment-url-cache.json');
const DATE_CACHE_FILE = path.join(CACHE_DIR, 'enrichment-date-cache.json');
const STATS_FILE = path.join(CACHE_DIR, 'enrichment-stats.json');

// CLI Args
const args = process.argv.slice(2);
function getArg(name, defaultVal) {
  const idx = args.findIndex(a => a === `--${name}`);
  if (idx === -1) return defaultVal;
  return args[idx + 1] || defaultVal;
}

const MODE = getArg('mode', 'all');
const TARGET = getArg('target', null);
const BATCH_SIZE = parseInt(getArg('batch-size', '50'));
const MAX_BATCHES = parseInt(getArg('max-batches', '10'));
const DELAY = parseInt(getArg('delay', '1000'));
const PARALLEL = parseInt(getArg('parallel', '3'));
const DRY_RUN = args.includes('--dry-run');
const VERBOSE = args.includes('--verbose') || args.includes('-v');
const PRIORITY = getArg('priority', 'undated');

// ============================================================================
// Utility Functions
// ============================================================================

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function loadJson(file, defaultVal = {}) {
  try {
    if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch {}
  return defaultVal;
}

function saveJson(file, data) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 80)
    .replace(/-$/, '');
}

function log(msg, level = 'info') {
  const prefix = {
    info: '📋',
    success: '✓',
    error: '✗',
    warn: '⚠',
    progress: '🔄'
  }[level] || '•';
  
  console.log(`${prefix} ${msg}`);
}

// ============================================================================
// HTTP Client
// ============================================================================

const httpAgent = new http.Agent({ keepAlive: true, maxSockets: PARALLEL });
const httpsAgent = new https.Agent({ keepAlive: true, maxSockets: PARALLEL });

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

function httpGet(url, options = {}) {
  return new Promise((resolve, reject) => {
    const timeout = options.timeout || 15000;
    let target;
    try {
      target = toPublicHttpUrl(url);
    } catch (error) {
      reject(error);
      return;
    }
    const isHttps = target.protocol === 'https:';
    const proto = isHttps ? https : http;
    const agent = isHttps ? httpsAgent : httpAgent;
    
    const req = proto.get(target.href, {
      timeout,
      agent,
      headers: options.headers || {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        ...(options.headers || {})
      }
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const redirectUrl = res.headers.location.startsWith('http') 
          ? res.headers.location 
          : new URL(res.headers.location, url).href;
        httpGet(redirectUrl, options).then(resolve).catch(reject);
        return;
      }
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, data, url }));
    });
    
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    req.on('error', reject);
  });
}

// ============================================================================
// URL Enrichment Sources
// ============================================================================

const URL_PATTERNS = {
  'coindesk.com': (t) => [`https://www.coindesk.com/${slugify(t)}`],
  'cointelegraph.com': (t) => [`https://cointelegraph.com/news/${slugify(t)}`],
  'decrypt.co': (t) => [`https://decrypt.co/${slugify(t)}`, `https://decrypt.co/news/${slugify(t)}`],
  'bitcoinmagazine.com': (t) => [`https://bitcoinmagazine.com/culture/${slugify(t)}`],
  'theblock.co': (t) => [`https://www.theblock.co/post/${slugify(t)}`],
  'u.today': (t) => [`https://u.today/${slugify(t)}`],
  'newsbtc.com': (t) => [`https://www.newsbtc.com/${slugify(t)}`],
  'beincrypto.com': (t) => [`https://beincrypto.com/${slugify(t)}`],
  'cryptoslate.com': (t) => [`https://cryptoslate.com/${slugify(t)}`],
  'ambcrypto.com': (t) => [`https://ambcrypto.com/${slugify(t)}`],
  'dailyhodl.com': (t) => [`https://dailyhodl.com/${slugify(t)}`],
  'cryptopotato.com': (t) => [`https://cryptopotato.com/${slugify(t)}`],
  'coingape.com': (t) => [`https://coingape.com/${slugify(t)}`],
  'bitcoinist.com': (t) => [`https://bitcoinist.com/${slugify(t)}`],
  'cryptobriefing.com': (t) => [`https://cryptobriefing.com/${slugify(t)}`],
  'cryptonews.com': (t) => [`https://cryptonews.com/news/${slugify(t)}`],
  'blockonomi.com': (t) => [`https://blockonomi.com/${slugify(t)}`],
  'zycrypto.com': (t) => [`https://zycrypto.com/${slugify(t)}`],
  'cryptodaily.co.uk': (t) => [`https://cryptodaily.co.uk/news/${slugify(t)}`],
  'coinjournal.net': (t) => [`https://coinjournal.net/${slugify(t)}`],
  'nulltx.com': (t) => [`https://nulltx.com/${slugify(t)}`],
  'coinspeaker.com': (t) => [`https://www.coinspeaker.com/${slugify(t)}`],
  'tronweekly.com': (t) => [`https://tronweekly.com/${slugify(t)}`],
  'cryptonewsz.com': (t) => [`https://www.cryptonewsz.com/${slugify(t)}`],
};

/**
 * Search Wayback Machine CDX API
 */
async function searchWaybackMachine(domain, title, dateHint) {
  try {
    const slug = slugify(title);
    const dateStr = dateHint ? new Date(dateHint).toISOString().slice(0, 7).replace('-', '') : '';
    
    // Search by domain and fuzzy URL match
    const cdxUrl = `https://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(domain)}/*&matchType=prefix${dateStr ? `&from=${dateStr}01&to=${dateStr}31` : ''}&output=json&limit=100&fl=timestamp,original,statuscode,mimetype`;
    
    const response = await httpGet(cdxUrl);
    if (response.statusCode !== 200) return null;
    
    const records = JSON.parse(response.data);
    if (records.length < 2) return null;
    
    // Find best match (skip header row)
    for (let i = 1; i < records.length; i++) {
      const [timestamp, originalUrl, statusCode, mimeType] = records[i];
      
      if (statusCode !== '200') continue;
      if (mimeType && !mimeType.includes('text/html')) continue;
      
      const urlLower = originalUrl.toLowerCase();
      const slugWords = slug.split('-').filter(w => w.length > 3);
      
      // Check if URL contains significant words from title
      const matches = slugWords.filter(w => urlLower.includes(w)).length;
      if (matches >= 2 || urlLower.includes(slug.substring(0, 25))) {
        return {
          url: originalUrl,
          timestamp: timestamp,
          source: 'wayback'
        };
      }
    }
    
    return null;
  } catch (e) {
    if (VERBOSE) log(`Wayback error: ${e.message}`, 'error');
    return null;
  }
}

/**
 * Search Common Crawl Index
 */
async function searchCommonCrawl(domain, title) {
  try {
    const slug = slugify(title);
    const ccUrl = `https://index.commoncrawl.org/CC-MAIN-2024-10-index?url=${encodeURIComponent(domain)}/*&output=json&limit=50`;
    
    const response = await httpGet(ccUrl, { timeout: 20000 });
    if (response.statusCode !== 200) return null;
    
    const lines = response.data.trim().split('\n').filter(Boolean);
    
    for (const line of lines) {
      try {
        const record = JSON.parse(line);
        if (record.status !== '200') continue;
        
        const urlLower = record.url.toLowerCase();
        const slugWords = slug.split('-').filter(w => w.length > 3);
        const matches = slugWords.filter(w => urlLower.includes(w)).length;
        
        if (matches >= 2 || urlLower.includes(slug.substring(0, 25))) {
          return { url: record.url, source: 'commoncrawl' };
        }
      } catch {}
    }
    
    return null;
  } catch (e) {
    if (VERBOSE) log(`CommonCrawl error: ${e.message}`, 'error');
    return null;
  }
}

/**
 * Try URL pattern reconstruction and verify
 */
async function reconstructUrl(domain, title) {
  const patternFn = URL_PATTERNS[domain];
  if (!patternFn) return null;
  
  const candidates = patternFn(title);
  
  for (const url of candidates) {
    try {
      const response = await httpGet(url, { timeout: 8000 });
      if (response.statusCode >= 200 && response.statusCode < 400) {
        return { url: response.url || url, source: 'reconstructed' };
      }
    } catch {}
    await sleep(300);
  }
  
  return null;
}

/**
 * Find URL for article using all available sources
 */
async function findUrl(article, cache) {
  const cacheKey = article.content_hash;
  
  if (cache[cacheKey]?.url) {
    return cache[cacheKey];
  }
  
  const domain = article.source_key;
  const title = article.title;
  const date = article.pub_date;
  
  // Skip twitter/social media - they don't have reconstructable URLs
  if (['twitter', 'x', 'reddit', 'telegram', 'discord'].includes(domain?.toLowerCase())) {
    cache[cacheKey] = { url: null, source: null, reason: 'social_media' };
    return null;
  }
  
  // Determine domain for searching
  const fullDomain = domain?.includes('.') ? domain : `${domain}.com`;
  
  // 1. Try Wayback Machine
  const wayback = await searchWaybackMachine(fullDomain, title, date);
  if (wayback?.url) {
    cache[cacheKey] = { url: wayback.url, source: 'wayback', timestamp: wayback.timestamp };
    return cache[cacheKey];
  }
  
  await sleep(DELAY);
  
  // 2. Try URL reconstruction (fast, direct check)
  const reconstructed = await reconstructUrl(fullDomain, title);
  if (reconstructed?.url) {
    cache[cacheKey] = reconstructed;
    return cache[cacheKey];
  }
  
  await sleep(DELAY);
  
  // 3. Try Common Crawl (wider coverage)
  const cc = await searchCommonCrawl(fullDomain, title);
  if (cc?.url) {
    cache[cacheKey] = cc;
    return cache[cacheKey];
  }
  
  // Mark as not found
  cache[cacheKey] = { url: null, source: null, attempted: new Date().toISOString() };
  return null;
}

// ============================================================================
// Date Verification Sources
// ============================================================================

const DATE_PATTERNS = [
  /(\d{4}-\d{2}-\d{2})/,
  /([A-Z][a-z]{2,8}\s+\d{1,2},?\s+\d{4})/i,
  /(\d{1,2}\s+[A-Z][a-z]{2,8}\s+\d{4})/i,
  /(\d{1,2}\/\d{1,2}\/\d{4})/,
  /published[:\s]+(\d{4}-\d{2}-\d{2})/i,
  /date[:\s]+(\d{4}-\d{2}-\d{2})/i,
];

/**
 * Extract date from HTML/text content
 */
function extractDate(text) {
  for (const pattern of DATE_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      try {
        const parsed = new Date(match[1]);
        if (!isNaN(parsed.getTime()) && parsed.getFullYear() >= 2017 && parsed.getFullYear() <= 2026) {
          return parsed;
        }
      } catch {}
    }
  }
  return null;
}

/**
 * Search DuckDuckGo HTML for article
 */
async function searchDuckDuckGo(title, domain) {
  try {
    const cleanTitle = title.replace(/[^\w\s]/g, ' ').trim().split(' ').slice(0, 8).join(' ');
    const query = encodeURIComponent(`"${cleanTitle}" site:${domain}`);
    const url = `https://html.duckduckgo.com/html/?q=${query}`;
    
    const response = await httpGet(url);
    if (response.statusCode !== 200) return null;
    
    const html = response.data;
    
    // Find result URLs
    const linkMatch = html.match(/class="result__a"[^>]*href="([^"]+)"/i);
    const resultUrl = linkMatch ? linkMatch[1] : null;
    
    // Find dates
    const foundDate = extractDate(html);
    
    if (foundDate || resultUrl) {
      return { date: foundDate, url: resultUrl, source: 'duckduckgo' };
    }
    
    return null;
  } catch (e) {
    if (VERBOSE) log(`DuckDuckGo error: ${e.message}`, 'error');
    return null;
  }
}

/**
 * Search Bing for date info
 */
async function searchBing(title, domain) {
  try {
    const cleanTitle = title.replace(/[^\w\s]/g, ' ').trim().split(' ').slice(0, 8).join(' ');
    const query = encodeURIComponent(`"${cleanTitle}" site:${domain}`);
    const url = `https://www.bing.com/search?q=${query}`;
    
    const response = await httpGet(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html',
      }
    });
    
    if (response.statusCode !== 200) return null;
    
    const foundDate = extractDate(response.data);
    const linkMatch = response.data.match(/<a[^>]+href="(https?:\/\/[^"]+)"[^>]*>/);
    
    if (foundDate || linkMatch) {
      return { date: foundDate, url: linkMatch ? linkMatch[1] : null, source: 'bing' };
    }
    
    return null;
  } catch (e) {
    return null;
  }
}

/**
 * Verify date for article
 */
async function verifyDate(article, cache) {
  const cacheKey = article.content_hash;
  
  if (cache[cacheKey]?.verified) {
    return cache[cacheKey];
  }
  
  const title = article.title;
  const domain = article.source_key?.includes('.') ? article.source_key : `${article.source_key}.com`;
  
  // Skip invalid titles
  if (!title || title.length < 10 || title.startsWith('[No title')) {
    cache[cacheKey] = { verified: false, reason: 'invalid_title' };
    return null;
  }
  
  // Skip social media
  if (['twitter', 'x', 'reddit', 'telegram', 'unknown'].includes(article.source_key?.toLowerCase())) {
    cache[cacheKey] = { verified: false, reason: 'social_media' };
    return null;
  }
  
  // Try DuckDuckGo
  const ddg = await searchDuckDuckGo(title, domain);
  if (ddg?.date) {
    cache[cacheKey] = {
      verified: true,
      date: ddg.date.toISOString(),
      url: ddg.url,
      source: 'duckduckgo'
    };
    return cache[cacheKey];
  }
  
  await sleep(DELAY);
  
  // Try Bing as fallback
  const bing = await searchBing(title, domain);
  if (bing?.date) {
    cache[cacheKey] = {
      verified: true,
      date: bing.date.toISOString(),
      url: bing.url,
      source: 'bing'
    };
    return cache[cacheKey];
  }
  
  // Store partial result (URL found but no date)
  if (ddg?.url || bing?.url) {
    cache[cacheKey] = {
      verified: false,
      url: ddg?.url || bing?.url,
      source: ddg?.source || bing?.source,
      reason: 'no_date_found'
    };
    return cache[cacheKey];
  }
  
  cache[cacheKey] = { verified: false, reason: 'not_found', attempted: new Date().toISOString() };
  return null;
}

// ============================================================================
// Article File Operations
// ============================================================================

/**
 * Load articles from JSONL file
 */
function loadArticles(filePath) {
  if (!fs.existsSync(filePath)) return [];
  
  const lines = fs.readFileSync(filePath, 'utf-8').trim().split('\n').filter(Boolean);
  const articles = [];
  
  for (const line of lines) {
    try {
      articles.push(JSON.parse(line));
    } catch {}
  }
  
  return articles;
}

/**
 * Save articles to JSONL file
 */
function saveArticles(filePath, articles) {
  const jsonl = articles.map(a => JSON.stringify(a)).join('\n');
  fs.writeFileSync(filePath, jsonl + '\n');
}

// ============================================================================
// Main Pipeline
// ============================================================================

/**
 * Process URL enrichment for articles
 */
async function enrichUrls(articles, urlCache, stats) {
  const needsUrl = articles.filter(a => !a.link && !['twitter', 'x', 'reddit'].includes(a.source_key?.toLowerCase()));
  
  if (needsUrl.length === 0) return { modified: [], stats };
  
  const modified = [];
  const toProcess = needsUrl.slice(0, BATCH_SIZE);
  
  for (let i = 0; i < toProcess.length; i++) {
    const article = toProcess[i];
    
    if (VERBOSE) {
      log(`  [${i + 1}/${toProcess.length}] URL: ${article.title.substring(0, 45)}...`, 'progress');
    }
    
    const result = await findUrl(article, urlCache);
    
    if (result?.url) {
      article.link = result.url;
      article.canonical_link = result.url;
      article.meta = article.meta || {};
      article.meta.has_url = true;
      article.meta.url_source = result.source;
      article.meta.url_enriched_at = new Date().toISOString();
      
      modified.push(article);
      stats.urlsFound++;
      
      log(`  ✓ URL (${result.source}): ${result.url.substring(0, 55)}...`, 'success');
    } else {
      stats.urlNotFound++;
    }
    
    stats.urlsProcessed++;
    await sleep(DELAY);
  }
  
  return { modified, stats };
}

/**
 * Process date verification for articles
 */
async function verifyDates(articles, dateCache, stats) {
  const needsDate = articles.filter(a => !a.meta?.has_valid_date || a.meta?.date_source === 'unknown');
  
  if (needsDate.length === 0) return { modified: [], toRedistribute: [], stats };
  
  const modified = [];
  const toRedistribute = [];
  const toProcess = needsDate.slice(0, BATCH_SIZE);
  
  for (let i = 0; i < toProcess.length; i++) {
    const article = toProcess[i];
    
    if (VERBOSE) {
      log(`  [${i + 1}/${toProcess.length}] Date: ${article.title.substring(0, 45)}...`, 'progress');
    }
    
    const result = await verifyDate(article, dateCache);
    
    if (result?.verified && result.date) {
      const newDate = new Date(result.date);
      const oldMonth = article.pub_date?.substring(0, 7);
      const newMonth = newDate.toISOString().substring(0, 7);
      
      article.pub_date = newDate.toISOString();
      article.first_seen = newDate.toISOString();
      article.meta = article.meta || {};
      article.meta.has_valid_date = true;
      article.meta.date_source = 'verified';
      article.meta.date_verified_by = result.source;
      
      // Also update URL if found
      if (result.url && !article.link) {
        article.link = result.url;
        article.canonical_link = result.url;
        article.meta.has_url = true;
        article.meta.url_source = result.source;
        stats.urlsFound++;
      }
      
      modified.push(article);
      stats.datesVerified++;
      
      // Mark for redistribution if month changed
      if (oldMonth !== newMonth) {
        toRedistribute.push({ article, newMonth });
      }
      
      log(`  ✓ Date: ${newMonth} (was ${oldMonth || 'unknown'})`, 'success');
    } else {
      stats.datesNotFound++;
    }
    
    stats.datesProcessed++;
    await sleep(DELAY);
  }
  
  return { modified, toRedistribute, stats };
}

/**
 * Redistribute articles to correct month files
 */
function redistributeArticles(toRedistribute, monthArticles) {
  const redistribution = {};
  
  for (const { article, newMonth } of toRedistribute) {
    if (!redistribution[newMonth]) {
      redistribution[newMonth] = [];
    }
    redistribution[newMonth].push(article);
  }
  
  // Append to month files
  for (const [month, articles] of Object.entries(redistribution)) {
    const filePath = path.join(ARCHIVE_DIR, `${month}.jsonl`);
    
    // Load existing (if any) and append
    const existing = loadArticles(filePath);
    
    // Dedupe by content_hash
    const existingHashes = new Set(existing.map(a => a.content_hash));
    const newArticles = articles.filter(a => !existingHashes.has(a.content_hash));
    
    if (newArticles.length > 0) {
      const all = [...existing, ...newArticles];
      all.sort((a, b) => new Date(b.pub_date) - new Date(a.pub_date));
      
      if (!DRY_RUN) {
        saveArticles(filePath, all);
        log(`  → Redistributed ${newArticles.length} articles to ${month}.jsonl`, 'success');
      } else {
        log(`  [DRY] Would redistribute ${newArticles.length} to ${month}.jsonl`, 'info');
      }
    }
  }
  
  return Object.values(redistribution).flat().length;
}

/**
 * Process a single file
 */
async function processFile(fileKey, urlCache, dateCache, stats) {
  const filePath = path.join(ARCHIVE_DIR, `${fileKey}.jsonl`);
  
  if (!fs.existsSync(filePath)) {
    log(`File not found: ${fileKey}.jsonl`, 'warn');
    return stats;
  }
  
  log(`\nProcessing ${fileKey}.jsonl...`, 'info');
  
  const articles = loadArticles(filePath);
  log(`  Loaded ${articles.length} articles`, 'info');
  
  let urlModified = [];
  let dateModified = [];
  let toRedistribute = [];
  
  // URL enrichment
  if (MODE === 'urls' || MODE === 'all') {
    const urlResult = await enrichUrls(articles, urlCache, stats);
    urlModified = urlResult.modified;
    stats = urlResult.stats;
  }
  
  // Date verification (mainly for unknown-date file)
  if ((MODE === 'dates' || MODE === 'all') && fileKey === 'unknown-date') {
    const dateResult = await verifyDates(articles, dateCache, stats);
    dateModified = dateResult.modified;
    toRedistribute = dateResult.toRedistribute;
    stats = dateResult.stats;
  }
  
  // Redistribute verified articles
  if (toRedistribute.length > 0) {
    redistributeArticles(toRedistribute, {});
    
    // Remove redistributed from unknown-date
    const redistributedHashes = new Set(toRedistribute.map(r => r.article.content_hash));
    const remaining = articles.filter(a => !redistributedHashes.has(a.content_hash));
    
    if (!DRY_RUN && remaining.length < articles.length) {
      saveArticles(filePath, remaining);
      log(`  Updated ${fileKey}.jsonl (removed ${articles.length - remaining.length} redistributed)`, 'success');
    }
  } else if ((urlModified.length > 0 || dateModified.length > 0) && !DRY_RUN) {
    // Save updates to same file
    saveArticles(filePath, articles);
    log(`  Saved updates to ${fileKey}.jsonl`, 'success');
  }
  
  return stats;
}

/**
 * Main orchestrator
 */
async function main() {
  console.log('═'.repeat(70));
  console.log('  PRODUCTION ENRICHMENT PIPELINE - v2 Archive');
  console.log('═'.repeat(70));
  
  if (DRY_RUN) console.log('\n🔍 DRY RUN MODE - No changes will be saved\n');
  
  console.log(`Mode:        ${MODE}`);
  console.log(`Batch size:  ${BATCH_SIZE}`);
  console.log(`Max batches: ${MAX_BATCHES === 0 ? 'unlimited' : MAX_BATCHES}`);
  console.log(`Delay:       ${DELAY}ms`);
  console.log(`Priority:    ${PRIORITY}`);
  console.log(`Target:      ${TARGET || 'all files'}`);
  
  // Load caches
  const urlCache = loadJson(URL_CACHE_FILE);
  const dateCache = loadJson(DATE_CACHE_FILE);
  const progress = loadJson(PROGRESS_FILE, { lastFile: null, batchesCompleted: 0 });
  
  console.log(`\nCache: ${Object.keys(urlCache).length} URL entries, ${Object.keys(dateCache).length} date entries`);
  
  // Get files to process
  let files = [];
  
  if (TARGET) {
    files = [TARGET];
  } else {
    // Get all archive files
    const allFiles = fs.readdirSync(ARCHIVE_DIR)
      .filter(f => f.endsWith('.jsonl'))
      .map(f => f.replace('.jsonl', ''));
    
    // Prioritize based on flag
    if (PRIORITY === 'undated') {
      // Put unknown-date first
      files = ['unknown-date', ...allFiles.filter(f => f !== 'unknown-date').sort()];
    } else if (PRIORITY === 'dated') {
      // Process dated files, skip unknown-date
      files = allFiles.filter(f => f !== 'unknown-date').sort();
    } else {
      files = allFiles.sort();
    }
  }
  
  if (files.length === 0) {
    log('No files to process', 'warn');
    return;
  }
  
  console.log(`\nFiles to process: ${files.length}`);
  
  // Initialize stats
  let stats = {
    filesProcessed: 0,
    urlsProcessed: 0,
    urlsFound: 0,
    urlNotFound: 0,
    datesProcessed: 0,
    datesVerified: 0,
    datesNotFound: 0,
    startTime: Date.now()
  };
  
  // Process files
  let batchCount = 0;
  
  for (const fileKey of files) {
    if (MAX_BATCHES > 0 && batchCount >= MAX_BATCHES) {
      log(`\nReached max batches (${MAX_BATCHES}), stopping.`, 'info');
      break;
    }
    
    try {
      stats = await processFile(fileKey, urlCache, dateCache, stats);
      stats.filesProcessed++;
      batchCount++;
      
      // Save caches periodically
      saveJson(URL_CACHE_FILE, urlCache);
      saveJson(DATE_CACHE_FILE, dateCache);
      
      progress.lastFile = fileKey;
      progress.batchesCompleted = batchCount;
      saveJson(PROGRESS_FILE, progress);
      
    } catch (error) {
      log(`Error processing ${fileKey}: ${error.message}`, 'error');
    }
  }
  
  // Final summary
  const elapsed = ((Date.now() - stats.startTime) / 1000).toFixed(1);
  
  console.log(`\n${'═'.repeat(70)}`);
  console.log('  ENRICHMENT COMPLETE');
  console.log('═'.repeat(70));
  console.log(`
Files processed:     ${stats.filesProcessed}
URLs processed:      ${stats.urlsProcessed}
  - Found:           ${stats.urlsFound}
  - Not found:       ${stats.urlNotFound}
Dates processed:     ${stats.datesProcessed}
  - Verified:        ${stats.datesVerified}
  - Not found:       ${stats.datesNotFound}
Time elapsed:        ${elapsed}s
Cache entries:       ${Object.keys(urlCache).length} URLs, ${Object.keys(dateCache).length} dates
`);
  
  // Save final stats
  if (!DRY_RUN) {
    const finalStats = {
      ...stats,
      timestamp: new Date().toISOString(),
      elapsed: elapsed
    };
    saveJson(STATS_FILE, finalStats);
    log(`Stats saved to ${STATS_FILE}`, 'info');
  }
}

// Run
main().catch(error => {
  console.error('Pipeline failed:', error);
  process.exit(1);
});
