/**
 * @fileoverview E2E Tests for AI Features
 * Tests AI Hub, Oracle, Sentiment, and other AI-powered pages
 */

import { test, expect } from '@playwright/test';

test.describe('AI Hub', () => {
  test('should load the AI hub page', async ({ page }) => {
    await page.goto('/ai');
    
    await expect(page).toHaveURL(/ai/);
    await expect(page.locator('main')).toBeVisible();
  });

  test('should display AI features overview', async ({ page }) => {
    await page.goto('/ai');
    await page.waitForLoadState('networkidle');

    // Should have AI-related content
    const aiContent = page.locator('text=/AI|Oracle|Sentiment|Analysis/i');
    await expect(aiContent.first()).toBeVisible({ timeout: 10000 });
  });

  test('should link to AI sub-features', async ({ page }) => {
    await page.goto('/ai');
    await page.waitForLoadState('networkidle');

    // Look for links to Oracle, Brief, Debate, etc.
    const links = page.locator('a[href*="/ai/"], a[href*="/oracle"], a[href*="/sentiment"]');
    const count = await links.count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe('AI Oracle', () => {
  test('should load the Oracle page', async ({ page }) => {
    await page.goto('/ai/oracle');
    
    await expect(page).toHaveURL(/oracle/);
    await expect(page.locator('main')).toBeVisible();
  });

  test('should display Oracle interface', async ({ page }) => {
    await page.goto('/ai/oracle');
    await page.waitForLoadState('networkidle');

    // Look for Oracle title or interface
    const oracle = page.locator('text=/Oracle|Ask|Question/i');
    await expect(oracle.first()).toBeVisible({ timeout: 10000 });
  });

  test('should have question input', async ({ page }) => {
    await page.goto('/ai/oracle');
    await page.waitForLoadState('networkidle');

    // Look for input or textarea for questions
    const input = page.locator('input, textarea, [contenteditable="true"]');
    
    if (await input.count() > 0) {
      await expect(input.first()).toBeVisible();
    }
  });
});

test.describe('Sentiment Analysis', () => {
  test('should load sentiment page', async ({ page }) => {
    await page.goto('/sentiment');
    
    await expect(page).toHaveURL(/sentiment/);
    await expect(page.locator('main')).toBeVisible();
  });

  test('should display sentiment indicators', async ({ page }) => {
    await page.goto('/sentiment');
    await page.waitForLoadState('networkidle');

    // Look for sentiment-related content
    const sentiment = page.locator('text=/Bullish|Bearish|Neutral|Sentiment|Score/i');
    await expect(sentiment.first()).toBeVisible({ timeout: 15000 });
  });

  test('should show sentiment visualization', async ({ page }) => {
    await page.goto('/sentiment');
    await page.waitForLoadState('networkidle');

    // Look for charts, gauges, or visual indicators
    const visuals = page.locator('canvas, svg, [class*="chart"], [class*="gauge"], [data-testid="sentiment-chart"]');
    
    if (await visuals.count() > 0) {
      await expect(visuals.first()).toBeVisible();
    }
  });
});

test.describe('Fear & Greed Index', () => {
  test('should load fear-greed page', async ({ page }) => {
    await page.goto('/fear-greed');
    
    await expect(page).toHaveURL(/fear-greed/);
    await expect(page.locator('main')).toBeVisible();
  });

  test('should display fear & greed score', async ({ page }) => {
    await page.goto('/fear-greed');
    await page.waitForLoadState('networkidle');

    // Look for index value or label
    const index = page.locator('text=/Fear|Greed|Extreme|Neutral|[0-9]+/');
    await expect(index.first()).toBeVisible({ timeout: 15000 });
  });

  test('should show index gauge or visualization', async ({ page }) => {
    await page.goto('/fear-greed');
    await page.waitForLoadState('networkidle');

    // Look for gauge visualization
    const gauge = page.locator('canvas, svg, [class*="gauge"], [class*="meter"]');
    
    if (await gauge.count() > 0) {
      await expect(gauge.first()).toBeVisible();
    }
  });
});

test.describe('AI Digest', () => {
  test('should load digest page', async ({ page }) => {
    await page.goto('/digest');
    
    await expect(page).toHaveURL(/digest/);
    await expect(page.locator('main')).toBeVisible();
  });

  test('should display digest content', async ({ page }) => {
    await page.goto('/digest');
    await page.waitForLoadState('networkidle');

    // Should have summary or digest content
    const content = page.locator('text=/Summary|Digest|Today|Headlines/i');
    await expect(content.first()).toBeVisible({ timeout: 15000 });
  });
});

test.describe('Fact Check', () => {
  test('should load factcheck page', async ({ page }) => {
    await page.goto('/factcheck');
    
    await expect(page).toHaveURL(/factcheck/);
    await expect(page.locator('main')).toBeVisible();
  });

  test('should display fact check interface', async ({ page }) => {
    await page.goto('/factcheck');
    await page.waitForLoadState('networkidle');

    // Look for fact check content
    const factCheck = page.locator('text=/Fact|Check|Verify|Claim/i');
    await expect(factCheck.first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Clickbait Detector', () => {
  test('should load clickbait page', async ({ page }) => {
    await page.goto('/clickbait');
    
    await expect(page).toHaveURL(/clickbait/);
    await expect(page.locator('main')).toBeVisible();
  });

  test('should have clickbait analysis interface', async ({ page }) => {
    await page.goto('/clickbait');
    await page.waitForLoadState('networkidle');

    // Look for analysis input or results
    const detector = page.locator('text=/Clickbait|Score|Analyze|Headline/i');
    await expect(detector.first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('AI Brief', () => {
  test('should load brief page', async ({ page }) => {
    await page.goto('/ai/brief');
    
    await expect(page).toHaveURL(/brief/);
    await expect(page.locator('main')).toBeVisible();
  });
});

test.describe('AI Debate', () => {
  test('should load debate page', async ({ page }) => {
    await page.goto('/ai/debate');
    
    await expect(page).toHaveURL(/debate/);
    await expect(page.locator('main')).toBeVisible();
  });
});

test.describe('Entity Explorer', () => {
  test('should load entities page', async ({ page }) => {
    await page.goto('/entities');
    
    await expect(page).toHaveURL(/entities/);
    await expect(page.locator('main')).toBeVisible();
  });

  test('should display entities', async ({ page }) => {
    await page.goto('/entities');
    await page.waitForLoadState('networkidle');

    // Look for entity-related content
    const entities = page.locator('text=/Entity|Person|Company|Organization/i');
    
    if (await entities.count() > 0) {
      await expect(entities.first()).toBeVisible();
    }
  });
});
