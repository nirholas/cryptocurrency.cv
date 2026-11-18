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
 * Resolve CryptoPanic URLs to Real Source URLs
 * 
 * This script follows CryptoPanic redirect URLs to get the actual article URLs.
 * Processes in batches with rate limiting to be respectful.
 * 
 * Usage:
 *   node resolve-urls.js [options]
 * 
 * Options:
 *   --concurrency N   Number of concurrent requests (default: 10)
 *   --batch-size N    Articles per batch (default: 100)
 *   --delay N         Delay between batches in ms (default: 1000)
 *   --start-from N    Start from article index N (for resuming)
 *   --dry-run         Preview without making requests
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const readline = require('readline');

const TEMP_DIR = path.join(__dirname, '.temp-import');
const CSV_PATH = path.join(TEMP_DIR, 'extracted', 'news_currencies_source_joinedResult.csv');
const RESOLVED_CACHE_PATH = path.join(TEMP_DIR, 'resolved-urls.json');

// Parse command line args
const args = process.argv.slice(2);
const getArg = (name, defaultVal) => {
  const idx = args.indexOf(name);
  return idx !== -1 && args[idx + 1] ? parseInt(args[idx + 1]) : defaultVal;
};

const CONCURRENCY = getArg('--concurrency', 20);
const BATCH_SIZE = getArg('--batch-size', 500);
const BATCH_DELAY = getArg('--delay', 500);
const START_FROM = getArg('--start-from', 0);
const DRY_RUN = args.includes('--dry-run');

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
 * True if the URL's hostname is cryptopanic.com or a subdomain of it.
 * Relative URLs are resolved against `base` when given.
 */
function isCryptoPanicUrl(url, base) {
  try {
    const host = new URL(url, base).hostname;
    return host === 'cryptopanic.com' || host.endsWith('.cryptopanic.com');
  } catch {
    return false;
  }
}

/**
 * Extract post ID from CryptoPanic URL
 * Examples:
 *   https://cryptopanic.com/news/15444990/ApeCoin-Community-Votes-to-Stay-on-Ethereum
 *   https://cryptopanic.com/news/click/15444990/...
 */
function extractPostId(url) {
  if (!url || !isCryptoPanicUrl(url)) return null;
  const match = url.match(/\/news\/(?:click\/)?(\d+)/);
  return match ? match[1] : null;
}

/**
 * Resolve CryptoPanic URL to real source URL using /news/click/{id}/ endpoint
 * This endpoint returns a 302 redirect with the real URL in the Location header
 */
function resolveUrl(url) {
  return new Promise((resolve) => {
    const postId = extractPostId(url);
    if (!postId || !/^\d{1,20}$/.test(postId)) {
      resolve({ success: false, error: 'Could not extract post ID' });
      return;
    }
    
    const clickUrl = `https://cryptopanic.com/news/click/${encodeURIComponent(postId)}/`;
    
    const timeout = setTimeout(() => {
      resolve({ success: false, error: 'Timeout' });
    }, 10000);
    
    const req = https.get(clickUrl, { 
      timeout: 8000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CryptoNewsArchive/1.0)',
        'Accept': 'text/html'
      }
    }, (res) => {
      clearTimeout(timeout);
      
      // Consume the response body to free up the socket
      res.resume();
      
      // The click endpoint returns 302 with Location header containing real URL
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const realUrl = res.headers.location;
        if (realUrl && !isCryptoPanicUrl(realUrl, 'https://cryptopanic.com')) {
          resolve({ success: true, url: realUrl });
        } else {
          resolve({ success: false, error: 'Redirect still points to CryptoPanic' });
        }
        return;
      }
      
      // Non-redirect response - unexpected
      resolve({ success: false, error: `Unexpected status ${res.statusCode}` });
    });
    
    req.on('error', (err) => {
      clearTimeout(timeout);
      resolve({ success: false, error: err.message });
    });
    
    req.on('timeout', () => {
      clearTimeout(timeout);
      req.destroy();
      resolve({ success: false, error: 'Request timeout' });
    });
  });
}

/**
 * Process a batch of URLs concurrently
 */
async function processBatch(articles, cache) {
  const results = [];
  
  // Process in chunks of CONCURRENCY
  for (let i = 0; i < articles.length; i += CONCURRENCY) {
    const chunk = articles.slice(i, i + CONCURRENCY);
    
    const chunkResults = await Promise.all(chunk.map(async (article) => {
      const { id, url, sourceUrl } = article;
      
      // Already has real sourceUrl
      if (sourceUrl && sourceUrl !== 'NULL' && !sourceUrl.includes('cryptopanic')) {
        return { id, resolvedUrl: sourceUrl, cached: false };
      }
      
      // Check cache
      if (cache[id]) {
        return { id, resolvedUrl: cache[id], cached: true };
      }
      
      // Need to resolve CryptoPanic URL
      if (url && isCryptoPanicUrl(url)) {
        if (DRY_RUN) {
          return { id, resolvedUrl: null, dryRun: true };
        }
        
        const result = await resolveUrl(url);
        if (result.success) {
          cache[id] = result.url;
          return { id, resolvedUrl: result.url, cached: false };
        } else {
          return { id, resolvedUrl: null, error: result.error };
        }
      }
      
      return { id, resolvedUrl: url || null, cached: false };
    }));
    
    results.push(...chunkResults);
  }
  
  return results;
}

/**
 * Read all articles from CSV
 */
