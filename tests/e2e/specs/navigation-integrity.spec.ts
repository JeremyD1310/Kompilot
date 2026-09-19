import { expect, test, type Page } from '@playwright/test';

const publicRoutes = [
  '/', '/features', '/local', '/secteurs/restaurants', '/secteurs/boutiques',
  '/secteurs/beaute', '/secteurs/sport', '/secteurs/artisans', '/secteurs/sante',
  '/secteurs/immobilier', '/secteurs/agences', '/signup', '/demo', '/temoignages',
  '/faq', '/pricing', '/cgv', '/confidentialite', '/mentions-legales', '/login',
  '/ressources', '/a-propos', '/politique-editoriale',
] as const;

const commercialRoutes = [
  '/dashboard', '/cockpit', '/calendrier', '/mon-equipe', '/inbox', '/performance',
  '/engagement', '/roas', '/aio', '/google-maps', '/reviews', '/creative-factory',
  '/ai-creative-studio', '/creative-studio-hub', '/tunnels', '/growth',
  '/email-marketing', '/email-sequences', '/website-scan', '/geo-authority', '/espion',
  '/agence/dashboard', '/agence/cowork', '/agence/lead-search', '/lead-gen',
  '/settings', '/account', '/subscription', '/guide',
] as const;

async function expectRendered(page: Page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForFunction(() => document.body.innerText.trim().length > 20, { timeout: 15_000 });
  const body = await page.locator('body').innerText();
  expect(body.trim().length).toBeGreaterThan(20);
  expect(body).not.toMatch(/Something went wrong|Erreur inattendue|Page introuvable/i);
}

async function loginAsDemo(page: Page) {
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('input[type="email"]', { timeout: 15_000 });
  await page.click('button:has-text("Accès Démo Immédiat"), button:has-text("1-Clic"), button:has-text("Démo Immédiat")');
  await page.waitForURL(/\/(dashboard|onboarding|setup)/, { timeout: 30_000 });
  if (!page.url().includes('/dashboard')) await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
}

test.describe('landing and public navigation integrity', () => {
  for (const route of publicRoutes) {
    test(`renders ${route}`, async ({ page }) => {
      await page.goto(route);
      await expectRendered(page);
    });
  }

  test('all landing section links point to an existing section', async ({ page }) => {
    await page.goto('/');
    for (const id of ['fonctionnalites', 'fonctionnement', 'secteurs', 'geo', 'tarifs', 'faq']) {
      await expect(page.locator(`#${id}`)).toHaveCount(1);
    }
  });

  test('primary and demo CTAs reach their promised destinations', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('home-signup-cta').click();
    await expect(page).toHaveURL(/\/signup$/);
    await page.goto('/');
    await page.getByRole('link', { name: 'Voir la démonstration' }).click();
    await expect(page).toHaveURL(/\/demo$/);
    await page.getByTestId('demo-enter-workspace').click();
    await expect(page).toHaveURL(/\/demo\/workspace$/);
  });

  test('pricing preserves plan and annual interval through signup', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Annuel' }).click();
    await page.getByRole('button', { name: /Choisir Pro/ }).click();
    await expect(page).toHaveURL(/\/signup$/);
    await expect.poll(() => page.evaluate(() => ({
      plan: localStorage.getItem('kompilot_pending_plan'),
      billing: localStorage.getItem('kompilot_pending_billing'),
    }))).toEqual({ plan: 'pro', billing: 'yearly' });
  });
});

test.describe('commercial navigation integrity', () => {
  test('all sidebar destinations render without a global crash', async ({ page }) => {
    test.setTimeout(180_000);
    await loginAsDemo(page);
    for (const route of commercialRoutes) {
      await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 25_000 });
      expect(page.url()).not.toMatch(/\/login(?:$|\?)/);
      await expectRendered(page);
    }
  });

  test('website visibility audit shows evidence and remains usable on mobile', async ({ page }) => {
    await loginAsDemo(page);
    await page.route('**/api/geo/website-audit', async route => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        auditId: 'audit-e2e', requestedUrl: 'https://example.com/', canonicalOrigin: 'https://example.com', observedAt: new Date().toISOString(), persisted: true,
        pages: [{ url: 'https://example.com/', status: 200, title: 'Entreprise exemple', wordCount: 180, schemaTypes: ['LocalBusiness'] }],
        scores: { overall: 78, technical: 88, content: 64, local: 75, trust: 80, geo: 83 },
        findings: [{ id: 'finding-1', category: 'content', priority: 'P1', pageUrl: 'https://example.com/', title: 'Contenu éditorial limité', evidence: '180 mots observés.', impact: 'Contexte insuffisant.', recommendation: 'Décrire les services avec des preuves vérifiables.', effort: 'moyen', status: 'todo' }],
        limitations: [], methodology: { maxPages: 8, maxDepth: 1, maxResponseBytes: 750000, robotsPolicy: 'robots.txt respecté.', scoringPolicy: 'Scores déterministes fondés sur les constats observés.' },
      }),
    }));
    await page.goto('/website-scan');
    await page.getByLabel('Site professionnel à analyser').fill('https://example.com');
    await page.getByText('Je confirme être autorisé').click();
    await page.getByRole('button', { name: 'Lancer l’audit' }).click();
    await expect(page.getByText('Plan d’amélioration priorisé')).toBeVisible();
    await expect(page.getByText('180 mots observés.')).toBeVisible();
    await page.setViewportSize({ width: 390, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
  });
});
