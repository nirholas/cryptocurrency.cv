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
 * Translates news articles to different languages using Groq (free, fast inference).
 * Includes caching to avoid re-translating the same articles.
 * 
 * Translation is enabled automatically when GROQ_API_KEY is set.
 * When no API key is configured, returns original untranslated content.
 * 
 * SETUP: Set GROQ_API_KEY environment variable with your free Groq API key.
 * Get one at: https://console.groq.com/keys
 */

interface TranslatedArticle {
  title: string;
  description?: string;
  translatedAt: string;
  lang: string;
}

// Base article shape for translation - uses intersection to preserve original types
interface TranslatableArticle {
  title: string;
  description?: string;
  link: string;
}

// TTL-based cache to prevent unbounded memory growth
class TranslationCache {
  private cache = new Map<string, { value: TranslatedArticle; expiresAt: number }>();
  private maxSize = 10_000;
  private ttlMs = 24 * 60 * 60 * 1000; // 24 hours

  get(key: string): TranslatedArticle | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.value;
  }

  set(key: string, value: TranslatedArticle): void {
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
    // If still over capacity, remove oldest entries
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

const translationCache = new TranslationCache();

// Sliding window rate limiter for Groq free tier
class SlidingWindowRateLimiter {
  private timestamps: number[] = [];
  constructor(private maxRequests: number, private windowMs: number) {}

  async acquire(): Promise<void> {
    const now = Date.now();
    this.timestamps = this.timestamps.filter(t => now - t < this.windowMs);
    if (this.timestamps.length >= this.maxRequests) {
      const oldestInWindow = this.timestamps[0];
      const waitMs = this.windowMs - (now - oldestInWindow);
      await new Promise(resolve => setTimeout(resolve, waitMs));
      return this.acquire();
    }
    this.timestamps.push(now);
  }
}

// Max 30 translation requests per minute (Groq free tier)
const rateLimiter = new SlidingWindowRateLimiter(30, 60_000);

// Supported languages with display names
export const SUPPORTED_LANGUAGES: Record<string, string> = {
  en: 'English',
  ar: 'العربية',
  bn: 'বাংলা',
  cs: 'Čeština',
  de: 'Deutsch',
  el: 'Ελληνικά',
  es: 'Español',
  fa: 'فارسی',
  fr: 'Français',
  he: 'עברית',
  hi: 'हिन्दी',
  hu: 'Magyar',
  id: 'Bahasa Indonesia',
  it: 'Italiano',
  ja: '日本語',
  ko: '한국어',
  nl: 'Nederlands',
  pl: 'Polski',
  pt: 'Português',
  ro: 'Română',
  ru: 'Русский',
  sv: 'Svenska',
  sw: 'Kiswahili',
  th: 'ไทย',
  tl: 'Filipino',
  tr: 'Türkçe',
  uk: 'Українська',
  vi: 'Tiếng Việt',
  'zh-CN': '简体中文',
  'zh-TW': '繁體中文',
};

/**
 * Check if real-time translation is enabled (GROQ_API_KEY is set)
 */
export function isTranslationEnabled(): boolean {
  return !!process.env.GROQ_API_KEY;
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
 * Translate text using Groq API (free, fast inference with Llama models)
 * https://console.groq.com/docs/quickstart
 */
async function translateWithGroq(
  texts: { title: string; description: string }[],
  targetLang: string
): Promise<{ title: string; description: string }[]> {
  const apiKey = process.env.GROQ_API_KEY;
  
  if (!apiKey) {
    throw new Error('GROQ_API_KEY not configured. Get a free key at https://console.groq.com/keys');
  }

  // Rate limit before making the API call
  await rateLimiter.acquire();

  const langName = SUPPORTED_LANGUAGES[targetLang] || targetLang;

  // Batch translate for efficiency
  const prompt = `Translate the following cryptocurrency news titles and descriptions to ${langName}. 
Keep the translations concise and natural. Preserve any ticker symbols like $BTC or $ETH.
Return a JSON array with objects containing "title" and "description" fields.

Input:
${JSON.stringify(texts, null, 2)}`;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'You are a professional translator specializing in cryptocurrency and finance news. Always respond with valid JSON only, no markdown code blocks.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Groq API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('Empty response from Groq');
  }

  try {
    const parsed = JSON.parse(content);
    // Handle both { translations: [...] } and direct array formats
    return Array.isArray(parsed) ? parsed : parsed.translations || parsed.items || [];
  } catch {
    throw new Error(`Failed to parse translation response: ${content}`);
  }
}

/**
 * Translate text with fallback - returns original text if Groq fails
 */
async function translateWithFallback(
  texts: { title: string; description: string }[],
  targetLang: string
): Promise<{ title: string; description: string }[]> {
  try {
    return await translateWithGroq(texts, targetLang);
  } catch (error) {
    console.warn(`[TRANSLATE] Groq failed, returning original text:`, error);
    return texts;
  }
}

/**
 * Translate an array of articles to the target language
 * 
 * Returns original articles if:
 * - GROQ_API_KEY is not set
 * - Target language is English
 */
export async function translateArticles<T extends TranslatableArticle>(
  articles: T[],
  targetLang: string
): Promise<T[]> {
  // Return original if no API key configured (graceful no-op)
  if (!process.env.GROQ_API_KEY) {
    return articles;
  }
  
  // English is the source language, no translation needed
  if (targetLang === 'en') {
    return articles;
  }

  if (!isLanguageSupported(targetLang)) {
    throw new Error(`Unsupported language: ${targetLang}. Supported: ${Object.keys(SUPPORTED_LANGUAGES).join(', ')}`);
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    // Return original articles if no API key configured
    console.warn('GROQ_API_KEY not set, returning original articles');
    return articles;
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

  // Translate uncached articles in batches
  const BATCH_SIZE = 10;
  const translatedMap: Map<number, TranslatedArticle> = new Map();

  for (let i = 0; i < uncachedArticles.length; i += BATCH_SIZE) {
    const batch = uncachedArticles.slice(i, i + BATCH_SIZE);
    const textsToTranslate = batch.map(({ article }) => ({
      title: article.title,
      description: article.description || '',
    }));

    try {
      const translations = await translateWithFallback(textsToTranslate, targetLang);

      for (let j = 0; j < batch.length; j++) {
        const { index, article } = batch[j];
        const translation = translations[j];

        if (translation) {
          const translated: TranslatedArticle = {
            title: translation.title || article.title,
            description: translation.description || article.description,
            translatedAt: new Date().toISOString(),
            lang: targetLang,
          };

          // Cache the translation
          const cacheKey = getCacheKey(article.link, targetLang);
          translationCache.set(cacheKey, translated);
          translatedMap.set(index, translated);
        }
      }
    } catch (error) {
      console.error('Translation batch failed:', error);
      // On error, use original text for this batch
      for (const { index } of batch) {
        translatedMap.set(index, {
          title: articles[index].title,
          description: articles[index].description,
          translatedAt: new Date().toISOString(),
          lang: 'en', // Mark as not translated
        });
      }
    }
  }

  // Merge cached and newly translated articles
  return articles.map((article, index) => {
    const cached = cachedResults.get(index);
    const translated = translatedMap.get(index);
    const result = cached || translated;

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
