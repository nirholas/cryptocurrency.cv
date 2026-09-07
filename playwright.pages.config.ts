/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/cryptocurrency.cv
 *
 * Config for the whole-site page-health sweep.
 *
 * Separate from `playwright.errors.config.ts` for one reason: worker count.
 * Every page in this app fans out to a dozen or more API calls, so four
 * browsers sweeping in parallel put ~50 concurrent requests on a single Node
 * process with cold upstream caches. Pages that render in well under a second
 * on their own then sit on their skeletons past the settle window, and the
 * sweep reports healthy pages as stuck. Two workers keeps the run honest and
 * still finishes in about three minutes.
 *
 * Expects a server to already be running; it starts none.
 *
 *   npm run build && npm start
 *   npm run audit:pages
 */
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: 0,
  workers: 2,
  reporter: [['line'], ['html', { open: 'never' }]],
  timeout: 90_000,
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'off',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
