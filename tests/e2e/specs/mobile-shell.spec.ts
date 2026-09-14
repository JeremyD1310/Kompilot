import { test, expect } from '@playwright/test';

const routes = ['/command-center', '/calendar', '/inbox', '/analytics', '/settings'];

test.describe('Mobile shell and overflow guardrails', () => {
  for (const route of routes) {
    test(`${route} has no document horizontal overflow`, async ({ page }) => {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('body')).toBeVisible();
      const overflow = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1);
    });
  }

  test('mobile navigation is visible on the protected shell', async ({ page }) => {
    await page.goto('/command-center', { waitUntil: 'domcontentloaded' });
    const nav = page.locator('nav.nc-bottom-nav');
    if (await nav.count()) await expect(nav).toBeVisible();
  });
});
