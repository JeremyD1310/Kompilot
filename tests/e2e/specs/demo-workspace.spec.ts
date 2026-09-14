import { expect, test } from '@playwright/test';

const demoRoutes = [
  ['/demo/workspace', 'Aujourd’hui'],
  ['/demo/workspace/approvals', 'À valider'],
  ['/demo/workspace/calendar', 'Calendrier'],
  ['/demo/workspace/presence', 'Présence locale'],
  ['/demo/workspace/reviews', 'Avis'],
  ['/demo/workspace/content', 'Studio de contenu'],
  ['/demo/workspace/messages', 'Messages'],
  ['/demo/workspace/campaigns', 'Campagnes'],
  ['/demo/workspace/results', 'Résultats'],
  ['/demo/workspace/organization', 'Clients / établissements'],
  ['/demo/workspace/team', 'Équipe'],
  ['/demo/workspace/settings', 'Paramètres'],
] as const;

test.describe('public interactive demo', () => {
  test('offers four profiles and enters the local workspace', async ({ page }) => {
    await page.goto('/demo');
    await expect(page.getByRole('heading', { name: 'Explorez le cockpit Kompilot' })).toBeVisible();
    for (const label of ['Commerce local', 'Artisan ou PME', 'Agence', 'Multi-établissements']) {
      await expect(page.getByRole('button', { name: new RegExp(label) }).first()).toBeVisible();
    }
    await page.getByRole('button', { name: /Multi-établissements/ }).click();
    await page.getByRole('button', { name: 'Explorer le cockpit' }).first().click({ force: true });
    await expect(page.getByRole('heading', { name: 'Aujourd’hui' })).toBeVisible();
    await expect(page.getByText('Données fictives, actions locales uniquement')).toBeVisible();
    await expect(page.getByText('Mode démo · aucun email, SMS, publication ou paiement réel')).toBeVisible();
  });

  for (const [route, heading] of demoRoutes) {
    test(`renders ${route}`, async ({ page }) => {
      await page.goto(route);
      await expect(page.getByText('Données fictives, actions locales uniquement')).toBeVisible();
      if (route === '/demo/workspace') {
        await expect(page.getByRole('heading', { name: 'Votre priorité aujourd’hui' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'À valider' })).toBeVisible();
      } else {
        await expect(page.getByRole('heading', { name: heading })).toBeVisible();
      }
    });
  }

  test('shows profile-specific priorities and confirms reset locally', async ({ page }) => {
    await page.goto('/demo/workspace');
    await page.getByLabel('Choisir un profil').selectOption('artisan');
    await expect(page.getByRole('heading', { name: 'Publier une réalisation' })).toBeVisible();
    await page.getByLabel('Choisir un profil').selectOption('agency');
    await expect(page.getByRole('heading', { name: 'Valider le contenu d’un client' })).toBeVisible();
    await page.getByLabel('Choisir un profil').selectOption('network');
    await expect(page.getByRole('heading', { name: 'Corriger une incohérence locale' })).toBeVisible();
    await page.getByLabel('Choisir un profil').selectOption('commerce');
    await expect(page.getByRole('heading', { name: 'Répondre à un avis local' })).toBeVisible();

    await page.goto('/demo/workspace/approvals');
    const post = page.getByLabel('Statut de Post local — menu de saison');
    await post.selectOption('Validé');
    await expect(page.getByText('Simulation locale : validé')).toBeVisible();
    await page.getByRole('button', { name: 'Ouvrir Plus' }).click();
    await page.getByRole('button', { name: 'Réinitialiser la démo' }).click();
    await expect(page.getByRole('dialog', { name: 'Recommencer la démonstration ?' })).toBeVisible();
    await page.getByRole('button', { name: 'Réinitialiser' }).last().click();
    await expect(post).toHaveValue('À valider');
  });

  test('does not issue network requests to external services', async ({ page }) => {
    const externalRequests: string[] = [];
    page.on('request', request => {
      const url = request.url();
      if (/^https?:\/\//i.test(url) && !url.includes('localhost') && !url.includes('127.0.0.1')) {
        if (/googletagmanager|googleapis|stripe|twilio|sendgrid|resend|gmail|facebook|instagram|linkedin|tiktok/i.test(url) && !url.includes('fonts.googleapis.com')) externalRequests.push(url);
      }
    });
    await page.goto('/demo/workspace');
    await page.getByRole('button', { name: 'Préparer une réponse' }).click();
    await page.getByRole('button', { name: 'Valider la simulation' }).click();
    expect(externalRequests).toEqual([]);
  });

  test('supports the mobile bottom navigation and Plus sheet', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/demo/workspace');
    await expect(page.getByRole('navigation', { name: 'Navigation mobile de la démo' })).toBeVisible();
    await page.getByRole('link', { name: 'À valider' }).last().click();
    await expect(page).toHaveURL(/\/demo\/workspace\/approvals$/);
    await page.getByRole('button', { name: 'Ouvrir Plus' }).click();
    await expect(page.getByRole('dialog', { name: 'Plus' })).toBeVisible();
    await page.getByRole('link', { name: 'Avis' }).last().click();
    await expect(page).toHaveURL(/\/demo\/workspace\/reviews$/);
  });

  test('supports the mobile touch workflows and reset', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/demo/workspace/content');
    await page.getByRole('button', { name: 'Créer un brouillon' }).click();
    await expect(page.getByRole('dialog', { name: 'Créer un brouillon' })).toBeVisible();
    await page.getByLabel('Sujet du brouillon').fill('Présentation mobile fictive');
    await page.getByRole('button', { name: 'Valider la simulation' }).click();
    await expect(page.getByText('Présentation mobile fictive')).toBeVisible();

    await page.goto('/demo/workspace/reviews');
    await page.getByRole('button', { name: /Lire et préparer une réponse/ }).first().click();
    await expect(page.getByRole('dialog', { name: 'Répondre à un avis' })).toBeVisible();
    await page.getByRole('button', { name: 'Valider la simulation' }).click();

    await page.goto('/demo/workspace/messages');
    await page.getByRole('button', { name: /Ouvrir la conversation/ }).first().click();
    await page.getByRole('button', { name: 'Valider la simulation' }).click();

    await page.goto('/demo/workspace/organization');
    await page.getByLabel('Choisir un établissement').selectOption({ index: 1 });
    await expect(page.getByText('Établissement fictif sélectionné localement.')).toBeVisible();
    await page.getByRole('button', { name: /Gérer la fiche/ }).first().click();
    await expect(page.getByText('Client fictif sélectionné localement.')).toBeVisible();

    await page.goto('/demo/workspace/settings');
    await page.getByRole('button', { name: 'Réinitialiser' }).click();
    await expect(page.getByText('Démonstration réinitialisée localement.')).toBeVisible();
  });

  test('completes local content, review, message, campaign, and organization actions', async ({ page }) => {
    await page.goto('/demo/workspace/content');
    await page.getByRole('button', { name: 'Créer un brouillon' }).click();
    await page.getByLabel('Sujet du brouillon').fill('Offre automne fictive');
    await page.getByRole('button', { name: 'Valider la simulation' }).click();
    await expect(page.getByText('Offre automne fictive')).toBeVisible();

    await page.goto('/demo/workspace/reviews');
    await page.getByRole('button', { name: /Lire et préparer une réponse/ }).click();
    await page.getByRole('button', { name: 'Valider la simulation' }).click();
    await expect(page.getByText('Répondu')).toBeVisible();

    await page.goto('/demo/workspace/messages');
    await page.getByRole('button', { name: /Ouvrir la conversation/ }).click();
    await page.getByRole('button', { name: 'Valider la simulation' }).click();
    await expect(page.getByText(/Réponse enregistrée/)).toBeVisible();

    await page.goto('/demo/workspace/campaigns');
    await page.getByRole('button', { name: 'Préparer une campagne' }).click();
    await page.getByRole('button', { name: 'Valider la simulation' }).click();
    await expect(page.getByText(/publication planifiée localement/)).toBeVisible();

    await page.goto('/demo/workspace/organization');
    const establishment = page.getByLabel('Choisir un établissement');
    await establishment.selectOption({ index: 1 });
    await expect(page.getByText('Établissement fictif sélectionné localement.')).toBeVisible();
    await page.getByRole('button', { name: /Gérer la fiche/ }).first().click();
    await expect(page.getByText('Client fictif sélectionné localement.')).toBeVisible();
  });

  test('has no horizontal overflow in compact portrait and landscape sizes', async ({ page }) => {
    for (const viewport of [{ width: 320, height: 568 }, { width: 375, height: 812 }, { width: 390, height: 844 }, { width: 412, height: 915 }, { width: 768, height: 1024 }, { width: 915, height: 412 }]) {
      await page.setViewportSize(viewport);
      await page.goto('/demo/workspace');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
    }
  });
});
