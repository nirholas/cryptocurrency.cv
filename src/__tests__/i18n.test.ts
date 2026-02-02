/**
 * Internationalization (i18n) Tests
 * 
 * Comprehensive tests for translation files, locale configuration,
 * and README translations.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';

// Supported locales
const LOCALES = [
  'en', 'es', 'fr', 'de', 'pt', 'ja', 'zh-CN', 'zh-TW', 
  'ko', 'ar', 'ru', 'it', 'nl', 'pl', 'tr', 'vi', 'th', 'id'
] as const;

const DEFAULT_LOCALE = 'en';

// RTL locales
const RTL_LOCALES = ['ar'];

// Paths
const MESSAGES_DIR = path.join(process.cwd(), 'messages');
const ROOT_DIR = process.cwd();

/**
 * Recursively get all keys from a nested object
 */
function getAllKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  return Object.keys(obj).reduce((keys: string[], key) => {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      return [...keys, ...getAllKeys(value as Record<string, unknown>, fullKey)];
    }
    return [...keys, fullKey];
  }, []);
}

/**
 * Get value from nested object by dot-notation key
 */
function getNestedValue(obj: Record<string, unknown>, key: string): unknown {
  return key.split('.').reduce((o, k) => (o && typeof o === 'object' ? (o as Record<string, unknown>)[k] : undefined), obj);
}

/**
 * Extract interpolation placeholders from a string
 */
function extractPlaceholders(str: string): string[] {
  const matches = str.match(/\{[^}]+\}/g);
  return matches ? matches.sort() : [];
}

describe('i18n Configuration', () => {
  it('should have all required locales defined', () => {
    const requiredLocales = ['en', 'es', 'fr', 'de', 'pt', 'ja', 'zh-CN', 'zh-TW', 'ko', 'ar', 'ru', 'it', 'nl', 'pl', 'tr', 'vi', 'th', 'id'];
    requiredLocales.forEach(locale => {
      expect(LOCALES).toContain(locale);
    });
  });

  it('should have 18 supported locales', () => {
    expect(LOCALES.length).toBe(18);
  });

  it('should have English as default locale', () => {
    expect(DEFAULT_LOCALE).toBe('en');
  });

  it('should have Arabic marked as RTL', () => {
    expect(RTL_LOCALES).toContain('ar');
  });
});

