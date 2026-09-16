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

async function countTestimonialViewEvents(page: Page) {
  return page.evaluate(() =>
    ((window as Window & { dataLayer?: unknown[] }).dataLayer ?? [])
      .filter(entry => Array.isArray(entry) && entry[0] === 'event' && entry[1] === 'testimonial_section_view')
      .length,
  );
}

test.describe('landing beta testimonials canonical section', () => {
  test('renders one section, four approved cards, and no hidden duplicate at every required width', async ({ page }) => {
    await installAnalyticsConsent(page);

    for (const viewport of VIEWPORTS) {
      await page.setViewportSize(viewport);
      await page.goto('/', { waitUntil: 'domcontentloaded' });

      const section = page.locator('section#temoignages');
      await expect(section).toHaveCount(1);
      await expect(section.getByRole('heading', { name: 'Retours de bêta-testeurs', exact: true })).toHaveCount(1);
      await expect(section.locator('[data-testimonial-id]')).toHaveCount(4);

      for (const id of ['julien', 'camille', 'marc', 'elodie']) {
        await expect(section.locator(`[data-testimonial-id="${id}"]`)).toHaveCount(1);
      }

      await page.screenshot({ path: `test-results/landing-testimonials-${viewport.width}.png`, fullPage: false });
    }
  });

  test('fires testimonial_section_view once after analytics consent', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('kompilot_cookie_consent');
      localStorage.removeItem('kompilot_cookie_prefs');
      (window as Window & { dataLayer?: unknown[] }).dataLayer = [];
    });

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect.poll(() => countTestimonialViewEvents(page)).toBe(0);

    await page.evaluate(() => {
      localStorage.setItem('kompilot_cookie_consent', 'accepted');
      window.dispatchEvent(new Event('kompilot:cookie-consent-changed'));
    });

    await expect.poll(() => countTestimonialViewEvents(page)).toBe(1);
  });
});
