#!/usr/bin/env node
/**
 * Source health auditor.
 *
 * The project's headline claim is "200+ sources". Nothing in the repo checked
 * whether those feeds still answer, so a source that went 404 or stopped
 * returning items simply disappeared from the feed with no signal. This walks
 * every entry in RSS_SOURCES, fetches it the way the app does, and classifies
 * the result so a maintainer can tell a dead URL from a datacentre IP block.
 *
 * Usage:
 *   node scripts/check-source-health.mjs                 # full audit, table output
 *   node scripts/check-source-health.mjs --json report.json
 *   node scripts/check-source-health.mjs --limit 40      # quick sample
 *   node scripts/check-source-health.mjs --max-dead 10   # exit 1 past a threshold
 *   node scripts/check-source-health.mjs --only dead     # print just the failures
 *
 * Classifications:
 *   ok        parsed at least one item or entry
 *   empty     valid response, no items (feed drained or wrong URL)
 *   notfeed   200 but the body is not XML/JSON feed content
 *   blocked   403/429, typically Cloudflare refusing a datacentre IP
 *   dead      404/410, DNS failure, or connection refused
 *   timeout   no response inside the deadline
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
const LIMIT = Number(flag('limit', 0)) || 0;
const CONCURRENCY = Number(flag('concurrency', 6)) || 6;
const TIMEOUT_MS = Number(flag('timeout', 15000)) || 15000;
const MAX_DEAD = flag('max-dead', null) === null ? null : Number(flag('max-dead'));
const JSON_OUT = flag('json', null);
const ONLY = flag('only', null);

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

/** Reads the RSS_SOURCES object literal without importing the TypeScript module. */
function readSources() {
  const src = readFileSync(SOURCE_FILE, 'utf8');
  const { block } = rssSourcesBlock(src);
  const entries = [...block.matchAll(/(\w+):\s*\{[^}]*?name:\s*'([^']+)'[^}]*?url:\s*'([^']+)'([^}]*)\}/gs)];
  return entries.map(([, key, name, url, tail]) => ({
    key,
    name,
    url,
    disabled: /disabled:\s*true/.test(tail),
  }));
}

function classify(status, body) {
  if (status === 403 || status === 429) return 'blocked';
  if (status === 404 || status === 410) return 'dead';
  if (status >= 400) return 'dead';
  const hasItem = /<item[\s>]/i.test(body);
  const hasEntry = /<entry[\s>]/i.test(body);
  if (hasItem || hasEntry) return 'ok';
  const looksLikeFeed = /<rss|<feed|<rdf:RDF|^\s*[[{]/i.test(body.slice(0, 400));
  return looksLikeFeed ? 'empty' : 'notfeed';
}

function countItems(body) {
  const items = body.match(/<item[\s>]/gi)?.length ?? 0;
  return items || (body.match(/<entry[\s>]/gi)?.length ?? 0);
}

async function probe(source) {
  const startedAt = Date.now();
  try {
    const response = await fetch(source.url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        'User-Agent': 'FreeCryptoNews/1.0 (+https://cryptocurrency.cv)',
        Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
      },
    });
    const body = response.ok ? await response.text() : '';
    const state = classify(response.status, body);
    return {
      ...source,
      state,
      httpStatus: response.status,
      items: state === 'ok' ? countItems(body) : 0,
      latencyMs: Date.now() - startedAt,
      finalUrl: response.url !== source.url ? response.url : undefined,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      ...source,
      state: /timeout|abort/i.test(message) ? 'timeout' : 'dead',
      httpStatus: 0,
      items: 0,
      latencyMs: Date.now() - startedAt,
      error: message,
    };
  }
}

/** Runs probes with a sliding window so one slow feed never stalls the rest. */
async function runAll(sources) {
  const results = [];
  let next = 0;
  const worker = async () => {
    while (next < sources.length) {
      const source = sources[next++];
      results.push(await probe(source));
      if (!JSON_OUT) process.stderr.write(`\r  probed ${results.length}/${sources.length}`);
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, sources.length) }, () => worker()),
  );
  if (!JSON_OUT) process.stderr.write('\n');
  return results;
}

const STATES = ['ok', 'empty', 'notfeed', 'blocked', 'timeout', 'dead'];

function report(results) {
  const byState = new Map(STATES.map((s) => [s, []]));
  for (const r of results) byState.get(r.state)?.push(r);

  console.log('\nSource health');
  console.log('='.repeat(72));
  for (const state of STATES) {
    const list = byState.get(state) ?? [];
    const pct = ((list.length / results.length) * 100).toFixed(1);
    console.log(`  ${state.padEnd(8)} ${String(list.length).padStart(4)}  ${pct.padStart(5)}%`);
  }

  const totalItems = results.reduce((sum, r) => sum + r.items, 0);
  const healthy = byState.get('ok') ?? [];
  const median = healthy.length
    ? [...healthy].sort((a, b) => a.latencyMs - b.latencyMs)[Math.floor(healthy.length / 2)]
        .latencyMs
    : 0;
  console.log('='.repeat(72));
  console.log(`  ${results.length} sources, ${totalItems} items available, median ok latency ${median} ms`);

  const problems = STATES.filter((s) => s !== 'ok').flatMap((s) => byState.get(s) ?? []);
  if (problems.length > 0) {
    console.log('\nNeeds attention');
    console.log('-'.repeat(72));
    for (const r of problems) {
      const detail = r.error ? r.error.slice(0, 40) : `HTTP ${r.httpStatus}`;
      console.log(`  ${r.state.padEnd(8)} ${r.name.padEnd(28).slice(0, 28)} ${detail}`);
      console.log(`           ${r.url}`);
    }
  }

  console.log(
    '\nblocked is usually a datacentre IP refused by Cloudflare and may work from production.',
  );
  console.log('dead, notfeed and empty are repo bugs: the URL needs fixing or the source removing.');
  return byState;
}

const all = readSources().filter((s) => !s.disabled);
const sources = LIMIT ? all.slice(0, LIMIT) : all;
if (!JSON_OUT) console.log(`Probing ${sources.length} sources (concurrency ${CONCURRENCY})...`);

const results = await runAll(sources);
results.sort((a, b) => a.name.localeCompare(b.name));

if (JSON_OUT && JSON_OUT !== true) {
  writeFileSync(JSON_OUT, JSON.stringify({ checkedAt: new Date().toISOString(), results }, null, 2));
  console.log(`Wrote ${JSON_OUT}`);
} else if (ONLY === 'dead') {
  for (const r of results.filter((x) => ['dead', 'notfeed', 'empty'].includes(x.state))) {
    console.log(`${r.state}\t${r.key}\t${r.name}\t${r.url}\t${r.error ?? r.httpStatus}`);
  }
} else {
  report(results);
}

const broken = results.filter((r) => ['dead', 'notfeed', 'empty'].includes(r.state)).length;
if (MAX_DEAD !== null && broken > MAX_DEAD) {
  console.error(`\nFAIL: ${broken} broken sources exceeds --max-dead ${MAX_DEAD}`);
  process.exit(1);
}
