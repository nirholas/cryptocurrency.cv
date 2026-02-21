#!/usr/bin/env node
/**
 * scripts/compute-tag-scores.js
 *
 * Reads archive/indexes/by-date.json and the month-based JSONL article files,
 * computes a relevance score (0.5–1.0) for every known tag, and writes the
 * results to archive/meta/tag-scores.json.
 *
 * Usage:
 *   node scripts/compute-tag-scores.js
 */

'use strict';

const fs   = require('fs');
const path = require('path');

// ── Configuration ────────────────────────────────────────────────────────────

const ARCHIVE_DIR   = path.join(__dirname, '..', 'archive');
const INDEXES_DIR   = path.join(ARCHIVE_DIR, 'indexes');
const ARTICLES_DIR  = path.join(ARCHIVE_DIR, 'articles');
const META_DIR      = path.join(ARCHIVE_DIR, 'meta');
const OUT_FILE      = path.join(META_DIR, 'tag-scores.json');

const MAX_EXPECTED_RAW = 60; // raw score that maps to priority 1.0

// ── Known tags ───────────────────────────────────────────────────────────────
// This list is derived from src/lib/tags.ts.  Add new slugs here as the tag
// library grows.  Keywords are used to match article titles; category and
// tickers are also checked via the explicit maps below.

const KNOWN_TAGS = [
  // Assets
  { slug: 'bitcoin',      keywords: ['bitcoin', 'btc', 'satoshi', 'halving'] },
  { slug: 'ethereum',     keywords: ['ethereum', 'eth', 'ether', 'vitalik', 'eip'] },
  { slug: 'solana',       keywords: ['solana', 'sol'] },
  { slug: 'xrp',          keywords: ['xrp', 'ripple'] },
  { slug: 'cardano',      keywords: ['cardano', 'ada', 'hoskinson'] },
  { slug: 'bnb',          keywords: ['bnb', 'binance coin', 'bep'] },
  { slug: 'dogecoin',     keywords: ['dogecoin', 'doge'] },
  { slug: 'polkadot',     keywords: ['polkadot', 'dot', 'parachain'] },
  { slug: 'avalanche',    keywords: ['avalanche', 'avax'] },
  { slug: 'chainlink',    keywords: ['chainlink', 'link oracle'] },
  { slug: 'polygon',      keywords: ['polygon', 'matic', 'pol'] },
  { slug: 'uniswap',      keywords: ['uniswap', 'uni'] },
  { slug: 'litecoin',     keywords: ['litecoin', 'ltc'] },
  { slug: 'cosmos',       keywords: ['cosmos', 'atom', 'ibc'] },
  { slug: 'near',         keywords: ['near protocol', 'near'] },
  { slug: 'arbitrum',     keywords: ['arbitrum', 'arb'] },
  { slug: 'optimism',     keywords: ['optimism', 'op rollup'] },
  { slug: 'aptos',        keywords: ['aptos', 'apt'] },
  { slug: 'sui',          keywords: ['sui network'] },
  { slug: 'injective',    keywords: ['injective', 'inj'] },
  { slug: 'tron',         keywords: ['tron', 'trx', 'justin sun'] },
  { slug: 'toncoin',      keywords: ['toncoin', 'ton', 'telegram'] },
  { slug: 'monero',       keywords: ['monero', 'xmr'] },
  { slug: 'zcash',        keywords: ['zcash', 'zec'] },
  { slug: 'filecoin',     keywords: ['filecoin', 'fil'] },
  { slug: 'aave',         keywords: ['aave'] },
  { slug: 'maker',        keywords: ['makerdao', 'maker', 'dai'] },
  { slug: 'lido',         keywords: ['lido', 'ldo', 'steth'] },
  // Topics
  { slug: 'defi',         keywords: ['defi', 'decentralized finance', 'tvl', 'liquidity'] },
  { slug: 'nft',          keywords: ['nft', 'non-fungible', 'opensea', 'jpeg'] },
  { slug: 'layer-2',      keywords: ['layer 2', 'l2', 'rollup', 'zk-rollup', 'optimistic'] },
  { slug: 'staking',      keywords: ['staking', 'stake', 'validator', 'pos'] },
  { slug: 'mining',       keywords: ['mining', 'miner', 'hashrate', 'asic'] },
  { slug: 'regulation',   keywords: ['sec', 'regulation', 'regulatory', 'compliance', 'law', 'congress'] },
  { slug: 'institutional', keywords: ['institutional', 'etf', 'blackrock', 'fidelity', 'grayscale'] },
  { slug: 'cbdc',         keywords: ['cbdc', 'digital currency', 'central bank'] },
  { slug: 'hack',         keywords: ['hack', 'exploit', 'vulnerability', 'breach', 'stolen'] },
  { slug: 'rug-pull',     keywords: ['rug pull', 'rugpull', 'exit scam'] },
  { slug: 'meme-coins',   keywords: ['meme coin', 'memecoin', 'doge', 'pepe', 'shib'] },
  { slug: 'web3',         keywords: ['web3', 'web 3'] },
  { slug: 'dao',          keywords: ['dao', 'governance', 'proposal', 'vote'] },
  { slug: 'payments',     keywords: ['payment', 'transaction', 'remittance', 'cross-border'] },
  { slug: 'exchange',     keywords: ['exchange', 'binance', 'coinbase', 'kraken', 'ftx', 'cex'] },
  { slug: 'venture',      keywords: ['venture capital', 'vc', 'funding round', 'series a'] },
  // Events
  { slug: 'halving',      keywords: ['halving', 'halvening', 'block reward'] },
  { slug: 'upgrade',      keywords: ['upgrade', 'hard fork', 'migration', 'activate'] },
  { slug: 'listing',      keywords: ['listing', 'listed', 'new coin', 'token launch'] },
  { slug: 'airdrop',      keywords: ['airdrop', 'drop', 'free tokens'] },
  { slug: 'ico',          keywords: ['ico', 'ido', 'ieo', 'token sale', 'presale'] },
  // Technology
  { slug: 'smart-contracts', keywords: ['smart contract', 'contract', 'solidity'] },
  { slug: 'zero-knowledge',  keywords: ['zero knowledge', 'zk proof', 'zksnark', 'zkstark'] },
  { slug: 'lightning-network', keywords: ['lightning network', 'lightning'] },
  { slug: 'cross-chain',  keywords: ['cross-chain', 'bridge', 'multichain', 'interoperability'] },
  { slug: 'oracle',       keywords: ['oracle', 'price feed', 'chainlink'] },
  // Sentiment / market
  { slug: 'bull-market',  keywords: ['bull', 'bull market', 'all-time high', 'ath', 'pump'] },
  { slug: 'bear-market',  keywords: ['bear', 'bear market', 'crash', 'dump', 'correction'] },
  { slug: 'volatility',   keywords: ['volatile', 'volatility', 'swing', 'spike'] },
  { slug: 'liquidation',  keywords: ['liquidation', 'liquidated', 'short squeeze'] },
];

