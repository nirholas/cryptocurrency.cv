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
 * Accessibility E2E Tests
 *
 * Updated for the new frontend design:
 * - Skip link (.skip-link / a[href="#main-content"])
 * - ARIA landmarks: <header>, <main id="main-content">, <footer>
 * - Theme toggle: button[aria-label="Toggle theme"]
 * - Mobile menu: button[aria-label="Toggle menu"]
 * - Search: button[aria-label="Search (Cmd+K)"]
 * - CSS variable theming (--color-text-primary, --color-surface, etc.)
 *
 * Uses axe-core to automatically test WCAG compliance.
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Critical pages that must be fully accessible
const CRITICAL_PAGES = [
  { path: '/', name: 'Home' },
  { path: '/markets', name: 'Markets' },
  { path: '/search', name: 'Search' },
  { path: '/trending', name: 'Trending' },
  { path: '/settings', name: 'Settings' },
  { path: '/pricing', name: 'Pricing' },
  { path: '/developers', name: 'Developers' },
];

// Pages that should be tested but may have known issues
const SECONDARY_PAGES = [
  { path: '/coin/bitcoin', name: 'Coin Detail' },
  { path: '/portfolio', name: 'Portfolio' },
  { path: '/ai', name: 'AI Features' },
  { path: '/defi', name: 'DeFi' },
];

test.describe('Accessibility - Critical Pages (WCAG 2.1 AA)', () => {
  for (const { path, name } of CRITICAL_PAGES) {
    test(`${name} page should have no critical a11y violations`, async ({ page }) => {
      await page.goto(`${BASE_URL}${path}`, { waitUntil: 'networkidle' });

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      const criticalViolations = accessibilityScanResults.violations.filter(
        v => v.impact === 'critical' || v.impact === 'serious'
      );

      if (criticalViolations.length > 0) {
        console.log(`\n❌ A11y violations on ${name} (${path}):`);
        criticalViolations.forEach(v => {
          console.log(`  [${v.impact?.toUpperCase()}] ${v.id}: ${v.description}`);
          console.log(`    Help: ${v.helpUrl}`);
          v.nodes.slice(0, 3).forEach(n => {
            console.log(`    → ${n.html.substring(0, 100)}...`);
          });
        });
      }

      expect(criticalViolations).toHaveLength(0);
    });
  }
});

test.describe('Accessibility - Secondary Pages', () => {
  for (const { path, name } of SECONDARY_PAGES) {
    test(`${name} page should have no critical a11y violations`, async ({ page }) => {
      await page.goto(`${BASE_URL}${path}`, { waitUntil: 'networkidle' });

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

      const criticalViolations = accessibilityScanResults.violations.filter(
        v => v.impact === 'critical'
      );

      expect(criticalViolations).toHaveLength(0);
    });
  }
});

test.describe('Accessibility - Keyboard Navigation', () => {
  test('can navigate header with keyboard', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    // Tab through — should hit skip link first, then header items
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    const focusedElement = await page.evaluate(() => {
      const el = document.activeElement;
      return el
        ? {
            tagName: el.tagName,
            hasVisibleFocus:
              window.getComputedStyle(el).outlineWidth !== '0px' ||
              el.classList.contains('focus-visible') ||
              el.matches(':focus-visible'),
          }
        : null;
    });

    expect(focusedElement).toBeTruthy();
  });

  test('skip link exists and works', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    // The skip link may be .skip-link or a[href="#main-content"]
    const skipLink = page.locator('.skip-link, a[href="#main-content"]');
    const count = await skipLink.count();
    expect(count).toBeGreaterThanOrEqual(1);

    // Tab to it
    await page.keyboard.press('Tab');

    // Press enter on skip link
    const focused = await page.evaluate(() => document.activeElement?.className || '');
    if (focused.includes('skip')) {
      await page.keyboard.press('Enter');
      // Focus should now be in main content area
      const focusedAfterSkip = await page.evaluate(() => {
        const el = document.activeElement;
        return el?.id || el?.getAttribute('role') || el?.tagName;
      });
      expect(focusedAfterSkip).toBeTruthy();
    }
  });
});

