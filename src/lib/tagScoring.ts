/**
 * Tag Confidence Scoring
 *
 * Computes a relevance score (0.5–1.0) for each tag based on article
 * activity over the last 24 h / 7 d / 30 d windows, then normalises the
 * result.  Scores are cached in Vercel KV with a 6-hour TTL so expensive
 * filesystem reads only happen once per cache window.
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { TAGS } from './tags';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type DateIndex = Record<string, string[]>;

interface ArticleEntry {
  id: string;
  title?: string;
  category?: string;
  tickers?: string[];
  pub_date?: string | null;
}

export interface TagScore {
  tag: string;
  score: number;
  count_24h: number;
  count_7d: number;
  count_30d: number;
  computed_at: string;
}

// ---------------------------------------------------------------------------
// Path helpers
// ---------------------------------------------------------------------------

const ARCHIVE_DIR = join(process.cwd(), 'archive');
const INDEXES_DIR = join(ARCHIVE_DIR, 'indexes');
const ARTICLES_DIR = join(ARCHIVE_DIR, 'articles');

/** YYYY-MM string for a given Date */
function toMonthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** YYYY-MM-DD string for a given Date */
function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Ticker → tag-slug lookup
// ---------------------------------------------------------------------------

/**
 * Derived from TAGS keyword lists.  Maps uppercase ticker symbols to the
 * tag slugs that should be credited when an article carries that ticker.
 */
const TICKER_TO_TAGS: Record<string, string[]> = (() => {
  const map: Record<string, string[]> = {};

  const explicitMap: Record<string, string> = {
    BTC: 'bitcoin',
    ETH: 'ethereum',
    SOL: 'solana',
    XRP: 'xrp',
    ADA: 'cardano',
    BNB: 'bnb',
    DOGE: 'dogecoin',
    DOT: 'polkadot',
    AVAX: 'avalanche',
    LINK: 'chainlink',
    MATIC: 'polygon',
    POL: 'polygon',
    UNI: 'uniswap',
    LTC: 'litecoin',
    ATOM: 'cosmos',
    NEAR: 'near',
    ARB: 'arbitrum',
    OP: 'optimism',
    APT: 'aptos',
    SUI: 'sui',
    INJ: 'injective',
    RENDER: 'render-token',
    IMX: 'immutable-x',
    TRX: 'tron',
    SHIB: 'shiba-inu',
    TON: 'toncoin',
    XMR: 'monero',
    ZEC: 'zcash',
    FIL: 'filecoin',
    AAVE: 'aave',
    MKR: 'maker',
    SNX: 'synthetix',
    CRV: 'curve',
    COMP: 'compound',
    LDO: 'lido',
    RPL: 'rocket-pool',
  };

  for (const [ticker, slug] of Object.entries(explicitMap)) {
    if (!map[ticker]) map[ticker] = [];
    map[ticker].push(slug);
  }

  return map;
})();

// ---------------------------------------------------------------------------
// Date index helpers
// ---------------------------------------------------------------------------

let _dateIndexCache: DateIndex | null = null;

function getDateIndex(): DateIndex {
  if (_dateIndexCache) return _dateIndexCache;
  const path = join(INDEXES_DIR, 'by-date.json');
  if (!existsSync(path)) return {};
  try {
    _dateIndexCache = JSON.parse(readFileSync(path, 'utf-8'));
    return _dateIndexCache!;
  } catch {
    return {};
  }
}

/** Returns the set of article IDs published within the last `daysBack` days */
function getArticleIdsForWindow(dateIndex: DateIndex, daysBack: number): Set<string> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysBack);
  const ids = new Set<string>();
  for (const [dateStr, articleIds] of Object.entries(dateIndex)) {
    if (new Date(dateStr) >= cutoff) {
      for (const id of articleIds) ids.add(id);
    }
  }
  return ids;
}

// ---------------------------------------------------------------------------
// Article JSONL helpers
// ---------------------------------------------------------------------------

/** In-memory cache: month string → Map<id, ArticleEntry> */
const _articleCache = new Map<string, Map<string, ArticleEntry>>();

function loadMonthArticles(monthKey: string): Map<string, ArticleEntry> {
  if (_articleCache.has(monthKey)) return _articleCache.get(monthKey)!;
  const filePath = join(ARTICLES_DIR, `${monthKey}.jsonl`);
  const map = new Map<string, ArticleEntry>();
  if (!existsSync(filePath)) {
    _articleCache.set(monthKey, map);
    return map;
  }
  try {
    const lines = readFileSync(filePath, 'utf-8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const article: ArticleEntry = JSON.parse(trimmed);
        if (article.id) map.set(article.id, article);
      } catch {
        // skip malformed lines
      }
    }
  } catch {
    // file unreadable
  }
  _articleCache.set(monthKey, map);
  return map;
}

/**
 * Returns a lookup of article_id → ArticleEntry for all articles that might
 * fall in the last `daysBack` days.  We load the current + previous two
 * months to cover any window up to 30 days.
 */
