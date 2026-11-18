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
 * Test script to analyze CryptoPanic HTML response
 * Run: node test-cryptopanic.js
 */

const https = require('https');
const fs = require('fs');
const os = require('os');
const path = require('path');

/** Strip CR/LF so untrusted text cannot forge log lines */
const logSafe = (v) => String(v).replace(/\n|\r/g, '');

/** True if the URL's hostname is cryptopanic.com or a subdomain of it */
function isCryptoPanicUrl(u) {
  try {
    const host = new URL(u).hostname;
    return host === 'cryptopanic.com' || host.endsWith('.cryptopanic.com');
  } catch {
    return false;
  }
}

const TEST_URL = 'https://cryptopanic.com/news/15444990/Worlds-Largest-Banks-Say-Crypto-is-Here-to-Stay/';

console.log('Fetching:', TEST_URL);
console.log('');

const req = https.get(TEST_URL, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; CryptoNewsArchive/1.0)',
    'Accept': 'text/html,application/xhtml+xml'
  }
}, (res) => {
  console.log('Status:', res.statusCode);
  console.log('Location Header:', res.headers.location || '(none)');
  console.log('');
  
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('=== HTML Content Analysis ===');
    console.log('Total length:', body.length, 'chars');
    console.log('');
    
    // Look for various URL patterns
    const patterns = [
      { name: 'og:url', regex: /<meta[^>]*property="og:url"[^>]*content="([^"]+)"/i },
      { name: 'canonical', regex: /<link[^>]*rel="canonical"[^>]*href="([^"]+)"/i },
      { name: 'meta refresh', regex: /<meta[^>]*http-equiv="refresh"[^>]*content="[^"]*url=([^"'\s;>]+)/i },
      { name: 'window.location', regex: /window\.location(?:\.href)?\s*=\s*["']([^"']+)["']/i },
      { name: 'location.href', regex: /location\.href\s*=\s*["']([^"']+)["']/i },
      { name: 'data-link', regex: /data-link="([^"]+)"/i },
      { name: 'source-link', regex: /source-link="([^"]+)"/i },
      { name: 'news link', regex: /news[_-]?link["']?\s*[:=]\s*["']([^"']+)["']/i },
      { name: 'articleUrl', regex: /article[_-]?url["']?\s*[:=]\s*["']([^"']+)["']/i },
      { name: 'sourceUrl var', regex: /source[_-]?url["']?\s*[:=]\s*["']([^"']+)["']/i },
      { name: 'href external', regex: /<a[^>]*href="(https?:\/\/(?!cryptopanic)[^"]+)"[^>]*(?:target="_blank"|external)/i },
      { name: 'first external link', regex: /<a[^>]*href="(https?:\/\/(?!cryptopanic\.com)[^"]+)"/i },
      { name: 'JSON source_url', regex: /"source_url"\s*:\s*"([^"]+)"/i },
      { name: 'JSON url', regex: /"url"\s*:\s*"(https?:\/\/(?!cryptopanic)[^"]+)"/i },
      { name: 'redirect URL param', regex: /redirect[_-]?url=([^&"'<>\s]+)/i },
      { name: 'target_url', regex: /target[_-]?url["']?\s*[:=]\s*["']([^"']+)["']/i },
    ];
    
    console.log('=== URL Pattern Matches ===');
    for (const p of patterns) {
      const match = body.match(p.regex);
      if (match) {
        console.log(`[FOUND] ${p.name}:`);
        console.log(`        ${match[1]}`);
        console.log('');
      }
    }
    
    // Look for the title to verify we got the right page
    const titleMatch = body.match(/<title[^>]*>([^<]+)<\/title>/i);
    console.log('=== Page Title ===');
    console.log(titleMatch ? titleMatch[1] : '(not found)');
    console.log('');
    
    // Show all external links found
    console.log('=== All External Links (non-CryptoPanic) ===');
    const linkRegex = /<a[^>]*href="(https?:\/\/(?!cryptopanic\.com)[^"]+)"[^>]*>/gi;
    let linkMatch;
    const externalLinks = [];
    while ((linkMatch = linkRegex.exec(body)) !== null) {
      if (!externalLinks.includes(linkMatch[1])) {
        externalLinks.push(linkMatch[1]);
      }
    }
    externalLinks.slice(0, 10).forEach((link, i) => console.log(`${i+1}. ${link}`));
    if (externalLinks.length > 10) console.log(`... and ${externalLinks.length - 10} more`);
    console.log('');
    
    // Look for any JavaScript that might contain the real URL
    console.log('=== JavaScript Analysis ===');
    const scriptBlocks = body.match(/<script[^>]*>[\s\S]*?<\/script[^>]*>/gi) || [];
    console.log(`Found ${scriptBlocks.length} script blocks`);
    
    for (let i = 0; i < scriptBlocks.length; i++) {
      const script = scriptBlocks[i];
      // Look for URL-like patterns in scripts
      const urlPatterns = script.match(/https?:\/\/[^"'\s<>]+/gi) || [];
      const externalUrls = urlPatterns.filter(u => !isCryptoPanicUrl(u) && !u.includes('google') && !u.includes('facebook'));
      if (externalUrls.length > 0) {
        console.log(`\nScript ${i+1} contains external URLs:`);
        externalUrls.slice(0, 5).forEach(u => console.log(`  - ${u}`));
      }
    }
    console.log('');
    
    // Show first 3000 chars of body for manual inspection
    console.log('=== First 3000 chars of HTML ===');
    console.log(body.slice(0, 3000));
    console.log('\n... (truncated)');
    
    // Save full response to file for inspection
    const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cryptopanic-'));
    const outFile = path.join(outDir, 'cryptopanic-response.html');
    fs.writeFileSync(outFile, body, { mode: 0o600, flag: 'wx' });
    console.log(`\n=== Full response saved to ${outFile} ===`);
  });
});

req.on('error', (err) => {
  console.error('Error:', logSafe(err.message));
});
