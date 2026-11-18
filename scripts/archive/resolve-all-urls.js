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
 * CryptoPanic URL Resolver
 * 
 * Resolves CryptoPanic redirect URLs to real source URLs.
 * Makes requests to https://cryptopanic.com/news/click/{id}/ and follows 302 redirects.
 * 
 * Features:
 * - Concurrent requests with rate limiting
 * - Persistent cache (survives restarts)
 * - Progress tracking
 * - Retry with exponential backoff
 * - Resume capability
 * 
 * Usage:
 *   node resolve-all-urls.js                    # Resolve URLs from CSV
 *   node resolve-all-urls.js --concurrency=50  # Custom concurrency
 *   node resolve-all-urls.js --resume          # Resume from cache
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createReadStream } from 'fs';
import { createInterface } from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WORKSPACE_ROOT = path.join(__dirname, '..', '..');

// Configuration
const CONFIG = {
  csvPath: path.join(WORKSPACE_ROOT, '.temp-import', 'news_currencies_source_joinedResult.csv'),
  cachePath: path.join(WORKSPACE_ROOT, '.temp-import', 'resolved-urls.json'),
  progressPath: path.join(WORKSPACE_ROOT, '.temp-import', 'resolve-progress.json'),
  concurrency: 30,        // Concurrent requests
  requestDelay: 50,       // ms between batches
  maxRetries: 3,
  retryDelay: 1000,       // Base delay for exponential backoff
  timeout: 10000,         // Request timeout
  saveInterval: 1000,     // Save cache every N resolved URLs
  userAgent: 'Mozilla/5.0 (compatible; CryptoNewsArchiver/1.0)',
};

// Parse command line arguments
const args = process.argv.slice(2).reduce((acc, arg) => {
  if (arg.startsWith('--')) {
    const [key, value] = arg.slice(2).split('=');
    acc[key] = value === undefined ? true : value;
  }
  return acc;
}, {});

if (args.concurrency) CONFIG.concurrency = parseInt(args.concurrency, 10);
if (args.delay) CONFIG.requestDelay = parseInt(args.delay, 10);

/**
 * Load URL cache from disk
 */
function loadCache() {
  if (fs.existsSync(CONFIG.cachePath)) {
    try {
      const data = JSON.parse(fs.readFileSync(CONFIG.cachePath, 'utf-8'));
      console.log(`Loaded ${Object.keys(data).length.toLocaleString()} cached URLs`);
      return data;
    } catch (e) {
      console.warn('Failed to load cache, starting fresh');
    }
  }
  return {};
}

/**
 * Save URL cache to disk
 */
function saveCache(cache) {
  fs.writeFileSync(CONFIG.cachePath, JSON.stringify(cache, null, 2));
}

/**
 * Extract unique article IDs from CSV
 */
async function extractArticleIds(csvPath) {
  const ids = new Set();
  const urlMap = new Map(); // id -> cryptopanic url
  
  if (!fs.existsSync(csvPath)) {
    throw new Error(`CSV file not found: ${csvPath}`);
  }
  
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
    
    // Parse CSV line (handling quoted fields)
    const fields = parseCSVLine(line);
    const row = {};
    headers.forEach((h, i) => {
      row[h] = fields[i] || '';
    });
    
    const id = row.id;
    const url = row.url || '';
    
    if (id && !ids.has(id)) {
      ids.add(id);
      if (url) {
        urlMap.set(id, url);
      }
    }
    
    if (lineNum % 100000 === 0) {
      console.log(`  Scanned ${lineNum.toLocaleString()} rows, ${ids.size.toLocaleString()} unique IDs...`);
    }
  }
  
  console.log(`Found ${ids.size.toLocaleString()} unique article IDs`);
  return { ids: [...ids], urlMap };
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
 * True if the URL (absolute or relative to cryptopanic.com) points at cryptopanic.com
 */
function isCryptoPanicUrl(u) {
  try {
    const host = new URL(u, 'https://cryptopanic.com').hostname;
    return host === 'cryptopanic.com' || host.endsWith('.cryptopanic.com');
  } catch {
    return false;
  }
}

/**
 * Resolve a single CryptoPanic URL to real source URL
 */
async function resolveUrl(articleId, retryCount = 0) {
  const clickUrl = `https://cryptopanic.com/news/click/${articleId}/`;
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.timeout);
    
    const response = await fetch(clickUrl, {
      method: 'HEAD',  // HEAD is faster, just need the redirect
      redirect: 'manual',  // Don't follow redirect
      signal: controller.signal,
      headers: {
        'User-Agent': CONFIG.userAgent,
      }
    });
    
    clearTimeout(timeoutId);
    
    // Get Location header from 302 redirect
    if (response.status === 302 || response.status === 301) {
      const location = response.headers.get('location');
      if (location && !isCryptoPanicUrl(location)) {
        return { id: articleId, url: location, status: 'resolved' };
      }
    }
    
    // If we got a 200, try following the redirect manually
    if (response.status === 200) {
      // Try GET request to get actual redirect
      const getResponse = await fetch(clickUrl, {
        method: 'GET',
        redirect: 'manual',
        signal: AbortSignal.timeout(CONFIG.timeout),
        headers: {
          'User-Agent': CONFIG.userAgent,
        }
      });
      
      if (getResponse.status === 302 || getResponse.status === 301) {
        const location = getResponse.headers.get('location');
        if (location && !isCryptoPanicUrl(location)) {
          return { id: articleId, url: location, status: 'resolved' };
        }
      }
    }
    
    // 404 = article no longer exists
    if (response.status === 404) {
      return { id: articleId, url: null, status: 'not_found' };
    }
    
    // 429 = rate limited
    if (response.status === 429) {
      if (retryCount < CONFIG.maxRetries) {
        const delay = CONFIG.retryDelay * Math.pow(2, retryCount);
        await sleep(delay);
        return resolveUrl(articleId, retryCount + 1);
      }
      return { id: articleId, url: null, status: 'rate_limited' };
    }
    
    return { id: articleId, url: null, status: `http_${response.status}` };
    
  } catch (error) {
    if (retryCount < CONFIG.maxRetries) {
      const delay = CONFIG.retryDelay * Math.pow(2, retryCount);
      await sleep(delay);
      return resolveUrl(articleId, retryCount + 1);
    }
    return { id: articleId, url: null, status: 'error', error: error.message };
  }
}

