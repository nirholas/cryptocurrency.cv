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
 * Resolve CryptoPanic URLs to Real Source URLs in Archive Files
 * 
 * This script processes archive JSON files and resolves CryptoPanic 
 * redirect URLs to get the actual article URLs.
 * 
 * Usage:
 *   node resolve-archive-urls.js [options]
 * 
 * Options:
 *   --concurrency N   Number of concurrent requests (default: 10)
 *   --batch-size N    Articles per batch (default: 50)
 *   --delay N         Delay between batches in ms (default: 2000)
 *   --dry-run         Preview without making changes
 *   --year YYYY       Only process specific year
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const ARCHIVE_DIR = path.join(__dirname, '../../archive');
const CACHE_PATH = path.join(__dirname, '.url-cache.json');

// Parse command line args
const args = process.argv.slice(2);
const getArg = (name, defaultVal) => {
  const idx = args.indexOf(name);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : defaultVal;
};

const CONCURRENCY = parseInt(getArg('--concurrency', '10'));
const BATCH_SIZE = parseInt(getArg('--batch-size', '50'));
const BATCH_DELAY = parseInt(getArg('--delay', '2000'));
const DRY_RUN = args.includes('--dry-run');
const YEAR_FILTER = getArg('--year', null);

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
 */
function extractPostId(url) {
  if (!url || !isCryptoPanicUrl(url)) return null;
  const match = url.match(/\/news\/(?:click\/)?(\d+)/);
  return match ? match[1] : null;
}

/**
 * Resolve CryptoPanic URL to real source URL
 */
function resolveUrl(url) {
  return new Promise((resolve) => {
    const postId = extractPostId(url);
    if (!postId || !/^\d{1,20}$/.test(postId)) {
      resolve({ success: false, error: 'No post ID' });
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
      res.resume(); // Consume response
      
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const realUrl = res.headers.location;
        if (realUrl && !isCryptoPanicUrl(realUrl, 'https://cryptopanic.com')) {
          resolve({ success: true, url: realUrl });
        } else {
          resolve({ success: false, error: 'Still CryptoPanic' });
        }
      } else {
        resolve({ success: false, error: `Status ${res.statusCode}` });
      }
    });
    
    req.on('error', (err) => {
      clearTimeout(timeout);
      resolve({ success: false, error: err.message });
    });
    
    req.on('timeout', () => {
      clearTimeout(timeout);
      req.destroy();
      resolve({ success: false, error: 'Timeout' });
    });
  });
}

/**
 * Process batch of articles concurrently
 */
async function processBatch(articles, cache) {
  const results = [];
  
  for (let i = 0; i < articles.length; i += CONCURRENCY) {
    const chunk = articles.slice(i, i + CONCURRENCY);
    
    const chunkResults = await Promise.all(chunk.map(async (article) => {
      const url = article.url;
      const postId = extractPostId(url);
      
      if (!postId) return { article, resolved: null };
      
      // Check cache
      if (cache[postId]) {
        return { article, resolved: cache[postId], cached: true };
      }
      
      if (DRY_RUN) {
        return { article, resolved: null, dryRun: true };
      }
      
      const result = await resolveUrl(url);
      
      if (result.success) {
        cache[postId] = result.url;
        return { article, resolved: result.url };
      }
      
      return { article, resolved: null, error: result.error };
    }));
    
    results.push(...chunkResults);
  }
  
  return results;
}

/**
 * Find all archive JSON files
 */
function findArchiveFiles() {
  const files = [];
  
  const years = fs.readdirSync(ARCHIVE_DIR)
    .filter(f => /^\d{4}$/.test(f))
    .filter(f => !YEAR_FILTER || f === YEAR_FILTER);
  
  for (const year of years) {
    const yearDir = path.join(ARCHIVE_DIR, year);
    const months = fs.readdirSync(yearDir).filter(f => /^\d{2}$/.test(f));
    
    for (const month of months) {
      const monthDir = path.join(yearDir, month);
      const jsonFiles = fs.readdirSync(monthDir).filter(f => f.endsWith('.json'));
      
      for (const file of jsonFiles) {
        files.push(path.join(monthDir, file));
      }
    }
  }
  
  return files.sort();
}

