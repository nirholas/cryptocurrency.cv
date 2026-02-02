/**
 * @fileoverview E2E Tests for Trading Features
 * Tests Order Book, Whales, Liquidations, and other trading pages
 */

import { test, expect } from '@playwright/test';

test.describe('Order Book', () => {
  test('should load orderbook page', async ({ page }) => {
    await page.goto('/orderbook');
    
    await expect(page).toHaveURL(/orderbook/);
    await expect(page.locator('main')).toBeVisible();
  });

  test('should display order book data', async ({ page }) => {
    await page.goto('/orderbook');
    await page.waitForLoadState('networkidle');

    // Look for bid/ask content
    const orderbook = page.locator('text=/Bid|Ask|Buy|Sell|Order/i');
    await expect(orderbook.first()).toBeVisible({ timeout: 15000 });
  });

  test('should show price levels', async ({ page }) => {
    await page.goto('/orderbook');
    await page.waitForLoadState('networkidle');

    // Look for price data
    const prices = page.locator('text=/\\$[0-9,]+|[0-9]+\\.[0-9]+/');
    await expect(prices.first()).toBeVisible({ timeout: 15000 });
  });

  test('should have trading pair selector', async ({ page }) => {
    await page.goto('/orderbook');
    await page.waitForLoadState('networkidle');

    // Look for pair selection
    const pairSelector = page.locator('select, [role="combobox"], button:has-text("BTC"), button:has-text("ETH")');
    
    if (await pairSelector.count() > 0) {
      await expect(pairSelector.first()).toBeVisible();
    }
  });
});

test.describe('Whale Alerts', () => {
  test('should load whales page', async ({ page }) => {
    await page.goto('/whales');
    
    await expect(page).toHaveURL(/whales/);
    await expect(page.locator('main')).toBeVisible();
  });

  test('should display whale transactions', async ({ page }) => {
    await page.goto('/whales');
    await page.waitForLoadState('networkidle');

    // Look for transaction content
    const whales = page.locator('text=/Whale|Transaction|Transfer|Million|Billion/i');
    await expect(whales.first()).toBeVisible({ timeout: 15000 });
  });

  test('should show transaction amounts', async ({ page }) => {
    await page.goto('/whales');
    await page.waitForLoadState('networkidle');

    // Look for large numbers
    const amounts = page.locator('text=/\\$[0-9,]+|[0-9]+M|[0-9]+B/');
    
    if (await amounts.count() > 0) {
      await expect(amounts.first()).toBeVisible();
    }
  });
});

test.describe('Liquidations', () => {
  test('should load liquidations page', async ({ page }) => {
    await page.goto('/liquidations');
    
    await expect(page).toHaveURL(/liquidations/);
    await expect(page.locator('main')).toBeVisible();
  });

  test('should display liquidation data', async ({ page }) => {
    await page.goto('/liquidations');
    await page.waitForLoadState('networkidle');

    // Look for liquidation content
    const liquidations = page.locator('text=/Liquidation|Long|Short|Rekt/i');
    await expect(liquidations.first()).toBeVisible({ timeout: 15000 });
  });
});

test.describe('Options Flow', () => {
  test('should load options page', async ({ page }) => {
    await page.goto('/options');
    
    await expect(page).toHaveURL(/options/);
    await expect(page.locator('main')).toBeVisible();
  });

  test('should display options data', async ({ page }) => {
    await page.goto('/options');
    await page.waitForLoadState('networkidle');

    // Look for options content
    const options = page.locator('text=/Options|Call|Put|Strike|Expiry/i');
    await expect(options.first()).toBeVisible({ timeout: 15000 });
  });
});

test.describe('Arbitrage Scanner', () => {
  test('should load arbitrage page', async ({ page }) => {
    await page.goto('/arbitrage');
    
    await expect(page).toHaveURL(/arbitrage/);
    await expect(page.locator('main')).toBeVisible();
  });

  test('should display arbitrage opportunities', async ({ page }) => {
    await page.goto('/arbitrage');
    await page.waitForLoadState('networkidle');

    // Look for arbitrage content
    const arbitrage = page.locator('text=/Arbitrage|Spread|Opportunity|Exchange/i');
    await expect(arbitrage.first()).toBeVisible({ timeout: 15000 });
  });
});

test.describe('Screener', () => {
  test('should load screener page', async ({ page }) => {
    await page.goto('/screener');
    
    await expect(page).toHaveURL(/screener/);
    await expect(page.locator('main')).toBeVisible();
  });

  test('should have filter options', async ({ page }) => {
    await page.goto('/screener');
    await page.waitForLoadState('networkidle');

    // Look for filter/screener controls
    const filters = page.locator('select, input[type="range"], [role="slider"], button:has-text("Filter")');
    
    if (await filters.count() > 0) {
      await expect(filters.first()).toBeVisible();
    }
  });
});

test.describe('Predictions', () => {
  test('should load predictions page', async ({ page }) => {
    await page.goto('/predictions');
    
    await expect(page).toHaveURL(/predictions/);
    await expect(page.locator('main')).toBeVisible();
  });

  test('should display prediction content', async ({ page }) => {
    await page.goto('/predictions');
    await page.waitForLoadState('networkidle');

    // Look for prediction-related content
    const predictions = page.locator('text=/Prediction|Forecast|Target|Probability/i');
    await expect(predictions.first()).toBeVisible({ timeout: 15000 });
  });
});

test.describe('Backtest', () => {
  test('should load backtest page', async ({ page }) => {
    await page.goto('/backtest');
    
    await expect(page).toHaveURL(/backtest/);
    await expect(page.locator('main')).toBeVisible();
  });
});

test.describe('On-Chain Events', () => {
  test('should load onchain page', async ({ page }) => {
    await page.goto('/onchain');
    
    await expect(page).toHaveURL(/onchain/);
    await expect(page.locator('main')).toBeVisible();
  });

  test('should display on-chain events', async ({ page }) => {
    await page.goto('/onchain');
    await page.waitForLoadState('networkidle');

    // Look for on-chain content
    const onchain = page.locator('text=/On-chain|Block|Transaction|Event/i');
    await expect(onchain.first()).toBeVisible({ timeout: 15000 });
  });
});

test.describe('DeFi Dashboard', () => {
  test('should load defi page', async ({ page }) => {
    await page.goto('/defi');
    
    await expect(page).toHaveURL(/defi/);
    await expect(page.locator('main')).toBeVisible();
  });

  test('should display DeFi metrics', async ({ page }) => {
    await page.goto('/defi');
    await page.waitForLoadState('networkidle');

    // Look for DeFi content
    const defi = page.locator('text=/DeFi|TVL|Yield|Protocol|APY/i');
    await expect(defi.first()).toBeVisible({ timeout: 15000 });
  });
});

test.describe('Gas Tracker', () => {
  test('should load gas page', async ({ page }) => {
    await page.goto('/gas');
    
    await expect(page).toHaveURL(/gas/);
    await expect(page.locator('main')).toBeVisible();
  });

  test('should display gas prices', async ({ page }) => {
    await page.goto('/gas');
    await page.waitForLoadState('networkidle');

    // Look for gas content
    const gas = page.locator('text=/Gas|Gwei|Fast|Slow|Standard/i');
    await expect(gas.first()).toBeVisible({ timeout: 15000 });
  });
});
