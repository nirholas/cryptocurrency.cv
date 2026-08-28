#!/usr/bin/env node
/**
 * Source repair.
 *
 * `check-source-health.mjs` says which feeds are broken. This one tries to fix
 * them: for every source that no longer returns a feed it asks the site where
 * its feed moved to (the <link rel="alternate"> the page advertises), then
 * falls back to the handful of conventional paths publishers use. Sources with
 * a working replacement get their URL rewritten; sources with nothing left get
 * `disabled: true` so the aggregator skips them instead of burning a request
 * and a timeout on every fetch.
 *
 * Usage:
 *   node scripts/repair-sources.mjs                 # dry run, prints the plan
 *   node scripts/repair-sources.mjs --apply         # rewrite src/lib/crypto-news.ts
 *   node scripts/repair-sources.mjs --from <json>   # reuse a health report
 *
 * Nothing is deleted: a disabled source keeps its entry, its name and its
 * category, so re-enabling it later is a one-word change.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const SOURCE_FILE = resolve(HERE, '..', 'src', 'lib', 'crypto-news.ts');

const args = process.argv.slice(2);
const flag = (name, fallback = null) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : (args[i + 1] ?? true);
};
const APPLY = args.includes('--apply');
const FROM = flag('from', null);
const TIMEOUT_MS = Number(flag('timeout', 12000)) || 12000;
const CONCURRENCY = Number(flag('concurrency', 5)) || 5;

const UA = 'FreeCryptoNews/1.0 (+https://cryptocurrency.cv)';
const HEADERS = {
  'User-Agent': UA,
  Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, text/html, */*',
};

/** Conventional feed paths, in the order publishers most often use them. */
const CANDIDATE_PATHS = [
  '/feed',
  '/feed/',
  '/rss',
  '/rss.xml',
  '/feed.xml',
  '/atom.xml',
  '/index.xml',
  '/blog/feed',
  '/blog/rss.xml',
  '/news/feed',
  '/en/feed',
  '/feeds/posts/default',
];

/**
 * Topic markers that appear in a source URL because the publisher is general
 * interest and only one section of it belongs in a crypto feed.
 */
const TOPIC_MARKERS = /crypto|blockchain|digital-?asset|bitcoin|web3|defi|nft|token|fintech|markets?|sai/i;

/**
 * A replacement is only safe if it keeps the topic the original URL narrowed to.
 * Fortune's crypto section going 404 does not make Fortune's front page a crypto
 * source, and silently widening it would pour general news into the feed.
 */
function widensScope(originalUrl, candidateUrl) {
  const pathOf = (u) => {
    try {
      const { pathname, search } = new URL(u);
      return pathname + search;
    } catch {
      return u;
    }
  };
  const original = pathOf(originalUrl);
  const candidate = pathOf(candidateUrl);
  if (!TOPIC_MARKERS.test(original)) return false;
  return !TOPIC_MARKERS.test(candidate);
}

/**
 * Slice the RSS_SOURCES object literal out of crypto-news.ts.
 *
 * Brace-counted rather than scanning for the next `};`: RSS_SOURCES closes with
 * `} as const;` and API_SOURCES follows it, so a naive scan swallowed 24 JSON
 * API sources that are not RSS feeds at all and reported every one as broken.
 */
function rssSourcesBlock(src) {
  const start = src.indexOf('const RSS_SOURCES = {');
  if (start === -1) throw new Error('RSS_SOURCES not found in crypto-news.ts');
  const open = src.indexOf('{', start);
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') {
      depth--;
      if (depth === 0) return { block: src.slice(start, i), start, end: i };
    }
  }
  throw new Error('RSS_SOURCES literal is unbalanced');
}

function isFeed(body) {
  return /<item[\s>]/i.test(body) || /<entry[\s>]/i.test(body);
}

async function get(url) {
  const response = await fetch(url, {
    redirect: 'follow',
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: HEADERS,
  });
  return { ok: response.ok, status: response.status, url: response.url, body: response.ok ? await response.text() : '' };
}