/**
 * Load cache
 */
function loadCache() {
  try {
    if (fs.existsSync(CACHE_PATH)) {
      return JSON.parse(fs.readFileSync(CACHE_PATH, 'utf-8'));
    }
  } catch {
    // Start fresh
  }
  return {};
}

/**
 * Save cache
 */
function saveCache(cache) {
  fs.writeFileSync(CACHE_PATH, JSON.stringify(cache));
}

/**
 * Main
 */
async function main() {
  console.log('============================================================');
  console.log('Resolve CryptoPanic URLs in Archive Files');
  console.log('============================================================');
  console.log();
  
  if (DRY_RUN) console.log('[DRY RUN MODE]\n');
  if (YEAR_FILTER) console.log(`Processing year: ${YEAR_FILTER}\n`);
  
  console.log(`Concurrency: ${CONCURRENCY}`);
  console.log(`Batch size: ${BATCH_SIZE}`);
  console.log(`Batch delay: ${BATCH_DELAY}ms`);
  console.log();
  
  const cache = loadCache();
  console.log(`Loaded ${Object.keys(cache).length} cached resolutions`);
  console.log();
  
  // Find archive files
  const archiveFiles = findArchiveFiles();
  console.log(`Found ${archiveFiles.length} archive files`);
  console.log();
  
  let totalArticles = 0;
  let needsResolution = 0;
  let resolved = 0;
  let failed = 0;
  let filesModified = 0;
  
  // Process each file
  for (let fileIdx = 0; fileIdx < archiveFiles.length; fileIdx++) {
    const filePath = archiveFiles[fileIdx];
    const fileName = path.relative(ARCHIVE_DIR, filePath);
    
    let articles;
    try {
      articles = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch {
      continue;
    }
    
    if (!Array.isArray(articles)) continue;
    
    // Find articles with CryptoPanic URLs
    const cryptopanicArticles = articles.filter(a => 
      a.url && isCryptoPanicUrl(a.url)
    );
    
    if (cryptopanicArticles.length === 0) continue;
    
    totalArticles += articles.length;
    needsResolution += cryptopanicArticles.length;
    
    process.stdout.write(`\r[${fileIdx + 1}/${archiveFiles.length}] ${fileName}: ${cryptopanicArticles.length} URLs to resolve...`);
    
    // Process in batches
    let fileModified = false;
    
    for (let i = 0; i < cryptopanicArticles.length; i += BATCH_SIZE) {
      const batch = cryptopanicArticles.slice(i, i + BATCH_SIZE);
      const results = await processBatch(batch, cache);
      
      for (const { article, resolved: newUrl, error } of results) {
        if (newUrl) {
          article.url = newUrl;
          fileModified = true;
          resolved++;
        } else if (error) {
          failed++;
        }
      }
      
      // Delay between batches
      if (i + BATCH_SIZE < cryptopanicArticles.length) {
        await new Promise(r => setTimeout(r, BATCH_DELAY));
      }
    }
    
    // Save modified file
    if (fileModified && !DRY_RUN) {
      fs.writeFileSync(filePath, JSON.stringify(articles, null, 2));
      filesModified++;
    }
    
    // Save cache periodically
    if ((fileIdx + 1) % 50 === 0) {
      saveCache(cache);
    }
    
    process.stdout.write(`\r[${fileIdx + 1}/${archiveFiles.length}] ${fileName}: Done (${resolved} resolved, ${failed} failed)          \n`);
  }
  
  // Final cache save
  saveCache(cache);
  
  console.log();
  console.log('============================================================');
  console.log('Complete!');
  console.log('============================================================');
  console.log(`Files processed: ${archiveFiles.length}`);
  console.log(`Files modified: ${filesModified}`);
  console.log(`URLs resolved: ${resolved}`);
  console.log(`Failed: ${failed}`);
  console.log(`Cache size: ${Object.keys(cache).length}`);
}

main().catch(console.error);
