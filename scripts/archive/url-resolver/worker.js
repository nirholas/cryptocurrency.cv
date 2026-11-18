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

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WORKSPACE = path.join(__dirname, '../../..');
const IDS_FILE = path.join(WORKSPACE, '.temp-import/article-ids.json');
const CACHE_DIR = path.join(WORKSPACE, '.temp-import/cache');

const WORKER_ID = parseInt(process.argv[2]) || 0;
const TOTAL_WORKERS = parseInt(process.argv[3]) || 10;
const BATCH_SIZE = 50;
const DELAY_MS = 20;

async function resolve(id, retries = 0) {
  const postId = String(id);
  if (!/^\d{1,20}$/.test(postId)) return null;
  try {
    const r = await fetch(`https://cryptopanic.com/news/click/${encodeURIComponent(postId)}/`, {
      method: 'HEAD', redirect: 'manual', signal: AbortSignal.timeout(8000),
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NewsArchiver/1.0)' }
    });
    if (r.status === 302 || r.status === 301) {
      const loc = r.headers.get('location');
      if (loc && !loc.includes('cryptopanic')) return loc;
    }
    if (r.status === 429 && retries < 3) {
      await new Promise(r => setTimeout(r, 3000 * (retries + 1)));
      return resolve(id, retries + 1);
    }
    return null;
  } catch {
    if (retries < 2) { await new Promise(r => setTimeout(r, 1500)); return resolve(id, retries + 1); }
    return null;
  }
}

async function main() {
  if (!fs.existsSync(IDS_FILE)) { console.error('Run extract-ids.js first!'); process.exit(1); }
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  const cacheFile = path.join(CACHE_DIR, `worker-${WORKER_ID}.json`);
  
  const allIds = JSON.parse(fs.readFileSync(IDS_FILE, 'utf-8'));
  const myIds = allIds.filter((_, i) => i % TOTAL_WORKERS === WORKER_ID);
  
  let cache = {};
  try {
    cache = JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }
  
  const todo = myIds.filter(id => cache[id] === undefined);
  
  console.log(`=== Worker ${WORKER_ID}/${TOTAL_WORKERS} ===`);
  console.log(`Share: ${myIds.length} | Done: ${myIds.length - todo.length} | Todo: ${todo.length}`);
  
  if (todo.length === 0) { console.log('Nothing to do!'); return; }
  
  const start = Date.now();
  let done = 0, resolved = 0, stopping = false;
  process.on('SIGINT', () => { console.log('\nStopping...'); stopping = true; });
  
  for (let i = 0; i < todo.length && !stopping; i += BATCH_SIZE) {
    const batch = todo.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(batch.map(async id => ({ id, url: await resolve(id) })));
    
    for (const { id, url } of results) { cache[id] = url; if (url) resolved++; done++; }
    fs.writeFileSync(cacheFile, JSON.stringify(cache));
    
    const rate = done / ((Date.now() - start) / 1000);
    const eta = Math.round((todo.length - done) / rate / 60);
    console.log(`[W${WORKER_ID}] ${done}/${todo.length} (${((done/todo.length)*100).toFixed(1)}%) | ✓${resolved} | ${rate.toFixed(0)}/s | ETA: ${eta}m`);
    
    await new Promise(r => setTimeout(r, DELAY_MS));
  }
  console.log(`\nWorker ${WORKER_ID} ${stopping ? 'PAUSED' : 'DONE'}! Resolved: ${resolved}/${done}`);
}
main().catch(console.error);
