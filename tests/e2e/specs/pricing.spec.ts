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

  test('defaults to annual billing with the correct prices and legal notice', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Annuel/i })).toBeVisible();
    await expect(page.getByText(/1 mois offert/i).first()).toBeVisible();

    // Annual total and effective monthly equivalent.
    await expect(page.getByText(/Facturé\s+759€\s*\/\s*an/i)).toBeVisible();
    await expect(page.getByText(/Facturé\s+1639€\s*\/\s*an/i)).toBeVisible();
    await expect(page.getByText(/63(?:[,.]25)?€/i).first()).toBeVisible();
    await expect(page.getByText(/136(?:[,.]58)?€/i).first()).toBeVisible();

    await expect(
      page.getByText(/Engagement d'un an ferme à compter de la date de souscription/i),
    ).toBeVisible();
  });

  test('switches instantly to monthly billing', async ({ page }) => {
    await page.getByRole('button', { name: /^Mensuel$/i }).click();

    await expect(page.getByText(/69€\s*HT\s*\/\s*mois/i).first()).toBeVisible();
    await expect(page.getByText(/149€\s*HT\s*\/\s*mois/i).first()).toBeVisible();
    await expect(page.getByText(/Facturé\s+759€\s*\/\s*an/i)).toBeHidden();
    await expect(page.getByText(/Facturé\s+1639€\s*\/\s*an/i)).toBeHidden();
  });

  test('opens the legal consent step before checkout', async ({ page }) => {
    const planButton = page.getByRole('button', { name: /Démarrer avec Starter|Choisir l'offre Agency/i }).first();
    await planButton.click();

    await expect(page.getByText(/CGV/i).first()).toBeVisible();
    await expect(page.getByText(/rétractation/i).first()).toBeVisible();

    const checkoutButton = page.getByRole('button', { name: /Démarrer|Payer|Stripe|Continuer/i }).last();
    await expect(checkoutButton).toBeDisabled();
  });
});
