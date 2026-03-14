/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

/**
 * News Translation Service
 *
 * Translates news articles to 50+ languages using Groq (free, fast inference).
 * Uses the shared Groq client for consistency across all AI features.
 *
 * Features:
 * - TTL-based LRU cache (10k entries, 24h TTL)
 * - Sliding window rate limiter (30 req/min for Groq free tier)
 * - Crypto glossary enforcement for consistent terminology
 * - Parallel batch processing for throughput
 * - Graceful fallback on API errors
 *
 * Translation is enabled automatically when GROQ_API_KEY is set.
 * When no API key is configured, returns original untranslated content.
 */

import { callGroq, isGroqConfigured, parseGroqJson } from './groq';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface TranslatedArticle {
  title: string;
  description?: string;
  translatedAt: string;
  lang: string;
}

export interface TranslatableArticle {
  title: string;
  description?: string;
  link: string;
}

// ═══════════════════════════════════════════════════════════════
// TTL-BASED LRU CACHE
// ═══════════════════════════════════════════════════════════════

export class TranslationCache {
  private cache = new Map<string, { value: TranslatedArticle; expiresAt: number }>();
  private maxSize: number;
  private ttlMs: number;

  constructor(maxSize = 10_000, ttlMs = 24 * 60 * 60 * 1000) {
    this.maxSize = maxSize;
    this.ttlMs = ttlMs;
  }

  get(key: string): TranslatedArticle | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    // LRU: move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.value;
  }

  set(key: string, value: TranslatedArticle): void {
    // If key exists, delete to refresh position
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    if (this.cache.size >= this.maxSize) {
      this.evict();
    }
    this.cache.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }

  private evict(): void {
    const now = Date.now();
    // First pass: remove expired entries
    for (const [key, entry] of this.cache) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
    // If still over capacity, remove oldest (first) entries (LRU)
    if (this.cache.size >= this.maxSize) {
      const toRemove = this.cache.size - this.maxSize + 1;
      let removed = 0;
      for (const key of this.cache.keys()) {
        if (removed >= toRemove) break;
        this.cache.delete(key);
        removed++;
      }
    }
  }

  get size(): number {
    return this.cache.size;
  }

  keys(): IterableIterator<string> {
    return this.cache.keys();
  }

  clear(): void {
    this.cache.clear();
  }
}

export const translationCache = new TranslationCache();

// ═══════════════════════════════════════════════════════════════
// RATE LIMITER
// ═══════════════════════════════════════════════════════════════

export class SlidingWindowRateLimiter {
  private timestamps: number[] = [];
  constructor(
    private maxRequests: number,
    private windowMs: number,
  ) {}

  async acquire(): Promise<void> {
    const now = Date.now();
    this.timestamps = this.timestamps.filter((t) => now - t < this.windowMs);
    if (this.timestamps.length >= this.maxRequests) {
      const oldestInWindow = this.timestamps[0];
      const waitMs = this.windowMs - (now - oldestInWindow);
      await new Promise((resolve) => setTimeout(resolve, waitMs));
      return this.acquire();
    }
    this.timestamps.push(now);
  }

  get pending(): number {
    const now = Date.now();
    return this.timestamps.filter((t) => now - t < this.windowMs).length;
  }

  reset(): void {
    this.timestamps = [];
  }
}

// Max 30 translation requests per minute (Groq free tier)
export const rateLimiter = new SlidingWindowRateLimiter(30, 60_000);

// ═══════════════════════════════════════════════════════════════
// CRYPTO GLOSSARY
// ═══════════════════════════════════════════════════════════════

/**
 * Terms that should be preserved as-is or translated consistently.
 * Ticker symbols ($BTC, $ETH) are always preserved by the LLM prompt.
 * These domain terms ensure consistent translation across articles.
 */
const CRYPTO_GLOSSARY = [
  'blockchain', 'DeFi', 'NFT', 'DAO', 'DEX', 'CEX', 'TVL', 'APY', 'APR',
  'staking', 'unstaking', 'restaking', 'liquid staking',
  'halving', 'halvening', 'block reward',
  'whale', 'hodl', 'HODL', 'FOMO', 'FUD',
  'gas fee', 'gas limit', 'gwei', 'wei',
  'smart contract', 'token', 'altcoin', 'memecoin', 'stablecoin',
  'Layer 1', 'Layer 2', 'L1', 'L2', 'rollup', 'zk-rollup', 'optimistic rollup',
  'airdrop', 'ICO', 'IDO', 'IEO', 'launchpad',
  'seed phrase', 'private key', 'public key', 'cold wallet', 'hot wallet',
  'bull market', 'bear market', 'ATH', 'ATL',
  'mining', 'proof of work', 'proof of stake', 'PoW', 'PoS',
  'yield farming', 'liquidity pool', 'impermanent loss', 'slippage',
  'bridge', 'cross-chain', 'multichain', 'interoperability',
  'validator', 'delegator', 'epoch', 'finality',
  'RWA', 'tokenization', 'STO', 'security token',
  'MEV', 'sandwich attack', 'front-running', 'flash loan',
];