/**
 * Sleep helper
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Process URLs in batches with concurrency control
 */
async function resolveUrls(ids, cache) {
  const toResolve = ids.filter(id => !cache[id]);
  
  if (toResolve.length === 0) {
    console.log('All URLs already resolved!');
    return cache;
  }
  
  console.log(`\nResolving ${toResolve.length.toLocaleString()} URLs (${ids.length - toResolve.length} already cached)`);
  console.log(`Concurrency: ${CONFIG.concurrency}, Delay: ${CONFIG.requestDelay}ms`);
  console.log();
  
  const startTime = Date.now();
  let resolved = 0;
  let failed = 0;
  let notFound = 0;
  let lastSave = 0;
  
  // Process in batches
  for (let i = 0; i < toResolve.length; i += CONFIG.concurrency) {
    const batch = toResolve.slice(i, i + CONFIG.concurrency);
    
    const results = await Promise.all(batch.map(id => resolveUrl(id)));
    
    for (const result of results) {
      if (result.status === 'resolved') {
        cache[result.id] = result.url;
        resolved++;
      } else if (result.status === 'not_found') {
        cache[result.id] = null; // Mark as not found
        notFound++;
      } else {
        cache[result.id] = null;
        failed++;
      }
    }
    
    // Progress update
    const processed = i + batch.length;
    const elapsed = (Date.now() - startTime) / 1000;
    const rate = processed / elapsed;
    const remaining = (toResolve.length - processed) / rate;
    
    if (processed % 100 === 0 || processed === toResolve.length) {
      const pct = ((processed / toResolve.length) * 100).toFixed(1);
      const eta = formatTime(remaining);
      console.log(
        `Progress: ${processed.toLocaleString()}/${toResolve.length.toLocaleString()} (${pct}%) | ` +
        `Resolved: ${resolved.toLocaleString()} | Not Found: ${notFound.toLocaleString()} | Failed: ${failed.toLocaleString()} | ` +
        `Rate: ${rate.toFixed(1)}/s | ETA: ${eta}`
      );
    }
    
    // Save cache periodically
    if (resolved - lastSave >= CONFIG.saveInterval) {
      saveCache(cache);
      lastSave = resolved;
    }
    
    // Rate limit delay
    await sleep(CONFIG.requestDelay);
  }
  
  // Final save
  saveCache(cache);
  
  console.log();
  console.log('=== Resolution Complete ===');
  console.log(`Total processed: ${toResolve.length.toLocaleString()}`);
  console.log(`Successfully resolved: ${resolved.toLocaleString()}`);
  console.log(`Not found (404): ${notFound.toLocaleString()}`);
  console.log(`Failed: ${failed.toLocaleString()}`);
  console.log(`Time: ${formatTime((Date.now() - startTime) / 1000)}`);
  
  return cache;
}

/**
 * Format time in human readable format
 */
function formatTime(seconds) {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  const hours = Math.floor(seconds / 3600);
  const mins = Math.round((seconds % 3600) / 60);
  return `${hours}h ${mins}m`;
}

/**
 * Main function
 */
async function main() {
  console.log('=== CryptoPanic URL Resolver ===');
  console.log();
  
  // Check if CSV exists
  if (!fs.existsSync(CONFIG.csvPath)) {
    console.log('CSV file not found. Please download the dataset first:');
    console.log('  node import-historical-dataset.js --download');
    console.log();
    console.log('Or specify a custom CSV path:');
    console.log('  node resolve-all-urls.js --csv=/path/to/file.csv');
    process.exit(1);
  }
  
  // Load cache
  const cache = loadCache();
  
  // Extract article IDs from CSV
  console.log('Scanning CSV for article IDs...');
  const { ids } = await extractArticleIds(CONFIG.csvPath);
  
  // Resolve URLs
  const finalCache = await resolveUrls(ids, cache);
  
  // Generate stats
  const stats = {
    total: ids.length,
    resolved: Object.values(finalCache).filter(v => v !== null).length,
    notFound: Object.values(finalCache).filter(v => v === null).length,
    generatedAt: new Date().toISOString(),
  };
  
  console.log();
  console.log('=== Final Stats ===');
  console.log(`Total unique articles: ${stats.total.toLocaleString()}`);
  console.log(`URLs resolved: ${stats.resolved.toLocaleString()}`);
  console.log(`Not found/failed: ${stats.notFound.toLocaleString()}`);
  console.log();
  console.log(`Cache saved to: ${CONFIG.cachePath}`);
  
  // Save stats
  const statsPath = path.join(WORKSPACE_ROOT, '.temp-import', 'resolve-stats.json');
  fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2));
}

main().catch(console.error);
