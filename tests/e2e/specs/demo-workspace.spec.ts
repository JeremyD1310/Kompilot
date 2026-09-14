import { expect, test } from '@playwright/test';

const demoRoutes = [
  ['/demo/workspace', 'Bonjour, voici votre cockpit'],
  ['/demo/workspace/approvals', 'À valider'],
  ['/demo/workspace/calendar', 'Calendrier'],
  ['/demo/workspace/presence', 'Présence locale'],
  ['/demo/workspace/reviews', 'Avis'],
  ['/demo/workspace/content', 'Studio de contenu'],
  ['/demo/workspace/messages', 'Messages'],
  ['/demo/workspace/campaigns', 'Campagnes'],
  ['/demo/workspace/results', 'Résultats'],
  ['/demo/workspace/organization', 'Organisation'],
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
    await page.getByRole('button', { name: 'Explorer le cockpit' }).click();
    await expect(page.getByRole('heading', { name: 'Bonjour, voici votre cockpit' })).toBeVisible();
    await expect(page.getByText('Données simulées').first()).toBeVisible();
    await expect(page.getByText('Aucun email, SMS, publication ou paiement réel')).toBeVisible();
  });

  for (const [route, heading] of demoRoutes) {
    test(`renders ${route}`, async ({ page }) => {
      await page.goto(route);
      await expect(page.getByText('Données simulées').first()).toBeVisible();
      if (route === '/demo/workspace') {
        await expect(page.getByRole('heading', { name: 'À faire aujourd’hui' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'À valider' })).toBeVisible();
      } else {
        await expect(page.getByRole('heading', { name: heading })).toBeVisible();
      }
    });
  }

  test('simulates approval and resets the local state', async ({ page }) => {
    await page.goto('/demo/workspace/approvals');
    const post = page.getByLabel('Statut de Post local — menu de saison');
    await post.selectOption('Validé');
    await expect(page.getByText('Simulation locale : validé')).toBeVisible();
    await page.getByRole('button', { name: /Réinitialiser/ }).first().click();
    await expect(post).toHaveValue('À valider');
  });

  test('does not issue network requests to external services', async ({ page }) => {
    const externalRequests: string[] = [];
    page.on('request', request => {
      const url = request.url();
      if (/googletagmanager|googleapis|stripe|twilio|sendgrid|resend|gmail|facebook|instagram|linkedin|tiktok/i.test(url)) {
        externalRequests.push(url);
      }
    });
    await page.goto('/demo/workspace');
    await page.getByRole('button', { name: 'Répondre aux avis' }).click();
    await page.getByRole('button', { name: 'Valider la simulation' }).click();
    expect(externalRequests).toEqual([]);
  });
});
