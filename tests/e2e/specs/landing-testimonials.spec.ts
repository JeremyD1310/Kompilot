import { expect, test, type Page } from '@playwright/test';

const VIEWPORTS = [
  { width: 320, height: 700 },
  { width: 375, height: 812 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1440, height: 1000 },
] as const;

async function installAnalyticsConsent(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('kompilot_cookie_consent', 'accepted');
    (window as Window & { dataLayer?: unknown[] }).dataLayer = [];
  });
}

async function trackingSnapshot(page: Page) {
  return page.evaluate(() => {
    const entries = ((window as Window & { dataLayer?: unknown[] }).dataLayer ?? [])
      .filter(entry => Array.isArray(entry) && entry[0] === 'event') as unknown[][];
    return {
      viewEvents: entries.filter(entry => entry[1] === 'testimonial_section_view').length,
      ctaEvents: entries.filter(entry => entry[1] === 'testimonial_cta_click').length,
    };
  });
}

test.describe('landing beta testimonials canonical section', () => {
  test('renders one section, four approved cards, and no hidden duplicate at every required width', async ({ page }) => {
    await installAnalyticsConsent(page);
    const protectedRequests: string[] = [];
    page.on('request', request => {
      const url = request.url();
      if (url.includes('/api/credits') || url.includes('/api/billing')) protectedRequests.push(url);
    });

    for (const viewport of VIEWPORTS) {
      await page.setViewportSize(viewport);
      await page.goto('/', { waitUntil: 'domcontentloaded' });

      const section = page.locator('section#temoignages');
      await expect(section).toHaveCount(1);
      await expect(page.getByRole('heading', { name: 'Retours de bêta-testeurs', exact: true })).toHaveCount(1);
      await expect(page.locator('[data-testimonial-id]')).toHaveCount(4);

      const cards = section.locator('[data-testimonial-id]');
      await expect(cards.nth(0)).toHaveAttribute('data-testimonial-id', 'julien');
      await expect(cards.nth(1)).toHaveAttribute('data-testimonial-id', 'camille');
      await expect(cards.nth(2)).toHaveAttribute('data-testimonial-id', 'marc');
      await expect(cards.nth(3)).toHaveAttribute('data-testimonial-id', 'elodie');
      await expect(section.getByText('Bêta-testeur Kompilot', { exact: true })).toHaveCount(4);
      await expect(section.locator('script[type="application/ld+json"]')).toHaveCount(0);

      for (const [id, name] of [['julien', 'Julien R.'], ['camille', 'Camille M.'], ['marc', 'Marc D.'], ['elodie', 'Élodie T.']] as const) {
        await expect(section.locator(`[data-testimonial-id="${id}"]`)).toHaveCount(1);
        await expect(section.getByText(name, { exact: true })).toHaveCount(1);
      }

      await expect(section.getByRole('link', { name: /Essayer Kompilot gratuitement/i })).toHaveAttribute('href', '/signup');
      await expect(section.getByRole('link', { name: /Explorer la démonstration/i })).toHaveAttribute('href', '/demo');

      await section.getByRole('link', { name: /Essayer Kompilot gratuitement/i }).click();
      await expect(page).toHaveURL(/\/signup(?:\?.*)?$/);
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await page.locator('section#temoignages').getByRole('link', { name: /Explorer la démonstration/i }).click();
      await expect(page).toHaveURL(/\/demo(?:\?.*)?$/);
    }

    expect(protectedRequests).toEqual([]);
  });

  test('fires testimonial_section_view once after analytics consent', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('kompilot_cookie_consent');
      localStorage.removeItem('kompilot_cookie_prefs');
      (window as Window & { dataLayer?: unknown[] }).dataLayer = [];
    });

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect.poll(async () => (await trackingSnapshot(page)).viewEvents).toBe(0);

    await page.evaluate(() => {
      localStorage.setItem('kompilot_cookie_consent', 'accepted');
      window.dispatchEvent(new Event('kompilot:cookie-consent-changed'));
    });

    await expect.poll(async () => (await trackingSnapshot(page)).viewEvents).toBe(1);
    await page.getByRole('link', { name: /Essayer Kompilot gratuitement/i }).click();
    await expect.poll(async () => (await trackingSnapshot(page)).ctaEvents).toBe(1);
  });
});
