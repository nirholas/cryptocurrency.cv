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
 * Verify and correct article dates using search engines
 * 
 * Uses DuckDuckGo HTML search (no API key required) to find actual
 * publication dates for articles with interpolated or missing dates.
 * 
 * Usage:
 *   node verify-dates.js [options]
 * 
 * Options:
 *   --month YYYY-MM    Process specific month file
 *   --batch-size N     Articles per run (default: 100)
 *   --delay MS         Delay between requests (default: 2000)
 *   --dry-run          Preview without writing
 *   --verbose          Show detailed output
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Paths
const WORKSPACE = '/workspaces/free-crypto-news';
const ARCHIVE_DIR = path.join(WORKSPACE, 'archive/articles');
const VERIFIED_CACHE_PATH = path.join(WORKSPACE, '.temp-import/verified-dates.json');

// Parse CLI args
const args = process.argv.slice(2);
const MONTH = args.find((a, i) => args[i-1] === '--month');
const BATCH_SIZE = parseInt(args.find((a, i) => args[i-1] === '--batch-size') || '100');
const DELAY = parseInt(args.find((a, i) => args[i-1] === '--delay') || '2000');
const DRY_RUN = args.includes('--dry-run');
const VERBOSE = args.includes('--verbose') || args.includes('-v');

// Date extraction patterns
const DATE_PATTERNS = [
  // ISO format: 2022-06-09
  /(\d{4}-\d{2}-\d{2})/,
  // US format: Jun 9, 2022 or June 9, 2022
  /([A-Z][a-z]{2,8}\s+\d{1,2},?\s+\d{4})/i,
  // UK format: 9 Jun 2022 or 9 June 2022
  /(\d{1,2}\s+[A-Z][a-z]{2,8}\s+\d{4})/i,
  // Slash format: 06/09/2022 or 09/06/2022
  /(\d{1,2}\/\d{1,2}\/\d{4})/,
];

// Domains interpolated into search queries must be plain hostnames
const DOMAIN_RE = /^[\w.-]{1,253}$/;

/**
 * Load verification cache
 */
function loadCache() {
  if (fs.existsSync(VERIFIED_CACHE_PATH)) {
    try {
      return JSON.parse(fs.readFileSync(VERIFIED_CACHE_PATH, 'utf-8'));
    } catch {
      return {};
    }
  }
  return {};
}

/**
 * Save verification cache
 */
function saveCache(cache) {
  const dir = path.dirname(VERIFIED_CACHE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(VERIFIED_CACHE_PATH, JSON.stringify(cache, null, 2));
}

/**
 * HTTP GET with custom headers
 */
function httpGet(url, timeout = 15000) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      timeout,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      }
    }, (res) => {
      // Handle redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        httpGet(res.headers.location, timeout).then(resolve).catch(reject);
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
 * Search DuckDuckGo for article and extract date
 */
async function searchDuckDuckGo(title, domain) {
  // Clean title for search
  const cleanTitle = title
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .slice(0, 10)
    .join(' ');
  
  if (!DOMAIN_RE.test(domain)) return null;
  const query = encodeURIComponent(`"${cleanTitle}" site:${domain}`);
  const url = `https://html.duckduckgo.com/html/?q=${query}`;
  
  try {
    const response = await httpGet(url);
    if (response.statusCode !== 200) return null;
    
    const html = response.data;
    
    // Extract result URLs and snippets
    const results = [];
    
    // Find result links
    const linkRegex = /class="result__a"[^>]*href="([^"]+)"[^>]*>([^<]+)</gi;
    let match;
    while ((match = linkRegex.exec(html)) !== null) {
      results.push({ url: match[1], title: match[2] });
    }
    
    // Find dates in snippets
    const snippetRegex = /class="result__snippet"[^>]*>([^<]+)</gi;
    const snippets = [];
    while ((match = snippetRegex.exec(html)) !== null) {
      snippets.push(match[1]);
    }
    
    // Look for dates in the HTML
    for (const pattern of DATE_PATTERNS) {
      const dateMatch = html.match(pattern);
      if (dateMatch) {
        const parsed = new Date(dateMatch[1]);
        if (!isNaN(parsed.getTime()) && parsed.getFullYear() >= 2017 && parsed.getFullYear() <= 2026) {
          return {
            date: parsed,
            url: results[0]?.url || null,
            source: 'duckduckgo'
          };
        }
      }
    }
    
    // Check snippets for dates
    for (const snippet of snippets) {
      for (const pattern of DATE_PATTERNS) {
        const dateMatch = snippet.match(pattern);
        if (dateMatch) {
          const parsed = new Date(dateMatch[1]);
          if (!isNaN(parsed.getTime()) && parsed.getFullYear() >= 2017 && parsed.getFullYear() <= 2026) {
            return {
              date: parsed,
              url: results[0]?.url || null,
              source: 'duckduckgo'
            };
          }
        }
      }
    }
    
    // If we found a URL but no date, return URL only
    if (results.length > 0 && results[0].url) {
      return { date: null, url: results[0].url, source: 'duckduckgo' };
    }
    
    return null;
  } catch (error) {
    if (VERBOSE) console.error(`  Search error: ${error.message}`);
    return null;
  }
}