function buildArticleLookup(daysBack: number): Map<string, ArticleEntry> {
  const now = new Date();
  const monthsNeeded = new Set<string>();
  for (let d = 0; d <= daysBack; d++) {
    const date = new Date(now);
    date.setDate(date.getDate() - d);
    monthsNeeded.add(toMonthKey(date));
  }
  const combined = new Map<string, ArticleEntry>();
  for (const month of monthsNeeded) {
    for (const [id, article] of loadMonthArticles(month)) {
      combined.set(id, article);
    }
  }
  return combined;
}

// ---------------------------------------------------------------------------
// Tag → article matching
// ---------------------------------------------------------------------------

function articleMatchesTag(article: ArticleEntry, tagSlug: string): boolean {
  const tag = TAGS[tagSlug];
  if (!tag) return false;

  // Category direct match (e.g. article.category === 'bitcoin')
  if (article.category === tagSlug) return true;

  // Ticker match
  if (article.tickers) {
    for (const ticker of article.tickers) {
      const mappedTags = TICKER_TO_TAGS[ticker.toUpperCase()];
      if (mappedTags?.includes(tagSlug)) return true;
    }
  }

  // Keyword match in title
  if (article.title) {
    const lower = article.title.toLowerCase();
    if (tag.keywords.some(kw => lower.includes(kw.toLowerCase()))) return true;
  }

  return false;
}

// ---------------------------------------------------------------------------
// Normalisation
// ---------------------------------------------------------------------------

/** Maps raw score to [0.5, 1.0] using a soft cap. */
function normalise(rawScore: number, maxExpected = 60): number {
  const ratio = Math.min(rawScore / maxExpected, 1);
  return Math.round((0.5 + 0.5 * ratio) * 1000) / 1000;
}

// ---------------------------------------------------------------------------
// Main scoring function
// ---------------------------------------------------------------------------

/**
 * Compute a relevance score in [0.5, 1.0] for `tag`.
 *
 * Formula:
 *   raw = count_7d * 0.5 + count_30d * 0.1 + recency_bonus * 0.4
 *   score = normalise(raw)          → [0.5, 1.0]
 *
 * Results are cached in Vercel KV (key: "tag_score:{tag}", TTL: 6 h) when
 * KV credentials are available.  Falls back to pure filesystem computation.
 */
export async function computeTagScore(tag: string): Promise<TagScore> {
  const KV_KEY = `tag_score:${tag}`;
  const CACHE_TTL = 6 * 60 * 60; // 6 hours in seconds

  // ── 1. Try KV cache ──────────────────────────────────────────────────────
  try {
    const { kv } = await import('@vercel/kv');
    const cached = await kv.get<TagScore>(KV_KEY);
    if (cached) return cached;
  } catch {
    // KV not configured – fall through to filesystem
  }

  // ── 2. Compute from archive ───────────────────────────────────────────────
  const dateIndex = getDateIndex();

  const ids24h = getArticleIdsForWindow(dateIndex, 1);
  const ids7d  = getArticleIdsForWindow(dateIndex, 7);
  const ids30d = getArticleIdsForWindow(dateIndex, 30);

  // Only load the months we need (up to 30 days back)
  const articleLookup = buildArticleLookup(30);

  let count_24h = 0;
  let count_7d  = 0;
  let count_30d = 0;

  for (const id of ids30d) {
    const article = articleLookup.get(id);
    if (!article) continue;
    if (!articleMatchesTag(article, tag)) continue;

    count_30d++;
    if (ids7d.has(id))  count_7d++;
    if (ids24h.has(id)) count_24h++;
  }

  const recencyBonus = count_24h > 0 ? 1 : 0;
  const rawScore = count_7d * 0.5 + count_30d * 0.1 + recencyBonus * 0.4;
  const score = normalise(rawScore);

  const result: TagScore = {
    tag,
    score,
    count_24h,
    count_7d,
    count_30d,
    computed_at: new Date().toISOString(),
  };

  // ── 3. Store in KV cache ──────────────────────────────────────────────────
  try {
    const { kv } = await import('@vercel/kv');
    await kv.set(KV_KEY, result, { ex: CACHE_TTL });
  } catch {
    // KV not available
  }

  return result;
}

// ---------------------------------------------------------------------------
// Batch helpers
// ---------------------------------------------------------------------------

/** Returns tag scores for all defined TAGS in parallel (max concurrency 10). */
export async function computeAllTagScores(): Promise<Record<string, number>> {
  const tagSlugs = Object.keys(TAGS);
  const results: Record<string, number> = {};
  const BATCH = 10;

  for (let i = 0; i < tagSlugs.length; i += BATCH) {
    const batch = tagSlugs.slice(i, i + BATCH);
    const scores = await Promise.all(batch.map(t => computeTagScore(t)));
    for (const s of scores) {
      results[s.tag] = s.score;
    }
  }

  return results;
}

/** Load pre-computed scores from archive/meta/tag-scores.json (fast path). */
export function loadTagScoresFromFile(): Record<string, number> {
  const filePath = join(ARCHIVE_DIR, 'meta', 'tag-scores.json');
  try {
    if (existsSync(filePath)) {
      return JSON.parse(readFileSync(filePath, 'utf-8'));
    }
  } catch {
    // ignore
  }
  return {};
}
