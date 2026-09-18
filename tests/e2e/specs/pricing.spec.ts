import { test, expect } from '@playwright/test';

/**
 * Public pricing smoke tests.
 *
 * These tests intentionally stop before payment submission: Stripe price IDs and
 * live credentials are configured outside the repository. They validate the
 * customer-facing contract that must remain stable before Checkout is opened.
 */
test.describe('Pricing page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pricing', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveTitle(/Tarifs/i);
  });

  test('defaults to monthly billing with the canonical catalogue prices', async ({ page }) => {
    await expect(page.getByRole('button', { name: /^Mensuel$/i })).toBeVisible();
    await expect(page.getByText(/^69€$/).first()).toBeVisible();
    await expect(page.getByText(/^129€$/).first()).toBeVisible();
    await expect(page.getByText(/^229€$/).first()).toBeVisible();
    await expect(page.getByText(/Facturation mensuelle/i).first()).toBeVisible();
  });

  test('switches instantly to annual billing', async ({ page }) => {
    await page.getByRole('button', { name: /Annuel/i }).click();
    await expect(page.getByText(/^690€$/).first()).toBeVisible();
    await expect(page.getByText(/^1290€$/).first()).toBeVisible();
    await expect(page.getByText(/^2290€$/).first()).toBeVisible();
    await expect(page.getByText(/Facturation annuelle · 2 mois offerts/i).first()).toBeVisible();
  });

  test('opens the legal consent step before checkout', async ({ page }) => {
    const planButton = page.getByRole('button', { name: /^Choisir Pro$/i });
    await planButton.click();

    await expect(page.getByText(/CGV/i).first()).toBeVisible();
    await expect(page.getByText(/rétractation/i).first()).toBeVisible();

    const checkoutButton = page.getByRole('button', { name: /Démarrer|Payer|Stripe|Continuer/i }).last();
    await expect(checkoutButton).toBeDisabled();
  });
});
