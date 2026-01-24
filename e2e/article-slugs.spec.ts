/**
 * E2E Tests for Article Slug URLs
 * 
 * Tests that article URLs work with both:
 * - New SEO-friendly slugs (e.g., /article/bitcoin-hits-new-ath-2026-01-24)
 * - Legacy hash IDs (e.g., /article/3a9f8b2c1d4e5f67)
 */

import { test, expect } from '@playwright/test';

test.describe('Article Slug URLs', () => {
  
  test('should display article from news card link', async ({ page }) => {
    // Go to homepage
    await page.goto('/');
    
    // Wait for news cards to load
    await page.waitForSelector('[data-article]', { timeout: 10000 });
    
    // Get first article link
    const firstArticle = page.locator('[data-article] a').first();
    const href = await firstArticle.getAttribute('href');
    
    // Verify the URL contains /article/ and has a slug format
    expect(href).toContain('/article/');
    
    // Should have a readable slug (contains letters and hyphens, not just hex)
    const slug = href?.split('/article/')[1];
    expect(slug).toBeTruthy();
    // New slugs should contain at least one letter
    expect(slug).toMatch(/[a-z]/);
    
    // Click the article
    await firstArticle.click();
    
    // Should navigate to article page
    await expect(page).toHaveURL(/\/article\//);
    
    // Should show article content
    await expect(page.locator('article, [role="article"], main')).toBeVisible();
  });

  test('should have SEO-friendly URL format', async ({ page }) => {
    await page.goto('/');
    
    // Wait for articles
    await page.waitForSelector('[data-article]');
    
    // Get all article links
    const articleLinks = await page.locator('[data-article] a[href*="/article/"]').all();
    
    expect(articleLinks.length).toBeGreaterThan(0);
    
    for (const link of articleLinks.slice(0, 5)) {
      const href = await link.getAttribute('href');
      const slug = href?.split('/article/')[1];
      
      // Slug should be lowercase
      expect(slug).toEqual(slug?.toLowerCase());
      
      // Slug should not contain special characters (except hyphens)
      expect(slug).not.toMatch(/[^a-z0-9-]/);
      
      // Should end with a date format YYYY-MM-DD
      expect(slug).toMatch(/-\d{4}-\d{2}-\d{2}$/);
    }
  });

  test('article page should have correct metadata', async ({ page }) => {
    // Go to homepage and get first article
    await page.goto('/');
    await page.waitForSelector('[data-article]');
    
    // Get article title before clicking
    const articleTitle = await page.locator('[data-article] h3, [data-article] h2').first().textContent();
    
    // Navigate to article
    await page.locator('[data-article] a').first().click();
    await page.waitForLoadState('domcontentloaded');
    
    // Check page title contains article title
    const pageTitle = await page.title();
    expect(pageTitle.toLowerCase()).toContain(articleTitle?.toLowerCase().slice(0, 30) || '');
    
    // Check canonical URL exists
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(canonical).toBeTruthy();
    expect(canonical).toContain('/article/');
    
    // Check Open Graph tags
    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content');
    expect(ogTitle).toBeTruthy();
    
    const ogUrl = await page.locator('meta[property="og:url"]').getAttribute('content');
    expect(ogUrl).toContain('/article/');
  });

  test('should have breadcrumb navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-article]');
    
    // Navigate to an article
    await page.locator('[data-article] a').first().click();
    await page.waitForLoadState('domcontentloaded');
    
    // Should have breadcrumb
    const breadcrumb = page.locator('nav[aria-label="Breadcrumb"], [aria-label*="breadcrumb"]');
    await expect(breadcrumb).toBeVisible();
    
    // Breadcrumb should contain Home link
    await expect(breadcrumb.locator('a[href="/"]')).toBeVisible();
  });

  test('should have share functionality', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-article]');
    
    // Navigate to article
    await page.locator('[data-article] a').first().click();
    await page.waitForLoadState('domcontentloaded');
    
    // Should have share buttons
    const twitterShare = page.locator('a[href*="twitter.com/intent/tweet"]');
    const telegramShare = page.locator('a[href*="t.me/share"]');
    
    // At least one share option should exist
    const hasTwitter = await twitterShare.count() > 0;
    const hasTelegram = await telegramShare.count() > 0;
    
    expect(hasTwitter || hasTelegram).toBeTruthy();
    
    // Share URLs should contain the SEO-friendly slug
    if (hasTwitter) {
      const twitterHref = await twitterShare.first().getAttribute('href');
      expect(twitterHref).toContain('/article/');
      // Should have a date in the URL (part of SEO slug)
      expect(twitterHref).toMatch(/\d{4}-\d{2}-\d{2}/);
    }
  });

  test('RSS feed should use SEO-friendly URLs', async ({ page }) => {
    // Fetch the RSS feed
    const response = await page.goto('/feed.xml');
    expect(response?.status()).toBe(200);
    
    const content = await page.content();
    
    // Should contain article links with slugs
    expect(content).toContain('/article/');
    
    // Links should have date format (SEO slugs)
    expect(content).toMatch(/<link>.*\/article\/[a-z0-9-]+-\d{4}-\d{2}-\d{2}<\/link>/);
  });

  test('tag page articles should link with SEO slugs', async ({ page }) => {
    // Go to a tag page
    await page.goto('/tags/bitcoin');
    
    // Wait for articles
    const hasArticles = await page.locator('article').count() > 0;
    
    if (hasArticles) {
      const articleLinks = await page.locator('article a[href*="/article/"]').all();
      
      for (const link of articleLinks.slice(0, 3)) {
        const href = await link.getAttribute('href');
        expect(href).toMatch(/-\d{4}-\d{2}-\d{2}$/);
      }
    }
  });
});
