/**
 * Source Translator
 * 
 * Translates international news articles to English using Groq API.
 * Includes caching for 7 days and rate limiting.
 */

import { InternationalArticle, InternationalNewsResponse } from './international-sources';
import { newsCache } from './cache';

// ═══════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════

// Cache TTL: 7 days in seconds
const TRANSLATION_CACHE_TTL = 7 * 24 * 60 * 60;

// Rate limiting: 1 request per second
const RATE_LIMIT_INTERVAL_MS = 1000;

// Language display names for prompts
const LANGUAGE_NAMES: Record<string, string> = {
  ko: 'Korean',
  zh: 'Chinese',
  ja: 'Japanese',
  es: 'Spanish',
};

// ═══════════════════════════════════════════════════════════════
// RATE LIMITING
// ═══════════════════════════════════════════════════════════════

let lastTranslationTime = 0;

/**
 * Wait to respect rate limits
 */
async function waitForRateLimit(): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastTranslationTime;
  
  if (elapsed < RATE_LIMIT_INTERVAL_MS) {
    const waitTime = RATE_LIMIT_INTERVAL_MS - elapsed;
    await new Promise((resolve) => setTimeout(resolve, waitTime));
  }
  
  lastTranslationTime = Date.now();
}

// ═══════════════════════════════════════════════════════════════
// CACHING
// ═══════════════════════════════════════════════════════════════

interface CachedTranslation {
  titleEnglish: string;
  descriptionEnglish: string;
  translatedAt: string;
}

/**
 * Get cache key for a translation
 */
function getTranslationCacheKey(articleId: string): string {
  return `intl-translation:${articleId}`;
}

/**
 * Get cached translation if available
 */
function getCachedTranslation(articleId: string): CachedTranslation | null {
  const cacheKey = getTranslationCacheKey(articleId);
  return newsCache.get<CachedTranslation>(cacheKey);
}

/**
 * Store translation in cache
 */
function cacheTranslation(articleId: string, translation: CachedTranslation): void {
  const cacheKey = getTranslationCacheKey(articleId);
  newsCache.set(cacheKey, translation, TRANSLATION_CACHE_TTL);
}

// ═══════════════════════════════════════════════════════════════
// GROQ TRANSLATION
// ═══════════════════════════════════════════════════════════════

interface TranslationInput {
  id: string;
  title: string;
  description: string;
  language: string;
}

interface TranslationOutput {
  id: string;
  titleEnglish: string;
  descriptionEnglish: string;
}

/**
 * Translate texts using Groq API
 */
async function translateWithGroq(
  inputs: TranslationInput[]
): Promise<TranslationOutput[]> {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error('GROQ_API_KEY not configured. Get a free key at https://console.groq.com/keys');
  }

  // Group by language for more accurate translations
  const byLanguage = inputs.reduce((acc, input) => {
    if (!acc[input.language]) {
      acc[input.language] = [];
    }
    acc[input.language].push(input);
    return acc;
  }, {} as Record<string, TranslationInput[]>);

  const results: TranslationOutput[] = [];

  for (const [language, items] of Object.entries(byLanguage)) {
    const langName = LANGUAGE_NAMES[language] || language;
    
    await waitForRateLimit();

    const prompt = `Translate the following ${langName} cryptocurrency news titles and descriptions to English.
Keep the translations natural and professional. Preserve any ticker symbols like $BTC or $ETH.
Preserve the original meaning while making it readable for an English-speaking audience.

Return a JSON object with a "translations" array containing objects with "id", "titleEnglish", and "descriptionEnglish" fields.

Input:
${JSON.stringify(
  items.map((item) => ({
    id: item.id,
    title: item.title,
    description: item.description,
  })),
  null,
  2
)}`;

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content:
                'You are a professional translator specializing in cryptocurrency and finance news. Translate from Asian and European languages to English. Always respond with valid JSON only, no markdown code blocks.',
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
        console.error(`Groq API error for ${langName}: ${response.status} - ${error}`);
        // Return original text on error
        results.push(
          ...items.map((item) => ({
            id: item.id,
            titleEnglish: item.title,
            descriptionEnglish: item.description,
          }))
        );
        continue;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        console.error(`Empty response from Groq for ${langName}`);
        results.push(
          ...items.map((item) => ({
            id: item.id,
            titleEnglish: item.title,
            descriptionEnglish: item.description,
          }))
        );
        continue;
      }

      try {
        const parsed = JSON.parse(content);
        const translations = parsed.translations || parsed.items || parsed;

        if (Array.isArray(translations)) {
          // Map translations by ID for accurate matching
          const translationMap = new Map(
            translations.map((t: TranslationOutput) => [t.id, t])
          );

          for (const item of items) {
            const translation = translationMap.get(item.id);
            if (translation) {
              results.push({
                id: item.id,
                titleEnglish: translation.titleEnglish || item.title,
                descriptionEnglish: translation.descriptionEnglish || item.description,
              });
            } else {
              results.push({
                id: item.id,
                titleEnglish: item.title,
                descriptionEnglish: item.description,
              });
            }
          }
        }
      } catch {
        console.error(`Failed to parse translation response for ${langName}`);
        results.push(
          ...items.map((item) => ({
            id: item.id,
            titleEnglish: item.title,
            descriptionEnglish: item.description,
          }))
        );
      }
    } catch (error) {
      console.error(`Translation error for ${langName}:`, error);
      results.push(
        ...items.map((item) => ({
          id: item.id,
          titleEnglish: item.title,
          descriptionEnglish: item.description,
        }))
      );
    }
  }

  return results;
}