/**
 * Search Brave (free API tier)
 * Requires BRAVE_API_KEY environment variable
 */
async function searchBrave(title, domain) {
  const apiKey = process.env.BRAVE_API_KEY;
  if (!apiKey) return null;
  
  const cleanTitle = title
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .slice(0, 10)
    .join(' ');
  
  if (!DOMAIN_RE.test(domain)) return null;
  const query = encodeURIComponent(`"${cleanTitle}" site:${domain}`);
  const url = `https://api.search.brave.com/res/v1/web/search?q=${query}&count=5`;
  
  try {
    const response = await new Promise((resolve, reject) => {
      const req = https.get(url, {
        headers: {
          'Accept': 'application/json',
          'X-Subscription-Token': apiKey
        }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({ statusCode: res.statusCode, data }));
      });
      req.on('error', reject);
    });
    
    if (response.statusCode !== 200) return null;
    
    const data = JSON.parse(response.data);
    const results = data.web?.results || [];
    
    for (const result of results) {
      // Brave returns page_age or published_time
      if (result.page_age || result.published_time) {
        const dateStr = result.page_age || result.published_time;
        const parsed = new Date(dateStr);
        if (!isNaN(parsed.getTime())) {
          return {
            date: parsed,
            url: result.url,
            source: 'brave'
          };
        }
      }
    }
    
    // Return URL if found
    if (results.length > 0) {
      return { date: null, url: results[0].url, source: 'brave' };
    }
    
    return null;
  } catch (error) {
    if (VERBOSE) console.error(`  Brave error: ${error.message}`);
    return null;
  }
}

/**
 * Verify date for an article
 */