// ═══════════════════════════════════════════════════════════════
// SUPPORTED LANGUAGES (50+)
// ═══════════════════════════════════════════════════════════════

export const SUPPORTED_LANGUAGES: Record<string, string> = {
  en: 'English',
  af: 'Afrikaans',
  am: 'አማርኛ',
  ar: 'العربية',
  az: 'Azərbaycan',
  bg: 'Български',
  bn: 'বাংলা',
  bs: 'Bosanski',
  ca: 'Català',
  cs: 'Čeština',
  da: 'Dansk',
  de: 'Deutsch',
  el: 'Ελληνικά',
  es: 'Español',
  et: 'Eesti',
  fa: 'فارسی',
  fi: 'Suomi',
  fr: 'Français',
  ga: 'Gaeilge',
  gu: 'ગુજરાતી',
  he: 'עברית',
  hi: 'हिन्दी',
  hr: 'Hrvatski',
  hu: 'Magyar',
  hy: 'Հայերեն',
  id: 'Bahasa Indonesia',
  is: 'Íslenska',
  it: 'Italiano',
  ja: '日本語',
  ka: 'ქართული',
  kk: 'Қазақ',
  km: 'ខ្មែរ',
  kn: 'ಕನ್ನಡ',
  ko: '한국어',
  lt: 'Lietuvių',
  lv: 'Latviešu',
  mk: 'Македонски',
  ml: 'മലയാളം',
  mn: 'Монгол',
  mr: 'मराठी',
  ms: 'Bahasa Melayu',
  my: 'ဗမာ',
  ne: 'नेपाली',
  nl: 'Nederlands',
  no: 'Norsk',
  pa: 'ਪੰਜਾਬੀ',
  pl: 'Polski',
  pt: 'Português',
  ro: 'Română',
  ru: 'Русский',
  si: 'සිංහල',
  sk: 'Slovenčina',
  sl: 'Slovenščina',
  sq: 'Shqip',
  sr: 'Српски',
  sv: 'Svenska',
  sw: 'Kiswahili',
  ta: 'தமிழ்',
  te: 'తెలుగు',
  th: 'ไทย',
  tl: 'Filipino',
  tr: 'Türkçe',
  uk: 'Українська',
  ur: 'اردو',
  uz: 'Oʻzbek',
  vi: 'Tiếng Việt',
  'zh-CN': '简体中文',
  'zh-TW': '繁體中文',
};

// ═══════════════════════════════════════════════════════════════
// CORE TRANSLATION FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Check if real-time translation is enabled (GROQ_API_KEY is set)
 */
export function isTranslationEnabled(): boolean {
  return isGroqConfigured();
}

/**
 * Check if a language code is supported
 */
export function isLanguageSupported(lang: string): boolean {
  return lang in SUPPORTED_LANGUAGES;
}

/**
 * Get cache key for an article + language combination
 */
function getCacheKey(articleLink: string, lang: string): string {
  return `${lang}:${articleLink}`;
}

/**
 * Build the translation prompt with glossary context
 */
function buildTranslationPrompt(
  texts: { title: string; description: string }[],
  targetLang: string,
): string {
  const langName = SUPPORTED_LANGUAGES[targetLang] || targetLang;

  return `Translate the following cryptocurrency news titles and descriptions to ${langName}.

RULES:
- Keep translations concise, natural, and accurate
- Preserve all ticker symbols exactly as-is (e.g. $BTC, $ETH, $SOL)
- Preserve these crypto domain terms in their original form unless they have a well-established translation in ${langName}: ${CRYPTO_GLOSSARY.slice(0, 30).join(', ')}
- Return a JSON object with a "translations" key containing an array of objects, each with "title" and "description" fields
- The array MUST have exactly ${texts.length} items, matching the input order

Input:
${JSON.stringify(texts, null, 2)}`;
}

/**
 * Translate text using the shared Groq client
 */
async function translateWithGroq(
  texts: { title: string; description: string }[],
  targetLang: string,
): Promise<{ title: string; description: string }[]> {
  // Rate limit before making the API call
  await rateLimiter.acquire();

  const response = await callGroq(
    [
      {
        role: 'system',
        content:
          'You are a professional translator specializing in cryptocurrency and finance news. You produce accurate, natural translations while preserving technical terminology. Always respond with valid JSON only.',
      },
      {
        role: 'user',
        content: buildTranslationPrompt(texts, targetLang),
      },
    ],
    {
      temperature: 0.3,
      jsonMode: true,
      maxTokens: 4096,
    },
  );

  const parsed = parseGroqJson<
    | { title: string; description: string }[]
    | { translations: { title: string; description: string }[] }
    | { items: { title: string; description: string }[] }
  >(response.content);

  // Handle various JSON response shapes from the LLM
  if (Array.isArray(parsed)) return parsed;
  if ('translations' in parsed && Array.isArray(parsed.translations)) return parsed.translations;
  if ('items' in parsed && Array.isArray(parsed.items)) return parsed.items;
  throw new Error(`Unexpected translation response shape: ${Object.keys(parsed).join(', ')}`);
}

