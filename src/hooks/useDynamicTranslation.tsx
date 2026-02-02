/**
 * useDynamicTranslation Hook
 * Provides real-time translation for dynamic content
 */

'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useLocale } from 'next-intl';
import { type Locale, defaultLocale, rtlLocales } from '@/i18n/config';

interface TranslationCache {
  [key: string]: {
    translation: string;
    timestamp: number;
  };
}

interface UseDynamicTranslationOptions {
  context?: string;
  autoTranslate?: boolean;
  cacheTimeout?: number;
}

// In-memory cache for translations
const translationCache: TranslationCache = {};
const CACHE_TIMEOUT = 60 * 60 * 1000; // 1 hour

/**
 * Hook for translating dynamic content on-the-fly
 */
export function useDynamicTranslation(options: UseDynamicTranslationOptions = {}) {
  const locale = useLocale() as Locale;
  const { context = 'cryptocurrency news', cacheTimeout = CACHE_TIMEOUT } = options;
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Check if translation is needed
  const needsTranslation = locale !== defaultLocale;
  
  // Get direction for current locale
  const direction = useMemo(() => {
    return rtlLocales.includes(locale) ? 'rtl' : 'ltr';
  }, [locale]);
  
  // Generate cache key
  const getCacheKey = useCallback((text: string) => {
    return `${locale}:${text.substring(0, 50)}:${text.length}`;
  }, [locale]);
  
  // Get from cache
  const getFromCache = useCallback((text: string): string | null => {
    const key = getCacheKey(text);
    const cached = translationCache[key];
    
    if (cached && Date.now() - cached.timestamp < cacheTimeout) {
      return cached.translation;
    }
    
    return null;
  }, [getCacheKey, cacheTimeout]);
  
  // Save to cache
  const saveToCache = useCallback((text: string, translation: string) => {
    const key = getCacheKey(text);
    translationCache[key] = {
      translation,
      timestamp: Date.now(),
    };
  }, [getCacheKey]);
  
  // Translate single text
  const translate = useCallback(async (text: string): Promise<string> => {
    if (!needsTranslation || !text.trim()) {
      return text;
    }
    
    // Check cache first
    const cached = getFromCache(text);
    if (cached) {
      return cached;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          targetLocale: locale,
          context,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Translation failed');
      }
      
      const data = await response.json();
      const translation = data.translation || text;
      
      saveToCache(text, translation);
      return translation;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Translation failed');
      return text; // Return original on error
    } finally {
      setIsLoading(false);
    }
  }, [needsTranslation, locale, context, getFromCache, saveToCache]);
  
  // Translate multiple texts
  const translateBatch = useCallback(async (texts: string[]): Promise<string[]> => {
    if (!needsTranslation) {
      return texts;
    }
    
    const results: string[] = new Array(texts.length);
    const uncached: { index: number; text: string }[] = [];
    
    // Check cache for each text
    texts.forEach((text, index) => {
      const cached = getFromCache(text);
      if (cached) {
        results[index] = cached;
      } else {
        uncached.push({ index, text });
      }
    });
    
    // If all cached, return immediately
    if (uncached.length === 0) {
      return results;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          texts: uncached.map(u => u.text),
          targetLocale: locale,
          context,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Batch translation failed');
      }
      
      const data = await response.json();
      const translations = data.translations || [];
      
      uncached.forEach(({ index, text }, i) => {
        const translation = translations[i] || text;
        results[index] = translation;
        saveToCache(text, translation);
      });
      
      return results;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Translation failed');
      // Fill remaining with originals
      uncached.forEach(({ index, text }) => {
        results[index] = text;
      });
      return results;
    } finally {
      setIsLoading(false);
    }
  }, [needsTranslation, locale, context, getFromCache, saveToCache]);
  
  // Translate with auto-update (for components that render immediately)
  const useAutoTranslate = useCallback((text: string): string => {
    const [translatedText, setTranslatedText] = useState(text);
    
    useEffect(() => {
      if (needsTranslation) {
        translate(text).then(setTranslatedText);
      }
    }, [text]);
    
    return translatedText;
  }, [needsTranslation, translate]);
  
  return {
    locale,
    direction,
    needsTranslation,
    isLoading,
    error,
    translate,
    translateBatch,
    useAutoTranslate,
    clearError: () => setError(null),
  };
}

/**
 * Simple hook for auto-translating a single text
 */
export function useAutoTranslate(text: string, context?: string): {
  text: string;
  isLoading: boolean;
} {
  const locale = useLocale() as Locale;
  const needsTranslation = locale !== defaultLocale;
  
  const [translatedText, setTranslatedText] = useState(text);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    if (!needsTranslation || !text.trim()) {
      setTranslatedText(text);
      return;
    }
    
    // Check cache
    const cacheKey = `${locale}:${text.substring(0, 50)}:${text.length}`;
    const cached = translationCache[cacheKey];
    if (cached && Date.now() - cached.timestamp < CACHE_TIMEOUT) {
      setTranslatedText(cached.translation);
      return;
    }
    
    setIsLoading(true);
    
    fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        targetLocale: locale,
        context: context || 'cryptocurrency news',
      }),
    })
      .then(res => res.json())
      .then(data => {
        const translation = data.translation || text;
        setTranslatedText(translation);
        translationCache[cacheKey] = {
          translation,
          timestamp: Date.now(),
        };
      })
      .catch(() => {
        setTranslatedText(text); // Fallback to original
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [text, locale, needsTranslation, context]);
  
  return { text: translatedText, isLoading };
}

/**
 * Component for auto-translating text content
 */
interface TranslatedTextProps {
  children: string;
  context?: string;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
}

export function TranslatedText({
  children,
  context,
  as: Component = 'span',
  className,
}: TranslatedTextProps) {
  const { text, isLoading } = useAutoTranslate(children, context);
  
  return (
    <Component className={className} data-translating={isLoading || undefined}>
      {text}
    </Component>
  );
}