/** Asks the site itself where its feed is, which beats guessing. */
function advertisedFeeds(html, baseUrl) {
  const links = [...html.matchAll(/<link\b[^>]*>/gi)].map((m) => m[0]);
  const found = [];
  for (const tag of links) {
    if (!/rel=["']?alternate/i.test(tag)) continue;
    if (!/type=["']?application\/(rss|atom)\+xml/i.test(tag)) continue;
    const href = tag.match(/href=["']([^"']+)["']/i)?.[1];
    if (!href) continue;
    try {
      found.push(new URL(href, baseUrl).toString());
    } catch {
      // A malformed href is not worth failing the repair over.
    }
  }
  return found;
}

async function findReplacement(source) {
  let origin;
  try {
    origin = new URL(source.url).origin;
  } catch {
    return null;
  }

  // 1. Ask the homepage what it advertises.
  try {
    const home = await get(origin);
    if (home.ok && /<html/i.test(home.body)) {
      for (const candidate of advertisedFeeds(home.body, origin)) {
        if (candidate === source.url) continue;
        try {
          const probe = await get(candidate);
          if (probe.ok && isFeed(probe.body)) return { url: candidate, how: 'advertised' };
        } catch {
          // try the next advertised feed
        }
      }
    }
  } catch {
    // homepage unreachable; fall through to conventional paths
  }

  // 2. Try the conventional paths.
  for (const path of CANDIDATE_PATHS) {
    const candidate = origin + path;
    if (candidate === source.url) continue;
    try {
      const probe = await get(candidate);
      if (probe.ok && isFeed(probe.body)) return { url: candidate, how: 'conventional' };
    } catch {
      // try the next path
    }
  }

  return null;
}

async function mapWithLimit(items, limit, fn) {
  const out = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i], i);
      process.stderr.write(`\r  checked ${out.filter(Boolean).length}/${items.length}`);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  process.stderr.write('\n');
  return out;
}

// ─── Load the broken set ────────────────────────────────────────────────────

let broken;
if (FROM) {
  const report = JSON.parse(readFileSync(FROM, 'utf8'));
  broken = report.results.filter((r) => ['dead', 'notfeed', 'empty'].includes(r.state));
} else {
  const { execSync } = await import('node:child_process');
  const tmp = resolve(HERE, '..', '.source-health.tmp.json');
  execSync(`node ${resolve(HERE, 'check-source-health.mjs')} --json ${tmp}`, { stdio: 'inherit' });
  const report = JSON.parse(readFileSync(tmp, 'utf8'));
  broken = report.results.filter((r) => ['dead', 'notfeed', 'empty'].includes(r.state));
}

console.log(`\n${broken.length} broken sources. Looking for replacements...\n`);
const results = await mapWithLimit(broken, CONCURRENCY, async (source) => ({
  source,
  replacement: await findReplacement(source),
}));

const fixable = results.filter(
  (r) => r.replacement && !widensScope(r.source.url, r.replacement.url),
);
const broadened = results.filter(
  (r) => r.replacement && widensScope(r.source.url, r.replacement.url),
);
const hopeless = results.filter((r) => !r.replacement);

console.log(`\nReplacement feed found: ${fixable.length}`);
for (const { source, replacement } of fixable) {
  console.log(`  ${source.name}`);
  console.log(`    was ${source.url}`);
  console.log(`    now ${replacement.url}  (${replacement.how})`);
}

console.log(`\nReplacement found but it drops the topic, left alone: ${broadened.length}`);
for (const { source, replacement } of broadened) {
  console.log(`  ${source.name}`);
  console.log(`    ${source.url}`);
  console.log(`    -> ${replacement.url} would widen this to the publisher's whole output`);
}

console.log(`\nNo feed found, will be disabled: ${hopeless.length}`);
for (const { source } of hopeless) {
  console.log(`  ${source.name.padEnd(32).slice(0, 32)} ${source.url}`);
}

if (!APPLY) {
  console.log('\nDry run. Re-run with --apply to rewrite src/lib/crypto-news.ts.');
  process.exit(0);
}

// ─── Apply ──────────────────────────────────────────────────────────────────

const whole = readFileSync(SOURCE_FILE, 'utf8');
const bounds = rssSourcesBlock(whole);
// Every edit is confined to the RSS_SOURCES literal. API_SOURCES sits directly
// after it and holds JSON endpoints that are not feeds and must not be touched.
let src = whole.slice(bounds.start, bounds.end);
const before = whole.slice(0, bounds.start);
const after = whole.slice(bounds.end);
let rewritten = 0;
let disabled = 0;

for (const { source, replacement } of fixable) {
  const needle = `url: '${source.url}'`;
  if (src.includes(needle)) {
    src = src.replace(needle, `url: '${replacement.url}'`);
    rewritten++;
  }
}

for (const { source } of [...hopeless, ...broadened]) {
  const needle = `url: '${source.url}'`;
  const i = src.indexOf(needle);
  if (i === -1) continue;
  // Insert `disabled: true` on the line after the url, matching its indentation.
  const lineEnd = src.indexOf('\n', i);
  const lineStart = src.lastIndexOf('\n', i) + 1;
  const indent = src.slice(lineStart, i);
  const after = src.slice(lineEnd);
  if (/^\s*\n?\s*disabled:\s*true/.test(after)) continue;
  src = `${src.slice(0, lineEnd)}\n${indent}// Disabled ${new Date().toISOString().slice(0, 10)}: no feed at this domain (see scripts/repair-sources.mjs).\n${indent}disabled: true,${after}`;
  disabled++;
}

writeFileSync(SOURCE_FILE, before + src + after);
console.log(`\nRewrote ${rewritten} URLs and disabled ${disabled} sources in src/lib/crypto-news.ts.`);
console.log('Run `pnpm audit:sources` again to confirm.');