/**
 * Translate text with fallback - returns original text if Groq fails
 */
async function translateWithFallback(
  texts: { title: string; description: string }[],
  targetLang: string,
): Promise<{ title: string; description: string }[]> {
  try {
    return await translateWithGroq(texts, targetLang);
  } catch (error) {
    console.warn(`[TRANSLATE] Groq failed for ${targetLang}, returning original text:`, error);
    return texts;
  }
}

// ═══════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════

/**
 * Translate an array of articles to the target language.
 *
 * Returns original articles unchanged when:
 * - GROQ_API_KEY is not set (graceful no-op)
 * - Target language is English (source language)
 * - Articles array is empty
 *
 * Uses parallel batch processing for throughput:
 * batches of 10 articles are translated concurrently (max 3 parallel).
 */
export async function translateArticles<T extends TranslatableArticle>(
  articles: T[],
  targetLang: string,
): Promise<T[]> {
  if (!isGroqConfigured() || targetLang === 'en' || articles.length === 0) {
    return articles;
  }

  if (!isLanguageSupported(targetLang)) {
    throw new Error(
      `Unsupported language: ${targetLang}. Supported: ${Object.keys(SUPPORTED_LANGUAGES).join(', ')}`,
    );
  }

  // Separate cached and uncached articles
  const cachedResults: Map<number, TranslatedArticle> = new Map();
  const uncachedArticles: { index: number; article: TranslatableArticle }[] = [];

  for (let i = 0; i < articles.length; i++) {
    const article = articles[i];
    const cacheKey = getCacheKey(article.link, targetLang);
    const cached = translationCache.get(cacheKey);

    if (cached) {
      cachedResults.set(i, cached);
    } else {
      uncachedArticles.push({ index: i, article });
    }
  }

  // Build batches
  const BATCH_SIZE = 10;
  const MAX_PARALLEL = 3;
  const batches: { index: number; article: TranslatableArticle }[][] = [];
  for (let i = 0; i < uncachedArticles.length; i += BATCH_SIZE) {
    batches.push(uncachedArticles.slice(i, i + BATCH_SIZE));
  }

  // Process batches in parallel waves
  const translatedMap: Map<number, TranslatedArticle> = new Map();

  for (let wave = 0; wave < batches.length; wave += MAX_PARALLEL) {
    const waveBatches = batches.slice(wave, wave + MAX_PARALLEL);

    const waveResults = await Promise.allSettled(
      waveBatches.map(async (batch) => {
        const textsToTranslate = batch.map(({ article }) => ({
          title: article.title,
          description: article.description || '',
        }));

        const translations = await translateWithFallback(textsToTranslate, targetLang);

        return { batch, translations };
      }),
    );

    for (const result of waveResults) {
      if (result.status === 'fulfilled') {
        const { batch, translations } = result.value;
        for (let j = 0; j < batch.length; j++) {
          const { index, article } = batch[j];
          const translation = translations[j];

          const translated: TranslatedArticle = {
            title: translation?.title || article.title,
            description: translation?.description || article.description,
            translatedAt: new Date().toISOString(),
            lang: targetLang,
          };

          const cacheKey = getCacheKey(article.link, targetLang);
          translationCache.set(cacheKey, translated);
          translatedMap.set(index, translated);
        }
      } else {
        // Entire batch failed — use originals
        const batchIndex = waveResults.indexOf(result);
        const batch = waveBatches[batchIndex];
        for (const { index } of batch) {
          translatedMap.set(index, {
            title: articles[index].title,
            description: articles[index].description,
            translatedAt: new Date().toISOString(),
            lang: 'en',
          });
        }
      }
    }
  }

  // Merge cached and newly translated articles
  return articles.map((article, index) => {
    const result = cachedResults.get(index) || translatedMap.get(index);

    if (result) {
      return {
        ...article,
        title: result.title,
        description: result.description,
        originalTitle: article.title,
        originalDescription: article.description,
        translatedLang: result.lang,
      } as T;
    }

    return article;
  });
}

/**
 * Get cache statistics
 */
export function getTranslationCacheStats(): { size: number; languages: string[] } {
  const languages = new Set<string>();
  for (const key of translationCache.keys()) {
    const lang = key.split(':')[0];
    if (lang) languages.add(lang);
  }
  return {
    size: translationCache.size,
    languages: Array.from(languages),
  };
}

/**
 * Clear the translation cache
 */
export function clearTranslationCache(): void {
  translationCache.clear();
}
