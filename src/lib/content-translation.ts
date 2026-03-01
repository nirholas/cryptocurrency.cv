/**
 * Content Translation Service
 * Real-time translation for dynamic content using AI
 */

import { type Locale, locales, defaultLocale, localeNames, rtlLocales } from '@/i18n/config';

// Cache for translated content
const translationCache = new Map<string, { translation: string; timestamp: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour
const MAX_TRANSLATION_CACHE = 5000;

// Generate cache key
function getCacheKey(text: string, targetLocale: Locale): string {
  return `${targetLocale}:${text.substring(0, 100)}:${text.length}`;
}

// Check if content needs translation (not English)
export function needsTranslation(locale: Locale): boolean {
  return locale !== defaultLocale;
}

// Get cached translation
export function getCachedTranslation(text: string, locale: Locale): string | null {
  const key = getCacheKey(text, locale);
  const cached = translationCache.get(key);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.translation;
  }
  
  return null;
}

// Cache a translation
export function cacheTranslation(text: string, translation: string, locale: Locale): void {
  // Evict expired entries when over capacity
  if (translationCache.size > MAX_TRANSLATION_CACHE) {
    const now = Date.now();
    for (const [k, entry] of translationCache) {
      if (now - entry.timestamp > CACHE_TTL) translationCache.delete(k);
    }
    // If still over limit, evict oldest entries with headroom
    if (translationCache.size > MAX_TRANSLATION_CACHE) {
      const toDelete = translationCache.size - MAX_TRANSLATION_CACHE + 500;
      let deleted = 0;
      for (const k of translationCache.keys()) {
        if (deleted >= toDelete) break;
        translationCache.delete(k);
        deleted++;
      }
    }
  }
  const key = getCacheKey(text, locale);
  translationCache.set(key, { translation, timestamp: Date.now() });
}

// Translate text using AI
export async function translateText(
  text: string,
  targetLocale: Locale,
  options: {
    context?: string;
    preserveFormatting?: boolean;
    useCache?: boolean;
  } = {}
): Promise<string> {
  const { context = 'cryptocurrency news', preserveFormatting = true, useCache = true } = options;
  
  // Don't translate if already in English
  if (targetLocale === defaultLocale || !text.trim()) {
    return text;
  }
  
  // Check cache first
  if (useCache) {
    const cached = getCachedTranslation(text, targetLocale);
    if (cached) return cached;
  }
  
  const targetLanguage = localeNames[targetLocale] || targetLocale;
  
  const prompt = `Translate the following text to ${targetLanguage}. 
Context: ${context}
${preserveFormatting ? 'Preserve all formatting, markdown, and special characters.' : ''}
Only return the translation, no explanations.

Text to translate:
${text}`;

  try {
    const response = await fetch('/api/ai/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, targetLocale, prompt }),
    });
    
    if (!response.ok) {
      console.error('Translation failed:', response.status);
      return text; // Return original on error
    }
    
    const { translation } = await response.json();
    
    // Cache the result
    if (useCache && translation) {
      cacheTranslation(text, translation, targetLocale);
    }
    
    return translation || text;
  } catch (error) {
    console.error('Translation error:', error);
    return text;
  }
}

// Batch translate multiple texts
export async function translateBatch(
  texts: string[],
  targetLocale: Locale,
  options: { context?: string } = {}
): Promise<string[]> {
  if (targetLocale === defaultLocale) {
    return texts;
  }
  
  const results: string[] = new Array(texts.length);
  const toTranslate: { index: number; text: string }[] = [];
  
  // Check cache first
  texts.forEach((text, index) => {
    const cached = getCachedTranslation(text, targetLocale);
    if (cached) {
      results[index] = cached;
    } else {
      toTranslate.push({ index, text });
    }
  });
  
  // Translate uncached texts
  if (toTranslate.length > 0) {
    try {
      const response = await fetch('/api/ai/translate-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          texts: toTranslate.map(t => t.text),
          targetLocale,
          context: options.context || 'cryptocurrency news',
        }),
      });
      
      if (response.ok) {
        const { translations } = await response.json();
        toTranslate.forEach(({ index, text }, i) => {
          const translation = translations[i] || text;
          results[index] = translation;
          cacheTranslation(text, translation, targetLocale);
        });
      } else {
        // Use original texts on error
        toTranslate.forEach(({ index, text }) => {
          results[index] = text;
        });
      }
    } catch (error) {
      console.error('Batch translation error:', error);
      toTranslate.forEach(({ index, text }) => {
        results[index] = text;
      });
    }
  }
  
  return results;
}

// Translate article content
export async function translateArticle(
  article: {
    title: string;
    description?: string;
    content?: string;
    category?: string;
  },
  targetLocale: Locale
): Promise<typeof article> {
  if (targetLocale === defaultLocale) {
    return article;
  }
  
  const textsToTranslate = [
    article.title,
    article.description || '',
    article.content || '',
    article.category || '',
  ].filter(Boolean);
  
  const translations = await translateBatch(textsToTranslate, targetLocale, {
    context: 'cryptocurrency news article',
  });
  
  let i = 0;
  return {
    ...article,
    title: translations[i++] || article.title,
    description: article.description ? translations[i++] : undefined,
    content: article.content ? translations[i++] : undefined,
    category: article.category ? translations[i++] : undefined,
  };
}

// Get text direction for locale
export function getTextDirection(locale: Locale): 'ltr' | 'rtl' {
  return rtlLocales.includes(locale) ? 'rtl' : 'ltr';
}