async function readArticles() {
  const articles = [];
  
  const fileStream = fs.createReadStream(CSV_PATH, { encoding: 'utf-8' });
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });
  
  let headers = null;
  let lineNumber = 0;
  
  for await (const line of rl) {
    lineNumber++;
    
    if (lineNumber === 1) {
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
      
      articles.push({
        id: row.id,
        url: row.url,
        sourceUrl: row.sourceurl,
        sourceDomain: row.sourcedomain,
        title: row.title
      });
    } catch {
      // Skip malformed lines
    }
  }
  
  return articles;
}

/**
 * Load or create cache
 */
function loadCache() {
  try {
    if (fs.existsSync(RESOLVED_CACHE_PATH)) {
      return JSON.parse(fs.readFileSync(RESOLVED_CACHE_PATH, 'utf-8'));
    }
  } catch {
    // Start fresh if cache is corrupted
  }
  return {};
}

/**
 * Save cache to disk
 */
function saveCache(cache) {
  fs.writeFileSync(RESOLVED_CACHE_PATH, JSON.stringify(cache, null, 2));
}

/**
 * Main function
 */
async function main() {
  console.log('============================================================');
  console.log('Resolve CryptoPanic URLs to Real Source URLs');
  console.log('============================================================');
  console.log();
  
  if (DRY_RUN) {
    console.log('[DRY RUN MODE - No requests will be made]');
    console.log();
  }
  
  console.log(`Concurrency: ${CONCURRENCY}`);
  console.log(`Batch size: ${BATCH_SIZE}`);
  console.log(`Batch delay: ${BATCH_DELAY}ms`);
  console.log();
  
  // Check CSV exists
  if (!fs.existsSync(CSV_PATH)) {
    console.error('CSV file not found. Run import-historical-dataset.js --download first.');
    process.exit(1);
  }
  
  // Load cache
  const cache = loadCache();
  const cachedCount = Object.keys(cache).length;
  console.log(`Loaded ${cachedCount} cached URL resolutions`);
  console.log();
  
  // Read all articles
  console.log('Reading articles from CSV...');
  const articles = await readArticles();
  console.log(`Found ${articles.length} articles`);
  
  // Count articles needing resolution
  let needsResolution = 0;
  let hasSourceUrl = 0;
  let inCache = 0;
  
  for (const article of articles) {
    if (article.sourceUrl && article.sourceUrl !== 'NULL' && !article.sourceUrl.includes('cryptopanic')) {
      hasSourceUrl++;
    } else if (cache[article.id]) {
      inCache++;
    } else if (article.url && isCryptoPanicUrl(article.url)) {
      needsResolution++;
    }
  }
  
  console.log(`  - Already have source URL: ${hasSourceUrl}`);
  console.log(`  - Cached resolutions: ${inCache}`);
  console.log(`  - Need to resolve: ${needsResolution}`);
  console.log();
  
  if (needsResolution === 0) {
    console.log('All URLs already resolved or cached!');
    console.log(`Total resolutions in cache: ${Object.keys(cache).length}`);
    return;
  }
  
  // Filter to articles needing resolution
  const toResolve = articles.filter(a => {
    if (a.sourceUrl && a.sourceUrl !== 'NULL' && !a.sourceUrl.includes('cryptopanic')) return false;
    if (cache[a.id]) return false;
    return a.url && isCryptoPanicUrl(a.url);
  });
  
  // Apply start-from offset
  const startIdx = START_FROM;
  const remaining = toResolve.slice(startIdx);
  
  if (startIdx > 0) {
    console.log(`Starting from index ${startIdx}`);
  }
  
  console.log(`Resolving ${remaining.length} URLs...`);
  console.log();
  
  let resolved = 0;
  let failed = 0;
  let processed = 0;
  
  // Process in batches
  for (let i = 0; i < remaining.length; i += BATCH_SIZE) {
    const batch = remaining.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(remaining.length / BATCH_SIZE);
    
    process.stdout.write(`\rBatch ${batchNum}/${totalBatches}: Processing ${batch.length} articles...`);
    
    const results = await processBatch(batch, cache);
    
    for (const result of results) {
      processed++;
      if (result.resolvedUrl) {
        resolved++;
      } else if (result.error) {
        failed++;
      }
    }
    
    // Save cache periodically
    if (batchNum % 10 === 0) {
      saveCache(cache);
    }
    
    // Progress update
    const pct = ((processed / remaining.length) * 100).toFixed(1);
    process.stdout.write(`\rBatch ${batchNum}/${totalBatches}: ${processed}/${remaining.length} (${pct}%) - ${resolved} resolved, ${failed} failed`);
    
    // Delay between batches
    if (i + BATCH_SIZE < remaining.length && !DRY_RUN) {
      await new Promise(r => setTimeout(r, BATCH_DELAY));
    }
  }
  
  // Final save
  saveCache(cache);
  
  console.log('\n');
  console.log('============================================================');
  console.log('Complete!');
  console.log('============================================================');
  console.log(`Total processed: ${processed}`);
  console.log(`Resolved: ${resolved}`);
  console.log(`Failed: ${failed}`);
  console.log(`Cache size: ${Object.keys(cache).length}`);
  console.log();
  console.log('URL cache saved to:', RESOLVED_CACHE_PATH);
  console.log();
  console.log('Now run the import script again to use resolved URLs:');
  console.log('  node scripts/archive/import-historical-dataset.js');
}

main().catch(console.error);