// Ticker symbol → tag slugs (may credit multiple if warranted)
const TICKER_TO_TAGS = {
  BTC:    ['bitcoin'],
  XBT:    ['bitcoin'],
  ETH:    ['ethereum'],
  SOL:    ['solana'],
  XRP:    ['xrp'],
  ADA:    ['cardano'],
  BNB:    ['bnb'],
  DOGE:   ['dogecoin', 'meme-coins'],
  DOT:    ['polkadot'],
  AVAX:   ['avalanche'],
  LINK:   ['chainlink'],
  MATIC:  ['polygon'],
  POL:    ['polygon'],
  UNI:    ['uniswap', 'defi'],
  LTC:    ['litecoin'],
  ATOM:   ['cosmos'],
  NEAR:   ['near'],
  ARB:    ['arbitrum', 'layer-2'],
  OP:     ['optimism', 'layer-2'],
  APT:    ['aptos'],
  SUI:    ['sui'],
  INJ:    ['injective'],
  TRX:    ['tron'],
  SHIB:   ['meme-coins'],
  PEPE:   ['meme-coins'],
  TON:    ['toncoin'],
  XMR:    ['monero'],
  ZEC:    ['zcash'],
  FIL:    ['filecoin'],
  AAVE:   ['aave', 'defi'],
  MKR:    ['maker', 'defi'],
  LDO:    ['lido', 'staking'],
  RPL:    ['staking'],
  CRV:    ['defi'],
  COMP:   ['defi'],
  SNX:    ['defi'],
};

