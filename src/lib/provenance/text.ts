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
 * Text normalisation for near-duplicate detection.
 *
 * Two outlets covering one event write two different headlines:
 *
 *   "BlackRock's Bitcoin ETF Sees Record $1.2B Inflow"
 *   "Bitcoin ETF from BlackRock records $1.2 billion in inflows | CoinDesk"
 *
 * A human reads those as the same story instantly. A string comparison reads
 * them as unrelated. Everything here exists to close that gap without an
 * embedding model, because clustering has to run on every request over hundreds
 * of articles and a model call per pair is not affordable, and because a purely
 * lexical method is inspectable: when two articles are grouped, you can see the
 * exact shared terms that grouped them.
 *
 * The pipeline: strip the outlet's own branding, unify the ways publishers
 * write numbers and money, drop stopwords that carry no topical signal, and
 * emit the content terms. Scoring those terms is ./similarity's job, and its
 * header records why an earlier word-order approach was measured and dropped.
 *
 * @module lib/provenance/text
 */

/**
 * Trailing or leading outlet branding that publishers staple onto headlines.
 * Left in, every article from one outlet shares a token with every other
 * article from that outlet, which is a similarity signal pointing at the
 * publisher instead of at the story.
 */
const BRANDING =
  /\s*[|\-–—:]\s*(coindesk|cointelegraph|the block|decrypt|bloomberg|reuters|cnbc|forbes|blockworks|the defiant|beincrypto|cryptoslate|bitcoin magazine|coingape|ambcrypto|u\.?today|newsbtc|cryptobriefing|protos|dl news|dlnews|watcher\.guru|crypto news|coinpedia|zycrypto|bitcoinist|cryptopotato|finbold|invezz|benzinga|yahoo finance|business insider|the guardian|financial times|wsj|ft)\s*$/i;

/**
 * Words that appear in so many crypto headlines that their presence says
 * nothing about which story a headline is covering. Deliberately short: an
 * aggressive stopword list starts deleting the entities that make two headlines
 * genuinely the same story.
 */
const STOPWORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'been',
  'but',
  'by',
  'for',
  'from',
  'has',
  'have',
  'he',
  'her',
  'his',
  'how',
  'in',
  'is',
  'it',
  'its',
  'of',
  'on',
  'or',
  'she',
  'that',
  'the',
  'their',
  'they',
  'this',
  'to',
  'was',
  'were',
  'what',
  'when',
  'which',
  'who',
  'will',
  'with',
  'you',
  'your',
  'says',
  'say',
  'said',
  'after',
  'amid',
  'over',
  'into',
  'up',
  'down',
  'new',
  'more',
]);

/** Multipliers publishers spell inconsistently: 1.2B, 1.2 billion, $1.2bn. */
const MAGNITUDES: Record<string, number> = {
  k: 1e3,
  thousand: 1e3,
  m: 1e6,
  mn: 1e6,
  million: 1e6,
  b: 1e9,
  bn: 1e9,
  billion: 1e9,
  t: 1e12,
  tn: 1e12,
  trillion: 1e12,
};

/**
 * Rewrite every way a publisher can spell a magnitude into one canonical token.
 *
 * `$1.2B`, `$1.2 billion` and `1.2bn dollars` all become `usd1200000000`, so
 * two headlines about the same inflow share the number that makes them the same
 * story. Without this the single most identifying token in a financial headline
 * is the one guaranteed not to match.
 */
function canonicaliseAmounts(input: string): string {
  // Digit-group separators first. Without this "$70,000" tokenises to `70` and
  // `000`, and every headline quoting a round price shares that `000`, which is
  // a strong-looking match built on punctuation.
  const joined = input.replace(/(\d),(\d{3})\b/g, '$1$2').replace(/(\d),(\d{3})\b/g, '$1$2');
  return joined.replace(
    /(\$|usd\s*)?(\d+(?:[.,]\d+)?)\s*(k|m|mn|b|bn|t|tn|thousand|million|billion|trillion)\b/gi,
    (_full, currency: string | undefined, digits: string, unit: string) => {
      const n = Number(digits.replace(/,/g, ''));
      const mult = MAGNITUDES[unit.toLowerCase()];
      if (!Number.isFinite(n) || !mult) return _full;
      const value = Math.round(n * mult);
      return `${currency ? 'usd' : 'num'}${value}`;
    },
  );
}

/**
 * Reduce a headline (optionally plus its description) to comparable tokens.
 *
 * Deterministic and side-effect free: the same input always yields the same
 * tokens, which is what lets the clustering be tested against fixtures and
 * lets two servers agree on the same story ids.
 *
 * @param title       the headline
 * @param description optional standfirst or summary; adds recall for short
 *                    headlines, where three tokens is not enough to compare
 * @returns lowercase content tokens, in order
 */
export function tokenise(title: string, description?: string): string[] {
  const raw = `${title ?? ''} ${description ?? ''}`;
  const cleaned = canonicaliseAmounts(
    raw
      .replace(BRANDING, ' ')
      // Unicode punctuation publishers use interchangeably with ASCII.
      .replace(/[‘’“”]/g, "'")
      .replace(/[–—]/g, ' ')
      .toLowerCase(),
  );

  return (
    cleaned
      .replace(/https?:\/\/\S+/g, ' ')
      .replace(/&[a-z]+;/g, ' ')
      // Keep digits and letters; a bare apostrophe inside a word survives so
      // "blackrock's" and "blackrocks" collapse together below.
      .replace(/[^a-z0-9'\s]/g, ' ')
      .replace(/'/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 1 && !STOPWORDS.has(w))
      .map((w) => (w.endsWith('s') && w.length > 3 ? w.slice(0, -1) : w))
  );
}
