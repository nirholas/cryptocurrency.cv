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
 * Reconstruct article URLs from domain + title + date
 * 
 * Many news sites have predictable URL patterns:
 * - CoinDesk: coindesk.com/{category}/{year}/{month}/{day}/{slug}
 * - CoinTelegraph: cointelegraph.com/news/{slug}
 * - Decrypt: decrypt.co/{id}/{slug}
 * etc.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { createReadStream } = require('fs');
const { createInterface } = require('readline');

const TEMP_DIR = '/workspaces/free-crypto-news/.temp-import';
const CSV_PATH = path.join(TEMP_DIR, 'news_currencies_source_joinedResult.csv');
const OUTPUT_PATH = path.join(TEMP_DIR, 'reconstructed-urls.json');
const PROGRESS_PATH = path.join(TEMP_DIR, 'reconstruct-progress.json');

// URL patterns for known domains
const URL_PATTERNS = {
  'coindesk.com': (title, date) => {
    const slug = slugify(title);
    const d = new Date(date);
    // CoinDesk has multiple patterns, we'll try the most common
    return [
      `https://www.coindesk.com/markets/${d.getFullYear()}/${pad(d.getMonth()+1)}/${pad(d.getDate())}/${slug}`,
      `https://www.coindesk.com/business/${d.getFullYear()}/${pad(d.getMonth()+1)}/${pad(d.getDate())}/${slug}`,
      `https://www.coindesk.com/tech/${d.getFullYear()}/${pad(d.getMonth()+1)}/${pad(d.getDate())}/${slug}`,
      `https://www.coindesk.com/policy/${d.getFullYear()}/${pad(d.getMonth()+1)}/${pad(d.getDate())}/${slug}`,
      `https://www.coindesk.com/${slug}`,
    ];
  },
  'cointelegraph.com': (title, date) => {
    const slug = slugify(title);
    return [
      `https://cointelegraph.com/news/${slug}`,
    ];
  },
  'decrypt.co': (title, date) => {
    const slug = slugify(title);
    return [
      `https://decrypt.co/news/${slug}`,
      `https://decrypt.co/${slug}`,
    ];
  },
  'bitcoinmagazine.com': (title, date) => {
    const slug = slugify(title);
    return [
      `https://bitcoinmagazine.com/business/${slug}`,
      `https://bitcoinmagazine.com/markets/${slug}`,
      `https://bitcoinmagazine.com/technical/${slug}`,
    ];
  },
  'theblock.co': (title, date) => {
    const slug = slugify(title);
    return [
      `https://www.theblock.co/post/${slug}`,
    ];
  },
  'u.today': (title, date) => {
    const slug = slugify(title);
    return [
      `https://u.today/${slug}`,
    ];
  },
  'newsbtc.com': (title, date) => {
    const slug = slugify(title);
    return [
      `https://www.newsbtc.com/${slug}`,
    ];
  },
  'beincrypto.com': (title, date) => {
    const slug = slugify(title);
    return [
      `https://beincrypto.com/${slug}`,
    ];
  },
  'cryptoslate.com': (title, date) => {
    const slug = slugify(title);
    return [
      `https://cryptoslate.com/${slug}`,
    ];
  },
  'ambcrypto.com': (title, date) => {
    const slug = slugify(title);
    return [
      `https://ambcrypto.com/${slug}`,
    ];
  },
  'dailyhodl.com': (title, date) => {
    const slug = slugify(title);
    return [
      `https://dailyhodl.com/${d.getFullYear()}/${pad(d.getMonth()+1)}/${pad(d.getDate())}/${slug}`,
    ];
  },
};

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/['\u2019]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 80);
}

function pad(n) {
  return n.toString().padStart(2, '0');
}

// Check if URL exists via HEAD request
function checkUrl(url, timeout = 5000) {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https') ? https : http;
    const req = protocol.request(url, { method: 'HEAD', timeout }, (res) => {
      resolve({ exists: res.statusCode >= 200 && res.statusCode < 400, status: res.statusCode, url });
    });
    req.on('error', () => resolve({ exists: false, url }));
    req.on('timeout', () => { req.destroy(); resolve({ exists: false, url }); });
    req.end();
  });
}

async function main() {
  console.log('URL Reconstruction Tool');
  console.log('=======================\n');
  
  // Load existing progress
  let progress = { processed: 0, found: 0, results: {} };
  try {
    progress = JSON.parse(fs.readFileSync(PROGRESS_PATH, 'utf-8'));
    console.log(`Resuming from ${progress.processed} processed, ${progress.found} found`);
  } catch {
    // No saved progress (or unreadable): start fresh.
  }
  
  // Read CSV and find articles needing URL reconstruction
  console.log('Scanning CSV for articles needing URL reconstruction...');
  
  const articlesToProcess = [];
  const fileStream = createReadStream(CSV_PATH);
  const rl = createInterface({ input: fileStream, crlfDelay: Infinity });
  
  let headers = [];
  let lineNum = 0;
  let alreadyHaveUrl = 0;
  let noPattern = 0;
  
  for await (const line of rl) {
    lineNum++;
    if (lineNum === 1) {
      headers = parseCSVLine(line);
      continue;
    }
    
    const fields = parseCSVLine(line);
    const row = {};
    headers.forEach((h, i) => row[h] = fields[i] || '');
    
    const id = row.id;
    const sourceUrl = row.sourceUrl;
    const domain = row.sourceDomain;
    const title = row.title;
    const datetime = row.newsDatetime;
    
    // Skip if already has URL
    if (sourceUrl && sourceUrl !== 'NULL' && sourceUrl.startsWith('http')) {
      alreadyHaveUrl++;
      continue;
    }
    
    // Skip if already processed
    if (progress.results[id]) continue;
    
    // Skip if no pattern for this domain
    if (!domain || !URL_PATTERNS[domain]) {
      noPattern++;
      continue;
    }
    
    articlesToProcess.push({ id, domain, title, datetime });
  }
  
  console.log(`\nAlready have URL: ${alreadyHaveUrl.toLocaleString()}`);
  console.log(`No URL pattern for domain: ${noPattern.toLocaleString()}`);
  console.log(`To process: ${articlesToProcess.toLocaleString()}`);
  
  // Process in batches
  const BATCH_SIZE = 50;
  let processed = 0;
  let found = progress.found;
  
  console.log(`\nProcessing ${articlesToProcess.length} articles...`);
  
  for (let i = 0; i < articlesToProcess.length; i += BATCH_SIZE) {
    const batch = articlesToProcess.slice(i, i + BATCH_SIZE);
    
    for (const article of batch) {
      const possibleUrls = URL_PATTERNS[article.domain](article.title, article.datetime);
      
      for (const url of possibleUrls) {
        const result = await checkUrl(url);
        if (result.exists) {
          progress.results[article.id] = url;
          found++;
          break;
        }
      }
      
      processed++;
      progress.processed++;
    }
    
    // Save progress every batch
    progress.found = found;
    fs.writeFileSync(PROGRESS_PATH, JSON.stringify(progress, null, 2));
    
    console.log(`Processed ${processed}/${articlesToProcess.length} - Found: ${found}`);
  }
  
  // Save final results
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(progress.results, null, 2));
  console.log(`\nDone! Found ${found} URLs, saved to ${OUTPUT_PATH}`);
}

function parseCSVLine(line) {
  const fields = [];
  let field = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') { field += '"'; i++; }
      else inQuotes = !inQuotes;
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

main().catch(console.error);
