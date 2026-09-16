import { expect, test } from '@playwright/test';

const VIEWPORTS = [320, 375, 390, 768, 1440] as const;
const PUBLIC_ROUTES = [
  '/',
  '/signup',
  '/pricing',
  '/temoignages',
  '/demo',
  '/demo/workspace',
  '/secteurs/agences',
  '/local',
  '/features',
  '/faq',
] as const;

test.describe('public route network and responsive guards', () => {
  for (const width of VIEWPORTS) {
    test(`keeps public routes stable at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      const protectedRequests: string[] = [];
      const consoleErrors: string[] = [];
      page.on('request', request => {
        if (/\/api\/(credits|billing)(?:\/|$)/.test(request.url())) protectedRequests.push(request.url());
      });
      page.on('console', message => {
        if (message.type() === 'error') consoleErrors.push(message.text());
      });

      for (const route of PUBLIC_ROUTES) {
        const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
        expect(response?.status(), `${route} at ${width}px`).toBe(200);
        await expect(page.locator('#root')).toBeVisible();
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
        expect(await page.locator('section#temoignages').count()).toBe(route === '/' ? 1 : 0);
      }

      expect(protectedRequests, `protected requests at ${width}px`).toEqual([]);
      expect(consoleErrors.filter(error => !error.includes('favicon'))).toEqual([]);
    });
  }
});

test('public landing CTAs navigate without invoking protected APIs', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const protectedRequests: string[] = [];
  page.on('request', request => {
    if (/\/api\/(credits|billing)(?:\/|$)/.test(request.url())) protectedRequests.push(request.url());
  });

  await page.getByRole('link', { name: 'Essayer gratuitement', exact: true }).first().click();
  await expect(page).toHaveURL(/\/signup(?:\?.*)?$/);
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.getByRole('link', { name: 'Voir en action', exact: true }).click();
  await expect(page).toHaveURL(/\/demo(?:\?.*)?$/);

  expect(protectedRequests).toEqual([]);
});