// ═══════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════

/**
 * Translate international articles to English
 * Uses caching to avoid re-translating the same articles
 */
export async function translateInternationalArticles(
  articles: InternationalArticle[]
): Promise<InternationalArticle[]> {
  if (!articles.length) {
    return [];
  }

  // Check for API key
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.warn('GROQ_API_KEY not set, returning original articles');
    return articles;
  }

  // Separate cached and uncached articles
  const cachedResults: Map<string, CachedTranslation> = new Map();
  const uncachedArticles: InternationalArticle[] = [];

  for (const article of articles) {
    const cached = getCachedTranslation(article.id);
    if (cached) {
      cachedResults.set(article.id, cached);
    } else {
      uncachedArticles.push(article);
    }
  }

  // Translate uncached articles in batches
  const BATCH_SIZE = 10;
  const translatedMap: Map<string, TranslationOutput> = new Map();

  for (let i = 0; i < uncachedArticles.length; i += BATCH_SIZE) {
    const batch = uncachedArticles.slice(i, i + BATCH_SIZE);
    const inputs: TranslationInput[] = batch.map((article) => ({
      id: article.id,
      title: article.title,
      description: article.description,
      language: article.language,
    }));

    try {
      const translations = await translateWithGroq(inputs);

      for (const translation of translations) {
        translatedMap.set(translation.id, translation);

        // Cache the translation
        cacheTranslation(translation.id, {
          titleEnglish: translation.titleEnglish,
          descriptionEnglish: translation.descriptionEnglish,
          translatedAt: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Translation batch failed:', error);
      // On error, use original text for this batch
      for (const article of batch) {
        translatedMap.set(article.id, {
          id: article.id,
          titleEnglish: article.title,
          descriptionEnglish: article.description,
        });
      }
    }
  }

  // Merge cached and newly translated articles
  return articles.map((article) => {
    const cached = cachedResults.get(article.id);
    const translated = translatedMap.get(article.id);

    if (cached) {
      return {
        ...article,
        titleEnglish: cached.titleEnglish,
        descriptionEnglish: cached.descriptionEnglish,
      };
    }

    if (translated) {
      return {
        ...article,
        titleEnglish: translated.titleEnglish,
        descriptionEnglish: translated.descriptionEnglish,
      };
    }

    return article;
  });
}

/**
 * Translate an international news response
 */
export async function translateInternationalNewsResponse(
  response: InternationalNewsResponse
): Promise<InternationalNewsResponse> {
  const translatedArticles = await translateInternationalArticles(response.articles);

  return {
    ...response,
    articles: translatedArticles,
    translated: true,
  };
}

// ═══════════════════════════════════════════════════════════════
// CACHE STATISTICS
// ═══════════════════════════════════════════════════════════════

/**
 * Get translation cache statistics
 */
export function getInternationalTranslationCacheStats(): {
  cachedTranslations: number;
  cacheKeys: string[];
} {
  const stats = newsCache.stats();
  const translationKeys = stats.keys.filter((key) => key.startsWith('intl-translation:'));

  return {
    cachedTranslations: translationKeys.length,
    cacheKeys: translationKeys,
  };
}

/**
 * Clear all international translation caches
 */
export function clearInternationalTranslationCache(): void {
  const stats = newsCache.stats();
  const translationKeys = stats.keys.filter((key) => key.startsWith('intl-translation:'));

  for (const key of translationKeys) {
    newsCache.delete(key);
  }
}

/**
 * Check if translation is available (API key configured)
 */
export function isTranslationAvailable(): boolean {
  return !!process.env.GROQ_API_KEY;
}
