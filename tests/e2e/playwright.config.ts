/**
 * Playwright E2E Configuration — Kompilot
 *
 * Install : bun add -D @playwright/test && bunx playwright install chromium
 * Run     : bunx playwright test
 * UI mode : bunx playwright test --ui
 */

import { defineConfig, devices } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

export default defineConfig({
  testDir: './specs',
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,           // Sequential — shares auth state
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [
    ['list'],
    ['html', { outputFolder: '../playwright-report', open: 'never' }],
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
    // Mobile Safari disabled: WebKit binary not available in this environment.
    // Run `npx playwright install webkit` on a local machine to enable it.
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 14'] },
    // },
  ],
  webServer: {
    command: 'bun run dev --port 3000',
    url: BASE_URL,
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