async function verifyArticle(article, cache) {
  const cacheKey = article.content_hash;
  
  // Check cache
  if (cache[cacheKey]) {
    return cache[cacheKey];
  }
  
  const title = article.title;
  const domain = article.source_key ? `${article.source_key}.com` : null;
  
  if (!domain || title.startsWith('[No title')) {
    cache[cacheKey] = { verified: false, reason: 'no_domain_or_title' };
    return null;
  }
  
  // Try Brave first (better structured data)
  let result = await searchBrave(title, domain);
  
  if (!result) {
    await sleep(500);
    result = await searchDuckDuckGo(title, domain);
  }
  
  if (result) {
    cache[cacheKey] = {
      verified: true,
      date: result.date?.toISOString() || null,
      url: result.url,
      source: result.source,
      verified_at: new Date().toISOString()
    };
    return cache[cacheKey];
  }
  
  cache[cacheKey] = {
    verified: false,
    reason: 'not_found',
    attempted_at: new Date().toISOString()
  };
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
  if (!fs.existsSync(filePath)) return [];
  
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
    return { processed: 0, verified: 0, urlsFound: 0 };
  }
  
  console.log(`\nProcessing ${month}...`);
  
  const articles = loadArticles(filePath);
  
  // Find articles needing verification (interpolated dates or missing URLs)
  const needsVerification = articles.filter(a => 
    a.meta?.date_source === 'interpolated' || 
    !a.meta?.has_valid_date ||
    !a.link
  );
  
  console.log(`  Total: ${articles.length}, Need verification: ${needsVerification.length}`);
  
  if (needsVerification.length === 0) {
    return { processed: 0, verified: 0, urlsFound: 0 };
  }
  
  const stats = { processed: 0, verified: 0, urlsFound: 0 };
  let modified = false;
  
  // Process batch
  const toProcess = needsVerification.slice(0, BATCH_SIZE);
  
  for (let i = 0; i < toProcess.length; i++) {
    const article = toProcess[i];
    stats.processed++;
    
    if (VERBOSE) {
      console.log(`  [${i + 1}/${toProcess.length}] ${article.title.substring(0, 50)}...`);
    }
    
    const result = await verifyArticle(article, cache);
    
    if (result && result.verified) {
      modified = true;
      
      // Update date if found
      if (result.date) {
        const newDate = new Date(result.date);
        const oldMonth = article.pub_date?.substring(0, 7);
        
        article.pub_date = newDate.toISOString();
        article.first_seen = newDate.toISOString();
        article.meta.has_valid_date = true;
        article.meta.date_source = 'verified';
        article.meta.date_verified_by = result.source;
        
        stats.verified++;
        console.log(`  ✓ Date verified: ${newDate.toISOString().substring(0, 10)} (was ${oldMonth || 'unknown'})`);
      }
      
      // Update URL if found and missing
      if (result.url && !article.link) {
        article.link = result.url;
        article.canonical_link = result.url;
        article.meta.has_url = true;
        article.meta.url_source = result.source;
        stats.urlsFound++;
        console.log(`  ✓ URL found: ${result.url.substring(0, 60)}`);
      }
    } else if (VERBOSE) {
      console.log(`  ✗ Not verified`);
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
    console.log(`  Saved updates to ${month}.jsonl`);
  } else if (modified && DRY_RUN) {
    console.log(`  [DRY RUN] Would save updates to ${month}.jsonl`);
  }
  
  return stats;
}

/**
 * Main function
 */
async function main() {
  console.log('═'.repeat(60));
  console.log('Article Date Verification via Search');
  console.log('═'.repeat(60));
  
  if (DRY_RUN) console.log('🔍 DRY RUN MODE\n');
  
  console.log(`Batch size: ${BATCH_SIZE}`);
  console.log(`Request delay: ${DELAY}ms`);
  console.log(`Brave API: ${process.env.BRAVE_API_KEY ? 'Available' : 'Not set (using DuckDuckGo only)'}`);
  
  // Load cache
  const cache = loadCache();
  console.log(`\nLoaded cache with ${Object.keys(cache).length} entries`);
  
  // Get month files
  let months = [];
  
  if (MONTH) {
    months = [MONTH];
  } else {
    months = fs.readdirSync(ARCHIVE_DIR)
      .filter(f => f.match(/^\d{4}-\d{2}\.jsonl$/) || f === 'unknown-date.jsonl')
      .map(f => f.replace('.jsonl', ''))
      .sort();
  }
  
  if (months.length === 0) {
    console.log('No archive files found');
    return;
  }
  
  console.log(`\nWill process ${months.length} file(s)`);
  
  // Process
  const totalStats = { processed: 0, verified: 0, urlsFound: 0 };
  
  for (const month of months) {
    try {
      const stats = await processMonth(month, cache);
      totalStats.processed += stats.processed;
      totalStats.verified += stats.verified;
      totalStats.urlsFound += stats.urlsFound;
    } catch (error) {
      console.error(`  Error processing ${month}: ${error.message}`);
    }
    
    saveCache(cache);
  }
  
  // Summary
  console.log(`\n${'═'.repeat(60)}`);
  console.log('Verification Complete!');
  console.log('═'.repeat(60));
  console.log(`Articles processed: ${totalStats.processed}`);
  console.log(`Dates verified:     ${totalStats.verified}`);
  console.log(`URLs found:         ${totalStats.urlsFound}`);
  console.log(`Cache size:         ${Object.keys(cache).length}`);
}

// Run
main().catch(error => {
  console.error('Verification failed:', error);
  process.exit(1);
});
