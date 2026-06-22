/**
 * Playwright Root Config — Kompilot
 *
 * Usage:
 *   bun run test:e2e              → run all E2E tests
 *   bun run test:e2e:ui           → interactive UI mode
 *   bun run test:e2e:debug        → debug mode
 *   bun run test:e2e:report       → view last HTML report
 *
 *   Direct:
 *   bunx playwright test --config=tests/e2e/playwright.config.ts
 */

import { defineConfig, devices } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

export default defineConfig({
  // Point to the specs folder
  testDir: './tests/e2e/specs',

  // Global timeouts (generous for CI and slower sandboxes)
  timeout: 45_000,
  expect: { timeout: 10_000 },

  // Run tests sequentially — they share auth state
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  workers: 1,

  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    headless: true,
    locale: 'fr-FR',
    timezoneId: 'Europe/Paris',
  },

  projects: [
    {
      name: 'Chromium (Desktop)',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Re-use the already-running Vite dev server (port 3000)
  webServer: {
    command: 'bun run dev --port 3000',
    url: BASE_URL,
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