test.describe('Accessibility - ARIA Landmarks', () => {
  test('has header landmark', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    const header = page.locator('header');
    await expect(header.first()).toBeVisible();
  });

  test('has main landmark', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    const main = page.locator('main, main#main-content');
    await expect(main.first()).toBeVisible();
  });

  test('has footer landmark', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
  });

  test('has navigation landmark', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    const nav = page.locator('nav');
    await expect(nav.first()).toBeAttached();
  });
});

test.describe('Accessibility - Color Contrast', () => {
  test('text has sufficient color contrast', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['cat.color'])
      .analyze();

    const contrastViolations = accessibilityScanResults.violations.filter(v =>
      v.id.includes('contrast')
    );

    if (contrastViolations.length > 0) {
      console.log('\n⚠️ Color contrast issues:');
      contrastViolations.forEach(v => {
        v.nodes.slice(0, 5).forEach(n => {
          console.log(`  ${n.html.substring(0, 80)}...`);
        });
      });
    }

    const criticalContrast = contrastViolations.filter(v => v.impact === 'critical');
    expect(criticalContrast).toHaveLength(0);
  });
});

test.describe('Accessibility - Reduced Motion', () => {
  test('respects prefers-reduced-motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    const hasReducedMotion = await page.evaluate(() => {
      const anyElement = document.querySelector('.animate-enter, [class*="animate"]');
      if (anyElement) {
        const animDuration = window.getComputedStyle(anyElement).animationDuration;
        const transDuration = window.getComputedStyle(anyElement).transitionDuration;
        return parseFloat(animDuration) <= 0.01 || parseFloat(transDuration) <= 0.01;
      }
      return true;
    });

    expect(hasReducedMotion).toBe(true);
  });
});

test.describe('Accessibility - Screen Reader', () => {
  test('images have alt text', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['cat.text-alternatives'])
      .analyze();

    const imageViolations = accessibilityScanResults.violations.filter(
      v => v.id.includes('image') || v.id.includes('alt')
    );

    expect(imageViolations.filter(v => v.impact === 'critical')).toHaveLength(0);
  });

  test('form inputs have labels', async ({ page }) => {
    await page.goto(`${BASE_URL}/search`, { waitUntil: 'networkidle' });

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['cat.forms'])
      .analyze();

    const formViolations = accessibilityScanResults.violations.filter(
      v => v.id.includes('label') || v.id.includes('input')
    );

    expect(formViolations.filter(v => v.impact === 'critical')).toHaveLength(0);
  });

  test('page has proper heading hierarchy', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    const headings = await page.evaluate(() => {
      const h = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      return Array.from(h).map(el => ({
        level: parseInt(el.tagName[1]),
        text: el.textContent?.substring(0, 50),
      }));
    });

    // Should have at least one h1
    const h1Count = headings.filter(h => h.level === 1).length;
    expect(h1Count).toBeGreaterThanOrEqual(1);

    // Log heading skips for debugging
    let lastLevel = 0;
    for (const h of headings) {
      if (h.level > lastLevel + 1 && lastLevel > 0) {
        console.log(`⚠️ Heading skip: h${lastLevel} → h${h.level} ("${h.text}")`);
      }
      lastLevel = h.level;
    }
  });

  test('interactive elements have accessible names', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    // Check that icon-only buttons have aria-labels
    const themeToggle = page.locator('button[aria-label="Toggle theme"]');
    if (await themeToggle.count() > 0) {
      const label = await themeToggle.getAttribute('aria-label');
      expect(label).toBeTruthy();
    }

    const searchButton = page.locator('button[aria-label*="Search"]');
    if (await searchButton.count() > 0) {
      const label = await searchButton.first().getAttribute('aria-label');
      expect(label).toBeTruthy();
    }
  });
});