// Get font recommendations for locale
export function getFontRecommendation(locale: Locale): {
  primary: string;
  fallback: string;
} {
  const fontMap: Record<string, { primary: string; fallback: string }> = {
    'zh-CN': { primary: 'Noto Sans SC', fallback: 'PingFang SC' },
    'zh-TW': { primary: 'Noto Sans TC', fallback: 'PingFang TC' },
    'ja': { primary: 'Noto Sans JP', fallback: 'Hiragino Sans' },
    'ko': { primary: 'Noto Sans KR', fallback: 'Apple SD Gothic Neo' },
    'ar': { primary: 'Noto Sans Arabic', fallback: 'Geeza Pro' },
    'he': { primary: 'Noto Sans Hebrew', fallback: 'Arial Hebrew' },
    'fa': { primary: 'Noto Sans Arabic', fallback: 'Geeza Pro' },
    'th': { primary: 'Noto Sans Thai', fallback: 'Thonburi' },
    'hi': { primary: 'Noto Sans Devanagari', fallback: 'Kohinoor Devanagari' },
    'bn': { primary: 'Noto Sans Bengali', fallback: 'Kohinoor Bangla' },
    'ta': { primary: 'Noto Sans Tamil', fallback: 'InaiMathi' },
    'te': { primary: 'Noto Sans Telugu', fallback: 'Kohinoor Telugu' },
    'ml': { primary: 'Noto Sans Malayalam', fallback: 'Malayalam Sangam MN' },
    'kn': { primary: 'Noto Sans Kannada', fallback: 'Kannada Sangam MN' },
    'gu': { primary: 'Noto Sans Gujarati', fallback: 'Gujarati Sangam MN' },
    'pa': { primary: 'Noto Sans Gurmukhi', fallback: 'Gurmukhi MN' },
    'my': { primary: 'Noto Sans Myanmar', fallback: 'Myanmar Sangam MN' },
    'km': { primary: 'Noto Sans Khmer', fallback: 'Khmer Sangam MN' },
    'lo': { primary: 'Noto Sans Lao', fallback: 'Lao Sangam MN' },
    'si': { primary: 'Noto Sans Sinhala', fallback: 'Sinhala Sangam MN' },
    'am': { primary: 'Noto Sans Ethiopic', fallback: 'Kefa' },
    'ka': { primary: 'Noto Sans Georgian', fallback: 'Georgia' },
    'hy': { primary: 'Noto Sans Armenian', fallback: 'Mshtakan' },
    'el': { primary: 'Noto Sans', fallback: 'Helvetica' },
    'ru': { primary: 'Noto Sans', fallback: 'Helvetica' },
    'uk': { primary: 'Noto Sans', fallback: 'Helvetica' },
  };
  
  return fontMap[locale] || { primary: 'Inter', fallback: 'system-ui' };
}

// Pluralization rules for different locales
export function getPlural(count: number, locale: Locale): string {
  // Simplified plural rules - in production, use ICU MessageFormat
  const rules: Record<string, (n: number) => string> = {
    'en': (n) => n === 1 ? 'one' : 'other',
    'ru': (n) => {
      if (n % 10 === 1 && n % 100 !== 11) return 'one';
      if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) return 'few';
      return 'other';
    },
    'ar': (n) => {
      if (n === 0) return 'zero';
      if (n === 1) return 'one';
      if (n === 2) return 'two';
      if (n % 100 >= 3 && n % 100 <= 10) return 'few';
      if (n % 100 >= 11 && n % 100 <= 99) return 'many';
      return 'other';
    },
    'zh-CN': () => 'other', // Chinese doesn't have plural forms
    'ja': () => 'other', // Japanese doesn't have plural forms
    'ko': () => 'other', // Korean doesn't have plural forms
  };
  
  const rule = rules[locale] || rules['en'];
  return rule(count);
}

// Number formatting for locale
export function formatNumber(num: number, locale: Locale): string {
  try {
    return new Intl.NumberFormat(locale, {
      notation: num >= 1_000_000 ? 'compact' : 'standard',
      maximumFractionDigits: 2,
    }).format(num);
  } catch {
    return num.toLocaleString();
  }
}

// Currency formatting for locale
export function formatCurrency(
  amount: number,
  currency: string,
  locale: Locale
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

// Date formatting for locale
export function formatDate(
  date: Date | string,
  locale: Locale,
  style: 'full' | 'long' | 'medium' | 'short' = 'medium'
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  try {
    return new Intl.DateTimeFormat(locale, { dateStyle: style }).format(d);
  } catch {
    return d.toLocaleDateString();
  }
}

// Relative time formatting for locale
export function formatRelativeTime(
  date: Date | string,
  locale: Locale
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  
  try {
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
    
    if (diffSec < 60) return rtf.format(-diffSec, 'second');
    if (diffMin < 60) return rtf.format(-diffMin, 'minute');
    if (diffHour < 24) return rtf.format(-diffHour, 'hour');
    if (diffDay < 30) return rtf.format(-diffDay, 'day');
    
    return formatDate(d, locale, 'medium');
  } catch {
    return formatDate(d, locale, 'short');
  }
}

// Export available locales for API
export function getAvailableLocales(): Array<{
  code: Locale;
  name: string;
  nativeName: string;
  rtl: boolean;
}> {
  return locales.map(code => ({
    code,
    name: localeNames[code] || code,
    nativeName: localeNames[code] || code,
    rtl: rtlLocales.includes(code),
  }));
}