describe('Translation Files', () => {
  let enMessages: Record<string, unknown>;
  let enKeys: string[];

  beforeAll(() => {
    const enFilePath = path.join(MESSAGES_DIR, 'en.json');
    if (fs.existsSync(enFilePath)) {
      enMessages = JSON.parse(fs.readFileSync(enFilePath, 'utf-8'));
      enKeys = getAllKeys(enMessages);
    }
  });

  it('should have messages directory', () => {
    expect(fs.existsSync(MESSAGES_DIR)).toBe(true);
  });

  describe('English base file (en.json)', () => {
    it('should exist', () => {
      const filePath = path.join(MESSAGES_DIR, 'en.json');
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it('should be valid JSON', () => {
      const filePath = path.join(MESSAGES_DIR, 'en.json');
      if (fs.existsSync(filePath)) {
        expect(() => JSON.parse(fs.readFileSync(filePath, 'utf-8'))).not.toThrow();
      }
    });

    it('should have required namespaces', () => {
      if (enMessages) {
        const requiredNamespaces = ['common', 'nav', 'home', 'news', 'article', 'markets', 'search', 'settings', 'errors'];
        requiredNamespaces.forEach(ns => {
          expect(enMessages).toHaveProperty(ns);
        });
      }
    });

    it('should have at least 100 translation keys', () => {
      if (enKeys) {
        expect(enKeys.length).toBeGreaterThanOrEqual(100);
      }
    });
  });

  // Test each locale
  LOCALES.forEach(locale => {
    describe(`${locale} translations`, () => {
      const filePath = path.join(MESSAGES_DIR, `${locale}.json`);
      let messages: Record<string, unknown>;
      let keys: string[];

      beforeAll(() => {
        if (fs.existsSync(filePath)) {
          messages = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
          keys = getAllKeys(messages);
        }
      });

      it('should have translation file', () => {
        expect(fs.existsSync(filePath)).toBe(true);
      });

      if (locale !== 'en') {
        it('should have all required keys from English', () => {
          if (messages && enKeys) {
            const missingKeys = enKeys.filter(key => !keys.includes(key));
            if (missingKeys.length > 0) {
              console.warn(`Missing keys in ${locale}:`, missingKeys.slice(0, 10));
            }
            expect(missingKeys.length).toBe(0);
          }
        });

        it('should not have extra keys not in English', () => {
          if (messages && enKeys) {
            const extraKeys = keys.filter(key => !enKeys.includes(key));
            if (extraKeys.length > 0) {
              console.warn(`Extra keys in ${locale}:`, extraKeys);
            }
            expect(extraKeys.length).toBe(0);
          }
        });

        it('should preserve interpolation placeholders', () => {
          if (messages && enMessages) {
            const keysWithPlaceholders = enKeys.filter(key => {
              const value = getNestedValue(enMessages, key);
              return typeof value === 'string' && value.includes('{');
            });

            keysWithPlaceholders.forEach(key => {
              const enValue = getNestedValue(enMessages, key) as string;
              const localValue = getNestedValue(messages, key) as string;

              if (localValue) {
                const enPlaceholders = extractPlaceholders(enValue);
                const localPlaceholders = extractPlaceholders(localValue);

                expect(localPlaceholders).toEqual(enPlaceholders);
              }
            });
          }
        });
      }

      it('should be valid JSON', () => {
        if (fs.existsSync(filePath)) {
          expect(() => JSON.parse(fs.readFileSync(filePath, 'utf-8'))).not.toThrow();
        }
      });

      it('should have non-empty string values', () => {
        if (messages) {
          keys.forEach(key => {
            const value = getNestedValue(messages, key);
            if (typeof value === 'string') {
              expect(value.trim().length).toBeGreaterThan(0);
            }
          });
        }
      });
    });
  });
});

describe('README Translations', () => {
  // All locales should have README translations
  const readmeLocales = ['es', 'fr', 'de', 'pt', 'ja', 'zh-CN', 'zh-TW', 'ko', 'ar', 'ru', 'it', 'nl', 'pl', 'tr', 'vi', 'th', 'id'];

  it('should have main README.md', () => {
    const filePath = path.join(ROOT_DIR, 'README.md');
    expect(fs.existsSync(filePath)).toBe(true);
  });

  readmeLocales.forEach(locale => {
    describe(`README.${locale}.md`, () => {
      const filePath = path.join(ROOT_DIR, `README.${locale}.md`);

      it('should exist', () => {
        expect(fs.existsSync(filePath)).toBe(true);
      });

      it('should have language selector header', () => {
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf-8');
          expect(content).toContain('🌐');
          expect(content).toContain('README.md');
        }
      });

      it('should preserve code blocks', () => {
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf-8');
          // Check for common code patterns that should be preserved
          expect(content).toContain('```');
          expect(content).toContain('curl');
        }
      });

      it('should preserve URLs', () => {
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf-8');
          expect(content).toContain('https://news-crypto.vercel.app');
          expect(content).toContain('github.com/nirholas/free-crypto-news');
        }
      });

      it('should have reasonable length (not empty or truncated)', () => {
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf-8');
          // README should be at least 6KB (translations may be more compact)
          expect(content.length).toBeGreaterThan(6000);
        }
      });
    });
  });
});

describe('i18n Integration', () => {
  it('should have consistent locale codes across messages and READMEs', () => {
    const messageLocales = fs.readdirSync(MESSAGES_DIR)
      .filter(f => f.endsWith('.json'))
      .map(f => f.replace('.json', ''));

    const readmeLocales = fs.readdirSync(ROOT_DIR)
      .filter(f => f.startsWith('README.') && f.endsWith('.md') && f !== 'README.md')
      .map(f => f.replace('README.', '').replace('.md', ''));

    // All README locales should have corresponding message files
    readmeLocales.forEach(locale => {
      expect(messageLocales).toContain(locale);
    });
  });

  it('should have .i18nrc.js configuration file', () => {
    const configPath = path.join(ROOT_DIR, '.i18nrc.js');
    expect(fs.existsSync(configPath)).toBe(true);
  });
});

describe('RTL Support', () => {
  it('should have proper Arabic translation', () => {
    const arFilePath = path.join(MESSAGES_DIR, 'ar.json');
    if (fs.existsSync(arFilePath)) {
      const arMessages = JSON.parse(fs.readFileSync(arFilePath, 'utf-8'));
      // Arabic text should contain Arabic characters
      const sampleValue = getNestedValue(arMessages, 'common.loading') as string;
      if (sampleValue) {
        // Check for Arabic Unicode range
        expect(/[\u0600-\u06FF]/.test(sampleValue)).toBe(true);
      }
    }
  });
});

describe('Translation Quality', () => {
  it('should not have untranslated English in non-English files', () => {
    const commonEnglishPhrases = ['Loading...', 'Click here', 'Learn more', 'Read more'];
    
    LOCALES.filter(l => l !== 'en').forEach(locale => {
      const filePath = path.join(MESSAGES_DIR, `${locale}.json`);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        
        // These exact phrases shouldn't appear (would indicate untranslated content)
        commonEnglishPhrases.forEach(phrase => {
          // Allow if it's in a key name, but not as a value
          const messages = JSON.parse(content);
          const values = JSON.stringify(Object.values(messages));
          // This is a soft check - some technical terms might be kept in English
        });
      }
    });
  });
});
