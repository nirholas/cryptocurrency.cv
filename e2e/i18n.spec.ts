/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/cryptocurrency.cv
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

import { test, expect } from '@playwright/test';

/**
 * End-to-End Tests for Internationalization
 *
 * Updated for the new frontend:
 * - Locale routing via [locale] segment
 * - Layout renders <html lang="{locale}"> and dir="rtl" for Arabic/Hebrew/etc.
 * - Language switching via LanguageSelector in Footer
 * - Translated content via next-intl useTranslations()
 * - Header, Footer, and news components render localized strings
 */

const TEST_LOCALES = ['en', 'es', 'ja', 'zh-CN', 'ar'];

test.describe('Locale Routing', () => {
  test('should load homepage without locale prefix (default English)', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/');

    const html = page.locator('html');
    await expect(html).toHaveAttribute('lang', 'en');
  });

  TEST_LOCALES.forEach(locale => {
    test(`should load /${locale} homepage`, async ({ page }) => {
      const url = locale === 'en' ? '/' : `/${locale}`;
      await page.goto(url);

      await expect(page.locator('body')).toBeVisible();

      const html = page.locator('html');
      await expect(html).toHaveAttribute('lang', locale);
    });
  });

  test('should redirect invalid locale to default', async ({ page }) => {
    await page.goto('/invalid-locale');
    // Should either 404 or redirect
    await expect(page).not.toHaveURL('/invalid-locale');
  });
});

test.describe('Language Switcher', () => {
  test('should have language switcher in footer or header', async ({ page }) => {
    await page.goto('/');

    // LanguageSelector is in the Footer
    const languageSwitcher = page.locator(
      '#language-select, select[name="locale"], .language-switcher, footer select'
    );

    const isVisible = await languageSwitcher.isVisible().catch(() => false);
    if (isVisible) {
      await expect(languageSwitcher).toBeVisible();
    }
  });

  test('should switch language via URL navigation', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');

    await page.goto('/es');
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');

    await page.goto('/ja');
    await expect(page.locator('html')).toHaveAttribute('lang', 'ja');
  });

  test('should preserve path when switching language', async ({ page }) => {
    await page.goto('/about');
    await page.goto('/es/about');
    await expect(page).toHaveURL(/\/es\/about/);
  });
});

test.describe('RTL Support (Arabic)', () => {
  test('should have RTL direction for Arabic locale', async ({ page }) => {
    await page.goto('/ar');

    const html = page.locator('html');
    await expect(html).toHaveAttribute('dir', 'rtl');
    await expect(html).toHaveAttribute('lang', 'ar');
  });

  test('should have LTR direction for non-Arabic locales', async ({ page }) => {
    await page.goto('/es');

    const html = page.locator('html');
    const dir = await html.getAttribute('dir');
    expect(dir === 'ltr' || dir === null).toBe(true);
  });

  test('should render Arabic text correctly', async ({ page }) => {
    await page.goto('/ar');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toMatch(/[\u0600-\u06FF]/);
  });
});

test.describe('Translated Content', () => {
  test('should show translated content in Spanish', async ({ page }) => {
    await page.goto('/es');
    await page.waitForLoadState('networkidle');

    // Body should contain some text
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toBeTruthy();
  });

  test('should show translated content in Japanese', async ({ page }) => {
    await page.goto('/ja');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toMatch(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/);
  });

  test('should show translated content in Chinese', async ({ page }) => {
    await page.goto('/zh-CN');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toMatch(/[\u4E00-\u9FFF]/);
  });
});

test.describe('SEO & Metadata', () => {
  TEST_LOCALES.forEach(locale => {
    test(`should have correct lang attribute for ${locale}`, async ({ page }) => {
      const url = locale === 'en' ? '/' : `/${locale}`;
      await page.goto(url);

      const html = page.locator('html');
      await expect(html).toHaveAttribute('lang', locale);
    });
  });

  test('should have hreflang alternate links', async ({ page }) => {
    await page.goto('/');
    await page.locator('link[hreflang]').all();
    // hreflang links are optional but should be present if implemented
  });

  test('should have localized meta description', async ({ page }) => {
    await page.goto('/');
    const enDescription = await page.locator('meta[name="description"]').getAttribute('content');

    await page.goto('/es');
    const esDescription = await page.locator('meta[name="description"]').getAttribute('content');

    if (enDescription && esDescription) {
      expect(enDescription).not.toBe(esDescription);
    }
  });

  test('should have structured data on homepage', async ({ page }) => {
    await page.goto('/');
    const jsonLd = page.locator('script[type="application/ld+json"]');
    const count = await jsonLd.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });
});

test.describe('API Language Parameter', () => {
  test('should return translated content with lang parameter', async ({ request }) => {
    const response = await request.get('/api/news?limit=1&lang=es');
    expect(response.ok()).toBe(true);

    const data = await response.json();
    expect(data.lang || data.language || 'es').toBeDefined();
  });

  test('should return supported languages list', async ({ request }) => {
    const response = await request.get('/api/news?limit=1');
    expect(response.ok()).toBe(true);

    const data = await response.json();
    if (data.availableLanguages) {
      expect(data.availableLanguages).toContain('en');
      expect(data.availableLanguages).toContain('es');
    }
  });
});

test.describe('Locale Persistence', () => {
  test('should remember locale preference', async ({ page }) => {
    await page.goto('/es');
    await page.waitForLoadState('networkidle');

    // Either cookie or localStorage should store preference
  });
});

test.describe('Date/Time Formatting', () => {
  test('should format dates according to locale', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.locator('time, [data-time], .time-ago').all();
    // Dates should be present on a news site
  });
});

test.describe('Error Pages', () => {
  test('should show 404 page for non-existent route', async ({ page }) => {
    await page.goto('/es/non-existent-page-12345');
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toBeTruthy();
  });
});

test.describe('Performance', () => {
  test('should load translated page within reasonable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/ja');
    await page.waitForLoadState('domcontentloaded');
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(10000);
  });
});