// article.category → tag slugs
const CATEGORY_TO_TAGS = {
  bitcoin:  ['bitcoin'],
  ethereum: ['ethereum'],
  defi:     ['defi'],
  nft:      ['nft'],
  regulation: ['regulation'],
  general:  [],
  altcoin:  [],
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function toMonthKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function getRecentDateCutoffs() {
  const now = new Date();
  const d1  = new Date(now); d1.setDate(d1.getDate() - 1);
  const d7  = new Date(now); d7.setDate(d7.getDate() - 7);
  const d30 = new Date(now); d30.setDate(d30.getDate() - 30);
  return { now, d1, d7, d30 };
}

/** Returns the months that cover [now - daysBack, now] */
function monthsNeeded(daysBack) {
  const now = new Date();
  const months = new Set();
  for (let d = 0; d <= daysBack; d++) {
    const date = new Date(now);
    date.setDate(date.getDate() - d);
    months.add(toMonthKey(date));
  }
  return [...months];
}

/** Load JSONL file → Map<id, article> */
function loadMonthArticles(monthKey) {
  const filePath = path.join(ARTICLES_DIR, `${monthKey}.jsonl`);
  const map = new Map();
  if (!fs.existsSync(filePath)) return map;
  try {
    const lines = fs.readFileSync(filePath, 'utf-8').split('\n');
    for (const line of lines) {
      const t = line.trim();
      if (!t) continue;
      try {
        const a = JSON.parse(t);
        if (a.id) map.set(a.id, a);
      } catch {}
    }
  } catch {}
  return map;
}

/** Check if an article matches a tag definition */
function articleMatchesTag(article, tagDef) {
  // 1. category match
  const catTags = CATEGORY_TO_TAGS[article.category] || [];
  if (catTags.includes(tagDef.slug)) return true;

  // 2. ticker match
  if (Array.isArray(article.tickers)) {
    for (const ticker of article.tickers) {
      const mapped = TICKER_TO_TAGS[ticker.toUpperCase()] || [];
      if (mapped.includes(tagDef.slug)) return true;
    }
  }

  // 3. keyword match in title
  if (article.title) {
    const lower = article.title.toLowerCase();
    if (tagDef.keywords.some(kw => lower.includes(kw))) return true;
  }

  return false;
}

/** Normalise raw score to [0.5, 1.0] */
function normalise(rawScore) {
  const ratio = Math.min(rawScore / MAX_EXPECTED_RAW, 1);
  return Math.round((0.5 + 0.5 * ratio) * 1000) / 1000;
}

// ── Main ──────────────────────────────────────────────────────────────────────

(function main() {
  console.log('[tag-scores] Starting computation…');

  // 1. Load date index
  const dateIndexPath = path.join(INDEXES_DIR, 'by-date.json');
  if (!fs.existsSync(dateIndexPath)) {
    console.error('[tag-scores] ERROR: archive/indexes/by-date.json not found');
    process.exit(1);
  }
  const dateIndex = JSON.parse(fs.readFileSync(dateIndexPath, 'utf-8'));
  const { d1, d7, d30 } = getRecentDateCutoffs();

  // Collect article IDs per window
  const ids24h = new Set();
  const ids7d  = new Set();
  const ids30d = new Set();

  for (const [dateStr, ids] of Object.entries(dateIndex)) {
    const date = new Date(dateStr);
    if (date >= d30) {
      for (const id of ids) ids30d.add(id);
      if (date >= d7)  for (const id of ids) ids7d.add(id);
      if (date >= d1)  for (const id of ids) ids24h.add(id);
    }
  }

  console.log(`[tag-scores] Article windows: 24h=${ids24h.size}  7d=${ids7d.size}  30d=${ids30d.size}`);

  // 2. Load articles for needed months
  const articleMap = new Map();
  for (const month of monthsNeeded(30)) {
    for (const [id, article] of loadMonthArticles(month)) {
      articleMap.set(id, article);
    }
  }

  console.log(`[tag-scores] Loaded ${articleMap.size} articles from JSONL cache`);

  // 3. Score each tag
  const scores = {};

  for (const tagDef of KNOWN_TAGS) {
    let count_24h = 0, count_7d = 0, count_30d = 0;

    for (const id of ids30d) {
      const article = articleMap.get(id);
      if (!article) continue;
      if (!articleMatchesTag(article, tagDef)) continue;

      count_30d++;
      if (ids7d.has(id))  count_7d++;
      if (ids24h.has(id)) count_24h++;
    }

    const recencyBonus = count_24h > 0 ? 1 : 0;
    const rawScore = count_7d * 0.5 + count_30d * 0.1 + recencyBonus * 0.4;
    scores[tagDef.slug] = normalise(rawScore);
  }

  // 4. Write output
  if (!fs.existsSync(META_DIR)) fs.mkdirSync(META_DIR, { recursive: true });

  const output = {
    generated_at: new Date().toISOString(),
    scores,
  };

  fs.writeFileSync(OUT_FILE, JSON.stringify(output, null, 2), 'utf-8');

  const scoreValues = Object.values(scores);
  const avg = scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length;
  console.log(`[tag-scores] Wrote ${Object.keys(scores).length} tag scores to archive/meta/tag-scores.json`);
  console.log(`[tag-scores] Score range: ${Math.min(...scoreValues).toFixed(3)} – ${Math.max(...scoreValues).toFixed(3)}  avg: ${avg.toFixed(3)}`);
})();
